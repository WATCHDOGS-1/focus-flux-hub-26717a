import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Brain, Loader2, Zap, Database, Target, Paperclip, X, Lightbulb, MessageSquare, LayoutGrid, Save, Trash2, NotebookText, CalendarDays, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { sendGeminiChat, getGeminiApiKey, fileToGenerativePart, ChatPart } from "@/utils/gemini";
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
const SAVED_CONTEXT_KEY = "ai_coach_saved_context";

const AICoachPanel = () => {
    const { userId } = useAuth();
    const { stats, levels } = useUserStats();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [longTermGoal, setLongTermGoal] = useState(""); // Persistent long-term goal
    const [savedContext, setSavedContext] = useState<ChatMessage[] | null>(null); // Persistent memory
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiKey = getGeminiApiKey();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- Initialization and Context Loading ---
    useEffect(() => {
        scrollToBottom();
    }, [history]);
    
    useEffect(() => {
        const storedGoal = localStorage.getItem(LONG_TERM_GOAL_KEY);
        if (storedGoal) {
            setLongTermGoal(storedGoal);
        }
        
        const storedContext = localStorage.getItem(SAVED_CONTEXT_KEY);
        if (storedContext) {
            try {
                setSavedContext(JSON.parse(storedContext));
            } catch (e) {
                console.error("Failed to parse saved context:", e);
                localStorage.removeItem(SAVED_CONTEXT_KEY);
            }
        }
    }, []);

    // --- Persistent Memory Handlers ---
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
    
    const handleSaveContext = () => {
        if (history.length === 0) {
            toast.warning("Start a conversation before saving context.");
            return;
        }
        localStorage.setItem(SAVED_CONTEXT_KEY, JSON.stringify(history));
        setSavedContext(history);
        toast.success("Chat context saved for future sessions!");
    };
    
    const handleClearContext = () => {
        localStorage.removeItem(SAVED_CONTEXT_KEY);
        setSavedContext(null);
        toast.info("Saved chat context cleared.");
    };

    // --- Contextual Prompt Generation ---
    const getContextualPromptPrefix = () => {
        let prefix = "";
        if (longTermGoal.trim()) {
            prefix += `[LONG-TERM GOAL: ${longTermGoal.trim()}] `;
        }
        if (stats) {
            prefix += `[USER STATS: Total Focused Minutes=${stats.total_focused_minutes}, Longest Streak=${stats.longest_streak} days] `;
        }
        return prefix;
    };

    // --- Quick Actions ---
    const handleAnalyzeData = async (range: 'day' | 'week' | 'month') => {
        if (!userId || isGenerating) return;

        setIsGenerating(true);
        
        const sessionData = await getRecentFocusSessions(userId, range);
        const sessionSummary = sessionData.length > 0 
            ? sessionData.map(s => `${s.tag} (${s.totalMinutes} min)`).join(", ")
            : `No focused sessions found in the last ${range}.`;

        const localData = getLocalStudyData();
        const tasksSummary = localData.tasks.length > 0 
            ? localData.tasks.map(t => t.content).join("; ")
            : "No incomplete tasks found.";
        
        const dataPrompt = `
        ${getContextualPromptPrefix()}
        --- User Study Data (Last ${range}) ---
        Focus Sessions (Aggregated by subject/tag): ${sessionSummary}
        Incomplete To-Do List Items (Local Storage): ${tasksSummary}
        Local Notes Summary (First 200 chars): ${localData.notesSummary || "No notes found."}
        --- End Data ---
        
        Analyze this data and provide a brief summary of my focus areas and potential productivity bottlenecks over the last ${range}. Provide one actionable recommendation.
        `;

        const userMessage: ChatMessage = { role: "user", parts: [{ text: `Requesting analysis for the last ${range}...` }] };
        const optimisticHistory = [...history, userMessage];
        setHistory(optimisticHistory);

        try {
            const apiContents = [...history, { role: "user" as const, parts: [{ text: dataPrompt }] }];
            const responseText = await sendGeminiChat(apiContents);
            const modelMessage: ChatMessage = { role: "model", parts: [{ text: responseText }] };
            
            setHistory(prev => [...prev.slice(0, -1), modelMessage]);
            toast.success(`Analysis for the last ${range} loaded.`);
        } catch (error: any) {
            toast.error(error.message || "AI Coach failed to analyze data.");
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
            const allowedTypes = ['image/', 'application/pdf', 'text/plain', 'text/csv', 'application/json', 'text/markdown', 'text/html', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
            
            if (!isAllowed) {
                toast.error("Unsupported file type. Please upload an image, PDF, or text/code document.");
                return;
            }
            
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            toast.info(`File loaded for next prompt: ${file.name}`);
        }
    };

    const handleChat = async (message: string) => {
        if (!message.trim() && !imageFile || isGenerating) return;
        
        const contextualMessage = getContextualPromptPrefix() + message;
        
        // 1. Construct the optimistic user message for display
        const userMessageText = imageFile ? `(File attached: ${imageFile.name}) ${message}` : message;
        const userMessage: ChatMessage = { role: "user", parts: [{ text: userMessageText }] }; 
        
        // 2. Optimistic update
        const optimisticHistory = [...history, userMessage];
        setHistory(optimisticHistory);
        setCurrentMessage("");
        setIsGenerating(true);
        
        const currentImageFile = imageFile;
        setImageFile(null); // Clear file immediately
        setImagePreviewUrl(null);

        let apiContents: ChatMessage[] = [...history];
        let finalUserMessageParts: ChatPart[] = [{ text: contextualMessage }];

        // --- Persistent Context Injection Logic (Only on first message of new session) ---
        if (history.length === 0 && savedContext) {
            // Step A: Ask the model to summarize the saved context
            const contextSummaryPrompt = `Based on the following previous conversation history, provide a concise summary (2-3 sentences) of the user's main goals, challenges, or topics discussed. This summary will be used to prime the current chat session. Do not respond to the user's current message yet.
            --- PREVIOUS CONTEXT ---
            ${JSON.stringify(savedContext)}
            --- END PREVIOUS CONTEXT ---`;
            
            const summaryContents: ChatMessage[] = [{ role: "user", parts: [{ text: contextSummaryPrompt }] }];
            
            try {
                const summaryResponse = await sendGeminiChat(summaryContents);
                
                // Step B: Inject the summary into the current chat history
                const contextInjectionMessage: ChatMessage = { 
                    role: "model", 
                    parts: [{ text: `[CONTEXT INJECTED] Welcome back! Based on our last chat, here's the summary: ${summaryResponse}` }] 
                };
                apiContents = [contextInjectionMessage]; // Start new history with context injection
                
                // Update UI history to show the context injection message
                setHistory([contextInjectionMessage, userMessage]);
            } catch (e) {
                console.error("Failed to inject saved context:", e);
                toast.warning("Failed to load saved context. Starting fresh.");
                // Continue with empty apiContents if context injection fails
            }
        }
        // --- End Persistent Context Injection Logic ---

        try {
            // 3. Construct the actual parts payload for the API
            if (currentImageFile) {
                const filePart = await fileToGenerativePart(currentImageFile);
                finalUserMessageParts.unshift(filePart);
            }
            
            // 4. Send API call using the full history (including the new message)
            const finalApiContents = [
                ...apiContents, // Includes injected context if applicable, or is just the current session history
                { role: "user" as const, parts: finalUserMessageParts } 
            ];
            
            const responseText = await sendGeminiChat(finalApiContents);
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

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isUser = msg.role === "user";
        const text = msg.parts[0]?.text || "";
        
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
                
                <p className="text-sm whitespace-pre-wrap">{text}</p>
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
            
            {/* Persistent Memory Controls */}
            <div className="mb-4 space-y-2 p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-semibold flex items-center gap-1 text-primary">
                    <Lightbulb className="w-4 h-4" /> Persistent Memory
                </p>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSaveContext}
                        disabled={history.length === 0 || isGenerating}
                        className="flex-1 flex items-center gap-1"
                    >
                        <Save className="w-4 h-4" /> Save Current Chat
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleClearContext}
                        disabled={!savedContext || isGenerating}
                        className="flex-1 flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" /> Clear Saved Context
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    {savedContext ? "Context loaded. New chat will start with a summary." : "No context saved. Save a chat to enable memory."}
                </p>
            </div>


            {/* Quick Actions */}
            <div className="space-y-3 mb-4 p-4 rounded-lg bg-secondary/30">
                <p className="text-sm font-semibold flex items-center gap-1 text-primary">
                    <LayoutGrid className="w-4 h-4" /> Quick Actions
                </p>
                <div className="grid grid-cols-3 gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAnalyzeData('day')}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <Clock className="w-3 h-3 mr-1" /> Analyze Day
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAnalyzeData('week')}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <CalendarDays className="w-3 h-3 mr-1" /> Analyze Week
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAnalyzeData('month')}
                        disabled={isGenerating}
                        className="text-xs h-9 flex items-center justify-center"
                    >
                        <Calendar className="w-3 h-3 mr-1" /> Analyze Month
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
                        onClick={() => handleInjectContext('tasks')}
                        className="text-xs h-9"
                    >
                        Inject Tasks
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleChat("What are the best strategies for avoiding distractions?")}
                        disabled={isGenerating}
                        className="text-xs h-9"
                    >
                        Distraction Help
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

            {/* Input and File Preview */}
            {imagePreviewUrl && (
                <div className="relative mb-2 p-2 rounded-lg border border-primary/50 bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <img 
                            src={imagePreviewUrl} 
                            alt="File for AI analysis" 
                            className="h-16 w-auto object-contain rounded" 
                        />
                        <span className="text-sm font-medium truncate">{imageFile?.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">File attached for next prompt.</span>
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
                    accept="image/*, application/pdf, text/plain, text/csv, application/json, text/markdown, text/html, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                    title="Upload Document or Image for Analysis"
                >
                    <Paperclip className="w-4 h-4" />
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