# Position Filters

Tab: positions
Widget ID: positions-filter
Min size: 4 x 1 columns/rows

## What it shows

Unified filter bar (search, strategy, venue, side) plus instrument type pills (All/Spot/Perp/Futures/Options/DeFi/Prediction). Consolidates the two separate filter sections from the original page into one widget. Shows a contextual "View Strategy Details" link when a strategy is selected.

## Data sources

- `usePositionsData()` context → `filterDefs`, `filterValues`, `instrumentTypes`
- Filter options derived from position data (unique venues and strategies)

## Configuration

- No widget-level configuration options

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `positions-kpi-strip`, `positions-table`, `account-balances` (filters drive both KPIs and table).
- **Overview:** `scope-summary`, `strategy-table` for strategy-scoped context.
- **Risk / limits:** **risk** `risk-strategy-heatmap`, `risk-limits-hierarchy`.
