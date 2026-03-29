# Module D — Shared Component & Utility Adoption Audit

**Output:** `docs/UI-shared-components-Issues/04-SHARED-COMPONENT-REUSE-AUDIT.md`
**Maps to:** WORK_TRACKER §3 (Component Centralization), §4.x (Widget Merging prereqs)

---

## Vision

This is a trading platform built by agents. Every time an agent writes a new page, it should
reach for a shared component — not reinvent Card + number, not write its own spinner, not pick
an arbitrary green for "positive". The goal: a UI that looks like an expert team of senior
developers curated it. Blackrock-grade consistency. Jane Street-grade precision.

That means: one `MetricCard`, one `StatusBadge`, one `Spinner`, one way to format numbers,
one way to color PnL — and the audit must catch every single deviation.

---

## Pre-Read (required before running this audit)

| File                                 | Why                                                              |
| ------------------------------------ | ---------------------------------------------------------------- |
| `app/globals.css`                    | SSOT for tokens — colors, surfaces, shadows, typography, spacing |
| `components/shared/metric-card.tsx`  | Understand props: tone, variant, density, layout                 |
| `components/shared/status-badge.tsx` | Understand supported statuses and colors                         |
| `components/shared/spinner.tsx`      | Current Spinner API                                              |
| `components/ui/skeleton.tsx`         | Current Skeleton API                                             |
| `components/ui/tooltip.tsx`          | Radix Tooltip wrapper                                            |
| `components/shared/empty-state.tsx`  | Empty state component                                            |
| `components/shared/data-table.tsx`   | DataTable component                                              |
| `components/shared/filter-bar.tsx`   | FilterBar component                                              |
| `components/ui/progress.tsx`         | Progress bar component                                           |
| `components/ui/separator.tsx`        | Separator component                                              |
| `components/shared/kpi-strip.tsx`    | KpiStrip component                                               |
| `components/shared/index.ts`         | Barrel — cross-domain exports after Task 13                      |

---

## Part 1 — Component-Level Adoption Audit

For **each row** in the table below, run the specified search commands to count: (a) how many
files correctly use the shared component, (b) how many files bypass it with ad-hoc patterns.

Report both counts. List the top 5 bypass files (with line numbers) for each.

### 1A. MetricCard / KpiStrip

**Shared component:** `components/shared/metric-card.tsx`
**Shared layout:** `components/shared/kpi-strip.tsx` (widgets import via `@/components/shared` or direct path)

**Find adopters:**

```bash
rg -l "MetricCard" app/ components/ | wc -l
rg -l "KpiStrip" app/ components/ | wc -l
```

**Find bypasses — ad-hoc Card + number patterns:**

```bash
# Card containing large numbers (likely a metric)
rg -n "text-2xl.*font-mono|text-xl.*font-bold|text-3xl.*font-semibold" app/ components/ --glob '*.tsx'
# CardContent with label + value pairs
rg -n "CardContent" app/ components/ --glob '*.tsx' -l
# Then for each CardContent file, check if it also imports MetricCard. If not = bypass.
```

**What to flag:** Any `<Card>` + numeric value + label that isn't using `MetricCard`. Include
the file, line, and what `MetricCard` props would replace it (tone, variant, density).

### 1B. StatusBadge

**Shared component:** `components/shared/status-badge.tsx`

**Find adopters:**

```bash
rg -l "StatusBadge" app/ components/ | wc -l
```

**Find bypasses — ad-hoc status indicators:**

```bash
# Colored dots used as status
rg -n "rounded-full.*bg-green|rounded-full.*bg-red|rounded-full.*bg-amber|rounded-full.*bg-emerald" app/ components/ --glob '*.tsx'
# Badge with status text
rg -n "<Badge.*variant|<Badge.*className" app/ components/ --glob '*.tsx' | grep -i "live|active|paused|error|warning|critical|idle|running|stopped|completed|failed"
# Switch/conditional mapping status → color
rg -n "case.*live|case.*active|case.*paused|case.*error|case.*critical" app/ components/ --glob '*.tsx'
```

**What to flag:** Any switch/conditional that maps a status string to a color/style. That
logic should live in `StatusBadge`, not in every page.

