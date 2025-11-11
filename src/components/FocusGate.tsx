import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, SkipForward } from "lucide-react";

interface FocusGateProps {
  onDecision: (proceed: boolean) => void;
}

const FocusGate = ({ onDecision }: FocusGateProps) => {
  const COUNTDOWN_SECONDS = 10;
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setCountdown(COUNTDOWN_SECONDS);
    setShowConfirmation(false);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowConfirmation(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSkip = () => {
    setShowConfirmation(true);
    setCountdown(0);
  };

  const handleConfirm = (proceed: boolean) => {
    onDecision(proceed);
  };

  return (
    <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-20 flex items-center justify-center p-8">
      <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-glow animate-fade-in">
        <Zap className="w-12 h-12 text-primary mx-auto animate-subtle-pulse" />
        <h3 className="text-2xl font-bold">Mindful Browsing Check</h3>
        
        {!showConfirmation ? (
          <>
            <p className="text-muted-foreground">
              You are about to leave the focused environment. Take a moment to confirm this is necessary.
            </p>
            
            {/* Breathing Animation / Countdown */}
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping-slow" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/30">
                <div className="text-5xl font-mono font-extrabold text-primary">
                  {countdown}
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Timer will automatically proceed to confirmation.
            </p>

            <Button 
              onClick={handleSkip} 
              variant="outline" 
              className="w-full dopamine-click"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip Timer
            </Button>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">
              Are you sure you want to open this external site?
            </p>
            <div className="flex gap-4">
              <Button 
                variant="destructive" 
                className="flex-1 dopamine-click" 
                onClick={() => handleConfirm(false)}
              >
                No, Stay Focused
              </Button>
              <Button 
                variant="default" 
                className="flex-1 dopamine-click" 
                onClick={() => handleConfirm(true)}
              >
                Yes, Proceed
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FocusGate;