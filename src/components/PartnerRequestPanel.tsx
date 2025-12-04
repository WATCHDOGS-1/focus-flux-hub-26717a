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

    // Temporarily disable partner request functionality and show coming soon message
    return (
        <div className="text-center py-20 space-y-4 glass-card p-8 rounded-xl">
            <Users className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-2xl font-bold">Focus Partner Matching: Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
                We are currently refining our algorithm for matching you with the perfect focus partner. This feature will return soon!
            </p>
        </div>
    );

    // --- Original logic (commented out/removed) ---
};

export default PartnerRequestPanel;