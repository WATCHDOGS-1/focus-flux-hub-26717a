"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeUsername } from "@/utils/moderation";

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
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        const sanitizedUsername = await sanitizeUsername(id, data.username);
        setProfile({ ...data, username: sanitizedUsername });
      } else {
        // Profile doesn't exist - attempt to create it (self-healing)
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const emailPrefix = userData.user.email?.split('@')[0] || `user_${id.slice(0, 5)}`;
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({ id, username: emailPrefix })
            .select()
            .single();
          
          if (!insertError && newProfile) {
            setProfile(newProfile);
          }
        }
      }
    } catch (e) {
      console.error("Profile fetch/create failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUserId(session.user.id);
          await fetchProfile(session.user.id);
        } else {
          setUserId(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
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