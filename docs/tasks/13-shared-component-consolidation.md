# Task 13 — Shared Component & Utility Consolidation

**Source:** Independent audit of component locations (2026-03-29)
**WORK_TRACKER:** New section — §13
**Priority:** P0 — every agent that writes UI code needs to know where shared components live.
Without this, agents scatter new components across 6 locations and create duplicates.

> **Layout note:** Sections **Problem**, **Target Architecture** (file trees), and **Execution Plan** describe the **migration narrative** (before → after). **Implemented 2026-03-29.** On disk today: shared custom UI is under `components/shared/`, shadcn primitives under `components/ui/`, and `components/widgets/shared/` no longer exists. If a line still shows `Move X → X`, read it as “completed; file now lives under `components/shared/`.”

---

## Agent Execution Model

| Phase | What | Model | Output |
|-------|------|-------|--------|
| **Phase 1 — Discovery** | Run the audit commands below. Verify every move target. Build the exact move list with import counts. | **Smart** (claude-4-opus or claude-3.7-sonnet) | Concrete move list: source → destination, files to update, duplicates to delete |
| **Phase 2 — Execution** | Take the Phase 1 list and mechanically: move files, update every import, delete duplicates/dead code, run typecheck. | **Medium** (claude-3.7-sonnet) | Code changes + passing `pnpm typecheck` + `pnpm build` |

**Phase 2 is large (300+ import updates).** Split into independent batches by component. Each
batch moves one component, updates its imports, runs typecheck. Batches can run in parallel if
each agent gets a non-overlapping file list.

---

## Problem

Shared components and utilities are scattered across 6 locations with no clear rule for which
goes where. This causes:

1. **Agents can't find shared components** → they build their own → drift
2. **Duplicate implementations** → 3 StatusBadge definitions, 2 MetricCard definitions, 2 CatStatusBadge definitions
3. **Dead code accumulates** → nobody notices because it's in a random folder
4. **Cross-cutting components in domain folders** → StatusBadge (used by 47 files across all domains) lives in `components/trading/`

### Current state (6 locations)

```
components/ui/           ← (pre-task) mix of shadcn + custom; now shadcn-only
components/shared/       ← (pre-task) MetricCard + finder + gates; now all cross-domain custom UI
components/platform/     ← (pre-task) PageHeader + FilterBar + AlertRow + infra; those three since moved to shared/
components/widgets/shared/ ← (pre-task) KpiStrip + DataTableWidget + FilterBarWidget — directory removed
components/trading/      ← (pre-task) StatusBadge + StatusDot — since moved to shared/
lib/utils.ts             ← (pre-task) cn() + formatDateTime — now cn() only
lib/utils/               ← formatters.ts, pnl.ts, nav-helpers.ts, export.ts, etc.
```

### Duplicate definitions (same component, multiple files)

| Component | Canonical | Duplicates | Consumers of duplicates |
|-----------|-----------|------------|------------------------|
| `StatusBadge` | `components/shared/status-badge.tsx` (canonical; was `components/trading/status-badge.tsx`) | `strategies/status-helpers.tsx` (removed), `execution/status-helpers.tsx` (deduped) | `execution-detail-view.tsx`, `execution-list-panel.tsx` |
| `MetricCard` | `components/shared/metric-card.tsx` (14 importers) | `components/research/execution/status-helpers.tsx` (2 importers) | same 2 files as above |
| `CatStatusBadge` | `components/research/features/cat-status-badge.tsx` (1 importer) | `components/research/features/feature-helpers.tsx` (7 importers, but for other exports too) | `features/page.tsx` imports from `cat-status-badge.tsx` |
| `DeploymentStatusBadge` | `components/ops/deployment/details/deployment-status-badge.tsx` | Not a duplicate — domain-specific, acceptable | `deployment-details-header.tsx` only |
| `formatDateTime` | `lib/utils.ts` (visible to 407 files) | `lib/utils/formatters.ts` has `formatDate()` doing the same thing better | Unknown how many use `formatDateTime` vs `formatDate` |

### Dead code (0 importers)

| File | Lines | Refs |
|------|-------|------|
| `components/shared/data-card.tsx` | 113 | 0 |
| `components/platform/batch-live-comparison-frame.tsx` | 296 | 0 |
| `components/platform/service-hub.tsx` | 260 | 0 |
| `components/research/strategies/status-helpers.tsx` StatusBadge export | — | 0 importers for StatusBadge |

### Custom components misplaced in `components/ui/`

`components/ui/` should be shadcn primitives only. These are custom shared components that
happen to be in `ui/`:

| File (was under `ui/`, now `shared/`) | Importers (at audit) | What it is |
|------|-----------|-----------|
| `spinner.tsx` | 59 | Custom loading spinner with size variants |
| `empty-state.tsx` | 7 | Custom empty/no-data state |
| `empty.tsx` | 0 at merge — **deleted** | Compound empty layout (unused) |
| `error-boundary.tsx` | 8 | Custom React error boundary |
| `data-table.tsx` | 17 | Custom data table with sorting/filtering |
| `data-freshness.tsx` | 3 | Custom data freshness indicator |
| `api-error.tsx` | 9 | Custom API error display |
| `export-dropdown.tsx` | 11 | Custom export/download button |

---

## Target Architecture

After this task, the codebase has **3 locations** for shared code with clear, unambiguous rules:

### 1. `components/ui/` — Shadcn primitives ONLY

```
components/ui/
├── accordion.tsx        ← shadcn
├── alert.tsx            ← shadcn
├── alert-dialog.tsx     ← shadcn
├── badge.tsx            ← shadcn
├── button.tsx           ← shadcn (316 importers)
├── calendar.tsx         ← shadcn
├── card.tsx             ← shadcn (240 importers)
├── checkbox.tsx         ← shadcn
├── collapsible.tsx      ← shadcn
├── command.tsx          ← shadcn
├── dialog.tsx           ← shadcn
├── dropdown-menu.tsx    ← shadcn
├── input.tsx            ← shadcn
├── label.tsx            ← shadcn
├── popover.tsx          ← shadcn
├── progress.tsx         ← shadcn
├── resizable.tsx        ← shadcn
├── scroll-area.tsx      ← shadcn
├── select.tsx           ← shadcn (120 importers)
├── separator.tsx        ← shadcn
├── sheet.tsx            ← shadcn
├── skeleton.tsx         ← shadcn (base primitive — shared wrapper goes in components/shared/)
├── slider.tsx           ← shadcn
├── sonner.tsx           ← shadcn
├── switch.tsx           ← shadcn
├── table.tsx            ← shadcn (55 importers — the raw <Table> building blocks)
├── tabs.tsx             ← shadcn
├── textarea.tsx         ← shadcn
├── toast.tsx            ← shadcn
└── tooltip.tsx          ← shadcn
```

**Rule:** If it came from `npx shadcn-ui@latest add <name>`, it stays here. Everything else moves out.

### 2. `components/shared/` — ALL custom shared React components

```
components/shared/
├── metric-card.tsx          ← was already here
├── kpi-strip.tsx            ← was components/widgets/shared/
├── status-badge.tsx         ← was components/trading/
├── page-header.tsx          ← was components/platform/
├── alert-row.tsx            ← was components/platform/
├── filter-bar.tsx           ← was components/platform/
├── spinner.tsx              ← was components/ui/
├── empty-state.tsx          ← was components/ui/
├── error-boundary.tsx       ← was components/ui/
├── data-table.tsx           ← was components/ui/
├── data-table-widget.tsx    ← was components/widgets/shared/
├── data-freshness.tsx       ← was components/ui/
├── api-error.tsx            ← was components/ui/
├── export-dropdown.tsx      ← was components/ui/
├── widget-scroll.tsx        ← unchanged
├── gate-check-row.tsx       ← unchanged
├── gate-status.tsx          ← unchanged
├── collapsible-section.tsx  ← was components/widgets/shared/
├── filter-bar-widget.tsx    ← was components/widgets/shared/
└── finder/                  ← unchanged
    ├── finder-browser.tsx
    ├── finder-breadcrumb.tsx
    ├── finder-column.tsx
    ├── finder-column-resize-handle.tsx
    ├── finder-context-strip.tsx
    ├── finder-detail-panel.tsx
    └── col-row.tsx
```

**Rule:** Any reusable React component that is NOT a shadcn primitive lives here.
When an agent needs a shared component, it looks in `components/shared/`. Period.
Import path: `@/components/shared/<name>`.

### 3. `lib/utils/` — Pure functions and utilities (no React)

```
lib/utils.ts              ← cn() ONLY (remove formatDateTime)
lib/utils/
├── formatters.ts         ← formatNumber, formatCurrency, formatPercent, formatPnl, formatDate, formatCompact (callers use `formatDate(..., "long")` where `formatDateTime` was)
├── pnl.ts                ← pnlColorClass, pnlClassName
├── nav-helpers.ts        ← isServiceTabActive, isPathActive
├── export.ts             ← export/download utilities
├── bundles.ts            ← bundle utilities
├── indicators.ts         ← indicator utilities
└── instructions.ts       ← instruction utilities
```

**Rule:** Pure functions only. No React, no JSX. Import as `@/lib/utils/formatters` etc.

### What stays in domain folders

Domain-specific components that are NOT shared across domains stay in their domain folder:

- `components/trading/` — trading-specific panels, charts, order forms
- `components/research/` — research-specific views, strategy wizards
- `components/ops/` — ops-specific deployment UI, config panels
- `components/dashboards/` — dashboard layouts
- `components/promote/` — promotion lifecycle
- `components/shell/` — app shell, nav, sidebar
- `components/marketing/` — public page components
- etc.

**The test:** "Is this component used by 2+ domain areas?" If yes → `components/shared/`. If no → `components/{domain}/`.

**Special cases that stay in domain folders (not shared):**
- `DeploymentStatusBadge` → stays in `components/ops/deployment/` (only used by deployment UI)
- `CatStatusBadge` → stays in `components/research/features/` (only used by features pages)
- `StrategyFilterBar` → stays in `components/trading/` (trading-specific filter)

---

## Discovery Commands (Phase 1 — run BEFORE starting)

```bash
# Full inventory of components/ui/ — which are shadcn vs custom
for f in components/ui/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(rg -l "from.*@/components/ui/$name" app/ components/ hooks/ lib/ 2>/dev/null | wc -l)
  lines=$(wc -l < "$f")
  echo "$count importers | ${lines}L | $f"
done | sort -t'|' -k1 -rn

# Components to move OUT of ui/ (custom, not shadcn)
for name in spinner empty-state empty error-boundary data-table data-freshness api-error export-dropdown; do
  f="components/ui/$name.tsx"
  [ -f "$f" ] && count=$(rg -l "from.*@/components/ui/$name" app/ components/ hooks/ lib/ 2>/dev/null | wc -l) && echo "$count importers | $f → components/shared/$name.tsx"
done

# StatusBadge — all definitions and all import paths
rg -n "export.*function.*StatusBadge|export.*function.*StatusDot" components/ --glob '*.tsx'
rg -n "from.*status-badge" app/ components/ --glob '*.tsx'

# MetricCard — duplicate definitions
rg -n "export.*function.*MetricCard" components/ --glob '*.tsx'

# KpiStrip — current location and importers
rg -l "KpiStrip" app/ components/ | wc -l
rg -n "from.*kpi-strip|from.*widgets/shared" app/ components/ --glob '*.tsx'

# formatDateTime — who uses it and from where
rg -n "formatDateTime" app/ components/ lib/ --glob '*.tsx' --glob '*.ts'

# Dead code check
for f in components/shared/data-card.tsx components/platform/batch-live-comparison-frame.tsx components/platform/service-hub.tsx; do
  [ -f "$f" ] && name=$(basename "$f" .tsx) && count=$(rg -l "$name" app/ components/ --glob '*.tsx' 2>/dev/null | wc -l) && echo "$count refs | $f"
done

# widgets/shared barrel — who imports from it
rg -l "from.*@/components/widgets/shared" app/ components/ --glob '*.tsx' | wc -l
```

---

## Execution Plan — Part by Part

**Implementation status (2026-03-29):** Parts 1–9 completed (see Acceptance Criteria and Self-Evaluation Checklist).

### Part 1 — Delete dead code

**Files to delete (0 importers, verified):**

| File | Lines | Refs | Action |
|------|-------|------|--------|
| `components/shared/data-card.tsx` | 113 | 0 | Delete |
| `components/platform/batch-live-comparison-frame.tsx` | 296 | 0 | Delete |
| `components/platform/service-hub.tsx` | 260 | 0 | Delete |

**Verification:** After deleting, run `pnpm typecheck`. If it passes, the files were truly dead.

---

### Part 2 — Delete duplicate StatusBadge/MetricCard definitions

**Duplicates to remove:**

| Duplicate file | Duplicate export | Consumers | Migration |
|---------------|-----------------|-----------|-----------|
| `components/research/strategies/status-helpers.tsx` | `StatusBadge` | 0 importers | Delete the `StatusBadge` export. If the file has other exports with importers, keep those. If 0 importers total, delete the file. |
| `components/research/execution/status-helpers.tsx` | `StatusBadge` + `MetricCard` | 2 files: `execution-detail-view.tsx`, `execution-list-panel.tsx` | Update those 2 files to import from `@/components/shared/status-badge` and `@/components/shared/metric-card`. Then check if `status-helpers.tsx` has other exports (like `ALGO_COLORS`). If yes, keep only those. If no, delete the file. |
| `components/research/features/feature-helpers.tsx` | `CatStatusBadge` duplicate | `cat-status-badge.tsx` imports `FEAT_STATUS_CFG` from it, not `CatStatusBadge` | Remove the duplicate `CatStatusBadge` export from `feature-helpers.tsx`. Keep `FEAT_STATUS_CFG`, `GROUP_STATUS_CFG`, `SERVICE_COLORS`, `SERVICE_BAR` (they have 7 importers). |

**Verification:** `pnpm typecheck` passes. The 2 migrated files still render correctly.

---

### Part 3 — Move `formatDateTime` from `lib/utils.ts` to `lib/utils/formatters.ts`

**Current state:**
- `lib/utils.ts` exports `cn()` (407 importers) and `formatDateTime()` (used by N files)
- `lib/utils/formatters.ts` exports `formatDate()` which does the same thing but better

**Steps:**
1. Run: `rg -l "formatDateTime" app/ components/` to get the exact list of importers
2. In each file, replace `import { formatDateTime } from "@/lib/utils"` with `import { formatDate } from "@/lib/utils/formatters"` and update the call site: `formatDateTime(date)` → `formatDate(date, "long")`
3. If a file imports both `cn` and `formatDateTime` from `@/lib/utils`, split into two imports:
   ```tsx
   import { cn } from "@/lib/utils";
   import { formatDate } from "@/lib/utils/formatters";
   ```
4. Remove `formatDateTime` from `lib/utils.ts` — it should export only `cn()`

**Verification:** `pnpm typecheck` passes. `rg "formatDateTime" lib/utils.ts` returns nothing.

---

### Part 4 — Move StatusBadge + StatusDot to `components/shared/`

**This is the highest-impact move — 47 importers across all domains.**

**Steps (done):**
1. `status-badge.tsx` now lives in `components/shared/` (moved from `components/trading/`).
2. Imports use `from "@/components/shared/status-badge"` (or barrel `@/components/shared`).
3. Relative `./status-badge` in trading files → `@/components/shared/status-badge`.
4. `components/trading/index.ts` re-exports `StatusBadge` / `StatusDot` from shared.

**Discovery (exact import list):**
```bash
rg -n "from.*trading/status-badge|from.*trading.*StatusBadge|from.*\./status-badge" app/ components/ --glob '*.tsx' --glob '*.ts'
```

**Verification:** `pnpm typecheck` passes. `rg "trading/status-badge" app/ components/` returns nothing.

---

### Part 5 — Move PageHeader, AlertRow, FilterBar from `components/platform/` to `components/shared/`

**PageHeader** — 77 importers:
1. **Done:** `page-header.tsx` is in `components/shared/` (was `components/platform/`).
2. Imports: `from "@/components/shared/page-header"`.

**AlertRow** — 3 importers:
1. **Done:** `alert-row.tsx` is in `components/shared/`.
2. Imports: `from "@/components/shared/alert-row"`.

