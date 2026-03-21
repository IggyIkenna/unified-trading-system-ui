# Phase 2c: Promote Tab — Cross-Reference Markers for Phase 3

**Generated:** 2026-03-21 | **Source:** Phase 2c Promote Tab Audit (F1, F2)
**Feeds into:** Phase 3 cross-reference audit

---

## Marker F1: `/service/trading/risk` — Shared Between Promote and Observe

### Context

This route appears in two tab sets with different labels:

| Tab Set | Label | Lifecycle Stage | Layout | Rendered? |
|---------|-------|----------------|--------|-----------|
| PROMOTE_TABS | "Risk Review" | promote | — | No (PROMOTE_TABS never rendered) |
| OBSERVE_TABS | "Risk Dashboard" | observe | — | No (OBSERVE_TABS never rendered) |
| (trading layout) | — | run | `service/trading/layout.tsx` | Yes (TRADING_TABS shown) |

### Semantic Difference

| Attribute | Promote Context ("Risk Review") | Observe Context ("Risk Dashboard") |
|-----------|-------------------------------|-----------------------------------|
| User intent | Pre-promotion risk assessment of a candidate strategy | Real-time portfolio risk monitoring |
| Expected focus | Strategy-specific VaR, candidate vs existing book | Portfolio-wide exposure, limits, alerts |
| Expected default tab | Heatmap (strategy-level view) | Overview (portfolio summary) |
| Typical user | Quant researcher reviewing before promotion | Risk manager monitoring live positions |

### Current Behavior

- Page component: `RiskDashboardPage` — same in all contexts
- No context detection, no query parameter check, no conditional rendering
- 7 internal tabs (Overview, Limits, Exposure, Greeks, HF Monitoring, Stress, Heatmap) always start on Overview
- routeMappings: `primaryStage: "observe"` — lifecycle nav always highlights Observe

### Phase 3 Action Items

1. **Decide ownership:** Is this primarily an Observe page with Promote access, or should Promote get a dedicated risk review view?
2. **If shared:** Add `secondaryStage: "promote"` to routeMappings; implement context-aware default tab
3. **If split:** Create `/service/promote/risk-review` as a focused subset of the full risk dashboard
4. **Tab bar fix:** Both PROMOTE_TABS and OBSERVE_TABS reference this route but neither tab set is rendered — the page always shows TRADING_TABS

---

## Marker F2: `/service/research/execution/tca` — Stage Mapping Mismatch

### Context

| Source | Label | Stage |
|--------|-------|-------|
| PROMOTE_TABS | "Execution Analysis" | promote (implicit — PROMOTE_TABS is a promote tab set) |
| routeMappings | "TCA" | `primaryStage: "observe"` |
| EXECUTION_TABS | "TCA" (at different URL: `/service/execution/tca`) | run (via execution layout) |

### Mismatch Detail

PROMOTE_TABS says this is a Promote page. routeMappings says it's an Observe page. The page renders `ExecutionNav` (execution platform navigation), suggesting it was built for the execution/observe context.

### Dual TCA Routes

| Route | Tab Set | Layout | primaryStage |
|-------|---------|--------|-------------|
| `/service/research/execution/tca` | PROMOTE_TABS | research | observe |
| `/service/execution/tca` | EXECUTION_TABS | execution | (not in routeMappings) |

**Question for Phase 3:** Are these the same page component or different implementations?

- Research TCA (`/service/research/execution/tca`): Uses `MOCK_RECENT_ORDERS` from execution mock data + inline TCA mocks, renders `ExecutionNav`
- Execution TCA (`/service/execution/tca`): Needs verification — may be the same component or a different one

### Phase 3 Action Items

1. **Verify `/service/execution/tca` page component** — is it the same as research TCA?
2. **If same component:** Consolidate to single route; update both tab sets to reference the canonical URL
3. **If different:** Document the semantic difference (research TCA = backtest execution analysis; live TCA = real-time execution costs)
4. **Fix routeMappings:** At minimum, add `secondaryStage: "promote"` to `/service/research/execution/tca`
5. **Entitlement check:** Research TCA has no tab-level entitlement in PROMOTE_TABS, but is behind `strategy-full || ml-full` gate in `isItemAccessible` due to `/service/research` prefix

---

## Summary of Cross-References for Phase 3

| Route | Shared Between | Key Question | Priority |
|-------|---------------|-------------|----------|
| `/service/trading/risk` | Promote (Risk Review) ↔ Observe (Risk Dashboard) | Should page be context-aware or split? | P1 |
| `/service/research/execution/tca` | Promote (Execution Analysis) ↔ Observe (TCA mapping) | Is the stage mapping a bug? Are dual TCA routes intentional? | P2 |

Both markers feed directly into the Phase 3 cross-reference audit plan.
