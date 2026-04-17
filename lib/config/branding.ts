/**
 * Branding constants — company identity, design tokens.
 *
 * Source of truth for CSS variables: app/globals.css
 * Fonts: IBM Plex Sans (body), JetBrains Mono (code/data)
 */

export const COMPANY = {
  name: "Odum Research",
  legalName: "Odum Research Ltd",
  tagline: "Institutional-Grade Trading Infrastructure",
  /** Public marketing site (staging). Static HTML is served on this host via `proxy.ts`, not on .com. */
  domain: "odumresearch.co.uk",
} as const;

export const BRAND_COLORS = {
  /** Primary accent — used for CTAs, active states */
  primary: "hsl(142, 76%, 36%)",
  /** Background — deep dark */
  background: "hsl(240, 10%, 4%)",
  /** Card/surface */
  card: "hsl(240, 6%, 8%)",
  /** Border */
  border: "hsl(240, 4%, 16%)",
  /** Muted foreground */
  muted: "hsl(240, 5%, 65%)",
  /** Destructive / error */
  destructive: "hsl(0, 84%, 60%)",
  /** Warning */
  warning: "hsl(38, 92%, 50%)",
} as const;

export const FONTS = {
  sans: "var(--font-ibm-plex-sans)",
  mono: "var(--font-jetbrains-mono)",
} as const;

/** 3 USPs for marketing pages */
export const USP = [
  {
    title: "Breadth",
    description:
      "CeFi, TradFi, DeFi, and Sports in one platform. 128 venues across 5 asset classes, unified data pipeline.",
  },
  {
    title: "Seamless Internal/External",
    description:
      "Same platform for internal trading desk and external clients. One codebase, one deployment, role-based scoping.",
  },
  {
    title: "Backtest-to-Live Parity",
    description:
      "Run backtests and live strategies on the same engine. Compare backtest vs live P&L side-by-side.",
  },
] as const;
