import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import { Task, KANBAN_COLUMNS } from "@/types/productivity";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface TaskContextType {
    tasks: Task[];
    columns: typeof KANBAN_COLUMNS;
    isLoading: boolean;
    refetch: () => void;
    updateTaskStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
    addTask: (title: string, estimatedPomodoros: number, tags: string[]) => Promise<void>;
    updateTask: (task: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const fetchTasks = async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching tasks:", error);
        throw new Error("Failed to fetch tasks.");
    }
    return data as Task[];
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const { userId, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading, refetch } = useQuery({
        queryKey: ['tasks', userId],
        queryFn: () => fetchTasks(userId!),
        enabled: isAuthenticated && !!userId,
        initialData: [],
    });

    const invalidateTasks = () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    };

    const updateTaskStatus = useCallback(async (taskId: string, newStatus: Task['status']) => {
        if (!userId) return;
        
        const { error } = await supabase
            .from("tasks")
            .update({ status: newStatus })
            .eq("id", taskId)
            .eq("user_id", userId);

        if (error) {
            toast.error(`Failed to update task status: ${error.message}`);
        } else {
            invalidateTasks();
            toast.info(`Task moved to ${KANBAN_COLUMNS[newStatus].title}.`);
        }
    }, [userId]);
    
    const addTask = useCallback(async (title: string, estimatedPomodoros: number, tags: string[]) => {
        if (!userId) return;
        
        const { error } = await supabase
            .from("tasks")
            .insert({
                user_id: userId,
                title,
                status: 'todo',
                estimated_pomodoros: estimatedPomodoros,
                tags: tags as any, // Cast to any for JSONB type compatibility
            });

        if (error) {
            toast.error(`Failed to add task: ${error.message}`);
        } else {
            invalidateTasks();
            toast.success("Task added!");
        }
    }, [userId]);
    
    const updateTask = useCallback(async (updatedTask: Partial<Task>) => {
        if (!userId || !updatedTask.id) return;
        
        const { error } = await supabase
            .from("tasks")
            .update(updatedTask)
            .eq("id", updatedTask.id)
            .eq("user_id", userId);

        if (error) {
            toast.error(`Failed to update task: ${error.message}`);
        } else {
            invalidateTasks();
        }
    }, [userId]);
    
    const deleteTask = useCallback(async (taskId: string) => {
        if (!userId) return;
        
        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", taskId)
            .eq("user_id", userId);

        if (error) {
            toast.error(`Failed to delete task: ${error.message}`);
        } else {
            invalidateTasks();
            toast.info("Task deleted.");
        }
    }, [userId]);

    return (
        <TaskContext.Provider value={{ tasks, columns: KANBAN_COLUMNS, isLoading, refetch, updateTaskStatus, addTask, updateTask, deleteTask }}>
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