import { useState } from "react";
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

  const handleAuthSuccess = async (userId: string, defaultUsername?: string, discordUserId?: string) => {
    // Ensure a profile exists for the user
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching profile:", fetchError);
      toast.error("Failed to load profile data.");
      return;
    }

    if (!existingProfile || !existingProfile.username || discordUserId) {
      // If no profile or no username, create/update with a default
      // Also update if discordUserId is provided (meaning a Discord login)
      const usernameToSet = defaultUsername || `User${userId.slice(0, 6)}`;
      const updateData: { id: string; username: string; discord_user_id?: string } = { 
        id: userId,
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
    }
    navigate("/focus-room");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/focus-room` // Reverted redirect URL
        }
      });
      if (error) throw error;
      
      // OAuth will redirect, so no user data is immediately available
    } catch (error: any) {
      toast.error(error.message || "Google sign in failed");
      setLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/focus-room` // Reverted redirect URL
        }
      });
      if (error) throw error;

      // OAuth will redirect, so no user data is immediately available
    } catch (error: any) {
      toast.error(error.message || "Discord sign in failed");
      setLoading(false);
    }
  };

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
        <CardContent className="space-y-4"> {/* Added space-y-4 for spacing between buttons */}
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 dopamine-click shadow-glow"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon className="w-5 h-5" />
            {loading ? "Signing In..." : "Continue with Google"}
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 dopamine-click shadow-glow"
            onClick={handleDiscordSignIn}
            disabled={loading}
          >
            <DiscordIcon className="w-5 h-5" />
            {loading ? "Signing In..." : "Continue with Discord"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;