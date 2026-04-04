# 4.8 Instructions — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **WORK_TRACKER ref:** §4.8
> **Page route:** `/services/trading/instructions`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `instr-summary` | Pipeline Summary | `InstructionsSummaryWidget` | 27 | yes | 12x1 at (0,0) |
| `instr-pipeline-table` | Instruction Pipeline | `InstructionsPipelineTableWidget` | 46 | yes | 12x11 at (0,1) |
| `instr-detail-panel` | Instruction Detail | `InstructionsDetailPanelWidget` | 24 | **no** | Only in "With detail panel" preset |

**Total: 3 widgets.**

**Data provider:** `InstructionsDataProvider` wraps the page. Manages instructions, filters, selected instruction.

**Presets:** 2 presets:
1. **"Default"** — Summary (full-width, 1 row) + Pipeline Table (full-width, 11 rows)
2. **"With detail panel"** — Summary + Pipeline Table (8 cols) + Detail Panel (4 cols)

---

## What Each Widget Does

### instr-summary (27 lines)
- 5 KPIs via `<KpiStrip>`: Total, Filled, Partial, Pending, Avg Slippage (bps).
- Slippage gets colour-coded sentiment (green ≤2, neutral ≤5, red >5).

### instr-pipeline-table (46 lines)
- Wraps `<InstructionPipelineRows>` (separate component with the actual table rendering).
- Filter bar (search, status, venue, strategy, etc.) with toggle.
- Refresh button.
- Expandable discrepancy detail per row.

### instr-detail-panel (24 lines)
- Master-detail panel showing full instruction detail grid when a row is selected.
- Empty state when nothing selected.
- NOT singleton — can be added multiple times.

---

## Data Flow

```
InstructionsDataProvider (page.tsx)
├── Instructions data + filters
├── selectedInstruction (set when row clicked)
├── summary → derived (total, filled, partial, pending, avgSlippage)
├── filterDefs, filterValues, handleFilterChange
└── provides all via React Context
    ├── InstructionsSummaryWidget       reads: summary
    ├── InstructionsPipelineTableWidget reads: filters, refresh; renders rows
    └── InstructionsDetailPanelWidget   reads: selectedInstruction
```

---

## Testing Checklist

- [ ] **Summary KPIs:** All 5 metrics show real values (Total, Filled, Partial, Pending, Avg Slippage)
- [ ] **Pipeline Table:** Rows render with signal/instruction/fill columns
- [ ] **Pipeline Filters:** Search, status, venue, strategy filters work
- [ ] **Expandable rows:** Clicking a row expands to show discrepancy detail
- [ ] **Detail Panel:** Selecting a row populates the detail grid (in "With detail panel" preset)
- [ ] **Refresh:** Refresh button triggers data refetch

---

## Merge Proposal

**WORK_TRACKER target:** "Single Instructions panel (summary strip + pipeline + detail)."

### Option A — Merge summary into pipeline table (recommended)
- Embed the 5-KPI strip as a sticky header inside `InstructionsPipelineTableWidget`.
- Keep `instr-detail-panel` as a separate widget — it's optional (only in one preset) and the user may not want it visible.
- Delete `instr-summary` registration; update presets.
- **Result:** 2 widgets (pipeline-with-summary + detail-panel).

### Option B — Merge all three into one
- Single widget: KPI strip + table + detail panel in a split layout.
- Problem: detail panel is optional and may not be wanted.
- **Result:** 1 widget.

### Option C — No merge
- Current layout is clean and simple.

---

## Questions for User

1. **Merge scope:** Option A (summary into table), B (all-in-one), or C (no merge)?
2. **Detail panel:** Is the master-detail pattern useful, or is the expandable row in the pipeline table sufficient?
3. **Any broken data?** Do instructions appear in the table when you visit the page?
