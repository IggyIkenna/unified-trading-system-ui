# Versa — Deployment Command Centre

> Institutional-grade trading infrastructure deployment and orchestration console.
> Part of the **Versa** unified operations platform for quantitative trading firms.

---

## What This Is

Versa Deployment Command Centre gives trading infrastructure teams real-time visibility and control over every layer of the trading stack: from cloud build pipelines and service health to data readiness checks and epic tracking.

Built on the same foundations as production — the same components, the same mock infrastructure, the same API surface. Zero-credential mock mode ships by default so teams can evaluate, test, and develop against it instantly.

---

## Architecture

```
Browser
  │
  ├─── VITE_MOCK_API=true  ──►  Mock Interceptor (window.fetch override)
  │                               └── Returns realistic JSON responses for all /api/* routes
  │
  └─── VITE_MOCK_API=false ──►  Vite Dev Server proxy
                                  └── http://localhost:8004  (deployment-service API)
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 19 + TypeScript 5.9 | Type-safe, concurrent rendering |
| Build | Vite 7 + SWC | Sub-second HMR, production-grade bundling |
| Styling | Tailwind CSS v4 | Utility-first, zero runtime overhead |
| Routing | React Router v6 | File-based mental model, lazy loading |
| Charts | Recharts 2 | Composable, accessible trading charts |
| Auth | @unified-trading/ui-auth | Provider-agnostic OAuth 2.0 PKCE (Google + Cognito) |
| UI Primitives | @unified-trading/ui-kit | Accessible, design-system components (Radix UI base) |
| Mock Engine | @unified-admin/core stress | 6 configurable stress-test scenarios |

---

## Monorepo Structure

```
versa-deployment-ui/
├── packages/
│   ├── ui-kit/           @unified-trading/ui-kit v0.1.0
│   │   └── src/          25+ accessible UI components, global CSS design system
│   ├── ui-auth/          @unified-trading/ui-auth v0.2.1
│   │   └── src/          OAuth 2.0 PKCE (Google + Cognito), AuthProvider context
│   └── admin-core/       @unified-admin/core v0.1.0
│       └── src/          API client, stress generators, auth helpers, hooks
├── src/
│   ├── App.tsx           Root component — tab navigation, deployment state machine
│   ├── main.tsx          Entry point — installs mock handlers
│   ├── api/
│   │   ├── client.ts     Typed API client (500+ lines, full deployment API surface)
│   │   └── deploymentApi.ts  Legacy deployment API (builds, trigger, rollback)
│   ├── components/       Feature components (Deploy, History, Data Status, etc.)
│   ├── hooks/            useServices, useHealth, useConfig, useEpics, useDebounce
│   ├── lib/
│   │   └── mock-api.ts   Full interactive mock (900 lines, 40+ API routes)
│   ├── pages/            DeploymentsList, DeployTrigger, DeploymentHistory
│   ├── auth/             Local auth helpers (GoogleAuth, CognitoAuth, RequireAuth)
│   └── types/            Shared TypeScript types (100+ type definitions)
├── index.html
├── package.json          Workspace root + app dependencies
├── vite.config.ts        Build config with source aliases
├── tsconfig.app.json     TypeScript config with path mapping
├── .env.development      Default mock mode (VITE_MOCK_API=true)
└── .env.example          All configurable environment variables
```

---

## Quickstart

### Prerequisites
- Node.js >= 18
- npm >= 8 (workspaces support)

### Install and Run (Mock Mode — No credentials needed)

```bash
git clone https://github.com/IggyIkenna/versa-deployment-ui.git
cd versa-deployment-ui
npm install
npm run dev
# Open http://localhost:5183
```

Mock mode is **on by default** (`.env.development` sets `VITE_MOCK_API=true`).

---

## Mock Mode

All interactive elements return realistic responses in mock mode. No backend required.

### Interactive Coverage

| Feature | Mock Behavior |
|---------|--------------|
| Service list | 10 services with live health/status |
| Deploy (dry run) | Returns shard preview + CLI command |
| Deploy (live) | Returns deployment ID, updates history tab |
| Cloud Build trigger | Returns build job ID (POST /cloud-builds/trigger) |
| Service status | Returns health, last deploy, last build timestamps |
| Data status | Returns completion calendar, missing dates |
| Deployment history | Returns paginated list with status polling |
| Deployment details | Returns shard breakdown, events, VM events |
| Readiness checklist | Returns per-category pass/warn/fail scores |
| Epic tracking | Returns kanban-style epic completion status |
| Config browser | Returns bucket/directory listing stubs |
| Quota info | Returns CPU/memory/instance quota with cost estimate |
| Rollback | Returns rollback initiated response |
| Cancel/Resume | Returns updated deployment state |
| Cache clear | Returns cleared confirmation |

### Stress Scenarios

```bash
VITE_STRESS_SCENARIO=BIG_DRAWDOWN npm run dev     # circuit breakers firing, all deployments failed
VITE_STRESS_SCENARIO=HIGH_CARDINALITY npm run dev  # 500 deployments, 100 services, 2000 positions
VITE_STRESS_SCENARIO=MISSING_DATA npm run dev      # empty service list, empty deployments
VITE_STRESS_SCENARIO=BAD_SCHEMAS npm run dev       # malformed data (NaN, Infinity, invalid dates)
VITE_STRESS_SCENARIO=STALE_DATA npm run dev        # timestamps from 2020, stale market data
VITE_STRESS_SCENARIO=BIG_TICKS npm run dev         # 500 orders/sec, high-frequency tick simulation
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MOCK_API` | `true` | Enables mock interceptor for all /api/* routes |
| `VITE_SKIP_AUTH` | `true` | Bypasses OAuth login gate |
| `VITE_MOCK_DELAY_MS` | `60` | Simulated network latency in ms |
| `VITE_STRESS_SCENARIO` | — | Activates a stress-test scenario |
| `VITE_OAUTH_CLIENT_ID` | — | Google OAuth client ID (production auth) |
| `VITE_COGNITO_CLIENT_ID` | — | AWS Cognito app client ID |
| `VITE_COGNITO_DOMAIN` | — | Cognito Hosted UI domain URL |
| `VITE_COGNITO_REDIRECT_URI` | — | OAuth callback URI |
| `VITE_ONBOARDING_URL` | `http://localhost:5173` | Base URL for venue connection links |
| `API_PORT` | `8004` | Backend API port (dev server proxy) |
| `FRONTEND_PORT` | `5183` | Vite dev server port |

