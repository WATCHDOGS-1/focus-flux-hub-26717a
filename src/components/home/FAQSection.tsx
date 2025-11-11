"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AnimatedSection from "@/components/AnimatedSection";

const faqs = [
  {
    question: "What is a Virtual Study Room?",
    answer: "A Virtual Study Room is a shared online space where users join a video conference to work silently alongside others. It leverages social accountability to minimize distractions and encourage deep focus, similar to working in a quiet library but from anywhere.",
  },
  {
    question: "How does the Pomodoro Timer work?",
    answer: "Our integrated Pomodoro timer allows you to set structured work and break intervals (e.g., 25 minutes focus, 5 minutes break). It automatically tracks your session duration, saves your progress, and contributes to your total focused minutes and XP.",
  },
  {
    question: "Is OnlyFocus free to use?",
    answer: "Yes, OnlyFocus is currently free to use. We believe in providing powerful productivity tools to everyone. Future premium features may be introduced, but core functionality will remain accessible.",
  },
  {
    question: "How is my privacy protected in the video rooms?",
    answer: "Video streams are peer-to-peer (WebRTC) and are not recorded. The focus rooms are designed for silent co-working, minimizing interaction and maximizing privacy while maintaining visual accountability.",
  },
  {
    question: "What is the Gamified Productivity system?",
    answer: "You earn Experience Points (XP) for every minute you focus. Accumulating XP allows you to level up, unlock titles, and compete on the weekly leaderboard, turning productivity into a fun, rewarding challenge.",
  },
];

const FAQSection = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <AnimatedSection>
        <h2 className="text-4xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-16">
          Everything you need to know about using OnlyFocus to boost your productivity.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.2} className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="glass-card px-4 my-2 rounded-xl hover:bg-card/80 transition-colors">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AnimatedSection>
    </div>
  );
};

export default FAQSection;