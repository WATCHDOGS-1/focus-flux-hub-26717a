import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, Users, Target, Timer, Trophy, Sparkles } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Logo/Title */}
          <div className="inline-block">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-holographic">
              OnlyFocus
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            The professional environment for <span className="text-primary font-semibold">deep focus</span> and <span className="text-accent font-semibold">productive learning</span>
          </p>

          {/* Main CTA */}
          <div className="pt-8 animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="text-lg px-10 py-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-300 shadow-glow hover:shadow-intense-glow group"
            >
              <Sparkles className="mr-2 group-hover:rotate-12 transition-transform duration-300" size={20} />
              Enter Focus Room
              <Sparkles className="ml-2 group-hover:-rotate-12 transition-transform duration-300" size={20} />
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-16 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: "Focus Groups",
                desc: "Join focused study sessions with like-minded individuals",
              },
              {
                icon: Timer,
                title: "Smart Timer",
                desc: "Optimize productivity with intelligent time management",
              },
              {
                icon: Trophy,
                title: "Progress Tracking",
                desc: "Measure and improve your focus performance over time",
              },
              {
                icon: Target,
                title: "Goal Setting",
                desc: "Set and achieve meaningful daily and weekly objectives",
              },
              {
                icon: Brain,
                title: "Focus Analytics",
                desc: "Gain insights into your productivity patterns",
              },
              {
                icon: Sparkles,
                title: "Motivation Engine",
                desc: "Receive personalized encouragement during sessions",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-5 rounded-xl hover:scale-[1.02] transition-all duration-300 hover:shadow-neon animate-fade-in group"
                style={{ animationDelay: `${0.6 + i * 0.1}s` }}
              >
                <feature.icon className="w-10 h-10 text-primary mb-3 mx-auto group-hover:rotate-6 transition-transform duration-300" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Professional Section */}
      <div className="relative z-10 container mx-auto px-4 py-16 border-t border-border/30">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <h2 className="text-2xl font-bold">Designed for Professional Focus</h2>
          
          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg">
              <strong className="text-foreground">OnlyFocus</strong> creates the optimal environment for deep work by combining proven productivity techniques with a distraction-free interface. Our platform helps professionals, students, and lifelong learners achieve their goals through structured focus sessions.
            </p>
            
            <p>
              Join thousands of users who have transformed their productivity with our scientifically-backed approach to focus management.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8">
              {[
                "Focus Groups",
                "Time Tracking",
                "Progress Analytics",
                "Goal Management",
                "Session History",
                "Performance Insights",
                "Community Support",
                "Personalized Coaching",
              ].map((tag, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;