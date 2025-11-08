import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pin, PinOff, VideoOff } from "lucide-react"; // Added VideoOff icon

interface RemoteVideoProps {
  peerId: string;
  stream: MediaStream | null; // Changed to allow null
  username: string;
  isPinned: boolean;
  onTogglePin: () => void;
  isLocal?: boolean; // Added to differentiate local placeholder
  videoElementRef?: React.RefObject<HTMLVideoElement>; // New prop for external ref
}

const RemoteVideo = ({ peerId, stream, username, isPinned, onTogglePin, isLocal = false, videoElementRef }: RemoteVideoProps) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const currentVideoRef = videoElementRef || internalVideoRef; // Use external ref if provided, else internal

  useEffect(() => {
    if (currentVideoRef.current) {
      currentVideoRef.current.srcObject = stream;
      if (stream) {
        currentVideoRef.current.play().catch(console.error);
      }
    }
  }, [stream, currentVideoRef]);

  return (
    <div className={`relative glass-card rounded-2xl overflow-hidden group ${isPinned ? 'ring-2 ring-primary animate-subtle-pulse' : ''}`}>
      {stream ? (
        <video
          ref={currentVideoRef} // Assign ref here
          autoPlay
          playsInline
          muted={isLocal} // Mute local video
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
          <VideoOff className="w-1/3 h-1/3 opacity-50" />
        </div>
      )}
      <div className="absolute top-2 left-2 px-3 py-1 bg-secondary/80 backdrop-blur rounded-full text-xs font-bold">
        {username}
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