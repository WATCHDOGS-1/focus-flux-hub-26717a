import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useUserTitles } from "@/hooks/use-user-titles";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"] & {
  profiles: Pick<Profile, 'username'> | null;
};

interface GlobalChatPanelProps {
  userId: string;
}

const GlobalChatPanel = ({ userId }: GlobalChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userIdsInChat = messages.map(msg => msg.user_id);
  const userTitles = useUserTitles(userIdsInChat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        *,
        profiles (username)
      `)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error loading messages:", error);
    } else if (data) {
      setMessages(data as ChatMessage[]);
      scrollToBottom();
    }
  };

  // Function to fetch profile and append message for real-time inserts
  const fetchAndAppendMessage = async (newMsgRow: Database["public"]["Tables"]["chat_messages"]["Row"]) => {
    let username = "Unknown";
    
    if (newMsgRow.user_id === userId) {
      username = "You";
    } else {
      // Fetch profile for remote user
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", newMsgRow.user_id)
        .single();
      
      username = profileData?.username || "Unknown";
    }

    const finalMessage: ChatMessage = {
      ...newMsgRow,
      profiles: { username },
    };

    setMessages(prev => {
      // 1. Remove optimistic message if it exists (only for current user)
      if (newMsgRow.user_id === userId) {
        const optimisticId = `temp-${userId}`;
        const filteredPrev = prev.filter(msg => msg.id !== optimisticId);
        return [...filteredPrev, finalMessage];
      }
      
      // 2. Append remote message
      return [...prev, finalMessage];
    });
    
    // Scroll after state update
    setTimeout(scrollToBottom, 50);
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("global_chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMsgRow = payload.new as Database["public"]["Tables"]["chat_messages"]["Row"];
          fetchAndAppendMessage(newMsgRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    // Optimistically add message to UI
    const optimisticMessage: ChatMessage = {
      id: `temp-${userId}`, // Use a consistent temporary ID for the current user
      user_id: userId,
      message: messageContent,
      created_at: new Date().toISOString(),
      profiles: { username: "You" },
    };
    // Filter out any previous optimistic message before adding the new one
    setMessages((prev) => [...prev.filter(msg => msg.id !== optimisticMessage.id), optimisticMessage]);
    scrollToBottom();


    const { error } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, message: messageContent });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
      // Remove the optimistic message if sending failed
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
    // Real-time listener handles replacing the optimistic message with the final one.
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Global Chat
      </h3>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
        {messages.map((msg) => {
          const isCurrentUser = msg.user_id === userId;
          const title = userTitles[msg.user_id];
          
          return (
            <div
              key={msg.id}
              className={`p-3 rounded-lg ${
                isCurrentUser
                  ? "bg-primary/20 ml-4"
                  : "bg-secondary/20 mr-4"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                <span className="font-semibold text-foreground">{msg.profiles?.username || "Unknown"}</span>
                {title && (
                  <span className="text-accent font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {title}
                  </span>
                )}
              </div>
              <div className="text-sm">{msg.message}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button size="icon" onClick={sendMessage} className="dopamine-click">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default GlobalChatPanel;