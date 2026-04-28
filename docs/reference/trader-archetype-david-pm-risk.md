# Trader Archetype — David Reyes (Portfolio Manager / Head of Risk)

A reference profile of the senior PM / Head of Risk who sits **above** the trading desk — overseeing all traders, all strategies, all venues, and the firm's aggregate exposure. Used as a yardstick for what an ideal supervisory terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For shared surfaces (charting, blotters, risk, reports, etc.), see [common-tools.md](common-tools.md).
For an index of David's unique surfaces, see [unique-tools.md](unique-tools.md).
For the trader archetypes David supervises, see the other `trader-archetype-*.md` files.

---

## Who David Is

**Name:** David Reyes
**Role:** Senior Portfolio Manager / Head of Risk
**Firm:** Top-5 global trading firm
**Book size:** Aggregate firm crypto/digital-assets book — $5B – $15B notional, with $1B – $3B of risk capital at any moment.
**Style:** Does not place trades himself (rare exceptions). Allocates capital, sets risk limits, monitors the desk, makes go/no-go decisions, faces clients and the risk committee.
**Reports to:** CIO, risk committee, board.
**People who report to him:** Marcus, Julius, Mira, Sasha, Quinn (the trader archetypes), plus operations and compliance leads.

### How he thinks differently

David's job is **not** to find alpha. It's to:

- **Allocate capital** across traders and strategies based on edge, capacity, and correlation.
- **Set and enforce risk limits** at trader, strategy, and firm level.
- **Monitor the aggregate book** for hidden concentrations, correlations, and tail exposures.
- **Make intervention decisions** — pull risk, increase risk, kill a strategy, fire a trader's parameters.
- **Face stakeholders** — clients ask why returns are what they are; the risk committee asks "are we safe?"; the regulator asks "show me your records."
- **Plan capacity** — the firm has limits (capital, leverage, counterparty); David allocates them.

His edge is **judgment under aggregation**. Traders see their own books. He sees the whole.

### His cognitive load

David must hold in his head:

- Each trader's recent performance and behavioral state ("is Marcus tilted? is Sasha overconfident on this skew trade?").
- Each strategy's regime fit.
- The firm's aggregate exposure — net delta, net vega, counterparty concentration.
- Capital efficiency — is risk capital deployed where it earns the most Sharpe?
- Client-facing narratives — what story explains last week's PnL?

The terminal must **compress** this. He's pattern-matching across an enormous surface.

---

## Physical Setup

**4 monitors** — fewer than traders, because his job is overview, not micro-action.

| Position     | Surface                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| Top-left     | **Firm-wide aggregate book** — exposure, PnL, risk by underlying / venue / strategy / trader |
| Top-right    | **Risk limits dashboard** — every trader / strategy vs limit, breaches highlighted           |
| Bottom-left  | **Trader & strategy health board** — performance, behavior, recent interventions             |
| Bottom-right | **Capital allocation, capacity, correlation matrix** — meta-view                             |

Plus a private office display for client/risk-committee meetings (large screen, presentation-ready dashboards).

He moves between his desk (live monitoring) and his office (review, planning, stakeholder calls) throughout the day.

---

## Phase 1: Decide

For David, "decide" is mostly **capital allocation and limit-setting**, plus go/no-go calls on strategy promotions and client capital changes. He rarely consults a chart for trade timing; charts are context for narrative.

### Shared surfaces (firm-aggregated)

