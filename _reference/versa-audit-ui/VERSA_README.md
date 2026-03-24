# versa-audit-ui — Odum Research Audit, Alerting & Logging

## What this is

Internal dashboard for every event, log, and alert that flows through the Odum trading system.

## Stack

React 19 + TypeScript + Vite + Radix UI + Recharts

## Scope

- Real-time event log viewer
- Batch job monitoring and status
- Data completeness audits
- Quality metrics and thresholds
- Alert history and resolution tracking
- Exchange connectivity status

## For Versa

Internal ops/engineering dashboard. Priorities:

- Dense information display (tables, not cards)
- Status indicators: green/amber/red for system health
- Log search and filtering
- Time-series charts for batch job success rates
- Alert inbox with acknowledge/resolve flow

## Run

```bash
npm install && npm run dev          # mock mode (default — no credentials needed)
npm run dev:cloud                   # real backend — requires .env.cloud.local
```

## Cloud setup

Copy `.env.cloud` → `.env.cloud.local` (gitignored), fill in your real values:

```
VITE_MOCK_API=false
VITE_SKIP_AUTH=false
VITE_API_URL=https://api.odumresearch.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Then `npm run dev:cloud` — zero code changes needed.
