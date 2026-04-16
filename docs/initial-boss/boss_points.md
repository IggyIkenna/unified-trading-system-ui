# Boss-Points — the canonical pain-point list

**Status:** IN PROGRESS — BP-1 and BP-2 complete, BP-7 next
**Last updated:** 2026-04-16
**Purpose:** short, terse capture of the 6 real pain points Harsh experiences daily. Each point gets its own in-depth doc AFTER we discuss it, not before. This file is the navigation root — everything else links back here.

**This supersedes** the assumptions in `01_problem_and_context.md` and `03_test_strategy_options.md`. Those earlier docs were written before Harsh surfaced the real boss-points and should be revised (or replaced) once we work through the boss-points in order.

---

## BP-1 — No SSOT for UI docs + no target state

Backend has an SSOT in `unified-trading-pm`; the UI has nothing equivalent. Existing UI docs are a mix of outdated, migrated-past, and current. There's no authoritative "what the UI should look like" — no Figma / wireframes / target specs — and arguably there can't be one since ideas land daily. But we CAN have:

- Docs capturing what we already know _should_ exist
- Audit scripts that compare the current code against those docs (coding standards, implementation patterns, framework usage, architecture)
- A decision on which existing docs to keep, archive, or update

There are audit scripts already; they may need updating too.

**Status:** COMPLETE — Stream A (doc hygiene) done, Stream B (trading target state in `07_trading_target_state.md`) all 8 sections confirmed.

---

## BP-2 — Widget foundation may not be solid

Every lifecycle tab uses a fixed layout **except trading**, which uses widgets so traders can customise their own workspace. Widgets started as an experiment — no solid foundation was ever formally agreed. An agent migrated all trading components from fixed layout to widgets, Harsh iterated without checking the foundation carefully, and now ~130 widgets sit on top of an unvetted base.

Harsh has already built root widgets for ~2-3 widget types (tables, summary, possibly one more) that other widgets extend. We need to:

- Audit whether the current foundation is actually good
- Confirm base widgets exist for every widget class
- Formalise the extension pattern so new widgets always build on a base

**Status:** COMPLETE — Foundation audited and confirmed solid. 10 widget class audits done (9 findings + bespoke). Cross-tab providers enabled. Chrome presets created. See `docs/audits/BP2-*` for artifacts.

---

## BP-3 — Multi-audience UI (same codebase, different entitlements)

One codebase serves:

1. Public website (anyone on the internet)
2. Internal team across every role (data science, analysts, traders, backoffice, admin, CTO, CEO)
3. PMS / investment-management clients (see their own strategies, accounts, money)
4. White-label customers (other companies plug in their own AWS/GCP, use our backend + UI code, download data, run their own backtesting/strategies, offer to their own clients)

Most filtering is backend-enforced (AWS/GCP rejects unauthorised requests, or data simply isn't there). For now we have to **mimic this with mock data + tests** so these access paths are covered before the real API is wired in.

**Note:** Other lifecycle tabs (deployment, research, promote) currently live in separate repos and will migrate into this repo over time. The test framework built here must be extensible to each tab as it lands.

**Status:** OPEN — to discuss, tightly coupled with BP-4.

---

## BP-4 — Subscription tiers (per-service × standard/premium/ultra)

Subscription layers exist on two dimensions:

- **Which services** a customer has subscribed to (each lifecycle tab = a service)
- **Which tier** they're on for each service (standard / premium / ultra)

Features and data visibility depend on this matrix. The matrix isn't fully defined yet — when it is, changing it should ideally be a **single config change** that propagates everywhere. Services are pretty well defined; tier contents are not.

Tests must cover this matrix dimension alongside the audience dimension from BP-3. The test layer must also be per-layer (not run-everything-every-time) so it scales as new tabs/services land.

**Status:** OPEN — discuss alongside BP-3.

---

## BP-5 — Dead code / dead components

Some components and pages are left over from earlier pivots. They're not in use, they bloat the codebase, and they get in the way of audits and agents (who read them and get confused about what's current). Need an audit → archive/remove pass.

**Status:** OPEN — cleanup task, best done after the audit framework from BP-1 exists.

---

## BP-6 — Fragmented mock data

Mock data lives in many places: backend scripts, UI `lib/mocks/fixtures/`, UI `lib/mocks/generators/`, inline inside component `.tsx` files, probably more. Need:

- A central way to generate, store, and use mock data
- A discipline for updating it without breaking consumers
- Type checking as the first-line drift detector (per Harsh: "type checking would be the first one to highlight breakage")
- Test layers must be extensible per-tab and per-change (not run-everything-every-time)

Also includes deferred work from BP-2: lazy provider activation for cross-tab widget sharing (see `docs/audits/BP2-cross-tab-providers.md`), and the real API/WebSocket wiring strategy.

**Status:** OPEN — next up, prerequisite for any meaningful test layer.

---

## Execution order

| Order | BP                                                             | Status       | Notes                                                                                                    |
| ----- | -------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| 1st   | **BP-1 — SSOT docs + audit scripts**                           | **COMPLETE** | Stream A (doc hygiene) + Stream B (target state) done.                                                   |
| 2nd   | **BP-2 — Widget foundation**                                   | **COMPLETE** | Foundation audit, 10 class audits, cross-tab providers, chrome presets.                                  |
| 3rd   | **BP-6 — Mock data + API wiring**                              | **NEXT**     | Prerequisite for any meaningful test layer. Includes lazy provider activation deferred from BP-2.        |
| 4th   | **BP-3 + BP-4 together — Multi-audience + subscription tiers** | OPEN         | Same domain (who sees what + what they paid for). Test framework must be per-layer and per-tab scalable. |
| 5th   | **BP-5 — Dead code audit**                                     | OPEN         | Cleanup. The audit framework from BP-1 makes this tractable.                                             |

### Why BP-3 + BP-4 go together

They are the same thing from two angles: BP-3 asks "who is the audience?", BP-4 asks "what did this audience pay for?". The tests need to cover both dimensions simultaneously. Discussing them separately would mean redoing the same matrix work twice.

### Former BP-3 (Multi-repo UI / per-layer testing) — REMOVED

Was a design constraint, not a standalone pain point. Its useful parts absorbed into:

- **BP-3 (audience):** "other tabs will migrate in" → test framework must be extensible per-tab
- **BP-4 (tiers):** "tests must be per-layer" → don't run everything every time
- **BP-6 (mock data):** test layer extensibility is a design constraint on the mock/API wiring

---

## Links

- [00_index.md](00_index.md) — folder index
- [02_codebase_facts.md](02_codebase_facts.md) — still mostly valid, kept as reference
- [03_test_strategy_options.md](03_test_strategy_options.md) — earlier test layer brainstorm (needs revision)
- [04_mock_data_and_backend_gap.md](04_mock_data_and_backend_gap.md) — earlier mock-data thinking (feeds BP-7 discussion)
- [05_repo_structure_question.md](05_repo_structure_question.md) — still valid, no change needed
- [06_agent_workflow_and_gates.md](06_agent_workflow_and_gates.md) — earlier agent gate thinking (revisit after boss-points)
- [99_open_questions_and_decisions.md](99_open_questions_and_decisions.md) — cross-doc question ledger (still the decisions log)
