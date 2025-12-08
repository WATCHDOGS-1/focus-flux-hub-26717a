import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor, PartialBlock, Block, CustomSlashMenuState, defaultBlockSpecs, BlockSpec } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import { useRef, useState, useMemo } from "react";
import { Loader2, Brain, FileText, ListChecks, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendGeminiChat } from "@/utils/gemini";
import { AI_COACH_SYSTEM_PROMPT } from "@/utils/ai-coach"; // Corrected import path
import { cn } from "@/lib/utils";

interface BlockEditorProps {
  documentId: string;
  initialContent: PartialBlock[];
  onContentChange: (content: PartialBlock[]) => void;
  isEditable?: boolean;
}

// --- Custom Slash Command Definition ---
const AskAIBlock: BlockSpec = {
    type: "askAI",
    name: "Ask AI",
    icon: <Brain className="w-5 h-5 text-accent" />,
    hint: "Ask the AI Coach to generate content or summarize.",
    toCustomHTML: () => <p>Ask AI...</p>,
    // We don't need a React component for this, as we handle the action immediately.
};

const TEMPLATES = [
    { title: "Meeting Notes", icon: <MessageSquare className="w-5 h-5" />, content: [
        { type: "heading", props: { level: 2 }, content: "Meeting Title" },
        { type: "paragraph", content: "Date: " },
        { type: "paragraph", content: "Attendees: " },
        { type: "heading", props: { level: 3 }, content: "Action Items" },
        { type: "listItem", props: { checked: false }, content: "Task 1" },
    ]},
    { title: "To-Do List", icon: <ListChecks className="w-5 h-5" />, content: [
        { type: "heading", props: { level: 2 }, content: "Daily Focus" },
        { type: "listItem", props: { checked: false }, content: "High Priority Task" },
        { type: "listItem", props: { checked: false }, content: "Medium Priority Task" },
    ]},
];

const BlockEditor = ({ documentId, initialContent, onContentChange, isEditable = true }: BlockEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Custom Slash Menu Logic ---
  const customSlashMenu: CustomSlashMenuState = useMemo(() => ({
    items: [
      ...defaultBlockSpecs,
      AskAIBlock,
    ],
    onItemClick: (item) => {
      if (item.type === "askAI") {
        setIsAIOpen(true);
        return null; // Prevent default block insertion
      }
      return item;
    },
  }), []);

  // --- Editor Initialization ---
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : undefined,
    blockSpecs: { ...defaultBlockSpecs, askAI: AskAIBlock },
  });

  // --- Auto-Save Logic ---
  const handleChange = () => {
    if (!isEditable) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const content = editor.document;
      onContentChange(content);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSaving(false);
    }, 1500);
  };
  
  // --- AI Generation Logic ---
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAIGenerating(true);
    setIsAIOpen(false);
    
    const fullPrompt = `${AI_COACH_SYSTEM_PROMPT}\n\nUSER REQUEST: ${aiPrompt}`;
    
    try {
        const responseText = await sendGeminiChat([{ role: "user", parts: [{ text: fullPrompt }] }]);
        
        // Insert the generated text as a new paragraph block
        editor.insertBlocks(
            [{ type: "paragraph", content: responseText }],
            editor.getTextCursorPosition().block,
            "after"
        );
        
        toast.success("AI content generated.");
    } catch (error: any) {
        toast.error(error.message || "AI generation failed.");
    } finally {
        setIsAIGenerating(false);
        setAiPrompt("");
    }
  };
  
  // --- Empty State Template Logic ---
  const isEditorEmpty = useMemo(() => {
      if (!editor || !editor.document) return true;
      // Check if there's only one block and it's empty
      return editor.document.length === 1 && editor.document[0].content === undefined;
  }, [editor.document]);
  
  const handleApplyTemplate = (templateContent: PartialBlock[]) => {
      // Clear existing content and insert template
      editor.replaceBlocks(editor.document, templateContent);
  };

  return (
    <div className="relative h-full w-full">
      {/* AI Dialog */}
      <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
        <DialogContent className="sm:max-w-[425px] glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent">
                <Brain className="w-5 h-5" /> Ask AI Coach
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Generate a summary, brainstorm ideas, or write a draft..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleGenerateAI()}
            />
            <Button onClick={handleGenerateAI} disabled={!aiPrompt.trim() || isAIGenerating} className="w-full dopamine-click">
              {isAIGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Generate Content"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor View */}
      <BlockNoteView 
        editor={editor} 
        editable={isEditable}
        onChange={handleChange}
        theme="dark" 
        className="h-full w-full"
        customSlashMenu={customSlashMenu}
      />
      
      {/* Empty State Template Selector */}
      {isEditorEmpty && !isAIGenerating && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 text-center max-w-md space-y-4">
              <h3 className="text-xl font-bold text-muted-foreground">Start with a Template</h3>
              <div className="flex gap-4 justify-center">
                  <Button variant="secondary" onClick={() => handleApplyTemplate(TEMPLATES[0].content)} className="flex flex-col h-auto py-4 dopamine-click">
                      {TEMPLATES[0].icon}
                      <span className="mt-1">{TEMPLATES[0].title}</span>
                  </Button>
                  <Button variant="secondary" onClick={() => handleApplyTemplate(TEMPLATES[1].content)} className="flex flex-col h-auto py-4 dopamine-click">
                      {TEMPLATES[1].icon}
                      <span className="mt-1">{TEMPLATES[1].title}</span>
                  </Button>
              </div>
              <p className="text-sm text-muted-foreground">Or start typing / to see commands.</p>
          </div>
      )}
      
      {/* Saving Indicator */}
      {(isSaving || isAIGenerating) && (
        <div className="absolute top-2 right-2 p-1 px-3 rounded-full bg-primary/80 text-xs text-white flex items-center gap-1 z-10">
          <Loader2 className="w-3 h-3 animate-spin" /> {isAIGenerating ? "Generating..." : "Saving..."}
        </div>
      )}
    </div>
  );
};

export default BlockEditor;