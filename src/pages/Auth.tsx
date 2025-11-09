import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleIcon from "@/components/icons/GoogleIcon";
import DiscordIcon from "@/components/icons/DiscordIcon"; // Import DiscordIcon

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // This function is now only responsible for ensuring the profile exists/is updated
  // after a successful login event (either here or via redirect).
  const handleAuthSuccess = async (userId: string, defaultUsername?: string, discordUserId?: string) => {
    const usernameToSet = defaultUsername || `User${userId.slice(0, 6)}`;
    
    const updateData: { id: string; username: string; discord_user_id?: string } = { 
      id: userId, // CRITICAL: Must match auth.users.id
      username: usernameToSet,
    };
    if (discordUserId) {
      updateData.discord_user_id = discordUserId; 
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(updateData, { onConflict: 'id' });

    if (upsertError) {
      console.error("Error upserting profile:", upsertError);
      toast.error("Failed to set up user profile.");
      return;
    }
    
    // Navigate to focus room after profile is confirmed/created
    navigate("/focus-room");
  };

  const handleSignIn = async (provider: 'google' | 'discord') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/focus-room`
        }
      });
      if (error) throw error;
      
      // Note: For OAuth, the user is redirected, and FocusRoom handles the session check.
      // We don't need to call handleAuthSuccess here as the redirect handles it.
    } catch (error: any) {
      toast.error(error.message || `${provider} sign in failed`);
      setLoading(false);
    }
  };

  // CRITICAL: Handle session check on mount for redirects (e.g., after OAuth callback)
  // This ensures that if the user lands here after a successful OAuth redirect, they are processed.
  useEffect(() => {
    const checkAndHandleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        const discordUserId = user.user_metadata?.provider_id;
        // If session exists, ensure profile is set up and redirect
        await handleAuthSuccess(user.id, user.user_metadata?.full_name || user.user_metadata?.name, discordUserId);
      } else {
        setLoading(false); // Ensure loading is false if no session is found
      }
    };
    // Set loading true initially to prevent flicker while checking session
    setLoading(true); 
    checkAndHandleSession();
  }, []);


  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <Card className="w-[400px] z-10 glass-card shadow-glow">
        <CardHeader className="text-center">
          <CardTitle>Welcome to OnlyFocus</CardTitle>
          <CardDescription>Sign in or create an account to join the focus room.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 dopamine-click shadow-glow"
            onClick={() => handleSignIn('google')}
            disabled={loading}
          >
            <GoogleIcon className="w-5 h-5" />
            {loading ? "Checking Session..." : "Continue with Google"}
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 dopamine-click shadow-glow"
            onClick={() => handleSignIn('discord')}
            disabled={loading}
          >
            <DiscordIcon className="w-5 h-5" />
            {loading ? "Checking Session..." : "Continue with Discord"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;