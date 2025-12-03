import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, MessageSquare, Trophy, Rss, Shield, Home, User, Brain } from "lucide-react";
import SocialSidebar from "@/components/SocialSidebar";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import Leaderboard from "@/components/Leaderboard";
import UserProfileModal from "@/components/UserProfileModal";
import FocusFeed from "@/components/FocusFeed";
import StudyCircles from "@/components/StudyCircles";
import ProfileMenu from "@/components/ProfileMenu"; // Import ProfileMenu
import AICoachPanel from "@/components/AICoachPanel"; // Import AICoachPanel

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
                            onClick={() => navigate("/")}
                            title="Go to Home"
                        >
                            <Home className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/explore")}
                            title="Back to Explore"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="feed" className="w-full">
                    <TabsList className="grid w-full grid-cols-7 mb-8">
                        <TabsTrigger value="feed" className="flex items-center gap-2">
                            <Rss className="h-4 w-4" />
                            Feed
                        </TabsTrigger>
                        <TabsTrigger value="circles" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Circles
                        </TabsTrigger>
                        <TabsTrigger value="friends" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Friends
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Global Chat
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Leaderboard
                        </TabsTrigger>
                        <TabsTrigger value="ai-coach" className="flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            AI Coach
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Profile
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="feed">
                        <FocusFeed />
                    </TabsContent>

                    <TabsContent value="circles">
                        <StudyCircles />
                    </TabsContent>

                    <TabsContent value="friends">
                        <div className="h-[70vh] glass-card p-4 rounded-xl">
                            <SocialSidebar userId={userId} onProfileClick={handleProfileClick} />
                        </div>
                    </TabsContent>

                    <TabsContent value="chat">
                        <div className="h-[70vh] glass-card p-4 rounded-xl">
                            <GlobalChatPanel userId={userId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="leaderboard">
                        <div className="glass-card p-4 rounded-xl">
                            <Leaderboard onProfileClick={handleProfileClick} />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="ai-coach">
                        <div className="max-w-xl mx-auto glass-card p-4 rounded-xl">
                            <AICoachPanel />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="profile">
                        <div className="max-w-md mx-auto glass-card p-4 rounded-xl">
                            <ProfileMenu />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default SocialDashboard;