import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type WeeklyStat = Database["public"]["Tables"]["weekly_stats"]["Row"] & {
  profiles: {
    username: string;
    profile_photo_url: string | null;
  } | null;
};

interface LeaderboardProps {
  userId: string;
}

const Leaderboard = ({ userId }: LeaderboardProps) => {
  const [entries, setEntries] = useState<WeeklyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);

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
  }, [userId, showFriendsOnly]); // Re-run when userId or showFriendsOnly changes

  const loadLeaderboard = async () => {
    setIsLoading(true);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let query = supabase
      .from("weekly_stats")
      .select(`
        user_id,
        total_minutes,
        profiles (username, profile_photo_url)
      `)
      .gte("week_start", weekStart.toISOString())
      .order("total_minutes", { ascending: false })
      .limit(10);

    if (showFriendsOnly) {
      // Fetch friend IDs first
      const { data: friendships, error: friendError } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .eq("status", "accepted");

      if (friendError) {
        console.error("Error fetching friendships for leaderboard:", friendError);
        toast.error("Failed to load friends for leaderboard filter.");
        setIsLoading(false);
        return;
      }

      const friendIds = new Set<string>();
      friendships?.forEach(f => {
        if (f.user_id_1 === userId) friendIds.add(f.user_id_2);
        else friendIds.add(f.user_id_1);
      });
      friendIds.add(userId); // Include current user in friends-only view

      if (friendIds.size > 0) {
        query = query.in("user_id", Array.from(friendIds));
      } else {
        // If no friends, show only current user or empty
        query = query.eq("user_id", userId);
      }
    }

    const { data, error } = await query;

    if (!error && data) {
      setEntries(data as WeeklyStat[]);
    } else if (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Failed to load leaderboard data.");
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Trophy className="text-primary animate-pulse" />
        Weekly Leaderboard
      </h3>

      <div className="flex items-center justify-end space-x-2 mb-4">
        <Label htmlFor="friends-only-toggle" className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="w-4 h-4" /> Friends Only
        </Label>
        <Switch
          id="friends-only-toggle"
          checked={showFriendsOnly}
          onCheckedChange={setShowFriendsOnly}
          className="dopamine-click"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">
          No entries yet. Start focusing to get on the leaderboard!
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto pr-2">
          {entries.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`p-4 rounded-2xl flex items-center gap-3 dopamine-click transition-all hover:scale-105 ${
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
                {entry.profiles?.profile_photo_url ? (
                  <img src={entry.profiles.profile_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {entry.profiles?.username?.[0].toUpperCase()}
                  </span>
                )}
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