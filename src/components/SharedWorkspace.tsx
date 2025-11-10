import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListChecks, Users } from "lucide-react";
import { toast } from "sonner";

interface SharedWorkspaceProps {
  roomId: string;
  userId: string;
}

const SHARED_CONTENT_KEY = "shared_tasks_content";

const SharedWorkspace = ({ roomId, userId }: SharedWorkspaceProps) => {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // 1. Initialize Realtime Channel and Load Initial Content
  useEffect(() => {
    // Load initial content (simulated fetch, ideally this would come from a persistent DB table)
    // For simplicity, we'll rely on the broadcast for initial sync in this example.

    const channel = supabase.channel(`workspace:${roomId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'content_update' }, ({ payload }) => {
        setContent(payload.content);
      })
      .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setTypingUser(payload.username);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3000);
        }
      })
      .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
        if (payload.userId !== userId && typingUser === payload.username) {
          setTypingUser(null);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Request current state from the room (if needed, but for now, rely on broadcast)
          toast.info("Shared Workspace connected.");
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, userId]);

  // 2. Handle Content Changes and Broadcast
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Debounce the broadcast to prevent excessive messages
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Broadcast typing start
    if (!isTyping) {
        setIsTyping(true);
        channelRef.current.send({
            type: 'broadcast',
            event: 'typing_start',
            payload: { userId, username: "A user" } // Replace "A user" with actual username if available
        });
    }

    // Broadcast content update after a short delay
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current.send({
        type: 'broadcast',
        event: 'content_update',
        payload: { content: newContent },
      });
      setIsTyping(false);
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: { userId, username: "A user" }
      });
    }, 500);
  };

  return (
    <div className="glass-card p-4 rounded-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
        <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <ListChecks className="w-5 h-5" />
          Shared Workspace (Tasks & Notes)
        </h4>
        {typingUser && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
            <Users className="w-3 h-3" />
            {typingUser} is typing...
          </span>
        )}
      </div>
      <ScrollArea className="flex-1 h-full">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start collaborating on tasks, notes, or group reflections here. Changes are saved in real-time for everyone in the room."
          className="w-full h-full min-h-[300px] resize-none border-none bg-transparent focus-visible:ring-0 text-base font-mono"
        />
      </ScrollArea>
    </div>
  );
};

export default SharedWorkspace;