import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"] & {
  profiles: {
    username: string;
  } | null;
};

interface ChatPanelProps {
  userId: string;
}

const ChatPanel = ({ userId }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          // Only reload if the change is not from the current user (optimistic update handles local)
          // Or if it's an update/delete, always reload to ensure consistency
          if (payload.eventType === 'INSERT' && payload.new.user_id === userId) {
            // If it's our own insert, we've already optimistically added it.
            // We can choose to do nothing or re-fetch to ensure full consistency.
            // For now, let's re-fetch to ensure the `created_at` and `id` are correct from DB.
            loadMessages();
          } else {
            loadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]); // Added userId to dependency array

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
    // The real-time listener will eventually update the message with the correct ID and timestamp
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4">Chat</h3>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2"> {/* Added pr-2 for scrollbar spacing */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.user_id === userId
                ? "bg-primary/20 ml-4"
                : "bg-secondary/20 mr-4"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">
              {msg.profiles?.username || "Unknown"}
            </div>
            <div className="text-sm">{msg.message}</div>
          </div>
        ))}
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

export default ChatPanel;