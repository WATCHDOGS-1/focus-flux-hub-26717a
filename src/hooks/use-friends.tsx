import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
type FriendRequest = Database["public"]["Tables"]["friend_requests"]["Row"] & {
  sender: Pick<Profile, 'id' | 'username' | 'profile_photo_url'> | null;
};

interface Friend {
  id: string; // Friend's user ID
  username: string;
  profile_photo_url: string | null;
  friendship_id: string; // ID of the friendship record
}

interface UseFriendsResult {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  isLoading: boolean;
  refetch: () => void;
}

export function useFriends(): UseFriendsResult {
  const { userId, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriendsAndRequests = async (uid: string) => {
    setIsLoading(true);
    
    // 1. Fetch confirmed friendships
    const { data: friendshipsData, error: friendshipsError } = await supabase
      .from("friendships")
      .select(`
        id,
        user1_id,
        user2_id,
        user1:user1_id (id, username, profile_photo_url),
        user2:user2_id (id, username, profile_photo_url)
      `)
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`);

    if (friendshipsError) {
      console.error("Error fetching friendships:", friendshipsError);
      toast.error("Failed to load friends list.");
    } else if (friendshipsData) {
      const friendList: Friend[] = friendshipsData.map((f: any) => {
        const friendProfile = f.user1.id === uid ? f.user2 : f.user1;
        return {
          id: friendProfile.id,
          username: friendProfile.username,
          profile_photo_url: friendProfile.profile_photo_url,
          friendship_id: f.id,
        };
      });
      setFriends(friendList);
    }

    // 2. Fetch pending requests received by the current user
    const { data: requestsData, error: requestsError } = await supabase
      .from("friend_requests")
      .select(`
        *,
        sender:sender_id (id, username, profile_photo_url)
      `)
      .eq("receiver_id", uid)
      .eq("status", "pending");

    if (requestsError) {
      console.error("Error fetching friend requests:", requestsError);
    } else if (requestsData) {
      setPendingRequests(requestsData as FriendRequest[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setFriends([]);
      setPendingRequests([]);
      setIsLoading(false);
      return;
    }

    fetchFriendsAndRequests(userId);

    // Setup Realtime listeners for immediate updates
    const channel = supabase.channel(`friends:${userId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
        },
        () => {
          fetchFriendsAndRequests(userId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          fetchFriendsAndRequests(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAuthenticated]);

  return {
    friends,
    pendingRequests,
    isLoading,
    refetch: () => userId && fetchFriendsAndRequests(userId),
  };
}