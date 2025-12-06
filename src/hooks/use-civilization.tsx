import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useUserStats } from "./use-user-stats";
import { getLevelThresholds } from "@/utils/session-management";

interface CivilizationData {
    name: string;
    level: number;
    growthPoints: number; // XP is used as the base for growth points
    planetTheme: 'blue' | 'green' | 'red' | 'purple';
    xpToNextLevel: number;
    progressPercent: number;
}

/**
 * Manages the state and logic for the Digital Planets gamification system.
 * Currently uses existing XP/Level data as the source for 'growth points'.
 */
export function useCivilization(): { data: CivilizationData | null, isLoading: boolean } {
    const { userId } = useAuth();
    const { levels, isLoading: isLoadingStats } = useUserStats();
    const [civilizationData, setCivilizationData] = useState<CivilizationData | null>(null);

    useEffect(() => {
        if (isLoadingStats) {
            setCivilizationData(null);
            return;
        }
        
        const thresholds = getLevelThresholds();
        const defaultLevelData = thresholds[0];

        // Use default data if levels is null (new user)
        const currentLevels = levels || { 
            total_xp: defaultLevelData.xp, 
            level: defaultLevelData.level, 
            title: defaultLevelData.title 
        };

        const currentXP = currentLevels.total_xp;
        const currentLevel = currentLevels.level;
        
        // Simple logic to determine planet theme based on level parity
        const planetTheme = (currentLevel % 4 === 0 ? 'purple' : currentLevel % 3 === 0 ? 'red' : currentLevel % 2 === 0 ? 'green' : 'blue') as CivilizationData['planetTheme'];

        // Placeholder calculation for XP progression
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
            planetTheme,
            xpToNextLevel,
            progressPercent: Math.min(100, progressPercent),
        });

    }, [levels, isLoadingStats]);

    return {
        data: civilizationData,
        isLoading: isLoadingStats,
    };
}