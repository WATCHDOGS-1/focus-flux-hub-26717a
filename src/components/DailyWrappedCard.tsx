import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Tag, Zap, Loader2, Calendar, Trophy, BarChart3 } from "lucide-react";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
                const topTag = Object.entries(tags).sort((a: any, b: any) => b[1] - a[1])[0][0];
                setStats({ total, topTag, count: data.length });
            }
            setIsLoading(false);
        };
        fetchStats();
    }, [userId]);

    if (isLoading) return <div className="h-48 glass animate-pulse rounded-3xl" />;
    if (!stats) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 rounded-[2.5rem] premium-gradient text-white space-y-6 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <BarChart3 className="w-48 h-48" />
            </div>
            
            <div className="space-y-2 relative z-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Your Yesterday in Focus</span>
                <h3 className="text-4xl font-black italic tracking-tighter">THE WRAPPED</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl">
                    <Clock className="w-5 h-5 mb-2 text-accent" />
                    <div className="text-3xl font-bold">{stats.total}m</div>
                    <div className="text-xs opacity-60">Total Flow State</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl">
                    <Tag className="w-5 h-5 mb-2 text-accent" />
                    <div className="text-xl font-bold truncate">{stats.topTag}</div>
                    <div className="text-xs opacity-60">Dominant Peak</div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">{stats.count} Sessions Logged</span>
                </div>
                <Trophy className="w-6 h-6 opacity-40" />
            </div>
        </motion.div>
    );
};

export default DailyWrappedCard;