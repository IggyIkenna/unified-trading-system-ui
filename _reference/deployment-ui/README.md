# deployment-ui

**Port:** 5183 | **API:** deployment-api (port 8004) | **Type:** ui-control

Deployment control centre for batch and live services. Operators use this to deploy new versions of any service, monitor
build progress, check service readiness, review config, and access deployment history. Supports both batch pipeline
deployments and live trading service deployments.

## What it does

| Tab            | Purpose                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Deploy         | Submit a new deployment — select service, mode (batch/live), image version, feature branch, date range, and asset scope |
| Data Status    | Data readiness check — which data files are present in GCS for the selected deployment scope and date range             |
| Builds         | Cloud Build run history — trigger status, logs link, commit SHA, duration per build                                     |
| Readiness      | Service readiness probe — checks all services respond healthy before a live deployment proceeds                         |
| Service Status | Live Cloud Run instance status — deployed version, instance count, health per service                                   |
| Config         | Active deployment config viewer — rendered config for the current deployment                                            |
| History        | Historical deployment log — all past deployments with version, status, triggered-by, and timestamps                     |

There is also an **Overview / Epics** top-level tab for workspace-level deployment tracking.

## Architecture

This is a separate repo from the deployment backend per the UI/service separation rule:

- `deployment-service` — Terraform, configs, shard calculator, Cloud Build YAML (no UI code)
- `deployment-api` — FastAPI orchestrator API, SSE progress stream
- `deployment-ui` — This repo. React/TypeScript UI calling `deployment-api` via REST and SSE

## Local dev

```bash
npm install
cp .env.example .env.development   # set VITE_API_URL and VITE_OAUTH_CLIENT_ID
npm run dev                         # http://localhost:5183
```

Static mock mode (no backend needed):

```bash
VITE_MOCK_API=true VITE_SKIP_AUTH=true npm run dev
```

## Environment variables

| Variable               | Default                 | Description                               |
| ---------------------- | ----------------------- | ----------------------------------------- |
| `VITE_API_URL`         | `http://localhost:8004` | deployment-api base URL                   |
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
