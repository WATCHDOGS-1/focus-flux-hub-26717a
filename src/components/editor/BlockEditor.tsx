import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor, PartialBlock, Block } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface BlockEditorProps {
  documentId: string;
  initialContent: PartialBlock[];
  onContentChange: (content: PartialBlock[], text: string) => void;
  isEditable?: boolean;
}

const BlockEditor = ({ documentId, initialContent, onContentChange, isEditable = true }: BlockEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : undefined,
  });

  const handleChange = () => {
    if (!isEditable) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const content = editor.document;
      // Extract raw text for AI processing
      const text = content.map(b => (b.content as any)?.[0]?.text || "").join(" ");
      onContentChange(content, text);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSaving(false);
    }, 1500);
  };

  return (
    <div className="relative h-full w-full">
      <BlockNoteView 
        editor={editor} 
        editable={isEditable}
        onChange={handleChange}
        theme="dark" 
        className="h-full w-full industrial-editor"
      />
      
      {isSaving && (
        <div className="absolute top-2 right-2 p-1 px-3 rounded-full bg-primary/80 text-xs text-white flex items-center gap-1 z-10 font-mono">
          <Loader2 className="w-3 h-3 animate-spin" /> COMPILING...
        </div>
      )}
    </div>
  );
};

export default BlockEditor;