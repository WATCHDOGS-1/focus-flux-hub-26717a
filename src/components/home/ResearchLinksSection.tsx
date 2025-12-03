"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link, BookOpen, ExternalLink } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const researchLinks = [
  {
    title: "The Pomodoro Technique: Enhancing Productivity",
    description: "A study on how structured time management, like the Pomodoro Technique, can significantly reduce mental fatigue and improve focus duration.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12292963/",
  },
  {
    title: "Social Accountability and Co-Working Effectiveness",
    description: "Research demonstrating the positive impact of virtual co-working environments on motivation, task initiation, and adherence to goals.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4843169/",
  },
  {
    title: "The Science of Deep Work and Flow State",
    description: "An analysis of neurological and psychological factors that contribute to achieving and maintaining a state of deep, distraction-free concentration.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7551835/",
  },
];

const ResearchLinksSection = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <AnimatedSection>
        <h2 className="text-4xl font-bold text-center mb-4 flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          The Science Behind Our Focus
        </h2>
        <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-10">
          Our methods are backed by cognitive science. Explore the research that informs our productivity tools.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.2} className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {researchLinks.map((link, index) => (
            <AccordionItem key={index} value={`link-${index}`} className="glass-card px-4 my-2 rounded-xl hover:bg-card/80 transition-colors">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-3">
                    <Link className="w-5 h-5 text-accent" />
                    {link.title}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 space-y-3">
                <p>{link.description}</p>
                <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
                >
                    Read the Study <ExternalLink className="w-4 h-4" />
                </a>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AnimatedSection>
    </div>
  );
};

export default ResearchLinksSection;