---

## Pages and Tabs

When a service is selected, the UI shows a tabbed interface:

| Tab | Key Features |
|-----|-------------|
| **Deploy** | Date range picker, compute selector (VM / Cloud Run), dry-run preview with shard list, quota info |
| **Status** | Service health audit trail — last data update, last deploy, last build, last code push, anomaly count |
| **History** | Paginated deployment list with status badges, shard progress bars, cancel/resume/retry actions |
| **Builds** | Cloud Build trigger list, one-click build trigger, build history with log URLs |
| **Data Status** | Calendar heatmap, per-category/venue completion percentages, deploy-missing integration |
| **Readiness** | Checklist with pass/warn/fail items across Data Coverage, Build Health, Deployment Readiness |
| **Config** | Cloud storage config browser (bucket/directory tree) |

When no service is selected, the default view shows:

| Tab | Key Features |
|-----|-------------|
| **Overview** | Service grid by tier (data → ingestion → features → ml), health indicators |
| **Epics** | Epic tracking — completion percentage, blocking repos, business gate status |

---

## Internal Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@unified-trading/ui-kit` | 0.1.0 | 25+ accessible UI components (Button, Card, Badge, Dialog, Select, Tabs, AppHeader, MockModeBanner, ErrorBoundary, StatusDot, HealthStatusBar, DeploymentPanel, and more) |
| `@unified-trading/ui-auth` | 0.2.1 | Provider-agnostic OAuth 2.0 PKCE — Google implicit flow + AWS Cognito PKCE. AuthProvider context, RequireAuth guard, useAuthToken hook, authFetch utility |
| `@unified-admin/core` | 0.1.0 | API client factory (createApiClient, createClientConfig, ApiClientError), stress data generators (6 scenarios), auth helpers (PKCE, token management), pagination hooks |

All packages are vendored in `packages/` — zero external workspace dependencies.
The packages point directly to their `src/` directories; Vite handles TypeScript compilation via source aliases.

---

## Development

```bash
npm run dev          # start dev server at :5183
npm run build        # production build (tsc + vite)
npm run typecheck    # TypeScript type check only
npm run test         # run unit tests (vitest)
npm run test:watch   # watch mode
npm run lint         # ESLint
```

---

## Testing

### Unit Tests

```bash
npm test               # vitest run
npm run test:coverage  # with coverage report
```

### Visual Smoke Test (Mock Mode)

```bash
npm run dev
# 1. Open http://localhost:5183
# 2. Select "instruments-service" from the service list
# 3. Navigate through Deploy, Status, History, Builds, Data Status, Readiness, Config tabs
# 4. Trigger a dry-run deploy — verify shard preview appears
# 5. Trigger a live deploy — verify it redirects to History tab
# 6. Click a deployment in History — verify detail panel opens
# 7. Switch to no-service view — verify Overview and Epics tabs load
```

---

## Auth (Production Mode)

When `VITE_MOCK_API=false`, set `VITE_SKIP_AUTH=false` to enforce authentication:

**Google (implicit flow)**:
```bash
VITE_OAUTH_CLIENT_ID=your-client-id
VITE_SKIP_AUTH=false
```

**Cognito (PKCE)**:
```bash
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_DOMAIN=https://your-domain.auth.region.amazoncognito.com
VITE_SKIP_AUTH=false
```

Auth tokens are stored in `sessionStorage` (not localStorage) and never in source code.
The `dev_token` bypass is only active when `VITE_SKIP_AUTH=true`.

---

## Security

- No secrets in source — credentials via environment variables only
- Auth tokens stored in `sessionStorage` (not localStorage)
- `Authorization: Bearer <token>` enforced on all production API requests via `authFetch`
- No direct cloud SDK access in the UI layer — all cloud operations go through the backend API
- Mock interceptor is compile-time gated: only installed when `VITE_MOCK_API=true`
- CSP-safe: no `eval`, no inline scripts beyond the Vite entry point

---

## Contributing

1. `npm run typecheck` — must pass
2. `npm run lint` — must pass
3. `npm test` — must pass
4. Keep mock handlers in `src/lib/mock-api.ts` in sync with any new API routes
5. No `any` types — use specific types from `src/types/index.ts` or `@unified-admin/core`
6. All new interactive UI elements must have a corresponding mock handler returning a plausible response
