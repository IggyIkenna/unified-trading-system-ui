# Strategy List

Tab: strategies
Widget ID: strategies-catalogue
Min size: 6 × 4 columns/rows

## What it shows

Strategies grouped by asset class in collapsible sections (`CollapsibleSection`). Each strategy is a card with status, version, venues, instruction types, performance metrics, a `SparklineCell`, and links to live positions, detail route, and config. Layout switches to a single column when the widget container is narrower than ~560px; sparklines use a smaller footprint in that mode.

## Data sources

- `useStrategiesData()` → `filteredStrategies`, `groupedStrategies`
- Same upstream performance payload as the KPI widget

## Configuration

- No widget-level configuration options

## Recommended pairings

(filled in Phase 4)
