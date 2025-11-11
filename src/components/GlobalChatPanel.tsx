import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useUserTitles } from "@/hooks/use-user-titles"; // Import new hook

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"] & {
  profiles: {
    username: string;
  } | null;
};

interface GlobalChatPanelProps {
  userId: string;
}

const GlobalChatPanel = ({ userId }: GlobalChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userIdsInChat = messages.map(msg => msg.user_id);
  const userTitles = useUserTitles(userIdsInChat); // Fetch titles for users in chat

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Only listen for inserts
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          // Always reload on insert to ensure consistency, fetch profile data, and update the optimistic message
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
      // Scroll to bottom after messages are loaded
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    // Optimistically add message to UI
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      user_id: userId,
      message: messageContent,
      created_at: new Date().toISOString(),
      profiles: { username: "You" }, // Display "You" for optimistic message
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);


    const { error } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, message: messageContent });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
      // Optionally, remove the optimistic message if sending failed
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
    // The real-time listener will now trigger loadMessages() to replace the optimistic message
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