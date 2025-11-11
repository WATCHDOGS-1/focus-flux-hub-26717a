import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Zap } from "lucide-react";
import { toast } from "sonner";
import FocusGate from "./FocusGate";

const DEFAULT_URL = "https://google.com"; 

const SandboxBrowser = () => {
  const [url, setUrl] = useState(() => localStorage.getItem("sandbox_url") || DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(url);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("sandbox_url", url);
  }, [url]);

  const handleLoadUrl = () => {
    if (!inputUrl.trim()) return;

    let newUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(newUrl)) {
      newUrl = 'https://' + newUrl;
    }
    
    // Check if the URL requires the Focus Gate
    if (newUrl.includes('google.com')) {
      // If it's Google, load immediately
      setUrl(newUrl);
      setIsIframeLoading(true);
      setPendingUrl(null);
    } else {
      // If it's not Google, trigger the Focus Gate
      setPendingUrl(newUrl);
    }
  };

  const handleFocusGateDecision = (proceed: boolean) => {
    if (proceed && pendingUrl) {
      // User confirmed, load the external URL
      setUrl(pendingUrl);
      setIsIframeLoading(true);
      
      // Optional warning for known blocked sites
      if (pendingUrl.includes('facebook.com') || pendingUrl.includes('notion.so')) {
        toast.warning("Warning: This site often blocks embedding via iframe due to security policies (X-Frame-Options).");
      }
    } else {
      // User declined or timer ran out and they chose 'No', redirect to Google
      setUrl(DEFAULT_URL);
      setInputUrl(DEFAULT_URL);
      setIsIframeLoading(true);
      toast.info("Staying focused! Redirecting to Google.");
    }
    setPendingUrl(null); // Clear pending state regardless of outcome
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
        {pendingUrl && <FocusGate onDecision={handleFocusGateDecision} />}
        
        {isIframeLoading && !pendingUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90 backdrop-blur-sm z-10">
            <p className="text-muted-foreground animate-pulse">
              Attempting to load {url}... 
              <br/>
              (If this persists, the site is likely blocking embedding.)
            </p>
          </div>
        )}
        <iframe
          src={url}
          title="Embedded Focus Browser"
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
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