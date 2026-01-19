import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        // Midnight-Industrial Palette
        background: "#0B0E11", 
        foreground: "#E1E1E1",
        primary: {
          DEFAULT: "#3B82F6", // Electric Blue
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#60A5FA",
          foreground: "#0B0E11",
        },
        secondary: {
          DEFAULT: "#171B21", // Dark Steel
          foreground: "#E1E1E1",
        },
        muted: {
          DEFAULT: "#1F2937",
          foreground: "#94A3B8",
        },
        border: "#2D3748",
        input: "#171B21",
        ring: "#3B82F6",
        card: {
          DEFAULT: "#0F172A",
          foreground: "#E1E1E1",
        },
      },
      borderRadius: {
        lg: "0.25rem", // Sharp edges for industrial feel
        md: "0.125rem",
        sm: "0",
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;