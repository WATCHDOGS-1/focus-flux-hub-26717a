import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { User } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Auth = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setLoading(true);
    try {
      // Check if profile exists
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username.trim())
        .maybeSingle();

      if (selectError) throw selectError;

      if (existingProfile) {
        // Login - just store in session
        localStorage.setItem("userId", existingProfile.id);
        localStorage.setItem("username", existingProfile.username);
        toast.success(`Welcome back, ${username}!`);
        navigate("/focus-room");
      } else {
        // Signup - create new profile
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ username: username.trim() })
          .select()
          .single();

        if (insertError) throw insertError;

        localStorage.setItem("userId", newProfile.id);
        localStorage.setItem("username", newProfile.username);
        toast.success(`Account created! Welcome, ${username}!`);
        navigate("/focus-room");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden flex items-center justify-center">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 glass-card p-8 rounded-2xl shadow-glow max-w-md w-full mx-4 animate-scale-in">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="text-primary" size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            OnlyFocus
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your username to continue
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAuth()}
              className="h-12 text-base"
            />
          </div>

          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Loading...
              </span>
            ) : (
              "Continue to Focus"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;