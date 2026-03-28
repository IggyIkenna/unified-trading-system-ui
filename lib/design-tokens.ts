export const COLORS = {
  primary: "#22d3ee",
  background: { base: "#0a0a0b", card: "#111113", elevated: "#18181b", surface: "#1c1c1f" },
  pnl: { positive: "#4ade80", negative: "#f87171" },
  status: { live: "#4ade80", warning: "#fbbf24", critical: "#f87171", idle: "#71717a" },
  chart: ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#4ade80", "#fb923c"],
} as const;

export const RADIUS = { sm: "6px", md: "8px", lg: "12px", xl: "16px" } as const;

export const FONTS = {
  sans: "var(--font-ibm-plex-sans)",
  mono: "var(--font-jetbrains-mono)",
} as const;

export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  glow: { emerald: "0 0 12px rgba(16,185,129,0.15)", amber: "0 0 12px rgba(245,158,11,0.15)" },
} as const;
