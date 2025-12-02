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
              onClick={() => navigate("/explore")}
              size="lg"
              className="text-lg px-8 py-6 rounded-xl bg-primary dopamine-click shadow-glow group font-semibold"
            >
              Explore Rooms
            </Button>
            <Button
              onClick={() => navigate("/social")}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl dopamine-click font-semibold"
            >
              View Social Dashboard
            </Button>
          </motion.div>
        </motion.div>

        {/* Live Stats Bar REMOVED */}
      </div>
    </div>
  );
};

export default HeroSection;