import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tag, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tag: string) => Promise<void>;
    defaultTag: string;
    durationMinutes: number;
}

const SessionSaveModal = ({ isOpen, onClose, onSave, defaultTag, durationMinutes }: SessionSaveModalProps) => {
    const [tag, setTag] = useState(defaultTag);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setTag(defaultTag);
    }, [defaultTag]);

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave(tag.trim() || "General Focus");
        } finally {
            setIsSaving(false);
            onClose();
        }
    };
    
    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" /> Session Complete!
                    </DialogTitle>
                    <DialogDescription>
                        Your session lasted <span className="font-bold text-accent">{formatTime(durationMinutes)}</span>. Please tag your focus area before saving.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="focus-tag" className="text-sm font-medium flex items-center gap-1">
                            <Tag className="w-4 h-4" /> Focus Tag
                        </label>
                        <Input
                            id="focus-tag"
                            placeholder="e.g., 'Math Homework', 'Project Alpha'"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSave()}
                            disabled={isSaving}
                        />
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full dopamine-click"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            "Save Session & Earn XP"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SessionSaveModal;