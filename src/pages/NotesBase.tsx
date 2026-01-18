import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useKnowledge, Document } from "@/hooks/use-knowledge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Maximize2, Minimize2, BookOpen, Loader2, Settings } from 'lucide-react';
import { cn } from "@/lib/utils";
import BlockEditor from "@/components/editor/BlockEditor";
import Whiteboard from "@/components/editor/Whiteboard";
import PageHeader from "@/components/notes/PageHeader";
import NotesSidebar from "@/components/notes/NotesSidebar";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";

const NotesBase = () => {
  const navigate = useNavigate();
  const { documents, updateDocumentContent, createDocument, deleteDocument } = useKnowledge();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarSize, setSidebarSize] = useState(20);

  // --- Document State Management ---
  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
        setSelectedDocId(documents[0].id);
    } else if (selectedDocId && !selectedDocument) {
        // If the selected document was deleted
        setSelectedDocId(documents[0]?.id || null);
    }
  }, [documents, selectedDocId, selectedDocument]);

  // --- Document Property Handlers ---
  const handleTitleChange = (newTitle: string) => {
    if (!selectedDocument) return;
    // Optimistic update + save logic (simplified here, full save handled by editor)
    updateDocumentContent(selectedDocument.id, { ...selectedDocument, title: newTitle });
  };
  
  const handleIconChange = (newIcon: string | null) => {
    if (!selectedDocument) return;
    // NOTE: We update the document object itself for metadata
    updateDocumentContent(selectedDocument.id, { ...selectedDocument, icon: newIcon });
  };
  
  const handleCoverImageChange = useCallback(async (file: File | null) => {
    if (!selectedDocument) return;
    setIsSaving(true);
    
    let newUrl = file ? URL.createObjectURL(file) : null; // Mock upload
    
    // Simulate upload delay and cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateDocumentContent(selectedDocument.id, { ...selectedDocument, coverImageUrl: newUrl });
    setIsSaving(false);
  }, [selectedDocument, updateDocumentContent]);

  // --- Editor Rendering ---
  const renderEditor = () => {
    if (!selectedDocument) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a document or create a new one.
        </div>
      );
    }
    
    // NOTE: We need to handle the content update logic carefully here.
    const handleContentUpdate = (content: any) => {
        // Preserve metadata (title, icon, coverImageUrl) when updating content
        const metadata = {
            title: selectedDocument.title,
            icon: (selectedDocument as any).icon,
            coverImageUrl: (selectedDocument as any).coverImageUrl,
            type: selectedDocument.type,
            id: selectedDocument.id,
        };
        updateDocumentContent(selectedDocument.id, { ...metadata, content });
    };

    if (selectedDocument.type === 'text') {
      return (
        <BlockEditor
          documentId={selectedDocument.id}
          initialContent={selectedDocument.content as any}
          onContentChange={handleContentUpdate}
        />
      );
    }
    
    if (selectedDocument.type === 'canvas') {
      return (
        <Whiteboard
          documentId={selectedDocument.id}
          initialContent={selectedDocument.content as string}
          onContentChange={handleContentUpdate}
        />
      );
    }
    
    return null;
  };
  
  // --- Zen Mode Logic ---
  const toggleZenMode = () => {
    setIsZenMode(prev => {
        const newState = !prev;
        if (newState) {
            // Entering Zen Mode: Collapse sidebar
            setSidebarSize(0);
        } else {
            // Exiting Zen Mode: Restore sidebar
            setSidebarSize(20);
        }
        return newState;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-card border-b border-white/10 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Notes Base
          </h1>
          <div className="flex gap-2 items-center">
            <Button variant="ghost" size="icon" onClick={toggleZenMode} title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"} className="dopamine-click">
                {isZenMode ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="dopamine-click">
                <Home className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full">
          
          {/* Sidebar Panel */}
          <Panel 
            defaultSize={20} 
            minSize={15} 
            maxSize={30} 
            onResize={setSidebarSize}
            className={cn(isZenMode && "hidden")}
          >
            <NotesSidebar 
                selectedDocId={selectedDocId} 
                onSelectDoc={setSelectedDocId} 
                onCreateNew={createDocument}
                onDeleteDoc={deleteDocument}
            />
          </Panel>
          
          {!isZenMode && <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors cursor-col-resize" />}
          
          {/* Editor Panel */}
          <Panel minSize={50}>
            <Card className="glass-card h-full overflow-y-auto rounded-none border-none">
              <CardContent className="p-0 h-full flex flex-col">
                
                {selectedDocument && (
                    <PageHeader
                        title={selectedDocument.title}
                        onTitleChange={handleTitleChange}
                        icon={(selectedDocument as any).icon || null}
                        onIconChange={handleIconChange}
                        coverImageUrl={(selectedDocument as any).coverImageUrl || null}
                        onCoverImageChange={handleCoverImageChange}
                        isSaving={isSaving}
                    />
                )}
                
                <div className={cn(
                    "flex-1 min-h-[50vh] p-8",
                    isZenMode && "max-w-4xl mx-auto w-full"
                )}>
                    {renderEditor()}
                </div>
              </CardContent>
            </Card>
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
};

export default NotesBase;