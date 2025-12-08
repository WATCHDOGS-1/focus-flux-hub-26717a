import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LayoutGrid, Calendar, Zap, Target, BookOpen } from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";
import TimeBlockCalendar from "@/components/TimeBlockCalendar";
import { useTasks } from "@/hooks/use-tasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestSystemPanel from "@/components/QuestSystemPanel";
import { Task } from "@/types/productivity";
import { toast } from "sonner";
import DigitalPlanetView from "@/components/DigitalPlanetView";

const ProductivityDashboardContent = () => {
    const navigate = useNavigate();
    const { tasks, columns, updateTaskStatus, updateTask } = useTasks();

    // Removed onDragEnd logic as requested.

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="glass-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* P4: Home Button */}
                        <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="Go to Home">
                            <Home className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
                            <LayoutGrid className="w-6 h-6" /> Productivity Dashboard
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate("/notes")} className="dopamine-click">
                            <BookOpen className="w-4 h-4 mr-2" /> Notes Base
                        </Button>
                        <Button variant="default" onClick={() => navigate("/explore")} className="dopamine-click">
                            <Zap className="w-4 h-4 mr-2" /> Focus Rooms
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <QuestSystemPanel />
                    </div>
                    <div className="lg:col-span-1 h-full">
                        <DigitalPlanetView />
                    </div>
                </div>

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
                        <TimeBlockCalendar />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

const ProductivityDashboard = () => (
    <ProductivityDashboardContent />
);

export default ProductivityDashboard;