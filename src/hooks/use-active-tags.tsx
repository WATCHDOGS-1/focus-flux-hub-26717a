import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ActiveTag {
  tag: string;
  active_users: number;
}

/**
 * Fetches the top 10 active focus tags from the database.
 * This simulates calling a Supabase RPC function (get_active_tags).
 */
export function useActiveTags() {
  const [activeTags, setActiveTags] = useState<ActiveTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = async () => {
    setIsLoading(true);
    
    // NOTE: This query simulates the RPC function:
    // SELECT tag, COUNT(DISTINCT user_id) as active_users FROM focus_sessions WHERE end_time IS NULL AND tag IS NOT NULL GROUP BY tag ORDER BY active_users DESC LIMIT 10;
    
    const { data, error } = await supabase
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

    // Aggregate results manually in client-side for simplicity, mimicking the RPC output
    const tagCounts: { [key: string]: Set<string> } = {};
    data.forEach(session => {
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
      .sort((a, b) => b.active_users - a.active_users)
      .slice(0, 10);

    setActiveTags(aggregatedTags);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTags();
    
    // Set up a simple polling mechanism for real-time feel on the explore page
    const interval = setInterval(fetchTags, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return { activeTags, isLoading, refetch: fetchTags };
}