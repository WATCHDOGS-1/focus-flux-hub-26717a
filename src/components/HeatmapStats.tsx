import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Loader2 } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FocusData {
  date: string; // YYYY-MM-DD
  minutes: number;
}

const HeatmapStats = () => {
  const { userId } = useAuth();
  const [data, setData] = useState<FocusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchFocusData(userId);
    }
  }, [userId]);

  const fetchFocusData = async (uid: string) => {
    setIsLoading(true);
    
    // Fetch data for the last 90 days
    const ninetyDaysAgo = subDays(new Date(), 90);
    const ninetyDaysAgoISO = format(ninetyDaysAgo, 'yyyy-MM-dd');

    const { data: sessions, error } = await supabase
      .from("focus_sessions")
      .select("start_time, duration_minutes")
      .eq("user_id", uid)
      .gte("start_time", ninetyDaysAgoISO)
      .not("duration_minutes", "is", null)
      .gt("duration_minutes", 0);

    if (error) {
      console.error("Error fetching heatmap data:", error);
      setIsLoading(false);
      return;
    }

    // Aggregate minutes by day
    const dailyTotals: { [key: string]: number } = {};
    sessions?.forEach(session => {
      if (session.duration_minutes && session.start_time) {
        const dateKey = format(new Date(session.start_time), 'yyyy-MM-dd');
        dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.duration_minutes;
      }
    });

    // Generate 90 days of data points
    const focusData: FocusData[] = [];
    for (let i = 89; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      focusData.push({
        date: dateKey,
        minutes: dailyTotals[dateKey] || 0,
      });
    }
    
    setData(focusData);
    setIsLoading(false);
  };

  const getColorClass = (minutes: number) => {
    if (minutes === 0) return "bg-secondary/50";
    if (minutes < 25) return "bg-green-500/30";
    if (minutes < 60) return "bg-green-500/50";
    if (minutes < 180) return "bg-green-500/70";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Group data by week (7 days per column)
  const weeks: FocusData[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }
  
  // We only want the last 13 weeks (91 days max)
  const displayWeeks = weeks.slice(-13);

  return (
    <div className="glass-card p-4 rounded-xl space-y-4">
      <h4 className="text-md font-semibold flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Focus Consistency Heatmap (Last 90 Days)
      </h4>
      
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day Labels (Vertical) */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-4 pr-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
        </div>
        
        {/* Heatmap Grid */}
        {displayWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {/* Month Label (Top of the column) */}
            <span className="text-xs text-muted-foreground text-center h-4">
                {/* Only show month label if it's the start of a new month */}
                {weekIndex === 0 || new Date(week[0].date).getDate() <= 7 ? format(new Date(week[0].date), 'MMM') : ''}
            </span>
            {week.map((day, dayIndex) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-sm transition-colors",
                      getColorClass(day.minutes)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="glass-card">
                  <p className="font-semibold">{day.minutes} minutes</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(day.date), 'MMM d, yyyy')}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right">More minutes = darker green.</p>
    </div>
  );
};

export default HeatmapStats;