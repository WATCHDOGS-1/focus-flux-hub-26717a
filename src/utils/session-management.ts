import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, subMonths } from "date-fns";
import type { Database } from "@/integrations/supabase/types"; // Ensure Database type is imported

const XP_PER_MINUTE = 10; // Increased from 1 to 10
const DAILY_STREAK_MULTIPLIER = 1.2; // 20% bonus for maintaining a streak
const STARDUST_PER_POMODORO = 10; // 10 Stardust for every 25 minutes

// Simple XP to Level mapping (can be expanded later)
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Novice" },
  { level: 2, xp: 500, title: "Apprentice" },
  { level: 3, xp: 1500, title: "Adept" },
  { level: 4, xp: 3000, title: "Expert" },
  { level: 5, xp: 5000, title: "Master" },
  { level: 6, xp: 8000, title: "Grandmaster" },
  { level: 7, xp: 12000, title: "Legend" },
  { level: 8, xp: 20000, title: "Ascended" },
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
 * Fetches and aggregates focus session data for a given time range, grouped by tag.
 * @param userId The user ID.
 * @param range 'day', 'week', or 'month'.
 */
export const getRecentFocusSessions = async (userId: string, range: 'day' | 'week' | 'month' = 'week'): Promise<{ tag: string, totalMinutes: number }[]> => {
  const today = new Date();
  let startDate: Date;

  switch (range) {
    case 'day':
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = subDays(today, 7);
      break;
    case 'month':
      startDate = subMonths(today, 1);
      break;
    default:
      startDate = subDays(today, 7);
  }
  
  const startDateISO = format(startDate, 'yyyy-MM-dd');

  const { data: sessions, error } = await supabase
    .from("focus_sessions")
    .select("duration_minutes, tag")
    .eq("user_id", userId)
    .gte("start_time", startDateISO)
    .not("duration_minutes", "is", null)
    .gt("duration_minutes", 0);

  if (error) {
    console.error(`Error fetching focus sessions for ${range}:`, error);
    return [];
  }

  const aggregatedData: { [tag: string]: number } = {};

  sessions?.forEach(session => {
    const tag = session.tag || "General Focus";
    const minutes = session.duration_minutes || 0;
    aggregatedData[tag] = (aggregatedData[tag] || 0) + minutes;
  });

  return Object.entries(aggregatedData).map(([tag, totalMinutes]) => ({
    tag,
    totalMinutes,
  }));
};

/**
 * Simulates spending Stardust by updating localStorage.
 */
export const spendStardust = async (userId: string, amount: number): Promise<boolean> => {
  const currentStardust = parseInt(localStorage.getItem(`stardust_${userId}`) || '0');
  
  if (currentStardust < amount) {
    return false;
  }
  
  const newStardust = currentStardust - amount;
  localStorage.setItem(`stardust_${userId}`, newStardust.toString());
  return true;
};


/**
 * Handles all post-session logic: saving session, updating weekly stats,
 * calculating streaks, updating longest session, and calculating XP/levels/Stardust.
 */
export const endFocusSession = async (
  userId: string,
  sessionId: string,
  sessionStartTime: number,
  focusTag: string
): Promise<{ message: string, durationMinutes: number, focusTag: string }> => {
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
    return { message: `Session ended. Duration too short to count towards stats.`, durationMinutes: 0, focusTag };
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

  // --- 2. Fetch Current Stats & Levels & Profile (for Class) ---
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

  const { data: profileData } = await supabase
    .from("profiles")
    .select("interests")
    .eq("id", userId)
    .single();

  // Initialize stats if they don't exist
  const currentStats = statsData || { user_id: userId, longest_streak: 0, longest_session_minutes: 0, total_focused_minutes: 0, last_focused_date: null };
  const currentLevels = levelsData || { user_id: userId, level: 1, total_xp: 0, title: LEVEL_THRESHOLDS[0].title };
  const userClass = (profileData?.interests as any)?.focus_class || "None";

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

  // --- 4. XP Calculation with Class Bonuses ---
  let xpEarned = minutes * XP_PER_MINUTE;

  // Apply Streak Multiplier
  if (newStreak > 1) {
    xpEarned = Math.floor(xpEarned * streakMultiplier);
  }

  // Apply Class Multipliers
  let bonusDescription = "";
  if (userClass === "Monk" && minutes >= 45) {
    xpEarned = Math.floor(xpEarned * 1.5); // 50% bonus for long sessions
    bonusDescription = " (Monk Bonus!)";
  } else if (userClass === "Sprinter" && minutes < 30) {
    xpEarned = Math.floor(xpEarned * 1.2); // 20% bonus for short sessions
    bonusDescription = " (Sprinter Bonus!)";
  } else if (userClass === "Scholar" && newStreak >= 3) {
    xpEarned = Math.floor(xpEarned * 1.3); // 30% bonus for streaks > 3
    bonusDescription = " (Scholar Bonus!)";
  }

  const newTotalXP = currentLevels.total_xp + xpEarned;
  const newTitle = getTitleByXP(newTotalXP);
  const newLevel = LEVEL_THRESHOLDS.find(t => t.title === newTitle)?.level || currentLevels.level;
  
  // --- 5. Stardust Calculation ---
  const pomodorosCompleted = Math.floor(minutes / 25);
  const stardustEarned = pomodorosCompleted * STARDUST_PER_POMODORO;
  
  // Mock: Update Stardust in localStorage
  const currentStardust = parseInt(localStorage.getItem(`stardust_${userId}`) || '0');
  const finalStardust = currentStardust + stardustEarned;
  localStorage.setItem(`stardust_${userId}`, finalStardust.toString());


  // --- 6. Update User Stats Table ---
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

  // --- 7. Update User Levels Table ---
  const updatedLevels = {
    total_xp: newTotalXP,
    level: newLevel,
    title: newTitle,
  };

  const { error: levelsUpdateError } = await supabase
    .from("user_levels")
    .upsert({ user_id: userId, ...updatedLevels }, { onConflict: 'user_id' });
  if (levelsUpdateError) console.error("Error updating user levels:", levelsUpdateError);

  // --- 8. Update Weekly Stats (Existing Logic) ---
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
  
  // --- 9. Create Feed Item (Only if session >= 30 minutes) ---
  if (minutes >= 30) {
    const feedItemData = {
      duration: minutes,
      tag: focusTag || "General Focus",
    };
    
    const { error: feedError } = await supabase
      .from("feed_items")
      .insert({
        user_id: userId,
        type: 'session_completed',
        data: feedItemData,
      });
      
    if (feedError) console.error("Error creating feed item:", feedError);
  }

  return { message: `Session saved! +${xpEarned} XP${bonusDescription}, +${stardustEarned} Stardust. Streak: ${newStreak} days.`, durationMinutes: minutes, focusTag };
};