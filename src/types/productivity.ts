export interface Task {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    tags: string[];
    estimatedPomodoros: number; // Number of 25-minute pomodoros estimated
    start_time?: string; // For calendar scheduling
    end_time?: string; // For calendar scheduling
}

export const MOCK_TASKS: Task[] = [
    { id: 'task-1', title: 'Implement Kanban Board Drag & Drop', status: 'in_progress', tags: ['Coding', 'Frontend'], estimatedPomodoros: 3 },
    { id: 'task-2', title: 'Review Chapter 5 of Calculus', status: 'todo', tags: ['Reading', 'Math'], estimatedPomodoros: 2 },
    { id: 'task-3', title: 'Draft AI Coach System Prompt', status: 'done', tags: ['Writing', 'AI'], estimatedPomodoros: 1 },
    { id: 'task-4', title: 'Design Planet Biome Logic', status: 'todo', tags: ['Design', 'Gamification'], estimatedPomodoros: 4 },
];

export const KANBAN_COLUMNS = {
    todo: { id: 'todo', title: 'To Do' },
    in_progress: { id: 'in_progress', title: 'In Progress' },
    done: { id: 'done', title: 'Done' },
};