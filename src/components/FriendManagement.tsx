"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserPlus, Check, X, UserMinus, Search, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Friendship = Database["public"]["Tables"]["friendships"]["Row"];

interface FriendManagementProps {
  userId: string;
}

const FriendManagement = ({ userId }: FriendManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<
    (Friendship & { profiles: Profile | null })[]
  >([]);
  const [pendingRequests, setPendingRequests] = useState<
    (Friendship & { profiles: Profile | null })[]
  >([]);
  const [outgoingRequests, setOutgoingRequests] = useState<
    (Friendship & { profiles: Profile | null })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFriendships();

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
          loadFriendships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadFriendships = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("friendships")
      .select(
        `
        *,
        profiles:user_id_1 (username, profile_photo_url),
        profiles_2:user_id_2 (username, profile_photo_url)
      `
      )
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) {
      console.error("Error loading friendships:", error);
      toast.error("Failed to load friendships.");
    } else if (data) {
      const allFriendships = data.map((f) => ({
        ...f,
        profiles: f.user_id_1 === userId ? f.profiles_2 : f.profiles,
      })) as (Friendship & { profiles: Profile | null })[];

      setFriends(allFriendships.filter((f) => f.status === "accepted"));
      setPendingRequests(
        allFriendships.filter(
          (f) => f.status === "pending" && f.user_id_2 === userId
        )
      ); // Incoming requests
      setOutgoingRequests(
        allFriendships.filter(
          (f) => f.status === "pending" && f.user_id_1 === userId
        )
      ); // Outgoing requests
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, profile_photo_url")
      .ilike("username", `%${searchTerm}%`)
      .neq("id", userId) // Don't show current user
      .limit(10);

    if (error) {
      console.error("Error searching profiles:", error);
      toast.error("Failed to search for users.");
    } else if (data) {
      // Filter out users who are already friends or have pending requests
      const filteredResults = data.filter((profile) => {
        const isAlreadyFriend = friends.some(
          (f) => f.profiles?.id === profile.id
        );
        const hasPendingRequest =
          pendingRequests.some((f) => f.profiles?.id === profile.id) ||
          outgoingRequests.some((f) => f.profiles?.id === profile.id);
        return !isAlreadyFriend && !hasPendingRequest;
      });
      setSearchResults(filteredResults);
    }
    setIsLoading(false);
  };

  const sendFriendRequest = async (recipientId: string) => {
    const { error } = await supabase
      .from("friendships")
      .insert({ user_id_1: userId, user_id_2: recipientId, status: "pending" });

    if (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.");
    } else {
      toast.success("Friend request sent!");
      setSearchTerm("");
      setSearchResults([]);
      loadFriendships(); // Reload to update outgoing requests
    }
  };

  const handleRequestAction = async (
    friendshipId: string,
    action: "accept" | "decline"
  ) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: action === "accept" ? "accepted" : "declined" })
      .eq("id", friendshipId);

    if (error) {
      console.error(`Error ${action}ing friend request:`, error);
      toast.error(`Failed to ${action} friend request.`);
    } else {
      toast.success(`Friend request ${action}ed!`);
      loadFriendships();
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend.");
    } else {
      toast.success("Friend removed.");
      loadFriendships();
    }
  };

  const renderProfileCard = (profile: Profile, actionButton?: React.ReactNode) => (
    <div key={profile.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20">
      <Avatar className="h-9 w-9">
        <AvatarImage src={profile.profile_photo_url || undefined} />
        <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="flex-1 font-medium">{profile.username}</span>
      {actionButton}
    </div>
  );

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
          <TabsTrigger value="add">Add Friend</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto py-4 pr-2">
          {isLoading && <div className="text-center text-muted-foreground">Loading...</div>}
          {!isLoading && (
            <>
              <TabsContent value="friends" className="mt-0">
                {friends.length === 0 ? (
                  <p className="text-muted-foreground text-center">No friends yet. Add some!</p>
                ) : (
                  <div className="space-y-3">
                    {friends.map((f) =>
                      f.profiles ? (
                        renderProfileCard(
                          f.profiles,
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeFriend(f.id)}
                            className="dopamine-click"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )
                      ) : null
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="requests" className="mt-0">
                <h4 className="font-semibold mb-2">Incoming Requests ({pendingRequests.length})</h4>
                {pendingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm mb-4">No incoming requests.</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {pendingRequests.map((f) =>
                      f.profiles ? (
                        renderProfileCard(
                          f.profiles,
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="icon"
                              onClick={() => handleRequestAction(f.id, "accept")}
                              className="dopamine-click"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRequestAction(f.id, "decline")}
                              className="dopamine-click"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      ) : null
                    )}
                  </div>
                )}

                <h4 className="font-semibold mb-2">Outgoing Requests ({outgoingRequests.length})</h4>
                {outgoingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No outgoing requests.</p>
                ) : (
                  <div className="space-y-3">
                    {outgoingRequests.map((f) =>
                      f.profiles ? (
                        renderProfileCard(
                          f.profiles,
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-muted-foreground"
                          >
                            Pending
                          </Button>
                        )
                      ) : null
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add" className="mt-0">
                <div className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button size="icon" onClick={handleSearch} className="dopamine-click">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {searchResults.length === 0 && searchTerm.length > 0 && !isLoading ? (
                    <p className="text-muted-foreground text-center">No users found.</p>
                  ) : (
                    searchResults.map((profile) =>
                      renderProfileCard(
                        profile,
                        <Button
                          size="icon"
                          onClick={() => sendFriendRequest(profile.id)}
                          className="dopamine-click"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )
                    )
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default FriendManagement;