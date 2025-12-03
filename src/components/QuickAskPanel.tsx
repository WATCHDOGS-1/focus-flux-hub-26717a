import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Brain, Loader2, Paperclip, X, MessageSquare, Youtube } from "lucide-react";
import { toast } from "sonner";
import { sendGeminiChat, getGeminiApiKey, fileToGenerativePart, ChatPart } from "@/utils/gemini";
import GeminiApiKeySetup from "./GeminiApiKeySetup";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Define chat history type compatible with Gemini API
interface ChatMessage {
    role: "user" | "model";
    parts: ChatPart[];
}

const QuickAskPanel = () => {
    const [currentMessage, setCurrentMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiKey = getGeminiApiKey();

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

    const handleAsk = async () => {
        if (!currentMessage.trim() && !imageFile || isGenerating) return;
        
        setIsGenerating(true);
        setResponse(null); // Clear previous response
        
        const message = currentMessage.trim();
        setCurrentMessage("");
        
        const currentImageFile = imageFile;
        setImageFile(null); // Clear file immediately
        setImagePreviewUrl(null);

        let finalUserMessageParts: ChatPart[] = [{ text: message }];

        try {
            // 1. Construct the actual parts payload for the API
            if (currentImageFile) {
                const filePart = await fileToGenerativePart(currentImageFile);
                finalUserMessageParts.unshift(filePart);
            }
            
            // 2. Send API call (using a fresh history for quick, stateless queries)
            const apiContents: ChatMessage[] = [
                { role: "user" as const, parts: finalUserMessageParts } 
            ];
            
            const responseText = await sendGeminiChat(apiContents);
            setResponse(responseText);
            toast.success("AI Coach responded.");
        } catch (error: any) {
            toast.error(error.message || "AI Coach failed to respond.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!apiKey) {
        return (
            <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
                <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-accent">
                    <Brain className="w-5 h-5" />
                    Quick Ask AI
                </h4>
                <GeminiApiKeySetup />
            </div>
        );
    }

    return (
        <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full relative">
            <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-accent">
                <Brain className="w-5 h-5" />
                Quick Ask AI
            </h4>

            {/* Input and File Preview */}
            <div className="flex flex-col gap-2">
                {imagePreviewUrl && (
                    <div className="relative p-2 rounded-lg border border-primary/50 bg-secondary/20">
                        <div className="flex items-center gap-3">
                            <img 
                                src={imagePreviewUrl} 
                                alt="File for AI analysis" 
                                className="h-10 w-auto object-contain rounded" 
                            />
                            <span className="text-sm font-medium truncate">{imageFile?.name}</span>
                        </div>
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
                        onKeyPress={(e) => e.key === "Enter" && handleAsk()}
                        placeholder="Ask a quick question..."
                        className="flex-1"
                        disabled={isGenerating}
                    />
                    <Button size="icon" onClick={handleAsk} className="dopamine-click" disabled={(!currentMessage.trim() && !imageFile) || isGenerating}>
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Floating Response Box */}
            <AnimatePresence>
                {response && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-full left-0 right-0 mt-2 z-20 p-4 rounded-xl glass-card shadow-glow border-accent/50"
                    >
                        <div className="flex items-center gap-2 mb-2 text-accent font-semibold">
                            <Brain className="w-4 h-4" /> AI Coach Response
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{response}</p>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-1 right-1 text-muted-foreground hover:text-destructive"
                            onClick={() => setResponse(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickAskPanel;