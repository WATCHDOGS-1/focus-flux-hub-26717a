import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// List of inappropriate words (case-insensitive)
const BANNED_WORDS = [
  "admin",
  "moderator",
  "fuck",
  "shit",
  "asshole",
  "bitch",
  "cunt",
  "nigger",
  "faggot",
  "porn",
  "sex",
  "weed",
  "420",
  "69",
  "hitler",
  "nazi",
  "kill",
  "murder",
  "spam",
  "scam",
];

/**
 * Checks if a string is likely an email address.
 * @param input The string to check.
 * @returns true if it looks like an email, false otherwise.
 */
export const isLikelyEmail = (input: string): boolean => {
  // Simple regex check for presence of '@' and '.'
  return /\S+@\S+\.\S+/.test(input);
};

/**
 * Checks if a username contains any inappropriate words or is an email.
 * @param username The username to check.
 * @returns true if inappropriate, false otherwise.
 */
export const isUsernameInappropriate = (username: string): boolean => {
  if (!username) return true;
  const lowerCaseUsername = username.toLowerCase();
  
  if (isLikelyEmail(lowerCaseUsername)) {
    return true;
  }

  return BANNED_WORDS.some(word => lowerCaseUsername.includes(word));
};

/**
 * Sanitizes a username by replacing it with a default, unique name if it is inappropriate.
 * @param userId The user's ID.
 * @param currentUsername The current username.
 * @returns The sanitized username (either the original or a new default).
 */
export const sanitizeUsername = async (userId: string, currentUsername: string): Promise<string> => {
  if (!isUsernameInappropriate(currentUsername)) {
    return currentUsername;
  }

  const newUsername = `User${Math.floor(Math.random() * 90000) + 10000}`;
  
  // Determine the reason for sanitization
  const reason = isLikelyEmail(currentUsername) ? "Your username was flagged as an email address" : "Your username was flagged as inappropriate";

  // Attempt to update the profile in the database
  const { error } = await supabase
    .from("profiles")
    .update({ username: newUsername })
    .eq("id", userId);

  if (error) {
    console.error("Failed to sanitize and update username:", error);
    toast.error(`${reason} and could not be automatically updated. Please update it manually.`);
    return currentUsername; // Return original if update fails, relying on manual update later
  }

  toast.warning(`${reason} and changed to "${newUsername}". Please update it in your profile settings.`);
  return newUsername;
};