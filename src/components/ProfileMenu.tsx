import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Flame, Zap, Clock, Tag, Plus, X, TrendingUp, Camera, User } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLevelThresholds } from "@/utils/session-management";
import WeeklyFocusChart from "./WeeklyFocusChart"; // Import the new chart

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DailyGoal = Database["public"]["Tables"]["daily_goals"]["Row"];
type WeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Row"];

const RECOMMENDED_TAGS = [
  "Programming", "Writing", "Music", "Reading", "Movies", "Learning Languages", 
  "Food", "Anime", "Art", "TV series", "Sports", "Culture", "Dance", "Tech"
];

const ProfileMenu = () => {
  const { userId, profile, refreshProfile } = useAuth();
  const { stats, levels, isLoading: isLoadingStats, refetch } = useUserStats();
  const { isUploading, uploadFile } = useImageUpload('avatars');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [dailyGoal, setDailyGoal] = useState(60);
  const [weeklyGoal, setWeeklyGoal] = useState(420);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setProfilePhotoUrl(profile.profile_photo_url);
      // Ensure interests are treated as string[]
      if (Array.isArray(profile.interests)) {
        setInterests(profile.interests as string[]);
      } else {
        setInterests([]);
      }
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

  const addInterest = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !interests.map(t => t.toLowerCase()).includes(normalizedTag)) {
      setInterests(prev => [...prev, tag.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (tagToRemove: string) => {
    setInterests(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleNewInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest(newInterest);
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size must be less than 5MB.");
      return;
    }

    const filePath = `${userId}/${Date.now()}_profile.jpg`;
    const { url, error } = await uploadFile(file, filePath);

    if (url) {
      setProfilePhotoUrl(url);
      toast.success("Profile picture uploaded! Click 'Save Profile' to confirm.");
    }
  };

  const saveProfileAndGoals = async () => {
    if (!userId) return;
    let allSuccess = true;

    // 1. Save username, interests, and profile photo URL
    const profileUpdatePayload = { 
      username: username, 
      interests: interests as Database["public"]["Tables"]["profiles"]["Update"]["interests"],
      profile_photo_url: profilePhotoUrl,
    };
    
    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdatePayload)
      .eq("id", userId);

    if (profileError) {
      const errorMsg = `Failed to save profile (username/interests/photo): ${profileError.message}`;
      console.error(errorMsg, profileError);
      toast.error(errorMsg); // Display detailed error
      allSuccess = false;
    } else {
      await refreshProfile(); // Update global context immediately
    }

    // 2. Save daily goal (using upsert)
    const today = new Date().toISOString().split("T")[0];
    const { error: dailyError } = await supabase
      .from("daily_goals")
      .upsert({ user_id: userId, target_minutes: dailyGoal, date: today }, { onConflict: 'user_id,date' });

    if (dailyError) {
      const errorMsg = `Failed to save daily goal: ${dailyError.message}`;
      console.error(errorMsg, dailyError);
      toast.error(errorMsg); // Display detailed error
      allSuccess = false;
    }

    // 3. Save weekly goal (using upsert)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { error: weeklyError } = await supabase
      .from("weekly_goals")
      .upsert({ user_id: userId, target_minutes: weeklyGoal, week_start: weekStart.toISOString() }, { onConflict: 'user_id,week_start' });

    if (weeklyError) {
      const errorMsg = `Failed to save weekly goal: ${weeklyError.message}`;
      console.error(errorMsg, weeklyError);
      toast.error(errorMsg); // Display detailed error
      allSuccess = false;
    }

    if (allSuccess) {
      toast.success("Profile and goals updated successfully!");
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

  // --- Level Progression Calculation ---
  const LEVEL_THRESHOLDS = getLevelThresholds();
  const currentXP = levels?.total_xp || 0;
  const currentLevel = levels?.level || 1;
  
  const nextLevelData = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  let progressPercent = 0;
  let xpToNextLevel = 0;
  let currentLevelXPBase = 0;

  if (nextLevelData) {
    currentLevelXPBase = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)?.xp || 0;
    const nextLevelXP = nextLevelData.xp;
    
    const xpInCurrentLevel = currentXP - currentLevelXPBase;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXPBase;
    
    xpToNextLevel = xpNeededForNextLevel - xpInCurrentLevel;
    progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  } else {
    // Max level reached
    progressPercent = 100;
  }
  // --- End Level Progression Calculation ---


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
          {/* Profile Picture Upload Area */}
          <div className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Zap className="w-6 h-6 animate-pulse text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          <div className="text-center">
            <div className="font-semibold text-lg">{username}</div>
            <div className="text-sm font-medium text-accent flex items-center justify-center gap-1">
              <Zap className="w-4 h-4" />
              {levels?.title || "Novice Monk"} (Lvl {levels?.level || 1})
            </div>
          </div>
        </div>
        
        {/* XP Progression */}
        <div className="glass-card p-4 rounded-xl space-y-2">
            <h4 className="text-md font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                XP Progression
            </h4>
            <div className="text-sm text-muted-foreground flex justify-between">
                <span>Level {currentLevel}</span>
                <span>{nextLevelData ? `Next: Lvl ${nextLevelData.level}` : 'Max Level!'}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
                {nextLevelData ? `${Math.max(0, xpToNextLevel)} XP until next level` : 'You are a Chrono Emperor!'}
            </p>
        </div>

        {/* Weekly Focus Chart */}
        <div className="glass-card p-4 rounded-xl">
            <WeeklyFocusChart />
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
                </span >
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

        {/* Interests/Tags Section */}
        <div className="space-y-4 glass-card p-4 rounded-xl">
          <h4 className="text-md font-semibold border-b border-border pb-2 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Interests (Tags)
          </h4>
          
          <p className="text-sm text-muted-foreground">
            Add tags to help others find you for co-working sessions.
          </p>

          {/* Current Tags */}
          <div className="flex flex-wrap gap-2 min-h-[30px]">
            {interests.map(tag => (
              <Badge key={tag} variant="secondary" className="pr-1 cursor-pointer dopamine-click">
                {tag}
                <X className="w-3 h-3 ml-1 text-muted-foreground hover:text-destructive" onClick={() => removeInterest(tag)} />
              </Badge>
            ))}
          </div>

          {/* Add New Tag Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={handleNewInterestKeyDown}
              placeholder="Add a custom interest tag..."
              className="flex-1"
            />
            <Button size="icon" onClick={() => addInterest(newInterest)} disabled={!newInterest.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Recommended Tags */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground w-full mb-1">Recommendations:</p>
            {RECOMMENDED_TAGS.filter(tag => !interests.map(t => t.toLowerCase()).includes(tag.toLowerCase())).map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="cursor-pointer hover:bg-secondary/50 dopamine-click"
                onClick={() => addInterest(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Goals Section */}
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

          <Button onClick={saveProfileAndGoals} className="w-full" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Save Profile & Goals"}
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