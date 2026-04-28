# Manual Trader Workflow — Reference

A first-principles reference for what a discretionary (manual) trader actually does, what tools they use at each stage, and what an ideal screen setup looks like. This document deliberately avoids any reference to our current platform — it describes the **ideal world**, to be used later as a yardstick when evaluating what we've built.

---

## The Four Phases of a Trade

Every trade, regardless of style or instrument, passes through four moments:

1. **Decide** — form a view: long, short, or flat? what size? what risk?
2. **Enter** — get the position on at an acceptable price.
3. **Hold / Manage** — monitor PnL, exposure, and the thesis while the position is live.
4. **Learn** — review post-trade to extract patterns and improve.

Everything a trading platform offers — data, charts, models, signals, risk, reporting — exists to serve one or more of these four phases.

---

## Phase 1: Decide (Form a View)

**What the trader is doing:** synthesizing many signals into a directional bias and a concrete plan ("I want to be long X if it holds Y, target Z, stop at W").

### Tools used

- **Multi-timeframe charts** — typically 3–4 timeframes of the same instrument side by side (e.g. 1D, 1H, 15m, 1m). Higher timeframes set bias; lower timeframes time the entry.
- **Indicators overlaid on charts** — moving averages, VWAP, volume profile, RSI/MACD in subpanes. Personal preference, but usually 2–4 max — too many becomes noise.
- **Drawing tools** — trendlines, support/resistance levels, Fibonacci, ranges. The trader's own annotations _are_ their thesis made visible.
- **Market depth / order book (DOM or "ladder")** — for short-timeframe traders, this is where you see real supply/demand, iceberg orders, and spoofing.
- **Time & sales tape** — every print, with size and aggressor side. Reads "who's in control" right now.
- **Correlated instruments panel** — e.g. an equity trader watches SPX, VIX, DXY, 10Y yield, sector ETF. A crypto trader watches BTC dominance, funding rates, ETH/BTC.
- **News / headline feed** — Bloomberg, Reuters, Twitter/X lists, economic calendar. Filtered to what moves their book.
- **Heatmaps** — sector heatmaps, crypto market-cap heatmaps. Quick "where's the action" scan.
- **Scanners / screeners** — "show me everything up >5% on 3× avg volume." Idea generation.
- **Sentiment / positioning data** — funding rates, open interest, put/call ratio, COT reports, options flow.

### Ideal screen layout

- **One large monitor dedicated to charting** (primary chart, multi-timeframe).
- **A second monitor for context** — correlated instruments, news, scanners, heatmaps.
- The chart monitor is where the trader spends ~80% of their cognitive load.
- **Key principle:** the primary instrument's chart never moves. Everything else is auxiliary and rotates around it.

---

## Phase 2: Enter (Act)

**What the trader is doing:** translating the plan into orders — fast, and without errors.

### Tools used

- **Order entry ticket** — instrument, side, size, price, type, time-in-force, venue. Must be reachable in 1–2 clicks or via hotkey.
- **DOM / ladder** — many pro traders enter directly from the ladder by clicking price levels. Especially common for futures and crypto-perp traders.
- **One-click trading / hotkeys** — buy bid, sell ask, flatten all, reverse position, cancel all. Speed matters.
- **Pre-trade risk preview** — "this order will use $X margin, take you to Y% of position limit, here's the worst-case loss at your stop." Shown _before_ submission.
- **Position sizing calculator** — "I want to risk $500, my stop is 0.8%, so size = X." Often built into the ticket.
- **Bracket / OCO orders** — entry + stop + target as one atomic submission. Critical for disciplined traders.
- **Algo / execution strategy picker** — VWAP, TWAP, POV, iceberg, sniper. For larger size.
- **Smart order router view** — which venue, which path, why.
- **Confirmation dialog** (toggleable) — for large or unusual orders.

### Ideal screen layout

- The order ticket lives **adjacent to the chart**, usually right side, always visible.
- The DOM sits next to or below the ticket.
- **Working orders and current position appear inline on the chart** as horizontal lines you can drag to modify — this is table stakes for a modern trading UI.
- Hotkey legend visible somewhere (or memorized).
- **Latency indicator visible** — if the venue is laggy, the trader needs to know _now_.

---

## Phase 3: Hold / Manage (In-Trade)

**What the trader is doing:** watching the position breathe, deciding when to add, trim, move stops, or bail. This is where most PnL is won or lost.

### Tools used

- **Live positions blotter** — instrument, side, size, avg price, mark price, unrealized PnL ($, %, R-multiple), margin used, liquidation price (for leveraged). Sortable, color-coded.
- **Working orders blotter** — all resting orders, modifiable inline, cancellable in one click.
- **Live PnL panel** — total PnL today, by strategy, by instrument. Equity curve intraday.
- **Risk panel** — gross/net exposure, beta-weighted exposure, VaR, greeks (options), concentration, correlation cluster risk.
- **Alerts** — price-based ("ping me if BTC breaks 70k"), PnL-based ("alert at –$5k drawdown"), event-based ("FOMC in 5 min"). Audio + visual.
- **Trade journal / notes** — quick text capture: "why did I take this? what's my invalidation?" Searchable later.
- **Heatmap of own book** — at a glance: what's green, what's red, what's hurting.
- **News filter pinned to current positions** — only headlines for instruments I'm in.
- **Kill switch** — flatten all, cancel all. Big red button. Hotkey.

### Ideal screen layout

- Once a trade is on, attention shifts. The **positions and PnL panel becomes the most-watched element**, often promoted to a dedicated monitor or the top half of the secondary screen.
- The chart still matters but is now _contextual_ (am I still in the trade thesis?) rather than _generative_.
- Risk panel and alerts need to be **peripherally visible without being dismissed** — the trader wants to notice a breach without staring at it.

---

## Phase 4: Learn (Post-Trade)

**What the trader is doing:** reviewing the day, week, or month to extract patterns. This is what separates pros from amateurs.

### Tools used

- **Trade blotter (historical)** — every fill, filterable by date, instrument, strategy, tag.
- **PnL attribution** — by instrument, strategy, time of day, day of week, market regime. "Where do I actually make money?"
- **Performance metrics** — win rate, avg win / avg loss, expectancy, Sharpe, Sortino, max drawdown, Calmar, profit factor. Both overall and per slice.
- **Equity curve** — cumulative PnL with drawdown shading. Visual gut-check.
- **Trade replay** — pick a trade, replay the chart with entry/exit/stops marked, see what you saw then. The single most valuable review tool.
- **Tag analytics** — "all my trades tagged 'breakout' have 60% hit rate; 'fade' has 40%." Drives strategy refinement.
- **Slippage / execution quality** — expected vs realized fill price, by venue, by order type. Are you leaving money on the table?
- **Behavioral metrics** — overtrading days, revenge-trade detection, time-in-position distribution.
- **Reports** — exportable for compliance, prime broker, clients.

### Ideal screen layout

- This is **not real-time** — it's a workspace, often a separate tab or even a separate session.
- Big tables, big charts, drill-down navigation.
- The trader sits down at end-of-day or start-of-week and _studies_. Different cognitive mode entirely from live trading.

---

## Cross-Cutting Principles

These show up in every phase and are worth calling out separately.

1. **Information density vs. clarity.** Pros want a lot on screen, but every element must earn its pixels. No decorative chrome.
2. **Latency-of-glance.** The question "what's my PnL right now?" should be answerable in <1 second, no clicks.
3. **Spatial memory.** The trader knows where everything _is_. Layouts should be persistent and customizable per user — never auto-rearranging.
4. **Phase-appropriate freshness.**
   - Decide phase: 1-second updates are fine.
   - Enter / Hold: sub-100ms demanded.
   - Learn: minute-old (or older) data is acceptable.
5. **One source of truth for state.** Position size shown on the chart, in the blotter, and in the risk panel must always agree. Disagreement = lost trust = trader stops using the platform.
6. **Hotkeys everywhere.** Mouse is for chart analysis; keyboard is for action.

---

## How to Use This Document

This is the **ideal-world reference**. When evaluating any trading UI (including our own), walk through the four phases and ask:

- Are all the tools listed for this phase available?
- Is the screen layout principle for this phase respected?
- Are the cross-cutting principles upheld?

Gaps against this list are not necessarily bugs — they may be deliberate scope decisions — but they should be _known_ gaps, not _accidental_ ones.
