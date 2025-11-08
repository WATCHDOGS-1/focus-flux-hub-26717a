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
      .channel("chat_room") // Using a specific channel name for the chat room
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Only listen for INSERT events for real-time message additions
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Fetch profile data for the new message
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", newMsg.user_id)
            .single();

          if (!profileError && profileData) {
            newMsg.profiles = profileData;
          } else {
            newMsg.profiles = { username: "Unknown" }; // Fallback if profile not found
          }

          setMessages((prevMessages) => {
            // Filter out any optimistic message that matches the new real message
            // and ensure no duplicates of the real message are added.
            const filteredMessages = prevMessages.filter(msg => 
              msg.id !== newMsg.id && // Don't keep the old real message if it somehow exists
              !(msg.id.startsWith('temp-') && msg.user_id === newMsg.user_id && msg.message === newMsg.message) // Remove optimistic
            );
            return [...filteredMessages, newMsg];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
      // If sending failed, remove the optimistic message
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
    // The real-time listener will now handle replacing the optimistic message with the real one
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4">Chat</h3>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
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