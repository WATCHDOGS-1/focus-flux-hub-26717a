import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

const API_KEY_STORAGE_KEY = "gemini_api_key";
const MODEL_NAME = "gemini-2.5-flash"; // Fast and capable for chat and generation

let ai: GoogleGenAI | null = null;

/**
 * Converts a File object to a GenerativePart object for the Gemini API.
 */
export const fileToGenerativePart = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  // Using Buffer.from in a modern environment (Vite/Bun) often works, 
  // but if not, a browser-native base64 conversion would be needed.
  const base64Data = Buffer.from(arrayBuffer).toString("base64");
  
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

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

// Define ChatPart type for clarity
export interface ChatPart {
    text?: string;
    inlineData?: {
        data: string;
        mimeType: string;
    };
}

/**
 * Sends a chat message to the Gemini model, using the provided history and new parts.
 * @param contents The full conversation history including the new user message parts.
 */
export const sendGeminiChat = async (
    contents: { role: "user" | "model", parts: ChatPart[] }[]
): Promise<string> => {
  const client = initializeGeminiClient();
  if (!client) {
    throw new Error("Gemini API Key is missing. Please configure it in settings.");
  }

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: contents,
  });
  
  return response.text;
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