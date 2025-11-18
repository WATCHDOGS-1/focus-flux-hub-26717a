import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PREDEFINED_ROOMS } from "@/utils/constants";
import { useRoomPresence } from "@/hooks/use-room-presence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Zap, Search } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ExploreRooms = () => {
  const navigate = useNavigate();
  const presence = useRoomPresence();
  const [searchTerm, setSearchTerm] = useState("");

  const handleJoinRoom = (roomId: string) => {
    navigate(`/focus-room/${roomId}`);
  };

  const filteredRooms = PREDEFINED_ROOMS.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <AnimatedSection>
        <h1 className="text-4xl font-bold text-center mb-4">
          Explore Focus Rooms
        </h1>
        <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Join a virtual study room to co-work with peers. Each room supports up to 10 users via P2P video.
        </p>
      </AnimatedSection>
      
      {/* Focus Partner Matching / Search Input */}
      <AnimatedSection delay={0.1} className="max-w-xl mx-auto mb-12">
        <Input
          placeholder="Search for a focus tag or room name (e.g., 'Programming', 'Writing')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4 text-muted-foreground" />}
          className="glass-card"
        />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Find peers working on similar tasks for better accountability.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room, index) => {
            const currentUsers = presence[room.id] || 0;
            const isFull = currentUsers >= room.maxCapacity;
            const progressValue = (currentUsers / room.maxCapacity) * 100;

            return (
              <AnimatedSection key={room.id} delay={index * 0.1} className="h-full">
                <Card className={cn("glass-card hover-lift h-full flex flex-col", isFull && "opacity-70")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Zap className="w-6 h-6 text-primary" />
                      {room.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Participants
                        </span>
                        <span className="font-semibold text-foreground">
                          {currentUsers} / {room.maxCapacity}
                        </span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {room.maxCapacity} user limit ensures low-latency P2P video.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={isFull}
                      className="w-full dopamine-click"
                    >
                      {isFull ? "Room Full" : "Join Room"}
                      <Video className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedSection>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-xl text-muted-foreground">No rooms match your search term "{searchTerm}".</p>
            <p className="text-sm text-muted-foreground mt-2">Try a different tag or room name.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreRooms;