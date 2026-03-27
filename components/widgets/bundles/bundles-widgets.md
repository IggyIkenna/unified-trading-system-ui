# Atomic Bundle Builder — Widget Decomposition Spec

**Page:** `app/(platform)/services/trading/bundles/page.tsx`
**Component:** `components/trading/bundle-builder.tsx`
**Tier:** 3 (low priority — self-contained tool, moderate complexity)

---

## 1. Page Analysis

| Metric           | Value                                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page lines       | 19 (thin wrapper with header)                                                                                                                                                                       |
| Component lines  | ~912 (bundle-builder.tsx)                                                                                                                                                                           |
| Sections visible | Template gallery, visual DAG, step list with CRUD, P&L estimate, action buttons (simulate + submit)                                                                                                 |
| Data hooks used  | None — 100% inline mock data                                                                                                                                                                        |
| Inline mock data | `ALL_OPERATION_TYPES` (21 types), `VENUES` (20 venues), `INSTRUMENTS` (16 instruments), `TEMPLATES` (5 pre-built bundles: Flash Loan Arb, Basis Trade, DeFi Deleverage, Options Spread, Sports Arb) |
| Sub-components   | All inline — template cards, step cards, DAG visualization, P&L estimate                                                                                                                            |

The bundle builder is a multi-step transaction constructor. Users either pick a template or build from scratch. Each step has operation type, instrument, venue, side, quantity, price, and dependency linking.

---

## 2. Widget Decomposition

| id                 | label            | description                                                                                                                                | icon         | minW | minH | defaultW | defaultH | singleton |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ---- | ---- | -------- | -------- | --------- |
| `bundle-templates` | Bundle Templates | Pre-built template gallery with category badges, estimated cost/profit, step preview                                                       | `FileText`   | 3    | 3    | 4        | 5        | yes       |
| `bundle-steps`     | Execution Steps  | Interactive step list with add/remove/reorder/duplicate, per-step fields (op, instrument, venue, side, qty, price, depends-on), visual DAG | `Layers`     | 4    | 4    | 8        | 7        | yes       |
| `bundle-pnl`       | P&L Estimate     | Buy/sell notional, gas estimate, net P&L calculation                                                                                       | `DollarSign` | 3    | 2    | 4        | 3        | yes       |
| `bundle-actions`   | Bundle Actions   | Simulate (dry run) and Submit buttons with step count badge                                                                                | `Send`       | 3    | 1    | 4        | 1        | yes       |

---

## 3. Data Context Shape

```typescript
interface BundleData {
  // Steps
  steps: BundleStep[];
  addStep: () => void;
  removeStep: (id: string) => void;
  moveStep: (id: string, direction: "up" | "down") => void;
  duplicateStep: (id: string) => void;
  updateStep: (id: string, field: keyof BundleStep, value: string | null) => void;

  // Templates
  templates: BundleTemplate[];
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  loadTemplate: (template: BundleTemplate) => void;
  clearSteps: () => void;

  // P&L
  totalCost: number;
  totalRevenue: number;
  estimatedGas: number;
  netPnl: number;

  // Config
  operationTypes: readonly string[];
  venues: readonly string[];
  instruments: readonly string[];
}
```

---

## 4. Mock Data Instructions

All mock data is inline in `bundle-builder.tsx`. Extract:

- `ALL_OPERATION_TYPES` → `lib/config/services/bundle.config.ts` (reference data)
- `VENUES` → merge with venue lists from `lib/config/services/trading.config.ts` (already has venues per category in the book page)
- `INSTRUMENTS` → `lib/config/services/bundle.config.ts`
- `TEMPLATES` → `lib/mocks/fixtures/bundle-templates.ts`
- Types (`BundleStep`, `BundleTemplate`, `OperationType`) → `lib/types/bundles.ts`
- Color helpers (`getOperationColor`, `getOperationBadgeClass`) → keep co-located in widget or move to `lib/utils/bundles.ts`

---

## 5. UI/UX Notes

- The visual DAG (numbered circles with arrows) is a nice touch — keep it in the steps widget.
- Step cards are vertically stacked — in a narrow widget (4 cols), they work well. In wider layouts, consider a horizontal step rail.
- The template gallery currently uses a single-column list — in a wider widget, use a 2-column grid.
- Step reordering uses up/down buttons — future: drag-and-drop with `@dnd-kit/core`.
- Notional display per step only shows when both qty and price are filled — good progressive disclosure.
- Operation type badges use consistent color coding across the system — ensure this is shared with the instructions viewer page.

---

## 6. Collapsible Candidates

| Section                | Why                                                                     |
| ---------------------- | ----------------------------------------------------------------------- |
| Template gallery       | Toggle between templates and steps view; already has show/hide toggle   |
| Per-step detail fields | Could collapse to show just operation type + instrument in compact mode |
| P&L estimate           | Secondary to the builder; collapse when editing steps                   |

---

## 7. Reusable Component Usage

| Shared widget        | Where used                                                           |
| -------------------- | -------------------------------------------------------------------- |
| `CollapsibleSection` | Template gallery toggle, P&L details                                 |
| `KpiStrip`           | P&L summary (buy notional, sell notional, gas, net P&L as 4 metrics) |

`DataTableWidget` and `FilterBarWidget` are not applicable here — this is a builder UI, not a table/filter page.

---

## 8. Default Preset Layout

```
bundles-default:
  bundle-templates:  { x: 0,  y: 0,  w: 4,  h: 5 }
  bundle-steps:      { x: 4,  y: 0,  w: 8,  h: 7 }
  bundle-pnl:        { x: 0,  y: 5,  w: 4,  h: 3 }
  bundle-actions:    { x: 0,  y: 8,  w: 4,  h: 1 }

bundles-compact:
  bundle-steps:      { x: 0,  y: 0,  w: 8,  h: 8 }
  bundle-pnl:        { x: 8,  y: 0,  w: 4,  h: 4 }
  bundle-templates:  { x: 8,  y: 4,  w: 4,  h: 4 }
  bundle-actions:    { x: 0,  y: 8,  w: 12, h: 1 }
```

---

## 9. Questions to Resolve

1. **Bundle vs Flash Loan overlap** — the DeFi page's Flash Loan tab and this Bundle Builder share the step-builder pattern. Should they be unified into a single `BundleBuilderWidget` with different template sets based on context?
2. **Dependency DAG** — the `dependsOn` field allows step ordering constraints. Should the visual DAG show actual dependency edges (arrows between dependent steps) or remain a simple linear chain?
3. **Simulation backend** — the "Simulate (Dry Run)" button is currently a no-op. What API endpoint should it call? Mock it in MSW?
4. **Template persistence** — should users be able to save custom templates? If so, this needs a user-specific storage mechanism (local storage or API).
5. **Cross-page navigation** — when a strategy generates bundle instructions, should it link to this page pre-populated? Similar to Book Trade's `?prefill=` pattern.
