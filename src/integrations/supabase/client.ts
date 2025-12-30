import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Log the values to the console for debugging
console.log("Supabase URL from .env:", SUPABASE_URL);
console.log("Supabase Publishable Key from .env (last 4 chars):", SUPABASE_PUBLISHABLE_KEY ? SUPABASE_PUBLISHABLE_KEY.slice(-4) : "N/A");

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// NOTE: For JWT to expire in 7 days, the Supabase project setting (Auth -> Settings -> JWT Settings) 
// must have 'Refresh Token Lifetime' set to 604800 seconds (7 days).
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});