import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Star, Globe, Loader2, Check, ArrowRight, Satellite, Landmark, Leaf } from "lucide-react";
import { useCivilization } from "@/hooks/use-civilization";
import { spendStardust } from "@/utils/session-management";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Construction {
    id: string;
    name: string;
    cost: number;
    icon: React.ElementType;
    effect: string;
}

const CONSTRUCTIONS: Construction[] = [
    { id: "satellite", name: "Orbital Satellite", cost: 500, icon: Satellite, effect: "Adds a visual satellite to your planet." },
    { id: "lighthouse", name: "Focus Lighthouse", cost: 1000, icon: Landmark, effect: "Beams light into space, symbolizing deep work." },
    { id: "biodome", id: "biodome", cost: 2000, icon: Leaf, effect: "Adds vegetation and life to your planet surface." },
];

const PURCHASED_CONSTRUCTIONS_KEY = "civilization_constructions";

const PlanetShop = () => {
    const { userId } = useAuth();
    const { data: civData, isLoading: isLoadingCiv } = useCivilization();
    const [purchasedConstructions, setPurchasedConstructions] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const currentStardust = civData?.stardust || 0;

    useEffect(() => {
        const stored = localStorage.getItem(PURCHASED_CONSTRUCTIONS_KEY);
        if (stored) {
            setPurchasedConstructions(JSON.parse(stored));
        }
    }, [civData]);

    const handlePurchase = async (construction: Construction) => {
        if (!userId || isProcessing) return;

        if (currentStardust < construction.cost) {
            toast.error("Insufficient Stardust.");
            return;
        }

        setIsProcessing(true);
        toast.loading(`Constructing ${construction.name}...`, { id: 'construction-purchase' });

        try {
            const success = await spendStardust(userId, construction.cost);

            if (success) {
                // Update local storage for persistence
                const newPurchased = [...purchasedConstructions, construction.id];
                localStorage.setItem(PURCHASED_CONSTRUCTIONS_KEY, JSON.stringify(newPurchased));
                setPurchasedConstructions(newPurchased);
                
                // Trigger a civData refresh by updating a dummy state or relying on the next interval
                // For now, we rely on the next civData update or manual refresh.
                
                toast.success(`${construction.name} constructed! Stardust deducted.`, { id: 'construction-purchase' });
            } else {
                toast.error("Construction failed. Check Stardust balance.", { id: 'construction-purchase' });
            }
        } catch (e) {
            toast.error("An unexpected error occurred.", { id: 'construction-purchase' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoadingCiv) {
        return (
            <Card className="glass-card p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading Shop...</p>
            </Card>
        );
    }

    return (
        <Card className="glass-card p-4 rounded-xl space-y-4 h-full flex flex-col">
            <CardHeader className="p-0 pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-yellow-500" /> Planet Shop
                </CardTitle>
                <p className="text-sm text-muted-foreground">Spend Stardust to build permanent structures on your planet.</p>
                <Badge className="bg-yellow-500/20 text-yellow-400 font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" /> Available Stardust: {currentStardust}
                </Badge>
            </CardHeader>
            
            <CardContent className="p-0 space-y-3 overflow-y-auto flex-1">
                {CONSTRUCTIONS.map((construction) => {
                    const isPurchased = purchasedConstructions.includes(construction.id);
                    const canAfford = currentStardust >= construction.cost;
                    const isDisabled = isPurchased || !canAfford || isProcessing;

                    return (
                        <div 
                            key={construction.id} 
                            className={cn(
                                "p-3 rounded-lg border flex items-center justify-between transition-all",
                                isPurchased ? "bg-green-500/10 border-green-500/30" : "bg-secondary/20 border-border hover:bg-secondary/50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <construction.icon className="w-6 h-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="font-semibold">{construction.name}</span>
                                    <span className="text-xs text-muted-foreground">{construction.effect}</span>
                                    <span className={cn("text-xs mt-1", canAfford ? "text-yellow-400" : "text-destructive")}>
                                        Cost: {construction.cost} Stardust
                                    </span>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => handlePurchase(construction)}
                                disabled={isDisabled}
                                variant={isPurchased ? "success" : "default"}
                                className="dopamine-click flex-shrink-0"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : isPurchased ? <Check className="w-4 h-4" /> : "Build"}
                            </Button>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default PlanetShop;