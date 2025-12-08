import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useTasks } from '@/hooks/use-tasks';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';

// Setup the localizer
const localizer = momentLocalizer(moment);

const WeeklyCalendar = () => {
    const { tasks, isLoading } = useTasks();

    // Transform tasks into calendar events
    const events = useMemo(() => {
        return tasks
            .filter(t => t.start_time && t.end_time)
            .map(task => ({
                id: task.id,
                title: task.title,
                start: new Date(task.start_time!),
                end: new Date(task.end_time!),
                resource: task,
            }));
    }, [tasks]);

    const eventPropGetter = (event: any) => {
        const task = event.resource;
        let className = 'rbc-event-default';
        let style = {};

        if (task.status === 'done') {
            className = 'rbc-event-success';
            style = { backgroundColor: 'hsl(var(--success) / 0.5)', borderColor: 'hsl(var(--success))' };
        } else if (task.status === 'in_progress') {
            className = 'rbc-event-progress';
            style = { backgroundColor: 'hsl(var(--accent) / 0.5)', borderColor: 'hsl(var(--accent))' };
        } else {
            className = 'rbc-event-todo';
            style = { backgroundColor: 'hsl(var(--primary) / 0.5)', borderColor: 'hsl(var(--primary))' };
        }

        return { className, style };
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
            <CardContent className="flex-1 p-0">
                <div className="h-full w-full" style={{ height: '100%' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        defaultView="week"
                        views={['week', 'day']}
                        step={30}
                        timeslots={2}
                        min={moment().startOf('day').toDate()} // Start of day
                        max={moment().endOf('day').toDate()} // End of day
                        eventPropGetter={eventPropGetter}
                        className="bg-card text-foreground p-2 rounded-lg"
                    />
                </div>
            </CardContent>
            
            {/* Custom styles to integrate with Tailwind/shadcn theme */}
            <style jsx global>{`
                .rbc-calendar {
                    font-family: inherit;
                }
                .rbc-header {
                    padding: 8px 0;
                    border-bottom: 1px solid hsl(var(--border));
                    color: hsl(var(--foreground));
                }
                .rbc-toolbar button {
                    color: hsl(var(--foreground));
                    border: 1px solid hsl(var(--border));
                    background-color: hsl(var(--secondary));
                    transition: all 0.2s;
                }
                .rbc-toolbar button:hover {
                    background-color: hsl(var(--secondary-foreground) / 0.1);
                }
                .rbc-toolbar button.rbc-active {
                    background-color: hsl(var(--primary));
                    color: hsl(var(--primary-foreground));
                }
                .rbc-time-view, .rbc-month-view {
                    border: 1px solid hsl(var(--border));
                }
                .rbc-time-header-content, .rbc-day-slot {
                    background-color: hsl(var(--card));
                }
                .rbc-time-content > div > div {
                    border-color: hsl(var(--border));
                }
                .rbc-time-content {
                    border-top: 1px solid hsl(var(--border));
                }
                .rbc-time-slot {
                    border-top: 1px solid hsl(var(--border));
                }
                .rbc-event {
                    border-radius: 4px;
                    color: hsl(var(--primary-foreground));
                    font-size: 12px;
                    padding: 4px;
                    opacity: 0.9;
                }
                .rbc-event-success {
                    background-color: hsl(var(--success)) !important;
                    border-color: hsl(var(--success)) !important;
                }
                .rbc-event-progress {
                    background-color: hsl(var(--accent)) !important;
                    border-color: hsl(var(--accent)) !important;
                }
                .rbc-event-todo {
                    background-color: hsl(var(--primary)) !important;
                    border-color: hsl(var(--primary)) !important;
                }
            `}</style>
        </Card>
    );
};

export default WeeklyCalendar;