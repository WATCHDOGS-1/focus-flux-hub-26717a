import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTasks } from "@/hooks/use-tasks";
import { generateDailyQuests, Quest } from "@/utils/gamification";
import { Zap, Star, CheckCircle, Clock, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CLAIMED_QUESTS_KEY = "claimed_daily_quests";

const QuestSystemPanel = () => {
    const { tasks } = useTasks();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Load claimed IDs from local storage on mount
        const storedClaims = localStorage.getItem(CLAIMED_QUESTS_KEY);
        if (storedClaims) {
            try {
                setClaimedIds(new Set(JSON.parse(storedClaims)));
            } catch (e) {
                console.error("Failed to parse claimed quests from local storage:", e);
            }
        }
    }, []);

    useEffect(() => {
        // Simulate loading/checking external stats (like total poms logged today)
        setIsLoading(true);
        const generatedQuests = generateDailyQuests(tasks);
        
        // Mock update for external tracking (Pomodoro/Streak)
        const updatedQuests = generatedQuests.map(quest => {
            // Check if already claimed
            const isClaimed = claimedIds.has(quest.id);
            
            if (isClaimed) {
                return { ...quest, isCompleted: true, isClaimed: true };
            }
            
            // Mock update for completion status
            if (quest.type === 'pomodoro_goal') {
                // Mock: Assume 2 poms logged today
                return { ...quest, currentCount: 2, isCompleted: 2 >= quest.targetCount };
            }
            if (quest.type === 'streak_maintenance') {
                // Mock: Assume streak is maintained
                return { ...quest, currentCount: 1, isCompleted: true };
            }
            return quest;
        });
        
        setQuests(updatedQuests);
        setIsLoading(false);
    }, [tasks, claimedIds]); // Depend on claimedIds to re-evaluate quests

    const handleClaimReward = (questId: string) => {
        // 1. Check if already claimed (client-side check)
        if (claimedIds.has(questId)) {
            toast.warning("Reward already claimed.");
            return;
        }
        
        // NOTE: In a real app, this would call a Supabase RPC function to verify completion,
        // grant XP/Stardust, and mark the quest as claimed in the database.
        
        toast.success("Quest rewards claimed! +XP and Stardust added to your planet.");
        
        // 2. Update local storage and state to prevent infinite claiming
        setClaimedIds(prev => {
            const newSet = new Set(prev);
            newSet.add(questId);
            localStorage.setItem(CLAIMED_QUESTS_KEY, JSON.stringify(Array.from(newSet)));
            return newSet;
        });
        
        // 3. Mark as claimed in local state (will trigger useEffect re-run)
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: true } : q));
    };

    if (isLoading) {
        return (
            <Card className="glass-card p-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading Quests...
            </Card>
        );
    }

    const activeQuests = quests.filter(q => !q.isCompleted && !q.isClaimed);
    const completedQuests = quests.filter(q => q.isCompleted && !q.isClaimed);

    return (
        <Card className="glass-card p-4 rounded-xl space-y-4">
            <CardHeader className="p-0 pb-2 border-b border-border">
                <CardTitle className="text-xl flex items-center gap-2 text-accent">
                    <Star className="w-6 h-6" /> Daily Quests ({activeQuests.length + completedQuests.length})
                </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 space-y-3">
                {activeQuests.length === 0 && completedQuests.length === 0 && (
                    <p className="text-muted-foreground text-center">No quests generated yet. Add some tasks to your Kanban board!</p>
                )}
                
                {/* Active Quests */}
                {activeQuests.map(quest => {
                    const progress = (quest.currentCount / quest.targetCount) * 100;
                    return (
                        <div key={quest.id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                            <div className="font-semibold text-sm flex items-center justify-between">
                                <span>{quest.title}</span>
                                <span className="text-xs text-primary flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> {quest.rewardXP} XP
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{quest.description}</p>
                            <div className="flex items-center gap-2">
                                <Progress value={progress} className="h-2 flex-1" />
                                <span className="text-xs font-mono">{quest.currentCount}/{quest.targetCount}</span>
                            </div>
                        </div>
                    );
                })}
                
                {/* Completed Quests */}
                {completedQuests.length > 0 && (
                    <div className="pt-4 border-t border-border space-y-2">
                        <p className="text-sm font-semibold text-success flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Ready to Claim ({completedQuests.length})
                        </p>
                        {completedQuests.map(quest => (
                            <div key={quest.id} className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{quest.title}</span>
                                    <span className="text-xs text-muted-foreground">+{quest.rewardXP} XP, +{quest.rewardStardust} Stardust</span>
                                </div>
                                <Button size="sm" onClick={() => handleClaimReward(quest.id)} className="dopamine-click">
                                    Claim
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default QuestSystemPanel;