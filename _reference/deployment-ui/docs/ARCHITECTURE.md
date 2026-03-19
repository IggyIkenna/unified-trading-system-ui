# deployment-ui — Architecture

## Purpose

React 18 operations dashboard for the deployment system — provides 8-tab interface over `deployment-api`
for managing deployments, monitoring build status, checking service readiness, and inspecting config.

## Tab Structure

| Tab          | Route           | Purpose                                                           |
| ------------ | --------------- | ----------------------------------------------------------------- |
| Deploy       | `/deploy`       | Submit new deployments, select services/versions                  |
| Data Status  | `/data-status`  | GCS data freshness check per service                              |
| Builds       | `/builds`       | Cloud Build history and status                                    |
| Readiness    | `/readiness`    | Pre-deployment checklist: QG/health/data gates                    |
| Status       | `/status`       | Live service health across all deployed services                  |
| Config       | `/config`       | View/edit deployment configs (venues.yaml, runtime-topology.yaml) |
| Config Store | `/config-store` | Key-value runtime config (ConfigStore)                            |
| History      | `/history`      | Deployment history, rollback actions                              |

## Component Structure

```
src/
├── pages/
│   ├── DeployPage.tsx
│   ├── DataStatusPage.tsx
│   ├── BuildsPage.tsx
│   ├── ReadinessPage.tsx
│   ├── StatusPage.tsx
│   ├── ConfigPage.tsx
│   ├── ConfigStorePage.tsx
│   └── HistoryPage.tsx
├── components/
│   ├── auth/
│   │   └── RequireAuth.tsx      # Google OAuth gate
│   ├── ui/                      # Radix UI + Tailwind primitives
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   └── Tabs.tsx
│   └── deployment/
│       ├── ServiceStatusCard.tsx  # Health status per service (Lucide icons)
│       ├── BuildRow.tsx
│       └── ReadinessChecklist.tsx
├── api/
│   └── deploymentApi.ts         # Typed fetch wrappers for deployment-api
└── hooks/
    └── useServiceStatus.ts      # Polling hook for live status updates
```

## API Integration

All calls go to `deployment-api` at `VITE_DEPLOYMENT_API_URL` (default: `http://localhost:8004`).

Key endpoints consumed:

- `POST /deployments` — trigger deployment
- `GET /deployments` — history
- `GET /services/status` — live health
- `GET /builds` — Cloud Build history
- `GET /config-store` — runtime config KV

## Auth

Google OAuth via `RequireAuth` component — same pattern as strategy-ui.
All API calls include `Authorization: Bearer {token}` header.

## Tech Stack

- React 18 + TypeScript + Vite
- Radix UI — accessible component primitives
- Tailwind CSS — utility-first styling
- Lucide React — icon set
- React Query — server state + polling
