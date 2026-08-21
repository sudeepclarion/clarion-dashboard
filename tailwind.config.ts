import type { Config } from "tailwindcss";

/**
 * B&W product chrome via CSS variables (light :root / dark .dark).
 * Status colors stay fixed green / yellow / red.
 * cyan-clarion / violet-electric are rebound to the accent (ink) so existing
 * class names keep working without a mass rewrite.
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "rgb(var(--base-900) / <alpha-value>)",
          800: "rgb(var(--base-800) / <alpha-value>)",
          700: "rgb(var(--base-700) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--surface-overlay) / <alpha-value>)",
        },
        hairline: "rgb(var(--hairline) / <alpha-value>)",
        cyan: { clarion: "rgb(var(--accent) / <alpha-value>)" },
        violet: { electric: "rgb(var(--accent) / <alpha-value>)" },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        state: {
          backlog: "#64748B",
          progress: "#71717A",
          review: "#A1A1AA",
          blocked: "#F43F5E",
          done: "#16A34A",
        },
        signal: {
          positive: "#16A34A",
          caution: "#EAB308",
          critical: "#F43F5E",
          info: "#71717A",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--accent) / 0.2), 0 0 32px -8px rgb(var(--accent) / 0.15)",
        lift: "0 24px 60px -20px rgba(0,0,0,0.35)",
        panel: "0 1px 0 0 rgb(var(--ink) / 0.04) inset, 0 12px 32px -24px rgba(0,0,0,0.25)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.8)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
