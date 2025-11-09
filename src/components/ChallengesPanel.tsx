"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, PlusCircle, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
type UserChallenge = Database["public"]["Tables"]["user_challenges"]["Row"];

interface ChallengesPanelProps {
  userId: string;
}

const ChallengesPanel = ({ userId }: ChallengesPanelProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<Map<string, UserChallenge>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
    loadUserChallenges();

    const channel = supabase
      .channel("challenges_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
        },
        () => loadChallenges()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_challenges",
          filter: `user_id=eq.${userId}`,
        },
        () => loadUserChallenges()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Error loading challenges:", error);
      toast.error("Failed to load challenges.");
    } else if (data) {
      setChallenges(data);
    }
    setIsLoading(false);
  };

  const loadUserChallenges = async () => {
    const { data, error } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error loading user challenges:", error);
    } else if (data) {
      const userChallengesMap = new Map(data.map((uc) => [uc.challenge_id, uc]));
      setUserChallenges(userChallengesMap);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("user_challenges")
      .insert({ user_id: userId, challenge_id: challengeId, current_progress_minutes: 0 });

    if (error) {
      console.error("Error joining challenge:", error);
      toast.error("Failed to join challenge.");
    } else {
      toast.success("Challenge joined successfully!");
      loadUserChallenges(); // Reload user challenges to reflect the change
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Target className="text-primary" />
        My Challenges
      </h3>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading challenges...</div>
      ) : challenges.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No challenges defined yet.</div>
      ) : (
        <ScrollArea className="flex-1 pr-2">
          <div className="grid gap-4">
            {challenges.map((challenge) => {
              const userChallenge = userChallenges.get(challenge.id);
              const isJoined = !!userChallenge;
              const isCompleted = isJoined && userChallenge.current_progress_minutes >= challenge.target_minutes;
              const progressPercentage = isJoined
                ? Math.min(100, (userChallenge.current_progress_minutes / challenge.target_minutes) * 100)
                : 0;

              return (
                <Card
                  key={challenge.id}
                  className={`dopamine-click transition-all ${
                    isCompleted ? "border-success/50 bg-success/10 shadow-glow" : "glass-card"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{challenge.name}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Target: {challenge.target_minutes} minutes
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dates: {format(new Date(challenge.start_date), "MMM d")} -{" "}
                      {format(new Date(challenge.end_date), "MMM d, yyyy")}
                    </p>
                    {isJoined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Progress: {userChallenge.current_progress_minutes} / {challenge.target_minutes} minutes</span>
                          <span>{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {!isJoined ? (
                      <Button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="w-full dopamine-click"
                        disabled={isLoading}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Join Challenge
                      </Button>
                    ) : isCompleted ? (
                      <Button variant="success" className="w-full" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed!
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        In Progress
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ChallengesPanel;