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
    <div className="h-full flex flex-col gap-3">
      {/* Controls */}
      <div className="glass-card p-3 rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant={isVideoEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleVideo}
            className="dopamine-click shadow-glow rounded-lg"
          >
            {isVideoEnabled ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
            {isVideoEnabled ? "Camera On" : "Camera Off"}
          </Button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">
              Connected: {remoteStreams.size + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid gap-3 auto-rows-fr grid-cols-2">
        {/* Local Video */}
        <div className={`relative glass-card rounded-xl overflow-hidden group shadow-intense-glow ${pinnedVideos.has(0) ? 'ring-2 ring-accent' : ''}`}>
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
          <div className="absolute top-2 left-2 px-2.5 py-1 bg-primary/80 backdrop-blur rounded-lg text-xs font-semibold shadow-glow">
            You
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity dopamine-click rounded-full bg-black/30 hover:bg-black/50"
            onClick={() => togglePin(0)}
          >
            {pinnedVideos.has(0) ? <PinOff className="w-4 h-4 text-white" /> : <Pin className="w-4 h-4 text-white" />}
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