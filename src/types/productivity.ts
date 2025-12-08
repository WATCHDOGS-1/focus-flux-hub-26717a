import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export const KANBAN_COLUMNS = {
    todo: { id: 'todo', title: 'To Do' },
    in_progress: { id: 'in_progress', title: 'In Progress' },
    done: { id: 'done', title: 'Done' },
};