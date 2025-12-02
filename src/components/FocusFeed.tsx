import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, Zap, Tag, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type FeedItem = Database["public"]["Tables"]["feed_items"]["Row"] & {
  profiles: { username: string } | null;
  feed_applauds: { count: number }[];
};

const FocusFeed = () => {
  const { userId } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadFeed = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("feed_items")
      .select(`
        *,
        profiles (username),
        feed_applauds (count)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading feed:", error);
      toast.error("Failed to load focus feed.");
    } else {
      setFeedItems(data as FeedItem[]);
    }
    setIsLoading(false);
  };

  const handleApplaud = async (feedItemId: string) => {
    if (!userId) return;

    // Check if user has already applauded
    const { data: existing } = await supabase
      .from("feed_applauds")
      .select("id")
      .eq("feed_item_id", feedItemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Un-applaud
      const { error } = await supabase.from("feed_applauds").delete().eq("id", existing.id);
      if (error) toast.error("Failed to remove applaud.");
    } else {
      // Applaud
      const { error } = await supabase.from("feed_applauds").insert({ feed_item_id: feedItemId, user_id: userId });
      if (error) toast.error("Failed to applaud.");
    }
    // The realtime listener will trigger a reload.
  };

  const renderFeedItem = (item: FeedItem) => {
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