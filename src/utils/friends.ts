import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type FriendRequestStatus = Database["public"]["Enums"]["friend_request_status"];

/**
 * Sends a friend request from the current user to the target user.
 */
export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  if (senderId === receiverId) {
    toast.error("You cannot send a friend request to yourself.");
    return false;
  }

  // Check if a request already exists (pending, accepted, or rejected)
  const { data: existingRequest, error: fetchError } = await supabase
    .from("friend_requests")
    .select("status")
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .maybeSingle();

  if (fetchError) {
    console.error("Error checking existing request:", fetchError);
    toast.error("Failed to check friend status.");
    return false;
  }

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      toast.info("Friend request already pending.");
      return false;
    }
    // If accepted, they are already friends. If rejected, we allow resending by upserting/inserting.
  }

  const { error: insertError } = await supabase
    .from("friend_requests")
    .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' })
    .select()
    .single();

  if (insertError) {
    console.error("Error sending friend request:", insertError);
    toast.error("Failed to send friend request.");
    return false;
  }

  toast.success("Friend request sent!");
  return true;
};

/**
 * Accepts a pending friend request and creates a friendship record.
 */
export const acceptFriendRequest = async (requestId: string, senderId: string, receiverId: string) => {
  // 1. Update the request status to 'accepted'
  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: 'accepted' })
    .eq("id", requestId);

  if (updateError) {
    console.error("Error accepting request:", updateError);
    toast.error("Failed to accept request.");
    return false;
  }

  // 2. Create the friendship record (the trigger handles normalization)
  const { error: friendshipError } = await supabase
    .from("friendships")
    .insert({ user1_id: senderId, user2_id: receiverId });

  if (friendshipError) {
    console.error("Error creating friendship:", friendshipError);
    toast.error("Failed to establish friendship.");
    return false;
  }

  toast.success("Friend request accepted! 🎉");
  return true;
};

/**
 * Rejects a pending friend request.
 */
export const rejectFriendRequest = async (requestId: string) => {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: 'rejected' })
    .eq("id", requestId);

  if (error) {
    console.error("Error rejecting request:", error);
    toast.error("Failed to reject request.");
    return false;
  }

  toast.info("Friend request rejected.");
  return true;
};

/**
 * Removes an existing friendship.
 */
export const removeFriendship = async (friendshipId: string) => {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    console.error("Error removing friendship:", error);
    toast.error("Failed to remove friend.");
    return false;
  }

  toast.info("Friend removed.");
  return true;
};