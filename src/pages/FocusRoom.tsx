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
import type { Database } from "@/integrations/supabase/types";

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
      toast.error("You must be logged in to enter a focus room.");
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

    if (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start focus session. Please try again.");
      navigate("/auth");
      return;
    }

    if (data) {
      setSessionId(data.id);
      setSessionStartTime(Date.now());
      toast.success("Focus session started!");
    }
  };

  const leaveRoom = async () => {
    if (!sessionId || !userId) {
      toast.error("Session data is missing. Cannot save progress.");
      navigate("/");
      return;
    }

    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);

    // Update session
    const { error: sessionError } = await supabase
      .from("focus_sessions")
      .update({
        end_time: new Date().toISOString(),
        duration_minutes: minutes,
      })
      .eq("id", sessionId);

    if (sessionError) {
      console.error("Error updating session:", sessionError);
      toast.error("Failed to save session progress.");
      navigate("/");
      return;
    }

    // If duration is less than a minute, don't update weekly stats
    if (minutes < 1) {
      toast.info("Session was too short to record stats.");
      navigate("/");
      return;
    }

    // Update weekly stats
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { data: existingStats, error: statsError } = await supabase
      .from("weekly_stats")
      .select("*")
      .eq("user_id", userId)
      .gte("week_start", weekStart.toISOString())
      .maybeSingle();

    if (statsError) {
      console.error("Error fetching weekly stats:", statsError);
      toast.error("Failed to update weekly stats.");
      navigate("/");
      return;
    }

    if (existingStats) {
      const { error: updateError } = await supabase
        .from("weekly_stats")
        .update({ total_minutes: existingStats.total_minutes + minutes })
        .eq("id", existingStats.id);

      if (updateError) {
        console.error("Error updating weekly stats:", updateError);
        toast.error("Failed to update weekly stats.");
      }
    } else {
      const { error: insertError } = await supabase
        .from("weekly_stats")
        .insert({
          user_id: userId,
          week_start: weekStart.toISOString(),
          total_minutes: minutes,
        });

      if (insertError) {
        console.error("Error inserting weekly stats:", insertError);
        toast.error("Failed to create weekly stats.");
      }
    }

    toast.success(`Session saved! You focused for ${minutes} minutes! 🎉`);
    navigate("/");
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <EncouragementToasts />
      
      <div className="relative z-10 glass-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            OnlyFocus
          </h1>
          
          <TimeTracker userId={userId} sessionStartTime={sessionStartTime} />

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("chat")}
              className={`dopamine-click transition-all ${
                activePanel === "chat" ? "bg-primary/20 shadow-glow" : ""
              }`}
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
            >
              <User className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button
              variant="destructive"
              size="icon"
              onClick={leaveRoom}
              className="dopamine-click shadow-glow"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 p-4">
          <VideoGrid userId={userId} roomId={sessionId || 'default-room'} />
        </div>

        {activePanel && (
          <div className="w-80 glass-card border-l border-border p-4 overflow-y-auto">
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