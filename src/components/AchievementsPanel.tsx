import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { Progress } from "@/components/ui/progress";

type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];

interface AchievementsPanelProps {
  userId: string;
}

const AchievementsPanel = ({ userId }: AchievementsPanelProps) => {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();

    const channel = supabase
      .channel("user_achievements_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadAchievements = async () => {
    setIsLoading(true);
    // Load all available achievements
    const { data: allData, error: allError } = await supabase
      .from("achievements")
      .select("*")
      .order("name", { ascending: true });

    if (allError) {
      console.error("Error loading all achievements:", allError);
      toast.error("Failed to load achievements list.");
      setIsLoading(false);
      return;
    }
    setAllAchievements(allData || []);

    // Load user's earned achievements
    const { data: userData, error: userError } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId);

    if (userError) {
      console.error("Error loading user achievements:", userError);
      toast.error("Failed to load your earned achievements.");
      setIsLoading(false);
      return;
    }
    setUserAchievements(userData || []);
    setIsLoading(false);
  };

  const getAchievementStatus = (achievement: Achievement) => {
    const earned = userAchievements.some((ua) => ua.achievement_id === achievement.id);
    // For now, we'll just show earned/not earned. Progress tracking would be more complex.
    return { earned, progress: earned ? 100 : 0 };
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Award className="text-primary" />
        My Achievements
      </h3>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Loading achievements...</div>
      ) : allAchievements.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">No achievements defined yet.</div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-2">
          {allAchievements.map((achievement) => {
            const { earned, progress } = getAchievementStatus(achievement);
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-2xl flex items-center gap-4 ${
                  earned ? "bg-success/20 border border-success" : "glass-card"
                }`}
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  <img
                    src={achievement.icon || "/placeholder.svg"}
                    alt={achievement.name}
                    className={`w-full h-full object-cover rounded-full ${
                      earned ? "" : "grayscale opacity-50"
                    }`}
                  />
                  {earned && (
                    <CheckCircle className="absolute -bottom-1 -right-1 w-6 h-6 text-success bg-background rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{achievement.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  <Progress value={progress} className="h-2" />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {earned ? "Earned!" : "Not yet earned"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AchievementsPanel;