import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import confetti from 'canvas-confetti';

export type FocusClass = "Architect" | "Sprinter" | "Scholar" | "Titan";

export const FOCUS_CLASSES = [
    { id: "Architect", name: "The Architect", description: "System designers. Bonus XP for high note density.", icon: "🏗️" },
    { id: "Sprinter", name: "The Sprinter", description: "Efficient bursts. Bonus XP for hitting 25-min goals.", icon: "🏃" },
    { id: "Scholar", name: "The Scholar", description: "Knowledge seekers. Bonus XP for active recall passes.", icon: "📚" },
    { id: "Titan", name: "The Titan", description: "High-volume workers. Bonus XP for 3+ hour sessions.", icon: "⚔️" },
];

export function useGamification() {
    const { userId } = useAuth();
    const [userClass, setUserClass] = useState<FocusClass>("Scholar");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const fetch = async () => {
            const { data } = await supabase.from("profiles").select("archetype").eq("id", userId).single();
            if (data?.archetype) setUserClass(data.archetype as FocusClass);
            setIsLoading(false);
        };
        fetch();
    }, [userId]);

    const setClass = async (newClass: FocusClass) => {
        setUserClass(newClass);
        await supabase.from("profiles").update({ archetype: newClass }).eq("id", userId);
        toast.success(`Path set to ${newClass}!`);
    };

    return { userClass, setUserClass: setClass, isLoading, availableClasses: FOCUS_CLASSES };
}