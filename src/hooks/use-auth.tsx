import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeUsername } from "@/utils/moderation"; // Import moderation utility

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  userId: string | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error(`Failed to load user profile: ${error.message}`);
      setProfile(null);
    } else {
      // --- Moderation Check ---
      const sanitizedUsername = await sanitizeUsername(id, data.username);
      
      const finalProfile: Profile = {
        ...data,
        username: sanitizedUsername,
      };
      setProfile(finalProfile);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUserId(session.user.id);
          fetchProfile(session.user.id);
        } else {
          setUserId(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (userId) {
      await fetchProfile(userId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        profile,
        isLoading,
        isAuthenticated: !!userId,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};