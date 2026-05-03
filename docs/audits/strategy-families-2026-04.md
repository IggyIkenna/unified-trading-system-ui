# Strategy Families Reconnaissance — 2026-04

> Read-only audit of `unified-trading-pm/codex/09-strategy/`. Factual extraction only.
> All quotes are from codex source files. Line numbers cited where precision matters.

---

## Codex 09-strategy overview

### File inventory

| File / directory                                          | One-line purpose                                                                                                                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                               | Top-level index; declares `architecture-v2/` as SSOT; `_archived_pre_v2/` for legacy                                                                                                                             |
| `strategy-summary.md`                                     | Very long summary doc (>25K tokens, unread in full; only sampled via README pointer)                                                                                                                             |
| `TIER_ZERO_UI_DEMO_AND_PARITY.md`                         | UI Tier-0 playbook (fixtures, cross-strategy UX, promotion path); not superseded by v2                                                                                                                           |
| `architecture-v2/README.md`                               | **Master reference**: 8 families × 18 archetypes × 7 axes × 10 cross-cutting + capital flow lifecycle                                                                                                            |
| `architecture-v2/MIGRATION.md`                            | Legacy doc → v2 archetype audit; every old doc / code module mapped                                                                                                                                              |
| `architecture-v2/families/*.md`                           | 8 docs, one per strategy family (full spec)                                                                                                                                                                      |
| `architecture-v2/archetypes/*.md`                         | 18 docs, one per archetype (full spec)                                                                                                                                                                           |
| `architecture-v2/axes/*.md`                               | 7 docs: signal-sources, edge-methods, hold-policy, staking-methods, venue-eligibility, expression, share-class                                                                                                   |
| `architecture-v2/cross-cutting/*.md`                      | 10 docs: risk-gates, venue-selection-split, execution-policies, transfer-rebalance, portfolio-allocator, mev-protection, benchmark-fills, capital-client-isolation, trade-expression, venue-account-coordination |
| `architecture-v2/strategy-catalogue-3tier.md`             | SSOT for the 3-tier UI catalogue surface (admin-universe / admin-editor / client-reality / client-fomo)                                                                                                          |
| `architecture-v2/strategy-lifecycle-maturity.md`          | 9-phase maturity enum + product routing + venue-set variants + share class (5-dim instance model)                                                                                                                |
| `architecture-v2/strategy-questionnaire-mapping.md`       | 11-axis questionnaire → catalogue filter derivation                                                                                                                                                              |
| `architecture-v2/restriction-policy.md`                   | Per-family allowed venues/instrument-types/data-types + default lock state                                                                                                                                       |
| `architecture-v2/block-list.md`                           | BL-1..BL-10: hard-blocked (archetype × category × instrument) cells with rationale                                                                                                                               |
| `architecture-v2/category-instrument-coverage.md`         | Full SUPPORTED / PARTIAL / BLOCKED / N/A matrix for all 18 archetypes × 5 categories × 8 instrument types                                                                                                        |
| `architecture-v2/dart-tab-structure.md`                   | Per-persona lifecycle-stage + DART sub-tab visibility matrix                                                                                                                                                     |
| `architecture-v2/naming-convention.md`                    | Canonical strategy-id format (slot label / fully-qualified / bare)                                                                                                                                               |
| `architecture-v2/strategy-registry-v2.md`                 | SSOT for post-v1 `STRATEGY_REGISTRY`; 96 slot-labelled entries + downstream consumer mapping                                                                                                                     |
| `architecture-v2/admin-registry-api.md`                   | Phase 7 admin-only HTTP surfaces for UAC canonical list reconciliation                                                                                                                                           |
| `architecture-v2/strategy-questionnaire-mapping.md`       | SSOT for questionnaire axis → catalogue filter derivation                                                                                                                                                        |
| `architecture-v2/legacy-family-migration.md`              | Audit of UI files still using v1 family strings                                                                                                                                                                  |
| `architecture-v2/performance-overlay.md`                  | Chart primitive for backtest/paper/live stitched overlay                                                                                                                                                         |
| `architecture-v2/dashboard-services-grid.md`              | 5-tile product-axis dashboard model                                                                                                                                                                              |
| `architecture-v2/dart-exclusive-research-fork.md`         | Research fork gating for DART-exclusive features                                                                                                                                                                 |
| `architecture-v2/instruments-resolver-architecture.md`    | Instruments resolver service architecture                                                                                                                                                                        |
| `architecture-v2/tradfi-bond-instrument-type-decision.md` | TradFi bond instrument type decision record                                                                                                                                                                      |
| `architecture-v2/value-betting-archetype-decision.md`     | Decision record: value betting is ML_DIRECTIONAL_EVENT_SETTLED, not its own archetype                                                                                                                            |
| `architecture-v2/uac-registry-gaps.md`                    | UAC registry gaps tracking                                                                                                                                                                                       |
| `cross-cutting/` (5 docs)                                 | client-onboarding, client-strategy-config, instrument-filtering, onboarding-checklist, operational-modes-matrix, pnl-attribution, prediction-markets, rate-impact-model, reward-lifecycle                        |
| `_archived_pre_v2/`                                       | Legacy category docs (cefi, defi, sports, tradfi, prediction); preserved for migration reference                                                                                                                 |

---

## Strategy family taxonomy

### Top-level organization

v2 organizes every strategy by **primary alpha source** into 8 orthogonal families. Category (CeFi, DeFi, TradFi, Sports, Prediction) is a _derived label_ from the execution venue — it is not a routing axis. One family per strategy; no composites.

> "A strategy belongs to exactly one family, determined by its **primary alpha source**."
> — [`architecture-v2/README.md:56`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/README.md)

The family ID used in code and URLs: `ML_DIRECTIONAL`, `RULES_DIRECTIONAL`, `CARRY_AND_YIELD`, `ARBITRAGE_STRUCTURAL`, `MARKET_MAKING`, `EVENT_DRIVEN`, `VOL_TRADING`, `STAT_ARB_PAIRS`.

---

### Family 1: ML Directional

**Enum:** `ML_DIRECTIONAL`
**Alpha source:** "Machine-learning model prediction of outcome probability vs. market-implied probability."
**Edge method:** Value — `model_prob > implied_prob + min_edge_threshold`.
**Hold policies:** `HOLD_UNTIL_FLIP` (tradeable) or `ONE_SHOT` (event-settled).
**Archetypes:** 2 — split on settlement model.

| Archetype                      | Code path                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `ML_DIRECTIONAL_CONTINUOUS`    | Continuous P&L; positions can be closed any time. Crypto perps/spot, equities, FX, commodities. |
| `ML_DIRECTIONAL_EVENT_SETTLED` | Resolves on external event. Sports matches, prediction-market outcomes.                         |

**Asset classes:** Crypto (spot/perp/options), equities, FX, commodities, sports, prediction markets.
**Venues (representative):** Binance, OKX, Bybit, Hyperliquid, Deribit, IBKR, CME, CBOE, Unity, Betfair, Polymarket, GMX, Drift.
**Key parameters:** `model_id` (versioned ML artifact), `feature_group_ref`, `kelly_fraction`, `confidence_threshold`, `min_edge_threshold`, `max_position_pct_of_equity`.
**Staking:** Fractional Kelly (0.2–0.5× default); confidence-scaled Kelly; fixed %.
**Sharpe range:** 0.8–2.5.
**UI dashboard:** Confusion matrix, calibration curve, edge histogram, rolling accuracy, P&L attribution (signal + staking + execution).
**Archetype mapping to trader archetypes:** Not stated explicitly in codex family docs; inferred from venues — primarily internal-trader / quant-overseer personas.
**Tier gating:** Full-only (requires `strategy-full` + `ml-full`); not available to Signals-In tier.

---

### Family 2: Rules Directional

**Enum:** `RULES_DIRECTIONAL`
**Alpha source:** "Hard-coded if-else rules on features that produce discrete fire/no-fire signals."
**Edge method:** Threshold-crossed — rule fires when feature values meet condition.
**Hold policies:** `HOLD_UNTIL_FLIP`, `ONE_SHOT`, or time-boxed.
**Archetypes:** 2 — split on settlement model.

| Archetype                         | Code path                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `RULES_DIRECTIONAL_CONTINUOUS`    | TradFi TA, crypto TA, regime-switching, mean-reversion on continuous instruments. |
| `RULES_DIRECTIONAL_EVENT_SETTLED` | Sports rule-based betting (in-play + pre-game), prediction-market rule-based.     |

**Signal types:** RSI, MACD, Bollinger Bands, ATR, VWAP, z-score, Hurst exponent, sports event-timing rules (e.g., "scored first within 20 min"), pattern match.
**Asset classes:** Same venue/category scope as ML Directional; options blocked for CEFI and TRADFI (BL-4).
**Key parameters:** `rule_registry_ref` (versioned YAML), `feature_group_refs`, `stake_fraction_of_equity` per rule, `execution_policy_ref`.
**Staking:** Fixed % equity (default); rule-specific sizing; fractional Kelly if backtest edge well-characterised.
**Sharpe range:** 0.5–1.5.
**UI dashboard:** Rule hit-rate, rule-by-rule P&L attribution, rule firing timeline, feature-condition heatmap, deprecation candidates.
**Differentiation from ML Directional:** Rules produce discrete fire/no-fire; ML produces continuous probability. Rules strategies used as benchmarks, feature inputs to ML, or early-stage alternatives before sufficient training data.
**Tier gating:** Available in both Signals-In and Full tiers.

---

### Family 3: Carry & Yield

**Enum:** `CARRY_AND_YIELD`
**Alpha source:** "Rate / yield differential capture. Whether the rate is funding on a perp, lending APY on a protocol, staking reward on a PoS chain, or basis spread on a dated future, the common thesis is: capture a paid rate that compensates for holding a position."
**Edge method:** Rate-differential sustained above cost threshold; net carry > cost.
**Hold policies:** `CONTINUOUS` (with periodic rebalance) or `HOLD_UNTIL_FLIP`.
**Archetypes:** 6 — distinguished by position structure and capital utilization pattern.

| Archetype                | Position structure                      | Primary rate                                 | Typical venues                                                              |
| ------------------------ | --------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `CARRY_BASIS_DATED`      | Long spot + short dated future          | Basis convergence at expiry                  | CME (commodities/index), Deribit dated                                      |
| `CARRY_BASIS_PERP`       | Long spot + short perp                  | Funding rate; delta-neutral                  | Uniswap/CEX spot + CEX/DEX perp (e.g. Binance×Binance, Uniswap×Hyperliquid) |
| `CARRY_STAKED_BASIS`     | Stake → LST → pledge → short perp       | Staking yield + funding + (optional lending) | Lido/Jito + Aave/Kamino + Hyperliquid/Drift                                 |
| `CARRY_RECURSIVE_STAKED` | Recursive stake→borrow→stake loop       | Leveraged staking yield                      | Lido-Aave-ETH, Jito-Kamino-SOL; carries liquidation cascade risk            |
| `YIELD_ROTATION_LENDING` | Supply asset to best-APY protocol/chain | Lending APY differential                     | Aave multichain, Compound, Euler, Morpho, Kamino                            |
| `YIELD_STAKING_SIMPLE`   | Stake asset, earn validator reward      | Pure staking reward                          | Lido (ETH), Jito/Marinade (SOL)                                             |

**Asset classes:** CeFi (perps, spot), DeFi (LSTs, lending protocols, staking), TradFi (dated futures on commodities/index). Sports and Prediction: `N/A`.
**Key parameters:** `rebalance_cadence`, `min_rate_threshold`, `gas_cost_threshold` (DeFi), `target_leverage` (recursive), `liquidation_buffer`, `venue_capability_refs`.
**Staking:** Fixed % equity (default); delta-neutral paired (basis); leverage-capped (recursive); per-venue allocation (rotation).
**Shared primitives:** Rate/yield monitor, delta-neutral position tracker, rebalance scheduler, gas-aware rebalancer (DeFi), liquidation monitor.
**Sharpe range (normal regime):** 1.5–3.5. Sharpe collapses on tail events (LST depeg, funding reversal, liquidation cascade).
**Tail risks:** Funding rate reversal, LST depeg, cascading liquidation, smart-contract risk, chain halt / bridge delay.
**UI dashboard:** Rate/APY curves per venue, spread + rebalance history, delta exposure tracker, health factor gauge, per-venue P&L, carry yield accrued vs paid, gas cost per rebalance, liquidation distance.
**Tier gating:** Available in both Signals-In and Full tiers.

---

### Family 4: Arbitrage / Structural Edge

**Enum:** `ARBITRAGE_STRUCTURAL`
**Alpha source:** "Price dispersion between markets OR structural payment from protocol mechanics. Either way, the edge is largely risk-free (or near-risk-free) conditional on correct execution."
**Edge method:** Spread > cost (dispersion) OR structural bonus > cost (protocol mechanic).
**Hold policies:** `ATOMIC` (multi-leg simultaneous) or very short (minutes to hours).
**Archetypes:** 2 — distinguished by alpha mechanism.

| Archetype                    | Edge mechanism                                                                        | Examples                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ARBITRAGE_PRICE_DISPERSION` | Price spread between venues on same/equivalent instrument                             | Cross-CEX arb, cross-DEX arb, flash-loan DEX arb, sports cross-book arb, cross-category (Polymarket-Betfair), cross-venue vol arb (same option at different IVs), hard no-arb violations within a surface (butterfly/calendar/put-call parity), funding-rate-dispersion arb |
| `LIQUIDATION_CAPTURE`        | Protocol-paid bonus for repaying underwater position + seizing collateral at discount | Aave, Compound, Euler, Morpho, Kamino liquidation bots                                                                                                                                                                                                                      |

**Asset classes / venues:** All 5 categories. CEX×CEX, DEX×DEX (same chain, atomic via multicall), cross-chain (rare, leg-and-hedge), sports cross-book via Unity, vol surface arb on Deribit/OKX, liquidation on 6 EVM chains + Solana.
**Execution modes:** ATOMIC (flash-loan multicall on single chain, sports via Unity API) vs. leg-and-hedge (cross-CEX, cross-chain, cross-venue options). Strategy declares `leader` vs `hedge` leg; execution service picks algo.
**Key parameters:** `execution_ordering.mode` (LEADER_HEDGE or ATOMIC), `max_hedge_delay_ms`, `abort_on_adverse_move_bps`, `max_pct_per_opp`, `max_concurrent_opportunities`.
**Staking:** Fixed notional per opportunity; opportunity-sized; flash-loan sized (unlimited capital via flash loan, limited by profit magnitude).
**Sharpe (per opportunity):** 3+. Net annualised depends on scanner frequency and capital allocation efficiency.
**UI dashboard:** Opportunity detection rate, fill rate, P&L per opportunity distribution, execution slippage vs detected spread, gas/fee attribution, latency distribution, competitor priority-fee wins/losses.
**Key distinction from Carry & Yield:** Arb edge is present/mechanical (transient dispersion); carry edge is sustained/rate-differential. `defi/cross-chain-yield-arb.md` maps to either depending on the alpha thesis.
**Key distinction from Stat Arb:** Price dispersion arb is (near-)risk-free; stat arb has spread risk.
**Key distinction from Vol Trading:** Hard no-arb violations (butterfly/calendar/parity) and cross-venue same-option IV dispersion belong here. Soft surface residuals (statistical view of mean-reversion) belong in Vol Trading.
**Tier gating:** Available in both Signals-In and Full tiers.

---

### Family 5: Market Making

**Enum:** `MARKET_MAKING`
**Alpha source:** "Bid-ask spread capture via two-sided quoting around a theoretical fair price. We provide liquidity; we earn spread minus adverse selection."
**Edge method:** Net spread capture: `half_spread − commission − adverse_selection_cost > 0`.
**Hold policies:** `CONTINUOUS` (quote lifecycle long-running; positions transient, inventory-aware).
**Archetypes:** 2 — split on settlement model.

| Archetype                     | Scope                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `MARKET_MAKING_CONTINUOUS`    | CEX spot/perp MM, options MM, DeFi active LP (Uniswap V3 concentrated, Orca on Solana), cross-CEX MM |
| `MARKET_MAKING_EVENT_SETTLED` | Sports exchange MM (Betfair, Smarkets, Matchbook), prediction-market MM (future)                     |

**Asset classes:** CeFi (Binance/OKX/Bybit/Hyperliquid/Deribit spot+perp+options), DeFi (Uniswap V3, Orca concentrated LP), TradFi (via IBKR options routing to CBOE), Sports (Unity or direct Betfair/Smarkets/Matchbook/Betdaq).
**Shared primitives:** Theoretical price model (consensus mid, Smarkets sharp-book, fitted vol surface), quote generator with inventory-aware skewing, delta-proxy repricer (fast path for underlying moves), adverse-selection monitor, kill switch.
**Key parameters:** `inventory_size_pct`, `max_inventory_pct_of_equity`, `quote_spread`, `delta_hedge_band`, `reference_price_source`.
**Staking:** Fixed quote size; inventory-skew scaled; realized-vol scaled; per-venue allocation.
**Sharpe (normal regime):** 2–5. Negative in blow-up regimes; kill switches are the primary risk control.
**Tail risks:** Flash crash, informed flow burst, venue outage mid-inventory, competitor tighter spread.
**UI dashboard:** Inventory per (instrument, venue) over time, quote fill rate per side, spread captured per fill (distribution), adverse-selection estimate, kill-switch event log, latency distribution, net P&L decomposed (spread, inventory P&L, fees, adverse selection).
**Note:** DeFi AMM LP (Uniswap V3 concentrated liquidity, Orca) is classified under Market Making, not Carry & Yield, because the alpha is fee earnings for providing liquidity (spread capture), not a yield rate. Passive LP (V2 style fixed curve) is NOT in this family.
**Tier gating:** Available in both Signals-In and Full tiers.

---

### Family 6: Event-Driven

**Enum:** `EVENT_DRIVEN`
**Alpha source:** "Scheduled external events with measurable surprise. When an event releases (FOMC, CPI, NFP, earnings, OPEC), the event's surprise relative to consensus produces a measurable, time-bounded reaction in targeted instruments."
**Edge method:** Surprise magnitude × model-predicted direction > threshold, within a bounded time window.
**Hold policies:** Short-duration `ONE_SHOT` or time-boxed (minutes to hours post-event).
**Archetypes:** 1 — `EVENT_DRIVEN`.

> "Why a single archetype: the code structure is the same across different event types (FOMC, CPI, earnings, OPEC). What differs is the event calendar source, the instruments targeted, the consensus feed, and the surprise → direction model — all config."
> — [`architecture-v2/families/event-driven.md:57`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/event-driven.md)

**Covered events:** FOMC rate decisions, US CPI/PPI/PCE, NFP, OPEC/OPEC+ meetings, EIA crude inventory, corporate earnings, ECB/BoE/BoJ rate decisions, China economic data.
**Asset classes:** Crypto (BTC/ETH/SOL on perps via Binance/Hyperliquid/Bybit/Deribit), TradFi equities (IBKR equity futures: ES, NQ, SPY), TradFi rates (CME: ZN, ZB), TradFi FX (IBKR FX spot, CME FX futures), commodities (CME crude, gold, NG).
**Key parameters:** `event_calendar_ref`, `consensus_feed_refs`, `direction_model_ref`, `surprise_threshold_sigma`, `max_pct_per_event`, `time_window_minutes`.
**Staking:** Fixed notional per event; surprise-scaled; 2× scaled for high-conviction events.
**Shared primitives:** Event calendar registry, consensus feed subscriber (Bloomberg/Reuters/ECB), surprise computer, direction model, entry/exit-window manager, dead-man switch.
**Explicitly excluded:** Unscheduled news (→ ML/Rules Directional), earnings-driven stat arb (→ STAT_ARB), vol-of-vol around events / pre-event straddle (→ VOL_TRADING), sports match results (→ ML/RULES event-settled), chain-level events.
**Sharpe:** Event-specific; high per-event but events are infrequent.
**UI dashboard:** Event calendar (upcoming), pre-event positioning status, post-event P&L scatter (surprise vs realized return), direction-model hit rate, time-window adherence, per-event-type aggregate.
**Note:** No dedicated legacy doc existed; event-driven was primarily a code-level feature. v2 introduces explicit family formalization.
**Tier gating:** Full-only (requires ML pipeline / event-model authoring; not available in Signals-In tier).

---

### Family 7: Vol Trading

**Enum:** `VOL_TRADING`
**Alpha source:** "Volatility-metric dislocation. Alpha is a view on vol itself (IV vs RV, skew, term structure, cross-asset vol) — not a directional view on the underlying. Baseline positions are delta-hedged; P&L comes from vega, gamma, and theta."
**Edge method:** Vol-metric dislocation vs fair — IV too rich/cheap vs realized; skew extreme vs historical; term structure bowed beyond no-arb bounds (soft — statistical, not mechanical).
**Hold policies:** `CONTINUOUS` (dynamic gamma scalping + vega exposure) or `HOLD_UNTIL_FLIP` (event-bounded vol trades).
**Archetypes:** 1 — `VOL_TRADING_OPTIONS`.

> "Why a single archetype: the code structure (vol surface fitter + dislocation detector + delta-hedge + greeks management + risk bounds) is the same regardless of which specific vol dislocation you're capturing. Differences are config: which vol edge method, which underlying, which strikes."
> — [`architecture-v2/families/vol-trading.md:57`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/vol-trading.md)

**Sub-patterns:**

- IV vs RV: long/short vol when implied diverges from realized (statistical, not risk-free)
- Skew dislocation (soft): sell puts/buy calls when 25d put skew rich vs historical
- Term structure (soft): calendar trades when front-month IV richer than back vs typical carry
- Soft surface residuals: per-strike IV residual from fitted SVI/SSVI surface, within no-arb bounds (statistical bet)

**Venues:** Deribit (primary crypto options: BTC, ETH), CBOE (SPY options via IBKR), CME (options on futures: ES, CL), OKX options (secondary/backup).
**Shared primitives:** IV surface fitter (SVI/SSVI), realized vol computer, Greeks computer, delta-hedge engine, gamma-scalping engine, vol-trade constructors (straddle, strangle, butterfly, calendar, risk reversal), expiry/time-decay manager.
**Key parameters:** `max_vega_pct`, `max_gamma_pct`, `surface_model_ref`, `vol_edge_model_ref`, `delta_hedge_band`.
**Staking:** Vega-notional cap (default); gamma-notional cap; scenario-PnL-capped.
**Sharpe:** Wide range; 1.5–3.0 for well-executed strategies.
**UI dashboard:** IV surface grid with overlaid fitted surface, IV percentile rank per strike, realized vol rolling, current Greeks + portfolio scenario P&L grid, delta-hedge event log, vol P&L attribution (vega/gamma/theta/delta-hedge-slippage), surface residuals heatmap.
**Critical boundary with Arbitrage:** Cross-venue vol arb (same option different IV on Deribit vs OKX) and hard no-arb violations (butterfly/calendar/parity) belong in `ARBITRAGE_PRICE_DISPERSION`. Only statistical soft-surface views belong in `VOL_TRADING`.
**Note:** `DEFI × option` is BLOCKED (BL-1: Lyra and Dopex archived 2026-03; no replacement declared in UAC).
**Tier gating:** Full-only (requires ML pipeline); not available in Signals-In tier.

---

### Family 8: Stat Arb / Pairs

**Enum:** `STAT_ARB_PAIRS`
**Alpha source:** "Statistical spread between two or more underlyings that mean-reverts (or trends) against a historical relationship. Unlike price-dispersion arbitrage (which is risk-free), Stat Arb has spread risk — the relationship can break."
**Edge method:** Spread z-score mean-reversion; entry at |z| > threshold, exit at |z| back to ≤ threshold.
**Hold policies:** `HOLD_UNTIL_FLIP` (close when spread reverts to entry band).
**Archetypes:** 2 — split on basket selection logic.

| Archetype                  | Basket selection                                                    | When                                                                           |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `STAT_ARB_PAIRS_FIXED`     | Predetermined pairs; cointegration-tested or historical-beta-stable | Long-term stable relationships: sector pairs, cross-index, crypto majors pairs |
| `STAT_ARB_CROSS_SECTIONAL` | Dynamic ranking-based; members vary each rebalance                  | Universe ranking (Russell 1000 daily, crypto top-50 hourly)                    |

**Asset classes:** Equities (IBKR via NYSE/NASDAQ/LSE), index futures (CME: ES-NQ, ES-RTY), crypto (Binance/Bybit/OKX pairs), cross-asset (IBKR + CME), vol pairs (Deribit options cross-underlying).
**Shared primitives:** Spread computer, hedge-ratio estimator (rolling OLS, Kalman filter, cointegration vector), z-score monitor, cointegration tester (Engle-Granger or Johansen), paired leg tracker, atomic multi-leg execution.
**Key parameters:** `instrument_pair_refs` (fixed) or `universe_ref` (cross-sectional), `hedge_ratio_model_ref`, `z_score_entry_threshold` (default 2.0), `z_score_exit_threshold` (default 0.3), `cointegration_p_value_kill_threshold`, `ranking_model_ref` (cross-sectional only).
**Staking:** Dollar-neutral paired; beta-neutral paired; cointegration-weighted; allocation-split (cross-sectional); Kelly per pair.
**Sharpe:** 1.0–2.5. Structural-break events (cointegration failure) produce the tail.
**Kill switches:** Cointegration p-value breach, one-leg liquidity collapse, extreme z-score without reversion after hold period.
**UI dashboard:** Spread time series with entry/exit bands, z-score distribution per pair (or aggregate), hedge-ratio stability (Kalman trace), cointegration p-value rolling, factor exposure (cross-sectional), leg-by-leg P&L attribution.
**Note:** `STAT_ARB_CROSS_SECTIONAL` is new in v2; no legacy doc existed. Fixed pairs had code-level coverage (`rel_vol_btc_eth.py`, `stat_arb_btc_eth.py`).
**Tier gating:** Available in both Signals-In and Full tiers. `STAT_ARB_PAIRS_FIXED × CEFI × spot|perp` is the **only** cell with `PUBLIC` lock state as of 2026-04-20 snapshot. All other cells are `INVESTMENT_MANAGEMENT_RESERVED`.

---

## Cross-cutting concepts

### 1. 7 Axes of composition (per strategy instance)

Every strategy is a composition of 1 family + 1 archetype + values on 7 axes:

| Axis              | Values                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Signal source     | ML, rules, TA, funding-rate, yield-spread, event-schedule, orderbook, liquidation-watcher, greeks, mempool      |
| Edge method       | value (model_prob > implied), rate-differential, spread-capture, arb, z-score, momentum, vol-divergence         |
| Staking method    | Kelly, fractional-Kelly, fixed-%, fixed-notional, confidence-scaled, vol-scaled, delta-paired, inventory-skewed |
| Venue eligibility | Set of eligible venues + constraints; slow-moving; config-level                                                 |
| Expression        | spot, perp, atm_call, 25d_call, synthetic, LP, basket, auto                                                     |
| Hold policy       | `SAME_CANDLE_EXIT`, `HOLD_UNTIL_FLIP`, `CONTINUOUS`, `ONE_SHOT`                                                 |
| Share class       | USDT, USDC, ETH, BTC, USD, GBP, EUR, SOL — fixed at instance creation                                           |

### 2. 5-Layer identity model (how a strategy instance is identified)

```
1. FAMILY         — orthogonal alpha style (8 values; never changes)
2. ARCHETYPE      — code path under family (18 values; build-versioned)
3. INSTANCE       — slot: archetype + client_id + capital + risk_budget + share_class + slot_label
4. CONFIG         — hash-identified content: venues, instruments, feature/model/policy refs, thresholds, etc.
5. DERIVED CATS   — execution_categories + data_categories (multi-valued lists, for UI/reporting)
```

**Slot label grammar:** `{archetype_id}@{venue_scope}-{instrument_scope}[-{timeframe}]-{share_class}[-v{N}]-{env}`

### 3. Lifecycle / maturity (9 phases)

| Phase                 | Meaning                                                                 | Capital at risk |
| --------------------- | ----------------------------------------------------------------------- | --------------- |
| `smoke`               | Pre-backtest; mock data only                                            | 0               |
| `backtest_minimal`    | < 1 year historical backtest                                            | 0               |
| `backtest_1yr`        | 1 year clean backtest                                                   | 0               |
| `backtest_multi_year` | ≥ 3 years backtest                                                      | 0               |
| `paper_1d`            | First 24h on `odum-paper` matching engine                               | $0 (sim)        |
| `paper_14d`           | 14 days paper (first statistically meaningful window)                   | $0 (sim)        |
| `paper_stable`        | ≥ 30d paper; promotion-ready; earliest phase visible to clients in FOMO | $0 (sim)        |
| `live_early`          | Initial live; seed capital ($100–$1,000)                                | Seed cap        |
| `live_stable`         | Mature live; scaled capital                                             | Production      |
| `retired`             | Terminal; P&L history preserved                                         | 0               |

Transitions are forward-only. Retirement is terminal (clone as new instance_id to restart). Clients see FOMO allocation CTA only for `paper_stable` or later.

### 4. Product routing (who can see an instance)

| Value           | Audience                     |
| --------------- | ---------------------------- |
| `dart_only`     | DART execution clients       |
| `im_only`       | IM Pooled + IM SMA clients   |
| `both`          | DART + IM                    |
| `internal_only` | Internal-trader / admin only |

### 5. Venue-set variants (the upsell ladder)

Each archetype ships multiple `VenueSetVariant` entries differentiating by which venues the instance executes on. Variants map to pricing tiers: `base`, `premium`, `top_tier`, `apex`. Each variant is a distinct `StrategyInstance` with its own `instance_id`, `odum-paper` P&L series, and maturity phase. Upgrading clients subscribe to a different instance.

### 6. Polymorphic StrategyInstruction (11 action types)

All families communicate with execution via one protocol:

| Action     | Semantics                                          |
| ---------- | -------------------------------------------------- |
| `TRADE`    | position_units on instrument                       |
| `SWAP`     | one-shot fungible exchange                         |
| `LEND`     | supplied_amount on lending protocol                |
| `BORROW`   | debt_amount on lending protocol                    |
| `STAKE`    | staked_amount on staking protocol                  |
| `UNSTAKE`  | unstake amount                                     |
| `QUOTE`    | continuous two-sided quote with spread + inventory |
| `TRANSFER` | target balance at same-chain destination           |
| `BRIDGE`   | cross-chain move                                   |
| `ATOMIC`   | multi-leg bundle (all-or-nothing)                  |
| `CANCEL`   | abort prior instruction by ID                      |

Strategy emits target state (not deltas); execution picks the algo.

### 7. Capital flow lifecycle

Three scopes: venue-level (`Transfer/Rebalance` service), strategy-level (`Portfolio Allocator`), client-level (platform Treasury + onboarding). All three emit the same event primitives (`TRANSFER`, `BRIDGE`, `AllocationDirective`). Custody model varies by venue category (DeFi = client wallet via Copper/Fireblocks; Sports = firm-managed Unity pool; CeFi SMA = client CEX account; CeFi fund = firm treasury; TradFi = IBKR tunnel per client).

### 8. 3-Axis versioning

- Code/build version (git SHA, semver)
- Artifact version (content hash + monotonic): feature groups, ML models, execution policies, allocator algorithms, risk policies, venue capabilities, strategy configs
- Schema version (UAC semver)

Consumers reference artifacts by explicit version; no auto-upgrade anywhere.

### 9. Benchmark fills contract (Batch = Live)

Batch backtests use benchmark fills (zero execution alpha). Live measures alpha vs benchmark. This isolates strategy alpha from execution alpha across 3 backtest groups: A (ML training), B (strategy), C (execution alpha).

### 10. Lock state (commercial reserve)

Default lock state for most cells: `INVESTMENT_MANAGEMENT_RESERVED`. As of 2026-04-20 snapshot, only `STAT_ARB_PAIRS_FIXED × CEFI × spot|perp` is `PUBLIC`. IM-reserved cells currently running for IM clients include ML Directional (Binance/Coinbase/Hyperliquid BTC ML, Jun 2026), ML Directional (CME S&P futures, Sept 2026), Vol Trading (NSE India options, Oct 2026), ML Event-Settled (Betfair/Betradar sports ML, Jun 2026).

### 11. UI surfaces specified in codex

The following UI surfaces are directly specified or SSOT'd in the 09-strategy codex:

| UI surface                                      | SSOT doc                            | Status                                                         |
| ----------------------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| `/services/strategy-catalogue`                  | `strategy-catalogue-3tier.md`       | Live (Plan A Phase 2 data wired)                               |
| `/services/admin/strategy-universe`             | `strategy-catalogue-3tier.md §2`    | Live                                                           |
| `/services/admin/strategy-lifecycle-editor`     | `strategy-catalogue-3tier.md §3`    | Live (PATCH endpoint pending Plan A Phase 3)                   |
| `<StrategyCatalogueSurface>` component          | `strategy-catalogue-3tier.md`       | Live                                                           |
| `<FomoTearsheetCard>` component                 | `strategy-catalogue-3tier.md §4.2`  | Live; P&L from `odum-live`, never client data                  |
| `<RealityPositionCard>` component               | `strategy-catalogue-3tier.md §4.1`  | Live                                                           |
| `<PerformanceOverlay>` component                | `performance-overlay.md`            | Pending Plan C (placeholder in use)                            |
| `/services/strategy-catalogue/coverage/blocked` | `block-list.md`                     | Specified; runtime file at `lib/architecture-v2/block-list.ts` |
| DART sub-tab catalogue                          | `dart-tab-structure.md`             | Canonical                                                      |
| Questionnaire → Explore filter seeding          | `strategy-questionnaire-mapping.md` | Live (2026-04-24)                                              |
| `lib/architecture-v2/families.ts`               | `restriction-policy.md §2`          | Specified as SSOT                                              |
| `lib/architecture-v2/coverage.ts`               | `category-instrument-coverage.md`   | Auto-generated from UAC manifest                               |
| `lib/architecture-v2/block-list.ts`             | `block-list.md`                     | Manual sync required with codex                                |
| `lib/registry/ui-reference-data.json`           | `strategy-lifecycle-maturity.md §6` | Generated on UAC merge; UI reads snapshot                      |

### 12. Tier gating (DART Full vs Signals-In)

4 archetypes are Full-only: `ML_DIRECTIONAL_CONTINUOUS`, `ML_DIRECTIONAL_EVENT_SETTLED`, `EVENT_DRIVEN`, `VOL_TRADING_OPTIONS`. The other 14 are available in both tiers. The `<FomoTearsheetCard>` renders an amber "DART Full only" badge on Full-only archetypes when the viewer is Signals-In.

---

## Observations (factual only)

### Well-defined areas

- The 8-family / 18-archetype taxonomy is complete and internally consistent. Every legacy doc and code module in `_archived_pre_v2/` has an explicit v2 mapping in `MIGRATION.md` — nothing is silently dropped.
- The 5-layer identity model (family → archetype → instance → config → derived categories) and the slot-label grammar are unambiguously specified and mirrored in UAC Python code.
- Capital flow events and custody models are documented with enough precision to implement (worked examples 1-3 in `README.md` cover DeFi multichain, CeFi dual-strategy on single account, and Sports Unity pool).
- All 10 cross-cutting concerns have dedicated docs and are spec'd to implementation level.
- The block list (`BL-1..BL-10`) is traceable: each entry links to a UAC gap ref, a remediation path, and a mirror TypeScript file.

### Areas that are stubbed / partial

- `strategy-summary.md` is too large to read in full (>25K tokens). Its relationship to `architecture-v2/README.md` is unclear — it may be a narrative companion or a legacy summary superseded by v2 docs.
- Firestore-backed lifecycle state (`strategy_instance_lifecycle/{id}`) is noted as "Pending Plan A Phase 3" in `strategy-catalogue-3tier.md §9`; the `admin-editor` PATCH endpoint and live maturity/routing are still hash-synthesised in the UI.
- `<PerformanceOverlay>` is a placeholder in FOMO tearsheets (Plan C pending); Sharpe/MDD/CAGR/CAGR remain synthesised.
- Per-trader-archetype mappings to strategy families are not stated explicitly in the family docs. The only mapping is `restriction-policy.md` declaring product routing (dart_only / im_only / both / internal_only) per instance, but no direct "Marcus uses VOL_TRADING" or "Julius uses CARRY_AND_YIELD" statement was found in the 09-strategy docs.
- `architecture-v2/dart-exclusive-research-fork.md`, `instruments-resolver-architecture.md`, `tradfi-bond-instrument-type-decision.md`, `value-betting-archetype-decision.md`, and `uac-registry-gaps.md` were not read in full; they are decision records and supporting docs, not family specs.

### Inconsistencies or gaps

- **Prediction markets** appear as a venue category in 5-category coverage (`SPORTS & PREDICTION`) but are named inconsistently. The codex README uses 5 categories; `category-instrument-coverage.md` table merges Sports and Prediction into one row ("Sports & Prediction") while other docs treat them as separate (`VenueCategoryV2` enum has both `SPORTS` and `PREDICTION`). The `cross-cutting/prediction-markets.md` and `cross-cutting/prediction-markets-codification-gaps.md` docs exist outside `architecture-v2/`, suggesting Prediction markets are partially codified.
- **DeFi options** are hard-blocked (BL-1: Lyra and Dopex archived 2026-03; no replacement in UAC). This blocks `VOL_TRADING_OPTIONS × DEFI`, `ARBITRAGE_PRICE_DISPERSION × DEFI × option`, `MARKET_MAKING_CONTINUOUS × DEFI × option`, and `ML/RULES_DIRECTIONAL × DEFI × option`.
- **STAT_ARB_CROSS_SECTIONAL** has no legacy doc or code counterpart — it is new in v2. This means there is no migration path for it; it is a purely additive archetype.
- **EVENT_DRIVEN** also had no dedicated legacy doc (code-level feature only). v2 introduces formal family status, but it has no legacy code migration listed beyond `event_driven_macro.py`.
- The venue-set variant ladder example in `strategy-lifecycle-maturity.md §3` uses an archetype called `DEFI_BASIS_ELYSIUM` which does not appear in the 18-archetype canonical list. This may be a trade name / product name layered on top of `CARRY_BASIS_PERP` or a planned archetype not yet in the enum; requires clarification before UI rendering.
- The block list notes `BL-4` blocks `RULES_DIRECTIONAL × CEFI × option` and `RULES_DIRECTIONAL × TRADFI × option`, and `BL-10` flags TRADFI × dated_future requires roll service — but BL-4 and BL-10 bodies were not fully read (only the header section of `block-list.md` was captured; blocks BL-2 through BL-10 were not fetched).

### Surprising findings

- **Active LP (Uniswap V3, Orca) is Market Making, not Carry & Yield.** The edge is spread/fee capture for providing liquidity, not yield rate. This means DeFi LP widget surfaces should be grouped under Market Making in any family-grouped UI.
- **The lock state is almost entirely IM-reserved.** As of 2026-04-20, `STAT_ARB_PAIRS_FIXED × CEFI × spot|perp` is the only `PUBLIC` cell in the entire coverage matrix. DART clients in the catalogue FOMO view are looking at strategies that are commercially reserved by IM — the "Explore" tab is showing IM-reserved strategies as tearsheets for discovery, not for self-service subscription.
- **Sports MM is Market Making, not a standalone family.** `sports/market-making.md` (legacy) maps to `MARKET_MAKING_EVENT_SETTLED`. The same engine covers CEX MM and sports book quoting.
- **Value betting (sports) is ML Directional, not its own family.** Confirmed by `value-betting-archetype-decision.md` existence. `sports/value-betting.md` maps to `ML_DIRECTIONAL_EVENT_SETTLED`. The value betting label is an edge method within the archetype, not a distinct archetype.
- **Cross-venue vol arb belongs to Arbitrage, not Vol Trading.** The codex is explicit: if the same option is quoted at different IVs on Deribit vs OKX (mechanical dispersion), it is `ARBITRAGE_PRICE_DISPERSION`. Only statistical vol views (IV/RV, skew, soft surface residuals) belong in `VOL_TRADING`. This boundary matters for UI grouping of any options-related widget.
- **`odum-paper` and `odum-live` are regular client records.** They run every instance from `paper_1d` phase onward. FOMO tearsheets show Odum's own runs, never real client data. This is explicitly enforced by the FOMO card spec.
