# Phase 2d: Run Tab — Trader Workflow Alignment Assessment

**Audit date:** 2026-03-21
**Perspective:** Day-to-day trader workflow — is the Run tab set up to help a trader monitor live strategies, trades, positions, executions, P&L, drawdowns, and backtest-vs-live comparison across all clients and strategies?

**Note on mock data:** All pages currently use flat mock data identical in shape to what the real backend will return. Mock data quality is assessed only for structural completeness (right fields, right relationships), not data accuracy.

---

## Trader's Daily Workflow vs Current UI

### What a trader needs to do every day

1. **Morning check** — Open Command Center, review overnight P&L, check for alerts/breaches, verify all strategies are live and healthy
2. **Monitor live** — Watch positions, P&L ticking in real-time, react to alerts
3. **Compare backtest vs live** — Select a timeframe, overlay simulated (backtest) results against actual live results to detect alpha decay, slippage drift, execution quality degradation
4. **Manage orders** — View open orders, modify/cancel, see fill quality
5. **Drill into execution** — Check venue fill rates, algo performance, TCA to understand where slippage is coming from
6. **End-of-day** — Review P&L attribution breakdown, check that all positions reconcile, verify funding/fees

---

## Page-by-Page Alignment

### Dashboard / Command Center (`/dashboard`) — STRONG ALIGNMENT

| Trader Need | Component Present? | Assessment |
| ----------- | ------------------ | ---------- |
| P&L at a glance | ✓ `KPICard` — P&L (Today), Net Exposure, Margin Used, Live Strategies, Alerts | **Good.** Five KPIs cover the morning check essentials |
| Strategy health overview | ✓ Strategy Performance table with P&L, Sharpe, exposure, status | **Good.** Top 8 strategies with drill-through links |
| Alerts/breaches | ✓ `AlertsFeed` — severity-coded, source-tagged, filterable by context | **Good.** Shows critical/high/medium/low with timestamps |
| P&L attribution | ✓ `PnLAttributionPanel` — waterfall: funding, carry, basis, delta, greeks, slippage, fees, residual | **Good.** Exactly what a trader needs for factor-level P&L decomposition |
| Service health | ✓ `HealthStatusGrid` — freshness vs SLA for each service/connector | **Good.** Trader can immediately see if a venue connector is lagging |
| Margin utilization | ✓ `MarginUtilization` — per-venue margin bars with utilization %, trend, and margin call distance | **Good.** Critical for risk awareness |
| Emergency controls | ✓ `InterventionControls` — kill switch, circuit breaker | **Good.** Trader can halt strategies from the dashboard |
| **Live vs Backtest comparison** | ✓ `LiveBatchComparison` — P&L, NAV, Exposure with live/batch/split/delta views | **Excellent.** This is the core backtest-vs-live feature. Supports date picker for batch reference, split-screen overlay, and delta view showing the drift between simulated and actual |
| Drift analysis | ✓ `DriftAnalysisPanel` — P&L drift, exposure drift, NAV drift with thresholds and unreconciled items | **Excellent.** Directly addresses the alpha decay / slippage stress-test use case |
| Scope filtering | ✓ `useGlobalScope` — org/client/strategy filters cascade through all data | **Good.** Trader can zoom into a specific client or strategy and all KPIs/charts/tables update |
| Kill switch + circuit breakers | ✓ `KillSwitchPanel`, `CircuitBreakerGrid` | **Good.** Emergency action capability |
| Strategy audit trail | ✓ `StrategyAuditTrail` | **Good.** Shows recent strategy actions for accountability |

**Assessment: The Dashboard is the strongest page in the Run tab. It directly serves the trader's morning check, continuous monitoring, and backtest-vs-live comparison workflows. The `LiveBatchComparison` component with its 4 view modes (live, batch, split, delta) is exactly what's needed for the alpha decay analysis use case.**

**Gaps:**
- No drawdown chart (max drawdown, current drawdown, drawdown duration) — this is a critical trader metric
- No Sharpe/Sortino/Calmar KPI card (only Sharpe in the strategy table, not as a dashboard-level metric)
- No direct link from a strategy row to its positions on the Positions page
- `DriftAnalysisPanel` shows unreconciled items but there's no way to action them (acknowledge, investigate)

---

### Terminal (`/service/trading/overview`) — GOOD ALIGNMENT

| Trader Need | Component Present? | Assessment |
| ----------- | ------------------ | ---------- |
| Price chart | ✓ `CandlestickChart` with 1m/5m/15m/1H/4H/1D timeframes, candle/line/depth views | **Good.** Three chart types with multiple timeframes |
| Order book | ✓ `OrderBook` + `DepthChart` — live-updating bids/asks with spread display | **Good.** Updates every 500ms, shows spread in bps |
| Order entry | ✓ Limit/Market order form with buy/sell, size, price, % shortcuts | **Good.** Clean order entry with account/strategy linking |
| Live price | ✓ Animated price ticker with 24h change % | **Good.** Prominent display with color-coded direction |
| Strategy-to-instrument mapping | ✓ Selecting a strategy auto-selects its instrument | **Good.** Reduces cognitive load |
| Account context | ✓ Account selector with margin type badge, venue account ID | **Good.** Trader must select org + client + account to trade |
| Own trades | ✓ Market trades feed + Own trades tab with fill status | **Good.** Trader can see their fills alongside market flow |
| Live/Batch mode indicator | ✓ Badge shows Live (pulsing) or Batch mode | **Good.** Trader always knows which data mode they're in |

**Assessment: The Terminal is a solid trading interface. The layout (order book | chart | order entry) follows standard terminal conventions. The strategy-instrument mapping and context requirements (org/client/account) enforce proper scoping.**

**Gaps:**
- No open orders panel — trader places an order but can't see pending/open orders on this page (must go to Orders tab, which is a placeholder)
- No position summary sidebar — trader can't see their current position in this instrument while deciding to add/reduce
- No P&L display for the selected instrument/strategy — would help the trader see their running P&L while trading
- No backtest-vs-live overlay on the chart — the `LiveBatchComparison` on Dashboard is great, but having a simulated price line overlaid on the Terminal chart would be powerful for the stress-test use case

---

### Positions (`/service/trading/positions`) — STRONG ALIGNMENT

| Trader Need | Component Present? | Assessment |
| ----------- | ------------------ | ---------- |
| Position list | ✓ Table with strategy, underlying, venue, side, size, notional, P&L, margin | **Comprehensive.** All fields a trader needs |
| Unrealized + Realized P&L | ✓ Both columns with color coding and % change | **Good.** Split view is correct for P&L tracking |
| Filtering | ✓ Search, strategy, venue, asset, side filters | **Comprehensive.** Five filter dimensions |
| Position detail drill-down | ✓ Expandable rows with type-specific details (LP: tick range, IL; Lending: health factor, APY; Perp: liquidation price, funding) | **Excellent.** Position types (LP, LENDING, PERP, STAKING, SPOT) each get their own detail card |
| Account balances | ✓ Collapsible account balances table (venue, free, locked, utilization) | **Good.** Gives trader instant view of available margin |
| Summary KPIs | ✓ 7 KPI cards: positions count, notional, unrealized P&L, realized P&L, margin, long exposure, short exposure | **Good.** Quick health check at a glance |
| Execution mode toggle | ✓ `ExecutionModeToggle` — live vs paper mode indicator | **Good.** Trader knows if positions are real or simulated |
| Risk indicators | ✓ Distance to liquidation, health factor, LTV for relevant position types | **Good.** Critical for DeFi positions especially |
| Strategy drill-through | ✓ Strategy name links to `/strategies/{id}` | **Good.** Trader can navigate to strategy details |

**Assessment: The Positions page is the most complete and well-aligned page in the Run tab. The position-type-specific detail cards (LP with tick range/IL, lending with health factor, perps with liquidation price) show deep domain understanding. The expandable row pattern keeps the table scannable while providing depth on demand.**

**Gaps:**
- No live updating — positions render statically. For a trader monitoring live, positions should tick with current prices
- No "close position" or "reduce position" action button — trader must go to Terminal to act
- No P&L time series per position — trader might want to see how a position's P&L evolved today
- No sorting — table is not sortable by P&L, notional, etc. This is important for prioritizing which positions to monitor
- No "View Batch" mode — the execution mode toggle switches live/paper, but there's no way to view yesterday's batch positions alongside today's live positions (the backtest-vs-live use case at position level)

---

### Orders (`/service/trading/orders`) — NOT ALIGNED (Placeholder)

**Status:** "Coming Soon" placeholder — 25 lines, no functionality.

**Impact on trader workflow:** This is a critical gap. The trader workflow goes Terminal → place order → track in Orders → see fill in Positions. Without Orders, step 2 is missing. The trader cannot:
- See open/pending orders
- Cancel or modify orders
- Track fill quality (partial fills, slippage)
- Review order history

**Assessment: This is the single biggest workflow gap in the Run tab.** The order lifecycle is fundamental to trading. React Query hooks already exist (`useOrders()` in `hooks/api/use-orders.ts`) and the mock data shape is ready.

**What this page needs:**
1. Open orders blotter (status, fill %, time-in-force, venue)
2. Filled orders history (fill price vs limit price, slippage, fees)
3. Cancel/modify actions (button per order)
4. Algo order progress (for algo-routed orders, show child fills)
5. Live updates (polling or WebSocket for order state changes)

---

### Accounts (`/service/trading/accounts`) — NOT ALIGNED (Placeholder)

**Status:** "Coming Soon" placeholder — 25 lines, no functionality.

**Impact on trader workflow:** The Positions page has a collapsible "Account Balances" section that partially covers this need. However, the dedicated Accounts tab should provide:
- Per-venue account details (API key health, connectivity status)
- Deposit/withdrawal history
- Margin call history
- Account-to-strategy assignment matrix (which accounts fund which strategies)

**Assessment: Medium gap.** The Positions page already shows venue balances. The Accounts tab adds value for account management (API keys, transfers) but is not on the critical trading path.

---

### Markets / P&L (`/service/trading/markets`) — MISALIGNED

**Current content:** This is a 2,111-line P&L Attribution page with structural P&L decomposition, factor analysis, client P&L breakdown, live book updates, and order flow data. Despite the "Markets" label, it contains zero market data content (no instrument prices, no market overview, no sector heatmap).

**Assessment for trader workflow:**
- The P&L attribution content is **excellent and highly relevant** to the Run lifecycle — a trader absolutely needs factor-level P&L breakdown with the live-vs-batch comparison capability
- But it's **mislabeled as "Markets"** — a trader clicking "Markets" expects instrument prices, market overview, sector performance, not P&L attribution
- The same content is **duplicated at `/service/data/markets`** (Acquire lifecycle), where it makes even less sense

**Recommendation:** This page should be renamed to "P&L" or "Analytics" in TRADING_TABS, and the actual "Markets" concept should either be removed from the tab set (the Terminal already has market data) or replaced with a market overview page showing cross-instrument prices, sector heatmaps, and market microstructure metrics.

**What's actually good in this page for a trader:**
- Structural P&L waterfall (realized vs unrealized breakdown)
- Factor P&L stacked chart (funding, carry, basis, delta, gamma, vega, theta, slippage, fees)
- Client P&L breakdown (which clients are making/losing money)
- Live vs Batch toggle on the P&L time series
- Order flow and live book updates

---

### Execution Analytics (`/service/execution/overview`) — GOOD ALIGNMENT

| Trader Need | Component Present? | Assessment |
| ----------- | ------------------ | ---------- |
| Venue health | ✓ Venue connectivity status, fill rates | **Good.** Trader can see which venues are performing |
| Recent orders | ✓ Order table with status, venue, fill quality | **Good.** Recent execution activity |
| Execution metrics | ✓ Aggregate metrics (orders, fills, rejection rate) | **Good.** Quick health check |
| Algo status | ✓ Active algos with their current state | **Good.** Trader can see if algos are running |

**Gaps:**
- No loading/error states — if execution service is down, page shows nothing useful
- Dual navigation (EXECUTION_TABS + ExecutionNav) is confusing

---

### Execution Sub-Pages (Algos, Venues, TCA, Benchmarks) — SUPPORTIVE

These pages serve the trader's "drill into execution" need (step 5 in the daily workflow). They provide:

- **Algos:** Algo comparison with backtest results — helps trader choose execution strategy
- **Venues:** Venue connectivity matrix, fill rates, latency — helps trader understand execution quality
- **TCA:** Transaction cost analysis with slippage breakdown — directly addresses the slippage/alpha decay analysis
- **Benchmarks:** Benchmark comparison (VWAP, TWAP, arrival price) — helps trader evaluate execution quality

**Assessment:** These pages are well-aligned to the execution analysis workflow. The TCA page is particularly relevant for the backtest-vs-live slippage comparison use case.

**Gaps:**
- No connection between TCA analysis and the Dashboard's `DriftAnalysisPanel` — ideally, clicking a high-slippage alert on Dashboard should deep-link to the TCA page filtered for that order
- routeMappings puts these under "build" and "observe" lifecycle stages, which is confusing when accessed via EXECUTION_TABS (Run lifecycle)

---

## Live vs Backtest (As-Of) Comparison — Assessment

This is highlighted as a key use case: the trader selects a timeframe and compares simulated backtest results against actual live results to detect alpha decay and stress-test strategies.

### Current Implementation

| Component | Where | Capability |
| --------- | ----- | ---------- |
| `LiveBatchComparison` | Dashboard | 4 view modes: Live only, Batch only, Split (overlay), Delta (difference). Supports P&L, NAV, Exposure. Date picker for batch reference date. |
| `DriftAnalysisPanel` | Dashboard | Shows drift metrics (P&L drift %, exposure drift %, NAV drift %) with configurable thresholds. Lists unreconciled items. |
| `LiveBatchDeltaIndicator` | Dashboard (available) | Compact delta badge for inline display |
| Live/Batch mode badge | Terminal, Dashboard | Shows current mode (Live pulsing vs Batch with date) |
| `LiveAsOfToggle` | Layout (Row 2 right slot) | Toggle rendered but **not wired** — no page reads its state |
| Execution Mode Toggle | Positions | Live vs Paper mode — different from Live vs As-Of |

### What Works Well

1. **Dashboard `LiveBatchComparison`** — This is the star component. The split view overlaying live (green) and batch (blue) curves on the same chart with a delta area fill is exactly what a trader needs. The date picker lets the trader select which batch run to compare against.

2. **`DriftAnalysisPanel`** — Shows drift as a percentage with configurable thresholds (P&L: 2%, exposure: 5%, NAV: 1%). When drift exceeds threshold, it highlights in warning colors. The unreconciled items section shows fills and transfers that explain the drift.

3. **Scope-aware filtering** — When the trader narrows scope to a specific strategy, the live-vs-batch comparison shows data for that strategy only. This enables strategy-level alpha decay analysis.

### What's Missing

1. **Chart-level backtest overlay on Terminal** — The Terminal shows live candlestick/line chart but has no simulated price overlay. A trader stress-testing a specific event (e.g., "what would happen if ETH dropped 10% like the batch showed?") can't see that comparison at the instrument level.

2. **Position-level live vs batch** — The Positions page shows live positions. There's no way to view "what were positions at batch time X?" alongside current positions. A position-level diff would show: positions that are new since batch, positions that closed, and positions where size/P&L diverged.

3. **The `LiveAsOfToggle` in the layout is not wired** — The toggle renders in Row 2 but changing it has no effect on any page's data. Once React Query hooks are in place, this toggle should switch the global data mode so that ALL pages show either live or as-of data consistently.

4. **No event-driven stress testing** — The trader wants to pick a historical event (e.g., "March 2026 ETH flash crash") and see how live strategies performed vs backtest during that specific window. Current implementation only supports date-level batch comparison, not event-level window selection.

5. **No per-strategy alpha decay trend** — Dashboard shows aggregate drift. For the specific use case of tracking alpha decay over time (is slippage getting worse? is this strategy's live Sharpe declining relative to backtest Sharpe?), there should be a strategy-level trend chart showing backtest-vs-live Sharpe/P&L over weeks/months.

---

## Tab Set Assessment

| Current Tab | Label Appropriate? | Content Aligned? | Trader Priority |
| ----------- | ------------------ | ---------------- | --------------- |
| Terminal | ✓ | ✓ Strong | High — primary trading interface |
| Positions | ✓ | ✓ Strong | High — continuous monitoring |
| Orders | ✓ | ✗ Placeholder | **Critical** — missing workflow link |
| Execution Analytics | ✓ | ✓ Good | Medium — drill-in for execution quality |
| Accounts | ✓ | ✗ Placeholder | Low — partially covered by Positions |
| Markets | ✗ Misleading | ✗ P&L content, not market data | **Rename** to "P&L" or "Analytics" |

### Recommended Tab Order for Trader Workflow

The current tab order is: Terminal → Positions → Orders → Execution Analytics → Accounts → Markets

For trader workflow alignment, the order should follow the daily priority:

1. **Terminal** — Active trading (place orders)
2. **Positions** — Monitor positions and P&L
3. **Orders** — Track order lifecycle
4. **P&L** (rename from Markets) — Deep P&L attribution and factor analysis
5. **Execution Analytics** — Drill into execution quality
6. **Accounts** — Account management (lower frequency)

---

## Summary of Findings

### What's Working Well

- **Dashboard** is the strongest page — rich KPIs, P&L attribution, live-vs-batch comparison, drift analysis, emergency controls, scope filtering
- **Live vs Backtest comparison** (`LiveBatchComparison` + `DriftAnalysisPanel`) directly serves the alpha decay / stress-test use case at the aggregate level
- **Positions page** is comprehensive with position-type-specific details (LP/lending/perp/staking)
- **Terminal** follows standard trading UI conventions with good scope enforcement
- **Global scope filtering** (`useGlobalScope`) ensures all data responds to org/client/strategy selection
- **Execution sub-pages** provide the right analytical depth for TCA and algo assessment

### Critical Gaps for Trader Workflow

| # | Gap | Impact | Priority |
| - | --- | ------ | -------- |
| 1 | **Orders page is a placeholder** — trader can't track order lifecycle | Workflow broken between Terminal and Positions | P0 |
| 2 | **LiveAsOfToggle not wired** — toggle renders but does nothing | Live-vs-batch comparison only works on Dashboard, not across tabs | P1 |
| 3 | **"Markets" tab is mislabeled** — content is P&L attribution, not market data | Trader expectation mismatch | P1 |
| 4 | **No drawdown display** anywhere — max drawdown, current drawdown, drawdown duration | Missing critical risk metric for trader | P1 |
| 5 | **No position sorting** — can't sort by P&L, notional, liquidation distance | Slows down position monitoring | P2 |
| 6 | **No open orders panel on Terminal** — trader places order but can't see pending orders | Forces tab switch mid-trade | P2 |
| 7 | **No position-level live vs batch comparison** — only aggregate on Dashboard | Can't detect position-level alpha decay | P2 |
| 8 | **No per-strategy alpha decay trend** — only point-in-time drift on Dashboard | Can't track whether alpha decay is worsening | P2 |
| 9 | **Positions don't live-update** — static render, no polling | Trader sees stale P&L unless they manually refresh | P2 |
| 10 | **No cross-page navigation** — Terminal doesn't link to Orders, Orders doesn't link to Positions | Each page is isolated; workflow requires manual tab switching | P2 |
