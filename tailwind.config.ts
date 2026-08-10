import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0a0e1a",
          card: "#111827",
          primary: "#00f0ff",
          secondary: "#a855f7",
          accent: "#f59e0b",
          success: "#10b981",
          danger: "#ef4444",
          muted: "#6b7280",
        },
        glass: "rgba(17, 24, 39, 0.7)",
      },
      fontFamily: {
        cyber: ["Orbitron", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 240, 255, 0.3)",
        "neon-purple": "0 0 20px rgba(168, 85, 247, 0.4)",
        "neon-gold": "0 0 25px rgba(245, 158, 11, 0.5)",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
