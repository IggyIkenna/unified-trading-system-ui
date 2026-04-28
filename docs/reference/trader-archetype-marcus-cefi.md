# Trader Archetype — Marcus Vance (Senior CeFi Crypto Portfolio Trader)

A reference profile of a top-performing discretionary crypto trader at a top-5 firm, used as a yardstick for what an ideal trading terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow this profile is built on, see [manual-trader-workflow.md](manual-trader-workflow.md).

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

- Multi-TF chart of **BTC and ETH always pinned** — these set the regime even if he's trading SOL or an alt.
- **Custom chart layouts per instrument class:**
  - **Spot:** candles + volume + VWAP + cumulative volume delta (CVD).
  - **Perps:** candles + funding rate overlay + open interest overlay + liquidation levels marked.
  - **Dated futures:** candles + basis vs spot subpane + days-to-expiry awareness.
  - **Options:** surface-driven, not chart-driven (see below).
- **Footprint / order-flow charts** for short-horizon entries — bid/ask volume per candle, delta divergence.
- **Volume profile** — session, weekly, composite. He cares about high-volume nodes as magnets / rejection zones.
- **Liquidation heatmap** — clusters of leveraged positions the market will hunt.
- **Funding heatmap** — across venues and instruments: where is funding extreme?

### Microstructure data

- **Aggregated order book depth** across Binance spot, Binance perps, Bybit, OKX. Same instrument, multiple venues, stacked depth.
- **CVD per venue and aggregated.**
- **Large trade tape** — every print above $1M, with venue and aggressor side. Whale tape.
- **Liquidation feed** — real-time longs/shorts liquidated, with size and venue.
- **Open interest changes** — OI delta over 1h / 4h / 24h, per venue, per instrument. Combined with price = is this new money or short covering?

### Cross-instrument context (this is huge for a crypto pro)

- **Spot–perp basis** in bps and annualized, per asset, per venue.
- **Dated futures term structure** — Mar / Jun / Sep / Dec curves on Binance and CME.
- **Funding rate term structure** — current, 8h-ahead implied, weighted across venues.
- **Options term structure & smile** — Deribit IV by tenor, 25-delta risk reversals (skew), butterflies (kurtosis), DVOL.
- **Cross-asset correlations** — BTC-ETH, BTC-SOL, BTC-SPX, BTC-DXY rolling correlation panel.
- **Stablecoin flows** — USDT/USDC mint/burn, exchange inflows. Indicates dry powder.

### Macro and on-chain

- **Macro tickers always visible** — DXY, US 10Y yield, SPX futures, gold, oil, VIX, MOVE.
- **Economic calendar** — CPI, FOMC, NFP highlighted with countdown timers.
- **On-chain dashboard** — exchange netflows, miner outflows, stablecoin supply, ETH staking flows, ETF flows (spot BTC/ETH ETFs).
- **Whale alert feed** — large on-chain transfers, especially to/from exchanges.

### Sentiment

- **Funding-as-sentiment proxy** — extreme positive funding = crowded longs.
- **Long/short ratios** per venue.
- **Options put/call ratio and 25-delta skew** as fear/greed proxies.
- **Social** — curated Twitter/X list, fear & greed index, Santiment-style social volume.

### Scanners

- **Outlier scanner** — coins moving >3σ on volume, funding spiking, OI exploding.
- **Basis / funding arb scanner** — where is the spot-perp or perp-dated basis abnormal?
- **Options flow scanner** — unusual option size, IV moves, gamma walls.

**Layout principle:** primary chart and the cross-instrument context dashboard are the two most-glanced surfaces. Everything else is consultable but not always foveal.

---

## Phase 2: Enter

A custom terminal beats Binance's UI by an order of magnitude here.

### Order entry ticket — multi-leg native

- **Multi-leg tickets.** Build a single ticket: "long 100 BTC spot, short 100 BTC perp" — submit both legs atomically with leg-level slippage tolerances.
- **Bracket orders native** — entry + stop + multiple take-profits, with partial-fill rules.
- **OCO and trailing stops** — server-side preferred (less latency risk than client-side simulated).
- **Time-in-force and post-only** — he uses post-only constantly to earn rebates; the ticket defaults to post-only and warns if removed.
- **Reduce-only flag** for perp exits — prevents accidental position flips.
- **Pre-trade preview shows:**
  - Margin impact (initial + maintenance).
  - Resulting position size and avg entry.
  - Resulting greeks (if options leg).
  - Resulting net exposure on the book (delta, by asset).
  - Estimated slippage and market impact based on current depth.
  - Estimated fees (maker vs taker, with VIP tier applied).
  - Liquidation price after fill.

### Execution algos (built in-house)

- **VWAP / TWAP** with custom participation curves.
- **POV (percentage of volume).**
- **Iceberg** — show 5% of size, refresh logic configurable.
- **Sniper / liquidity-seeking** — sits passive, crosses only when conditions met.
- **Implementation shortfall** — minimizes total cost vs arrival price.
- **Cross-venue smart router** — even though Binance is primary, can sweep Bybit/OKX if Binance depth is poor and policy allows.

### DOM / ladder

- **Aggregated multi-venue ladder** — Binance + Bybit + OKX depth stacked, with venue color-coding.
- **Click-to-trade** at any price level.
- **Iceberg detection** highlighted.
- **Footprint inside the ladder** — recent volume traded at each level.

### Hotkeys

- Buy/sell at bid/ask.
- Flatten current instrument.
- Cancel all working orders on current instrument.
- Reverse position.
- Move all working stops to breakeven.
- Toggle reduce-only.
- **Kill switch** — special key combo, requires confirmation.

### Order management

- **Working orders shown inline on the chart** as draggable lines. Drag to move price. Right-click to cancel.
- **Position marker on chart** with avg-price line, liquidation line, stop/target lines.
- **Latency indicator** — round-trip ms to Binance, color-coded.
- **Rate-limit indicator** — how close to the per-minute API limit.

**Layout principle:** order ticket and DOM adjacent to primary chart. Hotkey execution is the default; clicking is for non-time-critical orders.

---

## Phase 3: Hold / Manage

This is where a multi-instrument crypto trader's terminal differs most from a single-asset equity setup.

### Positions blotter — aggregated by underlying

A flat list of positions is useless when one underlying has spot + perp + dated future + options legs. Marcus needs:

- **Aggregated view per underlying** — e.g.
  _"BTC: net delta +$4.2M, net gamma +$80k/$, theta –$12k/day, vega +$45k, financing –$8k/day."_
- **Drill-down to legs** — click BTC, see all the spot/perp/future/option positions making up that aggregate.
- **Per-leg detail** — instrument, side, size, avg price, mark, unrealized PnL, funding accrued (perps), basis PnL (futures), greeks (options).
- **Liquidation prices** for leveraged legs, with **distance to liquidation** in % and in standard deviations of recent realized vol.
- **Margin breakdown** — cross vs isolated, initial vs maintenance, free margin remaining.

### Working orders blotter

- Grouped by instrument.
- Modifiable inline (drag price, type new size, hit enter).
- Cancel-all per instrument and globally.
- **Working bracket children visualized** — see which stops/targets belong to which entry.

### Live PnL

- **Total PnL today** — realized + unrealized, broken into spot, perp funding, basis, options theta/vega/gamma realized.
- **Equity curve intraday** — sparkline of mark-to-market.
- **PnL by underlying.**
- **PnL by strategy tag** — directional, basis arb, vol short, calendar.

### Risk panel — multi-dimensional

- **Net delta per asset** ($ and notional).
- **Gross exposure** (sum of absolutes) — important for leverage limits.
- **Beta-weighted to BTC** — book as "equivalent BTC delta."
- **Greeks book-wide** — gamma, vega, theta, rho-funding (sensitivity to funding rate).
- **Stress scenarios** — pre-computed grid (BTC ±5/10/20%, IV ±20%).
- **Concentration warnings** — "your top 3 positions are 80% of risk."
- **Correlation cluster risk** — "you're long 6 L1s; this is one bet, not six."
- **Margin utilization** with warning thresholds.
- **Funding cost projection** — at current rates, perps cost $X over next 8h, $Y over 24h.

### Alerts

- **Price alerts** — multi-condition, per instrument.
- **PnL alerts** — daily drawdown, position drawdown.
- **Funding alerts.**
- **Basis alerts.**
- **Liquidation-cluster alerts** — "$200M of longs cluster at 68k, price approaching."
- **Volatility alerts** — "BTC realized 1h vol just spiked to 2σ."
- **News alerts** — keyword-based on premium news feeds.
- **Connection / API alerts** — WebSocket dropped, REST latency >500ms, rate-limit at 80%.

### Trade journal

- Inline note capture per position: thesis, invalidation, plan.
- Auto-tagging by strategy.
- Linkable to chart snapshots at entry time.

### Heatmap of own book

- Treemap sized by gross exposure, colored by intraday PnL %.
- Glance and know what's working and what's bleeding.

### Kill switch

- **Flatten all positions** — confirmation required. Issues market or aggressive limit orders across all legs.
- **Cancel all working orders** — instant, no confirmation.
- **Pause all algos** — stops in-flight execution algos.
- Three separate buttons; one must not trigger the others by accident.

**Layout principle:** positions, PnL, and risk panel are most-glanced. The chart of the active trade is contextual. Alerts are peripherally visible (corner banner) without being intrusive.

---

## Phase 4: Learn

Different cognitive mode, often a different tab or a different session at end-of-day.

### Trade history & blotter

- Every fill, with venue, instrument, side, size, price, fee (maker/taker), strategy tag, parent order ID.
- Filterable by date range, instrument, strategy, tag.
- Group by parent order to reconstruct execution quality.

### PnL attribution

- **By instrument class** — spot, perp directional, perp funding, basis, options theta, options vega, options gamma scalping.
- **By underlying** — BTC vs ETH vs alts.
- **By strategy tag** — directional vs arb vs vol.
- **By time of day / day of week / market regime** — Asia vs US session, weekend vs weekday, trending vs chop.

### Performance metrics

- Win rate, avg win/loss, expectancy, profit factor.
- Sharpe, Sortino, Calmar.
- Max drawdown, max time underwater.
- All sliced by strategy and regime.

### Equity curve

- Cumulative PnL with drawdown shading.
- Compared against benchmarks (BTC buy-and-hold, BTC perp funding-only).
- Rolling Sharpe (30/60/90 day).

### Trade replay

- Pick any historical trade. Replay the chart with all data layers (orderbook, funding, liquidations, his own orders) reconstructed at that moment. Scrub through the trade.
- Requires a tick-level historical store — non-trivial — but expected at this tier.

### Execution quality / TCA

- Per parent order: arrival price, VWAP during execution, final fill price, slippage vs arrival, slippage vs VWAP.
- Maker vs taker ratio, fees paid, rebates earned.
- Sliced by venue, by algo type, by size bucket.
- Example finding: _"My VWAP algo is leaving 4bps on the table for orders >$5M; investigate."_

### Behavioral analytics

- Time-in-position distribution.
- Overtrading days flagged (trades > 2× daily average).
- Revenge-trade detection (large size shortly after a loss).
- Discipline metrics — % of trades that hit pre-defined stop vs got moved.

### Reports

- Daily PnL report.
- Monthly performance report (for risk, for the PM committee).
- Compliance report (regulatory).
- Client report (if running external capital).
- All exportable, all schedulable.

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
