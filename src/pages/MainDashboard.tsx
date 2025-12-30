import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  LayoutGrid, 
  MessageSquare, 
  Trophy, 
  Video, 
  Brain, 
  ArrowRight,
  TrendingUp,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import DigitalPlanetView from "@/components/DigitalPlanetView";
import FocusTimer from "@/components/FocusTimer";
import HeatmapStats from "@/components/HeatmapStats";
import AICoachPanel from "@/components/AICoachPanel";
import { cn } from "@/lib/utils";

const DashboardCard = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
        className={cn("glass p-6 rounded-3xl overflow-hidden", className)}
    >
        {children}
    </motion.div>
);

const MainDashboard = () => {
    const { isAuthenticated, profile } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between px-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-glow">
                        OnlyFocus
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Welcome back{profile ? `, ${profile.username}` : ''}. Ready for flow?
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate("/social")} 
                        className="rounded-full glass-hover"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Community
                    </Button>
                    {!isAuthenticated && (
                        <Button 
                            onClick={() => navigate("/auth")} 
                            className="rounded-full premium-gradient px-8"
                        >
                            Log In
                        </Button>
                    )}
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Hero Action: Join Focus Room */}
                <DashboardCard className="lg:col-span-12 premium-gradient p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-none group cursor-pointer" delay={0.1}>
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-md">
                            <Video className="w-3 h-3 mr-2" />
                            Live Accountability
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                            Focus with others. <br />
                            <span className="opacity-70">Achieve more together.</span>
                        </h2>
                        <p className="text-white/80 max-w-md text-lg">
                            Join one of our virtual study rooms and leverage social accountability to hit your goals.
                        </p>
                        <Button 
                            size="lg" 
                            onClick={() => navigate("/explore")}
                            className="bg-white text-primary hover:bg-white/90 rounded-full px-10 h-14 text-lg font-semibold shadow-2xl transition-transform group-hover:scale-105"
                        >
                            Enter Focus Room
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                    <div className="relative w-full md:w-1/3 aspect-video glass rounded-2xl flex items-center justify-center overflow-hidden border-white/20">
                        <Zap className="w-20 h-20 text-white animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </DashboardCard>

                {/* Left Column: Planet & Stats */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DashboardCard className="md:col-span-2 h-[400px]" delay={0.2}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Your Civilization
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/social?tab=planets")}>Details</Button>
                        </div>
                        <DigitalPlanetView />
                    </DashboardCard>

                    <DashboardCard delay={0.3}>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Quick Timer</h3>
                        </div>
                        <FocusTimer />
                    </DashboardCard>

                    <DashboardCard delay={0.4}>
                         <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Consistency
                        </h3>
                        <HeatmapStats />
                    </DashboardCard>
                </div>

                {/* Right Column: AI Coach */}
                <DashboardCard className="lg:col-span-4 h-full" delay={0.5}>
                    <AICoachPanel />
                </DashboardCard>

            </main>
        </div>
    );
};

export default MainDashboard;