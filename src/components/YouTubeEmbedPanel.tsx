import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Youtube, Save, Info, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "onlyfocus_youtube_embed";
const DEFAULT_PLAYLIST_ID = "PLfP6i5T0-DkIMLNRwmJpRBs4PJvxfgwBg"; // Extracted from the provided URL
const DEFAULT_EMBED_URL = `https://www.youtube.com/embed/videoseries?list=${DEFAULT_PLAYLIST_ID}&autoplay=1&loop=1&controls=1&modestbranding=1`;

const YouTubeEmbedPanel = () => {
  const [embedUrl, setEmbedUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUrl) {
      setEmbedUrl(savedUrl);
      setIsCustom(true);
    } else {
      setEmbedUrl(DEFAULT_EMBED_URL);
      setIsCustom(false);
    }
  }, []);

  const extractEmbedUrl = (url: string): string | null => {
    // 1. Check for Playlist ID
    const playlistMatch = url.match(/[?&]list=([^&]+)/);
    if (playlistMatch && playlistMatch[1]) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}&autoplay=1&loop=1&controls=1&modestbranding=1`;
    }

    // 2. Check for Video ID
    const videoMatch = url.match(/(?:youtu\.be\/|v=)([^&]+)/);
    if (videoMatch && videoMatch[1]) {
      return `https://www.youtube.com/embed/${videoMatch[1]}?autoplay=1&loop=1&controls=1&modestbranding=1`;
    }

    // 3. Check if it's already an embed URL
    if (url.includes("youtube.com/embed")) {
      return url;
    }

    return null;
  };

  const handleSave = () => {
    const extractedUrl = extractEmbedUrl(inputUrl);

    if (!extractedUrl) {
      toast.error("Invalid YouTube URL. Please use a valid video or playlist link.");
      return;
    }
    
    setEmbedUrl(extractedUrl);
    localStorage.setItem(LOCAL_STORAGE_KEY, extractedUrl);
    setInputUrl("");
    setIsCustom(true);
    toast.success("YouTube player updated!");
  };

  const handleClear = () => {
    setEmbedUrl(DEFAULT_EMBED_URL);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setInputUrl("");
    setIsCustom(false);
    toast.info("YouTube player reset to default playlist.");
  };

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
      <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-primary">
        <Youtube className="w-5 h-5" />
        YouTube Focus Player
      </h4>

      <div className="flex-1 min-h-0 relative">
        {embedUrl && (
          <iframe
            src={embedUrl}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full rounded-lg"
            frameBorder="0"
          />
        )}
        
        {isCustom && (
            <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2 z-10 dopamine-click"
                onClick={handleClear}
            >
                <Trash2 className="w-4 h-4 mr-1" /> Reset
            </Button>
        )}
      </div>

      <div className="space-y-2 flex-shrink-0 pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 mt-1 flex-shrink-0" />
            Paste a YouTube video or playlist URL below to change the music.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Paste YouTube URL here..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSave} disabled={!inputUrl.trim()} className="dopamine-click">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeEmbedPanel;