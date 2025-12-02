import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import VideoGrid from "@/components/VideoGrid";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import SocialSidebar from "@/components/SocialSidebar";
import TimeTracker from "@/components/TimeTracker";
import FocusTimer from "@/components/FocusTimer";
import Leaderboard from "@/components/Leaderboard";
import ProfileMenu from "@/components/ProfileMenu";
import EncouragementToasts from "@/components/EncouragementToasts";
import ThemeToggle from "@/components/ThemeToggle";
import NotesAndTasksWorkspace from "@/components/NotesAndTasksWorkspace";
import RoomThemeSelector from "@/components/RoomThemeSelector";
import UserProfileModal from "@/components/UserProfileModal";
import FocusHUD from "@/components/FocusHUD";
import { MessageSquare, Users, Trophy, Timer, User, LogOut, Tag, Minimize2, Maximize2, NotebookText, Menu, Video, VideoOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFocusSession } from "@/hooks/use-focus-session";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PREDEFINED_ROOMS } from "@/utils/constants";
import { WebRTCManager } from "@/utils/webrtc";

interface MediaDevice {
  deviceId: string;
  label: string;
}

const FocusRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { userId, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isMobile = useIsMobile();

  const {
    isActive,
    sessionStartTime,
    focusTag,
    setFocusTag,
    endCurrentSession,
    startNewSession,
  } = useFocusSession();

  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showNotesWorkspace, setShowNotesWorkspace] = useState(false);
  const [roomTheme, setRoomTheme] = useState("default");
  
  // Video States
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  // --- Profile Modal State and Handler ---
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const handleProfileClick = (id: string) => {
    setTargetUserId(id);
  };
  // --- End Profile Modal State and Handler ---

  // Validate room ID and get room name
  const currentRoom = PREDEFINED_ROOMS.find(r => r.id === roomId);
  const roomName = currentRoom?.name || "Focus Room";

  // --- Device Detection ---
  const detectDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
        }));
      
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error detecting media devices:", error);
      toast.error("Failed to access media devices. Check permissions.");
    }
  };

  useEffect(() => {
    detectDevices();
    // Listen for device changes (e.g., plugging in a new camera)
    navigator.mediaDevices.addEventListener('devicechange', detectDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', detectDevices);
    };
  }, []);

  // --- Auth and Room Validation ---
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
    } else if (!roomId || !currentRoom) {
      toast.error("Invalid room selected.");
      navigate("/explore", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate, roomId, currentRoom]);

  // Auto-start timer when joining room
  useEffect(() => {
    if (userId && !isActive && sessionStartTime === 0) {
      startNewSession();
    }
  }, [userId, isActive, sessionStartTime, startNewSession]);

  useEffect(() => {
    document.body.className = roomTheme;
    return () => {
      document.body.className = "";
    };
  }, [roomTheme]);

  const leaveRoom = async () => {
    if (isActive) {
      await endCurrentSession(); // End and log the session before leaving
    }
    navigate("/explore");
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
    if (isFocusMode) setIsFocusMode(false);
    if (activePanel !== panel) setShowNotesWorkspace(false);
    setIsMobileMenuOpen(false);
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) {
      setActivePanel(null);
      setShowNotesWorkspace(false);
    }
  };

  const toggleZenMode = () => {
    setIsZenMode(!isZenMode);
    if (!isZenMode) {
      setIsFocusMode(false); // Exit focus mode when exiting zen mode
    }
  };

  const toggleVideo = async () => {
    if (!selectedDeviceId) {
      toast.error("No camera device selected or available.");
      return;
    }
    
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    
    // The actual stream manipulation is handled by VideoGrid's useEffect
    // which watches isVideoEnabled and selectedDeviceId.
    toast.info(newState ? "Video enabled." : "Video disabled.");
  };

  const toggleNotesWorkspace = () => {
    setShowNotesWorkspace(!showNotesWorkspace);
    if (!showNotesWorkspace) setActivePanel(null);
    if (isFocusMode) setIsFocusMode(false);
    setIsMobileMenuOpen(false);
  };

  const renderPanelContent = (panel: string) => {
    switch (panel) {
      case "global-chat": return <GlobalChatPanel userId={userId!} />;
      case "social": return <SocialSidebar userId={userId!} onProfileClick={handleProfileClick} />;
      case "leaderboard": return <Leaderboard onProfileClick={handleProfileClick} />;
      case "pomodoro": return <FocusTimer />;
      case "profile": return <ProfileMenu />;
      default: return null;
    }
  };

  const getPanelTitle = (panel: string) => {
    const titles: { [key: string]: string } = {
      "global-chat": "Global Chat",
      "social": "Direct Messages",
      "leaderboard": "Leaderboard",
      "pomodoro": "Structured Timer",
      "profile": "Profile Settings",
    };
    return titles[panel] || "";
  };

  if (isAuthLoading || !userId || !roomId || !currentRoom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading your focus room...</div>
      </div>
    );
  }

  const renderMobileMenu = () => (
    <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="dopamine-click">
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh] glass-card">
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="p-4">
          <div className="space-y-4">
            <RoomThemeSelector onThemeChange={setRoomTheme} />
            <Button onClick={() => togglePanel("global-chat")} className="w-full justify-start gap-2"><MessageSquare /> Global Chat</Button>
            <Button onClick={() => togglePanel("social")} className="w-full justify-start gap-2"><Users /> Social</Button>
            <Button onClick={() => togglePanel("leaderboard")} className="w-full justify-start gap-2"><Trophy /> Leaderboard</Button>
            <Button onClick={() => togglePanel("pomodoro")} className="w-full justify-start gap-2"><Timer /> Timer</Button>
            <Button onClick={() => togglePanel("profile")} className="w-full justify-start gap-2"><User /> Profile</Button>
            <Button onClick={toggleNotesWorkspace} className="w-full justify-start gap-2"><NotebookText /> Notes & Tasks</Button>
            <ThemeToggle />
            <Button variant="destructive" onClick={leaveRoom} className="w-full justify-start gap-2"><LogOut /> Leave Room</Button>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );

  const renderVideoControls = () => (
    <div className="flex items-center gap-2">
      {availableDevices.length > 1 && (
        <Select onValueChange={setSelectedDeviceId} value={selectedDeviceId}>
          <SelectTrigger className="w-[150px] dopamine-click">
            <Camera className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Camera" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            {availableDevices.map(device => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        variant={isVideoEnabled ? "default" : "outline"}
        onClick={toggleVideo}
        className="dopamine-click shadow-glow flex items-center gap-2"
        disabled={!selectedDeviceId}
      >
        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        Video
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleZenMode} 
        title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
      >
        {isZenMode ? <Minimize2 className="h-5 w-5 text-destructive" /> : <Maximize2 className="h-5 w-5" />}
      </Button>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-background relative overflow-x-hidden transition-colors duration-500`}>
      <EncouragementToasts />

      {/* Zen Mode HUD */}
      <AnimatePresence>
        {isZenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <FocusHUD onExitZenMode={() => setIsZenMode(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      {targetUserId && (
        <UserProfileModal
          userId={targetUserId}
          currentUserId={userId}
          onClose={() => setTargetUserId(null)}
        />
      )}

      <header className="relative z-10 glass-card border-b border-border flex-shrink-0">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            OnlyFocus: {roomName}
          </h1>
          <TimeTracker sessionStartTime={sessionStartTime} />
          <div className="flex gap-2 items-center">
            {/* Video Controls (Desktop/Mobile) */}
            {!isMobile && renderVideoControls()}
            
            {isMobile ? (
              <>
                <Button variant="ghost" size="icon" onClick={toggleFocusMode} title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}>
                  {isFocusMode ? <Maximize2 className="h-5 w-5 text-destructive" /> : <Minimize2 className="h-5 w-5" />}
                </Button>
                {renderMobileMenu()}
              </>
            ) : (
              <>
                <RoomThemeSelector onThemeChange={setRoomTheme} />
                <Button variant="ghost" size="icon" onClick={toggleFocusMode} title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}>
                  {isFocusMode ? <Maximize2 className="h-5 w-5 text-destructive" /> : <Minimize2 className="h-5 w-5" />}
                </Button>
                {!isFocusMode && (
                  <>
                    <Button variant="ghost" size="icon" onClick={toggleNotesWorkspace} title="Local Notes & Tasks"><NotebookText className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("global-chat")} title="Global Chat"><MessageSquare className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("social")} title="Direct Messages"><Users className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("leaderboard")} title="Leaderboard"><Trophy className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("pomodoro")} title="Structured Timer"><Timer className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("profile")} title="Profile Settings"><User className="h-5 w-5" /></Button>
                  </>
                )}
                <ThemeToggle />
                <Button variant="destructive" size="icon" onClick={leaveRoom} title="Leave Room"><LogOut className="h-5 w-5" /></Button>
              </>
            )}
          </div>
        </div>
        {/* Mobile Video Controls (Below header on mobile) */}
        {isMobile && (
            <div className="flex justify-center p-2 border-t border-border">
                {renderVideoControls()}
            </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex h-full">
          <div className="flex-1 p-2 sm:p-4 flex flex-col gap-4">
            {/* Optional Focus Tag (when active) */}
            {isActive && focusTag && (
              <div className="glass-card p-3 rounded-xl flex items-center gap-3 bg-primary/10 border-primary/50">
                <Tag className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  Focus: {focusTag}
                </span>
              </div>
            )}

            <div className="flex-1 min-h-[400px]">
              <VideoGrid 
                userId={userId} 
                roomId={roomId} 
                isVideoEnabled={isVideoEnabled}
                selectedDeviceId={selectedDeviceId}
                webrtcManagerRef={webrtcManagerRef}
              />
            </div>
            {showNotesWorkspace && <div className="mt-4"><NotesAndTasksWorkspace /></div>}
          </div>
          {activePanel && !isFocusMode && !isMobile && (
            <aside className="w-80 glass-card border-l border-border p-4 overflow-y-auto flex-shrink-0">
              {renderPanelContent(activePanel)}
            </aside>
          )}
        </div>
      </main>

      {isMobile && (
        <Drawer open={!!activePanel && !isFocusMode} onOpenChange={(open) => !open && setActivePanel(null)}>
          <DrawerContent className="h-[80vh] glass-card">
            <DrawerHeader>
              <DrawerTitle>{getPanelTitle(activePanel || "")}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 h-full overflow-y-auto">
              {activePanel && renderPanelContent(activePanel)}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default FocusRoom;