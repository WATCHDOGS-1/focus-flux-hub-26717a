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
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
                    <Input placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} />
                    <Input type="number" min={1} value={poms} onChange={e => setPoms(parseInt(e.target.value) || 1)} />
                    <Input placeholder="Tags (comma separated)" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
                    <Button onClick={handleSubmit} className="w-full dopamine-click">Create Task</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const KanbanCard = ({ task, onFocusNow, onDelete }: { task: Task, onFocusNow: (task: Task) => void, onDelete: (taskId: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                "glass-card p-3 mb-3 transition-all hover-lift cursor-grab group relative",
                isDragging && "ring-2 ring-primary/50 shadow-xl opacity-50 scale-105",
                task.status === 'done' && "opacity-70"
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive z-10"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            >
                <X className="w-4 h-4" />
            </Button>
            
            <div className="flex flex-col gap-2 pr-6" {...listeners}>
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" /> {task.estimated_pomodoros}
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                    {(task.tags as string[] || []).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] h-4">{tag}</Badge>
                    ))}
                </div>
                <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full dopamine-click mt-2 pointer-events-auto"
                    onClick={(e) => { e.stopPropagation(); onFocusNow(task); }}
                    disabled={task.status === 'done'}
                >
                    <Play className="w-3 h-3 mr-1" /> Focus
                </Button>
            </div>
        </Card>
    );
};

const KanbanColumn = ({ columnId, title, tasks, onFocusNow, onDelete }: { columnId: Task['status'], title: string, tasks: Task[], onFocusNow: (task: Task) => void, onDelete: (taskId: string) => void }) => {
    const { setNodeRef } = useDroppable({ id: columnId });
    const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

    return (
        <div
            ref={setNodeRef}
            className="p-4 rounded-xl flex flex-col h-full min-h-[500px] bg-secondary/20 border border-transparent transition-colors hover:bg-secondary/30"
        >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                {columnId === 'todo' && <ListChecks className="w-5 h-5 text-primary" />}
                {columnId === 'in_progress' && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
                {columnId === 'done' && <CheckCircle className="w-5 h-5 text-success" />}
                {title} <span className="text-muted-foreground text-sm ml-auto">({tasks.length})</span>
            </h3>
            <ScrollArea className="flex-1 pr-2">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <KanbanCard key={task.id} task={task} onFocusNow={onFocusNow} onDelete={onDelete} />
                    ))}
                </SortableContext>
            </ScrollArea>
        </div>
    );
};

const KanbanBoard = () => {
    const { tasks, columns, addTask, deleteTask, updateTaskStatus, isLoading } = useTasks();
    const navigate = useNavigate();
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const handleFocusNow = (task: Task) => {
        navigate(`/zen-mode?tag=${encodeURIComponent(task.title)}`);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the active task
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Resolve destination status
        let destinationStatus: Task['status'] | null = null;

        // If dropped directly on a column
        if (overId === 'todo' || overId === 'in_progress' || overId === 'done') {
            destinationStatus = overId as Task['status'];
        } else {
            // Dropped on another task, find that task's status
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                destinationStatus = overTask.status;
            }
        }

        if (destinationStatus && activeTask.status !== destinationStatus) {
            await updateTaskStatus(activeId, destinationStatus);
        }
    };
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="h-full flex flex-col">
            <TaskCreationModal onAddTask={addTask} />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                    {Object.entries(columns).map(([id, col]) => (
                        <KanbanColumn 
                            key={id} 
                            columnId={id as Task['status']} 
                            title={col.title} 
                            tasks={tasks.filter(t => t.status === id)} 
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