### 1C. Spinner

**Shared component:** `components/shared/spinner.tsx` (import `from "@/components/shared/spinner"`)

**Find adopters:**

```bash
rg -l "from.*@/components/shared/spinner|from.*spinner" app/ components/ | wc -l
```

**Find bypasses — ad-hoc loading spinners:**

```bash
rg -n "Loader2" app/ components/ --glob '*.tsx'
rg -n "animate-spin" app/ components/ --glob '*.tsx'
```

**What to flag:** Every `<Loader2 className="...animate-spin..." />` that isn't inside
`spinner.tsx` itself. Count total files and total occurrences. Note any that use different
sizes (size-4, size-5, size-6, size-8) — these indicate `Spinner` needs size variants.

### 1D. Tooltip

**Shared component:** `components/ui/tooltip.tsx` (Radix-based, styled)

**Find adopters:**

```bash
rg -l "TooltipContent|TooltipTrigger" app/ components/ | wc -l
```

**Find bypasses — native title attribute:**

```bash
rg -n 'title="' app/ components/ --glob '*.tsx'
```

**Classification rules:**

- `title="..."` on `<button>`, `<a>`, `<div>`, `<span>`, `<td>` = **SHOULD use Tooltip** (interactive)
- `title="..."` on `<img>`, `<svg>`, `<abbr>` = **OK to keep** (accessibility)
- `title="..."` in SVG `<title>` element = **OK to keep**

Count both categories. List the top 10 interactive `title=` bypasses.

### 1E. Skeleton

**Shared component:** `components/ui/skeleton.tsx`

**Find adopters:**

```bash
rg -l "from.*@/components/ui/skeleton|<Skeleton" app/ components/ | wc -l
```

**Find bypasses — raw animate-pulse:**

```bash
rg -n "animate-pulse" app/ components/ --glob '*.tsx'
```

**What to flag:** Files that use `animate-pulse` but don't import `Skeleton`. Each raw
`animate-pulse` div should be a `<Skeleton>` element. Note varying heights/widths which
indicate the `Skeleton` component may need size presets.

### 1F. EmptyState

**Shared component:** `components/shared/empty-state.tsx`

**Find adopters:**

```bash
rg -l "EmptyState|empty-state" app/ components/ | wc -l
```

**Find bypasses — inline empty messages:**

```bash
rg -n '"No data"|"No results"|"Nothing to"|"No .* found"|"No .* available"|"Empty"' app/ components/ --glob '*.tsx'
```

**Also check for duplicates:**

```bash
rg -n "function EmptyState|const EmptyState" app/ components/ --glob '*.tsx'
```

### 1G. Progress

**Shared component:** `components/ui/progress.tsx`

**Find adopters:**

```bash
rg -l "from.*@/components/ui/progress" app/ components/ | wc -l
```

**Find bypasses — ad-hoc progress bars:**

```bash
# div with dynamic width (likely a progress bar)
rg -n 'style=.*width.*%|w-\[.*%\]' app/ components/ --glob '*.tsx'
```

### 1H. FilterBar / Search Input

**Shared component:** `components/shared/filter-bar.tsx`

**Find adopters:**

```bash
rg -l "FilterBar" app/ components/ | wc -l
```

**Find bypasses — ad-hoc search inputs:**

```bash
rg -n 'placeholder.*[Ss]earch|placeholder.*[Ff]ilter|placeholder.*[Ff]ind' app/ components/ --glob '*.tsx'
```

**What to flag:** Every ad-hoc `<Input placeholder="Search..." />` that isn't wrapped in
FilterBar. Not every search input needs FilterBar (some are scoped to a small widget), but
the audit should identify which ones do and which are fine standalone.

### 1I. Separator / Divider

**Shared component:** `components/ui/separator.tsx`

**Find adopters:**

```bash
rg -l "from.*@/components/ui/separator|<Separator" app/ components/ | wc -l
```

**Find bypasses — ad-hoc dividers:**

```bash
rg -n "border-b " app/ components/ --glob '*.tsx'
rg -n "<hr" app/ components/ --glob '*.tsx'
```

**Classification rules:**

- `border-b` used as a visual separator between sections = **SHOULD use Separator**
- `border-b` as part of a component's own styling (table rows, card bottom) = **OK to keep**

### 1J. DataTable

**Shared component:** `components/shared/data-table.tsx`

**Find adopters:**

```bash
rg -l "from.*@/components/shared/data-table|DataTable" app/ components/ | wc -l
```

**Find bypasses — raw tables:**

```bash
rg -l "<table|<Table " app/ components/ --glob '*.tsx' | wc -l
rg -l "<table|<Table " app/ components/ --glob '*.tsx'
```

**Classify each raw table:**

- (a) Standard data rows → should use DataTable
- (b) Custom grid (options chain, heatmap, comparison matrix) → OK as raw table
- (c) Small inline table (2-3 rows, no sorting needed) → OK as raw table

### 1K. ExportButton / ExportDropdown

**Shared components:** `components/ui/export-button.tsx` (if present), `components/shared/export-dropdown.tsx`

**Find adopters:**

```bash
rg -l "ExportButton|ExportDropdown" app/ components/ | wc -l
```

If zero, these are dead components. Flag for either wiring up or deletion.

### 1L. PageHeader

**Shared component:** `components/shared/page-header.tsx` (post–Task 13). Count remaining ad-hoc page headers:

```bash
rg -n "<h1" app/ --glob '*.tsx' | wc -l
rg -n "<h1" app/ --glob '*.tsx'
```

### 1M. ErrorBoundary

**Shared component:** `components/shared/error-boundary.tsx`

**Find adopters:**

```bash
rg -l "ErrorBoundary" app/ components/ | wc -l
```

Check if pages have per-route `error.tsx` files vs using the shared boundary.

---

## Part 2 — Value Formatting Audit

This is critical. A trading platform lives and dies by number formatting consistency.

### 2A. Number Formatting

**Check if a shared formatter exists:**

```bash
rg "function formatNumber|function formatCurrency|function formatPercent|function formatPnl|function formatDate|function formatValue" lib/ app/ components/
```

**Count ad-hoc formatting:**

```bash
rg -c "\.toFixed(" app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -15
rg -c "\.toLocaleString(" app/ components/ --glob '*.tsx' | sort -t: -k2 -rn | head -15
rg -l "Intl\.NumberFormat" app/ components/ --glob '*.tsx'
```

**What to flag:** Every `.toFixed()` and `.toLocaleString()` call. These should go through
a centralized `formatNumber()` / `formatCurrency()` / `formatPercent()` utility so that:

- Decimal places are consistent (e.g., prices always 2 decimals, percentages always 2)
- Thousand separators are consistent
- Currency symbols are consistent
- Negative number display is consistent (parentheses vs minus sign)

### 2B. PnL Coloring

**Check token adoption:**

```bash
rg -l "pnl-positive|pnl-negative" app/ components/ | wc -l
```

**Check bypasses — hardcoded PnL colors:**

```bash
rg -n "text-green\b|text-green-" app/ components/ --glob '*.tsx' | wc -l
rg -n "text-red\b|text-red-" app/ components/ --glob '*.tsx' | wc -l
rg -n "text-emerald\b|text-emerald-" app/ components/ --glob '*.tsx' | wc -l
```

**What to flag:** Any `text-green-*`, `text-red-*`, `text-emerald-*` used for
positive/negative coloring should use `text-pnl-positive` / `text-pnl-negative` tokens.
Not every green/red is PnL (some are status-related), so check context.

**Check for a shared PnL helper:**

```bash
rg "function.*pnl|function.*PnL|pnlColor|pnlClass" lib/ app/ components/
```

If none exists, flag the need for `lib/utils/pnl.ts` with:

- `formatPnl(value: number): string` — formats with +/- sign, consistent decimals
- `pnlColorClass(value: number): string` — returns `text-pnl-positive` or `text-pnl-negative`

### 2C. Date/Time Formatting

```bash
rg -l "toLocaleDateString|toLocaleTimeString|new Date.*toLocale|formatDate" app/ components/ --glob '*.tsx' | wc -l
rg -n "toLocaleDateString|toLocaleTimeString" app/ components/ --glob '*.tsx' | head -20
```