**FilterBar** — 13 importers:
1. **Done:** `filter-bar.tsx` is in `components/shared/`.
2. Imports: `from "@/components/shared/filter-bar"`.

**Discovery:**
```bash
rg -l "from.*platform/page-header" app/ components/ | wc -l
rg -l "from.*platform/alert-row" app/ components/ | wc -l
rg -l "from.*platform/filter-bar" app/ components/ | wc -l
```

**What stays in `components/platform/`:** Everything else — these are platform infrastructure
components that are NOT cross-domain shared primitives: `context-bar`, `batch-live-rail`,
`live-asof-toggle`, `entitlement-gate`, `global-scope-filters`, `guided-tour`,
`research-family-shell`, `upgrade-card`, `page-help`, `quick-actions`, `activity-feed`,
`health-bar`, `candidate-basket`.

**Verification:** `pnpm typecheck` passes.

---

### Part 6 — Move KpiStrip + widgets/shared contents to `components/shared/`

**KpiStrip** — 43 importers (formerly via `components/widgets/shared/index.ts`):

1. **Done:** `kpi-strip.tsx`, `data-table-widget.tsx`, `filter-bar-widget.tsx`, `collapsible-section.tsx` live in `components/shared/`.
2. **Done:** `components/widgets/shared/` removed; use `from "@/components/shared/kpi-strip"` (or `@/components/shared` barrel).

**Discovery:**
```bash
rg -n "from.*@/components/widgets/shared" app/ components/ --glob '*.tsx'
rg -n "from.*widgets/shared/kpi-strip" app/ components/ --glob '*.tsx'
```

**Verification:** `pnpm typecheck` passes. `components/widgets/shared/` directory removed.

---

### Part 7 — Move custom components out of `components/ui/` to `components/shared/`

| Was (`components/ui/` or similar) | Now | Importers (at audit) |
|--------|------------|-------------------|
| `spinner.tsx` | `components/shared/spinner.tsx` | 59 |
| `empty-state.tsx` | `components/shared/empty-state.tsx` | 7 |
| `empty.tsx` | *(removed — zero importers)* | — |
| `error-boundary.tsx` | `components/shared/error-boundary.tsx` | 8 |
| `data-table.tsx` | `components/shared/data-table.tsx` | 17 |
| `data-freshness.tsx` | `components/shared/data-freshness.tsx` | 3 |
| `api-error.tsx` | `components/shared/api-error.tsx` | 9 |
| `export-dropdown.tsx` | `components/shared/export-dropdown.tsx` | 11 |

**For each file:**
1. Move file to `components/shared/`
2. Update all imports: `from "@/components/ui/<name>"` → `from "@/components/shared/<name>"`
3. If the file imports other `components/ui/` primitives internally (e.g., Spinner imports `cn` from `@/lib/utils`), those stay as-is

**Discovery (for each):**
```bash
for name in spinner empty-state empty error-boundary data-table data-freshness api-error export-dropdown; do
  echo "=== $name ==="
  rg -l "from.*@/components/ui/$name" app/ components/ hooks/ lib/
done
```

**Verification:** `pnpm typecheck` passes. `components/ui/` contains ONLY shadcn primitives.

---

### Part 8 — Merge `empty.tsx` and `empty-state.tsx`

Two "empty" components existed — both were under `components/ui/`:
- `empty-state.tsx` — canonical `EmptyState` (moved to `components/shared/empty-state.tsx`)
- `empty.tsx` — compound `Empty` / `EmptyHeader` / … (shadcn-style)

**Resolution (2026-03-29):** At consolidation time `empty.tsx` had **zero** importers (verify with `rg`). It was **deleted** as dead code. **`EmptyState`** remains the single supported “no data” pattern for pages; if compound empty layout is needed later, reintroduce intentionally under `components/shared/` with a distinct name.

**Steps:**
1. Read both files. Determine if `empty.tsx` is a simpler version or has unique features.
2. If `empty.tsx` is a subset of `empty-state.tsx`: migrate its 7 importers to `EmptyState`, delete `empty.tsx`
3. If they serve genuinely different purposes: rename `empty.tsx` to something descriptive and keep both in `components/shared/`
4. There must be exactly ONE way to show "no data" — pick it and enforce it.

---

### Part 9 — Update `.cursorrules` and create barrel

After all moves are complete:

1. **Create `components/shared/index.ts` barrel** — export all shared components so agents can
   discover what's available:
   ```typescript
   export { MetricCard } from "./metric-card";
   export { KpiStrip } from "./kpi-strip";
   export { StatusBadge, StatusDot } from "./status-badge";
   export { PageHeader } from "./page-header";
   export { Spinner } from "./spinner";
   export { EmptyState } from "./empty-state";
   export { ErrorBoundary } from "./error-boundary";
   export { DataTable } from "./data-table";
   export { FilterBar } from "./filter-bar";
   export { AlertRow } from "./alert-row";
   export { ApiError } from "./api-error";
   export { DataFreshness } from "./data-freshness";
   export { ExportDropdown } from "./export-dropdown";
   ```

2. **Update `.cursorrules`** — update the Architecture section to reflect the new structure:
   ```
   components/
   ├── ui/       ← Radix/shadcn primitives ONLY (Button, Card, Dialog, etc.)
   ├── shared/   ← ALL custom shared components (MetricCard, StatusBadge, Spinner, etc.)
   ├── shell/    ← Shell infrastructure (nav, sidebar, breadcrumbs)
   ├── trading/  ← Trading domain components
   ├── research/ ← Research domain components
   ├── ...       ← Other domain folders
   ```

3. **Update `UI_STRUCTURE_MANIFEST.json`** if it exists, to reflect the new component locations.

---

## Rules for Future Agents

After this consolidation, these rules are absolute:

1. **Shadcn primitive?** → `components/ui/`. Never put custom code here.
2. **Reusable across 2+ domains?** → `components/shared/`. Import as `@/components/shared/<name>`.
3. **Domain-specific?** → `components/{domain}/`. Only used within that domain.
4. **Pure utility function (no React)?** → `lib/utils/<name>.ts`. Import as `@/lib/utils/<name>`.
5. **Before creating a new shared component**, check `components/shared/index.ts` barrel — it might already exist.
6. **Never duplicate.** If you need a variant, extend the existing component with props (size, variant, color). Do not create a new file.

---

## Parallelization Strategy

| Session | Parts | Scope | Model | Est. Time |
|---------|-------|-------|-------|-----------|
| **A — Cleanup** | 1 + 2 | Delete dead code + duplicates | Cheap | 10 min |
| **B — StatusBadge move** | 4 | 47 import updates | Medium | 15 min |
| **C — PageHeader + AlertRow + FilterBar** | 5 | 93 import updates | Medium | 15 min |
| **D — KpiStrip + widgets/shared** | 6 | 42 import updates | Medium | 10 min |
| **E — ui/ → shared/ moves** | 7 + 8 | 121 import updates | Medium | 20 min |
| **F — formatDateTime** | 3 | N import updates | Cheap | 10 min |
| **G — Barrel + rules** | 9 | Create barrel, update .cursorrules | Cheap | 5 min |

A runs first (removes files others might reference). Then B-F run in parallel (each touches
different files). G runs last (needs all moves complete).

---

## Acceptance Criteria

- [x] `components/ui/` contains ONLY shadcn primitives — zero custom components
- [x] `components/shared/` contains ALL cross-domain shared components
- [x] `components/shared/index.ts` barrel exports every shared component
- [x] Zero duplicate component definitions (StatusBadge, MetricCard, CatStatusBadge)
- [x] Zero dead code files (data-card, batch-live-comparison-frame, service-hub)
- [x] `lib/utils.ts` exports only `cn()` — `formatDateTime` removed
- [x] `components/shared/` directory deleted (contents moved to `components/shared/`)
- [x] `components/platform/` contains only platform infrastructure, not shared primitives
- [x] `components/trading/` contains only trading-specific components, not cross-cutting shared
- [x] `.cursorrules` updated with new component architecture
- [x] `pnpm typecheck` passes
- [x] `pnpm build` succeeds
- [x] All existing imports updated — zero references to old paths (app/components/hooks/lib/archive; docs may still mention historical paths)