- See [Charting](common-tools.md#1-multi-timeframe-charting). **David-specific characteristics:** glanced for narrative, not entry timing; favours weekly/daily over intraday.
- See [Calendar](common-tools.md#12-catalyst--event-calendar). **David-specific:** filters to firm-material catalysts (FOMC, ETF flows, protocol upgrades) and to events that touch multiple desks.
- See [News & Research Feed](common-tools.md#13-news--research-feed). **David-specific:** macro and counterparty/venue/protocol streams are the priority; trader-shared notes surface as desk pulse.
- See [Heatmap of Own Book](common-tools.md#16-heatmap-of-own-book). **David-specific:** firm heatmap aggregated across all traders and strategies — used to spot hidden cross-desk concentrations.

### Capital allocation context (David-unique)

- **Firm-wide capital** — total, deployed, free, in-flight (bridges, settlements).
- **Per-trader / per-strategy / per-venue capital** — allocated, used, free.
- **Capital efficiency** — Sharpe per $ allocated, by trader and strategy.
- **Per-strategy expected Sharpe and capacity** (research vs. live), with diminishing-returns curves.
- **Marginal allocation** — incremental Sharpe of adding $X to strategy A.

### Risk-budget and correlation context (David-unique)

- **Total risk budget** (VaR or stress-loss target) and **risk consumed** by each trader / strategy.
- **Risk-adjusted return** and top contributors to firm VaR.
- **Correlation matrix** — trader×trader, strategy×strategy, asset×asset at firm level, with **hidden-correlation flags** for books that should be uncorrelated but are drifting.

### Macro / regime and client capital (David-unique)

- **Regime indicators** (vol / liquidity / macro) — used to set **firm posture**, with regime-fit annotations per strategy.
- **Client capital** (for firms with external capital) — AUM by client / strategy / share class; net flows today / WTD / MTD; subscription / redemption pipeline; high-water marks; fee accrual.

**Layout principle for Decide:** capital allocation and correlation matrix are most-glanced. Regime and macro are peripheral peripherals.

---

## Phase 2: Enter

David rarely enters trades. His "enter" actions are **capital allocation changes, limit changes, strategy promotion gates, authorizations, and interventions** — every one signed and audited.

### Shared surfaces (firm-scoped)

- See [Order Ticket](common-tools.md#2-order-entry-ticket-framework), [Pre-Trade Preview](common-tools.md#3-pre-trade-risk-preview), [Algos](common-tools.md#4-execution-algos-library), [SOR](common-tools.md#5-smart-order-router--multi-venue-aggregation), [Hotkeys](common-tools.md#6-hotkey-system). **David-specific:** rarely used directly; available for the rare manual override or unwind. Hotkeys are disabled by default — David's actions are deliberate, not muscle-memory.

### Capital allocation panel (David-unique)

Per trader / strategy:

- **Current allocation** with proposed change.
- **Effective immediately or scheduled** (e.g. tomorrow at session open).
- **Reason field** — mandatory, audited.
- **Approval workflow** — large changes require risk-committee co-sign.

### Risk-limit changes (David-unique)

Every limit, at every level — firm / trader / strategy / venue / counterparty — is editable from the same hierarchy view used in Hold (see Phase 3). Edits carry mandatory reason, timestamp, signature, and (for material thresholds) co-sign.

### Strategy promotion gate (David-unique)

When Quinn pushes a strategy from pilot → live, David is the final gate:

- Full promotion checklist + Quinn's notes.
- **Correlation impact** on the existing fleet.
- **Capacity and capital impact.**
- Approve / reject / send back with notes — signed and audited.

### Manual intervention ticket (David-unique)

Used to act on a trader's book — rare but real:

- **Pull risk** — instruct trader to reduce, with rationale.
- **Force flatten** — emergency override; cancels orders and flattens.
- **Pause trader / strategy** — disable entry capability for a window.
- **Change counterparty access** — revoke ability to trade a venue or protocol.

All four require a written reason and produce an immutable audit record.

### Client-facing actions (David-unique)

- Approve subscription / redemption above threshold.
- Reallocate client capital between strategies.
- Trigger client report off-schedule.
- Publish narrative — daily/weekly note attached to performance.

**Layout principle for Enter:** every action is friction-y, reasoned, and audited. David doesn't make impulsive decisions; the UI reinforces this.

---

## Phase 3: Hold / Manage — overseeing the firm

This is the bulk of David's day during market hours. The terminal is dense aggregation with drill-down: he reads dashboards, not order books.

### Shared surfaces (firm-aggregated)

- See [Positions](common-tools.md#7-positions-blotter), [Working Orders](common-tools.md#8-working-orders-blotter). **David-specific:** rolled up across all traders/strategies/venues, with drill-down to a single trader's blotter on click. Per-trader and per-strategy group-bys are first-class.
- See [Live PnL](common-tools.md#9-live-pnl-panel). **David-specific:** firm PnL with breakdown by trader / strategy / underlying / venue; intraday and session-to-date in one view.
- See [Risk Panel](common-tools.md#10-risk-panel-multi-axis). **David-specific:** firm-aggregated greeks (delta, gamma, vega, theta), net VaR (parametric / historical / Monte Carlo), gross exposure vs. leverage cap, single-name and counterparty concentration, margin utilization across venues, in-flight capital (bridges, settlements, deposits/withdrawals pending), stablecoin & cash dry powder.
- See [Stress Panel](common-tools.md#11-stress--scenario-panel). **David-specific:** firm-level stress library including BTC -20% / ETH -25% / alts -40% combo, all-IV +20v vol shock, USDC depeg to $0.95, "Binance halts withdrawals" venue shock, SPX -5% + BTC -15% cross-asset shock, plus custom scenarios. Each scenario shows firm loss + breakdown by trader / strategy / underlying.
- See [Alerts Engine](common-tools.md#14-alerts-engine). **David-specific:** firm aggregate alerts console — limit breaches at any level, concentration warnings, drawdown triggers, behavioral drift flags, fleet anomalies of high severity, external events (venue degradation, protocol exploits, depegs, oracle failures), operational (settlement failures, withdrawal delays, audit-trail gaps).
- See [Comms Panel](common-tools.md#17-communications-panel). **David-specific:** trader chat integrated; risk-committee notification rail with pre-formatted updates; desk-wide announcement broadcast.
- See [Latency / Connectivity](common-tools.md#18-latency--connectivity--infra-panel). **David-specific:** scoped to **per-venue and per-protocol health** rather than micro-latency — counterparty rating, recent incidents, bridge in-flight value, audit status of DeFi protocols, governance events.

### Per-trader tile board (David-unique)

For each trader (Marcus, Julius, Mira, Sasha, Quinn-fleet):

- PnL today / WTD / MTD / YTD in $ and Sharpe terms.
- Capital used / allocated; risk consumed / allocated.
- Behavioral health badge (see below).
- Recent interventions — was this trader recently warned or capped?
- Notes & flags.

Click a tile → drill into that trader's book.

### Behavioral health monitor (David-unique)

David watches for **trader behavioral drift**:

- **Overtrading** — sudden trade-frequency spike.
- **Position-sizing drift** — bigger sizes than recent average.
- **Hold-time drift** — shorter (revenge trading) or longer (anchored to losers).
- **Loss-cutting discipline** — % of trades hitting pre-defined stop.
- **Strategy-tag distribution shift** — drifting from mandate.

Each indicator carries history; sustained drift triggers an interventions conversation.

### Strategy fleet view (David-unique, Quinn-shared)

- Aggregate fleet PnL vs expectation.
- Strategy stages — counts in research, paper, pilot, live, retired.
- Strategy-level alerts surfaced when severe.

### Risk-limit dashboard (David-unique)

Every limit, every level — firm / trader / strategy / venue / counterparty — with current value and headroom:

- **80%+ utilization** highlighted amber, **95%+** red.
- Recent breaches with resolution status.
- Limit changes pending approval.

### Liquidity / unwind panel (David-unique)

- **Estimated unwind cost** to fully exit in 1 day, 3 days, 1 week.
- **Liquidity by venue** — which positions are illiquid.
- **Concentration vs venue daily volume.**

### Kill switches (David-unique scope on top of [common-tools.md#19-kill-switches-granular](common-tools.md#19-kill-switches-granular))

- Per-trader, per-strategy, per-venue kills (granular).
- **Firm-wide kill** — multi-key (David + CIO + risk officer) for catastrophic events.

**Layout principle for Hold:** dense aggregation, with drill-down. Color and badges drive attention; he doesn't read numbers that look fine.

---

## Phase 4: Learn

David's "learn" is institutional — reviews, post-mortems, planning, reporting. Most analytical work happens off-hours or during quiet periods.

### Shared surfaces (firm-aggregated)

- See [Replay](common-tools.md#20-replay-tool). **David-specific:** firm-wide replay — pick a date / time window and reconstruct the entire desk's state, including every trader's book and every alert that fired. Used for post-incident review (drawdown days, exploits, venue outages).
- See [Trade History](common-tools.md#21-trade-history--blotter-historical), [Attribution](common-tools.md#22-pnl-attribution-multi-axis), [Performance](common-tools.md#23-performance-metrics), [Equity Curve](common-tools.md#24-equity-curve), [TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **David-specific:** firm-level rollups — PnL attribution by trader / strategy / underlying / regime; firm Sharpe / Sortino / Calmar; drawdown analysis; capital efficiency by trader; risk consumed vs return generated. Per-trader and per-strategy retrospectives are drill-downs from the firm view.
- See [Behavioral Analytics](common-tools.md#26-behavioral-analytics). **David-specific:** read across the trader fleet, not for self-review; feeds the per-trader retrospective and compensation/mandate conversations.
- See [Reports](common-tools.md#27-reports). **David-specific:** client letters (per-client, gross/net of fees, benchmark, narrative-attached); regulator/auditor pulls; **risk-committee deck auto-prepared** weekly/monthly with firm performance, risk consumed, breaches, concentration evolution, stress scenarios, lifecycle changes, forward-looking risks.
- See [Compliance & Audit Trail](common-tools.md#28-compliance--audit-trail). **David-specific:** end-to-end audit of every authorization he's signed — capital changes, limit changes, promotions, overrides, interventions — alongside the standard trade audit trail. Retention guarantees.
- See [Strategy Tagging](common-tools.md#29-strategy-tagging-framework). **David-specific:** firm-level taxonomy used to roll up attribution and to track mandate adherence across traders.
- See [Layout](common-tools.md#30-customizable-layout--workspace). **David-specific:** desk workspace + private-office presentation workspace; the office workspace is presentation-ready (large fonts, narrative panels) for client and committee meetings.

### David-unique reviews

- **Capital efficiency** — Sharpe per $ allocated over time; reallocation history with outcomes; counterfactuals (what if we'd allocated differently?).
- **Risk retrospectives** — limit breaches and root cause; stress scenarios that materialized vs. pre-computed losses; counterparty and operational incidents with lessons and remediation.

**Layout principle for Learn:** workspace + drilldowns + report generation, mostly off-hours.

---

## What Ties David's Terminal Together

1. **Aggregation is the product.** Every number is rolled up across traders, strategies, venues, underlyings — but always drillable to the source.
2. **Limits are first-class.** Every position is contextualized against a limit, every breach is auditable.
3. **Behavioral telemetry on traders.** Not just performance — patterns of behavior that predict future performance and risk.
4. **Stress scenarios are precomputed.** "What if X happens?" answered in seconds, not hours.
5. **Counterparty / venue / protocol exposure is always visible.** Concentration kills firms; he sees it before it does.
6. **Audit trails are non-negotiable.** Every change he makes is timestamped, reasoned, signed.
7. **Communications are integrated.** Pinging traders, notifying committee, broadcasting to desk — all from the terminal.
8. **Reporting is automated.** Client letters, regulator reports, committee decks generated from the same data plane that runs the desk.
9. **Replay at the firm level.** Post-incident review requires reconstructing the entire desk's state at a moment.
10. **Kill switches are layered and protected.** Granular by scope (trader / strategy / venue / firm), strongly authenticated for the largest scopes.

---

## How to Use This Document

When evaluating any supervisory / risk terminal (including our own), walk through David's four phases and ask:

- Is firm-wide exposure (delta, vega, counterparty, leverage) visible at a glance?
- Are limits first-class objects with drill-down and audit?
- Can he allocate capital, change limits, promote strategies, with full audit trail?
- Are behavioral indicators on traders surfaced, not just performance numbers?
- Are stress scenarios precomputed and updated continuously?
- Are reports (client / risk committee / regulator) generated from the same data the desk runs on?
- Can the firm's state be replayed at a historical moment for post-incident analysis?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
