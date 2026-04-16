# Unified Trading System UI — Browser-agent handbook (mock / static)

**You only have the browser.** You cannot read the codebase. This document is the **full extended context** (Codex-aligned tables per strategy family) for evaluating whether the static/mock UI correctly represents the platform and **every catalogued strategy family**.

**How to use:** Log in with demo personas, navigate using the URLs below, and for each strategy section check whether the UI exposes **credible** labels, filters, or data that match **what that strategy is**, **what it consumes**, and **how operators would monitor it**. Mark PASS / PARTIAL / FAIL per strategy.

---

## Table of contents

1. [Mock mode and login](#1-mock-mode-and-login)
2. [URLs to sweep](#2-urls-to-sweep)
3. [Demo personas](#3-demo-personas)
4. [Global rules (all strategies)](#4-global-rules-all-strategies)
5. [Cross-cutting themes the UI should surface](#5-cross-cutting-themes-the-ui-should-surface)
6. [DeFi strategies](#6-defi-strategies)
7. [CeFi strategies](#7-cefi-strategies)
8. [TradFi strategies](#8-tradfi-strategies)
9. [Sports strategies](#9-sports-strategies)
10. [Prediction markets & cross-venue arb](#10-prediction-markets--cross-venue-arb)
11. [Kelly criterion (sports sizing)](#11-kelly-criterion-sports-sizing)
12. [Per-strategy UI checklist (copy for notes)](#12-per-strategy-ui-checklist-copy-for-notes)

---

## 1. Mock mode and login

- The app may be hosted as a **static preview** with **mock API** enabled at build time (no real backends). You should still see populated lists, charts, and strategy names.
- Open **`/login`**. Use **Internal** vs **Client** toggles if shown, then pick a demo user (admin, internal trader, client variants).
- **Success criteria:** After login, you reach a **dashboard** or **service hub** without a blank error page. **Open the browser developer console** and note any red errors (fail if critical navigation breaks).

---

## 2. URLs to sweep

Visit these after login (replace `[id]` with any strategy id visible in the list).

| Area             | Paths                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Hub              | `/dashboard`, `/service/overview`                                                                             |
| Strategies       | `/strategies`, `/strategies/grid`, `/strategies/[id]`                                                         |
| Data             | `/service/data/overview`, `/service/data/venues`, `/service/data/markets`                                     |
| Trading          | `/service/trading/overview`, `/service/trading/positions`, `/service/trading/risk`, `/service/trading/orders` |
| Execution        | `/service/execution/overview`, `/service/execution/tca`                                                       |
| Research         | `/service/research/overview` and every **`/service/research/strategy/...`** link from that hub                |
| ML               | `/service/research/ml/...` links from research                                                                |
| Reports          | `/service/reports/overview`, `/service/reports/reconciliation`                                                |
| Observe          | `/service/observe/...` from the shell                                                                         |
| Ops (if visible) | `/admin`, `/devops`                                                                                           |

**Redirects:** Old paths like `/trading/...` may redirect to `/service/trading/...`. A **404** on canonical `/service/...` routes is a failure.

---

## 3. Demo personas

Exercise **at least one internal** (admin or internal trader) and **one client** persona.

| Persona                     | What to verify                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| **Admin / internal trader** | Full nav: Data, Research, Trading, Execution, Reports, Observe; strategy list; risk/positions. |
| **Client full**             | Entitled areas visible; strategy/risk may be scoped.                                           |
| **Client data-only**        | Narrower nav; data-heavy screens OK; trading may hide or empty-state.                          |
| **Client premium**          | Variant entitlements vs full (differences should be visible).                                  |

---

## 4. Global rules (all strategies)

These are **architectural truths**. The UI should **not** imply violations (e.g. “raw tick stream in strategy screen” as the sole data source).

| #   | Rule                                                                                                              | What the UI should suggest                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| G1  | Strategies do **not** consume raw market-tick or candle assembly directly.                                        | Copy references **features**, **ML inference**, **monitors** — not “websocket orderbook” as strategy input. |
| G2  | Strategies are **event-driven** (updates when upstream features/events change), not blind timer-first.            | Schedules may appear as **feature publication** or **pipeline** timing.                                     |
| G3  | Strategy **receives** positions, risk, PnL from monitors/calculators; it **emits instructions**.                  | Screens separate **signal / instruction** from **execution / fills**.                                       |
| G4  | **Execution-service** chooses venue routing and order type; strategy sets constraints (slippage, allowed venues). | Execution analytics (TCA, venues) complement strategy views.                                                |
| G5  | Unit of deployment is **`(strategy_id, client_id, config)`** — same template, isolated instances.                 | Filters for org, client, strategy; multiple rows per template.                                              |
| G6  | **Live and batch** share the same logical model; mode is a data/window distinction.                               | Mode toggle or labels: live vs batch / backtest.                                                            |
| G7  | **Balance-based PnL** is source of truth; attribution should **reconcile** (tolerance ~2% in docs).               | PnL breakdown + total equity consistent across pages.                                                       |
| G8  | **Index-based yield** (e.g. Aave index, LST rate); APY is display, not PnL math.                                  | DeFi lending shows **index / balance growth**, not fake APY compounding in PnL.                             |

---

## 5. Cross-cutting themes the UI should surface

| Theme                 | Operator need                                                                         | UI signals to look for                                               |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **PnL attribution**   | Buckets (funding, basis, fees, directional, sports settle, etc.) reconcile to equity. | Stacked or tabbed attribution; same total as dashboard.              |
| **Cost model**        | Fees, gas, slippage, sports commission.                                               | Cost / fee columns or breakdowns on execution and reports.           |
| **ML pipeline**       | Model version, features, deployment, live vs shadow.                                  | Research → ML: experiments, runs, deployments.                       |
| **Latency**           | Data → feature → signal → instruction → fill.                                         | Optional SLA copy or monitoring tiles (Observe / health).            |
| **Margin & health**   | LTV, health factor, liquidation proximity (DeFi/CeFi/TradFi).                         | Risk pages: margin utilization, health factor for DeFi-style rows.   |
| **Operational modes** | Mock, testnet, paper, staging — alignment with `TestingStage`-style labels.           | Badges or environment indicators on strategies or deployments.       |
| **Sharding**          | CeFi / DeFi / Sports / TradFi / OnChain isolation.                                    | Filters, badges, or section headers by **asset class** or **shard**. |

---

**Extended reference (Codex-aligned):** For each strategy family, the subsections below inline **instruments**, **features**, **PnL attribution**, **risk targets**, **latency**, **execution / rebalancing**, **exposure & risk subscriptions** (where applicable), **margin / liquidation**, and **UI visualisation** expectations. A browser-only agent does not need repository access.

---

## 6. DeFi strategies

### 6.1 Basis trade (delta-neutral funding)

| Field                   | Value                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| **Strategy ID pattern** | `DEFI_BASIS_{ASSET}` (e.g. ETH)                                   |
| **Asset class**         | DeFi                                                              |
| **Archetype**           | Basis — long spot (or spot-like) + short perpetual, delta-neutral |

**Overview:** Earns **perp funding** when the perpetual trades rich vs spot; maintains delta near zero via spot long vs perp short. Primary signal is **funding rate** and **basis** vs spot.

**Instruments (typical)**

| Pattern                                              | Venue family                    | Role                                |
| ---------------------------------------------------- | ------------------------------- | ----------------------------------- |
| Spot / spot-like ETH (or configured asset)           | DEX (Uniswap-style) or CEX spot | Long delta leg                      |
| `HYPERLIQUID:PERPETUAL:ETH-USD` (or configured perp) | Perp venue                      | Short hedge, funding receiver/payer |

**Key features consumed**

| Feature                     | Source (logical)    | Trigger / SLA                    | Used for                           |
| --------------------------- | ------------------- | -------------------------------- | ---------------------------------- |
| `funding_rate`              | features-delta-one  | New 1H candle (or venue publish) | Enter / scale / exit funding carry |
| `basis_spot_perp`           | features-delta-one  | With funding update              | Rich/cheap perp vs spot            |
| `eth_spot_price` (or asset) | features-delta-one  | Candle                           | Sizing, MTM                        |
| `realized_vol`              | features-volatility | Periodic                         | Risk / position limits             |

**PnL attribution**

| Component           | Settlement           | Mechanism                             |
| ------------------- | -------------------- | ------------------------------------- |
| `funding_pnl`       | Per funding interval | `position_size * funding_rate * time` |
| `basis_pnl`         | MTM                  | Mark change on spot vs perp spread    |
| `trading_pnl`       | Realized             | Rebalance legs, roll, fees            |
| `transaction_costs` | Per fill             | DEX gas + swap fees; perp fees        |

Balance-based truth: `total_pnl ≈ balance - initial` (attribution should reconcile within ~2% annualized per platform docs).

**Risk profile targets (typical doc ranges)**

| Metric        | Target        | Notes                                       |
| ------------- | ------------- | ------------------------------------------- |
| Annual return | 8–25%         | Funding regime dependent                    |
| Sharpe        | 1.5+          | Smooth if delta-neutral holds               |
| Max drawdown  | 15%           | Basis blowout, negative funding persistence |
| Leverage      | 1–3x notional | Config caps                                 |

**Latency**

| Segment                   | p50 / p99 (order of magnitude)   | Co-lo?                    |
| ------------------------- | -------------------------------- | ------------------------- |
| Feature → strategy        | ~1s / ~5s (hourly candle driven) | No                        |
| Strategy → instruction    | ~100ms / ~500ms                  | No                        |
| Instruction → fill (perp) | ~100ms / ~500ms                  | Optional for Tier-1 perps |
| **E2E**                   | **~1.2s / ~6s**                  | **No** (not HFT)          |

**Execution & rebalancing**

- **SOR:** Spot leg via **DEX SOR** (allowed venues); perp leg on **fixed** configured venue.
- **Atomicity:** Not required across DEX + perp (async hedge acceptable with drift limits).
- **Rebalancing tiers (typical):** (1) funding sign flip or threshold, (2) basis deviation, (3) delta drift beyond limit — config-driven.

**Exposure subscriptions (conceptual)**

| Instrument pattern | Exposure type           | Used for              |
| ------------------ | ----------------------- | --------------------- |
| Spot ETH           | Inventory / notional    | Delta, basis          |
| Perp ETH-USD       | Perp notional + funding | Funding PnL, leverage |

**Risk type subscriptions**

| Risk type                          | Subscribed? | Typical action              |
| ---------------------------------- | ----------- | --------------------------- |
| `delta`                            | Yes         | Resize hedge                |
| `funding`                          | Yes         | Scale / exit                |
| `basis`                            | Yes         | Reduce if structural break  |
| `liquidity`                        | Yes         | Widen slippage or pause     |
| `protocol_risk` / `venue_protocol` | Yes         | Pause                       |
| `aave_liquidation`                 | No          | N/A (no Aave in pure basis) |

**Margin & liquidation:** Perp **margin** applies on short leg; spot leg **no** DeFi health factor unless borrowed. Liquidation = perp margin breach on hedge venue.

**UI: verify**

- Strategy row: **DeFi**, **basis** / **funding** language.
- Positions: **spot + perp** pair; venue labels (DEX + perp).
- PnL: **funding** component + **basis** MTM; fees separate.
- Risk tiles: **delta**, **basis**; optional **funding APY** chart.
- Research: feature dependence on **delta-one** / **volatility**, not raw ticks.

---

### 6.2 Staked basis (LST + short perp)

| Field                   | Value                                  |
| ----------------------- | -------------------------------------- |
| **Strategy ID pattern** | `DEFI_STAKED_BASIS_{LST}`              |
| **Archetype**           | LST carry + perp hedge (delta-neutral) |

**Overview:** Holds **LST** (e.g. weETH) for **staking yield** (exchange-rate appreciation) while **short perp** neutralizes ETH delta. PnL combines **funding**, **staking carry**, **LST discount/premium**, minus **fees**.

**Instruments**

| Leg  | Example                           | Role                         |
| ---- | --------------------------------- | ---------------------------- |
| LST  | weETH (or rETH, stETH per config) | Staking yield (index / rate) |
| Perp | `HYPERLIQUID:PERPETUAL:ETH-USD`   | Delta hedge, funding         |

**Features**

| Feature                                   | Source             | Used for           |
| ----------------------------------------- | ------------------ | ------------------ |
| `lst_eth_exchange_rate` / staking metrics | features-onchain   | Yield, depeg watch |
| `funding_rate`, `basis`                   | features-delta-one | Carry quality      |
| `eth_spot_price`                          | features-delta-one | Sizing, MTM        |

**PnL attribution**

| Component           | Type                | Notes                           |
| ------------------- | ------------------- | ------------------------------- |
| `staking_yield_pnl` | Accrual / ER change | Not “APY display” — index-based |
| `funding_pnl`       | Interval            | Same as basis                   |
| `lst_depeg_pnl`     | MTM                 | LST vs ETH basis risk           |
| `trading_pnl`       | Realized            | Rebalances                      |
| `fees_gas`          | Costs               | DEX + perp + gas                |

**Risk targets (typical)**

| Metric        | Target | Notes                                         |
| ------------- | ------ | --------------------------------------------- |
| Annual return | 10–30% | Staking + funding                             |
| Sharpe        | 1.5+   | Depeg is tail risk                            |
| Max drawdown  | 20%    | LST depeg simultaneous with wrong-way funding |
| Leverage      | 1–2.5x | Lower than recursive                          |

**Latency:** Similar to **6.1** (hourly / event on feature cadence); not co-lo dependent.

**Execution:** DEX path into LST; perp hedge; **optional atomic** on entry/exit bundles depending on implementation — UI may still show legs separately.

**Exposure / risk:** `delta`, `funding`, **`protocol_risk`** (LST slash / depeg), `liquidity` (LST exit liquidity), `venue_protocol`.

**Margin:** Perp margin only unless paired with borrow (then see recursive).

**UI:** **LST** ticker; **two yield sources** (staking + funding) in copy or stacked attribution; **depeg** or **exchange rate** mention; DeFi shard.

---

### 6.3 Aave V3 lending (pure supply yield)

| Field         | Value                                        |
| ------------- | -------------------------------------------- |
| **Pattern**   | `DEFI_AAVE_SUPPLY_{ASSET}`                   |
| **Archetype** | Money-market supply; **aToken** index growth |

**Overview:** Supplies stablecoin (e.g. USDC) to **Aave V3**; earns via **liquidity index** increasing **aToken** balance. **No perp**; **no SOR** for core loop (deposit/withdraw direct).

**Instruments**

| Pattern                      | Role             |
| ---------------------------- | ---------------- |
| `AAVE_V3:aUSDC` (conceptual) | Supply position  |
| Underlying stable            | Deposit/withdraw |

**Features**

| Feature                             | Used for                           |
| ----------------------------------- | ---------------------------------- |
| `aave_supply_apy`                   | Monitoring only — **not** PnL math |
| `aave_utilization`                  | Rate regime                        |
| `liquidity_index` / aToken rebasing | **Accrual**                        |

**PnL**

| Component          | Settlement             |
| ------------------ | ---------------------- |
| `interest_accrual` | Index growth on aToken |
| `withdrawal_fee`   | If any route fee       |

**Risk profile:** Low vol; targets often **single-digit %** APR; drawdowns from **depeg** (stable), **smart contract**, **governance**.

**Latency:** **Minutes–hours** ok; event on index update / rebalance threshold.

**Execution:** Deposit/withdraw transactions; **gas** in costs.

**Exposure / risk:** `protocol_risk` (Aave), `liquidity` (withdraw queue), stable **`depeg`**.

**UI:** **Aave**, **aToken**; **utilization**; PnL shows **accrual** not synthetic APY compounding; single-leg simplicity.

---

### 6.4 Recursive staked basis (flash + Aave + perp)

| Field         | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| **Pattern**   | `DEFI_RECURSIVE_BASIS_{CLIENT}`                                     |
| **Archetype** | Leveraged LST collateral, WETH debt, perp hedge; **atomic bundles** |

**Overview:** **Flash loan** bootstraps or rebalances **weETH collateral** vs **WETH debt** on Aave, with **short perp** for delta. **Highest** operational and **liquidation** sensitivity among DeFi catalog strategies.

**Instruments**

| Pattern                       | Role                     |
| ----------------------------- | ------------------------ |
| `AAVE_V3:A_TOKEN:*` (weETH)   | Collateral, HF numerator |
| `AAVE_V3:DEBT_TOKEN:*` (WETH) | Debt, HF denominator     |
| `HYPERLIQUID:PERPETUAL:*`     | Hedge                    |
| `WALLET:LST:*`                | Staking yield tracking   |
| Morpho / flash source         | Atomic liquidity         |

**Features:** Health factor inputs, borrow **APR**, **weETH/ETH** rate, **funding**, pool liquidity for flash.

**PnL**

| Component           | Notes                    |
| ------------------- | ------------------------ |
| Staking (LST)       | Collateral side          |
| Funding             | Perp                     |
| Borrow cost         | WETH variable            |
| Trading / swap      | Rebalances               |
| Liquidation penalty | If HF breaches in stress |

**Risk targets:** Higher return band than 6.2 with **lower max drawdown tolerance** in ops (often stricter monitoring); leverage **~2–2.5x** typical doc range.

**Latency:** Mixed — **Aave HF** checked **every candle** (critical); atomic bundle submission within block time constraints.

**Execution:** **Atomic** multi-step bundles for entry/deleverage; strict ordering: flash → swap → deposit/borrow → perp.

**Exposure subscriptions (representative)**

| Instrument pattern        | Exposure type    | Used for  |
| ------------------------- | ---------------- | --------- |
| `AAVE_V3:A_TOKEN:*`       | Collateral value | HF        |
| `AAVE_V3:DEBT_TOKEN:*`    | Debt value       | HF        |
| `HYPERLIQUID:PERPETUAL:*` | Perp notional    | Net delta |
| `WALLET:LST:*`            | LST appreciation | Yield     |

**Risk type subscriptions (representative)**

| Risk type          | Critical? | Typical threshold / action                             |
| ------------------ | --------- | ------------------------------------------------------ |
| `aave_liquidation` | **YES**   | HF below 1.5: deleverage; HF below 1.2: emergency exit |
| `delta`            | Yes       | Drift vs band → resize perp                            |
| `funding`          | Signal    | Negative net carry                                     |
| `borrow_cost`      | Yes       | Spike erodes net                                       |
| `staking_yield`    | Signal    | Below minimum                                          |
| `protocol_risk`    | Yes       | weETH depeg, Morpho liquidity                          |
| `venue_protocol`   | Yes       | HL / Aave governance or halts                          |
| `liquidity`        | Yes       | Flash availability                                     |

**Custom risks (documented intent):** borrow rate sensitivity; **HF degradation velocity**; flash liquidity; recursive leverage stress; **depeg cascade** scenarios.

**Margin & liquidation:** **Aave HF** formula; liquidation at HF below 1.0; strategy thresholds **before** that (deleverage / exit). Perp **separate** margin on HL.

**UI:** **Health factor** time series with threshold lines (1.5 / 1.2 / 1.0); **collateral / debt / perp** breakdown; **leverage** or **recursive** in title; **flash** or **bundle** language optional; gas / slippage in execution context.

---

### 6.5 AMM LP (concentrated / StableSwap)

| Field         | Value                                  |
| ------------- | -------------------------------------- |
| **Archetype** | AMM liquidity provision; **fees + IL** |

**Instruments:** Uniswap V3/V4 positions, Curve / Balancer pools (config-specific).

**Features:** Pool price, **tick**, fee APR, **IL estimate**, volume — from **on-chain feature** calculators (not raw RPC in strategy).

**PnL**

| Component          | Type                 |
| ------------------ | -------------------- |
| `fee_income`       | Accumulated fees     |
| `impermanent_loss` | MTM vs HODL          |
| `gas`              | Add/remove/rebalance |

**Risk:** `delta` (range), `concentration`, `protocol_risk`, **`inventory`** (token mix), **`gamma`**-like exposure in tight ranges (conceptual).

**Latency:** **Event-driven** on price exiting range or fee spike; not HFT.

**Execution:** Add/remove liquidity instructions; **LP SOR** may apply when choosing pool/route (implementation-dependent).

**UI:** **LP**, **range**, **IL**, **pool** naming; fee vs IL attribution; DeFi shard.

**Codex note:** May be **ahead of** full code parity — **PARTIAL** acceptable if UI shows credible DeFi MM without every pool mechanic.

---

## 7. CeFi strategies

### 7.1 Momentum (archetypal — per-strategy codex may be TODO)

**Archetype:** Trend / time-series or cross-sectional momentum on **CeFi** perp or spot.

**Instruments:** `BINANCE:PERPETUAL:*`, `BYBIT:*`, etc. (config).

**Features:** Return horizons, breakout, cross-asset momentum from **features-multi-timeframe** / **cross-instrument**; optional ML overlay.

**PnL:** Predominantly **directional** / mark-to-market; fees per fill.

**Risk targets (archetypal):** Sharpe 1.0–2.0; max DD 10–25%; leverage per config.

**Latency:** **Minutes** scale (candle / feature batch), not microsecond.

**Execution:** Market/limit per **execution-service**; **no** atomic multi-venue requirement for single-leg trend.

**Exposure / risk:** `delta`, `drawdown`, `liquidity`, `venue_protocol`; optional `funding` if perps.

**UI:** **CeFi** shard; **momentum** label; directional PnL; venue badges; research links to **signals / backtests**.

---

### 7.2 Mean reversion (archetypal)

**Archetype:** Fade extremes — bands, z-scores, **pairs / cointegration**.

**Features:** Mean, vol, half-life, spread vs fair; stationarity tests from feature pipelines.

**PnL:** Mean-reversion **round-trips**; **gap risk** (losses in trends).

**Risk:** `drawdown`, `delta`, **`regime`** (trending hurts); `liquidity`.

**Latency:** Similar to momentum — **feature-driven**.

**UI:** **Mean reversion** or **pairs** language; two-leg instruments if applicable; risk copy for **gap** / **regime**.

---

### 7.3 CeFi market making (CLOB)

**Archetype:** Continuous **bid/ask** quoting; **inventory skew** management.

**Trigger model (key difference vs DeFi hourly):** **Event-driven on underlying move** (e.g. mid moves more than X bps), plus vol and inventory triggers — **sub-second to seconds**.

**Features**

| Feature               | Used for          |
| --------------------- | ----------------- |
| `mid_price`           | Quote center      |
| `bid_ask_spread`      | Width             |
| `realized_vol`        | Widen in high vol |
| `orderbook_imbalance` | Skew              |
| `inventory_skew`      | Risk reduction    |

**PnL**

| Component           | Type            |
| ------------------- | --------------- |
| `spread_pnl`        | Per fill        |
| `inventory_pnl`     | MTM             |
| `trading_pnl`       | Inventory dumps |
| `transaction_costs` | Fees            |

**Risk targets (doc-style):** Return 15–30% ann; Sharpe **3+**; max DD ~5%; **1x** leverage spot MM.

**Latency**

| Segment             | p50 / p99          |
| ------------------- | ------------------ |
| Feature → strategy  | ~5ms / ~20ms       |
| Instruction → order | ~10ms / ~50ms      |
| **E2E**             | **~26ms / ~125ms** |

**Co-location:** **Often YES** for competitive Tier-1 crypto CLOB.

**SOR:** **Not** classic cross-venue SOR for primary quotes; **hedge leg** across venues is a **different** strategy variant.

**Exposure:** Spot inventory + quote asset balances.

**Risk types:** `delta` (skew), `liquidity`, `venue_protocol`, `concentration`.

**Custom risks:** **adverse selection**, **inventory half-life**, **quote staleness**.

**UI:** **Market making** template; high **order count**; **inventory / skew**; **spread** and **vol** panels; CeFi venues.

---

## 8. TradFi strategies

### 8.1 ML directional (equities / ETFs / listed futures)

**Pattern:** `TRADFI_ML_{ASSET}`.

**Instruments:** `NASDAQ:EQUITY:*`, `CME:FUTURES:*`, `NYMEX:FUTURES:*`, etc.

**Features:** `prediction_score`, `prediction_confidence`; technicals (momentum, RSI, MACD, ATR, vol).

**PnL:** Directional; **transaction costs**; slippage in attribution.

**Risk targets (typical):** Ann return 10–25%; Sharpe 1.5+; max DD 10–15%.

**Latency**

| Segment            | p50 / p99           |
| ------------------ | ------------------- |
| Feature → strategy | ~30ms / ~150ms      |
| ML inference       | ~50ms / ~200ms      |
| Instruction → fill | ~100ms / ~500ms     |
| **E2E**            | **~155ms / ~720ms** |

**Execution:** IBKR / FIX **futures**; **no** atomic multi-leg default; **rebalance every N bars** when signal persists.

**Exposure:** Equity/futures notional; **portfolio cap**.

**Risk types:** `delta`, **`drawdown`** (hard exit), `liquidity` (low volume).

**Custom:** **concentration**, **model confidence decay**, **score volatility** (whipsaw).

**Margin:** **Reg-T** / futures margin; **no** Aave HF.

**UI:** **TradFi** shard; **ML** linkage; **SPY/QQQ/futures**-style symbols; **drawdown** and **exposure** cap copy.

---

### 8.2 Options ML (archetypal — codex partial)

**Archetype:** ML + vol features to select **strikes/expiries** or spreads; emits **options instructions**.

**Features:** IV surface, skew, realized vol, greeks-aware signals; ML outputs.

**PnL:** Premium, **delta/gamma** path dependent; multi-leg attribution.

**Risk:** `delta`, `gamma`, `vega`, `theta`, `liquidity`, `drawdown`.

**Latency:** **Tighter** than 8.1 if intraday; co-lo **may** help on listed options.

**UI:** **Options** archetype; **vol surface** hints; **multi-leg** positions; TradFi.

---

### 8.3 Options market making

**Archetype:** Multi-strike quotes + **delta hedge** on underlying; **mass quote** when supported.

**Mechanics:** Instructions carry **ref underlying**; execution layer **reprices** options on underlying move (delta-based) and may **mass pull** on halt.

**Greeks risk table (subscribed)**

| Risk              | Action on breach              |
| ----------------- | ----------------------------- |
| `delta`           | Hedge underlying              |
| `gamma`           | Reduce ATM cluster            |
| `vega`            | Cut vol exposure              |
| `theta`           | Monitor decay PnL             |
| `volga` / `vanna` | Skew / vol-of-vol adjustments |
| `venue_protocol`  | Cancel all                    |
| `concentration`   | Reduce strike concentration   |

**Risk targets:** Return ~20–40%; Sharpe 2+; max DD ~10%; capital per underlying ~$5M doc-style.

**Latency:** **~18ms / ~85ms E2E** p50/p99 class — **most latency-sensitive** retail/pro MM; **co-lo YES** on competitive venues.

**UI:** **Options MM**; **many open quotes**; **greeks** summary; **delta hedge** activity; **vol surface** research.

---

## 9. Sports strategies

### 9.1 Sports arbitrage (archetypal)

**Archetype:** Lock **+EV** when **combined implied probability** sums to less than 100% (after **commission**).

**Features:** Normalized **odds**; **event ID** mapping across venues from **features-sports**.

**PnL:** **Sports settle**; short holding; **commission** deducted.

**Risk:** **`line_move`** (legging risk), `liquidity`, **`void` rules**, `stake_limits`.

**Latency:** **Sub-second to seconds** desirable; still far from HFT.

**UI:** **Arb** / **surebet** language; **multiple venues** one event; low **hold time**; Sports shard.

---

### 9.2 Value betting (archetypal)

**Archetype:** Model prob vs implied; **Kelly** or fractional Kelly stake.

**Features:** Odds, model probs, **CLV** tracking features.

**PnL:** Settled bets; **CLV** as quality metric (not cash until settle).

**Risk:** `bankroll_dd`, `stake_cap`, **`model_calibration`**.

**UI:** **Edge** / **EV** copy; **odds vs model**; **CLV** column if present.

---

### 9.3 Sports ML — generic (single-phase / continuous)

**Distinction:** **Not** the explicit two-phase halftime product (see **9.4**). Generic **ML vs odds** on rolling schedule.

**Features:** `ml_prediction_probs`, sports form features, odds movement.

**UI:** **Sports + ML** badges; bet history; may **not** show “halftime phase” split.

---

### 9.4 Halftime ML (two-phase) — detailed

| Field       | Value                     |
| ----------- | ------------------------- |
| **Pattern** | `SPORTS_HT_ML_{MODEL_ID}` |
| **Phases**  | Pre-game + halftime       |

**Instruments**

| Key                             | Role            |
| ------------------------------- | --------------- |
| `SPORTS:HT_ML:{MODEL_ID}`       | Strategy anchor |
| `BETFAIR:EXCHANGE:{EVENT_ID}`   | BACK/LAY        |
| `PINNACLE:BOOKMAKER:{EVENT_ID}` | BACK            |
| `BET365:BOOKMAKER:{EVENT_ID}`   | BACK            |

**Features**

| Feature                                         | SLA (order) | Phase    |
| ----------------------------------------------- | ----------- | -------- |
| `team_form_5`, `head_to_head`, `xg_rolling`     | ~60s        | Pre      |
| `odds_movement`                                 | ~10s        | Pre      |
| `possession_pct`, `shots_on_target`, `ht_score` | ~5–10s      | Halftime |
| `ml_prediction_probs`                           | ~30s        | Both     |

**PnL**

| Component      | Type          |
| -------------- | ------------- |
| `pre_game_pnl` | Sports settle |
| `halftime_pnl` | Sports settle |
| `commission`   | Exchange fee  |
| `closing_line` | CLV tracking  |

**Risk targets:** ROI 5–15% ann on bankroll; Sharpe 1.5+; max DD **20%**; max stake **~5%** bankroll; scalability **~$100K** doc-class.

**Latency E2E:** ~**1.6s / 7.7s** p50/p99 — **no** co-lo.

**Execution:** **BACK** at books; **BACK/LAY** exchanges; **no atomicity** across bets.

**Risk controls:** `max_stake_fraction`, **fractional Kelly**, `confidence_threshold`, `min_edge_threshold`; **`bankroll_dd`**, **`daily_loss`**, **`concurrent_bets`**.

**UI:** **Halftime** in name; **two-phase** timeline; separate **pre-game vs halftime** attribution if present; **Kelly** sizing hints.

---

### 9.5 Sports market making (exchange)

**Archetype:** **Back/lay** around **theo**; **suspension** handling on goals / VAR.

**Features:** Best back/lay, **suspension** flags, sharp calibration.

**PnL:** Spread capture + **greening**; **commission**.

**Risk:** `suspension`, **`adverse_selection`**, `inventory` across outcomes.

**UI:** **Betfair**-style naming; **ladder**; **back/lay**; **halt** / **suspension** indicators if modeled.

---

## 10. Prediction markets & cross-venue arb

**Three roles (same venues, different jobs):**

| Role                | Operator meaning                                                    | UI may show                                                  |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Features source** | PM prices feed **other** strategies (e.g. crowd sentiment)          | **Feature** / **signal** cards referencing Polymarket/Kalshi |
| **Execution venue** | Trade **YES/NO** directly                                           | **Positions** in binary contracts                            |
| **Arb surface**     | Same economic event, **two platforms** or vs traditional equivalent | **Arb** pairs, **implied prob** comparison                   |

**Classification dimensions (intent):**

- **Use case:** FEATURE / TRADABLE / ARB_SURFACE / BOTH.
- **Domain:** CRYPTO / MACRO / SPORTS / WEATHER / POLITICS / CORPORATE (feature-only where noted).
- **Equivalence:** Some binaries map to **options / futures / Betfair** — arb **possible**; some weather markets **feature-only**.

**Instrument ID style (illustrative, not SSOT):** `POLYMARKET:BINARY:{EVENT}@YES`, `KALSHI:BINARY:{EVENT}@YES`.

**Gaps (honest UI):** Registry / taxonomy / Kalshi **position tracking** may be incomplete — **PARTIAL** if labels exist without full position drill-down.

**UI:** **Polymarket**, **Kalshi**, **YES/NO**, **prediction** filters; cross-shard **macro/crypto** events; **implied probability** columns.

---

## 11. Kelly criterion (sports sizing)

| Aspect     | Detail                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| **Role**   | **Policy inside** value / halftime / generic sports ML — not always its own strategy row |
| **Inputs** | Model prob, implied prob, **fractional Kelly** (e.g. 0.5), **max stake %**               |
| **Risk**   | Without cap, Kelly tail risk — UI should show **fraction** and **max bet**               |

**UI:** **Kelly** or **stake sizing** section; **max bet %** of bankroll; stakes scale with **edge** in mock tables.

---

## 12. Per-strategy UI checklist (copy for notes)

For **each** family above, record **PASS / PARTIAL / FAIL**:

| Check             | Question                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Discover**      | Row, template, or filter maps clearly to this family?                                               |
| **Shard**         | DeFi / CeFi / Sports / TradFi / OnChain / Prediction correct?                                       |
| **Inputs**        | Right **feature families** (funding, LST, Aave index, odds, ML, vol surface, PM sentiment)?         |
| **Execution**     | Venue families credible (DEX+perp, Aave, HL, IBKR, Betfair, Polymarket, Kalshi)?                    |
| **Risk**          | Right dimensions (delta/basis, **HF**, greeks, **suspension**, drawdown, arb legging)?              |
| **Attribution**   | PnL buckets match strategy (funding, staking, borrow, directional, **pre-game vs halftime**, fees)? |
| **Latency story** | UI does not imply **tick-scrape** in strategy layer; MM / options show **fast** path where relevant |
| **Consistency**   | Numbers align across list, detail, trading, reports                                                 |

---

## Maintainer note (humans only — ignore in browser-only runs)

When strategy **names in mock data** change, update this handbook and **Codex** `09-strategy/README.md` together. Browser agents **do not** read the repo; ship this file **as PDF or pasted appendix** next to the preview URL if the agent has **zero** repository access.

**Generators:** This markdown is **hand-maintained** (it is not produced by a script). Machine-derived registries and enums for the UI come from **`generate_ui_reference_data.py`** → `ui-reference-data.json` — see **`unified-trading-pm/docs/ui-alignment-ssot.md`** for the single index of UI alignment generators vs narrative docs. Do not add a separate handbook generator without extending that SSOT.
