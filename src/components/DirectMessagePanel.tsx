import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PrivateMessage = Database["public"]["Tables"]["private_messages"]["Row"] & {
  profiles: {
    username: string;
  } | null;
};

interface DirectMessagePanelProps {
  userId: string;
  friendId: string;
  friendUsername: string;
  onBack: () => void;
}

const DirectMessagePanel = ({
  userId,
  friendId,
  friendUsername,
  onBack,
}: DirectMessagePanelProps) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupConversation = async () => {
      // Try to find an existing conversation
      const { data: existingParticipants, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .in("user_id", [userId, friendId]);

      if (participantsError) {
        console.error("Error fetching conversation participants:", participantsError);
        toast.error("Failed to load conversation.");
        return;
      }

      let convId: string | null = null;
      if (existingParticipants && existingParticipants.length > 0) {
        // Group by conversation_id and find one with exactly two participants (userId and friendId)
        const conversationCounts = existingParticipants.reduce((acc, p) => {
          acc[p.conversation_id] = (acc[p.conversation_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        for (const id in conversationCounts) {
          if (conversationCounts[id] === 2) {
            // Check if both userId and friendId are in this conversation
            const { data: checkParticipants, error: checkError } = await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", id)
              .in("user_id", [userId, friendId]);

            if (!checkError && checkParticipants && checkParticipants.length === 2) {
              convId = id;
              break;
            }
          }
        }
      }

      if (!convId) {
        // If no conversation found, create a new one
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({})
          .select("id")
          .single();

        if (convError) {
          console.error("Error creating conversation:", convError);
          toast.error("Failed to start new conversation.");
          return;
        }
        convId = newConv.id;

        // Add participants to the new conversation
        const { error: insertParticipantsError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: convId, user_id: userId },
            { conversation_id: convId, user_id: friendId },
          ]);

        if (insertParticipantsError) {
          console.error("Error adding participants:", insertParticipantsError);
          toast.error("Failed to add participants to conversation.");
          return;
        }
      }

      setConversationId(convId);
      loadMessages(convId);

      const channel = supabase
        .channel(`dm_conversation:${convId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "private_messages",
            filter: `conversation_id=eq.${convId}`,
          },
          (payload) => {
            const newMsg = payload.new as PrivateMessage;
            // Only add if not already optimistically added by current user
            if (newMsg.sender_id !== userId) {
              setMessages((prev) => [...prev, { ...newMsg, profiles: { username: friendUsername } }]);
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            } else {
                // If it's our own message, update the optimistic one with real ID/timestamp
                setMessages(prev => prev.map(msg => 
                    msg.id.startsWith('temp-') && msg.message === newMsg.message && msg.sender_id === newMsg.sender_id
                        ? { ...newMsg, profiles: { username: "You" } }
                        : msg
                ));
            }
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    };

    setupConversation();
  }, [userId, friendId, friendUsername]);

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("private_messages")
      .select(`
        *,
        profiles (username)
      `)
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error loading private messages:", error);
    } else if (data) {
      setMessages(data.map(msg => ({
        ...msg,
        profiles: { username: msg.sender_id === userId ? "You" : friendUsername }
      })) as PrivateMessage[]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    const optimisticMessage: PrivateMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId,
      message: messageContent,
      created_at: new Date().toISOString(),
      profiles: { username: "You" },
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    const { error } = await supabase
      .from("private_messages")
      .insert({ conversation_id: conversationId, sender_id: userId, message: messageContent });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending private message:", error);
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="dopamine-click">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-xl font-semibold flex-1">DM with {friendUsername}</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.sender_id === userId
                ? "bg-primary/20 ml-4 text-right"
                : "bg-secondary/20 mr-4 text-left"
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
          disabled={!conversationId}
        />
        <Button size="icon" onClick={sendMessage} className="dopamine-click" disabled={!conversationId}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DirectMessagePanel;