# UI Dependency Matrix

**Last Updated:** 2026-02-28  
**SSOT for repo registry:** `unified-trading-pm/workspace-manifest.json`  
**SSOT for API routes:** `deployment-api/api/routes/` (extracted from UTD V3 — see task `deployment-v3-four-way-split`)

---

## UI → API Service Dependencies

| UI Repo                  | Primary API(s)                                                   | OAuth Required            | Dev Port(s) | Key Functionality                                                                              |
| ------------------------ | ---------------------------------------------------------------- | ------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `deployment-ui`          | `deployment-api` (UTDV3 FastAPI)                                 | **Yes** (Google OAuth)    | 8001        | Cloud Build triggers, service restarts, deployment status, shard management, config management |
| `live-health-monitor-ui` | `deployment-api` (`/service-status` routes)                      | No (read-only)            | 8001        | Real-time service health, uptime, manual trading controls, SSE health stream                   |
| `batch-audit-ui`         | `deployment-api` (`/data-status`, `/checklist`, `/log-analysis`) | No (read-only)            | 8001        | Batch job status, audit logs, checklist compliance                                             |
| `logs-dashboard-ui`      | `deployment-api` (`/log-analysis`)                               | No (read-only)            | 8001        | Log streaming, error analysis, deployment history                                              |
| `ml-training-ui`         | `deployment-api` (`/deployments`, ML routes)                     | **Yes** (model push)      | 8001        | ML model deployment, versioning, A/B configs                                                   |
| `trading-analytics-ui`   | `execution-results-api`                                          | No                        | 8002        | P&L attribution, Sharpe ratio, win rate, trade history, backtest analytics                     |
| `strategy-ui`            | `execution-results-api`                                          | No                        | 8002        | Strategy performance, live positions, risk metrics                                             |
| `execution-analytics-ui` | `execution-results-api`                                          | No                        | 8002        | Backtest run management, results browsing, report generation                                   |
| `settlement-ui`          | `execution-results-api`                                          | No                        | 8002        | Settlement data, T+1 reconciliation, execution records                                         |
| `client-reporting-ui`    | `client-reporting-api`                                           | **Yes** (per-client auth) | 8003        | Client P&L reports, portfolio summaries, custom report export                                  |
| `onboarding-ui`          | `deployment-api` (`/config`, `/capabilities`) + Secret Manager   | **Yes** (admin)           | 8001        | New client onboarding, API key setup, credential provisioning                                  |

---

## API Service Endpoints

| API Service                 | Repo                                                             | Type          | Key Routes                                                                                                                                                                    | OAuth                                       | Cloud Run URL pattern                               |
| --------------------------- | ---------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Deployment Orchestrator API | `deployment-api` (standalone repo, imports `deployment-service`) | `api-service` | `/deployments`, `/cloud-builds/trigger`, `/services`, `/service-status`, `/data-status`, `/config`, `/checklist`, `/capabilities`, `/log-analysis`, `/infra/health` (Layer 2) | `GoogleOAuthMiddleware` on all write routes | `https://deployment-api-<hash>-uc.a.run.app`        |
| Execution Results API       | `execution-results-api`                                          | `api-service` | `/executions`, `/backtests`, `/analytics`, `/reports`                                                                                                                         | None (internal)                             | `https://execution-results-api-<hash>-uc.a.run.app` |
| Market Data API             | `market-data-api`                                                | `api-service` | SSE `/stream/orderbook`, `/stream/candles`                                                                                                                                    | None (internal)                             | `https://market-data-api-<hash>-uc.a.run.app`       |
| Client Reporting Service    | `client-reporting-api`                                           | `api-service` | `/reports`, `/clients`, `/portfolio`                                                                                                                                          | Per-client JWT                              | `https://client-reporting-<hash>-uc.a.run.app`      |

---

## Deployment Trigger Flow (OAuth-Gated)

```
User (Google account in allowed domain)
  │
  ▼
deployment-ui  ── HTTPS POST /cloud-builds/trigger ──►  deployment-api
                                                              │
                                                    GoogleOAuthMiddleware
                                                    (unified_trading_services)
                                                              │
                                                    allowed_domains check
                                                              │
                                                              ▼
                                                    Cloud Build API (GCP)
                                                              │
                                                              ▼
                                                    Cloud Run service restart
```

**OAuth gate is in:** `deployment-api/api/auth_middleware.py` (via `GoogleOAuthMiddleware` from
`unified_trading_services`)  
**Allowed domains config:** `deployment-api/api/settings.py`  
**Cloud Build trigger route:** `deployment-api/api/routes/cloud_builds.py` — `POST /trigger`  
**Service restart route:** `deployment-api/api/routes/deployments.py` — `POST /deployments`  
**Infra health route:** `deployment-api/api/routes/infra.py` — `GET /infra/health` (Layer 2 verification)

Any UI can call the deployment trigger endpoint. The OAuth middleware enforces authentication. This is the ONLY path for
production restarts — direct Cloud Build calls are blocked in production.

**Post-deploy validation flow:**

1. `POST /cloud-builds/trigger` → deploy service
2. `GET /infra/health` → Layer 2 (infra verify) must pass
3. Trigger `system-integration-tests` Layer 3a (smoke) → must pass
4. Trigger `system-integration-tests` Layer 3b (full E2E) → marks deployment "healthy"

See SSOT: `06-coding-standards/integration-testing-layers.md`

---

## Local Development Setup

Each UI uses a `.env.local` file to point to local API instances. Copy from `.env.local.example` in each UI repo.

### Port Assignments (local dev)

| Port | Service                                                              |
| ---- | -------------------------------------------------------------------- |
| 8001 | `deployment-api` (UTDV3 FastAPI, `uvicorn api.main:app --port 8001`) |
| 8002 | `execution-results-api` (`uvicorn main:app --port 8002`)             |
| 8003 | `client-reporting-api` (`uvicorn main:app --port 8003`)              |
| 8004 | `market-data-api` (`uvicorn main:app --port 8004`)                   |

### `.env.local` template (UIs calling deployment-api)

```env
# deployment-ui / live-health-monitor-ui / batch-audit-ui / logs-dashboard-ui / ml-training-ui / onboarding-ui
VITE_API_URL=http://localhost:8001
VITE_OAUTH_CLIENT_ID=<google-oauth-client-id>   # from Secret Manager: google-oauth-client-id
VITE_OAUTH_DOMAIN=<your-allowed-domain.com>
VITE_ENV=local
```

### `.env.local` template (UIs calling execution-results-api)

```env
# trading-analytics-ui / strategy-ui / execution-analytics-ui / settlement-ui
VITE_API_URL=http://localhost:8002
VITE_ENV=local
```

### `.env.local` template (client-reporting-ui)

```env
# client-reporting-ui
VITE_API_URL=http://localhost:8003
VITE_ENV=local
```

### Starting all local APIs (quickstart)

```bash
# Terminal 1: Deployment orchestrator API
cd deployment-api && source .venv/bin/activate
uvicorn api.main:app --reload --port 8001

# Terminal 2: Execution results API
cd execution-results-api && source .venv/bin/activate
uvicorn main:app --reload --port 8002

# Terminal 3: Any UI (example: deployment-ui)
cd deployment-ui && npm run dev
# UI will read VITE_API_URL=http://localhost:8001 from .env.local
```

---

## Cloud Deployment (Production)

In Cloud Run, each UI is a static build served behind the API (or via CDN). The `VITE_API_URL` is injected at build time
as a Cloud Build substitution variable:

```yaml
# cloudbuild.yaml (each UI repo)
substitutions:
  _API_URL: "https://deployment-api-${_HASH}-uc.a.run.app"
steps:
  - name: node:20
    args: ["npm", "run", "build"]
    env:
      - "VITE_API_URL=${_API_URL}"
```

After the 4-way split (`deployment-v3-four-way-split`), `deployment-ui` is a standalone React repo. Its static build is
served via CDN or mounted in the `deployment-api` container. The Python orchestrator logic lives in
`deployment-service`, which `deployment-api` imports as a dependency.

---

## Status by UI

| UI Repo                  | Wired Status                       | Blocker Task         |
| ------------------------ | ---------------------------------- | -------------------- |
| `deployment-ui`          | Scaffolded — not wired             | `deployment-ui-wire` |
| `live-health-monitor-ui` | Shell exists — API calls not wired | `ui-local-dev-setup` |
| `trading-analytics-ui`   | Shell exists — SSE not connected   | `p0-ui-sse`          |
| `batch-audit-ui`         | Shell exists — not wired           | `ui-local-dev-setup` |
| `strategy-ui`            | Shell exists — API calls not wired | `ui-local-dev-setup` |
| `ml-training-ui`         | Shell exists — not wired           | `ui-local-dev-setup` |
| `logs-dashboard-ui`      | Shell exists — not wired           | `ui-local-dev-setup` |
| `execution-analytics-ui` | Shell exists — not wired           | `ui-local-dev-setup` |
| `client-reporting-ui`    | Shell exists — not wired           | `ui-local-dev-setup` |
| `settlement-ui`          | Shell exists — not wired           | `ui-local-dev-setup` |
| `onboarding-ui`          | Shell exists — not wired           | `ui-local-dev-setup` |

See `unified-trading-pm/plans/cursor-plans/consolidated_remaining_work.plan.md` for task details.

---

## References

- **Topology DAG:** `04-architecture/TOPOLOGY-DAG.md`
- **Deployment split:** task `deployment-v3-four-way-split`
- **Integration testing layers:** `06-coding-standards/integration-testing-layers.md`
- **Repo registry:** `unified-trading-pm/workspace-manifest.json`
