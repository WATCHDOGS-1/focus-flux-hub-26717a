"use client";

import { LogIn, Video, Zap } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { motion } from "framer-motion";

const steps = [
  {
    icon: LogIn,
    title: "1. Sign In & Set Goal",
    description: "Quickly authenticate and define your focus target (e.g., 60 minutes of deep work).",
  },
  {
    icon: Video,
    title: "2. Join the Virtual Room",
    description: "Enter the shared focus room. Turn on your camera for accountability and start your Pomodoro timer.",
  },
  {
    icon: Zap,
    title: "3. Achieve Flow State",
    description: "Focus alongside peers, track your progress, and earn XP. We handle the motivation.",
  },
];

const HowItWorksSection = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <AnimatedSection>
        <h2 className="text-4xl font-bold text-center mb-4">
          How OnlyFocus Works
        </h2>
        <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-16">
          Three simple steps to unlock your highest level of productivity.
        </p>
      </AnimatedSection>

      <div className="relative flex flex-col lg:flex-row justify-between gap-12 pt-12"> {/* Added pt-12 for space above the line */}
        {/* Timeline Line (Desktop Only) - Positioned lower */}
        <div className="hidden lg:block absolute top-[100px] left-0 right-0 h-1 bg-border/50">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full bg-primary"
          />
        </div>

        {steps.map((step, index) => (
          <AnimatedSection key={index} delay={index * 0.2} className="flex-1 relative">
            <div className="flex flex-col items-center text-center p-6">
              {/* Icon Circle */}
              <div className="relative mb-6 z-10"> {/* Added z-10 to ensure circle is above the line */}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                {/* Step Number Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold border-2 border-card">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  );
};

export default HowItWorksSection;