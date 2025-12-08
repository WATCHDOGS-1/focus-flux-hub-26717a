import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LayoutGrid, Calendar, Zap, Target } from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";
import WeeklyCalendar from "@/components/WeeklyCalendar"; // Updated import
import { TaskProvider, useTasks } from "@/hooks/use-tasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestSystemPanel from "@/components/QuestSystemPanel";
import { Task } from "@/types/productivity";
import { toast } from "sonner";

const ProductivityDashboardContent = () => {
    const navigate = useNavigate();
    const { tasks, columns, updateTaskStatus, updateTask } = useTasks();

    // Removed onDragEnd logic as requested.

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="glass-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6" /> Productivity Dashboard
                    </h1>
                    <div className="flex gap-2">
                        {/* Removed Notes/Knowledge button */}
                        <Button variant="default" onClick={() => navigate("/explore")} className="dopamine-click">
                            <Zap className="w-4 h-4 mr-2" /> Focus Rooms
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 space-y-6">
                {/* Quest System Panel (Top Priority) */}
                <QuestSystemPanel />

                {/* Removed DragDropContext wrapper */}
                <Tabs defaultValue="kanban">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="kanban" className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Kanban Board
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Weekly Schedule
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="kanban" className="h-[75vh]">
                        <KanbanBoard />
                    </TabsContent>

                    <TabsContent value="calendar" className="h-[75vh]">
                        <WeeklyCalendar />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

const ProductivityDashboard = () => (
    <TaskProvider>
        <ProductivityDashboardContent />
    </TaskProvider>
);

export default ProductivityDashboard;