import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, LayoutGrid, Zap, MessageSquare, Trophy, BookOpen, Brain, Clock, Calendar, TrendingUp } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import DigitalPlanet3D from "@/components/DigitalPlanet3D"; // New 3D component
import FocusTimer from "@/components/FocusTimer"; // Reusing existing timer
import HeatmapStats from "@/components/HeatmapStats"; // Reusing existing heatmap
import AICoachPanel from "@/components/AICoachPanel"; // Reusing existing AI panel
import { cn } from "@/lib/utils";

const BentoCard = ({ children, className, delay = 0, id }: { children: React.ReactNode, className?: string, delay?: number, id?: string }) => (
    <motion.div
        id={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={cn("glass-card p-4 rounded-2xl flex flex-col overflow-hidden", className)}
    >
        {children}
    </motion.div>
);

const MainDashboard = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative overflow-hidden p-4">
            <header className="glass-card border-b border-white/10 sticky top-4 z-10 mb-4 rounded-xl">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary">OnlyFocus</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate("/productivity")} className="dopamine-click">
                            <LayoutGrid className="w-4 h-4 mr-2" /> Productivity Hub
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/social")} className="dopamine-click">
                            <MessageSquare className="w-4 h-4 mr-2" /> Social Hub
                        </Button>
                        {!isAuthenticated && (
                            <Button onClick={() => navigate("/auth")} className="dopamine-click">
                                Log In
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-0">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-[minmax(200px, auto)]">
                    
                    {/* Slot A: 3D Digital Planet (Span 2 columns, 2 rows) */}
                    <BentoCard id="digital-planet-3d" className="lg:col-span-2 lg:row-span-2 h-[600px] relative" delay={0.1}>
                        <div className="absolute inset-0 z-0">
                            <DigitalPlanet3D />
                        </div>
                        <div className="relative z-10 p-4">
                            <h2 className="text-3xl font-bold text-white mb-2">Digital Civilization</h2>
                            <p className="text-muted-foreground">Your focus fuels your world. Level up to unlock new biomes.</p>
                        </div>
                    </BentoCard>

                    {/* Slot B: Focus Timer (Span 2 columns, 1 row) */}
                    <BentoCard id="focus-timer-card" className="lg:col-span-2 h-[300px] flex items-center justify-center" delay={0.2}>
                        <FocusTimer />
                    </BentoCard>

                    {/* Slot C: Productivity Heatmap (Span 2 columns, 1 row) */}
                    <BentoCard className="lg:col-span-2 h-[300px]" delay={0.3}>
                        <HeatmapStats />
                    </BentoCard>
                    
                    {/* Slot D: AI Coach Chat Widget (Span 1 column, 2 rows) */}
                    <BentoCard id="ai-coach-widget" className="lg:col-span-1 lg:row-span-2 h-[600px]" delay={0.4}>
                        <AICoachPanel />
                    </BentoCard>
                    
                    {/* Slot E: Quick Links (Span 3 columns, 1 row) */}
                    <BentoCard className="lg:col-span-3 flex flex-row gap-4" delay={0.5}>
                        <DashboardLink 
                            title="Explore Rooms" 
                            icon={Zap} 
                            link="/explore" 
                            description="Join live co-working sessions."
                        />
                        <DashboardLink 
                            title="Productivity Hub" 
                            icon={LayoutGrid} 
                            link="/productivity" 
                            description="Manage tasks and schedule your week."
                        />
                        <DashboardLink 
                            title="Leaderboard" 
                            icon={Trophy} 
                            link="/social?tab=leaderboard" 
                            description="Climb the weekly ranks."
                        />
                    </BentoCard>
                </div>
            </main>
        </div>
    );
};

const DashboardLink = ({ title, icon: Icon, link, description }: { title: string, icon: React.ElementType, link: string, description: string }) => {
    const navigate = useNavigate();
    return (
        <div 
            className="flex-1 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer dopamine-click"
            onClick={() => navigate(link)}
        >
            <Icon className="w-6 h-6 text-accent mb-2" />
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );
};

export default MainDashboard;