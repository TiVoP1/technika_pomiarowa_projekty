import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          0: "#ffffff",
          50: "#f6f7f9",
          100: "#e9ecf2",
          200: "#cfd5e0",
          300: "#9ea8bb",
          400: "#6c7894",
          500: "#475067",
          600: "#2e3447",
          700: "#1c2030",
          800: "#11131e",
          900: "#080a13",
          950: "#04050a",
        },
        accent: {
          DEFAULT: "#7aa2ff",
          soft: "#9fbcff",
          muted: "#3c5bb8",
          glow: "#4f7bff",
        },
        warn: "#f5b54b",
        ok: "#4fd1a4",
        err: "#ef5d6a",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
        ring: "0 0 0 1px rgba(122,162,255,0.25), 0 8px 32px -12px rgba(80,123,255,0.35)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 360ms ease-out both",
        glow: "glow 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
