import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const XP_PER_MINUTE = 10;
const STARDUST_PER_POMODORO = 10;

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
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  if (minutes < 1) {
    await supabase.from("focus_sessions").delete().eq("id", sessionId);
    return { message: "Session too short to save.", durationMinutes: 0, focusTag };
  }

  // 1. Update the core session record
  const { error: sessionError } = await supabase
    .from("focus_sessions")
    .update({
      end_time: new Date().toISOString(),
      duration_minutes: minutes,
      tag: focusTag || "Deep Focus",
    })
    .eq("id", sessionId);
    
  if (sessionError) throw new Error("Database session update failed: " + sessionError.message);

  // 2. Fetch current progression state
  const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  const { data: levels } = await supabase.from("user_levels").select("*").eq("user_id", userId).maybeSingle();
  
  const xpEarned = minutes * XP_PER_MINUTE;
  const stardustEarned = Math.floor(minutes / 25) * STARDUST_PER_POMODORO;
  
  const newXP = (levels?.total_xp || 0) + xpEarned;
  
  // Calculate Title/Level
  let newTitle = LEVEL_THRESHOLDS[0].title;
  let newLevel = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (newXP >= LEVEL_THRESHOLDS[i].xp) {
      newTitle = LEVEL_THRESHOLDS[i].title;
      newLevel = LEVEL_THRESHOLDS[i].level;
      break;
    }
  }

  // 3. Upsert cumulative stats
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

  return { 
    message: `Cognitive Cycle Verified: +${xpEarned} XP`, 
    durationMinutes: minutes, 
    focusTag 
  };
};