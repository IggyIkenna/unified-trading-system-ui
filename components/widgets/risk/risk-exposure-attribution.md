# Exposure Attribution

Tab: risk
Widget ID: risk-exposure-attribution
Min size: 6 x 3 columns/rows

## What it shows

Grouped exposure table organized by category (first_order, second_order, structural, operational, domain_specific). Each group is collapsible. Includes strategy archetype filter to show only relevant risk types, and an exposure time series chart (Top 3 components over 1W/1M/3M).

## Data sources

- `useRiskData()` context: filteredExposureRows, groupedExposure, riskFilterStrategy, exposureTimeSeries, exposurePeriod

## Configuration

- Strategy filter dropdown.
- Exposure period selector (1W, 1M, 3M).

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-var-chart`, `risk-term-structure`, `risk-greeks-summary`, `risk-kpi-strip`.
- **Positions proof:** **positions** `positions-table`, `positions-kpi-strip` · **overview** `strategy-table`.
- **Macro:** **terminal** `calendar-events`.
