import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings, Clock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useFocusSession, SESSION_MODES } from "@/hooks/use-focus-session";

// Settings Dialog Component for Custom Timer
interface SettingsDialogProps {
  onSave: (work: number, breakTime: number) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isBreathingAnimationEnabled: boolean;
  onToggleAnimation: (checked: boolean) => void;
  currentMode: typeof SESSION_MODES[0];
  setCurrentMode: (mode: typeof SESSION_MODES[0]) => void;
}

const SettingsDialog = ({ onSave, isOpen, setIsOpen, isBreathingAnimationEnabled, onToggleAnimation, currentMode, setCurrentMode }: SettingsDialogProps) => {
  const [workMinutes, setWorkMinutes] = useState(Math.floor(currentMode.work / 60));
  const [breakMinutes, setBreakMinutes] = useState(Math.floor(currentMode.break / 60));

  useEffect(() => {
    setWorkMinutes(Math.floor(currentMode.work / 60));
    setBreakMinutes(Math.floor(currentMode.break / 60));
  }, [currentMode]);

  const handleSave = () => {
    const work = Math.max(1, Math.min(360, workMinutes)); // Max 6 hours
    const breakT = Math.max(0, Math.min(60, breakMinutes)); // Max 1 hour
    onSave(work, breakT);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="dopamine-click">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle>Session Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Mode Selector */}
          <div className="space-y-2">
            <Label>Predefined Modes</Label>
            <Select onValueChange={(value) => setCurrentMode(SESSION_MODES.find(m => m.name === value) || currentMode)} value={currentMode.name}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Study Mode" />
              </SelectTrigger>
              <SelectContent className="glass-card">
                {SESSION_MODES.map(mode => (
                  <SelectItem key={mode.name} value={mode.name}>
                    {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Custom Settings */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="work-time" className="text-right">
              Focus (min)
            </Label>
            <Input
              id="work-time"
              type="number"
              min={1}
              max={360}
              value={workMinutes}
              onChange={(e) => setWorkMinutes(parseInt(e.target.value) || 1)}
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="break-time" className="text-right">
              Break (min)
            </Label>
            <Input
              id="break-time"
              type="number"
              min={0}
              max={60}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              className="col-span-2"
            />
          </div>
          
          <Button onClick={handleSave} className="dopamine-click">
            Apply Custom Session
          </Button>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Label htmlFor="breathing-animation">
              Breathing Animation
              <p className="text-xs text-muted-foreground">Visual cue for focus/break.</p>
            </Label>
            <Switch
              id="breathing-animation"
              checked={isBreathingAnimationEnabled}
              onCheckedChange={onToggleAnimation}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
    currentDuration,
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
    <div className="h-full flex flex-col items-center justify-center">
      <div className="flex items-center justify-between w-full max-w-xs mb-4">
        <h3 className="text-xl font-semibold truncate">
          {isBreak ? "Break Time" : currentMode.name}
        </h3>
        <SettingsDialog 
          onSave={handleSaveCustomSettings}
          isOpen={isSettingsOpen}
          setIsOpen={setIsSettingsOpen}
          isBreathingAnimationEnabled={isBreathingAnimationEnabled}
          onToggleAnimation={handleToggleAnimation}
          currentMode={currentMode}
          setCurrentMode={setCurrentMode}
        />
      </div>

      <div className="relative w-64 h-64 mb-8 shadow-glow rounded-full">
        <svg className="w-full h-full -rotate-90">
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
          <circle
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
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl font-bold font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          size="icon"
          variant={isActive ? "default" : "outline"}
          onClick={toggleTimer}
          className="w-12 h-12 dopamine-click shadow-glow"
        >
          {isActive ? <Pause /> : <Play />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={resetTimer}
          className="w-12 h-12 dopamine-click shadow-glow"
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
};

export default FocusTimer;