import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ChevronLeft, ChevronRight, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type WeeklyStat = Database["public"]["Tables"]["weekly_stats"]["Row"] & {
  profiles: {
    username: string;
    profile_photo_url: string | null;
  } | null;
};

const PAGE_SIZE = 10;

interface LeaderboardProps {
  onProfileClick: (userId: string) => void;
}

const Leaderboard = ({ onProfileClick }: LeaderboardProps) => {
  const { userId } = useAuth();
  const [entries, setEntries] = useState<WeeklyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed page
  const [totalCount, setTotalCount] = useState(0);
  const [userRank, setUserRank] = useState<{ rank: number; page: number } | null>(null);

  useEffect(() => {
    loadLeaderboard(currentPage);

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
          loadLeaderboard(currentPage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage]);

  const getWeekStartISO = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString();
  };

  const loadLeaderboard = async (page: number) => {
    setIsLoading(true);
    const weekStart = getWeekStartISO();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // 1. Fetch Paginated Data
    const { data, error, count } = await supabase
      .from("weekly_stats")
      .select(
        `
        user_id,
        total_minutes,
        profiles (username, profile_photo_url)
      `,
        { count: "exact" }
      )
      .gte("week_start", weekStart)
      .order("total_minutes", { ascending: false })
      .range(from, to);

    if (!error && data) {
      setEntries(data as WeeklyStat[]);
      setTotalCount(count || 0);
    } else if (error) {
      console.error("Error loading leaderboard:", error);
      toast.error(`Failed to load leaderboard data: ${error.message}`);
    }
    setIsLoading(false);
  };

  const goToMyRank = async () => {
    if (!userId) {
      toast.info("Please log in to see your rank.");
      return;
    }

    setIsLoading(true);
    const weekStart = getWeekStartISO();

    // 1. Fetch all weekly stats for ranking calculation
    const { data, error } = await supabase
      .from("weekly_stats")
      .select("user_id, total_minutes")
      .gte("week_start", weekStart)
      .order("total_minutes", { ascending: false });

    setIsLoading(false);

    if (error || !data) {
      console.error("Error fetching all stats for rank:", error);
      toast.error(`Failed to determine your rank: ${error?.message || 'Unknown error'}`);
      return;
    }

    // 2. Calculate rank (1-indexed)
    const userIndex = data.findIndex(entry => entry.user_id === userId);
    
    if (userIndex === -1) {
      toast.info("You haven't logged any focus time this week yet.");
      setUserRank(null);
      return;
    }

    const rank = userIndex + 1;
    const page = Math.floor(userIndex / PAGE_SIZE);
    
    setUserRank({ rank, page });
    setCurrentPage(page); // This triggers a re-fetch of the correct page
    toast.success(`Found your rank: #${rank}`);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Trophy className="text-primary animate-pulse" />
        Weekly Leaderboard
      </h3>

      <Button 
        onClick={goToMyRank} 
        variant="outline" 
        className="w-full mb-4 dopamine-click"
        disabled={isLoading}
      >
        <User className="w-4 h-4 mr-2" />
        {userRank ? `My Rank: #${userRank.rank}` : "Go to My Rank"}
      </Button>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">
          No entries yet. Start focusing to get on the leaderboard!
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {entries.map((entry, index) => {
            const globalRank = currentPage * PAGE_SIZE + index + 1;
            const isCurrentUser = entry.user_id === userId;
            
            return (
              <div
                key={entry.user_id}
                className={`p-4 rounded-2xl flex items-center gap-3 dopamine-click hover-lift cursor-pointer ${
                  globalRank === 1
                    ? "bg-primary/20 border-2 border-primary animate-subtle-pulse"
                    : globalRank === 2
                    ? "bg-primary/10 border border-primary/50"
                    : globalRank === 3
                    ? "bg-primary/5 border border-primary/20"
                    : "glass-card hover:border-primary/50"
                } ${isCurrentUser ? 'ring-2 ring-accent' : ''}`}
                onClick={() => onProfileClick(entry.user_id)}
              >
                <div className="text-3xl font-bold w-10 flex items-center justify-center">
                  {globalRank === 1 ? "🥇" : globalRank === 2 ? "🥈" : globalRank === 3 ? "🥉" : `${globalRank}`}
                </div>
                
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden ring-2 ring-primary/50">
                  <span className="text-xl font-bold text-white">
                    {entry.profiles?.username?.[0]?.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="font-bold text-lg">{entry.profiles?.username || "Unknown"}</div>
                  <div className="text-sm text-primary font-semibold">
                    {entry.total_minutes} minutes ⚡
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0 || isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({totalCount} users)
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1 || isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;