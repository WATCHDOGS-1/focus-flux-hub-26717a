import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, Zap, Tag, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type FeedItemRaw = Database["public"]["Tables"]["feed_items"]["Row"] & {
  feed_applauds: { count: number }[];
};

type FeedItemWithProfile = FeedItemRaw & {
  profiles: { username: string } | null;
};

const FocusFeed = () => {
  const { userId } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItemWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeed = async () => {
    setIsLoading(true);
    
    // 1. Fetch raw feed items and applauds (excluding profiles join to bypass schema cache issue)
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
      
      // 2. Fetch all required profiles separately
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);
        
      const profileMap = new Map(profilesData?.map(p => [p.id, p.username]));

      // 3. Map profiles back onto feed items
      const itemsWithProfiles: FeedItemWithProfile[] = rawItems.map(item => ({
        ...item,
        profiles: { username: profileMap.get(item.user_id) || "Unknown User" },
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
        // Revert optimistic update if DB fails (optional, but good practice)
        loadFeed(); 
        return;
      }
    } else {
      // Applaud
      const { error } = await supabase.from("feed_applauds").insert({ feed_item_id: feedItemId, user_id: userId });
      if (error) {
        toast.error(`Failed to applaud: ${error.message}`);
        // Revert optimistic update if DB fails
        loadFeed(); 
        return;
      }
    }
    
    // 4. Trigger full reload after a short delay to ensure consistency via Realtime/DB fetch
    setTimeout(loadFeed, 500);
  };

  const renderFeedItem = (item: FeedItemWithProfile) => {
    const { type, data, profiles, created_at } = item;
    const username = profiles?.username || "A user";
    const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

    let content;
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
    } else {
      content = <p>An unknown activity was completed.</p>;
    }

    // Access count from the aggregated array
    const applaudCount = item.feed_applauds[0]?.count || 0;

    return (
      <Card key={item.id} className="glass-card hover-lift">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm">{content}</div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeAgo}
                </span>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 dopamine-click" onClick={() => handleApplaud(item.id)}>
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
      {feedItems.length > 0 ? (
        feedItems.map(renderFeedItem)
      ) : (
        <p className="text-center py-8 text-muted-foreground">The feed is empty. Complete a focus session to get started!</p>
      )}
    </div>
  );
};

export default FocusFeed;