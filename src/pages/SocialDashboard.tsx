import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, MessageSquare, Trophy, Shield } from "lucide-react";
import SocialSidebar from "@/components/SocialSidebar";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import Leaderboard from "@/components/Leaderboard";
import GuildSystem from "@/components/GuildSystem";
import UserProfileModal from "@/components/UserProfileModal";

const SocialDashboard = () => {
    const navigate = useNavigate();
    const { userId } = useAuth();
    const [targetUserId, setTargetUserId] = useState<string | null>(null);

    const handleProfileClick = (id: string) => {
        setTargetUserId(id);
    };

    if (!userId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-xl text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Profile Modal */}
            {targetUserId && (
                <UserProfileModal
                    userId={targetUserId}
                    currentUserId={userId}
                    onClose={() => setTargetUserId(null)}
                />
            )}

            {/* Header */}
            <header className="glass-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/explore")}
                            title="Back to Explore"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-foreground">Social Dashboard</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="guilds" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                        <TabsTrigger value="guilds" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Guilds
                        </TabsTrigger>
                        <TabsTrigger value="friends" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Friends
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Leaderboard
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="guilds" className="space-y-4">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Guild System</CardTitle>
                                <CardDescription>
                                    Join or create a guild to collaborate with others. When guild members are in the same voice channel, your XP multipliers stack!
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <GuildSystem />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="friends" className="space-y-4">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Friends & Direct Messages</CardTitle>
                                <CardDescription>
                                    Connect with your focus buddies and send direct messages.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SocialSidebar userId={userId} onProfileClick={handleProfileClick} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="chat" className="space-y-4">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Global Chat</CardTitle>
                                <CardDescription>
                                    Chat with everyone in the OnlyFocus community.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[600px]">
                                    <GlobalChatPanel userId={userId} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="leaderboard" className="space-y-4">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Leaderboard</CardTitle>
                                <CardDescription>
                                    See how you rank against other focused individuals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Leaderboard onProfileClick={handleProfileClick} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default SocialDashboard;
