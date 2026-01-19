import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ExternalLink, CheckCircle2, LayoutGrid } from "lucide-react";
import CloudinaryImage from "./CloudinaryImage";

const ProjectGallery = () => {
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(6);
            setProjects(data || []);
        };
        load();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                    <LayoutGrid className="text-primary" /> Artifacts of Flow
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map(p => (
                    <div key={p.id} className="glass-interactive p-1 rounded-[2.5rem] group overflow-hidden">
                        <div className="relative h-48 rounded-[2rem] overflow-hidden mb-6">
                            {p.image_url ? (
                                <CloudinaryImage publicIdOrUrl={p.image_url} width={400} height={200} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                            ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 opacity-10" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 bg-primary/90 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {p.focus_tag}
                            </div>
                        </div>
                        <div className="p-6 pt-0">
                            <h4 className="font-black italic tracking-tighter uppercase text-sm mb-2">{p.title}</h4>
                            <p className="text-xs opacity-40 line-clamp-2 leading-relaxed mb-4">{p.summary}</p>
                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                <span className="text-[10px] font-black text-primary uppercase">+{p.xp_attained} Pure XP</span>
                                <ExternalLink className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectGallery;