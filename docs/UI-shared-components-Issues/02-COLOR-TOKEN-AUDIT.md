# 02 — Color Token Audit

**Date:** 2026-03-27
**Scope:** All `.tsx` / `.ts` files in `unified-trading-system-ui` (excluding `globals.css` where tokens are defined)

---

## 1. Design System Token Inventory (What Exists)

`globals.css` defines **~60 CSS custom properties** organized into semantic groups:

| Group   | Tokens                                                                                        | Purpose                    |
| ------- | --------------------------------------------------------------------------------------------- | -------------------------- |
| Core    | `--background`, `--foreground`, `--card`, `--muted`, `--accent`, `--primary`, `--secondary`   | Base surfaces and text     |
| P&L     | `--pnl-positive` (#4ade80), `--pnl-negative` (#f87171)                                        | Profit/loss indicators     |
| Status  | `--status-live`, `--status-warning`, `--status-critical`, `--status-idle`, `--status-running` | System status              |
| Surface | `--surface-trading`, `--surface-strategy`, `--surface-markets`, etc.                          | Navigation/service accents |
| Risk    | `--risk-healthy`, `--risk-warning`, `--risk-critical`                                         | Risk thresholds            |
| Charts  | `--chart-1` through `--chart-6`                                                               | Data visualization palette |
| Sidebar | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.                                | Shell sidebar              |

Tailwind `@theme` block maps each to `--color-*` for utility class usage (e.g. `bg-primary`, `text-muted-foreground`).

**Conclusion:** The token system is **comprehensive and well-designed**. The problem is **adoption**, not design.

---

## 2. Token Bypass: Hardcoded Hex Colors (~400–450 occurrences)

### 2a. Registry/Config Files (Highest Density)

| File                       | Approx. Matches | Example Values                                        |
| -------------------------- | --------------- | ----------------------------------------------------- |
| `lib/strategy-registry.ts` | ~146            | `#4ade80`, `#22d3ee`, `#ef4444`, `#60a5fa`, `#fbbf24` |
| `lib/taxonomy.ts`          | ~34             | `#22c55e`, `#64748b`, `#22d3ee`                       |
| `lib/reference-data.ts`    | ~10             | Various hex for category colors                       |

**Problem:** These files assign colors to strategy types, asset classes, and taxonomy nodes as hardcoded hex strings. If the design system tokens change, these stay stale.

**Fix:** Create a `lib/config/palette.ts` that reads from CSS variables (via `getComputedStyle` at runtime or a shared constant map) and reference those.

### 2b. Trading Components

| File                                           | Matches | Typical Values                         |
| ---------------------------------------------- | ------- | -------------------------------------- |
| `components/trading/vol-surface-chart.tsx`     | 8+      | `rgba(255,255,255,0.1)` for grid lines |
| `components/trading/candlestick-chart.tsx`     | 10+     | Hardcoded greens/reds for candles      |
| `components/trading/options-futures-panel.tsx` | 15+     | Hex for column highlights              |
| `components/trading/order-book.tsx`            | 5+      | `rgb(16,185,129)` / `rgb(239,68,68)`   |
| `components/trading/circuit-breaker-grid.tsx`  | 5+      | Status-related hex                     |
| `components/trading/kpi-card.tsx`              | 3+      | `rgba()` for backgrounds               |

### 2c. Research Components

| File                                               | Matches | Issue                    |
| -------------------------------------------------- | ------- | ------------------------ |
| `components/research/equity-chart-with-layers.tsx` | 10+     | Chart line colors as hex |
| `components/research/signal-overlay-chart.tsx`     | 8+      | `rgba()` for overlays    |
| `components/research/win-loss-donut.tsx`           | 4+      | Pie chart colors         |
| `components/research/profit-structure-chart.tsx`   | 5+      | Chart fills              |

### 2d. Marketing Components

| File                                              | Matches | Issue                  |
| ------------------------------------------------- | ------- | ---------------------- |
| `components/marketing/arbitrage-galaxy.tsx`       | 15+     | Canvas particle colors |
| `components/marketing/galaxy-canvas.tsx`          | 10+     | WebGL/canvas colors    |
| `components/marketing/market-galaxy.tsx`          | 10+     | Canvas colors          |
| `components/marketing/operating-model-stages.tsx` | 5+      | Stage indicators       |

---

## 3. Tailwind Neutral Palette Bypass (High Hundreds of Occurrences)

These utilities reference Tailwind's **built-in** zinc/gray/slate scales instead of the **design system** tokens:

### Token Mapping (What Should Be Used)

| Hardcoded Pattern                                                   | Design System Equivalent                  | Hex Match                           |
| ------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `text-white`, `text-zinc-100`                                       | `text-foreground`                         | #fafafa                             |
| `text-zinc-400`, `text-zinc-500`, `text-slate-400`, `text-gray-400` | `text-muted-foreground`                   | #a1a1aa                             |
| `bg-zinc-900`                                                       | `bg-card`                                 | #111113 (close to zinc-900 #18181b) |
| `bg-zinc-950`                                                       | `bg-background`                           | #0a0a0b                             |
| `bg-zinc-800`, `bg-zinc-700`                                        | `bg-secondary` or `bg-muted`              | #18181b / #1c1c1f                   |
| `border-zinc-800`, `border-zinc-700`                                | `border-border`                           | #27272a                             |
| `text-zinc-300` (hover)                                             | `text-foreground` or `text-foreground/80` | -                                   |

### Hotspot Files

| Directory                             | Files     | Scale of Issue                                            |
| ------------------------------------- | --------- | --------------------------------------------------------- |
| `components/trading/sports/*`         | ~12 files | **Very high** — sports components are the worst offenders |
| `components/trading/predictions/*`    | ~5 files  | High                                                      |
| `components/promote/*`                | ~8 files  | Medium                                                    |
| `components/data/*-finder-config.tsx` | 3 files   | Medium                                                    |
| `app/(public)/*`                      | ~10 files | Medium (some acceptable for marketing)                    |
| `lib/lifecycle-mapping.ts`            | 1 file    | Medium (maps lifecycle → Tailwind colors)                 |

---

## 4. Semantic Tailwind Colors Bypass Design Tokens

These use Tailwind's **named color scale** instead of the **semantic tokens**:

| Pattern                                                | Token To Use                                        | Meaning            |
| ------------------------------------------------------ | --------------------------------------------------- | ------------------ |
| `text-green-400`, `text-emerald-400`, `text-green-500` | `text-pnl-positive` or `text-status-live`           | Positive / success |
| `text-red-400`, `text-red-500`, `text-rose-400`        | `text-pnl-negative` or `text-destructive`           | Negative / error   |
| `text-cyan-400`, `text-cyan-500`                       | `text-primary`                                      | Primary accent     |
| `text-amber-400`, `text-yellow-400`                    | `text-status-warning`                               | Warning            |
| `text-blue-400`, `text-blue-500`                       | `text-[color:var(--chart-3)]` or add `--info` token | Informational      |
| `bg-green-500/15`                                      | `bg-[color:var(--pnl-positive)]/15`                 | Success background |
| `bg-red-500/15`                                        | `bg-[color:var(--pnl-negative)]/15`                 | Error background   |
| `bg-cyan-500/15`                                       | `bg-primary/15`                                     | Running state bg   |

---

## 5. `branding.ts` vs `globals.css` Divergence 🔴

`lib/config/branding.ts` defines `BRAND_COLORS` that **do not match** `globals.css`:

| Token       | `branding.ts` Value          | `globals.css` Value | Match?                          |
| ----------- | ---------------------------- | ------------------- | ------------------------------- |
| primary     | `hsl(142, 76%, 36%)` (green) | `#22d3ee` (cyan)    | ❌ **Completely different hue** |
| background  | `hsl(240, 10%, 4%)`          | `#0a0a0b`           | ≈ Close                         |
| card        | `hsl(240, 6%, 8%)`           | `#111113`           | ≈ Close                         |
| border      | `hsl(240, 4%, 16%)`          | `#27272a`           | ≈ Close                         |
| muted       | `hsl(240, 5%, 65%)`          | `#a1a1aa`           | ≈ Close                         |
| destructive | `hsl(0, 84%, 60%)`           | `#f87171`           | ≈ Close                         |

**Critical issue:** `branding.ts` says primary is **green**, `globals.css` says primary is **cyan**. If any component reads from `BRAND_COLORS.primary`, it gets a different color than `var(--primary)`.

**Fix:** Delete `BRAND_COLORS` from `branding.ts` or redefine it to reference the CSS variables. `globals.css` must be the single source of truth.

---

## 6. Badge Component Uses Raw Tailwind Colors

`components/ui/badge.tsx` defines variants with **raw Tailwind colors** instead of design tokens:

```tsx
// Current (line 20-24)
success: "border-transparent bg-green-500/15 text-green-500",
error: "border-transparent bg-red-500/15 text-red-500",
warning: "border-transparent bg-amber-500/15 text-amber-500",
running: "border-transparent bg-cyan-500/15 text-cyan-500",
pending: "border-transparent bg-gray-500/15 text-gray-500",
```

**Should be:**

```tsx
success: "border-transparent bg-[color:var(--pnl-positive)]/15 text-pnl-positive",
error: "border-transparent bg-[color:var(--pnl-negative)]/15 text-pnl-negative",
warning: "border-transparent bg-[color:var(--status-warning)]/15 text-status-warning",
running: "border-transparent bg-primary/15 text-primary",
pending: "border-transparent bg-muted text-muted-foreground",
```

---

## 7. StatusBadge Mixes Tokens with Hardcoded rgba

`components/trading/status-badge.tsx` correctly uses `var(--status-live)` for `color` but hardcodes `rgba(74, 222, 128, 0.1)` for `bgColor`:

```tsx
// Current (line 41-46)
live: {
  color: "var(--status-live)",        // ✅ Token
  bgColor: "rgba(74, 222, 128, 0.1)", // ❌ Hardcoded
  dotColor: "var(--status-live)",      // ✅ Token
},
```

**Fix:** Use `color-mix(in srgb, var(--status-live) 10%, transparent)` for `bgColor` to keep it token-driven.

---

## 8. Arbitrary Color Classes (`text-[#...]`, `bg-[#...]`)

~92 occurrences in 14 files, concentrated in:

| File                                                  | Count |
| ----------------------------------------------------- | ----- |
| `components/trading/sports/sports-page.tsx`           | 12    |
| `components/trading/sports/fixtures-detail-panel.tsx` | 10    |
| `components/trading/sports/arb-stream.tsx`            | 8     |
| `components/trading/sports/arb-grid.tsx`              | 8     |
| `components/trading/sports/my-bets-tab.tsx`           | 7     |
| `components/trading/context-bar.tsx`                  | 5     |

Many of these use the **exact hex values** that match existing tokens (e.g. `text-[#22d3ee]` = `--primary`, `text-[#4ade80]` = `--pnl-positive`). Replacing with token utilities is a direct find-and-replace.

---

## 9. Inline Styles with Hardcoded Colors

Generally rare except in:

- **Chart components** — numeric color values required by Recharts/canvas APIs
- **`arb-grid.tsx` line 346:** `style={{ background: locked ? "#3f3f46" : … }}` → should use `var(--muted)`

**Good examples (to replicate):**

- `reports/overview/page.tsx` uses `var(--pnl-positive)`, `var(--status-warning)` in inline styles ✅

---

## 10. Remediation Priority

### Phase 1 — Fix Token Sources (Day 1)

1. Align `branding.ts` with `globals.css` (or delete `BRAND_COLORS`)
2. Fix `Badge` component variants to use design tokens
3. Fix `StatusBadge` rgba values to use `color-mix`

### Phase 2 — Registry/Config Files (Days 2–3)

1. `lib/strategy-registry.ts` — extract color assignments to token-based palette
2. `lib/taxonomy.ts` — same treatment
3. `lib/lifecycle-mapping.ts` — replace `text-green-400` etc. with `text-pnl-positive` etc.

### Phase 3 — Component Sweep (Days 4–8)

1. Sports components (highest density of violations)
2. Trading chart components (where CSS vars can replace hardcodes)
3. Finder config files
4. Promote components
5. Research chart components

### Phase 4 — Enforcement

1. Add ESLint `no-restricted-syntax` rules for `text-zinc-*`, `bg-zinc-*`, `text-green-*`, etc.
2. Add to PR review checklist
3. Consider `eslint-plugin-tailwindcss` with allowlist
