import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";
import { AMBIENT_SOUNDS } from "@/utils/constants";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY_SOUND = "ambient_sound_id";
const LOCAL_STORAGE_KEY_VOLUME = "ambient_sound_volume";
const DEFAULT_VOLUME = 50; // 0 to 100

const AmbientSoundPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState(AMBIENT_SOUNDS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME); // 0-100

  // 1. Load settings from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem(LOCAL_STORAGE_KEY_SOUND);
    const storedVolume = localStorage.getItem(LOCAL_STORAGE_KEY_VOLUME);

    if (storedId && AMBIENT_SOUNDS.some(s => s.id === storedId)) {
      setSelectedSoundId(storedId);
    }
    if (storedVolume) {
      setVolume(parseInt(storedVolume));
    }
  }, []);

  // 2. Initialize Audio element and set volume/loop when sound changes
  useEffect(() => {
    const currentSound = AMBIENT_SOUNDS.find(s => s.id === selectedSoundId);
    if (!currentSound) return;

    // Cleanup previous audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.remove();
    }

    const audio = new Audio(currentSound.url);
    audio.loop = true;
    audio.volume = volume / 100;
    audioRef.current = audio;

    // If it was playing before the track change, restart playback
    if (isPlaying) {
      audio.play().catch(e => console.error("Audio playback failed:", e));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, [selectedSoundId]);

  // 3. Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_VOLUME, volume.toString());
  }, [volume]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      toast.info(`Paused ${AMBIENT_SOUNDS.find(s => s.id === selectedSoundId)?.name}`);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        toast.success(`Playing ${AMBIENT_SOUNDS.find(s => s.id === selectedSoundId)?.name}`);
      }).catch(e => {
        console.error("Playback failed, likely due to browser autoplay policy:", e);
        toast.error("Playback blocked. Please interact with the page first.");
        setIsPlaying(false);
      });
    }
  };
  
  const handleSoundChange = (id: string) => {
    setSelectedSoundId(id);
    localStorage.setItem(LOCAL_STORAGE_KEY_SOUND, id);
    // The useEffect hook handles stopping the old track and starting the new one if isPlaying is true
  };

  const CurrentIcon = isPlaying ? Pause : Play;
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Music className="w-5 h-5 text-primary" />
        Ambient Focus Audio
      </h3>

      <div className="glass-card p-4 rounded-xl space-y-6">
        {/* Sound Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Select Track</label>
          <Select onValueChange={handleSoundChange} value={selectedSoundId}>
            <SelectTrigger className="w-full dopamine-click">
              <SelectValue placeholder="Choose Ambient Sound" />
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

        {/* Playback Control */}
        <div className="flex justify-center">
          <Button
            size="lg"
            variant={isPlaying ? "default" : "outline"}
            onClick={togglePlayback}
            className="w-24 h-24 rounded-full dopamine-click shadow-glow"
          >
            <CurrentIcon className="w-8 h-8" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <VolumeIcon className="w-5 h-5 text-primary" />
            <span>Volume: {volume}%</span>
          </div>
          <Slider
            defaultValue={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0])}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default AmbientSoundPlayer;