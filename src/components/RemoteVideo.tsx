import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";

interface RemoteVideoProps {
  peerId: string;
  stream: MediaStream;
  isPinned: boolean;
  onTogglePin: () => void;
}

const RemoteVideo = ({ peerId, stream, isPinned, onTogglePin }: RemoteVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  return (
    <div className={`relative glass-card rounded-2xl overflow-hidden group shadow-intense-glow ${isPinned ? 'ring-4 ring-accent animate-pulse' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 px-3 py-1 bg-secondary/80 backdrop-blur rounded-full text-xs font-bold shadow-glow">
        Peer {peerId.slice(0, 6)}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity dopamine-click"
        onClick={onTogglePin}
      >
        {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
      </Button>
    </div>
  );
};

export default RemoteVideo;
