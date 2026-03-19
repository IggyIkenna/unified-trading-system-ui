# versa-client-reporting — Odum Research Client Portal

## What this is
What clients see: performance reports, portfolio analytics, account statements, monthly snapshots.

## Stack
React 19 + TypeScript + Vite + Radix UI + Recharts

## Scope
- Client login → view their account
- Monthly performance data
- Strategy allocation breakdown
- Statement download (PDF)
- Historical returns

## For Versa
Client-facing — this needs to look premium. Key screens:
- Dashboard (current month return, since inception, AUM)
- Monthly reports list → view/download PDF
- Portfolio breakdown (strategy allocation pie)
- Transaction history
- FCA disclaimer footer on all pages

Branding: Odum navy `#1e3a8a` / blue `#1d4ed8`. Clean, trust-building.

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
