import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageSquare, User, Users, UserPlus, Check, X, Clock, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { getOrCreateConversation } from "@/utils/dm";
import { useFriends } from "@/hooks/use-friends";
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from "@/utils/friends";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Conversation = Database["public"]["Tables"]["dm_conversations"]["Row"];

interface SocialListPanelProps {
  currentUserId: string;
  onSelectConversation: (conversationId: string, targetUsername: string, targetUserId: string) => void;
}

const SocialListPanel = ({ currentUserId, onSelectConversation }: SocialListPanelProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [view, setView] = useState<'friends' | 'dms'>('friends');

  const { friends, pendingRequests, isLoading: isLoadingFriends, refetch } = useFriends();

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
    setIsLoadingData(true);
    await Promise.all([loadConversations(), loadAllUsers()]);
    setIsLoadingData(false);
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

  const handleSendRequest = async (targetUserId: string) => {
    await sendFriendRequest(currentUserId, targetUserId);
    refetch();
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    await acceptFriendRequest(requestId, senderId, currentUserId);
    refetch();
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectFriendRequest(requestId);
    refetch();
  };

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTargetUser = (conversation: Conversation) => {
    const targetId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;
    return allUsers.find(user => user.id === targetId);
  };

  const renderUserItem = (user: Pick<Profile, 'id' | 'username' | 'profile_photo_url'>, actions?: React.ReactNode) => {
    const isFriend = friends.some(f => f.id === user.id);

    return (
      <div
        key={user.id}
        className="flex items-center p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors dopamine-click"
        onClick={() => view === 'dms' && handleUserClick(user as Profile)}
      >
        <div className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
          <span className="text-sm font-bold text-white">
            {user.username?.[0]?.toUpperCase()}
          </span>
        </div>
        <span className="font-medium flex-1 truncate">{user.username}</span>
        
        {actions || (view === 'friends' && !isFriend && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-6 h-6"
            onClick={(e) => { e.stopPropagation(); handleSendRequest(user.id); }}
            title="Send Friend Request"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        ))}
      </div>
    );
  };

  if (isLoadingData || isLoadingFriends) {
    return <div className="text-center py-8 text-muted-foreground">Loading social data...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          {view === 'friends' ? <Users className="w-5 h-5 text-primary" /> : <MessageSquare className="w-5 h-5 text-primary" />}
          {view === 'friends' ? "Friend Circles" : "Direct Messages"}
        </h3>
        <div className="flex gap-2">
          <Button 
            variant={view === 'friends' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setView('friends')}
            className="dopamine-click"
          >
            Friends
          </Button>
          <Button 
            variant={view === 'dms' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setView('dms')}
            className="dopamine-click"
          >
            DMs
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder={view === 'friends' ? "Search users to add..." : "Search users to start a DM..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4 text-muted-foreground" />}
        />
      </div>

      <ScrollArea className="flex-1">
        {searchTerm ? (
          // User Search Results (for adding friends or starting DMs)
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Search Results:</p>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const isFriend = friends.some(f => f.id === user.id);
                const isPending = pendingRequests.some(r => r.sender_id === user.id || r.receiver_id === user.id);
                
                let actions;
                if (isFriend) {
                  actions = <span className="text-xs text-success font-semibold">Friend</span>;
                } else if (isPending) {
                  actions = <span className="text-xs text-warning font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
                } else {
                  actions = (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-6 h-6"
                      onClick={(e) => { e.stopPropagation(); handleSendRequest(user.id); }}
                      title="Send Friend Request"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  );
                }

                return renderUserItem(user, actions);
              })
            ) : (
              <p className="text-center text-muted-foreground text-sm">No users found.</p>
            )}
          </div>
        ) : view === 'friends' ? (
          // Friends View
          <div className="space-y-4">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-2 border-b border-border pb-4">
                <p className="text-sm font-semibold text-primary flex items-center gap-1">
                  <UserPlus className="w-4 h-4" /> Requests ({pendingRequests.length})
                </p>
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center p-3 rounded-lg bg-secondary/20">
                    <div className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-white">
                        {req.sender?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium flex-1 truncate">{req.sender?.username || "Unknown User"}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="success" className="w-6 h-6" onClick={() => handleAcceptRequest(req.id, req.sender_id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="w-6 h-6" onClick={() => handleRejectRequest(req.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friend List */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">My Friends ({friends.length})</p>
              {friends.length > 0 ? (
                friends.map(friend => renderUserItem(friend))
              ) : (
                <p className="text-center text-muted-foreground text-sm">No friends yet. Search above to add some!</p>
              )}
            </div>
          </div>
        ) : (
          // DM View (Existing Conversations)
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Conversations:</p>
            {conversations.length > 0 ? (
              conversations.map(conv => {
                const targetUser = getTargetUser(conv);
                if (!targetUser) return null;
                return renderUserItem(targetUser);
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

export default SocialListPanel;