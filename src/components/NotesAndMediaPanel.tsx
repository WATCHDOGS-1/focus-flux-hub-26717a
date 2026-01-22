import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotebookText, FileText, Video, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKnowledge } from "@/hooks/use-knowledge";
import BlockEditor from "./editor/BlockEditor";
import Whiteboard from "./editor/Whiteboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Document } from "@/types/knowledge";

const NotesAndMediaPanel = () => {
  const { documents, updateDocumentContent } = useKnowledge();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(true);

  // Initialize with the first document if available
  useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
        setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  const handleSelectChange = (id: string) => {
    setSelectedDocId(id);
    setIsSelectorOpen(false);
  };

  const renderDocumentEditor = () => {
    if (!selectedDocument) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a document to start taking notes.
            </div>
        );
    }
    
    if (selectedDocument.type === 'text') {
        return (
            <BlockEditor
                documentId={selectedDocument.id}
                initialContent={selectedDocument.content as any}
                onContentChange={(content) => updateDocumentContent(selectedDocument.id, content)}
                isEditable={true} // Read-write access in Focus Room
            />
        );
    }
    
    if (selectedDocument.type === 'canvas') {
        return (
            <Whiteboard
                documentId={selectedDocument.id}
                initialContent={selectedDocument.content as string}
                onContentChange={(content) => updateDocumentContent(selectedDocument.id, content)}
                isEditable={true} // Read-write access in Focus Room
            />
        );
    }
    
    return null;
  };

  return (
    <div className="h-full w-full glass-card p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <NotebookText className="w-5 h-5" />
                Focus Document
            </h4>
            
            <Select onValueChange={handleSelectChange} value={selectedDocId || ""}>
                <SelectTrigger className="w-[200px] dopamine-click">
                    <SelectValue placeholder="Select Document" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                    {documents.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                            <div className="flex items-center gap-2">
                                {doc.type === 'text' ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                {doc.title}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="flex-1 min-h-0">
            {renderDocumentEditor()}
        </div>
    </div>
  );
};

export default NotesAndMediaPanel;