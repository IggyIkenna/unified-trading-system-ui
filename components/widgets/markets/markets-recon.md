# Reconciliation

Tab: markets
Widget ID: markets-recon
Min size: 4 x 3 columns/rows

## What it shows

Reconciliation runs as a compact table: date, status badge (clean / resolved counts), break count, break value.

## Data sources

- `useMarketsData().reconRuns` — `MOCK_RECON_RUNS` in `lib/mocks/fixtures/recon-runs.ts`.

## Configuration

- None.

## Recommended pairings

- Any markets preset; pairs well with `markets-latency-summary` on the default layout.
