import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, subMonths } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

const XP_PER_MINUTE = 10;
const DAILY_STREAK_MULTIPLIER = 1.2;
const STARDUST_PER_POMODORO = 10; // 10 Stardust for every 25 minutes

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

export const endFocusSession = async (
  userId: string,
  sessionId: string,
  sessionStartTime: number,
  focusTag: string,
  taskId: string | null
): Promise<{ message: string, durationMinutes: number, focusTag: string }> => {
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
  const minutes = Math.floor(sessionDuration / 60);
  const today = new Date();
  const todayISO = format(today, 'yyyy-MM-dd');

  if (minutes < 1) {
    await supabase.from("focus_sessions").delete().eq("id", sessionId);
    return { message: "Session too short to save.", durationMinutes: 0, focusTag };
  }

  // 1. Update Session Record
  const { error: sessionError } = await supabase
    .from("focus_sessions")
    .update({
      end_time: new Date().toISOString(),
      duration_minutes: minutes,
      tag: focusTag || "General Focus",
    })
    .eq("id", sessionId);
    
  if (sessionError) throw sessionError;

  // 2. Calculate XP and Stardust
  const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  const { data: levels } = await supabase.from("user_levels").select("*").eq("user_id", userId).maybeSingle();
  
  const xpEarned = minutes * XP_PER_MINUTE;
  const stardustEarned = Math.floor(minutes / 25) * STARDUST_PER_POMODORO;
  
  const newXP = (levels?.total_xp || 0) + xpEarned;
  const newTitle = getTitleByXP(newXP);
  const newLevel = LEVEL_THRESHOLDS.find(t => t.title === newTitle)?.level || 1;

  // 3. Upsert Stats & Levels
  await supabase.from("user_stats").upsert({
    user_id: userId,
    total_focused_minutes: (stats?.total_focused_minutes || 0) + minutes,
    last_focused_date: todayISO,
    longest_session_minutes: Math.max(stats?.longest_session_minutes || 0, minutes),
  });

  await supabase.from("user_levels").upsert({
    user_id: userId,
    total_xp: newXP,
    level: newLevel,
    title: newTitle,
    stardust: ((levels as any)?.stardust || 0) + stardustEarned
  });

  // 4. Update Weekly Stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartISO = format(weekStart, 'yyyy-MM-dd');

  const { data: weekly } = await supabase.from("weekly_stats").select("*").eq("user_id", userId).eq("week_start", weekStartISO).maybeSingle();
  
  if (weekly) {
    await supabase.from("weekly_stats").update({ total_minutes: weekly.total_minutes + minutes }).eq("id", weekly.id);
  } else {
    await supabase.from("weekly_stats").insert({ user_id: userId, week_start: weekStartISO, total_minutes: minutes });
  }

  return { 
    message: `Flow Saved! +${xpEarned} XP, +${stardustEarned} Stardust.`, 
    durationMinutes: minutes, 
    focusTag 
  };
};

export const spendStardust = async (userId: string, amount: number): Promise<boolean> => {
  const { data } = await supabase.from("user_levels").select("stardust").eq("user_id", userId).single();
  const current = (data as any)?.stardust || 0;
  if (current < amount) return false;
  
  const { error } = await supabase.from("user_levels").update({ stardust: current - amount }).eq("user_id", userId);
  return !error;
};

export const spendXP = async (userId: string, amount: number): Promise<boolean> => {
  const { data } = await supabase.from("user_levels").select("total_xp").eq("user_id", userId).single();
  const current = data?.total_xp || 0;
  if (current < amount) return false;
  
  const newXP = current - amount;
  const newTitle = getTitleByXP(newXP);
  const newLevel = LEVEL_THRESHOLDS.find(t => t.title === newTitle)?.level || 1;
  
  const { error } = await supabase.from("user_levels").update({ total_xp: newXP, title: newTitle, level: newLevel }).eq("user_id", userId);
  return !error;
};

export const getRecentFocusSessions = async (userId: string, range: 'day' | 'week' | 'month') => {
    const { data } = await supabase.from("focus_sessions").select("*").eq("user_id", userId).not("duration_minutes", "is", null);
    return data?.map(s => ({ tag: s.tag || "Focus", totalMinutes: s.duration_minutes || 0 })) || [];
};