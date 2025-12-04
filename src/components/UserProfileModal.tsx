import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Flame, Clock, Zap, MessageSquare, UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Database, Json } from "@/integrations/supabase/types";
import { sendFriendRequest } from "@/utils/friends";
import { getOrCreateConversation } from "@/utils/dm";
import { Progress } from "@/components/ui/progress";
import { FOCUS_CLASSES, FocusClass } from "@/hooks/useGamification";
import { getLevelThresholds } from "@/utils/session-management";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
type UserLevels = Database["public"]["Tables"]["user_levels"]["Row"];

interface UserProfileModalProps {
  userId: string; // The ID of the user to display
  currentUserId: string; // The ID of the logged-in user
  onClose: () => void;
}

// Helper function to safely extract interests data from the JSON column
const getInterestsData = (interestsJson: Json | null) => {
    const data = (interestsJson || {}) as Record<string, any>;
    const focusClass = data.focus_class as FocusClass | undefined;
    // Assume tags are stored under the 'tags' key, which should be an array
    const tags = Array.isArray(data.tags) ? data.tags as string[] : [];
    return { focusClass, tags, rawData: data };
};


const UserProfileModal = ({ userId, currentUserId, onClose }: UserProfileModalProps) => {
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [statsData, setStatsData] = useState<UserStats | null>(null);
  const [levelsData, setLevelsData] = useState<UserLevels | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'not_friend' | 'pending_sent' | 'pending_received' | 'friend'>('not_friend');
  const [isLoading, setIsLoading] = useState(true);
  
  // State to hold the raw interests data for updates
  const [currentInterestsData, setCurrentInterestsData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);

      // 1. Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        toast.error(`Failed to load user profile: ${profileError?.message || 'Unknown error'}`);
        onClose();
        return;
      }

      setProfileData(profile);
      setCurrentInterestsData((profile.interests || {}) as Record<string, any>);


      // 2. Fetch User Stats
      const { data: stats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error("Error fetching user stats:", statsError);
        toast.error(`Failed to load user stats: ${statsError.message}`);
      }
      setStatsData(stats || null);

      // 3. Fetch User Levels
      const { data: levels, error: levelsError } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (levelsError && levelsError.code !== 'PGRST116') {
        console.error("Error fetching user levels:", levelsError);
        toast.error(`Failed to load user levels: ${levelsError.message}`);
      }
      setLevelsData(levels || null);


      // 4. Check Friendship Status
      const { data: requestData, error: requestError } = await supabase
        .from("friend_requests")
        .select("sender_id, status")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
        .maybeSingle();

      if (requestError) {
        console.error("Error checking friendship status:", requestError);
        toast.error(`Failed to check friendship status: ${requestError.message}`);
      } else if (requestData) {
        if (requestData.status === 'accepted') {
          setFriendshipStatus('friend');
        } else if (requestData.status === 'pending') {
          if (requestData.sender_id === currentUserId) {
            setFriendshipStatus('pending_sent');
          } else {
            setFriendshipStatus('pending_received');
          }
        }
      } else {
        setFriendshipStatus('not_friend');
      }

      setIsLoading(false);
    };

    fetchData();
  }, [userId, currentUserId, onClose]);

  const handleSendRequest = async () => {
    const { success, error } = await sendFriendRequest(currentUserId, userId);
    if (success) {
      setFriendshipStatus('pending_sent');
    } else if (error) {
      toast.error(`Failed to send request: ${error}`);
    }
  };

  const handleStartDM = async () => {
    if (!profileData) return;
    const { conversationId, error } = await getOrCreateConversation(currentUserId, userId);
    if (conversationId) {
      toast.info("DM conversation started. Check your Social panel.");
      onClose();
      // Note: In a full app, we might navigate the user to the DM panel here.
    } else if (error) {
      toast.error(`Failed to start DM: ${error}`);
    }
  };


  const handleClassSelect = async (classId: FocusClass) => {
    if (userId !== currentUserId) return;

    // 1. Create new interests object, preserving existing data (like tags)
    const newInterests = { ...currentInterestsData, focus_class: classId };
    
    // Optimistic update
    setCurrentInterestsData(newInterests);
    setProfileData({ ...profileData!, interests: newInterests });

    const { error } = await supabase
      .from("profiles")
      .update({ interests: newInterests })
      .eq("id", userId);

    if (error) {
      toast.error(`Failed to update class: ${error.message}`);
    } else {
      toast.success(`Class updated to ${FOCUS_CLASSES.find(c => c.id === classId)?.name}!`);
    }
  };

  const renderActionButtons = () => {
    if (userId === currentUserId) {
      return <Badge variant="secondary">This is You</Badge>;
    }

    switch (friendshipStatus) {
      case 'friend':
        return (
          <div className="flex gap-2">
            <Button onClick={handleStartDM} className="flex-1 dopamine-click">
              <MessageSquare className="w-4 h-4 mr-2" /> Message
            </Button>
            {/* Remove friend functionality would go here */}
          </div>
        );
      case 'pending_sent':
        return <Button variant="outline" disabled>Request Sent <Clock className="w-4 h-4 ml-2" /></Button>;
      case 'pending_received':
        return <Button className="bg-yellow-500 hover:bg-yellow-600 text-white" disabled>Request Received (Check Social Panel)</Button>;
      case 'not_friend':
      default:
        return (
          <Button onClick={handleSendRequest} className="dopamine-click">
            <UserPlus className="w-4 h-4 mr-2" /> Add Friend
          </Button>
        );
    }
  };

  const renderStats = () => {
    const thresholds = getLevelThresholds();
    const currentXP = levelsData?.total_xp || 0;
    const currentLevel = levelsData?.level || 1;
    const nextLevel = thresholds.find(t => t.level === currentLevel + 1);
    const prevLevelXP = thresholds.find(t => t.level === currentLevel)?.xp || 0;
    const nextLevelXP = nextLevel?.xp || (prevLevelXP + 1000); // Fallback
    const progressPercent = Math.min(100, Math.max(0, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));
    
    const { focusClass: userClassId } = getInterestsData(profileData?.interests || null);
    const userClass = FOCUS_CLASSES.find(c => c.id === userClassId);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Flame} label="Longest Streak" value={`${statsData?.longest_streak || 0} days`} />
          <StatCard icon={Clock} label="Longest Session" value={`${statsData?.longest_session_minutes || 0} min`} />
          <StatCard icon={Zap} label="Total XP" value={`${levelsData?.total_xp || 0} XP`} />
          <StatCard icon={Clock} label="Total Focused" value={`${statsData?.total_focused_minutes || 0} min`} />
        </div>

        {/* XP Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lvl {currentLevel}</span>
            <span>{Math.floor(progressPercent)}% to Lvl {currentLevel + 1}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Class Selection (Only for own profile or if class is set) */}
        {(userId === currentUserId || userClass) && (
          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              Focus Class {userClass && <Badge variant="outline">{userClass.name}</Badge>}
            </h4>

            {userId === currentUserId ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FOCUS_CLASSES.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => handleClassSelect(cls.id as FocusClass)}
                    className={`
                      cursor-pointer rounded-lg p-2 border transition-all hover:bg-accent/50
                      ${userClassId === cls.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border"}
                    `}
                  >
                    <div className="text-2xl mb-1">{cls.icon}</div>
                    <div className="font-bold text-xs">{cls.name}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-1">{cls.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              userClass && (
                <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                  <div className="text-3xl">{userClass.icon}</div>
                  <div>
                    <div className="font-bold text-sm">{userClass.name}</div>
                    <div className="text-xs text-muted-foreground">{userClass.description}</div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  const renderInterests = () => {
    const { tags: interests } = getInterestsData(profileData?.interests || null);
    return (
      <div className="space-y-2">
        <h4 className="text-md font-semibold">Interests</h4>
        <div className="flex flex-wrap gap-2">
          {interests.length > 0 ? (
            interests.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No interests listed.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 border-b border-border pb-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-semibold text-white">
                  {profileData?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">{profileData?.username}</h3>
                <p className="text-md font-medium text-accent flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4" />
                  {levelsData?.title || "Novice Monk"} (Lvl {levelsData?.level || 1})
                </p>
              </div>
              {renderActionButtons()}
            </div>

            {renderStats()}

            <div className="border-t border-border pt-4">
              {renderInterests()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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

export default UserProfileModal;