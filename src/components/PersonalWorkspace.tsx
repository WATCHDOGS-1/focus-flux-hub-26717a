import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListChecks, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface PersonalWorkspaceProps {
  userId: string;
}

const PersonalWorkspace = ({ userId }: PersonalWorkspaceProps) => {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { profile } = useAuth();

  // 1. Load initial content
  useEffect(() => {
    const loadContent = async () => {
      const { data, error } = await supabase
        .from("user_workspace")
        .select("content")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading workspace content:", error);
      } else if (data) {
        setContent(data.content);
      }
    };

    loadContent();
  }, [userId]);

  // 2. Debounced saving function
  const saveContent = async (newContent: string) => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from("user_workspace")
      .upsert({ user_id: userId, content: newContent, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) {
      console.error("Error saving workspace content:", error);
      toast.error("Failed to save notes.");
    }
    
    setIsSaving(false);
  };

  // 3. Handle Content Changes and Debounce Save
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operation
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent);
    }, 1500); // Save 1.5 seconds after the user stops typing
  };

  useEffect(() => {
    return () => {
      // Cleanup timeout on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="glass-card p-4 rounded-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
        <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <ListChecks className="w-5 h-5" />
          {profile?.username}'s Personal Workspace
        </h4>
        <div className={`text-xs font-medium flex items-center gap-1 transition-opacity ${isSaving ? 'opacity-100 animate-pulse text-warning' : 'opacity-0'}`}>
          <Save className="w-3 h-3" />
          Saving...
        </div>
      </div>
      <ScrollArea className="flex-1 h-full">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="This is your private space for tasks, notes, and reflections. It saves automatically!"
          className="w-full h-full min-h-[300px] resize-none border-none bg-transparent focus-visible:ring-0 text-base font-mono"
        />
      </ScrollArea>
    </div>
  );
};

export default PersonalWorkspace;