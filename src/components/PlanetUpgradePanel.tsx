import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Globe, Loader2, Check, ArrowRight } from "lucide-react";
import { useCivilization } from "@/hooks/use-civilization";
import { useUserStats } from "@/hooks/use-user-stats";
import { spendXP } from "@/utils/session-management";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Upgrade {
    id: string;
    name: string;
    cost: number;
    effect: string;
    requiredLevel: number;
    type: 'planet' | 'travel';
}

const UPGRADES: Upgrade[] = [
    { id: "planet_size_2", name: "Atmospheric Stabilizer", cost: 1000, effect: "Increases Planet Size (Level 2)", requiredLevel: 1, type: 'planet' },
    { id: "planet_size_3", name: "Bio-Dome Construction", cost: 2500, effect: "Increases Planet Size (Level 3)", requiredLevel: 2, type: 'planet' },
    { id: "solar_travel_1", name: "Unlock Solar Travel", cost: 5000, effect: "Allows travel to new Solar Systems", requiredLevel: 3, type: 'travel' },
    { id: "planet_size_4", name: "Advanced Infrastructure", cost: 4000, effect: "Increases Planet Size (Level 4)", requiredLevel: 3, type: 'planet' },
    { id: "solar_travel_2", name: "Interstellar Gateway", cost: 10000, effect: "Unlocks Interstellar Travel", requiredLevel: 5, type: 'travel' },
];

// NOTE: In a real application, purchased upgrades would be stored in the database.
// For this implementation, we use local storage to simulate persistence of purchases.
const PURCHASED_UPGRADES_KEY = "civilization_upgrades";

const PlanetUpgradePanel = () => {
    const { userId } = useAuth();
    const { data: civData, isLoading: isLoadingCiv } = useCivilization();
    const { levels, refetch: refetchStats } = useUserStats();
    const [purchasedUpgrades, setPurchasedUpgrades] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const currentXP = levels?.total_xp || 0;
    const currentLevel = civData?.level || 1;

    useEffect(() => {
        const stored = localStorage.getItem(PURCHASED_UPGRADES_KEY);
        if (stored) {
            setPurchasedUpgrades(JSON.parse(stored));
        }
    }, [civData]); // Dependency on civData ensures refresh after XP change

    const handlePurchase = async (upgrade: Upgrade) => {
        if (!userId || isProcessing) return;

        if (currentXP < upgrade.cost) {
            toast.error("Insufficient XP.");
            return;
        }
        if (currentLevel < upgrade.requiredLevel) {
            toast.error(`Requires Civilization Level ${upgrade.requiredLevel}.`);
            return;
        }

        setIsProcessing(true);
        toast.loading(`Purchasing ${upgrade.name}...`, { id: 'purchase' });

        try {
            const success = await spendXP(userId, upgrade.cost);

            if (success) {
                // Update local storage for persistence
                const newPurchased = [...purchasedUpgrades, upgrade.id];
                localStorage.setItem(PURCHASED_UPGRADES_KEY, JSON.stringify(newPurchased));
                setPurchasedUpgrades(newPurchased);
                
                refetchStats(); // Refetch stats to update XP/Level display
                toast.success(`${upgrade.name} purchased! XP deducted.`, { id: 'purchase' });
            } else {
                toast.error("Purchase failed. Check XP balance.", { id: 'purchase' });
            }
        } catch (e) {
            toast.error("An unexpected error occurred.", { id: 'purchase' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoadingCiv) {
        return (
            <Card className="glass-card p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading Upgrades...</p>
            </Card>
        );
    }

    return (
        <Card className="glass-card p-4 rounded-xl space-y-4 h-full flex flex-col">
            <CardHeader className="p-0 pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> Planet Upgrades
                </CardTitle>
                <p className="text-sm text-muted-foreground">Spend your hard-earned XP to grow your digital civilization.</p>
            </CardHeader>
            
            <CardContent className="p-0 space-y-3 overflow-y-auto flex-1">
                {UPGRADES.map((upgrade) => {
                    const isPurchased = purchasedUpgrades.includes(upgrade.id);
                    const canAfford = currentXP >= upgrade.cost;
                    const meetsLevel = currentLevel >= upgrade.requiredLevel;
                    const isDisabled = isPurchased || !canAfford || !meetsLevel || isProcessing;

                    return (
                        <div 
                            key={upgrade.id} 
                            className={cn(
                                "p-3 rounded-lg border flex items-center justify-between transition-all",
                                isPurchased ? "bg-green-500/10 border-green-500/30" : "bg-secondary/20 border-border hover:bg-secondary/50"
                            )}
                        >
                            <div className="flex flex-col">
                                <span className="font-semibold flex items-center gap-2">
                                    {upgrade.name}
                                    {upgrade.type === 'travel' && <Badge variant="outline" className="text-xs h-4">Travel</Badge>}
                                </span>
                                <span className="text-xs text-muted-foreground">{upgrade.effect}</span>
                                <span className={cn("text-xs mt-1", canAfford ? "text-primary" : "text-destructive")}>
                                    Cost: {upgrade.cost} XP | Req. Lvl: {upgrade.requiredLevel}
                                </span>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => handlePurchase(upgrade)}
                                disabled={isDisabled}
                                variant={isPurchased ? "success" : "default"}
                                className="dopamine-click flex-shrink-0"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : isPurchased ? <Check className="w-4 h-4" /> : "Buy"}
                            </Button>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default PlanetUpgradePanel;