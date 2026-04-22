# E2E strategy coverage — SSOT alignment audit

**Status**: active (Phase 1 in progress)
**Owner**: UI e2e coverage workstream
**SSOT source**: [unified-trading-pm/codex/09-strategy/architecture-v2/](../../../unified-trading-pm/codex/09-strategy/architecture-v2/)
**Plan**: [unified-trading-pm/plans/ai/ui_e2e_strategy_coverage_audit_2026_04_22.plan.md](../../../unified-trading-pm/plans/ai/ui_e2e_strategy_coverage_audit_2026_04_22.plan.md)

## Purpose

Living index of the drift between `architecture-v2` archetype specs and what the Playwright tests in this repo actually verify. Every row captures one of the 18 canonical archetypes. Updated as fixes land — each row's `status` flips from `pending` to `landed` once the fix ships.

## SSOT anchor

`architecture-v2` defines 18 archetypes across 8 families (see [architecture-v2/README.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/README.md)). The canonical archetype list lives in [architecture-v2/archetypes/](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/). The test-side mirror is [tests/e2e/\_shared/strategy-registry.ts](../../tests/e2e/_shared/strategy-registry.ts).

## Current state — registry vs SSOT

| Metric                       | SSOT                    | Registry | Delta                                                                                               |
| ---------------------------- | ----------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| Total archetypes             | 18                      | 19       | +1 (`AMM_LP_PROVISION` is non-SSOT)                                                                 |
| Execution-surface archetypes | ~5 (by instruction set) | 5        | —                                                                                                   |
| Detail-view archetypes       | ~13                     | 14       | `AMM_LP_PROVISION` counted in execution, `MARKET_MAKING_CONTINUOUS` in detail-view — merge required |

## Drift summary — four categories

1. **Action coverage gaps** — several execution specs drive only a subset of the archetype's canonical instruction flow (`CARRY_STAKED_BASIS`, `CARRY_BASIS_PERP`).
2. **Archetype naming drift** — `AMM_LP_PROVISION` is registered standalone; SSOT folds AMM LP under `MARKET_MAKING_CONTINUOUS` sub-mode.
3. **Non-executing execution test** — `YIELD_STAKING_SIMPLE` is labelled `execution` in the registry but the spec only clicks tabs on a read-only dashboard.
4. **Observation-widget blind spot** — no spec asserts that read-only DeFi widgets reflect state after an action.

## Per-archetype audit — 18 rows

Legend:

- **SSOT instruction sequence** — canonical action flow from the archetype doc
- **Current test coverage** — what the test actually drives (file reference + scenario sketch)
- **Gap** — delta between SSOT and test
- **Fix** — concrete change + phase anchor
- **Status** — `[ ] pending` | `[/] in progress` | `[x] landed`

### Family: Yield

#### 1. `YIELD_ROTATION_LENDING`

| Aspect           | Detail                                                                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | `LEND` + `WITHDRAW` + optional `BRIDGE` across `(protocol, chain)` tuples ([yield-rotation-lending.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-rotation-lending.md))    |
| Current coverage | [tests/e2e/strategies/defi/yield-rotation-lending.spec.ts](../../tests/e2e/strategies/defi/yield-rotation-lending.spec.ts) drives LEND 1000, WITHDRAW 500, protocol-switch reactivity, asset-switch reactivity |
| Gap              | No `BRIDGE` scenario. No observation-widget update assertion (`defi-wallet-summary-widget`, `defi-rates-overview-widget`, `defi-yield-chart-widget`, `defi-reward-pnl-widget`).                                |
| Fix              | Phase 2 — add `observationWidgets` block + `verifyObservationWidgets` calls. `BRIDGE` deferred: no bridge widget exists yet (backend gap).                                                                     |
| Status           | `[ ]` pending                                                                                                                                                                                                  |

#### 2. `YIELD_STAKING_SIMPLE`

| Aspect           | Detail                                                                                                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | `STAKE` + `UNSTAKE` on validator protocols (Lido, Rocket Pool, Jito, Marinade) ([yield-staking-simple.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-staking-simple.md))                                                |
| Current coverage | [tests/e2e/strategies/defi/yield-staking-simple.spec.ts](../../tests/e2e/strategies/defi/yield-staking-simple.spec.ts) clicks Positions / Validators / Rewards / Unstaking tabs on a read-only dashboard                                                    |
| Gap              | Never STAKEs or UNSTAKEs. The real [components/widgets/defi/defi-staking-widget.tsx](../../components/widgets/defi/defi-staking-widget.tsx) exists with STAKE/UNSTAKE state + `executeDeFiOrder` wired, but has no testids and is not mounted on any route. |
| Fix              | Phase 1 P1.c — add testids to `DeFiStakingWidget`, mount it on `/services/trading/defi/staking` as a new card above the tabs, rewrite fixture with baseline + STAKE 10 + UNSTAKE 5 + protocol-switch + amount-reactivity scenarios.                         |
| Status           | `[x]` landed — P1.c                                                                                                                                                                                                                                         |

### Family: Carry

#### 3. `CARRY_BASIS_PERP`

| Aspect           | Detail                                                                                                                                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Paired `TRADE spot (long)` + `TRADE perp (short)` in ATOMIC or LEADER_HEDGE mode ([carry-basis-perp.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-perp.md))                                                                                                |
| Current coverage | [tests/e2e/strategies/defi/carry-basis-perp.spec.ts](../../tests/e2e/strategies/defi/carry-basis-perp.spec.ts) drives SWAP 90k USDT→ETH, slippage reactivity, basis-metrics reactivity, second SWAP idempotency                                                                                       |
| Gap              | Only the spot leg. Missing perp-short leg + verification that both ledger rows exist for the pair. No `defi-funding-matrix-widget` / `enhanced-basis-widget` update assertion.                                                                                                                        |
| Fix              | Phase 1 P1.d — built a new `DeFiPerpShortWidget` (no perp-exec widget existed before; the page showed "coming soon"), mounted it on `/services/trading/strategies/carry-basis`, added a scenario that shorts 25 ETH-PERP on HYPERLIQUID after the spot swap. Phase 2 will add observation assertions. |
| Status           | `[x]` landed — P1.d                                                                                                                                                                                                                                                                                   |

#### 4. `CARRY_BASIS_DATED`

| Aspect           | Detail                                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Paired `TRADE spot (long)` + `TRADE dated-future (short)` with fixed maturity ([carry-basis-dated.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-dated.md)) |
| Current coverage | Parametric detail-view only ([tests/e2e/strategies/detail-view.spec.ts](../../tests/e2e/strategies/detail-view.spec.ts)) — page header + tabs + 6 KPI cards. No `detailViewKpis` populated.           |
| Gap              | No tab-panel content check. No archetype-specific KPI assertions.                                                                                                                                     |
| Fix              | Phase 3 P3.b (backfill `detailViewKpis`) + P3.c (tab-panel content check). No execution surface planned — CeFi venue, not actionable from DeFi widgets.                                               |
| Status           | `[ ]` pending                                                                                                                                                                                         |

#### 5. `CARRY_STAKED_BASIS`

| Aspect           | Detail                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | 4-leg: `STAKE` (ETH→stETH/weETH) → `PLEDGE` (LEND as collateral on Aave) → `BORROW` (USDC) → `SHORT PERP` (on Hyperliquid/dYdX) ([carry-staked-basis.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-staked-basis.md))                                                              |
| Current coverage | [tests/e2e/strategies/defi/carry-staked-basis.spec.ts](../../tests/e2e/strategies/defi/carry-staked-basis.spec.ts) stubs 2 legs: SWAP USDC→weETH + TRANSFER 25k USDC to a placeholder address. Slippage reactivity covered.                                                                                            |
| Gap              | Missing 3 legs: true PLEDGE on Aave (lending widget), BORROW USDC, SHORT PERP. Transfer-to-placeholder is not a real margin leg. No `defi-health-factor-widget` / `defi-funding-matrix-widget` / `defi-reward-pnl-widget` update assertion.                                                                            |
| Fix              | Phase 1 P1.e — mounted `DeFiLendingWidget` + `DeFiPerpShortWidget` on `/services/trading/strategies/staked-basis`, rewrote scenarios 2-4 as full SSOT legs: LEND 10 weETH (PLEDGE), BORROW 15k USDC, SHORT 10 ETH-PERP on HYPERLIQUID. Kept scenario 5 (slippage reactivity). Phase 2 will add observation assertions. |
| Status           | `[x]` landed — P1.e                                                                                                                                                                                                                                                                                                    |

#### 6. `CARRY_RECURSIVE_STAKED`

| Aspect           | Detail                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Recursive `STAKE → PLEDGE → BORROW → STAKE` loops to amplify LST yield with leverage ([carry-recursive-staked.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-recursive-staked.md)) |
| Current coverage | Parametric detail-view only. `detailViewKpis: ["Health Factor", "APY (Current)"]` populated.                                                                                                                           |
| Gap              | No execution spec; multi-step recursive flow not exercised end-to-end. Tab-panel content not checked.                                                                                                                  |
| Fix              | Phase 3 P3.c tab-panel content check. Full execution flow out of scope for this plan — would need a recursion loop surface which doesn't exist yet.                                                                    |
| Status           | `[ ]` pending                                                                                                                                                                                                          |

### Family: Arbitrage

#### 7. `ARBITRAGE_PRICE_DISPERSION`

| Aspect           | Detail                                                                                                                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Paired `TRADE long-venue` + `TRADE short-venue` (or `SWAP dex-a` + `SWAP dex-b`) on same/equivalent instrument ([arbitrage-price-dispersion.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/arbitrage-price-dispersion.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis` populated.                                                                                                                                                                                              |
| Gap              | No `detailViewKpis`. No tab-panel content check. No execution spec — would need a dual-venue action surface.                                                                                                                                             |
| Fix              | Phase 3 P3.b (backfill `detailViewKpis` from SSOT P&L-attribution) + P3.c (tab content).                                                                                                                                                                 |
| Status           | `[ ]` pending                                                                                                                                                                                                                                            |

#### 8. `LIQUIDATION_CAPTURE`

| Aspect           | Detail                                                                                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Passive `LIMIT TRADE` bid-ladder around liquidation price, or flash-loan `ATOMIC` capture ([liquidation-capture.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/liquidation-capture.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                                                     |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                                                      |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                                                                  |
| Status           | `[ ]` pending                                                                                                                                                                                                         |

### Family: Market Making

#### 9. `MARKET_MAKING_CONTINUOUS`

| Aspect           | Detail                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Sub-mode A (CLOB MM): streaming `QUOTE` updates on two sides. Sub-mode B/C (AMM LP): `ADD_LIQUIDITY` / `REMOVE_LIQUIDITY` on concentrated or full-curve pools ([market-making-continuous.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/market-making-continuous.md))                                                                                                   |
| Current coverage | **Double registry entry**: `MARKET_MAKING_CONTINUOUS` as detail-view (CLOB MM + AMM LP instances mixed in `instanceIds`), `AMM_LP_PROVISION` as execution via [tests/e2e/strategies/defi/amm-lp-provision.spec.ts](../../tests/e2e/strategies/defi/amm-lp-provision.spec.ts) (ADD_LIQUIDITY, REMOVE_LIQUIDITY, pool switch, fee tier)                                                                 |
| Gap              | Two entries for one SSOT archetype. `AMM_LP_PROVISION` key is non-SSOT. No observation-widget update assertion (`defi-waterfall-weights-widget`, `defi-wallet-summary-widget`, `defi-reward-pnl-widget`).                                                                                                                                                                                             |
| Fix              | Phase 1 P1.b — merged `AMM_LP_PROVISION` into `MARKET_MAKING_CONTINUOUS`; added `subMode: "amm_lp"` + fixtureSlug + playbook + defaultInputs to the existing detail-view entry (kept detail-view coverage so the 6 mixed CLOB+AMM instances still surface in the parametric spec); renamed fixture / spec / playbook to `market-making-continuous-amm-lp.*`. Phase 2 will add observation assertions. |
| Status           | `[x]` landed — P1.b                                                                                                                                                                                                                                                                                                                                                                                   |

#### 10. `MARKET_MAKING_EVENT_SETTLED`

| Aspect           | Detail                                                                                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Two-sided `QUOTE` on event-settled books (sports exchanges, prediction markets) ([market-making-event-settled.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/market-making-event-settled.md)) |
| Current coverage | Parametric detail-view only. `detailViewKpis: ["Avg Spread Captured", "Fill Rate"]`.                                                                                                                                        |
| Gap              | No tab-panel content check. No execution spec (no action surface today).                                                                                                                                                    |
| Fix              | Phase 3 P3.c tab content. Execution spec out of scope.                                                                                                                                                                      |
| Status           | `[ ]` pending                                                                                                                                                                                                               |

### Family: Directional (ML + Rules)

#### 11. `ML_DIRECTIONAL_CONTINUOUS`

| Aspect           | Detail                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | ML-signal-driven `TRADE` (spot or perp, continuous) ([ml-directional-continuous.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/ml-directional-continuous.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                           |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                            |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                                        |
| Status           | `[ ]` pending                                                                                                                                                                               |

#### 12. `ML_DIRECTIONAL_EVENT_SETTLED`

| Aspect           | Detail                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | ML-signal-driven `TRADE` on event-settled books (sports / prediction) ([ml-directional-event-settled.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/ml-directional-event-settled.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                                                   |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                                                    |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                                                                |
| Status           | `[ ]` pending                                                                                                                                                                                                       |

#### 13. `RULES_DIRECTIONAL_CONTINUOUS`

| Aspect           | Detail                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | TA-rule-driven `TRADE` (continuous) ([rules-directional-continuous.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/rules-directional-continuous.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                 |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                  |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                              |
| Status           | `[ ]` pending                                                                                                                                                                     |

#### 14. `RULES_DIRECTIONAL_EVENT_SETTLED`

| Aspect           | Detail                                                                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Rule-driven `TRADE` on event-settled books ([rules-directional-event-settled.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/rules-directional-event-settled.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                              |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                               |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                                           |
| Status           | `[ ]` pending                                                                                                                                                                                  |

### Family: Event-Driven

#### 15. `EVENT_DRIVEN`

| Aspect           | Detail                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Scheduled `TRADE` around macro releases, earnings, unlocks, lineups ([event-driven.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/event-driven.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                 |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                  |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                              |
| Status           | `[ ]` pending                                                                                                                                                                     |

### Family: Volatility

#### 16. `VOL_TRADING_OPTIONS`

| Aspect           | Detail                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Delta-hedged options spreads — `TRADE option` legs + `TRADE underlying` delta hedge ([vol-trading-options.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/vol-trading-options.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                                               |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                                                |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                                                            |
| Status           | `[ ]` pending                                                                                                                                                                                                   |

### Family: Stat-Arb

#### 17. `STAT_ARB_PAIRS_FIXED`

| Aspect           | Detail                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Paired long/short `TRADE` on a pre-selected cointegrated pair ([stat-arb-pairs-fixed.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/stat-arb-pairs-fixed.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                           |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                            |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                                        |
| Status           | `[ ]` pending                                                                                                                                                                               |

#### 18. `STAT_ARB_CROSS_SECTIONAL`

| Aspect           | Detail                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT sequence    | Ranked basket longs vs. shorts from cross-sectional signals ([stat-arb-cross-sectional.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/stat-arb-cross-sectional.md)) |
| Current coverage | Parametric detail-view only. No `detailViewKpis`.                                                                                                                                                 |
| Gap              | No `detailViewKpis`. No tab-panel content check.                                                                                                                                                  |
| Fix              | Phase 3 P3.b + P3.c.                                                                                                                                                                              |
| Status           | `[ ]` pending                                                                                                                                                                                     |

## Non-SSOT registry key to retire

| Key                | Action                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `AMM_LP_PROVISION` | Remove. Merge fixture + spec + playbook into `MARKET_MAKING_CONTINUOUS` with `subMode: "amm_lp"` (Phase 1 P1.b). |

## Observation-widget coverage matrix (Phase 2 target)

SSOT archetype docs list P&L-attribution widgets that should reflect state post-execute. Today no execution spec asserts any of them update. Phase 2 wires them in.

| Archetype                                    | Widgets to assert visible + updated                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `YIELD_ROTATION_LENDING`                     | `defi-wallet-summary-widget`, `defi-rates-overview-widget`, `defi-yield-chart-widget`, `defi-reward-pnl-widget`   |
| `YIELD_STAKING_SIMPLE`                       | `defi-staking-rewards-widget` (or inline rewards on dashboard), `defi-wallet-summary-widget`                      |
| `CARRY_BASIS_PERP`                           | `defi-funding-matrix-widget`, `enhanced-basis-widget`, `defi-wallet-summary-widget`                               |
| `CARRY_STAKED_BASIS`                         | `defi-health-factor-widget`, `defi-funding-matrix-widget`, `defi-reward-pnl-widget`, `defi-wallet-summary-widget` |
| `MARKET_MAKING_CONTINUOUS` (AMM LP sub-mode) | `defi-waterfall-weights-widget`, `defi-wallet-summary-widget`, `defi-reward-pnl-widget`                           |

## Phase status tracker

- [x] **Phase 1** — reconcile 5 execution specs against SSOT (P1.a audit doc, P1.b AMM rename, P1.c staking wire, P1.d basis-perp perp leg, P1.e staked-basis full 4-leg flow)
- [ ] **Phase 2** — observation-widget verification (fixture schema extension, shared helper, route-level smoke spec)
- [ ] **Phase 3** — detail-view tab-panel content check, family-view spec, instance backfill, `detailViewKpis` backfill, slot-label grammar unit test

## References

- Approved plan: [unified-trading-pm/plans/ai/ui_e2e_strategy_coverage_audit_2026_04_22.plan.md](../../../unified-trading-pm/plans/ai/ui_e2e_strategy_coverage_audit_2026_04_22.plan.md)
- SSOT README: [architecture-v2/README.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/README.md)
- Strategy registry: [tests/e2e/\_shared/strategy-registry.ts](../../tests/e2e/_shared/strategy-registry.ts)
- Fixtures: [tests/e2e/fixtures/strategies/](../../tests/e2e/fixtures/strategies/)
- Execution specs: [tests/e2e/strategies/defi/](../../tests/e2e/strategies/defi/)
- Parametric detail-view spec: [tests/e2e/strategies/detail-view.spec.ts](../../tests/e2e/strategies/detail-view.spec.ts)
