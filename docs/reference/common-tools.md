# Common Tools — Shared Platform Surfaces

A concise index of the surfaces every (or nearly every) trader archetype on the floor uses. The **detail** of how each surface looks per archetype lives in the individual `trader-archetype-*.md` files; this doc is a **tracker** so we can see at a glance what tools belong to the shared platform layer vs. what's archetype-specific (see [unique-tools.md](unique-tools.md)).

For the underlying workflow, see [manual-trader-workflow.md](manual-trader-workflow.md). For the full archetype list, see [INDEX.md](INDEX.md).

---

## What "Common" Means Here

A surface is **common** if 5+ archetypes need it. The _content_ often varies dramatically (Marcus's positions blotter is multi-instrument crypto; Ingrid's is DV01-bucketed; Sasha's is greek-decomposed; Naomi's is deal-attached). But the _shape_ is shared — the platform must build one cohesive framework with archetype-specific configurations on top.

This is the architectural insight: most of the platform is shared. The archetype-specific bits sit on a foundation of these common tools.

---

## The Common Tools

### 1. Multi-Timeframe Charting

#### What it is

A multi-pane, multi-timeframe price-time charting surface that supports indicator overlays, drawing tools, comparison overlays, and persistent layouts. The single most-used analytical surface for any directional trader. Even archetypes whose primary "thinking surface" is something else (Sasha's IV surface, Diego's ladder, Ingrid's yield curve) still maintain a chart workspace as a contextual reference.

#### Why it matters

Price action over time is the universal language of markets. Trends, breakouts, supports, resistances, and divergences are read off charts. For multi-TF traders, higher timeframes set bias and lower timeframes time the entry — both are needed simultaneously.

#### Standard shape

- **Multi-pane:** typically 2–4 timeframes side-by-side or stacked, all driven from one symbol selector. Click any pane to focus, scroll to zoom, drag to pan — gestures consistent across panes.
- **Indicator library:** moving averages, VWAP, anchored VWAP, RSI / MACD / stochastic, Bollinger bands, Ichimoku, volume profile, ATR, custom user-defined.
- **Drawing tools:** trendlines, horizontal levels, Fibonacci (retracement, extension, time), channels, ranges, text annotations. **Persistent across sessions** — a trader's drawings are their thesis.
- **Compare overlay:** plot a second instrument on the same axes, normalized.
- **Crosshair sync** across panes — same time index, all panes show that moment's data.
- **Replay mode:** scrub backward through time, with bars revealed left-to-right; used for thesis testing and post-trade review.
- **Saved layouts:** per-instrument and per-strategy chart layouts, swappable in one click.
- **Working orders + position lines drawn inline on the chart**, draggable to modify; this is table stakes for a modern terminal.

#### Design principles

- **Charts must feel native, not webby.** GPU-accelerated rendering, sub-frame interaction. A laggy chart is unusable for an active trader.
- **Drawings persist forever.** A trader who annotated a level six months ago must see it when they return to the chart today.
- **Symbol changes preserve layout.** Switching from BTCUSDT to ETHUSDT keeps the same panes / TFs / indicators.
- **High-density display modes.** Pro traders want minimal chrome; toggle to hide axes labels, indicator legends, etc., when needed.
- **Event markers are first-class.** Earnings, FOMC, auctions, inventory releases, deal announcements appear as vertical lines or shaded windows automatically.

#### Archetype-specific extensions

The _shape_ above is universal; the _overlays_ differ per archetype. Each archetype doc lists its specific overlays and the resulting custom chart layout. Examples:

- **Marcus** — funding rate overlay on perps, OI overlay, liquidation-level markers, footprint chart variant for short-horizon entries. See [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md).
- **Henry** — earnings markers (every prior earnings as a vertical line with surprise direction), insider Form 4 markers, short-interest overlay, anchored VWAP from key dates. See [trader-archetype-henry-equity-long-short.md](trader-archetype-henry-equity-long-short.md).
- **Theo** — 5-year seasonal average overlays, hurricane / weather event markers, inventory-release vertical lines. See [trader-archetype-theo-energy.md](trader-archetype-theo-energy.md).
- **Ingrid** — switches default from price chart to **yield curve** as primary visualization (different topology entirely; see surface #31 below for curve visualizations). Price charts secondary. See [trader-archetype-ingrid-rates.md](trader-archetype-ingrid-rates.md).
- **Sasha** — chart workspace is contextual, not foveal; the IV surface is the chart. See [trader-archetype-sasha-options-vol.md](trader-archetype-sasha-options-vol.md).
- **Diego** — chart workspace is contextual; the ladder + video is foveal. Pre-event form-curve charts during research. See [trader-archetype-diego-live-event.md](trader-archetype-diego-live-event.md).
- **Yuki** — Ichimoku popular as an FX-native indicator; CB-meeting and fixing-window overlays. See [trader-archetype-yuki-fx.md](trader-archetype-yuki-fx.md).

#### Used by

All 15 archetypes maintain a charting surface. **Foveal for:** Marcus, Julius, Henry, Theo, Yuki, Naomi, Rafael (theme-asset focus charts). **Contextual / secondary for:** Mira (state monitoring dominates), Sasha (IV surface dominates), Ingrid (yield curve dominates), Diego (ladder dominates), Aria (markets pipeline dominates), Quinn (fleet dashboard dominates), David (aggregate dashboards dominate). **Not used by:** Elena (her surface is performance reports, not charts).

---

### 2. Order Entry Ticket Framework

#### What it is

The ticket is the surface that translates a trade decision into one or more orders sent to one or more venues. The "framework" view is critical: a serious platform does **not** build N separate tickets for spot, perps, options, on-chain swap, RFQ, ladder, etc. It builds **one ticket framework** with mode-aware UX, shared components (instrument selector, side, size, type, TIF, pre-trade preview, compliance, hotkeys), and pluggable mode-specific extensions. Mode is inferred from the focused instrument (or selected explicitly).

#### Why it matters

Trade entry is where intent meets execution. Errors here are the most expensive errors a trader can make — wrong side, wrong size, wrong instrument, wrong account. The ticket must minimize cognitive load (right defaults, fewest fields), maximize speed (hotkeys, presets, click-to-trade), and prevent fat-finger errors (confirmations only when warranted, large-trade attestations, reduce-only flags).

#### Standard shape

A single ticket layout that adapts:

- **Instrument selector** — autocomplete, recents, watchlist-aware, with tab/search across asset classes the trader has access to.
- **Side / direction** — buy/sell, long/short, back/lay (sports), YES/NO (prediction). Color-coded.
- **Size input** — accepts notional, contracts, $-amount, % of book, or risk-based ("risk $500 to my stop"). Display switchable.
- **Order type** — market, limit, stop, stop-limit, trailing stop, peg-to-mid, peg-to-spread, reduce-only, post-only, IOC, FOK, GTC, GTD. Per-venue subset honored.
- **Time-in-force** — explicit, with sane defaults per instrument class.
- **Venue / route selector** — single-venue or smart-router (see #5).
- **Pre-trade preview** — see #3 (Pre-Trade Risk Preview).
- **Strategy / theme / deal tag** — mandatory, see #29 (Strategy Tagging Framework).
- **Compliance check inline** — see #28 (Compliance & Audit Trail).
- **Submit** — single click; large/unusual orders get a confirmation gate, configurable per user.
- **Confirmation + audit** — every submission returns a reference ID, timestamps, server-acknowledged state.

The framework supports **modes** — pluggable extensions of the basic shape:

- **Single-instrument** — the simplest case.
- **Multi-leg / structure** — multiple legs as one atomic submission, with leg-level slippage tolerances and atomic-or-nothing semantics. Templates per archetype (straddle, condor, calendar spread, butterfly, pair).
- **Bracket / OCO** — entry + stop + target (or multiple targets) as one submission with partial-fill rules.
- **Ladder click-to-trade** — submit at the price level clicked in a DOM ladder; sticky stake from preset.
- **RFQ workflow** — request quotes from a dealer panel, aggregate responses, hit/lift in one click.
- **Algo selection** — choose VWAP / TWAP / IS / POV / iceberg etc. (see #4) with per-algo parameters.
- **On-chain mode** — wallet selector, gas strategy, slippage tolerance, simulation pre-send, approval state, nonce manager, private vs public mempool toggle.
- **Cross-venue / cross-domain mode** — for trades spanning CeFi and DeFi or multiple sportsbooks: legs at different venues, sequenced where atomicity is impossible, with leg-out risk surfaced.

#### Design principles

- **One ticket framework, not many.** Mode-aware, not mode-fragmented. The trader's muscle memory transfers across asset classes.
- **Defaults are opinionated.** Post-only by default for a market-maker, reduce-only by default for an exit, GTC by default for swing trades. Defaults differ per archetype.
- **The ticket lives next to the chart**, always visible during the Decide-Enter transition.
- **Hotkeys reach every field.** Tab-cycle, hotkey-set-side, hotkey-set-size-from-preset, hotkey-submit. No mouse needed for routine submissions.
- **Submit is irreversible visually.** Once sent, the ticket immediately shows the working state; a sent order is never confused with an unsent draft.
- **Failed submissions surface why.** Reject reason, venue response, suggested fix.
- **Templates and presets are first-class.** Saved structures, saved sizes, saved venue routes — one click to load.

#### Archetype-specific extensions

Each archetype's ticket adds modes and fields specific to that market. Detail belongs in the archetype doc.

- **Marcus** — multi-leg native (e.g. long BTC spot + short BTC perp atomic), bracket-capable, post-only-default for rebates, reduce-only for perp exits, leg-level slippage tolerance. Greeks impact preview when an options leg is included. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — three modes in one: Marcus-style CeFi ticket; on-chain action ticket (swap / LP / lend / borrow / stake / multicall) with simulation, gas strategy, MEV-routing toggle, approval and nonce management; bridge ticket for cross-chain. Cross-domain unified ticket when trade spans CeFi + on-chain. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — not an order ticket in the discretionary sense; the "ticket" is the **quote-engine parameter control panel** (widths, skews, sizes). Manual hedging ticket exists as a fallback. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — multi-leg structure builder with vol-quoted entry ("buy at 62 vol" not "buy at $1430"), structure templates (straddle, strangle, condor, calendar, butterfly, ratio), greeks-of-structure preview, scenario PnL grid before submit, integrated delta-hedge-on-fill toggle. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — single-name + pair (long target / short comp with ratio enforcement) + basket modes; risk-arbitrage ticket variant; locate-availability + borrow-cost inline; pre-trade compliance attestation for large or restricted-list names. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — outright + curve (steepener/flattener) + butterfly + basis (cash–futures) + swap tickets, all DV01-balanced and atomic, all quoted in **bps** (or yield), not price. RFQ workflow integrated for swaps and large cash. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — multi-asset multi-leg ticket where legs span equities + rates + FX + commodities + credit, each leg sized by **risk contribution** rather than notional. Theme tag mandatory. Expression-comparison tool sits beside the ticket (compare options vs spot vs spread expressions for the same thesis). See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — spot + forward + FX swap + NDF + cross/synthetic tickets; multi-LP aggregation visible (top-5 bid/offer per LP); fixing-targeted variant; intervention-zone warnings inline. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — outright + calendar-spread + crack-spread + crush-spread tickets, all atomic; quoted in $/bbl or $/MMBtu where conventional. Roll workflow as a designed first-class action. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — single-name (cash deals) + cash-and-stock pair (deal ratio enforced) + capital structure (long bond / short equity, etc.) + tender / claims tickets. Borrow availability + recall-risk flagged inline; deal-attached at submission. See [naomi](trader-archetype-naomi-event-driven.md).
- **Diego** — back/lay ladder click-to-trade is the dominant entry mode; multi-bet builder for accumulators/parlays; cross-book/arb ticket for sportsbook+exchange dual execution; saved one-click strategy templates (lay-the-draw, tennis serve scalp, racing pre-final-furlong). See [diego](trader-archetype-diego-live-event.md).
- **Aria** — probability-quoted ticket (YES/NO, stake/limit-price in probability), basket/cluster ticket for related markets sized by conviction or model edge, triangular-arb ticket detected and proposed, on-chain mode (Polymarket) and regulated mode (Kalshi) UX adapt automatically. Kelly / fractional-Kelly sizing inline. See [aria](trader-archetype-aria-prediction-markets.md).
- **Quinn** — manual override ticket with mandatory reason field; rare path. Primary "entry" surface is the strategy control panel (start/pause/cap/limits), not a tick-level ticket. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **David** — no trade ticket. His "entry" is **capital-allocation** and **risk-limit-change** tickets, with mandatory reason and sign-off workflow for large changes. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — no trade ticket. Her "entry" is **subscription / redemption / share-class-switch** flows. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15 archetypes use a ticket framework — but the meaning of "ticket" differs (Quinn's is operational, David's is allocational, Elena's is capital-movement). The trade-execution ticket (the platform-classic ticket) is used by Marcus, Julius, Sasha, Henry, Ingrid, Rafael, Yuki, Theo, Naomi, Diego, Aria. Mira's is a parameter panel, not a ticket; her manual-hedge ticket is the platform-classic shape.

---

### 3. Pre-Trade Risk Preview

#### What it is

A panel inside the ticket — visible _before_ submit — that shows the consequences of the proposed order: how it changes the trader's positions, margin, exposure across multiple risk axes, and how it interacts with limits. Pre-trade preview is what separates a professional terminal from a retail one.

#### Why it matters

The decision to submit is made faster than the decision to think through consequences. The preview pre-computes consequences so the trader can adjust before sending, not regret after. For senior traders managing books with multi-axis risk (greeks, DV01, currency-decomposed, counterparty, factor), the preview is _the_ mechanism by which they catch sizing errors and unintended exposure.

#### Standard shape

The preview updates live as the ticket fields change. It always shows:

- **Resulting position** — new size, new average price, new direction (with a flag if direction changes).
- **Margin & collateral impact** — initial + maintenance + free-margin remaining, per venue and aggregate.
- **Exposure impact across the trader's primary risk axes** (see "Archetype-specific axes" below).
- **Concentration impact** — % of book / sector / counterparty after fill, with limits visible (warning at 80%, block at 100%).
- **Estimated execution cost** — slippage based on current depth, fees (maker vs taker, with VIP tier applied), commissions, gas (DeFi), bridge fees (DeFi cross-chain), borrow cost (shorts), funding cost (perps).
- **Liquidation / break-price** — for leveraged positions, the price at which the position auto-liquidates; for binary/event positions, the loss if the deal breaks.
- **Limit / compliance status** — green / amber / red. Restricted-list, position-threshold-approach, locate-required, jurisdiction-blocked all surfaced inline.
- **Total all-in cost in basis points** — single comparable number across asset classes.

#### Design principles

- **Live, not on-demand.** The preview updates as the trader types; no "calculate" button.
- **Trader-native units.** Dollar-notional for crypto-spot; DV01 for rates; greeks for options; beta-adjusted for equities. Each axis must speak the trader's language.
- **Worst-case shown alongside expected.** Slippage estimate paired with worst-case-under-current-mempool (DeFi) or worst-case-under-current-depth (CeFi).
- **Compliance is non-bypassable for hard blocks** — soft warnings can be acknowledged; hard blocks (restricted list, jurisdiction, kill-switch active) require unblocking via separate workflow.
- **Aggregation is correct.** A trade impacting multiple positions (close + reverse, for example) shows the _net_ impact, not just the immediate trade.

#### Archetype-specific extensions

The axes shown differ per archetype. Each archetype doc lists its specific risk-preview content.

- **Marcus** — margin (initial + maintenance), resulting position size and avg entry, resulting greeks (if options leg), resulting net delta on book by asset, estimated slippage from current depth, fees (maker vs taker with VIP tier), liquidation price after fill. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — net delta per asset across the **entire book including on-chain**, liquidation risk for every leveraged leg on every venue, counterparty/protocol exposure breakdown ("this trade increases your Aave exposure to 22% of book"), smart-contract risk score, bridge/oracle dependencies, gas + slippage + bridge fees + CEX fees as one all-in basis-point cost. See [julius](trader-archetype-julius-hybrid.md).
- **Sasha** — net delta + gamma + vega total + vega-by-tenor + vega-by-strike + theta + vanna + volga added to book, pin risk if held to expiry, max loss in stress scenarios, scenario PnL grid (spot moves × vol moves) before submit. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — beta-adjusted exposure added, sector concentration impact, factor exposure impact (value/growth/momentum/quality), margin/leverage impact, locate availability + borrow rate for shorts, compliance attestation for large positions, all-in cost (commission + impact + spread + financing). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — DV01 by tenor bucket added, total DV01 added (should be ~zero for curve trades), convexity / gamma added, carry & roll for the structure, funding cost for the structure. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — risk added in each axis simultaneously: equity beta, rates DV01, FX delta, commodity delta, credit DV01, vega. Theme-level P/L impact under each pre-defined macro scenario. Margin / leverage / counterparty consumption. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — currency-decomposed delta added (long EUR / short USD / etc., not just "long EURUSD"), settlement-ladder impact (T+1 / T+2 obligations), forward-points implied carry change, intervention-zone proximity warning. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — DV01-equivalent by tenor (price sensitivity to $1 move), spread P/L per scenario for multi-leg structures, margin (initial + maintenance + variation), seasonal-context flag (entering a winter natgas long mid-summer is different from late-fall). See [theo](trader-archetype-theo-energy.md).
- **Naomi** — deal-specific: spread captured at fill, days to close, annualized return, IRR, break price (where target trades if deal breaks), max loss if deal breaks, probability-weighted expected value, hedge effectiveness preview, capital usage (long + short), borrow cost annualized. See [naomi](trader-archetype-naomi-event-driven.md).
- **Diego** — liability if losing (for lay bets), profit if winning after commission, position impact on this event, aggregate exposure across all live events, bet-delay flag (in-play stale-quote risk). See [diego](trader-archetype-diego-live-event.md).
- **Aria** — cost (stake), max payout (if right), implied edge (fair-price model output vs entry), days-to-resolution, capital-lockup duration, venue fees + gas + bridging cost, resolution-source health. See [aria](trader-archetype-aria-prediction-markets.md).
- **Mira** — preview applies to **manual hedge orders only** (her quoting engine bypasses ticket-level preview by design — quotes are sent at line-rate). For manual hedges: inventory impact, residual risk after hedge. See [mira](trader-archetype-mira-market-maker.md).
- **Quinn** — preview for the rare manual override; primarily emphasizes "this overrides strategy X, with effect Y on strategy attribution." See [quinn](trader-archetype-quinn-quant-overseer.md).
- **David** — for capital-allocation changes: impact on trader's risk budget, correlation impact on existing fleet, capacity utilization. For limit changes: which positions are currently at the limit and would be affected. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — for subscription/redemption: gates / lockups / fees acknowledged, expected effective NAV date, wire instructions confirmed. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. The preview is the single most-universal pre-execution surface across the floor — its content varies dramatically; its presence does not.

---

### 4. Execution Algos Library

#### What it is

A library of in-house execution algorithms accessible from the order ticket. Algos slice a parent order into many child orders over time and venues to achieve a stated objective (minimize slippage, target a benchmark price, hide size, harvest spread). Top firms run their _own_ algos rather than using broker / venue algos because the firm-specific edge — historical execution data, custom signal overlays, in-house anti-gaming logic — lives in the implementation.

#### Why it matters

For senior traders managing multi-million-dollar parent orders, the difference between a naive market sweep and a well-tuned algo is often **5–30 basis points on the parent order**. On a $100M parent, that's $50k–$300k of execution cost saved. Multiply by frequency, and execution algorithms are a multi-million-dollar P/L lever per trader per year. This is precisely the "1% to the bottom line" Wall Street pays millions to capture.

#### Standard shape — the canonical algo set

- **VWAP (volume-weighted average price)** — execute to track the market's volume-weighted average over a window. Custom participation curves (front-loaded / U-shape / back-loaded). Anti-gaming logic to avoid being predicted at curve inflections.
- **TWAP (time-weighted average price)** — split equally over time. Useful in low-volume markets where VWAP is gameable.
- **POV (percentage of volume)** — stay at X% of the market's traded volume; speed up when the market is active, slow down when it's quiet.
- **Implementation Shortfall (IS)** — minimize total cost vs the **arrival price** (the price when the parent order was sent), balancing market impact against opportunity cost. The most rigorous benchmark for institutional execution.
- **Iceberg** — show only a small fraction (5–20%) of size at top of book; refresh logic configurable (immediate vs randomized delay vs price-trigger).
- **Sniper / liquidity-seeking** — sit passive across venues, cross only when a defined condition is met (price level, depth threshold, volume signal).
- **Peg-to-mid / peg-to-spread** — quotes follow the mid (or a fixed offset from mid) as the market moves; common for passive accumulation.
- **Time-in-force algos** — TIF-shaped behavior, e.g. accelerate before market close.

#### Per-instrument-class extensions

Beyond the canonical set, each market has its own essential algos. The platform's algo library should include:

- **Equities (Henry):** close-auction (MOC / LOC) participation, opening-auction participation, dark-first liquidity-seeking, earnings-window deferral or acceleration, VWAP shaped to historical volume curve of the symbol.
- **Rates (Ingrid):** auction-aware (defer execution before/during Treasury auctions), roll algos for futures (calendar-spread-aware execution during quarterly roll), TWAP-on-cash with RFQ fallback for size.
- **FX (Yuki):** fixing-aware (target WMR 4pm London / ECB / NY / Tokyo fixings with deviation tracking), session-aware (Tokyo vs London vs NY liquidity profiles), TWAP with last-look-aware LP routing.
- **Energy (Theo):** calendar-spread-aware (execute outright while monitoring spread to optimize), settlement-window participation (trade-at-settlement), inventory-release-window deferral (skip trading 5 minutes before/after EIA report), seasonal-weighted volume curves.
- **Crypto perps / spot (Marcus, Julius):** funding-aware (execute size in the hour before funding settlement to capture/avoid the funding charge), liquidation-zone-aware (avoid sweeping into known liquidation clusters), MEV-aware on on-chain legs.
- **Options (Sasha):** vol-pegged (leave a quote at "buy 62 vol" and the engine adjusts $-price as the underlying moves), legged-execution-with-delta-hedge (execute the option leg + simultaneous spot/perp hedge atomically), block-RFQ-with-fallback.
- **Prediction markets (Aria):** TWAP / scaled entry for size in thin markets, liquidity-seeking with limit-spread placement, resolution-window algos that accelerate or defer as resolution approaches.

#### Cross-venue smart-router algos

A separate but related class — algos that decide _which venue_ to send to, in addition to _when_. These overlap with #5 (Smart Order Router). Examples:

- **Cross-venue VWAP** — split a parent across venues by their share of historical volume.
- **Liquidity-seeking with venue toxicity score** — avoid venues whose recent fills predict adverse drift.
- **Dark-first** — try non-displayed liquidity (dark pools, midpoint matching, RFQ) before lit venues.

#### Design principles

- **Algos are stateful, observable, and pausable.** A trader can see the algo's progress (% complete, average fill, slippage so far) and pause / resume / cancel mid-execution.
- **Algos can be scheduled** — start at 9:35am, end at 3:55pm. Or event-triggered ("start when funding crosses zero").
- **Algos must be measurable post-trade.** Every parent has TCA against the algo's stated benchmark. Algo P/L (the savings vs naive market sweep) is reported per algo per instrument per size bucket.
- **Algo parameters are saveable as profiles.** "BTC-VWAP-aggressive," "ES-IS-conservative" — one click to load.
- **Anti-gaming is mandatory.** Patterns that can be detected by other market participants are corrected (jitter on slice timing, randomized child sizes within tolerance, etc.).
- **Algos respect compliance.** Restricted-list checks, position limits, daily-volume limits enforced at child-order level.

#### Archetype-specific extensions

Each archetype's algo library content is detailed in their doc.

- **Marcus** — the canonical set + cross-venue smart router for Bybit/OKX sweep when Binance depth poor. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — canonical CeFi set + on-chain TWAP/VWAP that splits a large swap across blocks/hours, MEV-aware execution paths. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — algos are her _quote-engine logic_, not parent-order algos. The quote engine itself is a permanent algo running in production; "algos" in the canonical sense are not her primary tool. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — vol-pegged orders, legged-with-delta-hedge, block/RFQ-with-fallback. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — full equity algo suite (VWAP, TWAP, IS, POV, dark-first, close-auction, opening-auction, earnings-window-aware). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — TWAP/VWAP for futures, iceberg for cash treasuries, auction-aware deferral, calendar-spread-aware roll algos. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — appropriate per-asset-class algos for each leg of a multi-asset trade. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — TWAP, VWAP, IS, fixing-targeted (WMR / ECB / NY / Tokyo), session-aware. **Vol-pegged for FX options** crossover. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — TWAP/VWAP for futures, calendar-spread-aware, auction-aware deferral around EIA reports, settlement-window algos for trade-at-settlement, roll algos. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — VWAP/TWAP for large positions, spread-targeting algos (execute when pair spread reaches X), close-tightening as deal close approaches. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — algos are inputs to her strategies, not direct tools. Strategies internally use the algo library. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Aria** — TWAP / scaled entry for size in thin markets, liquidity-seeking, limit-spread orders for passive capture, resolution-window algos. See [aria](trader-archetype-aria-prediction-markets.md).
- **Diego** — algos play a smaller role; in-play execution is hotkey-driven from the ladder. Pre-event entry can use scaled execution but it's manual. See [diego](trader-archetype-diego-live-event.md).
- **David, Elena** — not algo users.

#### Used by

Marcus, Julius, Sasha, Henry, Ingrid, Rafael, Yuki, Theo, Naomi, Aria. Mira's analog is the quote engine itself. Diego uses minimally. Quinn's strategies use algos internally. David and Elena do not use them.

---

### 5. Smart Order Router / Multi-Venue Aggregation

#### What it is

A sub-system that aggregates depth across multiple execution venues, computes best-price routes, and splits orders intelligently to minimize total cost (price impact + spread + fees + MEV + bridge cost). Distinct from the algo library (#4), though they cooperate: the SOR decides _where_, the algo decides _when and how_.

#### Why it matters

Modern markets are fragmented. Equities trade across NYSE / NASDAQ / dark pools / ATSs (15+ venues each); FX across ECN / multi-bank / single-dealer (50+ effective LPs); crypto across Binance / Bybit / OKX / Coinbase / Kraken / Hyperliquid; on-chain across Uniswap / Curve / Sushi / Balancer / 1inch / CowSwap aggregators; sports across Betfair / Smarkets / Pinnacle / Matchbook; prediction markets across Polymarket / Kalshi / Smarkets / Betfair. **No single venue has the best price for everything.** The SOR is how a trader gets best execution without manually managing 20+ venues.

#### Standard shape

- **Aggregated depth view** — bid/offer stacks from all reachable venues, with venue attribution color-coded. Combined depth available at each price level.
- **Best-price routing** — for a given size, the SOR computes which venues to hit, in what order, with what size at each, to minimize total expected cost.
- **Venue characteristics tracked:**
  - Latency (round-trip time).
  - Last-look risk (FX) — venues that allow LP rejection of trades; rejection rate per LP tracked.
  - Maker/taker fee schedule with VIP-tier-applied effective rate.
  - Rebate availability.
  - Minimum tick size.
  - Reject rate and reasons.
  - Recent toxic-flow score (was the last fill at this venue followed by adverse drift?).
- **Routing modes:**
  - **Aggressive** — sweep displayed depth across venues immediately for guaranteed fill.
  - **Passive** — post-only across venues at favored fee tier, accept partial fills.
  - **Dark-first** — try dark pools / RFQ / midpoint matching before lit venues.
  - **Custom-policy** — trader-configured rules ("never route to venue X," "always cap at 8% of venue volume").
- **Pre-trade route preview** — _before_ submit, show the planned route: which venues, what size at each, expected cost, alternative routes considered and rejected with reason.

#### Cross-domain extensions

The SOR concept extends beyond same-asset multi-venue routing into:

- **Cross-asset substitution** — when buying ETH, the SOR can route some size to Binance spot and some to a Curve pool on-chain if the all-in cost (gas + slippage) is lower. Requires bridging awareness, account balances per venue, and trader-policy approval.
- **Block / RFQ workflow** — for size that would move displayed markets, the SOR can fan out an RFQ to a dealer panel (Paradigm for crypto options, Bloomberg / Tradeweb / MarketAxess for rates, voice for blocks). Quote aggregation, response-time per dealer, hit/lift in one click.
- **Cross-mempool routing (DeFi)** — public mempool vs private (Flashbots Protect, MEV-Share) vs CowSwap intent-based, with default policy per trade size.

#### Design principles

- **Best price, not just first price.** Aggressive sweeping is fast but expensive; the SOR optimizes for total cost, not fill latency, unless explicitly told otherwise.
- **Venue intelligence is continuously updated.** A venue degrading (latency rising, rejects spiking, recent toxic flow) gets de-prioritized automatically, with the trader notified.
- **Pre-trade transparency.** The trader can always see _why_ the SOR chose a particular route, and override.
- **Account-state aware.** SOR respects per-venue balance, position limits, and counterparty limits — won't route to a venue where the trader has insufficient capital or has hit a venue cap.
- **Latency-budget aware.** For latency-sensitive trades (Mira's market making), the SOR is bypassed in favor of direct connections; for thoughtful trades, latency budget is more relaxed and best-price wins.

#### Archetype-specific extensions

- **Marcus** — Binance spot + perps + Bybit + OKX aggregated ladder, sweep across venues when Binance depth is poor. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — full cross-domain SOR: CeFi venues (Marcus's set) + on-chain DEX-aggregator routes (1inch / CoW / Jupiter / Odos / Bebop) compared side-by-side, gas + slippage + MEV-exposure rating per route. **Decides whether to execute on-chain or CeFi based on all-in cost** — this is unique to Julius. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — does _not_ use SOR for her quoting (she manages each venue's quotes directly). For manual hedges, uses a fast-route SOR. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — block/RFQ aggregation across Paradigm dealers for size; on-chain RFQ for crypto options. Cross-venue between Deribit / CME / Binance options. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — multi-venue equity routing (NYSE / NASDAQ / dark pools / ATSs / IEX), dark-first option, broker-block-trading and Liquidnet/Cboe cross-network access. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — RFQ-dominant for swaps and large cash; futures route through CME. Bloomberg / Tradeweb / MarketAxess RFQ aggregation. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — uses appropriate per-asset-class SOR for each leg. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — multi-LP aggregation across ECN / multi-bank / single-dealer, **last-look awareness** is a first-class venue characteristic, LP scorecard tracked continuously. **Direct-vs-synthetic comparison** for crosses (EURJPY direct vs synthesized through EURUSD × USDJPY). See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — futures venue routing (NYMEX / ICE), block / OTC swap counterparty routing, basis trade (cash–futures) coordination. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — block trading via broker dealers (huge for size), Liquidnet / Cboe cross-network, anonymized vs disclosed RFQ choice. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — strategies internally use SOR; she configures venue policies at strategy level. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — cross-book pricing across Betfair / Smarkets / Pinnacle / Matchbook with arb spread surfaced; sequenced execution across books for arb (atomicity not possible). Bookmaker account-health tracker (sportsbooks ration winners; SOR respects per-book stake limits). See [diego](trader-archetype-diego-live-event.md).
- **Aria** — cross-venue routing (Polymarket / Kalshi / Smarkets / Betfair), bridge-cost preview, account/regulatory-access checks per venue, **triangular-arb detection across 3+ venues**. See [aria](trader-archetype-aria-prediction-markets.md).
- **David, Elena** — not direct users; David monitors SOR performance via TCA at firm level.

#### Used by

All 13 trader archetypes who execute trades (excluding David and Elena). Quinn's use is indirect (strategies route internally). Mira's use is limited (her quoting bypasses SOR). All others use it directly and continuously.

---

### 6. Hotkey System

#### What it is

A first-class keyboard-driven action layer that lets a trader take any time-sensitive action without touching the mouse. Every senior discretionary trader is keyboard-fluent for execution; the mouse is for analysis, not action. The hotkey system is the platform layer that makes this possible.

#### Why it matters

Mouse latency is real — moving from chart to ticket to button takes 1–3 seconds for a discretionary trader, longer under stress. For a market-maker fighting microstructure, that's lifetime. For a discretionary trader hitting a goal-scored ladder before it suspends, that's an entire opportunity. Hotkeys collapse multi-step flows into single keystrokes; this is one of the platform's largest ergonomic wins.

#### Standard shape

A hotkey system has three layers:

**Layer 1 — Universal hotkeys** (work anywhere in the platform):

- Cancel all working orders (globally) — typically a hard-to-press combo to prevent accidents.
- Switch focus instrument (Tab forward / Shift-Tab back through watchlist).
- Toggle workspaces / layouts.
- Open / close blotters.
- Hide / show pre-trade confirmation gate.

**Layer 2 — Contextual hotkeys** (work on the focused instrument or ticket):

- Buy at offer / sell at bid (or "back at offer / lay at bid" for sports).
- Buy/sell at top of book at preset stake (presets H1, H2, H3 for "small, medium, large").
- Cancel all working orders on this instrument.
- Flatten this instrument (close to zero with smart-route market or aggressive limit).
- Reverse position (flip from long to short, double size).
- Move all working stops to breakeven.
- Toggle reduce-only / post-only.
- Hedge to flat (delta-hedge for options; green-up for sports; cross-venue hedge).

**Layer 3 — Strategy-specific hotkeys** (saved per archetype or per strategy):

- Lay-the-draw template for sports.
- Tick-scalp template (back at X, lay at X-2 ticks).
- Roll futures forward.
- Apply parameter override profile (Mira: "widen all 2x," "skew long," "pause 30s").

#### Design principles

- **Configurable per user.** No two pros want the same key bindings; the platform provides defaults but lets every key be reassigned. Some traders use foot pedals for kill switches.
- **Visible cheat sheet on demand.** Press a "?" key (or hover) to see the active hotkey map for the current focus area.
- **Audit and learning trail.** Every hotkey press is logged (with intent inferred from context). Useful for behavioral review and post-trade reconstruction.
- **Confirmation only when warranted.** A buy-at-offer at preset stake doesn't get a popup. A flatten-all does. A kill-switch requires a held-key combo. The friction maps to the consequence.
- **Disablable / lockable.** Trader can lock hotkeys when stepping away (avoid the cat-on-keyboard scenario).
- **Latency-budget aware.** Hotkey execution should be <50ms platform-side (excluding network). For market-maker contexts, sub-10ms.
- **Work across multiple monitors.** Pressing a hotkey while focused on a chart on monitor 3 should affect the instrument that chart is showing, not whatever ticket is open on monitor 5.

#### Archetype-specific extensions

Each archetype's hotkey set is detailed in their doc.

- **Marcus** — full canonical set; stops/breakeven moves; reverse position; reduce-only toggle; kill switch. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — Marcus's set plus on-chain hotkeys: claim-and-compound rewards, unwind LP position, bridge USDC home. **Saved on-chain "playbooks"** are one-click multi-step actions. See [julius](trader-archetype-julius-hybrid.md).
- **Mira — non-negotiable.** Quote-engine overrides via hotkey: widen-all, pull-all, skew-long/short, reduce-size, pause-N-seconds. **Foot pedal for engine kill switch.** Hotkey reflexes are her job — the mouse is too slow. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — quick close current structure, roll structure forward (close current open same in next tenor), delta-hedge now, vega-flatten (close highest-vega leg). See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — used but less central; his decisions are slower and more research-driven. Buy/sell at NBBO with deal-ratio sizing for pairs, cancel-all, hedge-to-flat. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — hit bid / lift offer on quoted instrument, cancel all, flatten DV01 on a tenor, roll futures position. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — fewer hotkeys; trade frequency is lower. Roll position forward (futures or options) is one-click; cancel-all-working. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — buy/sell at top, cancel-all, flatten-pair, roll-forward (close near, open far on same notional). See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — buy/sell at top, cancel all, **roll position forward** (constant in energy), flatten product. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — buy target / sell acquirer at NBBO with deal-ratio sizing; cancel-all-on-deal; **hedge deal break risk** (preconfigured per deal); flatten-deal. See [naomi](trader-archetype-naomi-event-driven.md).
- **Diego — non-negotiable.** Ladder one-touch back/lay at top; pre-set stakes (H1/H2/H3); cancel all; **green-up to flat** (lock P/L equally across outcomes); lock-50%; lock-100%; emergency lay-off; switch ladder to next event in queue. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — buy YES at offer / buy NO at offer for focused market; cancel-all; hedge-to-flat; switch focus to next market. See [aria](trader-archetype-aria-prediction-markets.md).
- **Quinn — minimal use.** Pause-strategy and stop-strategy hotkeys. Manual override is intentionally friction-y. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **David** — not a hotkey-driven user; deliberate pace. Possibly an emergency firm-wide kill (multi-key, not single hotkey). See [david](trader-archetype-david-pm-risk.md).
- **Elena** — not a hotkey user. Her actions are deliberate capital movements with confirmation flows. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 13 trader archetypes use hotkeys; **non-negotiable** for Mira and Diego (latency-critical). Critical-but-less-central for Marcus, Julius, Sasha, Ingrid, Yuki, Theo, Naomi, Aria. Lighter use for Henry, Rafael, Quinn. Not used by David, Elena.

---

### 7. Positions Blotter

#### What it is

The live, mark-to-market view of every open position. The single most-watched surface during the Hold phase. Positions are organized hierarchically per archetype; the blotter must support **multiple grouping modes**, **drill-down to legs**, and **per-position metadata** (entry timestamp, strategy tag, parent trade, thesis).

#### Why it matters

The trader's mental model of "what am I exposed to" lives in the blotter. If the blotter shows positions in the wrong unit (e.g. dollar-notional for a rates trader who thinks in DV01), or with the wrong grouping (e.g. flat list for a multi-leg event-driven trader), the trader is _trading blind_ on the dimension that matters. Positions blotter design is one of the highest-leverage UX decisions in the platform.

#### Standard shape

A single positions framework that supports:

- **Multiple grouping modes** — selectable, persistent per user. Common groupings: by underlying, by venue, by strategy / theme / deal, by sector / cluster, by domain (CeFi vs DeFi), by tenor bucket, by counterparty.
- **Hierarchy with drill-down** — top-level rolled-up view (aggregate per group), expand to show legs (individual positions composing the aggregate). This is essential when one underlying has spot + perp + dated future + options legs all at once.
- **Per-position fields** — instrument, side, size, average entry, mark price, unrealized P/L ($, %), realized P/L since entry, position age (days held), strategy tag, parent trade ID, thesis text.
- **Live mark-to-market** — update on every tick; no perceptible lag.
- **Color coding** — green/red for direction-of-day, with intensity proportional to magnitude.
- **Sortable, filterable, pinnable** — pin focus positions to the top.
- **Search** — across instruments, strategy tags, deal IDs, themes.
- **Export** — CSV / JSON / Excel for ad-hoc analysis.
- **Linked to other surfaces** — click a position to open its chart, ticket, journal entry, related news.

#### Trader-native units

The unit each position is _displayed in_ must match the archetype. Same positions, different surfaces:

- **$-notional** — Marcus, Julius, retail-style.
- **DV01 / contract-equivalent** — Ingrid (and Theo for energy futures).
- **Greeks** — Sasha (delta + gamma + vega + theta + vanna + volga; vega-by-tenor and vega-by-strike especially).
- **Currency-decomposed** — Yuki (long EUR / short USD per currency, not per pair).
- **Beta-adjusted** — Henry (factor exposure rather than raw delta).
- **Risk-contribution** — Rafael (DV01 + vega + beta in one comparable unit).
- **Deal-attached** — Naomi (positions grouped under their parent deal, with deal-level P/L summed across legs).
- **Outcome-decomposed** — Diego (P/L per outcome — if home / draw / away — for each event).
- **Probability-quoted** — Aria (positions in $ stake but valued in probability shares).
- **Inventory** — Mira (the position _is_ inventory; aggregate per underlying with hedge state).

#### Design principles

- **Hierarchy is mandatory.** A flat list is useless when one underlying has 5+ legs. Top-level aggregates with one-click drill-down.
- **The right unit is non-negotiable.** $-notional misleads rates traders; greeks mislead crypto-spot traders. The platform must let the user pick the unit per archetype.
- **Linked, not isolated.** A position must connect to its chart, ticket, journal, related working orders, related deal/theme/strategy.
- **Sort and filter persist.** A trader's view is their workflow; reload of the blotter must restore exactly what they were looking at.
- **Updates are atomic and lossless.** Position state must always agree across blotter, chart-position-line, risk panel, and PnL panel — no momentary disagreements.
- **Manual notes are first-class.** A position carries the trader's thesis text inline; no need to switch to a journal app.
- **Liquidation / break / health-factor lines visible.** For leveraged positions, the trader sees distance-to-liquidation in trader-native units (% and standard deviations of recent vol).

#### Archetype-specific extensions

Each archetype's positions blotter shape is detailed in their doc. Variations are large.

- **Marcus** — multi-instrument crypto: spot + perp + dated future + options of the same underlying as one aggregate (BTC: net delta +$X, gross +$Y, theta –$Z), drill to legs. Funding accrued and basis P/L surfaced per leg. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — **CeFi + DeFi unified, hierarchical 3 levels deep:** by underlying → by role (directional / hedge / LP / lending collateral / lending debt / staking / restaking / options leg) → by venue/protocol. Per-leg metadata includes on-chain-specific fields (LP price-range, in-range %, fees accrued, IL, days to maturity, health factor, points accrued, unlock schedule). See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — **inventory aggregated per underlying** with hedge state, residual delta, hedge cost realized today. The "blotter" is more about flow than positions. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — **multi-dimensional greek book**: total greeks, greeks by underlying, vega by tenor, vega by strike, gamma by underlying, plus second-order (vanna / volga / charm). Structure-level rollup with leg-level drill-down. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — by position with sector / industry / strategy tags; pairs view shows both legs side by side with live spread vs entry; thesis text inline. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — **DV01-bucketed by tenor** (0–2y, 2–5y, 5–10y, 10–20y, 20–30y), by currency, by instrument type (cash / future / swap). Drill to individual positions. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — **grouped by theme** as primary axis (e.g. "Fed over-tightening" → long 5y UST, long EURUSD call, long gold). Asset-class secondary view. Theme-aggregate P/L per theme. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — **currency-decomposed** as primary view (net long EUR, short USD, short JPY, etc.) aggregated from all pair positions. Pair-level secondary view. **Forward / settlement ladder** as a separate but linked view. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — by product & spread (outright positions and active calendar / location / crack spreads as composite objects). Forward exposure ladder by month. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — **deal-grouped**: every position attached to a parent deal, deal-level rollup (long target + short acquirer + index put hedge = deal P/L). Deal status (announced / vote / regulatory / closed / broken) inline. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — strategies are her positions. Per-strategy P/L, capital deployed, drawdown, recent intervention. Drill-down to the strategy's underlying positions. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — by event with per-outcome P/L breakdown (home wins / draw / away wins). Liability per outcome, liquidity remaining, suspension status. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — by cluster (related markets like all 50 Senate races as one cluster). Cluster aggregate P/L + cluster correlation note. Per-market position, edge, days-to-resolve, resolution source. See [aria](trader-archetype-aria-prediction-markets.md).
- **David** — **firm-wide aggregate**: per-trader rollup, per-strategy rollup, by underlying / venue / counterparty. Drill from firm to trader to strategy to position. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — does not see the trader's blotter. Her "positions" view is **NAV + capital invested + share class** at the fund level. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. The framework is universal; the grouping, units, and per-position fields differ dramatically.

---

### 8. Working Orders Blotter

#### What it is

A live view of every order the trader has resting in the market, with full state (sent / acknowledged / partially filled / canceled / rejected) and inline modification controls. Distinct from the positions blotter (which shows what's filled) and from the trade history (which shows what's done).

#### Why it matters

Working orders are pending decisions in the market — they will turn into positions if hit. A trader managing 50+ resting orders across multiple venues and instruments needs to see, at a glance, exactly what's working where and at what price. Stale working orders are silent risk: a stop placed an hour ago and forgotten can fill into adverse conditions; a take-profit set too tight can miss a real move. The working orders blotter is the daily hygiene tool.

#### Standard shape

- **Per-order fields** — instrument, side, size (working + filled), order type, price, time-in-force, venue, parent strategy/deal/theme, parent order ID (if part of a bracket / algo), age, current state.
- **Live state** — distance from market price (in $ and %), fill probability if computable, last action timestamp.
- **Inline modify** — drag price on a chart-attached marker; or type new size / price in the blotter row; or right-click → modify dialog.
- **One-click cancel** — single order or selection.
- **Group cancel** — cancel all on instrument; cancel all in strategy; cancel all of one type (e.g. all stops on the book).
- **Working children of a parent visualized** — bracket orders (entry + stop + target) shown as a hierarchy with parent-child link visible.
- **Color coding** — buy vs sell, working vs partial vs near-fill.
- **Sort by** — distance from market (most-relevant), age, parent strategy.
- **Search** — by instrument, parent ID.
- **Filter** — show only stops, only limits, only one venue, only one strategy.
- **Export** — for review or compliance.

#### Inline-on-chart representation

A defining feature of any modern terminal: **working orders appear as horizontal lines on the chart**, draggable to modify price, right-click-able to cancel. Position avg-price line, liquidation line, and stop/target lines all rendered inline on the chart. This is table stakes; not having it is a deal-breaker.

#### Design principles

- **State must always be current.** Acknowledged states from venue arrive within ms and update the blotter immediately. Network blips are flagged ("not yet acknowledged"); never silently displayed as if working.
- **Modify is one action, not multiple.** Drag-to-modify on the chart, type-to-modify in the blotter, both are one-step.
- **Cancel propagates atomically.** Cancel of a parent bracket cancels children. Cancel of a parent order in an algo cancels the algo (with a confirmation if children are partial-filled).
- **Reject reasons surface.** If a venue rejects a modify, the reason is visible at the row level, not buried in logs.
- **Audit trail.** Every modify and cancel timestamped and reasoned (where the trader provided a reason).

#### Archetype-specific extensions

Most archetypes use a near-identical working orders blotter. Variations are mainly in **what counts as a working order**:

- **Marcus** — canonical working orders blotter; bracket children visualized; chart-attached lines. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — CeFi working orders + **on-chain limit orders** (via CowSwap / 1inch fusion / Polymarket limit orders) tracked together. **Pending transactions** as a separate state (sent to mempool, awaiting confirmation) with stuck-tx indicator. **Cross-venue triggers** (e.g. "if Binance funding > X, execute Aave borrow") are first-class working entities. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — **the engine's quotes are working orders**, but at quote-engine scale (thousands per second per instrument). The blotter shows _aggregate_ working state per instrument (top-of-book quotes, layered depth) rather than individual orders. Manual hedge orders show in standard form. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — multi-leg structures with all legs as one working entity; partial-fill rules visible. **Vol-pegged orders** (price adjusts as underlying moves) shown with their pegging state. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — pair / basket working orders shown grouped; algo parent + child fills visualized. Locate-status flagged on shorts. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — RFQ in-flight as working entities with response time per dealer; cleared swap submission states; futures orders standard. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — multi-asset multi-leg orders shown with leg-by-leg status. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — multi-LP routing orders shown with per-LP state; **NDF in-flight** flagged with fixing-date awareness; fixing-targeted orders shown with countdown. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — calendar-spread legs as one working entity; roll-in-progress flagged. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — deal-attached pair orders grouped; tender-offer submission state tracked. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — strategy-level "working state" — what each strategy currently has resting — rolled up. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — Betfair-style: working back/lay orders inline on the ladder, draggable. **Bet-delay state** flagged for in-play orders. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — working orders per market; **on-chain pending transactions** flagged separately from confirmed. See [aria](trader-archetype-aria-prediction-markets.md).
- **David** — firm-wide working orders rollup, per trader / strategy / venue; useful for end-of-day review and intervention decisions. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — not used. Her analog is **pending capital actions** (subscriptions / redemptions / KYC documents in flight). See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 14 trader archetypes + David. Elena's analog is pending capital actions, structurally similar.

---

### 9. Live PnL Panel

#### What it is

A continuously updated view of the trader's profit and loss — realized + unrealized — decomposed across the axes that matter for the archetype, with an intraday equity curve. The single most-glanced number on any trader's screen.

#### Why it matters

P/L is the scoreboard, but the _raw_ number is rarely the most useful. Senior traders need decomposition: where did P/L come from today? Which underlying made me money, which lost? Which strategy worked, which didn't? For a vol trader, was today's P/L from delta exposure (probably bad), or from gamma scalping (probably good)? For an FX trader, was it spot moves or carry? For a CeFi+DeFi trader, did the CeFi leg contribute or the DeFi leg? Without decomposition, P/L is noise — with decomposition, it's signal.

#### Standard shape

- **Total P/L today** — realized + unrealized, in $ and as % of book.
- **Equity curve intraday** — sparkline of mark-to-market over the day.
- **Decomposition by primary axis** — the axis that matters most for the archetype (see "Archetype-specific decomposition" below).
- **Comparison rows** — today / WTD / MTD / YTD, with sparklines.
- **Realized vs unrealized split** — how much is locked in vs at-risk.
- **Color coding** — green/red, with magnitude-proportional intensity.
- **Drill-down** — click any decomposition row to see the underlying positions.
- **Benchmark overlay** — equity curve vs benchmark (BTC buy-and-hold, peer median, custom index).

#### Universal decomposition axes (where applicable)

- **By instrument / underlying.**
- **By strategy / theme / deal / pair / cluster** (using the strategy tag from #29).
- **By venue.**
- **By time-of-day** (intraday distribution).
- **Realized vs unrealized.**
- **Gross vs fees vs net.**

#### Archetype-specific decomposition

This is where the value lives. Each archetype's P/L decomposition is unique to their market structure.

- **Marcus** — by underlying (BTC vs ETH vs alts), by strategy tag (directional / basis / vol short / calendar), by instrument class (spot vs perp directional vs perp funding vs basis vs options theta/vega/gamma realized). See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — **CeFi spot + CeFi futures (mark + funding) + on-chain spot (mark) + LP fees earned + lending interest earned/paid + staking rewards (mark) + points/airdrops accrued (estimated, with confidence interval) – gas spent – bridge fees paid.** Each component visible separately. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — **edge components decomposed always**: spread captured (gross) – adverse selection – hedge cost – fees = net. Each by instrument, by venue, by counterparty. P/L in basis points per fill, not just $. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — **greek-attributed P/L** (the defining surface for vol traders): delta P/L (directional, ideally near zero if hedged) + gamma P/L (captured from delta-hedging realized moves) + vega P/L (vol moves vs vega exposure) + theta P/L (predictable decay) + higher-order P/L (vanna, volga, residual) + hedging cost. Every day, every structure. **A vol trader who can't decompose daily P/L into these buckets cannot improve.** See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — **alpha vs beta decomposition**: how much from market beta, how much from name selection. Long alpha vs short alpha (separately, because they're different skills). By sector / industry / strategy tag. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — **carry vs roll-down vs yield change**: passive vs active P/L. **By trade type** (outright vs curve vs butterfly vs basis). By tenor (short-end / belly / long-end). By currency. **Funding cost** (repo / xccy) tracked separately. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — **per-theme P/L** (primary axis), conviction-weighted P/L (bigger themes contribute more), theme correlation matrix to detect drift. Asset-class secondary. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — **spot vs carry vs vol decomposition** per trade. Per-currency P/L (alongside per-pair). **Fixing P/L** — slippage vs target fixing rate. **Funding cost** for borrowed-currency positions. By session (Tokyo / London / NY). See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — **outright price + curve change + spread P/L + roll cost + vol P/L (options)**. Per-product, per-spread breakdown. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — **spread tightening (passive accrual) vs spread widening (adverse) vs hedge P/L vs borrow / financing cost**. By deal, by deal type, by sector, by outcome (closes vs breaks vs renegotiations). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — **per-strategy P/L** vs expectation (out-of-sample distribution from research). Backtest-vs-live divergence is itself a P/L axis. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — **realized today + unrealized per event** (per-outcome breakdown — if home / draw / away). **Per-event hedged P/L** if greened up now. By sport / league / strategy / template. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — **realized today + unrealized per market** (per outcome). By cluster / theme. By venue. **Capital deployed vs available**. **Days-locked-up profile.** See [aria](trader-archetype-aria-prediction-markets.md).
- **David** — **firm-wide aggregate** with per-trader, per-strategy, per-venue, per-underlying decomposition. **Risk-adjusted contribution per trader** (Sharpe per $ allocated, marginal Sharpe). See [david](trader-archetype-david-pm-risk.md).
- **Elena** — fund-level NAV + change today / MTD / QTD / YTD / ITD, **net of fees**. By strategy (not trade). Gross vs fees vs net. See [elena](trader-archetype-elena-external-client.md).

#### Design principles

- **Live, not delayed.** Mark-to-market on every tick, no perceptible lag. For low-tick instruments (rates), pricing snapshot frequency is set high enough to feel live.
- **Decomposition is non-negotiable.** A platform that shows total P/L without per-archetype decomposition is missing the most useful function.
- **Drill-down to source.** Every aggregate row drills to the underlying positions that compose it.
- **Realized + unrealized always shown together.** Realized alone hides at-risk exposure; unrealized alone hides booked gains.
- **Benchmark comparison embedded.** No serious P/L view stands alone — vs benchmark is what tells the trader if today is genuinely good or just market noise.
- **History is preserved.** End-of-day P/L is logged with full decomposition; tomorrow's P/L panel shows yesterday's bar in the equity curve at the right position.

#### Used by

All 15. Universal.

---

### 10. Risk Panel (Multi-Axis)

#### What it is

A panel showing the trader's exposure across all the **axes of risk that matter** for their style — not just $-notional, but the trader-native units (greeks for options, DV01 for rates, beta-adjusted for equities, currency-decomposed for FX, deal-break for event-driven, etc.). With **limits visible inline** (current vs cap, % utilization, breach indicators), and **stress scenarios** pre-computed alongside.

#### Why it matters

A position's directional P/L is one risk dimension. But a senior trader is also exposed via vol, time, basis, funding, counterparty concentration, factor tilt, cross-correlation, liquidity, jurisdiction, oracle dependency, and more. The risk panel surfaces all of these continuously so the trader sees the _real_ risk of the book, not just the directional risk. Mis-priced risk is what blows up books.

#### Standard shape

The risk panel decomposes the book across multiple axes simultaneously:

- **Direction** — net delta in $-notional or trader-native (DV01 for rates, beta-adjusted for equities).
- **Gross exposure** — sum of absolutes; matters for leverage caps.
- **Concentration** — top N positions / themes / counterparties / sectors as % of book; warning thresholds visible.
- **Correlation cluster** — positions that should be uncorrelated drifting toward correlation flagged.
- **Counterparty exposure** — per venue, per dealer, per protocol.
- **Liquidity profile** — % of book that could be exited in 1 day, 5 days, 1 week at typical depth.
- **Margin / collateral utilization** — per venue, with warning thresholds.
- **Stress scenarios** — pre-computed P/L under archetype-relevant shocks (see #11).
- **VaR** — historical, parametric, or Monte Carlo, depending on archetype.
- **Limits** — for every axis, current value vs cap, with utilization %, color-coded (green / amber / red).

#### Trader-native risk axes

The unique value of a serious risk panel is that it speaks the trader's language:

- **Greeks (options traders)** — delta, gamma, vega, theta, vanna, volga; vega-by-tenor and vega-by-strike. Sasha's primary risk axes.
- **DV01 (rates traders)** — DV01 by tenor bucket, by currency, by instrument type. Convexity. Curve-shape exposure (parallel + steepener + butterfly). Ingrid's primary axes.
- **Beta-adjusted (equity traders)** — net + gross beta-adjusted exposure, sector exposures, factor exposures (value / growth / momentum / quality / size / low-vol). Henry's primary axes.
- **Currency decomposition (FX traders)** — net delta per currency aggregated from pair positions. Carry exposure (total daily carry P/L). Yuki's primary axes.
- **Counterparty / protocol (DeFi traders)** — exposure to Aave, Lido, EigenLayer, etc., as % of book. Smart-contract risk score. Stablecoin exposure with depeg risk score. Bridge-in-flight (capital traversing bridges). Oracle-dependency map. Julius's primary axes.
- **Deal break (event-driven traders)** — max loss per deal if it terminates. Aggregate break risk if multiple deals broke simultaneously. Naomi's primary axes.
- **Multi-asset (macro traders)** — equity beta + rates DV01 + FX delta + commodity delta + credit DV01 + vega visible simultaneously. Rafael's primary axes.
- **Inventory + adverse selection (market-makers)** — current inventory vs limit, hedge ratio, adverse-selection score per session. Mira's primary axes.
- **Resolution risk (prediction-market traders)** — counterparty/venue concentration, smart-contract risk, resolution-source health, capital-lockup profile. Aria's primary axes.
- **Liability / outcome (sports traders)** — per-event aggregate liability, per-outcome aggregate exposure. Diego's primary axes.

#### Limits & breach handling

- **Limit hierarchy** — firm-level (David sets) → trader-level → strategy-level → instrument-level. Most-restrictive wins.
- **Visible at all times** — every axis shows current vs limit; 80% utilization → amber; 95% → red; breach blocks new orders that would worsen the breach.
- **Limit breach is auditable** — every breach logged, with auto-paging if critical.
- **Manual override** requires David's authorization and is itself audited.

#### Design principles

- **Multi-axis, simultaneous.** Not "click a tab to see vega" but vega visible alongside delta. The trader's brain integrates across axes; the platform must too.
- **Trader-native units.** $-notional alone is insufficient for any senior archetype. The right unit per axis is the platform's responsibility.
- **Live updates with positions.** Every position fill updates the risk panel within ms.
- **Stress scenarios are pre-computed.** The trader can see "if BTC -10%, my book is X" without clicking calculate; the matrix updates as positions change.
- **Drill-down from aggregate to position.** Click a risk number to see which positions contribute most.
- **Cross-trader rollup at firm level (David).** Same panel pattern, but aggregated across all traders.

#### Archetype-specific extensions

- **Marcus** — net delta per asset ($ + notional), gross exposure, beta-weighted to BTC, greeks book-wide (gamma, vega, theta, rho-funding), pre-computed stress grid (BTC ±5/10/20%, IV ±20%), concentration warnings, correlation cluster risk, margin utilization, funding cost projection. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — net delta per underlying (CeFi + on-chain), counterparty exposure breakdown (Binance / Aave / Lido as %), smart-contract risk ($ in audited / unaudited / recently-deployed), stablecoin exposure with depeg risk, bridge-in-flight, greeks book-wide, liquidation distance per leveraged leg, health-factor monitor (Aave/Compound), oracle-dependency map. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — inventory per instrument with limit, adverse selection score, hedge ratios, residual delta, hedge cost realized today, hedge effectiveness (variance of residual P/L). See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — vega limits by underlying / tenor / strike bucket, gamma limits, **pin risk** (close to expiry, large positions near a strike), liquidity risk (% of book exit-able in a day), tail scenarios (Black Monday, Covid, FTX). See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — net market exposure (% gross, % NAV), beta-adjusted, gross vs limit, sector exposures with limits, single-name concentration, factor exposures (value/growth/momentum/size/quality/low-vol), liquidity profile, borrow risk, earnings-concentration (% of book reporting in 7 days), stress (SPX -10%, sector -20%, factor reversal, rates +50bps). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — total DV01 vs limit, DV01 by tenor bucket, DV01 by currency, cross-currency basis exposure, convexity, **curve-shape stress** (parallel ±100bps, bull steepener, bear flattener, twist, central-bank surprise), spread risk (swap spreads, asset swaps, XCCY basis), liquidity profile, counterparty for OTC, margin/collateral across CCPs. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — multi-axis simultaneously (equity beta + DV01 + FX delta + commodity delta + credit DV01 + vega), cross-asset stress library (risk-off, inflation surprise, geopolitical, central-bank surprise), VaR (historical / parametric / MC), concentration warnings, theme-correlation matrix. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — currency exposures with limits, pair-level VaR, vega (if options-heavy), carry exposure (total daily carry P/L), **carry concentration** (most P/L from one funding currency = JPY-funded carry trade), stress (DXY ±3%, risk-off shock, EM-specific, intervention scenarios, central-bank surprise), counterparty for OTC. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — position by product & month with limits, spread exposure (calendar / location / crack), DV01-equivalent total, vega for options, **physical-aware stress** (hurricane Gulf -20%, OPEC surprise 1mb/d, SPR release, cold snap, geopolitical $100→$130 oil), liquidity profile (most-traded vs back-month), margin & collateral. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — deal-break risk per deal (max loss if terminates), aggregate break risk (3 deals breaking simultaneously), concentration per deal, sector concentration, acquirer concentration (multiple deals same PE sponsor), regulatory-regime risk (% exposed to current FTC stance), vol exposure for stock components, borrow risk (HTB / recall), liquidity, stress ("all FTC reviews block," "risk-off shock," "credit shock for LBOs"). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — per-strategy: capital deployed / cap, daily-loss limit, drawdown limit, kill-on-breach. **Cross-strategy correlation matrix** monitored. **Aggregate Greeks across fleet**. **Net exposure to common factors** (BTC beta, ETH beta, vol factor, momentum factor). **Concentration check** (top-N strategies by risk contribution). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — aggregate liability if all positions resolve worst-case, per-event liability vs limit, per-sport / per-strategy concentration, cash/margin across exchanges, stress ("all my away teams win" / "all my favorites lose"), drawdown today vs daily-loss limit. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — aggregate exposure if YES events occur vs NO events, per-cluster scenario P/L, **correlation cluster risk**, concentration risk (top markets), venue concentration, **resolution-risk concentration** (too many resolved by same oracle/committee), liquidity profile, capital-lockup profile, counterparty risk (Polymarket smart contract, Kalshi DCO), stress (Polymarket exploit, Kalshi regulatory, oracle manipulation). See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide aggregate**: net delta per underlying at firm level, gross exposure vs leverage cap, net VaR, greeks aggregated across all traders / strategies, counterparty concentration (top with limits), stablecoin / cash position, margin utilization across venues, in-flight capital, **per-trader tile board** with behavioral health. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — fund-level: gross / net / leverage / vol target, risk capacity vs deployed, stress test results ("in a 2022-style drawdown, fund expected to lose X%"), counterparty list (per agreement), liquidity profile (how fast can fund return capital). See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. Universal — but the axes that matter are radically different per archetype.

---

### 11. Stress / Scenario Panel

#### What it is

A panel that pre-computes the trader's book P/L under a library of archetype-relevant shocks — parallel shifts, vol shocks, intervention scenarios, hurricane scenarios, deal breaks, oracle failures, etc. Live-updating as positions change. Custom scenarios configurable. Closely linked to the risk panel (#10) but distinct: risk shows current exposures, stress shows P/L _under defined shocks_.

#### Why it matters

Trader intuition for "what happens if X" gets unreliable as books grow complex. A multi-asset macro book has dozens of factors that interact non-linearly; an options book has multi-dimensional gamma and vega that resist mental aggregation; a CeFi+DeFi book has counterparty and protocol dependencies that combine in non-obvious ways. The stress panel is how the trader checks: "_my mental model says this would lose me $X — what does the book actually say?_" Catastrophic surprises come from books where stress wasn't pre-computed.

#### Standard shape

- **Library of pre-defined scenarios** — scrollable, sortable. Each scenario has a name, description, and the shocks it applies (e.g. "Risk-off shock: equities -10%, rates -50bps, dollar +3%, oil -10%, vol +30%").
- **P/L per scenario** — current book P/L under each scenario, in $ and as % of book.
- **Decomposition by position / strategy / theme** — which positions drive the loss / gain in this scenario.
- **Worst-case scenario flagged** — the scenario producing largest loss is highlighted.
- **Custom scenario builder** — let the trader define ad-hoc shocks (e.g. "BTC -15% AND ETH -25% AND DXY +5% simultaneously").
- **Multi-factor grids** — for vol traders, a 2D grid (spot moves × vol moves) is the canonical scenario surface; for rates traders, a parallel-shift grid by amount.
- **Live updates** — as positions change (fills land, hedges adjust), the scenarios re-compute within ms.

#### Standard scenarios by asset class

- **Equities** — SPX -10%, sector -20%, factor reversal (long-vs-short factor flip), rates +50bps.
- **Rates** — parallel +/-100bps, bull steepener, bear flattener, twist (front up + back down), central-bank surprise (50bps cut/hike).
- **FX** — DXY +3%, risk-off shock (JPY +5%, CHF +3%, EM -5%), EM-specific shocks (BRL -10%, MXN -5%, ZAR -8%), intervention (BoJ at USDJPY 162), central-bank surprise.
- **Crypto** — BTC ±5/10/20%, ETH +/-25%, alt-coin shock (alts -40%), vol shock (IV +20v / -10v), **stablecoin depeg** (USDC to $0.95), **venue shock** (Binance halts withdrawals), cross-asset (SPX -5% + BTC -15%).
- **Options surfaces** — parallel skew shift, term-structure flattening, smile widening; combined spot × vol grid.
- **Energy** — hurricane Gulf production -20%, OPEC surprise (1mb/d cut or release), SPR release (30M barrels), cold snap natgas, geopolitical $100→$130 oil.
- **Event-driven** — "all FTC reviews block" (30% of M&A pipeline), risk-off (deal-break premium widens), credit shock (LBO deals re-underwritten), specific top-3 deals individually breaking.
- **DeFi** — protocol exploit (Aave / Compound), oracle manipulation, stablecoin depeg, bridge failure, governance attack.
- **Prediction markets** — Polymarket exploit, Kalshi regulatory action, oracle manipulation, mass resolution dispute.

#### Design principles

- **Pre-computed, not on-demand.** The trader sees the worst-case at all times; not "click to compute, wait 30 seconds."
- **Scenarios are versioned.** When a new scenario is added (post-incident learnings), every historical day's book can be re-stressed against it.
- **Custom scenarios are saveable / shareable.** A trader who designs a useful scenario can share it with the desk; David can publish firm-mandatory scenarios.
- **Cross-position correlations matter.** Naive scenarios assume positions are independent; sophisticated scenarios use historical correlations or scenario-specific correlation matrices.
- **Stress P/L attribution drills down.** Click a scenario to see which positions / themes / strategies contribute most to the loss.
- **Time-varying scenarios.** "OPEC surprise + 1 week of price decay" is different from "OPEC surprise on the close." For greeks-heavy books especially.

#### Archetype-specific extensions

- **Marcus** — pre-computed grid (BTC ±5/10/20%, IV ±20%) with concentration warnings; correlation cluster risk (long 6 L1s = one bet); funding cost projection. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — Marcus-set + protocol-specific (Aave exploit), stablecoin depeg shocks, bridge failure scenarios, oracle manipulation, governance attacks. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — less central; her risk is real-time inventory not stress-tested by scenario. Tail scenarios for venue outage and large adverse fill impact useful for capacity planning. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha — foveal**. **2D scenario grid** (spot × vol) is the canonical vol-trader surface, plus surface-shape stress (parallel skew shift, term-flattening, smile widening), event scenarios (FOMC: spot ±2% + vol ±5v), tail scenarios (Black Monday, Covid, FTX). **Greek evolution over time** (vega in 1 week as today's options decay) is a stress dimension. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — SPX -10%, sector -20%, factor reversal, rates +50bps, earnings concentration scenarios. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — curve-shape stress (parallel ±100bps, twist, steepener, flattener, CB surprise 50bps). Spread risk scenarios. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — full cross-asset library (risk-off, inflation surprise, geopolitical, CB surprise) with custom scenario builder for theme-specific shocks. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — DXY +3%, risk-off shock, EM-specific, intervention, CB surprise. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — **physical-aware library** (hurricane, OPEC, SPR, cold snap, geopolitical $100→$130). See [theo](trader-archetype-theo-energy.md).
- **Naomi** — deal-break aggregate ("3 of my deals break simultaneously"), regulatory-regime ("all FTC reviews block"), risk-off, credit shock, top-3 deals individually. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — strategy-level stress (each strategy's worst-case under its own historical worst regime), fleet-aggregate stress. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Aria** — Polymarket exploit, Kalshi regulatory, oracle manipulation, resolution-dispute mass event. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide stress library** (crypto-specific + cross-asset + venue + custom). Pre-computed firm-wide loss + breakdown by trader / strategy / underlying. See [david](trader-archetype-david-pm-risk.md).
- **Diego** — minimal use; binary outcomes mean explicit per-event scenarios (home / draw / away) replace abstract stress. **"All my away teams win" / "all my favorites lose"** as informal stress. See [diego](trader-archetype-diego-live-event.md).
- **Elena** — sees fund-level stress test results (e.g. "in a 2022-style drawdown, fund expected to lose X%") as part of risk overview, not interactively. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. Foveal for Sasha and David; less central for Mira, Diego, Quinn (per-strategy not aggregate), Elena (informational only).

---

### 12. Catalyst / Event Calendar

#### What it is

A first-class calendar surface that surfaces every upcoming event relevant to the trader's book — earnings, central-bank meetings, data releases, auctions, inventory reports, regulatory deadlines, fixing windows, token unlocks, governance votes, deal closings, match days, prediction-market resolutions. Filtered to the trader's positions and watchlist; with countdowns to the most-important events; with implied-move pricing where available.

#### Why it matters

For most archetypes, **timing of trades matters more than direction**. A trade ahead of FOMC sized for low vol can wipe out a year of edge if the Fed surprises. A position into earnings sized for routine volatility can crater on a guidance miss. Calendar discipline — sizing pre-event, hedging if held through, exiting before unfavorable windows — is one of the highest-leverage discipline tools. The calendar is the planning spine; without it, the trader is reacting to events rather than positioning for them.

#### Standard shape

- **Today / This Week / This Month / All views** — adjustable scope.
- **Per-event row** — name, time (with timezone), expected impact, related instruments, current consensus / expected outcome, recent surprise pattern.
- **Filtered by trader's book** — only events affecting positions, watchlist, themes, deals.
- **Countdown to important events** — T-7, T-1, T-1h, T-15m, T-1m banners.
- **Pre-event positioning summary** — "going into FOMC: long duration, long vol, short USD" computed from current book.
- **Expected move from straddle pricing** — for events with options markets (earnings especially), the implied move from front-week ATM straddle.
- **Recent surprise pattern** — small grid of past releases vs consensus, with subsequent market moves.
- **Click event** to drill into a deep view (consensus / dispersion / nowcast / past surprises / commentary).
- **Linked to alerts** — auto-create T-7 / T-1 / T-0 alerts for any event the trader cares about.
- **Auto-mark on charts** — vertical lines / shaded windows for events appear automatically on relevant instrument charts.

#### Calendar content per asset class

This is the unique-content layer; the surface shape is shared.

- **Equities (Henry)** — earnings dates with consensus expectations and expected move from straddle, product launches (iPhone event, GTC, AWS re:Invent), regulatory dates (FDA, FTC/DOJ, SEC), index rebalances, lock-up expirations, investor days, analyst days, board meetings, dividend ex-dates.
- **Rates (Ingrid)** — Treasury / DMO auction calendar (size, tenor, expected demand), central-bank meeting calendar (FOMC, ECB, BoE, BoJ, BoC, RBA, RBNZ, SNB, Riksbank, Norges) with implied policy rate path, central-bank speaker calendar with hawk/dove tags, economic data calendar (CPI, NFP, GDP, PCE, retail sales) with consensus / dispersion / surprise indices.
- **FX (Yuki)** — central-bank meetings + speakers + intervention history, economic data per country (CPI, GDP, employment, trade balance, PMIs), fixing windows (WMR 4pm London, ECB 1:15pm, NY 10am, Tokyo 9:55am) with countdown.
- **Energy (Theo)** — **EIA Wednesday 10:30am ET** for petroleum (consensus / whisper / surprise pattern), **DOE Thursday 10:30am** for natgas, OPEC+ meetings (JMMC, ministerial), monthly OPEC / IEA reports, weather event windows (hurricane forecasts, polar vortex), refinery turnarounds.
- **Crypto / Macro (Marcus, Julius, Rafael)** — FOMC + ECB + BoJ, CPI / NFP, ETF flow reports, **token unlocks** (daily $ amount unlocking per protocol), **governance votes** (active proposals across Aave / Lido / Uniswap), protocol upgrades (Ethereum forks, L2 upgrades, restaking epochs, Pendle expirations).
- **Event-driven (Naomi)** — **HSR clearance** dates / deadlines, **second-request deadlines**, EU phase-1 / phase-2 review ends, other jurisdictional reviews (UK CMA, Canada, China, Brazil, India), **shareholder votes**, **court hearings** (Delaware Chancery, federal, appellate), tender offer expirations, drop-dead dates, walk-rights triggers.
- **Sports (Diego)** — match-day schedule with kickoff times, expected liquidity profile, importance; **pre-event windows** (when team news drops, when betting markets thicken); cluster awareness (Saturday 3pm UK = 6 EPL matches simultaneously; Cheltenham = 7 races / afternoon).
- **Prediction markets (Aria)** — **resolution dates** across her portfolio, heat-map by week / month of capital-locked-until-resolution, pre-resolution windows (last 24–72h often see price action as info crystallizes).
- **Quant (Quinn)** — fewer events directly; rather, the calendar drives blackout windows for strategies (auto-pause around macro events).
- **Macro (Rafael) — superset.** Theme-attached calendar: every theme has its catalysts (Fed-tightening theme: NFP, FOMC, CPI; AI capex theme: Nvidia GTC, hyperscaler earnings; geopolitical theme: G20, election dates, OPEC).

#### Design principles

- **Auto-filtered to relevance.** A trader doesn't want to see every event in the world; only those affecting their book or watchlist.
- **Always within 1 click.** From any other surface, the calendar is hotkey-accessible.
- **Pre-event positioning summary is computed, not manual.** The platform reads the book + the calendar and tells the trader what they're heading into.
- **Implied-move pricing where available.** Front-week straddle prices imply the market's expected event move; surfaced inline.
- **Surprise pattern tracked.** Most events have history (CPI surprises, OPEC surprises, FOMC surprises); pattern visible.
- **Auto-marked on charts.** No mental mapping — events appear as vertical lines on relevant instrument charts automatically.
- **Linked to alerts.** Calendar event + countdown alerts = pre-event warnings.

#### Archetype-specific extensions

Most archetype docs detail their calendar content thoroughly; the surface itself is shared.

- **Henry** — earnings season dashboard as a calendar variant. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — auction calendar with concession tracker, CB calendar with implied rate path. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — economic calendar global + theme-attached. See [rafael](trader-archetype-rafael-global-macro.md).
- **Theo** — **inventory release countdown** is the week's spine. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — **the most deterministic calendar in trading**: regulatory deadlines, votes, court hearings. See [naomi](trader-archetype-naomi-event-driven.md).
- **Marcus, Julius** — macro + crypto-native (token unlocks, governance, protocol upgrades). See [marcus](trader-archetype-marcus-cefi.md), [julius](trader-archetype-julius-hybrid.md).
- **Sasha** — events with implied IV pricing the event (earnings, fork, FOMC). See [sasha](trader-archetype-sasha-options-vol.md).
- **Yuki** — fixing windows + CB meetings + data per country. See [yuki](trader-archetype-yuki-fx.md).
- **Diego** — match-day schedule. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — resolution-date calendar. See [aria](trader-archetype-aria-prediction-markets.md).
- **David** — firm-wide event calendar as a meta-view to anticipate risk concentrations across the desk. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — minimal calendar; perhaps subscription / redemption window dates. See [elena](trader-archetype-elena-external-client.md).
- **Quinn, Mira** — minimal direct use; calendar drives strategy blackout (Quinn) or quote-engine pause (Mira).

#### Used by

All 15 in some form. The platform builds one calendar framework with archetype-specific event-source plugins. Foveal for Henry, Ingrid, Rafael, Theo, Naomi. Important-but-not-foveal for Marcus, Julius, Sasha, Yuki, Diego, Aria. Indirect for Mira, Quinn, David, Elena.

---

### 13. News & Research Feed

#### What it is

A continuously-streaming, filtered, prioritized feed of every information source the trader cares about — newswires, sell-side research, social media, expert networks, conference calls, audio/video feeds — auto-organized to the trader's book and watchlist, with severity / impact tagging, deduplication, and full-text search across history.

#### Why it matters

Markets are reaction surfaces; the question for any trader is _do I see information first, last, or correctly?_ The news/research feed is the platform's information layer. A good one filters out noise, surfaces relevance, and reduces "_am I missing something?_" anxiety. Senior traders pay subscriptions in the **hundreds of thousands of dollars per year** for premium feeds (Bloomberg Terminal, FactSet, expert networks, specialist providers). The platform must integrate them, deduplicate across them, and prioritize within them — none of which any single feed does well alone.

#### Standard shape

- **Multi-source aggregation** — Bloomberg, Reuters, FT, WSJ, sector trade press, Twitter/X, Telegram, Discord, sell-side research repositories, expert-network call notes, audio/video feeds.
- **Filtered by trader's universe** — current positions, watchlist, themes, deals, clusters. Adjustable scope.
- **Severity / impact tagging** — auto-classified (info / important / urgent) with manual override.
- **Auto-tagging by ticker / instrument / theme / deal** — natural-language extraction surfaces "this article is about NVDA, semis, AI capex theme, mentions earnings Apr 23."
- **Deduplication across sources** — same headline from 5 sources counted as 1, with sources visible.
- **Inline preview** + click for full article.
- **Quick-actions inline** — pin to journal entry, attach to a deal / theme / position, share with desk, set alert on follow-up.
- **Full-text search** across years of feed history.
- **Translation for foreign-language sources** (FX / EM / sports / EM-prediction-market traders need this).
- **Audio / video integration** — earnings call audio (Henry), CB press conference audio (Yuki, Ingrid), match commentary (Diego), conference call recordings (Henry, Naomi).
- **Sentiment scoring** where applicable — for social feeds, AI-classified sentiment (often noisy, useful when paired with volume).

#### Source classes

- **Newswires** — Bloomberg, Reuters, AP, AFP, regional wires.
- **Mainstream financial media** — FT, WSJ, Economist, Bloomberg News, CNBC.
- **Sector trade press** — TheRegister / The Information for tech, OilPrice / Argus / Platts for energy, Risk.net for rates, Coindesk / The Block for crypto, Racing Post / TheRingMagazine for sports.
- **Sell-side research** — Goldman / JPM / MS / Citi / etc. — every initiation, upgrade, downgrade, target change with link to full report.
- **Specialist providers** — domain-expert feeds (Aria's polling aggregators, Theo's Vortexa floating-storage, Diego's expert tipsters, Julius's on-chain flow analysts).
- **Social** — curated Twitter/X lists (verified sources only, not random retail), Telegram groups, Discord communities, Farcaster / Lens (DeFi).
- **Expert networks** — GLG, Coleman, AlphaSights, Tegus — scheduled and historical calls with notes.
- **Conference / event audio** — Henry's earnings calls, Ingrid's CB pressers, Naomi's shareholder votes, Diego's match commentary.
- **Internal** — desk chat, internal analysts, internal economists, internal lawyers (Naomi).
- **On-chain / OSINT** — Bellingcat-style for geopolitics, Arkham/Nansen for crypto whales.

#### Design principles

- **Filtered, not firehose.** A senior trader cannot read everything; the platform must surface what matters and quiet what doesn't.
- **Auto-tagging is mandatory.** Manual tagging is too slow; AI classification surfaces relevance.
- **Deduplication preserves information.** When 5 sources cover the same story, the trader sees one card with 5 source links — not 5 cards.
- **Sentiment is a hint, not truth.** AI sentiment classification is noisy; expose it but never block on it.
- **Latency-tier-aware.** Premium-paid wires (Bloomberg) get sub-second priority; social media gets best-effort.
- **History is searchable forever.** A news event from 18 months ago must be findable when the trader returns to a name.
- **Verification status visible.** Tweet from anonymous account ≠ FT article. Source credibility tier visible.
- **Audio / video transcription.** Live transcription of audio feeds with searchable text.

#### Archetype-specific extensions

The shape is shared; the _sources_ and _prioritization_ differ massively.

- **Marcus** — Reuters/Bloomberg, on-chain dashboards, whale alert feeds, social sentiment (curated X list, Santiment-style social volume), sentiment-as-funding (extreme positive funding = crowded longs). See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — Marcus's set + DeFi-native: protocol governance (Aave / Lido), audit / incident feeds, exploit alerts, Telegram / Discord communities, on-chain whale-wallet feeds (Nansen / Arkham), Farcaster / Lens for DeFi sentiment, narrative trackers (RWA, AI agents, restaking, BTC L2s). See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — minimal news consumption; her edge is microstructure, not narrative. Tier-1 wires for major events that pause quoting; sub-second latency-tier essential. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — options-flow tape, dealer-positioning feeds, vol-related news, crypto-Twitter for skew narratives. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — **the heaviest news consumer** in the floor. Bloomberg / Reuters / FT / WSJ + sector-specific (TheRegister, The Information, trade press), full sell-side research integration, **earnings transcript search** across coverage universe, expert network calls scheduled and historical, conference calendar with audio. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — sell-side rates strategist morning notes (every IB), trade-idea aggregation with track records, CB speaker text highlighted with hawk/dove leaning, primary-dealer flow color, fixing-flow expectations. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — **everything.** Macro strategist morning notes (IB, sell-side, independent), trade-idea aggregation with track records, geopolitical analyst feeds (Eurasia Group, Stratfor), podcast / interview library (he returns to long-form), election analysis, OSINT for geopolitical themes. Theme-tagged. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — sell-side FX strategist morning notes (G10 + EM), EM specialist coverage for political-risk / capital-controls / IMF programs, central-bank speaker tracking. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — energy strategist morning notes, physical desk color, weather-service integration (multiple forecast providers), conflict / sanctions tracker, OPEC headlines, refinery / pipeline outage feeds. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — **deal-attached news watch** (SEC filings / court dockets / press releases auto-flagged), event-driven research, antitrust legal analyses (law-firm publications), expert-network calls on industries / regulators, internal lawyer opinions. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — news-as-regime-input (her strategies don't read news directly; she watches it for fleet posture). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — **team news / lineups (massive market mover, ~1h pre-kickoff)**, injury reports, weather forecasts, referee assignments, social media leaks (verified sources), Telegram syndicate chat, **match commentary audio** (often leads market). See [diego](trader-archetype-diego-live-event.md).
- **Aria** — **per-market-type research workspaces** with very different feeds: politics (538 / Cook / Sabato / RCP polling aggregators), economics (nowcasting models, high-frequency indicators), geopolitical (ACLED, OSINT, Bellingcat), tech (model-release tracker, benchmark scorecards, arxiv preprints, patent / lawsuit databases), weather (forecast aggregators, ENSO indicators), crypto-native events (governance, fork tracking). See [aria](trader-archetype-aria-prediction-markets.md).
- **David** — firm-wide news watch as overlay; specifically watches for incidents (depegs, exploits, oracle failures, venue degradation) that affect aggregate book. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — manager commentary feed (PM letters / market notes / regime view), capacity / status announcements, regulatory / compliance disclosures. _Not_ trader-style real-time news. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. Heaviest consumers: Henry, Rafael, Aria, Naomi, Yuki. Lightest: Mira, Quinn (indirect).

---

### 14. Alerts Engine

#### What it is

A multi-condition, multi-channel notification system that watches the trader's universe — prices, P/L, volume, volatility, liquidity, news, calendar, risk limits, infrastructure, behavioral patterns, on-chain state, regulatory feeds — and alerts via visual / audio / mobile-push / chat / page when something matches. The platform's eyes when the trader's eyes are elsewhere.

#### Why it matters

A senior trader can't watch every position, every market, every venue, every counterparty, every protocol, every limit, every feed simultaneously. The alerts engine is what lets them step away — to lunch, to a meeting, to sleep — and trust that the platform will summon them when it matters. Equally important: a good alerts engine _quiets_ most of the floor. Without filtering, alerts spam → ignored → real alerts missed. Severity-routing and personalization are critical.

#### Standard shape

- **Condition library** — visual editor for multi-condition alerts. AND / OR / NOT logic, time-based gates ("X happens within Y minutes of Z").
- **Per-alert configuration** — name, condition, severity (info / warn / critical), channels (visual / audio / mobile push / chat / SMS / phone page), throttle (don't repeat within N minutes), expire (after a date or after triggering N times).
- **Alert library** — saved alerts categorized (price / PnL / volume / vol / liquidity / news / calendar / risk / infra / behavioral / on-chain / regulatory).
- **Templates** — pre-built common alerts with one-click setup (e.g. "Alert when funding > 0.05%").
- **Severity routing** — info silently logs, warn shows banner, critical sound + push + auto-pause if configured.
- **Auto-actions on critical** — auto-pause strategy (Mira), auto-close position (Quinn), auto-page risk team (David). Configurable per alert, requires explicit setup.
- **Alert log** — every fire timestamped; reviewable post-event.
- **Snooze / acknowledge** — temporary silence with reason, audited.
- **Cross-trader alerts** — David's firm-wide alerts (limit breaches, behavioral drift, infrastructure) route to him while individually-relevant alerts route to the trader.

#### Standard alert categories

- **Price** — multi-condition (e.g. "BTC > 70k AND volume > 2x avg"), per instrument, per pair.
- **P/L** — daily drawdown threshold, position drawdown, target hit.
- **Volume / liquidity** — volume spike, depth collapse, top-of-book depth dropping.
- **Volatility** — IV spike, RV spike (multi-σ moves), vol-of-vol spike.
- **News-keyword** — keyword-based on premium news feeds, with tier-aware (Bloomberg headline immediate; X mention slower).
- **Calendar-countdown** — T-7 / T-1 / T-15m / T-1m of important events.
- **Risk-limit** — DV01 / vega / beta-adjusted / concentration approach to limit, breach.
- **Infrastructure** — feed lag, RPC degradation, connection drop, rate-limit at 80%.
- **Behavioral** — overtrading, position-sizing drift, revenge-trade pattern.
- **On-chain (Julius, Aria)** — pool TVL drop, oracle deviation, gas spike, governance proposal, exploit, depeg, bridge incident, mempool stuck-tx.
- **Regulatory (Naomi)** — SEC filing, court filing, regulatory ruling, antitrust statement.
- **Whale / wallet (Marcus, Julius)** — tracked wallet large movement, exchange netflow spike.
- **Sports (Diego)** — goal / red card / penalty / VAR review, market suspension, liquidity collapse, late lineup change.
- **Prediction (Aria)** — resolution-source data release, oracle dispute, polling release.

#### Design principles

- **Default-quiet, opt-in to noise.** Nothing alerts unless the trader subscribes. Alerts are valuable because they're rare; spam destroys their value.
- **Severity-routed channels.** Info → quiet log. Warn → banner only. Critical → sound + mobile push + chat + maybe phone page. The trader configures per-severity channels.
- **Snooze and acknowledge with reason.** When a trader silences an alert, the reason is logged for behavioral review.
- **Auto-actions are explicit and revocable.** Auto-pause-strategy on critical alerts requires explicit setup; trader can always override / disable.
- **Multi-channel reliability.** Mobile push must work. SMS as fallback. Phone page for the most-critical alerts (kill-switch needed, firm-wide breach). The platform must guarantee delivery for critical-tier alerts.
- **Cross-trader propagation where relevant.** David sees firm-wide aggregate alerts; relevant alerts auto-propagate to the trader and David and the risk team simultaneously.
- **Log all fires.** Even silent / acknowledged alerts logged; reviewable post-incident.
- **Latency budget.** From condition-met to alert-fired must be under a few hundred ms even on busy systems.

#### Archetype-specific extensions

Each archetype's alert library is detailed in their doc. The shape is shared.

- **Marcus** — price, PnL, funding-rate-extreme, basis-widened, liquidation-cluster ("$200M of longs cluster at 68k, price approaching"), volatility (BTC realized 1h vol 2σ), news-keyword, connection / API alerts (WebSocket dropped, REST latency >500ms, rate-limit at 80%). See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — Marcus's set + on-chain alerts (pool TVL drop, oracle deviation, gas spike), health-factor alerts (Aave/Compound liquidation approach), pending-tx alerts (stuck, mempool replaced, MEV sandwich detected), governance alerts, unlock alerts, **exploit / incident alerts** ("protocol you're in just had an incident, get out"), bridge / RPC alerts, whale-wallet alerts. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — inventory-limit approach, **adverse-selection spike** (foveal), latency degradation, reject-rate spike, cross-venue divergence, quote-engine stalls, news-event-arriving (auto-pause). See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — greeks crossing thresholds (vega above limit, delta drift), IV spikes on positions, event countdowns, **pin risk** approaching, RV > IV gap moving wrong way, liquidity dropping on positions she'd need to exit. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — price multi-condition, news (name-specific keyword hits), estimate-revision (consensus moved >X%), rating-change (sell-side upgrade/downgrade), insider-trading (new Form 4), short-interest, vol/volume, catalyst-countdown (T-7, T-1 earnings), compliance (restricted-list change), risk-limit. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — yield-level (10y crosses 4.5%, 2y crosses 5%), spread (2s10s steepener z-score > 2), auction-result (bid-to-cover surprise, tail), CB-speaker headlines (auto-flagged hawkish / dovish), economic-data surprise, repo / funding (special bonds, balance-sheet stress), cross-market (VIX spike, equity rout), risk-limit. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — **theme-invalidation** (pre-defined invalidation conditions met), catalyst-pending (T-7 / T-1), cross-asset mismatch (relationships breaking), position-level, news-keyword for active themes, risk-limit (VaR, concentration), geopolitical (major news from defined regions). See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — spot-level multi-condition, **carry-decay** (funding cost increasing), intervention zone approach, fixing countdown, CB alerts, EM political (capital control changes, election), vol regime (IV spikes/collapses), cross-asset (equity rout affecting linked currencies), risk-limit, counterparty. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — outright price + spread alerts, spread z-score, inventory-release (pre / post-release surprise size), weather (new HDD/CDD diverging from prior), geopolitical, roll alerts (contract approaching expiry), risk-limit. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — **catalyst countdown** (T-7, T-1, T-0 of major events), spread (beyond entry parameters), **regulatory** (filing, statement, ruling), news (deal-specific keywords), recall (short borrow status changing), compliance (restricted-list changes, position thresholds), risk-limit (concentration, deal-break aggregate, sector). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — anomaly-driven everything**: performance anomalies (strategy underperforming rolling distribution at 2σ / 3σ), behavior anomalies, feature drift (KS / PSI), prediction drift, execution anomalies (slippage spike, reject-rate spike), capacity warnings, correlation anomaly, regime mismatch, infrastructure (node down, data lag, RPC degraded). **Critical alerts auto-pause the strategy by default.** See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — multi-modal**: goal / score / red card / penalty / VAR with sound + visual + auto-pause. Market suspension / resumption, liquidity collapse, cross-book arb opportunity, stat-threshold (possession >70%), team-news late drop. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — price-cross, information-arrival, resolution-proximity (T-7 / T-1 / T-0), cross-venue arb, **resolution-dispute** (UMA challenge on active market), venue / regulatory (Polymarket incident, Kalshi regulatory news), polling-release (new poll matters more than market price for politics), whale-movement, risk-limit. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide aggregate**: limit breaches (any level), concentration warnings (single-name, single-counterparty, single-strategy), drawdown triggers (trader, strategy, firm), behavioral drift flagged, strategy-fleet anomalies of high severity, external (venue degradation, protocol exploit, depeg, oracle failure), operational (settlement failures, withdrawal delays, audit-trail gaps). See [david](trader-archetype-david-pm-risk.md).
- **Elena — sparse, opt-in.** NAV alerts (large daily move), drawdown alerts (fund crosses stated threshold), operational (wire received, redemption processed, document required), strategic (capacity changes, fee changes, key personnel changes). **Quiet by default.** See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. Universal. Anomaly-driven for Quinn, multi-modal (sound + visual) for Mira and Diego (event-paced). Sparse / quiet by default for Elena.

---

### 15. Trade Journal

#### What it is

A structured, searchable note-taking surface attached to the trader's positions, trades, themes, deals, strategies, or markets. The trader records the _why_ — thesis, expected catalysts, invalidation conditions, decision points, post-event lessons — so that pattern-recognition is possible across years of work. Distinct from the trade history (which records _what_ happened) — the journal records _what they were thinking when it happened_.

#### Why it matters

The single highest-leverage practice that separates pros from amateurs (per traders themselves): **journaling**. Memory is unreliable; markets generate enough noise that without written context, last week's winning trade and last week's losing trade look the same in the blotter. The journal is what makes post-trade learning real. The platform's job is to make journaling so frictionless that the trader actually does it — inline at the moment of decision, not retroactively.

#### Standard shape

- **Inline-capture surface** — a notes panel attached to every position / trade / theme / deal, accessible without leaving the working surface. Markdown-style formatting, with templates.
- **Per-entry fields** — timestamp (auto), title, body, status (planning / active / closed / reviewed), tags (free-form), linked entities (instrument, deal, theme, parent trade, related news article, chart snapshot).
- **Templates per archetype** — pre-filled note structure: thesis / catalyst path / sizing rationale / invalidation / target / stop. One-click load.
- **Chart snapshot capture** — at the moment of journal entry, snapshot the chart state (price, indicators, drawings) and embed in the journal entry. Replay that exact view later.
- **Searchable** — full-text across years; filter by status / tags / linked entities.
- **Reviewable** — weekly / monthly review prompt: "you have N entries with status 'active'; review."
- **Linked from other surfaces** — click a position → see attached journal entries; click a deal → see deal journal; click a theme → see theme journal.
- **Versioned edits** — entry edits keep history; trader can see how their thesis evolved.
- **Auto-prompts** — on entering a position over a size threshold, prompt for thesis. On invalidation condition triggering, prompt for review note. On exiting, prompt for lesson.

#### Journal templates per archetype

The templates differ because the _unit of journaling_ differs.

- **Marcus** — per-position: thesis, invalidation, expected catalyst path, target, stop. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — per-position with on-chain-specific fields: tx hash, gas used, MEV experienced, route taken. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — per-session: parameter profile in use, regime observed, adverse selection seen, lessons. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — per-structure: thesis, entry vol, entry skew context, expected hold period, gamma-scalping plan. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — **per-position thesis**: thesis (with catalyst-driven view), key drivers, invalidation, expected catalyst path; updated weekly or post-catalyst. Linked to internal analyst notes, IR contact log, expert-network call notes. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — per-trade or per-theme: thesis, expected catalyst, invalidation, target spread; updated around major events. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael — theme journal as foveal artifact**: per-theme running narrative — thesis updates, evidence in/out, expressions added/removed, conviction shifts, decision points. **Reviewed weekly with team.** Theme journals become his personal corpus of years of thinking. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — per-trade or per-theme: thesis, expected catalyst, stop, time horizon. **Carry-trade-specific journals** (when does the funding currency rally become my problem?). See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — per-trade or per-spread: thesis, fundamentals supporting, expected catalyst, invalidation; updated around inventory and OPEC events. See [theo](trader-archetype-theo-energy.md).
- **Naomi — deal journal**: per-deal thesis, probability of close estimate, key risks tracked, updates on regulatory / catalyst progress, decision points (add / trim / hedge / exit). **Reviewed weekly + post-resolution.** See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — research notes form**: every intervention, every alert acted on, every promotion logged with rationale. Strategy retrospectives accumulate. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — per-event: pre-game thesis, key in-play decisions and rationale; reviewed post-event. Useful for template refinement. See [diego](trader-archetype-diego-live-event.md).
- **Aria — market journal**: per-market or per-cluster thesis at entry, probability estimate with sources, key inputs (poll / model / expert call), updates as info arrives, decision points; **reviewed weekly + post-resolution**. See [aria](trader-archetype-aria-prediction-markets.md).
- **David** — David writes commentary (daily P/L narrative, weekly review, monthly attribution) rather than a journal in the trader sense. Capital-allocation decisions are journaled with rationale; intervention decisions are journaled with reason. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — does not journal in the trading sense. Her communications log (every email / call / meeting with the firm) is the analog. See [elena](trader-archetype-elena-external-client.md).

#### Design principles

- **Frictionless inline capture.** A trader who has to switch apps to journal will not journal. Notes panel attached to every working surface, hotkey-accessible.
- **Templates remove blank-page friction.** One-click load of "new position thesis" template populates the structure.
- **Snapshots at the moment of decision.** Chart state, market state, news state — embedded automatically. Recall what they actually saw, not just what they wrote.
- **Auto-prompts for discipline.** Sizing over threshold prompts for thesis. Invalidation condition triggering prompts for review. Closing a position prompts for lesson.
- **Searchable across years.** Future-self can find "all my failed earnings trades" or "all themes where conviction inflated past 8."
- **Status surfaces unfinished work.** "You have 12 active theses; 3 over 90 days old — review?"
- **Privacy controls.** Personal observations / negative thoughts may need to stay private; some entries are visible only to the trader; some are sharable with desk; some are auditable by compliance.
- **Versioned, never silently edited.** Editing a thesis preserves the prior version; auditable.

#### Used by

All 14 trader archetypes. David writes commentary instead of journaling. Elena does not journal but maintains a communications log.

---

### 16. Heatmap of Own Book

#### What it is

A visual treemap (or grid) of the trader's positions where each cell is **sized by exposure** and **colored by P/L** (or another metric the trader picks). Multiple grouping modes — by underlying, by sector, by venue, by strategy, by domain (CeFi vs DeFi), by cluster, by deal, by event. The "glance-and-know" view: in 2 seconds the trader sees what's working and what's bleeding.

#### Why it matters

Tables of numbers are slow to read; charts of P/L over time are too granular. The heatmap is the **fastest** read of the book's state — at the level of "where is my P/L coming from / going to today?" — that a trader can do. Senior traders use the heatmap as the morning glance, the post-coffee re-glance, the post-news re-glance, the end-of-day reflection. It's a cheap surface that compresses a lot of information.

#### Standard shape

- **Treemap or grid** — cells proportional to size dimension (gross exposure / capital deployed / net delta / DV01).
- **Color encoding** — P/L (today), with magnitude-proportional intensity. Green / red diverging color scale.
- **Grouping mode selector** — by underlying / sector / venue / strategy / domain / cluster / deal / event. Persistent per user.
- **Drill-down** — click a cell to see positions composing it.
- **Hover detail** — tooltip with size, P/L, position count, recent activity.
- **Time-window selector** — heat by today / WTD / MTD / YTD P/L (or by realized vs unrealized split).
- **Alternative metrics** — color by % move of underlying, by IV change, by volume vs average, by liquidity, by drawdown depth — depending on the use case.
- **Filtering** — show only positions over a size threshold, only one strategy, only one venue.
- **Snapshot capture** — save the heatmap at a moment for the trade journal or end-of-day review.

#### Common variants

- **Sector heatmap** (Henry's bread and butter for equities) — XLK / XLF / etc. constituents in a sector grid; useful for "what sub-sector is breaking out today."
- **Crypto market-cap heatmap** (Marcus / Julius) — every coin sized by market cap, colored by % move; quick "where's the action."
- **Funding heatmap** (Marcus, Julius) — instruments × venues, colored by funding rate (z-score). Where is funding extreme?
- **Liquidation heatmap** (Marcus) — price levels × leveraged-position concentration, color = $ at risk; price magnets visible.
- **AMM concentrated-liquidity heatmap** (Julius) — Uniswap v3-style price ranges × LP concentration; gaps in liquidity = where price moves easily.
- **Stablecoin heatmap** (Julius) — every stable × venue, colored by deviation from $1 (depeg z-score).
- **IV surface heatmap** (Sasha) — strike × tenor × IV, colored by IV vs historical.
- **Curve heatmap** (Ingrid) — tenor × spread (vs benchmark or vs prior day), colored by z-score.
- **FX cross matrix** (Yuki) — currency × currency grid, % moves color-coded.
- **Sport heatmap** (Diego) — events × sports, sized by capital, colored by P/L.
- **Cluster heatmap** (Aria) — markets within a cluster (e.g. all 50 Senate races), sized by capital, colored by edge or P/L.
- **Deal heatmap** (Naomi) — deals × spread z-score, sized by capital deployed.

#### Design principles

- **2-second read.** A trader should glance and know without zooming or clicking.
- **Multiple grouping modes built-in.** Same data, different cuts.
- **Color and size encode different dimensions.** Don't conflate (e.g. don't color by size and size by P/L; that's redundant).
- **Drill-down is mandatory.** A heatmap that doesn't expand is just a picture; one that drills to underlying positions is a tool.
- **Alternative metrics for alternative needs.** P/L is default but volume / vol / drawdown / etc. are equally useful in different contexts.
- **Updated live.** As positions and prices move, the heatmap updates within ms.
- **Sharable.** Snapshot of the heatmap can be pasted into chat / journal / report.

#### Archetype-specific extensions

- **Marcus** — by underlying, by venue, by strategy. **Funding heatmap** as a separate Decide-phase surface (covered as a unique tool). **Liquidation heatmap** likewise. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — Marcus's set + by-domain (CeFi vs on-chain), by-protocol, by-chain. AMM concentrated-liquidity heatmap and stablecoin heatmap as separate Decide surfaces. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — less central; inventory itself is the view. Glance value is lower because every position is an active inventory she's already watching. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — IV surface itself functions as the heatmap of the trader's "world." Own-book heatmap by structure / underlying useful for end-of-day reflection. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — **sector heatmap** is foveal. Own-book heatmap by sector / sub-industry / strategy. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — tenor × DV01 grid, plus curve heatmap (spreads colored by z-score) as a Decide surface. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — by theme as primary, asset-class secondary. Sized by conviction (or capital), colored by P/L. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — currency-grid colored by exposure × today's move; FX cross matrix is the "world view" heatmap. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — products / spreads sized by exposure × today's move. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — deals sized by capital deployed × today's P/L move. By sector / deal type secondary. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — fleet heatmap: strategies sized by capital × colored by P/L (or by health badge: green / amber / red). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — active markets grouped by sport, sized by exposure, colored by P/L. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — markets sized by capital deployed × today's P/L move, grouped by cluster. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide aggregate heatmap**: traders × strategies, sized by risk consumed, colored by P/L. **Per-trader tile board with behavioral health badge** is a heatmap variant. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — does not see the trader's heatmap. Her analog is fund-level performance summary on her landing page. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 14 trader archetypes + David. Less foveal for Mira (inventory is the view). Not used by Elena.

---

### 17. Communications Panel

#### What it is

The integrated chat / messaging / call-notes layer. Aggregates Bloomberg Chat / Reuters Eikon / Symphony / broker chats / Telegram / Discord / Slack / Microsoft Teams / internal desk chat / IR / dealer / expert-network calls — into one interface, with messages auto-linked to instruments / deals / themes / positions where context is detectable. Lets the trader stay in their workflow while ambient desk chatter, sell-side flow color, and counterparty conversations flow in.

#### Why it matters

Trading floors run on chat. Sell-side desks use Bloomberg Chat / Symphony to relay block-trading IOIs ("indications of interest"), axes ("we're a buyer of size in X"), market color, and rumor. DeFi traders live on Telegram / Discord. Sports syndicates coordinate via Telegram. Internal desks use Slack. The trader who is _in the chat_ gets information minutes (sometimes hours) before the wider market. Missing chat = missing edge. The platform's job is to surface chat alongside the working surface, with smart filtering so the volume doesn't drown the signal.

#### Standard shape

- **Multi-protocol aggregation** — Bloomberg, Symphony, Reuters Eikon, Telegram, Discord, Slack, Teams, internal — all in one panel with per-source filtering.
- **Per-message metadata** — sender, source, timestamp, auto-detected linked instruments / deals / themes.
- **Auto-linking** — messages mentioning a ticker / deal / theme auto-attach to that entity. Click an entity to see all messages about it.
- **Threading and pin** — pin important messages, thread replies, mark for follow-up.
- **Search across history** — full-text across years of chat, scoped by source / sender / linked entity.
- **Mention notifications** — @ mentions trigger alerts; settable per source.
- **Verified-source highlighting** — known sell-side analysts, internal team, verified syndicate members color-coded vs anonymous.
- **Snippet capture** — pull a chat quote into a journal entry or report.
- **Voice / video integration** where available — Bloomberg / Symphony voice; expert-network calls; conference-call audio with transcription.
- **Compliance-aware** — chat is regulated for licensed traders (Henry, Ingrid, etc.); the platform must satisfy retention requirements (typically 7 years for equity / fixed-income; varies by jurisdiction).
- **Information-barrier enforcement** — Naomi's information barriers (when firm has MNPI on a deal): chat with the wrong side of the wall is blocked or audited.

#### Source classes

- **Sell-side institutional chat** — Bloomberg Chat, Symphony, Reuters Eikon. Relay flow color, axes, IOIs, market color. Henry, Ingrid, Naomi, Yuki, Theo, Rafael, Sasha live here.
- **Crypto trader chat** — Telegram (the crypto desk's Bloomberg), Discord (DeFi communities), Twitter DMs. Marcus, Julius, Sasha (crypto options) live here.
- **Sports trader chat** — Telegram syndicate groups, Discord communities, X DMs. Diego lives here.
- **Internal desk** — Slack / Teams / firm-internal Symphony. Universal.
- **Counterparty communications** — bilateral with dealers / IR / specialist counterparties. Logged.
- **Expert networks** — GLG / Coleman / AlphaSights / Tegus call notes integrated, with audio recordings where allowed.
- **Internal analysts / economists / lawyers / compliance** — internal team's notes attached to instruments / deals.

#### Design principles

- **One panel, multiple sources.** No app-hopping; the trader stays in flow.
- **Auto-linking is foundational.** Messages without context are noise; messages auto-tagged to instruments / deals are signal.
- **Filtering is mandatory.** Volume of chat exceeds reading bandwidth; smart filters (only my book / only verified senders / only past hour) cut noise.
- **Search is foundational.** "What did the GS rates desk say about this auction last quarter?" must be one search away.
- **Compliance is non-bypassable.** Regulated chat retention enforced; information-barrier-violating chats blocked at platform level.
- **Verified vs anonymous distinction.** A leak from a known reporter ≠ random tweet; the platform respects credibility tiers.
- **Snippet → journal / report.** Frictionless capture into other workflows.
- **Latency-tier-aware.** Premium chat (sell-side, internal) is real-time; social chat is best-effort.

#### Archetype-specific extensions

- **Marcus** — Telegram / Slack / Discord for desk chatter and analyst feeds. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — same as Marcus + heavy DeFi: Telegram for protocol communities, Discord for DeFi discussions, X DMs for verified analysts. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — minimal direct use; flow comes from data, not chat. Internal desk Slack for coordination. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — desk chat for options-flow color and dealer conversations. Paradigm chat for block-trade RFQs. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry — Bloomberg Chat / Symphony foveal**: sell-side chat (broker-by-broker), broker-block-trading desk chat aggregated, internal analyst notes attached to positions, IR contact log integrated, expert-network call notes attached to names. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid — Bloomberg / Symphony foveal**: sell-side rates desk chat (flow color, axes), internal economist notes, primary-dealer flow color. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael — Bloomberg / Reuters chat**: sell-side strategist chat across asset classes, internal economist notes attached to themes, geopolitical consultant feed for relevant themes, podcast / interview library integrated. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki — Bloomberg / Symphony foveal**: sell-side FX desk chat, EM specialist chat for political risk and capital controls, internal economist for relevant central banks. See [yuki](trader-archetype-yuki-fx.md).
- **Theo — Bloomberg / Reuters chat**: broker chat, sell-side desk color, physical desk chat (if firm has physical-trading desk), weather-service chat, geopolitical analyst feed. See [theo](trader-archetype-theo-energy.md).
- **Naomi — Bloomberg / Symphony + internal lawyers**: sell-side event-driven desk chat (flow color, deal-specific intel), **internal lawyers' opinions on regulatory questions**, expert-network call notes attached to deals, industry sources (analysts, trade press). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — internal desk chat / Slack** for strategy team and risk coordination. Less use of external chat. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — Telegram syndicate chat foveal**: sharp-trader groups share signals; in-house desk chat; verified-source social media (X) filtered to active events. See [diego](trader-archetype-diego-live-event.md).
- **Aria — domain-expert chat per cluster**: politics analysts, AI researchers, weather forecasters; **venue-specific Telegram / Discord** for community color (Polymarket / Kalshi); internal research team notes attached to clusters. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — trader chat integrated**: ping a trader without leaving the terminal; **risk-committee notification rail** with pre-formatted updates; client / desk announcement broadcast for desk-wide messages; firm-wide chat governance. See [david](trader-archetype-david-pm-risk.md).
- **Elena — limited, structured.** Schedule-a-call workflow with IR, submit-a-question workflow, communications log of every email / call note / meeting summary with the firm. **Not real-time chat.** Searchable. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. Source mix differs dramatically by archetype.

---

### 18. Latency / Connectivity / Infra Panel

#### What it is

A continuously-visible panel showing the health of every connection between the trader and the markets — round-trip latency to each venue, market-data feed lag, rate-limit headroom, reject rates, on-chain RPC / oracle / mempool health, video-feed latency (sports). The trader's "instrument cluster" — the dashboard that says "your engine is healthy" or "something is wrong, slow down."

#### Why it matters

A trader making decisions on stale data is a trader losing money on every trade. Latency degradation is silent: orders fill at the wrong price; quotes get picked off; in-play sports markets go suspended while the trader is still placing orders; on-chain transactions get sandwiched. **The cost of unmonitored latency is real and accumulates per second.** A platform without an infra panel is one that asks the trader to detect their own infrastructure problems through P/L.

#### Standard shape

- **Per-venue / per-protocol latency** — round-trip time (RTT) in ms (or μs for market-makers), distribution (mean / p50 / p95 / p99), not just mean. Color-coded (green / amber / red).
- **Market-data feed lag** — time between venue tick and platform display, per feed.
- **Time-since-last-tick** — staleness alarm for each instrument. If a feed hasn't ticked in N seconds, surface immediately.
- **Reject rates** — order rejects per minute, with reasons categorized (rate limit, price moved, account issue, unknown).
- **Rate-limit headroom** — % of per-minute API limit consumed, per venue. Critical for Marcus / Julius / Mira.
- **Connection state** — per WebSocket / FIX session: connected / reconnecting / disconnected / degraded.
- **On-chain-specific** — RPC node health, oracle staleness, gas price levels, mempool size, MEV-Share / Flashbots inclusion rate.
- **Video / data-feed latency** (Diego) — direct stadium feed vs broadcast; latency to "truth" tracked.
- **Co-location health** (Mira) — server load, NIC stats, kernel-bypass status.
- **Engine queue depth** — internal events waiting to process; backpressure indicator.
- **Heartbeat** — platform-side health signal, monotonically advancing; freezes if backend stalls.

#### Granularity by use case

The same panel serves different latency tolerances:

- **Microsecond (Mira)** — RTT distribution must show p99 in microseconds, not milliseconds. Tail spikes correlate with P/L drops; visible as fine-grained as possible.
- **Millisecond (Marcus, Julius, Sasha)** — RTT in ms, sub-100ms expected for active trading. >500ms = problem.
- **Second-tier (Henry, Ingrid, Rafael, Theo, Naomi)** — RTT in 100s of ms is acceptable; the concern is feed lag and reject rates rather than micro-latency.
- **Real-time event (Diego)** — video latency to the stadium, in seconds. <3s is required; >5s is unusable.
- **Anomaly-driven (Quinn, David)** — only see infra metrics on degradation; otherwise trust the system.

#### Design principles

- **Always visible.** Even when nothing is wrong, a small status indicator confirms health. Disappears = problem.
- **Distribution, not just mean.** Mean RTT can be 5ms while p99 is 200ms; the latter is what kills trades. Show the tail.
- **Per-venue granularity.** A trader using 5 venues has 5 latency profiles; lumped is useless.
- **Auto-degradation responses configurable.** "If Binance latency > 100ms, pause new orders to Binance." "If RPC feed lag > 5s, pause on-chain trading." Trader configures; platform enforces.
- **Audit trail of degradation.** Every latency spike or feed disconnect logged with start / end times, peak severity. Used in post-trade review.
- **Latency budget published.** The platform has SLAs (target p99 < X ms). Misses are flagged; engineering investigates.

#### Archetype-specific extensions

- **Marcus** — round-trip ms to Binance / Bybit / OKX / Deribit color-coded. Rate-limit indicator vs per-minute API limit. Spike detection. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — Marcus's set + on-chain: RPC-node health, oracle staleness, gas levels, mempool size, MEV-Share / Flashbots inclusion rate, bridge / RPC alerts ("endpoint degraded, switch nodes"). See [julius](trader-archetype-julius-hybrid.md).
- **Mira — foveal, microsecond-resolution**: RTT distribution per venue (not just mean), market-data latency, time-since-last-tick per feed, co-location health (server, NIC, kernel-bypass), rate-limit headroom, order-rejects rate and reasons, **engine queue depth** (internal events waiting to process), reflected as a cockpit-style cluster of indicators always in peripheral vision. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — venue connection health for Deribit / CME / Binance / Bybit options; RFQ-response latency per dealer (Paradigm); on-chain options venue health. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — venue connectivity for major equity venues + dark pools; algo-execution latency; broker-block-trading network health. Sub-second concerns less than for crypto. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — RFQ-platform health (Bloomberg / Tradeweb / MarketAxess), CCP connectivity (LCH / CME), futures-venue latency; auction-day connectivity tested in advance. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — multi-venue connectivity overview; spike detection; pre-event connectivity confidence (before FOMC, all venues green). See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — **LP latency per LP** (which LP is fastest; which is rejecting), last-look rejection rate per LP, venue health across ECN / multi-bank / single-dealer. **LP scorecard** is the post-trade summary; latency panel is the live view. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — venue connectivity (NYMEX / ICE), RFQ-platform health, weather-service feed health, EIA-release-day connectivity confidence. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — broker connectivity (block desks), prime-broker connectivity, regulatory-feed health (SEC EDGAR latency). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — infrastructure as part of fleet alerts**: compute health (CPU / RAM / GPU per strategy node), data-pipeline health (feature lag, data freshness per source), order-router health (order rates, reject rates, latency per venue), connectivity (venue connections, mempool nodes, oracle feeds). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — video-feed latency foveal**: direct stadium feed (1–3s) vs scout-relayed (sub-second) vs broadcast (5–60s, useless), exchange RTT, **bet-delay window** for current event. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — venue health (Polymarket smart contract status, Kalshi platform), bridge health, oracle health (especially UMA for Polymarket dispute state), RPC connectivity for on-chain. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide infra rollup**: per-trader connectivity health, venue / protocol health firm-wide, **bridge in-flight value** (most exposed during transit), data-pipeline health for risk feeds. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — does not see infra panel. Operational integrity guaranteed by the firm; she gets disclosure if there's a service incident. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 13 trader archetypes (excluding David, Elena who use it indirectly via aggregated rollup). **Foveal at microsecond resolution for Mira.** Foveal at video latency for Diego. Sub-100ms-foveal for Marcus, Julius, Sasha. Less critical for Henry, Ingrid, Rafael, Theo, Naomi (sub-second is fine).

---

### 19. Kill Switches (Granular)

#### What it is

A hierarchy of "stop everything" buttons at different scopes — instrument / strategy / venue / domain / trader / firm — each with appropriate authentication friction matched to the consequence. The trader's last line of defense when something is going wrong.

#### Why it matters

When a trade goes catastrophically against you (a flash crash, an oracle exploit, a venue outage, a venue takeover by a hacker), seconds matter. A kill switch that takes 30 seconds to find and click is too slow. Kill switches must be: **discoverable** (always at the same place), **scoped appropriately** (kill one strategy without nuking the desk), **fast** (one click for the right scope), **safe** (don't accidentally trigger when the cat walks on the keyboard), and **auditable** (every kill logged with reason).

#### Standard shape

A layered hierarchy of switches:

- **Per-instrument kill** — close all positions on this instrument, cancel all working orders. Fast — usually a hotkey.
- **Per-strategy kill** — pause / stop a specific automated strategy.
- **Per-venue kill** — pull all firm activity from a venue (cancel + flatten or just stop new orders, configurable).
- **Per-domain kill** (Julius) — kill CeFi only, kill on-chain only, with separate workflows because of different unwind dynamics.
- **Per-trader kill** (David) — disable a trader's order entry; optionally flatten their book.
- **Firm-wide kill** (David) — stop everything; multi-key authentication (David + CIO + risk officer typically).
- **Engine kill** (Mira) — stop the quote engine; specifically scoped because Mira's "kill all" includes thousands of working orders that need to be canceled instantly.

#### Multi-stage kill (for trades that can't be exited instantly)

Some books can't be flattened in a single action because of liquidity / settlement / on-chain mechanics. The kill must be staged:

- **Stage 1 — instant** — flatten what can be flattened; cancel all working orders.
- **Stage 2 — algo unwind** — execute pre-defined unwind algos for positions that need careful exit.
- **Stage 3 — settlement / bridging** — for on-chain capital, bridge proceeds to a designated safety wallet on Ethereum L1 (Julius); for fund-level redemption, route via gates (Elena's allocator-side analog).

Each stage requires confirmation, shows progress in real time, and can be paused / resumed.

#### Authentication & friction

The friction maps to the consequence:

- **Hotkey, no confirmation** — cancel-all on focused instrument (low blast radius, reversible).
- **Hotkey, single-press confirmation** — flatten focused instrument.
- **Mouse click + confirmation** — flatten all on a venue.
- **Held-key combo + confirmation** — pause-strategy, kill-strategy.
- **Multi-key (multiple humans) + confirmation** — firm-wide kill.
- **Foot pedal** — Mira's engine kill, where seconds matter and hands are typing.

#### Design principles

- **Discoverable at all times.** A kill switch in a buried menu is useless. Visible (or hotkey-bound) on every working surface.
- **Scope-matched.** Closing one position should never accidentally close all. Scope is explicit and visible at the moment of click.
- **Safe by default.** Confirmations on the wider-blast actions; some kills (e.g. firm-wide) require multiple humans.
- **Logged comprehensively.** Every kill timestamped, with the trader's last reason, all positions affected, all orders canceled, results.
- **Tested regularly.** Drills: monthly fire-drill where the firm tests kill switches in paper-trade mode, verifies they work as expected.
- **Cancel + flatten are distinguishable.** Sometimes you want to cancel working orders without flattening positions (let the existing position run, just stop adding). Sometimes you want both. The kill UI distinguishes.
- **Reverse-able where possible.** A "pause strategy" is different from "kill strategy." Paused can resume; killed requires re-promotion.

#### Archetype-specific extensions

- **Marcus** — flatten all positions (confirmation), cancel all working orders (instant), pause all algos. **Three separate buttons** so one doesn't trigger the others by accident. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius — multi-stage kill** because on-chain positions can't be exited instantly: Stage 1 flatten CeFi positions + cancel CeFi orders (instant), Stage 2 route on-chain positions to "exit-mode" (close LPs, repay loans, unstake), Stage 3 bridge proceeds to safety wallet on Ethereum L1. Each stage requires confirmation and shows progress in real time. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — per-instrument kill, per-venue kill, **engine kill** (stop everything; big red; **hotkey + mouse + foot pedal**). All canonical scopes are present and the engine kill is the special-cased fastest action. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — close all options (not realistic instantly given illiquidity, so triggers an unwind algo with progress display), stop new options orders, **flatten delta** (instant via spot/perp). See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — reduce all to gross/net target (algo-execute over the day), stop new entries (pause additions), flatten by mandate (emergency wind-down). Less hair-trigger than crypto but present. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — reduce DV01 to target (algo-execute over hours), hedge to neutral (fastest available hedge applied), cancel all working (RFQs and limit orders). See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — reduce theme exposure (algo unwind), close theme (unwind all expressions for a theme), reduce risk to target (book-level VaR target), cancel all working orders. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — reduce FX exposure to target, flatten by currency (close all positions long/short a specific currency), hedge to neutral (buy-back of dollar exposure), cancel all working orders. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — reduce by product (flatten gasoline, keep crude), reduce all energy, hedge to neutral (front-month to offset back-month), cancel all working orders. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — reduce a deal's exposure (pre-defined unwind algo), close all M&A positions (multi-day algo), hedge to neutral (fast index hedge), cancel all working orders. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — fleet kill switches**: per-strategy kill (stops one strategy), group kill (all strategies in a tier or on a venue), fleet kill (stop everything; big red; multi-confirmation). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — staged for sports**: flatten event (green-up to zero exposure), cancel all working orders on event, pause new entries on event, **aggregate flatten** (green-up across all events), **account-level lock** (stop new orders to a specific exchange). See [diego](trader-archetype-diego-live-event.md).
- **Aria** — reduce cluster exposure (algo unwind), close venue exposure (flatten on Polymarket or Kalshi), pause new entries, cancel all working orders. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide multi-key**: per-trader kill, per-strategy kill, per-venue kill, **firm-wide kill** (multi-key: David + CIO + risk officer for catastrophic events). Granular by scope, strongly authenticated for the largest scopes. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — does not have kill switches in the trading sense. Her analog is **redemption / capital withdrawal** — slower, gated, but the equivalent "exit" mechanism. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 14 trader archetypes + David. Granularity differs (Mira's microsecond engine kill vs Naomi's multi-day algo unwind). Multi-stage architecture for Julius and Diego (event-bound). Multi-key for David's firm-wide.

---

### 20. Replay Tool

#### What it is

A surface that lets the trader reconstruct historical market state at the resolution they care about — order book, surfaces, curves, pools, mempool, ladders, video — plus their own orders and positions and P/L overlaid, and scrub through time to see exactly what happened. Distinct from the trade history (which records fills) and the journal (which records thoughts) — the replay reconstructs the _world_ at a moment.

#### Why it matters

This is, per most archetype docs, **the highest-value post-trade tool**. The reasons are universal:

- **Pattern recognition.** Was the chart pattern I thought I saw actually there? Replay shows the chart as it was, not as memory reshapes it.
- **Decision review.** What did I see at the moment I sized this trade? Was I reading the order book correctly? Was the news already public when I entered?
- **Counterfactuals.** What if I'd waited 5 minutes? What if I'd hedged before the event? Replay shows what the alternatives would have been.
- **Post-incident review.** When something blew up (a venue outage, an exploit, a flash crash), replay reconstructs the entire state to understand what happened and what the firm should do differently.
- **Training.** Junior traders study the senior trader's replays to see how they read the market.
- **Compliance / regulator review.** "Show me what you saw at 14:32:18 when you placed this order." Replay is the only way to answer.

The cost of building tick-level historical replay is non-trivial — it requires recording everything. But for a senior trader, **reviewing one trade in replay can be worth more than a week of forward research**.

#### Standard shape

- **Time selector** — pick a date / time / window. Recent (last 24h) is hot; older is warm; archived is cold.
- **State reconstruction** — at the chosen time, show the relevant surfaces: chart, order book, ladder, surface, curve, pool state, mempool, news feed, alerts that fired, my orders, my positions, my P/L.
- **Scrubbable timeline** — drag forward / backward in time at the resolution that matters (microseconds for Mira; seconds for Diego; minutes for Henry; days for Naomi).
- **Multi-surface synchronized** — all surfaces show the same moment. Move one timeline; all update.
- **Speed control** — 0.5x / 1x / 2x / 5x / 10x / pause / step-frame.
- **Markers** — my orders sent / filled / canceled, alerts fired, news items arrived.
- **Annotations** — pin observations to a moment for journal entry or training material.
- **Side-by-side comparison** — pick two replays (this trade vs that similar trade) and step through together.
- **Latency-aware reconstruction** — replays faithfully include the latency the trader actually had (you didn't see the venue tick in real time; you saw it 50ms later).

#### Resolution by archetype

The "resolution that matters" varies dramatically:

- **Microsecond (Mira)** — μs-level replay of order book + her quote stack + her fills + cancellation events.
- **Second (Marcus, Julius CeFi side, Yuki, Diego)** — second-level granularity for in-play and active spot trading.
- **Block-level (Julius DeFi side, Aria on-chain)** — every block's pool state + mempool + her own tx; replay-by-block.
- **Minute (Henry, Sasha)** — minute bars for chart-based decisions; vol surface snapshots; greek evolution.
- **Day (Ingrid, Theo, Rafael)** — daily curve / spread / inventory state; replay across weeks.
- **Event-level (Naomi)** — discrete events (regulatory rulings, court hearings, votes); replay around each event.

#### Cross-surface synchronization

The hardest replay challenge is **synchronizing surfaces**. Examples:

- **Marcus** — orderbook + chart + position + my orders, all at the same instant.
- **Julius** — synchronized **CeFi state + on-chain state** (Binance and Uniswap at the same instant) — unique requirement, hard to build.
- **Sasha** — synchronized **price + IV surface + greeks evolution + my structures** at the same instant. The surface replay is the unique value.
- **Diego** — synchronized **video + ladder + live stats + my orders + P/L** scrubbable. Also hard to build (video archival is expensive but invaluable).
- **Aria** — synchronized **multiple venues** (Polymarket + Kalshi + Smarkets + Betfair) showing the same event's price evolution.
- **David** — synchronized firm-wide aggregate state at any historical moment for post-incident review.

#### Design principles

- **Faithful, not optimistic.** Replay shows what the trader actually saw, not what data later corrected. If the venue had a glitch and the trader saw bad data, the replay shows the bad data.
- **Resolution matches the trader's working speed.** Mira gets microseconds; Naomi gets event-level. Compromises here lose the value.
- **Time travel without breaking causality.** Scrubbing backward then forward must be deterministic — same state at same time, every replay.
- **Storage is expensive; tier hot / warm / cold.** Recent replays sub-second to load; older replays seconds to minutes (cold archive).
- **Annotation-as-training-material.** Senior traders annotate replays for the junior team; the platform supports authoring.
- **Side-by-side comparison.** Two trades, two replays, scrubbed together — pattern recognition tool.

#### Archetype-specific extensions

- **Marcus** — orderbook reconstruction + own orders + chart + news + alerts; tick-level resolution. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius — synchronized cross-domain replay**: CeFi state and on-chain state at the same instant, one of the highest-value unique surfaces. See [julius](trader-archetype-julius-hybrid.md).
- **Mira — μs-level replay of order book + quote stack + fills**: scrub through a session, see exactly what happened in a 50ms event. **Test parameter changes against historical micro-data.** Replay is heavily used. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha — surface replay**: scrub through historical IV surface evolution around any trade; pair with greek evolution and underlying price. The unique value. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — chart + position + news around earnings or catalyst. Pair with thesis journal entry to compare what was said vs what happened. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — yield curve + spread evolution + own positions around auctions / FOMC / data releases. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — cross-asset state at any historical moment; theme dashboards reconstructed; replay across themes. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — multi-LP state + own orders + fixings around session opens / CB events / interventions. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — forward curves + spread evolution + inventory + weather data + own positions around EIA reports / OPEC / hurricanes. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — deal-state evolution: spread + filings + court rulings + own positions, around regulatory events. Document timestamps preserved. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — strategy backtest replay (every model output, every signal, every fill) with full feature snapshot. **Reproducibility** is a non-negotiable. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — synchronized video + ladder + orders + P/L**: pick any prior event, scrub through video alongside the ladder she traded; the unique post-trade tool. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — cross-venue price evolution + own positions + resolution-source state + news around any market. **Pre-resolution-window replay** especially useful. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide replay**: reconstruct the entire desk's state at any historical moment for post-incident analysis. Each trader's book + alerts firing + behavioral state + risk panel + news. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — does not use replay. Her analog is the historical fund-level performance report. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 14 trader archetypes + David. **Single most-valuable post-trade tool for nearly every archetype.** Not used by Elena.

---

### 21. Trade History / Blotter (Historical)

#### What it is

The complete historical record of every fill the trader has executed, with full context at decision time — instrument, side, size, price, fee, venue, parent order ID, strategy / theme / deal / cluster tag, market state at the moment, journal entries linked. Filterable by every dimension; searchable across years.

#### Why it matters

The blotter is **truth.** Every other Phase 4 (Learn) surface — attribution, performance metrics, TCA, behavioral — derives from the trade history. If the history is incomplete, missing fields, or wrongly tagged, every downstream analytic is wrong. The platform's job: capture _everything_ at the moment of decision, never lose it, make it queryable forever.

#### Standard shape

- **Per-fill row** — instrument, side, size, price, fee, venue, parent order ID, strategy tag, theme / deal / cluster tag, timestamp (microsecond), state at decision (mid, depth, news context).
- **Filter dimensions** — date range, instrument, side, side-of-book (maker / taker), strategy, theme, deal, cluster, venue, counterparty, parent order, fill class (entry / exit / hedge / scratch).
- **Group by** — same dimensions; rollup of fills into parent orders; rollup of parent orders into trades; rollup of trades into themes / deals.
- **Linkable to parent order** — reconstruct the parent's full execution path, including child orders that didn't fill.
- **Linkable to journal entry** — see the thesis at entry alongside the fill.
- **Linkable to chart snapshot** — see the chart as it was at the moment of fill.
- **Linkable to replay** — one click to launch the replay for the fill's moment.
- **Export** — CSV / JSON / Excel / Parquet for ad-hoc analysis or external workflow.
- **Search** — full-text across trader's notes, instrument tickers, strategy tags.
- **Audit-immutable** — fills are append-only; corrections are amendments, not edits.

#### Per-archetype enrichment

The fill record carries archetype-specific fields:

- **Marcus** — funding accrued (perps), basis P/L (futures), strategy tag.
- **Julius** — on-chain: tx hash, gas used, MEV experienced, route taken, slippage realized, bridge cost, approval state. CeFi: standard.
- **Mira** — captured edge in bps at fill time vs fair, post-fill price drift over T seconds (adverse selection score), counterparty (where exposed), queue position estimate at fill.
- **Sasha** — entry vol, entry skew context, IV-realized-during-hold, days to expiry at entry / exit, structure ID (the fill belongs to a structure).
- **Henry** — strategy tag, parent algo, pair / basket parent, sector tag, catalyst tag (was this fill catalyst-driven?).
- **Ingrid** — DV01 of fill, tenor bucket, parent trade type (outright / curve / butterfly / basis), carry P/L since entry.
- **Rafael** — theme tag, asset class, expression type, conviction at entry.
- **Yuki** — currency-decomposed delta, fixing flag (was this a fixing trade?), session at entry, LP venue, last-look state.
- **Theo** — product, contract month, calendar-spread parent, weather / inventory context at decision.
- **Naomi** — deal ID, leg type (target / acquirer / hedge / capital structure), borrow rate, recall state.
- **Diego** — event, market type, side (back / lay), CLV (entry vs close).
- **Aria** — market ID, cluster, venue, fair-price-model output at entry, edge at entry.
- **Quinn** — strategy ID, model version, feature snapshot hash at decision.
- **David** — manual interventions logged with reason and authorization chain.
- **Elena** — capital movements (subscriptions / redemptions / switches) logged.

#### Design principles

- **Capture everything.** Disk is cheap; missed context is expensive. Every fill carries enough metadata to reconstruct the decision later.
- **Tag at order entry.** Strategy / theme / deal tags applied at submission, never retroactively (see #29 Strategy Tagging Framework).
- **Append-only.** Fills are immutable historical records. Corrections happen via amendments, not edits.
- **Filterable on every dimension.** A trader exploring a hypothesis ("how did my BTC funding-arb trades do in Asia session in Q4 last year?") must be able to slice without writing SQL.
- **Linked to context.** Journal entry, chart snapshot, news state, alerts that fired — all retrievable from the fill row.
- **Queryable forever.** Years of history, sub-second to query (with appropriate indexing / partitioning under the hood).
- **Compliance-grade audit trail.** Regulatory retention requirements satisfied (typically 7 years for licensed traders).
- **Cross-trader at firm level.** David sees all traders' fills with the same query interface, restricted by permissions.

#### Used by

All 15. Every Phase 4 analytic depends on this surface.

---

### 22. PnL Attribution (Multi-Axis)

#### What it is

A post-trade analytic surface that decomposes total P/L across multiple slicing dimensions — strategy / theme / deal / instrument / venue / regime / catalyst / time-of-day / greek / tenor / domain / cluster / sport / session. The trader can slice and drill to answer "where do I actually make money?" and "where do I lose it?" — questions whose answers drive next quarter's allocation, sizing, and strategy choices.

#### Why it matters

P/L without attribution is just a number. Attribution turns P/L into **information**: which sector is paying you, which strategy is broken, which session you're best at, which catalyst type you handle well. Senior traders spend their weekends and post-trade days here — pattern recognition across years of attribution is what compounds into edge. **A platform that has good live PnL but weak attribution leaves money on the table.**

#### Standard shape

- **Multiple decomposition axes** — selectable, combinable. The trader can group by strategy then sub-group by venue then sub-group by regime, etc.
- **Time-window selector** — today / WTD / MTD / QTD / YTD / ITD / custom range.
- **Realized vs unrealized split.**
- **Gross vs fees vs net** — three rows always.
- **Drill from aggregate to fills.** Every aggregate row drills to the underlying fills.
- **Comparison vs prior period** — this month vs last month, this quarter vs prior, etc.
- **Distribution charts** — not just point estimates; show the distribution of returns per slice (so a single big winner doesn't mask poor consistency).
- **Statistical significance flags** — when sample size is too small to draw conclusions, flag.
- **Sliceable for ad-hoc queries** — "show me my BTC trades during high-vol regimes in the Asia session over the past year."

#### Universal axes

- **By instrument / underlying.**
- **By strategy / theme / deal / cluster** (using strategy tag from #29).
- **By venue.**
- **By time-of-day / day-of-week.**
- **By regime** (vol regime, market regime, regime-tagged at decision).
- **By position size bucket.**
- **By holding period.**

#### Archetype-specific attribution axes

The unique value lives here. Each archetype has axes that are critical for _their_ edge identification.

- **Marcus** — by instrument class (spot / perp directional / perp funding / basis / options theta/vega/gamma realized), by underlying, by strategy tag, by time of day / day of week / market regime (Asia vs US, weekend vs weekday, trending vs chop). See [marcus](trader-archetype-marcus-cefi.md).
- **Julius — by domain (CeFi vs DeFi share)**, by instrument class (spot / perp directional / funding / basis / options / LP fees / lending interest / staking rewards / point-airdrop value / gas cost), by underlying, by strategy tag (basis arb / funding harvest / cash-and-carry / LP+hedge / points farming / governance arb), by venue/protocol, by chain. See [julius](trader-archetype-julius-hybrid.md).
- **Mira — fill-level edge components**: captured edge in bps + realized edge (captured minus subsequent adverse drift) + hedge cost incurred + net per-fill P/L. **Distributions matter more than means** here — edge is microscopic per fill, only aggregation reveals truth. By counterparty class (retail / informed / latency-arb), by time-of-day, by venue. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha — greek-attributed (foveal)**: where did P/L come from? Vega? Gamma scalping? Theta carry? By underlying, by strategy (short premium / long gamma / calendar / skew / dispersion), by tenor (short-dated vs back-dated), by regime (high-vol vs low-vol). See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry — alpha vs beta decomposition**: how much from name selection (alpha) vs market beta. Long alpha vs short alpha (different skills). By sector / sub-industry, by strategy tag (directional / pair / event-driven), by catalyst type (earnings / product launch / M&A / regulatory), by market regime. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — carry vs roll-down vs yield change (passive vs active P/L), by trade type (outright / curve / butterfly / basis), by tenor (short-end / belly / long-end), by currency, by regime (risk-on / risk-off, hiking / cutting cycle), by event (FOMC trades / CPI / auction / NFP). See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael — by theme (primary)**, by asset class, by instrument type, by regime, by catalyst, by time horizon. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — spot vs carry vs vol decomposition, by currency, by pair, **by session (Tokyo vs London vs NY skill)**, by regime, by event (FOMC / ECB / BoJ trades). See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — outright vs spread vs cracks (different skills), by product (crude vs natgas vs power), by tenor (front-month vs back-month), by season (winter natgas vs summer gasoline), by event type (inventory / OPEC / weather / geopolitical). See [theo](trader-archetype-theo-energy.md).
- **Naomi** — by deal, by deal type (M&A / spin / SPAC / distressed / capital structure), by regulatory jurisdiction, by outcome (closes vs breaks vs renegotiations), by sector, by regime (favorable vs hostile regulatory). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — fleet attribution**: total P/L by strategy, by regime, by venue, by underlying. **Risk-adjusted contribution** (which strategies actually contribute Sharpe vs which dilute). **Marginal contribution** (what would fleet Sharpe be without strategy X). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — CLV (closing line value) attribution**: my entry odds vs closing odds. CLV by sport, league, market, strategy. **CLV trend over time.** Plus standard P/L axes (by sport / league / market type / strategy / pre-event vs in-play). See [diego](trader-archetype-diego-live-event.md).
- **Aria — by edge source**: model edge / polling edge / expert-network edge / structural-bias edge / arb edge. Plus by cluster, by venue, by time horizon, by confidence tier. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide attribution**: by trader, by strategy, by underlying, by regime, by venue. **Risk-adjusted contribution per trader.** **Marginal capital allocation.** See [david](trader-archetype-david-pm-risk.md).
- **Elena** — strategy-level (not trade-level) attribution: by strategy / asset class / regime, gross vs net of fees. _Not_ trader-level. See [elena](trader-archetype-elena-external-client.md).

#### Design principles

- **Drillable to source.** Every aggregate row clicks down to the underlying fills.
- **Tag-driven.** Tags applied at order entry are the spine. Without good tagging (see #29), attribution is unreliable.
- **Distribution, not just mean.** Show histograms / box plots, not just averages.
- **Statistical-significance honest.** Flag small samples. "5 trades in this slice — too few to conclude."
- **Comparable across periods.** Same axes, same data, period-over-period.
- **Exportable for ad-hoc work.** Some traders take attribution to Excel / Python for further analysis.
- **Fast.** Pre-aggregated where possible; queries should return in seconds, not minutes.

#### Used by

All 15. Universal Phase 4 analytic.

---

### 23. Performance Metrics

#### What it is

A library of statistical metrics that summarize the trader's performance. Sharpe / Sortino / Calmar / profit factor / expectancy / hit rate / max drawdown / max time underwater are universal; each archetype additionally has **edge metrics** specific to their style — CLV for sports, Brier score for prediction, DV01-adjusted return for rates, etc. Sliced by every dimension from the attribution surface (#22).

#### Why it matters

Performance metrics are the **scoring system** for a trader's career. Compensation, capital allocation, capacity decisions, and self-evaluation all flow from these numbers. The platform's job: compute them correctly (the wrong Sharpe formula is a fireable error), at the right granularity (firm / strategy / instrument / regime), with the right caveats (sample size, drawdown context, regime fit).

#### Standard shape

A library that provides:

- **Annualized return** (multiple horizons: 1y / 3y / 5y / ITD).
- **Volatility** (annualized).
- **Sharpe ratio** (excess return per unit of vol; rolling 30 / 60 / 90 day available).
- **Sortino ratio** (Sharpe variant — downside vol only).
- **Calmar ratio** (annualized return / max drawdown).
- **Profit factor** (gross profit / gross loss).
- **Expectancy** (avg win × hit rate – avg loss × loss rate).
- **Hit rate / win rate.**
- **Avg win / avg loss / win-loss ratio.**
- **Max drawdown.**
- **Current drawdown.**
- **Max time underwater** (longest stretch below previous peak).
- **Worst month / quarter.**
- **Up-capture / down-capture vs benchmark** (institutional staple).
- **Tail metrics** — skew, kurtosis, conditional value-at-risk (CVaR / expected shortfall).
- **Information ratio** (vs benchmark).
- **Hit rate of positive months / quarters.**

#### Archetype-specific edge metrics

The unique value lives here. The **truest edge metric** for each archetype is often _not_ Sharpe.

- **Marcus, Julius** — risk-adjusted return per $ allocated; venue-by-venue Sharpe (sometimes one venue is a drag; other is the alpha source).
- **Mira — captured edge in bps per fill, net of adverse selection and hedge cost**. P/L in $ alone obscures the edge; per-bp tracking makes it visible.
- **Sasha — vol-trader-specific**: vol forecasting accuracy (my fair-vol model vs subsequent realized vol — error distribution); gamma-scalping captured RV vs implied IV; calendar / skew trade convergence half-life.
- **Henry** — alpha-vs-beta decomposition; **catalyst outcome rate** (when sized for earnings, did thesis play out?); style consistency vs mandate.
- **Ingrid — DV01-adjusted return** (return per unit of DV01 risk taken); **information ratio vs Bloomberg Treasury Index**; carry capture (% of available carry earned).
- **Rafael — theme batting average** (% of themes closing profitable); conviction calibration (when said 9/10, did theme work?); average winning theme size vs average losing theme size.
- **Yuki — carry capture** (fraction of available carry earned); spot-vs-carry-vs-vol decomposition rate of return.
- **Theo — DV01-equivalent return**, hit rate by event type (inventory / OPEC / weather / geopolitical), seasonal pattern fit.
- **Naomi — probability calibration (Brier score)** — when she said 85% close, did 85% close? Plus deal-type hit rate, spread realization rate, calendar discipline (% exited at or near close).
- **Quinn — fleet metrics**: per-strategy Sharpe with confidence intervals, Sharpe-decay trend, half-life of alpha, **research-velocity metrics** (strategies promoted per quarter, hit rate of promoted strategies after 6/12 months).
- **Diego — CLV (closing line value)** — truest sports edge metric; P/L can be noise, CLV is signal. Plus ROI per stake, yield by sport / league / strategy.
- **Aria — Brier score (calibration)** — **the most important post-trade metric** for a prediction-market trader. Plus ROI per stake, hit rate by confidence tier, yield by cluster.
- **David — firm-wide Sharpe and capital efficiency**: Sharpe per $ allocated by trader, marginal Sharpe, capital reallocation history with outcomes.
- **Elena — institutional metrics**: annualized return, vol, Sharpe, Sortino, max DD, current DD, time underwater, worst month, up/down-capture vs benchmark, hit rate of positive months, correlation to her other holdings.

#### Slicing

Every metric should be computable across every attribution axis (see #22):

- Per strategy / theme / deal / cluster.
- Per instrument / underlying.
- Per venue.
- Per regime.
- Per time-of-day / session.
- Per holding period.
- Per catalyst type.
- Per confidence tier (Aria's high / medium / speculative).

Multi-axis slicing required: "Sharpe for my BTC funding-arb trades during high-vol regimes in Asia session" should be one query.

#### Design principles

- **Mathematically correct.** The Sharpe formula choice matters (excess return vs simple return; assumed risk-free rate). Documented. Auditable.
- **Sample-size honest.** Flag when a slice has too few observations to draw conclusions. Don't show a "60% win rate" computed from 5 trades.
- **Regime-aware.** A great Sharpe in 2017 doesn't mean great in 2018. Show metrics by regime, with current regime highlighted.
- **Benchmark-relative.** Absolute metrics matter; relative-to-benchmark matters more.
- **Drift detection.** Sharpe over time, with confidence bands. Significant drift → review.
- **Cross-trader at firm level.** David sees the same metrics across all traders.
- **Tied to compensation.** Comp is computed from these numbers; the platform is the source of truth.

#### Archetype detail

- **Marcus** — Sharpe / Sortino / Calmar / drawdown, sliced by strategy / regime. Hit rate by trade type. See [marcus](trader-archetype-marcus-cefi.md).
- **Julius** — Net APY of yield strategies (gross APY minus IL minus gas minus slippage), effective $/point for points strategies, bridge round-trip cost by route, MEV cost realized, smart-contract uptime. See [julius](trader-archetype-julius-hybrid.md).
- **Mira** — fill-level distributions (not point estimates). See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — Sharpe / Sortino on vol P/L; max drawdown decomposed into vol move vs gamma vs hedging. **Win rate by structure type.** See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — Sharpe / Sortino / Calmar; hit rate by strategy (directional / pair / event); avg win vs avg loss by strategy; holding-period analysis; **sector skill** (Sharpe by sector). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — Sharpe / Sortino / Calmar; hit rate by trade type; DV01-adjusted return; information ratio vs benchmark; carry capture. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — Sharpe / Sortino / Calmar; theme batting average; conviction calibration; average winning theme size vs average losing. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — Sharpe / Sortino / Calmar; **currency hit rate** (per-currency win rate); carry capture; vol-adjusted return per currency. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — Sharpe / Sortino / Calmar; hit rate by trade type and event type; DV01-equivalent return; carry capture (earned roll yield). See [theo](trader-archetype-theo-energy.md).
- **Naomi** — Sharpe / Sortino / Calmar; **hit rate by deal type**; avg deal won vs avg deal lost; spread realization rate; **calendar discipline**; **probability calibration (Brier score)**. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn** — per-strategy Sharpe with confidence intervals; backtest-vs-live divergence; research velocity metrics. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — **ROI per stake** (turnover-based); yield by sport / league / strategy; **CLV trend over time as primary signal**. See [diego](trader-archetype-diego-live-event.md).
- **Aria** — ROI per stake; Sharpe of daily mark-to-market; hit rate by confidence tier; **yield by cluster**; **Brier score over time**. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide aggregation**: Sharpe per trader, capital efficiency (Sharpe per $ allocated), counterfactual ("what if we'd allocated differently?"). See [david](trader-archetype-david-pm-risk.md).
- **Elena** — full institutional package; vs benchmarks contractually agreed; vs peer median; vs her own portfolio of managers. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. The metrics library is shared; the surfaced subset varies per archetype.

---

### 24. Equity Curve

#### What it is

A line chart of cumulative P/L over time, with drawdown shading underneath. The most-glanced post-trade visual; the trader's career compressed into one image. Variants exist for intraday (live, in the live PnL panel) and historical (multi-year, in the Learn-phase workspace).

#### Why it matters

The equity curve is the **gut-check picture**. Numbers (Sharpe, drawdown, hit rate) are precise but abstract; the curve is visceral. A trader looking at their equity curve sees the texture of their career — the runs, the choppy stretches, the drawdowns, the recovery patterns. It's what the trader shows their PM, what the PM shows the risk committee, what gets sent to allocators. **A great trader's equity curve looks different from an average trader's curve, even before you read the numbers.**

#### Standard shape

- **Cumulative P/L line** — from inception or selectable start date.
- **Drawdown shading underneath** — area chart of (peak – current) / peak, in red.
- **Time-window selector** — 1m / 3m / 6m / 1y / 5y / ITD / custom.
- **Benchmark overlay** — one or multiple benchmarks plotted on the same axes.
- **Rolling-Sharpe sparkline** — separate small chart underneath, showing rolling 30/60/90-day Sharpe over the same window.
- **Drawdown table** — every drawdown (start, end, depth, duration), sortable.
- **Annotations** — vertical markers for major events (firm-wide regime shifts, fund launches / closures, key personnel changes, drawdown root causes).
- **Underlying-attribution mode** — toggle to see equity curve decomposed by axis (e.g. cumulative P/L stacked by strategy / sector / theme).
- **Exportable image** — for inclusion in reports / letters.

#### Benchmarks per archetype

The benchmark choice differs:

- **Marcus, Julius** — BTC buy-and-hold; ETH buy-and-hold; perp funding-only; peer crypto-fund median; custom multi-asset index.
- **Mira** — own-vs-naive-spread benchmark (what would we have earned by quoting at fair vs my actual quotes); volume-adjusted benchmark for capacity context.
- **Sasha** — VRP harvest baseline (what a passive vol-selling strategy would have earned); peer vol-trader median; index put / call writing benchmarks.
- **Henry** — XLK or sector-relevant ETF; SPX; peer fund median; long-short factor index.
- **Ingrid** — Bloomberg Treasury Index; rates carry baseline; peer rates-trader median.
- **Rafael** — multi-asset 60/40 baseline; macro hedge fund peer median (HFRI); cross-asset risk parity.
- **Yuki** — DBV-style FX carry baseline; G10 carry index; peer FX-trader median.
- **Theo** — front-month Brent buy-and-hold; energy index (S&P GSCI Energy); peer energy-trader median.
- **Naomi** — IBOXX merger arb index; HFRI Event-Driven Index; risk-free rate (event premium target).
- **Quinn** — per-strategy backtest expectation distribution; aggregate fleet vs CTA index.
- **Diego** — flat (zero) — sports trading is absolute-return; CLV proxy for skill measurement.
- **Aria** — flat (zero); peer prediction-market-trader median where available.
- **David** — firm-wide vs HFRI Composite; vs custom benchmark per share class.
- **Elena** — what the firm contractually committed to: BTC buy-and-hold or BTC perp funding-only or custom index or peer median.

#### Design principles

- **Honest about drawdowns.** Drawdown shading is mandatory; an equity curve without drawdown context is misleading.
- **Period-comparable.** Same time window, same baseline, period-over-period.
- **Annotated where useful.** Major regime shifts, fund events, drawdown root causes annotated.
- **Decomposable.** Toggle to see what's driving the curve at any segment.
- **Print-ready.** Reports and client letters need clean, exportable versions.
- **Real-time during the day.** Intraday version is live (in the live PnL panel); EOD freezes the day's bar.
- **Truthful inception.** Start date matters; cherry-picking start dates is a known dishonest practice; the platform shows full ITD by default.

#### Archetype-specific extensions

- **Marcus, Julius** — equity curve with drawdown; rolling Sharpe; benchmark overlays. See [marcus](trader-archetype-marcus-cefi.md), [julius](trader-archetype-julius-hybrid.md).
- **Mira** — bps-curve (cumulative bps captured) more meaningful than $-curve; volume-normalized so capacity changes don't distort. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — equity curve with **VRP harvest baseline overlay**; rolling Sharpe; tail-event annotations. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — equity curve vs sector ETF + SPX, with earnings-season shading. See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — equity curve vs Bloomberg Treasury Index, with FOMC / auction event markers. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — equity curve with **theme attribution** (which theme drove which segment); peer macro-fund overlay. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — equity curve vs G10 carry index; session attribution. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — equity curve vs front-month Brent; seasonal-cycle annotations. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — equity curve vs IBOXX merger arb; deal-outcome-attributed segments. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — fleet equity curve**: per-strategy curves available; aggregate curve with strategy attribution segmentation. **Backtest vs live overlay** for active strategies (does live track the backtest expectation?). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego** — equity curve with CLV trend overlay; per-sport curves available. See [diego](trader-archetype-diego-live-event.md).
- **Aria — unified book equity** with **shading to indicate domain composition** (CeFi vs DeFi share of capital); calibration trend overlay. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide equity curve**, decomposed by trader / strategy. **Compared against firm-mandated benchmark** + peer (HFRI). See [david](trader-archetype-david-pm-risk.md).
- **Elena — fund-level equity curve since inception**, net of fees, vs benchmark she or the firm chose. **Print-ready PDF** for board meetings. See [elena](trader-archetype-elena-external-client.md).

#### Used by

All 15. Universal — and one of the few surfaces that is genuinely identical in shape across archetypes (the data and benchmark differ; the chart looks the same).

---

### 25. Execution Quality / TCA (Transaction Cost Analysis)

#### What it is

A post-trade analytic surface that measures how well the trader's execution compared to benchmarks (arrival price, VWAP, midpoint, theoretical fair). Decomposes execution cost into impact, spread, fees, MEV, gas, bridge cost, slippage. Identifies leakage — money lost to suboptimal execution that could be recovered through better algos / venue choice / timing.

#### Why it matters

For a trader executing $1B+ of notional per year, **5–20 bps of execution cost = $500k–$2M per year**. TCA is how that money is found and saved. Senior PMs will fire trading desks that can't articulate their execution quality vs market benchmarks. For market-makers (Mira), this analysis is the core of edge measurement. For Henry's equity desk, broker scorecards directly drive future flow. For Julius, MEV cost analysis can recover bps lost to sandwich attacks.

#### Standard shape

- **Per parent order** — arrival price, VWAP during execution, average fill, slippage vs arrival (in $ and bps), slippage vs VWAP, % of ADV.
- **Decomposed cost** — spread paid, market impact, timing cost (price drift while waiting), fees / rebates, gas (DeFi), bridge fees (DeFi), borrow cost (shorts), MEV cost (DeFi).
- **By algo** — VWAP performance vs benchmark by algo type, by parameter profile.
- **By venue / LP / counterparty** — venue scorecard with fill rate, response latency, last-look rejection rate (FX), rebate earned.
- **By size bucket** — small / medium / large / very large; cost typically scales with size.
- **By time-of-day / regime** — execution cost varies; identify when to execute vs defer.
- **Maker vs taker breakdown** — % of fills as maker, fees paid vs rebates earned.
- **Outliers flagged** — fills with unusually bad slippage; replay link to investigate.
- **Aggregate trends** — slippage over time, by trader / strategy / venue.

#### Per-archetype TCA dimensions

The unique value lives in archetype-specific cost components:

- **Marcus, Julius** — slippage vs arrival, vs VWAP, by venue (Binance / Bybit / OKX), by algo. Plus funding-rate timing for perps. See [marcus](trader-archetype-marcus-cefi.md), [julius](trader-archetype-julius-hybrid.md) (multi-domain — see below).
- **Julius — multi-domain TCA**:
  - **CeFi TCA** (Marcus-style).
  - **DeFi TCA**: actual fill vs aggregator quote, MEV experienced, gas paid vs optimal, route taken vs optimal.
  - **Bridge TCA**: realized cost vs quoted, time vs estimate, loss to bridge fee / slippage.
  - **Multi-leg TCA**: for cash-and-carry trades, was the leg execution synchronized? Where did slippage occur?
  - See [julius](trader-archetype-julius-hybrid.md).
- **Mira — execution-quality is the core of her edge measurement**: per-quote analysis (filled vs canceled vs missed), fill rate at top of book, queue position realized vs estimate, **adverse selection by counterparty class**, quote-to-fill latency distribution. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — vol-leg execution: filled IV vs entry IV target, leg synchronization for multi-leg structures, RFQ best-quote frequency by dealer. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry — equity TCA standard**: implementation shortfall per parent, VWAP slippage by algo, dark vs lit fill quality, **broker scorecard** (commission paid, execution quality by broker — drives future flow allocation). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — TCA per trade (fill vs mid at decision time), **dealer scorecard** (RFQ best-quote frequency by dealer), auction primary participation (competitive vs non-competitive bid outcomes), **roll efficiency** (cost of futures rolls vs theoretical). See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — appropriate per-asset-class TCA for each leg of a multi-asset trade. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki — multi-LP TCA**: spot TCA (fill vs mid by venue and LP), **LP scorecard** (fill rate, response latency, last-look rejection rate per LP), forward / NDF TCA (fill vs theoretical = spot + points), block / RFQ TCA, **fixing slippage** (avg vs WMR realized) by fixing window. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — per-trade slippage vs decision-time mid, **roll cost** vs theoretical (calendar-spread mid), block / RFQ best-quote frequency by counterparty. See [theo](trader-archetype-theo-energy.md).
- **Naomi** — leg-by-leg execution tracking; was the cash-and-stock pair leg-synchronized? Where did slippage occur? Borrow availability and recall events tracked. See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — strategy-level TCA**: realized slippage vs assumed in backtest. **Backtest vs live divergence** — strategies tracking expectation vs underperforming. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — CLV is the analog** (closing line value); standard TCA less relevant because most fills are at the top of the ladder. Cross-book arb tracking. See [diego](trader-archetype-diego-live-event.md).
- **Aria — DeFi TCA per market**: fill quality on Polymarket, gas costs, bridging costs, route taken vs optimal. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide TCA aggregation**: per-trader execution quality, per-venue quality across the desk, broker / dealer scorecards aggregated. See [david](trader-archetype-david-pm-risk.md).
- **Elena** — does not see trader-level TCA; sees fund-level fees-paid summary in performance reports. See [elena](trader-archetype-elena-external-client.md).

#### Design principles

- **Multiple benchmarks per parent.** Arrival, VWAP, midpoint, theoretical fair — different benchmarks reveal different inefficiencies.
- **Decomposed costs.** Don't lump all execution cost; split into impact / spread / timing / fees / borrow / MEV / gas / bridge.
- **Outlier-driven investigation.** Surface the worst executions for replay-and-investigate workflow.
- **Venue / counterparty scorecards.** Drive future flow allocation; bad venues lose business.
- **Algo performance over time.** When an algo's slippage drifts up, investigate (overfit parameters, venue change, regime change).
- **Aggregate trends.** Are we getting better or worse over time?
- **Compliance-friendly.** Best-execution mandates require documented TCA; the platform produces it.

#### Used by

Marcus, Julius, Mira, Sasha, Henry, Ingrid, Rafael, Yuki, Theo, Naomi, Quinn (indirect), Aria. Diego's analog is CLV. David sees firm-wide rollup. Elena sees fee summary only.

---

### 26. Behavioral Analytics

#### What it is

A surface that detects patterns in the trader's own behavior — overtrading, revenge-trading, position-sizing drift, hold-time drift, conviction inflation, drawdown-response patterns, time-in-position distribution. Surfaces tendencies the trader can't see in themselves day-to-day. David sees this aggregated across traders for behavioral health monitoring at firm level.

#### Why it matters

Most traders blow up not because their thesis is wrong but because their _behavior_ drifts under stress. After a loss: revenge-trading. After a win: overconfidence and oversizing. During a drawdown: revenge-adding to losers, refusing to cut. During a hot streak: drift away from process. Behavioral analytics is the surface that catches these patterns _while they're happening_, before they cost millions. **The single highest-leverage non-market analytic in the platform.**

#### Standard behavioral indicators

- **Overtrading** — trade frequency per day exceeding rolling baseline by 2σ; often a tilt indicator.
- **Position-sizing drift** — sudden increase in average position size, especially after a loss.
- **Hold-time drift** — shorter holds than baseline (revenge / impatience) or longer holds (anchored to losers).
- **Loss-cutting discipline** — % of trades that hit pre-defined stop vs got moved or removed.
- **Strategy-tag distribution shift** — trader drifting from stated mandate (Henry: tech-only mandate but suddenly trading energy?).
- **Conviction inflation** — Rafael's stated conviction rises too quickly with confirming evidence.
- **Recency bias** — over-weighting recent observations (recent polls / news / fills).
- **Revenge-trade detection** — large size shortly after a loss.
- **Drawdown response** — does the trader add to losers in drawdown?
- **Time-in-position distribution** — distribution healthy or skewed?
- **Time-of-day fatigue** — late-night decisions worse than morning?
- **Calendar discipline** — held through the catalyst as planned, or pre-empted?
- **Risk-cutting discipline** — % of trades exited at or near pre-defined stop.

#### Per-archetype behavioral indicators

- **Marcus, Julius** — overtrading, position-sizing drift, hold-time drift, drawdown-response.
- **Julius — DeFi-specific**:
  - **Approval hygiene** — ratio of limited vs infinite approvals; frequency of revocations.
  - **Wallet hygiene** — over-concentration in a single hot wallet.
  - **Bridge / route diversification** — over-reliance on one bridge or RPC?
- **Mira** — parameter-tweak frequency (over-tweaking the engine = tilt indicator), session-end discipline, queue-position-target adherence.
- **Sasha — vol-trader-specific**: gamma-scalping discipline (over- or under-hedging?), structure-discipline (entered planned structures or improvised?), event-discipline (held through earnings as planned?).
- **Henry — equity-specific**: position-sizing consistency (sized by conviction or by recent P/L?), drawdown response (revenge-adding to losers?), catalyst hold-through rate (sat through earnings or trimmed before?). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid — rates-specific**: inventory-week discipline (held through release or exited?), forecast trust (over- or under-reacted to forecast updates?), geopolitical reaction (chased the news or faded it?). See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael — macro-specific**: **conviction inflation** (does conviction rise too quickly with confirming evidence?), **theme abandonment patterns** (cuts losing themes too fast or too slow?), position-sizing consistency (size by conviction or by recent P/L?), time-to-acknowledge-error (how long after invalidation does he close?). See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki — FX-specific**: session bias (do I make money in some sessions and lose in others?), carry-trade discipline (cut on time when funding cost rose?), fixing discipline (trade _the_ fixing or _around_ it?). See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — inventory-week discipline, weather-forecast trust, geopolitical reaction. See [theo](trader-archetype-theo-energy.md).
- **Naomi — event-driven-specific**: entry timing (too early, too late?), exit timing (held to close or cashed out early?), probability anchoring (does her estimate move with market spread, a circularity warning?). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — strategy-discipline**: over-intervention pattern (manual overrides spiking = discipline drift), promotion pace (too fast / too slow). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — sports-specific**: **tilt indicators** (increased stake size after losses, chasing), strategy drift (deviating from template into discretion), **time-of-day fatigue** (late-night decisions worse than morning?), **sport bleed** (lose more in sports I love than ones I don't follow?). See [diego](trader-archetype-diego-live-event.md).
- **Aria — prediction-specific**: conviction inflation, recency bias, **over-trading thin markets** (chasing signal in low-liquidity markets where slippage eats edge), resolution-window discipline (trim before resolution or hold to settle?). See [aria](trader-archetype-aria-prediction-markets.md).
- **David — cross-trader behavioral monitoring (foveal)**: per-trader behavioral health badge with overtrading / sizing-drift / hold-time-drift / loss-cutting discipline / strategy-tag drift indicators. **David watches for trader behavioral drift** — sustained drift triggers an interventions conversation. See [david](trader-archetype-david-pm-risk.md).
- **Elena — does not see behavioral analytics on traders.** May see fund-level _strategy_ discipline indicators (style consistency) per agreement. See [elena](trader-archetype-elena-external-client.md).

#### Design principles

- **Pattern detection, not punishment.** The platform surfaces patterns; it doesn't shame the trader. The trader's job is to use the data.
- **Compared against baseline.** "Position size 2σ above your rolling baseline" — the comparison is always to the trader's own historical pattern, not absolute.
- **Configurable severity.** Some patterns are warnings; some are actionable. Trader configures (and David configures at firm level).
- **Drill-down to evidence.** Click a flag → see the trades that triggered it, with replay link.
- **Aggregated at firm level (David).** David sees the desk's behavioral state — not for surveillance, but for early-warning. Behavioral drift on the desk is a leading indicator of P/L drawdown.
- **Time-window selectable.** Behavioral patterns over today / week / month / quarter — different windows reveal different drifts.
- **Privacy-respecting at trader level.** A trader's behavioral data is theirs first; David sees aggregated flags, not raw activity.

#### Used by

All 15 traders + David. **Most valuable for high-frequency or high-stress archetypes** (Marcus, Julius, Mira, Diego). **Most novel for archetypes with subjective inputs** (Rafael — conviction calibration; Aria — confidence calibration; Naomi — probability anchoring). David's firm-wide rollup is critical infrastructure for managing the desk.

---

### 27. Reports

#### What it is

A reporting engine that generates structured deliverables — daily P/L commentary, weekly portfolio review, monthly attribution, quarterly committee letter, regulatory / compliance filings, client letters, audit packages — all from the same data plane that runs the desk. Multi-format (PDF, Excel, CSV, HTML, email), schedulable, version-controlled, branded.

#### Why it matters

Reporting is the **output layer** of the trading firm. Investors, regulators, auditors, the board, and the trader's own committees consume reports rather than the live terminal. Bad reporting kills trust: late, inconsistent, error-laden reports lose clients (Elena explicitly says wrong numbers in a client report are a fireable offense). Good reporting is automated, auditable, and beautiful — so the firm can produce institutional-grade output without requiring a team of analysts to assemble it manually each month.

#### Standard shape

Reports fall into three classes:

**1. Internal trader-facing reports**

- Daily P/L commentary (trader writes; pre-populated from data).
- Weekly portfolio review (positions, P/L, attribution, risk consumed, commentary).
- Monthly performance attribution package.
- Strategy retrospectives (Quinn).
- Theme retrospectives (Rafael).
- Deal closeouts (Naomi).

**2. Internal management reports**

- Per-trader weekly/monthly review (compensation context, mandate adherence, behavioral indicators).
- Risk committee deck (David's primary deliverable — pre-prepped weekly/monthly).
- Capital allocation / capacity review (David).
- Strategy promote / retire decisions with rationale.

**3. External reports**

- Client letters (Elena's monthly statement, quarterly letter).
- Tax documents (K-1, 1099, international equivalents).
- Compliance filings (Form PF, AIFMD, 13F, 13D/G, regulatory position reports).
- Auditor packages.
- Board / risk-committee deliverables.
- Regulator-on-request (audit trail, position reports).

#### Standard features

- **Templated** — every report type has a versioned template; trader / firm customizes within the template.
- **Auto-populated** — data from the platform fills the template; the writer adds narrative.
- **Multi-format export** — PDF (clean, branded, suitable for forwarding), Excel / CSV (for ingestion into other systems), HTML (interactive web view), email digest (scheduled).
- **Schedulable** — daily / weekly / monthly / quarterly automated generation.
- **Version-controlled** — reports are versioned; corrections are amendments, not edits.
- **Audit trail** — every generated report logged with timestamp, recipient, and content hash.
- **Reproducibility** — any historical report can be re-rendered from the same source data; useful for regulator review or correction.
- **Custom reports on-demand** — trader builds an ad-hoc report; can save as a template.
- **Cross-trader / firm aggregation** — David's reports aggregate across the desk.
- **Compliance-grade retention** — typically 7+ years; non-modifiable archive.

#### Per-archetype reports

- **Marcus, Julius** — daily P/L commentary, weekly portfolio review, monthly attribution by strategy / venue / underlying. See [marcus](trader-archetype-marcus-cefi.md), [julius](trader-archetype-julius-hybrid.md).
- **Mira** — daily edge / fill / inventory report, weekly venue scorecard, monthly toxic-flow review. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — daily greek + P/L decomposition report, weekly structure performance review, monthly vol model calibration review. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry** — daily P/L commentary, weekly portfolio review, monthly performance attribution package, quarterly investor / committee letter contribution, regulatory filings (13F, 13G/D, Form PF inputs). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — daily P/L commentary, weekly portfolio / curve-positioning review, monthly performance attribution (carry, roll, yield, curve, basis), quarterly investor / committee letter contribution, compliance / regulatory filings. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — daily commentary (light, theme-level), weekly portfolio review, monthly attribution by theme & asset class, quarterly investor / committee letter (Rafael's voice, theme narratives), compliance / regulatory filings (Form PF, AIFMD as applicable). See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — daily P/L commentary, weekly portfolio review, monthly attribution by currency / pair / session / event, quarterly investor / committee letter contribution, compliance / regulatory filings. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — daily P/L commentary (especially around inventory days), weekly portfolio review, monthly attribution by product / spread / event, quarterly investor / committee letter contribution, compliance / regulatory filings (CFTC large trader reports, position limits). See [theo](trader-archetype-theo-energy.md).
- **Naomi** — daily P/L commentary (deal-tagged), weekly portfolio review, monthly attribution by deal type / sector / outcome, quarterly investor / committee letter contribution (event-driven storytelling), compliance / regulatory filings (13F, 13D/G, Schedule TO). See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — strategy reports**: weekly fleet review for risk committee, monthly performance and capacity report, strategy retire / promote decisions with rationale, research pipeline status. See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — sports reports**: daily P/L commentary (sport-tagged), weekly portfolio review, monthly attribution by sport / strategy / venue / CLV, account-management reports (book-by-book health). See [diego](trader-archetype-diego-live-event.md).
- **Aria** — daily P/L commentary (cluster-tagged), weekly portfolio review, monthly attribution by cluster / venue / edge-source, quarterly investor / committee letter (theme + cluster narratives), compliance per venue / jurisdiction. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — risk-committee deck auto-prep** is critical infrastructure: weekly / monthly committee deck auto-prepared (firm performance, risk consumed, limit breaches, concentration evolution, stress scenarios, trader/strategy lifecycle changes, forward-looking risks). Plus daily commentary and monthly comprehensive reports. See [david](trader-archetype-david-pm-risk.md).
- **Elena — multi-modal report delivery is THE product**: web (interactive), PDF (clean, branded for forwarding), Excel/CSV (for her systems), email digest (scheduled). **Daily NAV / position summary** (where contractually entitled), weekly performance update, **monthly full report** (performance, risk, attribution, exposures, narrative), **quarterly letter** (long-form, board-suitable), **annual report** (audited financials, full disclosures), **custom reports** on request with SLA. **Tax documents** (K-1, 1099, international). See [elena](trader-archetype-elena-external-client.md).

#### Design principles

- **One source of truth.** Reports are generated from the same data plane that runs the desk; no parallel "reporting database" with different numbers.
- **Templated + customizable.** Common templates per report type, customizable per firm / trader / share class.
- **Beautiful by default.** Print-ready PDF, branded, suitable for forwarding to a board without modification.
- **Auto-populated, narrated by humans.** Data fills the template; the trader writes the _why_. Combined: institutional-grade.
- **Schedulable + on-demand.** Auto-generate on schedule; trigger off-schedule when needed.
- **Audit + version control.** Every generated report archived; historical reports re-renderable from source.
- **Multi-format.** PDF / Excel / CSV / HTML / email; the consumer's preference dictates.
- **Compliance-aware.** Retention requirements satisfied; access-controls enforced.
- **Cross-firm aggregation (David).** Same templates, aggregated across desk.

#### Used by

All 15 + Elena. The reporting engine is critical platform infrastructure that nearly every persona consumes from in different forms.

---

### 28. Compliance & Audit Trail

#### What it is

The infrastructure that enforces regulatory and policy constraints inline at the moment of action — restricted lists, position thresholds, locate availability for shorts, jurisdictional access, information barriers (when firm has MNPI on a deal), tender offer rules, sanctions screening — and records every action with full audit trail (timestamp, reason, actor, authorization chain). The boring, high-stakes layer that keeps the firm legal.

#### Why it matters

Compliance failures kill firms. Insider-trading violations end careers. Sanctions violations bring criminal charges. Position-limit breaches at scale trigger regulatory scrutiny. Lost audit trail in a litigation discovery is fatal. **The platform's job is to make compliance frictionless inline (no manual steps the trader can skip) and to record everything immutably.** Every senior firm spends millions per year on compliance; the platform earns its keep by automating the repetitive parts and surfacing the judgment-call parts to humans.

#### Standard shape

**Inline pre-trade compliance** — checks integrated into the order ticket:

- **Restricted list** — when the firm has material non-public information on a name, that name is auto-blocked (Naomi's information-barrier scenario). When firm-wide news / research is in a quiet period, blocked.
- **Position thresholds** — approaching 5% / 10% / 13D / 13G ownership; approaching reportable threshold; approaching firm policy limit.
- **Locate / borrow availability** — for short sales, locate must be confirmed before submission. Hard-to-borrow flag inline.
- **Jurisdictional access** — venue accessible from current trader location?
- **Sanctions screening** — counterparty / underlying not on OFAC / EU / UK sanctions lists.
- **Tender offer rules** — Reg 14E timing, tender vs don't-tender deadlines.
- **Best-execution mandates** — venue choice, RFQ documentation.
- **Suitability** — for client-facing, the trade is suitable for the client mandate.
- **Wall-crossing** — trader has pre-cleared to be on the wrong side of an info wall.

**Audit trail** — for every action:

- Timestamp (microsecond).
- Actor (trader, strategy, override-er).
- Action (order submitted, order modified, order canceled, position closed, capital allocated, limit changed, etc.).
- Reason (free-text or selected from menu).
- Authorization chain (who approved if approval required).
- Pre / post state.
- Linked entities (strategy / deal / theme / parent).
- Immutable storage (append-only, cryptographically hashed for tamper evidence).
- Retention (typically 7+ years for licensed traders; permanent for some categories).

**Compliance reporting**:

- Position reports for regulators (per market: 13F, Form PF, AIFMD, CFTC large trader, MIFID transaction reporting, etc.).
- Trade audit trail on demand (litigation, regulator request).
- AML / KYC trade-monitoring summaries (Henry, Naomi, David).
- Broker / dealer quote retention (best-execution evidence).
- Communications retention (Bloomberg Chat / Symphony archived per regulation).

#### Per-archetype compliance dimensions

- **Marcus, Julius** — KYC / AML on counterparties (less restrictive in crypto historically; tightening), sanctions screening, position-limit reporting on regulated venues. See [marcus](trader-archetype-marcus-cefi.md), [julius](trader-archetype-julius-hybrid.md).
- **Julius — additionally**: protocol-side KYC awareness (some DeFi protocols enforce; most don't), wallet-screening for sanctions / mixer history, cross-jurisdictional access (some venues restrict by IP).
- **Mira** — venue-specific position limits, market-making exemptions where applicable, quote-stuffing prevention rules, manipulation-detection compliance. See [mira](trader-archetype-mira-market-maker.md).
- **Sasha** — options-specific (large position reporting, exercise / assignment rules), block-trade reporting, RFQ documentation. See [sasha](trader-archetype-sasha-options-vol.md).
- **Henry — equity compliance is heavy**: restricted lists (when firm has MNPI), 13F filing thresholds, 13D/G ownership thresholds, locate / borrow for shorts (Reg SHO), Reg M during deals, tender offer rules, insider trading prevention (automated checks against firm's research / advisory side). See [henry](trader-archetype-henry-equity-long-short.md).
- **Ingrid** — primary-dealer reporting (NY Fed), CFTC large trader, MIFID transaction reporting (EU rates), repo / financing reporting. See [ingrid](trader-archetype-ingrid-rates.md).
- **Rafael** — multi-jurisdiction reporting per asset class involved; AIFMD if EU-resident; Form PF if US. See [rafael](trader-archetype-rafael-global-macro.md).
- **Yuki** — FX-specific compliance (CFTC / FINRA for retail-FX, MIFID II for EU bank counterparties), sanctions screening (heavy for EM currencies), capital-controls awareness per country. See [yuki](trader-archetype-yuki-fx.md).
- **Theo** — CFTC large trader reports, position limits (especially around delivery month), CFTC speculative limits, EPA / energy regulator reporting. See [theo](trader-archetype-theo-energy.md).
- **Naomi — event-driven compliance is the heaviest in the floor**: **restricted lists** (when firm has MNPI on a deal, name auto-blocked), **information barriers** (Naomi's access scoped per side of the wall), tender offer rules (Reg 14E), 13D/G filing thresholds (5%, 10%), insider trading prevention (automated checks against firm's research / advisory side). **Compliance is non-bypassable for hard blocks.** See [naomi](trader-archetype-naomi-event-driven.md).
- **Quinn — strategy-level compliance**: every deployed strategy passes a compliance review at promotion (does it generate prohibited transactions? trigger restricted-list violations? exceed position limits?). See [quinn](trader-archetype-quinn-quant-overseer.md).
- **Diego — sports compliance is fragmented**: gambling regulation per jurisdiction, AML on sportsbooks, account-management awareness (sportsbooks restrict winners — operational not legal but tracked). See [diego](trader-archetype-diego-live-event.md).
- **Aria — prediction-markets compliance is in flux**: Polymarket on-chain has minimal compliance enforcement; Kalshi is CFTC-regulated and has full position limits + KYC; some markets are gray-area in some jurisdictions. **Geo / KYC checks** at venue access. See [aria](trader-archetype-aria-prediction-markets.md).
- **David — firm-wide compliance is foveal**: **every change he makes is timestamped, reasoned, signed**. Every authorization (capital allocation, limit changes, promotions, overrides) audited. **Audit trails are non-negotiable.** Every change is timestamped, reasoned, signed. **Multi-key firm-wide kill switch** for catastrophic events requires multiple humans to authorize. See [david](trader-archetype-david-pm-risk.md).
- **Elena — client-facing compliance**: tiered access controls (only her data, scoped to her agreement), document vault (every statement, K-1, 1099, sub-agreement, NDA, audit confirmation; **retained forever**), audit trail of her own actions (every subscription, redemption, switch, document uploaded — with date, amount, status), regulatory disclosures (Form PF copies, AIFMD as applicable), tax documents (K-1 / 1099 / international equivalents). See [elena](trader-archetype-elena-external-client.md).

#### Design principles

- **Inline, not a separate workflow.** Compliance checks happen _in the ticket_, not as a separate step the trader can skip.
- **Hard blocks vs soft warnings.** Some constraints are absolute (sanctions, MNPI, jurisdiction); soft warnings are acknowledgeable with reason.
- **Audit trail is immutable.** Append-only, cryptographically hashed, retention-guaranteed. Edits are amendments.
- **Compliance is non-bypassable.** Workarounds are anti-patterns; the platform must not have a "skip compliance" toggle.
- **Multi-jurisdiction aware.** A trader licensed in multiple jurisdictions has overlapping compliance regimes; the platform respects all.
- **Reports auto-generated.** Regulatory filings produced from the same data plane; no manual reconstruction.
- **Information barriers enforced.** When the firm is on both sides of a deal, walls are real and audited.
- **Cross-firm aggregation (David).** Compliance posture across the desk visible to David and the chief compliance officer.

#### Used by

All 15. **Mandatory in every archetype's order ticket and every action.** The shape is shared; the specific rules differ per archetype's market regulator(s).

---

### 29. Strategy Tagging Framework

#### What it is

The mandatory metadata layer that attaches every order at submission to a parent context — strategy / theme / deal / pair / cluster / event / parent trade. Auto-suggested from focus context; overridable with reason; carried through fills, positions, journal, P/L attribution, performance metrics, reports. The connective tissue of Phase 4 (Learn).

#### Why it matters

Without strategy tagging, post-trade attribution is unreliable: you can compute total P/L but you can't answer "where does my edge come from?" Retroactive tagging is unreliable (memory-dependent, easy to fabricate); the platform must enforce **tag-at-submission** as a non-negotiable. Across nearly every archetype doc, the cross-cutting principles list "first-class tagging at order time" because **it's the difference between data and noise.**

#### Standard shape

- **Tag taxonomy per archetype** — strategy ID (Marcus, Mira, Quinn), theme ID (Rafael), deal ID (Naomi), cluster ID (Aria), event ID (Diego), pair / basket ID (Henry), parent trade ID (universal for multi-leg).
- **Mandatory at submission** — order ticket cannot submit without a tag (or "override-untagged" reason logged).
- **Auto-suggested from context** — if focus is on a chart for instrument X, and Marcus has an active strategy "BTC funding harvest" on instrument X, the tag auto-fills.
- **Hierarchical tags** — strategy → sub-strategy; theme → sub-theme; deal → leg-type. Tags can have hierarchy.
- **Free-text + structured combination** — structured tags for analytics; free-text notes optional.
- **Tag-on-existing-position** — open a new leg on an existing position auto-tags to the same parent.
- **Tag-modification audit** — changing a tag is audited; rare and reasoned.
- **Search / filter by tag** — every Phase 4 surface filters by tag.
- **Tag taxonomy maintenance** — taxonomy evolves; old tags preserved; deprecation flags supported.

#### Per-archetype tag types

- **Marcus, Julius** — strategy tag (directional / basis arb / funding harvest / cash-and-carry / vol short / calendar / etc.).
- **Julius — additionally**: domain tag (CeFi / DeFi / hybrid), parent multi-leg trade ID for cross-domain trades.
- **Mira** — strategy tag = parameter profile in use (per-instrument-per-venue-per-mode). Quotes inherit from parameter profile.
- **Sasha** — structure ID (each multi-leg structure is a tagged entity); strategy tag (short premium / long gamma / calendar / skew / dispersion).
- **Henry** — strategy tag (directional / pair / event-driven), pair / basket parent ID, sector tag, catalyst tag (was this catalyst-driven?).
- **Ingrid** — trade type tag (outright / curve / butterfly / basis), parent trade ID (curve trade legs share parent), tenor bucket tag.
- **Rafael — theme ID is the spine**; every order tagged at entry to a theme ID. Plus expression-type tag (outright / spread / option / basket).
- **Yuki** — strategy tag (directional / carry / fixing flow / event / vol), pair tag, fixing flag (was this fixing-targeted?).
- **Theo** — trade type tag (outright / calendar / location / crack), event tag (inventory / OPEC / weather / geopolitical), product / contract month.
- **Naomi — deal ID is the spine**; every position tagged to a deal at submission. Plus leg-type tag (target / acquirer / hedge / capital structure).
- **Quinn — strategy ID + model version** are the dominant tags. Every order from a strategy carries strategy ID + model version + feature snapshot hash.
- **Diego** — event ID + market type + side (back / lay) + strategy template tag (lay-the-draw / scalp / etc.).
- **Aria** — market ID + cluster ID + venue + edge-source tag (model / polling / expert / structural / arb) + confidence tier.
- **David** — interventions tagged with reason and authorization chain.
- **Elena** — capital movements tagged with type (subscription / redemption / switch) and effective date.

#### Design principles

- **Mandatory at submission, not retroactive.** A platform that lets traders tag retroactively is a platform with unreliable attribution.
- **Auto-suggest aggressively.** Friction kills adoption; the platform should fill the tag from context 90% of the time.
- **Override with reason.** When the trader changes the auto-suggested tag, the original suggestion + override reason are audited.
- **Hierarchical and extensible.** New strategies / themes / deals get added; old ones preserved; deprecations marked.
- **Carried through everything.** Tag travels with the order through fills → positions → journal → P/L → metrics → reports.
- **Filterable everywhere.** Every Phase 4 surface filters by tag.
- **Cross-trader at firm level (David).** Tags aggregated firm-wide; David sees per-strategy / per-theme / per-deal P/L across all traders.
- **Versioned taxonomy.** When tag definitions change (e.g. "BTC funding harvest" gets renamed), historical tags preserve original name with current alias.

#### Used by

All 15. Universal. **The single most-important data-quality layer in the platform.**

---

### 30. Customizable Layout & Workspace

#### What it is

The platform's spatial-organization layer: per-user persistent monitor layouts, saveable workspaces, multi-monitor support, mode-switching (e.g. Diego's pre-event vs in-play; Quinn's live vs research; Henry's market-hours vs after-hours). The platform respects the trader's **spatial memory** — once a surface is placed somewhere, it stays there until the trader moves it.

#### Why it matters

Pro traders work across 4–8 monitors with 20+ surfaces simultaneously, and they know exactly where each one is. **Spatial memory is the platform's hidden ergonomic asset.** A trader who has spent two years perfecting their layout has built muscle memory for "PnL is top-right of my middle monitor" — moving it breaks their flow for weeks. The cost is invisible but real. Equally, trying different cognitive modes (focused trading vs research) requires different layouts, and the platform must support fast switching without losing the work-in-flight.

#### Standard shape

- **Multi-monitor support** — natively-aware of multi-monitor configurations (typically 4–8 monitors). Surfaces can span monitors or be confined to one.
- **Per-user persistent layouts** — every surface's position, size, and configuration saved per user, restored on login. Cross-machine sync (laptop ↔ trading desk).
- **Saveable workspaces** — multiple named workspaces per user. One-click swap. Examples: "BTCUSDT focus," "FOMC day," "earnings season," "research mode," "pre-event," "in-play."
- **Mode-switching** — workspaces can be tied to time (Henry's market-hours vs after-hours), event (Diego's pre-event vs in-play), or focus (Marcus's BTC vs ETH).
- **Spatial memory respected** — the platform **never auto-rearranges**. If the trader hasn't moved something, it stays.
- **Drag-and-drop layout editing** — surfaces are draggable, resizable, snap-to-grid optional, layered if needed.
- **High-density display modes** — toggle to hide chrome (axis labels, indicator legends, etc.) for space-efficient display.
- **Crash recovery** — if the platform restarts, the layout returns exactly as it was, with surfaces in their working state where possible.
- **Layout templates** — common layouts ("market-maker default," "options-trader default," "macro-PM default") available as starting points; trader customizes from there.
- **Cross-team layouts (sharable)** — a senior trader's layout can be shared with the desk for new hires.
- **Hot-swappable** — change workspace / layout without losing working orders / state on the surfaces.

#### Mode-switching by archetype

Different archetypes need different mode-switching:

- **Marcus** — instrument focus modes (BTC focus / ETH focus / SOL focus); each loads relevant chart layouts and venue selections.
- **Julius** — domain-mode (CeFi-focused / on-chain-focused / hybrid). On-chain mode shows mempool / pool state / wallet balances foveal; CeFi mode shows order book / funding / basis foveal.
- **Mira** — venue-mode and parameter-profile-mode (different layouts per parameter profile). Plus session-mode (Asia / EU / US session each may want different surfaces).
- **Sasha** — pre-expiry mode (expiry day = pin risk surface foveal), pre-event mode (FOMC = scenario grid foveal).
- **Henry** — earnings-season mode (catalyst tracker foveal), portfolio-review mode (attribution surfaces foveal), market-hours vs after-hours.
- **Ingrid** — auction-day mode (auction surface foveal), FOMC-day mode (CB calendar + curve foveal).
- **Rafael** — per-theme custom dashboards (each theme has its own layout); theme-level mode-switching loads the relevant layout.
- **Yuki** — session mode (Tokyo / London / NY session loads different focus pairs and feeds).
- **Theo** — inventory-day mode (Wednesday = EIA countdown foveal), seasonal-mode (winter natgas vs summer gasoline focus).
- **Naomi** — per-deal layouts (each deal has its own dashboard).
- **Quinn — live vs research mode**: live monitoring layout (fleet dashboard + alerts foveal) vs research workspace (notebook environment + backtest engine foveal). **Cleanly transition between** — work-in-flight (running backtests, open notebooks) preserved across mode swaps.
- **Diego — pre-event vs in-play mode**: pre-event layout (model dashboards + research foveal) vs in-play layout (ladder + video + multi-event grid foveal). **Auto-switch on event start.**
- **Aria** — per-cluster layouts (politics cluster vs economic cluster vs tech cluster — each its own research workspace and feeds).
- **David** — live monitoring (firm-wide aggregate foveal) vs review / planning (capital-allocation + correlation matrix foveal). Plus office-presentation mode for client and risk-committee meetings (large screen, presentation-ready dashboards).
- **Elena — multi-modal device adaptation**: desktop (full performance / risk / docs), tablet (board-meeting mode), mobile (NAV glance + alerts only). The "workspace" is multi-device, not multi-monitor.

#### Design principles

- **Spatial memory respected.** No auto-rearrangement, ever, unless the trader explicitly resets.
- **Persistent across sessions.** Layout is restored exactly as left.
- **Cross-machine sync.** Same trader logging in from a different machine sees the same layout.
- **Mode-switching is fast.** One-click or hotkey; sub-second swap.
- **Work-in-flight preserved.** Switching modes doesn't lose open notebooks, in-progress orders, draft journal entries.
- **Multi-monitor first-class.** Pro traders run 4–8 monitors; the platform must natively support this without quirks.
- **Templates for new users.** Starter layouts per archetype reduce setup friction; trader customizes from there.
- **Crash recovery.** Restart = same state. Always.
- **High-density modes.** Toggle to maximize information per pixel; senior traders want minimal chrome.
- **Cross-firm layout culture.** Senior traders' layouts can be shared / exported as desk-onboarding artifacts.

#### Used by

All 15. Universal. The platform's spatial-organization layer is what makes it usable as a _daily tool_ rather than a one-off application.

---

## Architectural Implications

If the platform builds these 30 surfaces well, with the right abstraction (one ticket framework that adapts mode-by-mode; one risk panel with pluggable axes; one positions blotter with pluggable hierarchies), then **every archetype's terminal is mostly the same platform** with archetype-specific configurations and a smaller set of unique surfaces on top.

This is the product-engineering insight: the floor isn't 15 different products. It's **one platform with 15 personalities**, plus a curated set of unique surfaces per archetype.

For the unique surfaces, see [unique-tools.md](unique-tools.md).
