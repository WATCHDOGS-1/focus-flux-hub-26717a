import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, LayoutGrid, Zap, MessageSquare, Trophy, BookOpen, Brain } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { useAuth } from "@/hooks/use-auth";

const DashboardCard = ({ title, description, icon: Icon, link, isPrimary = false }: { title: string, description: string, icon: React.ElementType, link: string, isPrimary?: boolean }) => {
    const navigate = useNavigate();
    return (
        <Card 
            className={`glass-card p-6 hover-lift cursor-pointer transition-all ${isPrimary ? 'border-primary/50 shadow-glow' : ''}`}
            onClick={() => navigate(link)}
        >
            <CardHeader className="p-0 mb-4">
                <Icon className={`w-10 h-10 ${isPrimary ? 'text-primary' : 'text-accent'}`} />
            </CardHeader>
            <CardContent className="p-0 space-y-2">
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                <p className="text-muted-foreground">{description}</p>
                <Button className="w-full mt-4 dopamine-click">Go to {title}</Button>
            </CardContent>
        </Card>
    );
};

const MainDashboard = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <header className="glass-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">OnlyFocus Dashboard</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate("/social")} className="dopamine-click">
                            <MessageSquare className="w-4 h-4 mr-2" /> Social Hub
                        </Button>
                        <Button variant="ghost" onClick={() => navigate("/social?tab=leaderboard")} className="dopamine-click">
                            <Trophy className="w-4 h-4 mr-2" /> Leaderboard
                        </Button>
                        {!isAuthenticated && (
                            <Button onClick={() => navigate("/auth")} className="dopamine-click">
                                Log In
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12">
                <AnimatedSection>
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                        Your Productivity Command Center
                    </h2>
                    <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-12">
                        Navigate between your tasks, notes, and live focus rooms.
                    </p>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <AnimatedSection delay={0.1}>
                        <DashboardCard 
                            title="Focus Rooms" 
                            description="Join live video co-working sessions and start your Pomodoro timer for deep accountability." 
                            icon={Zap} 
                            link="/explore" 
                            isPrimary={true}
                        />
                    </AnimatedSection>
                    <AnimatedSection delay={0.2}>
                        <DashboardCard 
                            title="Productivity Hub" 
                            description="Manage your tasks with the Kanban board, schedule time blocks, and track your daily quests." 
                            icon={Target} 
                            link="/productivity" 
                        />
                    </AnimatedSection>
                    <AnimatedSection delay={0.3}>
                        <DashboardCard 
                            title="Notes Base" 
                            description="Organize your notes, diagrams, and study materials using the powerful Block Editor and Whiteboard." 
                            icon={BookOpen} 
                            link="/notes" 
                        />
                    </AnimatedSection>
                </div>
                
                <AnimatedSection delay={0.4} className="mt-16 text-center">
                    <h3 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                        <Brain className="w-6 h-6 text-accent" /> AI Coach & Gamification
                    </h3>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Your AI Coach is integrated across all modules, providing personalized advice, tracking your XP, and helping you build your digital planet.
                    </p>
                    <Button variant="link" onClick={() => navigate("/social?tab=ai-coach")} className="mt-4 text-primary text-lg">
                        Meet Your Coach
                    </Button>
                </AnimatedSection>
            </main>
        </div>
    );
};

export default MainDashboard;