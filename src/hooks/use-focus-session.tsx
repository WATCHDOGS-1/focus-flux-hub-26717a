import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { endFocusSession } from "@/utils/session-management";
import { useAuth } from "./use-auth";
import { useUserStats } from "./use-user-stats";
import { runAIFocusCoach } from "@/utils/ai-coach";
import { supabase } from "@/integrations/supabase/client";

// Session definitions in seconds
export const SESSION_MODES = [
  { name: "Pomodoro (25/5)", work: 25 * 60, break: 5 * 60, cycles: 1 },
  { name: "Deep Work (50/10)", work: 50 * 60, break: 10 * 60, cycles: 1 },
  { name: "Ultradian Cycle (90/20)", work: 90 * 60, break: 20 * 60, cycles: 1 },
  { name: "Silent Mode (3h)", work: 180 * 60, break: 0, cycles: 1 },
];

interface UseFocusSessionResult {
  currentMode: typeof SESSION_MODES[0];
  setCurrentMode: (mode: typeof SESSION_MODES[0]) => void;
  timeLeft: number;
  isActive: boolean;
  isBreak: boolean;
  sessionStartTime: number;
  focusTag: string;
  setFocusTag: (tag: string) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  handleSaveCustomSettings: (workMinutes: number, breakMinutes: number) => void;
  startNewSession: () => void;
  endCurrentSession: () => Promise<void>;
  currentDuration: number;
  progress: number;
}

const FOCUS_TAG_KEY = "onlyfocus_focus_tag";

export function useFocusSession(): UseFocusSessionResult {
  const { userId } = useAuth();
  const { stats, levels, refetch: refetchStats } = useUserStats();

  const [currentMode, setCurrentMode] = useState(SESSION_MODES[0]);
  const [timeLeft, setTimeLeft] = useState(currentMode.work);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [focusTag, setFocusTagState] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load mode and tag from local storage on mount
  useEffect(() => {
    const storedModeName = localStorage.getItem("focus_session_mode");
    const storedMode = SESSION_MODES.find(m => m.name === storedModeName);
    if (storedMode) {
      setCurrentMode(storedMode);
      setTimeLeft(storedMode.work);
    }
    
    const storedTag = localStorage.getItem(FOCUS_TAG_KEY);
    if (storedTag) {
        setFocusTagState(storedTag);
    }
  }, []);

  // Setter for focus tag that also updates local storage
  const setFocusTag = (tag: string) => {
    setFocusTagState(tag);
  };
  
  // Function to save tag to local storage explicitly
  const saveFocusTag = (tag: string) => {
      localStorage.setItem(FOCUS_TAG_KEY, tag);
      toast.success("Focus tag saved locally.");
  };

  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(currentMode.work);
    setIsBreak(false);
    setIsActive(false);
    setSessionStartTime(0);
    localStorage.setItem("focus_session_mode", currentMode.name);
  }, [currentMode]);

  const endCurrentSession = useCallback(async () => {
    if (!userId || !sessionId || sessionStartTime === 0) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsActive(false);
    setSessionId(null);
    
    // Use the current focusTag, defaulting if empty
    const finalFocusTag = focusTag.trim() || "General Focus";

    const leavePromise = endFocusSession(userId, sessionId, sessionStartTime, finalFocusTag);

    toast.promise(leavePromise, {
      loading: "Saving your session...",
      success: (result) => {
        runAIFocusCoach(stats, levels, result.durationMinutes, result.focusTag); // Pass focusTag for AI analysis
        refetchStats();
        return result.message;
      },
      error: (message) => {
        console.error("Session save failed:", message);
        return "Failed to save session. Check console for details.";
      },
    });

    setSessionStartTime(0);
  }, [userId, sessionId, sessionStartTime, focusTag, stats, levels, refetchStats]);

  const startNewSession = useCallback(async () => {
    if (!userId) return;
    
    // Use the current focusTag, defaulting if empty
    const finalFocusTag = focusTag.trim() || "General Focus";

    // Start Supabase session logging
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({ user_id: userId, start_time: new Date().toISOString(), tag: finalFocusTag || null })
      .select("id")
      .single();

    if (!error && data) {
      setSessionId(data.id);
      setSessionStartTime(Date.now());
      setIsActive(true);
      toast.success(`Focus session started: ${currentMode.name}`);
    } else {
      console.error("Error starting session:", error);
      toast.error("Failed to start focus session.");
      setIsActive(false);
    }
  }, [userId, currentMode, focusTag]);

  // Timer logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Phase transition or session end
      if (isBreak) {
        toast.success("Break over! Time to focus!");
        setIsBreak(false);
        setTimeLeft(currentMode.work);
        // Do not call endCurrentSession here, as it's a cycle transition, not a full session end.
      } else {
        // Work phase ended
        endCurrentSession(); // Log the completed work session

        if (currentMode.break > 0) {
          toast.success("Great work! Time for a break!");
          setIsBreak(true);
          setTimeLeft(currentMode.break);
          setIsActive(true); // Automatically start break
        } else {
          // Session finished without a break (e.g., Silent Mode)
          toast.success(`${currentMode.name} session complete!`);
          setTimeLeft(currentMode.work);
          setIsActive(false); // Stop timer
        }
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, isBreak, currentMode, endCurrentSession]);

  const toggleTimer = () => {
    const newState = !isActive;
    
    if (newState && sessionStartTime === 0) {
      // Start session regardless of focus tag presence
      startNewSession();
    } else if (!newState && sessionStartTime !== 0 && !isBreak) {
      // If pausing a work session
      toast.info("Focus paused.");
    } else if (!newState && isBreak) {
      // If pausing a break
      toast.info("Break paused.");
    }
    
    setIsActive(newState);
  };

  const resetTimer = () => {
    if (sessionId && !isBreak) {
      // If resetting a work session, log the partial session
      endCurrentSession();
    }

    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(currentMode.work);
    setSessionStartTime(0);
    setSessionId(null);
    toast.info("Timer reset.");
  };

  const handleSaveCustomSettings = (workMinutes: number, breakMinutes: number) => {
    const customMode = {
      name: "Custom Session",
      work: workMinutes * 60,
      break: breakMinutes * 60,
      cycles: 1,
    };
    setCurrentMode(customMode);
    toast.success("Custom session created!");
  };

  const currentDuration = isBreak ? currentMode.break : currentMode.work;
  const progress = currentDuration > 0 ? ((currentDuration - timeLeft) / currentDuration) * 100 : 0;

  return {
    currentMode,
    setCurrentMode,
    timeLeft,
    isActive,
    isBreak,
    sessionStartTime,
    focusTag,
    setFocusTag,
    toggleTimer,
    resetTimer,
    handleSaveCustomSettings,
    startNewSession,
    endCurrentSession,
    currentDuration,
    progress,
    saveFocusTag: () => saveFocusTag(focusTag),
  };
}