import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Zap } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_URL = "https://www.notion.so/login"; // Default to Notion login page

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
      if (newUrl.includes('google.com') || newUrl.includes('facebook.com')) {
        toast.warning("Warning: Many sites like Google or Facebook block embedding via iframe due to security policies (X-Frame-Options).");
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
          placeholder="Enter URL (e.g., notion.so/login)"
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
            <p className="text-muted-foreground animate-pulse">Loading {displayUrl}... (May be blocked by site security)</p>
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