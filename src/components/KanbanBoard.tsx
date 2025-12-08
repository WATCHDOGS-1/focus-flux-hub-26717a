import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/types/productivity";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, CheckCircle, Loader2, ListChecks, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAudioFeedback } from "@/hooks/useAudioFeedback";

// --- Task Creation Modal Component ---
const TaskCreationModal = ({ onAddTask }: { onAddTask: (title: string, poms: number, tags: string[]) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [poms, setPoms] = useState(1);
    const [tagsInput, setTagsInput] = useState("");

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error("Task title is required.");
            return;
        }
        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
        onAddTask(title.trim(), poms, tags);
        
        // Reset state
        setTitle("");
        setPoms(1);
        setTagsInput("");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="w-full dopamine-click mb-4">
                    <Plus className="w-4 h-4 mr-1" /> Add New Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-card">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Input 
                        placeholder="Task Title (e.g., 'Finish Project Report')" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                    />
                    <Input 
                        type="number"
                        min={1}
                        placeholder="Estimated Pomodoros (25 min blocks)" 
                        value={poms} 
                        onChange={e => setPoms(parseInt(e.target.value) || 1)} 
                    />
                    <Input 
                        placeholder="Tags (e.g., Coding, Design, Math - separated by commas)" 
                        value={tagsInput} 
                        onChange={e => setTagsInput(e.target.value)} 
                    />
                    <Button onClick={handleSubmit} className="w-full dopamine-click">
                        Create Task
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
// --- End Task Creation Modal Component ---


interface KanbanCardProps {
    task: Task;
    onFocusNow: (task: Task) => void;
    onDelete: (taskId: string) => void;
}

const KanbanCard = ({ task, onFocusNow, onDelete }: KanbanCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                "glass-card p-3 mb-3 transition-all hover-lift cursor-grab group relative",
                isDragging && "ring-2 ring-primary/50 shadow-lg",
                task.status === 'done' && "opacity-70"
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                title="Delete Task"
            >
                <X className="w-4 h-4" />
            </Button>
            
            <div className="flex flex-col gap-2 pr-6" {...listeners}>
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.estimated_pomodoros} Poms
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                    {(task.tags as string[] || []).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] h-4">{tag}</Badge>
                    ))}
                </div>
                <Button 
                    size="sm" 
                    className="w-full dopamine-click mt-2"
                    onClick={() => onFocusNow(task)}
                    disabled={task.status === 'done'}
                >
                    <Play className="w-4 h-4 mr-2" /> Focus Now
                </Button>
            </div>
        </Card>
    );
};

interface KanbanColumnProps {
    columnId: Task['status'];
    title: string;
    tasks: Task[];
    onFocusNow: (task: Task) => void;
    onDelete: (taskId: string) => void;
}

const KanbanColumn = ({ columnId, title, tasks, onFocusNow, onDelete }: KanbanColumnProps) => {
    const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

    return (
        <div
            className={cn(
                "p-4 rounded-xl flex flex-col h-full min-h-[300px] bg-secondary/20"
            )}
        >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                {columnId === 'todo' && <ListChecks className="w-5 h-5 text-primary" />}
                {columnId === 'in_progress' && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
                {columnId === 'done' && <CheckCircle className="w-5 h-5 text-success" />}
                {title} ({tasks.length})
            </h3>
            <ScrollArea className="flex-1 pr-2">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <KanbanCard 
                            key={task.id} 
                            task={task} 
                            onFocusNow={onFocusNow} 
                            onDelete={onDelete}
                        />
                    ))}
                </SortableContext>
            </ScrollArea>
        </div>
    );
};

const KanbanBoard = () => {
    const { tasks, columns, addTask, deleteTask, updateTaskStatus, isLoading } = useTasks();
    const { play } = useAudioFeedback();
    const navigate = useNavigate();
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const handleFocusNow = (task: Task) => {
        navigate(`/zen-mode?tag=${encodeURIComponent(task.title)}`);
    };

    const tasksByStatus = useMemo(() => {
        return Object.keys(columns).reduce((acc, status) => {
            acc[status] = tasks.filter(task => task.status === status);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks, columns]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as Task['status'];
        const currentTask = tasks.find(t => t.id === taskId);

        if (currentTask && currentTask.status !== newStatus) {
            updateTaskStatus(taskId, newStatus);
            
            if (newStatus === 'done') {
                play('pop');
            }
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <TaskCreationModal onAddTask={addTask} />
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                    {Object.entries(columns).map(([id, column]) => (
                        <KanbanColumn
                            key={id}
                            columnId={id as Task['status']}
                            title={column.title}
                            tasks={tasksByStatus[id]}
                            onFocusNow={handleFocusNow}
                            onDelete={deleteTask}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    );
};

export default KanbanBoard;