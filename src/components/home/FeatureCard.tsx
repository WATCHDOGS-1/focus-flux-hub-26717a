"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        delay: delay, 
        ease: [0.17, 0.55, 0.55, 1] // Custom spring-like ease
      } 
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "glass-card p-6 rounded-2xl transition-spring hover:shadow-glow-lg",
        "flex flex-col items-start text-left h-full cursor-pointer"
      )}
    >
      <motion.div
        style={{
          transform: "translateZ(75px)",
        }}
        className="mb-4 p-3 rounded-xl bg-primary/10 text-primary"
      >
        <Icon className="w-8 h-8" />
      </motion.div>
      
      <motion.h3
        style={{
          transform: "translateZ(50px)",
        }}
        className="text-xl font-bold mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        style={{
          transform: "translateZ(25px)",
        }}
        className="text-muted-foreground text-sm"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default FeatureCard;