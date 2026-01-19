import { motion } from "framer-motion";
import { Zap, Target, Book, Shield, Star, Lock } from "lucide-react";
import { toast } from "sonner";

const PERKS = [
    { id: 'leverage', name: 'Leverage', icon: Zap, cost: 500, description: 'Unlock Advanced Analytics', unlocked: true },
    { id: 'deep_flow', name: 'Deep Flow', icon: Target, cost: 1200, description: 'Binaural Beats in HUD', unlocked: false },
    { id: 'compound', name: 'Compounder', icon: Star, cost: 2500, description: '2x XP for 4AM Sessions', unlocked: false },
    { id: 'fortress', name: 'The Fortress', icon: Shield, cost: 5000, description: 'Squad Leader Status', unlocked: false },
];

const SkillTree = () => {
    const handleUnlock = (perk: any) => {
        if (perk.unlocked) return;
        toast.info(`Insufficient Focus Points to unlock ${perk.name}.`);
    };

    return (
        <div className="glass-card p-10 rounded-[3rem] border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Book className="w-16 h-16" />
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-12">Skill Tree</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
                {/* SVG Connections (Abstract) */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <svg className="w-full h-full">
                        <line x1="12%" y1="50%" x2="37%" y2="50%" stroke="white" strokeWidth="1" strokeDasharray="4" />
                        <line x1="37%" y1="50%" x2="62%" y2="50%" stroke="white" strokeWidth="1" strokeDasharray="4" />
                        <line x1="62%" y1="50%" x2="87%" y2="50%" stroke="white" strokeWidth="1" strokeDasharray="4" />
                    </svg>
                </div>

                {PERKS.map((perk, i) => (
                    <motion.div 
                        key={perk.id}
                        whileHover={{ y: -5 }}
                        className="flex flex-col items-center gap-4 z-10"
                        onClick={() => handleUnlock(perk)}
                    >
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 transition-all cursor-pointer ${perk.unlocked ? 'bg-primary/20 border-primary shadow-glow' : 'bg-white/5 border-white/10 opacity-40'}`}>
                            {perk.unlocked ? <perk.icon className="w-8 h-8 text-primary" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest">{perk.name}</p>
                            <p className="text-[8px] opacity-40 font-bold uppercase">{perk.unlocked ? 'Active' : `${perk.cost} FP`}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default SkillTree;