import { useState, useEffect } from "react";
import { Brain, Zap, AlertTriangle, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateActiveRecall } from "@/utils/knowledge-engine";
import { useAuth } from "@/hooks/use-auth";
import { useStudy } from "@/context/StudyContext";
import { motion, AnimatePresence } from "framer-motion";

interface SynapseSidebarProps {
    editorContent: string;
}

const SynapseSidebar = ({ editorContent }: SynapseSidebarProps) => {
    const { userId } = useAuth();
    const { focusTag } = useStudy();
    const [insights, setInsights] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (editorContent.length > 100 && userId) {
                setIsAnalyzing(true);
                const data = await generateActiveRecall(editorContent, focusTag, userId);
                if (data) setInsights(data);
                setIsAnalyzing(false);
            }
        }, 5000); // Debounce AI calls

        return () => clearTimeout(timer);
    }, [editorContent, userId, focusTag]);

    return (
        <div className="h-full flex flex-col gap-6 p-4 glass-card border-l border-white/5">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Synapse Intelligence</h4>
                {isAnalyzing && <Zap className="w-3 h-3 text-primary animate-pulse" />}
            </div>

            <ScrollArea className="flex-1">
                <AnimatePresence mode="wait">
                    {insights ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="space-y-6"
                        >
                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-tighter">Core Concept</span>
                                </div>
                                <p className="text-sm font-black italic">{insights.concept}</p>
                            </div>

                            <div className="space-y-3">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Active Recall Injected</span>
                                {insights.cards.map((card: any, i: number) => (
                                    <div key={i} className="p-4 rounded-xl glass border-white/5 text-xs italic opacity-80">
                                        Q: {card.q}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center opacity-20 text-center gap-3">
                            <BookOpen className="w-8 h-8" />
                            <p className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">
                                Keep typing to trigger<br />knowledge compounding
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </ScrollArea>

            <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-yellow-500/50">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Forgetting Curve Active</span>
                </div>
            </div>
        </div>
    );
};

export default SynapseSidebar;