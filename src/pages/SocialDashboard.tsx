import { useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import FeedPost, { FeedPostProps } from "@/components/social/FeedPost";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bell, Send } from "lucide-react";

const MOCK_POSTS: FeedPostProps[] = [
    {
        id: "1",
        username: "Alex Chen",
        content: "Just hit a 4 hour deep work streak! The flow state was real today. 🚀",
        timestamp: "2h ago",
        likes: 24,
        comments: 5,
        type: "session",
        achievementData: {
            title: "4h Deep Work Session",
            icon: "🧠"
        }
    },
    {
        id: "2",
        username: "Sarah Miller",
        content: "Finally leveled up to Monk Class! Time to meditate on some code.",
        timestamp: "4h ago",
        likes: 156,
        comments: 12,
        type: "achievement",
        achievementData: {
            title: "Monk Level 1 Unlocked",
            icon: "🧘"
        }
    },
    {
        id: "3",
        username: "David Kim",
        content: "Anyone up for a 50/10 Pomodoro cycle? Starting in 5 mins.",
        timestamp: "5m ago",
        likes: 8,
        comments: 3,
        type: "status"
    }
];

const SocialDashboard = () => {
    const [postContent, setPostContent] = useState("");

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* Mobile Header */}
            <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-4 py-3 flex items-center justify-between md:hidden bg-black/20 backdrop-blur-xl">
                <h1 className="text-2xl font-heading font-bold tracking-tighter text-white text-glow">
                    ONLY<span className="text-primary">FOCUS</span>
                </h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-primary transition-colors">
                        <Search className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-primary transition-colors">
                        <Bell className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <main className="container max-w-2xl mx-auto pt-4 px-4 md:pt-8">
                {/* Create Post Widget */}
                <div className="glass-card border border-white/10 rounded-xl p-4 mb-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex gap-4 relative z-10">
                        <Avatar className="ring-2 ring-white/10">
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">YO</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <Textarea
                                placeholder="Log your status..."
                                className="bg-black/20 border-none resize-none focus-visible:ring-0 p-3 text-base min-h-[80px] font-mono text-white/90 placeholder:text-white/30 rounded-lg transition-all focus:bg-black/40"
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/30 font-mono uppercase tracking-wider">
                                    {postContent.length}/280
                                </span>
                                <Button size="sm" className="rounded-lg px-6 bg-primary hover:bg-primary/80 text-white font-bold tracking-wide shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:shadow-[0_0_25px_rgba(124,58,237,0.7)] transition-all" disabled={!postContent.trim()}>
                                    TRANSMIT <Send className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed */}
                <div className="space-y-4">
                    {MOCK_POSTS.map((post) => (
                        <FeedPost key={post.id} {...post} />
                    ))}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default SocialDashboard;
