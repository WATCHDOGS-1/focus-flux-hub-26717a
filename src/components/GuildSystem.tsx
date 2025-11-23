import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users,
    Shield,
    Zap,
    Copy,
    UserPlus,
    Crown,
    Mic,
    MicOff,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Guild {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    created_at: string;
    member_count?: number;
}

interface GuildMember {
    user_id: string;
    username: string;
    guild_id: string;
    role: 'owner' | 'member';
    in_voice: boolean;
    is_focusing: boolean;
    joined_at: string;
}

const GuildSystem = () => {
    const { userId } = useAuth();
    const [myGuild, setMyGuild] = useState<Guild | null>(null);
    const [members, setMembers] = useState<GuildMember[]>([]);
    const [guildName, setGuildName] = useState("");
    const [guildDescription, setGuildDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [inVoice, setInVoice] = useState(false);
    const [guildMultiplier, setGuildMultiplier] = useState(1.0);

    // Load user's guild
    useEffect(() => {
        if (!userId) return;
        loadMyGuild();
    }, [userId]);

    // Realtime presence for guild members
    useEffect(() => {
        if (!myGuild || !userId) return;

        const channel = supabase.channel(`guild:${myGuild.id}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const newState = channel.presenceState();
                const guildMembers: GuildMember[] = [];

                for (const key in newState) {
                    const userState = newState[key][0] as any;
                    if (userState) {
                        guildMembers.push({
                            user_id: key,
                            username: userState.username || "Unknown",
                            guild_id: myGuild.id,
                            role: userState.role || 'member',
                            in_voice: userState.in_voice || false,
                            is_focusing: userState.is_focusing || false,
                            joined_at: userState.joined_at || new Date().toISOString(),
                        });
                    }
                }
                setMembers(guildMembers);

                // Calculate multiplier based on voice chat members
                const voiceMembers = guildMembers.filter(m => m.in_voice && m.is_focusing);
                if (voiceMembers.length > 1) {
                    // Each additional person in voice adds 0.15x multiplier
                    setGuildMultiplier(1.0 + (voiceMembers.length - 1) * 0.15);
                } else {
                    setGuildMultiplier(1.0);
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    const { data } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", userId)
                        .single();
                    const username = data?.username || "User";

                    // Check if user is owner
                    const isOwner = myGuild.owner_id === userId;

                    await channel.track({
                        username,
                        role: isOwner ? 'owner' : 'member',
                        in_voice: inVoice,
                        is_focusing: false, // Will be updated from focus room
                        joined_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [myGuild, userId, inVoice]);

    const loadMyGuild = async () => {
        if (!userId) return;

        // Check if user is in a guild (as owner or member)
        const { data: memberData } = await supabase
            .from("guild_members")
            .select("guild_id")
            .eq("user_id", userId)
            .single();

        if (memberData) {
            const { data: guildData } = await supabase
                .from("guilds")
                .select("*")
                .eq("id", memberData.guild_id)
                .single();

            if (guildData) {
                setMyGuild(guildData);
            }
        }
    };

    const createGuild = async () => {
        if (!userId || !guildName.trim()) {
            toast.error("Please enter a guild name");
            return;
        }

        const { data: guild, error: guildError } = await supabase
            .from("guilds")
            .insert({
                name: guildName,
                description: guildDescription,
                owner_id: userId,
            })
            .select()
            .single();

        if (guildError) {
            toast.error("Failed to create guild");
            console.error(guildError);
            return;
        }

        // Add creator as first member
        const { error: memberError } = await supabase
            .from("guild_members")
            .insert({
                guild_id: guild.id,
                user_id: userId,
                role: 'owner',
            });

        if (memberError) {
            toast.error("Failed to join guild");
            console.error(memberError);
            return;
        }

        toast.success(`Guild "${guildName}" created!`);
        setMyGuild(guild);
        setGuildName("");
        setGuildDescription("");
    };

    const joinGuild = async () => {
        if (!userId || !joinCode.trim()) {
            toast.error("Please enter a guild code");
            return;
        }

        // Find guild by ID (using the code as ID)
        const { data: guild, error: guildError } = await supabase
            .from("guilds")
            .select("*")
            .eq("id", joinCode)
            .single();

        if (guildError || !guild) {
            toast.error("Guild not found");
            return;
        }

        // Join guild
        const { error: memberError } = await supabase
            .from("guild_members")
            .insert({
                guild_id: guild.id,
                user_id: userId,
                role: 'member',
            });

        if (memberError) {
            toast.error("Failed to join guild");
            console.error(memberError);
            return;
        }

        toast.success(`Joined guild "${guild.name}"!`);
        setMyGuild(guild);
        setJoinCode("");
    };

    const leaveGuild = async () => {
        if (!userId || !myGuild) return;

        // If owner, delete the guild
        if (myGuild.owner_id === userId) {
            const { error } = await supabase
                .from("guilds")
                .delete()
                .eq("id", myGuild.id);

            if (error) {
                toast.error("Failed to delete guild");
                return;
            }
            toast.success("Guild deleted");
        } else {
            // Just leave as member
            const { error } = await supabase
                .from("guild_members")
                .delete()
                .eq("guild_id", myGuild.id)
                .eq("user_id", userId);

            if (error) {
                toast.error("Failed to leave guild");
                return;
            }
            toast.success("Left guild");
        }

        setMyGuild(null);
        setMembers([]);
    };

    const copyGuildCode = () => {
        if (myGuild) {
            navigator.clipboard.writeText(myGuild.id);
            toast.success("Guild code copied!");
        }
    };

    const toggleVoice = () => {
        setInVoice(!inVoice);
        toast.info(inVoice ? "Left voice channel" : "Joined voice channel");
    };

    if (!myGuild) {
        return (
            <div className="space-y-6">
                <Tabs defaultValue="create" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Create Guild</TabsTrigger>
                        <TabsTrigger value="join">Join Guild</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Guild Name</label>
                                <Input
                                    placeholder="Enter guild name"
                                    value={guildName}
                                    onChange={(e) => setGuildName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                                <Input
                                    placeholder="What's your guild about?"
                                    value={guildDescription}
                                    onChange={(e) => setGuildDescription(e.target.value)}
                                />
                            </div>
                            <Button onClick={createGuild} className="w-full dopamine-click">
                                <Shield className="mr-2 h-4 w-4" />
                                Create Guild
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="join" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Guild Code</label>
                                <Input
                                    placeholder="Enter guild code"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                />
                            </div>
                            <Button onClick={joinGuild} className="w-full dopamine-click" variant="secondary">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Join Guild
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Guild Header */}
            <Card className="glass-card border-primary/50 shadow-glow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Shield className="w-6 h-6 text-primary" />
                            {myGuild.name}
                        </CardTitle>
                        {myGuild.description && (
                            <p className="text-sm text-muted-foreground">{myGuild.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={copyGuildCode} title="Copy Guild Code">
                            <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={leaveGuild}
                            className="text-destructive hover:text-destructive"
                        >
                            {myGuild.owner_id === userId ? "Delete" : "Leave"}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Voice Channel & Multiplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Voice Channel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={toggleVoice}
                            className={cn(
                                "w-full dopamine-click",
                                inVoice ? "bg-green-500 hover:bg-green-600" : ""
                            )}
                            variant={inVoice ? "default" : "outline"}
                        >
                            {inVoice ? (
                                <>
                                    <Mic className="mr-2 h-4 w-4" />
                                    Leave Voice
                                </>
                            ) : (
                                <>
                                    <MicOff className="mr-2 h-4 w-4" />
                                    Join Voice
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            {members.filter(m => m.in_voice).length} member(s) in voice
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "glass-card transition-colors",
                    guildMultiplier > 1.0 ? "border-green-500/50 bg-green-500/10" : ""
                )}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Guild Multiplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className={cn(
                                    "w-6 h-6",
                                    guildMultiplier > 1.0 ? "text-green-400 animate-pulse" : "text-yellow-400"
                                )} />
                                <span className="text-3xl font-bold font-mono">{guildMultiplier.toFixed(2)}x</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {guildMultiplier > 1.0
                                ? `${members.filter(m => m.in_voice && m.is_focusing).length} members focusing in voice!`
                                : "Get guild members in voice to boost XP!"
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Members List */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Members ({members.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {members.map((member) => (
                            <div
                                key={member.user_id}
                                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        member.in_voice ? "bg-green-500 animate-pulse" : "bg-gray-500"
                                    )} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{member.username}</span>
                                            {member.role === 'owner' && (
                                                <Crown className="w-4 h-4 text-yellow-500" />
                                            )}
                                            {member.user_id === userId && (
                                                <Badge variant="secondary" className="text-[10px] h-4">You</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {member.in_voice ? (
                                                member.is_focusing ? (
                                                    <span className="text-green-400">In voice • Focusing</span>
                                                ) : (
                                                    <span className="text-blue-400">In voice • Idle</span>
                                                )
                                            ) : (
                                                "Offline"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No members online</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GuildSystem;
