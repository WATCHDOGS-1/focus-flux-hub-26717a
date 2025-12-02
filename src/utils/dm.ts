import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Finds an existing conversation between two users or creates a new one.
 * @param currentUserId The ID of the current user.
 * @param targetUserId The ID of the user to chat with.
 * @returns The conversation ID or null, and an error message if failed.
 */
export const getOrCreateConversation = async (currentUserId: string, targetUserId: string): Promise<{ conversationId: string | null, error: string | null }> => {
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
    const errorMsg = `Failed to load conversation: ${fetchError.message}`;
    console.error(errorMsg, fetchError);
    toast.error("Failed to load conversation.");
    return { conversationId: null, error: errorMsg };
  }

  if (existing) {
    return { conversationId: existing.id, error: null };
  }

  // 2. Create new conversation
  const { data: newConv, error: insertError } = await supabase
    .from("dm_conversations")
    .insert({ user1_id, user2_id })
    .select("id")
    .single();

  if (insertError) {
    const errorMsg = `Failed to start new conversation: ${insertError.message}`;
    console.error(errorMsg, insertError);
    toast.error("Failed to start new conversation.");
    return { conversationId: null, error: errorMsg };
  }

  return { conversationId: newConv.id, error: null };
};