import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Circle = Database["public"]["Tables"]["circles"]["Row"];

const StudyCircles = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [myCircles, setMyCircles] = useState<Circle[]>([]);
  const [discoverCircles, setDiscoverCircles] = useState<Circle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");

  useEffect(() => {
    if (userId) {
      loadCircles();
    }
  }, [userId]);

  const loadCircles = async () => {
    if (!userId) return;
    setIsLoading(true);

    // Fetch circles the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Error fetching user's circles:", memberError);
    } else {
      const circleIds = memberData.map(m => m.circle_id);
      if (circleIds.length > 0) {
        const { data: circlesData, error: circlesError } = await supabase
          .from("circles")
          .select("*")
          .in("id", circleIds);
        if (circlesData) setMyCircles(circlesData);
      } else {
        setMyCircles([]);
      }
    }

    // Fetch circles to discover (all circles for now, can be optimized)
    const { data: allCircles, error: allCirclesError } = await supabase
      .from("circles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (allCircles) setDiscoverCircles(allCircles);

    setIsLoading(false);
  };

  const handleCreateCircle = async () => {
    if (!userId || !newCircleName.trim()) {
      toast.error("Circle name is required.");
      return;
    }

    // 1. Create Circle
    const { data: circleData, error: circleError } = await supabase
      .from("circles")
      .insert({ name: newCircleName, description: newCircleDesc, owner_id: userId })
      .select()
      .single();

    if (circleError) {
      console.error("Error creating circle:", circleError);
      toast.error("Failed to create circle.");
      return;
    } 
    
    if (circleData) {
      // 2. Add owner as a member
      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({ circle_id: circleData.id, user_id: userId, role: 'owner' });
        
      if (memberError) {
        console.error("Error adding owner to circle_members:", memberError);
        toast.error("Failed to add you as a member (RLS issue?).");
        // Optionally delete the circle if membership fails
        await supabase.from("circles").delete().eq("id", circleData.id);
        return;
      }

      toast.success("Study Circle created!");
      setIsCreateDialogOpen(false);
      setNewCircleName("");
      setNewCircleDesc("");
      loadCircles();
      navigate(`/circle/${circleData.id}`);
    }
  };

  const filteredDiscover = discoverCircles.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCircleCard = (circle: Circle) => (
    <Card
      key={circle.id}
      className="glass-card hover-lift cursor-pointer"
      onClick={() => navigate(`/circle/${circle.id}`)}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> {circle.name}</CardTitle>
        <CardDescription className="truncate">{circle.description || "No description."}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading circles...</div>;
  }

  return (
    <Tabs defaultValue="my-circles">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="my-circles">My Circles</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2 dopamine-click">
              <Plus className="w-4 h-4" /> Create Circle
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Create a New Study Circle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Circle Name (e.g., 'Quantum Physics Crew')" value={newCircleName} onChange={e => setNewCircleName(e.target.value)} />
              <Input placeholder="Description (Optional)" value={newCircleDesc} onChange={e => setNewCircleDesc(e.target.value)} />
              <Button onClick={handleCreateCircle} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <TabsContent value="my-circles">
        <div className="space-y-4">
          {myCircles.length > 0 ? (
            myCircles.map(renderCircleCard)
          ) : (
            <p className="text-center py-8 text-muted-foreground">You haven't joined any circles yet. Discover one!</p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="discover">
        <div className="space-y-4">
          <Input
            placeholder="Search for circles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4 text-muted-foreground" />}
          />
          {filteredDiscover.map(renderCircleCard)}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default StudyCircles;