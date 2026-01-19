import { useKnowledge } from "@/hooks/use-knowledge";
import BlockEditor from "./editor/BlockEditor";
import SynapseSidebar from "./notes/SynapseSidebar";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { useState } from "react";

const NotesAndMediaPanel = () => {
  const { documents, updateDocumentContent } = useKnowledge();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [currentText, setCurrentText] = useState("");

  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  const handleContentChange = (content: any, text: string) => {
      setCurrentText(text);
      updateDocumentContent(selectedDocument!.id, { ...selectedDocument!, content });
  };

  return (
    <div className="h-full w-full glass-card rounded-[2.5rem] overflow-hidden border border-white/5">
        <PanelGroup direction="horizontal">
            <Panel defaultSize={75} minSize={50}>
                <div className="h-full p-8 overflow-y-auto custom-scrollbar">
                    {selectedDocument && (
                        <BlockEditor
                            documentId={selectedDocument.id}
                            initialContent={selectedDocument.content as any}
                            onContentChange={handleContentChange}
                        />
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