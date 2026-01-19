import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Clock, TrendingUp, ArrowRight, Star, Globe, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import DigitalPlanet3D from "@/components/DigitalPlanet3D";
import FocusTimer from "@/components/FocusTimer";
import HeatmapStats from "@/components/HeatmapStats";
import AICoachPanel from "@/components/AICoachPanel";
import ProjectGallery from "@/components/ProjectGallery";
import SkillTree from "@/components/SkillTree";
import AnimatedSection from "@/components/AnimatedSection";

const MainDashboard = () => {
    const { isAuthenticated, profile } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-8 md:p-16 max-w-[1920px] mx-auto space-y-16">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <h1 className="text-5xl font-black italic tracking-tighter text-luxury">
                        OnlyFocus
                    </h1>
                    <nav className="hidden lg:flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                        <span className="cursor-pointer hover:opacity-100 transition-all hover:text-primary" onClick={() => navigate("/social")}>Collective</span>
                        <span className="cursor-pointer hover:opacity-100 transition-all hover:text-primary" onClick={() => navigate("/productivity")}>Schedule</span>
                        <span className="cursor-pointer hover:opacity-100 transition-all hover:text-primary" onClick={() => navigate("/notes")}>Archive</span>
                    </nav>
                </div>
                <div className="flex gap-6">
                    {!isAuthenticated ? (
                        <Button onClick={() => navigate("/auth")} className="rounded-full premium-gradient px-10 h-14 font-black tracking-widest shadow-2xl">
                            INITIATE
                        </Button>
                    ) : (
                        <div className="flex items-center gap-6 group cursor-pointer" onClick={() => navigate("/social?tab=profile")}>
                             <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Authorized</p>
                                <p className="text-sm font-black italic">{profile?.username}</p>
                            </div>
                            <div className="w-14 h-14 rounded-[1.5rem] glass-interactive flex items-center justify-center font-black text-primary border-primary/20">
                                {profile?.username?.[0].toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Hero Showcase */}
                <div className="lg:col-span-8 space-y-12">
                    <AnimatedSection>
                        <div 
                            onClick={() => navigate("/explore")}
                            className="group relative h-[600px] rounded-[4rem] overflow-hidden cursor-pointer border border-white/[0.05] shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 p-16 space-y-8 w-full backdrop-blur-sm bg-black/10">
                                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border-white/10 text-[10px] font-black tracking-[0.3em] uppercase">
                                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    Synchronized Performance
                                </div>
                                <h2 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] text-luxury">
                                    ASCEND <br /> <span className="text-primary">ABOVE.</span>
                                </h2>
                                <div className="flex items-center justify-between">
                                    <p className="text-white/40 max-w-sm text-sm font-medium leading-relaxed uppercase tracking-widest">
                                        Join the global elite. Silent co-working for the modern architect of reality.
                                    </p>
                                    <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center transition-all duration-700 group-hover:bg-accent group-hover:scale-110">
                                        <ArrowRight className="w-10 h-10" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Skill Tree & Proof of Work */}
                    <div className="grid grid-cols-1 gap-12">
                        <SkillTree />
                        <ProjectGallery />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <AnimatedSection delay={0.2}>
                            <div className="glass p-12 rounded-[3.5rem] h-full flex flex-col justify-between group hover:border-primary/50 transition-all duration-700">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-8 block italic">Temporal Engine</span>
                                    <FocusTimer />
                                </div>
                            </div>
                        </AnimatedSection>

                        <AnimatedSection delay={0.3}>
                            <div className="glass p-12 rounded-[3.5rem] h-full flex flex-col justify-between group hover:border-accent/50 transition-all duration-700">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-8 block italic">Cognitive Consistency</span>
                                    <HeatmapStats />
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>

                {/* Right Artistic Column */}
                <div className="lg:col-span-4 space-y-12">
                    <AnimatedSection delay={0.4}>
                        <div className="glass p-12 rounded-[3.5rem] min-h-[500px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <Globe className="w-6 h-6 text-primary/40 animate-spin-slow" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-12 block italic">Digital Biosphere</span>
                            <div className="h-72 mb-12">
                                <DigitalPlanet3D />
                            </div>
                            <Button variant="outline" onClick={() => navigate("/social?tab=planets")} className="w-full rounded-2xl h-14 font-black border-white/5 hover:bg-white/5 uppercase tracking-widest text-[10px]">
                                Evolve Civilization
                            </Button>
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.5} className="h-full">
                        <div className="glass p-12 rounded-[3.5rem] h-full border-primary/20">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-8 block italic">The Elite Oracle</span>
                            <AICoachPanel />
                        </div>
                    </AnimatedSection>
                </div>

            </main>

            <footer className="pt-32 pb-12 text-center">
                <p className="text-[10px] font-black tracking-[0.6em] opacity-10 uppercase italic">A Monument to Pure Intent • OnlyFocus MMXXV</p>
            </footer>
        </div>
    );
};

export default MainDashboard;