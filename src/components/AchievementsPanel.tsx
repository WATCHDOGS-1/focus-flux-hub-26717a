"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, CheckCircle, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];

interface AchievementsPanelProps {
  userId: string;
}

const AchievementsPanel = ({ userId }: AchievementsPanelProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
    loadUserAchievements();

    const channel = supabase
      .channel("achievements_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "achievements",
        },
        () => loadAchievements()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        () => loadUserAchievements()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadAchievements = async () => {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading achievements:", error);
      toast.error("Failed to load achievements.");
    } else if (data) {
      setAchievements(data);
    }
    setIsLoading(false);
  };

  const loadUserAchievements = async () => {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error loading user achievements:", error);
    } else if (data) {
      setUserAchievements(new Set(data.map((ua) => ua.achievement_id)));
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Award className="text-primary" />
        My Achievements
      </h3>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading achievements...</div>
      ) : achievements.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No achievements defined yet.</div>
      ) : (
        <ScrollArea className="flex-1 pr-2">
          <div className="grid gap-4">
            {achievements.map((achievement) => {
              const isEarned = userAchievements.has(achievement.id);
              return (
                <Card
                  key={achievement.id}
                  className={`dopamine-click transition-all ${
                    isEarned ? "border-primary/50 bg-primary/10 shadow-glow" : "glass-card"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">{achievement.name}</CardTitle>
                    {isEarned && (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        <CheckCircle className="h-4 w-4 mr-1" /> Earned
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{achievement.description}</CardDescription>
                    {/* You might want to display criteria_type and criteria_value here */}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AchievementsPanel;