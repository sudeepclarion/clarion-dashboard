import type { Config } from "tailwindcss";

/**
 * The palette is lifted verbatim from the Clarion marketing site so the product
 * and the landing page are visibly the same system. The only additions are the
 * semantic status colours the dashboard needs (a board has states a landing page
 * does not), chosen to sit correctly against the same dark surfaces.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#07090E",
          800: "#0B0F17",
          700: "#0F1420",
        },
        surface: {
          DEFAULT: "#121824",
          raised: "#161D2B",
          overlay: "#1A2233",
        },
        hairline: "#1E293B",
        cyan: { clarion: "#00F2FE" },
        violet: { electric: "#7000FF" },
        ink: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          faint: "#64748B",
        },
        // Board and health semantics.
        state: {
          backlog: "#64748B",
          progress: "#38BDF8",
          review: "#A78BFA",
          blocked: "#FB7185",
          done: "#34D399",
        },
        signal: {
          positive: "#34D399",
          caution: "#FBBF24",
          critical: "#F43F5E",
          info: "#38BDF8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Dense, enterprise-scale type ramp.
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,242,254,0.25), 0 0 40px -8px rgba(0,242,254,0.35)",
        lift: "0 24px 60px -20px rgba(0,0,0,0.8)",
        panel: "0 1px 0 0 rgba(248,250,252,0.03) inset, 0 12px 32px -24px rgba(0,0,0,0.9)",
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
