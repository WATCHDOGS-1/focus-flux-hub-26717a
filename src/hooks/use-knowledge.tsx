import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import { PartialBlock } from "@blocknote/core";
import { toast } from "sonner";
import { Document, MOCK_DOCUMENTS } from "@/types/knowledge";

interface KnowledgeContextType {
    documents: Document[];
    updateDocumentContent: (id: string, newContent: any) => void;
    createDocument: (type: 'text' | 'canvas', title: string) => Document;
    deleteDocument: (id: string) => void;
}

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

export const KnowledgeProvider = ({ children }: { children: ReactNode }) => {
    const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
    const [nextId, setNextId] = useState(MOCK_DOCUMENTS.length + 1);

    const updateDocumentContent = useCallback((id: string, newContent: any) => {
        setDocuments(prev => 
            prev.map(doc => 
                doc.id === id ? { ...doc, content: newContent } : doc
            )
        );
    }, []);
    
    const createDocument = useCallback((type: 'text' | 'canvas', title: string) => {
        const newDoc: Document = {
            id: `doc-${nextId}`,
            title: title,
            content: type === 'text' ? [] : '{"elements":[]}',
            type: type,
        };
        setDocuments(prev => [...prev, newDoc]);
        setNextId(nextId + 1);
        return newDoc;
    }, [nextId]);
    
    const deleteDocument = useCallback((id: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        toast.info("Document deleted.");
    }, []);

    return (
        <KnowledgeContext.Provider value={{ documents, updateDocumentContent, createDocument, deleteDocument }}>
            {children}
        </KnowledgeContext.Provider>
    );
};

export const useKnowledge = () => {
    const context = useContext(KnowledgeContext);
    if (context === undefined) {
        throw new Error("useKnowledge must be used within a KnowledgeProvider");
    }
    return context;
};