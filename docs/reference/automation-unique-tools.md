# Automation Unique Tools — Per-Archetype Specialized Surfaces

A concise index of the surfaces that are **unique** to each archetype's automated-mode terminal — tools that don't generalize across the floor and require dedicated engineering for that specific market or workflow. Sister doc to [unique-tools.md](unique-tools.md), which covers the manual-mode unique surfaces.

The detail of each surface lives in the individual archetype's `# Automated Mode` appendix; this is a tracker.

For shared automation surfaces every archetype carries, see [automation-common-tools.md](automation-common-tools.md). For the universal automation-platform concepts, see [automation-foundation.md](automation-foundation.md).

---

## What "Unique" Means Here

A surface is **unique** if it requires market-specific data, compute, or UX that doesn't generalize across the floor. Marcus's funding-rate-heatmap-as-feature-input doesn't help Henry; Sasha's IV-surface-as-composition-canvas doesn't help Yuki; Aria's resolution-source live monitor doesn't help Theo; Diego's video-foveal supervisor mode doesn't help Naomi. These are the surfaces where the platform must build **dedicated capability per archetype**, not just configuration on top of the shared layer.

A few surfaces appear with overlap (e.g. Marcus and Sasha both consume options-flow data; Diego and Aria both have resolution-aware backtests); when listed as unique, it means the **primary owner** of that surface is the named archetype.

Many of the manual-mode unique surfaces persist in automated mode — the funding heatmap is still Marcus's; the IV surface is still Sasha's; the deal pipeline is still Naomi's. What's _new_ in automated mode is the surfaces tied specifically to the automated workflow (data-layer extensions, feature-library extensions, strategy-template libraries, archetype-specific live state, archetype-specific composition surfaces, archetype-specific lifecycle adaptations). This doc focuses on the automated-mode-distinct surfaces; manual-mode uniques remain catalogued in [unique-tools.md](unique-tools.md).

---

## Crypto Desk

### Marcus Vance — Senior CeFi Crypto Portfolio Trader

Detail in the Automated Mode appendix of [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md).

**Data layer extensions:**

- Tick-level orderbook archives (Tardis / Kaiko / native venue archives) — petabyte-scale, distributed compute required.
- Funding-rate archives with venue-formula history preserved.
- Liquidation event feeds + cluster archives.
- OI history per venue × instrument × horizon.
- ETF flow data (BlackRock, Fidelity, Bitwise, Grayscale, Ark) — daily creates / redeems.
- Stablecoin flow data (USDT / USDC mint / burn / exchange in-flow / out-flow).
- Whale-wallet trackers with on-chain entity attribution.
- Venue announcements feed (instrument additions / removals, leverage changes, funding-formula changes).

**Feature library extensions:**

- `funding_zscore_<window>_<venue>` (multi-window, multi-venue).
- `funding_zscore_term_structure_curvature`.
- `cross_venue_funding_spread_zscore`.
- `funding_volatility_regime`.
- `funding_settlement_proximity`.
- `spot_perp_basis_bps_per_venue`.
- `basis_term_structure_curvature`.
- `basis_volatility_regime`.
- `cross_venue_basis_spread`.
- `oi_change_<window>` (multi-window).
- `oi_price_quadrant_flag` (categorical: new-longs / short-cover / new-shorts / long-capitulation).
- `liquidation_cluster_proximity`.
- `cvd_divergence_zscore_per_venue`.
- `cross_venue_lead_lag_spread`.
- `etf_netflow_24h`.
- `stablecoin_exchange_inflow`.
- `whale_wallet_activity`.

**Strategy template library:**

- Basis arb (atomic spot+perp).
- Funding harvest (unhedged + hedged variants).
- Cross-venue lead-lag.
- Liquidation-cluster fade / chase.
- OI-divergence (quadrant-driven).
- Cross-instrument calendar arb (perp vs dated future).
- Volatility-of-funding mean-reversion.
- Whale-tape signal strategies.
- Cross-asset correlation strategies (BTC / ETH / SOL relative-value).
- Stablecoin-flow strategies.

**Distinct surfaces:**

- Multi-venue capital + balance live state (per-venue capital deployed / free / in-flight).
- Cross-venue auto-rebalance with bridge-policy gates.
- Per-venue sub-account routing (cross-margin vs isolated-margin per strategy class).
- Latency tier enforcement: microstructure-fast (sub-100ms, co-located) vs tactical (second-level) vs strategic (minute-level).

### Julius Joseph — Senior CeFi + DeFi Hybrid Strategies Trader

Detail in [trader-archetype-julius-hybrid.md](trader-archetype-julius-hybrid.md).

**Data layer extensions (above Marcus's):**

- On-chain pool history (Dune / Allium subgraphs).
- Bridge-flow archives (LayerZero / Wormhole / Across / Stargate / native).
- MEV-Share archive.
- Governance-event archive (Aave / Lido / Uniswap / Compound proposals + outcomes).
- Oracle-deviation history (Chainlink / Pyth / UMA dispute history).
- Mempool stream archive.
- Reorg-sensitive raw-events vs decoded-contract-calls (decoder versioning).
- Liquidation event archive (every Aave V3 / Compound V3 / Euler / Morpho / Kamino liquidation with caller, profit, gas, relay, oracle context).
- Health-factor history archive (block-by-block per-position, indexed by underwater address).
- Liquidator-leaderboard archive (derived per-competitor P&L, win-rate, gas-bid distribution per protocol).

**Feature library extensions:**

- Cross-domain features (`cefi_defi_basis_zscore`, `perp_funding_minus_borrow_rate_zscore`).
- On-chain pool-state features (TVL, depth-at-price, fee-tier, LP-count).
- Lending-utilization curvature.
- AMM concentrated-liquidity heatmap features.
- Stablecoin peg deviation z-scores.
- Bridge-flow imbalance.
- MEV exposure / sandwich-risk score.
- Smart-contract age-since-deployment.
- Position health-factor live + decay velocity; liquidatable-now count per protocol; expected-liquidation-profit distribution; bundle-inclusion-rate per relay; priority-fee winning distribution; oracle-price-drift to collateral value; current liquidation bonus per (protocol × collateral); liquidator-competitor concentration.

**Strategy template library:**

- Cross-domain basis arb (CeFi-DeFi spread).
- Cash-and-carry with on-chain yield enhancement (LST / restaking).
- LP + hedge.
- Pendle yield trades (PT / YT).
- Airdrop / points farming with hedged exposure.
- DeFi-native event trades (token unlocks, governance votes, restaking epochs).
- Stablecoin arbitrage / depeg trades.
- Cross-chain arbitrage.
- MEV-aware execution.
- Liquidation capture (atomic flash-loan multicall over Aave V3 six chains + Compound V3 + Euler + Morpho + Kamino; submission via Flashbots bundle / chain-equivalent bundler; per-protocol kill-switch hooks). _Maps to codex `LIQUIDATION_CAPTURE` archetype._
- Opportunistic-supply (pre-position lending capital into stressed markets so liquidations hit Julius's supply rather than a competitor's; auto-withdraw post-stress).

**Distinct surfaces (most-unique on the floor):**

- **On-chain wallet management** — multiple wallets per chain (hot / warm / cold / multi-sig topology), per-wallet policies, gas strategy, slippage tolerance, approval management, simulation pre-send, nonce manager.
- **Cross-domain strategy composition** — atomicity policy as a first-class field; per-leg MEV / gas / bridge / approval / health-factor / wallet-binding policy.
- **Multi-stage kill switch** — Stage 1 CeFi flatten (instant) → Stage 2 on-chain unwind to exit-mode (close LPs, repay loans, unstake) → Stage 3 bridge proceeds to safety wallet on Ethereum L1. Rehearsed quarterly.
- **Synchronized CeFi+DeFi replay** — see Binance and Uniswap state at the same instant.
- **Multi-domain capital state** — per CeFi venue + per chain wallet + per protocol exposure + in-flight bridges + stablecoin-peg + oracle-health strips.
- **Protocol-trust-call as a first-class lifecycle event** — adding / pulling exposure to a protocol requires David sign-off similar to strategy promotion.
- **Bridge ticket + bridge state monitor** — LayerZero / Across / Stargate / native compared with TVL / incident health.
- **DEX aggregator route preview** — 1inch / CoW / Jupiter / Odos / Bebop quotes side-by-side with MEV exposure rating.
- **Liquidation-bot fleet panel** — per-(protocol × chain) bot row in the live-state surface with last-fire timestamp, opportunities-seen vs acted-on, gas-burned-today vs cap, inclusion-rate vs target, kill-switch state. Foveal during stress events because liquidation supply must scale up while everyone else's risk is firing kill switches. Fleet is supervised, not discretionary — but inclusion-quality and gas-budget anomalies route to Julius for judgment.

### Quinn Park — Quant Overseer

Detail in [trader-archetype-quinn-quant-overseer.md](trader-archetype-quinn-quant-overseer.md).

**Data layer extensions:**

- Cross-archetype performance archives (every archetype fleet's rolling Sharpe, drawdown, regime fit, capacity utilization, attribution decomposition — fleet-level, weekly granularity).
- Firm-aggregate position state archives.
- Risk-factor archives (Barra-style equity factors, fixed-income factors, cross-asset macro factors, crypto-native factors).
- Cross-venue execution-quality archives (slippage realized vs assumed across every fleet).
- Sanctioned-strategy-class archive (institutional memory of sanctioning decisions).

**Feature library:**

- Firm-aggregate cross-archetype factor exposures.
- Correlation-cluster features (cross-fleet, cross-archetype).
- Capacity-utilization features.

**Distinct surfaces:**

- **Cross-fleet dashboard** — rows = archetype fleets; aggregated health, PnL, capacity. Drill into individual archetype fleet.
- **Cross-fleet anomaly surface** — anomalies that span archetypes (e.g. Marcus and Sasha both hitting capacity simultaneously, suggesting a regime shift).
- **Cross-fleet correlation matrix at fleet level** — fleet-vs-fleet pairwise correlations.
- **Firm-aggregate risk live state.**
- **Strategy state inspection across all fleets** — read-only inspection authority over any archetype's strategies.
- **Strategy class sanctioning lifecycle** — Quinn's authority over which strategy classes the firm sanctions (separate from individual strategy promotions).
- **Strategic capital reallocation workflow** — meta-allocation across archetypes.
- **Cross-archetype meta-strategy composition** — strategies with legs in multiple archetype instrument spaces.
- **Firm-wide kill authorization (with David)** — multi-key for catastrophic events.

### Mira Tanaka — Senior Market Maker

Detail in [trader-archetype-mira-market-maker.md](trader-archetype-mira-market-maker.md).

**Data layer extensions:**

- Per-venue full L3 order book deltas (hardware-timestamped).
- Per-venue trade tape with aggressor side, counterparty proxy, latency-from-match.
- Mira's own send / cancel / replace log (every quote emitted, ack-stamped, with parameter-profile in effect at send).
- Mira's own fill log with captured-edge bps, post-fill drift, counterparty proxy, queue-position-at-fill.
- Cross-venue synchronized tick stream (multi-venue ticks aligned via hardware timestamps for lead-lag analysis).
- Per-venue rate-limit telemetry.

**Feature library:**

- Microstructure-feature-heavy — sub-second / second / minute horizons.
- Feature input class (book / trade / own-fill / cross-venue).
- Regime-conditional features.

**Strategy templates → Parameter Profile families:**

- Top-of-book maker (TOB) — single-layer continuous quote, inventory-skewed, adverse-selection-widened.
- Layered ladder maker (LLM) — multi-level quote stack with size schedule and per-layer skew.
- Pro-rata venue specialist — engine variant tuned for pro-rata matching.
- Hidden / iceberg quoter.
- Cross-venue lead-leaning quoter.
- Auto-hedging companion.
- Options market-maker (Deribit) + companion delta-hedger.
- Funding-arbitraged perp quoter.
- Outage-aware backup quoter.
- Regulated-spot quoter (Coinbase / Kraken).

**Distinct surfaces:**

- **Quote engine state panel** — current quotes / sizes / skews per instrument per venue, with effective fair-price model breakdown.
- **Parameter Profile Composition** (replaces Strategy Composition).
- **Parameter-profile lifecycle** (replaces strategy lifecycle): research → shadow → canary-live → live → monitor → retired. Faster cadence (15–30 cycles / week).
- **Inventory + Hedge + Adverse-Selection Live State** (Mira's section 11.5).
- **Two continuous-improvement loops:**
  - Parameter optimizer (Bayesian / CMA-ES sweep on shadow tape).
  - Adverse-selection / venue-toxicity learning loop (rolling retrain).
- **Microstructure simulator with realistic queue / latency / rate-limit / counterparty-fill emulation** (her backtest engine).
- **Counterparty-fingerprint clusters** as platform-mediated shared infrastructure across makers.
- **Profile families with diff rendering** for fleet-wide edits.
- **Foot-pedal + multi-key auth** for catastrophe-flatten.
- **Cross-venue lead-lag indicator** (her primary microstructure signal).

### Sasha Volkov — Senior Options & Volatility Trader

Detail in [trader-archetype-sasha-options-vol.md](trader-archetype-sasha-options-vol.md).

**Data layer extensions:**

- Options-tick + snapshot archives per venue (Deribit + CME + Binance + Bybit options + on-chain options).
- Surface-fits archives (every fitted IV surface preserved).
- Dealer-positioning archives (Paradigm block prints, dealer net-position estimates).
- Block-trade archive (Paradigm + on-chain RFQ).
- Underlying spot / perp / futures context.
- Realized-vol archives (multi-window).
- Event-calendar with implied-IV pricing.

**Feature library:**

- IV-rank percentiles per (strike, tenor, underlying).
- Skew z-scores, butterfly z-scores.
- Vol-risk-premium time series (IV minus subsequent realized).
- Surface-fit residuals.
- Smile-regime classifier (sticky-strike / sticky-delta / sticky-moneyness regime indicator).
- GEX / vanna / charm walls (dealer-hedging-flow features).
- Realized correlation between underlyings (for dispersion).

**Strategy template library:**

- Short-strangle-with-delta-hedge.
- Calendar spread (long back, short front).
- Gamma scalping with auto-hedger config.
- Dispersion (long index vol, short component vol; or reverse).
- Term-structure arb.
- RV / IV cone-based mean-reversion.
- Skew-rotation.
- Butterfly / risk-reversal structures.
- Event-vol pre-positioning (FOMC / fork / earnings).

**Distinct surfaces:**

- **Volatility surface as the composition canvas** — Sasha composes strategies _on_ the surface, not adjacent to it.
- **Auto-delta-hedge as a built-in component of strategy composition** — hedger config node mandatory for any short-vol strategy.
- **Aggregate Greek Panel** (her section 11.5) — vega-by-tenor sparklines + vega heatmap + gamma + theta + delta-net target tracker.
- **Vega heatmap as the automated-mode equivalent of the IV surface** — for fleet supervision.
- **Vega-budget allocation across (tenor × underlying × strategy class)** — vol-trader-specific dimension on top of $-allocation.
- **Hedger sub-state inspectable as part of the strategy** (in section 11.6 inspection).
- **Hedger override in emergency mode** — manual delta override capability.
- **Surface-aware backtest engine** — emphasizes surface evolution + auto-delta-hedge simulation; reconcilable with live.
- **Block / RFQ workflow** — Paradigm + on-chain RFQ integrated.

---

## TradFi Desk

### Henry Whitfield — Senior Equity Long/Short PM

Detail in [trader-archetype-henry-equity-long-short.md](trader-archetype-henry-equity-long-short.md).

**Data layer extensions:**

- Refinitiv (Eikon / Workspace) — fundamentals + estimates + news + transcripts.
- S&P Compustat — point-in-time fundamentals (point-in-time guarantee mandatory).
- Earnings-call audio + transcripts archive (10+ years searchable).
- Sell-side research archive (every initiation / upgrade / downgrade / target change with linked PDF).
- Expert-network call notes archive.
- Insider filings (Form 4) archive.
- Short-interest archive (days-to-cover, % of float).
- Options-volume / OPRA archive.
- Alt-data feeds (web traffic, app installs, satellite imagery, credit-card spend).
- Conference / analyst-day calendar with recordings.

**Feature library (family-named convention):**

- `valuation_*` (P/E history, EV/EBITDA history, peer comparables, reverse-DCF implied growth).
- `estimate_*` (revision velocity, dispersion, beat-rate-history).
- `quality_*` (margin-trend, balance-sheet, cash-flow stability).
- `momentum_*` (relative-strength, anchored-VWAP).
- `transcript_*` (NLP-derived sentiment, hedge-word density, competitor-mention frequency).
- `insider_*` (buy-cluster, sell-cluster, insider-velocity).
- `short_*` (short-interest velocity, days-to-cover, HTB-flag).
- `factor_*` (Fama-French 5 / Barra-style / custom).
- `event_*` (catalyst-window indicators, earnings-window flags).
- `microstructure_*` (intraday liquidity for execution sizing).

**Strategy template library:**

- Pair trade (long target / short comp with ratio enforcement).
- Factor tilt (long-short basket on factor scores).
- Earnings-window event setup.
- Sector rotation.
- M&A pre-event positioning.
- Mean-reversion within factor-residuals.

**Distinct surfaces:**

- **Systematic fleet (~1000-name universe) vs discretionary book (top 10–20 conviction names) explicit distinction** — both run; trader manages both differently.
- **Factor exposures live monitoring per strategy** (his section 11.5 — Factor Exposures + Catalyst Calendar Live State).
- **Earnings calendar as deployment-cadence driver** — strategies activate / pause around earnings windows.
- **Expert-network call notes as a research-input feature** (transcribed + NLP-tagged).
- **Combined-book beta-net targeting via hedge overlay** — systematic + discretionary book sized together for combined exposure.
- **Borrow-pool funding management** — locate availability, HTB premiums, borrow-cost projection.
- **Earnings transcript full-text search** across coverage universe (10+ years).
- **Catalyst outcome tracker** — fed by both systematic and discretionary books; calibration of "Henry-knew" vs "Henry-discovered."

### Ingrid Lindqvist — Senior Rates Trader

Detail in [trader-archetype-ingrid-rates.md](trader-archetype-ingrid-rates.md).

**Data layer extensions:**

- Sovereign yield archives (FRED, Bundesbank, BoJ, BoE, AFT) — back to 1980s.
- Swap-curve archives (Bloomberg, Tradeweb).
- Auction histories (Treasury, DMOs) with bid-to-cover, indirect / direct / dealer share, tail.
- CFTC primary-dealer surveys.
- NY Fed primary-dealer survey data.
- OIS / SOFR / €STR / SONIA / TONA tick + EOD.
- Repo / SOFR microdata.
- Inflation-linker archives.
- Cross-currency basis archives.
- Central-bank statement / press-conference text archive.

**Feature library:**

- Spread z-scores (every relevant pair: 2s10s, 5s30s, etc., per currency).
- Butterfly z-scores (2s5s10s, 5s10s30s).
- Forward-implied path divergence from OIS.
- CFTC positioning extremity.
- Primary-dealer concession history.
- Repo specialness.
- Auction-tail history.
- WI-vs-current-benchmark grey-market pricing.

**Strategy template library:**

- Curve trade (steepener / flattener) — DV01-balanced, atomic, quoted in bps.
- Butterfly — DV01-balanced.
- Basis trade (cash-futures, swap-bond, asset-swap).
- Swap-spread mean-reversion.
- Auction-concession model (pre-position for tail vs current pricing).
- Repo-special detection (active borrow on cheapest-to-deliver).

**Distinct surfaces:**

- **Yield curve visualization as primary thinking surface** (yield-space, not price-space).
- **Curve atlas integrated with strategy composition** — Ingrid composes curve trades on the curve atlas.
- **DV01-bucketed fleet view** (her section 11.5) — by tenor bucket (0–2y / 2–5y / 5–10y / 10–20y / 20–30y), by currency, by instrument type.
- **Auction calendar as deployment-cadence driver** — strategies activate / pause around auctions.
- **Cross-curve & cross-currency spread board** (UST vs bund, swap spreads, asset swap, XCCY basis).
- **Pre-auction concession tracker.**
- **Primary-dealer positioning as a feature** (CFTC / NY Fed).
- **Calendar-driven mode-switching** — auction-mode, FOMC-mode, ECB-mode, NFP-mode, quarter-end-mode, repo-stress-mode.
- **Carry & roll-down PnL tracker** — passive vs active P/L decomposition.
- **Cash-vs-futures basis tracker** — net basis, gross basis, implied repo, conversion factor awareness.

### Rafael Aguilar — Senior Global Macro PM

Detail in [trader-archetype-rafael-global-macro.md](trader-archetype-rafael-global-macro.md).

**Data layer extensions (broadest of any archetype):**

- Sovereign yields (G10 + EM) — full curves daily, intraday for liquid points.
- OIS / SOFR / ESTR / SONIA / TONA curves.
- FX major + EM tick + EOD archives.
- Equity index futures + country ETFs.
- Commodity futures (energy, metals, ags).
- Credit indices (CDX, iTraxx).
- Vol indices (VIX, MOVE).
- Macro surprise indices (Citi Economic Surprise per region).
- Nowcasting archives (Atlanta Fed GDPNow, Cleveland Fed inflation nowcast).
- High-frequency real-economy series (credit-card, mobility, shipping).
- Sentiment surveys.
- Composite leading indicators.
- Geopolitical-event databases.

**Feature library:**

- Asset class × region × theme tag × time horizon × owner-desk filter axes.
- Cross-asset relationship features (rolling correlations, regression residuals, cointegration diagnostics).
- Theme-evidence ledgers (per active theme).
- Mismatch z-scores (when a relationship deviates from historical N σ).
- Conviction-calibration features.

**Strategy templates → Theme-Monitoring Scaffolds:**

- Theme-evidence monitors.
- Cross-asset relationship monitors.
- Mismatch detectors with theme-attribution.
- Expression-comparison engine.
- Scenario PnL grid.
- Conviction-calibration tracker.
- Theme-relationship-reliability monitors.
- Macro-surprise / nowcast pipelines.
- Catalyst-positioning aggregator.
- Theme-journal NLP assistant.

**Distinct surfaces:**

- **Themes board as foveal Phase 1 surface** (his section 11.5 — Theme Pipeline Live State).
- **Theme-specific custom dashboards** — saveable per-theme workspace.
- **Expression comparison engine** — given a thesis, compare candidate expressions on consistent axes (carry, IV-rank, asymmetry, liquidity, historical fit, capital).
- **Multi-asset multi-leg ticket sized by risk contribution.**
- **Cross-asset dashboard** — equities / rates / FX / commodities / credit / vol on one screen.
- **Cross-asset relationship matrix & mismatch detector.**
- **Multi-axis risk panel** — equity beta + DV01 + FX delta + commodity delta + credit DV01 + vega visible simultaneously.
- **Cross-asset stress library** — risk-off / inflation surprise / geopolitical shock / central-bank surprise scenarios.
- **Theme journal as primary artifact.**
- **Conviction calibration tracker** — primary post-trade metric.
- **Approval-mode taxonomy** for theme-scaffolds: autonomous / semi / approval-required (most are approval-required by design).

### Yuki Nakamura — Senior FX Trader

Detail in [trader-archetype-yuki-fx.md](trader-archetype-yuki-fx.md).

**Data layer extensions:**

- Spot / forward / NDF tick archives per LP / venue.
- FX vol-surface archives (Bloomberg / Tradeweb).
- Central-bank intervention archives (BoJ, SNB, EM CBs).
- OIS / rate-differential archives per pair.
- CFTC IMM positioning per currency future.
- Capital-control event tracker (per country).
- Fixing-history archives (WMR 4pm London, ECB 1:15pm, NY 10am, Tokyo 9:55am).
- Sovereign CDS spreads.
- Sell-side fixing-flow color archives.

**Feature library:**

- `carry_to_vol_zscore` per pair.
- `basis_blowout_indicator` (cross-currency basis swap deviation).
- `ndf_onshore_offshore_deviation` per restricted currency.
- `rr_butterfly_zscore` (25Δ RR + 25Δ BF).
- `ois_policy_path_divergence` (OIS-implied vs guidance).
- `fixing_imbalance_estimate`.
- `intervention_zone_proximity` per pair.
- `capital_control_event_flag`.
- `em_political_risk_flag`.
- `session_regime_indicator` (Tokyo / EU / NY).

**Strategy template library:**

- Carry-basket — multi-pair carry strategy with vol-adjusted sizing.
- Fixing-flow — fade / follow expected fixing flow.
- NDF arb — onshore-vs-offshore deviation capture.
- Intervention-zone mean-reversion — fade approaches to known intervention levels.
- Cross-vol — IV vs RV relative-value across G10 vol pairs.
- Trend-and-momentum.
- Cross-currency basis arb.
- Rate-differential / OIS-based positioning.

**Distinct surfaces:**

- **FX cross matrix as primary thinking surface** (currency × currency grid).
- **Currency-decomposed fleet view** — net exposure per currency, not per pair.
- **Carry & forward dashboard** — overnight forward points, annualized carry, carry-to-vol ratio per pair.
- **Forward / settlement ladder** — settlement obligations by date and currency.
- **NDF ticket & NDF curve board** with onshore-offshore deviation tracker.
- **Multi-LP aggregation** with last-look awareness, LP scorecard.
- **Fixing trade workflow** — WMR / ECB / NY / Tokyo countdown, depth around fix, expected impact.
- **Intervention zone overlay** on charts for pairs with active CB intervention history.
- **Session-aware modes** — Tokyo / London / NY session-specific layouts.
- **Capital-controls & political-news tracker for EM.**
- **Carry-trade unwind risk monitor.**
- **Fixing-mode + EM-mode supervisor variants.**
- **Capital-control gate check on EM strategies** (mandatory pre-deployment validation).
- **Intervention-zone gate check on intervention-prone pairs** (mandatory pre-deployment validation).

### Theo Rasmussen — Senior Energy Trader

Detail in [trader-archetype-theo-energy.md](trader-archetype-theo-energy.md).

**Data layer extensions:**

- EIA / DOE / IEA archives.
- Weather-model outputs (multiple providers — GFS / ECMWF / ICON / UKMET).
- Shipping / floating-storage data (Vortexa-style, Kpler-style).
- Refinery-utilization history.
- OPEC production data.
- Sanctioned-flow tracking (grey-fleet, dark-fleet shipments).
- Hurricane-track archives (NHC, JTWC).
- Pipeline / refinery outage tracker.
- Carbon market archives (EUA, CCA, RGGI).

**Feature library:**

- Degree-day forecast deltas (HDD / CDD vs normal).
- Inventory-vs-5y range z-scores.
- Refinery-margin compression.
- OPEC-promised-vs-realized gaps.
- Hurricane-track-probability layers (cone-of-uncertainty derived).
- Multi-model weather divergence as a feature (when ECMWF and GFS disagree).
- Crack-spread regime indicators.
- Calendar-spread z-scores per product.

**Strategy template library:**

- Calendar-spread (M1-M2, M1-M3, etc.) — DV01-balanced.
- Weather-driven natgas (HDD / CDD divergence vs forward strip).
- Inventory-setup (pre / post EIA — including blackout enforcement).
- Crack-spread mean-reversion.
- Spark / dark spread (natgas-vs-power, coal-vs-power).
- Crush spread (ag, when applicable).
- Location spread (WTI-Brent, HH-TTF, TTF-JKM, etc.).
- OPEC-event scaffolding (pre-positioned for sentiment, scoped for human override on actual headline).
- Refinery-outage trade.
- Sanctions-regime monitoring.
- Carbon arbitrage.

**Distinct surfaces:**

- **Forward curves as primary thinking surface** (per product, 12–60 months out).
- **Spread dashboard as first-class instrument set** (calendar / location / crack / spark / dark / crush with z-scores).
- **Inventory & fundamentals dashboard** (EIA / DOE / IEA / OPEC / IEA / SPR / floating-storage / refining-utilization / rig-counts / production data).
- **Weather & seasonality tracker** — multi-model HDD/CDD forecasts, hurricane tracker, ENSO context.
- **Geopolitical & supply tracker.**
- **Inventory release countdown** (his section 11.5 — Inventory-Release-Window Live State).
- **EIA-blackout enforcement** — strategies auto-pause for the 5 minutes before / after EIA / DOE prints.
- **Seasonal lifecycle with first-class Sleeping sub-state** — winter-natgas wakes October / sleeps April; summer-gasoline mirror-image.
- **Multi-model weather feature pipeline** — divergence between models is itself a feature.
- **OPEC-headline pause-on-event scaffolding** — strategies pre-positioned but auto-pause on actual headline pending human interpretation.
- **Roll calendar & roll-cost tracker** — futures roll constantly.
- **Physical-aware stress library** — hurricane / OPEC surprise / SPR release / cold snap / geopolitical $100→$130.

### Naomi Eberhardt — Senior Event-Driven / Merger-Arb Trader

Detail in [trader-archetype-naomi-event-driven.md](trader-archetype-naomi-event-driven.md).

**Data layer extensions:**

- SEC EDGAR full filing archive.
- Court-docket archive (Delaware Chancery, federal, appellate).
- DOJ / FTC / EU CMA / UK CMA / China SAMR / India CCI / Brazil CADE decision database.
- NLP-ready merger-agreement corpus.
- Antitrust-precedent database.
- Sell-side event-driven research archive.
- Expert-network call notes archive.
- Sponsor / PE history database.
- Polling / political-regime data (commissioner stance over time).

**Feature library (entity-dimensioned):**

- Per-deal / per-target / per-acquirer / per-sponsor / per-jurisdiction / per-commissioner / per-court / per-judge entity dimensions.
- Antitrust-precedent similarity scores.
- Regulatory-commissioner-stance-derived probabilities.
- Document-NLP risk flags (MAC clauses, breakup-fee structures, financing risk).
- Deal-spread velocity.
- Cross-deal-pattern features.
- Political-regime / regulatory-regime indicators.

**Strategy template library:**

- Cash-deal arb — long target post-announcement until close.
- Cash-and-stock pair — long target / short acquirer at deal ratio.
- Capital-structure pair — long bond / short equity, long pref / short common, long convert / short common.
- Spinoff trade — long / short spin-co + parent based on relative valuation.
- Tender offer participation.
- Distressed / claims trading.
- Hedge structures (index put, sector ETF short, vol hedges).

**Distinct surfaces:**

- **Deal pipeline as foveal surface** (her section 11.5 — Deal Pipeline Live State).
- **Active deal deep-dive** — terms, spread analytics, probability decomposition, risk/reward, hedge structure.
- **Regulatory & antitrust dashboard per deal** — filings tracker, review-period deadlines, recent precedents, commissioner profiles.
- **Catalyst calendar deal-attached** — HSR clearance, second-request deadlines, EU phase-1/2 ends, shareholder votes, court hearings, tender expirations, drop-dead dates, walk rights.
- **Document library** — merger agreements, proxy / scheme docs, S-4/F-4, antitrust filings, court filings, sell-side notes, internal memos. Searchable across deals.
- **Probability calibration tracker** — Brier score over time per deal class.
- **Information-barrier & restricted-list automation** — when firm has MNPI on a deal, name auto-blocked.
- **Deal-tagged news watch** — SEC filings, court dockets, press releases auto-flagged.
- **Deal P/L decomposition** — spread tightening (passive accrual) vs spread widening, hedge P/L, borrow cost.
- **Hedge-effectiveness tracker.**
- **Manual override more frequent by design** — Naomi's edge is judgment-heavy, so the manual override path is well-traveled.
- **Vote-day / hearing-day / regulatory-decision-day modes.**

---

## Event-Markets Desk

### Diego Moreno — Senior Live Event Trader (Sports + Horse Racing)

Detail in [trader-archetype-diego-live-event.md](trader-archetype-diego-live-event.md).

**Data layer extensions:**

- Match event tape (passes, shots, fouls, cards, substitutions, set-pieces, goals, half-time, full-time, VAR reviews) — multi-vendor (Opta-class, StatsPerform-class, Sportradar-class).
- In-running stats feeds (xG-per-minute, expected-threat, pressing-intensity, possession).
- Tennis point-by-point feeds.
- Basketball play-by-play.
- NFL play-by-play.
- Cricket ball-by-ball.
- Lineup-confirmation timestamps (the moment confirmed XI is published per match).
- Team injury / availability database with reporter-source-quality scoring.
- Weather data per venue.
- Referee / umpire assignments with penalty-rate priors.
- Racing form data, sectional times, jockey / trainer / breeding data.
- Cross-book odds streams (Betfair / Smarkets / Pinnacle / Matchbook).
- Video archive (low-latency stadium feeds preferred over broadcast).

**Feature library:**

- Pre-event xG-derived market edges.
- In-running stat-vs-market-implied gaps (e.g. team is dominating xG but odds haven't moved).
- Lineup-impact estimates (per-player marginal contribution).
- Weather-adjusted scoring expectation.
- Racing-form features (last-6-starts, sectional-time-relative-to-class, going-preference, draw-bias).
- Cross-book spread features.
- Bet-delay state per venue per market.

**Strategy template library:**

- Lay-the-draw — back home pre-game, lay draw on a goal.
- Tennis serve scalp.
- Racing pre-final-furlong entry.
- Tick-scalp on liquid in-play markets.
- Cross-book arb.
- xG-divergence trade — fade markets that haven't priced in xG dominance.
- In-play tick-scalp on quiet phases.
- Festival mode strategies (Cheltenham, World Cup) — concentrated supervision windows.

**Distinct surfaces:**

- **Active-Event Live State** (his section 11.5) — every active event with score / time / liquidity / suspension state / video-feed health.
- **Video as foveal element in supervisor console** — match-day mode preserves video at the center.
- **Manual ladder + green-up calculator preserved** — Diego's manual mode is so distinctive that the ladder and green-up surfaces stay foveal even in automated mode.
- **Per-event-cluster capital allocation** — Saturday-3pm-EPL window, Wednesday-Champions-League, Cheltenham-Day, Super-Bowl-Sunday.
- **Match-day cadence as deployment-cadence driver.**
- **Seasonal lifecycle with hibernation** — Premier League strategies sleep during World Cup, wake on EPL restart.
- **Sports-realism backtest engine** — emulates bet-delay, market suspension, stake-factor, leg-out latency.
- **Cross-book pricing & Pinnacle benchmark** — Pinnacle as fair-price benchmark; CLV (closing line value) computed against close.
- **CLV as the truest edge metric in retrospectives.**
- **Festival-mode + match-day-mode + post-event-mode** supervisor variants.

### Aria Kapoor — Senior Prediction-Markets / Event-Research Trader

Detail in [trader-archetype-aria-prediction-markets.md](trader-archetype-aria-prediction-markets.md).

**Data layer extensions:**

- Polling-aggregator histories (FiveThirtyEight, Silver Bulletin, Cook Political Report, Sabato's Crystal Ball, RCP).
- Election-result archives (federal + state + local).
- Government data APIs (BLS / Fed FRED / Treasury / EIA / etc.).
- Forecasting-model outputs (Atlanta Fed GDPNow, Cleveland Fed inflation nowcast, NY Fed, St Louis Fed).
- Geopolitical-event databases (ACLED, OSINT incl. Bellingcat, Stratfor-style).
- Patent / lawsuit databases (PACER docket).
- Tech / AI benchmark archives (HumanEval, MMLU, ARC, etc.).
- Weather forecast aggregators (multi-model ensemble).
- Climatology-comparison databases (ENSO indices, historical-baseline).
- Polymarket / Kalshi / Smarkets / Betfair price archives.
- UMA oracle proposal histories (with stake size, dispute window).

**Feature library:**

- House-effect-adjusted polling fair-probabilities per race.
- Polling-trend velocities.
- Nowcast-vs-consensus deltas.
- Conflict-event-rate z-scores.
- Model-release-cadence indicators.
- Ensemble-weather-spread features.
- Cross-venue spread features (per contract).
- Calibration-tier indicators per market.
- Resolution-source-derived flag (does this feature compute from data that resolves a contract).

**Strategy template library:**

_Politics templates:_

- Polling-vs-market House race monitor.
- Senate-race basket strategy.
- Gubernatorial-race monitor.
- Election-night momentum strategies.

_Economics templates:_

- Nowcast-vs-market CPI monitor.
- Fed-day FOMC outcome strategies.
- Macro-surprise basket.

_Geopolitical templates:_

- Conflict-event escalation monitor.
- Sanctions-decision strategies.
- Treaty / deal closure monitors.

_Tech templates:_

- Model-release-date monitors.
- Benchmark-outcome strategies.
- Patent / lawsuit decision monitors.

_Weather templates:_

- Temperature-contract calibration.
- Hurricane-formation strategies.
- Seasonal-rainfall strategies.

**Distinct surfaces:**

- **Markets pipeline as foveal surface** (her section 11.5 — Active-Resolution-Window Live State).
- **Active market deep-dive** — full criteria, resolution mechanism, edge cases, fair-price model breakdown.
- **Cross-venue pricing dashboard** — same event across Polymarket / Kalshi / Smarkets / Betfair, spread in probability points.
- **Resolution-source live monitor** — live feeds from BLS / Fed / government APIs / oracle states / election-night results / committee decisions.
- **Resolution-dispute tracker** — for on-chain markets, ongoing UMA disputes flagged.
- **Probability-quoted ticket** — YES/NO selector, stake/limit-price in probability, max payout calc, capital-lockup duration preview.
- **Cross-venue execution router** with bridging awareness.
- **Triangular-arb detector** across 3+ venues.
- **Per-domain research workspaces** — politics / economics / geopolitics / tech / weather (different tools per domain).
- **Calibration tracker as primary post-trade metric** — calibration curve + Brier score, segmented by edge source.
- **Capital-lockup profile** — capital tied up by date; opportunity cost tracked.
- **Counterparty / venue risk dashboard** — Polymarket smart-contract risk, Kalshi DCO custody, Smarkets / Betfair UK regulatory.
- **Kelly / fractional-Kelly position sizing calculator** — built into ticket.
- **On-chain wallet management** (lighter version of Julius's).
- **Cycle-aware walk-forward** — election-cycle segments; cross-cycle decay tracking.
- **Resolution-window-mode + election-night-mode + data-release-mode** supervisor variants.
- **Approval-mode taxonomy** — autonomous / semi / approval-required per strategy.

---

## Supervision & Client Side

### David Reyes — Portfolio Manager / Head of Risk

Detail in [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md).

**Data layer extensions:**

- Firm-aggregate datasets (computed by the platform from per-trader feeds; not procured externally).
- Counterparty-data subscriptions (counterparty health telemetry).
- Venue-health datasets (cross-venue health, exposure, recent incidents).
- Protocol-health datasets (DeFi protocols Julius depends on; cross-protocol risk).
- Macro / regime datasets (firm-wide context).
- Compliance / regulatory datasets (audit-trail archives, sanctions, regulatory filings).
- Audit-archive cold storage.

**Feature library — firm-aggregate:**

- `firm.aggregate_var_*` (parametric / historical / Monte Carlo VaR).
- `firm.aggregate_es_99`.
- `firm.gross_exposure`, `firm.net_exposure`, `firm.leverage_ratio`.
- `firm.concentration_top_n` (top-N-instrument share of gross exposure).
- `firm.counterparty_concentration`.
- **Cross-archetype factor exposures** — `firm.factor_momentum_exposure`, `firm.factor_value_exposure`, `firm.factor_carry_exposure`, **`firm.factor_short_vol_exposure`** (critical because many archetypes have this latently).
- `firm.idiosyncratic_share`.
- `firm.liquidity_tier_1_share`.
- Compliance features (`firm.mandate_adherence_*`, `firm.restricted_instrument_flag_*`).

**Distinct surfaces:**

- **Firm-Wide Live State** — David's section 11.5 = the entire firm aggregate.
- **Firm-aggregate fleet supervision** — rows = trader fleets; aggregated health, PnL, capacity, concentration warnings.
- **Trader-detail drill** — drill from firm to trader fleet to individual strategy.
- **Cross-fleet correlation matrix with hidden-correlation flags.**
- **Firm-level intervention console** — pull-trader, archetype-fleet kill, cross-archetype kill.
- **Multi-key kill switches** — David + CIO + risk officer for catastrophic events.
- **Firm-wide replay** — reconstruct entire firm state at any historical moment.
- **Risk-Limit Hierarchy Composition** (replaces Strategy Composition) — David doesn't compose strategies; he composes the firm-level hierarchy of caps and rules.
- **Strategy Class Sanctioning Lifecycle** (replaces Promotion Gates) — which strategy classes are firm-approved.
- **Firm-level cross-archetype capital allocation** — marginal Sharpe across archetypes, regime-conditional caps, counterfactuals.
- **Behavioral monitoring at scale** — drift indicators per trader (position-sizing drift, hold-time drift, override frequency, manual-trade frequency).
- **Auto-prepared committee deck** — weekly / monthly committee deliverable assembled from the live data plane.
- **Strategy state inspection across all fleets** — read-only inspection authority.
- **Office-presentation mode** — large screen, presentation-ready dashboards for client / risk-committee meetings.
- **Committee-prep + allocation-review + incident + client + off-hours** supervisor variants.

### Elena Costa — External Client / Allocator

Detail in [trader-archetype-elena-external-client.md](trader-archetype-elena-external-client.md).

**Distinct surfaces (limited — most automation surfaces don't apply to Elena):**

- **Transparency disclosures** into model-risk governance, kill-switch policy, model-version registry — outcomes-only, share-class-tiered.
- **Reports describing how her capital is risk-managed** — systematic-side risk decomposition, strategy-class-level attribution, expanded counterparty / venue / protocol risk reporting, fund-level backtest-vs-live divergence.
- **Periodic model-risk committee deliverables** — quarterly cadence, vault-resident, audit-grade.
- **Manager-narrative feed** — outcomes of David's model-risk committee distilled to client-tier.
- **Fail-over policy disclosure** — how the platform handles emergency / catastrophe events that could affect her capital.

**What does not change** (covered by manual mode and remains identical in automated mode):

- Multi-modal report delivery (web / PDF / Excel / email digest).
- Tiered access controls.
- Audit trail of her own actions.
- Daily glance / weekly performance / monthly / quarterly review cadence.
- Document vault.
- Subscription / redemption workflow.

**What does not apply to Elena's appendix:**

- Manual trading section (12.3) — no manual trading.
- Strategy state inspection (11.6) — no strategy state inspection.
- Daily rhythm changes — unchanged from manual mode.

---

## Cross-Cutting Patterns Across Archetypes

A few patterns recur across multiple archetypes' unique surfaces. Worth calling out:

1. **Per-archetype "live state" surface (section 11.5).** Every trader archetype has one foveal panel showing their primary risk dimension live: Marcus's multi-venue capital, Mira's inventory-and-adverse-selection, Sasha's aggregate-greek-panel, Henry's factor-exposures, Ingrid's DV01-buckets, Naomi's deal pipeline, Diego's active-event grid, Aria's resolution-window markets, Theo's inventory countdown, Yuki's currency exposure, Rafael's themes, Julius's multi-domain capital, Quinn's firm-aggregate risk, David's firm-wide live state. This is the single most-archetype-specific UI element.

2. **Calendar-driven mode-switching.** Every archetype has events that drive supervisor-console mode-switches: earnings (Henry), auctions (Ingrid), fixings (Yuki), inventory releases (Theo), votes / hearings (Naomi), match days (Diego), resolution windows / election nights (Aria), expiries (Sasha), session rotations (Mira), committee cycles (David), 24/7 (Marcus / Julius). The platform's mode-switching mechanism is universal; the events differ.

3. **Domain-specific backtest realism.** Universal backtest engine, but execution-realism extensions per archetype — bet-delay (Diego), capital-lockup (Aria), MEV / gas / bridging (Julius), fixing mechanics (Yuki), CCP margin (Ingrid), point-in-time fundamentals (Henry), resolution-outcome (Aria), seasonality (Theo), microstructure realism (Mira), surface evolution + auto-hedge (Sasha).

4. **Domain-specific lifecycle-cadence.** Universal lifecycle (research → paper → pilot → live → monitor → retired); cadence varies — fast for Mira and crypto traders; slow for Henry and Rafael; seasonal-with-hibernation for Diego and Theo; per-deal-class for Naomi; per-cycle for Aria.

5. **Supervisor-console domain-mode variants.** Universal mode-switching mechanism; archetype-specific modes — auction / FOMC / quarter-end (Ingrid); fixing / EM (Yuki); EIA-day / OPEC-day (Theo); vote-day / hearing-day (Naomi); pre-event / in-play / festival (Diego); resolution-window / election-night / data-release (Aria); expiry / pre-event (Sasha); session-rotation (Mira); committee-prep / allocation / incident / client (David).

6. **Regulatory-and-compliance surfaces concentrated in Naomi and David.** Information-barrier automation, restricted-list integration, MNPI handling, jurisdictional-decision databases — Naomi's and David's surfaces dominate this dimension. Other archetypes inherit through David's firm-level layer.

7. **Per-domain research workspaces concentrated in Aria.** Politics / economics / geopolitics / tech / weather workspaces are unique to Aria's appendix; no other archetype has this many distinct research domains in one role.

8. **On-chain / DeFi surfaces concentrated in Julius.** Aria has lighter on-chain surfaces (Polymarket-specific); Marcus and Sasha consume on-chain ETF flow data and stablecoin flow data; but Julius's on-chain wallet management, cross-domain composition, multi-stage kill, synchronized replay are the most extensive on-chain surfaces on the floor.

These patterns inform platform design — the universal platform builds the _frame_; the archetype-specific surfaces fill the frame with domain content.

---

## Status

This tracker is companion to [automation-common-tools.md](automation-common-tools.md) (shared surfaces) and the per-archetype `# Automated Mode` appendix in each `trader-archetype-*.md`. Updated as archetype appendices are deepened.
