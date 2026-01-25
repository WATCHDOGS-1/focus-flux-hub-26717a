import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Youtube, Save, Info, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { getYouTubeEmbedUrl } from "@/utils/youtube";

const LOCAL_STORAGE_KEY = "onlyfocus_youtube_embed";
const DEFAULT_PLAYLIST_URL = "https://www.youtube.com/watch?v=BH-SnQ8J1VU&list=PLfP6i5T0-DkIMLNRwmJpRBs4PJvxfgwBg";

const YouTubeEmbedPanel = () => {
  const [embedUrl, setEmbedUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");

  useEffect(() => {
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUrl) {
      setEmbedUrl(savedUrl);
    } else {
      // Set default playlist on first load if nothing is saved
      handleSaveUrl(DEFAULT_PLAYLIST_URL);
    }
  }, []);

  const handleSaveUrl = (url: string) => {
    const cleanEmbedUrl = getYouTubeEmbedUrl(url);
    
    if (!cleanEmbedUrl) {
      toast.error("Invalid YouTube URL. Please provide a valid video or playlist link.");
      return;
    }
    
    setEmbedUrl(cleanEmbedUrl);
    localStorage.setItem(LOCAL_STORAGE_KEY, cleanEmbedUrl);
    setInputUrl("");
    toast.success("YouTube player saved!");
  };

  const handleClear = () => {
    setEmbedUrl("");
    setInputUrl("");
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.info("YouTube player cleared.");
  };

  const renderIframe = (url: string) => {
    // Construct the full iframe HTML
    const iframeHtml = `<iframe 
        src="${url}" 
        title="YouTube video player" 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowFullScreen
    ></iframe>`;
    
    return (
        <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: iframeHtml }}
        />
    );
  };

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-3 h-full">
      <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-primary">
        <Youtube className="w-5 h-5" />
        YouTube Focus Player
      </h4>

      <div className="flex-1 min-h-0 relative">
        {embedUrl ? (
            <div className="w-full h-full"> {/* Added wrapper div to ensure full height */}
                {renderIframe(embedUrl)}
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
            <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                <Youtube className="w-12 h-12 mb-2" />
                <p>No player loaded.</p>
            </div>
        )}
      </div>

      {/* Input/Search Section */}
      <div className="space-y-2 flex-shrink-0 pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 mt-1 flex-shrink-0" />
            Paste a YouTube video or playlist URL to embed.
        </p>
        <div className="flex gap-2">
            <Input
                placeholder="Paste YouTube URL here..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1"
                icon={<Search className="w-4 h-4 text-muted-foreground" />}
            />
            <Button 
                onClick={() => handleSaveUrl(inputUrl)} 
                disabled={!inputUrl.trim()} 
                className="dopamine-click"
            >
                <Save className="w-4 h-4" />
            </Button>
        </div>
        <Button 
            variant="outline" 
            onClick={() => handleSaveUrl(DEFAULT_PLAYLIST_URL)} 
            className="w-full text-xs h-8"
        >
            Load Default Focus Playlist
        </Button>
      </div>
    </div>
  );
};

export default YouTubeEmbedPanel;