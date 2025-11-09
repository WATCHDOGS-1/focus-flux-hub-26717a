import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client";

interface VideoGridProps {
  userId: string;
  roomId: string;
  webrtcManagerRef: React.MutableRefObject<WebRTCManager | null>; // Added ref prop
}

const VideoGrid = ({ userId, roomId, webrtcManagerRef }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        webrtcManagerRef.current = new WebRTCManager(
          userId,
          async (peerId, stream) => {
            const { data, error } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", peerId)
              .single();

            const username = data?.username || `Peer ${peerId.slice(0, 6)}`;

            setRemoteStreams((prev) => new Map(prev).set(peerId, { stream, username }));
            toast.success(`${username} connected!`);
          },
          (peerId) => {
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              const peerInfo = newMap.get(peerId);
              if (peerInfo) {
                toast.info(`${peerInfo.username} left.`);
              }
              newMap.delete(peerId);
              return newMap;
            });
          },
          (peerId) => { // onPeerLeft callback
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              const peerInfo = newMap.get(peerId);
              if (peerInfo) {
                toast.info(`${peerInfo.username} left.`);
              }
              newMap.delete(peerId);
              return newMap;
            });
          }
        );

        const stream = await webrtcManagerRef.current.initialize(roomId);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(console.error);
        }
        
        setIsVideoEnabled(true);
        toast.success("Camera enabled");
      } catch (error) {
        console.error("Error setting up WebRTC:", error);
        toast.error("Failed to access camera. Please check permissions.");
        setIsVideoEnabled(false);
      }
    };

    if (userId && roomId) {
      setup();
    }
    
    return () => {
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.cleanup();
      }
    };
  }, [userId, roomId, webrtcManagerRef]);

  const toggleVideo = async () => {
    const newVideoState = !isVideoEnabled;
    if (webrtcManagerRef.current) {
      if (newVideoState) {
        const newStream = await webrtcManagerRef.current.toggleVideo(true);
        if (newStream && localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
          localVideoRef.current.play().catch(console.error);
          setIsVideoEnabled(true);
          toast.success("Camera enabled");
        } else {
          toast.error("Failed to enable camera. Please check permissions.");
          setIsVideoEnabled(false);
        }
      } else {
        webrtcManagerRef.current.toggleVideo(false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        setIsVideoEnabled(false);
        toast.info("Camera disabled");
      }
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

  return (
    <div className="h-full flex flex-col gap-4">
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

      <div className="flex-1 grid gap-4 auto-rows-fr grid-cols-2">
        <div className={`relative glass-card rounded-2xl overflow-hidden group aspect-video ${pinnedVideos.has(0) ? 'ring-2 ring-primary animate-subtle-pulse' : ''}`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
          />
          <div className="absolute top-2 left-2 px-3 py-1 bg-primary/80 backdrop-blur rounded-full text-xs font-bold">
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

        {Array.from(remoteStreams.entries()).map(([peerId, { stream, username }], index) => (
          <RemoteVideo
            key={peerId}
            peerId={peerId}
            stream={stream}
            username={username}
            isPinned={pinnedVideos.has(index + 1)}
            onTogglePin={() => togglePin(index + 1)}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;