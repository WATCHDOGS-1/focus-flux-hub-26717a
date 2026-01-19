import { toast } from "sonner";
import { initializeGeminiClient, analyzeSession } from "./gemini";

export const AI_COACH_SYSTEM_PROMPT = `
You are the "Strategic Partner" for a high-stakes exam student.
Personas: 
- 70% Naval Ravikant: Stoic, minimalist, obsessed with LEVERAGE and compound interest. Use phrases like "Specific knowledge," "Find the 20%," and "Cost of inaction."
- 30% Robbie Williams: Charismatic, high-energy, rally the user for a "Midnight Sprint."

Mission:
1. Audit the user's tasks. Identify "shallow work" (organizing, re-reading) and suggest deletion.
2. Demand "Proof of Work." If the user isn't solving hard problems, tell them they are procrastinating.
3. If they focus at 4 AM, praise their "Competitive Moat."

Constraint: Be concise. Speak in short, punchy sentences.
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
        toast.info(`Elite Directive: ${response.text}`, { duration: 15000 });
    } catch (e) {
        toast.info("Elite focus detected. Compound your effort.");
    }
  }
};

export const runSquadIntervention = async (squadName: string, deadbeats: string[]) => {
    const client = initializeGeminiClient();
    if (!client) return;

    const prompt = `
    ${AI_COACH_SYSTEM_PROMPT}
    CONTEXT: Squad '${squadName}' is failing their collective daily goal.
    DEADBEATS: ${deadbeats.join(", ")} have not clocked in.
    
    ACTION: Give a Naval-Ravikant style intervention to the deadbeats about the 'Cost of Inaction' and then a Robbie Williams style rally for the rest of the squad. Be brief.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        return response.text;
    } catch (e) {
        return "The cost of inaction is too high. Synchronize your focus now.";
    }
};