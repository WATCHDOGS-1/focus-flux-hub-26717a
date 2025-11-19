import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeedPostProps {
    id: string;
    username: string;
    avatarUrl?: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    type: "status" | "achievement" | "session";
    achievementData?: {
        title: string;
        icon: string;
    };
}

const FeedPost = ({ username, avatarUrl, content, timestamp, likes, comments, type, achievementData }: FeedPostProps) => {
    return (
        <div className="glass-card border-white/5 mb-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:border-primary/30 transition-colors group">
            <div className="flex flex-row items-start gap-4 p-5 pb-2">
                <Avatar className="w-12 h-12 ring-2 ring-white/5 group-hover:ring-primary/50 transition-all">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-black/40 text-white font-heading font-bold">{username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-base text-white group-hover:text-primary transition-colors truncate">
                            {username}
                        </h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/10">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs font-mono text-white/40 uppercase tracking-wider">{timestamp}</p>
                </div>
            </div>

            <div className="px-5 py-2 space-y-4">
                {/* Content Body */}
                <p className="text-sm md:text-base leading-relaxed text-white/80 whitespace-pre-wrap font-light">
                    {content}
                </p>

                {/* Achievement/Session Highlight Card */}
                {(type === "achievement" || type === "session") && achievementData && (
                    <div className={cn(
                        "rounded-xl p-4 flex items-center gap-4 border backdrop-blur-md transition-all duration-300",
                        type === "achievement"
                            ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20 hover:border-yellow-500/40"
                            : "bg-gradient-to-r from-primary/10 to-transparent border-primary/20 hover:border-primary/40"
                    )}>
                        <div className={cn(
                            "text-3xl p-2 rounded-lg bg-black/20",
                            type === "achievement" ? "shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                        )}>
                            {achievementData.icon}
                        </div>
                        <div>
                            <p className={cn(
                                "text-xs font-bold uppercase tracking-widest mb-1",
                                type === "achievement" ? "text-yellow-500" : "text-primary"
                            )}>
                                {type === "achievement" ? "Level Up" : "Focus Session"}
                            </p>
                            <p className="text-base font-heading font-semibold text-white">{achievementData.title}</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-red-400 hover:bg-red-500/10 gap-2 transition-all group/btn">
                        <Heart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-xs font-mono">{likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-primary hover:bg-primary/10 gap-2 transition-all group/btn">
                        <MessageCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-xs font-mono">{comments}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10 transition-all group/btn">
                        <Share2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FeedPost;
