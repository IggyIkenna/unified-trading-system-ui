# 04 — Remediation Plan

**Date:** 2026-03-27
**Estimated Total Effort:** 15–25 days (can be parallelized across 2–3 developers)

---

## Guiding Principles

1. **Single Source of Truth** — `globals.css` is the SSOT for all visual tokens (colors, typography, spacing)
2. **Token-First** — Components reference tokens, never raw values
3. **Shared Components** — Build once, use everywhere; no ad-hoc duplicates
4. **Progressive Migration** — Fix the system first, then sweep components file-by-file
5. **Enforcement** — Lint rules prevent regression

---

## Phase 1: Fix the Foundation (Days 1–2)

### 1.1 Add Typography Tokens to `globals.css`

Add to `:root` block:

```css
/* Typography scale — platform UI */
--text-page-title: 1.5rem;
--text-section-title: 1.125rem;
--text-card-title: 1rem;
--text-body: 0.875rem;
--text-caption: 0.75rem;
--text-micro: 0.625rem;

/* Typography scale — dense data UI */
--text-data-lg: 0.875rem;
--text-data-md: 0.75rem;
--text-data-sm: 0.625rem;

/* Font weights */
--font-weight-heading: 600;
--font-weight-label: 500;
--font-weight-body: 400;
--font-weight-bold: 700;

/* Page layout */
--page-padding-default: 1.5rem;
--page-padding-compact: 1rem;
```

Map in `@theme inline`:

```css
--text-page-title: var(--text-page-title);
--text-section-title: var(--text-section-title);
/* ... etc */
```

### 1.2 Align `branding.ts` with `globals.css`

**Action:** Delete `BRAND_COLORS` object from `lib/config/branding.ts`, or redefine it to reference CSS custom properties. Grep for all usages and replace.

### 1.3 Fix Badge Component

Replace raw Tailwind colors in `components/ui/badge.tsx` variants with design tokens:

| Current                          | Replacement                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `bg-green-500/15 text-green-500` | `bg-[color:var(--status-live)]/15 text-[color:var(--status-live)]`       |
| `bg-red-500/15 text-red-500`     | `bg-[color:var(--pnl-negative)]/15 text-[color:var(--pnl-negative)]`     |
| `bg-amber-500/15 text-amber-500` | `bg-[color:var(--status-warning)]/15 text-[color:var(--status-warning)]` |
| `bg-cyan-500/15 text-cyan-500`   | `bg-primary/15 text-primary`                                             |
| `bg-gray-500/15 text-gray-500`   | `bg-muted text-muted-foreground`                                         |

### 1.4 Fix StatusBadge `rgba` Hardcodes

Replace `rgba(74, 222, 128, 0.1)` etc. with `color-mix(in srgb, var(--status-live) 10%, transparent)`.

---

## Phase 2: Create Shared Components (Days 3–5)

### 2.1 `PageHeader` Component

