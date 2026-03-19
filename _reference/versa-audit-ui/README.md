# batch-audit-ui

**Port:** 5181 | **API:** batch-audit-api (port 8013) | **Type:** ui-observability

Batch pipeline audit console. Provides visibility into every batch job that runs in the system — status, timing, event
trail, and quality metrics. Also surfaces data completeness audits (which GCS paths have data for which dates) and
compliance violation tracking.

## What it does

| Section           | Route               | Purpose                                                                                                          |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Batch Jobs        | `/jobs`             | Job list — all batch runs with status (COMPLETED / RUNNING / FAILED / PENDING), timing, and triggered-by context |
| Job Detail        | `/jobs/:id`         | Full detail for a single job — step-by-step event trail, logs, input/output paths, error details                 |
| Audit Trail       | `/audit/trail`      | Filterable event log — search across all jobs by date range, job type, status, or correlation ID                 |
| Data Completeness | `/audit/health`     | GCS path presence matrix — which instruments/dates have data files, which are missing                            |
| Compliance        | `/audit/compliance` | Compliance violation tracker — severity-classified rule breaches with status and resolution                      |
| Deployments       | `/deployments`      | Embedded deployment panel for managing service rollouts                                                          |

## Local dev

```bash
npm install
cp .env.example .env.development   # set VITE_API_URL and VITE_OAUTH_CLIENT_ID
npm run dev                         # http://localhost:5181
```

Static mock mode (no backend needed):

```bash
VITE_MOCK_API=true VITE_SKIP_AUTH=true npm run dev
```

This is the **reference UI** for visual polish. When fixing shared ui-kit components, verify the fix looks correct here
first before propagating to the other 10 UIs.

## Environment variables

| Variable               | Default                 | Description                               |
| ---------------------- | ----------------------- | ----------------------------------------- |
| `VITE_API_URL`         | `http://localhost:8013` | batch-audit-api base URL                  |
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

React 18 · TypeScript · Vite · Tailwind CSS · React Router v6 · `@unified-trading/ui-kit` · `@unified-trading/ui-auth`
