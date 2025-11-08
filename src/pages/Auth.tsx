import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username.trim())
        .maybeSingle();

      if (existingProfile) {
        // Login - just store in session
        localStorage.setItem("userId", existingProfile.id);
        localStorage.setItem("username", existingProfile.username);
        toast.success(`Welcome back, ${username}!`);
        navigate("/focus-room");
      } else {
        // Signup - create new profile
        const { data: newProfile, error } = await supabase
          .from("profiles")
          .insert({ username: username.trim() })
          .select()
          .single();

        if (error) throw error;

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
      {/* Animated background particles */}
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

      <div className="relative z-10 glass-card p-8 rounded-3xl shadow-glow max-w-md w-full mx-4 animate-scale-in">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          OnlyFocus
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Enter your username to continue
        </p>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAuth()}
            className="h-12 text-lg"
          />

          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all"
          >
            {loading ? "Loading..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
