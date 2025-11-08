import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VideoGrid from "@/components/VideoGrid";
import ChatPanel from "@/components/ChatPanel";
import TimeTracker from "@/components/TimeTracker";
import PomodoroTimer from "@/components/PomodoroTimer";
import Leaderboard from "@/components/Leaderboard";
import ProfileMenu from "@/components/ProfileMenu";
import EncouragementToasts from "@/components/EncouragementToasts";
import ThemeToggle from "@/components/ThemeToggle";
import { MessageSquare, Trophy, Timer, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FocusRoom = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      navigate("/auth");
    } else {
      setUserId(storedUserId);
      startSession(storedUserId);
    }

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [navigate]);

  const startSession = async (uid: string) => {
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({ user_id: uid, start_time: new Date().toISOString() })
      .select()
      .single();

    if (!error && data) {
      setSessionId(data.id);
      setSessionStartTime(Date.now());
    }
  };

  const leaveRoom = async () => {
    if (!sessionId) return;

    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);

    // Update session
    await supabase
      .from("focus_sessions")
      .update({
        end_time: new Date().toISOString(),
        duration_minutes: minutes,
      })
      .eq("id", sessionId);

    // Update weekly stats
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const { data: existingStats } = await supabase
      .from("weekly_stats")
      .select("*")
      .eq("user_id", userId)
      .gte("week_start", weekStart.toISOString())
      .maybeSingle();

    if (existingStats) {
      await supabase
        .from("weekly_stats")
        .update({ total_minutes: existingStats.total_minutes + minutes })
        .eq("id", existingStats.id);
    } else {
      await supabase
        .from("weekly_stats")
        .insert({
          user_id: userId,
          week_start: weekStart.toISOString(),
          total_minutes: minutes,
        });
    }

    toast.success(`Session saved! You focused for ${minutes} minutes! 🎉`);
    navigate("/");
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <EncouragementToasts />
      
      {/* Header */}
      <div className="relative z-10 glass-card border-b-4 animate-rainbow-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-holographic">
            OnlyFocus
          </h1>
          
          <TimeTracker userId={userId} sessionStartTime={sessionStartTime} />

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("chat")}
              className={`dopamine-click transition-all ${
                activePanel === "chat" ? "bg-gradient-to-r from-primary to-secondary shadow-glow" : "hover:shadow-neon"
              }`}
            >
              <MessageSquare className="text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("leaderboard")}
              className={`dopamine-click transition-all ${
                activePanel === "leaderboard" ? "bg-gradient-to-r from-accent to-primary shadow-glow" : "hover:shadow-neon"
              }`}
            >
              <Trophy className="text-accent" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("pomodoro")}
              className={`dopamine-click transition-all ${
                activePanel === "pomodoro" ? "bg-gradient-to-r from-secondary to-accent shadow-glow" : "hover:shadow-neon"
              }`}
            >
              <Timer className="text-secondary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("profile")}
              className={`dopamine-click transition-all ${
                activePanel === "profile" ? "bg-gradient-to-r from-primary to-accent shadow-glow" : "hover:shadow-neon"
              }`}
            >
              <User className="text-primary" />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={leaveRoom}
              className="dopamine-click hover:shadow-neon hover:bg-destructive/20 transition-all"
            >
              <LogOut className="text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <VideoGrid userId={userId} roomId={sessionId || 'default-room'} />
        </div>

        {/* Side Panel */}
        {activePanel && (
          <div className="w-80 glass-card border-l border-primary/20 p-4 animate-slide-in-right overflow-y-auto">
            {activePanel === "chat" && <ChatPanel userId={userId} />}
            {activePanel === "leaderboard" && <Leaderboard />}
            {activePanel === "pomodoro" && <PomodoroTimer />}
            {activePanel === "profile" && <ProfileMenu userId={userId} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusRoom;
