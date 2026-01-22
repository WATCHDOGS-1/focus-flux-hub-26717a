import { motion } from "framer-motion";
import { Zap, Globe, Rocket, TrendingUp, Loader2, Satellite, Landmark, Leaf, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCivilization, PlanetTheme } from "@/hooks/use-civilization";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const BIOME_STYLES: Record<PlanetTheme, { primary: string, secondary: string, glow: string, name: string }> = {
    'default': { primary: "hsl(217 91% 60%)", secondary: "hsl(210 40% 98%)", glow: "shadow-blue-500/50", name: "Default Focus" },
    'cyberpunk': { primary: "hsl(280 90% 65%)", secondary: "hsl(180 90% 60%)", glow: "shadow-purple-500/50", name: "Cyberpunk City" },
    'library': { primary: "hsl(40 50% 35%)", secondary: "hsl(30 20% 98%)", glow: "shadow-yellow-700/50", name: "Mystic Library" },
    'arena': { primary: "hsl(0 84.2% 60.2%)", secondary: "hsl(40 100% 95%)", glow: "shadow-red-500/50", name: "Spartan Arena" },
};

const PURCHASED_CONSTRUCTIONS_KEY = "civilization_constructions";

const DigitalPlanetView = () => {
    const { data: civData, isLoading } = useCivilization();
    const [purchasedConstructions, setPurchasedConstructions] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(PURCHASED_CONSTRUCTIONS_KEY);
        if (stored) {
            setPurchasedConstructions(JSON.parse(stored));
        }
    }, [civData]);

    if (isLoading || !civData) {
        // If loading, or if loading finished but no data was returned (should be rare after hook fix)
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
    const planetSize = 150; // Fixed base size for visual consistency

    // Animation variants for the planet and buildings
    const planetVariants = {
        initial: { scale: 0.8, rotate: 0 },
        animate: { 
            scale: 1, 
            rotate: 360, 
            transition: { 
                duration: 100, 
                ease: "linear", 
                repeat: Infinity 
            } 
        },
    };

    const SatelliteComponent = ({ index }: { index: number }) => (
        <motion.div
            key={`sat-${index}`}
            className="absolute w-3 h-3 rounded-full shadow-lg"
            style={{ 
                top: '50%', 
                left: '50%', 
                transformOrigin: 'center',
                // Orbit radius increases slightly with index
                transform: `rotate(${index * 45}deg) translateX(${planetSize / 2 + 20 + index * 5}px) translateY(-50%)`,
                backgroundColor: theme.secondary,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10 + index * 5, ease: "linear", repeat: Infinity }}
        >
            <Rocket className="w-3 h-3 text-primary" />
        </motion.div>
    );
    
    const renderConstruction = (id: string) => {
        if (!purchasedConstructions.includes(id)) return null;
        
        switch (id) {
            case 'lighthouse': return <Landmark className="absolute top-1/4 left-1/4 w-8 h-8 text-yellow-400 drop-shadow-lg" />;
            case 'biodome': return <Leaf className="absolute bottom-1/4 right-1/4 w-8 h-8 text-green-500 drop-shadow-lg" />;
            default: return null;
        }
    };

    return (
        <Card className="glass-card p-4 rounded-xl space-y-4 overflow-hidden h-full flex flex-col">
            <CardHeader className="p-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-accent" /> {theme.name} (Lvl {civData.level})
                </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col items-center flex-1">
                {/* Animated Planet Visualization */}
                <div className="relative flex items-center justify-center my-6 flex-1 w-full">
                    {/* Satellites (Based on Streaks) */}
                    {[...Array(civData.satelliteCount)].map((_, i) => (
                        <SatelliteComponent key={i} index={i} />
                    ))}
                    
                    <motion.div
                        className={cn(
                            "rounded-full shadow-2xl transition-all duration-500 relative",
                            theme.glow
                        )}
                        style={{ 
                            width: planetSize, 
                            height: planetSize, 
                            background: `radial-gradient(circle at 30% 30%, ${theme.primary}, ${theme.primary} 30%, #000000 100%)` 
                        }}
                        variants={planetVariants}
                        initial="initial"
                        animate="animate"
                        transition={civData.level > 1 ? planetVariants.animate.transition : { duration: 0 }}
                    >
                        {/* Construction Buildings */}
                        {renderConstruction('lighthouse')}
                        {renderConstruction('biodome')}
                        
                        {/* Civilization Buildings (Simulated) */}
                        <motion.div 
                            className="absolute inset-0 flex items-center justify-center"
                            initial="hidden"
                            animate="visible"
                        >
                            {[...Array(civData.level)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    // Removed buildingVariants for simplicity, using static placement
                                    className="absolute w-2 h-2 rounded-full bg-white/80 shadow-lg"
                                    style={{
                                        top: `${20 + (i * 10) % 60}%`,
                                        left: `${20 + (i * 15) % 60}%`,
                                        transform: `translateZ(10px) scale(${0.5 + (i % 3) * 0.2})`,
                                        backgroundColor: theme.secondary,
                                    }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Growth Status */}
                <div className="w-full space-y-2 flex-shrink-0">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-foreground">{civData.name}</h3>
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
                                style={{ backgroundColor: theme.primary }}
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