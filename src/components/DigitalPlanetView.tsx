import { motion } from "framer-motion";
import { Zap, Globe, Rocket, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCivilization } from "@/hooks/use-civilization";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const THEME_COLORS = {
    blue: { primary: "hsl(217 91% 60%)", secondary: "hsl(210 40% 98%)", glow: "shadow-blue-500/50" },
    green: { primary: "hsl(142 76% 41%)", secondary: "hsl(210 40% 98%)", glow: "shadow-green-500/50" },
    red: { primary: "hsl(0 84.2% 60.2%)", secondary: "hsl(210 40% 98%)", glow: "shadow-red-500/50" },
    purple: { primary: "hsl(250 70% 70%)", secondary: "hsl(210 40% 98%)", glow: "shadow-purple-500/50" },
};

const DigitalPlanetView = () => {
    const { data: civData, isLoading } = useCivilization();

    if (isLoading || !civData) {
        // If loading, or if loading finished but no data was returned (should be rare after hook fix)
        return (
            <Card className="glass-card p-4 rounded-xl space-y-4 text-center">
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

    const theme = THEME_COLORS[civData.planetTheme] || THEME_COLORS.blue;
    const planetSize = 100 + (civData.level * 10); // Planet grows with level

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

    const buildingVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1 + 0.5,
                type: "spring",
                stiffness: 100,
            },
        }),
    };
    
    const growthVariants = {
        initial: { width: 0 },
        animate: { width: `${civData.progressPercent}%` },
    };

    return (
        <Card className="glass-card p-4 rounded-xl space-y-4 overflow-hidden">
            <CardHeader className="p-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-accent" /> Digital Planet: Level {civData.level}
                </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col items-center">
                {/* Animated Planet Visualization */}
                <div className="relative flex items-center justify-center my-6">
                    <motion.div
                        className={cn(
                            "rounded-full shadow-2xl",
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
                        // Ensure the planet doesn't spin if it's level 1 (static starting point)
                        transition={civData.level > 1 ? planetVariants.animate.transition : { duration: 0 }}
                    >
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
                                    variants={buildingVariants}
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
                <div className="w-full space-y-2">
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
                                variants={growthVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DigitalPlanetView;