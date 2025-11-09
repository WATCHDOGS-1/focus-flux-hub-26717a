"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VideoGrid from "@/components/VideoGrid";
import ChatPanel from "@/components/ChatPanel";
import TimeTracker from "@/components/TimeTracker";
import PomodoroTimer from "@/components/PomodoroTimer";
import Leaderboard from "@/components/Leaderboard";
import ProfileMenu from "@/components/ProfileMenu";
import FriendManagement from "@/components/FriendManagement";
import DirectMessagesPanel from "@/components/DirectMessagesPanel";
import TaskManagement from "@/components/TaskManagement"; // Import the new component
import EncouragementToasts from "@/components/EncouragementToasts";
import ThemeToggle from "@/components/ThemeToggle";
import { MessageSquare, Trophy, Timer, User, LogOut, Users, MessageCircle, ListTodo } from "lucide-react"; // Import ListTodo icon
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FocusRoom = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Define a fixed room ID for all users to join the same video conference
  const SHARED_FOCUS_ROOM_ID = "global-focus-room";

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        await startSession(session.user.id);
        setIsLoading(false);
      }
    };

    checkSession();

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
    if (!sessionId || !userId) return;

    const leavePromise = new Promise(async (resolve, reject) => {
      try {
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
        if (sessionError) throw sessionError;

        // Update weekly stats
        const today = new Date();
        const weekStart = new Date(today); // Create a new Date object from today
        weekStart.setDate(today.getDate() - today.getDay()); // Set it to the start of the week (Sunday)
        weekStart.setHours(0, 0, 0, 0); // Set time to midnight

        const { data: existingStats, error: statsError } = await supabase
          .from("weekly_stats")
          .select("*")
          .eq("user_id", userId)
          .gte("week_start", weekStart.toISOString())
          .maybeSingle();
        if (statsError) throw statsError;

        if (existingStats) {
          const { error: updateError } = await supabase
            .from("weekly_stats")
            .update({ total_minutes: existingStats.total_minutes + minutes })
            .eq("id", existingStats.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("weekly_stats")
            .insert({
              user_id: userId,
              week_start: weekStart.toISOString(),
              total_minutes: minutes,
            });
          if (insertError) throw insertError;
        }

        resolve(`Session saved! You focused for ${minutes} minutes! 🎉`);
      } catch (error) {
        console.error("Error leaving room:", error);
        reject("Failed to save your session. Please try again.");
      }
    });

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
  };

  if (isLoading) {
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

          <TimeTracker userId={userId} sessionStartTime={sessionStartTime} />

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("global-chat")}
              className={`dopamine-click transition-all ${
                activePanel === "global-chat" ? "bg-primary/20 shadow-glow" : ""
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("direct-messages")}
              className={`dopamine-click transition-all ${
                activePanel === "direct-messages" ? "bg-primary/20 shadow-glow" : ""
              }`}
            >
              <MessageCircle className="h-5 w-5" />
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
              onClick={() => togglePanel("friends")}
              className={`dopamine-click transition-all ${
                activePanel === "friends" ? "bg-primary/20 shadow-glow" : ""
              }`}
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("tasks")} {/* New button for tasks */}
              className={`dopamine-click transition-all ${
                activePanel === "tasks" ? "bg-primary/20 shadow-glow" : ""
              }`}
            >
              <ListTodo className="h-5 w-5" />
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
          {/* Pass the shared room ID to VideoGrid */}
          <VideoGrid userId={userId} roomId={SHARED_FOCUS_ROOM_ID} />
        </div>

        {activePanel && (
          <div className="w-80 glass-card border-l border-border p-4 overflow-y-auto">
            {activePanel === "global-chat" && <ChatPanel userId={userId} />}
            {activePanel === "direct-messages" && <DirectMessagesPanel userId={userId} />}
            {activePanel === "leaderboard" && <Leaderboard />}
            {activePanel === "pomodoro" && <PomodoroTimer />}
            {activePanel === "friends" && <FriendManagement userId={userId} />}
            {activePanel === "tasks" && <TaskManagement userId={userId} />} {/* Render TaskManagement */}
            {activePanel === "profile" && <ProfileMenu userId={userId} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusRoom;