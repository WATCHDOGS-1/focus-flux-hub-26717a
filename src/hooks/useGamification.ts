import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import confetti from 'canvas-confetti';

export type FocusClass = "Monk" | "Sprinter" | "Scholar" | "None";

export const FOCUS_CLASSES = [
    {
        id: "Monk",
        name: "The Monk",
        description: "Masters of deep focus. Bonus XP for sessions > 45 mins.",
        icon: "🧘",
    },
    {
        id: "Sprinter",
        name: "The Sprinter",
        description: "Agile and efficient. Bonus XP for sessions < 30 mins.",
        icon: "🏃",
    },
    {
        id: "Scholar",
        name: "The Scholar",
        description: "Consistent and disciplined. Bonus XP for daily streaks.",
        icon: "📚",
    },
];

const triggerConfetti = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#b026ff', '#00f0ff', '#ffffff'],
    });
};

export function useGamification() {
    const { userId } = useAuth();
    const [userClass, setUserClass] = useState<FocusClass>("None");
    const [isLoading, setIsLoading] = useState(true);
    const [currentLevel, setCurrentLevel] = useState(0); // Track current level

    useEffect(() => {
        if (!userId) return;

        const fetchClass = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("interests, user_levels(level)")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching user class:", error);
                toast.error(`Failed to fetch user class: ${error.message}`);
            } else {
                const interests = data.interests as Record<string, any>;
                if (interests && interests.focus_class) {
                    setUserClass(interests.focus_class as FocusClass);
                }
                const level = (data.user_levels as any)?.[0]?.level || 1;
                
                // Check for level up and trigger confetti
                if (currentLevel > 0 && level > currentLevel) {
                    toast.success(`LEVEL UP! You reached Level ${level}! 🎉`);
                    triggerConfetti();
                }
                setCurrentLevel(level);
            }
            setIsLoading(false);
        };

        fetchClass();
    }, [userId, currentLevel]); // Added currentLevel dependency to track changes

    const setClass = async (newClass: FocusClass) => {
        if (!userId) return;

        // Optimistic update
        setUserClass(newClass);

        // Fetch existing interests first to merge
        const { data: currentData } = await supabase
            .from("profiles")
            .select("interests")
            .eq("id", userId)
            .single();

        const currentInterests = (currentData?.interests as Record<string, any>) || {};

        const { error } = await supabase
            .from("profiles")
            .update({
                interests: { ...currentInterests, focus_class: newClass },
            })
            .eq("id", userId);

        if (error) {
            console.error("Error updating class:", error);
            toast.error(`Failed to update class: ${error.message}`);
            // Revert on error (could be improved)
        } else {
            toast.success(`Class updated to ${newClass}!`);
        }
    };

    return {
        userClass,
        setUserClass: setClass,
        isLoading,
        availableClasses: FOCUS_CLASSES,
    };
}