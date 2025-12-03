import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { SESSION_MODES } from "@/hooks/use-focus-session";

// Settings Dialog Component for Custom Timer
interface SettingsDialogProps {
  onSave: (work: number, breakTime: number) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isBreathingAnimationEnabled: boolean;
  onToggleAnimation: (checked: boolean) => void;
  currentMode: typeof SESSION_MODES[0];
  setCurrentMode: (mode: typeof SESSION_MODES[0]) => void;
  triggerClassName?: string; // Optional class for the trigger button
}

const TimerSettingsDialog = ({ onSave, isOpen, setIsOpen, isBreathingAnimationEnabled, onToggleAnimation, currentMode, setCurrentMode, triggerClassName }: SettingsDialogProps) => {
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
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={triggerClassName || "dopamine-click"}>
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

export default TimerSettingsDialog;