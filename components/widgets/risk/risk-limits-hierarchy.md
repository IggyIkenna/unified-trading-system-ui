# Limits Hierarchy

Tab: risk
Widget ID: risk-limits-hierarchy
Min size: 6 x 3 columns/rows

## What it shows

Interactive 6-level hierarchy tree table (Company > Client > Account > Strategy > Underlying > Instrument) with indentation, click-to-filter by scope, and a breadcrumb showing the selected scope. Below, a collapsible "All Limits Detail" table with full sort.

## Data sources

- `useRiskData()` context: riskLimits, sortedLimits, selectedNode

## Configuration

- Click row to filter by scope. Clear button in breadcrumb.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-utilization`, `risk-strategy-heatmap`, `risk-kpi-strip`.
- **Breach workflow:** **alerts** `alerts-table` · **instructions** `instr-pipeline-table`.
- **Governance:** **book** `book-hierarchy-bar` · **strategies** `strategies-filter-bar`.
