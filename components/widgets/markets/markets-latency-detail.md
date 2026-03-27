# Latency Detail

Tab: markets
Widget ID: markets-latency-detail
Min size: 6 x 4 columns/rows

## What it shows

When a service is selected: `KpiStrip` for p50/p95/p99, lifecycle breakdown bars (cross-section mode), Recharts area chart (time-series mode), and a `CollapsibleSection` compare table when data mode is compare (deterministic simulated batch per stage — no `Math.random`).

## Data sources

- Selected row from `latencyMetrics` via `selectedLatencyService`.

## Configuration

- `latencyViewMode`, `latencyDataMode` from context (toggles live on summary widget).

## Recommended pairings

- `markets-latency-summary` on the same workspace.
