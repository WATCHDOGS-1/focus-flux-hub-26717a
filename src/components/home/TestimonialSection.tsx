"use client";

import { Quote, Star } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote: "OnlyFocus transformed my study habits. The accountability of the virtual room is a game-changer. I finished my thesis weeks early!",
    name: "Sarah K.",
    title: "University Student",
    delay: 0.1,
  },
  {
    quote: "As a remote developer, fighting distractions is constant. The Deep Work timer and the silent co-working environment are indispensable.",
    name: "Mark R.",
    title: "Software Engineer",
    delay: 0.3,
  },
  {
    quote: "The gamification is surprisingly motivating. I actually look forward to earning XP and climbing the leaderboard!",
    name: "Alex P.",
    title: "Freelance Designer",
    delay: 0.5,
  },
];

const TestimonialSection = () => {
  return (
    <div className="bg-secondary/20 py-20">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <h2 className="text-4xl font-bold text-center mb-4">
            Trusted by <span className="text-accent">Focused Minds</span>
          </h2>
          <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-16">
            See why students, creators, and professionals rely on OnlyFocus for their most demanding work.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: t.delay }}
              className="relative"
            >
              <Card className="glass-card h-full hover-lift">
                <CardContent className="p-6 flex flex-col h-full">
                  <Quote className="w-8 h-8 text-primary mb-4" />
                  <p className="text-lg italic flex-1 mb-4">"{t.quote}"</p>
                  <div className="flex items-center gap-1 text-yellow-500 mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-500" />)}
                  </div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.title}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialSection;