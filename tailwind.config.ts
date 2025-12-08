import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Using system fonts as placeholders for Inter/Geist, with Mono for data
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        // Zen Cyberpunk Palette
        background: "hsl(230 20% 5%)", // Deep Radial Gradient Base: #1a1b26
        foreground: "hsl(210 40% 98%)", // Bright White
        
        // Primary Accent: Neon Purple
        primary: {
          DEFAULT: "hsl(280 90% 60%)", // #b026ff
          foreground: "hsl(210 40% 98%)",
        },
        // Secondary Accent: Electric Cyan
        accent: {
          DEFAULT: "hsl(185 90% 60%)", // #00f0ff
          foreground: "hsl(224 71% 4%",
        },
        
        // Muted/Secondary UI elements
        secondary: {
          DEFAULT: "hsl(230 10% 15%)", // Darker background for secondary elements
          foreground: "hsl(210 40% 98%)",
        },
        muted: {
          DEFAULT: "hsl(230 10% 10%)",
          foreground: "hsl(215 14% 65%)", // Muted Blue-Grey #94a3b8
        },
        
        // Standard UI colors
        border: "hsl(230 10% 20%)",
        input: "hsl(230 10% 15%)",
        ring: "hsl(280 90% 60%)",
        card: {
          DEFAULT: "hsl(230 10% 10%)",
          foreground: "hsl(210 40% 98%",
        },
        popover: {
          DEFAULT: "hsl(230 10% 10%)",
          foreground: "hsl(210 40% 98%",
        },
        destructive: {
          DEFAULT: "hsl(0 84.2% 60.2%)",
          foreground: "hsl(210 40% 98%",
        },
        success: {
          DEFAULT: "hsl(142 76% 36%)",
          foreground: "hsl(210 40% 98%",
        },
        warning: {
          DEFAULT: "hsl(45 93% 47%)",
          foreground: "hsl(224 71% 4%",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "blob-movement": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        "timer-breathing": {
          "0%, 100%": { "stroke-width": "8px", opacity: "1" },
          "50%": { "stroke-width": "12px", opacity: "0.8" },
        },
        "background-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "blob-1": "blob-movement 12s infinite alternate ease-in-out",
        "blob-2": "blob-movement 15s infinite alternate-reverse ease-in-out",
        "blob-3": "blob-movement 10s infinite alternate ease-in-out",
        "timer-breathing": "timer-breathing 4s ease-in-out infinite",
        "background-pulse": "background-pulse 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;