import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListChecks, Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = "onlyfocus_task_list";

interface Task {
  id: number;
  content: string;
  completed: boolean;
  indent: number; // 0, 1, 2 for nesting
}

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [nextId, setNextId] = useState(1);

  // Load tasks from local storage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTasks) {
      const loadedTasks: Task[] = JSON.parse(savedTasks);
      setTasks(loadedTasks);
      const maxId = loadedTasks.reduce((max, task) => Math.max(max, task.id), 0);
      setNextId(maxId + 1);
    }
  }, []);

  // Save tasks to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (indent: number = 0) => {
    if (!newTaskContent.trim()) return;

    const newTask: Task = {
      id: nextId,
      content: newTaskContent.trim(),
      completed: false,
      indent: indent,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskContent("");
    setNextId(nextId + 1);
  };

  const toggleTaskCompletion = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  const renderTaskItem = (task: Task) => (
    <div
      key={task.id}
      className={cn(
        "flex items-center p-2 rounded-md transition-colors group",
        task.completed ? "bg-secondary/30 line-through text-muted-foreground" : "hover:bg-secondary/20",
        task.indent === 1 && "ml-6",
        task.indent === 2 && "ml-12"
      )}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => toggleTaskCompletion(task.id)}
        className="mr-3"
      />
      <label
        htmlFor={`task-${task.id}`}
        className="flex-1 text-sm cursor-pointer truncate"
      >
        {task.content}
      </label>
      <Button
        variant="ghost"
        size="icon"
        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
        onClick={() => deleteTask(task.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
      <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-primary">
        <ListChecks className="w-5 h-5" />
        To-Do List
      </h4>

      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button size="icon" onClick={() => addTask()} disabled={!newTaskContent.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 pr-2">
        <div className="space-y-1">
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No tasks yet. Add your first focus item!
            </p>
          ) : (
            tasks.map(renderTaskItem)
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskList;