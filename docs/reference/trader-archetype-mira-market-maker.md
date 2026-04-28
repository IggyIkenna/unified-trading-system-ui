# Trader Archetype — Mira Tanaka (Senior Market Maker)

A reference profile of a top-performing market maker at a top-5 firm, used as a yardstick for what an ideal market-making terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

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

### Microstructure inputs

- **Queue position estimator** — for each of her resting orders, estimated position in the queue. Critical for fill probability.
- **Cancellation activity** — others canceling near top of book = informed traders fleeing? she should too.
- **Aggressive-order arrival rate** — how fast is the market eating liquidity?
- **Tick imbalance** — recent up-ticks vs down-ticks, micro-momentum signal.
- **Trade size distribution** — large prints vs small, signals informed vs retail flow.
- **Cross-venue lead-lag** — does Coinbase lead Binance on this name? Quote engine needs to know.

### Inventory & hedge context

Before tuning quotes she must see:

- **Current inventory per instrument** in $ and as % of inventory limit.
- **Hedge ratios** — how much of her inventory is hedged vs naked.
- **Hedge cost** — typical spread cost to lay off a unit of inventory.
- **Funding cost** — for perp inventory, current funding burn.

### Strategy parameter library

Quote-engine parameters per instrument:

- **Base spread** (bps from fair).
- **Inventory skew** — how much to lean quotes against current inventory.
- **Adverse-selection widening** — how much to widen after toxic fills.
- **Size at top of book.**
- **Layered sizing** — how much at each tick away from top.
- **Skew on signal** — book imbalance, lead-lag, momentum tilts.
- **Pause thresholds** — vol spike, latency degradation, news event triggers.

These are stored as named profiles she can swap (e.g. "BTCUSDT-quiet", "BTCUSDT-event-window").

**Layout principle for Decide:** the microstructure dashboard and inventory surface are constant peripherals. The parameter library is what she actively interacts with — she's not picking trades, she's picking _modes_.

---

## Phase 2: Enter

Mira does not "enter trades" in the discretionary sense. Her engine quotes thousands of orders per second. The **enter surface for her is the quote engine control panel + manual hedging tools**.

### Quote engine control panel

Per instrument, per venue:

