import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(true); // Auto-start
  const [isBreak, setIsBreak] = useState(false);

  const workTime = 25 * 60;
  const breakTime = 5 * 60;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (isBreak) {
        toast.success("Break over! Time to focus!");
        setIsBreak(false);
        setTimeLeft(workTime);
      } else {
        toast.success("Great work! Time for a break!");
        setIsBreak(true);
        setTimeLeft(breakTime);
      }
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? breakTime : workTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = ((isBreak ? breakTime : workTime) - timeLeft) / (isBreak ? breakTime : workTime) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold mb-6">
        {isBreak ? "Break Time" : "Focus Time"}
      </h3>

      <div className="relative w-56 h-56 mb-6">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="112"
            cy="112"
            r="104"
            stroke="hsl(var(--border))"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="112"
            cy="112"
            r="104"
            stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 104}`}
            strokeDashoffset={`${2 * Math.PI * 104 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl font-bold font-mono text-foreground">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          size="icon"
          variant={isActive ? "default" : "outline"}
          onClick={toggleTimer}
          className="w-11 h-11 dopamine-click shadow-glow rounded-lg"
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={resetTimer}
          className="w-11 h-11 dopamine-click shadow-glow rounded-lg"
        >
          <RotateCcw size={18} />
        </Button>
      </div>
    </div>
  );
};

export default PomodoroTimer;