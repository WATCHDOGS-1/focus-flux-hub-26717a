import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
type UserChallenge = Database["public"]["Tables"]["user_challenges"]["Row"];

interface ChallengesPanelProps {
  userId: string;
}

const ChallengesPanel = ({ userId }: ChallengesPanelProps) => {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChallenges();

    const channel = supabase
      .channel("user_challenges_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_challenges",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadChallenges = async () => {
    setIsLoading(true);
    const now = new Date().toISOString();

    // Load active challenges
    const { data: activeData, error: activeError } = await supabase
      .from("challenges")
      .select("*")
      .gte("end_date", now)
      .order("start_date", { ascending: true });

    if (activeError) {
      console.error("Error loading active challenges:", activeError);
      toast.error("Failed to load challenges list.");
      setIsLoading(false);
      return;
    }
    setActiveChallenges(activeData || []);

    // Load user's participation in challenges
    const { data: userData, error: userError } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", userId);

    if (userError) {
      console.error("Error loading user challenges:", userError);
      toast.error("Failed to load your challenge progress.");
      setIsLoading(false);
      return;
    }
    setUserChallenges(userData || []);
    setIsLoading(false);
  };

  const handleJoinChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from("user_challenges")
      .insert({ user_id: userId, challenge_id: challengeId, current_progress_minutes: 0 });

    if (error) {
      console.error("Error joining challenge:", error);
      toast.error("Failed to join challenge. You might have already joined.");
    } else {
      toast.success("Challenge joined! Good luck!");
      loadChallenges();
    }
  };

  const getUserChallengeProgress = (challengeId: string, targetMinutes: number) => {
    const userChallenge = userChallenges.find((uc) => uc.challenge_id === challengeId);
    if (!userChallenge) return { joined: false, progress: 0, completed: false };

    const progress = Math.min(
      (userChallenge.current_progress_minutes / targetMinutes) * 100,
      100
    );
    const completed = userChallenge.completed_at !== null;
    return { joined: true, progress, completed, current_progress_minutes: userChallenge.current_progress_minutes };
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Target className="text-primary" />
        Community Challenges
      </h3>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Loading challenges...</div>
      ) : activeChallenges.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">No active challenges right now. Check back later!</div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-2">
          {activeChallenges.map((challenge) => {
            const { joined, progress, completed, current_progress_minutes } = getUserChallengeProgress(challenge.id, challenge.target_minutes);
            const endDate = new Date(challenge.end_date);
            const timeLeft = endDate.getTime() - Date.now();
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

            return (
              <div
                key={challenge.id}
                className={`p-4 rounded-2xl flex flex-col gap-3 ${
                  completed ? "bg-success/20 border border-success" : "glass-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg">{challenge.name}</h4>
                  {completed && (
                    <span className="flex items-center gap-1 text-success font-semibold">
                      <CheckCircle className="w-4 h-4" /> Completed!
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Ends in {daysLeft > 0 ? `${daysLeft} days` : "less than a day"}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progress:</span>
                    <span>{current_progress_minutes || 0} / {challenge.target_minutes} minutes</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                {!joined && (
                  <Button onClick={() => handleJoinChallenge(challenge.id)} className="w-full dopamine-click">
                    Join Challenge
                  </Button>
                )}
                {joined && !completed && (
                    <Button variant="outline" disabled className="w-full">
                        Joined (Keep Focusing!)
                    </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChallengesPanel;