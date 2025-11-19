import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  isActive: boolean;
  intensity?: "low" | "medium" | "high";
  className?: string;
}

const AmbientBackground = ({ isActive, intensity = "medium", className }: AmbientBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; size: number; speedX: number; speedY: number; hue: number }[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const particleCount = isActive ? 50 : 20;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * (isActive ? 0.5 : 0.2),
          speedY: (Math.random() - 0.5) * (isActive ? 0.5 : 0.2),
          hue: Math.random() * 60 + 200, // Blue-ish hues
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (isActive) {
        gradient.addColorStop(0, "#0f172a"); // Slate 900
        gradient.addColorStop(1, "#1e1b4b"); // Indigo 950
      } else {
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(1, "transparent");
      }
      
      // Only draw background if active, otherwise transparent overlay
      if (isActive) {
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${isActive ? 0.3 : 0.1})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    createParticles();
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000", className)}
      style={{ opacity: isActive ? 1 : 0 }}
    />
  );
};

export default AmbientBackground;
