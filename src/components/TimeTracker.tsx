import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type WeeklyStat = Database["public"]["Tables"]["weekly_stats"]["Row"];

interface TimeTrackerProps {
  userId: string;
  sessionStartTime: number;
}

const TimeTracker = ({ userId, sessionStartTime }: TimeTrackerProps) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [weeklyTime, setWeeklyTime] = useState(0);

  useEffect(() => {
    loadWeeklyTime();

    const interval = setInterval(() => {
      if (sessionStartTime > 0) {
        setSessionTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionStartTime]);

  const loadWeeklyTime = async () => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("weekly_stats")
      .select("total_minutes")
      .eq("user_id", userId)
      .gte("week_start", weekStart.toISOString())
      .maybeSingle();

    if (!error && data) {
      setWeeklyTime(data.total_minutes);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-5 glass-card px-5 py-2.5 rounded-xl shadow-glow">
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-0.5">Session</div>
        <div className="text-xl font-bold font-mono flex items-center gap-1.5 text-foreground">
          <Clock className="w-4 h-4 text-primary" />
          {formatTime(sessionTime)}
        </div>
      </div>
      <div className="h-10 w-px bg-border" />
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-0.5">This Week</div>
        <div className="text-lg font-semibold text-primary">
          {weeklyTime}m
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;