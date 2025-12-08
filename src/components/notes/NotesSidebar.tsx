import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Video, Plus, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowledge, Document } from '@/hooks/use-knowledge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface NotesSidebarProps {
    selectedDocId: string | null;
    onSelectDoc: (id: string) => void;
    onCreateNew: (type: 'text' | 'canvas', title: string) => void;
}

// Mock File Tree Structure (for visualization)
const MOCK_TREE = [
    { id: 'doc-1', title: 'Project Alpha Notes', type: 'text', children: [
        { id: 'doc-3', title: 'Daily Journal Entry', type: 'text' },
    ]},
    { id: 'doc-2', title: 'System Architecture Diagram', type: 'canvas', children: [] },
];

const DocumentItem = ({ doc, selectedDocId, onSelectDoc }: { doc: Document, selectedDocId: string | null, onSelectDoc: (id: string) => void }) => {
    const Icon = doc.type === 'text' ? FileText : Video;
    const isSelected = doc.id === selectedDocId;

    return (
        <div
            className={cn(
                "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors truncate",
                isSelected ? "bg-primary/20 font-semibold text-primary" : "hover:bg-secondary/50 text-foreground"
            )}
            onClick={() => onSelectDoc(doc.id)}
        >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate text-sm">{doc.title}</span>
        </div>
    );
};

const NotesSidebar = ({ selectedDocId, onSelectDoc, onCreateNew }: NotesSidebarProps) => {
    const { documents } = useKnowledge();
    const [newTitle, setNewTitle] = useState('');

    const handleCreate = (type: 'text' | 'canvas') => {
        if (!newTitle.trim()) {
            toast.error("Title cannot be empty.");
            return;
        }
        onCreateNew(type, newTitle.trim());
        setNewTitle('');
    };

    return (
        <div className="glass-card flex flex-col h-full">
            <div className="p-4 border-b border-border/50">
                <h2 className="text-xl font-bold text-accent flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Knowledge Base
                </h2>
            </div>
            
            <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-1">
                    {documents.map(doc => (
                        <DocumentItem 
                            key={doc.id} 
                            doc={doc} 
                            selectedDocId={selectedDocId} 
                            onSelectDoc={onSelectDoc} 
                        />
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 space-y-3">
                <Input 
                    placeholder="New document title..." 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                />
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        className="flex-1 dopamine-click" 
                        onClick={() => handleCreate('text')}
                        disabled={!newTitle.trim()}
                    >
                        <FileText className="w-4 h-4 mr-1" /> New Note
                    </Button>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="flex-1 dopamine-click" 
                        onClick={() => handleCreate('canvas')}
                        disabled={!newTitle.trim()}
                    >
                        <Video className="w-4 h-4 mr-1" /> New Canvas
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotesSidebar;