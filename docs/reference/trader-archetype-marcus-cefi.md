# Trader Archetype — Marcus Vance (Senior CeFi Crypto Portfolio Trader)

A reference profile of a top-performing discretionary crypto trader at a top-5 firm, used as a yardstick for what an ideal trading terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow this profile is built on, see [manual-trader-workflow.md](manual-trader-workflow.md). For the shared platform surfaces referenced throughout, see [common-tools.md](common-tools.md). For Marcus's unique surfaces tracked alongside other archetypes, see [unique-tools.md](unique-tools.md).

---

## Who Marcus Is

**Name:** Marcus Vance
**Role:** Senior Portfolio Trader, Crypto Derivatives Desk
**Firm:** Top-5 global trading firm by AUM and performance
**Book size:** $500M – $2B on Binance alone
**Style:** Discretionary, multi-instrument, multi-day to multi-hour horizons
**Primary venue:** Binance (spot, perps, dated futures, options)
**Watched venues:** Bybit, OKX, Deribit, CME

### How he thinks

Marcus is not a scalper and not a long-term investor. His edge comes from:

- Deep structural knowledge of crypto market microstructure — funding, basis, liquidations, options flow.
- A macro / regime view that he overlays onto crypto-native signals.
- Cross-instrument arbitrage instincts. He rarely trades one leg in isolation: spot vs perp basis, perp vs dated future, options vs underlying, calendar spreads.
- Excellent risk management. His Sharpe is high not because he's right more often, but because he sizes correctly and exits cleanly.

He uses Binance because of liquidity, but he routes orders programmatically via API. **His terminal is where decisions are made — not Binance's UI.** He watches other venues even though he only executes on Binance, because price discovery happens across venues.

---

## Physical Setup

**6 monitors**, three rows of two, plus a tablet for news and chat.

| Position      | Surface                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| Top-left      | Primary chart workspace (multi-TF, drawing-heavy — his "thinking surface")       |
| Top-center    | Order book / DOM / liquidation map / footprint chart for the instrument in focus |
| Top-right     | Cross-venue + cross-instrument basis / funding / term-structure dashboard        |
| Middle-left   | Options surface — IV smile, term structure, greeks, flow                         |
| Middle-center | Positions, working orders, live PnL, risk panel                                  |
| Middle-right  | Order entry + execution algos + smart router                                     |
| Bottom-left   | Macro context — DXY, SPX, gold, US 10Y, BTC dominance, stables flow, ETF flows   |
| Bottom-right  | News, on-chain dashboards, whale alerts, social sentiment                        |
| Tablet        | Telegram / Slack / Discord for desk chatter and analyst feeds                    |

---

## Phase 1: Decide

### Charts (the thinking surface)

See [Multi-Timeframe Charting](common-tools.md#1-multi-timeframe-charting) for the shared multi-pane, multi-TF, drawing-tool framework.

**Marcus-specific characteristics:**

- BTC and ETH multi-TF charts are always pinned — these set regime even when he's trading SOL or an alt.
- Per-instrument-class chart layouts swap automatically: spot adds VWAP + CVD; perps add funding overlay + OI overlay + liquidation level marks; dated futures add a basis-vs-spot subpane and days-to-expiry awareness; options are surface-driven, not chart-driven.
- Footprint chart is a first-class chart mode for short-horizon entries (see Footprint chart below).
- Volume profile (session / weekly / composite) is always available; high-volume nodes are treated as magnets and rejection zones.
- Liquidation heatmap and funding heatmap layers are toggle-able overlays on the primary chart, not separate windows.

### Aggregated CeFi cross-venue depth book

A unified, single-tick-resolution order book that stacks Binance spot, Binance perps, Bybit, OKX, and (where relevant) Coinbase depth side-by-side for the same underlying. Marcus uses this surface every minute during active trading because crypto price discovery is genuinely cross-venue: an iceberg printing on OKX five seconds ahead of Binance is the kind of edge his book is sized to capture.

**What it shows.** Per price level, the depth contributed by each venue, color-coded. Aggregated total depth on each side. Imbalance ratio (bid notional vs ask notional within ±10bps, ±25bps, ±50bps). Iceberg-detection highlights when the same level keeps refilling. Spread-vs-mid for each venue so Marcus can see when one venue is leading or lagging.

**Why he uses it.** Binance is his execution venue, but Bybit and OKX often move first on Asian-led flow, and Coinbase often moves first on US-spot-ETF flow. Watching aggregate depth tells him whether a Binance move is genuine cross-venue conviction or a thin local print he should fade. The aggregated view also informs his router: if Binance depth dries up at his target level, he'll route across venues (see Smart Order Router below).

**Design principles.** Single-tick resolution — no rounding bins. Venue color-coding consistent across every surface in the terminal. Latency badge per venue (last book-update age in ms) — stale venues are visually de-weighted so he doesn't trade against a frozen feed.

### Funding-rate heatmap & term structure

Funding is the single most important crypto-native sentiment signal for a perp trader, and it is the leg of Marcus's basis trade. He needs both the **current** state and the **term structure**.

**What it shows.** A two-pane surface. The heatmap is rows=instruments (BTC, ETH, SOL, top-50 perps), columns=venues (Binance, Bybit, OKX, dYdX, Hyperliquid). Cell color = current funding rate, with a z-score overlay (green/red intensity = how extreme vs that pair's 30-day distribution). The term-structure pane shows, per asset, the implied funding curve: current 8h rate, next-8h-implied (from basis), 24h-implied, 7d-implied — annualized to bps.

**Why he uses it.** Extreme positive funding = crowded longs = setup for a long squeeze. Extreme negative funding on a venue Bybit/OKX while Binance prints near zero = a cross-venue arb (long Bybit perp, short Binance perp, collect the funding spread). The term structure tells him whether a one-off 8h spike is mean-reverting or whether the market is pricing sustained pressure.

**Design principles.** Z-score, not raw rate, drives color — raw funding ranges differ per asset and per regime, so a uniform color scale would mislead. Click any cell to drill into a venue/instrument-specific funding history chart. Alerts integrate with the [Alerts Engine](common-tools.md#14-alerts-engine).

### Liquidation heatmap

A predictive-magnets view: where do leveraged positions cluster, and at what price will they cascade? Crypto markets hunt liquidations — knowing where the clusters sit is half the trade.

**What it shows.** A price-vs-cumulative-leveraged-notional histogram, per asset, per venue. Long-cluster magnitudes shaded one color (e.g. red, "longs liquidated below"), shorts the opposite (e.g. green, "shorts liquidated above"). Overlay-able onto the primary chart so the lines sit at the right price levels. Real-time updates as OI changes. Aggregated view across Binance, Bybit, OKX is the default; per-venue toggle for diagnosis.

**Why he uses it.** When price approaches a $200M long-cluster at 68k and momentum is weak, Marcus knows market-makers will press it — the cascade is mechanical, not narrative. He'll either get out of the way or get short ahead of it. Conversely, a price level with no clusters near it has no magnetic pull; momentum trades there are higher-friction.

**Data source.** Synthesized from venue-published liquidation feeds plus inferred clustering models that back-out leverage distribution from OI + funding + open-position-size proxies. Acknowledges model uncertainty — clusters are estimates, shown with confidence shading.

**Design principles.** Direction is unambiguous (color). Size is to scale (a $50M cluster looks materially smaller than a $500M one). The heatmap is never the only reason to take a trade — it is a contextual layer on the chart.

### Open-interest delta dashboard

Open interest combined with price action is how Marcus reads whether a move is _new money_ or _short covering_ — a question that changes the trade entirely.

**What it shows.** Per asset, per venue: OI now, OI 1h / 4h / 24h ago, OI delta in absolute and %. A stacked-area chart of OI history. A diagnostic quadrant: price up + OI up = new longs (sustainable); price up + OI down = short covering (rally is fragile); price down + OI up = new shorts (downtrend has fuel); price down + OI down = long capitulation (often a bottom signal).

**Why he uses it.** It's the cleanest signal for "how much conviction is behind this move." A 5% rally on falling OI is a fade. A 5% rally on rising OI plus rising funding is a momentum entry — but if funding goes too extreme, he flips to fading.

**Design principles.** Diagnostic quadrant is the default front-and-center read; raw numbers are the drill-down. Per-venue breakdown matters because Bybit OI behavior differs from Binance OI behavior structurally — aggregating without disclosing the split would hide signal.

### Spot–perp basis & dated-futures term structure

Basis is the crypto fixed-income trade. Marcus runs basis trades as a meaningful share of his book — he is not just _aware_ of basis, he _trades_ it. So basis is a first-class instrument surface for him, not a derived analytic.

**What it shows.** Two integrated views.

- **Spot–perp basis grid.** Rows=assets, columns=venues. Cells display current basis in bps and annualized. Z-score shading vs 30-day distribution. Click a cell to open the historical basis chart with funding annotations.
- **Dated-futures term structure.** For each underlying with dated futures (BTC, ETH on Binance and CME), a curve plot of Mar / Jun / Sep / Dec contracts vs spot, expressed as annualized basis. Overlay the previous day's curve to see steepening / flattening intraday. CME and Binance curves on the same axes so he can spot dislocation.

**Why he uses it.** The basis is the leg of a delta-neutral trade — it pays him to hold spot and short perp (or short spot and long dated future) when basis is rich. He sizes basis trades by capital-at-risk, not by "view" — so a clear, low-noise basis surface is operationally critical.

**Design principles.** Annualized bps everywhere — apples to apples across maturities. Funding curve overlaid on the perp basis chart since they're economically the same trade in different clothing. CME futures get equal billing with crypto-native venues because CME basis is its own opportunity set when on-chain ETFs distort flows.

### Whale tape

Every large print on every venue, in real time, with metadata.

**What it shows.** A scrolling tape of trades >$1M (configurable threshold). Per row: timestamp (ms-precision), venue, instrument, side, size, price, aggressor (taker side). Color-coded by venue. Filterable by asset, venue, size bucket, aggressor side. A small inline sparkline shows price for the surrounding 60 seconds so Marcus can see whether the whale led or chased.

**Why he uses it.** Whales leak. A series of $5M aggressor-buys on Binance perp BTC followed 30 seconds later by similar prints on OKX is rarely coincidence — it's one fund moving size across venues, and Marcus wants to be in front of leg three. The whale tape is also his early-warning for liquidation cascades: a single $20M aggressor sell into thin depth often is the cascade trigger.

**Design principles.** Latency is the feature — if the tape is even 2 seconds delayed, the signal is dead. Aggressor side must be reliable (some venues' tapes are ambiguous; the terminal's enrichment logic is shown when hovering for transparency). De-dupe across venues for the same arbitraged trade if the venue API supports it; otherwise show both with a "co-arrived" badge.

### CVD per venue and aggregated

Cumulative volume delta — sum of (aggressor-buy size − aggressor-sell size) over a window — is Marcus's flow-direction read.

**What it shows.** A line chart per asset: CVD plotted alongside price. Per-venue lines (Binance, Bybit, OKX) plus an aggregated line. Divergences are visually called out (price new high but CVD lower high → sellers absorbing, exhaustion likely). Window is configurable: 5m / 15m / 1h / session.

**Why he uses it.** Price tells him _what_ happened; CVD tells him _who_ caused it. A grinding rally with strong positive CVD is buyers in control. A rally with flat or negative CVD is short-covering or thin liquidity — and he treats those rallies as suspect. Per-venue CVD also exposes when one venue is doing the heavy lifting (often a tell for who the marginal buyer/seller is, e.g. Asian retail on Bybit vs US institutional on Coinbase).

**Design principles.** Tied to the [Multi-Timeframe Charting](common-tools.md#1-multi-timeframe-charting) framework as an indicator overlay; opens as a dedicated panel below the price pane. Per-venue lines are toggleable; default-on for Binance, default-off for the rest until he turns them on. The aggregator weighting is exposed (volume-weighted by default).

### Footprint chart

Bid/ask volume per candle, rendered _inside_ each candle as a two-column histogram. Marcus uses this for short-horizon entries when he's already decided direction and is timing the actual click.

**What it shows.** Each candle is split into price levels; at each level, the volume traded on the bid vs the ask is shown side-by-side. Aggregated delta per candle (signed sum) shown as a band below. Imbalance highlighting (e.g. >3:1 ask:bid at a level prints in bold) flags absorption and exhaustion patterns.

**Why he uses it.** Standard candles compress information that matters. A green candle that closed near its high but had heavy bid-side absorption is a different trade from a green candle with continuous ask-side initiation — same close, opposite implication. For entries at key levels (volume profile high-volume node, liquidation cluster edge), the footprint tells him whether the level is holding or breaking.

**Design principles.** Performant rendering — the footprint can render thousands of price-volume cells per visible chart, so virtualization and zoom-aware aggregation are non-negotiable. Coexists with the standard candle view; Marcus toggles between them with a hotkey, not a settings menu. Tick-aggregation rules (1-tick / 5-tick / 10-tick footprint) are saved per instrument-class.

### Cross-instrument context dashboard

- **Options term structure & smile** — Deribit IV by tenor, 25-delta risk reversals (skew), butterflies (kurtosis), DVOL.
- **Cross-asset correlations** — BTC-ETH, BTC-SOL, BTC-SPX, BTC-DXY rolling correlation panel.
- **Stablecoin flows** — USDT/USDC mint/burn, exchange inflows. Indicates dry powder.

This dashboard is Marcus's second-most-glanced surface (after the primary chart). Its layout is fixed; only the content updates.

### Macro and on-chain

- **Macro tickers always visible** — DXY, US 10Y yield, SPX futures, gold, oil, VIX, MOVE.
- **On-chain dashboard** — exchange netflows, miner outflows, stablecoin supply, ETH staking flows, ETF flows (spot BTC/ETH ETFs).
- **Whale alert feed** — large on-chain transfers, especially to/from exchanges.

### Catalyst calendar

See [Catalyst / Event Calendar](common-tools.md#12-catalyst--event-calendar) for the shared event-calendar framework.

**Marcus-specific characteristics:**

- CPI, FOMC, NFP, and crypto-native events (token unlocks, ETF decisions, exchange listings) all surface in one calendar with countdown timers.
- Each event has a "historical reaction" annotation (BTC and ETH median move ±N hours around prior instances of the same event class).
- Funding-reset events (8h Binance, 1h Bybit) are pinned as recurring events; he times exits around them.

### News & research

See [News & Research Feed](common-tools.md#13-news--research-feed) for the shared news framework.

**Marcus-specific characteristics:**

- Premium feeds prioritized (Bloomberg crypto, The Block premium, Coindesk pro, Velo).
- Keyword alerts route to the [Alerts Engine](common-tools.md#14-alerts-engine) (e.g. "ETF approval", "exchange hack", "exploit", "depeg").
- On-chain whale-alert feed and social sentiment (curated X list, Santiment) are sub-tabs in the same surface.

### Sentiment & scanners

- **Sentiment proxies.** Funding-as-sentiment (extreme = crowded), long/short ratios per venue, options put/call ratio and 25-delta skew, fear & greed index.
- **Outlier scanner.** Coins moving >3σ on volume, funding spiking, OI exploding.
- **Basis / funding arb scanner.** Where is the spot-perp or perp-dated basis abnormal?
- **Options flow scanner.** Unusual option size, IV moves, gamma walls.

**Layout principle:** primary chart and the cross-instrument context dashboard are the two most-glanced surfaces. Everything else is consultable but not always foveal.

---

## Phase 2: Enter

A custom terminal beats Binance's UI by an order of magnitude here.

### Order entry ticket

See [Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) for the shared multi-leg, bracket-capable, post-only-default ticket framework.

**Marcus-specific characteristics:**

- Multi-leg atomic submission for spot+perp basis trades is the **default** mode, not an edge case — the ticket opens with two legs by default for any asset that has both spot and perp.
- Post-only is the default time-in-force; the ticket warns when removed (he relies on rebates).
- Reduce-only is the default flag for any perp exit (prevents accidental position flips).
- Greeks impact preview activates when an options leg is included (delta / gamma / vega / theta change to the book).
- Funding-cost projection appears in the preview for any perp leg held > 8h.

### Pre-trade risk preview

See [Pre-Trade Risk Preview](common-tools.md#3-pre-trade-risk-preview) for the shared margin / liquidation / fee / slippage preview.

**Marcus-specific characteristics:**

- Liquidation price is shown _per leg_ for cross-margin perp positions — and the aggregate liquidation distance for the whole basis trade.
- Estimated slippage is computed against the **aggregated** cross-venue book, not just Binance — so he can see whether a sweep will help.
- Fees shown reflect his VIP tier (maker rebate / taker discount) explicitly.

### Execution algos

See [Execution Algos Library](common-tools.md#4-execution-algos-library) for the shared VWAP / TWAP / POV / Iceberg / Sniper / IS algo set.

**Marcus-specific characteristics:**

- All algos are crypto-tuned: 24/7 operation, no session-close logic, weekend-aware participation curves.
- Iceberg refresh logic is randomized within configurable bounds (anti-detection).
- Algos can be configured to **respect funding-rate windows** — e.g. don't be aggressive in the 30 seconds before a funding settlement.

### Smart order router / multi-venue aggregation

See [Smart Order Router / Multi-Venue Aggregation](common-tools.md#5-smart-order-router--multi-venue-aggregation) for the shared cross-venue routing framework.

**Marcus-specific characteristics:**

- Binance is the default venue with strong preference; the router only sweeps Bybit/OKX when Binance depth at the target level is materially worse and policy allows.
- Per-venue API-credential and rate-limit headroom is enforced (rate-limit indicator visible inline).
- Venue-specific algo extensions: e.g. Bybit-conditional orders, OKX algo-orders are first-class options when the router selects those venues.

### DOM / ladder

The aggregated multi-venue ladder is built on the [Aggregated CeFi cross-venue depth book](#aggregated-cefi-cross-venue-depth-book). The ladder layers click-to-trade, iceberg detection, and inline footprint volume at each level on top of that data. The ladder is what Marcus uses for time-critical clicks; the depth book is what he uses for analysis.

### Hotkeys

See [Hotkey System](common-tools.md#6-hotkey-system) for the shared hotkey framework.

**Marcus-specific characteristics:**

- Buy/sell at bid/ask and flatten-current-instrument are the most-bound keys.
- "Reverse position" is bound (rare for other archetypes; common for him because basis trades flip).
- "Move all working stops to breakeven" is one chord.
- Toggle reduce-only is hotkey-bound.
- Kill-switch combo is intentionally awkward (modifier + key) and requires confirmation.

### Order management on chart

- Working orders shown inline on the chart as draggable lines. Drag to move price. Right-click to cancel.
- Position marker on chart with avg-price line, liquidation line, stop/target lines.

### Latency / connectivity panel

See [Latency / Connectivity / Infra Panel](common-tools.md#18-latency--connectivity--infra-panel) for the shared latency/health framework.

**Marcus-specific characteristics:**

- Round-trip ms to Binance is the headline metric, color-coded.
- Rate-limit headroom (% of per-minute API quota consumed) is always visible — exceeding limits during active trading is unacceptable.
- WebSocket health per venue (last message age, reconnect count) is a peripheral indicator.

**Layout principle:** order ticket and DOM adjacent to primary chart. Hotkey execution is the default; clicking is for non-time-critical orders.

---

## Phase 3: Hold / Manage

This is where a multi-instrument crypto trader's terminal differs most from a single-asset equity setup.

### Positions blotter — aggregated by underlying

See [Positions Blotter](common-tools.md#7-positions-blotter) for the shared positions framework.

**Marcus-specific characteristics:**

- Default grouping is **by underlying**, not flat — e.g. _"BTC: net delta +$4.2M, net gamma +$80k/$, theta –$12k/day, vega +$45k, financing –$8k/day."_ — and drill-down shows the spot/perp/future/option legs.
- Per-leg fields include funding accrued (perps), basis PnL (futures), greeks (options), distance to liquidation in % and in standard deviations of recent realized vol.
- Margin breakdown per leg: cross vs isolated, initial vs maintenance, free margin remaining.
- A flat-leg view is one toggle away when he needs it (e.g. for venue-by-venue reconciliation).

### Working orders blotter

See [Working Orders Blotter](common-tools.md#8-working-orders-blotter) for the shared working-orders framework.

**Marcus-specific characteristics:**

- Grouped by instrument, with bracket children visualized hierarchically (which stops/targets belong to which entry).
- Inline-modifiable (drag price, type new size, hit enter); cancel-all per instrument and globally.

### Live PnL

See [Live PnL Panel](common-tools.md#9-live-pnl-panel) for the shared live-PnL framework.

**Marcus-specific characteristics:**

- PnL decomposition is **crypto-native**: spot directional, perp directional, perp funding accrued, basis PnL, options theta / vega / gamma realized.
- PnL by underlying and by strategy tag (directional / basis arb / vol short / calendar) are first-class slices.
- Intraday equity-curve sparkline is the headline glance.

### Risk panel — multi-dimensional

See [Risk Panel (Multi-Axis)](common-tools.md#10-risk-panel-multi-axis) for the shared risk framework.

**Marcus-specific characteristics:**

- Net delta per asset ($ and notional) and beta-weighted-to-BTC ("equivalent BTC delta") are headline metrics.
- Greeks book-wide: gamma, vega, theta, **rho-funding** (sensitivity to funding rate — crypto-native, not a generic risk axis).
- Concentration warnings: "your top 3 positions are 80% of risk."
- Correlation cluster risk: "you're long 6 L1s; this is one bet, not six."
- Funding cost projection: at current rates, perps cost $X over next 8h, $Y over 24h.

### Stress / scenario panel

See [Stress / Scenario Panel](common-tools.md#11-stress--scenario-panel) for the shared scenario framework.

**Marcus-specific characteristics:**

- Pre-computed grid: BTC ±5/10/20%, IV ±20%, funding ±100bps annualized.
- Per-scenario margin call check: does any leg get liquidated under this scenario?

### Alerts

See [Alerts Engine](common-tools.md#14-alerts-engine) for the shared alerts framework.

**Marcus-specific characteristics:**

- Crypto-native alert types are first-class: funding alerts, basis alerts, liquidation-cluster proximity ("$200M of longs cluster at 68k, price approaching"), volatility-regime alerts ("BTC realized 1h vol just spiked to 2σ").
- Connection / API alerts (WebSocket dropped, REST latency >500ms, rate-limit at 80%) route through the same engine but to a peripheral banner so they don't compete with trade alerts.

### Trade journal

See [Trade Journal](common-tools.md#15-trade-journal) for the shared journal framework.

**Marcus-specific characteristics:**

- Inline note capture per position with thesis / invalidation / plan template.
- Auto-tagged by strategy (directional / basis / vol / calendar).
- Linkable to chart snapshots at entry time (same chart layers active when he revisits).

### Heatmap of own book

See [Heatmap of Own Book](common-tools.md#16-heatmap-of-own-book) for the shared book-heatmap framework.

**Marcus-specific characteristics:**

- Treemap sized by gross exposure, colored by intraday PnL %.
- Drill-down respects the by-underlying grouping (BTC tile contains spot/perp/future/option sub-tiles).

### Kill switches

See [Kill Switches (Granular)](common-tools.md#19-kill-switches-granular) for the shared kill-switch framework (flatten-all, cancel-all, pause-all-algos, with confirmations and audit trail).

**Marcus-specific characteristics:**

- Three separate buttons; one must not trigger the others by accident (physical layout rule).
- Flatten-all uses aggressive limit orders by default (not market) — markets in thin alts can move 5% on a flatten if not bounded.
- Cancel-all is no-confirmation, instant; the other two require confirmation.

**Layout principle:** positions, PnL, and risk panel are most-glanced. The chart of the active trade is contextual. Alerts are peripherally visible (corner banner) without being intrusive.

---

## Phase 4: Learn

Different cognitive mode, often a different tab or a different session at end-of-day.

### Trade history & blotter

See [Trade History / Blotter (Historical)](common-tools.md#21-trade-history--blotter-historical) for the shared historical-blotter framework.

**Marcus-specific characteristics:**

- Every fill carries venue, instrument, side, size, price, fee (maker/taker), strategy tag, parent order ID.
- Group by parent order to reconstruct execution quality across the venues a smart-router sweep touched.

### PnL attribution

See [PnL Attribution (Multi-Axis)](common-tools.md#22-pnl-attribution-multi-axis) for the shared attribution framework.

**Marcus-specific characteristics:**

- Instrument-class axis is crypto-native: spot, perp directional, perp funding, basis, options theta, options vega, options gamma scalping.
- Underlying axis (BTC vs ETH vs alts) and strategy-tag axis (directional vs arb vs vol) are first-class.
- Regime axis: Asia vs US session, weekend vs weekday, trending vs chop.

### Performance metrics

See [Performance Metrics](common-tools.md#23-performance-metrics) for the shared metrics framework.

**Marcus-specific characteristics:**

- All metrics sliced by strategy tag and regime; aggregate-only views are de-emphasized.

### Equity curve

See [Equity Curve](common-tools.md#24-equity-curve) for the shared equity-curve framework.

**Marcus-specific characteristics:**

- Benchmarks are crypto-native: BTC buy-and-hold, BTC perp funding-only, basis-only carry.
- Rolling Sharpe (30/60/90 day) is the headline diagnostic.

### Trade replay

See [Replay Tool](common-tools.md#20-replay-tool) for the shared replay framework.

**Marcus-specific characteristics:**

- Replay reconstructs orderbook, funding, liquidations, and his own working orders at tick resolution — all data layers he had live at decision time, available for retrospect.
- Tick-level historical store across Binance/Bybit/OKX is required (non-trivial; expected at this tier).

### Execution quality / TCA

See [Execution Quality / TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis) for the shared TCA framework.

**Marcus-specific characteristics:**

- Per parent order: arrival price, VWAP during execution, final fill price, slippage vs arrival, slippage vs VWAP.
- Maker vs taker ratio and rebates earned are tracked against his VIP-tier expectations.
- Sliced by venue — so cross-venue sweeps are evaluable per-venue, not just in aggregate.

### Behavioral analytics

See [Behavioral Analytics](common-tools.md#26-behavioral-analytics) for the shared behavioral framework.

**Marcus-specific characteristics:**

- Time-in-position distribution is bimodal for him (intraday momentum vs multi-day basis); the analytics surface separates the two regimes rather than averaging across.
- Revenge-trade detection (large size shortly after a loss) and discipline metrics (% of trades that hit pre-defined stop vs got moved) are the two metrics he checks weekly.

### Reports

See [Reports](common-tools.md#27-reports) for the shared reports framework.

**Marcus-specific characteristics:**

- Daily PnL report, monthly performance report (for risk and the PM committee), regulatory compliance report, optional client report when running external capital. All exportable, all schedulable.

**Layout principle:** big tables, big charts, drill-down. Not real-time. Persistent workspace state — when he comes back tomorrow, his filters and views are where he left them.

---

## What Ties Marcus's Terminal Together

A few cross-cutting principles for this archetype specifically:

1. **Multi-instrument is native, not bolted on.** Spot, perp, future, and option of the same underlying are presented as one position, with leg-level detail one click away. This is the single biggest differentiator from Binance's UI.
2. **Multi-venue awareness even with single-venue execution.** He executes on Binance but watches Bybit / OKX / Deribit / CME. The terminal aggregates without forcing him to switch tabs.
3. **Microstructure data is first-class.** Funding, OI, liquidations, basis, term structure, IV surface are table stakes — not "advanced features."
4. **Latency is visible.** API ping, WebSocket health, rate-limit headroom are always on screen. He can't trust his book if he can't trust his connection.
5. **Tagging is enforced at order time.** Every order gets a strategy tag at entry, not retroactively. This makes Phase-4 attribution trustworthy.
6. **Hotkeys are first-class citizens.** Keyboard-first for action, mouse-first for analysis.
7. **Risk is shown in trader-native units.** Not just "$ exposure" but "BTC-beta-equivalent," "days to liquidation at current vol," "P/L at –10% BTC." These are how he actually thinks.
8. **Opinionated about workflows, neutral about views.** Enforces strategy tagging and pre-trade risk checks; lets him arrange his monitors however his brain works.

---

## How to Use This Document

When evaluating any crypto trading terminal (including our own), walk through Marcus's four phases and ask:

- Are the data sources he relies on present and aggregated correctly?
- Are the tools listed for each phase available and at the latency he needs?
- Are the layout principles per phase respected?
- Are the cross-cutting principles upheld?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

---

# Automated Mode

This appendix describes Marcus's terminal and daily workflow once his daily edge is encoded into models and rules running at scale — what he does, what he sees, and what stays human. It extends the universal automated-trading platform (see [automation-foundation.md](automation-foundation.md)) with crypto-CeFi-specific surfaces and decisions.

Marcus is the cleanest case in the heavily-automatable tier: his edge (basis, funding, microstructure, cross-venue lead-lag, momentum / mean-reversion on liquid pairs) translates directly into rules and models. With automation, his coverage scales from 3–5 instruments hand-watched to 200+ instruments × 5–8 venues × multiple horizons running continuously.

## What Marcus's Edge Becomes

His manual edge encoded as automated strategy classes:

- **Basis arb** — long spot + short perp atomic (or short spot + long perp), capturing the basis premium with auto-flatten near funding settlement. Hundreds of instances across instruments × venues.
- **Funding harvest** — short the perp during sustained funding-extreme regimes (z-score thresholded), with auto-flatten before regime flip. Dozens of instances per asset class.
- **Cross-venue lead-lag** — when Coinbase / OKX prints first on Asian-led or US-spot-ETF-led flow, fade the laggard on Binance with tight stops. Microstructure-fast.
- **Liquidation-cluster fade / chase** — strategies that trade _into_ known liquidation clusters with appropriate sizing (cascade-ride) or _fade_ exhaustion after a cascade prints.
- **OI-divergence trades** — quadrant-based: price up + OI up = ride; price up + OI down = fade short cover; etc. Mechanical.
- **Cross-instrument basis** — perp-vs-dated-future calendar arb, especially around expiry rolls.
- **Volatility-of-funding mean-reversion** — when funding vol spikes, mean-revert; when funding vol compresses, momentum.
- **Whale-tape signal strategies** — large-print follow-through or fade based on aggregator-classified flow.
- **Cross-asset correlation strategies** — BTC-ETH-SOL relative value when correlation regimes shift.

His edge **scales to thousands of strategy instances** because each combination of (instrument × venue × horizon × parameter profile) is its own instance. Marcus is no longer running 3 trades at a time; he is running 300 strategies, each running thousands of micro-decisions per day.

## What Stays Marcus

The platform automates the _execution_ and _signal-generation_ of his edge. What stays him:

- **Venue-policy interpretation.** When Binance announces a leverage-rule change, a perp delisting, a funding-formula change — the platform notices the announcement; Marcus interprets the implication for the funding-harvest fleet and adjusts.
- **Regime-shift recognition.** When the structural assumption underlying a strategy class breaks (e.g., a venue closes Asia-only access; a major stablecoin starts to wobble; an exchange custodian fails) — Marcus's first move is faster than the model's drift detector.
- **New strategy invention.** "I noticed funding behavior changes around mid-month perp settlements; let me model it." Idea origination is human.
- **High-conviction directional override.** When Marcus has a strong macro view (BTC ETF flows, Fed-day, China policy event), he can manually layer a directional trade _on top of_ the systematic book — with explicit override tagging.
- **Counterparty risk decisions.** Adding a new venue, sizing exposure to a venue under stress, evaluating new wrapped-asset issuers — all human.
- **Catastrophe response.** When an exchange has a security incident, when a stablecoin starts depegging, when a mass liquidation cascade is unfolding — Marcus's first 60 seconds of judgment beat any pre-coded response.

## Marcus's Automated-Mode Terminal

The universal supervisor console (see [automation-foundation.md](automation-foundation.md#the-supervisor-console--the-traders-daily-ui)) plus crypto-CeFi-specific extensions.

### Surfaces inherited from the foundation

All 10 universal surfaces (data layer, feature library, research workspace, model registry, experiment tracker, strategy composition, promotion gates, capital allocation, fleet supervision, decay tracking). See [automation-foundation.md](automation-foundation.md) for the full descriptions.

### Crypto-CeFi specific extensions

#### Multi-venue strategy fleet view

The fleet dashboard (see [#9 Live Fleet Supervision Console](automation-foundation.md#9-the-live-fleet-supervision-console)) for Marcus is grouped first by **strategy class** (basis arb / funding harvest / cross-venue lead-lag / liquidation-zone / etc.), then by **venue cluster**, then by **instrument**. With ~300 strategies live, the dashboard's design choice to default to amber+red filtering is critical — green fleet stays peripheral.

**Marcus-specific columns:** funding rate at last action, basis at last action, last cross-venue divergence value, liquidation-cluster proximity for any open positions.

#### Crypto-data-layer additions

The data layer (see [#1 The Data Layer](automation-foundation.md#1-the-data-layer)) for Marcus emphasizes:

- **Tick-level orderbook archives** across Binance, Bybit, OKX, Coinbase, Hyperliquid, Deribit (Tardis / Kaiko / native venue archives). Petabyte-scale. The cost / freshness / coverage matrix is the trader's licensing decision.
- **Funding-rate archives** with venue-native delivery times and historical formula changes preserved.
- **Liquidation event archives** with size, side, venue, instrument, time-since-prior — the raw substrate for liquidation-cluster modeling.
- **OI archives** with per-venue, per-instrument, per-horizon snapshots.
- **On-chain ETF flow data** (BlackRock / Fidelity / Bitwise / Grayscale daily creates / redeems) — drives a meaningful Marcus signal that didn't exist 18 months ago.
- **Stablecoin flow data** (USDT / USDC mint / burn / exchange in-flow / out-flow) — the dry-powder indicator.
- **Whale-wallet trackers** with on-chain entity attribution.
- **Social sentiment** (curated Twitter/X lists, Telegram syndicate signal feeds) — supplementary, not primary.

#### Crypto-feature-library additions

The feature library (see [#2 The Feature Library](automation-foundation.md#2-the-feature-library)) carries Marcus-specific features. Examples:

- **Funding extremity z-score** at multiple windows (8h / 24h / 7d), per instrument, per venue.
- **Basis term structure curvature** — short-end vs. mid-end vs. far-end basis dynamics.
- **OI-vs-price quadrant flag** (the four-state diagnostic from Marcus's manual surface, encoded as a feature).
- **Liquidation-cluster proximity** — distance to nearest cluster of size > X, weighted by total cluster size.
- **CVD divergence z-score** across venues.
- **Cross-venue lead-lag spread** (Coinbase vs. Binance, OKX vs. Binance) at multiple lag windows.
- **Funding-volatility regime indicator.**
- **Basis-vs-perpetual-funding spread** — informs funding-vs-basis arb structure.

These features are reusable across strategy classes (e.g., funding extremity z-score is consumed by basis arb, funding harvest, and momentum strategies alike) — exemplifying the library's reuse value.

#### Strategy templates (Marcus's starting kit)

Pre-built compositions in the strategy composition layer:

- **Basis arb template** — long spot + short perp atomic, with leg-level slippage tolerance, auto-flatten window before funding, parameterized by funding-z threshold and basis threshold.
- **Funding harvest template** — short perp during funding-extreme, hedge optional via spot or via cross-venue perp (Bybit vs. Binance funding spread).
- **Liquidation-cluster fade template** — sit ahead of a known cluster, take short or long bias depending on price approach direction.
- **Cross-venue lead-lag template** — fade the laggard at predefined latency thresholds.
- **Momentum / mean-reversion templates** parameterized for different volatility and funding regimes.

Marcus customizes from these. Many of his live strategies are instances of one template with parameter profiles tuned per asset class.

#### Latency-tier requirements

Marcus's strategies span multiple latency tiers (see [automation-foundation.md cross-cutting principles](automation-foundation.md#how-the-platform-binds-these-surfaces-together)):

- **Microstructure-fast** (cross-venue lead-lag, cascade-trade) — sub-100ms decision-to-execution. Co-located or near-co-located execution. Native venue connection (no aggregator overhead).
- **Tactical** (basis arb, funding harvest) — second-level latency acceptable. Aggregator routing fine.
- **Strategic** (cross-asset rotation, regime-conditional sizing) — minute-level latency.

The platform must respect each tier; the latency panel (see [#18 Latency Panel](common-tools.md#18-latency--connectivity--infra-panel)) shows per-strategy-class latency budgets and current realized latency.

#### Multi-venue capital + balance management

Beyond the universal capital allocation engine, Marcus's automated mode requires **per-venue balance management**:

- **Auto-rebalance across venues** — when capital concentrates on one venue (funding harvest pulled USDT into Binance; cross-venue lead-lag needs USDT on Bybit), the platform auto-bridges (or queues a bridge-with-policy gate for sign-off).
- **Margin segregation** — cross-margin vs. isolated-margin accounts per strategy class.
- **Sub-account routing** — strategies that share an underlying but have different risk profiles get separate sub-accounts where the venue supports it.

#### On-chain crossover (lighter than Julius's)

Marcus is primarily CeFi but the modern crypto trader interacts with on-chain occasionally:

- **ETF flow data** (on-chain ETF creation/redemption events).
- **Whale wallet alerts** (large on-chain transfers to / from exchange).
- **Stablecoin flow data** (on-chain).

These integrate as data sources but Marcus does not run on-chain execution strategies (that's Julius's territory). His automated mode reads on-chain data; it does not write.

## Marcus's Automated-Mode Daily Rhythm

Crypto is a 24/7 market. Marcus's "day" is bounded by his shift; the strategies run continuously. Overnight supervision is split across regions or handled by the automated supervisor.

### Pre-market (typically London-NY overlap, 60–90 min)

- **Fleet review:** ~300 strategies in the dashboard, ~270 green, ~25 amber, ~5 red. Drill into red:
  - "BTC-funding-harvest-binance-15m" — drift on funding-formula change announced overnight. Pause; queue retraining.
  - "ETH-cross-venue-leadlag-okx-binance" — slippage spike during Asia session. Diagnose: was venue latency degraded, or is the lead-lag relationship genuinely shifting?
- **Overnight attribution:** Asia session contributed +$X to funding-harvest fleet, –$Y to cross-venue lead-lag (correlation cluster question — are they capturing different alpha or are they correlated and I'm doubled-up on noise?).
- **Capital drift:** allocation has drifted overnight; nightly proposal is ready. Approve, or modify because of regime shift recognition.
- **Macro / regime read:** ETF flows from yesterday US session, today's macro calendar (FOMC week? CPI day?), any overnight headlines (China policy, regulator move).
- **Promotion-gate triage:** two pilots are at day 30 and ready for full-live promotion. Review gate evidence, sign off or send back.
- **Research-priority setting:** what to investigate today.

### In-market (continuous, anomaly-driven)

- **Default state:** in the research workspace. Notebooks open. Working on:
  - A new feature: "does on-chain ETF flow predict next-day BTC perp basis?"
  - Retraining a funding-harvest model whose feature distribution shifted.
  - Ablation study on the cross-venue lead-lag feature set — which features are actually pulling weight?
  - A new strategy template idea — "basis arb during stablecoin depeg events."
- **Background:** supervisor console in another monitor; default green.
- **Alert response:** typical day has 5–15 alerts. Most are info; 1–3 require action.
  - Alert: "BTC 1h realized vol just spiked to 3σ." → Cap aggressive funding-harvest strategies; confirm hedge-with-perp strategies are on auto-hedge.
  - Alert: "Bybit funding-rate feed lag > 10s." → Pause Bybit-dependent strategies until feed recovers.
  - Alert: "USDC depeg > 50bps." → Pause all USDC-funded strategies; switch capital to USDT-funded; alert the desk and David.
- **Liquid-event override:** ETF approval announcement, FOMC day, China policy headline, exchange security incident. Switch to event mode:
  - Pause sensitive strategies.
  - Manual directional override possible (with explicit override tagging).
  - Restore default mode when event stabilizes.
- **Mid-day:** glance at allocation engine, decide on intraday rebalance or defer to nightly.
- **Cross-trader coordination:** brief desk chat with Julius on cross-domain basis (CeFi-vs-DeFi funding); Sasha on vol structures around the next event.

### Post-market (60–90 min)

- **End-of-day attribution:** today's P/L by strategy class, by venue, by underlying, by regime. Outliers flagged.
- **Decay check:** which strategies' rolling Sharpe is concerning? Queue retrain jobs overnight for any that need it.
- **Capital allocation:** nightly proposal review. Approve or escalate.
- **Promotion-gate triage for tomorrow:** strategies advancing through the lifecycle.
- **Research priority for overnight:** queue 5–10 backtests / training runs on research compute.
- **Hand-off:** depending on shift coverage, hand off to Asia-session supervisor or rely on automated supervision overnight. Confirm fleet is in expected state.

### Cadence variations

- **Crypto-event-heavy weeks** (FOMC week, CPI day, ETF flow announcements, exchange security incidents) — supervision-heavy; less research time.
- **Quiet weeks** — research-dominated; the strategies run themselves and Marcus invests in alpha-generation.

## Differences from the Manual Mode

| Dimension            | Manual Marcus                | Automated Marcus                                                   |
| -------------------- | ---------------------------- | ------------------------------------------------------------------ |
| Coverage             | 3–5 instruments hand-watched | 200+ instruments × 5–8 venues × multiple horizons                  |
| Trades per day       | 5–30 high-conviction         | Thousands across the fleet                                         |
| Phase 1 (Decide)     | Reading a chart              | Choosing alpha to research; managing portfolio of strategies       |
| Phase 2 (Enter)      | Click ticket                 | Promote strategy through lifecycle gates                           |
| Phase 3 (Hold)       | Watching positions           | Anomaly-driven supervision of fleet                                |
| Phase 4 (Learn)      | Journaling lessons           | Decay tracking, retraining, attribution-driven research priorities |
| Time on charts       | 80%                          | 10% (mostly diagnostic, not generative)                            |
| Time on research     | 5–10%                        | 60–70%                                                             |
| Time on supervision  | 10–15%                       | 15–20%                                                             |
| Time on intervention | (continuous)                 | 5–10%                                                              |
| Latency criticality  | Visible per venue            | Per-strategy-class latency tiers, with budget enforcement          |
| Risk units           | $-notional + greeks          | Same + per-strategy DV01-equivalent + correlation cluster          |
| Edge metric          | P/L, Sharpe                  | P/L, Sharpe, decay rate, capacity utilization, marginal Sharpe     |
| Cognitive load       | Foveal-on-position           | Peripheral-on-fleet; foveal-on-research-or-anomaly                 |

The fundamental change: **Marcus stops being the worker and becomes the principal investor in his own quant fund.**

## How Marcus Coordinates with Quinn and David

- **Quinn** — Quinn's fleet runs cross-archetype factor / stat-arb strategies that may overlap with Marcus's. They coordinate to avoid double-up; correlation matrices visible to both. Quinn's promotion gates and Marcus's run on the same lifecycle infrastructure; David sees both fleets aggregated.
- **David** — David sees Marcus's automated cousin as a fleet of 300+ strategies with a defined risk budget. David's surfaces (firm-wide risk, capital allocation, cross-trader correlation, behavioral monitoring) include the automated fleets. Material allocation changes route to David. Catastrophe kill switches are firm-level (multi-key); Marcus has fleet-level kill but firm-wide kill is David + CIO + risk officer.
- **Julius** — adjacent desk; cross-domain strategies (CeFi-DeFi basis, funding-vs-borrow) may have legs with both. Coordination is operational: who owns which leg, how attribution is split.

## How to Use This Appendix

When evaluating Marcus's automated terminal (against our own platform), walk through:

- **Data layer:** are all the crypto-CeFi data sources (tick-level OB, funding archives, liquidation events, OI, ETF flows, stables) cataloged with quality / lineage / cost / freshness?
- **Feature library:** are the Marcus-specific features (funding-z, basis curvature, OI-quadrant, liquidation proximity, CVD-divergence, lead-lag spread) first-class with drift monitoring?
- **Research workspace:** can Marcus go from idea to validated strategy in hours, with templates, real backtest engine, walk-forward, and reproducibility?
- **Strategy templates:** are basis-arb / funding-harvest / cross-venue-leadlag / cluster-fade compositions provided as starting kits?
- **Strategy fleet view:** can he supervise 300+ strategies anomaly-driven, grouped by class / venue / instrument, with crypto-specific columns?
- **Latency tiering:** are microstructure-fast strategies running at sub-100ms with co-located execution, while tactical strategies tolerate second-level?
- **Per-venue balance management:** is auto-rebalance across venues a first-class operational tool?
- **What stays human:** does the platform make Marcus's judgment calls (venue-policy interpretation, regime-shift recognition, override) higher-leverage rather than getting in the way?
- **Daily rhythm:** can Marcus actually spend 60–70% of his time on research while the fleet runs supervised in the periphery?
