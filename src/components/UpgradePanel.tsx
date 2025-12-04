import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Zap, Users, Check, ArrowRight } from "lucide-react";

const UpgradePanel = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <Card className="glass-card w-full max-w-2xl text-center">
        <CardHeader className="space-y-4">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto animate-pulse" />
          <CardTitle className="text-3xl font-bold">Upgrade to Chrono Emperor</CardTitle>
          <p className="text-muted-foreground">Unlock the ultimate focus experience and massive co-working rooms.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-2">
              <Zap className="w-6 h-6 text-primary" />
              <h4 className="font-semibold">Exclusive XP Multiplier</h4>
              <p className="text-sm text-muted-foreground">Earn 2x XP on all focus sessions.</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-2">
              <Users className="w-6 h-6 text-primary" />
              <h4 className="font-semibold">100-Person Focus Hall</h4>
              <p className="text-sm text-muted-foreground">Access the exclusive, high-capacity co-working room.</p>
            </div>
          </div>
          
          <div className="text-4xl font-extrabold text-primary">
            $9.99 <span className="text-lg font-medium text-muted-foreground">/ month</span>
          </div>

          <Button size="lg" className="w-full dopamine-click text-lg">
            Subscribe Now <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            (Note: This is a placeholder. Actual subscription integration is required.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradePanel;