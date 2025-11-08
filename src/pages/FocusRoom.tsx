import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  const { user, profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionLoading, setSessionLoading] = useState(true);

  const workTime = 25 * 60;
  const breakTime = 5 * 60;
  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    if (!profileLoading && user && profile) {
      startSession(user.id);
      setIsTimerActive(true);
    }
  }, [profileLoading, user, profile]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((time) => time - 1), 1000);
    } else if (timeLeft === 0) {
      if (isBreak) {
        toast.success("Break over! Time to focus!");
        setIsBreak(false);
        setTimeLeft(workTime);
      } else {
        toast.success("Great work! Time for a break!");
        setIsBreak(true);
        setTimeLeft(breakTime);
      }
      setIsTimerActive(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsTimerActive(!isTimerActive);
  const resetTimer = () => {
    setIsTimerActive(false);
    setTimeLeft(isBreak ? breakTime : workTime);
  };

  const startSession = async (uid: string) => {
    setSessionLoading(true);
    try {
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({ user_id: uid, start_time: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        toast.error("Session Start Failed", { description: error.message });
        throw error;
      }
      if (!data) throw new Error("No data returned after creating session.");
      setSessionId(data.id);
      setSessionStartTime(Date.now());
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setSessionLoading(false);
    }
  };

  const leaveRoom = async () => {
    if (!sessionId || !user) {
      toast.error("Session not found. Cannot save progress.");
      navigate("/");
      return;
    }
    const leavePromise = new Promise(async (resolve, reject) => {
      try {
        const minutes = Math.floor((Date.now() - sessionStartTime) / 60000);
        if (minutes < 1) {
          resolve("Session was too short to save.");
          return;
        }
        const { error: updateError } = await supabase.from("focus_sessions").update({
          end_time: new Date().toISOString(),
          duration_minutes: minutes,
        }).eq("id", sessionId);
        if (updateError) throw updateError;

        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
        const { data: stats, error: statsError } = await supabase.from("weekly_stats").select("*").eq("user_id", user.id).gte("week_start", weekStart).maybeSingle();
        if (statsError) throw statsError;

        if (stats) {
          const { error } = await supabase.from("weekly_stats").update({ total_minutes: stats.total_minutes + minutes }).eq("id", stats.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("weekly_stats").insert({ user_id: user.id, week_start: weekStart, total_minutes: minutes });
          if (error) throw error;
        }
        resolve(`Session saved! You focused for ${minutes} minutes! 🎉`);
      } catch (error: any) {
        console.error("Error leaving room:", error);
        toast.error("Failed to Save Session", { description: error.message });
        reject("Failed to save your session.");
      }
    });
    toast.promise(leavePromise, {
      loading: "Saving your session...",
      success: (message) => { navigate("/"); return message; },
      error: (message) => message,
    });
  };

  const togglePanel = (panel: string) => setActivePanel(activePanel === panel ? null : panel);

  if (profileLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading your focus room...</div>
      </div>
    );
  }

  if (!user || !profile) {
     return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-destructive">Could not load your profile. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <EncouragementToasts />
      <div className="relative z-10 glass-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">OnlyFocus</h1>
          <TimeTracker userId={user.id} sessionStartTime={sessionStartTime} />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => togglePanel("chat")} className={`dopamine-click transition-all ${activePanel === "chat" ? "bg-primary/20 shadow-glow" : ""}`}><MessageSquare className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => togglePanel("leaderboard")} className={`dopamine-click transition-all ${activePanel === "leaderboard" ? "bg-primary/20 shadow-glow" : ""}`}><Trophy className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => togglePanel("pomodoro")} className={`dopamine-click transition-all ${activePanel === "pomodoro" ? "bg-primary/20 shadow-glow" : ""}`}><Timer className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => togglePanel("profile")} className={`dopamine-click transition-all ${activePanel === "profile" ? "bg-primary/20 shadow-glow" : ""}`}><User className="h-5 w-5" /></Button>
            <ThemeToggle />
            <Button variant="destructive" size="icon" onClick={leaveRoom} className="dopamine-click shadow-glow"><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>
      <div className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 p-4">
          <VideoGrid userId={user.id} roomId={sessionId || "default-room"} />
        </div>
        {activePanel && (
          <div className="w-80 glass-card border-l border-border p-4 overflow-y-auto">
            {activePanel === "chat" && <ChatPanel userId={user.id} />}
            {activePanel === "leaderboard" && <Leaderboard />}
            {activePanel === "pomodoro" && <PomodoroTimer timeLeft={timeLeft} isActive={isTimerActive} isBreak={isBreak} toggleTimer={toggleTimer} resetTimer={resetTimer} />}
            {activePanel === "profile" && <ProfileMenu userId={user.id} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusRoom;