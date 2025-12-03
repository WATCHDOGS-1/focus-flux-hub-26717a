import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Brain, Loader2, Zap, Code, MessageSquare, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { sendGeminiChat, generateFlowchart, getGeminiApiKey, initializeGeminiClient } from "@/utils/gemini";
import GeminiApiKeySetup from "./GeminiApiKeySetup";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";
import { cn } from "@/lib/utils";

// Define chat history type compatible with Gemini API
interface ChatPart {
    text: string;
}
interface ChatMessage {
    role: "user" | "model";
    parts: ChatPart[];
}

const AICoachPanel = () => {
    const { userId } = useAuth();
    const { stats, levels } = useUserStats();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const apiKey = getGeminiApiKey();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleChat = async (message: string) => {
        if (!message.trim() || isGenerating) return;
        
        const userMessage: ChatMessage = { role: "user", parts: [{ text: message }] };
        
        // Optimistic update
        setHistory(prev => [...prev, userMessage]);
        setCurrentMessage("");
        setIsGenerating(true);

        try {
            const responseText = await sendGeminiChat(history, message);
            const modelMessage: ChatMessage = { role: "model", parts: [{ text: responseText }] };
            
            setHistory(prev => [...prev, modelMessage]);
        } catch (error: any) {
            toast.error(error.message || "AI Coach failed to respond.");
            // Remove optimistic message if failed
            setHistory(prev => prev.slice(0, -1));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFlowchartGeneration = async (prompt: string) => {
        if (isGenerating) return;
        
        const userMessage: ChatMessage = { role: "user", parts: [{ text: `Generate a flowchart for: ${prompt}` }] };
        setHistory(prev => [...prev, userMessage]);
        setIsGenerating(true);

        try {
            const mermaidCode = await generateFlowchart(prompt);
            
            const modelMessage: ChatMessage = { 
                role: "model", 
                parts: [{ 
                    text: `Here is the Mermaid flowchart code for your plan. You can copy this code into a Mermaid live editor to visualize it:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`` 
                }] 
            };
            setHistory(prev => [...prev, modelMessage]);
        } catch (error: any) {
            toast.error(error.message || "Flowchart generation failed.");
            setHistory(prev => prev.slice(0, -1));
        } finally {
            setIsGenerating(false);
        }
    };

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isUser = msg.role === "user";
        const text = msg.parts[0]?.text || "";
        
        // Check for Mermaid code block
        const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)\n```/);
        const isMermaid = !!mermaidMatch;

        return (
            <div
                key={index}
                className={cn(
                    "p-3 rounded-lg max-w-[90%] flex flex-col",
                    isUser ? "bg-primary/20 ml-auto" : "bg-secondary/20 mr-auto"
                )}
            >
                <div className="text-xs font-bold mb-1 flex items-center gap-1">
                    {isUser ? <MessageSquare className="w-3 h-3" /> : <Brain className="w-3 h-3 text-accent" />}
                    {isUser ? "You" : "AI Coach"}
                </div>
                
                {isMermaid ? (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-primary">Flowchart Generated (Mermaid Code):</p>
                        <pre className="bg-background/50 p-2 rounded text-xs overflow-x-auto">
                            {mermaidMatch![1].trim()}
                        </pre>
                        <p className="text-xs text-muted-foreground">
                            *Note: Visualization requires a Mermaid rendering library (not included). Copy the code above to a Mermaid editor.*
                        </p>
                    </div>
                ) : (
                    <p className="text-sm whitespace-pre-wrap">{text}</p>
                )}
            </div>
        );
    };

    if (!apiKey) {
        return (
            <div className="h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent" />
                    AI Focus Coach
                </h3>
                <GeminiApiKeySetup />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                AI Focus Coach
            </h3>

            {/* Predetermined Functions */}
            <div className="space-y-2 mb-4 p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-semibold flex items-center gap-1 text-primary">
                    <LayoutGrid className="w-4 h-4" /> Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFlowchartGeneration("Plan my study session for the next 3 hours, including breaks and tasks.")}
                        disabled={isGenerating}
                        className="text-xs h-8"
                    >
                        <Code className="w-3 h-3 mr-1" /> Study Plan Flowchart
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFlowchartGeneration("Generate a decision tree for handling distractions during deep work.")}
                        disabled={isGenerating}
                        className="text-xs h-8"
                    >
                        <Code className="w-3 h-3 mr-1" /> Distraction Flowchart
                    </Button>
                </div>
            </div>

            {/* Chat History */}
            <ScrollArea className="flex-1 space-y-4 overflow-y-auto mb-4 pr-2">
                <div className="space-y-4">
                    {history.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Start chatting with your AI Coach for personalized productivity advice!
                        </div>
                    )}
                    {history.map(renderMessage)}
                    {isGenerating && (
                        <div className="flex items-center justify-start p-3 rounded-lg bg-secondary/20 mr-auto max-w-[90%]">
                            <Loader2 className="w-4 h-4 animate-spin mr-2 text-accent" />
                            <span className="text-sm text-muted-foreground">AI Coach is thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
                <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleChat(currentMessage)}
                    placeholder="Ask your AI Coach anything..."
                    className="flex-1"
                    disabled={isGenerating}
                />
                <Button size="icon" onClick={() => handleChat(currentMessage)} className="dopamine-click" disabled={!currentMessage.trim() || isGenerating}>
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default AICoachPanel;