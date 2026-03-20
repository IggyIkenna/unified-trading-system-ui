/**
 * Branding Configuration
 * 
 * Company identity, logos, and design tokens as TS constants.
 * Source: app/globals.css design tokens
 */

// Company identity
export const COMPANY = {
  name: "Odum Research",
  shortName: "Odum",
  tagline: "Unified Trading Infrastructure",
  description: "Institutional-grade trading command center with real-time P&L, risk attribution, and strategy analytics",
  legal: "Odum Research Ltd",
  copyright: `© ${new Date().getFullYear()} Odum Research. All rights reserved.`,
} as const

// Logo paths
export const LOGOS = {
  icon: {
    light: "/icon-light-32x32.png",
    dark: "/icon-dark-32x32.png",
    svg: "/icon.svg",
  },
  full: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
  },
  apple: "/apple-icon.png",
} as const

// Design tokens (from globals.css)
export const COLORS = {
  // Core palette
  background: "#0a0a0b",
  foreground: "#fafafa",
  card: "#111113",
  cardForeground: "#fafafa",
  popover: "#111113",
  popoverForeground: "#fafafa",
  primary: "#22d3ee",
  primaryForeground: "#0a0a0b",
  secondary: "#18181b",
  secondaryForeground: "#fafafa",
  muted: "#1c1c1f",
  mutedForeground: "#a1a1aa",
  accent: "#18181b",
  accentForeground: "#fafafa",
  destructive: "#f87171",
  destructiveForeground: "#0a0a0b",
  border: "#27272a",
  input: "#27272a",
  ring: "#22d3ee",
  
  // P&L semantic tokens
  pnl: {
    positive: "#4ade80",
    negative: "#f87171",
  },
  
  // Status colors
  status: {
    live: "#4ade80",
    warning: "#fbbf24",
    critical: "#f87171",
    idle: "#71717a",
    running: "#60a5fa",
  },
  
  // Surface accent colors for navigation
  surface: {
    trading: "#4ade80",
    strategy: "#60a5fa",
    markets: "#a78bfa",
    ops: "#fbbf24",
    config: "#22d3ee",
    ml: "#f472b6",
    reports: "#fb923c",
  },
  
  // Risk threshold colors
  risk: {
    healthy: "#4ade80",
    warning: "#fbbf24",
    critical: "#f87171",
  },
  
  // Chart colors
  chart: [
    "#22d3ee", // cyan
    "#4ade80", // green
    "#60a5fa", // blue
    "#a78bfa", // purple
    "#fbbf24", // amber
    "#f472b6", // pink
  ],
  
  // Surface hierarchy (dark to light)
  surfaces: {
    primary: "#0a0a0b",
    secondary: "#111113",
    tertiary: "#18181b",
    quaternary: "#1c1c1f",
  },
} as const

// Typography
export const TYPOGRAPHY = {
  fontSans: "'IBM Plex Sans', 'Geist', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Geist Mono', monospace",
} as const

// Border radii (updated modern feel)
export const RADII = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
} as const

// USPs for marketing
export const USPS = [
  {
    id: "venues",
    headline: "33 Venues, 5 Asset Classes",
    description: "Trade across CeFi, DeFi, TradFi, on-chain perps, and prediction markets from a single platform.",
  },
  {
    id: "seamless",
    headline: "Seamless Internal/External",
    description: "Same system, same pages. Internal and client users see filtered data, not different apps.",
  },
  {
    id: "backtest-live",
    headline: "Backtest ↔ Live Diff",
    description: "Compare backtest results to live execution with our proprietary data, models, and strategies.",
  },
] as const

// Social links
export const SOCIAL = {
  twitter: "https://twitter.com/odumresearch",
  linkedin: "https://linkedin.com/company/odumresearch",
  github: "https://github.com/odumresearch",
} as const

// Contact
export const CONTACT = {
  email: "hello@odum.io",
  sales: "sales@odum.io",
  support: "support@odum.io",
} as const
