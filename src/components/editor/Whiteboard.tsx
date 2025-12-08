import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WhiteboardProps {
  documentId: string;
  initialContent: string; // JSON string of Excalidraw elements
  onContentChange: (content: string) => void;
  isEditable?: boolean;
}

const Whiteboard = ({ documentId, initialContent, onContentChange, isEditable = true }: WhiteboardProps) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Parse initial content
  const initialData = initialContent && initialContent !== '{"elements":[]}'
    ? JSON.parse(initialContent)
    : { elements: [], appState: {} };

  // Debounced save function
  const handleSave = useCallback(async () => {
    if (!excalidrawAPI || !isEditable) return;

    setIsSaving(true);
    const appState = excalidrawAPI.getAppState();
    const elements = excalidrawAPI.getElements();
    
    const content = JSON.stringify({ elements, appState });
    onContentChange(content);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    // toast.success(`Canvas ${documentId} saved.`, { duration: 1500 }); // Disabled frequent toast
  }, [excalidrawAPI, documentId, onContentChange, isEditable]);

  // Set up auto-save listener
  useEffect(() => {
    if (!excalidrawAPI || !isEditable) return;

    const saveInterval = setInterval(handleSave, 5000); // Auto-save every 5 seconds

    return () => clearInterval(saveInterval);
  }, [excalidrawAPI, isEditable, handleSave]);
  
  // Load initial data once API is ready
  useEffect(() => {
    if (excalidrawAPI && !isReady) {
        excalidrawAPI.updateScene(initialData);
        setIsReady(true);
    }
  }, [excalidrawAPI, initialData, isReady]);

  return (
    <div className="relative h-full w-full">
      {!isReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/90 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialData}
        viewModeEnabled={!isEditable}
        theme="dark"
        name={documentId}
      >
        <MainMenu>
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen />
      </Excalidraw>
      
      {isSaving && isEditable && (
        <div className="absolute top-2 right-2 p-1 px-3 rounded-full bg-primary/80 text-xs text-white flex items-center gap-1 z-10">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
        </div>
      )}
    </div>
  );
};

export default Whiteboard;