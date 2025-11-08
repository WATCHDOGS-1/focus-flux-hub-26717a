import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";

interface VideoGridProps {
  userId: string;
  roomId: string;
}

interface VideoItem {
  id: string;
  type: 'local' | 'remote';
  stream: MediaStream | null;
  username: string;
}

const VIDEOS_PER_PAGE = 8; // Maximum videos to display per page

const VideoGrid = ({ userId, roomId }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [pinnedVideos, setPinnedVideos] = useState<Set<string>>(new Set()); // Store peerId for pinning
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // State for local stream
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
          () => { /* Peer left callback already handled in onStreamRemoved */ }
        );

        const stream = await webrtcManager.current.initialize(roomId);
        setLocalStream(stream);
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
        setLocalStream(newStream);
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
        setLocalStream(null);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        setIsVideoEnabled(false);
        toast.info("Camera disabled");
      }
    }
  };

  const togglePin = (idToPin: string) => {
    setPinnedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idToPin)) {
        newSet.delete(idToPin);
      } else {
        newSet.add(idToPin);
      }
      return newSet;
    });
  };

  // Combine local and remote streams into a single array for pagination
  const allVideos: VideoItem[] = [
    { id: userId, type: 'local', stream: localStream, username: 'You' },
    ...Array.from(remoteStreams.entries()).map(([peerId, { stream, username }]) => ({
      id: peerId,
      type: 'remote',
      stream,
      username,
    })),
  ].filter(video => video.stream !== null); // Only show videos that have an active stream

  const totalPages = Math.ceil(allVideos.length / VIDEOS_PER_PAGE);
  const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
  const endIndex = startIndex + VIDEOS_PER_PAGE;
  const currentVideos = allVideos.slice(startIndex, endIndex);

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
              Connected: {allVideos.length}
            </span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr overflow-hidden">
        {currentVideos.map((video) => (
          video.type === 'local' ? (
            <div
              key={video.id}
              className={`relative glass-card rounded-2xl overflow-hidden group aspect-video ${pinnedVideos.has(video.id) ? 'ring-2 ring-primary animate-subtle-pulse' : ''}`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
              />
              <div className="absolute top-2 left-2 px-3 py-1 bg-primary/80 backdrop-blur rounded-full text-xs font-bold">
                {video.username}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity dopamine-click"
                onClick={() => togglePin(video.id)}
              >
                {pinnedVideos.has(video.id) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <RemoteVideo
              key={video.id}
              peerId={video.id}
              stream={video.stream!}
              username={video.username}
              isPinned={pinnedVideos.has(video.id)}
              onTogglePin={togglePin}
            />
          )
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default VideoGrid;