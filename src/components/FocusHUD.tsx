import { useState, useEffect } from "react";
import { useFocusSession, SESSION_MODES } from "@/hooks/use-focus-session";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Play, Pause, StopCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import AmbientBackground from "./AmbientBackground";
import { motion, AnimatePresence } from "framer-motion";
import TimerSettingsDialog from "./TimerSettingsDialog"; // Import the dialog
import { toast } from "sonner";

interface FocusHUDProps {
    onExitZenMode: () => void;
}

const FocusHUD = ({ onExitZenMode }: FocusHUDProps) => {
    const {
        timeLeft,
        isActive,
        isBreak,
        currentMode,
        setCurrentMode,
        focusTag,
        toggleTimer,
        endCurrentSession,
        handleSaveCustomSettings,
        progress,
    } = useFocusSession();

    const [mouseIdle, setMouseIdle] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBreathingAnimationEnabled, setIsBreathingAnimationEnabled] = useState(true);
    let idleTimer: NodeJS.Timeout;

    // Load animation setting from local storage on mount
    useEffect(() => {
        const storedSetting = localStorage.getItem("timer_breathing_animation");
        if (storedSetting !== null) {
            setIsBreathingAnimationEnabled(storedSetting === 'true');
        }
    }, []);

    const handleToggleAnimation = (checked: boolean) => {
        setIsBreathingAnimationEnabled(checked);
        localStorage.setItem("timer_breathing_animation", checked.toString());
        toast.info(`Breathing animation ${checked ? 'enabled' : 'disabled'}.`);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleMouseMove = () => {
        setMouseIdle(false);
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => setMouseIdle(true), 3000);
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            clearTimeout(idleTimer);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white overflow-hidden">
            {/* Dynamic Background */}
            <AmbientBackground isActive={true} className="absolute inset-0 z-0" />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl p-8">

                {/* Top Bar (Fades out on idle) */}
                <div className={cn("absolute top-8 right-8 left-8 flex justify-between transition-opacity duration-500", mouseIdle && isActive ? "opacity-0" : "opacity-100")}>
                    {/* Left side: Settings */}
                    <TimerSettingsDialog 
                        onSave={handleSaveCustomSettings}
                        isOpen={isSettingsOpen}
                        setIsOpen={setIsSettingsOpen}
                        isBreathingAnimationEnabled={isBreathingAnimationEnabled}
                        onToggleAnimation={handleToggleAnimation}
                        currentMode={currentMode}
                        setCurrentMode={setCurrentMode}
                        triggerClassName="text-white/70 hover:text-white hover:bg-white/10"
                    />

                    {/* Right side: Exit Button */}
                    <Button
                        variant="ghost"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={onExitZenMode}
                    >
                        <Minimize2 className="mr-2 h-4 w-4" /> Exit Zen Mode
                    </Button>
                </div>

                {/* Main HUD */}
                <div className="flex flex-col items-center gap-8">
                    {/* Focus Tag / Intent */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h2 className="text-2xl md:text-3xl font-light text-blue-200/80 tracking-wide">
                            {isBreak ? "Rest & Recharge" : (focusTag || "Deep Focus")}
                        </h2>
                    </motion.div>

                    {/* Timer Display */}
                    <div className="relative group cursor-default">
                        <div className="text-[12rem] md:text-[16rem] font-bold leading-none tracking-tighter font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-2xl">
                            {formatTime(timeLeft)}
                        </div>

                        {/* Progress Ring (Subtle) */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-20">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray="100 100"
                                pathLength="100"
                                strokeDashoffset={100 - progress}
                                className="text-blue-400 transition-all duration-1000"
                            />
                        </svg>
                    </div>

                    {/* Controls (Fade out on idle) */}
                    <div className={cn("flex items-center gap-6 transition-all duration-500", mouseIdle && isActive ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0")}>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 w-16 rounded-full border-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/40 transition-all scale-100 hover:scale-105"
                            onClick={toggleTimer}
                        >
                            {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                        </Button>

                        {isActive && (
                            <Button
                                size="lg"
                                variant="ghost"
                                className="h-16 w-16 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={endCurrentSession}
                            >
                                <StopCircle className="h-8 w-8" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Status */}
            <div className={cn("absolute bottom-8 text-white/30 text-sm font-mono transition-opacity duration-500", mouseIdle && isActive ? "opacity-0" : "opacity-100")}>
                {currentMode.name} • {isActive ? "Focusing..." : "Paused"}
            </div>
        </div>
    );
};

export default FocusHUD;