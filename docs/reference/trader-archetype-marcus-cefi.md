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

See [News &amp; Research Feed](common-tools.md#13-news--research-feed) for the shared news framework.

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

This appendix describes Marcus's terminal and daily workflow once his edge is encoded into models and rules running at scale — what he does, what he sees, and what stays human. The manual sections above describe Marcus at his desk hand-watching three instruments. This appendix describes the same Marcus running 300+ strategy instances across the entire crypto market.

The strategy logic itself (what models, what features, what rules — the actual alpha) is out of scope. This appendix is about **the terminal he works in**: every surface he sees, every panel, every decision he makes, every workflow that supports him.

For the universal automated-trading platform concepts this builds on, see [automation-foundation.md](automation-foundation.md).

Marcus is the cleanest case in the heavily-automatable tier. His edge — basis, funding, microstructure, cross-venue lead-lag, momentum and mean-reversion on liquid pairs — translates directly into rules and models. With automation, his coverage scales from a handful of instruments hand-watched to hundreds of instruments × 5–8 venues × multiple horizons running continuously, with him acting as the principal investor in his own quant fund.

> _Throughout this appendix, examples are illustrative — actual venue lists, strategy IDs, dataset names, feature names, and metrics shown are sample shapes to make the surfaces concrete. The platform's real catalog will differ._

## 1. What Marcus's Edge Becomes

His manual edge encoded as automated **strategy classes**, each spawning many **strategy instances** across instruments, venues, horizons, and parameter profiles.

- **Basis arb** — long spot + short perp atomic, capturing the basis premium with auto-flatten near funding settlement. Hundreds of instances across instruments × venues. Reverse direction when basis flips negative.
- **Funding harvest** — short perp during sustained funding-extreme regimes (z-score thresholded), auto-flatten before regime flip. Dozens of instances per asset class. Hedged variants (cross-venue funding spread) and unhedged variants (directional bet on funding mean-reversion).
- **Cross-venue lead-lag** — when one venue prints first on Asian-led or US-spot-ETF-led flow, fade the laggard. Microstructure-fast (sub-100ms decision). Different parameters for different venue pairs.
- **Liquidation-cluster fade / chase** — strategies that trade _into_ known liquidation clusters with cascade-ride sizing or _fade_ exhaustion after a cascade prints.
- **OI-divergence trades** — quadrant-based: price up + OI up (ride longs); price up + OI down (fade short cover); price down + OI up (ride shorts); price down + OI down (fade long capitulation). Mechanical signal-following with regime overlays.
- **Cross-instrument basis** — perp-vs-dated-future calendar arb, especially around expiry rolls. Quarterly cadence.
- **Volatility-of-funding mean-reversion** — when funding vol spikes relative to its rolling distribution, mean-revert; when it compresses, momentum.
- **Whale-tape signal strategies** — large-print follow-through or fade based on aggregator-classified flow direction.
- **Cross-asset correlation strategies** — BTC / ETH / SOL relative-value when correlation regimes shift.
- **Stablecoin-flow strategies** — exchange-netflow-driven directional / mean-reversion bets on majors.

Each strategy class has 5–50 live instances at any time (different instruments, venues, horizons, parameter profiles). Total fleet: ~300 strategies, scaling to ~500+ as new alpha is discovered and old alpha decayed.

Marcus's day is no longer "find a great trade." It is "make sure the firm's capital is deployed across all of these strategies at correctly-sized scale, supervise for decay, retire what's broken, push new alpha." The terminal must support this scale-up without forcing him to manually touch each instance.

## 2. What Stays Marcus

The platform automates execution and signal-generation. What stays him:

- **Venue-policy interpretation.** Binance announces a perp-leverage rule change, an instrument delisting, a funding-formula change. The platform notices the announcement (regulatory / venue news feed) and flags affected strategies. Marcus interprets the second-order implications — does this kill the funding-harvest fleet on this instrument? Does it open new cross-venue arb? Does it require reparametrization or full retire?
- **Regime-shift recognition.** When the structural assumption underlying a strategy class breaks — a venue closes Asia-only access; a major stablecoin starts to wobble; an exchange custodian fails — Marcus's intuition leads the model's drift detector by hours to weeks. He pulls back exposure before the metrics confirm.
- **New strategy invention.** "I noticed funding behavior changes around mid-month perp settlements; let me model that." Idea origination is human; the platform makes it cheap to test.
- **High-conviction directional override.** When Marcus has a strong macro view (an ETF-flow regime change, a Fed-day catalyst, a China policy event), he can layer a directional trade on top of the systematic book — explicitly tagged as override, audited as such.
- **Counterparty risk decisions.** Adding a new venue, sizing exposure to a venue under stress, evaluating new wrapped-asset issuers, pulling capital from a venue with custody concerns — all human.
- **Catastrophe response.** Exchange security incident, stablecoin depeg in real time, mass-liquidation cascade, oracle deviation: the first 60 seconds of judgment beat any pre-coded response. Marcus's role is rapid triage; the platform's role is to make triage actionable (one-click fleet-pause-by-venue, one-click flatten-all-USDC-exposure, etc.).
- **Strategic capital allocation across his own desk.** The allocation engine proposes; Marcus approves or modifies. Material reallocations (more to basis-arb fleet at expense of liquidation-cluster fleet) are decisions, not optimizations.
- **Cross-domain coordination.** When Julius's CeFi-DeFi strategies overlap with Marcus's CeFi strategies, capacity decisions, attribution splits, and cross-leg timing are negotiated across desks.

The platform is opinionated about what to automate and humble about what cannot be. Marcus's judgment surfaces are made higher-leverage by automation — not bypassed.

## 3. The Data Layer for Marcus

The data layer is the substrate of everything Marcus does in automated mode. Without a serious data layer, no model is reliable, no feature is reproducible, no strategy is auditable. Marcus interacts with the data layer constantly — when researching new alpha, when diagnosing a misbehaving strategy, when evaluating a new licensable feed, when proposing a procurement.

### 3.1 The Data Catalog Browser

Marcus's home page when he opens the data layer is the catalog browser. A searchable, filterable list of every dataset the firm has, scoped to what's relevant for crypto-CeFi work.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: data type (orderbook / trades / funding / OI / liquidations / on-chain / ETF flows / news / social / fundamentals); cadence (real-time / 5-min / 1h / EOD / static); license tier (premium / standard / public); cost band (free / sub-$10k / $10k–$100k / $100k–$1M / $1M+); coverage (per asset class).
- **Main panel** — table of datasets matching filters. Columns: name, source / vendor, coverage summary (e.g. "Binance perps + spot, 2017–present, 47 instruments"), cadence, freshness indicator (green / amber / red — staleness vs SLA), license terms (e.g. "redistributable: no; client-report-safe: no; firm-internal-only"), annual cost, owner, last-updated.
- **Right pane** — when a dataset is selected: full description, schema, sample rows, lineage graph (where it comes from upstream, what consumes it downstream), quality history, license document link, procurement notes, "click to add to a notebook" button.

**Search** — free-text across names + descriptions + schema fields. "tardis funding" jumps to Tardis funding-rate datasets; "binance perp 1m candles" finds the right granularity.

**Quick actions** — bookmark a dataset, request access to a restricted dataset, propose a procurement evaluation, flag an issue.

### 3.2 Marcus's Core Datasets (Illustrative)

A senior crypto trader's data footprint at a top-5 firm spans dozens of feeds. Examples of what Marcus's catalog tier likely contains:

- **Tick-level orderbook archives.** Tardis (full snapshot history across 30+ venues), Kaiko (institutional-grade tick + L2), native venue archives (Binance / Bybit / OKX / Coinbase) for cleanliness verification. Petabyte-scale; query against a distributed compute cluster, not the trader's machine.
- **Funding-rate archives.** Per venue, with venue-native delivery times and historical formula changes preserved (Binance changed its funding-rate formula several times; the catalog preserves which formula applied to which historical period).
- **Liquidation event feeds.** Per venue (where venues publish), with size, side, instrument, time-since-prior, cluster-attribution.
- **Open interest history.** Per venue, per instrument, snapshots at native cadence.
- **Trade tape.** Every print, with venue, size, side (buy / sell aggressor), instrument, microsecond timestamps where the venue exposes them.
- **Cross-venue mid / mark price archives.** For lead-lag analysis, divergence z-scoring, and execution-quality measurement.
- **On-chain ETF flow data.** Daily creates / redeems for spot BTC and ETH ETFs (BlackRock, Fidelity, Bitwise, Grayscale, Ark, etc.). Glassnode / CoinShares / on-chain filings as sources.
- **Stablecoin flow data.** USDT / USDC / DAI mint / burn / on-chain transfers, exchange in-flow / out-flow per venue. Drives a meaningful "dry powder" indicator.
- **Whale-wallet trackers.** Nansen, Arkham, on-chain entity attribution. For large-print correlation with whale-wallet movements.
- **Macro tickers.** DXY, US 10Y yield, SPX futures, gold, VIX, MOVE — minute-level via standard market-data vendors.
- **News and social.** Reuters / Bloomberg / sector trade press feeds; curated Twitter/X lists; Telegram syndicate feeds (where compliance permits).
- **Venue announcements.** Native venue announcement feeds (instrument additions / removals, leverage changes, funding-formula changes, custody changes) — typically scraped from venue communication channels.

Each dataset's record in the catalog shows: license terms, cost, coverage, freshness, lineage, used-by (which features and strategies depend on it), incident history.

### 3.3 Data Quality Monitoring

Every live dataset has continuous quality monitoring. Marcus sees this as a heatmap on his catalog, with a dedicated **Quality Console** for deeper investigation.

**Per-dataset quality dimensions:**

- **Freshness** — time since last update vs SLA. Color-coded.
- **Completeness** — null rate per field, gap detection across time series.
- **Schema stability** — has the source's schema changed? Field added / removed / typed differently?
- **Distribution drift** — has the statistical distribution of values shifted recently? (Useful for catching a broken feed early — a venue accidentally publishing 10x stale prices, for instance.)
- **Cross-source consistency** — when multiple sources report on the same underlying (e.g. Tardis vs. Kaiko both archive Binance perps), do they agree? Disagreement flags.
- **Cost / volume** — query volume against quota, $ spent month-to-date, projected cost for queued workloads.

When something degrades, the dataset's owner is paged (not Marcus directly — owners are the data-engineering team or vendor-management). Marcus sees the impact: which of his strategies depend on this dataset, what's their state, should he intervene.

### 3.4 Lineage Navigator

Every dataset has an upstream lineage (where the data comes from) and a downstream lineage (which features and strategies consume it). The lineage navigator is a graph view Marcus opens when:

- A strategy is misbehaving and he wants to trace back to the source data.
- A vendor announces a feed change and he wants to see impact scope.
- A feature is being deprecated and he wants to confirm no strategy depends on it transitively.

**The graph:**

- Nodes are datasets, features, models, strategies.
- Edges are dependencies (a feature consumes a dataset, a model consumes features, a strategy consumes a model).
- Color-coded by health (live / degraded / failed).
- Click any node to open its detail page; right-click for "show all downstream" or "show all upstream."

This is a power-user tool used during diagnostic work, not constantly.

### 3.5 Procurement Dashboard

Data licenses are a major P&L line item; a senior trader is expected to be sharp on cost-vs-attribution. The procurement dashboard:

- **Active licenses** — every paid feed with annual cost, renewal date, contract terms, owner of the renewal decision.
- **Trial / evaluation feeds** — ones currently being POC'd, with deadlines and evaluation criteria.
- **Wishlist** — feeds Marcus or his peers have flagged as "want," with rationale and expected uplift.
- **Cost attribution** — for each licensed feed, a rough P/L attribution: which strategies depend on it, and how much P/L those strategies have generated. Crude but useful.
- **Renewal calendar** — what's coming up for renegotiation, with auto-prompt to review usage + attribution before signing.
- **Decision log** — past procurement decisions with rationale, useful for institutional memory.

Marcus contributes to procurement decisions especially around crypto-native feeds (a new on-chain analytics provider, an alternative to Tardis, a sentiment feed). Major procurements (>$500k/year) escalate to David / firm-level.

### 3.6 Gap Analysis Surface

The most underrated data-layer surface. The platform identifies gaps:

- **Universe coverage** — Marcus's strategies trade ~200 instruments; the catalog tells him which ones are _not_ fully covered (e.g. an exotic perp on a venue where Tardis doesn't archive yet).
- **Feature gaps** — features in the library that depend on missing or stale data, blocked from production deployment.
- **Competitor signals** — based on industry intel and feature-attribution gaps in his own backtests, the platform suggests "feeds your competitors likely have that we don't" (e.g. a specific options-flow feed, a satellite-imagery cross-asset feed).
- **Backfill gaps** — historical data missing for certain periods, which would block walk-forward backtesting on those periods.

Gap analysis is not aspirational — it's tied to concrete strategies that can't be deployed or features that can't be computed. Closing a gap is a procurement decision with a defined ROI estimate.

### 3.7 Interactions Marcus has with the data layer

Concrete daily / weekly / monthly:

- **Daily (background):** quality monitor in peripheral; auto-alerts for degradation. Marcus glances at the catalog occasionally during research.
- **Weekly:** procurement / wishlist review; reading data-team release notes (new datasets onboarded, schema changes).
- **Monthly:** cost / attribution review; renewal-decision triage; gap-analysis review with the data team.
- **Ad hoc (during research):** querying the catalog when starting a new strategy idea — what data do I have to test this?
- **Ad hoc (during a strategy issue):** lineage navigator from the misbehaving strategy back to source data.
- **Ad hoc (during an incident):** when a vendor degrades, the impact-scope view tells Marcus exactly which strategies are at risk and what to pause.

### 3.8 Why this matters for efficiency, risk, and PnL

- **Efficiency:** Marcus does not waste hours figuring out what data exists or where to query it. The catalog is one click. Every feature he builds is reusable; the next strategy starts ahead of where the last one ended.
- **Risk:** quality monitoring catches feed degradation before P/L does. Lineage navigation makes incident triage minutes-fast instead of hours-slow. Compliance enforcement (license terms, restricted-list exposure) is automatic, not Marcus-remembers-to-check.
- **PnL:** procurement decisions are evidence-driven. Marcus does not pay $500k/year for a feed his strategies don't use; he does aggressively license a $200k/year feed that opens an alpha class worth $5M/year. Gap analysis surfaces uncaptured alpha in licensable form.

## 4. The Feature Library for Marcus

A feature is the unit of alpha-vocabulary. Features are engineered transformations of raw data — funding-rate z-scores, basis curvature, OI quadrants, liquidation-cluster proximities — that models and rules consume. The feature library is where Marcus spends much of his research time, because feature engineering is where domain expertise meets ML.

The library is shared across the firm; features Marcus builds are visible to Henry, Sasha, Quinn, and others (with appropriate permissions). Likewise, Marcus consumes features built by other desks where they apply to crypto. Cross-pollination is a real value — Henry's earnings-surprise-velocity feature might inform a Marcus strategy around major-coin upgrade events, for instance.

### 4.1 The Feature Library Browser

Marcus's home page when he opens the feature layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: domain (funding / basis / OI / liquidation / microstructure / on-chain / macro / cross-asset / sentiment); cadence (tick / 1s / 1m / 1h / EOD); compute cost (cheap / moderate / expensive — flagged for budget-aware research); used-by-strategy (which features feed a live strategy I care about); owner / desk; quality tier (production-grade / beta / experimental); freshness (live / stale / failed).
- **Main panel** — table of features matching filters. Columns: name, version, owner, description (one line), inputs (upstream features and datasets, summarized), distribution-state indicator (in-distribution / drifting / failed), used-by count, last-modified, performance proxy (median Sharpe of strategies using it — rough but useful for prioritizing research).
- **Right pane** — when a feature is selected: full description, code link, lineage graph, distribution monitor (rolling histogram + comparison to training distribution + drift score), incident history, "show me strategies using this feature" link, "test this feature in a notebook" button.

**Search** — free-text across names, descriptions, code. "funding z-score" finds variants across windows; "liquidation proximity" finds Marcus's and any cross-desk equivalents.

**Quick actions** — bookmark a feature, fork a feature into a personal experimental version, propose a new feature, flag drift.

### 4.2 Marcus's Core Features (Illustrative)

Examples of features Marcus has built or consumes — actual library will differ.

**Funding-driven:**

- `funding_zscore_8h_binance_perp` — 8-hour funding rate, z-scored against rolling 30d distribution per instrument. Multiple windows (8h / 24h / 7d).
- `funding_zscore_term_structure_curvature` — curvature of the implied funding-rate term structure (current vs 8h-implied vs 24h-implied) per instrument.
- `cross_venue_funding_spread_zscore` — funding-rate divergence between Binance and (Bybit / OKX / dYdX / Hyperliquid), z-scored.
- `funding_volatility_regime` — categorical regime indicator for funding-rate volatility (compressed / normal / expanded), per instrument.
- `funding_settlement_proximity` — minutes until next funding settlement (entry / exit timing).

**Basis-driven:**

- `spot_perp_basis_bps_per_venue` — current basis in bps and annualized.
- `basis_term_structure_curvature` — short vs mid vs far basis dynamics for futures + perps.
- `basis_volatility_regime` — basis volatility regime, similar to funding-vol regime.
- `cross_venue_basis_spread` — Binance basis vs Bybit basis on the same underlying.

**OI-driven:**

- `oi_change_1h / 4h / 24h` — OI delta in absolute and percentage.
- `oi_price_quadrant_flag` — categorical: new-longs / short-cover / new-shorts / long-capitulation. Fed by signed OI delta + signed price change.
- `oi_concentration_zscore` — when one venue's OI grows disproportionately to others, signal.

**Liquidation-driven:**

- `liquidation_cluster_proximity` — distance to nearest cluster of size > X, weighted by total cluster size.
- `recent_liquidation_volume_zscore` — recent liquidations vs rolling distribution.
- `liquidation_imbalance` — long-vs-short liquidation skew over recent window.

**Microstructure-driven:**

- `cvd_divergence_zscore_per_venue` — CVD divergence vs price, z-scored.
- `cvd_cross_venue_divergence` — CVD on Coinbase vs CVD on Binance, lagged.
- `cross_venue_lead_lag_spread` — Coinbase mid vs Binance mid at multiple lag windows.
- `large_print_intensity` — frequency / size of prints above $1M threshold, per venue.
- `aggressor_imbalance` — taker buy vs taker sell, z-scored.

**On-chain crossover:**

- `etf_netflow_24h` — daily ETF creates minus redeems, $.
- `stablecoin_exchange_inflow` — USDT / USDC moving onto major exchanges, $.
- `whale_wallet_activity` — large on-chain transfers from tracked entities.

**Cross-asset / macro:**

- `btc_dxy_correlation_30d` — rolling correlation, regime indicator.
- `btc_spx_correlation_30d` — rolling correlation, regime indicator.
- `vix_regime` — equity vol regime for cross-asset risk-on/off context.

**Regime indicators:**

- `crypto_vol_regime` — composite (BTC realized vol + funding vol + IV from Deribit), categorical.
- `liquidity_regime` — depth-at-mid + spread proxy, categorical.
- `correlation_regime` — intra-crypto correlation cluster state.

These features form Marcus's reusable vocabulary. A new strategy he builds picks from this library and combines them. He builds new features when the existing vocabulary doesn't capture an idea.

### 4.3 Feature Engineering Surface

Building a new feature is itself a workflow. The platform supports it inline in the research workspace (next section) but also exposes a structured form for the publication step.

**The workflow:**

1. **Idea phase (notebook):** Marcus writes the feature definition in Python in his notebook, tests it on real historical data, inspects shape / distribution / sample values.
2. **Quality gates:** before publishing, the platform runs automated checks — null rate within threshold, outlier rate within threshold, schema validation, computability across the universe of instruments the feature claims to cover.
3. **Metadata extraction:** the platform auto-generates metadata — lineage (extracted from the code, traced to upstream features and datasets), distribution baseline (computed on full backfill), compute cost (benchmarked across a sample), update cadence (declared by Marcus, validated against the upstream).
4. **Code review:** required for live-trading features (production-grade tier). A peer or Quinn's team reviews the code; suggestions inline.
5. **Publication:** the feature gets a canonical name, a version (semantic + content hash), and is registered. Now usable by any strategy.
6. **Backfill:** the feature is computed across history (parallelized on the firm's compute), so old strategies can be retrained with it.
7. **Live deployment:** the feature is now computable on demand at its declared cadence; live strategies can subscribe.

**The form (schema-style UI):**

- Name (canonical, with strict naming convention).
- Description (one paragraph; what the feature captures and when it's useful).
- Owner.
- Inputs (selected from existing features / datasets, or declared as new dependencies).
- Code (link to repository commit; review status).
- Cadence and freshness SLA.
- Universe (which instruments it applies to; can be parametric).
- Tags (taxonomy).
- Documentation notes (regimes where it's known to break, expected lifecycle).

### 4.4 The Drift Dashboard

Live features drift; some quietly, some violently. Marcus's drift dashboard surfaces the worst offenders.

**Layout:**

- **Top panel** — feature drift heatmap: features (rows) × time (columns), cells colored by drift score. Sortable by current drift, by trend, by impact (downstream P/L at risk).
- **Triage queue** — top features needing action: drifted significantly, with their downstream strategies listed.
- **Detail pane** — for a selected feature, the time series of its distribution drift, the downstream models / strategies affected, and suggested actions (retrain affected models, recalibrate the feature, deprecate it).
- **Acknowledgments log** — drifts Marcus has reviewed and explicitly accepted (because he understands the regime cause), with reason logged.

This is one of the most-checked surfaces during diagnostic work. A misbehaving strategy → drift dashboard for its features → identify the broken upstream → decide on retrain / recalibrate / pause.

### 4.5 Cross-Pollination View

Features built by other desks that might apply to Marcus's domain.

**Suggested-similar widget** — when Marcus opens a feature, a sidebar shows features built by other desks with similar inputs or similar tags. "Henry's earnings-surprise-velocity feature uses event-window analysis you might apply to fork events."

**Trending features across desks** — what's being built / used most across the firm right now. Often a leading indicator of where alpha is being found.

**Feature-of-the-week** — a curated highlight from another desk; a cheap way to keep current with cross-desk research.

This surface is light-touch; not foveal but useful background.

### 4.6 Interactions Marcus has with the feature library

- **Daily (background):** drift dashboard glance during morning fleet review; alerts route to him for features feeding his amber/red strategies.
- **Weekly:** browse cross-pollination view; identify candidate cross-desk features to evaluate.
- **Ad hoc (during research):** browse + search for features matching a thesis; often the first move on a new strategy idea is "what features are already in the library that test this?"
- **Ad hoc (during feature engineering):** the engineering surface, primarily in the notebook with the publication form for the formal step.
- **Ad hoc (during retire):** when a feature is being deprecated (perhaps because its upstream data is being delicensed), Marcus reviews downstream impact and decides on replacement.

### 4.7 Why this matters

- **Efficiency:** Marcus does not rebuild "funding z-score on Binance" 14 times in 14 different notebooks. He picks it from the library, parameterizes if needed, and builds on it. Time-to-strategy-prototype drops from days to hours.
- **Risk:** drift is monitored continuously. A model trained on one regime breaks silently when its features shift; the dashboard catches this before P/L does. Per-feature versioning means retraining doesn't accidentally use a different feature definition than the original training run.
- **PnL:** features are reused across strategies. A high-quality feature (Sharpe-uplift positive across many strategies) generates compounding return. Cross-pollination across desks accelerates discovery — the firm's combined feature output is strictly more than the sum of per-desk outputs.

## 5. The Research Workspace

The research workspace is where Marcus turns raw data and features into validated strategies. It is his primary working surface during research-heavy hours — which, in automated mode, is most of the day.

### 5.1 Notebook Environment

The workspace is notebook-first (Jupyter-style) with a full IDE option for traders who prefer that mode.

**Layout (sketch):**

- **Left sidebar** — file tree (Marcus's notebooks, shared workspaces, scratch); platform integrations (data layer search, feature library search, model registry browse, experiment tracker, strategy templates); kernel state.
- **Main panel** — the active notebook (cells: code, markdown, output). Standard Jupyter UX with platform extensions.
- **Right sidebar** — context panel (depends on what the cell is doing): for a data query, shows the dataset metadata + sample; for a feature reference, shows feature metadata + drift state; for a backtest run, shows results streaming in.
- **Bottom panel** — terminal / cell output / experiment-tracker auto-log of this notebook's runs.

**Critical platform integrations:**

- **One-line data access.** `df = data.load("binance.btcusdt.perp.funding", since="2020-01-01")`. No SQL fumbling; the catalog is queryable via Python.
- **One-line feature retrieval.** `funding_z = features.get("funding_zscore_8h_binance_perp", instruments=["BTCUSDT", "ETHUSDT"], since="2022-01-01")`.
- **One-line model loading.** `model = models.get("marcus.basis_arb_lgbm", version="2.4.1")`.
- **One-line backtest.** `result = backtest(strategy=my_strategy, data=hist, period="2022-01-01:2024-06-30")`.
- **One-line plotting.** Platform helpers for equity curves, drawdown shading, attribution decomposition, surface plots.
- **One-line experiment registration.** Backtests and training runs auto-register in the experiment tracker; Marcus can annotate inline.

**Compute attached to the kernel:**

- The kernel runs on research compute, not Marcus's laptop. Dataset size doesn't matter; GPU is available when needed; his machine doesn't melt under a hyperparameter sweep.
- CPU / RAM / GPU allocation visible inline; switch tier with a one-click upgrade (with cost preview).

**Persistence and collaboration:**

- Notebooks persist per user.
- Shared workspaces for desk collaboration (Marcus + Julius working together on a CeFi-DeFi basis trade prototype).
- Real-time collaboration (Google-Docs-style) for paired research.
- Version control native: every save is committed.

### 5.2 Backtest Engine UI

The single most-used surface in the research workspace.

**Layout when running a backtest:**

- **Form panel** — strategy selector (a saved composition or notebook-defined), data window, instruments, venues, parameter overrides, execution model parameters (slippage curves, fee schedule, latency model).
- **Live progress** — "1.2 of 5.0 years simulated, 32% complete, ETA 3 min." Cancel button.
- **Streaming results** — equity curve building bar by bar, slippage attribution, recent fills tape. Marcus can watch backtest behavior unfold or close the tab and check back.
- **Final results page (when complete):**
  - Summary metrics — Sharpe, Sortino, Calmar, max drawdown, hit rate, expected shortfall, capacity estimate.
  - Equity curve with drawdown shading; benchmark overlay.
  - Per-trade attribution histogram.
  - Slippage breakdown — assumed vs realized, by venue, by size bucket.
  - Regime-conditional performance — Sharpe in vol-high vs vol-low, in trending vs chop, in pre-FOMC vs post-FOMC.
  - Sensitivity analysis — parameter perturbation effect on Sharpe (small perturbations should not catastrophically change result).
  - Robustness checks — out-of-sample, walk-forward, bootstrap CI on Sharpe.
  - Auto-flagged warnings — lookahead detected; survivorship bias risk; in-sample tuning detected.

**Realistic execution simulation is mandatory.** Slippage curves derived from historical depth, fee schedules with VIP-tier applied, latency model per venue, partial fills based on queue position estimation, MEV cost where on-chain (less for Marcus, more for Julius). The same execution code runs in live trading as in backtest — divergence between paper and live is rare and investigated.

### 5.3 Walk-Forward Visualization

Walk-forward backtest is the default; the visualization is critical for honest evaluation.

**Layout:**

- **Top:** equity curve broken into training-window and test-window segments, color-coded.
- **Middle:** Sharpe per test window with confidence interval bars.
- **Bottom:** parameter-stability check — were the parameters consistent across rolling windows, or did they jitter (sign of overfitting to training).
- **Side:** out-of-sample Sharpe summary, in-sample Sharpe summary, generalization gap.

If the in-sample Sharpe is 2.5 and the out-of-sample is 0.5, the model is overfit; the visualization makes this stark.

### 5.4 Strategy Template Library

A library of pre-built strategy compositions Marcus starts from. Reduces time-to-first-strategy from days to hours.

**Examples (illustrative):**

- **Basis arb template.** Long spot + short perp atomic, parameterized by basis-z entry threshold, basis-z exit threshold, max position size, auto-flatten window before funding settlement, leg-level slippage tolerance.
- **Funding harvest template.** Short perp during sustained funding-extreme, parameterized by funding-z threshold, hold-time, exit conditions (regime flip / opposite-extreme / time-out), hedge variant (cross-venue funding spread or unhedged).
- **Cross-venue lead-lag template.** Identifies leading and lagging venues for a given instrument, fades the laggard with parameterized lag thresholds and entry / exit logic.
- **Liquidation-cluster fade template.** Sit ahead of a known cluster, take short or long bias depending on price approach direction.
- **OI-divergence template.** Quadrant-driven entry, mean-reversion exit, regime gating.
- **Momentum / mean-reversion template.** Standard signal, parameterized for vol regime.

Marcus's day starts at a template and customizes from there. Many of his ~300 live strategies are instances of one of ~15 templates with parameter profiles tuned per asset class.

### 5.5 Compute Management

Senior researchers constantly run compute-heavy work — hyperparameter sweeps, walk-forward backtests, model training. Compute management is a real surface.

- **Active jobs panel** — Marcus's running jobs with progress, ETA, cost-so-far, cancel buttons.
- **Queued jobs panel** — submitted but waiting (e.g. overnight runs).
- **Cost dashboard** — month-to-date compute spend, by job type, with budget guardrails.
- **GPU/cluster availability** — when can a big training job run, vs. when the cluster is busy.
- **Result archive** — completed jobs with their experiment-tracker entries.

Long-running jobs require explicit confirmation (a 4-hour A100 sweep prompts before launching). Cost is always visible. The trader does not manage VMs or queues — they request work; the platform delivers.

### 5.6 Anti-Patterns the Workspace Prevents

- **Untracked data pulls.** Every query logs lineage; nobody can secretly bake test-set data into a "training" notebook.
- **Untracked feature definitions.** A feature defined in a notebook and never published is suspect; the platform prompts to publish or formally archive.
- **Lookahead bias.** The backtest engine refuses to use future data; warnings if the trader tries.
- **Survivorship bias.** Backtests run on the as-of universe (delisted instruments preserved), not today's roster.
- **In-sample tuning masquerading as out-of-sample.** Walk-forward forces honest splits; manual "let me just check this period" is logged and counted toward multiple-testing penalty.
- **Reproducibility gaps.** A notebook that can't be re-run from scratch (mutable state, local files, undocumented config) is flagged.

### 5.7 Interactions Marcus has with the workspace

- **Pre-market:** review overnight backtest / training results; pick winners for further work.
- **In-market (research-heavy hours):** active in the workspace; new strategy ideas, feature engineering, retraining.
- **Diagnostic (when alerted):** pull a misbehaving strategy into the workspace, replicate the issue, diagnose, fix, redeploy.
- **Post-market:** queue overnight jobs.

### 5.8 Why this matters

- **Efficiency:** time-to-validated-strategy compresses from weeks to hours. Senior researchers cite this loop's friction as the dominant productivity driver.
- **Risk:** anti-patterns (lookahead, survivorship, p-hacking) are caught by the platform, not by Marcus's discipline. Silent overfit shipping to production is the platform's most expensive failure mode; the workspace is the first defense.
- **PnL:** more validated alpha per quarter. Compounded over years, the difference between a good research workspace and a mediocre one is dozens of percent of fund return.

## 6. The Model Registry

Models are the executable form of Marcus's edge. The registry catalogs every model the firm has trained, with full reproducibility guarantees. Whether a gradient-boosted tree predicting funding-rate mean-reversion or a transformer predicting cross-venue lead-lag, every model is a first-class object with identity, training data hash, hyperparameters, performance, and deployment status.

### 6.1 The Model Registry Browser

Marcus's view when he opens the model registry.

**Layout:**

- **Left sidebar** — taxonomy filters: model class (gradient-boosted / linear / neural / custom rule-set); domain (basis / funding / OI / etc.); owner; deployment status (research / paper / pilot / live / monitor / retired); performance band; drift state.
- **Main panel** — table of models. Columns: name, version, owner, model class, training date, OOS Sharpe (with CI), deployment count, drift status, last-modified.
- **Right pane** — when a model is selected: the model record (next subsection).

### 6.2 The Model Record Page

Per model, the canonical record:

- **Identity:** model ID, version (semantic + content hash), name, description, owner, code commit of training pipeline.
- **Lineage:** training data hash, feature set with versions, hyperparameters, label definition, training command. Reproducibility guaranteed: rerun-from-registry produces a bit-identical model, or the platform flags drift if data lake changed.
- **Training metadata:** training date, duration, compute used (CPU-h, GPU-h), $ cost, hardware.
- **Performance — multiple regimes:**
  - In-sample Sharpe / hit rate / Brier / RMSE (whatever's appropriate).
  - Out-of-sample on hold-out.
  - Walk-forward Sharpe with confidence interval.
  - Per-regime conditional performance (vol-high / vol-low, etc.).
  - Capacity estimate.
- **Lineage graph:** parent (if fine-tuned / retrained), children, siblings (sister models from the same experiment).
- **Deployment state:** which strategies use which version, in which environments. Map: model version → strategy version → live capital.
- **Drift state:** input-distribution drift, prediction-distribution drift, performance vs expectation.
- **Documentation:** explainability cards (feature importance, partial-dependence plots, SHAP-style attribution), known failure modes, regime fit notes.
- **Action panel:** "retrain with new data," "deploy to paper," "deprecate," "fork into a new variant."

### 6.3 Versioning & Immutability

- **Semantic versioning** for trader-meaningful changes (e.g. 2.4.1 = major.minor.patch).
- **Content hash** for guaranteed reproducibility — any change in code / data / hyperparameters yields a new hash.
- **Old versions never deleted.** A retired model is still in the registry, retrievable, redeployable.
- **Promotion path:** model is registered (research) → validated (paper) → deployed (live with strategy attached). Each transition auditable.
- **Rollback:** any prior version can be re-deployed in one click; promote / rollback is a controlled operation.

### 6.4 Drift Surface for Models

Distinct from feature drift (covered in section 4), model drift focuses on the model's _outputs_.

- **Prediction-distribution drift** — has the model's prediction distribution shifted vs. its training-time distribution? KS-test, PSI, custom metrics.
- **Performance drift** — is the model's realized accuracy / Sharpe contribution diverging from backtest expectation?
- **Calibration drift** — for probabilistic models, are the predicted probabilities still well-calibrated against realized outcomes?

Drift triage queue: top models by drift score, with their downstream strategies. Click a row → suggested actions (retrain, recalibrate, replace, retire).

### 6.5 Lineage Graph

Per model, a visual graph:

- Upstream: training data → features → model.
- Downstream: model → strategies → P/L.
- Sister versions: prior versions of this model, with deltas highlighted.

Used during diagnostic work and during model deprecation (impact-of-change).

### 6.6 Why this matters

- **Efficiency:** Marcus does not waste hours trying to reconstruct what a strategy is running on. The registry says: this strategy uses model X v2.4.1, trained on data hash Y, with hyperparameters Z. Diagnostic loop closes fast.
- **Risk:** without the registry, the firm cannot answer regulator / auditor / risk-committee questions about what's deployed. Reproducibility is non-negotiable; the registry is the system of record.
- **PnL:** retraining cadence is data-driven, not gut-driven. Decay is measured per model; retire decisions are evidence-based.

## 7. The Experiment Tracker

Most research is failed experiments. The experiment tracker is the firm's institutional memory of what's been tried — successes, failures, dead-ends — searchable, comparable, reproducible.

### 7.1 The Experiment Browser

Layout:

- **Left sidebar** — filters: researcher, time period, model class, feature set, strategy class, status (running / complete / failed).
- **Main panel** — table of runs. Columns: run ID, name, researcher, started, duration, status, OOS Sharpe (or relevant metric), feature set, parameter summary, annotations.
- **Sortable, multi-select for comparison.**

### 7.2 Per-Experiment Record

Each experiment captures:

- **Trigger:** notebook + cell, scheduled run, hyperparameter sweep, scripted pipeline.
- **Config:** full hyperparameters, feature set, period, splits, seed, hardware. Anything that can affect outcome.
- **Inputs:** feature versions, data snapshot, code commit. Identical to model registry training metadata for ML runs; broader for non-ML runs (rules-based backtests).
- **Output:** performance metrics, equity curve, attribution, plots, log files.
- **Diagnostics:** runtime, peak memory, errors, warnings.
- **Annotations:** Marcus's notes ("tried this because hypothesis X; didn't work because reason Y").
- **Tags:** category, hypothesis, strategy class.

### 7.3 Run Comparison Views

The most-used surface for research velocity.

**Side-by-side comparison (2-way):**

- Two experiments selected from the table → side-by-side view.
- Diffs: feature-set delta, hyperparameter delta, performance delta, equity-curve overlay, attribution comparison.
- "What changed" summary at the top.

**N-way comparison (table form):**

- Multiple experiments in a table; sort / filter on metrics; identify dominant configurations.

**Pareto-frontier views:**

- Across many experiments, which configurations dominate (Sharpe vs drawdown / capacity / complexity).
- 2D scatter plots; interactive (click a point → open the experiment).

**Hyperparameter sensitivity:**

- Vary one parameter, hold others; the platform plots the response curve.
- Useful for understanding which parameters matter and which are noise.

**Ablation views:**

- "Which features matter most?" — computed by permutation importance or SHAP attribution.
- Per-experiment context, plus aggregate across many experiments.

### 7.4 Anti-Patterns Prevented

- **P-hacking by re-running.** Every run is logged; trying 50 hyperparameter combos and reporting the best as if it was the only is detectable. Multiple-testing penalty surfaced.
- **Cherry-picking periods.** Each experiment's period is recorded; "I just happened to test 2021" is visible.
- **Hidden in-sample tuning.** Walk-forward + log of every adjustment makes the trader's process honest.

### 7.5 Interactions Marcus has with the experiment tracker

- **During research bursts:** runs experiments, watches them stream in, picks winners for promotion.
- **Between bursts:** browses past experiments to see what was tried; avoids reinventing.
- **In retrospect:** "we shipped this model; what alternatives did we evaluate; could we have shipped a better one?"
- **For team handoff:** a researcher leaving the desk hands their successor a tagged set of experiment runs; the new person reads the corpus and ramps fast.
- **When David asks:** "show me the evidence behind this strategy promotion" — the experiment tracker has the audit trail.

### 7.6 Why this matters

- **Efficiency:** failed experiments are data, not waste. Avoiding the same dead-end twice is real productivity.
- **Risk:** p-hacking is the silent killer of quant research. The tracker makes Marcus's process honest and defensible.
- **PnL:** the firm's accumulated experiment knowledge compounds over years. New researchers stand on the shoulders of every prior run.

## 8. Strategy Composition

A model alone is not a tradable strategy. A strategy is what wraps a model (or a rule set) with sizing logic, entry/exit logic, hedging, risk gating, regime conditioning, capacity management, and execution policy. Strategy composition is where Marcus turns a validated model into a deployable unit of capital.

### 8.1 The Strategy Composition Surface

A structured form-plus-code UI. The trader configures the structured parts (visual graph + form fields) and drops into Python for any custom logic.

**Layout (sketch):**

- **Top bar** — strategy ID, name, version, owner, current stage (Research / Paper / Pilot / Live / Monitor / Retired), action buttons (validate / backtest / deploy / clone / archive).
- **Left graph view** — the strategy as a directed graph: data sources → features → model(s) → signal → entry/exit logic → sizing → execution. Click any node to configure.
- **Right panel** — properties of the selected node:
  - **Data source** — catalog reference, instruments, venues, period.
  - **Feature** — feature library reference, parameters.
  - **Model** — model registry reference, version pin.
  - **Signal** — threshold, confirmation conditions.
  - **Entry logic** — when to take a position (signal threshold + blackout windows: e.g. don't enter 30 min before funding settlement).
  - **Exit logic** — target / stop / time-based / signal-flip / regime-flip.
  - **Sizing** — Kelly fraction, vol-targeting, capital cap, per-trade max, regime-conditional multipliers.
  - **Hedging policy** — auto-hedge yes/no, hedge ratio, hedge venue, hedge cadence.
  - **Risk gates** — daily loss limit, drawdown limit, position-size limit, instrument concentration. Kill-on-breach.
  - **Execution policy** — algo class (VWAP / TWAP / iceberg / direct), venue routing rules, fee preferences, latency budget.
  - **Schedule** — active hours / days, blackout windows around macro events (Marcus's funding-harvest fleet pauses 30 min around scheduled CB events for example).
  - **Mode** — live / paper / shadow.
  - **Tags** — strategy class, asset class, archetype owner.
- **Bottom panel** — validation feedback, backtest results, deployment state. When Marcus hits "validate," automated checks run; when he hits "backtest," the form spawns a backtest job in the workspace.

**Code drop-in:** for any node, "convert to custom code" opens a Python editor with the platform SDK pre-loaded. Useful for novel signal-combiners, exotic exit logic, or anything the structured form can't express.

### 8.2 Pre-Deployment Validation

Before the strategy can be promoted past research, the platform checks for common errors:

- **Lookahead leak detection.** Static analysis of the signal logic to ensure no future data is referenced.
- **Infinite-loop entry.** Strategies that would re-enter immediately after a stop (a common bug).
- **Unbounded position size.** Sizing logic that doesn't cap exposure.
- **Missing kill-switch wiring.** Every strategy must have automated risk gates with kill-on-breach.
- **Schedule conflicts.** Strategies marked active during venue maintenance windows or funding-settlement windows where they shouldn't be.
- **Compliance flags.** Restricted-list exposure, sanctioned-counterparty exposure, jurisdictional access.
- **Capacity sanity.** The strategy's claimed capacity matches the platform's slippage-curve estimate.
- **Universe consistency.** The strategy's instrument list aligns with available data and feature coverage.

Each warning gates progression. Errors must be fixed; warnings can be acknowledged with reason.

### 8.3 Strategy Versioning

- Every change to the composition produces a new strategy version.
- Old versions stay in the registry (similar to the model registry).
- Live deployments pin to a specific version; promoting a new version is a controlled operation.
- Diff views: show what changed between version 2.4 and 2.5.

### 8.4 Marcus's Strategy Templates (Illustrative)

Pre-built strategy compositions that Marcus's day starts at. He customizes parameters, picks instruments / venues, validates, backtests, then promotes through the lifecycle. Many of his ~300 live strategies are instances of one template parameterized for a specific (instrument, venue, horizon, regime).

- **Basis arb (atomic).** Long spot + short perp atomic. Inputs: instrument, venue, basis-z entry / exit thresholds, max position size, auto-flatten window before funding. Hedging: built-in (the spot leg hedges the perp leg by construction). Risk gates: daily loss, max position. Schedule: continuous.
- **Funding harvest (unhedged).** Short perp during sustained funding-extreme. Inputs: instrument, venue, funding-z threshold, hold-time, exit conditions. Hedging: optional (cross-venue funding spread). Risk gates: more aggressive (directional bet).
- **Cross-venue lead-lag.** Identifies leading and lagging venues, fades the laggard. Inputs: venue pair, lag thresholds, instrument, position size. Microstructure-fast latency tier. Risk gates: tight stops.
- **Liquidation-cluster fade.** Sit ahead of a known cluster, take short or long bias depending on price approach. Inputs: cluster size threshold, proximity threshold, instrument, position size. Higher conviction = larger size.
- **OI-divergence.** Quadrant-driven. Inputs: instrument, OI window, regime gate.
- **Cross-instrument calendar arb.** Perp vs dated future. Inputs: instrument, expiry windows, basis thresholds.

### 8.5 Why this matters

- **Efficiency:** the same model can be expressed as many strategies (passive, active, hedged, unhedged) without re-implementing the model logic. Composition compresses time-to-deployable-strategy.
- **Risk:** validation catches the high-cost errors before they reach production. Versioning makes rollback safe.
- **PnL:** Marcus runs many strategy variants per model; capacity and risk profiles differ. Composition lets him capture each variant's distinct PnL contribution.

## 9. Promotion Gates & Lifecycle

The lifecycle (Research → Paper → Pilot → Live → Monitor → Retired) is enforced by promotion gates. The lifecycle UI is the surface Marcus uses every day to advance, demote, and retire his ~300 strategies.

### 9.1 The Lifecycle Pipeline View

A pipeline visualization, like a Kanban board:

- **Columns:** Research, Paper, Pilot, Live, Monitor, Retired.
- **Cards:** strategies, with name, owner, days-in-stage, current performance vs expectation, gate status.
- **Drag (controlled):** dragging a card across columns proposes a transition; opens the gate UI.

This is the home page for Marcus's lifecycle work. He sees, at a glance, his pipeline: how many in research, how many waiting on promotion review, how many in pilot, how many at full live, how many on monitor probation.

### 9.2 The Gate UI per Transition

Each promotion is a checklist with evidence, not a chat conversation.

**Research → Paper:**

- Code review passed (link to PR / commit).
- Backtest framework approved (no anti-pattern warnings).
- Walk-forward Sharpe above firm-wide threshold (with confidence interval).
- Risk parameters set within firm limits.
- Kill-switch wired and tested.
- Owner sign-off.

**Paper → Pilot:**

- N days of in-distribution behavior on paper (default 14 days, configurable).
- Slippage estimates validating against backtest assumptions.
- Strategy fits within firm risk limits at pilot capital level.
- Owner + risk team sign-off.

**Pilot → Live:**

- N days of pilot behavior matching expectation (default 30 days).
- Capacity estimate refined with real data.
- No anomalies in alert log.
- David (or his delegate) sign-off for material capital allocations.

**Live → Monitor:**

- Trader-initiated (degradation observed) or system-initiated (drift / decay alerts).
- Reason logged.
- Capital cap reduced per policy.

**Monitor → Retired:**

- Decay confirmed (statistical evidence).
- No path to retraining or recalibration.
- Retire decision logged with rationale.

**Retired → Research / Paper (rare):**

- Explicit re-promotion case.
- New evidence (regime change, new feature, new data) justifies revisit.

### 9.3 Lifecycle Decision Log

Append-only log of every transition: timestamp, strategy ID, version, from-stage, to-stage, decided by, reason, evidence links. Searchable, auditable, exportable for risk-committee review.

### 9.4 Lifecycle Cadence for Marcus

Crypto strategies cycle faster than equity factor strategies. Marcus's typical fleet state:

- **Research:** 20–40 strategies in active research (early-stage prototypes).
- **Paper:** 10–20 strategies running on simulated fills, awaiting pilot promotion.
- **Pilot:** 15–25 strategies at 1–5% of target size.
- **Live:** 200–250 strategies at full size.
- **Monitor:** 20–40 strategies on decay probation.
- **Retired:** dozens accumulated over time.

Daily / weekly Marcus is making 5–20 promotion decisions and 1–5 retire decisions across the fleet.

### 9.5 Why this matters

- **Efficiency:** lifecycle gates standardize quality control. Marcus does not need to design a custom evaluation framework for each strategy.
- **Risk:** every strategy reaching live capital has passed code review, risk review, validation. The platform's risk surface is correlated with lifecycle stage; pilots are watched more aggressively than long-running lives.
- **PnL:** poorly performing strategies are retired by the lifecycle, not by Marcus's gut. Discipline compounds.

## 10. Capital Allocation

The capital allocation engine is the system that decides how much capital each strategy in Marcus's fleet receives. In manual trading, Marcus sized each position by gut + spreadsheet. In automated trading, the platform proposes allocations across the fleet and Marcus approves.

### 10.1 The Allocation Engine UI

**Layout:**

- **Top panel** — total capital available, currently allocated, free, in-flight (between venues / settling). Per-archetype budget (Marcus's slice of the firm allocation, set by David).
- **Main table** — every strategy with current allocation, proposed allocation, delta, expected Sharpe contribution, marginal Sharpe contribution, capacity headroom, drift state, lifecycle stage.
- **Right panel** — risk decomposition of the proposed portfolio: gross / net / VaR / per-instrument-cluster / per-venue / stress-scenario PnL. Concentration warnings.
- **Bottom panel** — methodology selector + parameters. Marcus picks (or combines) Sharpe-proportional / risk-parity / Markowitz / Kelly / regime-conditional / hierarchical-risk-parity / custom.

**The proposal:**

- Generated nightly by default; on-demand when Marcus wants.
- Auto-respects firm-level constraints (David's caps).
- Material changes from current allocation (e.g. >10% shift) flag for sign-off — Marcus's sign-off for trader-level changes; David's for archetype-level.
- "Approve and apply" button — strategies update their capital caps; the platform respects.

### 10.2 Per-Venue Balance Management (Crypto-Specific)

Crypto requires per-venue balance tracking that's unusual outside crypto / FX. Marcus's strategies span 5–8 venues; capital must be where it's needed.

**The surface:**

- **Per-venue balance** — USDT / USDC / BTC / ETH / etc., per venue, per sub-account. Total $-equivalent.
- **Strategy-by-venue mapping** — which strategies need capital on which venue.
- **Auto-rebalance proposals** — when capital concentrates on one venue (a successful funding-harvest pulled USDT into Binance; cross-venue lead-lag needs USDT on Bybit), the platform proposes a bridge-with-policy.
- **Bridge policy gates** — small rebalances auto-execute (within trader-set thresholds). Large rebalances queue for sign-off.
- **In-flight tracker** — capital currently traversing bridges (most-exposed moment for a hack); $ value, expected arrival, source / destination.

### 10.3 Margin Segregation & Sub-Account Routing

Different strategy classes may require different margin profiles:

- **Cross-margin sub-accounts** for strategies that benefit from cross-margining (Marcus's basis arb runs cross because the spot offsets perp margin requirements).
- **Isolated-margin sub-accounts** for strategies with bounded loss profiles (each trade isolated).
- **Per-venue sub-account map** — visible at allocation-engine level.

When a new strategy is composed, sub-account routing is part of the configuration. The allocation engine respects these constraints.

### 10.4 Allocation Drift

Allocations drift during the day as strategies make / lose money. The engine continuously shows:

- Drift from optimal (proposed) allocation.
- Whether to rebalance now (intraday) or wait for nightly.
- Cost of rebalancing (slippage, fees, bridge costs) vs expected return improvement.
- Auto-rebalance thresholds (configurable per strategy class).

### 10.5 Capacity & Headroom

- **Per-strategy capacity utilization** — % of estimated capacity in use, color-coded.
- **Free capacity** — strategies with headroom; where to add.
- **Capacity exhausted** — strategies at cap; signals being skipped. Decision: accept (this is the strategy's natural ceiling) or invest in raising capacity (better execution, broader universe, additional venues).

Capacity is a primary constraint on Marcus's PnL; this surface is consulted continuously.

### 10.6 Why this matters

- **Efficiency:** allocation across 300 strategies is not solvable by spreadsheet. The engine compresses what would otherwise be hours of nightly work into a 10-minute review.
- **Risk:** systematic risk-parity / Kelly / Markowitz constraints prevent over-allocation to a single strategy or correlation cluster. Better diversification than gut sizing.
- **PnL:** marginal Sharpe analysis ensures incremental capital goes to where it has highest return. Capacity-aware sizing prevents over-trading thin strategies.

## 11. Live Fleet Supervision Console

The console where Marcus supervises every live strategy in his fleet. Anomaly-driven by design: green by default; the trader is summoned only when something is off. This replaces the manual trader's "watch the chart" surface.

### 11.1 The Fleet Dashboard

The center of Marcus's automated-mode supervisor console.

**Layout:**

- **Top filter bar** — health badge filter (default: amber + red only; toggle to show green); strategy class filter; venue filter; instrument filter; lifecycle-stage filter.
- **Main grid / table** — one row per strategy. Columns:
  - Strategy ID, name.
  - Strategy class (basis arb / funding harvest / etc.).
  - Lifecycle stage.
  - **Health badge** — green / amber / red, computed composite of PnL deviation, drift, slippage, alert volume.
  - Capital deployed / cap.
  - PnL today / WTD / MTD / YTD ($ and % of cap).
  - Sharpe rolling 30d.
  - Drawdown — current / max-since-go-live.
  - Trade count today vs typical (silence is a signal).
  - Hit rate, avg trade $.
  - Recent regime fit (model-vs-regime indicator).
  - Last intervention timestamp + actor.
  - Capacity utilization %.
  - **Marcus-specific columns:** funding rate at last action (for funding-harvest strategies); basis at last action (for basis-arb); cross-venue spread at last action (for lead-lag).
- **Sortable, filterable, expandable.** Group by strategy class / venue / instrument toggleable.
- **Default view:** filtered to amber + red. With ~300 strategies, only 5–25 typically demand attention; everything else is healthy and trusted.

**Group-by views:**

- **By strategy class** — total class-level PnL, class-level health, drill into instances.
- **By venue** — venue-level capital, venue-level health (a degrading venue affects all its strategies).
- **By instrument** — per-instrument exposure across all strategies trading it.

Marcus toggles between views during diagnostic work.

### 11.2 The Strategy Detail Page

Click a strategy → drill into its full state.

**Layout:**

- **Header** — strategy ID, name, class, lifecycle stage, current state, action buttons (pause / cap / retrain-trigger / retire).
- **Top section: live state**
  - Live equity curve (with backtest expectation overlay — divergence flagged).
  - Position breakdown — what is this strategy currently holding.
  - Drift indicators (feature drift, prediction drift, performance drift).
  - Recent intervention log.
- **Middle section: signal feed**
  - Recent signals generated, executed vs skipped, with reasons.
  - Last N decisions with full context (input feature values, model output, signal threshold).
  - "Why this strategy entered / didn't enter" diagnostic.
- **Bottom section: diagnostic depth**
  - Feature health — which features are drifting, with click-through to feature drift dashboard.
  - Slippage realized vs assumed by venue.
  - Capacity utilization curve.
  - Recent retraining history.
  - Linked alerts that have fired on this strategy.
  - Linked experiments (recent backtests / retraining runs).

This page is where Marcus does diagnostics. From here, he decides: pause, cap, retrain, leave alone, retire.

### 11.3 Anomaly Detection Surface

Anomaly detection is the heart of supervision. Categories:

- **Performance anomalies** — strategy underperforming its rolling distribution at 2σ / 3σ.
- **Behavior anomalies** — trade frequency, position size, hit rate outside historical bounds.
- **Feature drift** — input distribution shifted vs training.
- **Prediction drift** — output distribution shifted.
- **Execution anomalies** — slippage spike, rejection rate spike, fill rate drop.
- **Capacity warnings** — strategy hitting cap; signals being skipped.
- **Correlation anomaly** — strategy correlating with another it should not.
- **Regime mismatch** — running an "uptrend" model in a "chop" regime.
- **Infrastructure** — node down, data lag, RPC degraded.

Each anomaly has severity (info / warn / critical), routing rules, and (for critical) auto-actions (auto-pause the strategy by default, configurable per strategy).

**The anomaly console:**

- Active anomalies, sorted by severity then recency.
- Per-anomaly: which strategy, what triggered, suggested action, "investigate" button → strategy detail page, "acknowledge with reason" button.
- Acknowledged-anomalies log for review.

### 11.4 Cross-Strategy Correlation View

The fleet is supposed to be diversified; correlation drift erodes diversification.

**Layout:**

- **Heatmap** — strategy × strategy correlation matrix, color-coded.
- **Drift indicators** — pairs that should be uncorrelated but are drifting toward correlation.
- **Cluster visualization** — automatic clustering of strategies by behavior; outliers (a strategy that joined a cluster it didn't belong to) flagged.
- **Aggregate exposure decomposition** — fleet-level net delta, net beta, net vega, net DV01-equivalent across the fleet. Ensures supposedly-diversified strategies aren't quietly stacking exposure to a single factor.

### 11.5 Multi-Venue Capital + Balance Live State

Distinct from the allocation engine's nightly proposal — this is the live, intra-day state.

**Layout:**

- Per venue: current balance, capital deployed in strategies, free capital, in-flight (bridges, settlements).
- Color-coded health (venue degraded = red; rebalance pending = amber).
- Quick actions: pause-all-on-venue, pull-capital-from-venue (initiates bridge), block-new-deployments-to-venue.

Foveal during a venue incident (security event, withdrawal halt, rumor of insolvency).

### 11.6 Strategy State Inspection

A diagnostic surface that lets Marcus inspect the **internal state of a running strategy** — its current variables, signal evaluation, model output, regime classifier, position-sizing intermediates — and compare live behavior against backtest expectation. Critical for verifying that a strategy is configured correctly, that live and backtest aren't drifting, and that the trader's mental model of the strategy matches what the code is actually doing.

This is a verification surface, not a continuously-streamed real-time view. It is implemented per strategy; the strategy declares which variables it exposes, and the platform renders them on demand. Some strategies expose 5 variables; some expose 50; engineering cost dictates depth.

**Two layers of inspection:**

#### 11.6.1 Internal-state view (per strategy)

A panel inside the strategy detail page (section 11.2) that the trader opens on demand.

**What it shows (illustrative, varies per strategy):**

- **Current state variables** — the strategy's internal counters / flags / regime classifications / running averages / accumulators. Displayed in a structured table with field name, current value, last-updated timestamp.
- **Current feature snapshot** — the input feature values the strategy is currently seeing (the feature-vector that would be fed to the next signal evaluation). Useful for "is the funding-z feature returning what I'd expect right now?"
- **Last N signal evaluations** — for the last decisions the strategy made: input features, model output (signal value, probability, classifier label), entry / exit / no-action decision, reason. Scrollable / searchable history.
- **Current position state** — what the strategy is holding; what it intends to do next; pending orders.
- **Risk-gate state** — daily-loss accumulator, drawdown-since-go-live, capacity utilization, distance-to-each-risk-limit.
- **Regime classifier output** — the strategy's view of the current regime (e.g. "vol-high, funding-extreme, on-trend"); strategies with regime gating expose which gates are open / closed.
- **Strategy-specific custom state** — for example, a basis-arb strategy might expose: current basis estimate per instrument, basis-z, time-to-funding-settlement, auto-flatten timer state. A funding-harvest strategy might expose: funding-z accumulator, hold-time-elapsed, exit-condition-evaluation.

**Refresh model:**

- **Refresh button** for on-demand snapshot. The most common interaction.
- **Auto-refresh toggle** for selected strategies (e.g. when actively diagnosing). Configurable cadence: 1s / 5s / 30s / 1min / off.
- **Schedule push** for selected strategies — the platform pushes state updates only when the strategy actually changes state (entered a position, evaluated a signal, hit a gate). Lightweight, event-driven.
- **Engineering pragmatic:** the platform does not stream all variables of all 300 strategies in real time — that's heavy on backend and wasteful. Streaming is opt-in per strategy when the trader is actively inspecting; default is on-demand refresh.

**Per-strategy implementation:**

- The strategy declares its exposed state via a contract (a list of variables, types, descriptions). The platform renders whatever the strategy declares.
- Some strategies expose comprehensive state (many internal variables, full signal-history, regime classifier outputs).
- Some expose minimal state (just the position and current signal). Pragmatic — engineering cost should match diagnostic value.
- The trader is not blocked if a strategy is light on exposed state; the supervision dashboard, model registry, and execution log give independent diagnostic angles.

#### 11.6.2 Backtest-vs-live comparison

For any live strategy, a side-by-side view comparing live behavior against backtest expectation. Critical for catching configuration drift early.

**Layout:**

- **Top:** equity curve, live (last N days) overlaid on backtest counterfactual (had the strategy run with the same parameters and same regime over the same period). Divergence flagged.
- **Per-trade comparison:** recent live trades, what the backtest would have done at the same moment. Mismatches: live entered when backtest didn't (or vice versa); live size differed from backtest size; live execution-quality differed.
- **Per-feature drift:** the input features the strategy saw live vs the same features in the backtest's training distribution. Distribution-shift score per feature.
- **Per-signal calibration:** for probabilistic-output models, was the live signal calibrated as the backtest predicted (a 0.7 probability resolved to ~70% of outcomes)?
- **Diagnosis hints:** the platform suggests likely root causes if divergence is meaningful — feature drift, execution-quality degradation, model drift, configuration mismatch (e.g. different parameter than the backtest), data-pipeline issue.

**Use cases:**

- After Marcus deploys a new strategy to live: confirm the first weeks' behavior matches the backtest. If it doesn't, diagnose before scaling capital.
- When a strategy enters monitor stage: was the divergence caused by the live deployment or by the regime?
- When validating a candidate retrain: how does the new model's first weeks compare to its backtest?

**Refresh model:**

- Computed daily by default (not real-time). The comparison is a slow-moving diagnostic; daily granularity is sufficient.
- On-demand refresh available.

#### 11.6.3 Why this matters

- **Efficiency:** when a strategy is misbehaving, Marcus can see exactly what it's "thinking" without needing to run a fresh backtest or open the code repo. The diagnostic loop closes in minutes rather than hours.
- **Risk:** silent configuration drift between backtest and live is a major failure mode. The comparison surface catches it before scaled capital makes the mistake expensive.
- **PnL:** strategies that match their backtest expectation can be scaled with confidence. Strategies whose live diverges from backtest are caught early and either fixed or capped.
- **Engineering verification:** as a side effect, this surface is one of the cleanest end-to-end tests of the platform — if Marcus can see the right state for a strategy, the data plumbing, model registration, strategy composition, execution layer, and reporting layer are all working end-to-end. The diagnostic surface doubles as platform validation.

### 11.7 Why this matters

- **Efficiency:** anomaly-driven attention compresses 300 strategies into ~5–25 to investigate. Marcus does not stare at 300 charts.
- **Risk:** anomalies are caught before P/L damage compounds. Auto-pause on critical alerts limits blast radius.
- **PnL:** time saved on supervision is reinvested in research. The leverage of the trader-quant role depends on this.

## 12. Intervention Console

When Marcus decides to act, the intervention console is the surface. Distinct from automatic actions (kill-on-breach, auto-hedge, auto-rebalance) — this is _Marcus's_ interventions.

### 12.1 Per-Strategy Controls

For any strategy, controls Marcus can apply:

- **Start / pause / stop** — with confirmation + audit trail.
- **Cap change** — increase / decrease capital cap. Modest changes auto-apply; large changes route to allocation-engine sign-off.
- **Risk-limit change** — daily loss limit, drawdown limit, position-size limit. Audited.
- **Symbol whitelist / blacklist** — temporarily exclude an instrument.
- **Schedule modification** — pause active hours, add a blackout window (e.g. "no entries between 14:00 and 14:30 UTC for the next 7 days because of expected ETF announcement").
- **Mode change** — live / paper / shadow. Shadow mode runs the code without sending orders; useful for diagnosing without further P/L exposure.
- **Force-flatten** — close all positions on this strategy now. Reason field mandatory.
- **Demote to monitor** — move to monitor stage with reason.

Every intervention is logged: timestamp, actor, action, reason, pre-state, post-state.

### 12.2 Group Controls

- **Pause all in strategy class** (e.g. pause all funding-harvest strategies because of a venue funding-formula change).
- **Pause all on venue** (venue degradation; security incident).
- **Pause all in lifecycle stage** (e.g. pause all pilots during a major macro event).
- **Cap all by tag** — multiplicative cap reduction across a tagged set.

### 12.3 Manual Trading & Reconciliation

**Even in fully automated mode, the trader must retain the ability to place, adjust, and close trades manually from the UI.** This is non-negotiable. Three primary scenarios:

**1. Emergency intervention.**
A strategy is misbehaving; the auto-flatten failed; an exchange is in a degraded state and the algo cannot reach it via API; an oracle deviation requires immediate position closure that the strategy isn't pre-coded to handle. Marcus needs to flatten or adjust positions by hand right now. Hesitation costs PnL.

**2. Reconciliation between algo state and venue state.**
The platform's view of what's open and the exchange's view should always match — but in practice they occasionally diverge (a fill the strategy didn't register; a cancel the strategy thinks succeeded but didn't; a venue that briefly reported a wrong balance and corrected). Marcus needs to manually align the two, sometimes by closing a phantom position or opening one the strategy thought it had.

**3. Discretionary override on top of the automated book.**
A high-conviction macro view (FOMC outcome surprise, ETF announcement, China policy headline) where Marcus wants to layer a directional position on top of what the strategies are doing — explicitly tagged as such.

The platform must support all three with **full manual-trading capability identical to the manual mode** described earlier in this doc. Marcus retains every surface from his manual workflow: multi-leg ticket, ladder click-to-trade, hotkeys, smart router, pre-trade preview, working orders blotter, multi-venue depth view. The manual surfaces don't disappear in automated mode; they are present and reachable but not the primary surface most of the day.

#### 12.3.1 The Full Manual Order Ticket

The complete order entry ticket from manual mode (see [#2 Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) and the manual sections of this doc above).

- **All order types available:** market, limit, stop, stop-limit, OCO, bracket, trailing, peg-to-mid, post-only, reduce-only, IOC, FOK, GTC, GTD.
- **Multi-leg native:** atomic spot+perp basis pairs, calendar spreads, hedged structures.
- **Hotkeys preserved:** all his manual-mode hotkeys remain bound (buy/sell at offer/bid, cancel-all, flatten, reverse, hedge-to-flat). Speed matters during emergencies.
- **Pre-trade preview:** margin impact, position impact (in $-notional and as delta on the _entire book including the automated fleet_), liquidation price, fee estimate, slippage estimate.
- **Smart order router:** aggregated venue depth, best-price routing.
- **Multi-venue ladder:** the same Betfair-style aggregated ladder he uses in manual.
- **Compliance / pre-trade gates:** restricted-list checks, position-limit checks, sanctions, jurisdictional access.

Practically: the manual terminal is a tab in the supervisor console, not a separate application. Marcus presses a hotkey or clicks an icon → manual ticket comes up over the current view → he places the trade → the ticket closes back to the supervisor view.

#### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Emergency intervention** — flagged for post-incident review; auto-included in the day's incident log.
- **Reconciliation** — paired with the algo state being reconciled (which strategy thought it had this position; what the venue showed). Reconciliation tickets generate an audit pair.
- **Manual override** — explicit directional override; tagged with the macro thesis or reason.

Attribution carries the tag through P/L, performance metrics, reports. David's behavioral monitoring (see section 17.2) tracks the frequency of each tag class — sustained increase in emergency interventions or overrides is a leading indicator David investigates.

#### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case, because it's the most error-prone of the three.

**The reconciliation page:**

- **Left panel:** the platform's view — every position the strategies _think_ they have, per venue, per instrument.
- **Right panel:** the venue's view — every position the venue _actually_ shows, per venue, per instrument.
- **Diff highlighted:** rows where the two disagree. Discrepancy size in $ and as % of position.
- **Per-row actions:**
  - "Trust venue" — the platform updates its internal state to match the venue. Strategy state corrected; audit logged.
  - "Trust platform" — the venue is incorrect (rare, but happens during venue outages or a bad data feed); manual reconciliation order placed at the venue to bring it into line. Audit logged.
  - "Investigate" — opens a diagnostic with the relevant fills, cancels, modifies that should explain the divergence. Sometimes the divergence is a legitimate timing-of-acknowledgment issue and resolves on its own; sometimes it's a real bug.
- **Bulk actions** — "trust venue for all USDT-margin discrepancies" when the source of divergence is known (e.g. a venue's reconciliation API returning stale data for a window).

**Auto-trigger:**

- The platform runs continuous reconciliation in the background; minor discrepancies that resolve within seconds (e.g. fill-acknowledgment latency) do not surface.
- Discrepancies above a threshold ($ size or duration) escalate to alerts.
- Marcus can run a manual full reconciliation (against all venues) on demand — typically end-of-day or after an incident.

#### 12.3.4 Emergency Modes

A specific UI mode that Marcus can switch into during a crisis (see the supervisor console mode-switching, section 14.2).

**Emergency mode reorganizes the screen:**

- **Manual ticket pinned** — large, foveal.
- **Multi-venue aggregated ladder** for the focus instrument — foveal.
- **Live position state across all venues** — second-largest panel, showing what's open and where.
- **Working orders across all venues** — what's resting that Marcus might need to cancel.
- **Strategy intervention console** — pause / kill controls visible.
- **Alert console** — relevant alerts streaming.
- **Latency / connectivity panel** — venue-by-venue connection state, foveal because in an emergency, one venue being slow or unreachable changes the play.

Hotkeys preserved; muscle memory from manual mode is the trader's most valuable asset during a real emergency.

**Switching into emergency mode** is a single keystroke (or audible "go to emergency"). Switching back is one keystroke. Work-in-flight (research notebooks, etc.) preserved; nothing lost.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual ticket** for currently-focused instrument.
- **Flatten focused instrument** across all venues (combined position).
- **Cancel-all-on-focused-instrument.**
- **Hedge-to-flat focused instrument** (auto-pair against optimal hedge venue).
- **Switch to emergency mode** (keystroke chord; less easily triggered to avoid accidents).

These remain bound regardless of which mode the supervisor console is in. The trader's reflex to react manually is preserved.

#### 12.3.6 Audit & Friction

Manual trading is auditable but not friction-free for non-emergency cases:

- **Emergency interventions** — minimal friction. One confirmation, audit logged.
- **Reconciliation** — friction matched to size; small reconciliations are one-click; large ones require reason field.
- **Manual override (directional)** — full friction: reason field, confirmation gate, override tag mandatory. The friction reflects the consequence — directional override outside the systematic framework should be a deliberate decision, not muscle memory.

Every manual trade enters the same audit trail as algo trades, with the manual flag and tag class. Searchable, reviewable, exportable for risk-committee or regulator review.

#### 12.3.7 Why this matters

- **Efficiency:** in an emergency, seconds to a working manual ticket = real PnL preservation. The platform's manual surfaces are first-class even when not the primary surface.
- **Risk:** reconciliation is a real operational risk. Without a designed reconciliation workflow, the platform's view and the venue's view drift; positions get lost or mis-tracked; eventually a reconciliation incident produces a real loss. The platform's design prevents this from being a chronic problem.
- **PnL:** the ability to layer a high-conviction discretionary trade on top of the automated book lets Marcus capture macro-event alpha that pure systematic strategies miss. Tagged and audited so it's accountable.
- **Platform validation:** if Marcus can place every trade his strategies make from the manual UI, the platform's execution layer is verified end-to-end. This is the cleanest integration test of the entire trading stack — manual UI + smart router + venue connectivity + execution algos + post-trade attribution + compliance.

### 12.4 Kill Switches at Multiple Scopes

Layered kill switches per [#19 Kill Switches](common-tools.md#19-kill-switches-granular):

- **Per-strategy kill** — cancel all working orders + flatten positions on this strategy.
- **Per-strategy-class kill** — flatten the funding-harvest fleet; flatten the basis-arb fleet.
- **Per-venue kill** — pull all firm activity from this venue.
- **Per-domain kill** (CeFi side only — Marcus is CeFi; Julius's DeFi side has separate stage-aware kill).
- **Fleet-wide kill** — Marcus's entire automated cousin (all his ~300 strategies). Multi-confirmation.
- **Firm-wide kill** — David + CIO + risk-officer; multi-key authentication for catastrophic events.

Each scope's kill is a designed action: cancel-or-flatten configurable, audit-trail mandatory, reversal procedure documented.

### 12.5 Intervention Audit Log

Append-only log of every intervention. Searchable / filterable / exportable.

- Per-row: timestamp, scope, actor, action, reason, pre-state, post-state, downstream effect (positions closed, P/L impact, working orders canceled).
- Used in post-incident review (David's firm-wide replay), regulator request, behavioral self-review (was I over-intervening this quarter?).

### 12.6 Why this matters

- **Efficiency:** intervention scoping (per-strategy / class / venue / fleet) lets Marcus respond proportionately to incidents. He doesn't nuke the whole fleet for one venue's hiccup.
- **Risk:** every intervention is auditable. Catastrophe response (mass-liquidation, exchange exploit) is designed; the platform has practiced it.
- **PnL:** the cost of over-intervention is missed PnL. The cost of under-intervention is realized loss. Granular controls plus disciplined auditing balance both.

## 13. Post-Trade & Decay Tracking

The feedback loop from yesterday's results into tomorrow's research. Every strategy is evaluated daily / weekly / monthly: did it perform as expected, is it decaying, does it need retraining, is it ready to retire? Decay tracking is what separates a firm that maintains alpha from one that discovers it once and watches it fade.

### 13.1 Per-Strategy Retrospectives

Auto-generated per strategy on a configurable cadence (typically weekly + monthly).

**Layout:**

- **Header** — strategy name, period covered, current stage.
- **Performance vs expectation panel:**
  - Realized Sharpe in the period vs research-time expected distribution. Where today's value falls in the distribution.
  - Equity curve overlay: realized vs backtest counterfactual (had the historical regime persisted).
- **Drawdown decomposition:**
  - Recent drawdown periods.
  - Per-drawdown: which trades contributed, what features / regime / executions drove it.
- **Regime fit:**
  - % of period in each regime; per-regime performance.
  - Regime-fit health score.
- **Capacity realized vs assumed:**
  - Slippage, fill rate, partial fills.
- **Recent interventions and effect:**
  - What was paused, capped, retrained; observed PnL impact.
- **Drift state:**
  - Feature, prediction, performance drift snapshot.
- **Recommended action:**
  - Continue / retrain / cap / monitor / retire — with rationale.

Marcus reads these end-of-week, on the strategies needing attention; he skims the others.

### 13.2 Fleet-Level Review

Auto-generated weekly + monthly.

**Layout:**

- **Total PnL decomposition:**
  - By strategy class.
  - By venue.
  - By underlying.
  - By regime.
  - By time-of-day / session.
- **Risk-adjusted contribution:**
  - Per strategy: Sharpe contribution to fleet, marginal Sharpe (if removed, what would fleet Sharpe be).
  - Strategies that contribute Sharpe vs strategies that dilute.
- **Marginal contribution analysis:**
  - "If I added $X to strategy A, expected incremental Sharpe is Y."
  - Diminishing-returns curves per strategy.
- **Correlation evolution:**
  - Strategies that should be uncorrelated drifting together.
  - Cluster shifts.
- **Capacity utilization across the fleet:**
  - Where there's headroom, where strategies are at cap.

Marcus reads this Sunday evening; informs Monday capital-allocation decisions.

### 13.3 Decay Metrics Surface

A dedicated dashboard for catching decay early.

**Layout:**

- **Sharpe-over-time per strategy** — rolling Sharpe with confidence bands. Statistical-significance flag on declining trend.
- **Half-life estimates** — how long does this alpha persist before halving. Strategies in the bottom quartile (fastest decay) flagged.
- **Feature-importance drift** — features whose importance is shifting per model. Foundational features quietly losing relevance is a leading indicator.
- **Backtest vs live divergence** — point estimate + distribution. Strategies tracking expectation: green. Underperforming: investigated. Overperforming: also investigated (look-ahead leak suspected).

This surface is consulted weekly. Decisions: queue retrain, cap, demote to monitor, retire.

### 13.4 Retrain Queue UI

When the platform proposes retraining (drift triggered, schedule triggered, performance triggered), the proposal queues here.

**Layout:**

- **Queue table** — strategy, model version, retrain reason, proposed training data window, estimated compute cost, estimated improvement.
- **Per-row actions:** approve (queues the job in research compute), defer (snooze N days), customize (Marcus modifies the training data window or hyperparameters before approving), reject (with reason).
- **Auto-approval thresholds** — strategies in monitor / pilot can have auto-approve enabled for routine retrains; live strategies require explicit approval.
- **Retrain history** — past retrains and their outcomes (did the new version actually outperform the old?).

### 13.5 Retire Decisions

Retirement is a decision — the platform proposes, Marcus approves.

**The proposal:**

- Decay confirmed (statistical evidence linked).
- Better strategy in the same niche (replacement candidate, if one exists).
- Path to recalibration / retraining exhausted.
- Capital freed by retirement.

**The approval workflow:**

- Marcus reviews the retire proposal.
- Approves: strategy moves to retired, capital freed, audit logged.
- Rejects: strategy stays, with reason ("regime change might reverse; give 30 more days").
- Modifies: e.g. "retire the BTC instance but keep the ETH instance, the divergence is meaningful."

### 13.6 Why this matters

- **Efficiency:** retrospectives are auto-generated. Marcus reads, he doesn't compose. The friction of post-trade analysis is what kills the loop in many firms; the platform compresses it.
- **Risk:** decaying strategies are caught by the metric, not by Marcus's anecdotal sense. Faster intervention = less decay-damage.
- **PnL:** retraining cadence is data-driven. Capital trapped in dying strategies is recycled into research priorities. The Learn → Decide loop closes.

## 14. The Supervisor Console — Marcus's Daily UI

The supervisor console is the integration of all the surfaces above into one workspace. It's not a single new surface; it's the layout / mode-switching / spatial organization of everything described.

### 14.1 Marcus's Monitor Layout (Illustrative)

A senior crypto quant-trader runs 4–6 monitors. Marcus's typical layout:

| Position      | Surface                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| Top-left      | **Fleet supervision dashboard** (default amber + red filter)                             |
| Top-center    | **Research workspace** (notebook environment)                                            |
| Top-right     | **Anomaly / alerts console + decay surface**                                             |
| Middle-left   | **Strategy detail page** (drill-down when investigating)                                 |
| Middle-center | **Capital allocation engine + per-venue balance state**                                  |
| Middle-right  | **Promotion gate queue + experiment tracker**                                            |
| Bottom-left   | **Macro / regime context** — DXY, US 10Y, SPX, BTC dominance, VIX, MOVE, ETF flow ribbon |
| Bottom-right  | **News / research feed + comms** (chat, desk, sell-side)                                 |
| Tablet        | Telegram / Slack / Discord for desk chatter                                              |

The supervisor console's center of gravity is **research workspace + fleet supervision**. The manual terminal's center of gravity (chart + ticket + position blotter) is now in the bottom corners as background — not foveal.

### 14.2 Mode-Switching

The console has modes; switching reconfigures the layout (per [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace)):

- **Research mode (default during quiet hours):** notebook environment in foveal positions; supervisor + alerts in periphery; capital allocation collapsed.
- **Supervision mode (alert-driven):** fleet dashboard + strategy detail in foveal positions; research workspace minimized.
- **Event mode (FOMC, ETF announcement, exploit):** anomaly console + intervention console + cross-venue capital state foveal; research minimized; charts of high-vol instruments visible.
- **Pre-market mode:** fleet review + alerts + macro context dominant.
- **Post-market mode:** decay + retrospectives + capital allocation + experiment-priority-queue dominant.

Switching is one keystroke. Work-in-flight (open notebooks, pending interventions) preserved.

### 14.3 Anomaly-Driven Default State

Critical: the console is **green-by-default**. Most of the day, Marcus is heads-down in research; the supervisor surface is quiet. When something goes off, alerts route to him via:

- Banner on screen (auditable).
- Audio (configurable per severity).
- Mobile push (when away from desk).
- Phone page (for catastrophe-tier alerts only — exploit detected, oracle deviation, fleet-wide kill recommended).

Marcus trusts the platform's silence. False-positive alerts erode this trust quickly; the platform's tuning of severity / thresholds / suppression is critical to the trader's productivity.

### 14.4 Why this matters

- **Efficiency:** time-on-research is the trader-quant's primary leverage. The console design ensures research is foveal-by-default, supervision is peripheral-by-default. This is the inverse of the manual terminal.
- **Risk:** mode-switching to event mode in seconds during a crisis is the difference between contained damage and runaway loss.
- **PnL:** the cognitive shift from foveal-position to peripheral-fleet is what makes 300 strategies tractable. Without it, scale is impossible.

## 15. Marcus's Automated-Mode Daily Rhythm

Crypto is a 24/7 market. Marcus's "day" is bounded by his shift; the strategies run continuously. Overnight supervision is split across regions (Asia / EU / NY shifts) or handled by the automated supervisor (with escalation rules to wake the on-call human for critical alerts).

### 15.1 Pre-Market (60–90 min)

The day starts with **fleet triage and research-priority setting**, not with watching a chart.

**Fleet review (15–25 min):**

- Glance at supervisor console. Default: most strategies green; investigate amber + red.
- Read overnight session attribution (Asia session for Marcus): which strategies generated PnL, which detracted, which behaved out-of-distribution.
- Read alerts queue from overnight — capacity warnings, feature drift, regime mismatches, infrastructure incidents.
- Make morning decisions: pause this strategy whose drift exceeded threshold; promote that pilot to live; cap this one whose capacity is exhausted.
- Verify all positions are at intended state — no overnight surprises.

**Research catch-up (15–25 min):**

- Skim experiment-tracker results from overnight runs. 5–20 backtests / training runs queued each night; results stream in.
- Promote winners (a successful experiment becomes a notebook for further investigation, or a candidate strategy for paper-trading).
- Archive losers with notes on why they failed (institutional memory).
- Review canary-deployment results from yesterday's promotions.

**Macro / regime read (15–20 min):**

- Read morning notes — sell-side, internal, ETF-flow research — through the news feed.
- Identify regime-shift signals (FOMC week, CPI day, China headline, geopolitical event imminent).
- Consider: are any of my strategies fragile to today's regime? Cap them, hedge them, or leave alone.
- Quick check on stablecoin pegs and venue health (Binance withdrawal queue, OKX system status).

**Promotion-gate decisions (10–15 min):**

- Strategies waiting for promotion sign-off: review the gate evidence, sign off or send back with notes.
- Coordinate with David on any promotions material to firm risk.
- Coordinate with Julius on cross-domain strategies (CeFi-DeFi basis).

**Coffee / clear head:**

- Step away. The cognitive load of the rest of the day is research-heavy; preserve focus.

### 15.2 In-Market (continuous, anomaly-driven)

This is the radical shift from manual trading. Most of the day is **research, not supervision**.

**Default state:** trader is in the research workspace. Notebooks open. Working on:

- A new strategy idea (from yesterday's review).
- Feature engineering — a hypothesis to test (e.g. "does cumulative ETF flow over rolling 5d predict next-day BTC perp basis?").
- Model retraining for a strategy showing drift.
- Hyperparameter sweep on a candidate model.
- Diagnosing a strategy that underperformed yesterday.
- Reading new sell-side or peer-firm research and prototyping ideas.

**Background:** supervisor console is open in another monitor; default green. Alerts route to mobile when the trader is heads-down.

**Alert response (5–10% of the day):** when an alert fires:

- Drill into the strategy detail page.
- Diagnose: is this a true anomaly (intervene) or a known transient (acknowledge)?
- If intervene: pause / cap / replace. Document the decision.
- If known transient: acknowledge with reason; system learns the pattern over time.

**Liquid-event override (rare but real):** large macro release, surprise headline, exploit, oracle deviation, mass liquidation. Trader switches to event mode:

- Pause sensitive strategies (or let them ride if confident in the model's regime-handling).
- Use manual order entry for any high-conviction directional bet (with override tagging).
- Return to default mode when the event normalizes.

**Mid-day capital-allocation review:** glance at the allocation engine's drift indicators. Material drift triggers a rebalance proposal; trader approves or defers.

**Cross-trader coordination:** brief desk-chat exchanges with adjacent archetypes (Julius on cross-domain basis; Sasha on vol structures around the next event; Quinn on cross-archetype factor overlap).

### 15.3 Post-Market (60–90 min)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–20 min):**

- Today's PnL decomposition — by strategy class, by venue, by underlying, by regime.
- Identify outliers — strategies that significantly outperformed or underperformed expectation. Note for retrospective.
- Verify all positions are flat or as-intended.

**Decay check (10–15 min):**

- Run the decay surface: any strategies whose Sharpe trend is concerning?
- Any strategies needing retraining? Approve the retrain queue or queue for overnight.
- Any features whose drift is growing? Consider downstream impact.

**Capital allocation (10–15 min):**

- Review nightly allocation proposal.
- Approve, modify, or escalate to David.
- Verify capital deployed reflects the approved allocation.

**Research-priority setting (15–25 min):**

- Based on the day's findings: what's tomorrow's research priority?
- Queue overnight backtests / training runs (5–10 typically).
- Update experiment-tracker priorities.
- Note any features to add to the library based on today's hypotheses.

**Promotion-gate triage (5–10 min):**

- Strategies ready for promotion review tomorrow morning.
- Gate evidence in place; trader sets reminder.

**Sign-off:**

- Confirm all alerts are acknowledged or resolved.
- Confirm fleet is in expected state for overnight running.
- Hand-off to the next-shift supervisor (Asia coverage), or rely on automated supervision overnight (with escalation rules to wake the on-call for critical alerts).

### 15.4 Cadence Variations

- **Crypto-event-heavy weeks** (FOMC, CPI, ETF flow announcements, exchange security incidents) — supervision-heavy; less research.
- **Quiet weeks** — research-dominated; the strategies run themselves; Marcus invests in alpha-generation.
- **Major procurement / data-vendor weeks** — Marcus spends meaningful time on data-layer evaluation.
- **Quarter-end** — cross-fleet review, retire decisions, capital reallocation, committee report contribution.

## 16. Differences from Manual Mode

| Dimension                  | Manual Marcus                     | Automated Marcus                                                              |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| Coverage                   | 3–5 instruments hand-watched      | 200+ instruments × 5–8 venues × multiple horizons                             |
| Trades per day             | 5–30 high-conviction              | Thousands across the fleet                                                    |
| Phase 1 (Decide)           | Reading a chart                   | Choosing alpha to research; managing portfolio of strategies                  |
| Phase 2 (Enter)            | Click ticket                      | Promote strategy through lifecycle gates                                      |
| Phase 3 (Hold)             | Watching positions                | Anomaly-driven supervision of fleet                                           |
| Phase 4 (Learn)            | Journaling lessons                | Decay tracking, retraining, attribution-driven research priorities            |
| Time on charts             | 80%                               | 5–10% (mostly diagnostic, not generative)                                     |
| Time on research           | 5–10%                             | 60–70%                                                                        |
| Time on supervision        | 10–15%                            | 10–15%                                                                        |
| Time on intervention       | (continuous)                      | 5–10%                                                                         |
| Time on data / procurement | minimal                           | 5–10%                                                                         |
| Time on capital allocation | minimal (per-trade sizing only)   | 5–10% (fleet-level)                                                           |
| Latency criticality        | Visible per venue                 | Per-strategy-class latency tiers, with budget enforcement                     |
| Risk units                 | $-notional + greeks               | Same + per-strategy DV01-equivalent + correlation cluster                     |
| Edge metric                | P/L, Sharpe                       | P/L, Sharpe, decay rate, capacity utilization, marginal Sharpe                |
| Cognitive load             | Foveal-on-position                | Peripheral-on-fleet; foveal-on-research-or-anomaly                            |
| Failure modes              | Tilt, fatigue, missed opportunity | Silent overfit, decay-blindness, alert fatigue, runaway algo                  |
| Tools mastered             | Chart, ladder, ticket             | Notebook, feature library, model registry, lifecycle gates, allocation engine |
| Compensation driver        | Sharpe + AUM                      | Same + research velocity + fleet capacity utilization                         |

The fundamental change: **Marcus stops being the worker and becomes the principal investor in his own quant fund.**

## 17. Coordination with Quinn, David, and Julius

### 17.1 Coordination with Quinn

Quinn runs cross-archetype factor / stat-arb / market-neutral systematic strategies. Some of her strategies overlap with Marcus's domain (a BTC factor strategy may share inputs with Marcus's funding-harvest model). They coordinate to avoid double-up:

- **Correlation matrix shared** — Quinn's fleet vs Marcus's fleet pairwise correlations visible to both.
- **Promotion-gate awareness** — Quinn promoting a new BTC strategy alerts Marcus; if Marcus's existing strategies would correlate, they negotiate (split capacity, kill one, etc.).
- **Feature sharing** — features Marcus builds are useful to Quinn (and vice versa); the library is the connector.
- **Research collaboration** — joint research on cross-archetype topics (e.g. on-chain ETF flow signals that affect both crypto direct and crypto-equity factor strategies).

### 17.2 Coordination with David

David is the firm-level supervisor. Marcus's automated cousin is a $X-allocated fleet within David's purview.

- **Fleet-level reporting** — David sees Marcus's ~300 strategies aggregated, with health / PnL / risk-consumed visible.
- **Capital allocation gates** — material allocation changes (Marcus's slice of firm capital expanding or contracting) route to David.
- **Behavioral monitoring** — David watches Marcus's intervention frequency, override frequency, retire-decision pace. Drift in these is a leading indicator.
- **Promotion-gate sign-off for material strategies** — strategies above a capital-cap threshold require David's sign-off in addition to Marcus's.
- **Catastrophe response** — firm-wide kill switches require David + CIO + risk officer; Marcus has fleet-level kill autonomy.
- **Risk-committee deliverables** — Marcus's monthly attribution + risk decomposition + lifecycle decisions are inputs to David's committee deck.

### 17.3 Coordination with Julius

Julius runs adjacent CeFi+DeFi strategies. Cross-domain strategies (e.g. CeFi-DeFi basis arb, funding-vs-borrow spread) may have legs in both domains.

- **Domain ownership conventions** — who owns which leg of a cross-domain strategy. Attribution split rules.
- **Operational handoff** — when a CeFi leg fills, the DeFi leg may need to execute (Julius's domain) or vice versa. Operational coordination via shared tools.
- **Cross-domain data sharing** — Julius's on-chain features (ETF flows from on-chain, stablecoin movements, MEV-aware execution data) flow into Marcus's library.
- **Joint experiments** — cross-domain alpha is a fertile area; joint research and backtesting.

### 17.4 Why this matters

- **Efficiency:** without coordination, the firm builds the same strategy twice across desks, doubles up on capacity, dilutes attribution. Coordination layered on visibility tools (shared correlation matrix, promotion alerts, feature library) is cheap.
- **Risk:** correlated bets across desks compound risk. Visibility prevents the firm from accidentally over-exposing.
- **PnL:** cross-desk research collaboration produces alpha that no single desk could find alone.

## 18. How to Use This Appendix

When evaluating Marcus's automated terminal (against any platform — including our own):

**Data layer:**

- Are all the crypto-CeFi data sources cataloged with quality / lineage / cost / freshness / used-by tracking?
- Is the procurement dashboard a serious tool, with attribution-vs-cost evidence?
- Is gap analysis tied to concrete strategies that can't be deployed?

**Feature library:**

- Are Marcus's features (funding-z, basis curvature, OI quadrant, liquidation proximity, CVD divergence, lead-lag spread) first-class with drift monitoring?
- Is the feature engineering surface frictionless inline-in-notebook?
- Is cross-pollination across desks supported?

**Research workspace:**

- Can Marcus go from idea to validated strategy in hours, not weeks?
- Is the backtest engine realistic (slippage, fees, latency, partial fills, queue position)?
- Are anti-patterns (lookahead, survivorship, p-hacking) caught by the platform?
- Is the strategy-template library populated with crypto-specific templates?

**Model registry & experiment tracker:**

- Can any model be re-trained from registered inputs and produce a bit-identical result?
- Are old versions never deleted?
- Does the experiment tracker make Marcus's research process honest and defensible?

**Strategy composition:**

- Is the composition surface visual + code-droppable?
- Does pre-deployment validation catch lookahead, unbounded sizing, missing kill-switches?
- Are crypto-specific templates (basis arb, funding harvest, cross-venue lead-lag, liquidation-cluster fade) provided?

**Lifecycle:**

- Is the pipeline visualization (research → paper → pilot → live → monitor → retired) usable as a daily kanban board?
- Are gates checklists with evidence, not chat conversations?
- Is rollback one-click?

**Capital allocation:**

- Does the allocation engine propose a nightly portfolio with risk-decomposition + marginal-Sharpe analysis?
- Is per-venue balance management a first-class operational tool?
- Are sub-account routing and margin segregation supported?

**Live fleet supervision:**

- Can Marcus supervise 300+ strategies anomaly-driven, default green, with crypto-specific columns?
- Is the strategy detail page a complete diagnostic surface?
- Are anomalies severity-routed with auto-actions on critical?
- Is **strategy state inspection** (internal variables, current feature snapshot, recent signal evaluations, regime classifier output) available on demand per strategy?
- Is **backtest-vs-live comparison** computed (daily by default, on-demand available) for divergence catching?
- Is the platform pragmatic about state-streaming load (refresh-on-demand and event-pushed, not constant streaming for all 300 strategies)?

**Intervention console & manual trading:**

- Are kill switches granular (strategy / class / venue / fleet / firm) with multi-key authentication for the largest scopes?
- Is **the full manual order ticket** (multi-leg, hotkeys, smart router, multi-venue ladder, pre-trade preview) preserved and one-keystroke-reachable from the supervisor console?
- Is **emergency mode** a designed UI mode with manual ticket + multi-venue ladder + working orders foveal?
- Is **reconciliation** a designed workflow (algo state vs venue state, with diff highlighting and per-row actions)?
- Is every manual trade tagged (emergency / reconciliation / override) and auditable, with attribution flowing through to performance reports?
- Are global manual-trading hotkeys (flatten, cancel-all, hedge-to-flat, open-manual-ticket) bound regardless of the supervisor console's current mode?
- Is every intervention logged with timestamp / actor / action / reason / pre-state / post-state?

**Post-trade & decay:**

- Are retrospectives auto-generated, not composed?
- Is decay caught by metrics, not gut?
- Is the retrain queue actionable, with auto-approval for routine retrains and explicit approval for live strategies?

**Supervisor console:**

- Is research foveal-by-default and supervision peripheral-by-default?
- Is mode-switching one keystroke?
- Is the platform green-by-default and trustworthy in its silence?

**Daily rhythm:**

- Can Marcus actually spend 60–70% of his time on research while the fleet runs supervised in the periphery?
- Are pre-market / in-market / post-market workflows supported by the right surfaces in the right modes?

**Coordination:**

- Is Marcus's fleet visible to Quinn, David, Julius at the right level of detail?
- Are cross-desk correlation, promotion alerts, feature sharing first-class?

**Cross-cutting:**

- Is lineage end-to-end (data → feature → model → strategy → trade → P/L)?
- Is reproducibility guaranteed?
- Are audit trails non-negotiable?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
