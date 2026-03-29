# Task 04 — Shared Component Extraction & Universal Adoption

**Source:** Audit `04-SHARED-COMPONENT-REUSE-AUDIT.md`
**WORK_TRACKER:** §3 (Component Centralization), §4.x (Widget Merging prereqs)
**Priority:** P1 — every page refactored after this benefits from shared components

---

## Agent Execution Model

| Phase | What | Model | Output |
|-------|------|-------|--------|
| **Phase 1 — Discovery** | Run audit module D (`docs/UI-shared-components-Issues/audit-scripts/D-shared-components.md`). For each component pattern, count adopters and bypasses. Read each shared component to understand its current API. Identify what needs to be created vs extended vs adopted. | **Smart** (claude-4-opus or claude-3.7-sonnet) | Concrete bypass list: per-component file + line + what it does wrong + what it should use |
| **Phase 2 — Execution** | Take the Phase 1 bypass list and mechanically: create missing components/utilities, migrate each bypass, delete old code, run typecheck. | **Medium** (claude-3.7-sonnet) | Code changes + passing typecheck |

**Phase 1 is the audit doc.** Give the agent `docs/UI-shared-components-Issues/audit-scripts/D-shared-components.md` and tell it to execute it. The audit doc has all the `rg` commands ready to run. Phase 1 output is the audit report with exact files/lines.

**Phase 2 takes the audit report** and does the work. It does NOT need to re-discover anything — it gets a list and executes it.

**Splitting across sessions:** This task is large (12 parts). You can split it:
- **Session A (create):** Parts 1, 2, 10, 11 — create new components/utilities (independent)
- **Session B (enforce):** Parts 3, 4, 5, 7, 8 — migrate bypasses to existing components
- **Session C (assess):** Parts 6, 9, 12 — Tooltip migration, DataTable assessment, unused cleanup

Each session runs its own Phase 1 (discovery for its parts only) then Phase 2.

### Discovery Commands (Phase 1 — run BEFORE starting any part)

The audit doc `D-shared-components.md` has all commands. Here's the quick summary:

```bash
cd unified-trading-system-ui

# MetricCard bypasses
rg -l "MetricCard" app/ components/ | wc -l
rg -n "text-2xl.*font-mono|text-xl.*font-bold|text-3xl.*font-semibold" app/ components/ --glob '*.tsx'

# StatusBadge bypasses
rg -l "StatusBadge" app/ components/ | wc -l
rg -n "rounded-full.*bg-green|rounded-full.*bg-red|rounded-full.*bg-amber" app/ components/ --glob '*.tsx'

# Spinner bypasses
rg -l "from.*@/components/ui/spinner" app/ components/ | wc -l
rg -l "Loader2" app/ components/ | wc -l
rg -l "animate-spin" app/ components/ | wc -l

# Tooltip bypasses
rg -l "TooltipContent" app/ components/ | wc -l
rg -c 'title="' app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -20

# Skeleton bypasses
rg -l "from.*@/components/ui/skeleton" app/ components/ | wc -l
rg -l "animate-pulse" app/ components/ | wc -l

# EmptyState bypasses
rg -l "EmptyState" app/ components/ | wc -l
rg -n '"No data"|"No results"|"Nothing to"|"No .* found"' app/ components/ --glob '*.tsx'

# Value formatting gaps
rg -c "\.toFixed(" app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -20
rg -c "\.toLocaleString(" app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -20

# PnL coloring gaps
rg -l "pnl-positive|pnl-negative" app/ components/ | wc -l
rg -l "text-emerald" app/ components/ | wc -l
rg -l "text-red" app/ components/ | wc -l

# Unused ui components
for f in components/ui/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(rg -l "from.*@/components/ui/$name" app/ components/ hooks/ lib/ 2>/dev/null | wc -l)
  [ "$count" -eq 0 ] && echo "UNUSED: $f"
done
```

> **The bypass counts in the Mandate table below are historical snapshots from 2026-03-28.**
> Always run the discovery commands to get current numbers before starting work.

---

## Goal

Three things, equally important:

