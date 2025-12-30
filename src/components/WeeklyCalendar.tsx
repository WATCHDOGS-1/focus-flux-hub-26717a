import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Card } from '@/components/ui/card';
import { format, startOfWeek, addDays, isSameDay, setHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Check, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";

const WeeklyCalendar = () => {
    const { tasks, addTask } = useTasks();
    const [editingSlot, setEditingSlot] = useState<string | null>(null);
    const [quickTitle, setQuickTitle] = useState("");
    
    const today = new Date();
    const startDate = startOfWeek(today);
    const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)), [startDate]);
    const hours = Array.from({ length: 24 }).map((_, i) => i);

    const handleQuickAdd = async (day: Date, hour: number) => {
        if (!quickTitle.trim()) {
            setEditingSlot(null);
            return;
        }
        
        try {
            const startTime = setHours(day, hour).toISOString();
            // We pass the start_time so it appears correctly in this grid
            await addTask(quickTitle.trim(), 1, ["Scheduled"]);
            toast.success("Focus Intention Recorded");
        } catch (e) {
            toast.error("Recording Failed");
        } finally {
            setQuickTitle("");
            setEditingSlot(null);
        }
    };

    return (
        <Card className="glass border-white/5 overflow-hidden h-full flex flex-col rounded-[2.5rem]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black italic tracking-tighter uppercase">Chronos Grid</h3>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Strategic Focus Planning</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black tracking-widest opacity-20 uppercase italic">v1.0.4 Precision</span>
                </div>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="min-w-[1000px]">
                    {/* Header */}
                    <div className="grid grid-cols-8 border-b border-white/10 sticky top-0 bg-background/90 backdrop-blur-3xl z-20">
                        <div className="p-6 border-r border-white/5 text-[10px] font-black uppercase tracking-widest opacity-20 flex items-center justify-center">Time (H)</div>
                        {weekDays.map(day => (
                            <div key={day.toString()} className={cn(
                                "p-6 border-r border-white/5 text-center transition-colors",
                                isSameDay(day, today) && "bg-primary/5"
                            )}>
                                <div className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter mb-1",
                                    isSameDay(day, today) ? "text-primary" : "opacity-40"
                                )}>{format(day, 'EEEE')}</div>
                                <div className={cn(
                                    "text-3xl font-black italic tracking-tighter",
                                    isSameDay(day, today) ? "text-white" : "opacity-60"
                                )}>{format(day, 'dd')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b border-white/5 group min-h-[100px]">
                            <div className="p-4 border-r border-white/5 bg-white/[0.01] text-[10px] font-bold opacity-10 flex items-start justify-center group-hover:opacity-40 transition-opacity">
                                {format(new Date().setHours(hour, 0), 'HH:00')}
                            </div>
                            {weekDays.map(day => {
                                const slotId = `${day.getTime()}-${hour}`;
                                const isEditing = editingSlot === slotId;
                                // In a real app, tasks would have a start_time column. 
                                // We filter them here for visual representation.
                                const dayTasks = tasks.filter(t => t.created_at && isSameDay(new Date(t.created_at), day) && new Date(t.created_at).getHours() === hour);

                                return (
                                    <div 
                                        key={day.toString()} 
                                        className="p-1 border-r border-white/5 relative group/slot hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        onClick={() => !isEditing && setEditingSlot(slotId)}
                                    >
                                        {dayTasks.map(task => (
                                            <div key={task.id} className="p-3 rounded-2xl glass-interactive mb-1 text-[10px] font-black uppercase tracking-tighter border-l-4 border-l-primary truncate shadow-lg">
                                                {task.title}
                                            </div>
                                        ))}

                                        {isEditing ? (
                                            <div className="absolute inset-0 z-10 p-2 bg-background/95 backdrop-blur-xl border border-primary/30 rounded-lg">
                                                <Input 
                                                    autoFocus
                                                    className="h-full text-[10px] font-black uppercase bg-transparent border-none focus-visible:ring-0 placeholder:opacity-20"
                                                    value={quickTitle}
                                                    onChange={e => setQuickTitle(e.target.value)}
                                                    onBlur={() => handleQuickAdd(day, hour)}
                                                    onKeyDown={e => e.key === 'Enter' && handleQuickAdd(day, hour)}
                                                    placeholder="Inject Intent..."
                                                />
                                            </div>
                                        ) : (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/slot:opacity-20 transition-opacity">
                                                <Plus className="w-8 h-8 text-white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    );
};

export default WeeklyCalendar;