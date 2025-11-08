import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DailyGoal = Database["public"]["Tables"]["daily_goals"]["Row"];
type WeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Row"];

interface ProfileMenuProps {
  userId: string;
}

const ProfileMenu = ({ userId }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [weeklyGoal, setWeeklyGoal] = useState(420);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadProfile();
    loadGoals();
  }, []);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, profile_photo_url")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setUsername(data.username);
      setAvatarUrl(data.profile_photo_url);
    }
  };

  const loadGoals = async () => {
    const { data: daily, error: dailyError } = await supabase
      .from("daily_goals")
      .select("target_minutes")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: weekly, error: weeklyError } = await supabase
      .from("weekly_goals")
      .select("target_minutes")
      .eq("user_id", userId)
      .maybeSingle();

    if (!dailyError && daily) setDailyGoal(daily.target_minutes);
    if (!weeklyError && weekly) setWeeklyGoal(weekly.target_minutes);
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

    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

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

  const saveGoals = async () => {
    const { error: dailyError } = await supabase
      .from("daily_goals")
      .upsert({ user_id: userId, target_minutes: dailyGoal, date: new Date().toISOString().split("T")[0] });

    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const { error: weeklyError } = await supabase
      .from("weekly_goals")
      .upsert({ user_id: userId, target_minutes: weeklyGoal, week_start: weekStart.toISOString() });

    if (dailyError || weeklyError) {
      toast.error("Failed to save goals");
    } else {
      toast.success("Goals updated!");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed.");
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    } else {
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      navigate("/auth");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4">Profile</h3>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold">
                {username[0]?.toUpperCase()}
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

          <Button onClick={saveGoals} className="w-full">
            Save Goals
          </Button>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default ProfileMenu;