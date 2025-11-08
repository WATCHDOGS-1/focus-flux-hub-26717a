import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type WeeklyStat = Database["public"]["Tables"]["weekly_stats"]["Row"] & {
  profiles: {
    username: string;
    profile_photo_url: string | null;
  } | null;
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<WeeklyStat[]>([]);

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
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    weekStart.setHours(0, 0, 0, 0);

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
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
        <Trophy className="text-primary" size={20} />
        Weekly Leaderboard
      </h3>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`p-3 rounded-xl flex items-center gap-3 dopamine-click transition-all hover:scale-[1.02] ${
              index === 0
                ? "bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/20 shadow-glow"
                : index === 1
                ? "bg-gradient-to-r from-secondary/15 to-primary/5 border border-secondary/20"
                : index === 2
                ? "bg-gradient-to-r from-accent/15 to-secondary/5 border border-accent/20"
                : "glass-card hover:shadow-neon"
            }`}
          >
            <div className="text-lg font-bold w-8 flex items-center justify-center">
              {index === 0 ? (
                <Medal className="text-yellow-500" size={20} />
              ) : index === 1 ? (
                <Medal className="text-gray-400" size={20} />
              ) : index === 2 ? (
                <Medal className="text-amber-700" size={20} />
              ) : (
                `${index + 1}`
              )}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden ring-1 ring-primary/20">
              {entry.profiles?.profile_photo_url ? (
                <img src={entry.profiles.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">
                  {entry.profiles?.username?.[0].toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="font-medium">{entry.profiles?.username || "Unknown"}</div>
              <div className="text-sm text-primary font-medium">
                {entry.total_minutes} minutes
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;