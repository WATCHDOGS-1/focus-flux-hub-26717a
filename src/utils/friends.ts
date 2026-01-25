import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type FriendRequestStatus = Database["public"]["Enums"]["friend_request_status"];

/**
 * Sends a friend request from the current user to the target user.
 */
export const sendFriendRequest = async (senderId: string, receiverId: string): Promise<{ success: boolean, error: string | null }> => {
  if (senderId === receiverId) {
    const errorMsg = "You cannot send a friend request to yourself.";
    toast.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  // Check if a request already exists (pending, accepted, or rejected)
  const { data: existingRequest, error: fetchError } = await supabase
    .from("friend_requests")
    .select("status")
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .maybeSingle();

  if (fetchError) {
    const errorMsg = `Failed to check friend status: ${fetchError.message}`;
    console.error(errorMsg, fetchError);
    toast.error("Failed to check friend status.");
    return { success: false, error: errorMsg };
  }

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      toast.info("Friend request already pending.");
      return { success: false, error: "Friend request already pending." };
    }
    // If accepted, they are already friends. If rejected, we allow resending by upserting/inserting.
  }

  const { error: insertError } = await supabase
    .from("friend_requests")
    .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' })
    .select()
    .single();

  if (insertError) {
    const errorMsg = `Failed to send friend request: ${insertError.message}`;
    console.error(errorMsg, insertError);
    toast.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  toast.success("Friend request sent!");
  return { success: true, error: null };
};

/**
 * Accepts a pending friend request and creates a friendship record.
 */
export const acceptFriendRequest = async (requestId: string, senderId: string, receiverId: string): Promise<{ success: boolean, error: string | null }> => {
  // 1. Update the request status to 'accepted'
  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: 'accepted' })
    .eq("id", requestId);

  if (updateError) {
    const errorMsg = `Failed to accept request: ${updateError.message}`;
    console.error(errorMsg, updateError);
    toast.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  // 2. Create the friendship record (the trigger handles normalization)
  const { error: friendshipError } = await supabase
    .from("friendships")
    .insert({ user1_id: senderId, user2_id: receiverId });

  if (friendshipError) {
    const errorMsg = `Failed to establish friendship: ${friendshipError.message}`;
    console.error(errorMsg, friendshipError);
    toast.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  toast.success("Friend request accepted! 🎉");
  return { success: true, error: null };
};

/**
 * Rejects a pending friend request.
 */
export const rejectFriendRequest = async (requestId: string): Promise<{ success: boolean, error: string | null }> => {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: 'rejected' })
    .eq("id", requestId);

  if (error) {
    const errorMsg = `Failed to reject request: ${error.message}`;
    console.error(errorMsg, error);
    toast.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  toast.info("Friend request rejected.");
  return { success: true, error: null };
};

/**
 * Removes an existing friendship.
 */
export const removeFriendship = async (friendshipId: string): Promise<{ success: boolean, error: string | null }> => {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    const errorMsg = `Failed to remove friend: ${error.message}`;
    console.error(errorMsg, error);
    toast.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  toast.info("Friend removed.");
  return { success: true, error: null };
};