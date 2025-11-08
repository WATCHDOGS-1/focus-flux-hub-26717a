import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Pin, PinOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";

interface VideoGridProps {
  userId: string;
  roomId: string;
}

const VideoGrid = ({ userId, roomId }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);

  const [videosPerPage, setVideosPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const setup = async () => {
      try {
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
            // Peer left callback
          }
        );

        const stream = await webrtcManager.current.initialize(roomId);
        setLocalStream(stream);
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

  const remoteVideosArray = Array.from(remoteStreams.entries()).map(([peerId, stream]) => ({
    peerId,
    stream,
    isLocal: false,
  }));

  const allVideos = localStream ? [{ peerId: userId, stream: localStream, isLocal: true }, ...remoteVideosArray] : remoteVideosArray;

  const totalPages = Math.max(1, Math.ceil(allVideos.length / videosPerPage));
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const startIndex = (currentPage - 1) * videosPerPage;
  const videosOnPage = allVideos.slice(startIndex, startIndex + videosPerPage);

  const gridCols = Math.min(4, Math.ceil(Math.sqrt(videosPerPage)));
  const gridLayoutClass = `grid-cols-1 sm:grid-cols-${Math.min(2, gridCols)} md:grid-cols-${Math.min(3, gridCols)} lg:grid-cols-${gridCols}`;

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
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-semibold">
              {allVideos.length} Participants
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Videos per page: {videosPerPage}</label>
          <Slider
            defaultValue={[videosPerPage]}
            min={1}
            max={16}
            step={1}
            onValueChange={(value) => setVideosPerPage(value[0])}
          />
        </div>
      </div>

      {/* Video Grid */}
      <div className={`flex-1 grid gap-4 auto-rows-fr ${gridLayoutClass}`}>
        {videosOnPage.map(({ peerId, stream, isLocal }, pageIndex) => {
          const globalIndex = startIndex + pageIndex;
          if (isLocal) {
            return (
              <div key="local" className={`relative glass-card rounded-2xl overflow-hidden group ${pinnedVideos.has(globalIndex) ? 'ring-2 ring-primary animate-subtle-pulse' : ''}`}>
                <video
                  ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream; }}
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
                  onClick={() => togglePin(globalIndex)}
                >
                  {pinnedVideos.has(globalIndex) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </Button>
              </div>
            );
          }
          return (
            <RemoteVideo
              key={peerId}
              peerId={peerId}
              stream={stream}
              isPinned={pinnedVideos.has(globalIndex)}
              onTogglePin={() => togglePin(globalIndex)}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline">Previous</Button>
          <span className="text-sm font-medium text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline">Next</Button>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;