# client-reporting-ui

**Port:** 5182 | **API:** client-reporting-api (port 8014) | **Type:** ui-analysis

Client-facing reporting and portfolio analytics. Produces performance reports and account statements for clients.
Operations and account managers use this to view portfolio performance, generate client-ready documents, and review
historical reports.

## What it does

| Tab             | Purpose                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Reports         | Browse generated reports — filter by client, period, and report type. Download or preview individual reports. |
| Performance     | Portfolio performance analytics — returns chart, drawdown, Sharpe ratio, benchmark comparison per client      |
| Generate Report | Trigger a new report generation job — select client, period, report type, and output format                   |
| Deployments     | Embedded deployment panel for managing service rollouts                                                       |

This UI uses a flat tab navigation (no sidebar) given its focused, workflow-oriented scope.

## Local dev

```bash
npm install
cp .env.example .env.development   # set VITE_API_URL and VITE_OAUTH_CLIENT_ID
npm run dev                         # http://localhost:5182
```

Static mock mode (no backend needed):

```bash
VITE_MOCK_API=true VITE_SKIP_AUTH=true npm run dev
```

## Environment variables

| Variable               | Default                 | Description                               |
| ---------------------- | ----------------------- | ----------------------------------------- |
| `VITE_API_URL`         | `http://localhost:8014` | client-reporting-api base URL             |
| `VITE_OAUTH_CLIENT_ID` | —                       | Google OAuth client ID                    |
| `VITE_MOCK_API`        | `false`                 | Enable client-side static mock mode       |
| `VITE_SKIP_AUTH`       | `false`                 | Bypass auth gate (use with VITE_MOCK_API) |

## Tests

```bash
npm test               # Vitest unit tests
npm run test:e2e       # Playwright smoke tests
```

## Quality gates

```bash
bash scripts/quality-gates.sh        # lint + typecheck + tests
bash scripts/quickmerge.sh "message" # merge after gates pass
```

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Recharts · `@unified-trading/ui-kit` · `@unified-trading/ui-auth`
