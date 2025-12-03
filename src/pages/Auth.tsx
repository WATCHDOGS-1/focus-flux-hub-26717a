import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleIcon from "@/components/icons/GoogleIcon";
import DiscordIcon from "@/components/icons/DiscordIcon";

const Auth = () => {
  const { isAuthenticated, isLoading, userId } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/explore", { replace: true }); // Redirect to /explore instead of /focus-room
    }
    setRedirectUrl(window.location.origin);
  }, [isLoading, isAuthenticated, navigate]);

  // The profile upsert logic is now handled by a Supabase trigger or the AuthProvider's initial setup.
  // We only need to initiate the OAuth flow.

  const handleSignIn = async (provider: 'google' | 'discord') => {
    if (!redirectUrl) return;
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${redirectUrl}/auth/callback`,
          // Requesting user data for profile creation/update
          scopes: provider === 'discord' ? 'identify email' : undefined,
        }
      });
      if (error) throw error;
      
      // If the sign-in happens without a redirect (e.g., already logged in), the AuthProvider handles it.
    } catch (error: any) {
      toast.error(error.message || `${provider} sign in failed`);
      setAuthLoading(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
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

      <Card className="w-full max-w-sm z-10 glass-card shadow-glow">
        <CardHeader className="text-center">
          <CardTitle>Welcome to OnlyFocus</CardTitle>
          <CardDescription>Sign in or create an account to join the focus room.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 dopamine-click shadow-glow"
            onClick={() => handleSignIn('google')}
            disabled={authLoading || !redirectUrl}
          >
            <GoogleIcon className="w-5 h-5" />
            {authLoading && userId ? "Redirecting..." : "Continue with Google"}
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 dopamine-click shadow-glow"
            onClick={() => handleSignIn('discord')}
            disabled={authLoading || !redirectUrl}
          >
            <DiscordIcon className="w-5 h-5" />
            {authLoading && userId ? "Redirecting..." : "Continue with Discord"}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground pt-2">
            By continuing, you agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;