import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Plus, Clock, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/use-tasks';
import { format, addHours, startOfWeek, eachDayOfInterval, isSameDay, isBefore, isAfter, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Define time slots (e.g., 8 AM to 8 PM, 1 hour intervals)
const START_HOUR = 8;
const END_HOUR = 20;
const INTERVAL_MINUTES = 60;

interface TimeSlot {
    hour: number;
    label: string;
}

const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
        slots.push({
            hour: h,
            label: `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? ' PM' : ' AM'}`,
        });
    }
    return slots;
};

const timeSlots = generateTimeSlots();

interface EventFormState {
    title: string;
    taskId: string;
    startTime: string; // ISO string for the selected slot start
    endTime: string; // ISO string for the selected slot end
}

const TimeBlockCalendar = () => {
    const { tasks, isLoading, updateTask, deleteTask } = useTasks();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formState, setFormState] = useState<EventFormState | null>(null);

    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
    const daysOfWeek = eachDayOfInterval({
        start: startOfCurrentWeek,
        end: addHours(startOfCurrentWeek, 6 * 24), // 7 days total
    });

    // Map tasks to a grid structure for easy lookup
    const scheduledEvents = useMemo(() => {
        const events: Record<string, (Task & { startHour: number, endHour: number })[]> = {};
        
        tasks.forEach(task => {
            if (task.start_time && task.end_time) {
                const startDate = parseISO(task.start_time);
                const endDate = parseISO(task.end_time);
                const dayKey = format(startDate, 'yyyy-MM-dd');
                
                const startHour = startDate.getHours();
                const endHour = endDate.getHours();

                if (!events[dayKey]) events[dayKey] = [];
                events[dayKey].push({ ...task, startHour, endHour });
            }
        });
        return events;
    }, [tasks]);
    
    // Filter tasks that are not yet scheduled
    const unscheduledTasks = useMemo(() => {
        return tasks.filter(t => !t.start_time);
    }, [tasks]);

    const handleSlotClick = (day: Date, hour: number) => {
        const slotStart = new Date(day);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = addHours(slotStart, 1);

        setFormState({
            title: '',
            taskId: unscheduledTasks[0]?.id || '',
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
        });
        setIsDialogOpen(true);
    };

    const handleFormSubmit = async () => {
        if (!formState || !formState.taskId) {
            toast.error("Please select a task.");
            return;
        }
        
        const start = parseISO(formState.startTime);
        const end = parseISO(formState.endTime);

        if (isBefore(end, start) || isSameDay(start, end) && start.getHours() >= end.getHours()) {
            toast.error("End time must be after start time.");
            return;
        }

        await updateTask({
            id: formState.taskId,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
        });

        setIsDialogOpen(false);
        setFormState(null);
        toast.success("Task scheduled successfully!");
    };
    
    const handleRemoveSchedule = async (taskId: string) => {
        await updateTask({
            id: taskId,
            start_time: null,
            end_time: null,
        });
        toast.info("Schedule removed.");
    };

    if (isLoading) {
        return (
            <Card className="glass-card p-6 h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <Card className="glass-card p-4 h-full flex flex-col">
            <CardHeader className="p-0 pb-4 flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" /> Weekly Time Blocks
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                    {format(startOfCurrentWeek, 'MMM do')} - {format(daysOfWeek[6], 'MMM do')}
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-x-auto">
                <div className="grid grid-cols-[auto_repeat(7,minmax(100px,1fr))] h-full min-w-full">
                    {/* Header Row (Days) */}
                    <div className="sticky left-0 z-10 bg-card/90 border-b border-border/50"></div>
                    {daysOfWeek.map((day, index) => (
                        <div 
                            key={index} 
                            className={cn(
                                "text-center p-2 font-semibold border-b border-border/50 sticky top-0 z-10 bg-card/90",
                                isSameDay(day, new Date()) ? "text-accent" : "text-foreground"
                            )}
                        >
                            <div className="text-xs uppercase">{format(day, 'EEE')}</div>
                            <div className="text-lg leading-none">{format(day, 'd')}</div>
                        </div>
                    ))}

                    {/* Time Slots and Grid Cells */}
                    {timeSlots.map((slot, slotIndex) => (
                        <div key={slot.hour} className="contents">
                            {/* Time Label Column */}
                            <div className="sticky left-0 z-10 text-xs text-muted-foreground p-2 border-r border-border/50 bg-card/90 flex items-center justify-end">
                                {slot.label}
                            </div>
                            
                            {/* Day Columns */}
                            {daysOfWeek.map((day, dayIndex) => {
                                const dayKey = format(day, 'yyyy-MM-dd');
                                const eventsInSlot = scheduledEvents[dayKey]?.filter(event => 
                                    event.startHour <= slot.hour && event.endHour > slot.hour
                                );
                                
                                const isCurrentHour = isSameDay(day, new Date()) && new Date().getHours() === slot.hour;

                                return (
                                    <div
                                        key={dayIndex}
                                        className={cn(
                                            "p-1 border-b border-r border-border/50 h-[60px] cursor-pointer transition-colors relative",
                                            isCurrentHour ? "bg-primary/10 ring-1 ring-primary/50" : "hover:bg-secondary/30"
                                        )}
                                        onClick={() => handleSlotClick(day, slot.hour)}
                                    >
                                        {eventsInSlot?.map((event, eventIndex) => {
                                            // Only render the event block once (at its start hour)
                                            if (event.startHour === slot.hour) {
                                                const durationHours = event.endHour - event.startHour;
                                                return (
                                                    <div 
                                                        key={event.id}
                                                        className="absolute inset-x-0 top-0 z-20 p-1 mx-1 rounded-md bg-accent/70 text-xs text-accent-foreground overflow-hidden shadow-md group"
                                                        style={{ height: `${durationHours * 60}px` }}
                                                        onClick={(e) => e.stopPropagation()} // Prevent slot click
                                                    >
                                                        <div className="font-semibold truncate">{event.title}</div>
                                                        <div className="text-[10px] text-white/80 flex items-center justify-between">
                                                            <span>{format(parseISO(event.start_time!), 'h:mm a')}</span>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 text-white/80 hover:text-destructive"
                                                                onClick={() => handleRemoveSchedule(event.id)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </CardContent>
            
            {/* Dialog for adding/editing events */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="glass-card">
                    <DialogHeader>
                        <DialogTitle>Schedule Task Block</DialogTitle>
                    </DialogHeader>
                    {formState && (
                        <div className="space-y-4">
                            <Input 
                                placeholder="Event Title (Optional, defaults to Task Title)"
                                value={formState.title}
                                onChange={e => setFormState({...formState, title: e.target.value})}
                            />
                            
                            <Select 
                                value={formState.taskId} 
                                onValueChange={(taskId) => {
                                    const selectedTask = unscheduledTasks.find(t => t.id === taskId);
                                    setFormState(prev => ({
                                        ...prev!,
                                        taskId,
                                        title: selectedTask?.title || prev!.title,
                                    }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Task to Schedule" />
                                </SelectTrigger>
                                <SelectContent className="glass-card">
                                    {unscheduledTasks.length === 0 && (
                                        <SelectItem value="" disabled>No unscheduled tasks</SelectItem>
                                    )}
                                    {unscheduledTasks.map(task => (
                                        <SelectItem key={task.id} value={task.id}>
                                            {task.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    type="datetime-local" 
                                    label="Start Time"
                                    value={format(parseISO(formState.startTime), "yyyy-MM-dd'T'HH:mm")}
                                    onChange={e => setFormState({...formState, startTime: parseISO(e.target.value).toISOString()})}
                                />
                                <Input 
                                    type="datetime-local" 
                                    label="End Time"
                                    value={format(parseISO(formState.endTime), "yyyy-MM-dd'T'HH:mm")}
                                    onChange={e => setFormState({...formState, endTime: parseISO(e.target.value).toISOString()})}
                                />
                            </div>
                            
                            <Button onClick={handleFormSubmit} className="w-full dopamine-click" disabled={!formState.taskId}>
                                <Plus className="w-4 h-4 mr-2" /> Schedule Block
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default TimeBlockCalendar;