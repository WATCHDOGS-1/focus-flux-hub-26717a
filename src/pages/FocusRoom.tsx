import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Import useParams
import VideoGrid from "@/components/VideoGrid";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import SocialSidebar from "@/components/SocialSidebar";
import TimeTracker from "@/components/TimeTracker";
import SessionTimer from "@/components/SessionTimer";
import Leaderboard from "@/components/Leaderboard";
import EncouragementToasts from "@/components/EncouragementToasts";
import ThemeToggle from "@/components/ThemeToggle";
import NotesAndTasksWorkspace from "@/components/NotesAndTasksWorkspace"; // Import the new combined workspace
import RoomThemeSelector from "@/components/RoomThemeSelector";
import UserProfileModal from "@/components/UserProfileModal"; // Import the new modal
import { MessageSquare, Users, Trophy, Timer, User, LogOut, Tag, Minimize2, Maximize2, NotebookText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { endFocusSession } from "@/utils/session-management";
import { runAIFocusCoach } from "@/utils/ai-coach"; // Import AI Coach
import { useUserStats } from "@/hooks/use-user-stats"; // Import useUserStats to get current stats
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PREDEFINED_ROOMS } from "@/utils/constants"; // Import room constants

const FocusRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>(); // Get dynamic room ID
  const { userId, isAuthenticated, isLoading: isAuthLoading, profile } = useAuth();
  const { stats, levels, refetch: refetchStats } = useUserStats(); // Use user stats hook
  const isMobile = useIsMobile();
  
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [focusTag, setFocusTag] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showNotesWorkspace, setShowNotesWorkspace] = useState(false);
  const [roomTheme, setRoomTheme] = useState("default");
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      // If room ID is missing or invalid, redirect to explore page
      toast.error("Invalid room selected.");
      navigate("/explore", { replace: true });
    } else if (userId && !sessionId) {
      startSession(userId);
    }
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [isAuthLoading, isAuthenticated, userId, navigate, sessionId, roomId, currentRoom]);

  useEffect(() => {
    document.body.className = roomTheme;
    return () => {
      document.body.className = "";
    };
  }, [roomTheme]);

  const startSession = async (uid: string) => {
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({ user_id: uid, start_time: new Date().toISOString(), tag: focusTag || null })
      .select()
      .single();
    if (!error && data) {
      setSessionId(data.id);
      setSessionStartTime(Date.now());
    } else if (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start focus session.");
    }
  };

  const leaveRoom = async () => {
    if (!sessionId || !userId) {
      navigate("/explore");
      return;
    }
    
    const leavePromise = endFocusSession(userId, sessionId, sessionStartTime, focusTag);
    
    toast.promise(leavePromise, {
      loading: "Saving your session...",
      success: (result) => {
        // Run AI Coach after successful session save
        runAIFocusCoach(stats, levels, result.durationMinutes);
        refetchStats(); // Refresh stats after session save
        navigate("/explore"); // Redirect to explore page
        return result.message;
      },
      error: (message) => message,
    });
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
    if (isFocusMode) setIsFocusMode(false);
    if (activePanel !== panel) setShowNotesWorkspace(false);
    setIsMobileMenuOpen(false); // Close mobile menu when a panel is selected
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) {
      setActivePanel(null);
      setShowNotesWorkspace(false);
    }
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
      case "pomodoro": return <SessionTimer />;
      default: return null;
    }
  };

  const getPanelTitle = (panel: string) => {
    const titles: { [key: string]: string } = {
      "global-chat": "Global Chat",
      "social": "Direct Messages",
      "leaderboard": "Leaderboard",
      "pomodoro": "Structured Timer",
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
            <Button onClick={() => togglePanel("global-chat")} className="w-full justify-start gap-2"><MessageSquare/> Global Chat</Button>
            <Button onClick={() => togglePanel("social")} className="w-full justify-start gap-2"><Users/> Social</Button>
            <Button onClick={() => togglePanel("leaderboard")} className="w-full justify-start gap-2"><Trophy/> Leaderboard</Button>
            <Button onClick={() => togglePanel("pomodoro")} className="w-full justify-start gap-2"><Timer/> Timer</Button>
            <Button onClick={() => navigate("/profile")} className="w-full justify-start gap-2"><User/> Profile Settings</Button>
            <Button onClick={toggleNotesWorkspace} className="w-full justify-start gap-2"><NotebookText/> Notes & Tasks</Button>
            <ThemeToggle />
            <Button variant="destructive" onClick={leaveRoom} className="w-full justify-start gap-2"><LogOut/> Leave Room</Button>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-background relative overflow-hidden transition-colors duration-500`}>
      <EncouragementToasts />
      
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
                    <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Profile Settings"><User className="h-5 w-5" /></Button>
                  </>
                )}
                <ThemeToggle />
                {/* Leave Room button is always visible now */}
                <Button variant="destructive" size="icon" onClick={leaveRoom} title="Leave Room"><LogOut className="h-5 w-5" /></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex h-full">
          <div className="flex-1 p-2 sm:p-4 flex flex-col gap-4">
            {!isFocusMode && (
              <div className="glass-card p-3 rounded-xl flex items-center gap-3 hover-lift">
                <Tag className="w-5 h-5 text-primary" />
                <Input placeholder="What are you focusing on right now?" value={focusTag} onChange={(e) => setFocusTag(e.target.value)} className="flex-1 border-none bg-transparent focus-visible:ring-0" />
              </div>
            )}
            <div className="flex-1 min-h-[400px]">
              {/* Pass the dynamic roomId to VideoGrid */}
              <VideoGrid userId={userId} roomId={roomId} />
            </div>
            {/* Use the combined workspace here */}
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