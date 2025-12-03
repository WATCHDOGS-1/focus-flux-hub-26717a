import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import VideoGrid from "@/components/VideoGrid";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import SocialSidebar from "@/components/SocialSidebar";
import TimeTracker from "@/components/TimeTracker";
import FocusTimer from "@/components/FocusTimer"; // Use the new centralized timer UI
import Leaderboard from "@/components/Leaderboard";
import ProfileMenu from "@/components/ProfileMenu";
import EncouragementToasts from "@/components/EncouragementToasts";
import ThemeToggle from "@/components/ThemeToggle";
import NotesAndTasksWorkspace from "@/components/NotesAndTasksWorkspace";
import RoomThemeSelector from "@/components/RoomThemeSelector";
import UserProfileModal from "@/components/UserProfileModal";
import FocusHUD from "@/components/FocusHUD"; // Import FocusHUD
import AICoachPanel from "@/components/AICoachPanel"; // Import AICoachPanel
import { MessageSquare, Users, Trophy, Timer, User, LogOut, Tag, Minimize2, Maximize2, NotebookText, Menu, Sparkles, Brain, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserStats } from "@/hooks/use-user-stats";
import { useFocusSession } from "@/hooks/use-focus-session"; // Import centralized hook
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PREDEFINED_ROOMS } from "@/utils/constants";
import { cn } from "@/lib/utils"; // Ensure cn is imported

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
    currentMode,
    startNewSession, // Import startNewSession
    saveFocusTag, // New function from hook
  } = useFocusSession(); // Use the centralized hook

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false); // New Zen Mode state
  const [showWorkspace, setShowWorkspace] = useState(false); // Combined state for Notes/Tasks/AI Coach
  const [roomTheme, setRoomTheme] = useState("default");

  // --- Profile Modal State and Handler ---
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const handleProfileClick = (id: string) => {
    setTargetUserId(id);
  };
  // --- End Profile Modal State and Handler ---

  // Validate room ID and get room name
  const currentRoom = PREDEFINED_ROOMS.find(r => r.id === roomId);
  const roomName = currentRoom?.name || "Focus Room";

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
      // Automatically start the session when entering the room
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
    if (activePanel !== panel) {
        setShowWorkspace(false); // Close workspace panels when opening a sidebar panel
    }
    setIsMobileMenuOpen(false);
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) {
      setActivePanel(null);
      setShowWorkspace(false); // Close workspace panels on focus mode entry
    }
  };

  const toggleWorkspace = () => {
    setShowWorkspace(!showWorkspace);
    if (!showWorkspace) {
        setActivePanel(null);
    }
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
            <Button onClick={toggleWorkspace} className="w-full justify-start gap-2"><NotebookText /> Notes, AI & Media</Button>
            <Button onClick={() => togglePanel("global-chat")} className="w-full justify-start gap-2"><MessageSquare /> Global Chat</Button>
            <Button onClick={() => togglePanel("social")} className="w-full justify-start gap-2"><Users /> Social</Button>
            <Button onClick={() => togglePanel("leaderboard")} className="w-full justify-start gap-2"><Trophy /> Leaderboard</Button>
            <Button onClick={() => togglePanel("pomodoro")} className="w-full justify-start gap-2"><Timer /> Timer</Button>
            <Button onClick={() => togglePanel("profile")} className="w-full justify-start gap-2"><User /> Profile</Button>
            <ThemeToggle />
            <Button variant="destructive" onClick={leaveRoom} className="w-full justify-start gap-2">
                <LogOut className="h-5 w-5" /> Save Session
            </Button>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
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
            {isMobile ? (
              <>
                <Button variant="ghost" size="icon" onClick={toggleFocusMode} title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}>
                  {isFocusMode ? <Maximize2 className="h-5 w-5 text-destructive" /> : <Minimize2 className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsZenMode(true)} title="Enter Zen Mode"><Sparkles className="h-5 w-5" /></Button>
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
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleWorkspace} 
                        title="Notes, AI Coach & Media Workspace"
                        className={showWorkspace ? "bg-secondary" : ""}
                    >
                        <NotebookText className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("global-chat")} title="Global Chat"><MessageSquare className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("social")} title="Direct Messages"><Users className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("leaderboard")} title="Leaderboard"><Trophy className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("pomodoro")} title="Structured Timer"><Timer className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("profile")} title="Profile Settings"><User className="h-5 w-5" /></Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsZenMode(true)} title="Enter Zen Mode"><Sparkles className="h-5 w-5" /></Button>
                <ThemeToggle />
                <Button variant="destructive" onClick={leaveRoom} title="Save Session and Leave" className="dopamine-click">
                    <LogOut className="h-5 w-5 mr-2" /> Save Session
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex h-full"> {/* Added h-full here */}
          <div className="flex-1 p-2 sm:p-4 flex flex-col gap-4">
            {/* Focus Tag Input (Always visible in room, unless in Focus Mode) */}
            {!isFocusMode && (
              <div className="glass-card p-3 rounded-xl flex items-center gap-3 bg-secondary/50 border-border">
                <Tag className="w-5 h-5 text-primary flex-shrink-0" />
                <Input
                  placeholder="What are you focusing on? (e.g., 'Math Homework', 'Project Alpha')"
                  value={focusTag}
                  onChange={(e) => setFocusTag(e.target.value)}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={saveFocusTag} 
                    title="Save Focus Tag Locally"
                    className="dopamine-click flex-shrink-0"
                >
                    <Save className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  (Saved locally & for AI Coach)
                </span>
              </div>
            )}

            {/* Main Content Area: Video Grid and Workspace */}
            <div className={cn(
                "flex-1 min-h-[400px]", // Ensure minimum height for the whole area
                showWorkspace && "flex flex-col gap-4" // If workspace is shown, make it a vertical flex container
            )}>
                {/* Video Grid */}
                <div className={cn(
                    "min-h-[400px]", // Minimum height for video grid
                    showWorkspace && "flex-1" // Take half the space if workspace is open
                )}>
                    <VideoGrid userId={userId} roomId={roomId} />
                </div>
                
                {/* Conditional Workspace Panels */}
                {showWorkspace && (
                    <div className="flex-1 min-h-[400px]"> {/* Take the other half, ensure minimum height */}
                        <NotesAndTasksWorkspace />
                    </div>
                )}
            </div>
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