1. **Create missing shared components and utilities** (PageHeader, nav helper, value formatters, PnL helper) that don't exist yet.
2. **Enforce universal adoption of existing shared components** (MetricCard, StatusBadge, Spinner, Tooltip, Skeleton, EmptyState, DataTable) — find every ad-hoc reimplementation and replace it with the shared version.
3. **Enforce consistent value formatting and coloring** — every number, currency, percentage, and PnL value goes through shared formatters and uses design system color tokens.

After this task: if you want to render a metric, you use `MetricCard`. If you want a status indicator, you use `StatusBadge`. If you want a loading spinner, you use `Spinner`. If you want to format a dollar amount, you use `formatCurrency()`. If you want to color a PnL value, you use `text-pnl-positive` / `text-pnl-negative`. **No exceptions. No "it's just a quick toFixed(2)". No "I'll just use text-emerald-500 for green".**

This is critical because agents write most of the frontend code. Without strict shared components and utilities, they drift — every agent invents a slightly different Card + number layout, slightly different spinner, slightly different number format, slightly different shade of green for "positive". Centralizing means one place to change, one place to audit, zero drift. The result should look like an expert team of senior developers curated every pixel — not like 50 independent agents each made their own choices.

---

## The Shared Component Mandate

Every component below is the ONLY way to render its pattern. Ad-hoc alternatives must be migrated.

| Pattern | Shared Component | Location | Adopters | Bypasses | Status |
|---------|-----------------|----------|----------|----------|--------|
| Page title + description + actions | `PageHeader` | `components/platform/page-header.tsx` | 0 | ~89 ad-hoc `<h1>` | **NEW — create** |
| Metric / KPI number display | `MetricCard` | `components/shared/metric-card.tsx` | ~10 | ~30+ ad-hoc Card+number | **EXISTS — enforce** |
| Row of metrics | `KpiStrip` | `components/widgets/shared/kpi-strip.tsx` | 13 | some ad-hoc flex rows | **EXISTS — enforce** |
| Status indicator | `StatusBadge` | `components/trading/status-badge.tsx` | 26 | ~23 ad-hoc dots/pills | **EXISTS — enforce** |
| Loading spinner | `Spinner` | `components/ui/spinner.tsx` | **1** | **51** files use `Loader2`+`animate-spin` | **EXISTS — enforce** |
| Tooltip | `Tooltip` | `components/ui/tooltip.tsx` | 15 | **69** files use raw `title="..."` | **EXISTS — enforce** |
| Search/filter input | `FilterBar` | `components/platform/filter-bar.tsx` | 30 | **42** ad-hoc search inputs | **EXISTS — enforce** |
| Skeleton loading | `Skeleton` | `components/ui/skeleton.tsx` | 32 | **34** raw `animate-pulse` divs | **EXISTS — enforce** |
| Empty / no-data state | `EmptyState` | `components/ui/empty-state.tsx` | 4 | ~10 inline "No data" + duplicate | **EXISTS — consolidate** |
| Standard data table | `DataTable` | `components/ui/data-table.tsx` | 9 | 43 raw `<table>` | **EXISTS — promote** |
| Progress bar | `Progress` | `components/ui/progress.tsx` | 34 | some inline `div` with width% | **EXISTS — check** |
| Export/download | `ExportButton` | `components/ui/export-button.tsx` | **0** | component unused | **EXISTS — wire or delete** |
| Divider/separator | `Separator` | `components/ui/separator.tsx` | 20 | **110** raw `border-b` | **EXISTS — assess** |
| Number formatting | `formatNumber` | `lib/utils/formatters.ts` | **0** | **173** ad-hoc `.toFixed()` | **NEW — create** |
| Currency formatting | `formatCurrency` | `lib/utils/formatters.ts` | **0** | **97** ad-hoc `.toLocaleString()` | **NEW — create** |
| PnL coloring | `pnlColorClass` | `lib/utils/pnl.ts` | 39 via tokens | **179** raw `text-emerald-*`, **94** raw `text-red-*` | **NEW — create** |
| Nav active-tab logic | `isServiceTabActive` | `lib/utils/nav-helpers.ts` | 0 | 3 copy-pasted blocks | **NEW — extract** |

---

## Part 1 — Extract `isServiceTabActive` nav helper

**Problem:** Identical active-tab logic is duplicated byte-for-byte in 3 places.

**Discovery:** `rg -n "isActive|isFamilyActive|matchPrefix|tab\.exact|tab\.href" components/shell/service-tabs.tsx components/shell/trading-vertical-nav.tsx`

**Deliverable:**

Create `lib/utils/nav-helpers.ts`:

```typescript
import type { ServiceTab } from "@/components/shell/service-tabs";

export function isServiceTabActive(pathname: string, tab: ServiceTab): boolean {
  const matchPath = tab.matchPrefix || tab.href;
  return tab.exact
    ? pathname === tab.href || pathname === `${tab.href}/`
    : pathname === tab.href || pathname.startsWith(matchPath + "/");
}

export function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
```

Then update `service-tabs.tsx` and `trading-vertical-nav.tsx` to use the shared helpers.

---

## Part 2 — Create `PageHeader` component

**Problem:** Ad-hoc `<h1>` elements across `app/` pages with inconsistent sizes, padding, layout.

**Discovery:** `rg -n "<h1" app/ --glob '*.tsx' | wc -l`

**Deliverable:** Create `components/platform/page-header.tsx` with `title`, `description`, `children` (actions slot), `className` props. Use `text-page-title` and `text-body` tokens. Migrate 10+ platform pages.

**Do NOT migrate:** `app/(public)/` marketing pages or headings inside Cards (those are section titles).

---

## Part 3 — Enforce `MetricCard` universal adoption

**Problem:** `MetricCard` already supports 5 tones, 6 densities, 3 variants. But many pages bypass it with their own `<Card>` + number + label.

**Discovery:**
```bash
rg -l "MetricCard" app/ components/ | wc -l   # adopters
rg -n "text-2xl.*font-mono|text-xl.*font-bold|text-3xl.*font-semibold" app/ components/ --glob '*.tsx'  # bypasses
```

**Deliverable:** Find every ad-hoc metric pattern. Migrate each to `MetricCard`. If `MetricCard` doesn't support a use case, **extend it** — don't create a parallel component. Migrate inline metric rows to `KpiStrip`.

**Focus areas:** Research pages, promote lifecycle tabs, dashboard pages, trading overview.

---

## Part 4 — Enforce `StatusBadge` universal adoption

**Problem:** `StatusBadge` exists but ~23 files build ad-hoc status indicators.

**Discovery:**
```bash
rg -l "StatusBadge" app/ components/ | wc -l   # adopters
rg -n "rounded-full.*bg-green|rounded-full.*bg-red|rounded-full.*bg-amber" app/ components/ --glob '*.tsx'  # bypasses
rg -n "case.*live|case.*active|case.*paused|case.*error|case.*critical" app/ components/ --glob '*.tsx'  # status→color switches
```

**Deliverable:** Migrate each to `StatusBadge`. If it doesn't support a status value, extend it. After migration, same status = identical appearance everywhere.

---

## Part 5 — Enforce `Spinner` universal adoption

**Problem:** `Spinner` exists but only **1 file** uses it. **51 files** use `<Loader2 className="...animate-spin..." />` directly.

**Discovery:**
```bash
rg -l "from.*@/components/ui/spinner" app/ components/ | wc -l   # adopters
rg -l "Loader2" app/ components/ | wc -l   # bypasses
```

**Deliverable:** Extend `Spinner` with size variants (sm/md/lg) if needed. Replace every `Loader2` + `animate-spin` with `<Spinner />`. After migration, `Loader2` only appears inside `spinner.tsx`.

---

## Part 6 — Enforce `Tooltip` adoption over `title="..."`

**Problem:** `Tooltip` (Radix-based, styled) used in 15 files. **69 files** use native `title="..."` which is unstyled and inconsistent.

**Discovery:**
```bash
rg -l "TooltipContent" app/ components/ | wc -l   # adopters
rg -c 'title="' app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -20  # bypasses
```

**Deliverable:** Migrate interactive `title=` to `<Tooltip>`. Keep `title` on `<img>`, `<svg>`, `<abbr>` (accessibility). Focus on platform pages first. This is a large migration.

---

## Part 7 — Enforce `Skeleton` over raw `animate-pulse`

**Problem:** `Skeleton` exists and 32 files use it. **34 files** use raw `animate-pulse` divs.

