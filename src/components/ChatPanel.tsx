import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User } from "lucide-react";
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
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

    const { error } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, message: newMessage.trim() });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Chat</h3>

      <div className="flex-1 space-y-3 overflow-y-auto mb-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.user_id === userId
                ? "bg-primary/10 ml-4 border border-primary/20"
                : "bg-secondary/10 mr-4 border border-secondary/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="text-primary" size={14} />
              </div>
              <div className="text-xs font-medium text-foreground">
                {msg.profiles?.username || "Unknown"}
              </div>
            </div>
            <div className="text-sm text-foreground">{msg.message}</div>
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
          className="rounded-lg"
        />
        <Button size="icon" onClick={sendMessage} className="rounded-lg">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;