**Verification commands:**
```bash
# No custom components in ui/
for name in spinner empty-state empty error-boundary data-table data-freshness api-error export-dropdown; do
  [ -f "components/ui/$name.tsx" ] && echo "FAIL: components/ui/$name.tsx still exists"
done

# No old import paths
rg "from.*@/components/trading/status-badge" app/ components/ | wc -l  # should be 0
rg "from.*@/components/platform/page-header" app/ components/ | wc -l  # should be 0
rg "from.*@/components/platform/alert-row" app/ components/ | wc -l    # should be 0
rg "from.*@/components/platform/filter-bar" app/ components/ | wc -l   # should be 0
rg "from.*@/components/widgets/shared" app/ components/ | wc -l        # should be 0
rg "from.*@/components/shared/spinner" app/ components/ | wc -l            # should be 0
rg "from.*@/components/ui/empty-state" app/ components/ | wc -l        # should be 0
rg "from.*@/components/shared/data-table" app/ components/ | wc -l         # should be 0
rg "formatDateTime" lib/utils.ts | wc -l                                # should be 0

# Dead code gone
[ -f "components/shared/data-card.tsx" ] && echo "FAIL: dead file exists"
[ -f "components/platform/batch-live-comparison-frame.tsx" ] && echo "FAIL: dead file exists"
[ -f "components/platform/service-hub.tsx" ] && echo "FAIL: dead file exists"

# Barrel exists
[ -f "components/shared/index.ts" ] && echo "PASS: barrel exists" || echo "FAIL: no barrel"
```

---

## Self-Evaluation Checklist

**Completed 2026-03-29** — self-audit results:

1. **Can an agent find every shared component by looking in ONE folder?** Yes. `components/shared/index.ts` re-exports shared UI plus `export * from "./finder"`. Primary import path: `@/components/shared/<name>` or barrel `@/components/shared`.

2. **Is `components/ui/` pure shadcn?** Yes. Custom files (spinner, empty-state, error-boundary, data-table, data-freshness, api-error, export-dropdown) were moved to `components/shared/`. **`empty.tsx`:** had **zero** importers at consolidation time — **deleted** as dead code (single empty pattern: `EmptyState` in `components/shared/empty-state.tsx`).

3. **Are there zero duplicates?** Yes. `rg "export function StatusBadge" components/` → `components/shared/status-badge.tsx` only. `MetricCard` → `components/shared/metric-card.tsx` only. `CatStatusBadge` → `components/research/features/cat-status-badge.tsx` only; duplicate removed from `feature-helpers.tsx`.

4. **Did you update EVERY import?** Yes for compilable code; `pnpm typecheck` green. Follow-ups: relative `../shared` in some widgets retargeted to `@/components/shared`; `strategy-list-panel` now imports `StatusBadge` from shared. **Status keys:** shared `StatusBadge` extended with `complete`, `queued`, `completed`, `cancelled` for execution + strategy backtest UIs.

5. **Did you delete the old files?** Yes — old paths removed; `components/shared/status-badge.tsx` and dead files deleted.

6. **Does the app still work?** `pnpm build` succeeded (Next.js 16.2.1, 139 static pages generated).

---

## Self-Evaluation Checklist (original prompts)

1. **Can an agent find every shared component by looking in ONE folder?** Open `components/shared/index.ts` — is every shared component listed? If someone asks "where's the spinner?", is the answer always `components/shared/spinner.tsx`?

2. **Is `components/ui/` pure shadcn?** Run `ls components/ui/` — can you explain every file as a shadcn primitive? If any file is custom code, it's in the wrong place.

3. **Are there zero duplicates?** `rg "export.*function StatusBadge" components/` should return exactly 1 result. Same for MetricCard, EmptyState.

4. **Did you update EVERY import?** Not 90% of them. Every. Single. One. `pnpm typecheck` catches most, but relative imports (`from "./status-badge"`) can silently break if both old and new files exist during the move.

5. **Did you delete the old files?** Moving without deleting creates duplicates. The old file at the old path must be gone.

6. **Does the app still work?** `pnpm build` is the minimum bar. Ideally, open 3-4 pages that use StatusBadge, MetricCard, Spinner and verify they render correctly.
