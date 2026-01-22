import { useState, createContext, useContext, ReactNode, useCallback, useEffect } from "react";
import { PartialBlock } from "@blocknote/core";
import { toast } from "sonner";
import { Document, MOCK_DOCUMENTS } from "@/types/knowledge";

interface KnowledgeContextType {
    documents: Document[];
    updateDocument: (id: string, update: Partial<Document>) => void;
    createDocument: (type: 'text' | 'canvas', title: string) => Document;
    deleteDocument: (id: string) => void;
    updateDocumentContent: (id: string, content: any) => void;
}

const KNOWLEDGE_STORAGE_KEY = "onlyfocus_knowledge_docs";

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

export const KnowledgeProvider = ({ children }: { children: ReactNode }) => {
    const [documents, setDocuments] = useState<Document[]>(() => {
        const saved = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved knowledge documents:", e);
                return MOCK_DOCUMENTS;
            }
        }
        return MOCK_DOCUMENTS;
    });

    const [nextId, setNextId] = useState(() => {
        const maxId = documents.reduce((max, doc) => {
            const idNum = parseInt(doc.id.split('-')[1]);
            return isNaN(idNum) ? max : Math.max(max, idNum);
        }, 0);
        return maxId + 1;
    });

    useEffect(() => {
        localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(documents));
    }, [documents]);

    const updateDocument = useCallback((id: string, update: Partial<Document>) => {
        setDocuments(prev => 
            prev.map(doc => 
                doc.id === id ? { ...doc, ...update } : doc
            )
        );
    }, []);

    const updateDocumentContent = useCallback((id: string, content: any) => {
        setDocuments(prev => 
            prev.map(doc => 
                doc.id === id ? { ...doc, content } : doc
            )
        );
    }, []);
    
    const createDocument = useCallback((type: 'text' | 'canvas', title: string) => {
        const newDoc: Document = {
            id: `doc-${nextId}`,
            title: title,
            content: type === 'text' ? [] : '{"elements":[]}',
            type: type,
            icon: null,
            coverImageUrl: null,
        };
        setDocuments(prev => [...prev, newDoc]);
        setNextId(prev => prev + 1);
        return newDoc;
    }, [nextId]);
    
    const deleteDocument = useCallback((id: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        toast.info("Document deleted.");
    }, []);

    return (
        <KnowledgeContext.Provider value={{ documents, updateDocument, createDocument, deleteDocument, updateDocumentContent }}>
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