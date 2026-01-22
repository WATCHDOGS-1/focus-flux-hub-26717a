import { motion } from "framer-motion";
import { Globe, Rocket, Satellite, Star, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCivilization, PlanetTheme } from "@/hooks/use-civilization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BIOME_STYLES: Record<PlanetTheme, { p: string, s: string, glow: string }> = {
    'default': { p: "#3B82F6", s: "#60A5FA", glow: "shadow-[0_0_50px_rgba(59,130,246,0.5)]" },
    'cyberpunk': { p: "#A855F7", s: "#D8B4FE", glow: "shadow-[0_0_50px_rgba(168,85,247,0.5)]" },
    'library': { p: "#F59E0B", s: "#FCD34D", glow: "shadow-[0_0_50px_rgba(245,158,11,0.5)]" },
    'arena': { p: "#EF4444", s: "#F87171", glow: "shadow-[0_0_50px_rgba(239,68,68,0.5)]" },
    'oceanic': { p: "#06B6D4", s: "#67E8F9", glow: "shadow-[0_0_50px_rgba(6,182,212,0.5)]" },
    'volcanic': { p: "#F97316", s: "#FDBA74", glow: "shadow-[0_0_50px_rgba(249,115,22,0.5)]" },
};

const DigitalPlanetView = () => {
    const { data: civ, isLoading } = useCivilization();

    if (isLoading || !civ) return <div className="h-64 flex items-center justify-center opacity-20"><Globe className="animate-spin" /></div>;

    const theme = BIOME_STYLES[civ.planetTheme] || BIOME_STYLES.default;
    const size = 180;

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-6 select-none">
            {/* Background Atmosphere */}
            <div className={cn("absolute rounded-full blur-[80px] opacity-20", theme.glow)} style={{ width: size * 1.5, height: size * 1.5 }} />

            {/* Orbiting Satellites (Based on Streak) */}
            <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(civ.satelliteCount)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15 + (i * 5), repeat: Infinity, ease: "linear" }}
                        style={{ width: size + 80 + (i * 40), height: size + 80 + (i * 40) }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/40 rounded-full blur-[2px]" />
                        <Rocket className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 text-primary" style={{ transform: 'rotate(90deg)' }} />
                    </motion.div>
                ))}
            </div>

            {/* Main Planet Body */}
            <motion.div
                className={cn("rounded-full relative overflow-hidden", theme.glow)}
                style={{ 
                    width: size, 
                    height: size,
                    background: `radial-gradient(circle at 30% 30%, ${theme.s} 0%, ${theme.p} 50%, #050505 100%)`,
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            >
                {/* Cloud/Atmosphere Layer */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150" />
                
                {/* Evolution Tiers */}
                {civ.level >= 3 && <div className="absolute inset-0 border-[10px] border-white/5 rounded-full" />}
                {civ.level >= 5 && <motion.div animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-white/10 blur-xl" />}
            </motion.div>

            {/* Sessional Stats Overlay */}
            <div className="mt-8 text-center space-y-3 z-10">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">{civ.tier} TIER</h3>
                <div className="flex gap-2 justify-center">
                    <Badge variant="outline" className="bg-primary/10 border-primary/20 text-[10px] uppercase font-black px-3">Lvl {civ.level}</Badge>
                    <Badge variant="outline" className="bg-accent/10 border-accent/20 text-[10px] uppercase font-black px-3">{civ.growthPoints} XP</Badge>
                </div>
                
                {/* Growth Progress */}
                <div className="w-64 space-y-1">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-primary shadow-[0_0_10px_#A855F7]"
                            initial={{ width: 0 }}
                            animate={{ width: `${civ.progressPercent}%` }}
                        />
                    </div>
                    <p className="text-[9px] uppercase font-bold tracking-widest opacity-40 text-right">Evolution: {Math.floor(civ.progressPercent)}%</p>
                </div>
            </div>
        </div>
    );
};

export default DigitalPlanetView;