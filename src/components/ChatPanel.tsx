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
    const fetchInitialMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`*, profiles (username)`)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error loading messages:", error);
        toast.error("Could not load chat history.");
      } else if (data) {
        setMessages(data as ChatMessage[]);
      }
    };

    fetchInitialMessages();

    const channel = supabase
      .channel("chat_messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          supabase
            .from("chat_messages")
            .select(`*, profiles (username)`)
            .eq('id', payload.new.id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error("Error fetching new message:", error);
                toast.error("Failed to receive a new message.");
              } else if (data) {
                setMessages((prevMessages) => [...prevMessages, data as ChatMessage]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      <h3 className="text-xl font-semibold mb-4">Chat</h3>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 p-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-[90%] break-words ${
              msg.user_id === userId
                ? "bg-primary/20 ml-auto"
                : "bg-secondary/20 mr-auto"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1 font-semibold">
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
        />
        <Button size="icon" onClick={sendMessage}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;