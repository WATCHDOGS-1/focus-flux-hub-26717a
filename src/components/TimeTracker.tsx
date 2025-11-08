import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

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

    const { data } = await supabase
      .from("weekly_stats")
      .select("total_minutes")
      .eq("user_id", userId)
      .gte("week_start", weekStart.toISOString())
      .maybeSingle();

    if (data) {
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
    <div className="flex items-center gap-6 glass-card px-6 py-3 rounded-2xl shadow-glow">
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">Session</div>
        <div className="text-3xl font-bold font-mono flex items-center gap-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          <Clock className="w-6 h-6 text-primary animate-pulse" />
          {formatTime(sessionTime)}
        </div>
      </div>
      <div className="h-12 w-1 bg-gradient-to-b from-primary via-secondary to-accent rounded-full" />
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">This Week</div>
        <div className="text-2xl font-semibold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          {weeklyTime}m
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
