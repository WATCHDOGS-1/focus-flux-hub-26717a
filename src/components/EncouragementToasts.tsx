import { useEffect } from "react";
import { toast } from "sonner";

const encouragements = [
  "You're doing great! Keep focusing! 🎯",
  "Stay strong! Your dedication is inspiring! 💪",
  "Another productive session! You're on fire! 🔥",
  "Keep up the excellent work! 🌟",
  "Your focus is incredible! Keep it up! ⚡",
  "You're making amazing progress! 📈",
];

const EncouragementToasts = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
      toast.success(randomEncouragement, {
        duration: 4000,
      });
    }, 300000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default EncouragementToasts;
