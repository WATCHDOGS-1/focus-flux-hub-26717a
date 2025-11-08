import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";

interface VideoGridProps {
  userId: string;
  roomId: string;
}

const VideoGrid = ({ userId, roomId }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);

  const startLocalStream = async () => {
    try {
      if (!webrtcManager.current) {
        webrtcManager.current = new WebRTCManager(
          userId,
          (peerId, stream) => {
            setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
            toast.success("Peer connected!");
          },
          (peerId) => {
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(peerId);
              return newMap;
            });
          },
          () => {
            // Peer left callback - handled in FocusRoom
          }
        );
        await webrtcManager.current.initialize(roomId);
      }

      const stream = await webrtcManager.current.startLocalStream();
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setTimeout(() => {
          localVideoRef.current?.play().catch(console.error);
        }, 100);
      }
      
      setIsVideoEnabled(true);
      toast.success("Camera enabled");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera");
    }
  };

  const stopLocalStream = () => {
    if (webrtcManager.current) {
      webrtcManager.current.stopLocalStream();
    }
    if (localStreamRef.current) {
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsVideoEnabled(false);
    toast.info("Camera disabled");
  };

  const toggleVideo = () => {
    if (isVideoEnabled) {
      stopLocalStream();
    } else {
      startLocalStream();
    }
  };


  const togglePin = (index: number) => {
    setPinnedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  useEffect(() => {
    startLocalStream();
    
    return () => {
      if (webrtcManager.current) {
        webrtcManager.current.cleanup();
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Controls */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant={isVideoEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleVideo}
            className="dopamine-click shadow-glow"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <div className="flex-1 flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-semibold">
              Connected: {remoteStreams.size + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid gap-4 auto-rows-fr grid-cols-2">
        {/* Local Video */}
        <div className={`relative glass-card rounded-2xl overflow-hidden group shadow-intense-glow ${pinnedVideos.has(0) ? 'ring-4 ring-accent animate-pulse' : ''}`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().catch(console.error);
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-3 py-1 bg-primary/80 backdrop-blur rounded-full text-xs font-bold shadow-glow">
            You
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity dopamine-click"
            onClick={() => togglePin(0)}
          >
            {pinnedVideos.has(0) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </Button>
        </div>

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([peerId, stream], index) => (
          <RemoteVideo
            key={peerId}
            peerId={peerId}
            stream={stream}
            isPinned={pinnedVideos.has(index + 1)}
            onTogglePin={() => togglePin(index + 1)}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
