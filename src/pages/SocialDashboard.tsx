import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, MessageSquare, Trophy, Rss, Shield, Home, User, Brain, Crown, UserPlus, Globe, Calendar, LayoutList } from "lucide-react";
import SocialSidebar from "@/components/SocialSidebar";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import Leaderboard from "@/components/Leaderboard";
import UserProfileModal from "@/components/UserProfileModal";
import FocusFeed from "@/components/FocusFeed";
import StudyCircles from "@/components/StudyCircles";
import ProfileMenu from "@/components/ProfileMenu";
import AICoachPanel from "@/components/AICoachPanel";
import UpgradePanel from "@/components/UpgradePanel";
import PartnerRequestPanel from "@/components/PartnerRequestPanel";
import DigitalPlanetDashboard from "@/components/DigitalPlanetDashboard";
import DailyWrappedCard from "@/components/DailyWrappedCard";

const SocialDashboard = () => {
    const navigate = useNavigate();
    const { userId } = useAuth();
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'feed';

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            {targetUserId && <UserProfileModal userId={targetUserId} currentUserId={userId} onClose={() => setTargetUserId(null)} />}

            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full glass"><Home className="w-4 h-4" /></Button>
                    <h1 className="text-4xl font-black italic tracking-tighter">COMMAND</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/productivity")} className="rounded-full glass">Day Planner</Button>
                </div>
            </header>

            <Tabs defaultValue={defaultTab} className="space-y-8">
                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    <TabsList className="bg-transparent gap-2">
                        {[
                            { id: 'feed', icon: Rss, label: 'Feed' },
                            { id: 'planets', icon: Globe, label: 'Planets' },
                            { id: 'circles', icon: Shield, label: 'Circles' },
                            { id: 'leaderboard', icon: Trophy, label: 'Rankings' },
                            { id: 'ai-coach', icon: Brain, label: 'Coach' },
                            { id: 'chat', icon: MessageSquare, label: 'Chat' },
                            { id: 'profile', icon: User, label: 'Profile' },
                        ].map(tab => (
                            <TabsTrigger key={tab.id} value={tab.id} className="glass data-[state=active]:bg-primary data-[state=active]:text-white rounded-full px-6 py-2 transition-all">
                                <tab.icon className="w-4 h-4 mr-2" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="feed" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <FocusFeed />
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <DailyWrappedCard />
                            <div className="glass p-6 rounded-3xl">
                                <h4 className="font-bold mb-4 flex items-center gap-2"><LayoutList className="w-4 h-4" /> Quick Tasks</h4>
                                <Button variant="outline" className="w-full rounded-2xl justify-start h-12" onClick={() => navigate("/productivity")}>Open Day Planner</Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="planets"><DigitalPlanetDashboard /></TabsContent>
                <TabsContent value="circles"><StudyCircles /></TabsContent>
                <TabsContent value="leaderboard"><div className="glass p-8 rounded-3xl"><Leaderboard onProfileClick={setTargetUserId} /></div></TabsContent>
                <TabsContent value="ai-coach"><div className="max-w-4xl mx-auto h-[70vh] glass p-8 rounded-3xl"><AICoachPanel /></div></TabsContent>
                <TabsContent value="chat"><div className="h-[70vh] glass p-8 rounded-3xl"><GlobalChatPanel userId={userId} /></div></TabsContent>
                <TabsContent value="profile"><div className="max-w-xl mx-auto"><ProfileMenu /></div></TabsContent>
            </Tabs>
        </div>
    );
};

export default SocialDashboard;