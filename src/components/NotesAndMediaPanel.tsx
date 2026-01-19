import { useKnowledge } from "@/hooks/use-knowledge";
import BlockEditor from "./editor/BlockEditor";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, NotebookText } from "lucide-react";
import { useState } from "react";
import { sendGeminiChat } from "@/utils/gemini";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const NotesAndMediaPanel = () => {
  const { documents, updateDocumentContent } = useKnowledge();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  const handleGenerateFlashcards = async () => {
    if (!selectedDocument || selectedDocument.type !== 'text') return;
    setIsGenerating(true);
    
    const content = JSON.stringify(selectedDocument.content);
    const prompt = `Based on these study notes, generate 5 high-yield flashcards for exam prep. Return as JSON array of objects with {question, answer}. Notes: ${content}`;

    try {
        const response = await sendGeminiChat([{ role: 'user', parts: [{ text: prompt }] }]);
        const cards = JSON.parse(response);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_review_cards').insert(cards.map((c: any) => ({ ...c, user_id: user.id })));
            toast.success("Knowledge Compounded: 5 Flashcards generated!");
        }
    } catch (e) {
        toast.error("Failed to generate flashcards.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="h-full w-full glass-card p-6 rounded-[2.5rem] flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h4 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                <NotebookText className="text-primary" /> War Room Notes
            </h4>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateFlashcards} 
                disabled={isGenerating}
                className="rounded-full dopamine-click border-accent/20 text-accent hover:bg-accent/5"
            >
                <Brain className="w-4 h-4 mr-2" /> {isGenerating ? "Compounding..." : "Generate Review"}
            </Button>
        </div>

        <div className="flex-1 min-h-0">
            {selectedDocument && selectedDocument.type === 'text' && (
                <BlockEditor
                    documentId={selectedDocument.id}
                    initialContent={selectedDocument.content as any}
                    onContentChange={(c) => updateDocumentContent(selectedDocument.id, { ...selectedDocument, content: c })}
                />
            )}
        </div>
    </div>
  );
};

export default NotesAndMediaPanel;