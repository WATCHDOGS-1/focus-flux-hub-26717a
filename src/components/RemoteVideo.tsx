import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pin, PinOff, Flag, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { reportUser } from "@/utils/moderation-actions";

interface RemoteVideoProps {
  peerId: string;
  stream: MediaStream;
  username: string; // Added username prop
  isPinned: boolean;
  onTogglePin: () => void;
}

const RemoteVideo = ({ peerId, stream, username, isPinned, onTogglePin }: RemoteVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { userId } = useAuth();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);
  
  const handleReportVideo = () => {
    if (userId) {
      reportUser(userId, peerId, "video", null, `Reported video feed for user ${username}`);
    }
  };

  return (
    <div className={`relative glass-card rounded-2xl overflow-hidden group aspect-video hover-lift ${isPinned ? 'ring-2 ring-primary animate-breathing-pulse' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 px-3 py-1 bg-secondary/80 backdrop-blur rounded-full text-xs font-bold">
        {username} {/* Display username here */}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity dopamine-click"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-card">
          <DropdownMenuItem onClick={onTogglePin} className="flex items-center gap-2">
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            {isPinned ? "Unpin Video" : "Pin Video"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleReportVideo} className="text-destructive flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Report Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default RemoteVideo;