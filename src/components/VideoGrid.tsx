import { useState, useEffect, useRef, useCallback } from "react";
import { Video, VideoOff, Pin, PinOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WebRTCManager } from "@/utils/webrtc";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOptimizedPeerList } from "@/utils/bandwidth-optimization"; // Import optimization utility
import { cn } from "@/lib/utils";

interface VideoGridProps {
  userId: string;
  roomId: string;
  layoutMode: 'grid-1' | 'grid-2' | 'grid-3'; // New prop for layout control
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

const VideoGrid = ({ userId, roomId, layoutMode }: VideoGridProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [pinnedVideos, setPinnedVideos] = useState<Set<number>>(new Set());
  const [remoteStreams, setRemoteStreams] = new useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  
  // --- State for Optimization ---
  const [optimizedPeerIds, setOptimizedPeerIds] = useState<string[]>([]);
  const [maxVideos, setMaxVideos] = useState(8); // Default max
  // ---------------------------------
  
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

  // --- Optimization Logic ---
  const runOptimization = useCallback(async (currentRemotePeers: Map<string, any>) => {
    const allPeerIds = Array.from(currentRemotePeers.keys());
    
    // Include pinned videos in the priority list regardless of score
    const pinnedPeerIds = Array.from(pinnedVideos).map(index => {
        // Index 0 is local video, index 1+ are remote videos
        if (index > 0) {
            // Find the peerId corresponding to the pinned index
            const peerId = Array.from(currentRemotePeers.keys())[index - 1];
            return peerId;
        }
        return null;
    }).filter((id): id is string => !!id);

    const unpinnedPeerIds = allPeerIds.filter(id => !pinnedPeerIds.includes(id));
    
    // Run ranking on unpinned peers
    const { maxVideosToLoad, rankedPeerIds: topRankedUnpinned } = await getOptimizedPeerList(unpinnedPeerIds);
    
    // Combine pinned peers (highest priority) with the top ranked unpinned peers
    // Ensure we don't exceed maxVideosToLoad
    const finalOptimizedList = Array.from(new Set([...pinnedPeerIds, ...topRankedUnpinned])).slice(0, maxVideosToLoad);
    
    setOptimizedPeerIds(finalOptimizedList);
    setMaxVideos(maxVideosToLoad);
    
    if (finalOptimizedList.length < allPeerIds.length) {
        toast.info(`Bandwidth limit detected. Displaying top ${finalOptimizedList.length} of ${allPeerIds.length} peers.`);
    }
  }, [pinnedVideos]);
  // --------------------------


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

            setRemoteStreams((prev) => {
                const newMap = new Map(prev).set(peerId, { stream, username });
                runOptimization(newMap); // <-- Run optimization on stream added
                return newMap;
            });
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
              runOptimization(newMap); // <-- Run optimization on stream removed
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
  }, [userId, roomId, runOptimization]); // Added runOptimization dependency

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
      
      // Re-run optimization immediately when pin status changes
      // Use a timeout to ensure state update is processed before running optimization
      setTimeout(() => runOptimization(remoteStreams), 0); 
      
      return newSet;
    });
  };

  // Filter remote streams based on optimization list
  const filteredRemoteStreams = Array.from(remoteStreams.entries()).filter(([peerId]) => 
    optimizedPeerIds.includes(peerId)
  );
  
  // Determine the number of videos currently displayed (local + filtered remote)
  const displayedVideoCount = 1 + filteredRemoteStreams.length;
  
  // Determine grid classes based on layoutMode
  const gridClasses = {
    'grid-1': 'grid-cols-1',
    'grid-2': 'sm:grid-cols-2',
    'grid-3': 'sm:grid-cols-2 lg:grid-cols-3',
  }[layoutMode];

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
            {remoteStreams.size > 0 && (
                <span className="text-sm text-warning font-semibold">
                    Displaying: {displayedVideoCount} / {remoteStreams.size + 1}
                </span>
            )}
            {maxVideos < 8 && (
                <span className="text-sm text-warning font-semibold">
                    (Max {maxVideos} videos due to bandwidth)
                </span>
            )}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className={cn("flex-1 grid gap-4 auto-rows-fr grid-cols-1", gridClasses)}>
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

        {/* Remote Videos (Filtered) */}
        {filteredRemoteStreams.map(([peerId, { stream, username }], index) => (
          <RemoteVideo
            key={peerId}
            peerId={peerId}
            stream={stream}
            username={username}
            // Note: The index for pinning needs to be relative to the full list of peers, 
            // but since we are filtering, we must check if the peerId is in the pinned list.
            // We rely on the `togglePin` function to manage the set of pinned indices correctly.
            // For now, we use the index in the filtered list + 1 as a placeholder for the pin check.
            isPinned={pinnedVideos.has(Array.from(remoteStreams.keys()).indexOf(peerId) + 1)}
            onTogglePin={() => togglePin(Array.from(remoteStreams.keys()).indexOf(peerId) + 1)}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;