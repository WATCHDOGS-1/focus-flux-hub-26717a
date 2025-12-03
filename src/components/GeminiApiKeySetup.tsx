import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Key, Save, Trash2, ExternalLink } from "lucide-react";
import { setGeminiApiKey, clearGeminiApiKey, getGeminiApiKey } from "@/utils/gemini";

const GEMINI_API_LINK = "https://aistudio.google.com/api-keys";

const GeminiApiKeySetup = () => {
  const [inputKey, setInputKey] = useState("");
  const currentKey = getGeminiApiKey();

  const handleSave = () => {
    if (inputKey.trim()) {
      setGeminiApiKey(inputKey.trim());
      setInputKey("");
    }
  };

  const handleClear = () => {
    clearGeminiApiKey();
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
        <Key className="h-4 w-4" />
        <AlertTitle>Gemini API Key Required</AlertTitle>
        <AlertDescription>
          To use the AI Coach, you must provide your own Google Gemini API key. This key is stored locally in your browser.
        </AlertDescription>
      </Alert>

      <a href={GEMINI_API_LINK} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
        Get your Gemini API Key here <ExternalLink className="w-3 h-3" />
      </a>

      {currentKey ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
          <span className="text-sm font-mono truncate">Key Loaded: ************{currentKey.slice(-4)}</span>
          <Button variant="destructive" size="sm" onClick={handleClear} className="flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Clear Key
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Enter your Gemini API Key"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={!inputKey.trim()} className="dopamine-click">
            <Save className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default GeminiApiKeySetup;