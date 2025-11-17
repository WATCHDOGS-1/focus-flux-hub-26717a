import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveTags } from "@/hooks/use-active-tags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Zap, Loader2 } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { cn } from "@/lib/utils";

const ExploreRooms = () => {
  const navigate = useNavigate();
  const { activeTags, isLoading } = useActiveTags();
  const [searchTag, setSearchTag] = useState("");

  const normalizedSearchTag = searchTag.trim().toLowerCase();
  
  const filteredTags = activeTags.filter(tag => 
    tag.tag.toLowerCase().includes(normalizedSearchTag)
  );

  const handleJoinTag = (tag: string) => {
    // Navigate to the new tag-based route
    navigate(`/focus/${encodeURIComponent(tag)}`);
  };
  
  const handleSearchSubmit = () => {
    if (normalizedSearchTag) {
      handleJoinTag(normalizedSearchTag);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <AnimatedSection>
        <h1 className="text-4xl font-bold text-center mb-4">
          What is Your Mission?
        </h1>
        <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-12">
          Declare your focus tag to join a virtual room with peers working on the same mission.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="max-w-xl mx-auto mb-12">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Programming, Finals Study, Writing Thesis"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="flex-1 text-lg py-6"
            icon={<Search className="w-5 h-5 text-muted-foreground" />}
          />
          <Button 
            onClick={handleSearchSubmit} 
            disabled={!normalizedSearchTag}
            className="dopamine-click text-lg px-6"
          >
            Join
          </Button>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Active Focus Groups
        </h2>
      </AnimatedSection>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Scanning for active missions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {filteredTags.length > 0 ? (
            filteredTags.map((room, index) => (
              <AnimatedSection key={room.tag} delay={index * 0.05} className="h-full">
                <Card 
                  className="glass-card hover-lift h-full flex flex-col cursor-pointer"
                  onClick={() => handleJoinTag(room.tag)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl truncate">
                      <Zap className="w-5 h-5 text-primary" />
                      {room.tag}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Peers focusing on this exact mission right now. Join for instant accountability.
                    </p>
                    <div className="flex items-center justify-between text-sm font-semibold text-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1 text-primary">
                        <Users className="w-4 h-4" />
                        Active Users
                      </span>
                      <span className="text-2xl font-bold">
                        {room.active_users}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-lg text-muted-foreground">
                No active groups found for "{normalizedSearchTag || 'any tag'}". Be the first to start this mission!
              </p>
              {normalizedSearchTag && (
                <Button onClick={() => handleJoinTag(normalizedSearchTag)} className="mt-4 dopamine-click">
                  Start Focusing on "{normalizedSearchTag}"
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExploreRooms;