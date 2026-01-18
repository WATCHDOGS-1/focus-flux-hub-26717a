import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListChecks, Plus, Trash2, Clock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/types/productivity";

const TaskList = () => {
  const { tasks, updateTaskStatus, deleteTask, addTask, isLoading } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // Filter for incomplete tasks (To Do and In Progress)
  const incompleteTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'done');
  }, [tasks]);

  const handleToggleCompletion = async (task: Task) => {
    // Toggle between 'done' and 'todo' status
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTaskStatus(task.id, newStatus);
  };
  
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    // Quick add defaults to 1 pomodoro and no tags.
    await addTask(newTaskTitle.trim(), 1, []);
    setNewTaskTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const renderTaskItem = (task: Task) => {
    const isDone = task.status === 'done';
    
    return (
      <div
        key={task.id}
        className={cn(
          "flex items-center p-2 rounded-md transition-colors group",
          isDone ? "bg-secondary/30 line-through text-muted-foreground" : "hover:bg-secondary/20",
        )}
      >
        <Checkbox
          id={`task-${task.id}`}
          checked={isDone}
          onCheckedChange={() => handleToggleCompletion(task)}
          className="mr-3"
        />
        <label
          htmlFor={`task-${task.id}`}
          className="flex-1 text-sm cursor-pointer truncate"
        >
          {task.title}
        </label>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.estimated_pomodoros}
            </span>
            <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => deleteTask(task.id)}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
      <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-primary">
        <ListChecks className="w-5 h-5" />
        Focus To-Do List
      </h4>

      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button size="icon" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 pr-2">
          <div className="space-y-1">
            {incompleteTasks.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                No incomplete tasks. Time to relax or add more!
              </p>
            ) : (
              incompleteTasks.map(renderTaskItem)
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default TaskList;