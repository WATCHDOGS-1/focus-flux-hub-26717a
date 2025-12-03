import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Sun, Moon, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "default", label: "Default Focus", icon: Palette },
  { value: "deep-cave", label: "Deep Cave (Dim)", icon: Moon },
  { value: "library", label: "Library (Warm)", icon: BookOpen },
  { value: "cyberpunk", label: "Cyberpunk Neon", icon: Zap },
  { value: "morning-sunlight", label: "Morning Sunlight", icon: Sun },
];

interface RoomThemeSelectorProps {
  onThemeChange: (theme: string) => void;
}

const RoomThemeSelector = ({ onThemeChange }: RoomThemeSelectorProps) => {
  const [selectedTheme, setSelectedTheme] = useState("default");

  useEffect(() => {
    const storedTheme = localStorage.getItem("room_theme") || "default";
    setSelectedTheme(storedTheme);
    onThemeChange(storedTheme);
  }, [onThemeChange]);

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    localStorage.setItem("room_theme", theme);
    onThemeChange(theme);
  };

  const CurrentIcon = THEMES.find(t => t.value === selectedTheme)?.icon || Palette;

  return (
    <Select onValueChange={handleThemeChange} value={selectedTheme}>
      <SelectTrigger className={cn("w-[180px] dopamine-click", "text-foreground")}>
        {/* Removed CurrentIcon here to fix double icon issue */}
        <SelectValue placeholder="Select Room Theme" />
      </SelectTrigger>
      <SelectContent className="glass-card">
        {THEMES.map(theme => (
          <SelectItem key={theme.value} value={theme.value}>
            <div className="flex items-center gap-2">
              <theme.icon className="w-4 h-4" />
              {theme.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RoomThemeSelector;