import { useState, useEffect, useRef, useCallback } from "react";
import { Video, VideoOff, Pin, PinOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VideoGridProps {
  userId: string;
  roomId: string;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

const VideoGrid = ({ userId, roomId }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = new useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManager = useRef<WebRTCManager | null>(null);

  // 1. Device Enumeration
  const enumerateDevices = useCallback(async () => {
    try {
      // Request media access first to populate device labels
      // We use a temporary stream request here just to ensure permissions are granted and labels are available
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tempStream.getTracks().forEach(track => track.stop());
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter(device => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
      
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.error("Error enumerating devices:", e);
      toast.error("Camera access denied or failed to list devices.");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    enumerateDevices();
    // Listen for device changes (e.g., plugging in a new camera)
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
    };
  }, [enumerateDevices]);


  // 2. WebRTC Setup/Cleanup
  useEffect(() => {
    if (webrtcManager.current) {
      webrtcManager.current.cleanup();
      webrtcManager.current = null;
      setRemoteStreams(new Map());
      setIsVideoEnabled(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

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
          },
          () => { /* onPeerLeft handler */ }
        );

        await webrtcManager.current.initialize(roomId);
        
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
  }, [userId, roomId]);

  // 3. Video Toggle Logic
  const toggleVideo = async (deviceId?: string) => {
    if (!webrtcManager.current) return;

    const newVideoState = !isVideoEnabled;

    if (newVideoState) { // Turning video ON
      if (!deviceId && !selectedDeviceId) {
        toast.error("No camera device selected.");
        return;
      }
      const deviceToUse = deviceId || selectedDeviceId;

      try {
        const newStream = await webrtcManager.current.toggleVideo(true, deviceToUse);
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
        localVideoRef.current.srcObject = null;
      }
      setIsVideoEnabled(false);
      toast.info("Camera disabled");
    }
  };
  
  // 4. Handle Device Change
  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    if (isVideoEnabled) {
      // If video is currently enabled, restart it with the new device
      toggleVideo(newDeviceId);
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
            onClick={() => toggleVideo()}
            className="dopamine-click shadow-glow flex items-center gap-2"
            disabled={videoDevices.length === 0}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            {isVideoEnabled ? "Disable Video" : "Enable Video"}
          </Button>

          {/* Camera Selector */}
          <Select onValueChange={handleDeviceChange} value={selectedDeviceId}>
            <SelectTrigger className="w-[200px] dopamine-click">
              <Camera className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Camera" />
            </SelectTrigger>
            <SelectContent className="glass-card">
              {videoDevices.length === 0 ? (
                <SelectItem value="no-camera" disabled>No cameras found</SelectItem>
              ) : (
                videoDevices.map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="flex-1 flex items-center gap-4 justify-end">
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