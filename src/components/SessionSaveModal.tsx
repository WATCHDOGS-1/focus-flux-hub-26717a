import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tag, Clock, Loader2, Zap } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tag: string) => Promise<void>;
    defaultTag: string;
    durationMinutes: number;
}

const SessionSaveModal = ({ isOpen, onClose, onSave, defaultTag, durationMinutes }: Props) => {
    const [tag, setTag] = useState(defaultTag);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(tag);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(o) => !o && !isSaving && onClose()}>
            <DialogContent className="glass rounded-[2rem] border-none shadow-2xl p-8 max-w-sm">
                <DialogHeader className="items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <DialogTitle className="text-3xl font-black italic tracking-tighter">LEVEL COMPLETE</DialogTitle>
                    <DialogDescription className="text-foreground/70">
                        You stayed in deep flow for <span className="font-bold text-white">{durationMinutes} minutes</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Identify your work</label>
                        <Input 
                            value={tag} 
                            onChange={e => setTag(e.target.value)}
                            placeholder="e.g. System Architecture"
                            className="bg-white/5 border-white/10 h-12 rounded-2xl text-center font-bold"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl text-lg font-bold premium-gradient shadow-glow">
                        {isSaving ? <Loader2 className="animate-spin" /> : "COLLECT XP"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SessionSaveModal;