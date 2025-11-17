import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Flame, Zap, Clock, Tag, Plus, X, TrendingUp, Twitter, Instagram, Github, User } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLevelThresholds } from "@/utils/session-management";
import WeeklyFocusChart from "@/components/WeeklyFocusChart";
import AnimatedSection from "@/components/AnimatedSection";
import { ScrollArea } from "@/components/ui/scroll-area";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DailyGoal = Database["public"]["Tables"]["daily_goals"]["Row"];
type WeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Row"];

const RECOMMENDED_TAGS = [
  "Programming", "Writing", "Music", "Reading", "Learning Languages", 
  "Art", "Sports", "Tech", "Science", "Math", "History", "Design"
];

const ProfilePage = () => {
  const { userId, profile, refreshProfile } = useAuth();
  const { stats, levels, isLoading: isLoadingStats, refetch } = useUserStats();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [dailyGoal, setDailyGoal] = useState(60);
  const [weeklyGoal, setWeeklyGoal] = useState(420);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  
  // Social Media States
  const [twitterHandle, setTwitterHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [githubHandle, setGithubHandle] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      if (Array.isArray(profile.interests)) {
        setInterests(profile.interests as string[]);
      } else {
        setInterests([]);
      }
      setTwitterHandle(profile.twitter_handle || "");
      setInstagramHandle(profile.instagram_handle || "");
      setGithubHandle(profile.github_handle || "");
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
    const normalizedTag = tag.trim();
    if (normalizedTag && !interests.map(t => t.toLowerCase()).includes(normalizedTag.toLowerCase())) {
      setInterests(prev => [...prev, normalizedTag]);
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

  const saveProfileAndGoals = async () => {
    if (!userId) return;
    let allSuccess = true;

    // 1. Save profile details (username, interests, social links)
    const profileUpdatePayload = { 
      username: username, 
      interests: interests as Database["public"]["Tables"]["profiles"]["Update"]["interests"],
      twitter_handle: twitterHandle || null,
      instagram_handle: instagramHandle || null,
      github_handle: githubHandle || null,
    };
    
    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdatePayload)
      .eq("id", userId);

    if (profileError) {
      console.error("Error saving profile:", profileError);
      toast.error(`Failed to save profile: ${profileError.message}`);
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
      console.error("Error saving daily goal:", dailyError);
      toast.error(`Failed to save daily goal: ${dailyError.message}`);
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
      console.error("Error saving weekly goal:", weeklyError);
      toast.error(`Failed to save weekly goal: ${weeklyError.message}`);
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
    progressPercent = 100;
  }
  // --- End Level Progression Calculation ---


  if (!userId || isLoadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const todayISO = new Date().toISOString().split("T")[0];
  const isFocusedToday = stats?.last_focused_date === todayISO;
  const currentStreak = isFocusedToday ? stats?.longest_streak || 0 : 0;

  return (
    <ScrollArea className="min-h-screen bg-background relative overflow-hidden p-4">
      <div className="container mx-auto max-w-3xl py-12">
        <AnimatedSection>
          <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            My Profile & Settings
          </h1>
        </AnimatedSection>

        <div className="space-y-8">
          {/* Section 1: Overview & Stats */}
          <AnimatedSection delay={0.1}>
            <div className="glass-card p-6 rounded-xl space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  <span className="text-3xl font-semibold text-white">
                    {username?.[0]?.toUpperCase()}
                  </span>
                </div>

                <div className="text-center">
                  <div className="font-semibold text-2xl">{username}</div>
                  <div className="text-md font-medium text-accent flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4" />
                    {levels?.title || "Novice Monk"} (Lvl {levels?.level || 1})
                  </div>
                </div>
              </div>
              
              {/* XP Progression */}
              <div className="space-y-2">
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

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Flame} label="Current Streak" value={`${currentStreak} days`} />
                <StatCard icon={Flame} label="Longest Streak" value={`${stats?.longest_streak || 0} days`} />
                <StatCard icon={Clock} label="Longest Session" value={`${stats?.longest_session_minutes || 0} min`} />
                <StatCard icon={Zap} label="Total XP" value={`${levels?.total_xp || 0} XP`} />
              </div>
            </div>
          </AnimatedSection>

          {/* Section 2: Weekly Chart */}
          <AnimatedSection delay={0.2}>
            <div className="glass-card p-6 rounded-xl">
              <WeeklyFocusChart />
            </div>
          </AnimatedSection>

          {/* Section 3: Edit Details & Goals */}
          <AnimatedSection delay={0.3}>
            <div className="glass-card p-6 rounded-xl space-y-6">
              <h2 className="text-2xl font-semibold border-b border-border pb-3">Account Details & Goals</h2>
              
              <div>
                <label className="text-sm text-muted-foreground">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>
          </AnimatedSection>

          {/* Section 4: Social Media Links */}
          <AnimatedSection delay={0.4}>
            <div className="glass-card p-6 rounded-xl space-y-6">
              <h2 className="text-2xl font-semibold border-b border-border pb-3">Social Presence</h2>
              <p className="text-sm text-muted-foreground">
                Share your handles so friends can connect with you outside OnlyFocus.
              </p>
              
              <div className="space-y-4">
                <SocialInput 
                  icon={Twitter} 
                  label="Twitter Handle" 
                  placeholder="@yourhandle" 
                  value={twitterHandle} 
                  onChange={setTwitterHandle}
                />
                <SocialInput 
                  icon={Instagram} 
                  label="Instagram Handle" 
                  placeholder="@yourhandle" 
                  value={instagramHandle} 
                  onChange={setInstagramHandle}
                />
                <SocialInput 
                  icon={Github} 
                  label="GitHub Handle" 
                  placeholder="your-username" 
                  value={githubHandle} 
                  onChange={setGithubHandle}
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Section 5: Interests/Tags */}
          <AnimatedSection delay={0.5}>
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h2 className="text-2xl font-semibold border-b border-border pb-3 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Interests (Tags)
              </h2>
              
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
          </AnimatedSection>

          {/* Final Actions */}
          <AnimatedSection delay={0.6}>
            <div className="space-y-4">
              <Button onClick={saveProfileAndGoals} className="w-full text-lg py-6 dopamine-click">
                Save All Changes
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </ScrollArea>
  );
};

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
}

const StatCard = ({ icon: Icon, label, value }: StatCardProps) => (
    <div className="glass-card p-3 rounded-lg flex flex-col items-center text-center">
        <Icon className="w-5 h-5 text-primary mb-1" />
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
    </div>
);

interface SocialInputProps {
  icon: React.ElementType;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const SocialInput = ({ icon: Icon, label, placeholder, value, onChange }: SocialInputProps) => (
  <div>
    <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4" />
      {label}
    </label>
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export default ProfilePage;