Create `components/shared/page-header.tsx`:

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}
```

Uses `--text-page-title` + `--font-weight-heading`.

### 2.2 `PageWrapper` Component

Create `components/shared/page-wrapper.tsx`:

```tsx
interface PageWrapperProps {
  children: React.ReactNode;
  maxWidth?: "default" | "wide" | "full";
  density?: "default" | "compact";
  className?: string;
}
```

Standardizes `padding` + `max-width` + `margin-inline: auto`.

### 2.3 Loading Skeleton Presets

Create `components/shared/skeletons.tsx`:

- `TableSkeleton` — mimics DataTable loading
- `DashboardSkeleton` — KPI cards + chart area
- `PageSkeleton` — PageHeader + content skeleton

### 2.4 Consolidate Sports `EmptyState`

Delete `EmptyState` from `components/trading/sports/shared.tsx`, update sports files to import from `components/ui/empty-state`.

### 2.5 Chart Config Object

Create `lib/config/chart.ts`:

```ts
export const CHART_THEME = {
  fontSizes: { axis: 11, tick: 10, legend: 12, tooltip: 12, title: 14 },
  colors: {
    grid: "var(--border)",
    text: "var(--muted-foreground)",
    positive: "var(--pnl-positive)",
    negative: "var(--pnl-negative)",
    primary: "var(--primary)",
    series: [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--chart-6)",
    ],
  },
} as const;
```

---

## Phase 3: Migrate High-Traffic Pages (Days 6–12)

### Migration Order (by traffic / visibility)

| Priority | Pages                                             | Changes                                      |
| -------- | ------------------------------------------------- | -------------------------------------------- |
| P0       | Trading: strategies, positions, orders, risk, P&L | PageHeader, PageWrapper, token colors        |
| P0       | Reports: overview, settlement                     | PageHeader, PageWrapper, MetricCard adoption |
| P1       | Data: instruments                                 | PageHeader, token colors                     |
| P1       | Research: strategy results, backtests, ML         | PageHeader, chart token colors               |
| P1       | Promote: all tabs                                 | Token colors, MetricCard consistency         |
| P2       | Settings: main, API keys                          | PageHeader                                   |
| P2       | Ops: all admin pages                              | PageHeader, PageWrapper                      |
| P3       | Sports: all sports components                     | Full color token migration                   |
| P3       | Marketing: public pages                           | Lower priority (separate design context)     |

### Per-Page Migration Checklist

For each page:

- [ ] Replace `<h1 className="text-*xl font-*">` with `<PageHeader title="..." />`
- [ ] Wrap content in `<PageWrapper>` with appropriate density
- [ ] Replace `text-zinc-*` / `bg-zinc-*` with `text-muted-foreground` / `bg-card` etc.
- [ ] Replace `text-green-*` / `text-red-*` with `text-pnl-positive` / `text-pnl-negative`
- [ ] Replace arbitrary `text-[#hex]` / `bg-[#hex]` with token utilities
- [ ] Verify loading states use skeleton presets where applicable
- [ ] Verify empty states use `EmptyState` component

---

## Phase 4: Registry/Config Color Centralization (Days 13–15)

### 4.1 `lib/strategy-registry.ts`

Extract ~146 hardcoded hex values into a token-based palette. Strategy types map to semantic roles:

```ts
import { CHART_THEME } from "@/lib/config/chart";

const STRATEGY_TYPE_COLORS = {
  momentum: CHART_THEME.colors.series[0],
  meanReversion: CHART_THEME.colors.series[1],
  arbitrage: CHART_THEME.colors.series[2],
  // ...
} as const;
```

### 4.2 `lib/taxonomy.ts`

Same pattern — map taxonomy categories to chart/surface tokens.

### 4.3 `lib/lifecycle-mapping.ts`

Replace `text-green-400`, `text-cyan-400`, etc. with `text-pnl-positive`, `text-primary`, etc.

### 4.4 Finder Text Sizes

Update `components/shared/finder/finder-text-sizes.ts` to reference global typography tokens instead of arbitrary `text-[Npx]` values.

---

## Phase 5: Enforcement (Day 16+)

### 5.1 ESLint Rules

Add to `.eslintrc` / ESLint config:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/text-(zinc|gray|slate|stone|neutral)-/]",
        "message": "Use semantic color tokens (text-foreground, text-muted-foreground) instead of raw Tailwind neutrals"
      },
      {
        "selector": "Literal[value=/text-(green|red|amber|yellow|cyan|emerald|rose|blue)-/]",
        "message": "Use semantic tokens (text-pnl-positive, text-destructive, text-primary, text-status-warning) instead of raw Tailwind colors"
      },
      {
        "selector": "Literal[value=/bg-(zinc|gray|slate)-/]",
        "message": "Use semantic tokens (bg-background, bg-card, bg-muted, bg-secondary) instead of raw neutrals"
      }
    ]
  }
}
```

### 5.2 PR Review Checklist Addition

Add to team review checklist:

- [ ] New colors use `globals.css` tokens, not raw Tailwind palette
- [ ] New text sizes use typography tokens or documented scale
- [ ] Shared components used where applicable (PageHeader, MetricCard, EmptyState, Badge)

### 5.3 Component Usage Documentation

Create a `components/README.md` or Storybook entries documenting when to use each shared component.

---

## Effort Summary

| Phase                      | Duration     | Parallelizable?          |
| -------------------------- | ------------ | ------------------------ |
| Phase 1: Foundation        | 2 days       | No (must come first)     |
| Phase 2: Shared Components | 3 days       | Partially                |
| Phase 3: Page Migration    | 7 days       | Yes (split by page)      |
| Phase 4: Registry/Config   | 3 days       | Yes (split by file)      |
| Phase 5: Enforcement       | 1+ day       | Yes                      |
| **Total**                  | **~16 days** | **~10 days with 2 devs** |

---

## Success Metrics

| Metric                         | Current       | Target            |
| ------------------------------ | ------------- | ----------------- |
| Hardcoded hex in components    | ~400+         | <20 (charts only) |
| Raw Tailwind neutral utilities | High hundreds | <50               |
| Pages using PageHeader         | 0             | 50+               |
| Pages using PageWrapper        | 0             | 40+               |
| Badge variants using tokens    | 0/5           | 5/5               |
| Typography token coverage      | 0%            | 80%+              |
