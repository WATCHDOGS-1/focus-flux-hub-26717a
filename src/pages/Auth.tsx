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
      // 1. Get a secure anonymous session from Supabase
      const { data: { user }, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;
      if (!user) throw new Error("Authentication failed.");

      // 2. Check if this user already has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .single();

      if (profile && !profileError) {
        // Profile exists, welcome them back
        localStorage.setItem("userId", profile.id);
        localStorage.setItem("username", profile.username);
        toast.success(`Welcome back, ${profile.username}!`);
        navigate("/focus-room");
      } else {
        // No profile exists, so create one
        // First, check if the desired username is already taken
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.trim())
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
          toast.error("Username is already taken. Please choose another.");
          return;
        }

        // Username is available, create the new profile
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user.id, username: username.trim() })
          .select()
          .single();

        if (insertError) throw insertError;

        localStorage.setItem("userId", newProfile.id);
        localStorage.setItem("username", newProfile.username);
        toast.success(`Account created! Welcome, ${newProfile.username}!`);
        navigate("/focus-room");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
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
        <h1 className="text-4xl font-bold text-center mb-2 text-foreground">
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
            className="w-full h-12 text-lg bg-primary hover:scale-105 transition-all"
          >
            {loading ? "Loading..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;