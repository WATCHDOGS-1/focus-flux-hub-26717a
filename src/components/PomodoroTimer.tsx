import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
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

const DEFAULT_WORK_TIME = 25 * 60;
const DEFAULT_BREAK_TIME = 5 * 60;

const PomodoroTimer = () => {
  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK_TIME);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_TIME);
  
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load settings from local storage on mount
  useEffect(() => {
    const storedWork = localStorage.getItem("pomodoro_work_duration");
    const storedBreak = localStorage.getItem("pomodoro_break_duration");
    
    if (storedWork) {
      const work = parseInt(storedWork);
      setWorkDuration(work);
      setTimeLeft(work);
    }
    if (storedBreak) {
      setBreakDuration(parseInt(storedBreak));
    }
  }, []);

  // Effect for the timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (isBreak) {
        toast.success("Break over! Time to focus!");
        setIsBreak(false);
        setTimeLeft(workDuration);
      } else {
        toast.success("Great work! Time for a break!");
        setIsBreak(true);
        setTimeLeft(breakDuration);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak, workDuration, breakDuration]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? breakDuration : workDuration);
  };

  const handleSaveSettings = (newWorkMinutes: number, newBreakMinutes: number) => {
    const newWorkSeconds = newWorkMinutes * 60;
    const newBreakSeconds = newBreakMinutes * 60;

    setWorkDuration(newWorkSeconds);
    setBreakDuration(newBreakSeconds);
    localStorage.setItem("pomodoro_work_duration", newWorkSeconds.toString());
    localStorage.setItem("pomodoro_break_duration", newBreakSeconds.toString());
    
    // Reset timer to new work duration if not active
    if (!isActive) {
      setTimeLeft(newWorkSeconds);
      setIsBreak(false);
    }
    
    toast.success("Pomodoro settings saved!");
    setIsSettingsOpen(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentDuration = isBreak ? breakDuration : workDuration;
  const progress = ((currentDuration - timeLeft) / currentDuration) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="flex items-center justify-between w-full max-w-xs mb-4">
        <h3 className="text-xl font-semibold">
          {isBreak ? "Break Time" : "Focus Time"}
        </h3>
        <SettingsDialog 
          initialWork={workDuration / 60}
          initialBreak={breakDuration / 60}
          onSave={handleSaveSettings}
          isOpen={isSettingsOpen}
          setIsOpen={setIsSettingsOpen}
        />
      </div>

      <div className="relative w-64 h-64 mb-8">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="hsl(var(--border))"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
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

// Settings Dialog Component
interface SettingsDialogProps {
  initialWork: number;
  initialBreak: number;
  onSave: (work: number, breakTime: number) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SettingsDialog = ({ initialWork, initialBreak, onSave, isOpen, setIsOpen }: SettingsDialogProps) => {
  const [workMinutes, setWorkMinutes] = useState(initialWork);
  const [breakMinutes, setBreakMinutes] = useState(initialBreak);

  useEffect(() => {
    setWorkMinutes(initialWork);
    setBreakMinutes(initialBreak);
  }, [initialWork, initialBreak]);

  const handleSave = () => {
    const work = Math.max(1, Math.min(120, workMinutes));
    const breakT = Math.max(1, Math.min(60, breakMinutes));
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
          <DialogTitle>Pomodoro Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="work-time" className="text-right">
              Focus (min)
            </Label>
            <Input
              id="work-time"
              type="number"
              min={1}
              max={120}
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
              min={1}
              max={60}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 1)}
              className="col-span-2"
            />
          </div>
        </div>
        <Button onClick={handleSave} className="dopamine-click">
          Apply Settings
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroTimer;