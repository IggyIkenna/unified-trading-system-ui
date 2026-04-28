# Trader Archetype — David Reyes (Portfolio Manager / Head of Risk)

A reference profile of the senior PM / Head of Risk who sits **above** the trading desk — overseeing all traders, all strategies, all venues, and the firm's aggregate exposure. Used as a yardstick for what an ideal supervisory terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
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

For David, "decide" is mostly **capital allocation and limit-setting**, plus go/no-go calls on strategy promotions and client capital changes.

### Capital allocation context

- **Firm-wide capital** — total, deployed, free, in-flight (bridges, settlements).
- **Per-trader capital** — allocated, used, free.
- **Per-strategy capital** — allocated, used, free.
- **Per-venue capital** — at each CeFi venue, in each on-chain wallet, across each prime broker.
- **Capital efficiency** — Sharpe per $ allocated, by trader and strategy.

### Edge / capacity context

- **Per-strategy expected Sharpe** (from research / backtests, validated against live).
- **Per-strategy capacity** estimates.
- **Marginal capital allocation** — if I add $X to strategy A, expected incremental Sharpe.
- **Diminishing-returns curve** per strategy.

### Risk-budget context

- **Total risk budget** — VaR or stress-loss target.
- **Risk consumed** by each trader / strategy.
- **Risk-adjusted return** per trader / strategy.
- **Risk concentration** — top contributors to firm VaR.

### Correlation matrix

- **Trader-vs-trader correlation** — daily PnL correlation between traders.
- **Strategy-vs-strategy correlation.**
- **Asset-vs-asset correlation** at firm level.
- **Hidden correlations** — strategies that _should_ be uncorrelated but are drifting toward correlation.

### Macro / regime view

David cares about regime not for trades but for **firm posture**:

- **Vol regime, liquidity regime, macro regime** — same indicators traders see.
- **Regime fit by strategy** — which strategies historically thrive in current regime.
- **Risk-on / risk-off proxy** for portfolio dial.

### Client capital context (for firms with external capital)

- **AUM by client / strategy / share class.**
- **Net flows in / out** today / WTD / MTD.
- **Subscription / redemption pipeline.**
- **High-water marks** per client.
- **Fee accrual.**

**Layout principle for Decide:** the capital allocation view and the correlation matrix are most-glanced. Regime and macro are peripheral peripherals.

---

## Phase 2: Enter

David rarely enters trades. His "enter" actions are:

- **Capital allocation changes** — increase/decrease a trader's or strategy's allocation.
- **Risk limit changes** — adjust per-trader, per-strategy, or firm-level limits.
- **Strategy promotion / demotion** — final go/no-go on lifecycle stage changes.
- **Counterparty allocation** — how much exposure can the desk take to Aave, to Binance, to a specific dealer.
- **Manual override / kill** — pull risk on a trader / strategy / venue.
- **Authorization actions** — approve large structures, approve out-of-policy exposures.

### Capital allocation panel

Per trader / strategy:

- **Current allocation** with proposed change.
- **Effective immediately or scheduled** (e.g. effective tomorrow at session open).
- **Reason field** — mandatory, audited.
- **Approval workflow** — large changes require risk committee co-sign.

### Risk limits panel

Hierarchy of limits, all editable with audit:

- **Firm-level**: gross exposure, net VaR, counterparty caps, single-name caps, leverage cap, drawdown trigger.
- **Trader-level**: same set, scoped to one trader.
- **Strategy-level**: capital, max position, max daily loss, max drawdown, kill-on-breach.
- **Venue-level**: max exposure to Binance, Bybit, Aave, etc.
- **Counterparty-level**: per dealer, per smart contract address.

Every change is timestamped, reasoned, signed.

### Strategy promotion gate

When Quinn pushes a strategy from pilot → live, David is the final gate:

- Sees the full promotion checklist + Quinn's notes.
- Sees correlation impact on the existing fleet.
- Sees capacity and capital impact.
- Approves / rejects / sends back with notes.
- Approval is signed and audited.

### Manual intervention ticket

When David intervenes in trader books (rare but real):

- **Pull risk** — instruct trader to reduce position, with rationale.
- **Force flatten** — emergency override; cancels orders and flattens, audited.
- **Pause trader / strategy** — disable their entry capability for a window.
- **Change counterparty access** — revoke ability to trade a venue or protocol.

### Client-facing actions

- **Approve subscription / redemption** above threshold.
- **Reallocate client capital** between strategies.
- **Trigger client report** generation off-schedule.
- **Publish narrative** — daily/weekly note attached to performance.

**Layout principle for Enter:** every action is friction-y, reasoned, and audited. David doesn't make impulsive decisions; the UI reinforces this.

---

## Phase 3: Hold / Manage — overseeing the firm

This is the bulk of David's day during market hours.

### Firm-wide aggregate book

The single most important view:

- **Net delta per underlying** at firm level. Often surprisingly different from sum-of-traders because hedges between desks may align or cancel.
- **Gross exposure** — sum of absolutes, vs leverage cap.
- **Net VaR** — parametric or historical or Monte Carlo.
- **Greeks aggregated** — delta, gamma, vega, theta — across all traders and strategies.
- **Counterparty concentration** — top exposures with limits visible.
- **Stablecoin & cash position** — dry powder, in $.
- **Margin utilization across venues** — close to any venue's haircut?
- **In-flight capital** — bridges, settlements, deposits/withdrawals pending.

### Per-trader tile board

For each trader (Marcus, Julius, Mira, Sasha, Quinn-fleet):

- **PnL today / WTD / MTD / YTD** in $ and Sharpe-ratio terms.
- **Capital used / allocated.**
- **Risk consumed / allocated.**
- **Behavioral health badge** — see below.
- **Recent interventions** — was this trader recently warned or capped?
- **Notes & flags.**

Click a tile → drill into that trader's book.

### Behavioral health monitor

David watches for **trader behavioral drift**:

- **Overtrading** — sudden trade-frequency spike.
- **Position-sizing drift** — bigger sizes than recent average.
- **Hold-time drift** — shorter hold times (revenge trading) or longer (anchored to losers).
- **Loss-cutting discipline** — % of trades hitting pre-defined stop.
- **Strategy-tag distribution shift** — trader drifting from his mandate.

Each indicator carries history; sustained drift triggers an interventions conversation.

### Strategy fleet view (Quinn-shared)

David watches Quinn's fleet at a higher level:

- **Aggregate fleet PnL** vs expectation.
- **Strategy stages** — how many in research, paper, pilot, live, retired.
- **Strategy-level alerts surfaced** when severe.

### Risk-limit dashboard

Every limit, with current value and headroom:

- Limits at 80%+ utilization highlighted amber.
- Limits at 95%+ red.
- Recent breaches with resolution status.
- Limit changes pending approval.

### Counterparty / venue health board

- Per venue: positions, working orders, open margin, counterparty rating, recent incidents.
- Per protocol (DeFi): exposure, audit status, recent governance events.
- Bridge in-flight value.

### Aggregate alerts console

- **Limit breaches** (any level).
- **Concentration warnings** — single-name, single-counterparty, single-strategy.
- **Drawdown triggers** — trader, strategy, firm.
- **Behavioral drift** flagged.
- **Strategy fleet anomalies** of high severity.
- **External events** — venue degradation, protocol exploit, stablecoin depeg, oracle failure.
- **Operational** — settlement failures, withdrawal delays, audit-trail gaps.

### Stress / scenario panel

Pre-computed PnL under stress scenarios:

- **Crypto-specific:** BTC -20%, ETH -25%, alts -40% simultaneously.
- **Vol shock:** all IV +20v.
- **Stablecoin shock:** USDC depeg to $0.95.
- **Venue shock:** Binance halts withdrawals.
- **Cross-asset shock:** SPX -5% + BTC -15%.
- **Custom scenarios** he can configure.

Each scenario shows firm-level loss + breakdown by trader/strategy/underlying.

### Liquidity / unwind panel

- **Estimated unwind cost** if firm needed to fully exit in 1 day, 3 days, 1 week.
- **Liquidity by venue** — which positions are illiquid.
- **Concentration vs venue daily volume.**

### Communications panel

- **Trader chat** integrated — ping a trader without leaving the terminal.
- **Risk committee notification** rail — pre-formatted updates ready to send.
- **Client / desk announcement broadcast** for desk-wide messages.

### Kill switches

- **Per-trader kill** — disable trader's order entry, optionally flatten.
- **Per-strategy kill.**
- **Per-venue kill** — pull all firm activity from venue.
- **Firm-wide kill** — multi-key (David + CIO + risk officer) for catastrophic events.

**Layout principle for Hold:** dense aggregation, with drill-down. He's reading dashboards, not order books. Color and badges drive attention; he doesn't read numbers that look fine.

---

## Phase 4: Learn

David's "learn" is institutional. Reviews, post-mortems, planning, reporting.

### Daily / weekly / monthly performance review

- Firm PnL with attribution by trader / strategy / underlying / regime.
- Sharpe, Sortino, Calmar at firm level.
- Drawdown analysis.
- Capital efficiency by trader.
- Risk consumed vs return generated.

### Trader retrospectives

- Per trader: PnL, Sharpe, hit rate, behavior trend, strategy mix evolution.
- Variance vs trader's stated mandate.
- Notes from interventions and conversations.
- Used for compensation, capital reallocation, mandate adjustments.

### Strategy retrospectives

- Synthesis of Quinn's strategy retrospectives at firm level.
- Decay analysis.
- Capacity vs allocation review.
- Promote / retire decisions made and outcomes.

### Risk retrospectives

- Limit breaches and root cause.
- Stress scenarios that materialized — how close were our pre-computed losses to actuals?
- Counterparty incidents and lessons.
- Operational incidents and remediation.

### Capital efficiency review

- Sharpe per $ allocated, evolving over time.
- Capital reallocation history with outcomes.
- Counterfactual: what if we'd allocated differently?

### Client reporting

- Per-client performance (if external capital).
- Net of fees, gross of fees.
- Benchmark comparison.
- Narrative attached to numbers.
- **Generation pipeline** for compliant client letters.

### Regulatory / compliance reporting

- Trade audit trail by request (regulator, auditor).
- AML / KYC trade-monitoring summaries.
- Position reports as required.
- Retention guarantees on logs.

### Risk committee deliverable

- Weekly / monthly committee deck auto-prepared:
  - Firm performance.
  - Risk consumed.
  - Limit breaches.
  - Concentration evolution.
  - Stress scenarios.
  - Trader/strategy lifecycle changes.
  - Forward-looking risks David flags.

### Replay — desk-wide

- Pick a date / time window — see firm's aggregate state then, including each trader's book and the alerts firing.
- Used for post-incident review (drawdown days, exploits, venue outages).

**Layout principle for Learn:** workspace + drilldowns + report generation. Most analytical work happens off-hours or during quiet periods.

---

## What Ties David's Terminal Together

1. **Aggregation is the product.** Every number he sees is rolled up across traders, strategies, venues, underlyings — but always drillable to the source.
2. **Limits are first-class.** Every position is contextualized against a limit, every breach is auditable.
3. **Behavioral telemetry on traders.** Not just performance numbers — patterns of behavior that predict future performance and risk.
4. **Stress scenarios are precomputed.** He can answer "what if X happens?" in seconds, not hours.
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
