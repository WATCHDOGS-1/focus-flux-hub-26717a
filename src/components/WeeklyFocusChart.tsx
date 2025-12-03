import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DailyFocusData {
  day: string;
  minutes: number;
}

const WeeklyFocusChart = () => {
  const { userId } = useAuth();
  const [data, setData] = useState<DailyFocusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxMinutes, setMaxMinutes] = useState(0);

  useEffect(() => {
    if (!userId) return;
    fetchWeeklyData(userId);
  }, [userId]);

  const fetchWeeklyData = async (uid: string) => {
    setIsLoading(true);
    
    const today = new Date();
    // Get the start of the 7-day period (6 days before today)
    const sevenDaysAgo = subDays(today, 6);
    const sevenDaysAgoISO = format(sevenDaysAgo, 'yyyy-MM-dd');

    // Fetch all focus sessions for the last 7 days
    const { data: sessions, error } = await supabase
      .from("focus_sessions")
      .select("start_time, duration_minutes")
      .eq("user_id", uid)
      .gte("start_time", sevenDaysAgoISO);

    if (error) {
      console.error("Error fetching weekly focus data:", error);
      toast.error(`Failed to load focus history: ${error.message}`);
      setIsLoading(false);
      return;
    }

    // Aggregate data by day
    const dailyTotals: { [key: string]: number } = {};
    const dayKeys: string[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = subDays(today, 6 - i);
      const dayKey = format(date, 'EEE');
      dailyTotals[dayKey] = 0; // Initialize with 0 minutes
      dayKeys.push(dayKey);
    }

    sessions?.forEach(session => {
      if (session.duration_minutes && session.start_time) {
        const sessionDate = new Date(session.start_time);
        const dayKey = format(sessionDate, 'EEE');
        // Only count if the day key is one of the last 7 days
        if (dailyTotals.hasOwnProperty(dayKey)) {
            dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + session.duration_minutes;
        }
      }
    });

    const chartData: DailyFocusData[] = dayKeys.map(day => ({
      day,
      minutes: dailyTotals[day] || 0,
    }));
    
    // Calculate max minutes, ensuring a minimum scale for visibility (e.g., 120 minutes)
    const max = Math.max(...chartData.map(d => d.minutes), 120); 
    setMaxMinutes(max);
    setData(chartData);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold flex items-center gap-2">
        <BarChart className="w-4 h-4 text-primary" />
        Weekly Focus History
      </h4>
      
      <div className="flex flex-col h-32 border-b border-border">
        {/* Bar Container (grows upwards) */}
        <div className="flex items-end flex-1 h-full gap-1 pb-1">
          {data.map((item, index) => {
            const heightPct = (item.minutes / maxMinutes) * 100;
            const isToday = index === 6; // The last item is today

            return (
              <div key={item.day} className="flex flex-col items-center flex-1 h-full group relative justify-end">
                {/* Bar */}
                <div 
                  className={cn(
                    "w-4 rounded-t-sm transition-all duration-500 ease-out shadow-md",
                    item.minutes > 0 ? "bg-primary/70 hover:bg-primary" : "bg-muted/50",
                    isToday && item.minutes > 0 && "bg-accent/80 hover:bg-accent shadow-accent/50"
                  )}
                  style={{ height: `${heightPct}%` }}
                />
                
                {/* Tooltip/Value (Above the bar) */}
                <div className="absolute bottom-full mb-1 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.minutes}m
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Day Labels (Below the axis) */}
        <div className="flex justify-between gap-1 pt-1">
            {data.map((item, index) => {
                const isToday = index === 6;
                return (
                    <span 
                        key={item.day} 
                        className={cn(
                            "text-xs text-muted-foreground flex-1 text-center",
                            isToday && "font-semibold text-accent"
                        )}
                    >
                        {item.day}
                    </span>
                );
            })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">Total minutes focused over the last 7 days.</p>
    </div>
  );
};

export default WeeklyFocusChart;