# Route Coverage Matrix

**Generated:** 2026-03-21 | **Source:** Phase 1 Audit

This matrix shows every route in the system with its coverage across all navigation layers.

## Legend

- **Page**: ✓ = page.tsx exists, ✗ = missing
- **Tab Set**: Which *_TABS constant includes this route (or — if none)
- **Tab Rendered**: ✓ = a layout.tsx imports and renders this tab set, ✗ = tab set exists but no layout uses it
- **routeMappings**: ✓ = entry in lifecycle-mapping.ts routeMappings array, ✗ = missing
- **Stage**: primaryStage from routeMappings (or ? if unmapped)
- **Entitlement**: requiredEntitlement from tab definition (or — if none)

---

## Service Routes

### /service/data/* (Acquire)

| Route | Page | Tab Set | Tab Rendered | routeMappings | Stage | Entitlement |
|-------|------|---------|-------------|---------------|-------|-------------|
| `/service/data/overview` | ✓ | DATA_TABS | ✓ | ✓ | acquire | — |
| `/service/data/coverage` | ✓ | DATA_TABS | ✓ | ✗ | ? | — |
| `/service/data/missing` | ✓ | DATA_TABS | ✓ | ✗ | ? | — |
| `/service/data/venues` | ✓ | DATA_TABS | ✓ | ✗ | ? | — |
| `/service/data/markets` | ✓ | DATA_TABS | ✓ | ✓ | acquire | — |
| `/service/data/logs` | ✓ | DATA_TABS | ✓ | ✗ | ? | — |
| `/service/data/markets/pnl` | ✓ | — | — | ✗ | ? | — |

### /service/research/* (Build)

| Route | Page | Tab Set | Tab Rendered | routeMappings | Stage | Entitlement |
|-------|------|---------|-------------|---------------|-------|-------------|
| `/service/research/overview` | ✓ | BUILD_TABS | ✓ | ✓ | build | — |
| `/service/research/ml` | ✓ | BUILD_TABS | ✓ | ✓ | build | ml-full |
| `/service/research/ml/features` | ✓ | BUILD_TABS | ✓ | ✓ | build | ml-full |
| `/service/research/ml/validation` | ✓ | BUILD_TABS | ✓ | ✓ | build | ml-full |
| `/service/research/strategy/backtests` | ✓ | BUILD_TABS | ✓ | ✓ | build | strategy-full |
| `/service/research/strategy/compare` | ✓ | BUILD_TABS | ✓ | ✓ | build | strategy-full |
| `/service/research/execution/algos` | ✓ | BUILD_TABS | ✓ | ✓ | build | execution-basic |
| `/service/research/ml/overview` | ✓ | — | — | ✓ | build | — |
| `/service/research/ml/experiments` | ✓ | — | — | ✓ | build | — |
| `/service/research/ml/experiments/[id]` | ✓ | — | — | ✗ | ? | — |
| `/service/research/ml/training` | ✓ | — | — | ✓ | build | — |
| `/service/research/ml/registry` | ✓ | — | — | ✓ | build | — |
| `/service/research/ml/monitoring` | ✓ | — | — | ✓ | observe | — |
| `/service/research/ml/deploy` | ✓ | — | — | ✓ | promote | — |
| `/service/research/ml/governance` | ✓ | — | — | ✓ | manage | — |
| `/service/research/ml/config` | ✓ | — | — | ✗ | ? | — |
| `/service/research/strategy/candidates` | ✓ | PROMOTE_TABS | ✗ | ✓ | promote | — |
| `/service/research/strategy/handoff` | ✓ | PROMOTE_TABS | ✗ | ✓ | promote | — |
| `/service/research/strategy/overview` | ✓ | — | — | ✗ | ? | — |
| `/service/research/strategy/results` | ✓ | — | — | ✓ | build | — |
| `/service/research/strategy/heatmap` | ✓ | — | — | ✓ | build | — |
| `/service/research/execution/tca` | ✓ | PROMOTE_TABS | ✗ | ✓ | observe | — |
| `/service/research/execution/venues` | ✓ | — | — | ✓ | build | — |
| `/service/research/execution/benchmarks` | ✓ | — | — | ✓ | build | — |
| `/service/research/quant` | ✓ | — | — | ✗ | ? | — |

### /service/trading/* (Run / Observe / Promote)

| Route | Page | Tab Set(s) | Tab Rendered | routeMappings | Stage | Entitlement |
|-------|------|-----------|-------------|---------------|-------|-------------|
| `/service/trading/overview` | ✓ | TRADING_TABS | ✓ | ✓ | run | — |
| `/service/trading/positions` | ✓ | TRADING_TABS | ✓ | ✓ | run | — |
| `/service/trading/orders` | ✓ | TRADING_TABS | ✓ | ✗ | ? | — |
| `/service/trading/accounts` | ✓ | TRADING_TABS | ✓ | ✗ | ? | — |
| `/service/trading/markets` | ✓ | TRADING_TABS | ✓ | ✗ | ? | — |
| `/service/trading/risk` | ✓ | PROMOTE_TABS, OBSERVE_TABS | ✗ | ✓ | observe | — |
| `/service/trading/alerts` | ✓ | OBSERVE_TABS | ✗ | ✓ | observe | — |

### /service/execution/* (Run)

| Route | Page | Tab Set(s) | Tab Rendered | routeMappings | Stage | Entitlement |
|-------|------|-----------|-------------|---------------|-------|-------------|
| `/service/execution/overview` | ✓ | TRADING_TABS, EXECUTION_TABS | ✓ | ✓ | run | — |
| `/service/execution/algos` | ✓ | EXECUTION_TABS | ✓ | ✓ | build | — |
| `/service/execution/venues` | ✓ | EXECUTION_TABS | ✓ | ✓ | build | — |
| `/service/execution/tca` | ✓ | EXECUTION_TABS | ✓ | ✓ | observe | — |
| `/service/execution/benchmarks` | ✓ | EXECUTION_TABS | ✓ | ✗ | ? | — |
| `/service/execution/candidates` | ✓ | — | — | ✗ | ? | — |
| `/service/execution/handoff` | ✓ | — | — | ✗ | ? | — |

### /service/observe/* (Observe)

| Route | Page | Tab Set | Tab Rendered | routeMappings | Stage | Entitlement |
|-------|------|---------|-------------|---------------|-------|-------------|
| `/service/observe/news` | ✓ | OBSERVE_TABS | ✗ | ✗ | ? | — |
| `/service/observe/strategy-health` | ✓ | OBSERVE_TABS | ✗ | ✗ | ? | — |

### /service/reports/* (Report)

| Route | Page | Tab Set | Tab Rendered | routeMappings | Stage | Entitlement |
|-------|------|---------|-------------|---------------|-------|-------------|
| `/service/reports/overview` | ✓ | REPORTS_TABS | ✓ | ✓ | report | — |
| `/service/reports/executive` | ✓ | REPORTS_TABS | ✓ | ✓ | report | — |
| `/service/reports/settlement` | ✓ | REPORTS_TABS | ✓ | ✗ | ? | — |
| `/service/reports/reconciliation` | ✓ | REPORTS_TABS | ✓ | ✗ | ? | — |
| `/service/reports/regulatory` | ✓ | REPORTS_TABS | ✓ | ✗ | ? | — |

---

## Standalone Platform Routes

| Route | Page | Tab Set | routeMappings | Stage |
|-------|------|---------|---------------|-------|
| `/dashboard` | ✓ | — | ✓ | run |
| `/health` | ✓ | OBSERVE_TABS (✗ not rendered) | ✓ | observe |
| `/service/overview` | ✓ | — | ✓ | run |
| `/service/[key]` | ✓ | — | ✗ | ? |
| `/data` | ✓ | — | ✗ | ? |
| `/settings` | ✓ | — | ✗ | ? |
| `/strategies` | ✓ | — | ✗ | ? |
| `/strategies/grid` | ✓ | — | ✗ | ? |
| `/strategies/[id]` | ✓ | — | ✗ | ? |
| `/client-portal/[org]` | ✓ | — | ✗ | ? |

## Portal Routes (platform group, separate nav model)

| Route | Page |
|-------|------|
| `/portal` | ✓ |
| `/portal/login` | ✓ |
| `/portal/dashboard` | ✓ |
| `/portal/data` | ✓ |
| `/portal/backtesting` | ✓ |
| `/portal/execution` | ✓ |
| `/portal/investment` | ✓ |
| `/portal/regulatory` | ✓ |
| `/portal/whitelabel` | ✓ |

---

## Ops Routes (internal-only)

| Route | Page | In MANAGE_TABS | In stageServiceMap |
|-------|------|----------------|-------------------|
| `/admin` | ✓ | ✗ | ✓ (manage) |
| `/admin/data` | ✓ | ✗ | ✗ |
| `/manage/clients` | ✓ | ✓ | ✓ (manage) |
| `/manage/mandates` | ✓ | ✓ | ✗ |
| `/manage/fees` | ✓ | ✓ | ✗ |
| `/manage/users` | ✓ | ✓ | ✗ |
| `/compliance` | ✓ | ✓ | ✓ (manage) |
| `/config` | ✓ | ✗ | ✗ |
| `/ops` | ✓ | ✗ | ✓ (observe) |
| `/ops/jobs` | ✓ | ✗ | ✗ |
| `/ops/services` | ✓ | ✗ | ✗ |
| `/devops` | ✓ | ✗ | ✗ |
| `/internal` | ✓ | ✗ | ✗ |
| `/internal/data-etl` | ✓ | ✗ | ✗ |
| `/engagement` | ✓ | ✗ | ✗ |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total page.tsx files (all groups) | 109 |
| Platform pages | 72 |
| Ops pages | 15 |
| Portal pages (under platform) | 9 |
| Public pages | ~17 |
| Tab hrefs (unique across all sets) | 43 |
| Tab hrefs with pages | 43/43 (100%) |
| Tab hrefs with routeMappings | 30/43 (70%) |
| Platform pages with tab entry | 36/72 (50%) |
| Platform pages with routeMappings | ~40/72 (56%) |
| routeMappings entries (auth required) | ~35 |
