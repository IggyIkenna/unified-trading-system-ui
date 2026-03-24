# API Services Cluster

**Last updated:** 2026-02-28
**Topological level:** L10 **SSOT:** `unified-trading-pm/workspace-manifest.json` (cluster=api-services)

---

## Overview

The API Services Cluster contains 3 FastAPI repos that sit at topological level L10 — between the Python service tier
(L7/L9) and the React UI tier (L11). They are the HTTP boundary: they proxy service engines, enforce auth, and expose
typed REST/SSE endpoints to UIs.

| Repo                    | Abbrev | Port (dev) | Proxies                        | Serves UIs                                                                                       | Auth                          |
| ----------------------- | ------ | ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| `execution-results-api` | ERA    | 8002       | execution-service              | trading-analytics-ui, live-health-monitor-ui, strategy-ui, execution-analytics-ui, settlement-ui | None (internal)               |
| `market-data-api`       | MDA    | 8004       | market-data-processing-service | trading-analytics-ui                                                                             | None (internal)               |
| `client-reporting-api`  | CRA    | 8003       | pnl-attribution-service output | client-reporting-ui                                                                              | Per-client JWT (Google OAuth) |

> **Note:** `deployment-api` is **not** in this cluster — it sits at L8 (deployment infrastructure). The L10 API
> Services cluster is exclusively the 3 repos above.

---

## Per-Service Reference

### execution-results-api (ERA)

- **GitHub:** https://github.com/IggyIkenna/execution-results-api
- **Status:** active (in-progress)
- **Dev port:** 8002
- **Key routes:**
  - `GET /executions` — execution records
  - `GET /backtests` — backtest run results
  - `GET /analytics` — analytics aggregates
  - `GET /reports` — report exports
- **SSE:** SSE endpoints required (outstanding: `p0-ui-sse`)
- **P0 outstanding:** Replace all `dict[str, Any]` at API boundaries with `TypedDict`/Pydantic models (task:
  `p0-exec-results-api-types`)

### market-data-api (MDA)

- **GitHub:** https://github.com/IggyIkenna/market-data-api
- **Status:** active (in-progress)
- **Dev port:** 8004
- **Key routes:**
  - `GET /stream/orderbook` — SSE orderbook stream
  - `GET /stream/candles` — SSE candle stream
- **Auth:** None (internal network only)
- **Pattern note:** Primary SSE-first API; all primary endpoints are streaming.

### client-reporting-api (CRA)

- **GitHub:** https://github.com/IggyIkenna/client-reporting-api
- **Status:** active (in-progress)
- **Dev port:** 8003
- **Key routes:**
  - `GET /reports` — client report listing and download
  - `GET /clients` — client metadata
  - `GET /portfolio` — portfolio summary
- **Auth:** Per-client JWT via Google OAuth (`GoogleOAuthMiddleware`)
- **Pattern note:** Only API service with external-facing auth; all write endpoints require OAuth.

---

## Shared Pattern

All API services in this cluster conform to the following pattern. Deviations are bugs, not features.

### Architecture

- **Pure FastAPI** — no Python service engine code lives in these repos.
- API services import from unified libraries (`unified_trading_services`, `unified_config_interface`, etc.) but
  **never** import from service repos (e.g., `execution-service`, `market-data-processing-service`). Services are
  proxied over HTTP/internal network.
- Each repo is independently deployable to Cloud Run with its own `cloudbuild.yaml`.

### Type Safety

- All response models are typed `Pydantic` models or `TypedDict`.
- `dict[str, Any]` is **forbidden** at API boundaries — this is a blocking quality gate violation.
- Request bodies: Pydantic models with field validation.

### Auth

- Internal endpoints: no auth (network-level isolation via Cloud Run ingress).
- External/client-facing endpoints: `GoogleOAuthMiddleware` from `unified_trading_services`.

### SSE Streaming

- Real-time streaming endpoints use `sse-starlette`.
- SSE endpoints follow the pattern: `GET /stream/<resource>` returning `EventSourceResponse`.

### Quality Gates and CI/CD

- `scripts/quality-gates.sh` present in every repo.
- `cloudbuild.yaml` follows test-in-image architecture: build Docker image → run quality gates inside image → push only
  on pass. See `06-coding-standards/quality-gates.md`.
- No standalone `basedpyright .` — always `timeout 120 basedpyright <source_dir>/`.

---

## SSOT Cross-References

| Topic                                | Location                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Repo registry (cluster=api-services) | `unified-trading-pm/workspace-manifest.json`                                       |
| UI → API wiring                      | `unified-trading-codex/05-infrastructure/UI-DEPENDENCY-MATRIX.md`                  |
| Runtime topology diagram             | `unified-trading-codex/04-architecture/RUNTIME_DEPLOYMENT_TOPOLOGY_DAG.svg`        |
| Build order (L6 node)                | `unified-trading-codex/04-architecture/WORKSPACE_MANIFEST_DAG.svg`                 |
| Quality gates                        | `unified-trading-codex/06-coding-standards/quality-gates.md`                       |
| Test-in-image CI                     | `unified-trading-codex/06-coding-standards/quality-gates.md` (Cloud Build section) |
| Auth middleware                      | `unified_trading_services.GoogleOAuthMiddleware`                                   |
