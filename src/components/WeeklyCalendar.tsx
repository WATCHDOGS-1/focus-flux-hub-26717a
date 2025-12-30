import { useMemo } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const WeeklyCalendar = () => {
    const { tasks } = useTasks();
    const today = new Date();
    const startDate = startOfWeek(today);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    }, [startDate]);

    const hours = Array.from({ length: 24 }).map((_, i) => i);

    return (
        <Card className="glass-card border-white/5 overflow-hidden h-full">
            <ScrollArea className="h-full">
                <div className="min-w-[800px]">
                    {/* Grid Header */}
                    <div className="grid grid-cols-8 border-b border-white/5">
                        <div className="p-4 border-r border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-40">Time</div>
                        {weekDays.map(day => (
                            <div key={day.toString()} className={cn(
                                "p-4 border-r border-white/5 text-center",
                                isSameDay(day, today) && "bg-primary/10 text-primary"
                            )}>
                                <div className="text-[10px] font-black uppercase tracking-tighter opacity-40">{format(day, 'EEE')}</div>
                                <div className="text-lg font-black tracking-tighter">{format(day, 'dd')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b border-white/5 group">
                            <div className="p-3 border-r border-white/5 bg-white/[0.02] text-[10px] font-bold opacity-20 group-hover:opacity-100 transition-opacity">
                                {format(new Date().setHours(hour, 0), 'hh:mm a')}
                            </div>
                            {weekDays.map(day => {
                                const dayTasks = tasks.filter(t => t.start_time && isSameDay(new Date(t.start_time), day) && new Date(t.start_time).getHours() === hour);
                                return (
                                    <div key={day.toString()} className="p-1 border-r border-white/5 min-h-[60px] hover:bg-white/[0.02] transition-colors relative">
                                        {dayTasks.map(task => (
                                            <div key={task.id} className={cn(
                                                "p-2 rounded-lg text-[10px] font-bold truncate mb-1 border border-white/10",
                                                task.status === 'done' ? "bg-success/20 text-success line-through" : "bg-primary/20 text-primary"
                                            )}>
                                                {task.title}
                                            </div>
                                        ))}
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