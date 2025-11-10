import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DMMessage = Database["public"]["Tables"]["dm_messages"]["Row"] & {
  profiles: {
    username: string;
  } | null;
};

interface DMConversationProps {
  conversationId: string;
  targetUsername: string;
  targetUserId: string;
  currentUserId: string;
  onBack: () => void;
}

const DMConversation = ({ conversationId, targetUsername, targetUserId, currentUserId, onBack }: DMConversationProps) => {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Only reload if the change is not from the current user (optimistic update handles local)
          if (payload.new.sender_id !== currentUserId) {
            loadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("dm_messages")
      .select(`
        *,
        profiles (username)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error loading DM messages:", error);
    } else if (data) {
      setMessages(data as DMMessage[]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    // Optimistically add message to UI
    const optimisticMessage: DMMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
      created_at: new Date().toISOString(),
      profiles: { username: "You" }, // Display "You" for optimistic message
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);


    const { error } = await supabase
      .from("dm_messages")
      .insert({ 
        conversation_id: conversationId, 
        sender_id: currentUserId, 
        content: messageContent 
      });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending DM message:", error);
      // Optionally, remove the optimistic message if sending failed
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
    // The real-time listener will eventually update the message with the correct ID and timestamp
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-xl font-semibold truncate">Chatting with {targetUsername}</h3>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.sender_id === currentUserId
                ? "bg-primary/20 ml-auto"
                : "bg-secondary/20 mr-auto"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">
              {msg.sender_id === currentUserId ? "You" : msg.profiles?.username || targetUsername}
            </div>
            <div className="text-sm">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`Message ${targetUsername}...`}
          className="flex-1"
        />
        <Button size="icon" onClick={sendMessage} className="dopamine-click">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DMConversation;