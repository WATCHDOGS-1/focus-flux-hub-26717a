import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Music, Save, Info, Trash2 } from "lucide-react";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "onlyfocus_spotify_embed";

const SpotifyEmbedPanel = () => {
  const [embedCode, setEmbedCode] = useState("");
  const [inputCode, setInputCode] = useState("");

  useEffect(() => {
    const savedCode = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedCode) {
      setEmbedCode(savedCode);
    }
  }, []);

  const handleSave = () => {
    if (!inputCode.includes('<iframe') || !inputCode.includes('spotify.com')) {
      toast.error("Invalid Spotify embed code. Please ensure it contains an <iframe> tag from spotify.com.");
      return;
    }
    
    // Simple extraction of the iframe source to ensure clean storage
    const srcMatch = inputCode.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
        const cleanEmbedCode = `<iframe src="${srcMatch[1]}" width="100%" height="100%" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
        setEmbedCode(cleanEmbedCode);
        localStorage.setItem(LOCAL_STORAGE_KEY, cleanEmbedCode);
        setInputCode("");
        toast.success("Spotify player saved!");
    } else {
        toast.error("Could not extract iframe source URL.");
    }
  };

  const handleClear = () => {
    setEmbedCode("");
    setInputCode("");
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.info("Spotify player cleared.");
  };

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
      <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-primary">
        <Music className="w-5 h-5" />
        Spotify Player
      </h4>

      {embedCode ? (
        <div className="flex-1 min-h-0 relative">
          {/* Render the embedded player */}
          <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: embedCode }}
          />
          <Button 
            variant="destructive" 
            size="sm" 
            className="absolute top-2 right-2 z-10 dopamine-click"
            onClick={handleClear}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Clear Player
          </Button>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 mt-1 flex-shrink-0" />
            To embed a playlist: Find a playlist on Spotify, click '...', select 'Embed Playlist', copy the full HTML code, and paste it below.
          </p>
          <Input
            placeholder="Paste Spotify Embed HTML Code here..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="flex-shrink-0"
          />
          <Button onClick={handleSave} disabled={!inputCode.trim()} className="w-full dopamine-click">
            <Save className="w-4 h-4 mr-2" /> Save Player
          </Button>
        </div>
      )}
    </div>
  );
};

export default SpotifyEmbedPanel;