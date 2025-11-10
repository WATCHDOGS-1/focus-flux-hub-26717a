import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
type UserLevels = Database["public"]["Tables"]["user_levels"]["Row"];

interface UserData {
  stats: UserStats | null;
  levels: UserLevels | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useUserStats(): UserData {
  const { userId, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [levels, setLevels] = useState<UserLevels | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async (uid: string) => {
    setIsLoading(true);
    
    // Fetch Stats (Longest Streak, Longest Session)
    const { data: statsData, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching user stats:", statsError);
      toast.error("Failed to load user stats.");
    } else {
      setStats(statsData);
    }

    // Fetch Levels (XP, Level, Title)
    const { data: levelsData, error: levelsError } = await supabase
      .from("user_levels")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (levelsError && levelsError.code !== 'PGRST116') {
      console.error("Error fetching user levels:", levelsError);
      toast.error("Failed to load user levels.");
    } else {
      setLevels(levelsData);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchStats(userId);
    } else {
      setStats(null);
      setLevels(null);
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  return {
    stats,
    levels,
    isLoading,
    refetch: () => userId && fetchStats(userId),
  };
}