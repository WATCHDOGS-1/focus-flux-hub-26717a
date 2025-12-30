import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Card } from '@/components/ui/card';
import { format, startOfWeek, addDays, isSameDay, setHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        
        const startTime = setHours(day, hour).toISOString();
        // This is a simplified add - in a real app we'd pass the start_time to the addTask hook
        await addTask(quickTitle, 1, ["Scheduled"]);
        
        setQuickTitle("");
        setEditingSlot(null);
    };

    return (
        <Card className="glass border-white/5 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-black tracking-widest opacity-40 uppercase italic">Precision Schedule v1.0</span>
                <span className="text-[10px] font-bold opacity-30 uppercase">Interactive Grid</span>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="min-w-[900px]">
                    {/* Header */}
                    <div className="grid grid-cols-8 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-xl z-20">
                        <div className="p-4 border-r border-white/5 text-[10px] font-black uppercase tracking-widest opacity-20">GMT</div>
                        {weekDays.map(day => (
                            <div key={day.toString()} className={cn(
                                "p-4 border-r border-white/5 text-center",
                                isSameDay(day, today) && "bg-primary/5 text-primary"
                            )}>
                                <div className="text-[10px] font-black uppercase tracking-tighter opacity-40">{format(day, 'EEEE')}</div>
                                <div className="text-2xl font-black italic tracking-tighter">{format(day, 'dd')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b border-white/5 group min-h-[80px]">
                            <div className="p-4 border-r border-white/5 bg-white/[0.01] text-[10px] font-bold opacity-20 flex items-start justify-center">
                                {format(new Date().setHours(hour, 0), 'HH:00')}
                            </div>
                            {weekDays.map(day => {
                                const slotId = `${day.getTime()}-${hour}`;
                                const isEditing = editingSlot === slotId;
                                const dayTasks = tasks.filter(t => t.start_time && isSameDay(new Date(t.start_time), day) && new Date(t.start_time).getHours() === hour);

                                return (
                                    <div 
                                        key={day.toString()} 
                                        className="p-1 border-r border-white/5 relative group/slot hover:bg-white/[0.03] transition-colors"
                                        onClick={() => !isEditing && setEditingSlot(slotId)}
                                    >
                                        {dayTasks.map(task => (
                                            <div key={task.id} className="p-3 rounded-xl glass-interactive mb-1 text-[10px] font-black uppercase tracking-tighter border-l-2 border-l-primary truncate">
                                                {task.title}
                                            </div>
                                        ))}

                                        {isEditing ? (
                                            <div className="absolute inset-0 z-10 p-1 bg-background/90 backdrop-blur-md">
                                                <Input 
                                                    autoFocus
                                                    className="h-full text-[10px] font-bold uppercase bg-transparent border-primary/30"
                                                    value={quickTitle}
                                                    onChange={e => setQuickTitle(e.target.value)}
                                                    onBlur={() => handleQuickAdd(day, hour)}
                                                    onKeyDown={e => e.key === 'Enter' && handleQuickAdd(day, hour)}
                                                    placeholder="Focus Intention..."
                                                />
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover/slot:opacity-100 transition-opacity"
                                            >
                                                <Plus className="w-3 h-3 opacity-30" />
                                            </Button>
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