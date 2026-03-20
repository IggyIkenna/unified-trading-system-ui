# Backend Alignment Manifest

Generated from MSW handler annotations after Plans 1+2 completion.
This documents what the backend needs to implement for the frontend to go live.

## Summary

| Category | Count |
|----------|-------|
| Total mock endpoints | 58 |
| Endpoints with real backend support | 22 |
| Aspirational endpoints (need backend work) | 36 |

---

## By Service

### auth (handlers/auth.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| POST /api/auth/login | REAL | Login with email/password |
| POST /api/auth/logout | REAL | Logout current session |
| GET /api/auth/me | REAL | Get current user profile |
| POST /api/auth/switch-persona | ASPIRATIONAL | Switch demo persona (demo only) |
| GET /api/auth/personas | ASPIRATIONAL | List available personas (demo only) |

### data (handlers/data.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/data/catalogue | REAL | Full instrument catalogue |
| GET /api/data/instruments | REAL | Instruments with filtering |
| GET /api/data/instruments/:id | REAL | Single instrument details |
| GET /api/data/freshness | ASPIRATIONAL | Data freshness by category |
| GET /api/data/organizations | ASPIRATIONAL | Organization metadata |

### execution (handlers/execution.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/execution/venues | REAL | Venue list with status |
| GET /api/execution/algos | REAL | Available algorithms |
| GET /api/execution/orders | REAL | Orders with filtering |
| POST /api/execution/orders | REAL | Submit new order |
| GET /api/execution/tca | ASPIRATIONAL | Transaction cost analysis |
| GET /api/execution/tca/venues | ASPIRATIONAL | TCA breakdown by venue |

### strategy (handlers/strategy.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/strategies | REAL | Strategies list |
| GET /api/strategies/:id | REAL | Strategy details |
| GET /api/backtests | REAL | Backtests list |
| GET /api/backtests/:id | REAL | Backtest details |
| GET /api/strategies/stats | ASPIRATIONAL | Aggregate strategy stats |

### positions (handlers/positions.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/positions | REAL | Current positions |
| GET /api/positions/summary | REAL | Position aggregates |
| GET /api/positions/risk-groups | ASPIRATIONAL | Grouped by risk category (Gap 1.1) |
| GET /api/positions/margin | ASPIRATIONAL | Margin information |
| GET /api/positions/history | ASPIRATIONAL | Historical snapshots |

### risk (handlers/risk.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/risk/limits | REAL | Global shard limits |
| GET /api/risk/exposure | REAL | Current exposure |
| GET /api/risk/summary | ASPIRATIONAL | Aggregated risk dashboard |
| GET /api/risk/limits/venues | ASPIRATIONAL | Per-venue breakdown (Gap 1.1, NOT STARTED) |
| GET /api/risk/var | ASPIRATIONAL | VaR component breakdown |
| GET /api/risk/greeks | ASPIRATIONAL | Portfolio Greeks |
| GET /api/risk/stress | ASPIRATIONAL | Stress scenario analysis (Gap 3.3, NOT PLANNED) |

### ml (handlers/ml.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/ml/models | REAL | List models |
| GET /api/ml/models/:id | REAL | Get model details |
| GET /api/ml/experiments | REAL | List experiments |
| GET /api/ml/features | ASPIRATIONAL | Feature store |
| GET /api/ml/training | ASPIRATIONAL | Training jobs |
| GET /api/ml/models/:id/validation | ASPIRATIONAL | Validation results |
| GET /api/ml/models/:id/governance | ASPIRATIONAL | Compliance info |

### trading (handlers/trading.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/trading/pnl/summary | REAL | P&L summary |
| GET /api/trading/performance | REAL | Performance metrics |
| GET /api/trading/pnl/timeseries | ASPIRATIONAL | Historical P&L |
| GET /api/trading/pnl/attribution | ASPIRATIONAL | P&L breakdown |
| GET /api/trading/activity | ASPIRATIONAL | Trading activity stats |
| GET /api/trading/pnl/daily | ASPIRATIONAL | Daily P&L for calendar |

### alerts (handlers/alerts.ts)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/alerts | REAL | List alerts |
| GET /api/alerts/:id | REAL | Get alert details |
| GET /api/alerts/stats | ASPIRATIONAL | Alert statistics |
| GET /api/alerts/rules | ASPIRATIONAL | Alert rules |
| POST /api/alerts/:id/acknowledge | ASPIRATIONAL | Acknowledge alert |
| POST /api/alerts/:id/resolve | ASPIRATIONAL | Resolve alert |
| POST /api/alerts/:id/snooze | ASPIRATIONAL | Snooze alert |

---

## API Frontend Gaps Cross-Reference

The following gaps from `context/API_FRONTEND_GAPS.md` are addressed in this manifest:

| Gap ID | Description | Handler | Status |
|--------|-------------|---------|--------|
| Gap 1.1 | Per-venue risk limits | handlers/risk.ts | ASPIRATIONAL |
| Gap 3.3 | Stress scenario analysis | handlers/risk.ts | ASPIRATIONAL (NOT PLANNED) |

---

## Priority Implementation Order

Based on frontend usage and demo requirements:

### P0 - Critical for Demo
1. `/api/risk/summary` - Risk dashboard aggregates
2. `/api/positions/risk-groups` - Risk group breakdown
3. `/api/trading/pnl/timeseries` - P&L charts
4. `/api/alerts/stats` - Alert dashboard

### P1 - Important for User Experience
5. `/api/risk/var` - VaR visualization
6. `/api/ml/features` - ML feature store view
7. `/api/trading/pnl/attribution` - P&L breakdown by venue/strategy
8. `/api/execution/tca` - Transaction cost analysis

### P2 - Nice to Have
9. `/api/risk/stress` - Stress testing scenarios
10. `/api/risk/greeks` - Options Greeks
11. `/api/positions/history` - Historical position snapshots

---

## Notes

- All ASPIRATIONAL endpoints have mock implementations in `lib/mocks/handlers/`
- MSW serves these endpoints when `NEXT_PUBLIC_MOCK_API=true`
- Backend implementations should match the response schemas defined in mock handlers
- See `lib/registry/openapi.json` for existing API schema definitions
