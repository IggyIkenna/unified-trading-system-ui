# Route Reference

**Updated 2026-03-21.** Reflects post-Phase 2 cleanup state (commit `8e536fc`).

All platform content now lives under a single canonical tree: `app/(platform)/services/`.
All legacy flat routes are permanent redirects in `next.config.mjs` — no page files exist at those paths.

---

## Route Groups

| Group | URL prefix | Audience |
|---|---|---|
| `(public)/` | `/`, `/login`, `/services/*`, etc. | Unauthenticated |
| `(platform)/` | `/dashboard`, `/services/*`, `/strategies/*` | Authenticated |
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

## Platform Service Routes — The Canonical Content Tree (`(platform)/services/`)

This is where all platform content lives.

### Service Hub

| URL | Purpose |
|---|---|
| `/services/overview` | Service hub — entry after login |
| `/services/[key]` | Dynamic: service detail by registry key |

### Data Service

| URL | Purpose |
|---|---|
| `/services/data/overview` | Data service home |
| `/services/data/coverage` | Data coverage |
| `/services/data/venues` | Venues |
| `/services/data/markets` | Markets |
| `/services/data/markets/pnl` | Market P&L |
| `/services/data/logs` | Data logs |
| `/services/data/missing` | Missing data tracker |

### Trading Service

| URL | Purpose |
|---|---|
| `/services/trading/overview` | Trading service home |
| `/services/trading/accounts` | Accounts |
| `/services/trading/markets` | Markets |
| `/services/trading/orders` | Orders |
| `/services/trading/positions` | Positions |
| `/services/trading/alerts` | Alerts |
| `/services/trading/risk` | Risk |

### Execution Service

| URL | Purpose |
|---|---|
| `/services/execution/overview` | Execution service home |
| `/services/execution/tca` | Transaction cost analysis |
| `/services/execution/venues` | Execution venues |
| `/services/execution/algos` | Execution algorithms |
| `/services/execution/benchmarks` | Benchmarks |
| `/services/execution/candidates` | Candidates |
| `/services/execution/handoff` | Handoff |

### Reports Service

| URL | Purpose |
|---|---|
| `/services/reports/overview` | Reports service home |
| `/services/reports/executive` | Executive report |
| `/services/reports/reconciliation` | Reconciliation |
| `/services/reports/regulatory` | Regulatory reports |
| `/services/reports/settlement` | Settlement |

### Research Service

| URL | Purpose |
|---|---|
| `/services/research/overview` | Research service home |
| `/services/research/quant` | Quant workspace |
| `/services/research/strategy/overview` | Strategy platform home |
| `/services/research/strategy/backtests` | Backtests |
| `/services/research/strategy/candidates` | Candidates |
| `/services/research/strategy/compare` | Compare strategies |
| `/services/research/strategy/heatmap` | Heatmap |
| `/services/research/strategy/handoff` | Handoff to trading |
| `/services/research/strategy/results` | Results |
| `/services/research/ml` | ML platform (redirects to overview) |
| `/services/research/ml/overview` | ML platform home |
| `/services/research/ml/config` | ML configuration |
| `/services/research/ml/experiments` | Experiments list |
| `/services/research/ml/experiments/[id]` | Experiment detail |
| `/services/research/ml/features` | Feature store |
| `/services/research/ml/training` | Training |
| `/services/research/ml/deploy` | Deploy models |
| `/services/research/ml/monitoring` | Model monitoring |
| `/services/research/ml/governance` | Governance |
| `/services/research/ml/registry` | Model registry |
| `/services/research/ml/validation` | Validation |
| `/services/research/execution/algos` | Execution analytics — algos |
| `/services/research/execution/benchmarks` | Execution analytics — benchmarks |
| `/services/research/execution/tca` | Execution analytics — TCA |
| `/services/research/execution/venues` | Execution analytics — venues |

### Observe

| URL | Purpose |
|---|---|
| `/services/observe/news` | News feed |
| `/services/observe/strategy-health` | Strategy health |

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

All old flat and parallel routes redirect permanently to `/services/*`.

| Old URL | → Canonical URL |
|---|---|
| `/overview` | `/services/overview` |
| `/data` | `/services/data/overview` |
| `/trading` | `/services/trading/overview` |
| `/trading/positions` | `/services/trading/positions` |
| `/trading/risk` | `/services/trading/risk` |
| `/trading/alerts` | `/services/trading/alerts` |
| `/trading/markets` | `/services/data/markets` |
| `/trading/markets/:path*` | `/services/data/markets/:path*` |
| `/research` | `/services/research/overview` |
| `/research/strategy/:path*` | `/services/research/strategy/:path*` |
| `/research/ml/:path*` | `/services/research/ml/:path*` |
| `/research/execution/:path*` | `/services/research/execution/:path*` |
| `/ml` | `/services/research/ml` |
| `/ml/:path*` | `/services/research/ml/:path*` |
| `/positions` | `/services/trading/positions` |
| `/risk` | `/services/trading/risk` |
| `/alerts` | `/services/trading/alerts` |
| `/strategy-platform` | `/services/research/strategy/backtests` |
| `/strategy-platform/:path*` | `/services/research/strategy/:path*` |
| `/execution` | `/services/execution/overview` |
| `/execution/:path*` | `/services/execution/:path*` |
| `/reports` | `/services/reports/overview` |
| `/reports/:path*` | `/services/reports/:path*` |
| `/markets` | `/services/data/markets` |
| `/markets/pnl` | `/services/data/markets/pnl` |
| `/executive` | `/services/reports/executive` |
| `/quant` | `/services/research/quant` |
