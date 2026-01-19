import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useUserStats } from "./use-user-stats";
import { getLevelThresholds, getRecentFocusSessions } from "@/utils/session-management";

export type PlanetTheme = 'cyberpunk' | 'library' | 'arena' | 'default';

interface CivilizationData {
    name: string;
    level: number;
    growthPoints: number; // Total XP
    stardust: number; // New currency
    planetTheme: PlanetTheme;
    satelliteCount: number; // New: based on streaks
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
    'sports': 'arena',
    'general': 'default',
};

/**
 * Manages the state and logic for the Digital Planets gamification system.
 */
export function useCivilization(): { data: CivilizationData | null, isLoading: boolean } {
    const { userId } = useAuth();
    const { stats, levels, isLoading: isLoadingStats } = useUserStats();
    const [civilizationData, setCivilizationData] = useState<CivilizationData | null>(null);
    const [isLoadingBiome, setIsLoadingBiome] = useState(true);

    const calculateBiome = async (uid: string): Promise<PlanetTheme> => {
        const recentSessions = await getRecentFocusSessions(uid, 'week');
        if (recentSessions.length === 0) return 'default';

        const tagMinutes: { [tag: string]: number } = {};
        recentSessions.forEach(s => {
            const normalizedTag = s.tag.toLowerCase().split(' ')[0];
            tagMinutes[normalizedTag] = (tagMinutes[normalizedTag] || 0) + s.totalMinutes;
        });

        let dominantTag = 'general';
        let maxMinutes = 0;
        
        Object.entries(tagMinutes).forEach(([tag, minutes]) => {
            if (minutes > maxMinutes) {
                dominantTag = tag;
                maxMinutes = minutes;
            }
        });
        
        return BIOME_MAPPING[dominantTag] || 'default';
    };

    useEffect(() => {
        if (!userId || isLoadingStats) {
            setCivilizationData(null);
            setIsLoadingBiome(false);
            return;
        }
        
        const loadCivData = async () => {
            setIsLoadingBiome(true);
            
            const thresholds = getLevelThresholds();
            const defaultLevelData = thresholds[0];

            const currentLevels = levels || { 
                total_xp: defaultLevelData.xp, 
                level: defaultLevelData.level, 
                title: defaultLevelData.title,
                stardust: 0, // Default if levels is null
            };
            
            // --- Stardust (Fetched from levels data) ---
            const stardust = (currentLevels as any).stardust || 0; // Assuming stardust is now part of levels

            // --- Biome Calculation ---
            const planetTheme = await calculateBiome(userId);

            // --- Satellites (Based on Longest Streak) ---
            const satelliteCount = Math.floor((stats?.longest_streak || 0) / 7);

            const currentXP = currentLevels.total_xp;
            const currentLevel = currentLevels.level;
            
            // XP Progression Calculation
            const nextLevelData = thresholds.find(t => t.level === currentLevel + 1);
            let progressPercent = 0;
            let xpToNextLevel = 0;
            let currentLevelXPBase = 0;

            if (nextLevelData) {
                currentLevelXPBase = thresholds.find(t => t.level === currentLevel)?.xp || 0;
                const nextLevelXP = nextLevelData.xp;
                
                const xpInCurrentLevel = currentXP - currentLevelXPBase;
                const xpNeededForNextLevel = nextLevelXP - currentLevelXPBase;
                
                xpToNextLevel = xpNeededForNextLevel - xpInCurrentLevel;
                progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
            } else {
                progressPercent = 100;
            }

            setCivilizationData({
                name: currentLevels.title || "Novice Civilization",
                level: currentLevel,
                growthPoints: currentXP,
                stardust,
                planetTheme,
                satelliteCount,
                xpToNextLevel,
                progressPercent: Math.min(100, progressPercent),
            });
            setIsLoadingBiome(false);
        };

        loadCivData();
    }, [levels, stats, userId, isLoadingStats]);

    return {
        data: civilizationData,
        isLoading: isLoadingStats || isLoadingBiome,
    };
}