**Discovery:**
```bash
rg -l "from.*@/components/ui/skeleton" app/ components/ | wc -l   # adopters
rg -l "animate-pulse" app/ components/ | wc -l   # bypasses (that don't import Skeleton)
```

**Deliverable:** Replace ad-hoc `animate-pulse` divs with `<Skeleton>`. Keep complex skeleton compositions but use `<Skeleton>` for each individual element.

---

## Part 8 — Consolidate `EmptyState`

**Problem:** Two implementations exist: `components/ui/empty-state.tsx` (canonical) and `components/trading/sports/shared.tsx` (duplicate). Plus ~10 files with inline "No data" text.

**Discovery:**
```bash
rg -n "function EmptyState|const EmptyState" components/ --glob '*.tsx'  # duplicates
rg -n '"No data"|"No results"|"Nothing to"' app/ components/ --glob '*.tsx'  # inline bypasses
```

**Deliverable:** Merge missing features into canonical `EmptyState`. Update all imports. Delete duplicate. Replace inline "No data" patterns.

---

## Part 9 — Promote `DataTable` adoption

**Problem:** 43 files use raw `<table>`. Only 9 import `DataTable`.

**Discovery:**
```bash
rg -l "from.*@/components/ui/data-table|DataTable" app/ components/ | wc -l   # adopters
rg -l "<table|<Table " app/ components/ --glob '*.tsx' | wc -l   # raw tables
```

**Deliverable:** Assessment only for this task. List all raw `<table>` files. Classify each (should use DataTable / intentionally custom / ambiguous). Migrate top 5 straightforward cases.

---

## Part 10 — Create centralized value formatters

**Problem:** **Zero** shared formatting utilities. 173 files use `.toFixed()` with varying decimals. 97 files use `.toLocaleString()` with different options. The same dollar amount shows differently on different pages.

**Discovery:**
```bash
rg -c "\.toFixed(" app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -20
rg -c "\.toLocaleString(" app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -20
rg "function formatNumber|function formatCurrency|function formatPercent" lib/
```

**Deliverable:** Create `lib/utils/formatters.ts`:

```typescript
export function formatNumber(value: number, decimals = 2): string { ... }
export function formatCurrency(value: number, currency = "USD", decimals = 2): string { ... }
export function formatPercent(value: number, decimals = 2): string { ... }
export function formatPnl(value: number, decimals = 2): string { ... }
export function formatCompact(value: number): string { ... }  // 1.2M, 340K
export function formatDate(date: Date | string, format?: "short" | "long" | "relative" | "time"): string { ... }
```

Migrate top 20 files with most `.toFixed()` / `.toLocaleString()` calls.

---

## Part 11 — Enforce PnL color tokens

**Problem:** 39 files correctly use `text-pnl-positive` / `text-pnl-negative`. But **94 files** use `text-red-*` and **179 files** use `text-emerald-*` for positive/negative values.

**Discovery:**
```bash
rg -l "pnl-positive|pnl-negative" app/ components/ | wc -l
rg -l "text-emerald" app/ components/ | wc -l
rg -l "text-red" app/ components/ | wc -l
```

**Deliverable:** Create `lib/utils/pnl.ts` with `pnlColorClass(value)` returning `text-pnl-positive` / `text-pnl-negative`. Migrate PnL-related green/red to tokens. **Not every green/red is PnL** — status indicators use different tokens.

---

## Part 12 — Clean up unused `components/ui/` files

**Problem:** ~28 scaffolded shadcn files with zero imports.

**Discovery:**
```bash
for f in components/ui/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(rg -l "from.*@/components/ui/$name" app/ components/ hooks/ lib/ 2>/dev/null | wc -l)
  [ "$count" -eq 0 ] && echo "UNUSED: $f"
done
```

**Deliverable:** Classify each: delete / keep (planned feature) / wire up. Delete dead files.

---

## Rules

1. **One canonical implementation per pattern.** No duplicates, no "V2", no shims.
2. **Use the new semantic tokens.** `text-page-title`, `text-body`, etc. from `globals.css`. Not raw `text-xl`.
3. **Update all consumers.** Don't leave half the codebase on the old pattern.
4. **Delete the old code.** No `// deprecated` comments. No re-export wrappers.
5. **Test in browser.** Load at least 3 different platform pages per component change.

