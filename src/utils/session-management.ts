import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, subMonths } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

const XP_PER_MINUTE = 10;
const DAILY_STREAK_MULTIPLIER = 1.2;
const STARDUST_PER_POMODORO = 10;

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Citadel Outpost" },
  { level: 2, xp: 500, title: "Adept Shinobi" },
  { level: 3, xp: 1500, title: "Focus Samurai" },
  { level: 4, xp: 3000, title: "Zen Shogun" },
  { level: 5, xp: 5000, title: "Imperial Architect" },
  { level: 6, xp: 8000, title: "Celestial Ronin" },
  { level: 7, xp: 12000, title: "Cosmic Daimyo" },
  { level: 8, xp: 20000, title: "Ascended Emperor" },
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

export const getRecentFocusSessions = async (userId: string, range: 'day' | 'week' | 'month' = 'week'): Promise<{ tag: string, totalMinutes: number }[]> => {
  const today = new Date();
  let startDate: Date;

  switch (range) {
    case 'day': startDate = new Date(today); startDate.setHours(0, 0, 0, 0); break;
    case 'week': startDate = subDays(today, 7); break;
    case 'month': startDate = subMonths(today, 1); break;
    default: startDate = subDays(today, 7);
  }
  
  const startDateISO = format(startDate, 'yyyy-MM-dd');
  const { data: sessions, error } = await supabase.from("focus_sessions").select("duration_minutes, tag").eq("user_id", userId).gte("start_time", startDateISO).not("duration_minutes", "is", null).gt("duration_minutes", 0);
  if (error) return [];

  const aggregatedData: { [tag: string]: number } = {};
  sessions?.forEach(session => {
    const tag = session.tag || "General Focus";
    const minutes = session.duration_minutes || 0;
    aggregatedData[tag] = (aggregatedData[tag] || 0) + minutes;
  });

  return Object.entries(aggregatedData).map(([tag, totalMinutes]) => ({ tag, totalMinutes }));
};

export const spendStardust = async (userId: string, amount: number): Promise<boolean> => {
  const currentStardust = parseInt(localStorage.getItem(`stardust_${userId}`) || '0');
  if (currentStardust < amount) return false;
  localStorage.setItem(`stardust_${userId}`, (currentStardust - amount).toString());
  return true;
};

export const spendXP = async (userId: string, amount: number): Promise<boolean> => {
    const { data: levelsData, error: fetchError } = await supabase.from("user_levels").select("total_xp").eq("user_id", userId).maybeSingle();
    if (fetchError) return false;
    const currentXP = levelsData?.total_xp || 0;
    if (currentXP < amount) return false;

    const newTotalXP = currentXP - amount;
    const newTitle = getTitleByXP(newTotalXP);
    const newLevel = LEVEL_THRESHOLDS.find(t => t.title === newTitle)?.level || 1;

    const { error: updateError } = await supabase.from("user_levels").update({ total_xp: newTotalXP, level: newLevel, title: newTitle }).eq("user_id", userId);
    return !updateError;
};

export const endFocusSession = async (userId: string, sessionId: string, sessionStartTime: number, focusTag: string): Promise<{ message: string, durationMinutes: number, focusTag: string }> => {
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
  const minutes = Math.floor(sessionDuration / 60);
  const today = new Date();
  const todayISO = format(today, 'yyyy-MM-dd');

  if (minutes < 1) {
    await supabase.from("focus_sessions").update({ end_time: new Date().toISOString(), duration_minutes: 0, tag: focusTag || null }).eq("id", sessionId);
    return { message: `Session ended. Duration too short to count.`, durationMinutes: 0, focusTag };
  }

  await supabase.from("focus_sessions").update({ end_time: new Date().toISOString(), duration_minutes: minutes, tag: focusTag || null }).eq("id", sessionId);
  const { data: statsData } = await supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  const { data: levelsData } = await supabase.from("user_levels").select("*").eq("user_id", userId).maybeSingle();
  const { data: profileData } = await supabase.from("profiles").select("interests").eq("id", userId).single();

  const currentStats = statsData || { user_id: userId, longest_streak: 0, longest_session_minutes: 0, total_focused_minutes: 0, last_focused_date: null };
  const currentLevels = levelsData || { user_id: userId, level: 1, total_xp: 0, title: LEVEL_THRESHOLDS[0].title };
  const userClass = (profileData?.interests as any)?.focus_class || "None";

  let newStreak = currentStats.longest_streak;
  let streakMultiplier = 1;
  const lastFocusedDate = currentStats.last_focused_date ? new Date(currentStats.last_focused_date) : null;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayISO = format(yesterday, 'yyyy-MM-dd');

  if (!lastFocusedDate) newStreak = 1;
  else if (format(lastFocusedDate, 'yyyy-MM-dd') === todayISO) streakMultiplier = DAILY_STREAK_MULTIPLIER;
  else if (format(lastFocusedDate, 'yyyy-MM-dd') === yesterdayISO) { newStreak = currentStats.longest_streak + 1; streakMultiplier = DAILY_STREAK_MULTIPLIER; }
  else newStreak = 1;

  let xpEarned = minutes * XP_PER_MINUTE;
  if (newStreak > 1) xpEarned = Math.floor(xpEarned * streakMultiplier);

  let bonusDescription = "";
  if (userClass === "Monk" && minutes >= 45) { xpEarned = Math.floor(xpEarned * 1.5); bonusDescription = " (Monk Bonus!)"; }
  else if (userClass === "Sprinter" && minutes < 30) { xpEarned = Math.floor(xpEarned * 1.2); bonusDescription = " (Sprinter Bonus!)"; }
  else if (userClass === "Scholar" && newStreak >= 3) { xpEarned = Math.floor(xpEarned * 1.3); bonusDescription = " (Scholar Bonus!)"; }

  const newTotalXP = currentLevels.total_xp + xpEarned;
  const newTitle = getTitleByXP(newTotalXP);
  const newLevel = LEVEL_THRESHOLDS.find(t => t.title === newTitle)?.level || currentLevels.level;
  
  const stardustEarned = Math.floor(minutes / 25) * STARDUST_PER_POMODORO;
  const currentStardust = parseInt(localStorage.getItem(`stardust_${userId}`) || '0');
  localStorage.setItem(`stardust_${userId}`, (currentStardust + stardustEarned).toString());

  await supabase.from("user_stats").upsert({ user_id: userId, longest_streak: Math.max(currentStats.longest_streak, newStreak), longest_session_minutes: Math.max(currentStats.longest_session_minutes, minutes), total_focused_minutes: currentStats.total_focused_minutes + minutes, last_focused_date: todayISO }, { onConflict: 'user_id' });
  await supabase.from("user_levels").upsert({ user_id: userId, total_xp: newTotalXP, level: newLevel, title: newTitle }, { onConflict: 'user_id' });

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data: existingStats } = await supabase.from("weekly_stats").select("*").eq("user_id", userId).gte("week_start", weekStart.toISOString()).maybeSingle();
  if (existingStats) await supabase.from("weekly_stats").update({ total_minutes: existingStats.total_minutes + minutes }).eq("id", existingStats.id);
  else await supabase.from("weekly_stats").insert({ user_id: userId, week_start: weekStart.toISOString(), total_minutes: minutes });
  
  if (minutes >= 30) await supabase.from("feed_items").insert({ user_id: userId, type: 'session_completed', data: { duration: minutes, tag: focusTag || "General Focus" } });

  return { message: `Session saved! +${xpEarned} XP${bonusDescription}, +${stardustEarned} Stardust. Streak: ${newStreak} days.`, durationMinutes: minutes, focusTag };
};