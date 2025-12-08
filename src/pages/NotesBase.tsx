import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKnowledge, Document } from "@/hooks/use-knowledge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, LayoutGrid, Plus, Home, Trash2, Video, Edit, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import BlockEditor from "@/components/editor/BlockEditor";
import Whiteboard from "@/components/editor/Whiteboard";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NotesBase = () => {
  const navigate = useNavigate();
  const { documents, updateDocumentContent, createDocument, deleteDocument } = useKnowledge();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");

  useEffect(() => {
    // Ensure a document is selected if the list isn't empty
    if (!selectedDocId && documents.length > 0) {
        setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  const handleCreate = (type: 'text' | 'canvas') => {
    if (!newDocTitle.trim()) return;
    const newDoc = createDocument(type, newDocTitle.trim());
    setSelectedDocId(newDoc.id);
    setNewDocTitle("");
    setIsCreateDialogOpen(false);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
        deleteDocument(id);
        if (selectedDocId === id) {
            setSelectedDocId(documents.filter(doc => doc.id !== id)[0]?.id || null);
        }
    }
  };

  const renderEditor = () => {
    if (!selectedDocument) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a document or create a new one.
        </div>
      );
    }
    
    if (selectedDocument.type === 'text') {
      return (
        <BlockEditor
          documentId={selectedDocument.id}
          initialContent={selectedDocument.content as any}
          onContentChange={(content) => updateDocumentContent(selectedDocument.id, content)}
        />
      );
    }
    
    if (selectedDocument.type === 'canvas') {
      return (
        <Whiteboard
          documentId={selectedDocument.id}
          initialContent={selectedDocument.content as string}
          onContentChange={(content) => updateDocumentContent(selectedDocument.id, content)}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Notes Base
          </h1>
          <Button variant="outline" onClick={() => navigate("/")} className="dopamine-click">
            <Home className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {/* Sidebar (1/4) */}
        <Card className="glass-card md:col-span-1 flex flex-col h-[85vh]">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold mb-2">Documents</h2>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="w-full dopamine-click">
                        <Plus className="w-4 h-4 mr-1" /> Create New
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] glass-card">
                    <DialogHeader>
                        <DialogTitle>Create New Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input 
                            placeholder="Document Title" 
                            value={newDocTitle} 
                            onChange={e => setNewDocTitle(e.target.value)} 
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleCreate('text')} className="flex-1 dopamine-click" disabled={!newDocTitle.trim()}>
                                <FileText className="w-4 h-4 mr-1" /> Note
                            </Button>
                            <Button size="sm" onClick={() => handleCreate('canvas')} variant="secondary" className="flex-1 dopamine-click" disabled={!newDocTitle.trim()}>
                                <Video className="w-4 h-4 mr-1" /> Canvas
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group",
                    selectedDocId === doc.id ? "bg-primary/20 font-semibold" : "hover:bg-secondary/50"
                  )}
                  onClick={() => setSelectedDocId(doc.id)}
                >
                  <div className="flex items-center gap-2 truncate">
                    {doc.type === 'text' ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span className="truncate">{doc.title}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Editor View (3/4) */}
        <Card className="glass-card md:col-span-3 h-[85vh]">
          <CardContent className="p-0 h-full">
            {renderEditor()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotesBase;