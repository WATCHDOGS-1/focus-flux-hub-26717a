import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface TimeTrackerProps {
  sessionStartTime: number;
  className?: string; // Added className prop
}

const TimeTracker = ({ sessionStartTime, className }: TimeTrackerProps) => {
  const { userId } = useAuth();
  const [sessionTime, setSessionTime] = useState(0);
  const [weeklyTime, setWeeklyTime] = useState(0);

  // Effect for the session timer
  useEffect(() => {
    if (sessionStartTime === 0) {
      setSessionTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionTime(elapsedSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Effect for loading the total weekly time
  useEffect(() => {
    const loadWeeklyTime = async () => {
      if (!userId) return;

      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("weekly_stats")
        .select("total_minutes")
        .eq("user_id", userId)
        .gte("week_start", weekStart.toISOString())
        .maybeSingle();

      if (error) {
        console.error("Error loading weekly time:", error);
      } else if (data) {
        setWeeklyTime(data.total_minutes);
      } else {
        setWeeklyTime(0);
      }
    };

    loadWeeklyTime();
  }, [userId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-6 glass-card px-6 py-3 rounded-2xl", className)}>
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">Session</div>
        <div className="text-3xl font-bold font-mono flex items-center gap-2 text-foreground">
          <Clock className="w-6 h-6 text-primary animate-pulse" />
          {formatTime(sessionTime)}
        </div>
      </div>
      <div className="h-12 w-px bg-border" />
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">This Week</div>
        <div className="text-2xl font-semibold text-accent">
          {weeklyTime}m
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;