import { motion } from "framer-motion";
import { Zap, Globe, Rocket, TrendingUp, Loader2, Satellite, Landmark, Leaf, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCivilization, PlanetTheme } from "@/hooks/use-civilization";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BIOME_STYLES: Record<PlanetTheme, { primary: string, secondary: string, glow: string, name: string }> = {
    'default': { primary: "hsl(217 91% 60%)", secondary: "hsl(210 40% 98%)", glow: "shadow-blue-500/50", name: "Default Focus" },
    'cyberpunk': { primary: "hsl(280 90% 65%)", secondary: "hsl(180 90% 60%)", glow: "shadow-purple-500/50", name: "Cyberpunk City" },
    'library': { primary: "hsl(40 50% 35%)", secondary: "hsl(30 20% 98%)", glow: "shadow-yellow-700/50", name: "Mystic Library" },
    'arena': { primary: "hsl(0 84.2% 60.2%)", secondary: "hsl(40 100% 95%)", glow: "shadow-red-500/50", name: "Spartan Arena" },
};

const DigitalPlanetView = () => {
    const { data: civData, isLoading } = useCivilization();

    if (isLoading || !civData) {
        return (
            <Card className="glass-card p-4 rounded-xl space-y-4 text-center h-full flex flex-col justify-center">
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                        <Globe className="w-10 h-10 mx-auto" />
                    )}
                </div>
                <p className="font-semibold">{isLoading ? "Initializing Civilization..." : "Start Focusing to Build Your Planet!"}</p>
                <p className="text-sm text-muted-foreground">Log your first session to begin your civilization's growth.</p>
            </Card>
        );
    }

    const theme = BIOME_STYLES[civData.planetTheme] || BIOME_STYLES.default;

    return (
        <Card className="glass-card p-4 rounded-xl space-y-4 overflow-hidden h-full flex flex-col">
            <CardHeader className="p-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-accent" /> {civData.name} (Lvl {civData.level})
                </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col items-center flex-1 min-h-[250px]">
                {/* Placeholder for 3D Planet */}
                <div id="digital-planet-3d" className="relative flex items-center justify-center my-6 flex-1 w-full h-full min-h-[250px] bg-secondary/50 rounded-xl">
                    <Rocket className="w-16 h-16 text-primary/50 animate-pulse" />
                    <p className="absolute bottom-4 text-xs text-muted-foreground">3D Visualization Temporarily Disabled</p>
                </div>

                {/* Growth Status */}
                <div className="w-full space-y-2 flex-shrink-0 pt-4">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-foreground">{theme.name} Biome</h3>
                        <p className="text-sm text-muted-foreground">Growth Points: {civData.growthPoints} XP</p>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Current Growth</span>
                            <span>{civData.xpToNextLevel > 0 ? `${civData.xpToNextLevel} XP to next level` : 'Max Level!'}</span>
                        </div>
                        <div className="relative h-3 w-full rounded-full bg-secondary overflow-hidden">
                            <motion.div
                                className="absolute top-0 left-0 h-full rounded-full"
                                style={{ backgroundColor: theme.primary, width: `${civData.progressPercent}%` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${civData.progressPercent}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                    
                    <div className="text-center pt-2 flex items-center justify-center gap-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400 font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" /> Stardust: {civData.stardust}
                        </Badge>
                        {civData.satelliteCount > 0 && (
                            <Badge className="bg-primary/20 text-primary font-semibold flex items-center gap-1">
                                <Satellite className="w-3 h-3" /> Satellites: {civData.satelliteCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DigitalPlanetView;