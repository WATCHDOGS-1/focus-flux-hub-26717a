import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, LayoutGrid, Zap, MessageSquare, Trophy, BookOpen, Brain, Clock, Calendar, TrendingUp, Settings, EyeOff, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DigitalPlanetView from "@/components/DigitalPlanetView";
import FocusTimer from "@/components/FocusTimer";
import HeatmapStats from "@/components/HeatmapStats";
import AICoachPanel from "@/components/AICoachPanel";
import { cn } from "@/lib/utils";
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

// --- Configuration ---
const LAYOUT_STORAGE_KEY = "main_dashboard_layout";
const VISIBILITY_STORAGE_KEY = "main_dashboard_visibility";

// Default layout configuration
const defaultLayout = [
    { i: 'planet', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 2 },
    { i: 'timer', x: 2, y: 0, w: 2, h: 1, minW: 1, minH: 1 },
    { i: 'heatmap', x: 2, y: 1, w: 2, h: 1, minW: 1, minH: 1 },
    { i: 'ai', x: 4, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'links', x: 0, y: 2, w: 5, h: 1, minW: 3, minH: 1 },
];

// Component Map
const componentMap: { [key: string]: { title: string, component: React.ElementType, defaultW: number, defaultH: number } } = {
    'planet': { title: "Digital Planet", component: DigitalPlanetView, defaultW: 2, defaultH: 2 },
    'timer': { title: "Focus Timer", component: FocusTimer, defaultW: 2, defaultH: 1 },
    'heatmap': { title: "Focus Heatmap", component: HeatmapStats, defaultW: 2, defaultH: 1 },
    'ai': { title: "AI Coach", component: AICoachPanel, defaultW: 1, defaultH: 2 },
    'links': { title: "Quick Links", component: DashboardLinks, defaultW: 5, defaultH: 1 },
};

// --- Helper Components ---

const DashboardLinks = () => {
    const navigate = useNavigate();
    const links = [
        { title: "Explore Rooms", icon: Zap, link: "/explore", description: "Join live co-working sessions." },
        { title: "Productivity Hub", icon: LayoutGrid, link: "/productivity", description: "Manage tasks and schedule your week." },
        { title: "Leaderboard", icon: Trophy, link: "/social?tab=leaderboard", description: "Climb the weekly ranks." },
    ];
    return (
        <div className="flex flex-row gap-4 h-full p-4">
            {links.map((item, index) => (
                <div 
                    key={index}
                    className="flex-1 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer dopamine-click"
                    onClick={() => navigate(item.link)}
                >
                    <item.icon className="w-6 h-6 text-accent mb-2" />
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
            ))}
        </div>
    );
};

const ModuleWrapper = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const { title } = componentMap[id];
    return (
        <Card className="glass-card h-full w-full flex flex-col overflow-hidden">
            <CardHeader className="p-3 pb-0">
                <CardTitle className="text-md font-semibold text-primary">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                {children}
            </CardContent>
        </Card>
    );
};

// --- Main Component ---

const MainDashboard = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const [layout, setLayout] = useState(defaultLayout);
    const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
        const stored = localStorage.getItem(VISIBILITY_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        
        // Default visibility: all true
        return Object.keys(componentMap).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Load layout from local storage on mount
    useEffect(() => {
        const storedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (storedLayout) {
            try {
                const parsedLayout = JSON.parse(storedLayout);
                // Ensure all default items are present in the loaded layout
                const mergedLayout = defaultLayout.map(defaultItem => {
                    const existing = parsedLayout.find((item: any) => item.i === defaultItem.i);
                    return existing || defaultItem;
                });
                setLayout(mergedLayout);
            } catch (e) {
                console.error("Failed to load layout from storage:", e);
                setLayout(defaultLayout);
            }
        }
    }, []);

    // Save layout on change
    const onLayoutChange = (newLayout: any) => {
        setLayout(newLayout);
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    };
    
    // Toggle module visibility
    const toggleVisibility = (id: string) => {
        setVisibility(prev => {
            const newVisibility = { ...prev, [id]: !prev[id] };
            localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(newVisibility));
            return newVisibility;
        });
    };
    
    // Filter layout based on visibility
    const visibleLayout = layout.filter(item => visibility[item.i]);

    return (
        <div className="min-h-screen relative overflow-hidden p-4">
            <header className="glass-card border-b border-white/10 sticky top-4 z-20 mb-4 rounded-xl">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary">OnlyFocus</h1>
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsSettingsOpen(prev => !prev)} 
                            title="Customize Dashboard"
                            className={isSettingsOpen ? "bg-secondary" : ""}
                        >
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/productivity")} className="dopamine-click">
                            <LayoutGrid className="w-4 h-4 mr-2" /> Productivity Hub
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/social")} className="dopamine-click">
                            <MessageSquare className="w-4 h-4 mr-2" /> Social Hub
                        </Button>
                        {!isAuthenticated && (
                            <Button onClick={() => navigate("/auth")} className="dopamine-click">
                                Log In
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Settings Panel */}
            {isSettingsOpen && (
                <Card className="glass-card fixed top-20 right-4 z-30 w-64 p-4 space-y-3">
                    <CardTitle className="text-lg">Customize Modules</CardTitle>
                    {Object.keys(componentMap).map(id => (
                        <div key={id} className="flex items-center justify-between text-sm">
                            <span>{componentMap[id].title}</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-6 h-6"
                                onClick={() => toggleVisibility(id)}
                            >
                                {visibility[id] ? <EyeOff className="w-4 h-4 text-destructive" /> : <Eye className="w-4 h-4 text-success" />}
                            </Button>
                        </div>
                    ))}
                </Card>
            )}

            <main className="container mx-auto p-0">
                <ResponsiveReactGridLayout
                    className="layout"
                    layouts={{ lg: visibleLayout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 5, md: 4, sm: 3, xs: 2, xxs: 1 }}
                    rowHeight={300} // Set a fixed row height for better control
                    onLayoutChange={onLayoutChange}
                    isDraggable={!isSettingsOpen} // Disable dragging when settings are open
                    isResizable={!isSettingsOpen} // Disable resizing when settings are open
                >
                    {visibleLayout.map(item => {
                        const { component: Component } = componentMap[item.i];
                        return (
                            <div key={item.i} className="p-2">
                                <ModuleWrapper id={item.i}>
                                    <Component />
                                </ModuleWrapper>
                            </div>
                        );
                    })}
                </ResponsiveReactGridLayout>
            </main>
        </div>
    );
};

export default MainDashboard;