Unified Trading System UI — Comprehensive Audit Report

Audit date: 2026-03-23 · Environment: localhost:3100 (DEV, Mock Mode, Turbopack)
Personas tested: Admin (admin), Internal Trader (internal), Client Full (Alpha Capital), Client Basic (Beta Fund)

0. Critical Pre-Flight Issues
   🔴 Build Error — Blocks SSR (Severity: CRITICAL)
   File: ./components/platform/guided-tour.tsx line 66:7
   Error: Expected ',', got 'ident' — react-joyride TypeScript types have diverged from the installed runtime version. The steps prop fails Turbopack's type-aware parse, which cascades through unified-shell.tsx → app/(platform)/layout.tsx and causes a 500 on every SSR request. Client-side navigation from the initially-loaded page works, but any hard refresh or direct navigation to a (platform) route returns a raw 500 JSON. This will fail automated browser tests and first-load checks for institutional demos.
   Fix: Pin react-joyride types to match the installed runtime, or add // @ts-ignore on the steps prop and ensure Turbopack's strict mode is configured correctly. This is not a cosmetic issue — it blocks server rendering of the entire shell.
   ⚠️ Handbook Route Mismatch
   The handbook specifies /service/... (singular) but all working routes are /services/... (plural). The handbook should be updated. The old /service/... paths return 404.

1. URL Sweep — Route Coverage
   Handbook PathActual Working PathStatus/dashboard/dashboard ✅PASS/service/overview404FAIL — handbook wrong prefix/strategies404FAIL — not implemented/strategies/grid404FAIL — not implemented/strategies/[id]Not foundFAIL — no strategy detail page/service/data/overview/services/data/overview ✅PASS/service/data/venues/services/data/venues ✅PASS/service/data/marketsRedirects to /services/trading/pnlPARTIAL/service/trading/overview/services/trading/overview ✅PASS/service/trading/positions/services/trading/positions ✅PASS/service/trading/risk/services/trading/risk ✅PASS/service/trading/orders/services/trading/orders ✅PASS/service/execution/overview/services/execution/overview ✅PASS/service/execution/tca/services/execution/tca (empty state)PARTIAL/service/research/overview/services/research/overview — 500 SSR errorFAIL (build error)/service/research/strategy/.../services/research/strategy/candidates ✅ (empty)PARTIAL/service/research/ml/.../services/research/ml ✅ (but 0 data shown)PARTIAL/service/reports/overview/services/reports/overview ✅PASS/service/reports/reconciliation/services/reports/reconciliation ✅PASS/service/observe/.../services/observe/risk, /alerts, /health ✅PASS/services/observe (root)404FAIL — needs index redirect/admin/admin ✅PASS/devops/admin (DevOps tab visible)PASS
   Summary: 14 PASS, 4 PARTIAL, 6 FAIL on routing alone.

2. Persona / Entitlement Audit
   PersonaNav VisibleService AccessVerdictAdminFull nav: Acquire, Build, Promote, Run, Execute, Observe, Manage, Report9/9 services, Admin panel visible✅ PASSInternal TraderSame as Admin minus admin badge differences9/9 services, "Platform + wildcard" label✅ PASSClient (Full) — Alpha CapitalData locked (lock icon + "Upgrade"), Trading locked, Execution locked, Observe locked4/8 services. Research & Backtesting, Promote, Manage, Reports accessible⚠️ PARTIAL — "Data" should arguably be accessible to a "Full" client; the locks suggest entitlements aren't differentiated between Full and BasicClient (Basic) — Beta FundData unlocked (only), all others locked1/8 services✅ Correct narrowingClient (Premium) — Vertex PartnersNot verified in depth (persona visible but not separately audited)Presumably between Full and BasicNot audited
   Issue: Client (Full) and Client (Basic) show nearly identical dashboards with the same locks. If "Full" means full access to trading data + reports, the entitlement differentiation between Full and Premium should be more visible. The "4 of 8 services" for Full vs "1 of 8" for Basic is a meaningful split, but the locked Data module for a "Full" client seems wrong from a product intent standpoint.

3. Global Rules Compliance (G1–G8)
   RuleObservationVerdictG1 — Strategies don't consume raw ticksCoverage Matrix shows "Ticks (raw)", "Trades (raw)", "Book (raw)" as data layer columns — these are data pipeline fields, not strategy inputs. Strategy positions and PnL pages reference feature-derived concepts. No strategy screen shows "websocket orderbook" as a strategy input.✅ PASSG2 — Event-driven, not timer-firstNo mention of timer-based triggering in strategy or trading UI. The ML pipeline shows a Select→Features→Train→Validate→Deploy→Monitor flow consistent with feature-driven architecture.✅ PASSG3 — Strategy emits instructions; risk/PnL from monitorsTrading overview shows "Pause All / Reduce / Flatten" as instruction-layer controls. Risk page is separate (/services/observe/risk) with its own VaR/greeks/margin panel. Positions are in the Trading section; PnL attribution is separate.✅ PASSG4 — Execution-service chooses routing; strategy sets constraintsExecution overview shows algo types (TWAP, VWAP, IS, Sniper, Iceberg) as a separate service. Venue routing is shown in TCA/execution analytics. Strategy names don't mention algo type in position view.✅ PASSG5 — (strategy_id, client_id, config) unitTrading overview shows "50 strategies" with filters for Org / Client / Strategy. Position table has strategy names alongside instrument and venue — multiple instances visible (e.g. multiple Aave Lending rows).✅ PASSG6 — Live/Batch share logical modelTrading overview has a Live/Batch toggle on cumulative PnL chart ("Live $115k / Batch $-9k / Delta $+124k"). SIMULATED/LIVE toggle is top-right. PnL breakdown has Live/Batch cross-section tab.✅ PASSG7 — Balance-based PnL is source of truthPnL Waterfall shows Net: +$933k with Realized 81.4% + Unrealized 18.6% = Total $1.04M. The "By Client" panel is empty (no clients match current filters), so cross-page consistency can't be fully verified. Reconciliation page exists and shows PnL vs venue breaks.⚠️ PARTIAL — "By Client" empty state prevents verifying cross-page total consistencyG8 — Index-based yield, APY is displayAave Lending (USDT) and USDC Aave Lending appear as position rows. Venue Health shows lending_rates, positions, health_factor as Aave V3 data types (correct — these are index-level fields). No fake "APY compounding in PnL" language found.✅ PASS

4. Cross-Cutting Themes
   ThemeWhat was foundVerdictPnL AttributionFull factor waterfall on /services/trading/pnl: Funding +39.6%, Carry +34.1%, Basis +18.1%, Delta +5.9%, Gamma/Vega/Theta, Slippage, Fees, Rebates, Residual → NET $933k. Cross-Section / Time Series / Group By (Total/Client/Strategy/Venue/Asset) tabs. Attribution buckets map well to multi-strategy mix.✅ PASSCost ModelSlippage (-5.9%, -$61k) and Fees (-4.2%, -$44k) and Rebates (+1.7%, +$18k) are explicit P&L waterfall rows. Execution page shows "Avg Slippage (bps): 1.20", "Fill Rate: 98.5%", per-algo slippage in algo table. Orders show Edge (bps) and Instant P&L per fill.✅ PASSML PipelineResearch hub shows 6-step ML workflow (Select→Features→Train→Validate→Deploy→Monitor). ML dashboard shows Model Families: "BTC, ETH, Momentum, Funding, NFL, Polymarket", 12 active experiments, 4 deployed models. However, the ML page shows 0 model families / 0 training active (the counts are empty in the ML platform page despite the hub showing 6 families).⚠️ PARTIAL — ML platform page has empty state despite hub showing populated countsLatencySystem Health shows services with freshness SLAs: instruments-service 5s/30s OK, market-tick-data-service 2s/10s OK, features-service 12s/30s OK, strategy-service 8s/30s OK, execution-service 1s/5s OK, risk-monitoring-service 25s/30s OK. Execution page shows 32ms avg latency, per-algo latency (12ms–120ms).✅ PASSMargin & HealthRisk page shows Margin Used 47%, Net Exposure $5.2M. DeFi LTV (Aave V3) 0.72/0.85 (85% utilization) in Risk Heatmap. Venue Health shows health_factor as Aave data type. Position page shows Margin $13.5M total.✅ PASSOperational ModesDEV badge + "slim" mode indicator top-left. "Mock Mode" badge bottom-left. SIMULATED/LIVE toggle top-right on trading/risk pages. "API Reachable" green indicator. PREVIEW banner. Algo table shows "testing" vs "live" status per algo.✅ PASSShardingTrading overview has asset class filter tabs: All / CeFi / DeFi / Prediction / Sports / TradFi. Venue Health has category filter: All / CeFi / DeFi / TradFi / Sports / Prediction. Coverage Matrix has filter: Raw (Ticks/Trades/Book), Processed (Candles), Derived (Features/Signals/Risk/P&L).✅ PASS

5. DeFi Strategy Audit
   6.1 Basis Trade (delta-neutral funding) — PARTIAL

Discover: "ETH Basis Trade" appears as position label on BTC-PERP (instrument mismatch — a BTC-PERP position labelled as ETH Basis Trade), and "BTC Basis (Binance-HL)" is a distinct row on AVAX-USDT. "WBTC Basis Trade" is also present. Strategy names are visible but tied to wrong instruments in mock data.
Shard: CeFi assignment (positions visible under CeFi tab) — correct.
Inputs: No explicit "funding rate" or "basis spread" feature language in position view. PnL Waterfall shows Funding +39.6% and Basis +18.1% as separate attribution buckets — excellent.
Execution: Binance and Hyperliquid named as venues in positions. DEX not explicitly mentioned per-strategy.
Risk: Delta (net 12.50) and basis risk visible on risk page, though not per-strategy for basis specifically.
Attribution: Funding/basis split in PnL waterfall — PASS for cross-strategy; no per-strategy drill-down visible due to "By Client" empty state.
Verdict: PARTIAL — good PnL attribution, but instrument/label cross-contamination in mock data and no dedicated strategy detail page.

6.2 Staked Basis (LST + short perp) — PARTIAL

Discover: "stETH Staked Basis" (LINK-USDT position), "ETH Recursive Staked Basis" (ETH-PERP), "ETH Recursive Staked (Acme)" (DOT-USDT). LST names present.
Shard: Visible in DeFi tab (PnL breakdown shows DeFi $12k).
Inputs: No explicit "LST rate" or "staking APY" feature label in the UI. "Carry" (+34.1%) in PnL waterfall covers this conceptually.
Execution: No weETH/stETH DEX routing explicitly shown. Venue columns show CeFi venues (Deribit, Hyperliquid) for these positions.
Risk: No depeg risk indicator or LST-specific health factor shown.
Verdict: PARTIAL — staked basis strategy names present, funding+carry PnL split exists, but no LST-specific risk display or two-yield breakdown per strategy.

6.3 AAVE Lending (pure supply yield) — PASS

Discover: "AAVE Lending (USDT)", "USDC Aave Lending", "DAI Aave Lending" — all present as position rows.
Shard: DeFi in trading overview ($12k DeFi PnL). Aave V3 venue shows lending_rates, positions, health_factor in Venue Health.
Inputs: Venue health references lending_rates and positions (index-level concepts). No fake APY language found.
Execution: Aave V3 listed in Venue Health as DeFi/connected. No SOR route shown for this leg (correct — Aave is direct protocol).
Risk: health_factor in venue data types. DeFi LTV 0.72/0.85 in risk heatmap.
Attribution: "Carry" in PnL waterfall covers lending yield.
Verdict: PASS — credible representation of Aave lending; aToken/index growth language not explicit but no fake APY found.

6.4 Recursive Staked Basis (flash loan + Aave + perp) — PARTIAL

Discover: "ETH Recursive Staked Basis" and "ETH Recursive Staked (Acme)" visible as positions. "Recursive" naming present.
Shard: DeFi.
Inputs: No flash loan availability or collateral/debt balance display per-strategy. Health factor is shown at the firm level (DeFi LTV 0.72/0.85) but not per recursive strategy.
Risk: The risk heatmap shows "DeFi LTV (Aave V3) 0.72/0.85 (85%)" as the highest-priority DeFi risk metric — this is appropriate but it's a firm-level aggregate, not per-strategy drill-down. No liquidation warning thresholds visible per position.
Verdict: PARTIAL — recursive naming present, health factor aggregated at firm level, but no per-strategy collateral/debt/liquidation proximity display.

6.5 AMM Liquidity Provision — PARTIAL

Discover: "Uniswap V3 LP (ETH-USDT)" appears as a position (SOL-USDT instrument — instrument mismatch in mock data). Venue Health shows Uniswap V3 with swaps, liquidity, pool_ticks data types — correct AMM concepts.
Shard: DeFi.
Inputs: Pool tick, fee APR, IL estimate not shown in any UI panel. "Fees" in PnL waterfall ($-44k) doesn't distinguish fee income vs fee cost.
Risk: No IL indicator or range-out warning.
Verdict: PARTIAL — venue-level AMM data types present (pool_ticks, liquidity), but no LP-specific position detail (range, tick, IL estimate).

6. CeFi Strategy Audit
   7.1 Momentum — PASS

Discover: "ETH Momentum", "SOL Momentum", "AVAX Momentum", "SUI Momentum" — all present as position rows.
Shard: CeFi shard (trading overview CeFi group $20k). Multi-asset cross-sectional set.
Inputs: "ML Signals (derived)" column in Coverage Matrix. Research hub mentions "Momentum" model family.
Risk: Net Delta 12.50 on risk page; directional exposure captured in Delta attribution ($61k).
Attribution: Delta +5.9% in PnL waterfall is the directional PnL bucket.
Verdict: PASS — momentum strategies credibly represented across multiple CeFi instruments.

7.2 Mean Reversion — PASS

Discover: "ETH Mean Reversion" (SHORT), "Bond Mean Reversion" — present.
Shard: CeFi (ETH) and TradFi (Bond) — appropriate cross-shard placement.
Execution: Short positions on Deribit and Bybit.
Risk: Short positions with negative P&L are shown correctly (risk of wrong-direction regime).
Verdict: PASS — mean reversion naming and SHORT positioning in mock data consistent with strategy archetype.

7.3 CeFi Market Making (CLOB) — PARTIAL

Discover: "BTC Market Making (Binance)", "DOGE Market Making", "XRP Market Making" — present as positions.
Shard: CeFi (Binance, Bybit).
Inputs: No inventory skew, bid-ask spread, or order book imbalance language in position or risk views.
Risk: Orders page shows only 3 orders total — insufficient for a market making strategy which should show high order counts. No quoting activity displayed.
Attribution: No explicit spread-earned bucket in PnL waterfall (it would fall into "Residual" or fees).
Verdict: PARTIAL — MM strategy names present but the system doesn't surface quoting activity, inventory, or bid-ask spread metrics that would distinguish MM from directional strategies.

7. TradFi Strategy Audit
   8.1 ML Directional (equities/ETFs/futures) — PASS

Discover: "SPY ML Directional", "ES ML Directional", "Crude Oil ML Directional", "Silver ML Directional", "EUR/USD ML Directional", "ML Directional BTC" — all present.
Shard: TradFi (3 strategies, $4k PnL, $7.21M NAV in overview). IB venue connected.
Inputs: Research hub shows ML model families for these. PnL waterfall includes Delta and a separate implicit ML-driven component.
Execution: Interactive Brokers shown in Venue Health as TradFi/connected.
Risk: Max Drawdown (Quant Fund) 3%/10% (32%) in risk heatmap. VaR tiles present (though $NaN rendering issue — see below).
Verdict: PASS — strong TradFi ML directional representation. SPY, ES, Crude Oil, Forex instruments are appropriate.

8.2 Options ML — PASS

Discover: "SPY Options ML" position present. Deribit listed as options venue.
Shard: TradFi.
Inputs: Vol/greeks referenced: Net Vega $85k, Net Theta -$2,400/day, Net Gamma 0.45, Net Rho $1,200 on risk page.
Risk: Greeks panel with per-underlying breakdown (BTC: Delta 8.2, Gamma 0.30, Vega $55k; ETH: separate row). What-If BTC Price Shock slider present.
Verdict: PASS — options ML represented, full Greeks panel on risk page, What-If analysis present.

8.3 Options Market Making — PARTIAL

Discover: "ETH Options MM (Deribit)" and "Gold Options MM" present as positions.
Shard: TradFi.
Risk: Greeks shown at portfolio level but not per-strategy. Deribit connected with ticks/trades/book/candles/funding.
Gap: Multi-strike quoting display not shown. Mass-quote vs per-order behavior not represented. No IV surface chart.
Verdict: PARTIAL — strategy name present, greeks at portfolio level, but no vol surface or multi-strike quoting representation.

8. Sports Strategy Audit
   9.1 Sports Arbitrage — PARTIAL

Discover: "Football Cross-Book Arb" and "EPL Cross-Book Arb" visible in positions. "Multi-Venue Arbitrage" also present (though instrument is AVAX-USDT — cross-asset/mock contamination).
Shard: Sports tab in trading overview ($550 PnL, $538k NAV). Betfair listed in Venue Health as Sports/connected with odds, markets, settlements.
Inputs: No normalized odds or implied probability display per strategy.
Risk: No suspension/halt indicators visible. No settlement timing shown.
Verdict: PARTIAL — sports arb naming present, correct venues in health, but no per-event odds display or settlement state.

9.2 Value Betting — PARTIAL

Discover: "NFL Value Betting" present as a position (BNB-USDT instrument — instrument mismatch, should be a sports market).
Shard: Sports.
Inputs: No "model probability vs implied probability" columns or CLV metric displayed.
Verdict: PARTIAL — naming present, correct sports shard, but no edge/CLV display.

9.3 Sports ML (generic) — PARTIAL

Discover: "La Liga ML Sports" present.
Shard: Sports.
Inputs: Research hub shows "NFL, Polymarket" as model families — NFL covers sports ML. No per-sport feature display.
Verdict: PARTIAL — naming present, ML linkage implied via model family, but no bet history or odds-vs-model column.

9.4 Halftime ML — PARTIAL

Discover: "NBA Halftime ML" visible as a position (ETH-PERP instrument — serious instrument mismatch, should be a Betfair/exchange market).
Shard: Nominally in Sports but the position shows as ETH-PERP on OKX — clearly mock data contamination.
Inputs: No two-phase (pre-game/halftime) badge or timeline indicator.
Verdict: PARTIAL — naming present but instrument assignment is wrong (ETH-PERP for a sports bet), and no phase-split display.

9.5 Sports Market Making — FAIL

Discover: No sports market making strategy row found in any position or strategy list.
No Back/Lay quoting language anywhere in the UI.
Verdict: FAIL — not represented.

9. Prediction Markets & Cross-Venue Arb (§10) — PARTIAL

Discover: "Prediction Market Arb" and "Prediction ML Directional" visible in positions.
Venue: Polymarket listed in Venue Health as Prediction/disconnected (0 uptime, 100% error rate, 3h since reconnect) — correctly categorized but the venue is non-operational in mock.
Shard: "Prediction" tab in trading overview and venue filter.
Inputs: Research hub shows "Polymarket" as a model family. No YES/NO binary payoff display.
Cross-arb: "Prediction Market Arb" naming is present but no Kalshi counterpart shown.
Verdict: PARTIAL — naming, venue categorization, and ML model family present; Polymarket disconnected is a gap; no binary payoff UI or cross-platform arb details.

10. Kelly Criterion (§11) — FAIL

No Kelly or stake-sizing language found in any position, strategy, or risk panel. Sports positions show $ values but no fractional Kelly or bankroll % display.
Verdict: FAIL — not surfaced in mock UI.

11. Data Service Audit
    The data service is one of the strongest areas:

Coverage Matrix (19 instruments × 14 data types): Shows Raw (Ticks/Trades/Book/Funding), Processed (Candles 1m/5m/1h/1d), Derived (Features/ML Signals/Strategy/Execution/Risk/P&L) columns — this architecture correctly represents the pipeline layers per G1.
Venue Health: 10 venues across all 5 shards (CeFi: Binance, OKX, Hyperliquid, Deribit, Bybit; DeFi: Aave V3, Uniswap V3; Sports: Betfair; Prediction: Polymarket; TradFi: Interactive Brokers). P50/P99 latency, uptime, rate limits, WS connections, error rates, reconnect times — institutional-grade monitoring display.
Pipeline Status: 8 named services (instruments, market-tick-data, features, strategy, execution, risk-monitoring, alerting, position-monitor) — but all show as red/unhealthy with blank % values. This is a mock data rendering gap.
Missing Data / ETL Logs tabs present — correct operational concept.

12. Risk Dashboard Audit
    Strong areas:

Firm P&L, Net Exposure, Margin Used, VaR 95%/99%, ES 95%/99%, Active Alerts all on one page.
Strategy Risk Heatmap by limit utilization (Concentration, DeFi LTV, Leverage, Max Position, Max Drawdown) — well-organized for CRO morning briefing.
Portfolio Greeks: Net Delta, Gamma, Vega, Theta, Rho with per-underlying breakdown.
Venue Circuit Breaker Status (Binance/OKX/Hyperliquid/Deribit all "armed").
VaR tabs: Historical, Parametric, CVaR, Monte Carlo.

Issues:

VaR values render as $NaN — all four VaR metrics show NaN. This is a critical rendering defect for a "CRO morning briefing" page.
Stress Scenario Analysis shows "Select a scenario" but no pre-populated scenario list is visible (dropdown is empty in mock).
Strategy Correlation Heatmap: "No correlation data available" — completely empty.
The "What-If: BTC Price Shock" slider estimates show +$0 for all positions (delta calculation may not be wired to the mock price).

13. Execution Service Audit
    Good institutional framing:

847 orders today, $125M volume, 1.20 bps avg slippage, 98.5% fill rate, 32ms latency — credible mock numbers.
5 live algos: TWAP, VWAP, IS, Iceberg (live), Sniper (testing) — correct algo taxonomy for a multi-venue execution service.
Venue share breakdown with latency per venue.
TCA Explorer: Empty state ("No orders available") — not populated in mock. This is a gap for institutional demo.
Execution Candidates / Handoff tabs present but unverified.

14. Reports / Reconciliation Audit

Reconciliation page has 12 historical breaks across Binance/Deribit/OKX/Bybit/Hyperliquid with position, PnL, and fee break types, statuses (pending/investigating/resolved), and delta values — well-constructed for an institutional audit trail.
Reports overview shows $0 AUM, $0 MTD, $0 Pending Settlement — mock data is zeroed out. For an institutional demo this is a significant gap.
Tabs present: P&L, Executive, Settlement, Reconciliation, Regulatory — correct taxonomy.
Reconciliation has "Live vs Simulated: 1 significant" difference indicator — maps to G6 (live/batch mode distinction).

15. Observe / System Health Audit

Risk Dashboard at /services/observe/risk duplicates the trading/risk panel (same data) — this is correct separation (Observe is monitoring lens; Trading/Risk is operational lens).
Alerts page: Live alert feed with severity (Medium/High/Critical), entity references (cfg-eth-basis-v2, cfg-stat-arb-v2), Ack/Escalate/Resolve actions. "Batch/Live drift elevated: 12% Sharpe deviation" and "Validation failed: Drawdown exceeds threshold in VOLATILE regime" are credible institutional alert descriptions.
System Health page: Shows 0 services (API not reporting). The data health SLA table on the trading overview does show service freshness, but the dedicated health page is empty.
Strategy Health tab present in Observe nav.
Grafana link button present on health page — correct observability integration pattern.
/services/observe root 404s — there should be an index redirect.

16. Instrument / Shard Cross-Contamination (Mock Data Quality)
    This is a systemic issue throughout the positions table: mock data assigns position instruments (AVAX-USDT, ETH-PERP, BNB-USDT, etc.) to strategy names that clearly belong to different asset classes or instruments. Examples:
    StrategyMock InstrumentExpected InstrumentNBA Halftime MLETH-PERP (OKX)Betfair market / sports exchangeNFL Value BettingBNB-USDT (Deribit)Sports betting marketFootball Cross-Book ArbADA-USDT (OKX)Sports exchange / bookmakerPrediction Market ArbLINK-USDT (Deribit)Polymarket/Kalshi YES/NO contractMorpho LendingSOL-USDT (Hyperliquid)Morpho pool positionETH Basis TradeBTC-PERP (Binance)ETH-PERP or ETH spotUniswap V3 LP (ETH-USDT)SOL-USDT (Hyperliquid)Uniswap V3 LP token
    This contamination means that filters by asset class on the positions page won't correctly segregate Sports vs CeFi vs DeFi positions. For an institutional-grade static mock, each strategy must be assigned semantically correct instruments and venues.

17. General Institutional-Grade UI Assessment
    Strong:

Visual design is polished and dark-theme consistent throughout.
Navigation taxonomy (Acquire/Build/Promote/Run/Execute/Observe/Manage/Report) is coherent and maps to an institutional workflow lifecycle.
DEV/Mock/Simulated/Live environment badges are always visible — no ambiguity about mock state.
P&L attribution waterfall (Funding/Carry/Basis/Delta/Greeks/Slippage/Fees/Residual) is best-in-class for a mock; it would satisfy a CRO or CFO review.
Breadcrumb navigation (Services → Trading → P&L Breakdown) is consistent.
Global filters (All Orgs / All Clients / All Strategies) are persistent across the top bar.
Reconciliation page has correct break taxonomy (position/PnL/fee) with venue attribution.

Needs work for institutional grade:

$NaN on all VaR values on the Risk page — this is embarrassing for a CRO briefing screen.
Strategy detail page is missing (/strategies/[id] 404) — there is no way to inspect a single strategy's config, current state, signals, or execution history.
No standalone strategy list/grid (/strategies and /strategies/grid both 404) — the handbook requires this as the primary strategy discovery surface.
ML platform page shows 0 model families / 0 training runs despite the research hub showing 6 families and 12 experiments. The counts are inconsistent between hub and detail page.
Reports overview has $0 for all financial metrics — AUM, MTD return, pending settlement all zero. For a demo this should have populated mock numbers.
TCA Explorer is empty — no order data populated in the transaction cost analysis view, which is a key institutional selling point.
Correlation heatmap: empty — missing for a risk analytics page intended for CRO.
Sports instruments are wrong in mock data (ETH-PERP for NBA Halftime ML, etc.).
Pipeline Status indicators are all red with blank % values — this undercuts the data health narrative.
System Health page is empty (API not reporting) — the dedicated observability page has no content.
Backtests tab (/services/research/backtests) 404s — the full Build/Backtest loop is broken.
Research Features tab 404s — no feature engineering view despite being listed in the nav.
Guided-tour.tsx build error must be fixed; it currently breaks all SSR and will cause first-load failures in demo environments.
/service/data/markets should have its own URL rather than silently redirecting to PnL.

18. Per-Strategy Checklist Summary
    StrategyDiscoverShardInputsExecutionRiskAttributionConsistencyVerdict6.1 Basis Trade✅✅⚠️✅⚠️✅⚠️PARTIAL6.2 Staked Basis✅✅❌⚠️❌⚠️⚠️PARTIAL6.3 Aave Lending✅✅✅✅✅✅✅PASS6.4 Recursive Basis✅✅❌⚠️⚠️✅⚠️PARTIAL6.5 AMM LP✅✅❌⚠️❌⚠️❌PARTIAL7.1 Momentum✅✅✅✅✅✅✅PASS7.2 Mean Reversion✅✅⚠️✅⚠️✅✅PASS7.3 CeFi MM✅✅❌✅❌❌⚠️PARTIAL8.1 TradFi ML Directional✅✅✅✅✅✅✅PASS8.2 Options ML✅✅✅✅✅✅✅PASS8.3 Options MM✅✅⚠️✅⚠️⚠️⚠️PARTIAL9.1 Sports Arb✅✅❌✅❌⚠️❌PARTIAL9.2 Value Betting✅✅❌⚠️❌❌❌PARTIAL9.3 Sports ML✅✅⚠️⚠️❌❌❌PARTIAL9.4 Halftime ML✅❌❌❌❌❌❌PARTIAL9.5 Sports MM❌——————FAIL§10 Prediction Arb✅✅⚠️⚠️❌❌❌PARTIAL§11 Kelly Criterion❌——————FAIL
    PASS: 5 | PARTIAL: 11 | FAIL: 2

19. Priority Fix List
    P0 (Blockers for any demo):

Fix guided-tour.tsx TypeScript error — it breaks all SSR.
Fix $NaN VaR values on the Risk page.
Correct sports/DeFi strategy-to-instrument assignments in mock data.
Populate Reports overview with non-zero mock AUM/MTD/settlement data.

P1 (Required for institutional-grade mock): 5. Implement /strategies and /strategies/[id] strategy list and detail pages. 6. Populate TCA Explorer with mock order data. 7. Populate ML platform page with the same model families shown in the Research hub (de-sync between hub and detail). 8. Fix Pipeline Status rendering (all services show red with blank %). 9. Add per-strategy health-factor / liquidation-proximity drill-down for recursive DeFi strategies. 10. Surface Kelly/stake sizing language in sports strategy detail.
P2 (Polish for institutional demo): 11. Add Sports MM strategy (back/lay quoting) — currently completely absent. 12. Implement /services/research/backtests, /services/research/features, and /services/research/signals routes. 13. Populate Stress Scenario dropdown with historical scenarios. 14. Add correlation heatmap data. 15. Fix /services/observe root redirect. 16. Differentiate Client (Full) vs Client (Premium) entitlement visibility more clearly. 17. Update handbook.

20. Supplementary Audit — Codex Extended Reference (2026-03-23)

This section covers findings from the extended Codex strategy catalog that go beyond the base handbook. Items already fixed during Phase 1-2 of the hardening plan are marked FIXED.

20.A Instrument ID Pattern — FIXED (Phase 2)
Mock data now uses domain-correct instrument IDs (e.g. NBA:GAME:LAL-GSW, AAVE_V3:SUPPLY:USDT, POLYMARKET:BINARY:BTC-100K@YES) instead of generic crypto tickers. However, the VENUE:TYPE:ASSET compound key pattern from the Codex (e.g. HYPERLIQUID:PERPETUAL:ETH-USD) is not yet fully adopted — positions show instrument + venue as separate columns rather than a single compound key. A "canonical ID" secondary column or tooltip would complete this.

20.B Feature Source Attribution — FAIL
No screen attributes features to their logical pipeline source (features-delta-one vs features-onchain vs features-volatility). The Coverage Matrix shows coverage percentages but not feature lineage. The Research Features tab (currently 404) should become the primary home for feature lineage: pipeline source, last-published timestamp vs SLA, subscribed strategies, and current value.

20.C Per-Strategy PnL Bucket Precision — PARTIALLY FIXED (Phase 2)
taxonomy.ts PNL_FACTORS now includes 21 factors (up from 11): added staking_yield, borrow_cost, impermanent_loss, interest_accrual, arb_pnl, spread_earned, liquidation_penalty, rewards, gas, commission. The P&L waterfall component needs to render these per-strategy when present. Remaining gaps:

- lst_depeg_pnl not yet a separate factor (folded into basis)
- pre_game_pnl / halftime_pnl phase split not represented
- Spread/inventory PnL for MM strategies not yet wired to the waterfall

  20.D Exposure Subscription Taxonomy — CRITICAL
  The Exposure tab shows "0 of 23 Risk Types" across five taxonomy groups (First Order, Second Order, Structural, Operational, Domain-Specific) — all empty. This is the single largest gap. Mock data must populate risk type entries for: aave_liquidation, delta, funding, borrow_cost, bankroll_dd, model_confidence_decay, adverse_selection, inventory_half_life, flash_liquidity, venue_protocol, regime, lst_depeg, suspension, and more.

  20.E Margin/Liquidation — PARTIAL

- HF time series chart renders empty (no plotted data points)
- Distance to Liquidation table has no rows
- LTV (0.72) conflated with Health Factor (should be ~1.39 for 0.72 LTV)
- Emergency exit threshold (HF 1.2) missing from chart
- IBKR SPAN margin correctly shown for TradFi

  20.F Latency Story — PARTIAL
  System Health SLA table conflates batch pipeline freshness (12s/30s) with strategy-level execution latency (~5ms for MM). No per-strategy latency tier badge. Missing: co-location indicator, strategy-class latency SLA target.

  20.G Execution Orchestration — FAIL

- No atomic flash bundle execution type in algo list
- DEX venues absent from Execution Venue Matrix (only in Data Venue Health)
- No mass-quote / LP instruction types in Orders tab (only 3 generic orders shown)
- No quotes vs orders distinction for MM strategies

  20.H CeFi MM SLA Class — HIGH
  Features-service shows 12s/30s freshness but CeFi MM requires ~5ms feature-to-strategy. The System Health page creates an incorrect impression of platform timing characteristics. Need latency-class segmentation.

  20.I Prediction Market Gaps — MEDIUM

- Kalshi entirely absent from venue registry, positions, model families
- No FEATURE/TRADABLE/ARB_SURFACE domain classification
- No binary YES/NO payoff display

  20.J Sports Risk Dimensions — HIGH
  No sports-specific risk types surfaced: suspension, bankroll_dd, line_move, void_rules, stake_limits, concurrent_bets, adverse_selection (for MM). Betfair suspension data type exists in Venue Health but not connected to strategy risk indicators.

  20.K Research Signals Route — FAIL
  /services/research/signals returns 404 despite being nav-linked. Should show signal definition, monitoring, and signal-to-strategy linkage.

  20.L Updated Extended Checklist
  After Phase 2 fixes (instrument IDs corrected, archetypes unified, PnL factors expanded):
  PASS: 0 | PARTIAL: 6 (6.1, 6.3, 7.1, 7.2, 8.1, 8.2) | FAIL: 12 (6.2, 6.4, 6.5, 7.3, 8.3, 9.1-9.5, §10, §11)

  20.M Three Architecturally Correct Surprises

1. Term Structure tab with "DeFi/CeFi perpetuals classified as Overnight (8h funding settlement)" — correct conceptual framing
2. Limits hierarchy (Company→Client→Account→Instrument→Strategy) with 6 levels — institutional-grade
3. Execution Handoff with canary deployment (10% traffic for 24h) and deployment checklist — Build→Promote→Deploy lifecycle correctly represented
