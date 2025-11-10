import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async () => {
      // This component is hit after the OAuth provider redirects back.
      // Supabase automatically handles the session exchange in the background.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
        toast.error("Authentication failed. Please try again.");
        navigate("/auth");
        return;
      }

      if (session) {
        // We don't need to call handleAuthSuccess here, as the session is already set.
        // We just need to redirect the user to the focus room.
        navigate("/focus-room", { replace: true });
      } else {
        // If no session, redirect back to auth page
        navigate("/auth", { replace: true });
      }
    };

    handleSession();
  }, [navigate]);

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