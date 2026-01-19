import { useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Brain, Trash2, Zap, Target } from "lucide-react";
import { runAITaskCheckin } from "@/utils/ai-coach";
import { useFocusSession } from "@/hooks/use-focus-session";
import { toast } from "sonner";

const StrategicReview = () => {
    const { tasks } = useTasks();
    const { focusTag } = useFocusSession();

    const handleAudit = () => {
        if (tasks.length === 0) {
            toast.info("No tasks to audit. Strategic silence.");
            return;
        }
        toast.loading("Naval is reviewing your leverage...", { id: 'audit' });
        runAITaskCheckin(focusTag || "General", tasks);
        setTimeout(() => toast.dismiss('audit'), 2000);
    };

    return (
        <div className="glass-card p-6 rounded-[2rem] border-primary/20 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black italic tracking-tighter uppercase text-sm">Leverage Audit</h4>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Find the 20%</p>
                </div>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
                Let the AI Coach scan your current task list to identify shallow work and suggest deletions based on the principle of leverage.
            </p>
            
            <Button 
                onClick={handleAudit} 
                className="w-full h-12 rounded-2xl dopamine-click premium-gradient font-bold"
            >
                <Brain className="w-4 h-4 mr-2" /> Trigger Strategic Review
            </Button>
        </div>
    );
};

export default StrategicReview;