# Circuit Breaker Status

Tab: risk
Widget ID: risk-circuit-breakers
Min size: 4 x 2 columns/rows

## What it shows

Per-venue circuit breaker cards in a 2-column grid. Each card shows venue name, CB status badge (CLOSED=green, HALF_OPEN=amber, OPEN=red), strategy ID, and kill switch active badge if applicable.

## Data sources

- `useRiskData()` context: venueCircuitBreakers

## Configuration

- None.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-strategy-heatmap`, `risk-kpi-strip`, `risk-limits-hierarchy`.
- **Kill path:** **alerts** `alerts-kill-switch`, `alerts-table` · **overview** `alerts-preview`.
- **Venue health:** **markets** `markets-latency-detail`, `markets-recon`.