- **Active / paused / quote-one-side / wind-down.**
- **Live parameter values** with sliders / inputs that take effect on next quote refresh.
- **Effective fair price** the engine is currently using (with model breakdown — what's pushing it).
- **Live quote stream** — last N quotes sent, see them stream by.
- **Order rate** — quotes/sec, cancels/sec, replaces/sec, vs venue rate limit.
- **Fill rate** — fills per minute, broken into top-of-book vs improvement.
- **PnL contribution** — bps captured per fill, running total.

### Quick parameter overrides

Fast, low-friction adjustments she makes constantly:

- **Widen all** — global widening multiplier, hotkey-bound.
- **Pull all** — cancel all quotes on instrument, hotkey-bound.
- **Skew long / skew short** — bias quotes one way, hotkey-bound.
- **Reduce size** — multiply top-of-book size by X%.
- **Pause N seconds** — short pause through a known-bad window.

Hotkeys here are **non-negotiable**. Mouse latency is too slow.

### Manual hedging ticket

When inventory exceeds threshold, the engine auto-hedges; but Mira can manually hedge or accelerate:

- Aggressive market order across her hedge venue.
- Cross-venue hedge — cheapest venue right now.
- Options hedge for tail risk on large inventories.
- Bracket hedges (hedge + stop on hedge) for exotic books.

### Pre-deployment sandbox

Before changing parameters live, she can run them in **shadow mode**:

- Engine receives same data feed, computes what it would have quoted, doesn't send.
- Compare shadow PnL vs live for N minutes before promoting.

### Kill switches

- **Per-instrument kill** — cancel all, stop quoting that instrument.
- **Per-venue kill** — pull all from a venue (e.g. when venue degraded).
- **Engine kill** — stop everything. Big red. Hotkey + mouse + foot pedal (yes really).

**Layout principle for Enter:** the parameter control panel is where her hands live. Hotkeys for the most common adjustments. Shadow mode for anything novel.

---

## Phase 3: Hold / Manage — running the quote engine live

Mira is not "holding a position" the way Marcus is. She's **running a process** that constantly opens and closes positions. The Hold surface is therefore a **live operations console**.

### Per-instrument live state

For each instrument she's quoting:

- **Inventory position** — current, target (usually flat), distance from limit.
- **Skew applied** — current quote bias from inventory.
- **Effective fair** — the engine's mid estimate.
- **Quote stack** — bid layers + ask layers, sizes, queue positions.
- **Recent fills** — every fill streaming, with size, side, price, taker-or-maker.
- **Per-fill PnL** — captured edge in bps.
- **Adverse selection score** — moving avg of post-fill price movement (positive = informed flow against her).

### Inventory & hedge view

- **Aggregated inventory** per underlying across all venues.
- **Hedge state** — which venues / instruments are hedging which inventory.
- **Residual delta** — naked exposure after hedges.
- **Hedge cost realized today** — spread paid to lay off inventory.
- **Hedge effectiveness** — variance of residual PnL.

### Adverse-selection / toxic-flow monitor

The most important live surface for Mira:

- **Per-counterparty fill analysis** (where venue exposes counterparty IDs or proxies).
- **Time-since-fill price drift** — fills followed by adverse moves are flagged.
- **Toxicity score per session** — rising = stop quoting.
- **Suspicious patterns** — same-direction fills clustered tightly, signature of latency arbitrage against her.

### Microstructure live state

- **Spread / depth / book imbalance** real-time, all venues she quotes.
- **Vol rolling** at multiple horizons.
- **Lead-lag indicator** — am I quoting downstream of someone faster?
- **Cross-venue mid divergence** — venue arbitrage opportunity / risk.

### Latency & infra panel

Critical, always visible:

- **Round-trip latency per venue** — quote send to ack, in microseconds. Distribution, not just mean.
- **Market data latency** — feed lag from venue to her engine.
- **Time-since-last-tick per feed** — staleness alarm.
- **Co-location health** — server, NIC, kernel-bypass status.
- **Rate-limit headroom** per venue.
- **Order rejects** rate and reasons.
- **Engine queue depth** — internal events waiting to process.

### PnL panel — granular

- Realized today by instrument, by venue.
- Spread captured (gross), minus adverse selection, minus hedge cost, minus fees, equals net.
- Each component visible separately so she sees where edge is leaking.

### Alerts

- **Inventory limit approach.**
- **Adverse-selection spike.**
- **Latency degradation** beyond threshold.
- **Reject rate spike.**
- **Cross-venue divergence** beyond historical bound.
- **Quote engine stalls** — no quote sent in N seconds.
- **News event arriving** — auto-pause or warn.
- **Funding rate change** for perp inventory.

### Kill switches

Same as before, plus a **panic auto-flatten** that hits the cheapest venues first.

**Layout principle for Hold:** the live operations console is dense. Mira reads it the way a pilot reads a cockpit — peripheral awareness of dozens of indicators, foveal attention only when something amber turns red.

---

## Phase 4: Learn

The most analytics-heavy phase for any market maker. Edge is microscopic per fill; only aggregation reveals truth.

### Fill-level analytics

Every fill is a data point:

- **Captured edge in bps** at fill time vs fair.
- **Realized edge** — captured edge minus subsequent adverse drift over T seconds.
- **Hedge cost incurred** for inventory created.
- **Net per-fill PnL.**

Distributions matter more than means here.

### TCA — market-making style

Different from Marcus's TCA:

- **Per-quote analysis** — quotes that filled vs canceled vs missed (lifted by fast traders).
- **Fill rate at top of book** — % of time at top, fill rate when there.
- **Queue position realized** — engine estimate vs actual fill order.
- **Adverse selection by counterparty class** — retail / informed / latency-arb / unclear.
- **Quote-to-fill latency distribution** — were there cases of stale quotes filled?

### Inventory analytics

- **Inventory time series** per instrument — how long does inventory persist?
- **Inventory PnL** — was holding inventory positive or negative on average?
- **Hedge slippage** — realized vs theoretical hedge cost.

### Parameter performance

For every parameter profile:

- PnL in bps per $ traded.
- Fill rate.
- Adverse selection.
- Inventory variance.
- By regime — same profile in different regimes, does it adapt or break?

### Venue performance

- **Per-venue PnL bps.**
- **Per-venue fill rate.**
- **Per-venue adverse selection.**
- **Per-venue latency.**
- **Per-venue rebate / fee economics.**

Drives venue ranking and capital allocation.

### Toxic-flow analysis

- Counterparty (or proxy) PnL leaderboard — who consistently picks her off?
- Time-of-day toxicity profile.
- Event-window toxicity (around news, funding, settlement).

### Latency / infra retrospectives

- **Latency distribution over the day** — tail spikes correlate with PnL drops?
- **Reject reason analysis.**
- **Replay latency-degraded windows** — what was the engine doing, what was the cost.

### Replay

- **Microsecond-level replay** of the order book + her quote stack + her fills.
- Scrub through a session, see exactly what happened.
- Test parameter changes against historical micro-data.

### Reports

- Daily edge / fill / inventory report.
- Weekly venue scorecard.
- Monthly toxic-flow review.
- Compliance reports as required.

**Layout principle for Learn:** distributions, not point estimates. Dense analytical workspace. Replay tooling is heavily used.

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
