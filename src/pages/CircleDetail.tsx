import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Send, Crown, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Circle = Database["public"]["Tables"]["circles"]["Row"];
type CircleMember = Database["public"]["Tables"]["circle_members"]["Row"] & { profiles: { username: string } | null };
type CircleMessage = Database["public"]["Tables"]["circle_messages"]["Row"] & { profiles: { username: string } | null };

const CircleDetail = () => {
  const { circleId } = useParams<{ circleId: string }>();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (circleId && userId) {
      loadCircleData();
    }
  }, [circleId, userId]);

  useEffect(() => {
    if (!circleId || !isMember) return;
    
    const channel = supabase
      .channel(`circle-chat:${circleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "circle_messages", filter: `circle_id=eq.${circleId}` },
        (payload) => {
          // Fetch profile with message to avoid extra lookup
          const newMessageId = (payload.new as any).id;
          fetchSingleMessage(newMessageId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId, isMember]);

  const loadCircleData = async () => {
    if (!circleId || !userId) return;
    setIsLoading(true);

    const { data: circleData, error: circleError } = await supabase.from("circles").select("*").eq("id", circleId).single();
    if (circleError || !circleData) {
      console.error("Error loading circle details:", circleError);
      toast.error(`Failed to load circle details: ${circleError?.message || 'Unknown error'}`);
      navigate("/social");
      return;
    }
    setCircle(circleData);

    // 1. Dedicated Membership Check
    const { data: membershipData } = await supabase
      .from("circle_members")
      .select("id")
      .eq("circle_id", circleId)
      .eq("user_id", userId)
      .maybeSingle();
      
    const memberCheck = !!membershipData;
    setIsMember(memberCheck);

    // 2. Fetch Members List (Only if member, or if RLS allows reading)
    let membersList: CircleMember[] = [];
    const { data: membersData, error: membersError } = await supabase.from("circle_members").select("*, profiles(username)").eq("circle_id", circleId);
    
    if (membersError) {
        console.error("Error fetching circle members:", membersError);
    }
    membersList = membersData as CircleMember[] || [];
    setMembers(membersList);


    // 3. Fetch Messages (Only if member)
    if (memberCheck) {
      const { data: messagesData } = await supabase.from("circle_messages").select("*, profiles(username)").eq("circle_id", circleId).order("created_at", { ascending: true });
      setMessages(messagesData as CircleMessage[] || []);
      setTimeout(scrollToBottom, 100);
    } else {
      setMessages([]);
    }

    setIsLoading(false);
  };

  const fetchSingleMessage = async (messageId: string) => {
    const { data } = await supabase.from("circle_messages").select("*, profiles(username)").eq("id", messageId).single();
    if (data) {
      setMessages(prev => [...prev, data as CircleMessage]);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJoin = async () => {
    if (!userId || !circleId) return;
    const { error } = await supabase.from("circle_members").insert({ circle_id: circleId, user_id: userId });
    if (error) {
      if (error.code === '23505') { // PostgreSQL unique constraint violation (already a member)
        toast.info("You are already a member of this circle.");
        setIsMember(true); // Force UI update if already a member
        loadCircleData(); // Reload data to ensure UI state is correct
        return;
      }
      const errorMsg = `Failed to join circle: ${error.message}`;
      console.error(errorMsg, error);
      toast.error(errorMsg); // Display detailed error
    } else {
      toast.success("Joined circle!");
      setIsMember(true); // OPTIMISTIC UPDATE: Assume success and switch UI immediately
      loadCircleData();
    }
  };

  const handleLeave = async () => {
    if (!userId || !circleId) return;
    const { error } = await supabase.from("circle_members").delete().match({ circle_id: circleId, user_id: userId });
    if (error) {
      const errorMsg = `Failed to leave circle: ${error.message}`;
      console.error(errorMsg, error);
      toast.error(errorMsg); // Display detailed error
    } else {
      toast.info("You have left the circle.");
      setIsMember(false);
      loadCircleData();
    }
  };

  const handleDeleteCircle = async () => {
    if (!circleId || circle?.owner_id !== userId) return;
    // Deleting the circle cascades to members and messages
    const { error } = await supabase.from("circles").delete().eq("id", circleId);
    if (error) {
      const errorMsg = `Failed to delete circle: ${error.message}`;
      console.error(errorMsg, error);
      toast.error(errorMsg); // Display detailed error
    } else {
      toast.success("Circle deleted.");
      navigate("/social");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !circleId) return;
    const content = newMessage.trim();
    setNewMessage("");
    
    // Optimistic update
    const optimisticMessage: CircleMessage = {
        id: `temp-${Date.now()}`,
        circle_id: circleId,
        user_id: userId,
        content: content,
        created_at: new Date().toISOString(),
        profiles: { username: "You" },
    };
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    const { error } = await supabase.from("circle_messages").insert({ circle_id: circleId, user_id: userId, content });
    if (error) {
      const errorMsg = `Failed to send message: ${error.message}`;
      console.error(errorMsg, error);
      toast.error(errorMsg); // Display detailed error
      setNewMessage(content);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id)); // Revert optimistic update
    }
    // Realtime listener handles replacing the optimistic message
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Circle...</div>;
  }

  if (!circle) {
    return <div className="min-h-screen flex items-center justify-center">Circle not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/social")} title="Back to Social Dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{circle.name}</h1>
              <p className="text-sm text-muted-foreground">{circle.description}</p>
            </div>
          </div>
          {isMember && circle.owner_id === userId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" /> Delete Circle</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete the circle and all its messages. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteCircle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chat Panel */}
        <div className="md:col-span-2">
          <Card className="glass-card h-[75vh] flex flex-col">
            <CardHeader>
              <CardTitle>Circle Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {isMember ? (
                <>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 ${msg.user_id === userId ? "justify-end" : ""}`}>
                          <div className={`p-3 rounded-lg max-w-[80%] ${msg.user_id === userId ? "bg-primary/20" : "bg-secondary/20"}`}>
                            <div className="text-xs font-bold mb-1">{msg.user_id === userId ? "You" : msg.profiles?.username || "User"}</div>
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Input 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && sendMessage()} 
                        placeholder="Type a message..." 
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <p>You must be a member to view and send messages.</p>
                  <Button onClick={handleJoin} className="mt-4 dopamine-click">Join Circle</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members Panel */}
        <div>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center justify-between p-2 rounded hover:bg-secondary/50">
                    <span className="font-medium">{member.profiles?.username || "User"}</span>
                    {member.role === 'owner' && <Crown className="w-4 h-4 text-yellow-500" title="Circle Owner" />}
                  </div>
                ))}
              </div>
              {isMember && circle.owner_id !== userId && (
                <Button variant="outline" onClick={handleLeave} className="w-full mt-4 dopamine-click"><LogOut className="w-4 h-4 mr-2" /> Leave Circle</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CircleDetail;