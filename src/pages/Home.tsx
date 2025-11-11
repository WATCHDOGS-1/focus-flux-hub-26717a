import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, Users, Target, Timer, Trophy, Sparkles } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "OnlyFocus",
      "operatingSystem": "Web",
      "applicationCategory": "http://schema.org/ProductivityApplication",
      "description": "OnlyFocus is the ultimate online focus app designed for students, professionals, and anyone looking to enhance their productivity. Join live study rooms, use Pomodoro timers, track goals, and boost your productivity with a supportive community.",
      "url": "https://yourdomain.com/", // IMPORTANT: Replace with your actual deployed domain
      "image": "https://jgidrekaaqztxdiidbnn.supabase.co/storage/v1/object/public/public-assets/Image.jpg",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Comrade"
      }
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Logo/Title */}
          <div className="inline-block">
            <h1 className="text-7xl md:text-9xl font-bold text-foreground">
              OnlyFocus
            </h1>
            <div className="h-1 w-full bg-primary animate-pulse" />
          </div>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            The Future of <span className="text-accent font-semibold">Focused Learning</span>
          </p>

          {/* Main CTA */}
          <div className="pt-8 animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="text-xl px-12 py-8 rounded-2xl bg-primary hover:scale-110 transition-all duration-300 shadow-glow group"
            >
              <Sparkles className="mr-3 group-hover:rotate-180 transition-transform duration-500" />
              Join Study Room
              <Sparkles className="ml-3 group-hover:rotate-180 transition-transform duration-500" />
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: "Live Study Rooms",
                desc: "Connect with focused learners worldwide in real-time",
              },
              {
                icon: Timer,
                title: "Pomodoro Timer",
                desc: "Boost productivity with proven time management",
              },
              {
                icon: Trophy,
                title: "Weekly Leaderboard",
                desc: "Compete and climb the ranks of dedicated students",
              },
              {
                icon: Target,
                title: "Goal Tracking",
                desc: "Set and achieve your daily & weekly focus targets",
              },
              {
                icon: Brain,
                title: "Smart Analytics",
                desc: "Track your progress and optimize study sessions",
              },
              {
                icon: Sparkles,
                title: "AI Encouragement",
                desc: "Get motivated with real-time study support",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-6 rounded-2xl hover-lift animate-fade-in group"
                style={{ animationDelay: `${0.6 + i * 0.1}s` }}
              >
                <feature.icon className="w-12 h-12 text-primary mb-4 mx-auto group-hover:rotate-12 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEO Section */}
      <div className="relative z-10 container mx-auto px-4 py-16 border-t border-border/20">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <h2 className="text-3xl font-bold">Why Choose OnlyFocus?</h2>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">OnlyFocus</strong> is the ultimate online focus app designed for students, professionals, and anyone looking to enhance their productivity. Our platform combines cutting-edge technology with proven study techniques to create the perfect environment for deep work and focused learning.
            </p>
            
            <p>
              Join thousands of users who have transformed their study habits with our virtual study room. Whether you're preparing for exams, working on important projects, or learning new skills, OnlyFocus provides the tools and community support you need to stay focused and motivated.
            </p>
            <p>
              Our platform fosters a vibrant community where users can connect, share progress, and hold each other accountable. This collaborative environment, combined with powerful tools like the Pomodoro timer and goal tracking, ensures you have everything you need to achieve your academic and professional aspirations.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
              {[
                "Study Room App",
                "Focus Timer",
                "Productivity Tracker",
                "Online Study Group",
                "Pomodoro Technique",
                "Study Motivation",
                "Time Management",
                "Focus App 2025",
              ].map((tag, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors hover-lift"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-8">
            Best focus app • Virtual study room • Productivity tools • Time tracking • Study timer • Focus techniques • Online learning • Study motivation • Concentration app • Study planner • Focus mode • Study habits • Pomodoro timer online • Study together • Focus music • Study break timer • Deep work • Study accountability
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;