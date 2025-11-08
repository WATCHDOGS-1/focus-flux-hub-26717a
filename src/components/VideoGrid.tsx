import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff, ChevronLeft, ChevronRight } from "lucide-react"; // Added Chevron icons
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client";

interface VideoGridProps {
  userId: string;
  roomId: string;
}

const videosPerPage = 8; // Max videos per page

const VideoGrid = ({ userId, roomId }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [pinnedVideos, setPinnedVideos] = useState<Set<string>>(new Set()); // Store participant IDs
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const setup = async () => {
      try {
        webrtcManager.current = new WebRTCManager(
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
            setPinnedVideos(prev => { // Remove from pinned if peer leaves
              const newSet = new Set(prev);
              newSet.delete(peerId);
              return newSet;
            });
          },
          () => {
            // Peer left callback (already handled in onStreamRemoved for toast)
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

  const toggleVideo = async () => {
    const newVideoState = !isVideoEnabled;
    if (webrtcManager.current) {
      if (newVideoState) { // Turning video ON
        const newStream = await webrtcManager.current.toggleVideo(true);
        if (newStream && localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
          localVideoRef.current.play().catch(console.error);
          setIsVideoEnabled(true);
          toast.success("Camera enabled");
        } else {
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
    }
  };

  const togglePin = (participantId: string) => {
    setPinnedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  // Combine local and remote streams into a single array for easier pagination
  const allParticipants: Array<{
    id: string;
    stream: MediaStream | null;
    username: string;
    isLocal: boolean;
    videoElementRef?: React.RefObject<HTMLVideoElement>;
  }> = [];

  // Add local user
  if (userId) {
    allParticipants.push({
      id: userId,
      stream: isVideoEnabled ? (localVideoRef.current?.srcObject as MediaStream || null) : null,
      username: "You",
      isLocal: true,
      videoElementRef: localVideoRef,
    });
  }

  // Add remote users
  Array.from(remoteStreams.entries()).forEach(([peerId, { stream, username }]) => {
    allParticipants.push({
      id: peerId,
      stream,
      username,
      isLocal: false,
    });
  });

  const totalPages = Math.ceil(allParticipants.length / videosPerPage);

  const startIndex = (currentPage - 1) * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const videosToShow = allParticipants.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Controls */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
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
              Connected: {allParticipants.length}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="dopamine-click"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="dopamine-click"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        {videosToShow.map((participant) => (
          <RemoteVideo
            key={participant.id}
            peerId={participant.id}
            stream={participant.stream}
            username={participant.username}
            isPinned={pinnedVideos.has(participant.id)}
            onTogglePin={() => togglePin(participant.id)}
            isLocal={participant.isLocal}
            videoElementRef={participant.videoElementRef}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;