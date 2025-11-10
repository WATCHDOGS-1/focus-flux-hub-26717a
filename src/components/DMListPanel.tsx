import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageSquare, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { getOrCreateConversation } from "@/utils/dm";
import { usePresence, StatusDot } from "@/hooks/use-presence"; // Import presence hooks

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Conversation = Database["public"]["Tables"]["dm_conversations"]["Row"];

interface DMListPanelProps {
  currentUserId: string;
  onSelectConversation: (conversationId: string, targetUsername: string, targetUserId: string) => void;
}

const DMListPanel = ({ currentUserId, onSelectConversation }: DMListPanelProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const presenceState = usePresence(); // Get presence state

  useEffect(() => {
    loadData();
    
    const channel = supabase
      .channel("dm_conversations_list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_conversations",
          filter: `user1_id=eq.${currentUserId},user2_id=eq.${currentUserId}`, // This filter is imperfect, but helps reduce noise
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadConversations(), loadAllUsers()]);
    setIsLoading(false);
  };

  const loadConversations = async () => {
    // Fetch conversations where the current user is either user1 or user2
    const { data, error } = await supabase
      .from("dm_conversations")
      .select("*")
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load DMs.");
    } else if (data) {
      setConversations(data as Conversation[]);
    }
  };

  const loadAllUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, profile_photo_url")
      .neq("id", currentUserId) // Exclude current user
      .order("username", { ascending: true });

    if (error) {
      console.error("Error loading users:", error);
    } else if (data) {
      setAllUsers(data as Profile[]);
    }
  };

  const handleUserClick = async (targetUser: Profile) => {
    const conversationId = await getOrCreateConversation(currentUserId, targetUser.id);
    if (conversationId) {
      onSelectConversation(conversationId, targetUser.username, targetUser.id);
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTargetUser = (conversation: Conversation) => {
    const targetId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;
    return allUsers.find(user => user.id === targetId);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading social data...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Direct Messages
      </h3>

      <div className="mb-4">
        <Input
          placeholder="Search users to start a DM..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4 text-muted-foreground" />}
        />
      </div>

      <ScrollArea className="flex-1">
        {searchTerm ? (
          // User Search Results
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Users:</p>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const status = presenceState[user.id]?.status || 'offline';
                return (
                  <div
                    key={user.id}
                    className="flex items-center p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors dopamine-click"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      {user.profile_photo_url ? (
                        <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                      <div className="absolute bottom-0 right-0">
                        <StatusDot status={status} />
                      </div>
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground text-sm">No users found.</p>
            )}
          </div>
        ) : (
          // Conversation List
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Conversations:</p>
            {conversations.length > 0 ? (
              conversations.map(conv => {
                const targetUser = getTargetUser(conv);
                if (!targetUser) return null;
                const status = presenceState[targetUser.id]?.status || 'offline';

                return (
                  <div
                    key={conv.id}
                    className="flex items-center p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors dopamine-click"
                    onClick={() => onSelectConversation(conv.id, targetUser.username, targetUser.id)}
                  >
                    <div className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      {targetUser.profile_photo_url ? (
                        <img src={targetUser.profile_photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                      <div className="absolute bottom-0 right-0">
                        <StatusDot status={status} />
                      </div>
                    </div>
                    <span className="font-medium flex-1 truncate">{targetUser.username}</span>
                    {/* Optionally show last message snippet or unread count */}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground text-sm">Start a DM by searching for a user above.</p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default DMListPanel;