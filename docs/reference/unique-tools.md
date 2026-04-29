# Unique Tools — Per-Archetype Specialized Surfaces

A concise index of the surfaces that are **unique** to each archetype — tools that don't generalize across the floor and require dedicated engineering for that specific market or workflow. The **detail** of each surface lives in the individual archetype doc; this is a tracker.

For shared surfaces every archetype uses, see [common-tools.md](common-tools.md). For the underlying workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).

---

## What "Unique" Means Here

A surface is **unique** if it requires market-specific data, compute, or UX that doesn't generalize. Marcus's funding heatmap doesn't help Henry; Sasha's IV surface doesn't help Yuki; Diego's video wall doesn't help Aria. These are the surfaces where the platform must build **dedicated capability per archetype**, not just configuration on top of the shared layer.

A few surfaces appear with overlap (e.g. Marcus and Sasha both consume options-flow data); when listed as unique, it means the _primary owner_ of that surface is the named archetype.

---

## Crypto Desk

### Marcus Vance — Senior CeFi Crypto Portfolio Trader

Detail in [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md).

- **Aggregated CeFi cross-venue depth book** — Binance + Bybit + OKX + Coinbase stacked at single-tick resolution.
- **Funding-rate heatmap & term structure** — across instruments, venues, with z-scores.
- **Liquidation heatmap** — leveraged-position clusters as price magnets.
- **Open-interest delta dashboard** — combined with price action to read flow direction.
- **Spot–perp basis & dated-futures term structure** — first-class instruments, not derived.
- **Whale tape** — every print >$1M with venue and aggressor side.
- **CVD per venue and aggregated** — cumulative volume delta.
- **Cross-venue smart router with venue-specific algo extensions** — sweeps Bybit/OKX when Binance depth poor.
- **Footprint chart** — bid/ask volume per candle for short-horizon entries.

### Julius Joseph — Senior CeFi + DeFi Hybrid Strategies Trader

Detail in [trader-archetype-julius-hybrid.md](trader-archetype-julius-hybrid.md).

- **On-chain pool-state dashboards** — Uniswap v3 concentrated-liquidity heatmaps, Curve pools, lending markets (Aave/Compound/Morpho/Spark) with utilization, supply/borrow rates, top borrowers.
- **DeFi yield landscape board** — lending APY, LST APR, restaking points $/point, Pendle PT/YT, IL-adjusted LP yields. Comparable across chains.
- **Mempool monitor** — pending swaps above threshold with target pools, sandwich risk indicator, MEV-bot leaderboard.
- **DEX aggregator route preview** — 1inch / CoW / Jupiter / Odos / Bebop quotes side-by-side with MEV exposure rating.
- **On-chain order ticket** — swap/LP/lend/borrow/stake/multicall with simulation pre-send, private vs public mempool toggle, gas strategy, approval management, nonce manager.
- **Bridge ticket & bridge state monitor** — LayerZero/Across/Stargate/native compared, with TVL/incident health.
- **Cross-chain arb scanner** — same asset priced differently on Ethereum vs Arbitrum vs Solana.
- **Counterparty/protocol risk dashboard** — smart-contract audit history, recent incidents, oracle dependency map, stablecoin depeg monitor.
- **Unified CeFi+DeFi positions blotter** — by underlying → by role → by venue/protocol, with on-chain-specific fields (LP range, health factor, PT YTM, points accrued).
- **Multi-stage kill switch** — flatten CeFi instant, unwind on-chain to exit-mode, bridge to safety wallet.
- **Synchronized CeFi+DeFi replay** — see Binance and Uniswap state at the same instant.
- **Liquidation opportunity feed** — every outstanding position on Aave V3 (six chains) / Compound V3 / Euler / Morpho / Kamino with live `health_factor`, ranked liquidatable-now panel, pre-liquidatable watch panel, per-protocol bonus table, competitor leaderboard, oracle-update tracking.
- **Liquidation execution ticket** — atomic flash-loan multicall (flash-loan → repay → seize → DEX-swap → repay flash loan) with bundle preview, live profit calculator, Flashbots / public-mempool toggle, priority-fee auction strategy, auto-repeat policy with profit floor, failure-mode display.
- **Liquidation-bot fleet monitor** — per-(protocol × chain) bot row with opportunities seen / bundles submitted / included / reverted / net P&L / gas burned / hit rate, why-no-fire diagnostic feed, inclusion-quality tracker per builder/relay, per-chain gas budget bars, per-protocol kill switch.

### Quinn Park — Quant Overseer

Detail in [trader-archetype-quinn-quant-overseer.md](trader-archetype-quinn-quant-overseer.md).

- **Strategy fleet dashboard** — every live strategy with health/PnL/capacity, anomaly-driven attention.
- **Strategy lifecycle stage model** — research/paper/pilot/live/monitor/retired tags everywhere.
- **Strategy promotion gate UI** — checklist enforced (walk-forward Sharpe, drawdown profile, capacity, correlation impact, code review, risk sign-off).
- **Research workspace** — notebook environment, backtest engine with realistic execution simulation, walk-forward validation framework.
- **Feature library** — searchable catalog of all engineered features with metadata.
- **Model registry & experiment tracker** — every model versioned with training data hash, hyperparameters, reproducibility guarantee.
- **Drift indicators per strategy** — KS/PSI on features and predictions vs training distribution.
- **Capacity utilization tracker** — % of estimated capacity in use, degradation curve.
- **Canary deployment & rollback surface** — push new model versions at 1% size first, compare to incumbent.
- **Cross-strategy correlation matrix** — strategies drifting toward correlation flagged.
- **Backtest-vs-live divergence tracker** — live performance vs backtest expectation distribution.
- **Strategy retire/promote decision log** with rationale.

### Mira Tanaka — Senior Market Maker

Detail in [trader-archetype-mira-market-maker.md](trader-archetype-mira-market-maker.md).

- **Quote engine state panel** — current quotes/sizes/skews per instrument per venue, with effective fair price model breakdown.
- **Quote engine parameter library & control panel** — base spread, inventory skew, layered sizing, adverse-selection widening, pause thresholds. Named profiles swappable.
- **Adverse-selection / toxic-flow monitor** — per-counterparty fill analysis, post-fill price-drift score, suspicious-pattern detection.
- **Queue position estimator** — for each resting order, estimated position in queue.
- **Inventory & residual-risk surface** — aggregated per underlying, hedge-ratio tracker, hedge-cost realized today.
- **Quote-engine PnL decomposition** — spread captured, adverse selection, hedge cost, fees — visible separately.
- **Microsecond-resolution latency panel** — RTT distribution per venue (not just mean), feed lag, kernel-bypass health, NIC stats, rate-limit headroom.
- **Cross-venue lead-lag indicator** — does Coinbase lead Binance on this name?
- **Tick-imbalance & cancellation-activity feed** — micro-momentum signals.
- **Pre-deployment shadow mode** — engine receives real data, computes what it would have quoted, doesn't send.
- **Per-fill realized-edge analysis** — captured edge minus subsequent adverse drift over T seconds.
- **Toxic-flow counterparty leaderboard** — who consistently picks her off.

### Sasha Volkov — Senior Options & Volatility Trader

Detail in [trader-archetype-sasha-options-vol.md](trader-archetype-sasha-options-vol.md).

- **3D IV surface** — strike × tenor × IV, pannable, slice-able, current vs historical distribution.
- **Skew & term-structure curves** — IV vs strike at fixed tenors, IV vs tenor at fixed deltas.
- **Realized-vs-implied vol cones** — RV cones, IV cones, vol risk premium time series.
- **Smile dynamics overlay** — sticky-strike vs sticky-delta vs sticky-moneyness regime indicator.
- **25Δ risk reversal & butterfly z-scores** — fear and kurtosis gauges by tenor.
- **Greek book — multi-dimensional** — vega-by-tenor, vega-by-strike, gamma-by-underlying, plus vanna/volga/charm/color.
- **Multi-leg structure builder** — vol-quoted entry, structure templates (straddle/strangle/condor/etc.), greeks of structure at entry, scenario PnL grid.
- **Scenario PnL grid** — spot moves × vol moves matrix, plus surface-shape stress (parallel shift, twist, smile widening).
- **Daily greek-decomposed PnL** — delta/gamma/vega/theta/hedging cost split, every structure, every day.
- **Auto-delta-hedging surface** — dynamic hedge bands, hedging-cost tracked, gamma-scalping PnL realized vs implied.
- **Surface replay** — historical IV surface evolution scrubbable around any trade.
- **Block / RFQ workflow** — Paradigm-style dealer-panel quotes for size, on-chain RFQ.
- **Options flow tape** — large prints, dealer gamma exposure estimate, vanna/charm walls, max-pain levels.

---

## TradFi Desk

### Henry Whitfield — Senior Equity Long/Short PM

Detail in [trader-archetype-henry-equity-long-short.md](trader-archetype-henry-equity-long-short.md).

- **Earnings season dashboard** — pre-event positioning, expected move from straddle, post-event surprises tracker.
- **Catalyst calendar specific to single names** — earnings, product launches, regulatory rulings, index rebalances, lock-ups, investor days.
- **Fundamental data + valuation panel** — financials, common-size, segment reporting, multiples history, peer comparables, DCF link, reverse DCF.
- **Estimate-revision dashboard** — sell-side EPS/revenue estimates, consensus, dispersion, revision direction over 1m/3m/6m.
- **Beat/miss track record** — every prior quarter with surprise magnitudes.
- **Pairs ticket** — long target / short comp with ratio enforcement (dollar-neutral, beta-neutral).
- **Basket ticket** — upload weights, basket-level execution algo, basket-level P/L.
- **Risk-arbitrage event ticket** — buy target / short acquirer for cash-and-stock deals.
- **Beta-adjusted exposure & factor exposure dashboard** — Fama-French / Barra / custom factor decomposition with target ranges.
- **Short interest & borrow analytics** — days-to-cover, % of float, HTB flag, recall risk, borrow cost YTD.
- **Insider trading & 13F crowding dashboard** — Form 4 filings, hedge-fund crowding by name.
- **Earnings transcript search** — full-text searchable across coverage universe.
- **Analyst-day & conference calendar** with materials & audio.
- **Expert network call database** — scheduled, historical, with notes attached to names.
- **Locate / borrow check inline in ticket** — borrow availability, rate, recall probability.
- **Catalyst outcome tracker** — pattern-recognition: which catalyst types is Henry skilled at?

### Ingrid Lindqvist — Senior Rates Trader

Detail in [trader-archetype-ingrid-rates.md](trader-archetype-ingrid-rates.md).

- **Yield curve visualization** — spot, forward, OIS, real, inflation breakeven curves overlaid; current vs 1d/1w/1m/1y.
- **Curve trade dashboard** — every relevant steepener/flattener (2s10s, 5s30s, etc.) with z-score history; butterflies (2s5s10s) with z-scores.
- **Cross-curve & cross-currency spread board** — UST 10y vs bund 10y, swap spreads, asset swap, cross-currency basis (XCCY).
- **Auction calendar with concession tracker** — pre-auction concession, primary-dealer positioning, post-auction performance.
- **Central bank meeting calendar with implied rate path** — OIS-derived path per CB, hawk/dove tags on speakers, forward-guidance language tracker.
- **Curve / butterfly / basis ticket** — multi-leg DV01-balanced, atomic execution, quoted in bps.
- **Swap ticket with cleared/bilateral selection** — counterparty + LCH/CME clearing.
- **RFQ workflow with dealer aggregation** — Bloomberg/Tradeweb/MarketAxess integrated.
- **DV01-bucketed positions blotter** — by tenor (0–2y, 2–5y, 5–10y, 10–20y, 20–30y), by currency, by instrument type.
- **Carry & roll-down PnL tracker** — passive return decomposed from active.
- **Cash-vs-futures basis tracker** — net basis, gross basis, implied repo, conversion factor awareness.
- **Roll calendar & roll-cost tracker** — futures expiring, accumulated roll cost.
- **Curve-shape stress scenarios** — parallel shifts, twists, steepener/flattener shocks, central-bank surprise (50bps).
- **Repo / funding monitor** — special bonds, balance-sheet stress, GC rates.

### Rafael Aguilar — Senior Global Macro PM

Detail in [trader-archetype-rafael-global-macro.md](trader-archetype-rafael-global-macro.md).

- **Themes board** — every active theme as first-class object: thesis, conviction (1–10), time horizon, catalysts, invalidation conditions, expressions, P/L attributed, risk attributed.
- **Theme-attached order entry** — every order tagged at entry to a theme ID.
- **Expression comparison tool** — given a thesis, compare candidate expressions (outright vs spread vs option vs basket) with implied-vol rank, carry, asymmetry, historical fit.
- **Multi-asset multi-leg ticket** — equities + rates + FX + commodities + credit in one structure, sized by risk contribution not notional.
- **Cross-asset dashboard** — equities/rates/FX/commodities/credit/vol all on one screen, % move sortable.
- **Cross-asset relationship matrix & mismatch detector** — rolling correlations, regression dashboards ("if 10y +25bps, USDJPY historically +1.4%"), alert when asset decorrelated by N standard deviations.
- **Theme-specific custom dashboards** — saveable, sharable layouts per theme (e.g. "Japan reflation": USDJPY + JGB10y + Nikkei + JPN CPI + BoJ commentary + real wages).
- **Multi-axis risk panel** — equity beta + rates DV01 + FX delta + commodity delta + credit DV01 + vega visible simultaneously.
- **Cross-asset stress library** — risk-off shock, inflation surprise, geopolitical shock, central bank surprise — all pre-computed.
- **Theme journal** — running narrative per theme, weekly review with team.
- **Conviction calibration tracker** — when Rafael said 9/10 conviction, did the theme work?
- **Macro surprise indices & nowcasting** — Citi Economic Surprise per region, Atlanta Fed GDPNow, inflation nowcasts.

### Yuki Nakamura — Senior FX Trader (G10 + EM)

Detail in [trader-archetype-yuki-fx.md](trader-archetype-yuki-fx.md).

- **FX cross matrix** — every currency × every currency grid with current spot, % move, z-score, click-to-trade.
- **Currency-decomposed positions blotter** — net delta per currency, aggregated from all pair positions; pair view secondary.
- **Carry & forward dashboard** — overnight forward points, annualized carry, carry-to-vol ratio, forward curves, NDF curves, cross-currency basis.
- **Forward / settlement ladder** — settlement obligations by date and currency, net settlement per date, funding cost for short-currency positions.
- **NDF ticket & NDF curve board** — non-deliverable forwards for restricted EM (CNY, INR, BRL, KRW, TWD), with onshore vs offshore deviation tracker.
- **Spot ticket with multi-LP aggregation** — top 5 bid / top 5 offer per LP with attribution, last-look awareness, smart router.
- **FX swap ticket** — near-leg + far-leg as one product, swap points as price.
- **Cross / synthetic ticket** — direct vs synthetic (EURJPY = EURUSD × USDJPY) cost comparison.
- **Fixing trade workflow** — WMR 4pm London / ECB / NY / Tokyo countdown, depth around fix, expected impact.
- **Intervention zone overlay** — for pairs with active CB intervention (USDJPY especially), historical zones flagged on chart.
- **Session-aware dashboards** — Tokyo/London/NY structure reflected in flow expectations and attribution.
- **Capital-controls & political-news tracker for EM** — capital control changes, election cycles, IMF programs.
- **Carry-trade unwind risk monitor** — when JPY/CHF rally on risk-off, the pain trade is flagged.
- **LP scorecard** — per-LP fill rate, response latency, last-look rejection rate.

### Theo Rasmussen — Senior Energy Trader

Detail in [trader-archetype-theo-energy.md](trader-archetype-theo-energy.md).

- **Forward curves** — WTI/Brent/Dubai/HH natgas/products by month out 12–60 months, current vs historical, with shape labels (backwardation/contango).
- **Spread dashboard** — calendar / location / crack / spark / dark / crush spreads with z-scores vs 1m/6m/1y/5y, and 5-year seasonal overlays.
- **Calendar spread ticket** — atomic two-leg execution via exchange-recognized spread products.
- **Crack spread ticket** — multi-product 3:2:1 (or 2:1:1) refining margin, quoted in $/bbl.
- **Inventory & fundamentals dashboard** — EIA petroleum + DOE natgas storage, OPEC monthly, IEA monthly, SPR, floating storage (Vortexa-style), refining utilization, rig counts, production data.
- **Weather & seasonality tracker** — HDD/CDD forecasts (1–14d, 30d, 90d), population-weighted temps, hurricane tracker, polar vortex, ENSO context.
- **OPEC+ meeting calendar & production-target-vs-realized tracker.**
- **Geopolitical & supply tracker** — Middle East tensions, Russian sanctions, Houthi shipping, pipeline outages, refinery outages, planned turnarounds.
- **Inventory release countdown** — EIA Wednesday 10:30am ET, with consensus / whisper / recent-surprise pattern.
- **Roll calendar & roll workflow** — energy futures expire monthly; calendar-spread-aware roll algos.
- **Physical-aware stress library** — hurricane scenario, OPEC surprise, SPR release, cold snap, geopolitical $100→$130 oil.
- **Carbon & adjacent markets** — EUA, CCA, RGGI, RINs.
- **Refining margin board** — gasoline crack, distillate crack by region — refiner economics tradable.

### Naomi Eberhardt — Senior Event-Driven / Merger-Arb Trader

Detail in [trader-archetype-naomi-event-driven.md](trader-archetype-naomi-event-driven.md).

- **Deal pipeline** — every tracked deal as first-class object: target/acquirer, deal type (cash/stock/mixed), terms, headline value, current spread, days to close, probability of close, position size, P/L, next catalyst, status (rumored/announced/definitive/vote/regulatory/final/closed/broken).
- **Active deal dashboard** — terms, spread analytics, probability decomposition (regulatory + shareholder vote), risk/reward, hedge structure.
- **Regulatory & antitrust dashboard per deal** — HSR / Form CO / CMA / MOFCOM / S-4 / proxy filings tracker, review-period deadlines, recent precedents, commissioner profiles.
- **Catalyst calendar deal-attached** — HSR clearance, second-request deadlines, EU phase-1/2 ends, shareholder votes, court hearings, tender expiration, drop-dead dates, walk rights.
- **Document library** — merger agreements, proxy/scheme docs, S-4/F-4, antitrust filings, court filings, sell-side notes, internal memos. Searchable across deals.
- **Cash-and-stock pair ticket** — long target / short acquirer at deal ratio, atomic, with borrow availability + recall-risk flag for the short leg.
- **Capital structure ticket** — long bond / short equity, long pref / short common, long convert / short common.
- **Tender offer participation workflow** — tender / don't-tender decisions through prime broker, status tracking.
- **Distressed / claims trading workflow** — bond / loan / claim acquisition, bankruptcy claim trading.
- **Probability calibration tracker** — when she said 85% close, did 85% of those deals close? Brier score over time.
- **Information-barrier & restricted-list automation** — when firm has MNPI on a deal, name auto-blocked.
- **Deal-tagged news watch** — SEC filings, court dockets, press releases auto-flagged to relevant deals.
- **Deal P/L decomposition** — spread tightening (passive accrual) vs spread widening, hedge P/L, borrow cost.
- **Hedge-effectiveness tracker** — hedges that paid off vs wasted hedges, by deal.

---

## Event-Markets Desk

### Diego Moreno — Senior Live Event Trader (Sports + Horse Racing)

Detail in [trader-archetype-diego-live-event.md](trader-archetype-diego-live-event.md).

- **Betfair-style ladder** — vertical price ladder with bid/ask depth at each tick, click-to-back / click-to-lay, hotkey stake presets, my orders inline, recent trades tape, volume-traded-at-price (Betfair-native), WOM (weight of money).
- **Multi-event grid** — every active market with score, time, position, P/L per outcome, liability per outcome, liquidity, suspension status.
- **Low-latency video wall** — direct stadium feeds (1–3s) or scout-relayed pure data (sub-second), not broadcast TV.
- **Match commentary audio integration** — often a leading information source.
- **Hedge / green-up calculator** — auto-calc counter-position to lock P/L equally across outcomes; one-click execute; partial green-up (50%); asymmetric hedge.
- **Cross-book pricing** — same market across Betfair / Smarkets / Pinnacle / Matchbook with arb spread, liquidity per venue.
- **Pinnacle as benchmark** — sharps reference Pinnacle as fair price; CLV computed against close.
- **Strategy templates** — saved as one-click hotkey-bound: lay-the-draw, tennis serve scalp, pre-final-furlong race entry, tick-scalp.
- **In-running stats feed** — live xG, possession, shots, sectional times for racing, in-play stats per sport.
- **Pre-event horse racing form-book** — last 6 starts per horse, sectional times, jockey/trainer form, going, draw bias, breeding.
- **Bookmaker account-health tracker** — many sportsbooks restrict winners; per-book stake limits, ban risk monitored.
- **Bet-delay awareness** — exchanges impose 1–8s in-play delays; UI surfaces this for stale-quote risk.
- **CLV (closing line value) tracker** — truest sports edge metric; P/L can be noise, CLV is signal.
- **Replay with synchronized video + ladder + orders + P/L** — scrub through any prior event.
- **Multi-event parallelism infrastructure** — Saturday 3pm UK has 6 EPL simultaneously; Cheltenham 7 races / afternoon.

### Aria Kapoor — Senior Prediction Markets / Event-Research Trader

Detail in [trader-archetype-aria-prediction-markets.md](trader-archetype-aria-prediction-markets.md).

- **Markets pipeline** — every tracked market: title, venue(s), current YES price, fair-price estimate, edge, position, P/L, resolution date, resolution source, confidence tier, status.
- **Active market deep-dive** — full criteria, resolution mechanism (UMA / CFTC committee / settlement), edge cases, fair-price model breakdown.
- **Cross-venue pricing dashboard** — same event across Polymarket / Kalshi / Smarkets / Betfair, spread in probability points, depth per venue.
- **Resolution-source monitor** — live feeds from BLS / Fed / government APIs / oracle states / election-night results / committee decisions.
- **Resolution-dispute tracker** — for on-chain markets, ongoing UMA disputes flagged for active positions.
- **Probability-quoted ticket** — YES/NO selector, stake/limit-price in probability, max payout calc, capital-lockup duration preview.
- **Cross-venue execution router** — split orders across venues to minimize impact, atomic legs for arb, bridging cost preview.
- **Triangular-arb detector** — across 3+ venues where prices imply guaranteed profit; system proposes execution path.
- **Basket / cluster ticket** — related markets (e.g. all 50 Senate races) sized by conviction or model edge with cross-correlation aware portfolio risk.
- **Domain research workspaces per market type:**
  - Politics: Nate Silver / 538 / Cook / Sabato / RCP polling aggregators, demographics, FEC data, endorsement tracker, election models.
  - Economics: nowcasting (GDPNow, inflation nowcast), high-frequency indicators, surprise pattern, rates-implied vs prediction-market price.
  - Geopolitical: ACLED conflict tracker, OSINT feeds, diplomatic calendar, expert opinion, base-rate database.
  - Tech / AI: model-release tracker, benchmark scorecards, patent / lawsuit databases, arxiv preprints.
  - Weather / climate: forecast aggregators, climatology, satellite data, ENSO indicators.
- **Calibration curve & Brier score** — primary edge metric; decomposed by edge source (model / polling / expert / structural / arb).
- **Capital-lockup profile** — capital tied up by date; opportunity cost tracked.
- **Counterparty / venue risk dashboard** — Polymarket smart contract risk, Kalshi DCO custody, Smarkets/Betfair UK regulatory.
- **Kelly / fractional-Kelly position sizing calculator** — built into ticket.
- **On-chain wallet management** — multiple wallets, gas strategy, slippage tolerance, approval management, simulation pre-send.

---

## Supervision & Client Side

### David Reyes — Portfolio Manager / Head of Risk

Detail in [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md).

- **Firm-wide aggregate book** — net delta per underlying, gross exposure, net VaR, greeks aggregated, counterparty concentration, stablecoin/cash, margin utilization, in-flight capital — all across all traders / strategies / venues.
- **Per-trader tile board** — every trader's PnL, capital used, risk consumed, behavioral health badge, recent interventions.
- **Behavioral health monitor per trader** — overtrading, position-sizing drift, hold-time drift, loss-cutting discipline, strategy-tag distribution shift.
- **Risk-limit dashboard** — every limit at every level (firm/trader/strategy/venue/counterparty) with utilization, breaches, pending changes.
- **Capital allocation panel** — propose change with reason, scheduled/immediate, approval workflow for large changes.
- **Strategy promotion gate** — final go/no-go on Quinn's promotions with correlation impact / capacity / capital impact visible.
- **Counterparty / venue / protocol health board** — per-venue positions, ratings, recent incidents, bridge in-flight value.
- **Aggregate alerts console** — limit breaches, concentration warnings, drawdown triggers, behavioral drift, fleet anomalies, external events (depegs, exploits, oracle failures).
- **Firm-level stress library** — crypto-specific (BTC -20%, vol shock, stablecoin shock, venue shock), cross-asset, custom configurable.
- **Liquidity / unwind panel** — estimated firm-wide unwind cost in 1d/3d/1w, illiquid concentrations.
- **Client capital management** — AUM by client/strategy/share class, flows, subscription/redemption pipeline, high-water marks, fees accrued.
- **Multi-key firm-wide kill switch** — David + CIO + risk officer for catastrophic events.
- **Risk-committee deck auto-prep** — weekly/monthly committee deliverable from same data plane.
- **Firm-wide replay** — reconstruct entire desk's state at any historical moment for post-incident analysis.
- **Manual intervention ticket with mandatory reason field** — pull-risk / force-flatten / pause-trader / revoke-venue-access, all signed and audited.
- **Audit trail of every authorization** — capital allocation changes, limit changes, promotions, overrides — timestamped, reasoned, signed.

### Elena Costa — External Client / Allocator

Detail in [trader-archetype-elena-external-client.md](trader-archetype-elena-external-client.md).

- **Performance summary landing page** — NAV today, MTD/QTD/YTD/ITD, recent activity ribbon, equity curve since inception, benchmark comparison. Front-loaded for 90-second glance.
- **Institutional performance metrics** — annualized return, vol, Sharpe, Sortino, max DD, current DD, time underwater, worst month, up/down-capture, hit rate, correlation to benchmarks.
- **Strategy-level (not trade-level) attribution** — by strategy / asset class / regime, gross vs net.
- **Risk overview for allocators** — gross/net/leverage/vol target, risk capacity, stress-test results, counterparty list (per agreement), liquidity profile.
- **Subscription / redemption flow** — share class selector, schedule, lockups, gates, capital calls, doc upload, confirmation with reference + effective NAV date.
- **Tiered access controls** — only her data, scoped to her agreement; never sees other clients, trader names, or pre-public commentary.
- **Document vault** — every statement, K-1, 1099, sub-agreement, NDA, audit confirmation; searchable, downloadable, retained forever.
- **Communications log** — every email, call note, meeting summary; searchable.
- **Multi-modal report delivery** — web (interactive), PDF (clean, branded for forwarding), Excel/CSV (for her systems), email digest (scheduled).
- **Manager commentary feed** — narrative attached to performance numbers in PM's voice; quarterly letter, monthly notes, ad-hoc commentary.
- **Capacity / status indicator** — fund open / soft-closed / hard-closed.
- **Mobile-friendly daily glance view** — NAV, change, alerts, pending actions.
- **Schedule-a-call & ask-a-question workflows** — IR contact integrated.
- **Audit trail of her own actions** — every subscription/redemption/switch/upload she's done.
- **Tax document delivery** — K-1 / 1099 / international equivalents, on schedule.
- **Custom report request workflow** — for CIO meetings, with SLA on response.

---

## Architectural Implications

The unique surfaces are where the platform must build **dedicated capability per archetype**. Looking across the list, a few patterns:

1. **Multi-venue / multi-protocol aggregation** is the single most-recurring unique surface, but each archetype requires a different aggregation model (CeFi venues for Marcus; on-chain protocols for Julius; LPs for Yuki; sportsbooks for Diego; prediction venues for Aria).

2. **Domain-specific calendars** are a unique surface for nearly every archetype but generalize as a _framework_ (see [common-tools.md](common-tools.md) #12). The content per archetype is unique; the surface shape is shared.

3. **Domain-specific instrument types** dominate Phase 2 (Enter): curve/butterfly/basis tickets (Ingrid), multi-leg vol structures (Sasha), pairs/baskets (Henry), deal-attached pairs (Naomi), back/lay ladders (Diego), probability-quoted (Aria), on-chain action types (Julius).

4. **Domain-specific risk axes** dominate Phase 3 (Hold): DV01 buckets (Ingrid), multi-dimensional vega (Sasha), currency decomposition (Yuki), counterparty/protocol breakdown (Julius), deal-break aggregate (Naomi), capital-lockup (Aria).

5. **Domain-specific edge metrics** dominate Phase 4 (Learn): CLV (Diego), Brier score (Aria), captured edge bps (Mira), greek-decomposed PnL (Sasha), DV01-adjusted return (Ingrid), CLV / closing-line value, calibration curves.

For the shared platform layer that all of these sit on, see [common-tools.md](common-tools.md).
