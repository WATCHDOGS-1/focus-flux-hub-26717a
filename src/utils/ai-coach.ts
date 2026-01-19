import { toast } from "sonner";
import { initializeGeminiClient, analyzeSession } from "./gemini";
import { getLocalStudyData } from "./local-data";

export const AI_COACH_SYSTEM_PROMPT = `
You are the Strategic Partner, channeling the wisdom of Naval Ravikant and the tactical intensity of an exam coach.
Persona: Minimalist, analytical, slightly stoic, focused on LEVERAGE. 

Your mission:
1. Identify low-leverage tasks (shallow work) and suggest their removal.
2. Direct the user toward the 'compounding' 20% of their syllabus (e.g., hard problem sets over reading).
3. Warn against 'fake productivity' (organizing, re-reading).
4. If a user is focusing during 'Crunch Hours' (4 AM), praise their discipline as a competitive moat.

Always ask: "Is this task truly moving the needle, or are you just being busy?"
`;

export const runAIFocusCoach = async (stats: any, levels: any, duration: number, tag: string) => {
  const client = initializeGeminiClient();
  if (client && stats) {
    try {
        const feedback = await analyzeSession({ durationMinutes: duration, focusTag: tag, longestStreak: stats.longest_streak, totalFocusedMinutes: stats.total_focused_minutes });
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: `${AI_COACH_SYSTEM_PROMPT}\n\nSession Data: ${feedback}` }] }]
        });
        toast.info(`Strategic Insight: ${response.text}`, { duration: 15000 });
    } catch (e) {
        toast.info("Elite focus detected. Compound your effort.");
    }
  }
};

export const runAITaskCheckin = async (focusTag: string, allTasks: any[] = []) => {
    const client = initializeGeminiClient();
    if (!client) return;
    const prompt = `
    ${AI_COACH_SYSTEM_PROMPT}
    Current Subject: ${focusTag}
    Current Tasks: ${JSON.stringify(allTasks)}
    
    Review these tasks. Identify one that is 'shallow work' and suggest deleting it. Suggest one 'high leverage' action instead. Be concise.
    `;
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        toast.warning(`Strategic Pivot: ${response.text}`, { duration: 15000 });
    } catch (e) { /* silent */ }
};