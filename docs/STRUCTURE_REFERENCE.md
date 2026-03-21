# _reference/ — Backend Reference Implementations

The `_reference/` folder contains complete Python FastAPI backend service implementations and supporting documentation. These are reference material — they exist so UI developers and agents can understand the real backend contracts and patterns without accessing other repos.

**Do not modify anything in `_reference/`.** Do not import from it. Do not treat it as local Python code. It is documentation in code form.

---

## Why This Folder Exists

The UI makes API calls that are backed by real Python services. When building or debugging a UI feature, it helps to know:
- What exactly the API endpoint does
- What validation the backend applies
- What mock data the backend returns in mock mode
- What RBAC roles are required
- What background jobs run alongside the API

`_reference/` answers these questions without requiring access to the separate backend repos.

---

## What Is In Here

```
_reference/
├── README.md                        How to use this folder
├── REFERENCE_MAPPING.md             Maps UI features to the reference service that backs them
│
├── deployment-api/                  FastAPI service — deployment management API
├── deployment-service/              Core deployment orchestration service
│
└── versa-*/                         Specialised service UIs and backends
    ├── versa-admin-ui/              Admin UI (auth management, cloud integrations)
    ├── versa-audit-ui/              Audit/compliance UI
    ├── versa-client-reporting/      Client reporting service
    ├── versa-execution-analytics-ui/ Execution analytics UI
    ├── versa-invoicing/             Invoicing and fee calculation
    └── versa-onboarding/            Client onboarding portal
```

---

## deployment-api/ — The Primary Backend Reference

The most important reference for UI development. This is the FastAPI service that the `hooks/deployment/` hooks and `components/ops/deployment/` components call.

### Package structure

```
deployment-api/
├── deployment_api/
│   ├── main.py                 FastAPI app entry point — router registration
│   ├── app_config.py           Application config loading
│   ├── auth.py                 JWT auth: token validation, user extraction
│   ├── auth_middleware.py      Auth middleware — applies to all routes
│   ├── rbac.py                 Role-based access control definitions and enforcement
│   ├── settings.py             Environment variable config (GCS bucket, mock mode flag)
│   ├── mock_data.py            Static mock responses — what the API returns in mock mode
│   ├── mock_state.py           In-memory mock state (tracks deployment state in mock mode)
│   ├── background_sync.py      Background task: syncs state from GCS periodically
│   ├── middleware.py           CORS, request logging, error formatting middleware
│   ├── metrics.py              Prometheus metrics definitions
│   ├── lifespan.py             FastAPI lifespan events (startup/shutdown)
│   ├── config_loader.py        Loads service configs from GCS
│   │
│   ├── clients/
│   │   └── deployment_service_client.py   HTTP client for the deployment-service
│   │
│   ├── routes/                 API endpoint handlers
│   │   ├── builds.py           GET /builds — build artefact listing
│   │   ├── capabilities.py     GET /capabilities — platform feature flags
│   │   ├── checklist.py        GET/POST /checklist — deployment readiness checklist
│   │   ├── cloud_builds.py     GET /cloud-builds — Cloud Build run history
│   │   ├── commentary.py       GET/POST /commentary — deployment commentary/notes
│   │   ├── config.py           GET/PUT /config — service configuration
│   │   ├── config_management.py GET /configs — all service configs
│   │   ├── deployments.py      GET/POST /deployments — deployment CRUD
│   │   ├── epics.py            GET /epics — epic readiness data
│   │   ├── services.py         GET /services — service registry
│   │   ├── service_status.py   GET /services/{key}/status — per-service health
│   │   ├── data_status.py      GET /data-status — data coverage by service
│   │   ├── user_management.py  GET/POST /users, /organisations
│   │   ├── shard_management.py GET /shards — shard configuration
│   │   └── sports_venues.py    GET /sports-venues — sports venue list
│   │
│   ├── services/               Business logic layer
│   │   ├── data_status_service.py   Aggregates data coverage across services
│   │   ├── deployment_manager.py    Orchestrates deployment lifecycle
│   │   ├── deployment_state.py      Deployment state machine
│   │   ├── event_processor.py       Processes deployment events
│   │   ├── state_manager.py         Manages in-memory + GCS state
│   │   └── sync_service.py          Syncs state from GCS to memory
│   │
│   ├── utils/                  Utilities
│   │   ├── cache.py             In-memory cache with TTL
│   │   ├── cloud_storage_client.py  GCS client wrapper
│   │   ├── config_validation.py     Config field validation
│   │   ├── deployment_events.py     Event emission helpers
│   │   └── artifact_registry.py    Artifact Registry client
│   │
│   └── workers/                Background workers
│       ├── auto_sync.py         Auto-sync worker — polls GCS for state changes
│       ├── deployment_processor.py  Processes queued deployment jobs
│       └── deployment_worker.py     Worker that executes deployment steps
│
└── docs/
    ├── ARCHITECTURE.md          Service architecture overview
    ├── CONFIGURATION.md         Environment variable reference
    ├── DEPLOYMENT_GUIDE.md      How to deploy the service
    ├── GCS_PATHS.md             All GCS bucket paths used
    ├── SCHEMA_VALIDATION.md     Request/response validation rules
    └── TESTING.md               How to run tests
```

### Key things to read in deployment-api/

| You need to know | Read |
|---|---|
| What auth headers the API needs | `deployment_api/auth.py` |
| What roles can access which endpoints | `deployment_api/rbac.py` |
| What mock data is returned in mock mode | `deployment_api/mock_data.py` |
| What the `/services` endpoint returns | `deployment_api/routes/services.py` |
| What the `/deployments` endpoint returns | `deployment_api/routes/deployments.py` |
| What config fields are available | `deployment_api/routes/config_management.py` |
| GCS paths used by the backend | `deployment_api/docs/GCS_PATHS.md` |

---

## deployment-service/ — Deployment Orchestration Documentation

Not a runnable service in this repo — this subfolder contains architectural documentation for the core deployment orchestration service.

```
deployment-service/
├── ARCHITECTURE.md              How deployment orchestration works
├── README.md
└── configs/
    ├── README.md
    ├── BUCKET_CONFIG_SCHEMA.md  GCS bucket configuration schema
    └── RUNTIME_TOPOLOGY_DECISIONS.md  Architectural decisions log
```

Read `ARCHITECTURE.md` before building any deployment workflow UI to understand how deployments are orchestrated end-to-end.

---

## versa-* Services — Client-Facing Product Backends

These are the backends for client-facing products. The UI surfaces for these live both in the `(platform)/portal/` routes and the `(ops)/` routes.

| Service | What it does | Related UI |
|---|---|---|
| `versa-admin-ui/` | Admin dashboard: org management, cloud integration status | `(ops)/admin/` |
| `versa-audit-ui/` | Audit log, event history, compliance evidence | `(ops)/compliance/` |
| `versa-client-reporting/` | Client portfolio performance, statements, downloads | `(platform)/portal/` |
| `versa-execution-analytics-ui/` | Fill analysis, slippage, venue comparison | `(platform)/execution/tca/` |
| `versa-invoicing/` | Fee calculation, invoice generation, payment tracking | `(ops)/manage/fees/` |
| `versa-onboarding/` | KYC, IMA signing, client account activation | `(ops)/manage/clients/` |

For each versa service, read its README to understand the API surface before building the corresponding UI feature.

---

## How to Use This Folder Effectively

### Pattern: "I need to add a new field to the deploy form"
1. Open `deployment_api/routes/deployments.py` — find the POST endpoint
2. Check the request body schema to see what fields exist
3. Check `deployment_api/mock_data.py` to add the field to mock responses
4. Update `lib/mocks/handlers/deployment.ts` to return the new field
5. Update `lib/<domain>-types.ts` with the new TypeScript type
6. Update the component in `components/ops/deployment/DeployForm.tsx`

### Pattern: "I need to understand what service health data looks like"
1. Open `deployment_api/routes/service_status.py`
2. Read the response model (Pydantic class) — this is the exact shape
3. Check `deployment_api/mock_data.py` for example values
4. The TypeScript type should match this shape — check `lib/types/deployment.ts`

### Pattern: "I need to know what RBAC roles the API enforces"
1. Open `deployment_api/rbac.py`
2. Find the role definitions and which endpoints each role can access
3. The UI's role checks in `components/shell/require-auth.tsx` and the auth store should align

---

## Important: Do Not Modify

These files are reference material from backend repos. Edits made here:
- Will be overwritten when context is refreshed
- Will not affect the real backend service
- Will cause confusion for future agents

If you find an error in the backend logic or want to propose a change, the fix belongs in the backend service repo, not here.
