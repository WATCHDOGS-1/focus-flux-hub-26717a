import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Shield, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const StudyCircles = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [circles, setCircles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("circles").select("*").limit(20);
      setCircles(data || []);
      setIsLoading(false);
    };
    load();
  }, []);

  const createCircle = async () => {
    if (!name.trim()) return;
    const { data, error } = await supabase.from("circles").insert({ name, owner_id: userId }).select().single();
    if (error) toast.error(error.message);
    else {
        await supabase.from("circle_members").insert({ circle_id: data.id, user_id: userId, role: 'owner' });
        toast.success("Circle Created!");
        navigate(`/circle/${data.id}`);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Study Circles</h2>
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="rounded-full dopamine-click"><Plus className="w-4 h-4 mr-2" /> New Circle</Button>
                </DialogTrigger>
                <DialogContent className="glass">
                    <DialogHeader><DialogTitle>Create Study Circle</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Input placeholder="Circle Name" value={name} onChange={e => setName(e.target.value)} />
                        <Button onClick={createCircle} className="w-full">Initialize Circle</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {circles.map(c => (
                <div key={c.id} className="glass p-6 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/circle/${c.id}`)}>
                    <div className="space-y-1">
                        <h4 className="font-bold text-lg">{c.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" /> Persistent Group
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            ))}
        </div>
    </div>
  );
};

export default StudyCircles;