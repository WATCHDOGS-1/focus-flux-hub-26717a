import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// List of inappropriate words and reserved terms (case-insensitive)
const BANNED_WORDS = [
  "admin",
  "moderator",
  "administrator@onlyfocus.site", // Added your email here
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

// List of emails allowed to bypass the "email as username" and "banned word" check
const ALLOWED_EMAILS = [
  "administrator@onlyfocus.site"
];

/**
 * Checks if a string is likely an email address.
 */
export const isLikelyEmail = (input: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input);
};

/**
 * Checks if a username contains any inappropriate words or is an email.
 * Includes an exception for allowed administrator emails.
 */
export const isUsernameInappropriate = (username: string): boolean => {
  if (!username) return true;
  const lowerCaseUsername = username.toLowerCase();
  
  // Exception: If the username IS an allowed email, it's NOT inappropriate
  if (ALLOWED_EMAILS.includes(lowerCaseUsername)) {
    return false;
  }

  if (isLikelyEmail(lowerCaseUsername)) {
    return true;
  }

  return BANNED_WORDS.some(word => lowerCaseUsername.includes(word));
};

/**
 * Sanitizes a username by replacing it with a default, unique name if it is inappropriate.
 */
export const sanitizeUsername = async (userId: string, currentUsername: string): Promise<string> => {
  if (!isUsernameInappropriate(currentUsername)) {
    return currentUsername;
  }

  const newUsername = `User${Math.floor(Math.random() * 90000) + 10000}`;
  const reason = isLikelyEmail(currentUsername) ? "Your username was flagged as an email address" : "Your username was flagged as inappropriate";

  const { error } = await supabase
    .from("profiles")
    .update({ username: newUsername })
    .eq("id", userId);

  if (error) {
    console.error("Failed to sanitize and update username:", error);
    return currentUsername;
  }

  toast.warning(`${reason} and changed to "${newUsername}". Please update it in your profile settings.`);
  return newUsername;
};