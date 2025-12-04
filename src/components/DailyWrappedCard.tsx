import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Tag, Zap, Loader2, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DailySummary {
    totalMinutes: number;
    sessionCount: number;
    topTag: string;
}

const DailyWrappedCard = () => {
    const { userId } = useAuth();
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Calculate yesterday's date for the report
    const yesterday = subDays(new Date(), 1);
    const yesterdayISO = format(yesterday, 'yyyy-MM-dd');
    const yesterdayDisplay = format(yesterday, 'EEEE, MMM do');

    useEffect(() => {
        if (!userId) return;
        fetchDailySummary(userId);
    }, [userId]);

    const fetchDailySummary = async (uid: string) => {
        setIsLoading(true);
        
        // Fetch sessions that started yesterday
        const { data: sessions, error } = await supabase
            .from("focus_sessions")
            .select("duration_minutes, tag")
            .eq("user_id", uid)
            .gte("start_time", yesterdayISO + 'T00:00:00Z')
            .lte("start_time", yesterdayISO + 'T23:59:59Z')
            .not("duration_minutes", "is", null)
            .gt("duration_minutes", 0);

        if (error) {
            console.error("Error fetching daily summary:", error);
            toast.error("Failed to load yesterday's focus summary.");
            setIsLoading(false);
            return;
        }

        if (sessions && sessions.length > 0) {
            let totalMinutes = 0;
            const tagCounts: { [key: string]: number } = {};

            sessions.forEach(session => {
                const minutes = session.duration_minutes || 0;
                const tag = session.tag || "General Focus";
                totalMinutes += minutes;
                tagCounts[tag] = (tagCounts[tag] || 0) + minutes;
            });

            const topTag = Object.keys(tagCounts).reduce((a, b) => tagCounts[a] > tagCounts[b] ? a : b, "General Focus");

            setSummary({
                totalMinutes,
                sessionCount: sessions.length,
                topTag,
            });
        } else {
            setSummary(null);
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <Card className="glass-card p-4 animate-pulse">
                <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading Daily Wrapped...
                </div>
            </Card>
        );
    }

    if (!summary) {
        return (
            <Card className="glass-card p-4 border-border/50">
                <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-5 h-5" /> Yesterday's Focus ({yesterdayDisplay})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">No focus sessions logged for yesterday. Start a session today!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("glass-card p-4 border-primary/50 shadow-glow-sm", summary.totalMinutes > 60 ? "bg-primary/10" : "bg-secondary/10")}>
            <CardHeader className="p-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                    <Zap className="w-6 h-6" /> Your Focus Wrapped: {yesterdayDisplay}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Total Focused Time</span>
                    <span className="font-bold text-lg">{summary.totalMinutes} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" /> Top Focus Area</span>
                    <span className="font-bold text-lg text-accent">{summary.topTag}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4" /> Sessions Completed</span>
                    <span className="font-bold text-lg">{summary.sessionCount}</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default DailyWrappedCard;