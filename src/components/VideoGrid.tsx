import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

interface VideoGridProps {
  userId: string;
  roomId: string; // Now dynamic
}

const VideoGrid = ({ userId, roomId }: VideoGridProps) => {
  // Start with video disabled by default
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    // Cleanup previous manager if room ID changes
    if (webrtcManager.current) {
      webrtcManager.current.cleanup();
      webrtcManager.current = null;
      setRemoteStreams(new Map());
      setIsVideoEnabled(false); // Reset state
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    const setup = async () => {
      try {
        webrtcManager.current = new WebRTCManager(
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
        await webrtcManager.current.initialize(roomId);
        
        // Note: We do not call toggleVideo(true) here. Video is off by default.
        
      } catch (error) {
        console.error("Error setting up WebRTC signaling:", error);
        toast.error("Failed to connect to the focus room.");
      }
    };

    if (userId && roomId) {
      setup();
    }
    
    return () => {
      if (webrtcManager.current) {
        webrtcManager.current.cleanup();
      }
    };
  }, [userId, roomId]); // Dependency on roomId ensures re-initialization when switching rooms

  const toggleVideo = async () => {
    const newVideoState = !isVideoEnabled;
    if (!webrtcManager.current) return;

    if (newVideoState) { // Turning video ON
      try {
        const newStream = await webrtcManager.current.toggleVideo(true);
        if (newStream && localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
          localVideoRef.current.play().catch(console.error);
          setIsVideoEnabled(true);
          toast.success("Camera enabled");
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to enable camera. Please check permissions.");
        setIsVideoEnabled(false);
      }
    } else { // Turning video OFF
      webrtcManager.current.toggleVideo(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null; // Clear the video element
      }
      setIsVideoEnabled(false);
      toast.info("Camera disabled");
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
      {/* Controls */}
      <div className="glass-card p-4 rounded-xl space-y-4 hover-lift">
        <div className="flex items-center gap-4">
          <Button
            variant={isVideoEnabled ? "default" : "outline"}
            onClick={toggleVideo}
            className="dopamine-click shadow-glow flex items-center gap-2"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            Video
          </Button>

          <div className="flex-1 flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-semibold">
              Connected: {remoteStreams.size + 1}
            </span>
          </div>
        </div>
      </div>

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