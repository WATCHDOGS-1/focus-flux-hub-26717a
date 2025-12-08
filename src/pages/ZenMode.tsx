import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useFocusSession } from "@/hooks/use-focus-session";
import FocusHUD from "@/components/FocusHUD";
import { toast } from "sonner";

const ZenMode = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [searchParams] = useSearchParams();
    const initialTag = searchParams.get('tag') || "Deep Focus";

    const {
        isActive,
        sessionStartTime,
        setFocusTag,
        startNewSession,
        prepareSessionEnd,
        endCurrentSessionAndSave,
    } = useFocusSession();

    // --- Session Save Logic (Auto-save on pause/end) ---
    useEffect(() => {
        if (!isActive && sessionStartTime !== 0) {
            const sessionData = prepareSessionEnd();
            if (sessionData) {
                // Auto-save immediately if paused/ended
                endCurrentSessionAndSave(sessionData.defaultTag);
            }
        }
    }, [isActive, sessionStartTime, prepareSessionEnd, endCurrentSessionAndSave]);
    // ---------------------------------------------------------

    // Authentication and Initial Setup
    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated) {
            navigate("/auth", { replace: true });
            return;
        }
        
        // Set initial tag and start session if not already active
        if (sessionStartTime === 0) {
            setFocusTag(initialTag);
            startNewSession();
            toast.info(`Zen Mode started: ${initialTag}`);
        }
    }, [isAuthLoading, isAuthenticated, navigate, initialTag, sessionStartTime, setFocusTag, startNewSession]);

    const handleExitZenMode = () => {
        // If active, trigger save flow (which is handled by the useEffect above)
        if (isActive || sessionStartTime !== 0) {
            prepareSessionEnd(); // This stops the timer and triggers the save effect
        }
        navigate("/productivity");
    };

    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-xl text-muted-foreground">Loading Zen Mode...</div>
            </div>
        );
    }

    return <FocusHUD onExitZenMode={handleExitZenMode} />;
};

export default ZenMode;