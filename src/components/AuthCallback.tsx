import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // This component is hit after the OAuth provider redirects back.
    // Supabase automatically handles the session exchange in the background.
    
    // We wait for the AuthProvider to finish loading and check authentication status.
    if (!isLoading) {
      if (isAuthenticated) {
        // Session is confirmed and profile is loading/loaded by AuthProvider
        navigate("/focus-room", { replace: true });
      } else {
        // If no session, redirect back to auth page
        navigate("/auth", { replace: true });
      }
    }
  }, [navigate, isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="text-2xl font-semibold text-primary animate-pulse">
          Processing login...
        </div>
        <p className="text-muted-foreground">Please wait while we secure your session.</p>
      </div>
    </div>
  );
};

export default AuthCallback;