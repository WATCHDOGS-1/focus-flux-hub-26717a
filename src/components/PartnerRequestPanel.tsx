import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Send, Users, UserPlus, Loader2, Tag, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { sendFriendRequest } from "@/utils/friends";

type PartnerRequest = Database["public"]["Tables"]["feed_items"]["Row"] & {
    profiles: { username: string } | null;
};

interface RequestData {
    subject: string;
    details: string;
    tags: string[];
}

const COOLDOWN_MINUTES = 60;
const COOLDOWN_KEY = "last_partner_request_time";

interface PartnerRequestPanelProps {
    onProfileClick: (userId: string) => void;
}

const PartnerRequestPanel = ({ onProfileClick }: PartnerRequestPanelProps) => {
    const { userId } = useAuth();
    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [newSubject, setNewSubject] = useState("");
    const [newDetails, setNewDetails] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [lastRequestTime, setLastRequestTime] = useState<number>(0);

    useEffect(() => {
        const storedTime = localStorage.getItem(COOLDOWN_KEY);
        if (storedTime) {
            setLastRequestTime(parseInt(storedTime, 10));
        }
        loadRequests();
        
        // Realtime listener for new requests (which are stored as feed_items)
        const channel = supabase
            .channel("partner_requests")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "feed_items", filter: `type=eq.partner_request` },
                () => loadRequests()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const loadRequests = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("feed_items")
            .select(`
                *,
                profiles (username)
            `)
            .eq("type", "partner_request")
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error loading partner requests:", error);
            toast.error("Failed to load partner requests.");
        } else {
            setRequests(data as PartnerRequest[]);
        }
        setIsLoading(false);
    };

    const timeRemaining = useMemo(() => {
        const elapsed = Date.now() - lastRequestTime;
        const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
        return Math.max(0, cooldownMs - elapsed);
    }, [lastRequestTime]);

    const isCooldownActive = timeRemaining > 0;

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSubmitRequest = async () => {
        if (!userId || !newSubject.trim()) {
            toast.error("Subject is required.");
            return;
        }
        if (isCooldownActive) {
            toast.warning(`Cooldown active. Try again in ${formatTime(timeRemaining)}.`);
            return;
        }

        setIsPosting(true);
        
        const requestData: RequestData = {
            subject: newSubject.trim(),
            details: newDetails.trim(),
            tags: newSubject.trim().split(/\s+/).filter(t => t.length > 0), // Simple tag extraction
        };

        try {
            const { error } = await supabase
                .from("feed_items")
                .insert({
                    user_id: userId,
                    type: 'partner_request',
                    data: requestData,
                });

            if (error) throw error;

            const now = Date.now();
            localStorage.setItem(COOLDOWN_KEY, now.toString());
            setLastRequestTime(now);
            setNewSubject("");
            setNewDetails("");
            toast.success("Partner request posted! Check back soon.");
            loadRequests();
        } catch (error: any) {
            console.error("Request failed:", error);
            toast.error(error.message || "Failed to post partner request.");
        } finally {
            setIsPosting(false);
        }
    };
    
    const handleSendFriendRequest = async (targetUserId: string) => {
        if (!userId) return;
        await sendFriendRequest(userId, targetUserId);
    };

    const renderRequestCard = (request: PartnerRequest) => {
        const requestData = request.data as RequestData;
        const timeAgo = formatDistanceToNow(new Date(request.created_at), { addSuffix: true });
        const isCurrentUser = request.user_id === userId;

        return (
            <Card key={request.id} className="glass-card hover-lift">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => onProfileClick(request.user_id)}
                        >
                            <Users className="w-5 h-5 text-primary" />
                            <span className="font-bold text-lg hover:underline">{request.profiles?.username || "Unknown User"}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo}
                        </span>
                    </div>
                    
                    <h4 className="text-xl font-semibold">{requestData.subject}</h4>
                    <p className="text-sm text-muted-foreground">{requestData.details || "No additional details provided."}</p>
                    
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                        {requestData.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-secondary/50 px-2 py-1 rounded-full">#{tag}</span>
                        ))}
                    </div>
                    
                    <div className="pt-3 flex gap-2">
                        {!isCurrentUser && (
                            <>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1 flex items-center gap-2"
                                    onClick={() => handleSendFriendRequest(request.user_id)}
                                >
                                    <UserPlus className="w-4 h-4" /> Add Friend
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="flex-1 flex items-center gap-2"
                                    onClick={() => onProfileClick(request.user_id)}
                                >
                                    <MessageSquare className="w-4 h-4" /> View Profile
                                </Button>
                            </>
                        )}
                        {isCurrentUser && <span className="text-sm text-primary">Your Request</span>}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card p-4">
                <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" /> Post a Partner Request
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                    <Textarea
                        placeholder="Subject (e.g., 'Looking for a Python coding buddy tonight')"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        rows={1}
                        disabled={isPosting || isCooldownActive}
                    />
                    <Textarea
                        placeholder="Details (e.g., 'Working on data structures, need someone for 2x 50-minute sessions.')"
                        value={newDetails}
                        onChange={(e) => setNewDetails(e.target.value)}
                        rows={3}
                        disabled={isPosting || isCooldownActive}
                    />
                    
                    <Button 
                        onClick={handleSubmitRequest} 
                        disabled={isPosting || isCooldownActive || !newSubject.trim()}
                        className="w-full dopamine-click"
                    >
                        {isPosting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Post Request
                    </Button>
                    
                    {isCooldownActive && (
                        <div className="text-sm text-warning flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            Cooldown: {formatTime(timeRemaining)} remaining (1 hour limit)
                        </div>
                    )}
                </CardContent>
            </Card>

            <h3 className="text-2xl font-bold border-b border-border pb-2">Active Requests</h3>
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading requests...</div>
                ) : requests.length > 0 ? (
                    requests.map(renderRequestCard)
                ) : (
                    <p className="text-center py-8 text-muted-foreground">No active partner requests. Be the first to post one!</p>
                )}
            </div>
        </div>
    );
};

export default PartnerRequestPanel;