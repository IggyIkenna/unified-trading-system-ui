# Trader Archetype — Mira Tanaka (Senior Market Maker)

A reference profile of a top-performing market maker at a top-5 firm, used as a yardstick for what an ideal market-making terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For surfaces shared across all archetypes, see [common-tools.md](common-tools.md). For the cross-archetype index of Mira's unique surfaces, see [unique-tools.md](unique-tools.md#mira-tanaka--senior-market-maker).
For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

---

## Who Mira Is

**Name:** Mira Tanaka
**Role:** Senior Market Maker, Crypto Liquidity Desk
**Firm:** Top-5 global trading firm
**Book size:** Quotes on $50M – $200M of two-sided liquidity at any moment; daily turnover in the billions
**Style:** High-frequency, fully systematic with discretionary parameter control
**Primary venues:** Binance, Bybit, OKX, Coinbase, Kraken (spot + perps), Deribit (options), Hyperliquid (on-chain perps)

### How she thinks differently

Mira does **not** take directional risk by intent. She:

- **Quotes both sides** of a market, earning the spread.
- **Manages inventory** — every fill creates an unwanted exposure she wants to lay off.
- **Lives in microstructure** — queue position, latency, adverse selection, toxic flow.
- **Tunes parameters, doesn't pick trades** — she sets quoting widths, skews, sizes, and thresholds; the engine quotes thousands of times per second.

Her edge is **infrastructure + parameter craft**. The trader and the algorithm are tightly coupled — she's a pilot, not a passenger, but she's flying a plane, not steering a car.

### Her cognitive load

Latency is everything. **A 1ms edge is worth real money.** A laggy terminal that delays her perception of state is a direct PnL hit. Everything must be **lossless and real-time**, no buffering, no rounding.

She also fights **adverse selection**: when someone hits her quote, are they an informed trader (bad) or a noise trader (good)? Distinguishing in real time is the core skill.

---

## Physical Setup

**6 monitors**, but with a different emphasis from Marcus or Julius — less analysis, more **state monitoring** and **parameter control**.

| Position      | Surface                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| Top-left      | **Quote engine state** — current quotes, sizes, skews, inventory per instrument           |
| Top-center    | **Multi-venue ladder** — same instrument across all quoted venues, depth + queue position |
| Top-right     | **Inventory + hedging surface** — current inventory, hedge positions, residual risk       |
| Middle-left   | **Microstructure dashboard** — spreads, vol, OI, funding, book imbalance                  |
| Middle-center | **Parameter control panel** — widths, skews, sizes, thresholds, kill levels               |
| Middle-right  | **Adverse-selection monitor** — fill quality, toxic-flow detector, counterparty signals   |
| Bottom row    | **Latency / infra panel + alert console + PnL by instrument**                             |
| Tablet        | Desk chat                                                                                 |

The layout's center of gravity is the quote engine + parameter control. She's flying a system, not making decisions one trade at a time.

---

## Phase 1: Decide

For Mira, "decide" is mostly **parameter selection** for the quote engine, informed by current market state.

### Market regime context

Market makers care intensely about regime because regime changes the **right widths, sizes, and skews**:

- **Vol regime** — realized vol over multiple horizons (1m, 5m, 1h, 1d). Wider quotes when vol is high.
- **Spread regime** — current bid-ask vs historical. Tight markets = tighter quotes warranted.
- **Volume regime** — active or quiet? Flow toxicity tends to be different.
- **Liquidity regime** — depth at top of book, depth at 1% / 5%, recent depth changes.
- **Order book imbalance** — bids vs asks within X bps of mid; signals short-term direction.
- **Lead-lag relationships** — if BTC moves first and the alt follows, Mira's alt-quote needs to lean on BTC ticks.

