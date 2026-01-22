import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useUserStats } from "./use-user-stats";
import { getLevelThresholds, getRecentFocusSessions } from "@/utils/session-management";

export type PlanetTheme = 'cyberpunk' | 'library' | 'arena' | 'default' | 'oceanic' | 'volcanic';

interface CivilizationData {
    name: string;
    level: number;
    tier: 'Dust' | 'Spark' | 'Core' | 'Planet' | 'Civilization' | 'Supernova';
    growthPoints: number;
    stardust: number;
    planetTheme: PlanetTheme;
    satelliteCount: number;
    xpToNextLevel: number;
    progressPercent: number;
}

const BIOME_MAPPING: { [tag: string]: PlanetTheme } = {
    'coding': 'cyberpunk',
    'programming': 'cyberpunk',
    'design': 'cyberpunk',
    'writing': 'library',
    'reading': 'library',
    'math': 'library',
    'fitness': 'arena',
    'general': 'default',
    'meditation': 'oceanic',
    'science': 'volcanic'
};

export function useCivilization(): { data: CivilizationData | null, isLoading: boolean } {
    const { userId } = useAuth();
    const { stats, levels, isLoading: isLoadingStats } = useUserStats();
    const [civilizationData, setCivilizationData] = useState<CivilizationData | null>(null);

    useEffect(() => {
        if (!userId || isLoadingStats) return;
        
        const loadCivData = async () => {
            const currentXP = levels?.total_xp || 0;
            const currentLevel = levels?.level || 1;
            
            // Tier Logic
            let tier: CivilizationData['tier'] = 'Dust';
            if (currentLevel >= 8) tier = 'Supernova';
            else if (currentLevel >= 6) tier = 'Civilization';
            else if (currentLevel >= 4) tier = 'Planet';
            else if (currentLevel >= 3) tier = 'Core';
            else if (currentLevel >= 2) tier = 'Spark';

            // Biome from Tag
            const recent = await getRecentFocusSessions(userId, 'week');
            const dominantTag = recent.length > 0 ? recent[0].tag.toLowerCase() : 'general';
            const planetTheme = BIOME_MAPPING[dominantTag] || 'default';

            const thresholds = getLevelThresholds();
            const nextLevelData = thresholds.find(t => t.level === currentLevel + 1);
            const currentLevelBase = thresholds.find(t => t.level === currentLevel)?.xp || 0;
            
            const progress = nextLevelData 
                ? ((currentXP - currentLevelBase) / (nextLevelData.xp - currentLevelBase)) * 100 
                : 100;

            setCivilizationData({
                name: levels?.title || "Focus Initiate",
                level: currentLevel,
                tier,
                growthPoints: currentXP,
                stardust: parseInt(localStorage.getItem(`stardust_${userId}`) || '0'),
                planetTheme,
                satelliteCount: Math.floor((stats?.longest_streak || 0) / 5),
                xpToNextLevel: nextLevelData ? nextLevelData.xp - currentXP : 0,
                progressPercent: Math.min(100, progress),
            });
        };

        loadCivData();
    }, [levels, stats, userId, isLoadingStats]);

    return { data: civilizationData, isLoading: isLoadingStats };
}