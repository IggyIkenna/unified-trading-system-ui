# Persona — Elena Costa (External Client / Allocator)

A reference profile of an external client who allocates capital to the firm and consumes the **client-facing** side of the platform. She is not a trader. She is an investor. Her experience is the opposite end of the platform from Marcus, Julius, Mira, Sasha, and Quinn.

This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For the trader archetypes whose work Elena consumes, see the other `trader-archetype-*.md` files.
For the supervisor whose decisions surface to her, see [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md).

---

## Who Elena Is

**Name:** Elena Costa
**Role:** Senior Allocator / Investment Lead
**Organization:** Family office or institutional allocator (pension, endowment, sovereign wealth fund) with $5B – $50B AUM
**Capital invested with our firm:** $50M – $500M, in one or several share classes / strategies
**Style:** Long-horizon allocator. Reviews quarterly, attends manager meetings, oversees a portfolio of ~20 external managers.
**Sophistication:** High. She understands Sharpe, drawdowns, factor exposures, regime, attribution. She is not retail.

### How she thinks differently from a trader

Elena does **not** make trading decisions. She:

- **Selects and monitors managers** — chooses which firms to allocate to.
- **Allocates and rebalances** across managers based on performance, correlation, capacity.
- **Reports upward** — to her own CIO, board, beneficiaries.
- **Oversees risk** — but at the manager level, not position level.
- **Makes redemption / subscription decisions** — increase, decrease, or pull capital.

Her time horizon is **quarters and years**, not seconds. Her tolerance for poor data is **zero** — wrong numbers in a client report are a fireable offense, on either side.

### What she values

In rough order:

1. **Trust** — accuracy, transparency, predictability of communication.
2. **Performance** — net of fees, vs benchmark, vs peers.
3. **Risk discipline** — drawdowns within stated bounds, no surprises.
4. **Operational integrity** — funds where they should be, reporting on time, NAV correct.
5. **Narrative** — she has to explain to her board why returns are what they are.
6. **Access** — she can ask questions and get clear answers.

She does **not** value:

- Real-time tick data.
- Flashy charts or animation.
- Trader-side jargon (alpha, gamma scalping, vega).
- Granular position detail beyond what's relevant for risk discussion.

---

## Physical Setup

**Laptop or tablet, occasional desktop.** She is not at a trading desk. She uses the platform from her office, from a board meeting, from home, from a flight.

The platform must work on:

- **Desktop browser** (primary).
- **Tablet** for board meetings.
- **Mobile** for quick checks (NAV, alerts, recent communications).
- **Email / PDF attachments** — reports she forwards to her own committee.

She uses the platform **occasionally, not continuously** — once a day to glance at NAV, weekly for performance, monthly/quarterly for deeper review. Sessions are short. Information must be **front-loaded**.

---

## Phase 1: "Decide" — allocate / rebalance / subscribe / redeem

For Elena, the decisions are: invest more, hold, reduce, redeem, switch share class.

### Performance summary view (her landing page)

When she logs in, she sees first:

- **NAV today, change vs prior day, MTD, QTD, YTD, ITD (since inception).** Net of fees.
- **Capital invested today** — current balance.
- **Recent activity ribbon** — last subscription, last redemption, last fee accrual, last distribution.
- **Performance chart** — equity curve since inception, with toggle for time window.
- **Benchmark comparison** — vs a benchmark she or the firm chose (BTC buy-and-hold, BTC perp funding, custom index, peer median).

### Performance metrics (sufficient detail for an institutional allocator)

- **Annualized return** (1y, 3y, 5y, ITD).
- **Volatility** (annualized).
- **Sharpe / Sortino.**
- **Max drawdown, current drawdown, time underwater.**
- **Worst month, worst quarter.**
- **Up-capture / down-capture vs benchmark.**
- **Hit rate** of positive months.
- **Correlation** to benchmarks and to her other holdings (if she has uploaded her portfolio).

### Attribution she cares about

Elena does **not** want trader-level attribution (vega vs theta). She wants:

- **By strategy** (e.g. "directional," "basis arb," "vol short," "yield strategies").
- **By underlying asset class** (BTC, ETH, alts, stables).
- **By regime** (bull / bear / chop) — explanatory narrative more than scientific.
- **Gross vs fees vs net.**

### Risk overview

- **Current exposure summary** — gross, net, leverage, vol target.
- **Risk capacity vs deployed.**
- **Stress test results** — "in a 2022-style drawdown, fund expected to lose X%."
- **Counterparty list** — anonymized or named per agreement; she wants to know "this fund deals with these CEXs and these protocols."
- **Liquidity profile** — how fast can the fund return capital if she redeemed.

### Manager information

- **Strategy description** — written, updated quarterly.
- **Team** — key personnel, recent changes.
- **Capacity status** — fund open / soft-closed / hard-closed.
- **Recent commentary** — letters, market notes, regime view.

### Subscription / redemption interface

- **Submit subscription / redemption** with required documentation flow.
- **Subscription / redemption schedule** — next windows, lockups, gates if any.
- **Pending requests** with status.
- **Capital call notifications** if applicable.
- **Documents** — subscription docs, redemption forms, KYC refresh requests.

### Fee transparency

- **Management fee accrual** — running.
- **Performance fee accrual** — with high-water mark visible.
- **Fee schedule** by share class.
- **Fee paid YTD / ITD.**

**Layout principle for Decide:** front-load the most important numbers (NAV, performance, drawdown). Everything else is a click away. Mobile-friendly.

---

## Phase 2: "Enter" — placing capital actions

Her "enter" actions are entirely capital movements, not trades.

### Subscription flow

- **Pick share class.**
- **Specify amount.**
- **Wire instructions** — preferably with bank-integrated funding for institutions on the same network.
- **Documentation upload** if KYC refresh required.
- **Confirmation** with reference number, expected effective date / NAV.

### Redemption flow

- **Pick amount and share class.**
- **Acknowledge gates / lockups / fees.**
- **Confirm wire destination.**
- **Submit; receive confirmation and timeline.**

### Switching between share classes / strategies

For multi-strategy firms — move capital between sleeves with appropriate fees and effective dates.

### Communication actions

- **Schedule a call** with the investor relations team or PM.
- **Submit a question** with expected response time.
- **Request bespoke data** — e.g. "send me a custom report for my CIO meeting."

### Audit trail of her own actions

- Every subscription, redemption, switch, document uploaded — visible with date, amount, status.

**Layout principle for Enter:** these are infrequent, important actions. Every step is explicit, with confirmations and a clear paper trail.

---

## Phase 3: "Hold" — monitoring her allocation

Elena does not manage her allocation continuously. She glances at it.

### Daily glance view (mobile-friendly)

- **NAV today, change.**
- **Drawdown if any.**
- **Any alerts** — operational, performance, risk.
- **Any pending actions** — documents to sign, calls scheduled.

### Weekly view

- **Performance week-to-date** vs benchmark.
- **Letter / commentary** if published.
- **Risk and exposure summary** updated.

### Monthly view

- **Monthly statement** — formal, downloadable PDF, suitable for her own auditor.
- **Performance report** — full metrics package.
- **Strategy commentary** — what worked, what didn't.
- **Any notable events** — strategy launches, retirements, personnel changes, capacity status.

### Quarterly view

- **Quarterly letter** — narrative, market outlook, strategy outlook.
- **Risk committee summary** — published version of internal risk discussions she's entitled to see.
- **Manager meeting** — calendared.
- **Regulatory / compliance disclosures** as required.

### Alerts (sparingly)

Elena does **not** want noisy alerts. She wants:

- **NAV alerts** — large daily move.
- **Drawdown alerts** — fund crosses a stated threshold.
- **Operational alerts** — wire received, redemption processed, document required.
- **Strategic alerts** — capacity changes, fee changes, key personnel changes, fund-level events.
- **Personalized notifications** — only what she's opted into.

### Document vault

- All her statements, K-1s, tax docs, subscription agreements, NDAs — searchable, downloadable.
- **Audit history** of who accessed her account when.

### Communications log

- Every email, call note, meeting summary with the firm.
- Searchable. Useful for "what did the PM say about Q3 vol exposure?"

**Layout principle for Hold:** quiet by default. The platform should not feel like a trading screen. She should feel **informed without being overwhelmed**.

---

## Phase 4: "Learn" — review and reporting

Elena needs to **explain** to her own organization what's happening with this allocation.

### Reporting suite

- **Daily NAV / position summary** (where contractually entitled).
- **Weekly performance update.**
- **Monthly full report** — performance, risk, attribution, exposures, narrative.
- **Quarterly letter** — long-form, suitable for her board.
- **Annual report** — audited financials, full disclosures.
- **Custom reports** — on request, with SLA.

All available in:

- **Web view** (interactive).
- **PDF** (clean, branded, suitable for forwarding).
- **Excel / CSV** (so she can integrate with her own systems).
- **Email digest** (delivered on schedule).

### Custom dashboards

- She can build views relevant to her CIO meetings.
- Save and share with her own team.

### Performance attribution narrative

Critically important: numbers without narrative are useless to her board. The reports must include:

- **What went right and why** in plain language.
- **What went wrong and why** in plain language.
- **What is being done about it.**
- **What to expect in current conditions.**

This is generated by the firm's PM team but surfaced through the platform.

### Peer / benchmark comparison

- Vs benchmarks contractually agreed.
- Vs peer median (where data services provide it).
- Vs her own portfolio of managers (if she chooses to upload).

### Compliance & regulatory

- **Tax documents** (K-1s, 1099s, equivalent international forms).
- **Regulatory filings** copied where applicable (Form PF, AIFMD, etc.).
- **Audit confirmation** — independent administrator's sign-off on NAV.

### Manager evaluation

- **Style consistency** — has the manager drifted from stated mandate?
- **Trade transparency** (where contractually agreed).
- **Operational due diligence** materials — recent audits, SOC reports, BCP.

### Comparison with prior periods

- **YoY performance comparison.**
- **Same-period regime fit** — "this fund has historically struggled in conditions like Q3."

**Layout principle for Learn:** print-ready, narrative-rich, integrated with her own systems. The fund's reporting is part of _her_ reporting.

---

## What Ties Elena's Experience Together

1. **Trust over flash.** Accurate, predictable, explained — not flashy.
2. **Front-loaded summaries.** Most important info first; she has 90 seconds.
3. **Multi-modal access.** Web, mobile, PDF, email digests, Excel exports.
4. **Quiet by default.** Alerts only for what truly matters; no marketing noise.
5. **Narrative attached to numbers.** Explanations in the manager's voice, not just metrics.
6. **Document-vault discipline.** Every statement, contract, communication is retrievable forever.
7. **Audit trail of her own actions.** She must be able to prove what she did, when, and why.
8. **Regulatory and tax integration.** Reports she can hand to her auditor without rework.
9. **Tiered access.** Granular control over what data she sees per share class / agreement.
10. **Operational excellence is the product.** Late wires, wrong numbers, missed reports — these end relationships. The platform must make these impossible.

---

## What She Should Never See

Important inverse list — things the platform must **hide** from her:

- Other clients' positions, capital, or identities.
- Trader names or trader-level PnL (unless agreed).
- Position-level granularity beyond what's contractually agreed.
- Internal risk discussions she's not entitled to.
- Other share classes' fee terms.
- Pre-public commentary, drafts, or internal notes.
- Operational dashboards (latency, infra, etc.) — her concern is outcomes, not plumbing.

Tiered access and data segregation are non-negotiable.

---

## How to Use This Document

When evaluating any client-facing surface (including our own), walk through Elena's four phases and ask:

- Does the landing page front-load the right summary numbers in <90 seconds of glance?
- Is performance reporting (web + PDF + Excel + email) at institutional quality?
- Is the subscription/redemption flow auditable, with confirmations and SLA?
- Are alerts scoped tightly to what an allocator needs?
- Is narrative — written explanation in the manager's voice — attached to performance numbers?
- Is access tiered correctly so she sees only her own data, scoped to her agreement?
- Is everything retrievable forever (statements, documents, communications)?
- Is the experience usable on mobile and exportable into her own workflow?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
