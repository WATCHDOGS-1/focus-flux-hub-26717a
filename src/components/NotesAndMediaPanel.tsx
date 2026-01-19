import { useKnowledge } from "@/hooks/use-knowledge";
import BlockEditor from "./editor/BlockEditor";
import SynapseSidebar from "./notes/SynapseSidebar";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { useState, useEffect } from "react";
import { Loader2, BookOpen } from "lucide-react";

const NotesAndMediaPanel = () => {
  const { documents, updateDocumentContent } = useKnowledge();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState("");

  // Initialize with first document
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
        setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  const handleContentChange = (content: any, text: string) => {
      if (!selectedDocument) return;
      setCurrentText(text);
      updateDocumentContent(selectedDocument.id, { ...selectedDocument, content });
  };

  if (documents.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
              <BookOpen className="w-12 h-12 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">No Archives Found</p>
          </div>
      );
  }

  return (
    <div className="h-full w-full glass-card rounded-[2.5rem] overflow-hidden border border-white/5">
        <PanelGroup direction="horizontal">
            <Panel defaultSize={75} minSize={50}>
                <div className="h-full p-8 overflow-y-auto custom-scrollbar">
                    {selectedDocument ? (
                        <BlockEditor
                            documentId={selectedDocument.id}
                            initialContent={selectedDocument.content as any}
                            onContentChange={handleContentChange}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </Panel>

            <PanelResizeHandle className="w-px bg-white/5 hover:bg-primary/50 transition-colors" />

            <Panel defaultSize={25} minSize={20}>
                <SynapseSidebar editorContent={currentText} />
            </Panel>
        </PanelGroup>
    </div>
  );
};

export default NotesAndMediaPanel;