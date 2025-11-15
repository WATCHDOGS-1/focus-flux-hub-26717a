import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
type UserLevels = Database["public"]["Tables"]["user_levels"]["Row"];

/**
 * Provides rule-based motivational advice based on user stats.
 */
export const runAIFocusCoach = (stats: UserStats | null, levels: UserLevels | null, sessionDurationMinutes: number) => {
  if (!stats || !levels) {
    // Rule 1: New user encouragement
    toast.info("Welcome to OnlyFocus! Complete your first session to start earning XP and climbing the leaderboard. You got this! 🚀", { duration: 8000 });
    return;
  }

  // Rule 2: Long session praise
  if (sessionDurationMinutes >= 60) {
    toast.success(`Deep focus achieved! A ${sessionDurationMinutes}-minute session is incredible. Keep that momentum going! 🧠`, { duration: 8000 });
    return;
  }
  
  // Rule 3: Streak milestone encouragement
  if (stats.longest_streak > 0 && stats.longest_streak % 3 === 0) {
    toast.success(`Streak Alert! You've maintained a focus streak for ${stats.longest_streak} days. Consistency is key! 🔑`, { duration: 8000 });
    return;
  }

  // Rule 4: General motivation
  if (levels.total_xp < 500) {
    toast.info(`You are Level ${levels.level}. Every minute counts towards your next title. Keep pushing! 💪`, { duration: 8000 });
    return;
  }
  
  // Rule 5: High level encouragement
  if (levels.level >= 4) {
    toast.info(`As a ${levels.title}. Your focus is legendary. Inspire your peers in the room! ✨`, { duration: 8000 });
    return;
  }
};