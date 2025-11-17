import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ActiveTag {
  tag: string;
  active_users: number;
}

/**
 * Fetches the top 10 active focus tags from the database.
 */
export function useActiveTags() {
  const [activeTags, setActiveTags] = useState<ActiveTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = async () => {
    setIsLoading(true);
    
    // Query focus_sessions for currently active sessions (end_time IS NULL)
    const { data: sessions, error } = await supabase
      .from("focus_sessions")
      .select("tag, user_id")
      .is("end_time", null)
      .not("tag", "is", null);

    if (error) {
      console.error("Error fetching active tags:", error);
      toast.error("Failed to load active focus groups.");
      setIsLoading(false);
      return;
    }

    // Aggregate results: count unique users per tag
    const tagCounts: { [key: string]: Set<string> } = {};
    sessions.forEach(session => {
      if (session.tag) {
        if (!tagCounts[session.tag]) {
          tagCounts[session.tag] = new Set();
        }
        tagCounts[session.tag].add(session.user_id);
      }
    });

    const aggregatedTags: ActiveTag[] = Object.entries(tagCounts)
      .map(([tag, userIds]) => ({
        tag,
        active_users: userIds.size,
      }))
      .filter(tag => tag.active_users > 0) // Explicitly filter out tags with 0 users (shouldn't happen if query is correct, but adds safety)
      .sort((a, b) => b.active_users - a.active_users)
      .slice(0, 10);

    setActiveTags(aggregatedTags);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTags();
    
    // Set up a simple polling mechanism for real-time feel on the explore page
    // Reduced polling interval to 10 seconds for faster cleanup detection
    const interval = setInterval(fetchTags, 10000); 

    return () => clearInterval(interval);
  }, []);

  return { activeTags, isLoading, refetch: fetchTags };
}