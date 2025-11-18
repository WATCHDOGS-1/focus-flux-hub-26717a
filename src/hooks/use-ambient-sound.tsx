import { useState, useEffect, useRef } from "react";

export const AMBIENT_SOUNDS = [
  { id: "none", name: "None", url: "" },
  { id: "rain", name: "Rainy Cafe", url: "/sounds/rainy-cafe.mp3" }, // Placeholder URL
  { id: "library", name: "Quiet Library", url: "/sounds/quiet-library.mp3" }, // Placeholder URL
  { id: "space", name: "Deep Space Drone", url: "/sounds/deep-space.mp3" }, // Placeholder URL
];

interface UseAmbientSoundResult {
  currentSoundId: string;
  setSound: (id: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
}

export function useAmbientSound(): UseAmbientSoundResult {
  const [currentSoundId, setCurrentSoundId] = useState("none");
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const storedSound = localStorage.getItem("ambient_sound_id");
    if (storedSound) {
      setCurrentSoundId(storedSound);
    }
    const storedVolume = localStorage.getItem("ambient_sound_volume");
    if (storedVolume) {
      setVolume(parseFloat(storedVolume));
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.remove();
      audioRef.current = null;
      setIsPlaying(false);
    }

    const sound = AMBIENT_SOUNDS.find(s => s.id === currentSoundId);
    if (sound && sound.url !== "") {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = volume;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.warn("Ambient sound playback blocked or failed:", e);
        setIsPlaying(false);
      });
      audioRef.current = audio;
    }

    localStorage.setItem("ambient_sound_id", currentSoundId);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentSoundId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem("ambient_sound_volume", volume.toString());
    }
  }, [volume]);

  return {
    currentSoundId,
    setSound: setCurrentSoundId,
    volume,
    setVolume,
    isPlaying,
  };
}