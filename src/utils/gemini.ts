import { GoogleGenAI, Type } from "@google/genai";
import { toast } from "sonner";

const API_KEY_STORAGE_KEY = "gemini_api_key";
const MODEL_NAME = "gemini-2.5-flash"; // Fast and capable for chat and generation

let ai: GoogleGenAI | null = null;

/**
 * Retrieves the stored Gemini API key.
 */
export const getGeminiApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

/**
 * Initializes the GoogleGenAI client.
 * @returns The initialized client or null if the key is missing.
 */
export const initializeGeminiClient = (): GoogleGenAI | null => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    ai = null;
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

/**
 * Stores the Gemini API key locally.
 */
export const setGeminiApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
  initializeGeminiClient(); // Re-initialize immediately
  toast.success("Gemini API Key saved successfully!");
};

/**
 * Removes the stored Gemini API key.
 */
export const clearGeminiApiKey = () => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  ai = null;
  toast.info("Gemini API Key cleared.");
};

/**
 * Sends a chat message to the Gemini model.
 */
export const sendGeminiChat = async (history: { role: "user" | "model", parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  const client = initializeGeminiClient();
  if (!client) {
    throw new Error("Gemini API Key is missing. Please configure it in settings.");
  }

  const chat = client.chats.create({
    model: MODEL_NAME,
    history: history,
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};

/**
 * Generates a flowchart in Mermaid syntax based on a prompt.
 */
export const generateFlowchart = async (prompt: string): Promise<string> => {
  const client = initializeGeminiClient();
  if (!client) {
    throw new Error("Gemini API Key is missing. Please configure it in settings.");
  }

  const systemInstruction = `You are an expert productivity coach. Your task is to generate a detailed flowchart in Mermaid syntax based on the user's request. ONLY output the Mermaid code block (starting with \`\`\`mermaid and ending with \`\`\`). Do not include any introductory or explanatory text.`;

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
    }
  });

  // Extract the Mermaid code block
  const text = response.text.trim();
  const match = text.match(/```mermaid\n([\s\S]*?)\n```/);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code block is found, return the raw text
  return text;
};

/**
 * Analyzes a focus session and provides coaching feedback.
 */
export const analyzeSession = async (sessionData: { durationMinutes: number, focusTag: string, longestStreak: number, totalFocusedMinutes: number }): Promise<string> => {
    const client = initializeGeminiClient();
    if (!client) {
        throw new Error("Gemini API Key is missing. Please configure it in settings.");
    }

    const prompt = `Analyze the following focus session data and provide concise, actionable coaching feedback.
    Session Duration: ${sessionData.durationMinutes} minutes
    Focus Tag: ${sessionData.focusTag}
    Longest Streak: ${sessionData.longestStreak} days
    Total Focused Minutes: ${sessionData.totalFocusedMinutes} minutes

    Focus on:
    1. Acknowledging the duration and tag.
    2. Providing one specific, positive reinforcement based on the streak or total time.
    3. Suggesting one small, actionable step for the next session.
    Keep the response under 100 words.`;

    const response = await client.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            temperature: 0.7,
        }
    });

    return response.text;
};