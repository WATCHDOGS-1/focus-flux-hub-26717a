import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Scale, Lock } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const Legal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-8 dopamine-click"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>

        <AnimatedSection>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Legal Information</h1>
          <p className="text-muted-foreground text-center mb-12">Last updated: {new Date().toLocaleDateString()}</p>
        </AnimatedSection>

        <div className="space-y-12">
          <AnimatedSection delay={0.1}>
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Terms of Service</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  By using OnlyFocus, you agree to treat all community members with respect. Our virtual study rooms are intended for silent, focused work.
                </p>
                <p>
                  Harassment, inappropriate video content, or disruptive behavior will result in an immediate and permanent ban from the platform.
                </p>
                <p>
                  The service is provided "as is" without warranties of any kind. We are not responsible for any productivity losses or technical failures.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Privacy Policy</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your privacy is a priority. Video streams in our co-working rooms are peer-to-peer (P2P) and are never recorded or stored on our servers.
                </p>
                <p>
                  We collect basic information such as your email (via Google/Discord) to maintain your profile, focus history, and XP progress.
                </p>
                <p>
                  We do not sell your data to third parties. Your focus statistics may be visible to friends or on public leaderboards unless you choose otherwise in your settings.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Content Moderation</h2>
              </div>
              <p className="text-muted-foreground">
                We use automated and manual systems to ensure OnlyFocus remains a safe space for study. Users can report inappropriate behavior directly through the platform. Contact <a href="mailto:administrator@onlyfocus.site" className="text-primary underline">administrator@onlyfocus.site</a> for urgent concerns.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default Legal;