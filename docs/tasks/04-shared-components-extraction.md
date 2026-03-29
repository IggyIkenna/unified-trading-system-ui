# Task 04 — Shared Component Extraction & Universal Adoption

**Source:** Audit `04-SHARED-COMPONENT-REUSE-AUDIT.md`
**WORK_TRACKER:** §3 (Component Centralization), §4.x (Widget Merging prereqs)
**Priority:** P1 — every page refactored after this benefits from shared components

---

## Agent Execution Model


| Phase                   | What                                                                                                                                                                                                                                                                       | Model                                          | Output                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Phase 1 — Discovery** | Run audit module D (`docs/UI-shared-components-Issues/audit-scripts/D-shared-components.md`). For each component pattern, count adopters and bypasses. Read each shared component to understand its current API. Identify what needs to be created vs extended vs adopted. | **Smart** (claude-4-opus or claude-3.7-sonnet) | Concrete bypass list: per-component file + line + what it does wrong + what it should use |
| **Phase 2 — Execution** | Take the Phase 1 bypass list and mechanically: create missing components/utilities, migrate each bypass, delete old code, run typecheck.                                                                                                                                   | **Medium** (claude-3.7-sonnet)                 | Code changes + passing typecheck                                                          |


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
2. **Enforce universal adoption of existing shared components** (MetricCard, StatusBadge, Spinner, Tooltip, Skeleton, EmptyState, DataTable, **AlertRow**) — find every ad-hoc reimplementation and replace it with the shared version.
3. **Enforce consistent value formatting and coloring** — every number, currency, percentage, and PnL value goes through shared formatters and uses design system color tokens.

After this task: if you want to render a metric, you use `MetricCard`. If you want a status indicator, you use `StatusBadge`. If you want a loading spinner, you use `Spinner`. If you want to format a dollar amount, you use `formatCurrency()`. If you want to color a PnL value, you use `text-pnl-positive` / `text-pnl-negative`. **No exceptions. No "it's just a quick toFixed(2)". No "I'll just use text-emerald-500 for green".**

This is critical because agents write most of the frontend code. Without strict shared components and utilities, they drift — every agent invents a slightly different Card + number layout, slightly different spinner, slightly different number format, slightly different shade of green for "positive". Centralizing means one place to change, one place to audit, zero drift. The result should look like an expert team of senior developers curated every pixel — not like 50 independent agents each made their own choices.

---

## The Shared Component Mandate

Every component below is the ONLY way to render its pattern. Ad-hoc alternatives must be migrated.


| Pattern | Shared Component | Location | Pre-Agent | Pass 1 (2026-03-29 AM) | Pass 2 (2026-03-29 PM verified) | Status |
|---------|-----------------|----------|-----------|------------------------|--------------------------------|--------|
| Page title | `PageHeader` | `components/platform/page-header.tsx` | 0, ~89 `<h1>` | 12 adopters, 90 `<h1>` | **79 adopters, 22 `<h1>`** (all `(public)` + 1 ops layout) | **DONE** |
| Metric/KPI | `MetricCard` | `components/shared/metric-card.tsx` | ~10, ~30 bypasses | 14 adopters, 151 bypasses | **17 adopters, 71 bypass regex hits** | **PARTIAL** |
| Metric row | `KpiStrip` | `components/widgets/shared/kpi-strip.tsx` | 13 | 43 | **43** | **GOOD** |
| Status | `StatusBadge` | `components/trading/status-badge.tsx` | 26, ~23 bypasses | 32, 42 bypasses | **47 adopters, 20 dots + 18 switches** | **PARTIAL** |
| Spinner | `Spinner` | `components/ui/spinner.tsx` | 1, 51 bypasses | 55, 0 Loader2 | **59 adopters, 13 animate-spin** (icon motion) | **DONE** |
| Tooltip | `Tooltip` | `components/ui/tooltip.tsx` | 15, 69 `title=` | 24, 86 `title=` | **24 adopters, 115 `title=`** | **PARTIAL** — count grew |
| FilterBar | `FilterBar` | `components/platform/filter-bar.tsx` | 30, 42 bypasses | — | — | not audited |
| Skeleton | `Skeleton` | `components/ui/skeleton.tsx` | 32, 34 bypasses | 34, 34 bypasses | **31 adopters, 32 animate-pulse** | **NOT DONE** |
| EmptyState | `EmptyState` | `components/ui/empty-state.tsx` | 4, duplicates | 8, 3 inline | **8, 3 inline** | **MOSTLY DONE** |
| DataTable | `DataTable` | `components/ui/data-table.tsx` | 9, 43 raw | 55, 60 raw | **55, 60 raw** | **PARTIAL** |
| Progress | `Progress` | `components/ui/progress.tsx` | 34 | — | — | not audited |
| ExportButton | `ExportButton` | `components/ui/export-button.tsx` | 0 | — | — | not audited |
| Separator | `Separator` | `components/ui/separator.tsx` | 20, 110 `border-b` | — | — | not audited |
| Formatters | `formatNumber` etc. | `lib/utils/formatters.ts` | 0, 190 `.toFixed()` | 8, 190 `.toFixed()` | **194 adopters, 1 `.toFixed()`** | **DONE** |
| `.toLocaleString` | (same module) | `lib/utils/formatters.ts` | 0, 102 files | 8 | **194 import, 100 `.toLocaleString()` remain** | **PARTIAL** |
| PnL coloring | `pnlColorClass` | `lib/utils/pnl.ts` | 39 tokens only | 2 adopters | **2 adopters, 196 `text-emerald`, 99 `text-red`** | **NOT DONE** |
| Nav helpers | `isServiceTabActive` | `lib/utils/nav-helpers.ts` | 0, 3 dupes | 2 consumers | **2 consumers** | **DONE** |
| AlertRow | `AlertRow` | `components/platform/alert-row.tsx` | 3 | — | — | not audited |
| animate-spin | (Spinner) | — | ~51 external | 18 | **13 files** | **DONE** (exceptions are icon motion) |
| Unused ui/ | — | `components/ui/*.tsx` | ~28 unused | 26 unused | **0 unused** (38 total, all imported) | **DONE** |


