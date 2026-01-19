import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Home, 
    Rss, 
    Globe, 
    Shield, 
    Trophy, 
    Brain, 
    MessageSquare, 
    User, 
    LayoutList,
    Calendar,
    Loader2
} from "lucide-react";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import Leaderboard from "@/components/Leaderboard";
import UserProfileModal from "@/components/UserProfileModal";
import FocusFeed from "@/components/FocusFeed";
import StudyCircles from "@/components/StudyCircles";
import ProfileMenu from "@/components/ProfileMenu";
import AICoachPanel from "@/components/AICoachPanel";
import DigitalPlanetDashboard from "@/components/DigitalPlanetDashboard";
import DailyWrappedCard from "@/components/DailyWrappedCard";
import AnimatedSection from "@/components/AnimatedSection";

const SocialDashboard = () => {
    const navigate = useNavigate();
    const { userId, isAuthenticated, isLoading } = useAuth();
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'feed';

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate("/landing");
        }
    }, [isLoading, isAuthenticated, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Connecting to Hub...</p>
            </div>
        );
    }

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 max-w-[1800px] mx-auto space-y-12">
            {targetUserId && <UserProfileModal userId={targetUserId} currentUserId={userId} onClose={() => setTargetUserId(null)} />}

            <header className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-2xl glass-card w-12 h-12">
                        <Home className="w-5 h-5" />
                    </Button>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">Command Center</h1>
                </div>
                <div className="flex gap-4">
                    <Button onClick={() => navigate("/productivity")} className="rounded-full bg-white text-black hover:bg-accent font-bold px-8 h-12">
                        <Calendar className="w-4 h-4 mr-2" /> Day Planner
                    </Button>
                </div>
            </header>

            <Tabs defaultValue={defaultTab} className="space-y-12">
                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    <TabsList className="bg-white/5 p-1 rounded-full border border-white/5">
                        {[
                            { id: 'feed', icon: Rss, label: 'Journal' },
                            { id: 'planets', icon: Globe, label: 'Galaxies' },
                            { id: 'circles', icon: Shield, label: 'Citadels' },
                            { id: 'leaderboard', icon: Trophy, label: 'Apex' },
                            { id: 'ai-coach', icon: Brain, label: 'Oracle' },
                            { id: 'chat', icon: MessageSquare, label: 'Signals' },
                            { id: 'profile', icon: User, label: 'Identity' },
                        ].map(tab => (
                            <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full px-8 py-3 transition-all font-black uppercase text-[10px] tracking-widest">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="feed">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-8">
                            <FocusFeed />
                        </div>
                        <div className="lg:col-span-4 space-y-8">
                            <DailyWrappedCard />
                            <AnimatedSection delay={0.2}>
                                <div className="glass-card p-10 rounded-[2.5rem] border-primary/20">
                                    <h4 className="text-2xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
                                        <LayoutList className="text-primary" /> STRATEGY
                                    </h4>
                                    <p className="text-sm opacity-60 mb-8 leading-relaxed">Map your next focus cycle. Deep work is won in the planning phase.</p>
                                    <Button variant="outline" className="w-full rounded-2xl h-14 font-black border-white/10 hover:bg-white/5 uppercase tracking-widest text-[10px]" onClick={() => navigate("/productivity")}>
                                        Access Day Planner
                                    </Button>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="planets"><DigitalPlanetDashboard /></TabsContent>
                <TabsContent value="circles"><StudyCircles /></TabsContent>
                <TabsContent value="leaderboard"><div className="glass-card p-12 rounded-[3rem]"><Leaderboard onProfileClick={setTargetUserId} /></div></TabsContent>
                <TabsContent value="ai-coach"><div className="max-w-5xl mx-auto h-[75vh] glass-card p-12 rounded-[3rem] border-primary/20"><AICoachPanel /></div></TabsContent>
                <TabsContent value="chat"><div className="h-[75vh] glass-card p-12 rounded-[3rem] border-accent/20"><GlobalChatPanel userId={userId} /></div></TabsContent>
                <TabsContent value="profile"><div className="max-w-2xl mx-auto"><ProfileMenu /></div></TabsContent>
            </Tabs>
        </div>
    );
};

export default SocialDashboard;