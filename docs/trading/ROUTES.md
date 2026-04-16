# Route Reference

**Updated 2026-04-16.** Generated from actual `page.tsx` files in the codebase.

All platform content lives under `app/(platform)/services/`.
Legacy flat routes are permanent redirects in `next.config.mjs`.

---

## Route Groups

| Group         | URL prefix                        | Audience                |
| ------------- | --------------------------------- | ----------------------- |
| `(public)/`   | `/`, `/login`, `/signup`, etc.    | Unauthenticated         |
| `(platform)/` | `/dashboard`, `/services/*`       | Authenticated           |
| `(ops)/`      | `/admin`, `/devops`, `/ops`, etc. | Internal operators only |

---

## Public Routes (`(public)/`)

| URL                     | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `/`                     | Landing page                                     |
| `/login`                | Login — Internal/External toggle + demo personas |
| `/signup`               | Sign-up — service interest → contact flow        |
| `/pending`              | Pending approval                                 |
| `/demo`                 | Live demo entry                                  |
| `/demo/preview`         | Demo feature tour                                |
| `/contact`              | Contact form                                     |
| `/docs`                 | Public documentation                             |
| `/privacy`              | Privacy policy                                   |
| `/terms`                | Terms of service                                 |
| `/services/platform`    | Platform marketing page                          |
| `/services/backtesting` | Backtesting marketing page                       |
| `/services/data`        | Data marketing page                              |
| `/services/investment`  | Investment marketing page                        |
| `/services/regulatory`  | Regulatory marketing page                        |

---

## Platform Top-Level Routes (`(platform)/`)

| URL                   | Purpose                           |
| --------------------- | --------------------------------- |
| `/dashboard`          | Post-login dashboard (role-aware) |
| `/investor-relations` | Investor relations                |
| `/onboarding`         | User onboarding flow              |
| `/settings`           | User/org settings                 |

---

## Platform Service Routes (`(platform)/services/`)

### Trading Service (31 routes)

**Common tabs** (all users):

| URL                                  | Purpose                       |
| ------------------------------------ | ----------------------------- |
| `/services/trading/overview`         | Trading service home          |
| `/services/trading/terminal`         | Multi-panel trading workspace |
| `/services/trading/positions`        | Positions                     |
| `/services/trading/positions/trades` | Trade history for positions   |
| `/services/trading/orders`           | Orders                        |
| `/services/trading/alerts`           | Alerts                        |
| `/services/trading/book`             | Book / trade blotter          |
| `/services/trading/accounts`         | Accounts                      |
| `/services/trading/accounts/saft`    | SAFT agreements               |
| `/services/trading/pnl`              | P&L breakdown                 |
| `/services/trading/risk`             | Risk                          |
| `/services/trading/markets`          | Markets                       |
| `/services/trading/instructions`     | Instructions / audit trail    |

**Strategy tabs** (per-domain entitlements):

| URL                                             | Purpose                    | Entitlement           |
| ----------------------------------------------- | -------------------------- | --------------------- |
| `/services/trading/strategies`                  | Strategy families home     | `strategy-families`   |
| `/services/trading/strategies/grid`             | Strategy grid view         | `strategy-families`   |
| `/services/trading/strategies/[id]`             | Individual strategy detail | `strategy-families`   |
| `/services/trading/strategies/basis-trade`      | Basis trade strategy       | `strategy-families`   |
| `/services/trading/strategies/staked-basis`     | Staked basis strategy      | `strategy-families`   |
| `/services/trading/strategies/model-portfolios` | Model portfolios           | `strategy-families`   |
| `/services/trading/defi`                        | DeFi operations            | `defi-bundles`        |
| `/services/trading/defi/staking`                | DeFi staking               | `defi-staking`        |
| `/services/trading/options`                     | Options & futures          | `options-trading`     |
| `/services/trading/options/combos`              | Options combo builder      | `options-trading`     |
| `/services/trading/options/pricing`             | Options pricing            | `options-trading`     |
| `/services/trading/sports`                      | Sports trading             | `sports-trading`      |
| `/services/trading/sports/accumulators`         | Sports accumulators        | `sports-trading`      |
| `/services/trading/sports/bet`                  | Bet placement              | `sports-trading`      |
| `/services/trading/predictions`                 | Prediction markets         | `predictions-trading` |
| `/services/trading/predictions/aggregators`     | Prediction aggregators     | `predictions-trading` |
| `/services/trading/bundles`                     | Bundles & combos           | `execution-basic`     |

**Custom workspaces:**

| URL                             | Purpose                       |
| ------------------------------- | ----------------------------- |
| `/services/trading/custom/[id]` | User-defined custom workspace |

### Data Service (12 routes)

| URL                          | Purpose              |
| ---------------------------- | -------------------- |
| `/services/data/overview`    | Data service home    |
| `/services/data/coverage`    | Data coverage        |
| `/services/data/events`      | Data events          |
| `/services/data/gaps`        | Data gaps            |
| `/services/data/instruments` | Instrument catalogue |
| `/services/data/logs`        | Data logs            |
| `/services/data/markets/pnl` | Market P&L           |
| `/services/data/missing`     | Missing data tracker |
| `/services/data/processing`  | Data processing      |
| `/services/data/raw`         | Raw data             |
| `/services/data/valuation`   | Valuation            |
| `/services/data/venues`      | Venues               |

### Execution Service (7 routes)

| URL                                 | Purpose                     |
| ----------------------------------- | --------------------------- |
| `/services/execution/overview`      | Execution service home      |
| `/services/execution/[executionId]` | Individual execution detail |
| `/services/execution/algos`         | Execution algorithms        |
| `/services/execution/benchmarks`    | Benchmarks                  |
| `/services/execution/candidates`    | Candidates                  |
| `/services/execution/handoff`       | Handoff                     |
| `/services/execution/venues`        | Execution venues            |

### Research Service (20 routes)

| URL                                      | Purpose                  |
| ---------------------------------------- | ------------------------ |
| `/services/research`                     | Research (redirects)     |
| `/services/research/overview`            | Research service home    |
| `/services/research/quant`               | Quant workspace          |
| `/services/research/features`            | Feature store            |
| `/services/research/feature-etl`         | Feature ETL              |
| `/services/research/signals`             | Signals                  |
| `/services/research/strategies`          | Strategy research        |
| `/services/research/execution`           | Execution analytics      |
| `/services/research/strategy/overview`   | Strategy platform home   |
| `/services/research/strategy/backtests`  | Backtests                |
| `/services/research/strategy/candidates` | Candidates               |
| `/services/research/strategy/compare`    | Compare strategies       |
| `/services/research/strategy/heatmap`    | Heatmap                  |
| `/services/research/strategy/handoff`    | Handoff to trading       |
| `/services/research/strategy/results`    | Results                  |
| `/services/research/strategy/sports`     | Sports strategy research |
| `/services/research/ml`                  | ML platform              |
| `/services/research/ml/analysis`         | ML analysis              |
| `/services/research/ml/registry`         | Model registry           |
| `/services/research/ml/training`         | Training                 |

### Reports Service (12 routes)

| URL                                 | Purpose                   |
| ----------------------------------- | ------------------------- |
| `/services/reports/overview`        | Reports service home      |
| `/services/reports/analytics`       | Analytics                 |
| `/services/reports/executive`       | Executive report          |
| `/services/reports/fund-operations` | Fund operations           |
| `/services/reports/ibor`            | Investment book of record |
| `/services/reports/invoices`        | Invoices                  |
| `/services/reports/nav`             | NAV                       |
| `/services/reports/performance`     | Performance               |
| `/services/reports/reconciliation`  | Reconciliation            |
| `/services/reports/regulatory`      | Regulatory reports        |
| `/services/reports/settlement`      | Settlement                |
| `/services/reports/trades`          | Trades                    |

### Observe Service (7 routes)

| URL                                 | Purpose          | Note                          |
| ----------------------------------- | ---------------- | ----------------------------- |
| `/services/observe/alerts`          | Alerts           | Thin wrapper → trading/alerts |
| `/services/observe/health`          | System health    |                               |
| `/services/observe/news`            | News feed        |                               |
| `/services/observe/registry`        | Service registry |                               |
| `/services/observe/risk`            | Risk             | Thin wrapper → trading/risk   |
| `/services/observe/scenarios`       | Scenarios        |                               |
| `/services/observe/strategy-health` | Strategy health  |                               |

### Promote Service (10 routes)

| URL                                     | Purpose               |
| --------------------------------------- | --------------------- |
| `/services/promote`                     | Promote service home  |
| `/services/promote/capital-allocation`  | Capital allocation    |
| `/services/promote/champion`            | Champion / challenge  |
| `/services/promote/data-validation`     | Data validation       |
| `/services/promote/execution-readiness` | Execution readiness   |
| `/services/promote/governance`          | Governance            |
| `/services/promote/model-assessment`    | Model assessment      |
| `/services/promote/paper-trading`       | Paper trading         |
| `/services/promote/pipeline`            | Pipeline              |
| `/services/promote/risk-stress`         | Risk & stress testing |

### Manage (6 routes)

| URL                              | Purpose             |
| -------------------------------- | ------------------- |
| `/services/manage/clients`       | Client management   |
| `/services/manage/compliance`    | Compliance          |
| `/services/manage/fees`          | Fee management      |
| `/services/manage/mandates`      | Mandate management  |
| `/services/manage/users`         | User management     |
| `/services/manage/users/request` | User access request |

---

## Ops Routes (`(ops)/`)

| URL                          | Purpose               |
| ---------------------------- | --------------------- |
| `/admin`                     | Admin console         |
| `/admin/data`                | Data admin            |
| `/admin/organizations/[id]`  | Organization detail   |
| `/admin/users`               | User management       |
| `/admin/users/catalogue`     | User catalogue        |
| `/admin/users/firebase`      | Firebase user sync    |
| `/admin/users/health-checks` | User health checks    |
| `/admin/users/onboard`       | User onboarding       |
| `/admin/users/requests`      | Access requests       |
| `/admin/users/templates`     | User templates        |
| `/admin/users/[id]`          | User detail           |
| `/admin/users/[id]/modify`   | Modify user           |
| `/admin/users/[id]/offboard` | Offboard user         |
| `/approvals`                 | Approval workflows    |
| `/config`                    | Configuration         |
| `/devops`                    | Deployment console    |
| `/devops/schemas`            | Schema browser        |
| `/devops/topology`           | Service topology      |
| `/engagement`                | Engagement management |
| `/internal`                  | Internal tools        |
| `/internal/data-etl`         | Data ETL tools        |
| `/ops`                       | Ops overview          |
| `/ops/jobs`                  | Jobs                  |
| `/ops/services`              | Services overview     |

---

## Permanent Redirects (do not create pages at these paths)

All old flat and parallel routes redirect permanently to `/services/*`.

| Old URL                      | → Canonical URL                         |
| ---------------------------- | --------------------------------------- |
| `/overview`                  | `/services/overview`                    |
| `/data`                      | `/services/data/overview`               |
| `/trading`                   | `/services/trading/overview`            |
| `/trading/positions`         | `/services/trading/positions`           |
| `/trading/risk`              | `/services/trading/risk`                |
| `/trading/alerts`            | `/services/trading/alerts`              |
| `/trading/markets`           | `/services/data/markets`                |
| `/trading/markets/:path*`    | `/services/data/markets/:path*`         |
| `/research`                  | `/services/research/overview`           |
| `/research/strategy/:path*`  | `/services/research/strategy/:path*`    |
| `/research/ml/:path*`        | `/services/research/ml/:path*`          |
| `/research/execution/:path*` | `/services/research/execution/:path*`   |
| `/ml`                        | `/services/research/ml`                 |
| `/ml/:path*`                 | `/services/research/ml/:path*`          |
| `/positions`                 | `/services/trading/positions`           |
| `/risk`                      | `/services/trading/risk`                |
| `/alerts`                    | `/services/trading/alerts`              |
| `/strategy-platform`         | `/services/research/strategy/backtests` |
| `/strategy-platform/:path*`  | `/services/research/strategy/:path*`    |
| `/execution`                 | `/services/execution/overview`          |
| `/execution/:path*`          | `/services/execution/:path*`            |
| `/reports`                   | `/services/reports/overview`            |
| `/reports/:path*`            | `/services/reports/:path*`              |
| `/markets`                   | `/services/data/markets`                |
| `/markets/pnl`               | `/services/data/markets/pnl`            |
| `/executive`                 | `/services/reports/executive`           |
| `/quant`                     | `/services/research/quant`              |
