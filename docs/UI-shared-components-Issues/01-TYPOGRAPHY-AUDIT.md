# 01 — Typography Audit

**Date:** 2026-03-27
**Scope:** All `.tsx` / `.ts` files in `unified-trading-system-ui`

---

## 1. Current State: No Typography Scale

`globals.css` defines **fonts** (`--font-sans`, `--font-mono`) but **zero font-size tokens**. There is no `--text-h1`, `--text-body`, or equivalent. Every component chooses its own `text-*` Tailwind class independently.

### What Exists

| Location                                        | What It Defines                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `globals.css` `@theme inline`                   | `--font-sans`, `--font-mono` only                                                             |
| `lib/config/branding.ts`                        | `FONTS.sans`, `FONTS.mono` (refs to CSS vars)                                                 |
| `components/shared/finder/finder-text-sizes.ts` | Finder-specific scale: `meta` (12px), `micro` (10.8px), `body` (14.4px), `row` (16.8px)       |
| `components/ui/card.tsx`                        | `CardTitle`: `font-semibold leading-none`; `CardDescription`: `text-sm text-muted-foreground` |

### What Is Missing

- No `@layer base` styles for `h1`–`h6`
- No shared `Heading` / `PageTitle` / `SectionTitle` component
- No typography constants file (e.g. `lib/config/typography.ts`)
- No responsive base type scale

---

## 2. Platform Page Title (`h1`) Inconsistencies

These are all `<h1>` elements in `app/(platform)/` pages:

| Page             | File                                            | Class on `h1`                                            |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------- |
| Reports Overview | `services/reports/overview/page.tsx:181`        | `text-2xl font-semibold`                                 |
| Strategies List  | `services/trading/strategies/page.tsx:180`      | `text-2xl font-semibold`                                 |
| Strategy Detail  | `services/trading/strategies/[id]/page.tsx:202` | `text-2xl font-semibold`                                 |
| Strategy Grid    | `services/trading/strategies/grid/page.tsx:206` | `text-2xl font-semibold`                                 |
| Risk             | `services/trading/risk/page.tsx:624`            | `text-2xl font-semibold`                                 |
| P&L              | `services/trading/pnl/page.tsx:1050`            | `text-2xl font-semibold`                                 |
| Markets          | `services/trading/markets/page.tsx:715`         | `text-2xl font-semibold`                                 |
| Settings         | `settings/page.tsx:45`                          | `text-2xl font-semibold`                                 |
| API Keys         | `settings/api-keys/page.tsx:162`                | `text-2xl font-semibold`                                 |
| **Orders**       | `services/trading/orders/page.tsx:641`          | **`text-xl font-semibold`** ← smaller                    |
| **Instruments**  | `services/data/instruments/page.tsx:232`        | **`text-lg font-bold tracking-tight`** ← smallest + bold |
| **Predictions**  | `services/trading/predictions/page.tsx:15`      | **`text-lg font-semibold`** ← smallest                   |

**Result:** 3 different sizes (`text-lg`, `text-xl`, `text-2xl`) and 2 different weights (`font-bold`, `font-semibold`) for the same semantic level.

---

## 3. Public Page Titles — Different Scale (Acceptable)

| Page          | Class                              |
| ------------- | ---------------------------------- |
| Platform hero | `text-4xl md:text-5xl lg:text-6xl` |
| Terms         | `text-4xl font-bold`               |
| Signup        | `text-3xl font-bold`               |

Public/marketing pages use a larger display scale — this is **intentional** and separate from platform.

---

## 4. Font Weight Inconsistencies

| Element Type           | Expected Weight              | Actual Variations                         |
| ---------------------- | ---------------------------- | ----------------------------------------- |
| Platform `h1`          | `font-semibold` (majority)   | `font-bold` in instruments, health page   |
| Card titles            | `font-semibold` (Card.tsx)   | Consistent ✅                             |
| Table headers          | `font-medium` (Table.tsx)    | Consistent ✅                             |
| Section headers (`h3`) | Not defined                  | Some have no size class (browser default) |
| Metric labels          | `font-medium` or `font-bold` | Varies by tone in MetricCard              |

---

## 5. Arbitrary Pixel Sizes (`text-[Npx]`)

**Total occurrences:** ~200+ across the codebase

### Worst Offenders

