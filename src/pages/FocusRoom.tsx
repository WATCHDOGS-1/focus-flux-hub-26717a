import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VideoGrid from "@/components/VideoGrid";
import GlobalChatPanel from "@/components/GlobalChatPanel";
import SocialSidebar from "@/components/SocialSidebar";
import TimeTracker from "@/components/TimeTracker";
import PomodoroTimer from "@/components/PomodoroTimer";
import Leaderboard from "@/components/Leaderboard";
import ProfileMenu from "@/components/ProfileMenu";
import EncouragementToasts from "@/components/EncouragementToasts";
import ThemeToggle from "@/components/ThemeToggle";
import { MessageSquare, Users, Trophy, Timer, User, LogOut, Tag, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";
import { useIsMobile } from "@/hooks/use-mobile";
import { endFocusSession } from "@/utils/session-management"; // Import the new utility
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const FocusRoom = () => {
  const navigate = useNavigate();
  const { userId, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isMobile = useIsMobile();
  
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [focusTag, setFocusTag] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize presence tracking (default status is 'focusing' when in the room)
  usePresence('focusing'); 

  // Define a fixed room ID for all users to join the same video conference
  const SHARED_FOCUS_ROOM_ID = "global-focus-room";

  // Authentication and Session Management
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
    } else if (userId && !sessionId) {
      // Start session only once user ID is confirmed and session hasn't started
      startSession(userId);
    }

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [isAuthLoading, isAuthenticated, userId, navigate, sessionId]);

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
    if (!sessionId || !userId) return;

    const leavePromise = endFocusSession(userId, sessionId, sessionStartTime, focusTag);

    toast.promise(leavePromise, {
      loading: "Saving your session...",
      success: (message) => {
        navigate("/");
        return message;
      },
      error: (message) => message,
    });
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
    if (isFocusMode) setIsFocusMode(false); // Exit focus mode if a panel is opened manually
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) setActivePanel(null); // Close side panel when entering focus mode
  };

  const renderPanelContent = (panel: string) => {
    switch (panel) {
      case "global-chat":
        return <GlobalChatPanel userId={userId!} />;
      case "social":
        return <SocialSidebar userId={userId!} />;
      case "leaderboard":
        return <Leaderboard />;
      case "pomodoro":
        return <PomodoroTimer />;
      case "profile":
        return <ProfileMenu />;
      default:
        return null;
    }
  };

  const getPanelTitle = (panel: string) => {
    switch (panel) {
      case "global-chat": return "Global Chat";
      case "social": return "Direct Messages";
      case "leaderboard": return "Leaderboard";
      case "pomodoro": return "Pomodoro Timer";
      case "profile": return "Profile Settings";
      default: return "";
    }
  };

  if (isAuthLoading || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading your focus room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <EncouragementToasts />

      <div className="relative z-10 glass-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">OnlyFocus</h1>

          <TimeTracker sessionStartTime={sessionStartTime} />

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFocusMode}
              className={`dopamine-click transition-all ${
                isFocusMode ? "bg-destructive/20 shadow-glow" : ""
              }`}
              title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isFocusMode ? <Maximize2 className="h-5 w-5 text-destructive" /> : <Minimize2 className="h-5 w-5" />}
            </Button>
            
            {!isFocusMode && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePanel("global-chat")}
                  className={`dopamine-click transition-all ${
                    activePanel === "global-chat" ? "bg-primary/20 shadow-glow" : ""
                  }`}
                  title="Global Chat"
                >
                  <Users className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePanel("social")}
                  className={`dopamine-click transition-all ${
                    activePanel === "social" ? "bg-primary/20 shadow-glow" : ""
                  }`}
                  title="Direct Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePanel("leaderboard")}
                  className={`dopamine-click transition-all ${
                    activePanel === "leaderboard" ? "bg-primary/20 shadow-glow" : ""
                  }`}
                  title="Leaderboard"
                >
                  <Trophy className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePanel("pomodoro")}
                  className={`dopamine-click transition-all ${
                    activePanel === "pomodoro" ? "bg-primary/20 shadow-glow" : ""
                  }`}
                  title="Pomodoro Timer"
                >
                  <Timer className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePanel("profile")}
                  className={`dopamine-click transition-all ${
                    activePanel === "profile" ? "bg-primary/20 shadow-glow" : ""
                  }`}
                  title="Profile Settings"
                >
                  <User className="h-5 w-5" />
                </Button>
              </>
            )}
            <ThemeToggle />
            <Button
              variant="destructive"
              size="icon"
              onClick={leaveRoom}
              className="dopamine-click shadow-glow"
              title="Leave Room"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 p-4 flex flex-col gap-4">
          {/* Focus Tag Input - Hide in Focus Mode */}
          {!isFocusMode && (
            <div className="glass-card p-3 rounded-xl flex items-center gap-3">
              <Tag className="w-5 h-5 text-primary" />
              <Input
                placeholder="What are you focusing on right now? (e.g., 'React Project')"
                value={focusTag}
                onChange={(e) => setFocusTag(e.target.value)}
                className="flex-1 border-none bg-transparent focus-visible:ring-0"
              />
            </div>
          )}
          
          {/* Video Grid */}
          <div className="flex-1">
            <VideoGrid userId={userId} roomId={SHARED_FOCUS_ROOM_ID} />
          </div>
        </div>

        {/* Desktop Sidebar */}
        {activePanel && !isFocusMode && !isMobile && (
          <div className="w-80 glass-card border-l border-border p-4 overflow-y-auto">
            {renderPanelContent(activePanel)}
          </div>
        )}
      </div>
      
      {/* Mobile Drawer */}
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