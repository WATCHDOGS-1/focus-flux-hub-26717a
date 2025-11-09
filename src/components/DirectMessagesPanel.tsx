"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type PrivateMessage = Database["public"]["Tables"]["private_messages"]["Row"] & {
  profiles: { username: string } | null;
};

interface ConversationListItem extends Conversation {
  other_participant: Profile | null;
  last_message_preview: string | null;
}

interface DirectMessagesPanelProps {
  userId: string;
  onBack?: () => void; // Optional prop to navigate back to main panel list
}

const DirectMessagesPanel = ({ userId, onBack }: DirectMessagesPanelProps) => {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState<Profile[]>([]); // For starting new conversations
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversationsAndFriends();

    const messageChannel = supabase
      .channel("private_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `conversation_id=eq.${selectedConversationId}`, // Only listen for messages in the selected conversation
        },
        (payload) => {
          // Only reload if the change is not from the current user (optimistic update handles local)
          if (payload.new.sender_id !== userId) {
            loadMessages(selectedConversationId!);
          }
        }
      )
      .subscribe();

    const conversationChannel = supabase
      .channel("conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadConversationsAndFriends(); // Reload conversations if participation changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(conversationChannel);
    };
  }, [userId, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const loadConversationsAndFriends = async () => {
    setIsLoading(true);

    // Fetch all friendships for the current user
    const { data: friendshipData, error: friendshipError } = await supabase
      .from("friendships")
      .select(
        `
        status,
        user_id_1,
        user_id_2,
        profiles_1:user_id_1 (id, username, profile_photo_url),
        profiles_2:user_id_2 (id, username, profile_photo_url)
      `
      )
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq("status", "accepted");

    if (friendshipError) {
      console.error("Error loading friendships:", friendshipError);
      toast.error("Failed to load friends.");
      setIsLoading(false);
      return;
    }

    const acceptedFriends: Profile[] = [];
    friendshipData?.forEach((f) => {
      if (f.user_id_1 === userId && f.profiles_2) {
        acceptedFriends.push(f.profiles_2);
      } else if (f.user_id_2 === userId && f.profiles_1) {
        acceptedFriends.push(f.profiles_1);
      }
    });
    setFriends(acceptedFriends);

    // Fetch conversations for the current user
    const { data: participantData, error: participantError } = await supabase
      .from("conversation_participants")
      .select(
        `
        conversation_id,
        conversations (*),
        profiles (id, username, profile_photo_url)
      `
      )
      .eq("user_id", userId);

    if (participantError) {
      console.error("Error loading conversation participants:", participantError);
      toast.error("Failed to load conversations.");
      setIsLoading(false);
      return;
    }

    const convos: ConversationListItem[] = [];
    for (const participant of participantData || []) {
      const conversationId = participant.conversation_id;

      // Get the other participant in this conversation
      const { data: otherParticipants, error: otherParticipantError } = await supabase
        .from("conversation_participants")
        .select(`profiles (id, username, profile_photo_url)`)
        .eq("conversation_id", conversationId)
        .neq("user_id", userId);

      if (otherParticipantError) {
        console.error("Error fetching other participant:", otherParticipantError);
        continue;
      }

      const otherParticipant = otherParticipants?.[0]?.profiles || null;

      // Get last message preview
      const { data: lastMessage, error: lastMessageError } = await supabase
        .from("private_messages")
        .select("message")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastMessageError && lastMessageError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching last message:", lastMessageError);
      }

      convos.push({
        ...participant.conversations!,
        other_participant: otherParticipant,
        last_message_preview: lastMessage?.message || null,
      });
    }
    setConversations(convos);
    setIsLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("private_messages")
      .select(
        `
        *,
        profiles (username)
      `
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages.");
    } else if (data) {
      setMessages(data as PrivateMessage[]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    const optimisticMessage: PrivateMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversationId,
      sender_id: userId,
      message: messageContent,
      created_at: new Date().toISOString(),
      profiles: { username: "You" },
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    const { error } = await supabase
      .from("private_messages")
      .insert({
        conversation_id: selectedConversationId,
        sender_id: userId,
        message: messageContent,
      });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    }
    // Real-time listener will update with actual message from DB
  };

  const startNewConversation = async (friendId: string) => {
    // Check if a conversation already exists with this friend
    const existingConvo = conversations.find(
      (c) => c.other_participant?.id === friendId
    );

    if (existingConvo) {
      setSelectedConversationId(existingConvo.id);
      return;
    }

    // Create new conversation
    const { data: newConvo, error: convoError } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (convoError) {
      console.error("Error creating conversation:", convoError);
      toast.error("Failed to start new conversation.");
      return;
    }

    // Add participants
    const { error: participantError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: newConvo.id, user_id: userId },
        { conversation_id: newConvo.id, user_id: friendId },
      ]);

    if (participantError) {
      console.error("Error adding participants:", participantError);
      toast.error("Failed to add participants to conversation.");
      // Optionally, delete the created conversation if participants fail to add
      await supabase.from("conversations").delete().eq("id", newConvo.id);
      return;
    }

    toast.success("New conversation started!");
    setSelectedConversationId(newConvo.id);
    loadConversationsAndFriends(); // Reload to show new conversation
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading messages...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        {selectedConversationId ? (
          <Button variant="ghost" size="icon" onClick={() => setSelectedConversationId(null)} className="dopamine-click">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} className="dopamine-click">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div /> // Empty div to maintain spacing if no back button
        )}
        <h3 className="text-xl font-semibold flex-1 text-center">
          {selectedConversationId
            ? conversations.find((c) => c.id === selectedConversationId)?.other_participant?.username || "Chat"
            : "Direct Messages"}
        </h3>
        {selectedConversationId ? (
          <div className="w-10" /> // Placeholder for spacing
        ) : (
          <Button variant="ghost" size="icon" className="invisible">
            <MessageCircle className="h-5 w-5" />
          </Button>
        )}
      </div>

      {selectedConversationId ? (
        // Chat view
        <>
          <ScrollArea className="flex-1 space-y-3 mb-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.sender_id === userId
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
          </ScrollArea>

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
        </>
      ) : (
        // Conversation list / Start new conversation
        <ScrollArea className="flex-1 pr-2">
          <h4 className="font-semibold mb-2">Your Conversations</h4>
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm mb-4">No active conversations. Start one with a friend!</p>
          ) : (
            <div className="space-y-3 mb-6">
              {conversations.map((convo) => (
                <Button
                  key={convo.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 dopamine-click bg-secondary/20 hover:bg-secondary/30"
                  onClick={() => setSelectedConversationId(convo.id)}
                >
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src={convo.other_participant?.profile_photo_url || undefined} />
                    <AvatarFallback>{convo.other_participant?.username?.[0]?.toUpperCase() || <User className="h-5 w-5" />}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{convo.other_participant?.username || "Unknown User"}</span>
                    <span className="text-xs text-muted-foreground truncate w-48 text-left">
                      {convo.last_message_preview || "No messages yet."}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}

          <h4 className="font-semibold mb-2">Start New Conversation</h4>
          {friends.length === 0 ? (
            <p className="text-muted-foreground text-sm">Add friends to start private chats!</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <Button
                  key={friend.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 dopamine-click bg-secondary/10 hover:bg-secondary/20"
                  onClick={() => startNewConversation(friend.id)}
                >
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src={friend.profile_photo_url || undefined} />
                    <AvatarFallback>{friend.username?.[0]?.toUpperCase() || <User className="h-5 w-5" />}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{friend.username}</span>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};

export default DirectMessagesPanel;