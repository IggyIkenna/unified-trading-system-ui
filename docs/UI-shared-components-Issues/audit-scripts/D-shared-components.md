# Module D — Shared Component Reuse & Centralization Audit

**Output:** `docs/UI-shared-components-Issues/04-SHARED-COMPONENT-REUSE-AUDIT.md`
**Maps to:** WORK_TRACKER §3 (Component Centralization)

## Part 1: Adoption Check — Does a Shared Component Exist, and Who Uses It?

For each pattern below, find: (a) the shared component if it exists, (b) how many pages/components use it, (c) how many pages/components roll their own instead.

| Pattern                              | Shared Location (if exists)           | Search For Ad-Hoc Versions                               |
| ------------------------------------ | ------------------------------------- | -------------------------------------------------------- |
| Page header (title + desc + actions) | ?                                     | Every `<h1>` in `app/` pages                             |
| Metric/KPI card                      | `components/shared/metric-card.tsx`   | Ad-hoc Card+number patterns                              |
| KPI strip (row of metrics)           | ?                                     | `*-kpi-strip` widget patterns, inline metric rows        |
| Status badge                         | `components/trading/status-badge.tsx` | Inline status pills, colored dots                        |
| Empty state                          | `components/ui/empty-state.tsx`       | "No data" / "No results" patterns                        |
| Loading skeleton                     | `components/ui/skeleton.tsx`          | Per-page skeleton compositions                           |
| Data table                           | `components/ui/data-table.tsx`        | Inline `<table>` or raw `Table` where DataTable fits     |
| Filter bar                           | `components/platform/filter-bar.tsx`  | Per-page filter/search UI                                |
| Toolbar / controls row               | ?                                     | `*-controls` widgets, inline toolbar layouts             |
| Master-detail layout                 | ?                                     | Split-pane patterns in sports, predictions, instructions |
| Error boundary                       | ?                                     | Per-page try/catch vs shared                             |
| Confirmation dialog                  | `components/ui/alert-dialog.tsx`      | Custom modal patterns                                    |
| Toast/notification                   | `components/ui/sonner.tsx` or toast   | Ad-hoc notification patterns                             |
| Tab navigation                       | `components/shell/service-tabs.tsx`   | Ad-hoc tab styling                                       |
| Breadcrumb                           | `components/shell/breadcrumbs.tsx`    | Per-page breadcrumb vs shared                            |
| Page wrapper                         | ?                                     | Per-page padding/max-width vs shared                     |
| Quick stat card                      | ?                                     | Trading sidebar repeated Card+metric patterns            |

## Part 2: Duplication Check

Search for:

1. Duplicate component names across directories (e.g., two `EmptyState`, two `FilterBar`)
2. Components that exist in `components/ui/` but are never imported
3. Components in `components/trading/` that are generic enough for `components/shared/` or `components/widgets/primitives/`
4. Identical or near-identical rendering patterns in 3+ files (e.g., same Card+Badge+metric layout)

## Part 3: Widget Primitive Patterns

For each of these widget categories, check how many separate implementations exist vs how many could share a primitive:

| Primitive                         | Current Implementations                              | Centralize To                                            |
| --------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Metric strip (horizontal KPI row) | Count all `*-kpi-strip`, `*-kpi` widgets             | `components/widgets/primitives/metric-strip.tsx`         |
| Controls/toolbar row              | Count all `*-controls`, `*-control-bar` widgets      | `components/widgets/primitives/toolbar-row.tsx`          |
| Master-detail split               | Count sports/predictions/instructions split patterns | `components/widgets/primitives/master-detail-layout.tsx` |
| Data table shell                  | Count all `*-table-widget` files                     | `components/ui/data-table-shell.tsx`                     |

## Part 4: Active Tab Logic Duplication

Check if `ServiceTabs` and `TradingVerticalNav` duplicate `isActive` logic. If so, flag for extraction to `lib/utils/nav-helpers.ts`.

Read:

- `components/shell/service-tabs.tsx` — the `isActive` computation
- `components/shell/trading-vertical-nav.tsx` — the `isActive` and `isFamilyActive` computation
- Are they identical? Report exact line numbers.

## Output Expectations

For each component pattern in Part 1:

- Count: N pages use shared version, M pages roll their own
- List the top 5 worst offenders (pages with the most ad-hoc reimplementations)
- Propose: which new shared component to create, or which existing one to promote
