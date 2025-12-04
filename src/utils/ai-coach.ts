import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { initializeGeminiClient, analyzeSession } from "./gemini"; // Import Gemini utilities
import { getLocalStudyData } from "./local-data"; // Import local data utility

type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
type UserLevels = Database["public"]["Tables"]["user_levels"]["Row"];

// --- New System Prompt Definition ---
const AI_COACH_SYSTEM_PROMPT = `
You are the AI Focus Coach, a blend of Naval Ravikant's philosophical wisdom on wealth and happiness (applied to focus and learning) and Robbie Williams' charismatic, slightly cheeky, and encouraging stage presence. Your persona is strictly PG-13.

Your core principles are:
1. **Hard Work & Balance:** Encourage deep, focused work, but always remind the user of the importance of rest, health, and long-term consistency over short-term burnout.
2. **Naval-esque Wisdom:** Use concise, philosophical, and often counter-intuitive advice related to learning, leverage, and compounding effort (XP, streaks).
3. **Robbie Flair:** Be highly engaging, use enthusiastic language, and occasionally drop a playful, motivational line.
4. **Actionable:** Every piece of advice must be practical and focused on the user's next step.

When responding, adopt this voice. Do not break character.
`;
// --- End New System Prompt Definition ---


/**
 * Provides rule-based or Gemini-powered motivational advice based on user stats.
 */
export const runAIFocusCoach = async (stats: UserStats | null, levels: UserLevels | null, sessionDurationMinutes: number, focusTag: string) => {
  const client = initializeGeminiClient();

  if (client && stats && levels) {
    // Use Gemini for advanced analysis if key is present
    try {
        const feedback = await analyzeSession({
            durationMinutes: sessionDurationMinutes,
            focusTag: focusTag || "General Focus",
            longestStreak: stats.longest_streak,
            totalFocusedMinutes: stats.total_focused_minutes,
        });
        
        // Prepend system prompt to the analysis request
        const fullPrompt = AI_COACH_SYSTEM_PROMPT + "\n\n" + feedback;
        
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            config: {
                temperature: 0.8,
            }
        });
        
        toast.info(`AI Coach Feedback: ${response.text}`, { duration: 10000 });
        return;
    } catch (e) {
        console.warn("Gemini analysis failed, falling back to rule-based coach.", e);
        // Fall through to rule-based coaching
    }
  }
  
  // --- Rule-Based Coaching (Fallback) ---

  if (!stats || !levels) {
    // Rule 1: New user encouragement
    toast.info("Welcome to OnlyFocus! Complete your first session to start earning XP and climbing the leaderboard. You got this! 🚀", { duration: 8000 });
    return;
  }

  // Rule 2: Long session praise
  if (sessionDurationMinutes >= 60) {
    toast.success(`Deep focus achieved! A ${sessionDurationMinutes}-minute session is incredible. Keep that momentum going! 🧠`, { duration: 8000 });
    return;
  }
  
  // Rule 3: Streak milestone encouragement
  if (stats.longest_streak > 0 && stats.longest_streak % 3 === 0) {
    toast.success(`Streak Alert! You've maintained a focus streak for ${stats.longest_streak} days. Consistency is key! 🔑`, { duration: 8000 });
    return;
  }

  // Rule 4: General motivation
  if (levels.total_xp < 500) {
    toast.info(`You are Level ${levels.level}. Every minute counts towards your next title. Keep pushing! 💪`, { duration: 8000 });
    return;
  }
  
  // Rule 5: High level encouragement
  if (levels.level >= 4) {
    toast.info(`As a ${levels.title}. Your focus is legendary. Inspire your peers in the room! ✨`, { duration: 8000 });
    return;
  }
};

/**
 * Triggers a task check-in prompt from the AI Coach.
 */
export const runAITaskCheckin = async (focusTag: string) => {
    const client = initializeGeminiClient();
    if (!client) return; // Do nothing if key is missing

    const localData = getLocalStudyData();
    const tasksSummary = localData.tasks.length > 0 
        ? localData.tasks.map(t => t.content).join("; ")
        : "No incomplete tasks found.";
    
    const prompt = `
    ${AI_COACH_SYSTEM_PROMPT}
    
    It's time for a check-in. The user is focusing on "${focusTag}".
    
    Current Incomplete Tasks: ${tasksSummary}
    Current Notes Summary: ${localData.notesSummary || "No notes found."}

    Provide a brief, encouraging check-in message (max 3 sentences). Ask one question related to their progress or suggest a small, immediate next step based on their tasks/notes. Do not mention the 30-minute interval.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                temperature: 0.8,
            }
        });
        
        toast.info(`AI Coach Check-in: ${response.text}`, { duration: 15000 });
    } catch (e) {
        console.error("AI Check-in failed:", e);
    }
};