`**AlertRow` pointer (2026-03-29):** Single component for stacked list rows: severity dot (via `StatusDot`; `info` added to `components/trading/status-badge.tsx`), optional unread marker, title / description / detail, absolute or relative `timestamp`, footer vs trailing icon actions, optional `end` column (e.g. actor + time). `**variant="inline"`** for bordered-bottom lists; `**variant="card"**` for bordered tiles (e.g. research alerts with Lucide `leading`). **Current adopters:** `app/(platform)/services/data/overview/page.tsx` (Alerts), `app/(platform)/services/data/gaps/page.tsx` (Recent Alerts), `app/(platform)/services/research/overview/page.tsx` (Alerts + Recent Activity). Prefer `AlertRow` for new UI; migrate other duplicate alert/activity rows when touching those files.

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

**Problem:** 39 files correctly use `text-pnl-positive` / `text-pnl-negative`. But **94 files** use `text-red-`* and **179 files** use `text-emerald-`* for positive/negative values.

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

## Acceptance Criteria (verified 2026-03-29 PM — independent audit, not agent self-report)

### DONE — verified

- [x] `lib/utils/nav-helpers.ts` — **Part 1 DONE** (2 consumers)
- [x] `Spinner` — **Part 5 DONE** (59 adopters, size variants, Loader2 only in spinner.tsx)
- [x] `EmptyState` — **Part 8 DONE** (8 adopters, 1 definition, 3 minor inline remnants)
- [x] `lib/utils/formatters.ts` — **Part 10 DONE** (194 importers, `.toFixed()` down to 1 non-display file)
- [x] `PageHeader` — **Part 2 DONE** (79 adopters, 22 remaining `<h1>` are all `(public)` pages — correct, public uses marketing typography)
- [x] `KpiStrip` — **GOOD** (43 adopters, 3x growth)
- [x] Unused `components/ui/` cleanup — **DONE** (loop reports 0 unused, 38 total files)
- [x] `animate-spin` cleanup — **DONE** (13 files remain, all icon-motion/refresh semantics, not loading)

### PARTIAL — meaningful progress, more work needed

- [ ] `MetricCard` — 17 adopters (up from 10→14→17), **71 bypass regex hits remain** (agent says many false positives — needs triage)
- [ ] `StatusBadge` — 47 adopters (up from 26→32→47), **20 colored dots + 18 status switches remain**
- [ ] `DataTable` — 55 adopters (up from 9), **60 raw `<Table` remain** (some are intentional custom layouts)
- [ ] `.toLocaleString()` — **100 files remain** (agent migrated `.toFixed()` but not `.toLocaleString()`)
- [ ] `Skeleton` — **31 adopters, 32 `animate-pulse` remain** (essentially no change across both passes)
- [ ] `Tooltip` — **24 adopters, 115 raw `title=`** (count actually grew from 86 — agent may have added `title=` elsewhere)

### NOT DONE

- [ ] PnL coloring — utility exists but **only 2 direct `pnlColorClass` adopters**, 196 `text-emerald` + 99 `text-red` unchanged. Agent notes PnLValue/PnLChange components use the CSS tokens, but direct call-site migration didn't happen.
- [ ] FilterBar audit — not touched either pass
- [ ] AlertRow audit — not touched either pass

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

