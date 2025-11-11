"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Clock, Zap } from "lucide-react";
import FloatingBlobs from "@/components/FloatingBlobs";
import AnimatedSection from "@/components/AnimatedSection";

// Placeholder for live stats (in a real app, this would be fetched)
const LIVE_STATS = {
  hoursStudied: 4820,
  activeUsers: 120,
};

const HeroSection = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center pt-20 pb-32 overflow-hidden">
      <FloatingBlobs />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          <motion.p 
            variants={itemVariants}
            className="text-lg font-semibold text-accent mb-4 tracking-widest uppercase"
          >
            The Future of Deep Work
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight"
          >
            <span className="block text-primary">Focus Better.</span>
            <span className="block">Study Together.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            OnlyFocus is the ultimate virtual study room and AI productivity tool, engineered for students and professionals seeking **unmatched concentration** and community accountability.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
          >
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="text-lg px-8 py-6 rounded-xl bg-primary dopamine-click shadow-glow group font-semibold"
            >
              Start Focusing Now (It's Free)
            </Button>
            <Button
              onClick={() => navigate("/focus-room")}
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 rounded-xl dopamine-click group font-semibold"
            >
              Explore the Room
            </Button>
          </motion.div>
        </motion.div>

        {/* Live Stats Bar */}
        <AnimatedSection delay={0.8}>
          <div className="inline-flex glass-card p-4 rounded-full shadow-xl border-primary/30">
            <div className="flex items-center gap-6 text-left">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-primary">{LIVE_STATS.hoursStudied.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Hours Focused This Week</div>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-accent" />
                <div>
                  <div className="text-2xl font-bold text-accent">{LIVE_STATS.activeUsers}+</div>
                  <div className="text-xs text-muted-foreground">Active Users Right Now</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default HeroSection;