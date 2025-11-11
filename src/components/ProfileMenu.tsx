import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Flame, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DailyGoal = Database["public"]["Tables"]["daily_goals"]["Row"];
type WeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Row"];

const ProfileMenu = () => {
  const { userId, profile, refreshProfile } = useAuth();
  const { stats, levels, isLoading: isLoadingStats, refetch } = useUserStats();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [dailyGoal, setDailyGoal] = useState(60);
  const [weeklyGoal, setWeeklyGoal] = useState(420);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
    }
    if (userId) {
      loadGoals(userId);
    }
  }, [profile, userId]);

  const loadGoals = async (uid: string) => {
    // Load daily goal
    const { data: daily, error: dailyError } = await supabase
      .from("daily_goals")
      .select("target_minutes")
      .eq("user_id", uid)
      .maybeSingle();

    if (!dailyError && daily) setDailyGoal(daily.target_minutes);
    else if (dailyError && dailyError.code !== 'PGRST116') console.error("Error loading daily goal:", dailyError);

    // Load weekly goal
    const { data: weekly, error: weeklyError } = await supabase
      .from("weekly_goals")
      .select("target_minutes")
      .eq("user_id", uid)
      .maybeSingle();

    if (!weeklyError && weekly) setWeeklyGoal(weekly.target_minutes);
    else if (weeklyError && weeklyError.code !== 'PGRST116') console.error("Error loading weekly goal:", weeklyError);
  };

  const saveProfileAndGoals = async () => {
    if (!userId) return;
    let hasError = false;

    // Save username
    const { error: usernameError } = await supabase
      .from("profiles")
      .update({ username: username })
      .eq("id", userId);

    if (usernameError) {
      console.error("Error saving username:", usernameError);
      toast.error("Failed to save username");
      hasError = true;
    } else {
      refreshProfile(); // Update global context
    }

    // Save daily goal
    const { error: dailyError } = await supabase
      .from("daily_goals")
      .upsert({ user_id: userId, target_minutes: dailyGoal, date: new Date().toISOString().split("T")[0] }, { onConflict: 'user_id,date' });

    if (dailyError) {
      console.error("Error saving daily goal:", dailyError);
      toast.error("Failed to save daily goal");
      hasError = true;
    }

    // Save weekly goal
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { error: weeklyError } = await supabase
      .from("weekly_goals")
      .upsert({ user_id: userId, target_minutes: weeklyGoal, week_start: weekStart.toISOString() }, { onConflict: 'user_id,week_start' });

    if (weeklyError) {
      console.error("Error saving weekly goal:", weeklyError);
      toast.error("Failed to save weekly goal");
      hasError = true;
    }

    if (!hasError) {
      toast.success("Profile and goals updated!");
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed. Please try again.");
    } else {
      navigate("/auth");
    }
  };

  if (!userId || isLoadingStats) {
    return <div className="text-center py-8 text-muted-foreground">Loading profile...</div>;
  }

  const todayISO = new Date().toISOString().split("T")[0];
  const isFocusedToday = stats?.last_focused_date === todayISO;
  const currentStreak = isFocusedToday ? stats?.longest_streak || 0 : 0;

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4">Profile & Stats</h3>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            <span className="text-3xl font-semibold text-white">
              {username?.[0]?.toUpperCase()}
            </span>
          </div>

          <div className="text-center">
            <div className="font-semibold text-lg">{username}</div>
            <div className="text-sm font-medium text-accent flex items-center justify-center gap-1">
              <Zap className="w-4 h-4" />
              {levels?.title || "Novice Monk"} (Lvl {levels?.level || 1})
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="glass-card p-4 rounded-xl space-y-3">
            <h4 className="text-md font-semibold border-b border-border pb-2 mb-2">Stats</h4>
            
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-red-500' : 'text-gray-500'}`} />
                    Current Streak
                </span>
                <span className="font-bold">{currentStreak} days</span>
            </div>
            
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Flame className="w-4 h-4 text-primary/50" />
                    Longest Streak
                </span>
                <span className="font-bold">{stats?.longest_streak || 0} days</span>
            </div>
            
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary/50" />
                    Longest Session
                </span>
                <span className="font-bold">{stats?.longest_session_minutes || 0} min</span>
            </div>
            
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Total XP
                </span>
                <span className="font-bold">{levels?.total_xp || 0} XP</span>
            </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Daily Goal (minutes)</label>
            <Input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Weekly Goal (minutes)</label>
            <Input
              type="number"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Number(e.target.value))}
            />
          </div>

          <Button onClick={saveProfileAndGoals} className="w-full">
            Save Profile & Goals
          </Button>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default ProfileMenu;