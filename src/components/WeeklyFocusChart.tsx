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
      toast.error("Failed to load focus history.");
      setIsLoading(false);
      return;
    }

    // Aggregate data by day
    const dailyTotals: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const date = subDays(today, 6 - i);
      dailyTotals[format(date, 'EEE')] = 0; // Initialize with 0 minutes
    }

    sessions?.forEach(session => {
      if (session.duration_minutes && session.start_time) {
        const sessionDate = new Date(session.start_time);
        const dayKey = format(sessionDate, 'EEE');
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + session.duration_minutes;
      }
    });

    const chartData: DailyFocusData[] = Object.entries(dailyTotals).map(([day, minutes]) => ({
      day,
      minutes,
    }));
    
    const max = Math.max(...chartData.map(d => d.minutes), 60); // Ensure min max is 60
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
      
      <div className="flex items-end h-32 gap-1 border-b border-l border-border pb-1 pl-1">
        {data.map((item, index) => {
          const heightPct = (item.minutes / maxMinutes) * 100;
          const isToday = index === 6; // Assuming the last item is today

          return (
            <div key={item.day} className="flex flex-col items-center flex-1 h-full group relative">
              {/* Bar */}
              <div 
                className={cn(
                  "w-4 rounded-t-sm transition-all duration-500 ease-out bg-primary/70 hover:bg-primary",
                  isToday && "bg-accent/80 hover:bg-accent"
                )}
                style={{ height: `${heightPct}%` }}
              />
              
              {/* Tooltip/Value */}
              <div className="absolute top-0 -translate-y-full text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {item.minutes}m
              </div>

              {/* Day Label */}
              <span className="text-xs text-muted-foreground mt-1">{item.day}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">Total minutes focused over the last 7 days.</p>
    </div>
  );
};

export default WeeklyFocusChart;