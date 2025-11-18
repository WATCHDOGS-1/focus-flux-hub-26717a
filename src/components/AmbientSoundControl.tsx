import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Music } from "lucide-react";
import { useAmbientSound, AMBIENT_SOUNDS } from "@/hooks/use-ambient-sound";
import { Label } from "@/components/ui/label";

const AmbientSoundControl = () => {
  const { currentSoundId, setSound, volume, setVolume } = useAmbientSound();

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  return (
    <div className="glass-card p-4 rounded-xl space-y-4">
      <h4 className="text-md font-semibold flex items-center gap-2 text-primary">
        <Music className="w-4 h-4" />
        Ambient Soundscape
      </h4>
      
      {/* Sound Selector */}
      <div className="space-y-2">
        <Label>Select Atmosphere</Label>
        <Select onValueChange={setSound} value={currentSoundId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Soundscape" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            {AMBIENT_SOUNDS.map(sound => (
              <SelectItem key={sound.id} value={sound.id}>
                {sound.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Volume Slider */}
      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          Volume
          <span className="text-sm text-muted-foreground">{(volume * 100).toFixed(0)}%</span>
        </Label>
        <div className="flex items-center gap-3">
          <VolumeX className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.05}
            className="flex-1"
          />
          <Volume2 className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default AmbientSoundControl;