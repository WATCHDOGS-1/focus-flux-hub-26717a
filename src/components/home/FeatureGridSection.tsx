"use client";

import { Brain, Users, Target, Timer, Trophy, MessageSquare, Video, Zap } from "lucide-react";
import FeatureCard from "@/components/home/FeatureCard";
import AnimatedSection from "@/components/AnimatedSection";

const features = [
  {
    icon: Users,
    title: "Virtual Study Rooms",
    description: "Join live video rooms with peers globally. Leverage community accountability for maximum focus and motivation. Study together, remotely.",
  },
  {
    icon: Timer,
    title: "Advanced Pomodoro Timer",
    description: "Customize deep work cycles (25/5, 50/10, 90/20). Integrated timer tracks sessions and automatically saves progress.",
  },
  {
    icon: Trophy,
    title: "Gamified Productivity",
    description: "Earn XP, level up, and climb the weekly leaderboard. Turn focus time into a competitive, rewarding game.",
  },
  {
    icon: Target,
    title: "Goal Tracking & Stats",
    description: "Set daily and weekly focus targets. Visualize your longest streak, total focused minutes, and session analytics.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging & Social",
    description: "Connect with friends, send requests, and chat privately without leaving your focus session. Build your study circle.",
  },
  {
    icon: Video,
    title: "WebRTC Video Streaming",
    description: "Low-latency, high-quality video conferencing built for silent, focused co-working. See your peers, stay accountable.",
  },
];

const FeatureGridSection = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <AnimatedSection>
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Engineered for <span className="text-primary">Deep Focus</span>
        </h2>
        <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-16">
          We combine proven productivity techniques with modern social accountability to help you achieve flow state faster and maintain it longer.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={index * 0.1}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureGridSection;