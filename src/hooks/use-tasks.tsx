import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import { Task, MOCK_TASKS, KANBAN_COLUMNS } from "@/types/productivity";
import { toast } from "sonner";

interface TaskContextType {
    tasks: Task[];
    columns: typeof KANBAN_COLUMNS;
    updateTaskStatus: (taskId: string, newStatus: Task['status']) => void;
    addTask: (title: string, estimatedPomodoros: number, tags: string[]) => void;
    updateTask: (task: Task) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
    
    const updateTaskStatus = useCallback((taskId: string, newStatus: Task['status']) => {
        setTasks(prev => 
            prev.map(task => 
                task.id === taskId ? { ...task, status: newStatus } : task
            )
        );
        toast.info(`Task moved to ${KANBAN_COLUMNS[newStatus].title}.`);
    }, []);
    
    const addTask = useCallback((title: string, estimatedPomodoros: number, tags: string[]) => {
        const newId = `task-${Date.now()}`;
        const newTask: Task = {
            id: newId,
            title,
            status: 'todo',
            tags,
            estimatedPomodoros,
        };
        setTasks(prev => [...prev, newTask]);
        toast.success("Task added!");
    }, []);
    
    const updateTask = useCallback((updatedTask: Task) => {
        setTasks(prev => 
            prev.map(task => 
                task.id === updatedTask.id ? updatedTask : task
            )
        );
    }, []);

    return (
        <TaskContext.Provider value={{ tasks, columns: KANBAN_COLUMNS, updateTaskStatus, addTask, updateTask }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error("useTasks must be used within a TaskProvider");
    }
    return context;
};