---

## Follow-Up Work Required (updated after Pass 2 verification, 2026-03-29 PM)

Two passes ran. Pass 1 created all utilities/components. Pass 2 did massive formatter adoption
(0 → 194 files) and PageHeader migration (12 → 79 adopters). The remaining work is targeted
triage + migration in specific areas. The "blind regex pass" phase is over — what's left
requires context-aware decisions.

### Priority 1 — `.toLocaleString()` migration (100 files remain)

Pass 2 cleared `.toFixed()` (190 → 1) but `.toLocaleString()` was mostly untouched.
Many of these 100 files already import `formatters.ts` — they just use both patterns.

**Discovery:**

```bash
rg -c "\.toLocaleString\(" app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -30
```

**Execution — for each file:**

1. If the file already imports from `@/lib/utils/formatters`, replace `.toLocaleString()` calls with the matching formatter
2. If `.toLocaleString()` is inside a `new Intl.NumberFormat(...)` or the formatters module itself — **skip** (that's the implementation, not a bypass)
3. If it's `date.toLocaleString()` — replace with `formatDate(date, "long")`
4. If it's `number.toLocaleString()` with no args — replace with `formatNumber(value, 0)`

**Model:** Medium — mostly mechanical, light context for date vs number.
**Estimated scope:** ~100 files. Top 30 by count covers ~50% of occurrences.

---

### Priority 2 — PnL coloring migration (196 `text-emerald` + 99 `text-red`)

**The biggest remaining gap.** Utility exists, CSS tokens exist, but almost nobody uses them.
This requires careful context analysis — NOT blind find-and-replace.

**Discovery:**

```bash
rg -n "text-emerald" app/ components/ --glob '*.tsx' | head -40
rg -n "text-red" app/ components/ --glob '*.tsx' | head -40
rg -n "value.*>=.*0.*text-emerald|value.*>.*0.*text-emerald|>=.*0.*emerald|>.*0.*emerald" app/ components/ --glob '*.tsx'
```

**Classification — read each occurrence and categorize:**

| Context | Action |
|---------|--------|
| Number next to `$`, `%`, PnL, return, gain/loss | Replace with `pnlColorClass(value)` or `text-pnl-positive`/`text-pnl-negative` |
| Status indicator ("active", "live", "healthy") | **Leave as-is** — this is status coloring, not PnL |
| Chart line color, background accent | **Leave as-is** — not text coloring |
| Badge background (`bg-emerald-*`) | **Leave as-is** — `pnlColorClass` is text-only |

**Execution pattern:**

```tsx
// BEFORE
<span className={value >= 0 ? "text-emerald-500" : "text-red-500"}>
  {value.toFixed(2)}%
</span>

// AFTER
import { pnlColorClass } from "@/lib/utils/pnl";
import { formatPercent } from "@/lib/utils/formatters";

<span className={pnlColorClass(value)}>
  {formatPercent(value)}
</span>
```

**Note:** The agent created `PnLValue` / `PnLChange` components that use `.pnl-positive` / `.pnl-negative`
CSS tokens. These have a different zero-handling rule (zero is positive) vs `pnlColorClass` (zero is muted).
Check which behavior is correct for each context before migrating.

**Model:** Smart for discovery + classification, then Medium for execution.
**Estimated scope:** ~80-100 files are PnL-related out of 295. The rest are status/decorative.

---

### Priority 3 — Skeleton adoption (32 `animate-pulse` bypasses — untouched across 2 passes)

**Discovery:**

```bash
rg -n "animate-pulse" app/ components/ --glob '*.tsx' | grep -v "skeleton"
```

**Execution — for each file:**

1. Find every `<div className="...animate-pulse...">` pattern
2. Replace with `<Skeleton className="..." />` from `@/components/ui/skeleton`
3. If the file has a custom loading block with multiple animate-pulse divs, replace the whole block with a `Skeleton` composition
4. Some `animate-pulse` is used for live-status pulsing (e.g., a dot that pulses to show "live") — **leave those as-is**, they're not loading skeletons

**Model:** Cheap — mostly mechanical, quick context check for live-status pulses.
**Estimated scope:** 32 files.

---

### Priority 4 — MetricCard enforcement (71 bypass regex hits)

**Discovery:**

```bash
rg -n "text-2xl.*font-mono|text-xl.*font-bold|text-3xl.*font-semibold" app/ components/ --glob '*.tsx'
```

**Triage — not every big number is a MetricCard:**

- Standalone KPI with label + value in a Card → **MetricCard**
- Number inside a table cell → **leave as-is** (table formatting)
- Section heading that happens to be bold → **leave as-is**
- Dashboard stat with Card wrapper + large font-mono number → **MetricCard**

Agent claims "many are false positives" — this needs an honest triage pass to separate real
bypasses (~30-40 estimated) from headings and table cells.

**Model:** Smart for triage, Medium for execution.
**Estimated scope:** ~30-40 genuine MetricCard bypasses out of 71 regex hits.

---

### Priority 5 — StatusBadge enforcement (20 dots + 18 switches)

**Discovery:**

```bash
rg -n "rounded-full.*bg-green|rounded-full.*bg-red|rounded-full.*bg-amber|rounded-full.*bg-emerald" app/ components/ --glob '*.tsx'
rg -n 'case "live"|case "active"|case "paused"|case "error"|case "critical"' app/ components/ --glob '*.tsx'
```

**Execution:** Replace ad-hoc colored dots and status-to-color switch statements with
`<StatusBadge status={status} />`. Extend `StatusBadge` if it's missing a needed status variant.

**Triage:**

- Investor Relations board presentation slides → **skip** (custom presentation styling)
- `(public)` marketing pages → **skip**
- Everything in `(platform)` and `(ops)` → **migrate**

**Model:** Medium.
**Estimated scope:** ~25 genuine bypasses after excluding presentation/marketing.

---

### Priority 6 — Tooltip triage (115 raw `title=` — count grew, needs audit)

The `title=` count went from 86 to 115 between passes — the agent may have introduced new
`title=` attributes while modifying files. This needs a focused triage.

**Discovery:**

```bash
rg -c 'title="' app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -20
```

**Triage — not all `title=` need migration:**

- `title=` on interactive elements (buttons, links, icons) → **migrate to `Tooltip`**
- `title=` on `<svg>` / `<img>` for accessibility → **leave as-is**
- `title=` on `<iframe>` → **leave as-is**
- `title=` inside Recharts / chart config → **leave as-is**

**Model:** Medium — needs context to classify, mechanical to execute.
**Estimated scope:** ~40-50 genuine tooltip candidates out of 115.

---

### Priority 7 — animate-spin residuals (13 files — mostly intentional)

Most remaining `animate-spin` is on `RefreshCw` icons or live-status indicators, not loading
spinners. Audit each file and document exceptions rather than blindly replacing.

**Discovery:**

```bash
rg -ln "animate-spin" app/ components/ --glob '*.tsx' | grep -v "spinner.tsx"
```

**Known files (13):**
`data-etl/page`, `ops/page`, `config-page-client`, `backtest-page`, `quant-utils`,
`health/page`, `event-stream-viewer`, `devops-status-icon`, `intervention-controls`,
`CloudBuildsTab`, `reports/overview/page`, `ml/training/page`, `training-run-detail`

**Model:** Cheap — audit + document exceptions. Replace only genuine loading spinners.

---

### COMPLETED in Pass 2 (no further work needed)

- ~~Priority 1 (old) — Formatters `.toFixed()` migration~~ — **DONE** (194 adopters, 1 file left is non-display math)
- ~~Priority 4 (old) — PageHeader migration~~ — **DONE** (79 adopters, 22 remaining are all `(public)` pages — correct)
- ~~Priority 9 (old) — Unused ui/ deletion~~ — **DONE** (0 unused files, loop clean)

---

### Parallelization Strategy (updated for remaining work)

| Session | Priorities | Est. Time | Model |
|---------|-----------|-----------|-------|
| **A — .toLocaleString + PnL** | P1 + P2 | 30-45 min | Smart (PnL classification) → Medium (execution) |
| **B — Skeleton** | P3 | 15-20 min | Cheap |
| **C — MetricCard + StatusBadge** | P4 + P5 | 25-35 min | Smart (triage) → Medium (execution) |
| **D — Tooltip audit + animate-spin** | P6 + P7 | 15-20 min | Medium |

All 4 sessions touch different file sets and can safely run in parallel.

### Done Definition

This task is complete when:

- `.toLocaleString()` in display TSX ≤ 10 files (excluding Intl internals)
- PnL `text-emerald`/`text-red` in financial contexts → 0 (non-PnL status uses documented as exceptions)
- `animate-pulse` outside `skeleton.tsx` → 0 (live-status pulses documented as exceptions)
- MetricCard bypass regex → ≤ 10 (documented as headings/table cells, not KPIs)
- StatusBadge colored dots → ≤ 5 (documented exceptions for presentation slides)
- `title=` on interactive elements → 0 (all use `Tooltip`; accessibility `title=` on svg/img preserved)
- `pnpm typecheck` passes
- `pnpm build` succeeds
- 5 random platform pages opened side-by-side look consistent in metrics, status badges, spinners, number formatting, and PnL coloring
