import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Frown } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-md text-center z-10 glass-card shadow-glow">
        <CardHeader className="space-y-4">
          <Frown className="w-20 h-20 text-primary mx-auto animate-subtle-pulse" />
          <CardTitle className="text-5xl font-bold">404</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Oops! Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground">
            It looks like the page you were looking for doesn't exist, or it may have moved.
          </p>
          <div className="flex flex-col gap-4">
            <Button onClick={() => navigate("/")} className="w-full dopamine-click shadow-glow">
              Go to Home
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full dopamine-click">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;