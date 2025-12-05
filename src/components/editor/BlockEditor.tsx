import { useBlockNote, BlockNoteView } from "@blocknote/react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/core/style.css";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BlockEditorProps {
  documentId: string;
  initialContent: PartialBlock[];
  onContentChange: (content: PartialBlock[]) => void;
  isEditable?: boolean;
}

const BlockEditor = ({ documentId, initialContent, onContentChange, isEditable = true }: BlockEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const editor: BlockNoteEditor = useBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : undefined,
    editable: isEditable,
  });

  // Handle content changes and auto-save
  useEffect(() => {
    if (!isEditable) return;
    
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      const content = editor.document;
      onContentChange(content);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSaving(false);
      // toast.success(`Document ${documentId} saved.`, { duration: 1500 }); // Disabled frequent toast
    }, 1500); // Auto-save after 1.5 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [editor.document, documentId, onContentChange, isEditable]);

  return (
    <div className="relative h-full w-full">
      <BlockNoteView 
        editor={editor} 
        theme="dark" // Assuming dark mode preference
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