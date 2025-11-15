import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const XP_PER_MINUTE = 1;
const DAILY_STREAK_MULTIPLIER = 1.1; // 10% bonus for maintaining a streak

// Simple XP to Level mapping (can be expanded later)
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Novice Monk" },
  { level: 2, xp: 100, title: "Focused Apprentice" },
  { level: 3, xp: 300, title: "Time Bender" },
  { level: 4, xp: 600, title: "Chrono Emperor" },
];

const getTitleByXP = (xp: number) => {
  let title = LEVEL_THRESHOLDS[0].title;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      title = LEVEL_THRESHOLDS[i].title;
      break;
    }
  }
  return title;
};

export const getLevelThresholds = () => LEVEL_THRESHOLDS;

/**
 * Handles all post-session logic: saving session, updating weekly stats,
 * calculating streaks, updating longest session, and calculating XP/levels.
 */
export const endFocusSession = async (
  userId: string,
  sessionId: string,
  sessionStartTime: number,
  focusTag: string
): Promise<{ message: string, durationMinutes: number }> => {
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
  const minutes = Math.floor(sessionDuration / 60);
  const today = new Date();
  const todayISO = format(today, 'yyyy-MM-dd');

  if (minutes < 1) {
    // Save session but skip stats update if duration is too short
    await supabase
      .from("focus_sessions")
      .update({ end_time: new Date().toISOString(), duration_minutes: 0, tag: focusTag || null })
      .eq("id", sessionId);
    return { message: `Session ended. Duration too short to count towards stats.`, durationMinutes: 0 };
  }

  // --- 1. Update Focus Session ---
  const { error: sessionError } = await supabase
    .from("focus_sessions")
    .update({
      end_time: new Date().toISOString(),
      duration_minutes: minutes,
      tag: focusTag || null,
    })
    .eq("id", sessionId);
  if (sessionError) throw new Error("Failed to save session.");

  // --- 2. Fetch Current Stats & Levels ---
  const { data: statsData } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  const { data: levelsData } = await supabase
    .from("user_levels")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // Initialize stats if they don't exist
  const currentStats = statsData || { user_id: userId, longest_streak: 0, longest_session_minutes: 0, total_focused_minutes: 0, last_focused_date: null };
  const currentLevels = levelsData || { user_id: userId, level: 1, total_xp: 0, title: LEVEL_THRESHOLDS[0].title };

  // --- 3. Streak Calculation ---
  let newStreak = currentStats.longest_streak;
  let streakMultiplier = 1;
  const lastFocusedDate = currentStats.last_focused_date ? new Date(currentStats.last_focused_date) : null;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayISO = format(yesterday, 'yyyy-MM-dd');

  if (!lastFocusedDate) {
    // First session ever
    newStreak = 1;
  } else if (format(lastFocusedDate, 'yyyy-MM-dd') === todayISO) {
    // Already focused today, streak remains the same
    newStreak = currentStats.longest_streak;
    streakMultiplier = DAILY_STREAK_MULTIPLIER; // Apply multiplier if continuing streak today
  } else if (format(lastFocusedDate, 'yyyy-MM-dd') === yesterdayISO) {
    // Focused yesterday, streak continues
    newStreak = currentStats.longest_streak + 1;
    streakMultiplier = DAILY_STREAK_MULTIPLIER;
  } else {
    // Streak broken, reset to 1
    newStreak = 1;
  }

  // --- 4. XP Calculation ---
  let xpEarned = minutes * XP_PER_MINUTE;
  xpEarned = Math.floor(xpEarned * streakMultiplier);
  
  const newTotalXP = currentLevels.total_xp + xpEarned;
  const newTitle = getTitleByXP(newTotalXP);
  const newLevel = LEVEL_THRESHOLDS.find(t => t.title === newTitle)?.level || currentLevels.level;

  // --- 5. Update User Stats Table ---
  const updatedStats = {
    longest_streak: Math.max(currentStats.longest_streak, newStreak),
    longest_session_minutes: Math.max(currentStats.longest_session_minutes, minutes),
    total_focused_minutes: currentStats.total_focused_minutes + minutes,
    last_focused_date: todayISO,
  };

  const { error: statsUpdateError } = await supabase
    .from("user_stats")
    .upsert({ user_id: userId, ...updatedStats }, { onConflict: 'user_id' });
  if (statsUpdateError) console.error("Error updating user stats:", statsUpdateError);

  // --- 6. Update User Levels Table ---
  const updatedLevels = {
    total_xp: newTotalXP,
    level: newLevel,
    title: newTitle,
  };

  const { error: levelsUpdateError } = await supabase
    .from("user_levels")
    .upsert({ user_id: userId, ...updatedLevels }, { onConflict: 'user_id' });
  if (levelsUpdateError) console.error("Error updating user levels:", levelsUpdateError);

  // --- 7. Update Weekly Stats (Existing Logic) ---
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data: existingStats } = await supabase
    .from("weekly_stats")
    .select("*")
    .eq("user_id", userId)
    .gte("week_start", weekStart.toISOString())
    .maybeSingle();

  if (existingStats) {
    await supabase
      .from("weekly_stats")
      .update({ total_minutes: existingStats.total_minutes + minutes })
      .eq("id", existingStats.id);
  } else {
    await supabase
      .from("weekly_stats")
      .insert({ user_id: userId, week_start: weekStart.toISOString(), total_minutes: minutes });
  }

  return { message: `Session saved! You focused for ${minutes} minutes and earned ${xpEarned} XP. Current streak: ${newStreak} days.`, durationMinutes: minutes };
};