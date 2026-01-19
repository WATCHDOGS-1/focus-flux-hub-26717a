import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Title, Tracker, type Color } from "@tremor/react";
import { useAuth } from "@/hooks/use-auth";

interface TrackerBlock {
  color: Color;
  tooltip: string;
}

const ConceptMasteryHeatmap = () => {
  const { userId } = useAuth();
  const [data, setData] = useState<TrackerBlock[]>([]);

  useEffect(() => {
    const fetchMastery = async () => {
        const { data: mastery } = await supabase
            .from('concept_mastery')
            .select('*')
            .eq('user_id', userId)
            .order('mastery_score', { ascending: true });

        if (mastery) {
            const blocks: TrackerBlock[] = mastery.map(m => ({
                color: m.mastery_score > 0.8 ? "emerald" : m.mastery_score > 0.5 ? "yellow" : "rose",
                tooltip: `${m.concept}: ${Math.floor(m.mastery_score * 100)}% Mastery`
            }));
            setData(blocks);
        }
    };
    if (userId) fetchMastery();
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">Concept Half-Life</h4>
      </div>
      <Tracker data={data} className="mt-2" />
      <p className="text-[9px] font-bold uppercase tracking-widest opacity-20 text-center">RED = KNOWLEDGE DEBT DETECTED</p>
    </div>
  );
};

export default ConceptMasteryHeatmap;