# Strategy Instructions — Widget Decomposition Spec

**Page:** `app/(platform)/services/trading/instructions/page.tsx`
**Component:** `components/trading/strategy-instruction-viewer.tsx`
**Tier:** 3 (low priority — read-only monitoring view, moderate complexity)

---

## 1. Page Analysis

| Metric           | Value                                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page lines       | 19 (thin wrapper with header)                                                                                                                                                                                         |
| Component lines  | ~795 (strategy-instruction-viewer.tsx)                                                                                                                                                                                |
| Sections visible | Header with refresh button, filter row (strategy type + operation type selectors), summary bar (total/filled/partial/pending/avg slippage), 3-column table (Signal / Instruction / Fill-Diff), expandable detail rows |
| Data hooks used  | None — 100% inline mock data                                                                                                                                                                                          |
| Inline mock data | `MOCK_INSTRUCTIONS` (10 instructions across 10 strategy types), `STRATEGY_TYPES` (10), `OPERATION_TYPES` (22)                                                                                                         |
| Sub-components   | All inline — filter selectors, summary bar, instruction rows, expanded detail                                                                                                                                         |

This is the Signal → Instruction → Fill pipeline viewer. Each row shows three columns: what the strategy signaled (direction, confidence), what instruction was generated (operation, qty, price, venue), and what actually filled (fill price, fill qty, slippage). Rows expand on click to show detailed discrepancy analysis.

---

## 2. Widget Decomposition

| id                     | label                | description                                                                                               | icon        | minW | minH | defaultW | defaultH | singleton |
| ---------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ---- | ---- | -------- | -------- | --------- |
| `instr-filter-bar`     | Instruction Filters  | Strategy type and operation type filter dropdowns                                                         | `Filter`    | 4    | 1    | 12       | 1        | yes       |
| `instr-summary`        | Pipeline Summary     | KPIs: total instructions, filled count, partial fills, pending, avg slippage                              | `BarChart3` | 4    | 1    | 12       | 1        | yes       |
| `instr-pipeline-table` | Instruction Pipeline | 3-column Signal/Instruction/Fill table with expandable rows, click-to-expand detail                       | `Zap`       | 6    | 4    | 12       | 8        | yes       |
| `instr-detail-panel`   | Instruction Detail   | Expanded view of a single instruction showing signal detail, instruction detail, and discrepancy analysis | `FileText`  | 4    | 3    | 12       | 3        | no        |

**Note:** The pipeline table already contains expandable rows. The `instr-detail-panel` is an optional separate widget for users who prefer a persistent detail panel (master-detail pattern) instead of inline expansion.

---

## 3. Data Context Shape

```typescript
interface InstructionsData {
  // Filters
  strategyFilter: string;
  setStrategyFilter: (f: string) => void;
  opTypeFilter: string;
  setOpTypeFilter: (f: string) => void;

  // Instructions
  allInstructions: StrategyInstruction[];
  filteredInstructions: StrategyInstruction[];

  // Summary
  summary: {
    total: number;
    filled: number;
    partial: number;
    pending: number;
    avgSlippage: number;
  };

  // Selection
  selectedInstructionId: string | null;
  setSelectedInstructionId: (id: string | null) => void;
  selectedInstruction: StrategyInstruction | null;

  // Config
  strategyTypes: readonly string[];
  operationTypes: readonly string[];

  // Actions
  refresh: () => void;
}
```

---

## 4. Mock Data Instructions

All mock data is inline in `strategy-instruction-viewer.tsx`. Extract:

- `MOCK_INSTRUCTIONS` → `lib/mocks/fixtures/strategy-instructions.ts`
- `STRATEGY_TYPES` → `lib/config/services/instructions.config.ts` (reference data)
- `OPERATION_TYPES` → consolidate with `ALL_OPERATION_TYPES` from bundle-builder (they're the same 22 types) into `lib/config/services/trading.config.ts`
- Types (`StrategyInstruction`, `StrategySignal`, `StrategyInstructionDetail`, `StrategyFill`) → `lib/types/instructions.ts`
- Helper functions (`formatTimestamp`, `getStatusColor`, `getStatusIcon`, `getConfidenceColor`, `getSlippageColor`, `getOperationBadgeVariant`) → `lib/utils/instructions.ts`

---

## 5. UI/UX Notes

- The 3-column layout (Signal | Instruction | Fill) is the core differentiator — preserve this exact layout inside the widget.
- Column headers with background (`bg-muted/30`) provide clear visual separation — keep.
- Expanded detail row spans all 3 columns with a grid of 3 sub-sections — works well, keep inline.
- The table has `max-h-[600px]` with vertical scroll — in widget mode, this should be `h-full` with auto-scroll.
- Color coding is consistent: emerald for filled/passed, amber for partial, rose for rejected/failed.
- Status icons (CheckCircle2, AlertTriangle, XCircle, Clock) are consistent with the rest of the system.
- Consider adding a real-time refresh interval (currently manual button only).

---

## 6. Collapsible Candidates

| Section             | Why                                                |
| ------------------- | -------------------------------------------------- |
| Expanded detail row | Already click-to-expand; keep this pattern         |
| Filter bar          | Compact when screen space is limited               |
| Summary bar         | Informational; can collapse to save vertical space |

---

## 7. Reusable Component Usage

| Shared widget        | Where used                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `KpiStrip`           | Summary bar (total, filled, partial, pending, avg slippage as 5 metrics)                                                      |
| `FilterBarWidget`    | Strategy type + operation type filter selectors                                                                               |
| `DataTableWidget`    | Could replace the custom table, but the 3-column Signal/Instruction/Fill layout is specialized — may be better to keep custom |
| `CollapsibleSection` | Filter bar collapse, summary collapse                                                                                         |

---

## 8. Default Preset Layout

```
instructions-default:
  instr-filter-bar:      { x: 0,  y: 0,  w: 12, h: 1 }
  instr-summary:         { x: 0,  y: 1,  w: 12, h: 1 }
  instr-pipeline-table:  { x: 0,  y: 2,  w: 12, h: 10 }

instructions-with-detail:
  instr-filter-bar:      { x: 0,  y: 0,  w: 12, h: 1 }
  instr-summary:         { x: 0,  y: 1,  w: 12, h: 1 }
  instr-pipeline-table:  { x: 0,  y: 2,  w: 8,  h: 10 }
  instr-detail-panel:    { x: 8,  y: 2,  w: 4,  h: 10 }
```

---

## 9. Questions to Resolve

1. **Real-time updates** — the refresh button suggests this data should update in real-time. Should the widget use a WebSocket subscription or polling interval? What's the expected update frequency?
2. **Strategy linking** — clicking a strategy ID in the table could navigate to the strategy detail page. In widget mode, should it open a strategy detail widget or link to the promote/strategy page?
3. **Operation type consolidation** — the 22 operation types here overlap with bundle-builder and DeFi. Should there be a single canonical `OPERATION_TYPES` constant used across all trading pages?
4. **Fill rate monitoring** — should there be alerts for instructions that remain pending beyond a threshold? This could be a KPI in the summary (e.g., "3 pending > 5min").
5. **Historical view** — currently shows only the latest batch. Should there be a time-range selector to view historical instruction → fill performance?
