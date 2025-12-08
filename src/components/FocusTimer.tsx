import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFocusSession } from "@/hooks/use-focus-session";
import TimerSettingsDialog from "./TimerSettingsDialog";
import { motion } from "framer-motion";

const FocusTimer = () => {
  const { 
    currentMode, 
    setCurrentMode, 
    timeLeft, 
    isActive, 
    isBreak, 
    toggleTimer, 
    resetTimer, 
    handleSaveCustomSettings,
    progress,
  } = useFocusSession();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBreathingAnimationEnabled, setIsBreathingAnimationEnabled] = useState(true);

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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div id="focus-timer-card" className="h-full flex flex-col items-center justify-center p-8 min-h-[400px]">
      <div className="flex items-center justify-between w-full max-w-xs mb-4">
        <h3 className="text-xl font-bold truncate text-accent">
          {isBreak ? "Break Time" : currentMode.name}
        </h3>
        <TimerSettingsDialog 
          onSave={handleSaveCustomSettings}
          isOpen={isSettingsOpen}
          setIsOpen={setIsSettingsOpen}
          isBreathingAnimationEnabled={isBreathingAnimationEnabled}
          onToggleAnimation={handleToggleAnimation}
          currentMode={currentMode}
          setCurrentMode={setCurrentMode}
          triggerClassName="dopamine-click text-muted-foreground hover:text-primary"
        />
      </div>

      <div className="relative w-64 h-64 mb-8">
        <svg className="w-full h-full -rotate-90">
          {/* Background Ring */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="hsl(var(--border))"
            strokeWidth="12"
            fill="none"
            className={cn(
              "transition-opacity duration-1000",
              isActive && isBreathingAnimationEnabled && "animate-background-pulse"
            )}
          />
          {/* Progress Ring with Neon Glow */}
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className={cn(
              "transition-all duration-1000",
              isActive && isBreathingAnimationEnabled && "animate-timer-breathing"
            )}
            style={{
                filter: `drop-shadow(0 0 8px ${isBreak ? 'hsl(var(--accent) / 0.8)' : 'hsl(var(--primary) / 0.8)'})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl font-mono font-bold text-foreground">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          size="lg"
          variant={isActive ? "default" : "outline"}
          onClick={toggleTimer}
          className="w-16 h-16 rounded-full dopamine-click shadow-glow"
        >
          {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={resetTimer}
          className="w-16 h-16 rounded-full dopamine-click shadow-glow"
        >
          <RotateCcw className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};

export default FocusTimer;