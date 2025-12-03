import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, Zap, Tag, Clock, Plus, Image, Edit, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import CreatePostModal from "./CreatePostModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import CloudinaryImage from "./CloudinaryImage"; // Import CloudinaryImage

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type FeedItemRaw = Database["public"]["Tables"]["feed_items"]["Row"] & {
  feed_applauds: { count: number }[];
};

type FeedItemWithProfile = FeedItemRaw & {
  profiles: Pick<Profile, 'username' | 'profile_photo_url'> | null;
};

interface PostData {
    caption: string;
    imageUrl: string | null;
}

const FocusFeed = () => {
  const { userId } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItemWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedItemRaw | null>(null);

  // Temporarily disable feed functionality and show coming soon message
  return (
    <div className="text-center py-20 space-y-4 glass-card p-8 rounded-xl">
      <Zap className="w-12 h-12 text-primary mx-auto" />
      <h3 className="text-2xl font-bold">Focus Feed: Coming Soon</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        We are currently optimizing the real-time feed infrastructure. Check back soon to see the latest achievements and posts from your friends!
      </p>
    </div>
  );

  /*
  // Original logic (commented out for now)
  const loadFeed = async () => {
    setIsLoading(true);
    
    // 1. Fetch raw feed items and applauds
    const { data: rawData, error } = await supabase
      .from("feed_items")
      .select(`
        *,
        feed_applauds (count)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading feed:", error);
      toast.error(`Failed to load focus feed: ${error.message}`);
      setIsLoading(false);
      return;
    }

    if (rawData) {
      const rawItems = rawData as FeedItemRaw[];
      const userIds = Array.from(new Set(rawItems.map(item => item.user_id)));
      
      // 2. Fetch all required profiles separately (including profile_photo_url)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, profile_photo_url")
        .in("id", userIds);
        
      const profileMap = new Map(profilesData?.map(p => [p.id, p]));

      // 3. Map profiles back onto feed items
      const itemsWithProfiles: FeedItemWithProfile[] = rawItems.map(item => ({
        ...item,
        profiles: profileMap.get(item.user_id) || { username: "Unknown User", profile_photo_url: null },
      }));
      
      setFeedItems(itemsWithProfiles);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel("focus_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_items" },
        () => loadFeed()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "feed_items" },
        () => loadFeed()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_applauds" },
        () => loadFeed() // Reload on applaud to update counts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApplaud = async (feedItemId: string) => {
    if (!userId) return;

    // 1. Check if user has already applauded (DB check)
    const { data: existing } = await supabase
      .from("feed_applauds")
      .select("id")
      .eq("feed_item_id", feedItemId)
      .eq("user_id", userId)
      .maybeSingle();

    let isApplauding = !existing;

    // 2. Optimistic UI update
    setFeedItems(prevItems => prevItems.map(item => {
        if (item.id === feedItemId) {
            const currentCount = item.feed_applauds[0]?.count || 0;
            const newCount = isApplauding ? currentCount + 1 : Math.max(0, currentCount - 1);
            
            // Update the count optimistically
            return {
                ...item,
                feed_applauds: [{ count: newCount }],
            };
        }
        return item;
    }));

    // 3. Perform DB operation
    if (existing) {
      // Un-applaud
      const { error } = await supabase.from("feed_applauds").delete().eq("id", existing.id);
      if (error) {
        toast.error(`Failed to remove applaud: ${error.message}`);
        loadFeed(); 
        return;
      }
    } else {
      // Applaud
      const { error } = await supabase.from("feed_applauds").insert({ feed_item_id: feedItemId, user_id: userId });
      if (error) {
        toast.error(`Failed to applaud: ${error.message}`);
        loadFeed(); 
        return;
      }
    }
    
    // 4. Trigger full reload after a short delay to ensure consistency via Realtime/DB fetch
    setTimeout(loadFeed, 500);
  };
  
  const handleEditPost = (post: FeedItemRaw) => {
      setEditingPost(post);
      setIsModalOpen(true);
  };
  
  const handleDeletePost = async (postId: string) => {
      if (!window.confirm("Are you sure you want to delete this post?")) return;
      
      const { error } = await supabase
          .from("feed_items")
          .delete()
          .eq("id", postId)
          .eq("user_id", userId); // Ensure only owner can delete

      if (error) {
          toast.error(`Failed to delete post: ${error.message}`);
      } else {
          toast.success("Post deleted.");
          loadFeed();
      }
  };

  const renderAvatar = (profile: Pick<Profile, 'username' | 'profile_photo_url'> | null) => {
      const username = profile?.username || "U";
      const photoUrl = profile?.profile_photo_url;
      
      if (photoUrl) {
          return (
              <img 
                  src={photoUrl} 
                  alt={username} 
                  className="w-10 h-10 rounded-full object-cover"
              />
          );
      }
      
      return (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-white">
                  {username[0]?.toUpperCase()}
              </span>
          </div>
      );
  };

  const renderFeedItem = (item: FeedItemWithProfile) => {
    const { id, type, data, profiles, created_at, user_id } = item;
    const username = profiles?.username || "A user";
    const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });
    const isCurrentUser = user_id === userId;

    let content;
    
    const postData = data as PostData;

    if (type === "session_completed" && typeof data === 'object' && data && 'duration' in data) {
      const duration = data.duration as number;
      const tag = data.tag as string | undefined;
      
      content = (
        <>
          <p>
            <span className="font-bold">{username}</span> just completed a{" "}
            <span className="font-bold text-primary">{duration}-minute</span> focus session!
          </p>
          {tag && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="w-4 h-4" />
              <span>{tag}</span>
            </div>
          )}
        </>
      );
    } else if (type === "user_post" && postData) {
        content = (
            <>
                <p className="text-base">{postData.caption}</p>
                {postData.imageUrl && (
                    <div className="mt-3 w-full max-h-60 rounded-lg overflow-hidden">
                        // Use CloudinaryImage for optimized display
                        <CloudinaryImage 
                            publicIdOrUrl={postData.imageUrl} 
                            width={600} 
                            height={240} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </>
        );
    } else {
      content = <p>An unknown activity was completed.</p>;
    }

    // Access count from the aggregated array
    const applaudCount = item.feed_applauds[0]?.count || 0;

    return (
      <Card key={id} className="glass-card hover-lift">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {renderAvatar(profiles)}
            
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{username}</span>
                    {isCurrentUser && type === 'user_post' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-6 h-6">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card">
                                <DropdownMenuItem onClick={() => handleEditPost(item)}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit Post
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeletePost(id)} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                
                <div className={cn("text-sm", type === 'session_completed' ? 'bg-secondary/20 p-3 rounded-lg' : '')}>
                    {content}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo}
                    </span>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 dopamine-click" onClick={() => handleApplaud(id)}>
                      <ThumbsUp className="w-4 h-4" />
                      {applaudCount}
                    </Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading feed...</div>;
  }

  return (
    <div className="space-y-4">
        {userId && (
            <Card className="glass-card p-4">
                <Button 
                    onClick={() => { setEditingPost(null); setIsModalOpen(true); }}
                    className="w-full flex items-center gap-2 dopamine-click"
                >
                    <Plus className="w-4 h-4" /> Create Focus Post
                </Button>
            </Card>
        )}
        
        <CreatePostModal
            userId={userId!}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onPostCreated={loadFeed}
            editingPost={editingPost}
        />

      {feedItems.length > 0 ? (
        feedItems.map(renderFeedItem)
      ) : (
        <p className="text-center py-8 text-muted-foreground">The feed is empty. Complete a focus session or create a post to get started!</p>
      )}
    </div>
  );
  */
};

export default FocusFeed;