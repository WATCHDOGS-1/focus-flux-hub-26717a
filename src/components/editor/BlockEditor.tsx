import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/mantine/style.css"; // Updated CSS import for Mantine theme
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface BlockEditorProps {
  documentId: string;
  initialContent: PartialBlock[];
  onContentChange: (content: PartialBlock[]) => void;
  isEditable?: boolean;
}

const BlockEditor = ({ documentId, initialContent, onContentChange, isEditable = true }: BlockEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  // Use a ref to manage the debounce timer so it persists across renders
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // useCreateBlockNote creates the editor instance. 
  // 'editable' is now handled by the View component, not the hook.
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : undefined,
  });

  // Handle content changes with a debounce function
  const handleChange = () => {
    if (!isEditable) return;

    // Clear existing timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timer for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const content = editor.document;
      onContentChange(content);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSaving(false);
    }, 1500); // Auto-save after 1.5 seconds of inactivity
  };

  return (
    <div className="relative h-full w-full">
      <BlockNoteView 
        editor={editor} 
        editable={isEditable} // Pass editable state here
        onChange={handleChange} // Trigger save logic on change
        theme="dark" 
        className="h-full w-full"
      />
      {isSaving && (
        <div className="absolute top-2 right-2 p-1 px-3 rounded-full bg-primary/80 text-xs text-white flex items-center gap-1 z-10">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
        </div>
      )}
    </div>
  );
};

export default BlockEditor;