import { useState, useEffect } from "react";
import { useFocusSession } from "@/hooks/use-focus-session";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Play, Pause, StopCircle, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import AmbientBackground from "./AmbientBackground";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const FocusHUD = ({ onExitZenMode }: { onExitZenMode: () => void }) => {
    const { timeLeft, isActive, isBreak, focusTag, toggleTimer, endCurrentSession, progress } = useFocusSession();
    const [percentile, setPercentile] = useState<number | null>(null);

    useEffect(() => {
        const fetchRank = async () => {
            if (!focusTag) return;
            const { data, error } = await supabase.rpc('get_user_focus_percentile', { 
                target_tag: focusTag,
                target_user_id: (await supabase.auth.getUser()).data.user?.id
            });
            if (!error) setPercentile(Math.floor(data));
        };
        fetchRank();
    }, [focusTag]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white overflow-hidden bg-background">
            <AmbientBackground isActive={true} className="absolute inset-0 z-0" />

            {/* Percentile Pressure Indicator */}
            {percentile !== null && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 glass-card px-6 py-3 rounded-full border-primary/30 animate-subtle-pulse">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="text-sm font-black italic tracking-tighter uppercase">
                        Rank: Top {100 - percentile}% in {focusTag}
                    </span>
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center gap-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-3xl font-black italic tracking-tighter text-primary uppercase">
                        {isBreak ? "Recharge State" : focusTag || "Deep Work"}
                    </h2>
                </motion.div>

                <div className="text-[12rem] md:text-[18rem] font-black italic tracking-tighter leading-none font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-8">
                    <Button size="lg" className="h-20 w-20 rounded-full glass-interactive" onClick={toggleTimer}>
                        {isActive ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                    </Button>
                    <Button variant="destructive" size="lg" className="h-20 w-20 rounded-full" onClick={onExitZenMode}>
                        <StopCircle className="h-10 w-10" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FocusHUD;