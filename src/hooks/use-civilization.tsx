import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useUserStats } from "./use-user-stats";
import { getLevelThresholds, getRecentFocusSessions } from "@/utils/session-management";
import { supabase } from "@/integrations/supabase/client";

export type PlanetTheme = 'cyberpunk' | 'library' | 'arena' | 'default';

interface CivilizationData {
    name: string;
    level: number;
    growthPoints: number;
    stardust: number;
    planetTheme: PlanetTheme;
    satelliteCount: number;
    xpToNextLevel: number;
    progressPercent: number;
    isDying?: boolean; // New: Squad status
}

export function useCivilization(): { data: CivilizationData | null, isLoading: boolean } {
    const { userId } = useAuth();
    const { stats, levels, isLoading: isLoadingStats } = useUserStats();
    const [civilizationData, setCivilizationData] = useState<CivilizationData | null>(null);

    useEffect(() => {
        if (!userId || isLoadingStats) return;
        
        const load = async () => {
            const thresholds = getLevelThresholds();
            const currentXP = levels?.total_xp || 0;
            const currentLevel = levels?.level || 1;

            // --- Deadbeat Prevention: Check Circle participation ---
            const { data: membership } = await supabase.from('circle_members').select('circle_id').eq('user_id', userId).maybeSingle();
            let isDying = false;

            if (membership) {
                const { data: peers } = await supabase.from('circle_members').select('user_id').eq('circle_id', membership.circle_id);
                // In a real app, you'd check last_active of all user_ids here
                // Simulate: if peers > 1, check participation
                isDying = false; // Mock for now
            }

            const nextLevel = thresholds.find(t => t.level === currentLevel + 1);
            const xpToNext = nextLevel ? nextLevel.xp - currentXP : 0;
            const progress = nextLevel ? (currentXP / nextLevel.xp) * 100 : 100;

            setCivilizationData({
                name: levels?.title || "Aspirant",
                level: currentLevel,
                growthPoints: currentXP,
                stardust: (levels as any)?.stardust || 0,
                planetTheme: 'default',
                satelliteCount: Math.floor((stats?.longest_streak || 0) / 7),
                xpToNextLevel: xpToNext,
                progressPercent: progress,
                isDying
            });
        };
        load();
    }, [levels, stats, userId, isLoadingStats]);

    return { data: civilizationData, isLoading: isLoadingStats };
}