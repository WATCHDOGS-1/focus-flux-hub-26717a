import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, Zap } from "lucide-react";
import { toast } from "sonner";

interface NotionIntegrationPanelProps {
  // In a real app, this would handle saving the link/API key
}

const NotionIntegrationPanel = () => {
  const handleConnect = () => {
    toast.info("Notion integration is a premium feature! (Placeholder)");
  };

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col gap-4">
      <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
        <Zap className="w-5 h-5" />
        Notion Workspace Integration
      </h4>
      <p className="text-sm text-muted-foreground">
        Connect your Notion page here to view your tasks, notes, or study materials directly in the focus room.
      </p>
      
      <div className="flex gap-2">
        <Input 
          placeholder="Paste Notion Page Link or API Key..."
          className="flex-1"
        />
        <Button onClick={handleConnect} className="dopamine-click">
          <Link className="w-4 h-4 mr-2" />
          Connect
        </Button>
      </div>

      <div className="h-64 bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground border border-dashed border-border">
        Notion Content Preview Area (Requires API/Embed)
      </div>
    </div>
  );
};

export default NotionIntegrationPanel;