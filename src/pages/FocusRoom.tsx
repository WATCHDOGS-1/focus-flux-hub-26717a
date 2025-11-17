import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VideoGrid from "@/components/VideoGrid";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import SocialSidebar from "@/components/SocialSidebar";
import TimeTracker from "@/components/TimeTracker";
import SessionTimer from "@/components/SessionTimer";
import Leaderboard from "@/components/Leaderboard";
import EncouragementToasts from "@/components/EncouragementToasts";
import ThemeToggle from "@/components/ThemeToggle";
import NotesAndTasksWorkspace from "@/components/NotesAndTasksWorkspace";
import RoomThemeSelector from "@/components/RoomThemeSelector";
import UserProfileModal from "@/components/UserProfileModal";
import { MessageSquare, Users, Trophy, Timer, User, LogOut, Tag, Minimize2, Maximize2, NotebookText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { endFocusSession } from "@/utils/session-management";
import { runAIFocusCoach } from "@/utils/ai-coach";
import { useUserStats } from "@/hooks/use-user-stats";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/integrations/supabase/types";

type LiveStatus = Database["public"]["Enums"]["live_status"];

const FocusRoom = () => {
  const navigate = useNavigate();
  const { tag } = useParams<{ tag: string }>(); // Get dynamic tag
  const { userId, isAuthenticated, isLoading: isAuthLoading, profile } = useAuth();
  const { stats, levels, refetch: refetchStats } = useUserStats();
  const isMobile = useIsMobile();
  
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [focusTag, setFocusTag] = useState(tag ? decodeURIComponent(tag) : "");
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

  // Room name is now the focus tag
  const roomName = focusTag;

  // Initial setup and authentication check
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
    } else if (userId && !sessionId) {
      startSession(userId, focusTag);
    }
    
    // Cleanup function to ensure status is set to offline if component unmounts unexpectedly
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
      // Note: We rely on leaveRoom() or the browser closing to set status to offline.
    };
  }, [isAuthLoading, isAuthenticated, userId, navigate, sessionId, focusTag]);

  useEffect(() => {
    document.body.className = roomTheme;
    return () => {
      document.body.className = "";
    };
  }, [roomTheme]);
  
  // Update live status in DB
  const updateLiveStatus = async (status: LiveStatus, currentTag: string | null = null, sessionEndsAt: string | null = null) => {
    if (!userId) return;
    
    const payload = {
      user_id: userId,
      status: status,
      current_tag: currentTag,
      session_ends_at: sessionEndsAt,
      last_updated: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from("user_live_status")
      .upsert(payload, { onConflict: 'user_id' });
      
    if (error) {
      console.error("Error updating live status:", error);
    }
  };

  const startSession = async (uid: string, tag: string) => {
    // 1. Start focus_sessions record
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({ user_id: uid, start_time: new Date().toISOString(), tag: tag })
      .select()
      .single();
      
    if (!error && data) {
      setSessionId(data.id);
      setSessionStartTime(Date.now());
      // 2. Update live status to 'focusing'
      updateLiveStatus('focusing', tag);
    } else if (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start focus session.");
    }
  };

  const leaveRoom = async () => {
    if (!sessionId || !userId) {
      updateLiveStatus('offline');
      navigate("/explore");
      return;
    }
    
    // 1. End focus_sessions record and calculate stats
    const leavePromise = endFocusSession(userId, sessionId, sessionStartTime, focusTag);
    
    toast.promise(leavePromise, {
      loading: "Saving your session...",
      success: (result) => {
        // 2. Update live status to 'offline'
        updateLiveStatus('offline');
        
        // 3. Run AI Coach and refresh stats
        runAIFocusCoach(stats, levels, result.durationMinutes);
        refetchStats();
        
        navigate("/explore");
        return result.message;
      },
      error: (message) => {
        // Ensure status is set to offline even if session save fails
        updateLiveStatus('offline');
        navigate("/explore");
        return message;
      },
    });
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
  
  const toggleNotesWorkspace = () => {
    setShowNotesWorkspace(!showNotesWorkspace);
    if (!showNotesWorkspace) setActivePanel(null);
    if (isFocusMode) setIsFocusMode(false);
    setIsMobileMenuOpen(false);
  };

  const renderPanelContent = (panel: string) => {
    switch (panel) {
      case "global-chat": return <GlobalChatPanel userId={userId!} tag={focusTag} />;
      case "social": return <SocialSidebar userId={userId!} onProfileClick={handleProfileClick} />;
      case "leaderboard": return <Leaderboard onProfileClick={handleProfileClick} />;
      case "pomodoro": return <SessionTimer />;
      default: return null;
    }
  };

  const getPanelTitle = (panel: string) => {
    const titles: { [key: string]: string } = {
      "global-chat": `Chat: #${focusTag}`,
      "social": "Focus Buddies",
      "leaderboard": "Leaderboard",
      "pomodoro": "Structured Timer",
    };
    return titles[panel] || "";
  };

  if (isAuthLoading || !userId || !tag) {
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
            <Button onClick={() => togglePanel("global-chat")} className="w-full justify-start gap-2"><MessageSquare/> Chat: #{focusTag}</Button>
            <Button onClick={() => togglePanel("social")} className="w-full justify-start gap-2"><Users/> Focus Buddies</Button>
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
            OnlyFocus: <span className="text-primary">#{roomName}</span>
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
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("global-chat")} title={`Chat: #${focusTag}`}><MessageSquare className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("social")} title="Focus Buddies"><Users className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("leaderboard")} title="Leaderboard"><Trophy className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("pomodoro")} title="Structured Timer"><Timer className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Profile Settings"><User className="h-5 w-5" /></Button>
                  </>
                )}
                <ThemeToggle />
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
                <Input 
                  placeholder="What are you focusing on right now?" 
                  value={focusTag} 
                  onChange={(e) => setFocusTag(e.target.value)} 
                  className="flex-1 border-none bg-transparent focus-visible:ring-0" 
                  disabled // Disable editing the tag once in the room
                />
              </div>
            )}
            <div className="flex-1 min-h-[400px]">
              <VideoGrid userId={userId} tag={focusTag} />
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