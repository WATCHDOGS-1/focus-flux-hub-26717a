import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, BookOpen, Target, Mail } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import FloatingBlobs from "@/components/FloatingBlobs";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBlobs />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-8 dopamine-click"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>

        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-center">
              The Story Behind <span className="text-primary">OnlyFocus</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="glass-card p-8 rounded-2xl mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Aditya Gade</h2>
                  <p className="text-muted-foreground">Founder & Developer, Grade 12 Student</p>
                </div>
              </div>

              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  Hi, I'm Aditya. As a Grade 12 student, I know exactly what it feels like to sit down with a mountain of homework and realize that three hours have passed without finishing a single page. 
                </p>
                <p>
                  I struggled with focusing for years. The distractions of social media, the anxiety of upcoming exams, and the feeling of studying alone made it nearly impossible to enter a "flow state." 
                </p>
                <p>
                  I built <strong>OnlyFocus</strong> because I needed a tool that didn't just track time, but created a digital environment that forced me to be accountable. I realized that when I could see other people studying—even strangers from halfway across the world—I felt a responsibility to stay focused too.
                </p>
                <p>
                  This site is a labor of love, designed to help students like me turn their focus from a constant battle into a superpower.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <AnimatedSection delay={0.2}>
              <div className="glass-card p-6 rounded-xl h-full">
                <BookOpen className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Our Mission</h3>
                <p className="text-muted-foreground text-sm">
                  To democratize deep work by providing every student with a free, social, and effective co-working environment.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="glass-card p-6 rounded-xl h-full">
                <Target className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Our Vision</h3>
                <p className="text-muted-foreground text-sm">
                  Building the largest community of focused students globally, where collective energy drives individual success.
                </p>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.4} className="text-center">
            <h3 className="text-2xl font-bold mb-4">Want to connect?</h3>
            <p className="text-muted-foreground mb-6">
              I'm always looking for feedback or just a friendly chat with fellow students.
            </p>
            <Button asChild size="lg" className="dopamine-click">
              <a href="mailto:administrator@onlyfocus.site">
                <Mail className="mr-2 w-5 h-5" /> Contact Me
              </a>
            </Button>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;