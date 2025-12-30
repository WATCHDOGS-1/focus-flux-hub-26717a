import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Brain, Sparkles, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendGeminiChat, getGeminiApiKey } from "@/utils/gemini";
import GeminiApiKeySetup from "./GeminiApiKeySetup";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
    role: "user" | "model";
    parts: { text: string }[];
}

const AICoachPanel = () => {
    const { userId } = useAuth();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const apiKey = getGeminiApiKey();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    const handleChat = async () => {
        if (!currentMessage.trim() || isGenerating) return;
        
        const messageText = currentMessage.trim();
        const userMessage: ChatMessage = { role: "user", parts: [{ text: messageText }] };
        
        setHistory(prev => [...prev, userMessage]);
        setCurrentMessage("");
        setIsGenerating(true);

        try {
            const responseText = await sendGeminiChat([...history, userMessage]);
            setHistory(prev => [...prev, { role: "model", parts: [{ text: responseText }] }]);
        } catch (error: any) {
            toast.error(error.message || "Coach encountered an error.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!apiKey) {
        return (
            <div className="h-full flex flex-col space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Brain className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">AI Focus Coach</h3>
                </div>
                <GeminiApiKeySetup />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold">Elite Coach</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Always Online</p>
                </div>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-6">
                    {history.length === 0 && (
                        <div className="text-center py-12 space-y-4">
                            <Brain className="w-12 h-12 text-muted/20 mx-auto" />
                            <p className="text-sm text-muted-foreground max-w-[180px] mx-auto">
                                How can I help you master your focus today?
                            </p>
                        </div>
                    )}
                    {history.map((msg, i) => (
                        <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                                msg.role === 'user' ? "bg-secondary" : "bg-primary/10 text-primary border-primary/20"
                            )}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl text-sm max-w-[85%] leading-relaxed",
                                msg.role === 'user' ? "bg-primary text-white" : "bg-secondary/50 border border-white/5"
                            )}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-sm">
                                    {msg.parts[0].text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isGenerating && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                            <div className="bg-secondary/50 border border-white/5 p-4 rounded-2xl flex gap-1">
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="pt-6">
                <div className="relative group">
                    <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleChat()}
                        placeholder="Message your coach..."
                        className="h-12 bg-secondary/50 border-white/5 rounded-2xl pl-4 pr-12 focus-visible:ring-primary/20 focus-visible:border-primary/50"
                    />
                    <Button 
                        size="icon" 
                        onClick={handleChat} 
                        disabled={!currentMessage.trim() || isGenerating}
                        className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl premium-gradient shadow-lg"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AICoachPanel;