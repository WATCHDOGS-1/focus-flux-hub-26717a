import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Clock, Tag, Zap, BarChart3, Trophy } from "lucide-react";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";

const DailyWrappedCard = () => {
    const { userId } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!userId) return;
        const fetchStats = async () => {
            const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
            const { data } = await supabase
                .from("focus_sessions")
                .select("duration_minutes, tag")
                .eq("user_id", userId)
                .gte("start_time", yesterday + 'T00:00:00Z')
                .lte("start_time", yesterday + 'T23:59:59Z');
            
            if (data && data.length > 0) {
                const total = data.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
                const tags = data.reduce((acc: any, curr) => {
                    acc[curr.tag || "General"] = (acc[curr.tag || "General"] || 0) + (curr.duration_minutes || 0);
                    return acc;
                }, {});
                const sortedTags = Object.entries(tags).sort((a: any, b: any) => b[1] - a[1]);
                const topTag = sortedTags[0][0];
                setStats({ total, topTag, count: data.length });
            }
            setIsLoading(false);
        };
        fetchStats();
    }, [userId]);

    if (isLoading) return <div className="h-48 glass-card animate-pulse rounded-[2.5rem]" />;
    if (!stats) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer"
        >
            <div className="absolute inset-0 premium-gradient rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
            <div className="glass-card p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden border-white/10">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                
                <div className="space-y-1 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Intelligence Report</span>
                    <h3 className="text-5xl font-black italic tracking-tighter leading-none">THE WRAPPED.</h3>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                        <Clock className="w-4 h-4 mb-4 text-accent" />
                        <div className="text-4xl font-black tracking-tighter">{stats.total}m</div>
                        <div className="text-[10px] uppercase font-bold opacity-40 mt-1">Flow Duration</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                        <Tag className="w-4 h-4 mb-4 text-primary" />
                        <div className="text-xl font-black tracking-tighter truncate">{stats.topTag}</div>
                        <div className="text-[10px] uppercase font-bold opacity-40 mt-1">Cognitive Peak</div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-yellow-400/10">
                            <Zap className="w-4 h-4 text-yellow-400" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">{stats.count} Sessions Verified</span>
                    </div>
                    <Trophy className="w-8 h-8 opacity-10 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-110" />
                </div>
            </div>
        </motion.div>
    );
};

export default DailyWrappedCard;