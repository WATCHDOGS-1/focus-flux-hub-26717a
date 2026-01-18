import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFocusSession } from "@/hooks/use-focus-session";
import TimerSettingsDialog from "./TimerSettingsDialog";
import { motion, AnimatePresence } from "framer-motion";

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-4">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Modern Circular Progress */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-white/5"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray="100 100"
            pathLength="100"
            strokeDashoffset={100 - progress}
            className={cn(
                "text-primary transition-all duration-1000 ease-linear",
                isActive && "animate-pulse"
            )}
            style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" }}
          />
        </svg>

        <div className="text-center z-10">
          <div className="text-4xl font-bold tracking-tighter tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-medium">
            {isBreak ? "Recharge" : "Deep Flow"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-full border border-white/10">
        <Button
          size="icon"
          variant="ghost"
          onClick={resetTimer}
          className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={toggleTimer}
          className={cn(
            "h-12 w-12 rounded-full transition-all duration-500",
            isActive ? "bg-white text-black" : "premium-gradient"
          )}
        >
          {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </Button>

        <TimerSettingsDialog 
          onSave={handleSaveCustomSettings}
          isOpen={isSettingsOpen}
          setIsOpen={setIsSettingsOpen}
          isBreathingAnimationEnabled={true}
          onToggleAnimation={() => {}}
          currentMode={currentMode}
          setCurrentMode={setCurrentMode}
          triggerClassName="h-10 w-10 rounded-full text-muted-foreground"
        />
      </div>
    </div>
  );
};

export default FocusTimer;