import { useState, useEffect } from "react";
import { useFocusSession } from "@/hooks/use-focus-session";
import { useStudy } from "@/context/StudyContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle, Trophy, Users, Zap } from "lucide-react";
import AmbientBackground from "./AmbientBackground";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const FocusHUD = ({ onExitZenMode }: { onExitZenMode: () => void }) => {
    const { timeLeft, isActive, isBreak, toggleTimer, progress } = useFocusSession();
    const { focusTag, livePeers } = useStudy();
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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white overflow-hidden bg-[#0B0E11]">
            <AmbientBackground isActive={isActive} className="absolute inset-0 z-0 opacity-20" />

            {/* Tactical Status Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 border-b border-white/5 flex justify-between items-center glass">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-primary font-mono text-xs">
                        <Users className="w-3 h-3" /> LIVE PEERS: {livePeers}
                    </div>
                    <div className="flex items-center gap-2 text-accent font-mono text-xs">
                        <Zap className="w-3 h-3" /> FOCUS: {focusTag.toUpperCase()}
                    </div>
                </div>
                {percentile !== null && (
                    <div className="flex items-center gap-2 text-yellow-500 font-mono text-xs animate-pulse">
                        <Trophy className="w-3 h-3" /> SESSIONAL RANK: TOP {100 - percentile}%
                    </div>
                )}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="text-[14rem] md:text-[22rem] font-black tracking-tighter leading-none font-mono text-white/90">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-4">
                    <Button size="lg" className="h-16 w-32 rounded-sm bg-primary hover:bg-primary/80 font-bold" onClick={toggleTimer}>
                        {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                        {isActive ? "PAUSE" : "ENGAGE"}
                    </Button>
                    <Button variant="outline" size="lg" className="h-16 w-32 rounded-sm border-white/10 font-bold" onClick={onExitZenMode}>
                        <StopCircle className="mr-2" /> EXIT
                    </Button>
                </div>
            </div>
            
            {/* Mission Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <motion.div 
                    className="h-full bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default FocusHUD;