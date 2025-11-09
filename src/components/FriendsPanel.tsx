import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Check, X, MessageSquare, Search, Users } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Friendship = Database["public"]["Tables"]["friendships"]["Row"] & {
  user_id_1_profile: Profile | null;
  user_id_2_profile: Profile | null;
};

interface FriendsPanelProps {
  userId: string;
  onStartDm: (friendId: string, friendUsername: string) => void;
}

const FriendsPanel = ({ userId, onStartDm }: FriendsPanelProps) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFriendsAndRequests();

    const channel = supabase
      .channel("friendships_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `user_id_1=eq.${userId}.or.user_id_2=eq.${userId}`,
        },
        () => {
          loadFriendsAndRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadFriendsAndRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        *,
        user_id_1_profile:profiles!user_id_1 (username, profile_photo_url),
        user_id_2_profile:profiles!user_id_2 (username, profile_photo_url)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) {
      console.error("Error loading friendships:", error);
      toast.error("Failed to load friends and requests.");
    } else if (data) {
      const acceptedFriends = data.filter((f) => f.status === "accepted");
      const pending = data.filter(
        (f) => f.status === "pending" && f.user_id_2 === userId
      ); // Incoming requests
      setFriends(acceptedFriends as Friendship[]);
      setPendingRequests(pending as Friendship[]);
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, profile_photo_url")
      .ilike("username", `%${searchTerm.trim()}%`)
      .neq("id", userId) // Don't show current user
      .limit(10);

    if (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users.");
    } else if (data) {
      // Filter out users who are already friends or have pending requests
      const existingConnections = new Set(
        [...friends, ...pendingRequests].flatMap((f) => [f.user_id_1, f.user_id_2])
      );
      const filteredResults = data.filter(
        (profile) => !existingConnections.has(profile.id)
      ).map(profile => ({
        ...profile,
        bio: null,
        discord_user_id: null,
        interests: null,
        social_links: null
      }));
      setSearchResults(filteredResults);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    const { error } = await supabase
      .from("friendships")
      .insert({ user_id_1: userId, user_id_2: targetUserId, status: "pending" });

    if (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.");
    } else {
      toast.success("Friend request sent!");
      setSearchTerm("");
      setSearchResults([]);
      loadFriendsAndRequests(); // Reload to update pending requests
    }
  };

  const updateFriendshipStatus = async (
    friendshipId: string,
    status: "accepted" | "declined" | "blocked" | "removed"
  ) => {
    let updateData: Partial<Database["public"]["Tables"]["friendships"]["Update"]> = { status };
    let successMessage = "";

    if (status === "removed" || status === "declined") {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
      successMessage = status === "removed" ? "Friend removed." : "Request declined.";
    } else {
      const { error } = await supabase
        .from("friendships")
        .update(updateData)
        .eq("id", friendshipId);
      if (error) throw error;
      successMessage = "Friend request accepted!";
    }

    toast.success(successMessage);
    loadFriendsAndRequests();
  };

  const getFriendProfile = (friendship: Friendship) => {
    return friendship.user_id_1 === userId
      ? friendship.user_id_2_profile
      : friendship.user_id_1_profile;
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="text-primary" />
        Friends
      </h3>

      <Tabs defaultValue="friends" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="find">Find Users</TabsTrigger>
        </TabsList>
        <TabsContent value="friends" className="flex-1 flex flex-col pt-4 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-muted-foreground text-center py-8">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              You don't have any friends yet. Find some!
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friendship) => {
                const friend = getFriendProfile(friendship);
                if (!friend) return null;
                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.profile_photo_url || undefined} />
                        <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onStartDm(friend.id, friend.username)}
                        className="dopamine-click"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => updateFriendshipStatus(friendship.id, "removed")}
                        className="dopamine-click"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="requests" className="flex-1 flex flex-col pt-4 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-muted-foreground text-center py-8">Loading requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No pending friend requests.</div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((friendship) => {
                const sender = friendship.user_id_1_profile;
                if (!sender) return null;
                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={sender.profile_photo_url || undefined} />
                        <AvatarFallback>{sender.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{sender.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() => updateFriendshipStatus(friendship.id, "accepted")}
                        className="dopamine-click bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => updateFriendshipStatus(friendship.id, "declined")}
                        className="dopamine-click"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="find" className="flex-1 flex flex-col pt-4 overflow-y-auto pr-2">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button size="icon" onClick={handleSearch} className="dopamine-click">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {searchResults.length === 0 && searchTerm.length > 0 ? (
              <div className="text-muted-foreground text-center py-4">No users found.</div>
            ) : searchResults.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={profile.profile_photo_url || undefined} />
                    <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{profile.username}</span>
                </div>
                <Button
                  size="icon"
                  onClick={() => sendFriendRequest(profile.id)}
                  className="dopamine-click"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendsPanel;