# Route Reference

**Updated 2026-03-21.** Reflects post-Phase 2 cleanup state (commit `8e536fc`).

All platform content now lives under a single canonical tree: `app/(platform)/service/`.
All legacy flat routes are permanent redirects in `next.config.mjs` — no page files exist at those paths.

---

## Route Groups

| Group | URL prefix | Audience |
|---|---|---|
| `(public)/` | `/`, `/login`, `/services/*`, etc. | Unauthenticated |
| `(platform)/` | `/dashboard`, `/service/*`, `/strategies/*` | Authenticated |
| `(ops)/` | `/admin`, `/devops`, `/compliance`, etc. | Internal operators only |

---

## Public Routes (`(public)/`)

| URL | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Login — Internal/External toggle + 5 demo personas |
| `/signup` | Sign-up — service interest → contact flow |
| `/demo` | Live demo entry |
| `/demo/preview` | Demo feature tour |
| `/contact` | Contact form |
| `/docs` | Public documentation |
| `/investor-relations` | Investor relations |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/services/platform` | Platform service marketing page |
| `/services/execution` | Execution service marketing page |
| `/services/backtesting` | Backtesting service marketing page |
| `/services/data` | Data service marketing page |
| `/services/engagement` | Engagement service marketing page |
| `/services/investment` | Investment service marketing page |
| `/services/regulatory` | Regulatory service marketing page |

---

## Platform Top-Level Routes (`(platform)/`)

| URL | Purpose |
|---|---|
| `/dashboard` | Post-login dashboard (role-aware) |
| `/health` | System health summary |
| `/settings` | User/org settings |
| `/strategies` | Strategy list/grid |
| `/strategies/grid` | Grid view |
| `/strategies/[id]` | Individual strategy detail |
| `/client-portal/[org]` | Org-scoped client portal |
| `/portal` | Client-facing portal |

---

## Platform Service Routes — The Canonical Content Tree (`(platform)/service/`)

This is where all platform content lives.

### Service Hub

| URL | Purpose |
|---|---|
| `/service/overview` | Service hub — entry after login |
| `/service/[key]` | Dynamic: service detail by registry key |

### Data Service

| URL | Purpose |
|---|---|
| `/service/data/overview` | Data service home |
| `/service/data/coverage` | Data coverage |
| `/service/data/venues` | Venues |
| `/service/data/markets` | Markets |
| `/service/data/markets/pnl` | Market P&L |
| `/service/data/logs` | Data logs |
| `/service/data/missing` | Missing data tracker |

### Trading Service

| URL | Purpose |
|---|---|
| `/service/trading/overview` | Trading service home |
| `/service/trading/accounts` | Accounts |
| `/service/trading/markets` | Markets |
| `/service/trading/orders` | Orders |
| `/service/trading/positions` | Positions |
| `/service/trading/alerts` | Alerts |
| `/service/trading/risk` | Risk |

### Execution Service

| URL | Purpose |
|---|---|
| `/service/execution/overview` | Execution service home |
| `/service/execution/tca` | Transaction cost analysis |
| `/service/execution/venues` | Execution venues |
| `/service/execution/algos` | Execution algorithms |
| `/service/execution/benchmarks` | Benchmarks |
| `/service/execution/candidates` | Candidates |
| `/service/execution/handoff` | Handoff |

### Reports Service

| URL | Purpose |
|---|---|
| `/service/reports/overview` | Reports service home |
| `/service/reports/executive` | Executive report |
| `/service/reports/reconciliation` | Reconciliation |
| `/service/reports/regulatory` | Regulatory reports |
| `/service/reports/settlement` | Settlement |

### Research Service

| URL | Purpose |
|---|---|
| `/service/research/overview` | Research service home |
| `/service/research/quant` | Quant workspace |
| `/service/research/strategy/overview` | Strategy platform home |
| `/service/research/strategy/backtests` | Backtests |
| `/service/research/strategy/candidates` | Candidates |
| `/service/research/strategy/compare` | Compare strategies |
| `/service/research/strategy/heatmap` | Heatmap |
| `/service/research/strategy/handoff` | Handoff to trading |
| `/service/research/strategy/results` | Results |
| `/service/research/ml` | ML platform (redirects to overview) |
| `/service/research/ml/overview` | ML platform home |
| `/service/research/ml/config` | ML configuration |
| `/service/research/ml/experiments` | Experiments list |
| `/service/research/ml/experiments/[id]` | Experiment detail |
| `/service/research/ml/features` | Feature store |
| `/service/research/ml/training` | Training |
| `/service/research/ml/deploy` | Deploy models |
| `/service/research/ml/monitoring` | Model monitoring |
| `/service/research/ml/governance` | Governance |
| `/service/research/ml/registry` | Model registry |
| `/service/research/ml/validation` | Validation |
| `/service/research/execution/algos` | Execution analytics — algos |
| `/service/research/execution/benchmarks` | Execution analytics — benchmarks |
| `/service/research/execution/tca` | Execution analytics — TCA |
| `/service/research/execution/venues` | Execution analytics — venues |

### Observe

| URL | Purpose |
|---|---|
| `/service/observe/news` | News feed |
| `/service/observe/strategy-health` | Strategy health |

---

## Ops Routes (`(ops)/`)

| URL | Purpose |
|---|---|
| `/admin` | Admin console |
| `/admin/data` | Data admin |
| `/compliance` | Compliance |
| `/config` | Configuration |
| `/devops` | Deployment console |
| `/engagement` | Engagement management |
| `/internal` | Internal tools |
| `/internal/data-etl` | Data ETL tools |
| `/manage/clients` | Client management |
| `/manage/users` | User management |
| `/manage/fees` | Fee management |
| `/manage/mandates` | Mandate management |
| `/ops` | Ops overview |
| `/ops/jobs` | Jobs |
| `/ops/services` | Services overview |

---

## Permanent Redirects (do not create pages at these paths)

All old flat and parallel routes redirect permanently to `/service/*`.

| Old URL | → Canonical URL |
|---|---|
| `/overview` | `/service/overview` |
| `/data` | `/service/data/overview` |
| `/trading` | `/service/trading/overview` |
| `/trading/positions` | `/service/trading/positions` |
| `/trading/risk` | `/service/trading/risk` |
| `/trading/alerts` | `/service/trading/alerts` |
| `/trading/markets` | `/service/data/markets` |
| `/trading/markets/:path*` | `/service/data/markets/:path*` |
| `/research` | `/service/research/overview` |
| `/research/strategy/:path*` | `/service/research/strategy/:path*` |
| `/research/ml/:path*` | `/service/research/ml/:path*` |
| `/research/execution/:path*` | `/service/research/execution/:path*` |
| `/ml` | `/service/research/ml` |
| `/ml/:path*` | `/service/research/ml/:path*` |
| `/positions` | `/service/trading/positions` |
| `/risk` | `/service/trading/risk` |
| `/alerts` | `/service/trading/alerts` |
| `/strategy-platform` | `/service/research/strategy/backtests` |
| `/strategy-platform/:path*` | `/service/research/strategy/:path*` |
| `/execution` | `/service/execution/overview` |
| `/execution/:path*` | `/service/execution/:path*` |
| `/reports` | `/service/reports/overview` |
| `/reports/:path*` | `/service/reports/:path*` |
| `/markets` | `/service/data/markets` |
| `/markets/pnl` | `/service/data/markets/pnl` |
| `/executive` | `/service/reports/executive` |
| `/quant` | `/service/research/quant` |
