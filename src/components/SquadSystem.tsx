import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Zap, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SquadMember {
    user_id: string;
    username: string;
    status: 'focusing' | 'paused' | 'idle';
    streak: number;
    online_at: string;
}

interface SquadSystemProps {
    isFocusing: boolean;
}

const SquadSystem = ({ isFocusing }: SquadSystemProps) => {
    const { userId } = useAuth();
    const [squadId, setSquadId] = useState<string | null>(null);
    const [members, setMembers] = useState<SquadMember[]>([]);
    const [joinInput, setJoinInput] = useState("");
    const [squadMultiplier, setSquadMultiplier] = useState(1.0);

    // --- Realtime Presence Logic ---
    useEffect(() => {
        if (!squadId || !userId) return;

        const channel = supabase.channel(`squad:${squadId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const newState = channel.presenceState();
                const squadMembers: SquadMember[] = [];

                for (const key in newState) {
                    const userState = newState[key][0] as any;
                    if (userState) {
                        squadMembers.push({
                            user_id: key,
                            username: userState.username || "Unknown",
                            status: userState.status || 'idle',
                            streak: userState.streak || 0,
                            online_at: new Date().toISOString(),
                        });
                    }
                }
                setMembers(squadMembers);

                // Calculate Multiplier
                const activeMembers = squadMembers.filter(m => m.status === 'focusing').length;
                const totalMembers = squadMembers.length;

                if (totalMembers > 1) {
                    // Base 1.0 + 0.1 per active member. If ANYONE is paused, multiplier drops.
                    const allFocusing = squadMembers.every(m => m.status === 'focusing');
                    if (allFocusing) {
                        setSquadMultiplier(1.0 + (totalMembers * 0.1));
                    } else {
                        setSquadMultiplier(1.0); // Penalty for broken chain
                    }
                } else {
                    setSquadMultiplier(1.0);
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    // Fetch username first
                    const { data } = await supabase.from("profiles").select("username").eq("id", userId).single();
                    const username = data?.username || "User";

                    await channel.track({
                        username,
                        status: isFocusing ? 'focusing' : 'idle',
                        streak: 0, // Placeholder
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [squadId, userId]);

    // --- Update Status when Focus Changes ---
    useEffect(() => {
        if (!squadId || !userId) return;

        // We need to re-track to update the status in presence
        const updateStatus = async () => {
            const channel = supabase.getChannels().find(c => c.topic === `squad:${squadId}`);
            if (channel) {
                const { data } = await supabase.from("profiles").select("username").eq("id", userId).single();
                const username = data?.username || "User";

                await channel.track({
                    username,
                    status: isFocusing ? 'focusing' : 'paused', // If not focusing, we are paused/idle
                    streak: 0,
                    online_at: new Date().toISOString(),
                });
            }
        };

        updateStatus();
    }, [isFocusing, squadId, userId]);

    // --- Anti-Distraction Notifications ---
    useEffect(() => {
        if (squadMultiplier === 1.0 && members.length > 1) {
            const breaker = members.find(m => m.status !== 'focusing');
            if (breaker) {
                toast.warning(`${breaker.username} broke the squad streak! Multiplier reset.`);
            }
        }
    }, [squadMultiplier, members]);

    const createSquad = () => {
        const newId = Math.random().toString(36).substring(2, 9).toUpperCase();
        setSquadId(newId);
        toast.success(`Squad created! ID: ${newId}`);
    };

    const joinSquad = () => {
        if (!joinInput.trim()) return;
        setSquadId(joinInput.toUpperCase());
        toast.success(`Joined Squad ${joinInput.toUpperCase()}`);
    };

    const leaveSquad = () => {
        setSquadId(null);
        setMembers([]);
        setSquadMultiplier(1.0);
        toast.info("Left squad.");
    };

    const copySquadId = () => {
        if (squadId) {
            navigator.clipboard.writeText(squadId);
            toast.success("Squad ID copied!");
        }
    };

    if (!squadId) {
        return (
            <Card className="glass-card border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" /> Squad Mode
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Join a squad to boost your XP multiplier. If one person breaks focus, everyone loses the bonus!
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={createSquad} className="flex-1 dopamine-click">Create Squad</Button>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter Squad ID"
                            value={joinInput}
                            onChange={(e) => setJoinInput(e.target.value)}
                        />
                        <Button variant="secondary" onClick={joinSquad}>Join</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-primary/50 shadow-glow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Squad: {squadId}
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={copySquadId} title="Copy ID">
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={leaveSquad} className="text-destructive hover:text-destructive">
                        Leave
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Multiplier Status */}
                <div className={cn(
                    "p-3 rounded-lg flex items-center justify-between transition-colors",
                    squadMultiplier > 1.0 ? "bg-green-500/20 border border-green-500/50" : "bg-yellow-500/10 border border-yellow-500/30"
                )}>
                    <div className="flex items-center gap-2">
                        <Zap className={cn("w-5 h-5", squadMultiplier > 1.0 ? "text-green-400" : "text-yellow-400")} />
                        <span className="font-bold">Squad Bonus</span>
                    </div>
                    <span className="text-xl font-mono font-bold">{squadMultiplier.toFixed(1)}x</span>
                </div>

                {/* Members List */}
                <div className="space-y-2">
                    {members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between text-sm p-2 rounded bg-background/50">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full",
                                    member.status === 'focusing' ? "bg-green-500 animate-pulse" : "bg-red-500"
                                )} />
                                <span>{member.username}</span>
                                {member.user_id === userId && <Badge variant="secondary" className="text-[10px] h-4">You</Badge>}
                            </div>
                            <span className={cn("text-xs font-medium",
                                member.status === 'focusing' ? "text-green-400" : "text-red-400"
                            )}>
                                {member.status.toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>

                {members.length < 2 && (
                    <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Invite friends to activate bonus!
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SquadSystem;
