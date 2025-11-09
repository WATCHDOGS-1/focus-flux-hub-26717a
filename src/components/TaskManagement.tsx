"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PlusCircle, CalendarIcon, Edit, Trash2, CheckCircle, Circle, ListTodo } from "lucide-react";
import { format, isPast, isToday, isThisWeek, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type UserTask = Database["public"]["Tables"]["user_tasks"]["Row"];

interface TaskManagementProps {
  userId: string;
}

const TaskManagement = ({ userId }: TaskManagementProps) => {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<UserTask> | null>(null);

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel("user_tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadTasks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks.");
    } else if (data) {
      setTasks(data);
    }
    setIsLoading(false);
  };

  const handleAddTask = () => {
    setCurrentTask({
      user_id: userId,
      description: "",
      is_completed: false,
      recurrence: "none",
      due_date: null,
    });
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: UserTask) => {
    setCurrentTask({ ...task, due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null });
    setIsDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!currentTask?.description?.trim()) {
      toast.error("Task description cannot be empty.");
      return;
    }

    setIsLoading(true);
    let error;
    if (currentTask.id) {
      // Update existing task
      const { error: updateError } = await supabase
        .from("user_tasks")
        .update({
          description: currentTask.description,
          is_completed: currentTask.is_completed,
          due_date: currentTask.due_date,
          recurrence: currentTask.recurrence,
        })
        .eq("id", currentTask.id);
      error = updateError;
    } else {
      // Insert new task
      const { error: insertError } = await supabase
        .from("user_tasks")
        .insert({
          user_id: userId,
          description: currentTask.description,
          is_completed: currentTask.is_completed,
          due_date: currentTask.due_date,
          recurrence: currentTask.recurrence,
        });
      error = insertError;
    }

    if (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task.");
    } else {
      toast.success("Task saved successfully!");
      setIsDialogOpen(false);
      setCurrentTask(null);
      loadTasks();
    }
    setIsLoading(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("user_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task.");
    } else {
      toast.success("Task deleted!");
      loadTasks();
    }
    setIsLoading(false);
  };

  const handleToggleComplete = async (task: UserTask) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("user_tasks")
      .update({ is_completed: !task.is_completed })
      .eq("id", task.id);

    if (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task status.");
    } else {
      toast.success(`Task marked as ${!task.is_completed ? "completed" : "incomplete"}!`);
      loadTasks();
    }
    setIsLoading(false);
  };

  const getTaskCategory = (task: UserTask) => {
    if (task.is_completed) return "Completed";
    if (!task.due_date) return "No Due Date";

    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) return "Overdue";
    if (isToday(dueDate)) return "Today";
    if (isThisWeek(dueDate, { weekStartsOn: 0 })) return "This Week"; // Sunday is start of week
    return "Upcoming";
  };

  const categorizedTasks = tasks.reduce((acc, task) => {
    const category = getTaskCategory(task);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, UserTask[]>);

  const categoryOrder = ["Overdue", "Today", "This Week", "Upcoming", "No Due Date", "Completed"];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <ListTodo className="text-primary" />
          My Tasks
        </h3>
        <Button size="sm" onClick={handleAddTask} className="dopamine-click">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No tasks yet. Add your first task!</div>
      ) : (
        <ScrollArea className="flex-1 pr-2">
          {categoryOrder.map((category) => {
            const categoryTasks = categorizedTasks[category];
            if (!categoryTasks || categoryTasks.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                <h4 className="font-semibold text-lg mb-3 border-b border-border/50 pb-2">
                  {category}
                </h4>
                <div className="space-y-3">
                  {categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                    >
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => handleToggleComplete(task)}
                        className="dopamine-click"
                      />
                      <div className="flex-1">
                        <p className={cn("font-medium", task.is_completed && "line-through text-muted-foreground")}>
                          {task.description}
                        </p>
                        {task.due_date && (
                          <p className={cn("text-xs text-muted-foreground", isPast(new Date(task.due_date)) && !task.is_completed && "text-destructive")}>
                            Due: {format(new Date(task.due_date), "PPP")}
                            {task.recurrence !== "none" && ` (${task.recurrence})`}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTask(task)}
                        className="dopamine-click"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        className="dopamine-click"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentTask?.id ? "Edit Task" : "Add New Task"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={currentTask?.description || ""}
                onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due-date" className="text-right">
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !currentTask?.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentTask?.due_date ? format(new Date(currentTask.due_date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={currentTask?.due_date ? new Date(currentTask.due_date) : undefined}
                    onSelect={(date) => setCurrentTask({ ...currentTask, due_date: date?.toISOString().split('T')[0] || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recurrence" className="text-right">
                Recurrence
              </Label>
              <Select
                value={currentTask?.recurrence || "none"}
                onValueChange={(value) => setCurrentTask({ ...currentTask, recurrence: value as UserTask["recurrence"] })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveTask} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManagement;