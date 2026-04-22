# Strategy Architecture v2 — Summary

**What it is:** The canonical, clean-start architecture (dated 2026-04-17) for every trading strategy in the Unified Trading System. It lives in [codex/09-strategy/architecture-v2/](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-pm/codex/09-strategy/architecture-v2/) and supersedes the previous per-category structure (cefi / defi / sports / tradfi / prediction), which is now reference-only.

**Core mental model:** Every strategy decomposes into:

| Layer                  | Count | What it captures                                                                                                                                             |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Families               | 8     | Orthogonal alpha styles (ML Directional, Rules Directional, Carry & Yield, Arbitrage/Structural, Market Making, Event-Driven, Vol Trading, Stat Arb/Pairs)   |
| Archetypes             | 18    | Specific code paths within a family (e.g.`CARRY_BASIS_PERP`, `ML_DIRECTIONAL_CONTINUOUS`)                                                                    |
| Axes of composition    | 7     | signal × edge × staking × venue × expression × hold-policy × share-class                                                                                     |
| Cross-cutting concerns | 10    | Risk gates, venue selection, execution policies, transfers, allocator, MEV, benchmark fills, capital isolation, trade expression, venue-account coordination |

A strategy's identity has **5 layers** : family → archetype → instance → config → derived categories. Communication with execution happens through a **polymorphic `StrategyInstruction`** with 11 action types (TRADE, SWAP, LEND, BORROW, STAKE, UNSTAKE, QUOTE, TRANSFER, BRIDGE, ATOMIC, CANCEL).

**Main use / why it exists:**

1. **Collapse 53+ strategies into ~18 code paths** served by shared family engines — new strategies become config, not new code.
2. **Categories become derived labels** , not routing axes — no more `CEFI_ML_DIRECTIONAL_BTC` vs `TRADFI_ML_DIRECTIONAL_SPY` duplication.
3. **Unify capital flow** across DeFi bridges, CEX wallet transfers, Unity sports pools, and TradFi tunnels via a single event-driven primitive (`TRANSFER` / `BRIDGE` / `AllocationDirective`).
4. **Versioned, opt-in artifacts** for feature groups, ML models, execution policies, risk policies, venue capabilities — no auto-upgrades.
5. **Batch = live** via the benchmark-fills contract, so strategy alpha is isolated from execution alpha.
6. **Target ceiling** of ~240-300 strategy instances without code explosion.

**How it's used in practice:** Implementers read the protocol spec + identity-versioning rules; strategy designers pick a family doc then an archetype doc; operators focus on portfolio-allocator + venue-account-coordination; UI/reporting consumes the derived-categories and share-class axes. Migration tracking for every legacy doc/strategy lives in [MIGRATION.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md).

# The 8 Families — One-Liner Each

| #   | Family                          | Core idea                                                                                               | Example                                                                                                 |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **ML Directional**              | A trained model predicts outcome probability; trade when model prob diverges from implied/market price. | ML model says BTC 5m up-move prob = 58%, market implies 50% → go long.                                  |
| 2   | **Rules Directional**           | Hard-coded if/then rules on features fire signals — no model, just thresholds.                          | "If RSI < 30 AND funding < 0 → buy."                                                                    |
| 3   | **Carry & Yield**               | Capture a rate/yield differential by holding a spread, earning funding, lending, staking, or basis.     | Long spot BTC + short perp BTC → earn positive funding.                                                 |
| 4   | **Arbitrage / Structural Edge** | Near-risk-free payment from price dispersion or protocol mechanics.                                     | Buy on Pinnacle, lay on Betfair at better odds → locked profit; or capture a liquidation bonus on Aave. |
| 5   | **Market Making**               | Post two-sided quotes and earn the bid-ask spread while managing inventory risk.                        | Quote Betfair EPL 1X2 at 1-tick spread; rebalance as fills arrive.                                      |
| 6   | **Event-Driven**                | Scheduled external event with measurable surprise drives the trade (earnings, CPI, fixture news).       | Buy straddle before FOMC; unwind after surprise is priced.                                              |
| 7   | **Vol Trading**                 | Alpha comes from vol metrics themselves — IV vs RV, skew, term structure, cross-asset vol.              | Sell Deribit BTC 30d IV when it trades rich vs realized.                                                |
| 8   | **Stat Arb / Pairs**            | Spread between two correlated underlyings mean-reverts or trends.                                       | Long GOOG / short META when z-score of spread < −2.                                                     |

**Key rule:** one family per strategy — assigned by the _primary_ alpha source. "ML directional with a vol hedge" is still ML Directional; the vol leg is just risk management, not a composite.

# The 8 Families — Pulled directly from the family docs

**1. ML Directional** — [families/ml-directional.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/ml-directional.md)

- **Alpha source:** Machine-learning model prediction of outcome probability vs. market-implied probability. When model probability exceeds implied by a threshold, a bet is placed with stake sized by signal strength.
- **Primary edge method:** Value (`model_prob > implied_prob + min_edge_threshold`).
- **Covers:** Crypto ML (BTC/ETH/SOL direction on perps, spot, options), Equity ML (SPY/QQQ/individual stocks), Sports ML (1X2, O/U, BTTS), Options ML, Binary prediction-market ML (Polymarket).

**2. Rules Directional** — [families/rules-directional.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/rules-directional.md)

- **Alpha source:** Hard-coded if-else rules on features that produce discrete fire/no-fire signals. Each rule encodes a specific behavioural or statistical hypothesis.
- **Primary edge method:** Threshold-crossed (rule fires when feature values meet condition).
- **Examples from the doc:** "when 20-day z-score > 2.0 and volume > 1.2x average, go long"; "when RSI < 30 and MACD crosses up, buy"; "when home team scores first within 20 min, back away team for HT draw"; "when HT score is 0-0 and both teams have ≥0.5 xG, back over 0.5 goals 2H".

**3. Carry & Yield** — [families/carry-and-yield.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/carry-and-yield.md)

- **Alpha source:** Rate / yield differential capture. Whether funding on a perp, lending APY, staking reward, or basis spread on a dated future — the common thesis is capturing a paid rate that compensates for holding a position.
- **Primary edge method:** Rate-differential sustained above a cost threshold.
- **Sub-patterns:** Basis dated (long spot + short dated future), Basis perp (long spot + short perp for funding), Staked basis (stake ETH → stETH → Aave pledge → short perp), Recursive staked basis, Yield rotation across lending protocols, Simple staking.

**4. Arbitrage / Structural Edge** — [families/arbitrage-structural.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/arbitrage-structural.md)

- **Alpha source:** Price dispersion between markets OR structural payment from protocol mechanics. Edge is largely risk-free (or near-risk-free) conditional on correct execution. NOT directional — no view on where prices go.
- **Primary edge method:** Spread > cost (dispersion) OR structural bonus > cost (protocol-mechanic).
- **Examples from the doc:** Cross-CEX arb, cross-DEX arb, flash-loan DEX arb, sports cross-book arb, cross-category (Polymarket-Betfair), cross-venue vol arb (same option quoted at different IVs on Deribit vs OKX), hard no-arb violations (butterfly / calendar / put-call parity), Aave/Compound/Euler/Morpho liquidation capture.

**5. Market Making** — [families/market-making.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/market-making.md)

- **Alpha source:** Bid-ask spread capture via two-sided quoting around a theoretical fair price. We provide liquidity; we earn spread minus adverse selection.
- **Primary edge method:** Spread capture, net of adverse selection + inventory risk + fees.
- **Covers:** CEX spot/perp MM (Binance, OKX, Bybit, Hyperliquid, Deribit), Options MM (Deribit, CBOE SPY), DeFi active LP (Uniswap V3 concentrated, Orca on Solana), Sports exchange MM (Betfair, Smarkets, Matchbook), Cross-venue MM.

**6. Event-Driven** — [families/event-driven.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/event-driven.md)

- **Alpha source:** Scheduled external events with measurable surprise. When an event releases (FOMC, CPI, NFP, earnings, OPEC), the event's surprise relative to consensus produces a measurable, time-bounded reaction.
- **Primary edge method:** `surprise magnitude × model-predicted direction > threshold`, within a bounded time window around the event.
- **Examples from the doc:** FOMC rate decisions, US CPI/PPI/PCE releases, US Non-Farm Payrolls, OPEC/OPEC+ meetings, EIA crude inventory release, corporate earnings, ECB/BoE/BoJ rate decisions, China economic data.

**7. Vol Trading** — [families/vol-trading.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/vol-trading.md)

- **Alpha source:** Volatility-metric dislocation. Alpha is a view on vol itself (IV vs RV, skew, term structure, cross-asset vol) — not a directional view on the underlying. Baseline positions are delta-hedged; P&L comes from vega, gamma, theta.
- **Primary edge method:** Vol-metric dislocation vs fair (IV too rich/cheap vs realized; skew extreme vs historical; term structure bowed beyond no-arb bounds).
- **Sub-patterns from the doc:** IV vs RV, skew dislocation (e.g., 25d put skew rich vs historical → risk reversal), term structure (calendar trades), soft surface residuals (SVI fit residuals suggesting rich/cheap strikes), cross-asset vol.

**8. Stat Arb / Pairs** — [families/stat-arb-pairs.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/families/stat-arb-pairs.md)

- **Alpha source:** Statistical spread between two or more underlyings that mean-reverts (or trends) against a historical relationship. Unlike price-dispersion arb, Stat Arb has spread risk — relationship can break — statistically, not mechanically, profitable.
- **Primary edge method:** Spread z-score mean-reversion (or less commonly, spread momentum / divergence).
- **Examples from the doc:** Fixed pairs — GOOG-META, ES-NQ, BTC-ETH, XLE-SPY (cointegration-tested); Cross-sectional — rank all assets in a universe by a signal (e.g., cross-sectional ML), long top-N / short bottom-N, e.g. Russell 1000 daily, crypto top-50 hourly.

**Distinguishing test called out in the docs:** is the edge _mechanical_ (guaranteed conditional on correct execution) or _statistical_ (profitable on average with spread risk)? Mechanical → Arbitrage. Statistical → Vol Trading / Stat Arb.

# The 18 Archetypes — pulled from each archetype doc

## ML Directional (2)

**`ML_DIRECTIONAL_CONTINUOUS`** — [archetypes/ml-directional-continuous.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/ml-directional-continuous.md)
Consumes probability predictions from an ML model (per direction, per instrument), compares to market-implied probability, and emits target-state trade instructions when edge + confidence thresholds are met. Flow: model inference → calibration → implied-from-mid → edge = calibrated_P − implied_P → confidence/edge gates → Kelly-sized stake → emit `TRADE`. Held until `HOLD_UNTIL_FLIP` or `SAME_CANDLE_EXIT`.

**`ML_DIRECTIONAL_EVENT_SETTLED`** — [archetypes/ml-directional-event-settled.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/ml-directional-event-settled.md)
Same value-edge logic but for event-settled markets (sports 1X2, O/U, BTTS, prediction binaries). Flow adds: implied from `1/decimal_odds` (optionally vig-free), odds gate (`decimal_odds ≤ max_odds`), best-odds selection across eligible books (Unity routes per outcome). Stakes settle at event resolution.

## Rules Directional (2)

**`RULES_DIRECTIONAL_CONTINUOUS`** — [archetypes/rules-directional-continuous.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/rules-directional-continuous.md)
Evaluates a registry of explicit if-else rules on features. When a rule fires, emit a directional signal; stake is rule-specific (fixed % equity or calibrated from backtested hit rate). Engine does feature read → rule eval → conflict resolution (priority / unanimity / highest-confidence) → emit `TRADE`.

**`RULES_DIRECTIONAL_EVENT_SETTLED`** — [archetypes/rules-directional-event-settled.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/rules-directional-event-settled.md)
Same rules engine but targeting sports / prediction markets. Flow adds market-availability check, odds gate, best-odds routing; bets settle standard WON/LOST/VOID.

## Carry & Yield (6)

**`CARRY_BASIS_DATED`** — [archetypes/carry-basis-dated.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-dated.md)
Long spot + short dated future. Captures futures–spot premium (contango) or discount (backwardation) as the spread converges to zero at expiry. Near-atomic paired entry; exits on convergence, expiry, or stop-loss on adverse widening.

**`CARRY_BASIS_PERP`** — [archetypes/carry-basis-perp.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-perp.md)
Long spot + short perpetual. Captures funding rate while delta-neutral; ATOMIC when both legs on same venue (e.g., Binance cross-margin netting — "enormous capital efficiency"), LEADER_HEDGE cross-venue. Rebalance triggers: funding drops below exit, better funding elsewhere, delta drift, equity change.

**`CARRY_STAKED_BASIS`** — [archetypes/carry-staked-basis.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-staked-basis.md)
Three-leg: stake native → LST → pledge LST on lending protocol → borrow base → short perp. Earns staking yield + funding simultaneously on same capital. Net carry = staking yield + funding − borrow cost − fees. Kill switch on stETH depeg.

**`CARRY_RECURSIVE_STAKED`** — [archetypes/carry-recursive-staked.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-recursive-staked.md)
Recursive leveraging of a staking position: stake → pledge → borrow → stake → ... Effective leverage ≈ `1 / (1 − LTV × safety)`, typically 3-4× on ETH. Captures leveraged staking yield with cascading liquidation risk; unwind respects LST unbonding period.

**`YIELD_ROTATION_LENDING`** — [archetypes/yield-rotation-lending.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-rotation-lending.md)
Single-sided supply (no leverage) rotated across chains/protocols based on APY. Continuous APY monitor → target allocation per (protocol, chain) → `LEND` + `BRIDGE` instructions. Gas-aware: skip rebalance if gas > expected uplift.

**`YIELD_STAKING_SIMPLE`** — [archetypes/yield-staking-simple.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-staking-simple.md)
Pure staking — deposit native PoS asset into liquid staking protocol (Lido → stETH, Rocket Pool → rETH, Jito → JitoSOL, Marinade → mSOL), hold, exit via DEX swap or withdrawal queue. No basis leg, no leverage, no directional view.

## Arbitrage / Structural (2)

**`ARBITRAGE_PRICE_DISPERSION`** — [archetypes/arbitrage-price-dispersion.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/arbitrage-price-dispersion.md)
Detects price dispersion between venues on the same/equivalent instrument and locks in the spread net of costs. Covers cross-CEX, cross-DEX (optional flash loan), sports cross-book (via Unity), cross-category (Polymarket ↔ Betfair), cross-venue vol arb, within-venue no-arb violations (butterfly/calendar/put-call parity), funding-rate dispersion. ATOMIC where supported, LEADER_HEDGE otherwise.

**`LIQUIDATION_CAPTURE`** — [archetypes/liquidation-capture.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/liquidation-capture.md)
Monitors under-collateralised DeFi lending positions and executes liquidations to capture the protocol's paid bonus (typically 5-10% of seized collateral). Zero directional risk. Health-factor watcher → flash-loan + repay + seize + DEX swap + repay-flash-loan, all in a multicall bundle submitted via Flashbots for MEV protection.

## Market Making (2)

**`MARKET_MAKING_CONTINUOUS`** — [archetypes/market-making-continuous.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/market-making-continuous.md)
Two-sided quoting around a theoretical fair price. Covers CLOB MM (Binance/OKX/Bybit/Hyperliquid/Deribit/Betfair/Unity), AMM concentrated-liquidity "active LP" (Uniswap V3/V4, Orca, Aerodrome, Raydium CLMM, Joe V2), and passive full-curve LP. Inventory-aware skewing, delta-proxy repricer (sub-ms), kill switches on price/spread/inventory breaches. Highest latency budget of any archetype (40 ms, premium tier, strategy-service co-located with execution).

**`MARKET_MAKING_EVENT_SETTLED`** — [archetypes/market-making-event-settled.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/market-making-event-settled.md)
Back + lay quoting on sports exchanges (Betfair, Smarkets, Matchbook, Betdaq) and prediction markets (Polymarket). Theo from sharp-book reference / vig-free consensus / model-derived / fitted mid; inventory skew; delta-proxy repricer; cancel quotes near event start so MM book isn't carried into the match.

## Event-Driven (1)

**`EVENT_DRIVEN`** — [archetypes/event-driven.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/event-driven.md)
Schedules positioning around known external events (FOMC, CPI, NFP, OPEC, earnings, EIA). At release tick: surprise = (realized − consensus) / σ_forecasts; direction model maps surprise → per-instrument direction; emit `TRADE` at HIGH/EMERGENCY urgency (typically MARKET orders); flatten at `T + event_window_minutes`.

## Vol Trading (1)

**`VOL_TRADING_OPTIONS`** — [archetypes/vol-trading-options.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/vol-trading-options.md)
Delta-hedged options expression of a vol view. Surface fitter (SVI/SSVI) → vol dislocation scanner (IV vs RV, skew extreme, term bowed, soft surface residuals — hard no-arb violations are routed to `ARBITRAGE_PRICE_DISPERSION`). Trade constructors: straddle, strangle, butterfly, calendar, risk reversal, single-leg + delta hedge (gamma scalping). P&L from vega/gamma/theta — not delta.

## Stat Arb / Pairs (2)

**`STAT_ARB_PAIRS_FIXED`** — [archetypes/stat-arb-pairs-fixed.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/stat-arb-pairs-fixed.md)
Pre-determined, cointegration-tested or historical-beta-stable pair. `spread = price_A − hedge_ratio × price_B`; z-score vs rolling mean/std. Entry on `|z| > entry_threshold AND cointegration_pvalue < 0.05`. Exits on convergence, p-value degrading > 0.15, max-z stop, or max_hold_bars.

**`STAT_ARB_CROSS_SECTIONAL`** — [archetypes/stat-arb-cross-sectional.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/stat-arb-cross-sectional.md)
Universe-wide ranking (Russell 1000, S&P 500, crypto top-50). Cross-sectional ML/factor model scores each member; long top-M, short bottom-M; equal-weight / rank-weighted / confidence-weighted. Members rotate each rebalance. "Joint reasoning over the whole universe — this is what distinguishes it from running N independent ML directional strategies."

---

**Coverage note from the docs:** each archetype declares `topology_requirements` frontmatter (isolation, co-location, latency budget, min SLA tier). MM archetypes are the only ones needing premium tier + strategy-service isolated + co-located with execution (40 ms budget). Rules/yield archetypes sit on basic tier (500 ms). Everything else is standard tier (150 ms).

# The 7 Axes — pulled from each axis doc

**1. Signal Source** — [axes/signal-sources.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/axes/signal-sources.md)
The mechanism that produces the raw decision trigger — _how_ the alpha is generated. Catalog:

- **ML models** (binary classifier, multi-class, regression, cross-sectional ranking, probability calibration)
- **Rules engines** (TA indicators, feature-condition rules, regime classifiers, pattern match)
- **Rate / yield monitors** (funding, lending APY, staking reward, basis spread)
- **Orderbook / microstructure** (L2 depth, theo fair-value, reference price, inventory state)
- **Price-dispersion scanners** (cross-venue same-instrument, funding dispersion, vol dispersion, aggregated sports books)
- **Protocol state watchers (DeFi)** (health factor, pool TVL/volume, oracle vs market, gas)
- **Event calendars** (macro, earnings, sports fixtures, crypto-specific)
- **Vol metrics** (IV surface fitter, realized vol, skew, percentiles)
- **Spread models** (rolling OLS, Kalman, cointegration, factor models)
- **Mempool** (pending swap watcher, oracle update pending — DeFi-specific)

Every signal source is a versioned artifact; strategy configs reference by explicit version.

**2. Edge Method** — [axes/edge-methods.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/axes/edge-methods.md)
The rule for "when should this fire?" — turns a raw signal into a bet decision. Signal source produces data; edge method decides whether to act on it. Catalog:

- **Value** (`model_prob > implied + threshold`) — ML Directional
- **Threshold-crossed** (rule fires when feature crosses) — Rules Directional
- **Rate-differential sustained** — Carry & Yield
- **Spread capture** (post liquidity, earn spread) — Market Making
- **Arbitrage** (dispersion > cost) — Arbitrage / Structural
- **Structural bonus** (protocol-paid) — Liquidation Capture
- **Z-score / mean-reversion** — Stat Arb (also some Rules)
- **Momentum / trend** — Rules Directional
- **Vol-metric dislocation** — Vol Trading
- **Surprise-magnitude × direction model** — Event-Driven

**3. Staking Method (Position Sizing)** — [axes/staking-methods.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/axes/staking-methods.md)
How much to bet once the edge method has said "yes." Orthogonal to edge method. Catalog:

- **Fractional Kelly** (ML Directional; 0.25×/0.5×/1.0× multipliers)
- **Confidence-scaled** (ML with calibrated models)
- **Fixed % of equity** (Rules, Carry, many defaults; 1-3% sports, 5-15% continuous ML, 10-25% carry)
- **Fixed notional $** (Arbitrage per-opp, some Carry)
- **Vol-scaled** (Rules, TradFi equity)
- **Delta-neutral paired** (Carry basis, Stat Arb pairs)
- **Inventory-skewed** (Market Making)
- **Vega / Gamma notional cap** (Vol Trading, Options MM)
- **Tier-based (confidence × edge)**
- **Rank-weighted** / **Equal-weight** (Stat Arb Cross-Sectional)

Final size is always capped by `min(staking_output, per_instrument_cap, family_cap, venue_account_headroom, post_kill_switch_reduction)`. Martingale and Roll-up are explicitly unsupported (ruin risk).

**4. Venue Eligibility** — [axes/venue-eligibility.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/axes/venue-eligibility.md)
The _slow-moving_ venue dimension — which venues a strategy is allowed to use, plus per-venue constraints. Fast-moving pick (SOR at tick time) is execution-service's job. Config declares:

- **Venue set** (e.g., `BINANCE, OKX, BYBIT` or `UNISWAP_V3_ETHEREUM/ARBITRUM/OPTIMISM`)
- **Venue-specific constraints** (`max_notional_usd`, `min_liquidity_usd`, `fee_tier`, pool TVL / fee tier for DEXes)
- **Child-book eligibility** (Unity meta-broker: eligible list + preferred/avoid order)
- **Chain eligibility** (DeFi)
- **Credential + capability gating** (auto-filtered on missing secrets, adapter action support, venue capability registry)

Routing mode: `SOR_AT_EXECUTION` (fungible), `STRATEGY_PICKED` (non-fungible perps/options/sports lines), or `META_BROKER` (Unity routes internally).

**5. Expression** — [axes/expression.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/axes/expression.md)
How the view is translated into instruments actually traded. Independent of signal source and edge method — a value-edge ML view can be expressed as spot OR perp OR ATM call OR 25-delta call. Catalog:

- **Cash-equivalent directional** : `SPOT`, `PERP`, `DATED_FUTURE`, `MARGIN`
- **Options** : `ATM_CALL/PUT`, `NDD_CALL/PUT` (25d/10d), `OTM_CALL/PUT`, `STRADDLE`, `STRANGLE`, `CALL_SPREAD/PUT_SPREAD`, `CALENDAR`, `BUTTERFLY`, `RISK_REVERSAL`, `IRON_CONDOR`
- **DeFi / on-chain** : `DEX_SWAP`, `LP_PASSIVE`, `LP_ACTIVE`, `LEND`, `BORROW`, `STAKE_LIQUID`, `STAKE_NATIVE`, `LEVERAGED_LENDING_LOOP`
- **Sports / prediction** : `BET_BACK`, `BET_LAY`, `BET_BACK_ARB_SET`, `BET_CLOB_YES/NO`
- **Synthetic / structured** : `SYNTHETIC_PERP_FROM_OPTIONS`, `SYNTHETIC_SPOT_FROM_PERP_FUNDING`, `BASKET`, `DELTA_HEDGED_OPTION`, `PAIRED_SPREAD`
- **`AUTO`** : execution picks optimal expression given conditions (rare)

Driven by capital efficiency, funding/borrow cost, convexity needs, share-class match, venue availability, regulatory, expiry alignment, greek profile.

**6. Hold Policy** — [axes/hold-policy.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/axes/hold-policy.md)
How long a position lives and what triggers its exit. Drives P&L attribution and fixes which exit mechanics the strategy emits. Catalog:

- **`SAME_CANDLE_EXIT`** — entered + exited within same bar (ML Continuous with TP/SL). Never used on DeFi (gas + confirmation latency).
- **`HOLD_UNTIL_FLIP`** — held until signal flips / spread converges / funding flips (most ML Continuous, Rules trend-following, Carry, Stat Arb). Default for all DeFi.
- **`CONTINUOUS`** — always-on quoting; no entry/exit, inventory tilts around target (Market Making, LP).
- **`ONE_SHOT`** — fixed-rule unwind (Arbitrage, Liquidation, Event-Driven, event-settled ML/Rules, sports bets).
- **`EXPIRY_DRIVEN`** — lives until instrument expires (Vol Trading Options, Carry Basis Dated).
- **`CONVERGENCE_DRIVEN`** — closes when spread/residual converges to band (Stat Arb Pairs Fixed, some Cross-Sectional, basis arb variants).
- **`REBALANCE_DRIVEN`** — moving target, reconciled each rebalance tick; exits implicit when target weight → 0 (Stat Arb Cross-Sectional, Yield Rotation, LP allocation, allocator-directed).

**7. Share Class** — [axes/share-class.md](vscode-webview://09jfvupa03v4sfnuon9htjsoeab7rbdp72dj30bd86vckd3bkckv/unified-trading-system-repos/unified-trading-pm/codex/09-strategy/architecture-v2/axes/share-class.md)
The accounting currency for a strategy instance — denominator for all P&L, NAV, Sharpe, and allocation decisions. **Structural per-instance field — not a config knob; different share class = different instance.** Supported:

- **Stablecoin** : `USDT`, `USDC`, `FDUSD`
- **Fiat** : `USD`, `GBP`, `EUR`
- **Crypto-native** : `ETH`, `BTC`, `SOL`

Chosen by venue margin unit, client mandate, fund structure, asset-native economics, regulatory context. Cross-currency policy declared in config (`HEDGE_ON_ENTRY` / `HEDGE_ON_EXIT` / `ACCEPT` / `REBALANCE_PERIODICALLY`) — e.g., a USD-share-class strategy running on USDT-margined Binance carries USD↔USDT basis risk explicitly handled per policy.

---

**Key composition rule across the axes:** they are orthogonal — signal source feeds into edge method, which triggers staking method to size; expression picks the instrument; venue eligibility constrains where it can land; hold policy controls life; share class is the accounting unit. Changing any one axis typically produces a new config hash but not necessarily a new archetype.
