import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/home/HeroSection";
import FeatureGridSection from "@/components/home/FeatureGridSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FAQSection from "@/components/home/FAQSection";
import ResearchLinksSection from "@/components/home/ResearchLinksSection"; // Import new section
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // --- SEO & JSON-LD Schema Injection ---
    
    const softwareApplicationSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "OnlyFocus: Virtual Study Room & AI Productivity Tool",
      "operatingSystem": "Web",
      "applicationCategory": "http://schema.org/ProductivityApplication",
      "description": "OnlyFocus is the ultimate virtual study room and AI productivity tool, engineered for students and professionals seeking unmatched concentration and community accountability. Use the Pomodoro timer, track goals, and boost productivity.",
      "url": "https://yourdomain.com/", // Placeholder
      "image": "https://jgidrekaaqztxdiidbnn.supabase.co/storage/v1/object/public/public-assets/Image.jpg",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Comrade"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1200"
      }
    };

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a Virtual Study Room?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A Virtual Study Room is a shared online space where users join a video conference to work silently alongside others. It leverages social accountability to minimize distractions and encourage deep focus, similar to working in a quiet library but from anywhere."
          }
        },
        {
          "@type": "Question",
          "name": "How does the Pomodoro Timer work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our integrated Pomodoro timer allows you to set structured work and break intervals (e.g., 25 minutes focus, 5 minutes break). It automatically tracks your session duration, saves your progress, and contributes to your total focused minutes and XP."
          }
        },
        {
          "@type": "Question",
          "name": "Is OnlyFocus free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, OnlyFocus is currently free to use. We believe in providing powerful productivity tools to everyone. Future premium features may be introduced, but core functionality will remain accessible."
          }
        }
      ]
    };

    const script1 = document.createElement("script");
    script1.type = "application/ld+json";
    script1.innerHTML = JSON.stringify(softwareApplicationSchema);
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "application/ld+json";
    script2.innerHTML = JSON.stringify(faqSchema);
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Feature Grid Section */}
      <FeatureGridSection />

      {/* 3. How It Works Section */}
      <HowItWorksSection />

      {/* 4. FAQ Section */}
      <FAQSection />
      
      {/* 5. Research Links Section */}
      <ResearchLinksSection />

      {/* 6. Final CTA Section */}
      <div className="bg-primary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Master Your Focus?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Join the fastest-growing community of focused students and professionals. Start your deep work session now—it only takes 30 seconds.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="text-xl px-10 py-7 rounded-xl bg-primary dopamine-click shadow-glow group font-semibold"
            >
              <Sparkles className="mr-3 group-hover:rotate-180 transition-transform duration-500" />
              Join OnlyFocus Today
            </Button>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default Home;