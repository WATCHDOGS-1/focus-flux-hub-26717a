import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ChevronLeft, ChevronRight, Users, Zap, Shield } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Leaderboard = ({ onProfileClick }: { onProfileClick: (id: string) => void }) => {
  const { userId } = useAuth();
  const [view, setView] = useState<'individual' | 'squad'>('individual');
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSquadRankings = async () => {
    setIsLoading(true);
    // Calculate Intensity Score: (Collective Mins / Member Count)
    const { data, error } = await supabase.from('circles').select(`
        id,
        name,
        circle_members (user_id),
        weekly_stats:circle_members (user_id, weekly_stats(total_minutes))
    `);

    if (data) {
        const squadStats = data.map((squad: any) => {
            const memberCount = squad.circle_members.length || 1;
            const totalMins = squad.circle_members.reduce((acc: number, mem: any) => {
                const mins = mem.weekly_stats?.[0]?.total_minutes || 0;
                return acc + mins;
            }, 0);
            return {
                id: squad.id,
                name: squad.name,
                intensityScore: Math.floor(totalMins / memberCount),
                memberCount
            };
        }).sort((a, b) => b.intensityScore - a.intensityScore);
        setEntries(squadStats);
    }
    setIsLoading(false);
  };

  useEffect(() => {
      if (view === 'squad') loadSquadRankings();
      else {
          // Fallback to existing individual logic (omitted for brevity in this snippet)
          setEntries([]);
          setIsLoading(false);
      }
  }, [view]);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
          <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
              <Trophy className="text-primary" /> The Gauntlet
          </h3>
          <Tabs value={view} onValueChange={(v: any) => setView(v)}>
              <TabsList className="bg-white/5 border border-white/10 rounded-full h-10">
                  <TabsTrigger value="individual" className="rounded-full px-4 text-[10px] font-bold uppercase">Solo</TabsTrigger>
                  <TabsTrigger value="squad" className="rounded-full px-4 text-[10px] font-bold uppercase">Squads</TabsTrigger>
              </TabsList>
          </Tabs>
      </div>

      <div className="space-y-3 overflow-y-auto pr-2">
        {isLoading ? (
            <div className="text-center py-10 opacity-40 uppercase text-[10px] font-black tracking-widest animate-pulse">Syncing Ranks...</div>
        ) : entries.map((entry, i) => (
            <div key={entry.id} className="glass p-6 rounded-[2rem] flex items-center justify-between border-white/5 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-6">
                    <span className="text-2xl font-black italic text-white/20">#0{i+1}</span>
                    <div>
                        <h4 className="font-black italic tracking-tighter uppercase">{entry.name}</h4>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3 h-3" /> {entry.memberCount} Members
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black italic tracking-tighter text-primary">{entry.intensityScore}⚡</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Intensity</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;