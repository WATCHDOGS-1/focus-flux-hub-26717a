import { Task } from "@/types/productivity";

export interface Quest {
    id: string;
    title: string;
    description: string;
    targetCount: number;
    currentCount: number;
    rewardXP: number;
    rewardStardust: number; // New currency
    isCompleted: boolean;
    type: 'tag_completion' | 'pomodoro_goal' | 'streak_maintenance';
}

/**
 * Generates daily quests based on the user's current task list.
 * @param tasks The user's current tasks.
 * @returns An array of generated quests.
 */
export const generateDailyQuests = (tasks: Task[]): Quest[] => {
    const quests: Quest[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Tag-based Quests (Focus on dominant tags)
    const tagCounts: { [tag: string]: number } = {};
    tasks.filter(t => t.status !== 'done').forEach(task => {
        task.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    Object.entries(tagCounts).forEach(([tag, count]) => {
        if (count >= 3) {
            quests.push({
                id: `quest-tag-${tag}-${today}`,
                title: `${tag} Specialist: Complete ${count} ${tag} tasks`,
                description: `Finish all ${count} tasks tagged '${tag}' today.`,
                targetCount: count,
                currentCount: tasks.filter(t => t.tags.includes(tag) && t.status === 'done').length,
                rewardXP: 100 * count,
                rewardStardust: 50 * count,
                isCompleted: tasks.filter(t => t.tags.includes(tag)).every(t => t.status === 'done'),
                type: 'tag_completion',
            });
        }
    });

    // 2. Pomodoro Goal Quest (Based on total estimated poms)
    const totalPoms = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
    if (totalPoms >= 5) {
        quests.push({
            id: `quest-pom-5-${today}`,
            title: "Pomodoro Marathon: Complete 5+ Poms",
            description: "Log at least 5 Pomodoros (125 minutes) of focused time.",
            targetCount: 5,
            currentCount: 0, // This needs to be tracked externally (e.g., via session history)
            rewardXP: 250,
            rewardStardust: 150,
            isCompleted: false,
            type: 'pomodoro_goal',
        });
    }
    
    // 3. Daily Consistency Quest (Placeholder for streak logic)
    quests.push({
        id: `quest-daily-checkin-${today}`,
        title: "Daily Check-in",
        description: "Log at least one focus session today.",
        targetCount: 1,
        currentCount: 0, // Tracked externally
        rewardXP: 50,
        rewardStardust: 25,
        isCompleted: false,
        type: 'streak_maintenance',
    });

    return quests;
};