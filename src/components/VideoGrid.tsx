import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, MonitorUp, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface VideoGridProps {
  userId: string;
}

const VideoGrid = ({ userId }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [videoCount, setVideoCount] = useState(4);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
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

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      
      screenStreamRef.current = stream;
      
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      setIsScreenSharing(true);
      toast.success("Screen sharing started");
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast.error("Failed to share screen");
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    toast.info("Screen sharing stopped");
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
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
    return () => {
      stopLocalStream();
      stopScreenShare();
    };
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Controls */}
      <div className="glass-card p-4 rounded-2xl space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant={isVideoEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleVideo}
            className="hover:scale-110 transition-transform"
          >
            {isVideoEnabled ? <Video /> : <VideoOff />}
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="icon"
            onClick={toggleScreenShare}
            className="hover:scale-110 transition-transform"
          >
            <MonitorUp />
          </Button>

          <div className="flex-1 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Videos:</span>
            <Slider
              value={[videoCount]}
              onValueChange={(value) => setVideoCount(value[0])}
              min={1}
              max={12}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-8">{videoCount}</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div
        className="flex-1 grid gap-4 auto-rows-fr"
        style={{
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(videoCount))}, 1fr)`,
        }}
      >
        {/* Local Video */}
        <div className={`relative glass-card rounded-2xl overflow-hidden group ${pinnedVideos.has(0) ? 'ring-4 ring-accent' : ''}`}>
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
          <div className="absolute top-2 left-2 px-3 py-1 bg-background/80 backdrop-blur rounded-full text-xs">
            You
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => togglePin(0)}
          >
            {pinnedVideos.has(0) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </Button>
        </div>

        {/* Placeholder Videos */}
        {[...Array(videoCount - 1)].map((_, i) => (
          <div
            key={i + 1}
            className={`relative glass-card rounded-2xl overflow-hidden flex items-center justify-center group ${pinnedVideos.has(i + 1) ? 'ring-4 ring-accent' : ''}`}
          >
            <div className="text-center text-muted-foreground">
              <VideoOff className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Waiting for peer...</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => togglePin(i + 1)}
            >
              {pinnedVideos.has(i + 1) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