**What to flag:** Ad-hoc date formatting. A trading platform needs consistent date/time
display — ISO format, relative time ("3m ago"), compact ("Mar 28"), full ("2026-03-28 14:30:05").

---

## Part 3 — Styling Consistency Audit

Beyond "does it use the right component", check if the styling is consistent across pages.

### 3A. Card Density / Spacing

For pages that use `<Card>`, check if padding is consistent:

```bash
rg -n "CardContent.*className|<CardContent" app/ components/ --glob '*.tsx' | head -20
```

Flag cards that use different padding than the standard `p-card` token.

### 3B. Icon Sizing

```bash
rg -n 'size-[0-9]|w-[0-9].*h-[0-9]|className.*size-' app/ components/ --glob '*.tsx' | head -30
```

Check if icons are consistently sized across similar contexts (nav icons, button icons,
table icons, status icons).

### 3C. Button Variants

```bash
rg -n "<Button" app/ components/ --glob '*.tsx' | head -30
```

Check if button usage follows a consistent pattern:

- Primary action = `default` variant
- Secondary action = `outline` variant
- Destructive action = `destructive` variant
- Ghost action = `ghost` variant

Flag pages that use unexpected combinations.

---

## Part 4 — Component Duplication Check

### 4A. Duplicate Definitions

Search for components defined in multiple places:

```bash
rg "function EmptyState|const EmptyState" components/ --glob '*.tsx'
rg "function LoadingState|const LoadingState|function LoadingSkeleton" components/ --glob '*.tsx'
rg "function StatusBadge|const StatusBadge" components/ --glob '*.tsx'
rg "function MetricCard|const MetricCard" components/ --glob '*.tsx'
rg "function FilterBar|const FilterBar" components/ --glob '*.tsx'
```

### 4B. Unused ui/ Components

For each file in `components/ui/`, check if it's imported anywhere:

```bash
for f in components/ui/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(rg -l "from.*@/components/ui/$name" app/ components/ hooks/ lib/ 2>/dev/null | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "UNUSED: $f"
  fi
done
```

### 4C. Components That Should Be Shared

Check `components/trading/` for components that are domain-generic:

```bash
ls components/trading/
```

Flag any that don't have "trading" in their semantics and could serve all lifecycle stages
(e.g., a generic list/detail panel, a generic chart wrapper).

---

## Part 5 — Active Tab Logic Duplication

```bash
rg -n "isActive|isFamilyActive|matchPrefix|tab\.exact|tab\.href" components/shell/service-tabs.tsx components/shell/trading-vertical-nav.tsx
```

Are the active-tab computations identical? If so, flag for extraction to `lib/utils/nav-helpers.ts`.

---

## Output Format

### Summary Table

| Component  | Shared File                       | Adopters | Bypasses | Status | Priority |
| ---------- | --------------------------------- | -------- | -------- | ------ | -------- |
| MetricCard | components/shared/metric-card.tsx | N        | M        | EXISTS | 🔴       |
| ...        | ...                               | ...      | ...      | ...    | ...      |

### Per-Component Detail

For each component with bypasses > 0:

```markdown
### [Component Name]

**Adopters:** N files
**Bypasses:** M files

| File                                          | Line | What It Does Instead                                           | Should Use                                    |
| --------------------------------------------- | ---- | -------------------------------------------------------------- | --------------------------------------------- |
| app/(platform)/services/research/.../page.tsx | 142  | `<Card><CardContent><p className="text-2xl">$4,230</p></Card>` | `<MetricCard label="..." primary="$4,230" />` |

**Top 5 Worst Offenders:**

1. [file] — [N bypasses, description]
2. ...
```

### Formatting Gap Summary

```markdown
### Value Formatting

**Shared formatter exists:** YES/NO
**toFixed() usage:** N files, M total calls
**toLocaleString() usage:** N files, M total calls
**Recommendation:** Create lib/utils/formatters.ts with formatNumber, formatCurrency, formatPercent, formatPnl, formatDate
```
