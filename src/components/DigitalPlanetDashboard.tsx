import DigitalPlanetView from "./DigitalPlanetView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2, Star, Zap } from "lucide-react";
import { useUserStats } from "@/hooks/use-user-stats";
import WeeklyFocusChart from "./WeeklyFocusChart";
import PlanetShop from "./PlanetShop";
import PlanetUpgradePanel from "./PlanetUpgradePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DigitalPlanetDashboard = () => {
    const { stats, levels, isLoading: isLoadingStats } = useUserStats();

    if (isLoadingStats) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Main Planet View (1/3) */}
            <div className="lg:col-span-1">
                <DigitalPlanetView />
            </div>
            
            {/* Stats and Shops (2/3) */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card p-4">
                    <CardHeader className="p-0 pb-2">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-accent" /> Civilization Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/30 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total XP</p>
                                <p className="text-xl font-bold text-primary">{levels?.total_xp || 0}</p>
                            </div>
                            <div className="bg-secondary/30 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Focused</p>
                                <p className="text-xl font-bold text-primary">{stats?.total_focused_minutes || 0} min</p>
                            </div>
                        </div>
                        <WeeklyFocusChart />
                    </CardContent>
                </Card>
                
                {/* Shops Tabs */}
                <Tabs defaultValue="upgrades">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upgrades" className="flex items-center gap-2">
                            <Zap className="h-4 w-4" /> XP Upgrades
                        </TabsTrigger>
                        <TabsTrigger value="shop" className="flex items-center gap-2">
                            <Star className="h-4 w-4" /> Stardust Shop
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upgrades">
                        <PlanetUpgradePanel />
                    </TabsContent>
                    <TabsContent value="shop">
                        <PlanetShop />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default DigitalPlanetDashboard;