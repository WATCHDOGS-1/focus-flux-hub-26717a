import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Upload, User, Award, Target, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DailyGoal = Database["public"]["Tables"]["daily_goals"]["Row"];
type WeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Row"];

interface ProfileMenuProps {
  userId: string;
  onNavigateToPanel: (panel: string) => void;
}

const ProfileMenu = ({ userId, onNavigateToPanel }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [dailyGoal, setDailyGoal] = useState(60);
  const [weeklyGoal, setWeeklyGoal] = useState(420);

  useEffect(() => {
    loadProfileAndGoals();
  }, [userId]);

  const loadProfileAndGoals = async () => {
    // Load profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("username, profile_photo_url, bio, interests, social_links")
      .eq("id", userId)
      .single();

    if (!profileError && profileData) {
      setUsername(profileData.username);
      setAvatarUrl(profileData.profile_photo_url);
      setBio(profileData.bio || "");
      setInterests(profileData.interests || []);
      setSocialLinks((profileData.social_links as Record<string, string>) || {});
    } else {
      console.error("Error loading profile:", profileError);
      toast.error("Failed to load profile data.");
    }

    // Load daily goal
    const { data: daily, error: dailyError } = await supabase
      .from("daily_goals")
      .select("target_minutes")
      .eq("user_id", userId)
      .maybeSingle();

    if (!dailyError && daily) setDailyGoal(daily.target_minutes);
    else if (dailyError && dailyError.code !== 'PGRST116') console.error("Error loading daily goal:", dailyError);

    // Load weekly goal
    const { data: weekly, error: weeklyError } = await supabase
      .from("weekly_goals")
      .select("target_minutes")
      .eq("user_id", userId)
      .maybeSingle();

    if (!weeklyError && weekly) setWeeklyGoal(weekly.target_minutes);
    else if (weeklyError && weeklyError.code !== 'PGRST116') console.error("Error loading weekly goal:", weeklyError);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Failed to upload avatar");
      return;
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(fileName);

    const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // Add timestamp to bust cache

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_photo_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      toast.error("Failed to update profile");
    } else {
      setAvatarUrl(publicUrl);
      toast.success("Avatar updated! 🎉", {
        duration: 3000,
      });
    }
  };

  const saveProfileAndGoals = async () => {
    let hasError = false;

    // Save profile details
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        username: username,
        bio: bio,
        interests: interests,
        social_links: socialLinks,
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("Error saving profile details:", profileUpdateError);
      toast.error("Failed to save profile details");
      hasError = true;
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

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4">Profile</h3>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold">
                {username?.[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </span>
            </Button>
          </label>

          <div className="text-center">
            <div className="font-semibold text-lg">{username}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Interests (comma-separated)</Label>
            <Input
              type="text"
              value={interests.join(", ")}
              onChange={(e) => setInterests(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              placeholder="e.g., coding, reading, music"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Social Link (e.g., Twitter URL)</Label>
            <Input
              type="url"
              value={socialLinks.twitter || ""}
              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Daily Goal (minutes)</Label>
            <Input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
            />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Weekly Goal (minutes)</Label>
            <Input
              type="number"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Number(e.target.value))}
            />
          </div>

          <Button onClick={saveProfileAndGoals} className="w-full dopamine-click">
            Save Profile & Goals
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t border-border/50">
            <Button variant="ghost" className="w-full justify-start dopamine-click" onClick={() => onNavigateToPanel("friends")}>
                <Users className="w-4 h-4 mr-2" /> My Friends
            </Button>
            <Button variant="ghost" className="w-full justify-start dopamine-click" onClick={() => onNavigateToPanel("achievements")}>
                <Award className="w-4 h-4 mr-2" /> My Achievements
            </Button>
            <Button variant="ghost" className="w-full justify-start dopamine-click" onClick={() => onNavigateToPanel("challenges")}>
                <Target className="w-4 h-4 mr-2" /> Community Challenges
            </Button>
        </div>

        <Button
          variant="destructive"
          className="w-full dopamine-click"
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