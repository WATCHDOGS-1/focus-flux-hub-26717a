import { useTasks } from "@/hooks/use-tasks";
import { Droppable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Play } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TimeBlockCalendar = () => {
    const { tasks } = useTasks();
    const navigate = useNavigate();
    
    const scheduledTasks = tasks.filter(t => t.start_time && t.end_time).sort((a, b) => {
        return new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime();
    });
    
    const today = new Date();
    const isScheduledForNow = scheduledTasks.find(t => {
        const start = new Date(t.start_time!);
        const end = new Date(t.end_time!);
        // Check if the task is scheduled for today and is currently active or starting soon (within 1 hour)
        return isToday(start) && start.getTime() <= today.getTime() + 3600000 && end.getTime() > today.getTime();
    });

    const handleFocusNow = (taskTitle: string) => {
        localStorage.setItem('next_focus_tag', taskTitle);
        toast.info(`Focus tag set to: "${taskTitle}". Redirecting to room...`);
        navigate("/focus-room/room-1");
    };

    return (
        <Droppable droppableId="calendar-dropzone">
            {(provided, snapshot) => (
                <Card 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="glass-card p-6 h-full flex flex-col"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                        <Calendar className="w-5 h-5" /> Weekly Schedule
                    </h3>
                    
                    {isScheduledForNow && (
                        <div className="p-4 mb-4 rounded-xl bg-accent/20 border border-accent/50 animate-pulse">
                            <p className="font-bold text-lg text-accent">Scheduled Focus Time!</p>
                            <p className="text-sm text-muted-foreground">
                                "{isScheduledForNow.title}" is scheduled to start at {format(new Date(isScheduledForNow.start_time!), 'h:mm a')}.
                            </p>
                            <Button 
                                className="w-full mt-3 dopamine-click"
                                onClick={() => handleFocusNow(isScheduledForNow.title)}
                            >
                                <Play className="w-4 h-4 mr-2" /> Join Focus Session Now
                            </Button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pr-2">
                        {scheduledTasks.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                Drag tasks from the Kanban board here to schedule them!
                                {provided.placeholder}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scheduledTasks.map(task => {
                                    const startTime = new Date(task.start_time!);
                                    const endTime = new Date(task.end_time!);
                                    const isDone = task.status === 'done';
                                    const isOverdue = isPast(endTime) && !isDone;

                                    return (
                                        <div 
                                            key={task.id} 
                                            className={cn(
                                                "p-3 rounded-lg border flex flex-col transition-colors",
                                                isDone ? "bg-success/10 border-success/30 opacity-70" : 
                                                isOverdue ? "bg-destructive/10 border-destructive/30" : 
                                                "bg-secondary/20 border-border"
                                            )}
                                        >
                                            <div className="font-semibold text-sm">{task.title}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(startTime, 'MMM do, h:mm a')} - {format(endTime, 'h:mm a')}
                                            </div>
                                            {isOverdue && <span className="text-xs text-destructive font-medium mt-1">Overdue!</span>}
                                        </div>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </Droppable>
    );
};

export default TimeBlockCalendar;