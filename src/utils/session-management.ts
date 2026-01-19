import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, getHours } from "date-fns";

const XP_PER_MINUTE = 10;
const CRUNCH_HOUR_MULTIPLIER = 2.5; // 4 AM - 6 AM is 2.5x XP
const STARDUST_PER_POMODORO = 15;

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Aspirant" },
  { level: 2, xp: 1000, title: "Scholar" },
  { level: 3, xp: 3000, title: "Specialist" },
  { level: 4, xp: 6000, title: "Ranker" },
  { level: 5, xp: 10000, title: "Strategist" },
  { level: 6, xp: 15000, title: "Titan" },
  { level: 7, xp: 25000, title: "Legend" },
  { level: 8, xp: 50000, title: "Ascended" },
];

export const getLevelThresholds = () => LEVEL_THRESHOLDS;

export const endFocusSession = async (
  userId: string,
  sessionId: string,
  sessionStartTime: number,
  focusTag: string,
  taskId: string | null
): Promise<{ message: string, durationMinutes: number, focusTag: string }> => {
  const durationMs = Date.now() - sessionStartTime;
  const minutes = Math.floor(durationMs / 60000);
  const currentHour = getHours(new Date());
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  if (minutes < 1) {
    await supabase.from("focus_sessions").delete().eq("id", sessionId);
    return { message: "Session ignored.", durationMinutes: 0, focusTag };
  }

  // 1. Calculate XP with Multipliers
  let multiplier = 1.0;
  if (currentHour >= 4 && currentHour < 7) multiplier = CRUNCH_HOUR_MULTIPLIER;
  
  const xpEarned = Math.floor(minutes * XP_PER_MINUTE * multiplier);
  const stardustEarned = Math.floor(minutes / 25) * STARDUST_PER_POMODORO;

  // 2. Update Session
  await supabase.from("focus_sessions").update({
      end_time: new Date().toISOString(),
      duration_minutes: minutes,
      tag: focusTag || "Deep Focus",
  }).eq("id", sessionId);

  // 3. Update progression
  const { data: levels } = await supabase.from("user_levels").select("*").eq("user_id", userId).maybeSingle();
  const newXP = (levels?.total_xp || 0) + xpEarned;
  
  let newLevel = 1;
  let newTitle = LEVEL_THRESHOLDS[0].title;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (newXP >= LEVEL_THRESHOLDS[i].xp) {
      newLevel = LEVEL_THRESHOLDS[i].level;
      newTitle = LEVEL_THRESHOLDS[i].title;
      break;
    }
  }

  await supabase.from("user_levels").upsert({
    user_id: userId,
    total_xp: newXP,
    level: newLevel,
    title: newTitle,
    stardust: ((levels as any)?.stardust || 0) + stardustEarned
  });

  const crunchMsg = multiplier > 1 ? " | ⚡ CRUNCH HOUR BONUS" : "";
  return { 
    message: `Session Verified: +${xpEarned} XP${crunchMsg}`, 
    durationMinutes: minutes, 
    focusTag 
  };
};

export const getRecentFocusSessions = async (userId: string, range: 'day' | 'week' = 'week') => {
  const startDate = range === 'day' ? subDays(new Date(), 1) : startOfWeek(new Date());
  const { data } = await supabase.from("focus_sessions").select("*").eq("user_id", userId).gte("start_time", startDate.toISOString());
  return (data || []).map(s => ({ totalMinutes: s.duration_minutes || 0, tag: s.tag || "General", startTime: s.start_time }));
};

export const spendXP = async (userId: string, amount: number) => {
  const { data: lvls } = await supabase.from("user_levels").select("total_xp").eq("user_id", userId).single();
  if (!lvls || lvls.total_xp < amount) return false;
  const { error } = await supabase.from("user_levels").update({ total_xp: lvls.total_xp - amount }).eq("user_id", userId);
  return !error;
};

export const spendStardust = async (userId: string, amount: number) => {
  const { data: lvls } = await supabase.from("user_levels").select("stardust").eq("user_id", userId).single();
  const current = (lvls as any)?.stardust || 0;
  if (current < amount) return false;
  const { error } = await supabase.from("user_levels").update({ stardust: current - amount } as any).eq("user_id", userId);
  return !error;
};