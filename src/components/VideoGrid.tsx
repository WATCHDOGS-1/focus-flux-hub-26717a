import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface VideoGridProps {
  userId: string;
  roomId: string;
}

const VideoGrid = ({ userId, roomId }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerProfiles, setPeerProfiles] = useState<Map<string, Profile>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        webrtcManager.current = new WebRTCManager(
          userId,
          async (peerId, stream) => {
            setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
            toast.success("Peer connected!");

            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', peerId)
              .single();
            
            if (error) {
              console.error('Error fetching peer profile:', error);
            } else if (profile) {
              setPeerProfiles(prev => new Map(prev).set(peerId, profile));
            }
          },
          (peerId) => {
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(peerId);
              return newMap;
            });
            setPeerProfiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(peerId);
              return newMap;
            });
          },
          () => {
            // Peer left callback
          }
        );

        const stream = await webrtcManager.current.initialize(roomId);
        
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
      if (webrtcManager.current) {
        webrtcManager.current.cleanup();
      }
    };
  }, [userId, roomId]);

  const toggleVideo = () => {
    const newVideoState = !isVideoEnabled;
    if (webrtcManager.current) {
      webrtcManager.current.toggleVideo(newVideoState);
    }
    setIsVideoEnabled(newVideoState);
    toast.info(newVideoState ? "Camera enabled" : "Camera disabled");
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
        <div className={`relative glass-card rounded-2xl overflow-hidden group ${pinnedVideos.has(0) ? 'ring-2 ring-primary animate-subtle-pulse' : ''}`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
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

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([peerId, stream], index) => (
          <RemoteVideo
            key={peerId}
            peerId={peerId}
            stream={stream}
            isPinned={pinnedVideos.has(index + 1)}
            onTogglePin={() => togglePin(index + 1)}
            username={peerProfiles.get(peerId)?.username}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;