import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, Users } from "lucide-react";
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
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerProfiles, setPeerProfiles] = useState<Map<string, Profile>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        webrtcManager.current = new WebRTCManager(
          userId,
          (peerId, stream) => {
            setRemoteStreams(prev => new Map(prev).set(peerId, stream));
            
            // Fetch peer profile
            supabase
              .from('profiles')
              .select('*')
              .eq('id', peerId)
              .single()
              .then(({ data: profile, error }) => {
                if (!error && profile) {
                  setPeerProfiles(prev => new Map(prev).set(peerId, profile));
                }
              });
          },
          (peerId) => {
            setRemoteStreams(prev => {
              const newMap = new Map(prev);
              newMap.delete(peerId);
              return newMap;
            });
            setPeerProfiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(peerId);
              return newMap;
            });
          }
        );

        const stream = await webrtcManager.current.initialize(roomId);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        toast.success("Connected to focus room!");
      } catch (error) {
        console.error("Error setting up WebRTC:", error);
        toast.error("Failed to access camera/microphone. Please check permissions.");
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
  };

  const toggleAudio = () => {
    const newAudioState = !isAudioEnabled;
    if (webrtcManager.current) {
      webrtcManager.current.toggleAudio(newAudioState);
    }
    setIsAudioEnabled(newAudioState);
  };

  // Calculate total participants
  const totalParticipants = remoteStreams.size + 1;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Controls */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">
              {totalParticipants} {totalParticipants === 1 ? 'Person' : 'People'} in Room
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isAudioEnabled ? "default" : "outline"}
              size="icon"
              onClick={toggleAudio}
              className="dopamine-click"
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isVideoEnabled ? "default" : "outline"}
              size="icon"
              onClick={toggleVideo}
              className="dopamine-click"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid gap-4 auto-rows-fr grid-cols-1 md:grid-cols-2">
        {/* Local Video */}
        <div className="relative glass-card rounded-2xl overflow-hidden">
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
        </div>

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
          <RemoteVideo
            key={peerId}
            peerId={peerId}
            stream={stream}
            username={peerProfiles.get(peerId)?.username}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;