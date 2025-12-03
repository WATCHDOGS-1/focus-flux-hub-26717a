import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ReportType = "video" | "chat" | "username";

/**
 * Reports a user or specific content (video/chat message) to the moderation system.
 * Assumes the backend has a 'reports' table and a function/trigger to handle bans.
 */
export const reportUser = async (
  reporterId: string,
  reportedUserId: string,
  reportType: ReportType,
  contentId: string | null = null, // ID of the message or content if applicable
  reason: string = "Breach of community guidelines"
) => {
  if (reporterId === reportedUserId) {
    toast.warning("You cannot report yourself.");
    return;
  }

  // --- ASSUMED BACKEND INTERACTION ---
  // We assume a 'reports' table exists with RLS allowing inserts.
  const { error } = await supabase
    .from("reports")
    .insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      report_type: reportType,
      content_id: contentId,
      reason: reason,
    });

  if (error) {
    console.error("Error submitting report:", error);
    toast.error("Failed to submit report. Please try again.");
    return;
  }

  toast.success("Report submitted successfully. Thank you for keeping the community safe.");
  
  // Note: The 7-day ban logic (3 reports in 15 mins) must be implemented via a Supabase function or trigger.
};

// We assume the 'reports' table structure in the database types for completeness, 
// although I cannot modify the types.ts file directly based on a new table.
// I will proceed assuming the user will add the 'reports' table and necessary RLS/functions.