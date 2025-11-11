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

// Session definitions in seconds
const SESSION_MODES = [
  { name: "Pomodoro (25/5)", work: 25 * 60, break: 5 * 60, cycles: 1 },
  { name: "Deep Work (50/10)", work: 50 * 60, break: 10 * 60, cycles: 1 },
  { name: "Ultradian Cycle (90/20)", work: 90 * 60, break: 20 * 60, cycles: 1 },
  { name: "Silent Mode (3h)", work: 180 * 60, break: 0, cycles: 1 },
  { name: "Destroyer Mode (6h)", work: 360 * 60, break: 5 * 60, cycles: 1 },
];

const SessionTimer = () => {
  const [currentMode, setCurrentMode] = useState(SESSION_MODES[0]);
  const [timeLeft, setTimeLeft] = useState(currentMode.work);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(currentMode.work);
    setIsBreak(false);
    setIsActive(false);
  }, [currentMode]);

  // Timer logic
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
        setTimeLeft(currentMode.work);
      } else {
        if (currentMode.break > 0) {
          toast.success("Great work! Time for a break!");
          setIsBreak(true);
          setTimeLeft(currentMode.break);
        } else {
          // Session finished without a break (e.g., Silent Mode)
          toast.success(`${currentMode.name} session complete!`);
          setTimeLeft(currentMode.work);
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak, currentMode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? currentMode.break : currentMode.work);
  };

  const handleSaveCustomSettings = (workMinutes: number, breakMinutes: number) => {
    const customMode = {
      name: "Custom Session",
      work: workMinutes * 60,
      break: breakMinutes * 60,
      cycles: 1,
    };
    setCurrentMode(customMode);
    setIsSettingsOpen(false);
    toast.success("Custom session created!");
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

  const currentDuration = isBreak ? currentMode.break : currentMode.work;
  const progress = currentDuration > 0 ? ((currentDuration - timeLeft) / currentDuration) * 100 : 0;

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
        />
      </div>

      <div className="w-full max-w-xs mb-4">
        <Select onValueChange={(value) => setCurrentMode(SESSION_MODES.find(m => m.name === value) || SESSION_MODES[0])} value={currentMode.name}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Study Mode" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            {SESSION_MODES.map(mode => (
              <SelectItem key={mode.name} value={mode.name}>
                {mode.name}
              </SelectItem>
            ))}
            <SelectItem value="Custom Session" onClick={() => setIsSettingsOpen(true)}>
              Custom Session...
            </SelectItem>
          </SelectContent>
        </Select>
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

// Settings Dialog Component for Custom Timer
interface SettingsDialogProps {
  onSave: (work: number, breakTime: number) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SettingsDialog = ({ onSave, isOpen, setIsOpen }: SettingsDialogProps) => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

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
          <DialogTitle>Custom Session Settings</DialogTitle>
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
        </div>
        <Button onClick={handleSave} className="dopamine-click">
          Apply Custom Session
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimer;