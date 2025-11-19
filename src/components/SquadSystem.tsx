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
            <div className="glass-card border-primary/20 p-6 rounded-2xl hover-glow group">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-white">Squad Mode</h2>
                </div>

                <div className="space-y-6">
                    <p className="text-sm text-white/60 leading-relaxed">
                        Join a squad to boost your XP multiplier. <span className="text-red-400 font-bold">Warning:</span> If one person breaks focus, everyone loses the bonus!
                    </p>

                    <div className="space-y-3">
                        <Button onClick={createSquad} className="w-full dopamine-click bg-primary hover:bg-primary/80 text-white font-bold py-6 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                            INITIATE NEW SQUAD
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black/40 px-2 text-white/40 font-mono">Or join existing</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="ENTER SQUAD ID"
                                value={joinInput}
                                onChange={(e) => setJoinInput(e.target.value)}
                                className="bg-black/20 border-white/10 text-white font-mono placeholder:text-white/20 focus-visible:ring-primary/50"
                            />
                            <Button variant="secondary" onClick={joinSquad} className="font-bold hover:bg-white/20">JOIN</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card border-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] p-6 rounded-2xl relative overflow-hidden">
            {/* Background Pulse */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Squad ID</p>
                        <h2 className="text-xl font-mono font-bold text-white tracking-widest">{squadId}</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={copySquadId} title="Copy ID" className="hover:bg-white/10 text-white/60 hover:text-white">
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={leaveSquad} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        LEAVE
                    </Button>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                {/* Multiplier Status */}
                <div className={cn(
                    "p-4 rounded-xl flex items-center justify-between transition-all duration-500 border",
                    squadMultiplier > 1.0
                        ? "bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                        : "bg-yellow-500/10 border-yellow-500/20"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-full",
                            squadMultiplier > 1.0 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "font-bold uppercase tracking-wide text-sm",
                            squadMultiplier > 1.0 ? "text-green-400" : "text-yellow-400"
                        )}>
                            Squad Bonus
                        </span>
                    </div>
                    <span className={cn(
                        "text-3xl font-mono font-bold",
                        squadMultiplier > 1.0 ? "text-green-400 text-glow" : "text-yellow-400"
                    )}>
                        {squadMultiplier.toFixed(1)}x
                    </span>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                    <p className="text-xs font-mono text-white/40 uppercase tracking-wider pl-1">Operatives Online</p>
                    {members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className={cn("w-2.5 h-2.5 rounded-full",
                                        member.status === 'focusing' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-red-500"
                                    )} />
                                    {member.status === 'focusing' && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />}
                                </div>
                                <span className="font-medium text-white/90">{member.username}</span>
                                {member.user_id === userId && <Badge variant="outline" className="text-[10px] h-5 border-primary/50 text-primary bg-primary/10">YOU</Badge>}
                            </div>
                            <span className={cn("text-xs font-bold font-mono px-2 py-1 rounded",
                                member.status === 'focusing' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            )}>
                                {member.status.toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>

                {members.length < 2 && (
                    <div className="text-xs text-center text-white/40 flex items-center justify-center gap-2 bg-white/5 p-2 rounded-lg border border-dashed border-white/10">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        <span>Invite friends to activate bonus protocols!</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SquadSystem;
