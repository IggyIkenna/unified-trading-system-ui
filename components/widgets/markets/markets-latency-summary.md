# Latency Summary

Tab: markets
Widget ID: markets-latency-summary
Min size: 4 x 3 columns/rows

## What it shows

Per-service latency row with health dot, p50/p95/p99 (live, batch, or compare with deltas). Latency-specific view (cross-section vs time-series) and data mode toggles live here. Clicking a row sets `selectedLatencyService` for the detail widget.

## Data sources

- `useMarketsData().latencyMetrics` — `MOCK_LATENCY_METRICS` in `lib/mocks/fixtures/latency-metrics.ts`.

## Configuration

- `latencyViewMode`, `latencyDataMode`, `selectedLatencyService` in context.

## Recommended pairings

- `markets-latency-detail` (required for drill-down content).
