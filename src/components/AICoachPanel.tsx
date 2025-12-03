import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Brain, Loader2, Zap, Code, MessageSquare, LayoutGrid, Database, Target, Image, X, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { sendGeminiChat, generateFlowchart, getGeminiApiKey, fileToGenerativePart, ChatPart } from "@/utils/gemini";
import GeminiApiKeySetup from "./GeminiApiKeySetup";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";
import { cn } from "@/lib/utils";
import { getRecentFocusSessions } from "@/utils/session-management";
import { getLocalStudyData } from "@/utils/local-data";

// Define chat history type compatible with Gemini API
interface ChatMessage {
    role: "user" | "model";
    parts: ChatPart[];
}

const LONG_TERM_GOAL_KEY = "ai_coach_long_term_goal";

const AICoachPanel = () => {
    const { userId } = useAuth();
    const { stats, levels } = useUserStats();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [goalContext, setGoalContext] = useState(""); // Temporary context for current chat
    const [longTermGoal, setLongTermGoal] = useState(""); // Persistent long-term goal
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiKey = getGeminiApiKey();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);
    
    useEffect(() => {
        const storedGoal = localStorage.getItem(LONG_TERM_GOAL_KEY);
        if (storedGoal) {
            setLongTermGoal(storedGoal);
        }
    }, []);

    const handleSaveLongTermGoal = () => {
        if (longTermGoal.trim()) {
            localStorage.setItem(LONG_TERM_GOAL_KEY, longTermGoal.trim());
            toast.success("Long-term goal saved!");
        } else {
            localStorage.removeItem(LONG_TERM_GOAL_KEY);
            setLongTermGoal("");
            toast.info("Long-term goal cleared.");
        }
    };

    const getContextualPromptPrefix = () => {
        let prefix = "";
        if (goalContext.trim()) {
            prefix += `[CURRENT CHAT GOAL: ${goalContext.trim()}] `;
        }
        if (longTermGoal.trim()) {
            prefix += `[LONG-TERM GOAL: ${longTermGoal.trim()}] `;
        }
        if (stats) {
            prefix += `[USER STATS: Total Focused Minutes=${stats.total_focused_minutes}, Longest Streak=${stats.longest_streak} days] `;
        }
        return prefix;
    };

    const handleLoadData = async () => {
        if (!userId || isGenerating) return;

        setIsGenerating(true);
        
        // 1. Fetch Supabase Data
        const sessionData = await getRecentFocusSessions(userId);
        const sessionSummary = sessionData.length > 0 
            ? sessionData.map(s => `${s.tag} (${s.totalMinutes} min)`).join(", ")
            : "No recent focused sessions found.";

        // 2. Fetch Local Data
        const localData = getLocalStudyData();
        const tasksSummary = localData.tasks.length > 0 
            ? localData.tasks.map(t => t.content).join("; ")
            : "No incomplete tasks found.";
        
        const dataPrompt = `
        ${getContextualPromptPrefix()}
        --- User Study Data ---
        Recent Focus Sessions (Last 7 days, aggregated by subject/tag): ${sessionSummary}
        Incomplete To-Do List Items (Local Storage): ${tasksSummary}
        Local Notes Summary (First 200 chars): ${localData.notesSummary || "No notes found."}
        --- End Data ---
        
        Analyze this data and provide a brief summary of my current focus areas and potential productivity bottlenecks.
        `;

        const userMessage: ChatMessage = { role: "user", parts: [{ text: "Loading and analyzing study data..." }] };
        
        // Optimistic update
        const optimisticHistory = [...history, userMessage];
        setHistory(optimisticHistory);

        try {
            // Send the dataPrompt as the new message parts
            const responseText = await sendGeminiChat(history, [{ text: dataPrompt }]);
            const modelMessage: ChatMessage = { role: "model", parts: [{ text: responseText }] };
            
            // Replace the optimistic message with the actual response
            setHistory(prev => [...prev.slice(0, -1), modelMessage]);
            toast.success("Study data loaded and analyzed.");
        } catch (error: any) {
            toast.error(error.message || "AI Coach failed to analyze data.");
            setHistory(prev => prev.slice(0, -1)); // Remove optimistic message
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateTip = async () => {
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const tipPrompt = `Based on the user's current stats (Total Focused Minutes: ${stats?.total_focused_minutes || 0}, Longest Streak: ${stats?.longest_streak || 0} days) and their long-term goal (${longTermGoal || 'None Set'}), generate one highly specific, actionable productivity tip for their next focus session. Keep it concise.`;
        
        const userMessage: ChatMessage = { role: "user", parts: [{ text: "Requesting a personalized productivity tip..." }] };
        const optimisticHistory = [...history, userMessage];
        setHistory(optimisticHistory);

        try {
            const responseText = await sendGeminiChat(history, [{ text: tipPrompt }]);
            const modelMessage: ChatMessage = { role: "model", parts: [{ text: responseText }] };
            
            setHistory(prev => [...prev.slice(0, -1), modelMessage]);
            toast.success("Productivity tip generated.");
        } catch (error: any) {
            toast.error(error.message || "AI Coach failed to generate tip.");
            setHistory(prev => prev.slice(0, -1));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInjectContext = (contextType: 'stats' | 'notes' | 'tasks') => {
        let contextText = "";
        if (contextType === 'stats' && stats) {
            contextText = `[STATS CONTEXT: Total Focused Minutes=${stats.total_focused_minutes}, Longest Streak=${stats.longest_streak} days]`;
        } else if (contextType === 'notes') {
            const notesSummary = getLocalStudyData().notesSummary;
            contextText = `[NOTES CONTEXT: ${notesSummary || "No notes found."}]`;
        } else if (contextType === 'tasks') {
            const tasksSummary = getLocalStudyData().tasks.map(t => t.content).join("; ");
            contextText = `[TASKS CONTEXT: Incomplete Tasks: ${tasksSummary || "No incomplete tasks found."}]`;
        }
        
        if (contextText) {
            setCurrentMessage(prev => (prev + " " + contextText).trim());
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Only image files are supported for analysis.");
                return;
            }
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            toast.info("Image loaded for next prompt.");
        }
    };

    const handleChat = async (message: string) => {
        if (!message.trim() && !imageFile || isGenerating) return;
        
        const contextualMessage = getContextualPromptPrefix() + message;
        
        // 1. Construct the optimistic user message for display
        const userMessageText = imageFile ? `(Image attached) ${message}` : message;
        const userMessage: ChatMessage = { role: "user", parts: [{ text: userMessageText }] }; 
        
        // 2. Optimistic update
        const optimisticHistory = [...history, userMessage];
        setHistory(optimisticHistory);
        setCurrentMessage("");
        setIsGenerating(true);
        
        const currentImageFile = imageFile;
        setImageFile(null); // Clear image immediately
        setImagePreviewUrl(null);

        try {
            // 3. Construct the actual parts payload for the API
            const newParts: ChatPart[] = [{ text: contextualMessage }];
            if (currentImageFile) {
                const imagePart = await fileToGenerativePart(currentImageFile);
                newParts.unshift(imagePart);
            }
            
            // 4. Send API call using the previous history state
            const responseText = await sendGeminiChat(history, newParts);
            const modelMessage: ChatMessage = { role: "model", parts: [{ text: responseText }] };
            
            // 5. Replace the optimistic message with the final response
            setHistory(prev => [...prev.slice(0, -1), modelMessage]);
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
        
        const contextualPrompt = getContextualPromptPrefix() + prompt;
        const userMessage: ChatMessage = { role: "user", parts: [{ text: `Generate a flowchart for: ${prompt}` }] };
        
        const optimisticHistory = [...history, userMessage];
        setHistory(optimisticHistory);
        setIsGenerating(true);

        try {
            const mermaidCode = await generateFlowchart(contextualPrompt);
            
            const modelMessage: ChatMessage = { 
                role: "model", 
                parts: [{ 
                    text: `Here is the Mermaid flowchart code for your plan. You can copy this code into a Mermaid live editor to visualize it:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`` 
                }] 
            };
            setHistory(prev => [...prev.slice(0, -1), modelMessage]);
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
                key={msg.id || index} // Use index as fallback if id is missing
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
            
            {/* Long-Term Goal Setting */}
            <div className="mb-4 space-y-2 p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-semibold flex items-center gap-1 text-primary">
                    <Target className="w-4 h-4" /> Long-Term Focus Goal
                </p>
                <div className="flex gap-2">
                    <Input
                        placeholder="e.g., 'Finish my thesis by end of month'"
                        value={longTermGoal}
                        onChange={(e) => setLongTermGoal(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleSaveLongTermGoal} className="dopamine-click">
                        Save
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    This goal provides context for all AI advice.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 mb-4 p-4 rounded-lg bg-secondary/30">
                <p className="text-sm font-semibold flex items-center gap-1 text-primary">
                    <LayoutGrid className="w-4 h-4" /> Quick Actions
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLoadData}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <Database className="w-3 h-3 mr-1" /> Load Study Data
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateTip}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <Lightbulb className="w-3 h-3 mr-1" /> Get Tip
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFlowchartGeneration("Plan my study session for the next 3 hours, including breaks and tasks.")}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <Code className="w-3 h-3 mr-1" /> Study Plan
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFlowchartGeneration("Generate a decision tree for handling distractions during deep work.")}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <Code className="w-3 h-3 mr-1" /> Distraction Flowchart
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFlowchartGeneration("Create a step-by-step guide for effective note-taking.")}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <Code className="w-3 h-3 mr-1" /> Note-Taking
                    </Button>
                </div>
                
                <p className="text-sm font-semibold flex items-center gap-1 text-primary pt-3 border-t border-border/50 mt-3">
                    <Target className="w-4 h-4" /> Inject Context
                </p>
                <div className="grid grid-cols-3 gap-3">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleInjectContext('stats')}
                        className="text-xs h-9"
                    >
                        Inject Stats
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleInjectContext('notes')}
                        className="text-xs h-9"
                    >
                        Inject Notes
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleInjectContext('tasks')}
                        className="text-xs h-9"
                    >
                        Inject Tasks
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

            {/* Input and Image Preview */}
            {imagePreviewUrl && (
                <div className="relative mb-2 p-2 rounded-lg border border-primary/50 bg-secondary/20">
                    <img src={imagePreviewUrl} alt="Image for AI analysis" className="h-16 w-auto object-contain rounded" />
                    <span className="text-xs text-muted-foreground mt-1 block">Image attached for next prompt.</span>
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 w-5 h-5"
                        onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            )}

            <div className="flex gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isGenerating}
                />
                <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="dopamine-click flex-shrink-0"
                    disabled={isGenerating}
                    title="Upload Image for Analysis"
                >
                    <Image className="w-4 h-4" />
                </Button>
                <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleChat(currentMessage)}
                    placeholder="Ask your AI Coach anything..."
                    className="flex-1"
                    disabled={isGenerating}
                />
                <Button size="icon" onClick={() => handleChat(currentMessage)} className="dopamine-click" disabled={(!currentMessage.trim() && !imageFile) || isGenerating}>
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default AICoachPanel;