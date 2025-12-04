import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useUserStats } from "./use-user-stats";

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
        if (isLoadingStats || !levels) {
            setCivilizationData(null);
            return;
        }

        // Map existing level data to the new civilization model
        const currentXP = levels.total_xp;
        const currentLevel = levels.level;
        
        // Simple logic to determine planet theme based on level parity
        const planetTheme = currentLevel % 3 === 0 ? 'purple' : currentLevel % 2 === 0 ? 'green' : 'blue';

        // Placeholder calculation for XP progression (copied from ProfileMenu logic)
        const LEVEL_THRESHOLDS = [
            { level: 1, xp: 0, title: "Novice" },
            { level: 2, xp: 500, title: "Apprentice" },
            { level: 3, xp: 1500, title: "Adept" },
            { level: 4, xp: 3000, title: "Expert" },
            { level: 5, xp: 5000, title: "Master" },
            { level: 6, xp: 8000, title: "Grandmaster" },
            { level: 7, xp: 12000, title: "Legend" },
            { level: 8, xp: 20000, title: "Ascended" },
        ];
        
        const nextLevelData = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
        let progressPercent = 0;
        let xpToNextLevel = 0;
        let currentLevelXPBase = 0;

        if (nextLevelData) {
            currentLevelXPBase = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)?.xp || 0;
            const nextLevelXP = nextLevelData.xp;
            
            const xpInCurrentLevel = currentXP - currentLevelXPBase;
            const xpNeededForNextLevel = nextLevelXP - currentLevelXPBase;
            
            xpToNextLevel = xpNeededForNextLevel - xpInCurrentLevel;
            progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
        } else {
            progressPercent = 100;
        }

        setCivilizationData({
            name: levels.title || "Novice Civilization",
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