import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { endFocusSession } from "@/utils/session-management";
import { useAuth } from "./use-auth";
import { useUserStats } from "./use-user-stats";
import { runAIFocusCoach, runAITaskCheckin } from "@/utils/ai-coach"; // Import runAITaskCheckin
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
  startNewSession: (taskId?: string | null) => void;
  prepareSessionEnd: () => { durationMinutes: number, defaultTag: string, taskId: string | null } | null; // Updated return type
  endCurrentSessionAndSave: (finalFocusTag: string, taskId: string | null) => Promise<void>; // Updated signature
  currentDuration: number;
  progress: number;
}

const CHECKIN_INTERVAL_SECONDS = 30 * 60; // 30 minutes

export function useFocusSession(): UseFocusSessionResult {
  const { userId, profile } = useAuth();
  const { stats, levels, refetch: refetchStats } = useUserStats();

  const [currentMode, setCurrentMode] = useState(SESSION_MODES[0]);
  const [timeLeft, setTimeLeft] = useState(currentMode.work);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null); // NEW: Task ID state
  const [focusTag, setFocusTagState] = useState(""); // Local state for input field

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckinTimeRef = useRef<number>(0); // Tracks time elapsed since last check-in

  // Load mode from local storage on mount
  useEffect(() => {
    const storedModeName = localStorage.getItem("focus_session_mode");
    const storedMode = SESSION_MODES.find(m => m.name === storedModeName);
    if (storedMode) {
      setCurrentMode(storedMode);
      setTimeLeft(storedMode.work);
    }
    
    // Focus tag starts empty or is set by the user in the room
    setFocusTagState("");
  }, []);

  // Setter for focus tag (no longer updates local storage)
  const setFocusTag = (tag: string) => {
    setFocusTagState(tag);
  };
  
  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(currentMode.work);
    setIsBreak(false);
    setIsActive(false);
    setSessionStartTime(0);
    localStorage.setItem("focus_session_mode", currentMode.name);
  }, [currentMode]);

  // Function to calculate session data without modifying internal state to avoid infinite loops
  const prepareSessionEnd = useCallback(() => {
    if (!userId || !sessionId || sessionStartTime === 0) return null;

    const sessionDurationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    const durationMinutes = Math.floor(sessionDurationSeconds / 60);
    
    if (durationMinutes < 1) {
        return null;
    }

    return {
        durationMinutes,
        defaultTag: focusTag.trim() || "General Focus",
        taskId: currentTaskId, // Include task ID
    };
  }, [userId, sessionId, sessionStartTime, focusTag, currentTaskId]);


  // Function to finalize session saving after receiving the tag from the modal
  const endCurrentSessionAndSave = useCallback(async (finalFocusTag: string, taskId: string | null) => {
    if (!userId || !sessionId || sessionStartTime === 0) {
        toast.error("Cannot save session: session data missing.");
        return;
    }
    
    const sessionDurationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    const durationMinutes = Math.floor(sessionDurationSeconds / 60);

    const leavePromise = endFocusSession(userId, sessionId, sessionStartTime, finalFocusTag, taskId); // Pass taskId

    toast.promise(leavePromise, {
      loading: "Saving your session...",
      success: (result) => {
        runAIFocusCoach(stats, levels, result.durationMinutes, result.focusTag); // Pass focusTag for AI analysis
        refetchStats();
        return result.message;
      },
      error: (message) => {
        console.error("Session save failed:", message);
        return `Failed to save session: ${message}`;
      },
    });

    // Reset state regardless of save success (optimistic reset)
    setSessionStartTime(0);
    setSessionId(null);
    setCurrentTaskId(null); // Reset task ID
    setTimeLeft(currentMode.work);
    setIsBreak(false);
    lastCheckinTimeRef.current = 0; // Reset check-in tracker
  }, [userId, sessionId, sessionStartTime, stats, levels, refetchStats, currentMode]);

  const startNewSession = async (taskId?: string | null) => {
    if (!userId || !profile) {
        toast.error("Authentication incomplete. Please wait for profile to load or re-login.");
        return;
    }
    
    // 1. Create new session record
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({ user_id: userId, start_time: new Date().toISOString(), tag: focusTag.trim() || null }) // Save initial tag
      .select("id")
      .single();

    if (error || !data) {
      toast.error(`Failed to start session: ${error?.message || 'Unknown database error'}`);
      console.error("Session start error:", error);
      return;
    }

    // 2. Update state
    setSessionId(data.id);
    setCurrentTaskId(taskId || null); // Store task ID
    setSessionStartTime(Date.now());
    setIsActive(true);
    setIsBreak(false);
    setTimeLeft(currentMode.work);
    lastCheckinTimeRef.current = 0; // Reset check-in tracker
    toast.success(`Focus session started: ${currentMode.name}`);
  };


  // Timer logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => {
          const newTime = time - 1;
          
          // --- AI Check-in Logic ---
          if (!isBreak && newTime % 60 === 0) { // Check every minute during work phase
            const elapsedSeconds = currentMode.work - newTime;
            
            // Check if 30 minutes have passed since the start or last check-in
            if (elapsedSeconds >= lastCheckinTimeRef.current + CHECKIN_INTERVAL_SECONDS) {
                runAITaskCheckin(focusTag);
                lastCheckinTimeRef.current = elapsedSeconds;
            }
          }
          // --- End AI Check-in Logic ---

          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      // Phase transition or session end
      if (isBreak) {
        toast.success("Break over! Time to focus!");
        setIsBreak(false);
        setTimeLeft(currentMode.work);
        lastCheckinTimeRef.current = 0; // Reset check-in tracker for new work phase
      } else {
        // Work phase ended
        setIsActive(false);
        
        // The modal trigger in FocusRoom will handle showing the save modal automatically
        
        if (currentMode.break > 0) {
            toast.success("Great work! Time for a break!");
            setIsBreak(true);
            setTimeLeft(currentMode.break);
            setIsActive(true); // Automatically start break
        }
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, isBreak, currentMode, focusTag, userId, profile]);

  const toggleTimer = () => {
    const newState = !isActive;
    
    if (newState && sessionStartTime === 0) {
      // Start session
      startNewSession();
    } else {
        setIsActive(newState);
        if (!newState) {
            toast.info("Focus paused.");
        }
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(currentMode.work);
    setSessionStartTime(0);
    setSessionId(null);
    setCurrentTaskId(null); // Reset task ID
    lastCheckinTimeRef.current = 0; // Reset check-in tracker
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
    prepareSessionEnd,
    endCurrentSessionAndSave,
    currentDuration,
    progress,
  };
}