| File                                                       | Count | Example Values                                                   |
| ---------------------------------------------------------- | ----- | ---------------------------------------------------------------- |
| `components/trading/options-futures-panel.tsx`             | 92    | `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`       |
| `app/(platform)/services/trading/strategies/[id]/page.tsx` | 61    | `text-[11px]`, `text-[12px]`, `text-[13px]`                      |
| `components/trading/options-chain.tsx`                     | 30    | `text-[10px]`, `text-[11px]`                                     |
| `components/shared/finder/finder-text-sizes.ts`            | 6     | `text-[10.8px]`, `text-[12px]`, `text-[14.4px]`, `text-[16.8px]` |

**Problem:** These create a shadow type scale with at least **7 distinct pixel values** (10, 10.8, 11, 12, 13, 14.4, 16.8) that are impossible to change globally.

---

## 6. `fontSize:` in Style Objects (Charts/Canvas)

~24 files use `fontSize:` in JavaScript style objects, mostly for Recharts / chart libraries:

| File                                                         | Occurrences | Use               |
| ------------------------------------------------------------ | ----------- | ----------------- |
| `components/trading/vol-surface-chart.tsx`                   | 4           | Chart axis labels |
| `components/trading/live-batch-comparison.tsx`               | 9           | Chart labels      |
| `components/dashboards/executive-dashboard.tsx`              | 8           | Dashboard charts  |
| `app/(platform)/services/trading/pnl/page.tsx`               | 7           | P&L charts        |
| `app/(platform)/services/research/strategy/results/page.tsx` | 9           | Research charts   |

**Partial mitigation:** Chart libraries often require numeric `fontSize` values (can't use CSS vars directly). A chart config object with centralized sizes is the recommended approach.

---

## 7. Responsive Typography

Responsive text classes (`md:text-*`, `lg:text-*`) are used on:

- **Public/marketing pages** — hero sections with scale-up breakpoints ✅
- **`MetricCard`** — `sm:text-sm`, `sm:text-2xl` for responsive KPIs ✅
- **Platform pages** — essentially **none** ❌

**Result:** Platform content is fixed-size regardless of viewport, which is acceptable for a trading terminal but should be a conscious design decision, not an omission.

---

## 8. Line Height and Letter Spacing

| Pattern                            | Where                            | Consistent?                               |
| ---------------------------------- | -------------------------------- | ----------------------------------------- |
| `leading-none`                     | CardTitle, some headings         | Partially — some headings don't specify   |
| `leading-snug`                     | Finder cells, MetricCard values  | Used in dense UIs ✅                      |
| `leading-tight`                    | MetricCard, marketing            | Sporadic                                  |
| `tracking-tight`                   | Some page `h1`s (instruments)    | Not consistent — most `h1`s don't specify |
| `tracking-wider` / `tracking-wide` | MetricCard labels, finder labels | Consistent for "label" role ✅            |

---

## 9. Recommended Fix: Global Typography Scale

### A. Add tokens to `globals.css`

```css
:root {
  /* Typography scale — platform UI */
  --text-page-title: 1.5rem; /* 24px — h1 on platform pages */
  --text-section-title: 1.125rem; /* 18px — h2 / section headers */
  --text-card-title: 1rem; /* 16px — card/panel titles */
  --text-body: 0.875rem; /* 14px — default body text */
  --text-caption: 0.75rem; /* 12px — labels, metadata */
  --text-micro: 0.625rem; /* 10px — badges, tiny indicators */

  /* Typography scale — dense data UI */
  --text-data-lg: 0.875rem; /* 14px — primary data values */
  --text-data-md: 0.75rem; /* 12px — table cells, lists */
  --text-data-sm: 0.625rem; /* 10px — compact grid cells */

  /* Font weights */
  --font-weight-heading: 600; /* semibold — all headings */
  --font-weight-label: 500; /* medium — form labels, table headers */
  --font-weight-body: 400; /* normal — body text */
  --font-weight-bold: 700; /* bold — emphasis, KPI values */
}
```

### B. Create `PageHeader` component

```tsx
function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-[length:var(--text-page-title)] font-[number:var(--font-weight-heading)]">{title}</h1>
        {description && <p className="text-[length:var(--text-body)] text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

### C. Create `lib/config/typography.ts` for chart/JS contexts

```ts
export const CHART_FONT_SIZES = {
  axisLabel: 11,
  axisTick: 10,
  legend: 12,
  tooltip: 12,
  title: 14,
} as const;
```

### D. Migrate finder-text-sizes to use global tokens

Replace `text-[12px]` etc. with `text-[length:var(--text-caption)]` (or the closest token), keeping the named roles (`meta`, `body`, `row`).
