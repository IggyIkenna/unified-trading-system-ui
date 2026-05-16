# Persona — Priya Anand (Platform Operations Lead)

A reference profile of the senior operator who runs the platform's operational substrate — venue and protocol registries, account and connectivity setup, entitlement administration, the release-bundle approval queue, and platform-level audit. She is not a trader. She is not a PM. She is the person who keeps the platform itself runnable, securable, and auditable.

This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the trader archetypes whose work depends on Priya's surfaces, see the `trader-archetype-*.md` files in the [INDEX](INDEX.md). For the supervisor whose firm-level risk view consumes Priya's audit feed, see [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md). For the external counterparty whose signal-leasing onboarding she manages, see [trader-archetype-sebastian-external-signal-provider.md](trader-archetype-sebastian-external-signal-provider.md).

For the 30 manual common surfaces, see [common-tools.md](common-tools.md). Priya consumes a small subset (audit trail, latency / connectivity, kill switches, compliance) and **owns** several others (entitlements, venue registry, account setup) that the trader docs treat as ambient.

---

## Who Priya Is

**Name:** Priya Anand
**Role:** Head of Platform Operations
**Firm:** Top-5 global trading firm — same firm as the trader archetypes.
**Reports to:** COO / CTO depending on org. Peer of David (PM/Risk).
**Owns:** Venue and protocol registry; account / API-key / wallet onboarding and rotation; entitlement administration; release-bundle approval workflow; platform audit + permission management; incident response coordination; vendor / counterparty relationships from the operational side.

### How she thinks differently from a trader

Priya does **not** look at PnL per strategy. She does not allocate capital. She is not paged by signal alpha. She is paged by:

- A venue is degraded.
- A wallet rotation is overdue.
- A signer-quorum approval has been pending for 4 hours.
- A release bundle's approval checklist is blocking promotion.
- An entitlement audit found a stale account.
- A new vendor onboarding is missing a contract reference.
- The platform's own infra (data lake, feature compute, model registry, BigQuery sink) has a freshness or capacity issue.

Her edge is **judgment about platform-level risk surface and operational hygiene**, separate from market-level risk (David's domain) and strategy-level alpha (the traders').

### Her cognitive load

Priya holds in her head:

- The current state of every venue / protocol / data-source connection: live, degraded, paused, retired.
- The current account roster: which trader / strategy / mandate uses which exchange account / wallet / sub-account / API key, and which keys are due for rotation.
- The current entitlement matrix: which user has access to what, with audit timestamps.
- The current release-bundle approval queue: what's pending, what's blocked on whom, what's overdue.
- The platform's incident state: what's open, what's mitigated, what's in post-incident review.
- The firm's current obligations under data licenses, exchange contracts, regulatory permissions.

The terminal must **compress** all of this. She is a pattern-matcher across a wide surface of operational state.

---

## Physical Setup

**3 monitors** plus pager / mobile.

| Position     | Surface                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top-left     | **Platform health board** — venues / protocols / data feeds / compute / message queues, with traffic-light indicators                               |
| Top-right    | **Account & connectivity registry** — trader / strategy / mandate / venue / wallet / sub-account / API-key matrix, rotation calendar, signer roster |
| Bottom-left  | **Release-bundle approval queue + entitlement administration + audit log**                                                                          |
| Bottom-right | **Incident console** — open incidents, post-mortem queue, vendor / counterparty escalations                                                         |

Mobile / pager: 24×7 on-call rotation. Critical alerts (venue down, wallet quorum stuck, audit anomaly, regulatory deadline imminent) page her.

---

## Phase 1: Decide

Priya's "Decide" is **what needs platform-side action today, this week, this quarter?**

### Surfaces used

- **Platform health board.** Every venue / protocol / data feed / compute service / queue with health status, recent incidents, current SLO compliance. Aggregated into a one-glance status; drilldowns into specifics.
- **Rotation calendar.** Wallet / signer / API-key / vendor-credential rotation due dates. Overdue items flagged. Periodic audit reminders (quarterly entitlement review, annual venue-credential refresh).
- **Release-bundle approval queue.** Bundles waiting for operational sign-off (account routing valid, treasury operational config in place, entitlement matrix updated). Sorted by submission age; oldest first.
- **Entitlement / permissions audit.** Stale accounts (no activity > N days), users with elevated permissions, recent permission grants without justification, segregation-of-duties violations.
- **Vendor / counterparty calendar.** Contract renewals, credential expiries, regulatory submission deadlines, audit windows.
- **Incident retrospective queue.** Recent incidents pending post-mortem, action items in flight, recurring patterns flagged.

She prioritises by:

- **Imminent risk.** Anything that can cause a customer / client / regulator-visible failure in the next 24h is foveal.
- **Compliance deadline.** Regulatory submissions, audit windows, contractual SLAs are non-negotiable.
- **Trader / Sebastian / David friction.** If a release-bundle approval is blocking a trader, she clears it.
- **Operational hygiene drift.** Stale rotations, untouched accounts, expired credentials.

---

## Phase 2: Enter

Priya's "Enter" is **operational changes** — provision an account, rotate a key, register a venue, approve a bundle, grant an entitlement, retire a wallet. Each is a typed, audited action; not a free-form trade.

### Surfaces and actions

- **Venue / protocol registry editor.** Add, modify, retire a venue or DeFi protocol. Each change carries a contract reference, a list of affected strategies, an effective date, and an audit entry. Some changes (retiring a venue with live positions) require trader sign-off before executing.
- **Account & connectivity provisioning.** Add a new exchange account / sub-account / wallet / API key. Workflow: contract verified, KYC documented, signer policy assigned, withdrawal limits set, rotation schedule registered. Audit log attached.
- **Entitlement administration.** Grant / revoke role-based access. Every change requires a justification field. Sensitive grants (admin / risk-override / kill-switch authority) route to a second approver.
- **Release-bundle approval.** Per-bundle checklist: treasury operational config in place, account routing valid, entitlements updated, regulatory tags correct. Sign or send back with notes. Audit-logged.
- **Incident response actions.** Acknowledge, assign, escalate, resolve, mark for post-mortem. Trader-side kill-switch coordination — she can globally pause a venue or a connectivity stack if needed (in coordination with David and on-call traders).
- **Vendor / counterparty changes.** Renew, modify, terminate. Always tied to a contract reference and a notification to dependent users.

Every action is **typed, audited, and reasoned**. Priya never makes operational changes via a free-text command line.

---

## Phase 3: Hold / Manage — running the platform

Most of Priya's day is **anomaly-driven supervision** of the operational layer.

### Surfaces foveal during the day

- **Platform health board** stays in peripheral vision; degraded venues / protocols / feeds page automatically.
- **Connectivity dashboard.** Per-venue / per-protocol / per-feed: latency, error rate, rate-limit headroom, recent incidents. Drilldown to per-account / per-strategy impact.
- **Audit feed (live tail).** Every operational change platform-wide, time-ordered, with actor + reason. She skims; on-call team escalates anomalies.
- **Pending-approvals queue.** Release bundles, signer-quorum requests, entitlement-grant requests, vendor-change tickets — all in one queue, sortable by age / urgency / requester.
- **Incident console.** Open incidents, time-since-acknowledgement, mitigation status, blast-radius assessment.
- **Capacity headroom.** Compute / storage / message-queue / data-feed quotas, current consumption, projected exhaustion, planned scaling.

### What she does

- **Continuous skim of the audit feed.** Trains her pattern-matcher; catches subtle drifts before they become incidents.
- **Drain the approval queue.** Bundles cleared, entitlement requests granted or sent back, signer quorums chased.
- **Coordinate during incidents.** Co-ordinate with traders (which strategies to pause), with David (firm-level risk implications), with vendors (escalation), with compliance (notification obligations).
- **Run the rotation cadence.** Wallet rotations, key rotations, signer reviews, vendor credential refresh — none should be late.
- **Review entitlement audits.** Quarterly: every elevated permission re-justified or revoked. Stale accounts retired.

This is mostly invisible to traders; the moments when it becomes visible (a venue is down; a release is stuck) are her hardest moments.

---

## Phase 4: Learn

Priya's "Learn" is **post-incident, post-quarter, post-audit retrospectives**.

### Surfaces

- **Incident retrospectives.** Every incident — root cause, timeline, blast radius, action items, owner, due date, completion status. The corpus of past incidents is searchable; recurring patterns surface (same vendor, same connection type, same time-of-day).
- **Operational-change retrospective.** Aggregates: how many bundle approvals last quarter, average time-to-approval, blocked-on-whom distribution. Trends inform process improvements.
- **Audit retrospective.** Internal / external audits — findings, remediation status, repeat findings (the most damning).
- **Vendor / counterparty performance.** Uptime, incident count, contract SLAs honoured, contract renegotiation evidence.
- **Capacity / cost retrospective.** Compute spend, data-license spend, cloud spend by service. Optimisation opportunities. Drives next quarter's procurement.

She presents quarterly to the COO + audit committee + risk committee. Material risks become next-quarter's priorities.

---

## What Ties Priya's Terminal Together

1. **Audit is the unifying spine.** Every operational change — provision, rotate, retire, grant, revoke, approve — is an audit event with actor + timestamp + reason + pre/post state. Her terminal is, fundamentally, an audit-feed authoring + supervision tool.
2. **Operational changes never silently bump strategy versions.** Rotating a wallet, refreshing an API key, retiring a vendor's old endpoint: all audited, none touch the strategy-side release artifact (see cross-cutting principle #11 in [INDEX.md](INDEX.md)). Treasury policy lives in the release bundle; treasury operations live in her registry — and the discipline is rigorous (see [automation-common-tools.md §10.5](automation-common-tools.md)).
3. **Entitlement is gateway to every other surface.** Who can read what, who can write what, who can approve what — Priya owns the matrix, and every other surface defers to it.
4. **Release-bundle approval queue is where she meets the traders.** Bundles are authored in Research; approved for live by Priya (operational checks) + David (risk checks) + the bundle's owner (trader sign-off). Her checklist is operational, not market-level.
5. **Incident response is foveal when it happens, peripheral when it doesn't.** Default state: green. Pages her only on actual breakage. Shoulder-tap from on-call traders when shared decisions are needed.

---

## How to Use This Document

Walk through Priya's four phases and ask:

- Does the platform expose a **venue / protocol / data-source registry** as a typed, auditable surface, or is it a config file managed by tribal knowledge?
- Is **account / wallet / API-key / signer-policy** managed in a typed registry with rotation calendars and audit logs, or scattered across Vault / SecretsManager / spreadsheets?
- Is **entitlement administration** a typed surface with justification fields and audit, or is it ad-hoc role grants?
- Is the **release-bundle approval queue** a real workflow with operational + risk + owner sign-offs, or is "promotion" a Slack message?
- Is the **audit feed** a live, searchable, complete platform-wide event stream, or are audit logs scattered per-service?
- Is the **incident console** integrated with the trader-side kill-switch and the firm-level risk view, or do incidents and trades live in separate worlds?
- Is **capacity headroom** (compute, storage, data licenses, vendor quotas) visible to the operations lead **before** something breaks, or only after?

Gaps against this list are platform debt. They may not be the trader's problem today, but they will be — through an outage, an audit finding, a regulatory failure, or a stale credential incident.

For the supervisor whose firm-level risk view consumes Priya's audit feed and incident state, see [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md). For the external counterparty whose onboarding she manages, see [trader-archetype-sebastian-external-signal-provider.md](trader-archetype-sebastian-external-signal-provider.md).
