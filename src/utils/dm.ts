import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Finds an existing conversation between two users or creates a new one.
 * @param currentUserId The ID of the current user.
 * @param targetUserId The ID of the user to chat with.
 * @returns The conversation ID.
 */
export const getOrCreateConversation = async (currentUserId: string, targetUserId: string): Promise<string | null> => {
  // Ensure user IDs are ordered consistently for the unique constraint check
  const user1_id = currentUserId < targetUserId ? currentUserId : targetUserId;
  const user2_id = currentUserId < targetUserId ? targetUserId : currentUserId;

  // 1. Try to find existing conversation
  const { data: existing, error: fetchError } = await supabase
    .from("dm_conversations")
    .select("id")
    .eq("user1_id", user1_id)
    .eq("user2_id", user2_id)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching conversation:", fetchError);
    toast.error("Failed to load conversation.");
    return null;
  }

  if (existing) {
    return existing.id;
  }

  // 2. Create new conversation
  const { data: newConv, error: insertError } = await supabase
    .from("dm_conversations")
    .insert({ user1_id, user2_id })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error creating conversation:", insertError);
    toast.error("Failed to start new conversation.");
    return null;
  }

  return newConv.id;
};