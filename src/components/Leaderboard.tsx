import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type WeeklyStat = Database["public"]["Tables"]["weekly_stats"]["Row"] & {
  profiles: {
    username: string;
    profile_photo_url: string | null;
  } | null;
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<WeeklyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();

    const channel = supabase
      .channel("weekly_stats")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_stats",
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    const today = new Date();
    const weekStart = new Date(today); // Create a new Date object from today
    weekStart.setDate(today.getDate() - today.getDay()); // Set it to the start of the week (Sunday)
    weekStart.setHours(0, 0, 0, 0); // Set time to midnight

    const { data, error } = await supabase
      .from("weekly_stats")
      .select(`
        user_id,
        total_minutes,
        profiles (username, profile_photo_url)
      `)
      .gte("week_start", weekStart.toISOString())
      .order("total_minutes", { ascending: false })
      .limit(10);

    if (!error && data) {
      setEntries(data as WeeklyStat[]);
    } else if (error) {
      console.error("Error loading leaderboard:", error);
      // Note: toast is not imported here, relying on global error handling or assuming it's available if needed.
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Trophy className="text-primary animate-pulse" />
        Weekly Leaderboard
      </h3>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">
          No entries yet. Start focusing to get on the leaderboard!
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`p-4 rounded-2xl flex items-center gap-3 dopamine-click hover-lift ${
                index === 0
                  ? "bg-primary/20 border-2 border-primary animate-subtle-pulse"
                  : index === 1
                  ? "bg-primary/10 border border-primary/50"
                  : index === 2
                  ? "bg-primary/5 border border-primary/20"
                  : "glass-card hover:border-primary/50"
              }`}
            >
              <div className="text-3xl font-bold w-10 flex items-center justify-center">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
              </div>
              
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden ring-2 ring-primary/50">
                <span className="text-xl font-bold text-white">
                  {entry.profiles?.username?.[0].toUpperCase()}
                </span>
              </div>

              <div className="flex-1">
                <div className="font-bold text-lg">{entry.profiles?.username || "Unknown"}</div>
                <div className="text-sm text-primary font-semibold">
                  {entry.total_minutes} minutes ⚡
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;