import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  MessageSquare, 
  Video, 
  ArrowRight,
  TrendingUp,
  Clock,
  LayoutGrid,
  Shield,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import DigitalPlanetView from "@/components/DigitalPlanetView";
import FocusTimer from "@/components/FocusTimer";
import HeatmapStats from "@/components/HeatmapStats";
import AICoachPanel from "@/components/AICoachPanel";
import AnimatedSection from "@/components/AnimatedSection";
import { cn } from "@/lib/utils";

const MainDashboard = () => {
    const { isAuthenticated, profile } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-[1800px] mx-auto space-y-12">
            {/* Nav Header */}
            <header className="flex items-center justify-between px-2">
                <div className="flex items-center gap-6">
                    <h1 className="text-4xl font-black tracking-tighter text-glow italic">
                        ONLYFOCUS
                    </h1>
                    <nav className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest opacity-40">
                        <span className="cursor-pointer hover:opacity-100 transition-opacity" onClick={() => navigate("/social")}>Community</span>
                        <span className="cursor-pointer hover:opacity-100 transition-opacity" onClick={() => navigate("/productivity")}>Day Planner</span>
                        <span className="cursor-pointer hover:opacity-100 transition-opacity">Archive</span>
                    </nav>
                </div>
                <div className="flex gap-4">
                    {!isAuthenticated ? (
                        <Button onClick={() => navigate("/auth")} className="rounded-full premium-gradient px-8 h-12 font-bold shadow-glow">
                            INITIALIZE
                        </Button>
                    ) : (
                        <div className="flex items-center gap-4">
                             <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">Authorized User</p>
                                <p className="text-sm font-bold">{profile?.username}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/20 border border-white/10 flex items-center justify-center font-black">
                                {profile?.username?.[0].toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Hero Block */}
                <div className="lg:col-span-8 space-y-8">
                    <AnimatedSection>
                        <div 
                            onClick={() => navigate("/explore")}
                            className="group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer border border-white/5"
                        >
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 p-12 space-y-6 w-full">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-[10px] font-black tracking-[0.2em] uppercase">
                                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    Active Study Nexus
                                </div>
                                <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] transition-transform group-hover:-translate-y-2 duration-500">
                                    ENTER THE <br /> <span className="text-primary italic">VOID.</span>
                                </h2>
                                <div className="flex items-center justify-between">
                                    <p className="text-white/60 max-w-sm text-sm font-medium leading-relaxed">
                                        Join a collective of high-performance minds. Real-time accountability for those who seek mastery.
                                    </p>
                                    <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-accent group-hover:text-background">
                                        <ArrowRight className="w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <AnimatedSection delay={0.2}>
                            <div className="glass-card p-8 rounded-[2.5rem] h-full flex flex-col justify-between group hover:border-primary/50 transition-colors">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                                        <Clock className="text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black italic tracking-tighter mb-4">PRECISION TIMER</h3>
                                    <FocusTimer />
                                </div>
                            </div>
                        </AnimatedSection>

                        <AnimatedSection delay={0.3}>
                            <div className="glass-card p-8 rounded-[2.5rem] h-full flex flex-col justify-between group hover:border-accent/50 transition-colors">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
                                        <TrendingUp className="text-accent" />
                                    </div>
                                    <h3 className="text-2xl font-black italic tracking-tighter mb-4">CONSISTENCY HUB</h3>
                                    <HeatmapStats />
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>

                {/* Right Column: AI & Civilization */}
                <div className="lg:col-span-4 space-y-8">
                    <AnimatedSection delay={0.4}>
                        <div className="glass-card p-8 rounded-[2.5rem] min-h-[400px]">
                            <h3 className="text-2xl font-black italic tracking-tighter mb-8 flex items-center gap-2">
                                <Star className="text-primary" /> THE PLANET
                            </h3>
                            <div className="h-64 mb-8">
                                <DigitalPlanetView />
                            </div>
                            <Button variant="outline" onClick={() => navigate("/social?tab=planets")} className="w-full rounded-2xl h-12 font-bold border-white/5 hover:bg-white/5">
                                MANAGE CIVILIZATION
                            </Button>
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.5} className="h-full">
                        <div className="glass-card p-8 rounded-[2.5rem] h-full border-primary/20">
                            <AICoachPanel />
                        </div>
                    </AnimatedSection>
                </div>

            </main>

            <footer className="pt-24 pb-12 text-center">
                <p className="text-[10px] font-black tracking-[0.4em] opacity-20 uppercase italic">Designed for Mastery • Built for Focus</p>
            </footer>
        </div>
    );
};

export default MainDashboard;