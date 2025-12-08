import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/types/productivity";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, CheckCircle, Loader2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanCardProps {
    task: Task;
    index: number;
    onFocusNow: (task: Task) => void;
}

const KanbanCard = ({ task, index, onFocusNow }: KanbanCardProps) => {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "glass-card p-3 mb-3 transition-all hover-lift cursor-grab",
                        snapshot.isDragging && "ring-2 ring-primary/50 shadow-lg",
                        task.status === 'done' && "opacity-70"
                    )}
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {task.estimatedPomodoros} Poms
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {task.tags.map(tag => (
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
            )}
        </Draggable>
    );
};

interface KanbanColumnProps {
    columnId: Task['status'];
    title: string;
    tasks: Task[];
    onFocusNow: (task: Task) => void;
}

const KanbanColumn = ({ columnId, title, tasks, onFocusNow }: KanbanColumnProps) => {
    return (
        <Droppable droppableId={columnId}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                        "p-4 rounded-xl flex flex-col h-full min-h-[300px] transition-colors",
                        snapshot.isDraggingOver ? "bg-primary/10" : "bg-secondary/20"
                    )}
                >
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                        {columnId === 'todo' && <ListChecks className="w-5 h-5 text-primary" />}
                        {columnId === 'in_progress' && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
                        {columnId === 'done' && <CheckCircle className="w-5 h-5 text-success" />}
                        {title} ({tasks.length})
                    </h3>
                    <ScrollArea className="flex-1 pr-2">
                        {tasks.map((task, index) => (
                            <KanbanCard key={task.id} task={task} index={index} onFocusNow={onFocusNow} />
                        ))}
                        {provided.placeholder}
                    </ScrollArea>
                </div>
            )}
        </Droppable>
    );
};

const KanbanBoard = () => {
    const { tasks, columns } = useTasks();
    const navigate = useNavigate();

    const handleFocusNow = (task: Task) => {
        // Navigate to Zen Mode with the task title as the focus tag
        navigate(`/zen-mode?tag=${encodeURIComponent(task.title)}`);
    };

    const tasksByStatus = Object.keys(columns).reduce((acc, status) => {
        acc[status] = tasks.filter(task => task.status === status);
        return acc;
    }, {} as Record<string, Task[]>);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {Object.entries(columns).map(([id, column]) => (
                <KanbanColumn
                    key={id}
                    columnId={id as Task['status']}
                    title={column.title}
                    tasks={tasksByStatus[id]}
                    onFocusNow={handleFocusNow}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;