---

## Acceptance Criteria

- [ ] `lib/utils/nav-helpers.ts` exists with `isServiceTabActive` and `isPathActive`
- [ ] `service-tabs.tsx` and `trading-vertical-nav.tsx` use the shared helpers (zero inline active logic)
- [ ] `components/platform/page-header.tsx` exists and is used by 10+ platform pages
- [ ] No duplicate `<h1>` + description patterns in migrated pages
- [ ] Every metric/KPI display in platform pages goes through `MetricCard` — zero ad-hoc Card + number patterns
- [ ] Every horizontal metric row uses `KpiStrip` — zero ad-hoc flex/grid metric rows
- [ ] Every status indicator goes through `StatusBadge` — zero ad-hoc colored dots/pills
- [ ] `Loader2` + `animate-spin` only appears inside `spinner.tsx` — zero ad-hoc spinners elsewhere
- [ ] Majority of `title="..."` on interactive elements migrated to `Tooltip` component
- [ ] All raw `animate-pulse` loading placeholders use `Skeleton` component
- [ ] Single `EmptyState` in `components/ui/empty-state.tsx` — zero duplicates
- [ ] All inline "No data" / "No results" in platform pages use `EmptyState`
- [ ] Top 5 raw `<table>` files migrated to `DataTable`
- [ ] `lib/utils/formatters.ts` exists with `formatNumber`, `formatCurrency`, `formatPercent`, `formatPnl`, `formatDate`
- [ ] Top 20 files with `.toFixed()` / `.toLocaleString()` migrated to shared formatters
- [ ] `lib/utils/pnl.ts` exists with `pnlColorClass` utility
- [ ] PnL-related `text-emerald-*` / `text-red-*` in financial contexts migrated to `text-pnl-positive` / `text-pnl-negative`
- [ ] Unused `components/ui/` files deleted (with justification for any kept)
- [ ] `pnpm typecheck` passes
- [ ] App loads and renders correctly

---

## Self-Evaluation Checklist

When you finish, stop and honestly answer these before claiming done:

1. **Is the `PageHeader` component actually good?** Does it handle the real-world variations you saw across pages — title only, title + description, title + description + action buttons, title + badge? Or did you build something so simple it only works for 3 pages and the rest need workarounds? A shared component that doesn't fit most use cases is worse than no shared component.

2. **Did I migrate enough consumers to prove the pattern?** Creating `PageHeader` and using it in 2 pages proves nothing. If you migrated 10+ pages and they all look right, the pattern is validated. If you stopped at 3 because "the others are more complex", go back and handle the complex ones — that's where the real value is.

3. **Is the nav helper actually correct?** Did you test it with: (a) exact match tabs, (b) prefix match tabs, (c) family group tabs with `exact: true`, (d) custom panels? All four cases must work.

4. **Did I actually delete the duplicate code?** `rg "EmptyState" components/trading/sports/` should return zero. The inline active-tab logic in `service-tabs.tsx` should be gone, not commented out.

5. **Would I be proud to show this to a senior engineer?** Not "does it work" but "is it well-crafted". Are the component props intuitive? Is the API flexible enough for future use cases but not over-engineered?

6. **Did I create future debt?** `PageHeader` that doesn't support breadcrumbs. `EmptyState` that can't show a CTA button. Think about what the NEXT developer will need.

7. **Are the formatters actually correct for a trading platform?** `formatCurrency(1234.5)` should produce `$1,234.50`. `formatPnl(-340.2)` should produce `-$340.20`. Test edge cases: zero, negative, very large (1B+), very small (0.00001 for crypto).

8. **Is the PnL coloring migration correct?** Did you check context? Green badge meaning "active" is NOT PnL — that's status. Green number next to a dollar sign IS PnL. If you blindly replaced every `text-emerald` with `text-pnl-positive`, you've broken status indicators.

9. **Does every page look like it was designed by the same team?** Open 5 random platform pages side by side. Do metrics look identical in size/spacing? Do status badges use the same colors for the same states? Do spinners look the same?

10. **Am I proud of this work?** You're building the foundation every future agent will build on. Blackrock/Jane Street-grade consistency. Does your work meet that bar?

**If the answer to any of these is "no" — go fix it before marking done.**
