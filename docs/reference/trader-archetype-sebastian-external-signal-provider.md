# Persona — Sebastian Kovac (External Signal Provider)

A reference profile of an external party who brings their own research and signal logic to a platform and uses that platform's infrastructure to execute, gate, supervise, and report. He is not an employee of the platform. He is a counterparty whose IP is the strategy and whose dependency is everything else.

This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the trader workflows whose surfaces Sebastian's signals flow into, see [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md), [trader-archetype-julius-hybrid.md](trader-archetype-julius-hybrid.md), and [trader-archetype-quinn-quant-overseer.md](trader-archetype-quinn-quant-overseer.md). For the supervisor whose firm-aggregate risk includes Sebastian's strategies, see [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md). For the platform-operations counterpart who provisions Sebastian's account, signal ingestion endpoint, and reporting tags, see [trader-archetype-priya-platform-ops-lead.md](trader-archetype-priya-platform-ops-lead.md).

For the 30 surfaces shared across the platform, see [common-tools.md](common-tools.md). Sebastian uses a **subset** of those surfaces and consumes them in a fundamentally different mode (no order ticket, no foveal positions blotter — the platform's _executor_ sees those; Sebastian sees how his signals translated into fills and how those fills attributed to his current external version).

---

## Who Sebastian Is

**Name:** Sebastian Kovac
**Role:** Founder / Head of Research, External Signal Provider
**Organization:** Boutique research firm or proprietary trading shop (5 – 50 people). May be a single PM with a strong track record, or a small quant team that has chosen to monetise their alpha via signal-leasing rather than running their own execution stack.
**Capital under signal:** $50M – $1B notional running through the platform's execution as the executor.
**Style:** Heavy research IP, light operational footprint. Built or bought their own data, features, models, and backtests. Did NOT build their own execution / clearing / custody / reporting / compliance stack — that is what they pay the platform for.
**Sophistication:** High on research; high on what the platform must do for them; deliberately lower on operational platform engineering (they offloaded it on purpose).

### How he thinks differently from a trader

Sebastian does **not** use the platform's research surface. He has his own. The platform is a **delivery layer** for his strategy IP:

- He runs his own research workspace (notebooks, feature library, model registry, experiment tracker) — none of those surfaces appear on his platform terminal.
- He emits **signals** (trade intentions) on a contractually-defined schema. Examples: _"go long BTC perp 100 contracts at limit 67250 GTC reduce-only no",_ or _"target portfolio weight 4.7% long EURUSD,"_ or _"stake 12 units on Sebastian-event-id-20260311-rugby-leg-A."_
- The platform converts his signals into orders, routes them, fills them, gates them against risk, settles them, and reports back: _"signal X turned into fills Y at price Z; here is your strategy version's P&L for the day."_
- He needs the platform to **honour his version tag** so his own retrospective ("how did v17 perform vs v16?") is reconstructable from platform-side data.

His mental model is closer to **a SaaS API customer with a P&L feedback loop** than to a trader.

### What he values

In rough order:

1. **Instruction fidelity.** What he sent equals what got executed (or, if not, why not — schema rejection, risk gate, capacity cap).
2. **Version-tagged attribution.** Every fill, every P&L line, every risk metric carries the external version that emitted the signal. His upgrades from v17 to v18 are measurable.
3. **Schema stability.** The signal payload schema doesn't break under his feet. Schema changes are versioned and forward-compatible with a deprecation window.
4. **Latency and reliability of signal intake.** Dropped signals are catastrophic; latency above his model's expected horizon erodes alpha.
5. **Risk gate transparency.** When the platform refuses a signal (size limit, venue down, KYC issue, mandate breach), the rejection is typed, timestamped, and reasoned — never silent.
6. **Reporting that survives his board / his investors / his auditors.** Same trust requirements as any institutional client.
7. **Predictable billing / fee accrual** — fees are part of his strategy economics; opaque fee accrual makes his own P&L untrustworthy.

He does **not** value:

- Research workspace, feature library, model registry — he has his own.
- Promotion gates (in the platform's sense) — he runs his own promotion process.
- Notebooks, experiment trackers, platform-side ML training — irrelevant.
- Curated cockpit presets — his interaction is API-first; the cockpit is for monitoring and reporting only.

---

## Physical Setup

**Distributed.** Sebastian's primary surface is his own research firm's infrastructure (a notebook environment, a private model registry, an internal experiment tracker). He uses the platform's terminal as a **secondary, low-frequency monitoring surface** — typically a single laptop session, sometimes a tablet. His team's research engineers may have higher engagement (for schema compatibility checks, signal intake debugging, reporting reconciliation).

| Surface                                             | Where it lives                                                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research workspace, model registry, feature library | **Sebastian's own infrastructure** (not the platform). Out of scope for this doc.                                                                       |
| Signal-generation system                            | Sebastian's own. Emits signals to the platform's intake endpoint over an authenticated wire protocol (REST + signed payload, or WebSocket, or a queue). |
| Signal intake & validation                          | Platform side. Sebastian sees a read-only **Signal Ingest Health** surface.                                                                             |
| Instruction mapping                                 | Platform side. Sebastian sees the active **InstructionMappingVersion** for his current external version.                                                |
| Fills, positions, P&L, risk                         | Platform side. Sebastian sees **read-only**, version-tagged.                                                                                            |
| Reporting & attribution                             | Platform side, **delivered**. Sebastian downloads / receives / API-reads.                                                                               |

His terminal is small because most of his cognitive load is upstream of the platform.

---

## Phase 1: Decide

For Sebastian, the decisions made on the platform are **not trade decisions** — those happen in his own research stack. The platform-side decisions are:

- **Register a new external version.** "I have a new signal logic; I want it to start emitting against the platform's executor; here is my versioned configuration." A typed registration: external strategy ID, external version, signal schema version (which the platform supports), proposed instruction-mapping version, intended execution config, intended risk config, intended share class / mandate.
- **Validate compatibility.** Before going to paper, the platform validates that his payload conforms to schema, that his instruction mapping resolves cleanly, that his execution / risk configs are within the platform's policy envelope. Validation result is read-only on his terminal.
- **Promote or roll back his own version.** "v17 is decaying — start sending v18 signals; deprecate v17 once positions are flat" — Sebastian initiates this; the platform reflects his choice in fill tagging.

### Surfaces used

- **External Strategy Version Register.** A typed list of his current external versions (registered, validating, paper, approved-for-live, live, paused, retired). Status, registration date, validation evidence, last fill timestamp, paper / live P&L per version.
- **Signal Schema Browser.** The platform's catalogue of supported signal schemas, with version history and migration notes. Sebastian must know which schemas his current code emits, and what's deprecated.
- **Instruction Mapping Inspector.** Read-only view of how his external instructions translate into the platform's internal execution intent. Helps him debug edge cases ("why did my market-IOC turn into a passive-limit?" — because the venue was down and the mapping fell back per policy).
- **Schema-validation log.** Every signal he sends, validated or rejected, with reason codes. His own engineers consume this for QA.

He does NOT see: data catalog, feature library, model registry, experiment tracker, strategy composition surface, promotion gates (in the platform sense), capital allocation engine.

---

## Phase 2: Enter

Sebastian's "Enter" is **emit a signal**. The order ticket is not his surface; the platform's executor wraps his signals into orders. What Sebastian sees is the post-emission status:

- **Signal Ingest Health.** Per-second / per-minute throughput, validation pass/fail rate, latency percentiles from emit to acknowledgement.
- **Instruction Translation Log.** Each emitted signal → mapped instruction → resulting platform-side order(s). Live-streamed; searchable; tagged with the external version.
- **Rejected-signal queue.** Schema rejections, risk-gate rejections, capacity-cap rejections, venue-down rejections — typed, reasoned, timestamped. Sebastian's engineers debug from here.

Latency-sensitive Sebastians may operate co-located ingest endpoints (the platform offers low-latency intake regions) and monitor microsecond-grade percentiles. Lower-latency Sebastians (event-driven, swing-horizon) tolerate seconds.

---

## Phase 3: Hold / Manage

Sebastian's "Hold" is **watch what the platform did with my signals**. Foveal surfaces:

- **Live positions and exposure, version-tagged.** Per external version, current positions, mark-to-market P&L, gross / net exposure, risk gate utilisation. Drilldown to individual fills.
- **Live P&L panel.** Today's, WTD, MTD, YTD, ITD — per external version. Total combined view + per-version split. Net of fees explicitly broken out.
- **Risk gate utilisation.** Position size cap, drawdown, daily-loss budget, concentration, leverage — current vs limit, per external version. Approaching-limit warnings.
- **Execution quality / TCA.** Slippage realised vs expected by venue, by order type, by signal characteristics. The platform should not let execution quality degrade silently — Sebastian's edge depends on it.
- **Alerts pinned to his strategies.** Risk-gate breach risk, signal intake degradation, venue health affecting his fills, schema-deprecation reminders.
- **Kill switch (his scope only).** Pause all signals from one external version, pause all signals from all his versions, exit-only mode per version. Granular per scope; never reaches other clients' strategies.

What he does NOT see / cannot do: pause OTHER clients' strategies, modify the platform's risk policy, change the underlying execution algos, override venue routing outside the bundle's declared override presets.

---

## Phase 4: Learn

Post-trade is where Sebastian's signal-leasing relationship lives or dies. He must be able to reconstruct **why his strategy made or lost money**, separated cleanly into:

- **Signal alpha** — what his signal logic implied (theoretical fill at signal time).
- **Execution slippage** — the platform's gap between signal-implied and realised fills.
- **Fee drag** — fees per fill, per venue, per period.
- **Risk-gate cost** — signals that were rejected or sized down by gates, with the counterfactual P&L the platform's data layer can estimate.
- **Schema / mapping drift** — any signal that translated unexpectedly because of a schema or mapping version change.

### Surfaces

- **Per-version performance retrospective.** Auto-generated weekly + monthly. Equity curve per version, drawdown profile, Sharpe / Sortino / Calmar / hit rate, regime-conditional performance, attribution decomposition.
- **Backtest-vs-live divergence (his backtest, platform's live).** Sebastian uploads or API-shares his backtest expectation; the platform overlays live and shows divergence. Explanations: feature drift (his) + execution slippage (platform's) + regime mismatch (shared).
- **Trade history / fills blotter, version-tagged.** Every fill with venue, size, price, fees, slippage-vs-arrival, slippage-vs-implementation-shortfall, external version emitting the signal.
- **Reports for his investors / regulator / auditor.** Per-version, per-period, fully reconciled. Same fidelity as a TradFi prime-broker report.

This is the reason he chose signal-leasing: research velocity is his; operational stack is the platform's; reporting must close the loop.

---

## What Ties Sebastian's Terminal Together

1. **The external version is the unifying tag.** Every fill, every P&L row, every risk metric, every report carries the external version that emitted the originating signal. New version = new tag = comparable performance line. (See cross-cutting principle #11 in [INDEX.md](INDEX.md).)
2. **Idempotency by version.** A signal Sebastian sends with `external_version=v18, signal_id=42` is processed exactly once. Replays with the same tuple are deduplicated, not double-traded. This is the safety contract that makes signal-leasing operationally tractable.
3. **The platform is a delivery layer, not a research environment.** Sebastian's terminal exposes signal intake, instruction mapping, fills, positions, P&L, risk, reports. It does NOT expose research, feature engineering, model training, strategy composition, capital allocation. Those are his domain.
4. **The platform's executor's risk policy is non-negotiable on his side.** He sees gate utilisation, he can request more capacity, but he cannot loosen gates from his terminal. Tightening overrides on his own scope are allowed; loosening is platform-side only.
5. **Schema and mapping versions are first-class.** He must know what his code is emitting against. Migrations are platform-led with deprecation windows; never breaking changes without notice.

---

## How to Use This Document

Walk through Sebastian's four phases and ask:

- Does the platform expose **signal intake health, instruction mapping inspection, schema validation logs**?
- Are **fills, positions, P&L, risk metrics, reports** **version-tagged** with the external strategy version?
- Is **idempotency by `(external_version, signal_id)`** enforced at the intake?
- Does the **risk gate** explain rejections in typed, reasoned form?
- Are **schema and instruction-mapping versions** browsable and migration-aware?
- Does the **per-version performance retrospective** survive a board / investor / auditor review?

Gaps against this list aren't bugs — they may be deliberate scope decisions — but they should be **known**, not **accidental**. A signal-leasing relationship breaks if any of the above is fuzzy.

For the supervisor whose firm-aggregate risk includes Sebastian's strategies, see [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md). For the platform-operations counterpart who provisioned Sebastian's account and runs the schema/mapping registry he depends on, see [trader-archetype-priya-platform-ops-lead.md](trader-archetype-priya-platform-ops-lead.md).