Charting for Mira leans heavily on the short end. See [Multi-Timeframe Charting](common-tools.md#1-multi-timeframe-charting). **Mira-specific characteristics:**

- Sub-second timeframes (50ms, 100ms, 250ms, 1s) are first-class, not an afterthought.
- Default overlays are book-imbalance ribbon, microprice vs mid, recent fill marks (her own + market), not moving averages.
- Tick-by-tick is the canonical mode; aggregated candles are secondary.

### Microstructure inputs

The unique inputs that drive her parameter choices — see "Unique Surfaces" below for full detail:

- **Queue position estimator** — for each resting order, estimated position in the queue.
- **Tick-imbalance & cancellation-activity feed** — micro-momentum + informed-flight signals.
- **Cross-venue lead-lag indicator** — does Coinbase lead Binance on this name?
- **Aggressive-order arrival rate** — how fast is the market eating liquidity?
- **Trade size distribution** — large prints vs small, signals informed vs retail flow.

### Inventory & hedge context

Before tuning quotes she must see current inventory per instrument, hedge ratios, hedge cost, and funding burn on perp inventory. Detail in the **Inventory & residual-risk surface** below; the canonical multi-axis view is [Risk Panel](common-tools.md#10-risk-panel-multi-axis), but for Mira inventory _is_ the position and gets its own dedicated surface.

### Strategy parameter library

Quote-engine parameters per instrument — base spread, inventory skew, adverse-selection widening, top-of-book size, layered sizing, signal-driven skew, pause thresholds — stored as named profiles she can swap (e.g. "BTCUSDT-quiet", "BTCUSDT-event-window"). Full detail in the **Quote engine parameter library & control panel** below.

### Catalyst awareness

See [Catalyst / Event Calendar](common-tools.md#12-catalyst--event-calendar) and [News &amp; Research Feed](common-tools.md#13-news--research-feed). **Mira-specific characteristics:**

- Calendar entries auto-trigger parameter-profile swaps (e.g. "FOMC-window" widens spreads 5 minutes before release).
- News feed is filtered to venue-impacting events (exchange outages, listing/delisting announcements, depeg signals); macro narrative is downweighted.
- Funding-rate tick events and large-print alerts are treated as catalysts in their own right.

**Layout principle for Decide:** the microstructure dashboard and inventory surface are constant peripherals. The parameter library is what she actively interacts with — she's not picking trades, she's picking _modes_.

---

## Phase 2: Enter

Mira does not "enter trades" in the discretionary sense. Her engine quotes thousands of orders per second. The **enter surface for her is the quote engine control panel + manual hedging tools**.

The canonical [Order Entry Ticket](common-tools.md#2-order-entry-ticket-framework), [Pre-Trade Risk Preview](common-tools.md#3-pre-trade-risk-preview), and [Execution Algos Library](common-tools.md#4-execution-algos-library) apply only to her **manual hedging** workflow — the engine does not use them. **Mira-specific characteristics:**

- The "ticket" she lives in is the **parameter control panel**, not an order form. See unique surfaces below.
- Manual hedging tickets emphasize cross-venue smart routing and aggressive crossing — she's hedging unwanted inventory, not opening discretionary positions.
- Pre-trade risk on hedges checks **inventory delta after hedge** rather than VaR contribution.
- Execution algos used: aggressive-IOC across her hedge venue, cross-venue sweep, and a custom "fastest-out" algo that picks the venue with best liquidity in real time.

### Smart routing for hedges

See [Smart Order Router / Multi-Venue Aggregation](common-tools.md#5-smart-order-router--multi-venue-aggregation). **Mira-specific characteristics:**

- Routing decisions are dominated by **fee/rebate economics + latency-to-venue**, not just price/size.
- Routes favor venues where she is **not the dominant maker** (avoids hedging into her own quotes).
- Routes are evaluated against current rate-limit headroom; near-saturated venues are deprioritized.

### Hotkeys

See [Hotkey System](common-tools.md#6-hotkey-system). **Mira-specific characteristics:**

- Mouse latency is too slow; nearly all common parameter overrides are hotkey-bound.
- Standard bindings: **widen all** (global widening multiplier), **pull all** (cancel quotes on focused instrument), **skew long / short**, **reduce size**, **pause N seconds**, **engine kill** (with foot-pedal backup).
- Hotkeys must be modeless — no "command mode" — and round-trip < 5ms from key press to engine action.

### Pre-deployment shadow mode

Before changing parameters live, she runs them in shadow first. This is a load-bearing surface for her — full detail in the **Pre-deployment shadow mode** unique surface below.

### Kill switches

See [Kill Switches](common-tools.md#19-kill-switches-granular). **Mira-specific characteristics:**

- Three-tier scope is non-negotiable: per-instrument kill, per-venue kill, full **engine kill**.
- Engine kill is **hotkey + mouse + foot pedal** — the foot pedal exists because in a fast unwind her hands are on the keyboard pulling specific instruments and she still needs an instant, no-hands "stop everything."
- Per-venue kill is critical because venue degradation (a Binance API hiccup) can otherwise leak adverse fills for tens of seconds before she'd notice.

**Layout principle for Enter:** the parameter control panel is where her hands live. Hotkeys for the most common adjustments. Shadow mode for anything novel.

---

## Phase 3: Hold / Manage — running the quote engine live

Mira is not "holding a position" the way Marcus is. She's **running a process** that constantly opens and closes positions. The Hold surface is therefore a **live operations console**.

### Per-instrument live state

The canonical [Positions Blotter](common-tools.md#7-positions-blotter) and [Working Orders Blotter](common-tools.md#8-working-orders-blotter) are insufficient for Mira — at any moment she has hundreds of working orders per instrument and inventory rather than discrete positions. **Mira-specific characteristics:**

- The "positions blotter" is replaced by the **Inventory & residual-risk surface** (see unique surfaces).
- The "working orders blotter" is replaced by the **Quote engine state panel** showing the live quote stack with queue positions, layered sizes, and age — a working-orders blotter at quote-engine resolution.
- Recent fills stream as a separate feed; per-fill captured edge in bps shows inline.

### Inventory & hedge view

Detail in the **Inventory & residual-risk surface** unique surface below.

### Adverse-selection / toxic-flow monitor

The most important live surface for Mira. Detail in **Adverse-selection / toxic-flow monitor** unique surface below.

### Microstructure live state

- **Spread / depth / book imbalance** real-time, all venues she quotes.
- **Vol rolling** at multiple horizons.
- **Cross-venue mid divergence** — venue arbitrage opportunity / risk.
- **Lead-lag indicator** — am I quoting downstream of someone faster? See unique surface below.

### Latency & infra panel

See [Latency / Connectivity / Infra Panel](common-tools.md#18-latency--connectivity--infra-panel) for the canonical shape. For Mira, this is upgraded to the **Microsecond-resolution latency panel** — see unique surfaces. **Mira-specific characteristics that live in the unique panel:** RTT distribution (not just mean) per venue, kernel-bypass health, NIC stats, market-data-feed lag, time-since-last-tick staleness alarm, rate-limit headroom, engine queue depth, reject-rate-and-reasons.

### PnL panel — granular

See [Live PnL Panel](common-tools.md#9-live-pnl-panel). **Mira-specific characteristics live in** the **Quote-engine PnL decomposition** unique surface below: spread captured (gross), minus adverse selection, minus hedge cost, minus fees, equals net — each component visible separately so she sees where edge is leaking. Realized today by instrument, by venue, refreshed per-fill.

### Risk

See [Risk Panel (Multi-Axis)](common-tools.md#10-risk-panel-multi-axis) and [Stress / Scenario Panel](common-tools.md#11-stress--scenario-panel). **Mira-specific characteristics:**

- The dominant risk axis is **inventory limit utilization**, not VaR.
- Stress scenarios are short-horizon: "venue goes dark for 30s," "cross-venue mid diverges 50bps," "RTT doubles" — not multi-day macro shocks.
- Scenario PnL is reported as **edge-loss-per-second** during the scenario, since her exposures are mean-reverting on a fast clock.

### Heatmap of own book

See [Heatmap of Own Book](common-tools.md#16-heatmap-of-own-book). **Mira-specific characteristics:**

- Cells are **inventory-by-instrument-by-venue**, not positions-by-strategy.
- Color encodes inventory utilization vs limit; size encodes quote volume.
- Adverse-selection score overlays as a per-cell badge — the heatmap doubles as a toxicity grid.

### Alerts

See [Alerts Engine](common-tools.md#14-alerts-engine). **Mira-specific characteristics:**

- Default alert set: inventory-limit approach, adverse-selection spike, latency degradation, reject-rate spike, cross-venue divergence, quote-engine stall (no quote sent in N seconds), incoming news event, funding-rate change for perp inventory.
- Alerts are **categorized by required reaction speed** — sub-second alarms get sound + flash; ambient alerts join a sidebar log.
- Auto-actions are first-class: many alerts trigger a parameter-profile swap or a pause without human approval (with full audit logging).

### Communications

See [Communications Panel](common-tools.md#17-communications-panel). **Mira-specific characteristics:**

- Tablet-only by choice — she keeps comms off her primary monitors.
- Desk chat is the dominant channel; venue-status announcements (Binance Telegram, exchange status pages) auto-aggregate into a dedicated lane.

### Kill switches

Same hierarchy as Phase 2, plus a **panic auto-flatten** that hits the cheapest venues first. See common-tools link above.

**Layout principle for Hold:** the live operations console is dense. Mira reads it the way a pilot reads a cockpit — peripheral awareness of dozens of indicators, foveal attention only when something amber turns red.

---

## Phase 4: Learn

The most analytics-heavy phase for any market maker. Edge is microscopic per fill; only aggregation reveals truth.

### Fill-level and per-quote analytics

Detail in the **Per-fill realized-edge analysis** unique surface below.

### TCA — market-making style

See [Execution Quality / TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **Mira-specific characteristics:**

- TCA is **per-quote**, not per-parent-order: quotes that filled vs canceled vs missed (lifted by fast traders before her cancel landed).
- Fill rate at top of book — % of time at top, fill rate when there.
- Queue position realized vs estimator's prediction (drives estimator calibration).
- Adverse selection by counterparty class — retail / informed / latency-arb / unclear.
- Quote-to-fill latency distribution — were stale quotes filled? (Hard PnL leak signature.)

### Trade history & blotter

See [Trade History / Blotter (Historical)](common-tools.md#21-trade-history--blotter-historical). **Mira-specific characteristics:**

- Volume is too high for one-row-per-fill browsing; default view is **grouped-by-session-and-instrument** with drill-down to individual fills.
- Each fill row carries: captured edge bps, post-fill drift over 1s/5s/30s, queue-position realized, counterparty proxy, latency-at-quote-send.
- Filter chips include "toxic fills only" (post-fill drift > N bps) and "stale fills only" (quote age > X ms at fill).

### PnL attribution

See [PnL Attribution (Multi-Axis)](common-tools.md#22-pnl-attribution-multi-axis). **Mira-specific characteristics:**

- Primary axes: **edge-component decomposition** (see Quote-engine PnL decomposition unique surface), **per-venue**, **per-instrument**, **per-parameter-profile**.
- Time axis is per-minute or per-session, not per-day — edge dynamics shift intraday.
- Attribution must reconcile to the live PnL stream within tolerance; any drift is itself an alert.

### Performance metrics

See [Performance Metrics](common-tools.md#23-performance-metrics). **Mira-specific characteristics:**

- Headline metrics: **bps captured per $ traded**, fill rate at top of book, adverse-selection bps, hedge slippage bps, inventory variance.
- Sharpe is reported but is not the headline — for a market maker with tiny per-fill PnL and high turnover, daily Sharpe is high but uninformative.
- All metrics sliceable by parameter profile, venue, instrument, time-of-day, regime.

### Equity curve

See [Equity Curve](common-tools.md#24-equity-curve). **Mira-specific characteristics:**

- Default horizon is intraday minute-by-minute, with a session marker per venue's UTC day boundary.
- Drawdown alerts trigger when intraday drawdown exceeds a per-instrument inventory-volatility-adjusted threshold.

### Inventory analytics

- **Inventory time series** per instrument — how long does inventory persist?
- **Inventory PnL** — was holding inventory positive or negative on average?
- **Hedge slippage** — realized vs theoretical hedge cost.

### Parameter performance

For every parameter profile: PnL bps per $ traded, fill rate, adverse selection, inventory variance, **by regime** — same profile in different regimes, does it adapt or break? Drives the parameter-library promotion/demotion workflow.

### Venue performance

Per-venue PnL bps, fill rate, adverse selection, latency, rebate / fee economics. Drives venue ranking and capital allocation.

### Toxic-flow analysis

Detail in the **Toxic-flow counterparty leaderboard** unique surface below.

### Latency / infra retrospectives

- **Latency distribution over the day** — tail spikes correlate with PnL drops?
- **Reject reason analysis.**
- **Replay latency-degraded windows** — what was the engine doing, what was the cost.

### Replay

See [Replay Tool](common-tools.md#20-replay-tool). **Mira-specific characteristics:**

- Resolution is **microsecond**, not second or minute — the canonical resolution table in common-tools puts Mira at the highest tier.
- Synchronized layers: full L2/L3 order book, her own quote stack (every send/cancel/replace), her fills, latency-per-tick, her engine's effective-fair estimate, all parameter values active at that moment.
- Scrub speeds include 0.001× (slow-motion through a 50ms event), pause-and-step-tick, and bookmark-on-fill.
- Replay can drive a **what-if** mode: re-run the same captured market against modified parameters and see what would have filled, with the same execution model the engine uses (a backtest with real microstructure).

### Behavioral analytics

See [Behavioral Analytics](common-tools.md#26-behavioral-analytics). **Mira-specific characteristics:**

- Tracks **parameter-change frequency** (over-tinkering = noise), **hotkey usage patterns** (panic-pull clusters before bad sessions), **shadow-mode-skip rate** (changes promoted without shadow first).
- Less applicable than for discretionary archetypes since the engine, not Mira, executes — but useful for catching her own drift.

### Reports

See [Reports](common-tools.md#27-reports). **Mira-specific characteristics:**

- Daily edge / fill / inventory report.
- Weekly venue scorecard.
- Monthly toxic-flow review.
- Quarterly parameter-profile lineage report (which profiles were promoted, demoted, which regimes they cover).

### Compliance & audit

See [Compliance &amp; Audit Trail](common-tools.md#28-compliance--audit-trail). **Mira-specific characteristics:**

- Every quote send, cancel, replace is auditable; volume is large enough that compliance queries must run on aggregated indices, not raw row scans.
- Regulator-relevant signatures (spoofing, layering, momentum ignition) are continuously monitored against her own flow as a defensive check.

### Strategy tagging

See [Strategy Tagging Framework](common-tools.md#29-strategy-tagging-framework). **Mira-specific characteristics:**

- Tag = parameter profile name + regime label + venue. Every fill inherits the tag of the profile that quoted it.
- Tags drive every analytics slice in this phase.

### Trade journal

See [Trade Journal](common-tools.md#15-trade-journal). **Mira-specific characteristics:**

- Per-fill journaling is impossible; entries are at **session** or **parameter-change** granularity.
- The default entry template is "what changed, why, what I expected, what I'd watch."

### Layout

See [Customizable Layout &amp; Workspace](common-tools.md#30-customizable-layout--workspace). **Mira-specific characteristics:**

- Mode preset: **Live Quoting** (Phases 2-3) vs **Analysis** (Phase 4) vs **Calibration** (parameter tuning + shadow mode). Switching modes preserves alarm subscriptions and kill-switch bindings.

**Layout principle for Learn:** distributions, not point estimates. Dense analytical workspace. Replay tooling is heavily used.

---

## Unique Surfaces (Mira-specific)

These are the surfaces that do not have a canonical entry in `common-tools.md` — they exist because Mira's job differs structurally from discretionary archetypes.

### Quote engine state panel

**What it is.** A live, per-instrument, per-venue view of the quote engine's current output: every layer of bid and ask the engine is currently resting, with size, distance from fair, age, queue position estimate, and the engine's effective fair-price estimate broken down by model component (mid + skew + signal-tilt + adverse-widening).

**Why it matters.** Mira's "position" at any instant is the **shape of her quoted book**, not a number on a blotter. Without this, she can't tell whether the engine is doing what she configured. Drift between intended quotes and actual quotes is an immediate problem (rate-limit, latency, model-misfire).

**Data.** Live stream of quote-stack snapshots (≥ 100Hz), engine fair-price model output, queue-position estimator output, recent send/ack/cancel events.

**Design principles.**

- **Lossless.** No smoothing, no decimation. If the engine sends 200 quotes/second, the panel reflects 200 events/second.
- **Compact.** A senior MM watches 10-20 instruments simultaneously; per-instrument footprint must fit in a single grid row.
- **Drillable.** Click an instrument → expanded layer-by-layer view with model decomposition.
- **Anomaly-highlighting.** Layers that haven't refreshed within their expected cadence flash; layers that crossed venue rate limits are flagged.

### Quote engine parameter library & control panel

**What it is.** A library of **named parameter profiles** per instrument (e.g. "BTCUSDT-quiet", "BTCUSDT-event-window", "ETHUSDT-vol-spike") plus the live control panel that displays the currently active profile's parameters as editable sliders/inputs that take effect on next quote refresh.

**Profile contents.** Base spread (bps from fair), inventory skew coefficient, adverse-selection widening curve, top-of-book size, layered sizing schedule, signal-driven skew weights (book imbalance, lead-lag, momentum), pause thresholds (vol spike, latency degradation, news event triggers), max-position-as-fraction-of-limit, hedge-trigger thresholds.

**Why it matters.** Parameter craft is Mira's edge. Profiles let her switch between known-good configurations instantly when regime changes, and let her A/B test new configurations against known baselines.

**Data.** Profile definitions (versioned, audit-logged), promotion lineage (who promoted, when, with what shadow PnL), regime tags, last-N-sessions performance per profile.

**Design principles.**

- **Profile swap is atomic.** A swap mid-session takes effect on next quote refresh; in-flight orders are governed by the new profile's cancel/replace logic.
- **Editable in-place + via library.** Quick overrides on the live panel; permanent edits go through the library workflow with shadow-mode promotion.
- **Version-controlled.** Every profile change creates a new immutable version; rollback is one click.
- **Diff-rendered.** When swapping profiles, the panel shows the parameter diff — Mira sees exactly what's changing.
- **Promotion gated.** Profiles cannot be promoted to live without a shadow-mode pass (configurable per-instrument minimum duration).

### Adverse-selection / toxic-flow monitor

**What it is.** A live surface that classifies every fill into "good" (counterparty was uninformed) vs "bad" (counterparty was informed and the price moved against her after the fill), aggregates the bad ratio over rolling windows, and flags suspicious patterns.

**Components.**

- **Per-fill toxicity score** — captured edge minus subsequent N-second drift, in bps.
- **Per-counterparty fill analysis** — where venue exposes counterparty IDs or proxies (account hash, taker-side latency fingerprint).
- **Time-since-fill price drift distribution** — fills clustered in the high-drift tail are flagged.
- **Toxicity score per session** — moving average; rising = stop quoting.
- **Suspicious-pattern detection** — same-side fills clustered tightly (signature of latency arbitrage), bursts of aggressive takes immediately before adverse moves, fills concentrated in the last quote-cycle before a market move.

**Why it matters.** Adverse selection is the single largest source of edge bleed for a market maker. Spotting it within seconds and reacting (widen, pause, profile swap) is often the difference between a profitable session and a losing one.

**Design principles.**

- **Real-time score with a smoothed trend line.** The instant value is noisy; the trend is what triggers action.
- **Linked to quote-engine state.** A spike in toxicity links one-click to the quote-engine panel and the recent-fills stream.
- **Linked to parameter overrides.** A "toxic-now" badge offers one-click access to widen-all and pause hotkeys.
- **Counterparty granularity where venue allows.** Even hashed counterparty IDs let her build a leaderboard (see below).

### Queue position estimator

**What it is.** For every resting order Mira has working, an estimate of her position in the venue's price-time queue at that level — measured in cumulative size ahead of her, percentile rank, and probability of fill within the next N seconds at current arrival rates.

**Why it matters.** Fill probability at the top of book depends critically on queue position. An estimator that can distinguish "I'm at position 3" from "I'm at position 30" lets the engine make better cancel/replace decisions and lets Mira diagnose underperforming layers.

**Data.** Venue order book deltas (every add/cancel/modify by side and price level), the engine's own send/cancel/replace log, venue-specific queue-priority rules (price-time, pro-rata, hybrid).

**Design principles.**

- **Per-order, not per-level.** Aggregated stats hide the situations she cares about.
- **Calibrated.** The estimator's predicted fill rate must be reconciled in Phase 4 against realized fill rate; persistent miscalibration is an alert.
- **Venue-aware.** Pro-rata venues need a different model than price-time; the estimator must reflect each venue's matching logic.

### Inventory & residual-risk surface

**What it is.** Mira's substitute for a positions blotter. An aggregated view of inventory across instruments and venues, hedge state, residual delta after hedges, and the cost paid today to maintain that hedge state.

**Components.**

- **Aggregated inventory** per underlying across all venues — Mira's true position is netted across venues, not per-venue.
- **Hedge state** — which venues / instruments are hedging which inventory; hedge-ratio per underlying.
- **Residual delta** — naked exposure after hedges, in $ and as % of inventory limit.
- **Hedge cost realized today** — spread paid to lay off inventory (compared to theoretical).
- **Hedge effectiveness** — variance of residual PnL since hedges started.
- **Funding burn** — for perp-leg inventory, current and projected funding cost over remaining session.

**Why it matters.** The canonical [Positions Blotter](common-tools.md#7-positions-blotter) lists discrete positions. Mira has no discrete positions — she has inventory that fluctuates fill-by-fill. This surface is the equivalent for a market maker.

**Design principles.**

- **Limit utilization is the dominant rendered axis.** Color encodes "% of inventory limit consumed."
- **Per-underlying aggregation.** BTC inventory across spot Binance, perp Binance, perp Bybit, perp OKX is one row.
- **One-click drill to per-venue legs.** When hedge effectiveness drops, she needs to see which venue is the offending leg.

### Quote-engine PnL decomposition

**What it is.** Live PnL broken into its constituent edge components: **gross spread captured**, minus **adverse selection bleed**, minus **hedge cost**, minus **fees**, minus **funding** (for perps), equals **net**. Computed per fill, aggregated per instrument / venue / session.

**Why it matters.** Every component leaks separately. Net PnL down today could mean (a) spreads were tight, (b) flow was toxic, (c) hedges were expensive, (d) fees changed, or (e) funding flipped. Without decomposition she can't act.

**Design principles.**

- **Reconciles to the official live PnL.** Sum of components must match net within rounding.
- **Per-fill and aggregated views.** Per-fill for diagnosis; aggregated for trend.
- **Rolling deltas.** "Spread captured today vs 7-day average" flags the right alarm.
- **Linked to attribution in Phase 4.** The same decomposition powers the Phase 4 PnL attribution surface; consistency is non-negotiable.

### Microsecond-resolution latency panel

**What it is.** An upgraded version of [Latency / Connectivity / Infra Panel](common-tools.md#18-latency--connectivity--infra-panel) that reports microsecond-level distributions, not millisecond means.

**Components.**

- **Round-trip latency per venue** — quote send to ack, distribution (p50, p90, p99, p99.9), histogram, time series.
- **Market data latency** — venue-feed-timestamp to engine-process-timestamp.
- **Time-since-last-tick per feed** — staleness alarm; threshold per venue.
- **Co-location health** — server CPU, NIC stats, kernel-bypass driver status, packet-drop counters.
- **Rate-limit headroom** per venue — quotes-remaining, cancels-remaining, in current bucket.
- **Order rejects** — rate, reasons, broken out per venue.
- **Engine queue depth** — internal events waiting to process; backlog = trouble.

**Why it matters.** A 100µs RTT regression on one venue, invisible to a millisecond-resolution panel, can cost real PnL across a session. Tail latency, not mean, is what bites — p99.9 spikes correlate with adverse fills.

**Design principles.**

- **Distribution-first, not mean-first.** Histograms and percentile lines are primary; mean is secondary.
- **Per-venue lanes.** Each venue's lane is independent; a Binance hiccup must not visually contaminate Coinbase.
- **Linked to alerts and kill switches.** A latency spike past threshold can auto-trigger per-venue pause or kill.
- **Co-location panel is read-only but always visible.** Hardware faults rarely happen but cost everything when they do.

### Cross-venue lead-lag indicator

**What it is.** A real-time signal indicating, for each instrument Mira quotes, **which venue's price moves first** and by how much the others lag in time and magnitude.

**Why it matters.** If Coinbase BTC moves first by an average of 80ms and Binance follows, then Mira's Binance quote must lean on Coinbase ticks — quoting against stale Binance mid is a recipe for adverse fills. The lead-lag map drives the engine's signal-tilt parameter.

**Data.** Synchronized tick streams from all quoted venues with hardware timestamps where available; cross-correlation over rolling windows; per-venue beta and lag in milliseconds.

**Design principles.**

- **Pairwise display.** A grid of (venue × venue) cells per instrument shows lead/lag in ms and beta.
- **Regime-sensitive.** Lead-lag flips during news events; the indicator must surface the flip with a "regime change" badge.
- **Drives parameters automatically.** Detected lead-lag changes can swap parameter profiles or adjust signal-tilt weights live.

### Tick-imbalance & cancellation-activity feed

**What it is.** A streaming view of two micro-momentum signals: **tick imbalance** (recent up-ticks vs down-ticks, weighted by size) and **cancellation activity** (rate of cancels vs adds near top of book, especially same-side cancels).

**Why it matters.**

- **Tick imbalance** is a leading indicator of micro-direction; the engine's signal-tilt uses it to skew quotes.
- **Cancellation activity** is the early warning for **informed traders fleeing** — when sophisticated participants cancel right before a move, Mira wants to follow them out.

**Design principles.**

- **Sub-second resolution.** A 30-second moving average is too slow for either signal.
- **Dual-pane.** Tick imbalance on one axis, cancellation rate on another, with the aggregate "informed flight" composite as a third lane.
- **Threshold-linked to alerts.** A cancellation spike past threshold auto-triggers a pause or widen.

### Pre-deployment shadow mode

**What it is.** A first-class operating mode for the quote engine where it consumes the same market data and runs the same logic as the live engine, but does not send any orders to the venue. Instead, it logs every quote it _would_ have sent, every fill it _would_ have received (computed by simulating against the captured order book using the engine's microstructure model), every PnL component it _would_ have realized.

**Workflow.**

1. Mira drafts a candidate parameter profile in the library.
2. She promotes the profile to **shadow** in one click — the shadow engine starts running it against live data.
3. The shadow engine logs everything in parallel with the live engine for a configured minimum duration (per-instrument, e.g. 30 minutes for liquid majors, 4 hours for thin alts).
4. A side-by-side comparison surface shows shadow PnL vs live PnL across all decomposed edge components, fill rate, queue position realized, adverse selection, inventory variance.
5. Mira reviews the comparison; if the shadow is materially better and stable, she **promotes shadow → live** with an audit-logged justification. If not, she revises and re-shadows.

**Why it matters.** Live trading is the worst environment to learn that a parameter change is bad — the cost is real money, in real time, often tens of thousands of dollars per minute on a degraded profile. Shadow mode is the safety harness for parameter craft. It is the **single highest-leverage feature** for protecting Mira's edge against her own changes. Backtests on historical data are not enough — order book dynamics, queue position, and adverse selection are path-dependent and only the live tape produces faithful evaluation.

**Data.** Full live market data feed (shared with live engine), full shadow-engine event log, fill-simulator outputs reconciled against actual fills where the live and shadow engines would have agreed on a quote.

**Design principles.**

- **Parallel, not interleaved.** The shadow engine is a separate process consuming the same feed — never interrupts live engine cycles.
- **Comparable on the same axes.** Shadow PnL decomposition matches live PnL decomposition exactly so the comparison is meaningful.
- **Configurable promotion gates.** Per-instrument minimum shadow duration, minimum shadow fill count, maximum allowable adverse-selection ratio, and PnL improvement threshold. Profiles can't be promoted by clicking through warnings.
- **Auto-demotion.** A live profile that underperforms its baseline by more than a threshold auto-reverts to the previous profile and creates an alert + journal entry.
- **Replayable.** Any shadow session can be replayed afterward at microsecond resolution alongside the live session for postmortem.
- **Cheap to spin up.** Mira will run shadow dozens of times per week; the workflow must take seconds, not minutes.

### Per-fill realized-edge analysis

**What it is.** For every fill, the surface computes **captured edge in bps at fill time** vs the engine's fair-price model, then tracks the **realized edge** by subtracting subsequent adverse drift over multiple horizons (1s, 5s, 30s, 5min). The difference between captured and realized edge is the toxicity bleed for that fill.

**Aggregations.** Distributions, not means — per parameter profile, per venue, per instrument, per counterparty class, per time-of-day, per regime. Distributions matter because the tails are where Mira loses real money.

**Why it matters.** Mira's average per-fill PnL is small and noisy; only the distribution and conditional slices reveal which configuration is profitable. This is the canonical Phase 4 workhorse for a market maker.

**Design principles.**

- **Multi-horizon drift always reported together.** A fill that's profitable at 1s and unprofitable at 5min is informed flow; a fill that's unprofitable at 1s and profitable at 5min is noise the engine outran.
- **Distribution renderings dominate.** Boxplots and histograms over time series of means.
- **Sliceable on every dimension.** The Phase 4 strategy-tag framework powers these slices.
- **One-click drill to replay.** Any tail fill in the distribution links to its microsecond replay.

### Toxic-flow counterparty leaderboard

**What it is.** A ranked list of counterparties (by venue ID, account hash, or behavioral fingerprint where direct ID isn't exposed) sorted by their **realized PnL against Mira** — i.e. how much edge each counterparty has extracted from her fills.

**Components.**

- **Counterparty rank** — leaderboard with realized edge they captured, fill count, average fill size, average post-fill drift.
- **Counterparty profile** — per-counterparty drilldown: time-of-day pattern of when they hit her, instruments preferred, average aggression, latency fingerprint.
- **Behavioral clustering** — for venues where direct ID isn't exposed, fingerprint-based clusters group counterparties with similar latency, sizing, and timing patterns.
- **Defensive actions log** — every time Mira widened, paused, or pulled in response to a counterparty, the action and the counterparty link.

**Why it matters.** Toxic flow is not uniformly distributed — a small number of sophisticated counterparties cause a large fraction of edge bleed. Identifying them lets Mira deploy targeted defenses: widen specifically when they're active, refuse fills via minimum-size or post-only logic, pause on the venues where they dominate.

**Examples of defensive plays the leaderboard enables.**

- "Counterparty C7 hits me at 14:30 UTC daily; auto-widen on instruments they trade between 14:25-14:35."
- "Cluster B (latency-arb fingerprint) is most active on Bybit; reduce top-of-book size on Bybit during their active window."
- "Counterparty C2's average post-fill drift is +6bps over 30s; mark fills from C2 as max-priority for hedge urgency."

**Design principles.**

- **Time-decayed scoring.** A counterparty who picked her off six months ago is less relevant than one who picked her off yesterday. Recency-weighted realized-edge.
- **Persistent across sessions.** The leaderboard accumulates over weeks and months; this is institutional memory.
- **Privacy-aware.** Fingerprint clusters must not leak any PII; the platform must abide by venue rules around counterparty-ID handling.
- **Linked to live monitor.** When a flagged counterparty starts hitting her, the live adverse-selection monitor surfaces the leaderboard rank as a badge.
- **Editable annotations.** Mira can label clusters ("looks like Firm X's HFT desk", "appears retail-sensitive") to preserve operator knowledge across rotations.
- **Auditable.** Every fill is tagged with the counterparty ID/cluster used; rankings are reconcilable from the audit log.

---

## What Ties Mira's Terminal Together

1. **Latency is sacred.** Every surface is real-time and lossless. The terminal does not buffer, average, or smooth in ways that delay perception.
2. **Parameters, not trades.** The trading interface is a control panel for a quoting engine, not an order ticket.
3. **Inventory is the position, not individual fills.** Aggregate inventory state is the most-watched number.
4. **Adverse selection is the second-most-watched number.** Edge bleeds through informed flow; she must see it the moment it spikes.
5. **Hotkeys for everything.** Pull, widen, skew, pause — keyboard reflex, no mouse.
6. **Multi-venue is native, latency-aware.** Lead-lag and cross-venue divergence are first-class signals.
7. **Shadow / sandbox before live.** Parameter changes are shadow-tested whenever risk-relevant.
8. **Cockpit-style monitoring.** Many indicators, peripheral awareness, alarms only when actually wrong.
9. **Replay at microsecond resolution.** The only way to debug what happened in a 50ms event.
10. **Edge components decomposed always.** Spread captured, adverse selection, hedge cost, fees — each visible separately so she sees where edge leaks.

---

## How to Use This Document

When evaluating any market-making terminal (including our own), walk through Mira's four phases and ask:

- Is the latency budget respected end-to-end (data → display → action)?
- Can she change quote-engine parameters with the friction of a knob, not a form?
- Are inventory and adverse selection presented as continuous live state?
- Is decomposed PnL (spread / adverse / hedge / fees) visible per instrument?
- Are kill switches granular (instrument / venue / engine) and bound to hotkeys?
- Is replay possible at microsecond resolution against original order book state?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

---

# Automated Mode

This appendix describes Mira's terminal in the **automated world** — what changes, what stays. Mira is a special case among the archetypes: her manual workflow is already deeply systematic. The engine quotes thousands of times per second; she has not "picked a trade" in years. The shift to automated mode is therefore not a paradigm change but a **scale-up + continuous-improvement loop**: from 5 instruments × 2 venues to 50 quote engines × 20 instruments × 4 venues, with systematic parameter optimization, adverse-selection model retraining, and venue-toxicity learning baked into the platform rather than carried in her head.

Where Marcus's appendix narrates the move from discretionary trader to fleet supervisor, Mira's narrates the move from a hand-tuned five-instrument operator to a **fleet-of-quote-engines** supervisor whose unit of work is the **parameter profile**, not the strategy. Throughout this appendix, "fleet" means the population of running quote engines × instruments × venues, and "strategy" — where it appears — usually collapses to "parameter profile attached to a quote engine class."

For the universal automated-trading platform concepts the appendix builds on, see [automation-foundation.md](automation-foundation.md). For the manual-trader workflow this extends, see Mira's manual sections above and [common-tools.md](common-tools.md).

Examples in every section are **illustrative** — actual platform catalogs (instruments, venues, profile names, model classes) will differ.

---

## 1. What Mira's Edge Becomes

Mira's edge is not a directional thesis; it is **infrastructure plus parameter craft**. In automated mode that edge does not change — it **scales** and the parameter craft becomes **searchable, versionable, and continuously improved by a learning loop**. The framing for this section is therefore "what scaled when," not "what alpha got systematized." Coverage growth is the headline.

The fleet she supervises is structured as **quote-engine classes × instruments × venues × parameter profiles**. The engine class is largely fixed (a small number of well-tested microstructure-aware quoter implementations). The instruments and venues are operational decisions. The **parameter profile** is the unit of work — what gets researched, shadow-tested, promoted, monitored, decayed, retired.

Illustrative quote-engine classes and the parameter-profile families that ride on them — actual platform catalog will differ:

- **Top-of-book maker (TOB)** — single-layer continuous quote at the best bid/ask, inventory-skewed, adverse-selection-widened. Parameter families per liquidity tier (majors / mid-caps / thin alts). Fleet count: ~30 instances across spot venues.
- **Layered ladder maker (LLM)** — multi-level quote stack with size schedule and per-layer skew. Profile families per microstructure regime (tight / normal / event-window). Fleet count: ~20 instances on perp venues where depth matters.
- **Pro-rata venue specialist** — engine variant tuned for pro-rata matching (different queue economics; different cancel/replace logic). Profile families per venue rule. Fleet count: small but high-revenue per instance.
- **Hidden / iceberg quoter** — for instruments where signal-leakage from displayed size is the dominant cost. Profile families per fill-toxicity regime.
- **Cross-venue lead-leaning quoter** — engine variant that conditions its quote on a designated lead-venue tick. Profile families per detected lead-lag relationship; profiles auto-rotate when the lead venue flips.
- **Auto-hedging companion** — not a maker but a paired engine that consumes inventory deltas from the makers and lays them off. Profile families per hedge-cost / urgency tradeoff.
- **Options market-maker (Deribit)** — vol-quoted maker on the options book; companion delta-hedger on perps. Profile families per IV-rank, expiry, gamma-budget.
- **Funding-arbitraged perp quoter** — perp maker with explicit funding-burn term in its fair model. Profile families per funding regime.
- **Outage-aware backup quoter** — passive-only engine that activates when a primary venue degrades, providing partial coverage at wider spreads.
- **Regulated-spot quoter (Coinbase / Kraken)** — engine variant with US-regulated venue's matching rules, fee schedule, market-data peculiarities.

Across all classes the fleet shape is roughly:

| Dimension                                                             | Manual today       | Automated-mode target         |
| --------------------------------------------------------------------- | ------------------ | ----------------------------- |
| Instruments quoted continuously                                       | ~5                 | ~20                           |
| Venues per instrument                                                 | 1–2                | 3–4                           |
| Quote engines running concurrently                                    | ~5                 | ~50                           |
| Parameter profiles in production                                      | ~12 hand-edited    | ~150 versioned                |
| Parameter profiles in shadow at any moment                            | 0–1                | 5–15                          |
| Parameter-profile cycles per week (research → shadow → live → retire) | 1–2                | 15–30                         |
| Adverse-selection model retrain cadence                               | quarterly, by hand | rolling, scheduled, automated |
| Venue-toxicity model retrain cadence                                  | ad hoc             | weekly per venue, automated   |

The cognitive shift is therefore: **fewer parameter tweaks-per-decision; more parameter-profile-decisions-per-week**. Mira does not stop thinking about widths and skews; she thinks about them once per profile-version, with shadow evidence, then she watches the fleet for the regime in which that profile no longer holds. Her manual mode was tuning five engines all day; her automated mode is curating a population of profiles and the regimes they cover.

Two specifically Mira-shaped continuous-improvement loops sit underneath the fleet:

1. **Parameter optimization loop.** A scheduled background search (Bayesian / CMA-ES / population-based — illustrative) runs candidate parameter perturbations against shadow simulators using replayed live tape, surfaces the top-N candidates, and queues them for human review and shadow promotion. Mira does not run the search by hand; she reviews its proposals.
2. **Adverse-selection / venue-toxicity learning loop.** As fills accumulate, the per-counterparty toxicity model and the per-venue toxicity priors retrain on a rolling window. The retrained model is shadow-deployed, evaluated against held-out fills, and promoted via the same lifecycle that governs strategies. Mira reviews retrains; she does not run them by hand.

The headline for the section is therefore: **the engine and the maker did not change — the population of engines, the discipline around their parameters, and the learning loops around adverse selection scaled by 10x.**

## 2. What Stays Mira

Even with 50 quote engines running and a learning loop retraining adverse-selection models on a rolling window, several judgment surfaces stay human. The engine is fast; Mira is right.

- **Parameter-tweak judgment in unfamiliar regimes.** The parameter optimizer searches around known-good profiles using replayed tape from regimes the platform has seen. New regimes — first-ever depeg of a major stable, first day of a venue using a new matching rule, the first hour after a major exchange-outage cascade — produce no relevant tape and no calibrated optimizer. Mira's hands set initial widths there, then the optimizer takes over once a usable history exists.
- **Regime-shift recognition faster than the drift detector.** The platform's drift dashboard fires when statistical features cross thresholds, which is later than Mira sees the regime change in the tape. She still calls regime by eye — and the platform's job is to make her one-click profile swap atomic, audited, and reversible.
- **Counterparty-toxicity reading at the level above the model.** The toxic-flow model can rank counterparties by realized edge against her over a window. It cannot reason about _why_ a cluster's behavior changed — a new prop firm joining the venue, a regulatory change in their home jurisdiction, a known competitor's hire of an HFT team. Mira reads desk-chat, news, and her own intuition for the _why_; the model only sees the _what_.
- **Market-microstructure regime calls.** "Coinbase is now the lead venue for this name" is, at the moment of the shift, a judgment call. The lead-lag indicator confirms it 30 seconds later. Mira's call drives an early profile swap; the model's confirmation is the audit.
- **Venue-relationship judgment.** Should we keep quoting on Venue X given the rebate cut? Should we apply for a new tier? Should we negotiate a colocation upgrade? These are commercial / political decisions about counterparty relationships and exchange operations; the platform shows the data, Mira makes the call with the head of trading.
- **Catastrophe response.** Exchange outages, depegs, oracle failures, half-hour API hiccups — the engine can auto-pause but it cannot decide whether to flatten inventory aggressively, hedge into a degraded venue, or wait. Mira's hands and the foot-pedal are the last line of defense, and the platform's job is to make her interventions instantly effective and fully audited.
- **Parameter-profile sanctioning.** The optimizer surfaces candidate profiles; the lifecycle gate requires Mira (and for capacity-relevant changes, David) to sign off. Quantitative gates pass automatically, but the final human gate remains.
- **Counterparty-cluster annotation.** The toxic-flow leaderboard's behavioral clusters are unlabeled by default; Mira labels them ("looks like Firm X's HFT desk", "appears retail-sensitive", "new entrant, monitor") and her annotations are durable, persisting across rotations.
- **Calibration storytelling for compliance and the head of trading.** Why did our spread-captured-bps drop 1.5 last week? The decomposition gives the components, but explaining the narrative to the head of trading or compliance — "venue C tightened spreads because new participant Y arrived; we deliberately ceded share rather than widen our adverse-selection model further" — stays Mira's job.
- **Operational handoffs across sessions.** Asia → EU → US session handoffs involve parameter-profile rotations, venue-priority changes, and operator handoff notes. The platform automates the rotation; Mira (and the next session's operator) own the human-side note that says "C7 was active overnight, Bybit had two reject-rate spikes, watch for follow-through."

Platform stance: opinionated about which loops to automate (search, retrain, rotate, decay) and humble about what cannot be automated today (regime intuition, the _why_ behind a counterparty's behavior change, venue-relationship judgment, catastrophe response). The most automated archetype on the floor still has a non-trivial "stays human" list.

---

## 3. The Data Layer for Mira

Mira's data layer is **microstructure-heavy** — tick-level feeds, queue-position estimators, adversarial-flow archives, latency telemetry — and lighter on news, fundamentals, and macro than other archetypes. Storage and retrieval economics matter here in a different way: per-instrument-per-venue, the data volume is enormous (full L3 books, every send/cancel/replace, every fill, every counterparty proxy where exposed), and the platform must store it losslessly because retrospective microstructure analysis depends on it.

### 3.1 The Data Catalog Browser

Same shape as the foundation doc's catalog: left sidebar filters (asset class, venue, feed type, frequency, lineage status, freshness), main panel with searchable dataset tiles, right pane with schema and lineage. Mira-specific filter facets:

- **Resolution** — tick / 100ms / 1s / 1m / 1h. Tick is dominant; aggregations are derived.
- **Book depth captured** — top-of-book / L2 / L3.
- **Counterparty-ID exposure** — none / hashed / direct.
- **Hardware-timestamp availability** — yes / no per venue.
- **Replay-grade flag** — does the dataset support microsecond-resolution replay?

### 3.2 Mira's Core Datasets (Illustrative)

All datasets below are example shapes; actual platform catalog will differ.

- **Per-venue full L3 order book deltas** — every add/cancel/modify, hardware-timestamped where available, per spot and perp venue.
- **Per-venue trade tape** — every print, with aggressor side, counterparty proxy, latency from match.
- **Mira's own send/cancel/replace log** — every quote the engine emitted, ack-stamped, with the parameter profile in effect at send.
- **Mira's own fill log** — every fill with captured-edge bps, post-fill drift over multiple horizons, counterparty proxy, queue-position-at-fill.
- **Cross-venue synchronized tick stream** — multi-venue ticks aligned via hardware timestamps for lead-lag analysis.
- **Per-venue rate-limit telemetry** — quotes-remaining / cancels-remaining / bucket-resets over time.
- **Per-venue rejection log** — every reject with reason code, instrument, timestamp.
- **Latency telemetry** — RTT distributions per venue per minute, NIC stats, kernel-bypass driver health.
- **Funding-rate ticks per perp venue** — every funding update.
- **Venue-status feed** — exchange status pages, official venue announcements, outage history.
- **Counterparty-fingerprint archive** — behavioral clusters across instruments and venues, retrained weekly.
- **Adverse-selection labeled fill archive** — every fill labeled with toxicity score and counterparty-cluster ID.
- **Replay tape index** — bookmarks for known-interesting windows (regime changes, outages, large-print events).
- **Cross-venue mid divergence archive** — historical divergence series and recovery dynamics.
- **Pro-rata queue-priority observations** — for pro-rata venues, observations of actual fill order vs theoretical price-time order.

### 3.3 Data Quality Monitoring

Same shape as the foundation doc. Mira-specific quality checks: per-feed staleness alarm (no tick in N seconds), hardware-timestamp drift detector, sequence-gap detector per venue feed, RTT-tail-anomaly detector, rate-limit-bucket inconsistency detector. Quality issues are **engine-blocking** — a feed gone stale is grounds to auto-pause the engine that depends on it.

### 3.4 Lineage Navigator

Same shape as the foundation doc. Mira's lineage chains tend to be short (raw venue feed → engine input) but high-volume; the lineage graph is denser per-node than for a fundamentals trader.

### 3.5 Procurement Dashboard

Renewal-sensitive feeds for Mira: hardware-timestamped market data feeds (per venue), colocation contracts (per venue), kernel-bypass driver licensing. The dashboard surfaces renewal dates, cost per fill economics, and contract-tier upgrades available. New-feed evaluation requests for Mira are usually venue-onboarding triggered.

### 3.6 Gap Analysis Surface

Mira-specific gaps: coverage gaps in counterparty-proxy exposure (some venues do not expose anything beyond an aggressor side), queue-priority-rule gaps (pro-rata venues with undocumented secondary criteria), hardware-timestamp gaps (venues with software timestamps only, where lead-lag analysis is degraded).

### 3.7 Interactions Mira Has With the Data Layer

- **Daily** — staleness alarms triage; replay-tape bookmark review; new-day venue-status check.
- **Weekly** — counterparty-fingerprint archive update review; per-venue toxicity-prior comparison; rate-limit-bucket trend review.
- **Monthly** — feed renewal review with the head of trading; venue contract status; new-venue evaluation if applicable.
- **Ad hoc** — every replay session (microsecond drilldown of a specific event) is an interaction with the data layer.

### 3.8 Why This Matters

A market maker who cannot trust the data layer is a market maker quoting on stale or wrong information. **Edge bleed from data quality is silent and multiplicative**: a 200ms gap in a feed can produce dozens of adverse fills before the engine notices. The catalog, quality monitoring, and lineage are not nice-to-haves — they are the foundation under every quote.

---

## 4. The Feature Library for Mira

Mira's feature library is **microstructure-feature-heavy** — derived signals from tick-level data, adverse-selection diagnostics, queue-position estimators — and light on traditional alpha features. The library is dense per instrument but narrow in domain compared to a fundamentals trader.

### 4.1 The Feature Library Browser

Same shape as the foundation doc. Mira-specific facets: feature horizon (sub-second / second / minute), feature input class (book / trade / own-fill / cross-venue), retrain cadence, regime-conditional flag.

### 4.2 Mira's Core Features (Illustrative)

Examples — actual platform catalog will differ.

**Microprice and fair-value family**

- Microprice (size-weighted mid), micro-imbalance ratio, weighted mid across N levels.
- Engine effective-fair output (mid + skew + signal-tilt + adverse-widening) — itself a feature for downstream models.
- Cross-venue weighted fair (aggregate across all quoted venues).

**Book-imbalance family**

- Top-of-book imbalance (bid size vs ask size).
- Multi-level imbalance over N levels.
- Imbalance change rate (first derivative).
- Imbalance-conditional return predictor (signal-tilt input).

**Queue and cancellation family**

- Queue-position estimate per resting layer.
- Queue-arrival-rate per side per level.
- Same-side cancellation rate (informed-flight signal).
- Add-vs-cancel ratio top-of-book.

**Adverse-selection family**

- Per-fill captured-edge bps.
- Post-fill drift over 1s / 5s / 30s / 5min.
- Counterparty-class probability (informed / retail / latency-arb / unclear).
- Toxicity score per session (rolling adverse-bps).
- Pre-fill cancellation pattern (whether informed counterparties cancelled near me before hitting).

**Cross-venue family**

- Lead-lag in milliseconds (pairwise venue × venue).
- Cross-venue mid divergence (basis points).
- Lead-venue beta (how much do we move when the lead moves N bps).
- Lead-venue regime flip indicator.

**Latency and infra family**

- RTT-p50 / p99 / p99.9 per venue per minute.
- Time-since-last-tick (staleness).
- Reject-rate-with-reason per venue.
- Rate-limit headroom percentage.

**Inventory and hedge family**

- Inventory limit utilization per underlying.
- Hedge-cost realized vs theoretical (bps).
- Funding burn rate (perps).
- Inventory-mean-reversion half-life observed per instrument.

**Volatility family**

- Realized vol multi-horizon (1m / 5m / 1h).
- Tick-frequency vol (ticks per second normalized).
- Spread regime indicator (current vs trailing distribution).

**Catalyst family**

- Time-to-next-scheduled-event per instrument (FOMC, CPI, exchange listing).
- Funding-rate change magnitude (perp).
- Large-print indicator (size-anomaly flag).

### 4.3 Feature Engineering Surface

Same workflow shape as the foundation doc — input dataset, transform, parameters, validation, register. Mira-specific: every new feature must declare whether it is **engine-input-eligible** (sub-millisecond compute budget, lossless update on every tick) or **research-only** (compute-intensive, OK for offline / shadow). The platform enforces the budget at runtime.

### 4.4 The Drift Dashboard

Same shape. Mira-specific drift signatures: lead-lag-flip drift (the venue that used to lead is no longer leading), queue-arrival-rate drift, cancellation-pattern drift, counterparty-fingerprint drift (a cluster's behavior shifted). Drift in any of these is a parameter-profile-rotation trigger.

### 4.5 Cross-Pollination View

Same shape. Mira's library cross-pollinates most with: Marcus (cross-venue / funding / OI features), Sasha (Deribit-options-specific features when she runs the options maker), Quinn (cross-archetype factor features for the firm-systematic book where it overlaps with maker activity).

### 4.6 Interactions Mira Has With the Feature Library

- **Daily** — review of features feeding the live engines for drift; alert triage for any feature in red.
- **Weekly** — review of candidate features the parameter optimizer is using; sanctioning of new features into engine-input-eligible status.
- **Ad hoc** — every replay-driven postmortem produces feature-engineering ideas; they get drafted in the library.

### 4.7 Why This Matters

Mira's edge is parameter craft over a small set of microstructure features. The library is small but dense and load-bearing. **A feature drift she misses for a week is profile-wide adverse selection she cannot explain.** The library exists to make every feature versioned, monitored, and sanctioned before it touches a live engine.

---

## 5. The Research Workspace

Mira's research workspace is **parameter-tuning + adversarial-flow analysis**, not strategy-class research. She is not searching for a new alpha; she is searching for a better width / skew / size schedule for an existing engine class. The notebook environment, the backtest engine, the walk-forward visualization, and the template library all reflect that.

### 5.1 Notebook Environment

Same shape as the foundation doc — Jupyter-derived, integrated with the data catalog and feature library. Mira's typical notebook tasks (illustrative):

- Load a replay window of full L3 + own quote stack + own fills, slice by parameter profile, plot per-fill captured-edge distribution.
- Compare two candidate widening curves on the same replayed tape; tabulate fill-rate and adverse-selection bps at each.
- Cluster counterparties on the latency-fingerprint feature space and inspect cluster behavior over time.
- Inspect a regime change (lead-venue flip) at microsecond resolution and decide whether the lead-lag indicator's threshold should change.
- Backtest a candidate adverse-selection-widening curve on six months of replay tape and see how it would have changed historical adverse-bps.

### 5.2 Backtest Engine UI

The backtest engine for Mira is a **microstructure simulator**, not a daily-bar simulator. It replays full L3 deltas and simulates her engine's quote stack against the replayed book using realistic queue-position dynamics and matching-rule emulation per venue. Realism components specifically required for Mira:

- **Queue-position simulation** — fills are awarded based on where her quote sits in the simulated queue, not just price-time at top.
- **Matching-rule emulation** — pro-rata venues use pro-rata, price-time use price-time, hybrid use hybrid.
- **Latency injection** — quote send is delayed by the historical RTT distribution to that venue at that minute.
- **Cancel-replace race emulation** — if her cancel is in flight when an aggressor arrives, the simulator awards the fill based on actual venue-side timing.
- **Rate-limit emulation** — the simulator respects historical rate-limit budgets and issues reject events when over budget.
- **Counterparty-fill emulation** — fills are tagged with the counterparty cluster active at that historical moment, so toxicity decomposition is faithful.

The UI shows captured-edge / adverse-bleed / hedge-cost / fee / funding decomposition — the same axes as live PnL — over the simulated session. **Reconcilability between simulator and live is non-negotiable**: any window where simulator and live engine would have agreed on every quote must produce the same fill outcomes.

### 5.3 Walk-Forward Visualization

Same shape as the foundation doc. For Mira, walk-forward windows are short — a candidate parameter profile is evaluated on 1-week or 2-week walking windows. Statistical-significance gates are tighter than for slower archetypes because the per-window fill counts are large.

### 5.4 Strategy Template Library

For Mira, the library is a **parameter-profile template library**, not a strategy-class template library. Examples (illustrative):

- **Quiet-regime majors profile** — narrow base spread, low inventory-skew coefficient, mild adverse-widening curve, large top-of-book size.
- **Volatile-regime majors profile** — wider base spread, aggressive inventory skew, steep adverse-widening, smaller top-of-book size, more layered ladder.
- **Event-window profile** — paused at scheduled-catalyst T-5 minutes, reopens at T+10 with widened spread, narrows over 30 minutes.
- **Thin-alt profile** — narrow displayed size, larger hidden / iceberg, aggressive cancellation on book imbalance.
- **Cross-venue lead-leaner profile** — quotes condition on designated lead-venue tick; pause when lead venue degrades.
- **Pro-rata-venue profile** — different size schedule reflecting pro-rata economics; different cancel/replace logic.
- **Outage-aware backup profile** — passive-only, wide, activates when primary venue is degraded.
- **Funding-aware perp profile** — perp maker with funding-burn term in fair model; rotates with funding regime.
- **Options-vol-quoted profile** — Deribit options maker; different fair-model entirely (vol surface, not mid).
- **Defensive-mode profile** — toxicity above threshold; widens hard, reduces size, pauses on triggered counterparty cluster.

Templates are starting points; profiles in production are typically derived (with named lineage) from a template plus N tuning iterations, plus shadow evidence.

### 5.5 Compute Management

Same shape as the foundation doc. Mira's compute uses two pools differently from other archetypes: a **replay-simulator pool** (CPU-heavy, runs candidate profiles against captured tape) and a **continuous-search pool** (background Bayesian / population-based optimizer running a low-priority sweep of perturbations around live profiles). Compute budgets are set per pool.

### 5.6 Anti-Patterns the Workspace Prevents

Universal anti-patterns from the foundation doc apply (lookahead, overfit, p-hacking). Mira-specific anti-patterns the workspace must prevent:

- Backtest that ignores latency injection (gives unrealistically good fills).
- Backtest with queue-position assumed at front (gives unrealistically high fill rate).
- Backtest with no rate-limit emulation (lets the simulator quote infinitely).
- Backtest that uses live engine's effective-fair as a label (circular — the candidate profile changes the fair).
- Profile-comparison without per-counterparty-cluster decomposition (missing the toxicity axis).
- Promotion of a profile based on a single regime's tape (no walk-forward).

### 5.7 Interactions Mira Has With the Workspace

- **Daily** — usually none unless investigating an anomaly or running a quick what-if from replay.
- **Weekly** — review of optimizer-proposed profiles; sanction or reject; queue selected ones for shadow.
- **Ad hoc** — postmortem on any session where decomposed PnL drifted from baseline.

### 5.8 Why This Matters

Without a faithful microstructure simulator, every parameter change has to be tested live, where bad changes cost real money. The workspace exists to **make the cost of "trying it" be CPU minutes, not bps of edge bled to the market**.

---

## 6. The Model Registry

Mira's "models" are the **inner models of her quote engines** — the components that turn raw market data into quoting decisions — plus the **adverse-selection / counterparty-fingerprint models** that learn from her flow. Versioning matters acutely because parameter changes cycle fast; a fast-moving registry is a fast-moving foot-gun without discipline.

### 6.1 Model Registry Browser

Same shape as the foundation doc. Mira's model classes (illustrative):

- **Effective-fair-price models** per instrument class (microprice plus skew/tilt modules).
- **Queue-position estimators** per venue × matching rule.
- **Adverse-selection classifiers** per venue (per-fill toxicity probability).
- **Counterparty-cluster fingerprint models** (latency / sizing / timing fingerprints).
- **Lead-lag predictors** per instrument (which venue leads, by how much, and confidence).
- **Cancellation-pattern classifiers** (informed-flight detection).
- **Inventory mean-reversion estimators** per instrument (how long does inventory persist).
- **Hedge-cost surface models** per hedge venue.
- **Latency-anomaly detectors** per venue.

### 6.2 Model Record Page

Same shape as the foundation doc — version, training data range, validation metrics, lineage, deployment status, governance approvals. Mira-specific record fields: per-venue calibration table (the same model class often has per-venue parameters), engine-input-eligibility flag (compute budget verified), shadow-mode pass record, regime tag of the training window.

### 6.3 Versioning & Immutability

Same shape. Critical for Mira because retrains happen on a rolling cadence (weekly per venue for adverse-selection; quarterly for queue estimators; ad hoc for fingerprint models). Every retrained model is a new immutable version; rollback is one click.

### 6.4 Drift Surface for Models

Mira-specific model drift signatures: queue-position-estimator predicted-vs-realized fill-rate drift; adverse-selection-classifier calibration drift (predicted toxicity probability vs realized post-fill drift); counterparty-cluster boundary drift (clusters becoming less separable). Drift in any of these is a retrain trigger.

### 6.5 Lineage Graph

Same shape. Mira's lineage chains tend to be model → many parameter-profiles → many engines × instruments × venues. A retrained adverse-selection classifier can affect dozens of profiles; the lineage graph makes the blast radius visible before promotion.

### 6.6 Why This Matters

The maker's edge is path-dependent on her models. **A retrained model deployed without lineage discipline can change every profile's effective behavior simultaneously, with no audit trail.** The registry exists to make every retrain a sanctioned, reversible event.

---

## 7. The Experiment Tracker

Every backtest, simulator run, optimizer sweep, and shadow-mode session goes into the tracker. For Mira the tracker is the discipline that keeps the parameter-search loop honest.

### 7.1 The Experiment Browser

Same shape as the foundation doc. Mira-specific filters: parameter-profile-family, candidate-vs-baseline, replay-window-tag, optimizer-run-id, shadow-mode-id.

### 7.2 Per-Experiment Record

Standard fields plus Mira-specific: replay-window definition (start, end, instruments, venues), profile diff vs baseline, decomposed-PnL outcome, fill-rate, adverse-bps, queue-position-realized-vs-predicted, counterparty-cluster decomposition, latency-distribution observed, simulator vs live reconcilability score (where applicable).

### 7.3 Run Comparison Views

Side-by-side comparison of two profiles on the same replayed tape. The default visual is **decomposed-PnL stacked-bar** (gross spread, adverse-bleed, hedge-cost, fees, funding) per profile; differences highlighted. Distribution comparisons (per-fill captured-edge distribution, post-fill drift distribution) are first-class because point estimates are deceptive at her per-fill PnL scale.

### 7.4 Anti-Patterns Prevented

Same as workspace anti-patterns plus tracker-specific: silent re-run with different seed (tracker enforces seed declaration), comparison across different replay windows (tracker forbids), comparison without same simulator version (tracker forbids), promotion from a single experiment without walk-forward (tracker requires walk-forward record).

### 7.5 Interactions Mira Has With the Experiment Tracker

- **Weekly** — review of the optimizer's experiment batch; sanction the top-N for shadow.
- **Per-postmortem** — every replay-driven postmortem produces an experiment that is logged and later searchable.
- **On promotion** — the lifecycle gate reads from the tracker to verify the candidate has the required walk-forward and shadow-mode records.

### 7.6 Why This Matters

Without the tracker, Mira would tune profiles by intuition and remember the best one in her head. The tracker turns parameter craft into a **searchable, reproducible, comparable** discipline — and lets the optimizer run unattended without risk of an unexplained change appearing in production.

---

## 8. Parameter Profile Composition

For Mira, this section dramatically simplifies relative to the template's "Strategy Composition" because her unit of work is a **parameter profile** attached to a quote-engine class, not a composed strategy with sizing / entry / exit / hedging logic. Entry, exit, and hedging are built into the engine class; sizing is a parameter inside the profile; risk gating is a parameter inside the profile. Composition is therefore mostly **profile assembly**, not strategy assembly.

### 8.1 The Parameter Profile Composition Surface

The composition surface is a structured editor for a parameter profile:

- **Engine class selector** — TOB / LLM / pro-rata-specialist / hidden-quoter / cross-venue lead-leaner / auto-hedger / options-MM / funding-aware perp / outage-backup / regulated-spot.
- **Instrument and venue scope** — single instrument × single venue (most profiles) or fan-out (a profile family that applies to a set of instruments under a shared template).
- **Fair-model selector** — which effective-fair model from the registry.
- **Skew parameters** — inventory-skew coefficient, signal-tilt weights (book imbalance, lead-lag, momentum).
- **Width parameters** — base spread, adverse-selection widening curve, vol-conditional widening, regime-conditional widening.
- **Size parameters** — top-of-book size, layered ladder schedule, max-position-as-fraction-of-limit.
- **Pause / kill thresholds** — vol spike, latency degradation, news event, cancellation spike.
- **Hedge-trigger parameters** — inventory threshold, hedge venue priority, hedge-urgency curve.
- **Counterparty-aware overrides** — if counterparty cluster X active, widen by Δbps / reduce size by Δ% / pause.
- **Catalyst-aware overrides** — at scheduled events, swap to a paired event-window profile automatically.

The editor renders a **diff vs the currently-live profile** at every keystroke; saving creates an immutable version; the composition surface prevents the operator from saving a profile that fails any of the platform's hardcoded sanity checks (e.g. base spread < adverse-widening floor, size > venue rate-limit budget).

### 8.2 Pre-Deployment Validation

Before a profile can be promoted from research to shadow, the composition surface runs static validation: every parameter is in range, every referenced model is in the registry at a sanctioned version, every venue / instrument tuple is valid, every catalyst-override is paired with a real catalyst-feed entry. Promotion to shadow itself is a gate (next section).

### 8.3 Profile Versioning and Diff Rendering

Every save is an immutable version. The diff renderer is load-bearing — when Mira swaps a profile mid-session, she sees exactly which parameters changed, by how much, with the change history for each parameter visible inline. The diff also drives the audit log entry.

### 8.4 Profile Families and Inheritance

A **family** is a template + a set of per-instrument or per-venue overrides. Editing the family template propagates to all members; per-instance overrides remain. Families let a single change ("widen all event-window profiles by 20%") apply across dozens of instances without 50 manual edits.

### 8.5 Why This Matters

Profile composition that isn't structured is profile composition that gets out of sync, drifts silently, and produces an audit trail no one can read. **The composition surface exists to make every profile in production reachable, diff-able, and reversible**, and to make the family-level edits that keep the fleet coherent across 50 quote engines.

---

## 9. Promotion Gates & Lifecycle (Parameter Profiles)

The lifecycle for Mira applies to **parameter profiles**, not strategies, and the cadence is faster than for any other archetype on the floor. A profile can move research → shadow → canary-live → live → monitor → retired in a single trading day for a small per-instrument scope; firm-wide rollouts take longer because the canary phase is longer.

### 9.1 The Lifecycle Pipeline View

A swimlane view with stages: **Research** (drafted in the workspace), **Shadow** (running on live tape, not sending orders), **Canary-Live** (running on real orders against a small subset of liquidity, in parallel with the incumbent profile), **Live** (the active production profile for its scope), **Monitor** (still live but flagged for decay observation), **Retired** (archived; no longer eligible for production). Per-profile cards are in the lane corresponding to current stage; transitions are time-stamped and audited.

### 9.2 The Gate UI Per Transition

Each transition has a structured gate with quantitative checks plus human approvals.

- **Research → Shadow.** Quantitative: experiment-tracker record exists with walk-forward results; static validation passes; resource budget for a parallel shadow process. Human: Mira clicks "promote to shadow," an audit reason is required.
- **Shadow → Canary-Live.** Quantitative: minimum shadow duration met (per-instrument, e.g. 30 minutes for liquid majors, 4 hours for thin alts); minimum shadow fill count; shadow PnL decomposition stable and not worse than baseline by more than tolerance; adverse-selection ratio not worse than baseline; reconcilability with live engine on overlapping quote events. Human: Mira approves; for capacity-relevant changes (large-size profile, new venue), David's risk team approves.
- **Canary-Live → Live.** Quantitative: minimum canary duration (typically several hours to a session); canary PnL within tolerance of expected; no anomalies in decomposed PnL or adverse-selection. Human: Mira approves; if the change is across many instruments, the head of trading approves.
- **Live → Monitor.** Either scheduled (every live profile enters monitor after N sessions) or triggered (decay metric crossed threshold).
- **Monitor → Retired.** Quantitative: replacement profile has been live for X sessions and is performing better than the incumbent on decomposed-PnL axes; no rollback events. Human: Mira approves; audit reason required.

### 9.3 Lifecycle Decision Log

Same shape as the foundation doc — every transition with timestamp, approver, justification, linked experiment record, linked shadow / canary records. The decision log is the audit substrate for compliance and for Mira's own retrospectives.

### 9.4 Lifecycle Cadence for Mira

Faster than any other archetype. Typical week:

- **15-30 profile cycles** in some stage of progression.
- **5-15 profiles in shadow** at any moment.
- **2-5 profiles in canary** at any moment.
- **150-ish profiles in live or monitor** across the fleet.
- Several **rollback events per week** — a canary that didn't pan out, auto-demoted by the platform. Rollbacks are normal, not failures.

The platform supports this cadence via:

- One-click promotion buttons with all gate checks pre-computed.
- Automatic rollback on auto-demotion criteria (live profile underperforms baseline by more than threshold for N minutes).
- Continuous shadow-pool capacity (always-on, not spun up per-experiment).

### 9.5 Why This Matters

Parameter craft only scales if profile transitions are cheap, audited, and reversible. **Without a structured lifecycle, the maker either tunes too slowly (leaving edge on the table) or tunes too fast (introducing untested changes into production).** The lifecycle gives Mira fast cadence without the foot-guns of unstructured tuning.

---

## 10. Capital Allocation

For Mira, capital allocation is **per-instrument-per-venue inventory limits + parameter-profile budget caps**, not dollar-distribution across alpha strategies. The dominant axis is **exposure**, not capital. Sub-account routing matters because she runs across 4+ venues and several legal-entity sub-accounts.

### 10.1 The Allocation Engine UI

The allocation surface shows, per underlying:

- **Inventory limit** (in coins / contracts / dollar-equivalent).
- **Current inventory utilization** across all venues.
- **Per-venue inventory limit** (sub-allocations of the per-underlying limit).
- **Per-profile-family quote-volume budget** (how much the engine is allowed to quote per minute / hour / session).
- **Hedge-venue capacity** (how much inventory can be laid off per minute on the hedge venue without leaking signal).

Edits are in two places — the structural limits (per-underlying, per-venue) which require risk-team sign-off, and the operational limits (per-profile-family quote volume) which Mira can adjust within sanctioned ranges.

### 10.2 Per-Venue Sub-Account Routing

Specific to Mira: each venue runs the engine inside a dedicated sub-account (regulatory segregation, margin segregation, risk-isolation). The allocation engine knows which sub-account each engine instance lives in; cross-venue inventory aggregation accounts for sub-account boundaries (e.g., inventory in Bybit-Sub-A and Bybit-Sub-B is netted for risk but not for margin). Margin-segregation alarms are first-class.

### 10.3 Inventory-Limit Hierarchy

The hierarchy is: firm-level inventory limit per underlying → desk-level → maker-team-level → per-engine-instance. Limit utilization at each level rolls up; a per-engine breach can be auto-handled (pause that engine), a desk-level breach escalates to Mira and the head of trading.

### 10.4 Allocation Drift

Same shape as the foundation doc. Mira-specific drift signatures: per-venue inventory drift (one venue's inventory growing while others shrink, indicating asymmetric flow), hedge-venue capacity drift (the cheapest hedge venue is becoming more expensive), profile-family budget drift (a family using less than its allocation, suggesting over-conservative profiles).

### 10.5 Capacity & Headroom

How much more inventory can the engine absorb at current widths and current flow? The platform answers this continuously per underlying; the headroom is what governs how aggressive the engine's top-of-book size can be without risking limit breaches.

### 10.6 Why This Matters

A maker without tight inventory-limit discipline is a maker who eventually takes a directional position by accident. **Capital allocation in Mira's world is the budget that prevents accidents at scale**, and the sub-account routing is the regulatory and margin firewall that contains them when they happen.

---

## 11. Live Fleet Supervision Console

The live console is where Mira spends most of her time. The fleet is large (50 engines) but the default-state is **green and quiet** — the platform supervises continuously, alerts when needed, and renders foveal detail only on demand.

### 11.1 The Fleet Dashboard

A grid view of every live engine. Each row is an engine (instrument × venue × engine class), and the columns are:

- **Engine class + parameter profile name + version.**
- **Inventory limit utilization** (color-encoded).
- **Adverse-selection score** (rolling, color-encoded; spike highlighted).
- **Captured-edge bps today** (vs baseline).
- **Fill rate at top-of-book today** (vs baseline).
- **Decomposed PnL** (mini sparkline of gross / adverse / hedge / fees / funding).
- **Reject rate** (last N minutes).
- **Latency p99** to venue (vs baseline).
- **Quote-engine state health** (green / amber / red).
- **Stage** (live / canary / monitor).
- **Active alerts.**

Sort and filter by any column. Default sort is "engines with active alerts at top, then engines with anomalous decomposed-PnL deltas, then alphabetical." Color uses a triage palette — green for nominal, amber for "watch," red for "act now."

### 11.2 The Engine Detail Page

Drill into any engine row and the detail page shows:

- **Live quote stack** — every layer of bid and ask, with size, distance from fair, age, queue-position estimate.
- **Effective-fair decomposition** — mid + skew + signal-tilt + adverse-widening, current values.
- **Recent fills stream** with per-fill captured-edge and post-fill drift.
- **Decomposed-PnL today** with per-component sparklines.
- **Inventory and hedge state for this engine's underlying.**
- **Active counterparty-cluster activity.**
- **Latency and reject panel.**
- **Active parameter profile** — full parameter listing with per-parameter history.
- **Linked controls** — pause, widen, skew, profile-swap, kill (all hotkey-bound and visible).

### 11.3 Anomaly Detection Surface

Same shape as the foundation doc. Mira-specific anomaly types: adverse-selection spike, decomposed-PnL delta beyond tolerance, fill-rate-at-TOB drop, queue-position-estimator miscalibration, lead-lag flip, counterparty-cluster activation, reject-rate spike, latency-tail spike, quote-engine stall (no quote sent in N seconds).

### 11.4 Cross-Engine Correlation View

For Mira this is **cross-instrument and cross-venue correlation in adverse-selection events**. If a counterparty cluster activates on Binance BTC at 14:30 and then on Bybit BTC at 14:31, the correlation view links the events. If multiple engines are simultaneously seeing reject-rate spikes, the view points at a venue-wide problem rather than per-engine.

### 11.5 Inventory + Hedge + Adverse-Selection Live State

This is **Mira's substitute for Marcus's "Multi-Venue Capital Live State"** and it is the most-watched panel on her primary monitor.

The panel shows per underlying:

- **Aggregated inventory** across all venues (the true position).
- **Per-venue inventory legs.**
- **Active hedges** (which venues, sizes, ages, hedge cost realized vs theoretical).
- **Residual delta** (naked exposure after hedges, in $ and as % of inventory limit).
- **Hedge effectiveness** (variance of residual PnL since hedges started).
- **Funding-burn projected to session end** (perp inventory).
- **Live adverse-selection score** for each instrument feeding inventory into this underlying.
- **Active counterparty-cluster overlays** — which counterparty clusters are hitting which engines feeding this underlying.
- **Inventory-limit utilization** with the limit-utilization heatmap as the dominant rendered axis.

When inventory utilization goes above threshold, the panel highlights the offending engines; when adverse-selection rises, the panel cross-links to the toxic-flow leaderboard (section 11.6 below covers state inspection that goes beyond this view).

### 11.6 Strategy State Inspection — Quote-Engine and Profile Internals

**MANDATORY across all archetypes.** For Mira this surface is **per-engine and per-profile internal state inspection**, and it has two modes — internal-state view (per engine, refresh-on-demand or event-pushed) and shadow-vs-live comparison (continuous when a shadow profile is paired with a live one).

#### 11.6.1 Internal-State View (Per Engine)

For any single engine, on demand, Mira can pull a snapshot of the engine's full internal state:

- **Active parameter profile** with all values.
- **Effective-fair model output** (mid + skew + signal-tilt + adverse-widening), with per-component values at the snapshot instant.
- **Live quote stack** as the engine sees it (intended quotes, pending sends, acked layers, in-flight cancels).
- **Queue-position estimates** for every resting layer.
- **Adverse-selection classifier output** for the most recent fills.
- **Counterparty-cluster classification** for recent fills.
- **Inventory state** as the engine sees it (which may differ from aggregator's view by tens of milliseconds).
- **Active overrides** (catalyst-window, counterparty-aware, manual hotkey overrides).
- **Engine queue depth** (internal events waiting to process).
- **Last N decisions** with the inputs and outputs visible.

This view is **refresh-on-demand or event-pushed**, not streamed continuously — engineering pragmatism dictates that streaming all internal state of all 50 engines in real time would saturate the network and the operator's attention. **Streaming all variables of all engines in real time is neither feasible nor useful**; the platform pulls deep state on demand and pushes events ("decision changed by counterparty-aware override") on relevant transitions.

The internal-state view is the canonical debugging surface — when an engine's behavior surprises Mira, the inspection view answers "what did the engine see, what did it think, what did it do, why." Without this, debugging a 50-engine fleet is impossible.

#### 11.6.2 Shadow-vs-Live Comparison

Whenever a shadow profile is paired with a live profile (during the shadow → canary phase), the comparison view shows side-by-side:

- **Decomposed PnL** per component, per profile.
- **Fill-rate at top-of-book.**
- **Adverse-selection bps.**
- **Queue-position realized.**
- **Inventory variance.**
- **Reject rate.**
- **Counterparty-cluster decomposition.**

Updated continuously, with an explicit reconcilability score (where the two engines would have agreed on a quote and seen the same fill, the outcomes match; reconcilability < 100% is itself a signal).

#### 11.6.3 Why This Matters

A 50-engine fleet without per-engine state inspection is a 50-engine fleet you cannot debug. Mira's edge depends on the engine doing what she configured, and **the only way to know what the engine actually thought is to inspect it**. Engineering-pragmatism applies — full real-time streaming of all state is not feasible — so the platform provides on-demand inspection plus event-pushed transitions, and that is enough.

### 11.7 Why This Matters

The fleet console exists to convert 50 simultaneously-running engines from a stress source into a supervisable population. **Without anomaly-driven default-green and one-click drilldown, Mira cannot supervise 10x scale; with them, 50 engines feel calmer than 5 manual ones.**

---

## 12. Intervention Console

Mira's intervention console preserves every manual surface from her current physical setup — hotkeys, foot pedal, parameter overrides, kill switches at three scopes — and adds the granular controls of the automated fleet.

### 12.1 Per-Engine Controls

Per-engine actions, all hotkey-bound and audit-logged: pause, resume, widen-Δbps, skew-long, skew-short, reduce-size-Δ%, swap-profile (with the profile diff rendered before commit), kill. Every action is logged with timestamp, operator, justification (free text or pre-set reason code), and the engine's pre-action state snapshot.

### 12.2 Group Controls — Per Profile-Family / Per Underlying / Per Venue

Group controls let Mira hit a slice of the fleet at once:

- **Per profile-family** — "widen all event-window profiles by 20%" (applied to the family template; propagates to all members).
- **Per underlying** — "pause all BTC engines" (across spot and perp, all venues).
- **Per venue** — "pull all quotes on Bybit" (used when a venue degrades).
- **Per counterparty cluster** — "widen-on-cluster-C7 across the fleet" (counterparty-aware override applied fleet-wide).

Group actions are gated by a confirm-dialog when the scope is large.

### 12.3 Manual Trading & Reconciliation

**MANDATORY across all trader archetypes.** For Mira, manual trading is for **emergency, reconciliation, and override** — not for discretionary directional positions. The engine takes care of normal flow; the manual ticket is the safety harness.

#### 12.3.1 The Full Manual Order Ticket

Adapted to Mira's instrument types — spot, perp, options. The ticket supports:

- **Single-instrument single-venue order** (spot or perp), full order types (limit, market, IOC, FOK, post-only, hidden, iceberg).
- **Multi-leg ticket** for emergency hedge (sell spot + sell perp; or buy options + sell perp delta-equivalent).
- **Cross-venue smart-routing toggle** — for emergency aggressive hedging.
- **Pre-trade risk preview** — inventory delta after hedge, capital impact, margin impact per sub-account.
- **Tagging** — every manual order is tagged with operator, reason code (emergency / reconciliation / override / catastrophe), and a free-text note.

#### 12.3.2 Trade Tagging & Attribution

Every manual fill is tagged so that:

- Decomposed-PnL attribution can isolate manual flow from engine flow.
- Compliance audit can review every manual intervention with full context.
- Post-trade retrospectives can examine manual interventions separately.

#### 12.3.3 Reconciliation Workflow

When the live engine's view of inventory differs from the venue's view (network glitch, missed fill, ack latency), the reconciliation workflow:

- Surfaces the discrepancy with the offending leg.
- Offers a one-click reconcile (mark the engine's state as authoritative or mark the venue's state as authoritative, with audit).
- Optionally issues a manual order to bring inventory back to intended state.
- Logs every reconciliation step.

#### 12.3.4 Emergency Modes

A few operator-triggered modes:

- **Pause all** — all engines pause, manual orders still allowed.
- **Flatten** — issue auto-hedges to bring inventory toward zero on the cheapest available venue.
- **Catastrophe-flatten** — aggressive cross-venue flatten; ignores hedge-cost optimization, prioritizes speed; multi-key authorization required.
- **Venue-isolate** — pull all quotes on a degraded venue; existing inventory on that venue auto-routes to be hedged elsewhere.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

- Engine kill (foot pedal + hotkey).
- Per-venue kill.
- Per-instrument kill.
- Widen-all (global widening multiplier).
- Pull-all on focused instrument.
- Skew long / short.
- Pause N seconds.
- Open manual ticket pre-filled to flatten current inventory.

These hotkeys work even if the rest of the UI is degraded; they are bound at the OS level, not the browser level.

#### 12.3.6 Audit & Friction

Every manual trade requires a reason code. Free-text justification is optional but encouraged. The audit log is append-only and immutable. Friction is calibrated — fast for common emergency actions (single hotkey + foot pedal), more friction for rare destructive actions (catastrophe-flatten requires two-key authorization).

#### 12.3.7 Why This Matters

Mira has not "made a discretionary trade" in years, but the engine fails sometimes — a feed gap, a venue outage, a regulatory event. **Without a manual ticket and emergency modes, an engine failure becomes an inventory failure becomes a PnL failure.** The manual surface is preserved precisely because the rare cases when it matters are the cases that matter most.

### 12.4 Kill Switches at Multiple Scopes

The hierarchy:

- **Per-engine kill** — pause one engine instance.
- **Per-instrument kill** — pause all engines quoting that instrument across venues.
- **Per-venue kill** — pull all engines on a given venue.
- **Per-class kill** — pause all engines of a given class (e.g., pause all options-MM engines for an exchange-side incident).
- **Engine kill** — pull everything (foot-pedal + hotkey + button).
- **Catastrophe-flatten** — pull everything and aggressive auto-flatten (two-key required).

Each scope has a documented activation mechanism, a documented unwind procedure, and audit logging. The foot pedal is bound to engine kill and is the always-available no-hands fallback.

### 12.5 Intervention Audit Log

Same shape as the foundation doc. Every intervention with timestamp, operator, scope, reason code, justification, and pre/post state snapshot. Compliance can query by operator, time window, reason code, scope.

### 12.6 Why This Matters

The maker's edge depends on the engine doing the right thing automatically and on the operator being able to override instantly when it doesn't. **The intervention console exists to make every override fast, audited, and reversible**, and to give Mira the same hotkey-and-foot-pedal reflexes she has today scaled to a 50-engine fleet.

---

## 13. Post-Trade & Decay Tracking

Phase 4 in Mira's manual sections is already analytics-heavy; the automated console adds **decay tracking per parameter profile**, **adverse-selection-model accuracy tracking**, and **venue-relationship validity tracking**.

### 13.1 Per-Profile Retrospectives

For every profile in monitor or live status, the retrospective shows:

- Decomposed PnL over rolling windows (session, week, month).
- Fill-rate-at-TOB trend.
- Adverse-selection bps trend.
- Queue-position-realized-vs-predicted trend.
- Inventory-variance trend.
- Counterparty-cluster decomposition.
- Regime tagging — which regimes the profile has covered, which it hasn't.

Decay signatures are surfaced as deltas vs the profile's rolling baseline; thresholds trigger entry to "Monitor" stage and queue retrain or replacement candidates.

### 13.2 Fleet-Level Review

Fleet-aggregated decomposed PnL by instrument, venue, profile family, regime. Cross-engine attribution: which engines drove the day's PnL, which dragged it down, which were idle. Fleet-level review runs daily; weekly review aggregates to the head of trading.

### 13.3 Decay Metrics Surface

Mira-specific decay metrics:

- **Profile-decay** — captured-edge bps trend per profile; adverse-bps trend; fill-rate-at-TOB trend.
- **Adverse-selection-model decay** — predicted toxicity probability vs realized post-fill drift; calibration drift over time.
- **Venue-toxicity-prior decay** — has a venue's typical toxicity profile shifted (new entrants, new matching rule, new fee tier)?
- **Counterparty-cluster decay** — are clusters still well-separated; has their behavior shifted?
- **Queue-position-estimator decay** — predicted vs realized fill rate.
- **Lead-lag decay** — has the lead venue for an instrument flipped?

### 13.4 Retrain Queue UI

Models in the registry that have crossed retrain triggers appear in the queue with: trigger reason, suggested training-window, expected blast radius (which profiles use this model). The queue is throttled — the platform won't auto-retrain everything on the same day; Mira and the platform agree on a rotation.

### 13.5 Retire Decisions for Profiles

A profile in Monitor that has a strictly better successor in Live for X sessions is queued for retirement; Mira approves. Retired profiles stay in the registry (immutable); they're just no longer eligible for production deployment.

### 13.6 Why This Matters

The maker's edge decays continuously — venues evolve, counterparties evolve, microstructure evolves. **The post-trade and decay surface is the platform's discipline for noticing decay before the PnL bleed becomes obvious.** Without it, profiles silently underperform for weeks; with it, decay is a tracked metric with a planned response.

---

## 14. The Supervisor Console — Mira's Daily UI

### 14.1 Mira's Monitor Layout (Illustrative)

The 6-monitor layout from her manual sections evolves into a fleet-supervisor layout — most manual surfaces remain (now more peripheral), automation surfaces are added foveal. Illustrative — actual layout will differ:

| Position      | Surface                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| Top-left      | **Fleet dashboard** — all 50 engines, sorted by anomaly priority                   |
| Top-center    | **Inventory + Hedge + Adverse-Selection live state** — the most-watched panel      |
| Top-right     | **Engine detail** — opens on click from fleet dashboard                            |
| Middle-left   | **Microsecond latency panel** + venue-status feed                                  |
| Middle-center | **Parameter control panel + profile diff** — when actively tuning, this is foveal  |
| Middle-right  | **Adverse-selection / toxic-flow monitor + counterparty leaderboard**              |
| Bottom-left   | **Lifecycle pipeline view** — profiles in shadow / canary; promotion gates pending |
| Bottom-center | **Decomposed PnL stream + alerts**                                                 |
| Bottom-right  | **Retrain queue + drift dashboard summary**                                        |
| Tablet        | Desk chat + comms                                                                  |

The center of gravity is still inventory + adverse-selection (her edge-protection); the new top-left fleet dashboard adds the supervisor view; the bottom row adds the platform's research / lifecycle / decay surfaces. Hotkeys and foot pedal still operate regardless of which surface has focus.

### 14.2 Mode-Switching

Modes preserved from the manual sections plus new modes for the automated lifecycle:

- **Live Quoting** — supervisor mode; fleet dashboard + inventory + adverse-selection foveal.
- **Calibration** — when actively tuning a profile; parameter control panel + diff foveal; shadow comparison surface adjacent.
- **Analysis** — Phase 4 retrospective; decomposed-PnL attribution + replay tool foveal.
- **Event-Window** — pre-scheduled-catalyst mode; relevant engines moved to foveal; profile-swap pre-staged.
- **Catastrophe** — emergency mode; intervention console foveal; alarm sidebar maximized.
- **Research** — when reviewing optimizer-proposed profiles; experiment tracker + workspace foveal.

Switching modes preserves alarm subscriptions, kill-switch bindings, and foot-pedal binding.

### 14.3 Anomaly-Driven Default State

Default state is the Live Quoting layout with everything green. Any amber or red signal pulls the relevant surface into prominence — an adverse-selection spike on Bybit BTC opens the engine detail page on top-right; a venue-wide reject-rate spike pulls the latency panel to foveal. Mira's attention is drawn by the platform; she does not scan 50 engines manually.

### 14.4 Why This Matters

A 50-engine supervisor cannot read 50 engines simultaneously. **The monitor layout exists to keep her foveal attention on the one thing that needs it, while the platform watches the other 49.** The mode-switching lets her change focus quickly when the situation demands it.

---

## 15. Mira's Automated-Mode Daily Rhythm

Mira's day in automated mode is shaped by **session handoffs** (Asia → EU → US, with crypto being 24/7 but with distinct flow regimes per session) and by **fleet supervision rhythm** rather than by entry / exit decisions. There is no "open" or "close" the way there is for an equity trader — there are session boundaries, scheduled catalysts, and the operator handoff between teammates.

### 15.1 Session Open / Pre-Session (30–60 min)

Mira's pre-session is fleet-readiness, not idea generation:

- Review overnight session: which engines fired alerts, which profiles were rolled back, which counterparty clusters activated.
- Triage retrain queue from the prior session — sanction or defer.
- Review optimizer proposals from the prior session — sanction the top-N for shadow.
- Check venue status — any maintenance windows, any new fee schedules in effect.
- Review scheduled catalysts in the upcoming session and pre-stage event-window profile rotations.
- Brief check on inventory state and hedge state from the overnight handoff.
- Confirm all kill-switch bindings and foot pedal are functional (daily check, ~30 seconds).

### 15.2 In-Session (continuous, anomaly-driven)

The bulk of the day is **supervisory**:

- Watch the fleet dashboard. Default-green most of the time.
- Respond to amber / red alerts: adverse-selection spike, latency spike, reject-rate spike, decomposed-PnL delta, counterparty-cluster activation.
- For routine alerts, the platform auto-handles (widen, pause); Mira reviews and acknowledges.
- For non-routine alerts, Mira drills into the engine detail page, reads the internal state, decides on intervention.
- Calibration sessions interleaved: when a profile in shadow has accumulated enough evidence, Mira reviews the comparison surface and decides to promote, revise, or discard.
- Event-window rotations are pre-staged; when a scheduled catalyst arrives, the profile swap is automatic but Mira watches the swap through and confirms behavior post-event.
- Counterparty-cluster activations may drive immediate counterparty-aware overrides.
- Replay sessions (microsecond drill) for any session-anomaly that wasn't auto-explained.

### 15.3 Session Close / Post-Session (30–60 min)

- Daily decomposed-PnL review across the fleet.
- Profile-level review: any profiles flagged for Monitor stage transition, any flagged for retirement.
- Drift-dashboard review: any models due for retrain.
- Toxic-flow leaderboard review: any new clusters, any annotation updates needed.
- Operator handoff note for the next session's operator: counterparty activity to watch, venue status, profiles in shadow / canary, anything anomalous.
- Trade journal entry at session granularity (what changed, why, what to watch).

### 15.4 Cadence Variations

- **24/7 nuance** — crypto markets do not close. Sessions are operational handoffs, not market closes. The platform supports operator handoff state transfer (active alerts, watch items, profile-stage status).
- **Asia / EU / US** — different liquidity profiles, different counterparty mixes, different volatility patterns; the platform's regime tagging captures this and the parameter profiles in production typically include session-conditional variants.
- **Weekend** — some engines stay live; a smaller operator team supervises; the platform reduces the alert verbosity to defer non-urgent triage to Monday.
- **Catalyst days** — pre-scheduled FOMC, CPI, exchange-listing events; Mira's pre-session prep is heavier; event-window profile rotations are pre-staged with extra scrutiny.
- **Outage days** — venue degrades or goes dark; outage-aware backup profiles activate; Mira's day is defined by intervention console use rather than calibration.

---

## 16. Differences from Manual Mode

| Dimension                          | Manual today                                              | Automated mode                                                                                                                                  |
| ---------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Coverage                           | ~5 instruments × 1–2 venues                               | ~20 instruments × 3–4 venues                                                                                                                    |
| Engines running                    | ~5                                                        | ~50                                                                                                                                             |
| Quotes per second                  | thousands (already automated)                             | tens of thousands across fleet                                                                                                                  |
| Phase 1 (Decide) — what it is      | Tuning 5 engines all day                                  | Curating ~150 versioned profiles + reviewing optimizer proposals                                                                                |
| Phase 2 (Enter) — what it is       | Engine quoting + manual hedges                            | Engine quoting + manual hedges + lifecycle promotion clicks                                                                                     |
| Phase 3 (Hold/Manage) — what it is | Watching 5 engines closely                                | Supervising 50 engines anomaly-driven; foveal only on red                                                                                       |
| Phase 4 (Learn) — what it is       | Per-instrument retrospectives by hand                     | Fleet-level + per-profile decomposed retrospectives + drift / decay tracking                                                                    |
| Time on parameter tuning           | Most of the day                                           | Curation + sanctioning + review of optimizer output                                                                                             |
| Time on supervision                | Continuous foveal                                         | Continuous peripheral; foveal only on alerts                                                                                                    |
| Time on intervention               | Hotkey / foot pedal as needed                             | Hotkey / foot pedal still as needed; group controls now also available                                                                          |
| Time on research / calibration     | Ad hoc, in head                                           | Structured: workspace + experiment tracker + lifecycle                                                                                          |
| Time on toxic-flow analysis        | Daily, by hand                                            | Continuous via leaderboard + counterparty-cluster overlays                                                                                      |
| Latency criticality                | Microseconds matter                                       | Microseconds still matter; platform must respect the budget end-to-end                                                                          |
| Risk units                         | Inventory limits per underlying                           | Same plus per-profile-family budgets and sub-account routing                                                                                    |
| Edge metric                        | bps captured per $ traded, fill rate, adverse-bps         | Same axes; now decomposed and trackable per profile, per venue, per cluster                                                                     |
| Cognitive load                     | High continuous attention to 5 engines                    | Supervisory + bursty foveal; calmer most of the time, sharper in the moments that matter                                                        |
| Failure modes                      | Fat-finger parameter, missed regime, missed adverse spike | Bad profile promoted, optimizer drift, model-decay missed, fleet-wide correlated failure                                                        |
| Tools mastered                     | Quote engine + ladder + hotkeys + foot pedal + replay     | All of the above plus lifecycle pipeline + experiment tracker + drift dashboard + toxic-flow leaderboard + counterparty-fingerprint annotations |
| Compensation driver                | Spread captured net of adverse / hedge / fees             | Same — but fleet revenue is 5–10x larger with similar headcount                                                                                 |

The fundamental change: **Mira's hands move less; her judgment scales more; the platform turns her parameter craft from a day-tuning rhythm into a curation rhythm.**

---

## 17. Coordination with Other Roles

### 17.1 Coordination with Liquidity-Providing Peers

Mira coordinates with other makers on the desk (other instrument coverage, other venues, options maker if separate). The shared substrates:

- **Common feature library and model registry** — adverse-selection classifiers, queue estimators, and counterparty-fingerprint models are shared infrastructure; a retrain by one maker is consumed by the others.
- **Shared toxic-flow leaderboard** — a counterparty cluster identified by one maker is visible to all (privacy-respectful, behavioral-fingerprint-based).
- **Shared inventory aggregation when desks overlap** — if two makers quote BTC, their inventories are aggregated for desk-level limit utilization.
- **Per-venue rate-limit budget coordination** — the platform allocates rate-limit budget across the makers using a venue, so one maker's burst doesn't starve another.

Coordination is largely platform-mediated (shared registries, shared limits) rather than chat-mediated.

### 17.2 Coordination with Marcus

Marcus is the cross-CeFi crypto trader with overlapping coverage on spot venues. Coordination points:

- **Cross-venue mid divergence and basis** — Marcus's basis-arb strategies and Mira's makers operate on the same prices; the platform's cross-venue mid feed is shared and consistent.
- **Inventory netting at the firm level** — when Mira accumulates short BTC inventory and Marcus is long via a basis trade, the firm-level risk view nets them; David's office is the substrate.
- **Regime calls** — Marcus's faster regime intuition on directional moves can drive Mira's profile rotations (e.g. "vol spike incoming, swap to volatile profile" propagated via desk chat or via the platform's regime-tag feed).
- **Catalyst awareness** — funding-rate spikes that Marcus trades directionally are catalysts that Mira's perp engines need to widen for.

### 17.3 Coordination with Quinn

Universal across all trader archetypes — Quinn is the cross-archetype factor / stat-arb / firm-systematic overseer.

- **Cross-archetype factor exposures** — Mira's net inventory contributes to firm-level factor exposures; Quinn tracks this for the firm-systematic book.
- **Shared feature library** — Quinn's cross-archetype factor models may reference some of the same microstructure features Mira uses.
- **Promotion-gate awareness** — Quinn's office is informed of major Mira profile rotations that affect firm-level risk; lifecycle gate readout is shared.
- **Cross-archetype correlation** — Quinn watches for correlated drawdowns that span Mira's adverse-selection events and other archetypes' losses (e.g. a market-wide event that hits multiple desks).

### 17.4 Coordination with David

Universal across all trader archetypes — David is the head of risk.

- **Firm-level supervision** — David's office sees Mira's fleet aggregate alongside every other trader's fleet; firm-wide kill switches, multi-key authorization for catastrophe-flatten, behavioral-monitoring on operator interventions.
- **Capital allocation** — David's office sets the per-underlying inventory limits and the per-venue sub-allocations; Mira operates within those.
- **Promotion sign-off** — capacity-relevant profile changes (large-size, new venue, new instrument) require David's risk team's approval through the lifecycle gate.
- **Catastrophe response** — David's office is the escalation path for venue-wide outages, regulatory events, and correlated-failure scenarios.
- **Behavioral monitoring** — operator-intervention frequency, hotkey-usage patterns, shadow-mode-skip rate are visible to David's office; concerning patterns escalate.

### 17.5 Why This Matters

The maker's edge is local; the maker's risk is firm-wide. **Coordination is platform-mediated by design — shared registries, shared limits, shared lifecycle gates — so that scale doesn't fragment into 50 silos.** Without it, 10x scale would mean 10x coordination cost; with it, scale is mostly free.

---

## 18. How to Use This Appendix

When evaluating any market-making automation platform (including our own), walk through Mira's surfaces and ask:

**Data layer**

- Are full L3 books captured losslessly with hardware timestamps where venues expose them?
- Is replay-grade tape available at microsecond resolution for every venue she quotes?
- Are counterparty-fingerprint archives versioned and behavioral-clusterable across instruments?
- Are feed-staleness alarms engine-blocking, not just operator-notifying?

**Feature library**

- Does every engine-input-eligible feature carry a verified compute-budget tag?
- Are queue-position, adverse-selection, and counterparty-fingerprint features first-class library citizens?
- Does the drift dashboard surface lead-lag flips and counterparty-cluster boundary drift?

**Research workspace**

- Does the backtest engine simulate queue dynamics, matching rules, latency injection, rate-limit budgets, and counterparty-fill emulation faithfully?
- Can Mira go from a notebook idea to a queued shadow profile in minutes, not hours?
- Are the standard maker-specific anti-patterns (no queue simulation, no latency injection, single-regime promotion) caught by the workspace?

**Model registry & experiment tracker**

- Are inner-engine models (effective-fair, queue estimator, adverse-selection classifier, counterparty-fingerprint, lead-lag) versioned, immutable, and rollback-able in one click?
- Does retraining propagate visibility through the lineage graph so blast radius is known before promotion?
- Are experiment runs reproducible bit-for-bit with declared seed and simulator version?

**Parameter profile composition**

- Is the composition surface a structured editor, not a config file?
- Does it render a diff vs the live profile and require a reason on save?
- Do profile families let one edit propagate cleanly to dozens of instances?

**Lifecycle**

- Is shadow → canary → live → monitor → retired a documented, audited pipeline with quantitative gates and human approvals at every transition?
- Can a profile cycle through the pipeline in a session for small scopes, and over days for large scopes?
- Does auto-demotion fire when a live profile underperforms beyond tolerance?

**Capital allocation**

- Is the per-underlying / per-venue / per-sub-account inventory-limit hierarchy enforced and visible?
- Does the allocation engine show capacity headroom continuously?
- Is sub-account routing a first-class concept, not an afterthought?

**Live fleet supervision**

- Can Mira default-green-supervise 50 engines without scanning manually?
- Does the inventory + hedge + adverse-selection live-state panel render limit utilization as the dominant axis?
- Can she drill into per-engine internal state on demand and read what the engine "thought"?
- Is shadow-vs-live comparison continuous and reconcilability-scored?

**Intervention console & manual trading**

- Are hotkeys + foot pedal + per-engine / per-instrument / per-venue / engine kill switches all preserved and instantly available?
- Does the manual ticket support multi-leg emergency hedges across spot, perp, and options?
- Is reconciliation a first-class workflow when the engine's view of inventory disagrees with the venue's?
- Are catastrophe-flatten and other rare-but-destructive actions multi-key authorized?

**Post-trade & decay**

- Does the decay surface track per-profile, per-model, per-venue, and per-counterparty-cluster decay separately?
- Is the retrain queue throttled so the platform doesn't auto-retrain everything on the same day?
- Are decomposed-PnL retrospectives reconcilable with live PnL within tolerance?

**Supervisor console**

- Does the layout preserve the manual-mode foveal surfaces (inventory, adverse-selection, parameter control) while adding the new supervisor surfaces (fleet dashboard, lifecycle pipeline, retrain queue)?
- Do mode-switches preserve hotkey and foot-pedal bindings?
- Does anomaly-driven prominence work — does the platform pull her attention rather than waiting for her scan?

**Daily rhythm**

- Does the platform support 24/7 operator handoffs with state transfer (active alerts, watch items, profile stages)?
- Are scheduled-catalyst event-window profile rotations pre-staged automatically?
- Are retrain queues, optimizer proposals, and decay flags surfaced at session boundaries rather than dumped midday?

**Coordination**

- Are feature library, model registry, and toxic-flow leaderboard shared across makers as platform-mediated infrastructure?
- Are firm-level limits, kill switches, and behavioral-monitoring visible to David's office without requiring Mira's pull?
- Does Quinn's office see Mira's fleet aggregate alongside every other trader's, with cross-archetype correlation surfaces?

**Cross-cutting**

- Is latency respected end-to-end (data → display → action) at microsecond granularity?
- Is every parameter change, model retrain, manual intervention, and lifecycle transition audit-logged immutably?
- Is the platform opinionated about what to automate (search, retrain, rotate, decay) and humble about what cannot be automated (regime intuition, counterparty-cause judgment, venue-relationship calls, catastrophe response)?

Gaps may be deliberate scope decisions but should be **known** gaps, not **accidental** ones. The point of this appendix is not to define a shopping list but to make the shape of Mira's automated terminal explicit so that platform decisions are made with full awareness of what the maker's edge actually depends on.
