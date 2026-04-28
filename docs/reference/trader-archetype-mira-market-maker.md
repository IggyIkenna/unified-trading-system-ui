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

See [Catalyst / Event Calendar](common-tools.md#12-catalyst--event-calendar) and [News & Research Feed](common-tools.md#13-news--research-feed). **Mira-specific characteristics:**

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

See [Compliance & Audit Trail](common-tools.md#28-compliance--audit-trail). **Mira-specific characteristics:**

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

See [Customizable Layout & Workspace](common-tools.md#30-customizable-layout--workspace). **Mira-specific characteristics:**

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
