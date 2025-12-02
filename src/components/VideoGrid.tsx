import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

interface VideoGridProps {
  userId: string;
  roomId: string;
  isVideoEnabled: boolean;
  selectedDeviceId: string | undefined;
  webrtcManagerRef: React.MutableRefObject<WebRTCManager | null>;
}

const VideoGrid = ({ userId, roomId, isVideoEnabled, selectedDeviceId, webrtcManagerRef }: VideoGridProps) => {
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Effect to manage WebRTC Manager initialization and cleanup
  useEffect(() => {
    // Cleanup previous manager if room ID changes
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.cleanup();
      webrtcManagerRef.current = null;
      setRemoteStreams(new Map());
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    const setup = async () => {
      try {
        webrtcManagerRef.current = new WebRTCManager(
          userId,
          async (peerId, stream) => {
            // Fetch username for the connected peer
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
          () => { /* onPeerLeft handler */ }
        );

        // Initialize signaling only
        await webrtcManagerRef.current.initialize(roomId);
        
      } catch (error) {
        console.error("Error setting up WebRTC signaling:", error);
        toast.error("Failed to connect to the focus room.");
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
  }, [userId, roomId]);

  // Effect to manage local video stream based on isVideoEnabled and selectedDeviceId
  useEffect(() => {
    const manager = webrtcManagerRef.current;
    if (!manager) return;

    const updateLocalStream = async () => {
      if (isVideoEnabled) {
        try {
          const newStream = await manager.toggleVideo(true, selectedDeviceId);
          if (newStream && localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
            localVideoRef.current.play().catch(console.error);
          }
        } catch (e) {
          console.error("Error enabling video:", e);
          toast.error("Failed to enable camera. Check permissions or device selection.");
          // Note: We don't update isVideoEnabled state here, FocusRoom handles it.
        }
      } else {
        manager.toggleVideo(false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
    };

    updateLocalStream();
  }, [isVideoEnabled, selectedDeviceId, webrtcManagerRef]);


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
      {/* Video Grid */}
      <div className="flex-1 grid gap-4 auto-rows-fr grid-cols-1 sm:grid-cols-2">
        {/* Local Video */}
        <div className={`relative glass-card rounded-2xl overflow-hidden group aspect-video hover-lift ${pinnedVideos.has(0) ? 'ring-2 ring-primary animate-breathing-pulse' : ''}`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 text-muted-foreground">
              <VideoOff className="w-10 h-10" />
            </div>
          )}
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

        {/* Remote Videos */}
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