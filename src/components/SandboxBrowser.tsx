import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Zap } from "lucide-react";
import { toast } from "sonner";

// Using a generic, embeddable site (like a simple public page) or removing the default entirely is safer.
// Let's use a placeholder URL that is less likely to be blocked, or just start empty.
// For now, I'll use a simple public page that is usually embeddable.
const DEFAULT_URL = "https://example.com"; 

const SandboxBrowser = () => {
  const [url, setUrl] = useState(() => localStorage.getItem("sandbox_url") || DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(url);
  const [displayUrl, setDisplayUrl] = useState(url);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("sandbox_url", url);
  }, [url]);

  const handleLoadUrl = () => {
    if (inputUrl.trim()) {
      let newUrl = inputUrl.trim();
      // Ensure URL starts with http:// or https://
      if (!/^https?:\/\//i.test(newUrl)) {
        newUrl = 'https://' + newUrl;
      }
      
      // Check if the URL is likely to be blocked (e.g., Google, Facebook, etc.)
      if (newUrl.includes('google.com') || newUrl.includes('facebook.com') || newUrl.includes('notion.so')) {
        toast.warning("Warning: This site often blocks embedding via iframe due to security policies (X-Frame-Options). Try using a public page link.");
      }

      setDisplayUrl(newUrl);
      setUrl(newUrl);
      setIsIframeLoading(true);
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-4 h-[600px]">
      <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
        <Zap className="w-5 h-5" />
        Embedded Focus Browser
      </h4>
      
      <div className="flex gap-2">
        <Input 
          placeholder="Enter embeddable URL (e.g., public documentation, simple website)"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleLoadUrl()}
          className="flex-1"
        />
        <Button onClick={handleLoadUrl} className="dopamine-click">
          <Globe className="w-4 h-4 mr-2" />
          Load Page
        </Button>
      </div>

      <div className="flex-1 relative border border-border rounded-lg overflow-hidden">
        {isIframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90 backdrop-blur-sm z-10">
            <p className="text-muted-foreground animate-pulse">
              Attempting to load {displayUrl}... 
              <br/>
              (If this persists, the site is likely blocking embedding.)
            </p>
          </div>
        )}
        <iframe
          src={displayUrl}
          title="Embedded Focus Browser"
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Minimal sandbox for functionality
          onLoad={() => setIsIframeLoading(false)}
          onError={() => {
            setIsIframeLoading(false);
            toast.error("Failed to load page. It might be blocked by the site's security policy.");
          }}
        />
      </div>
    </div>
  );
};

export default SandboxBrowser;