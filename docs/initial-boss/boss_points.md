# Boss-Points — the canonical pain-point list

**Status:** DISCUSSING
**Last updated:** 2026-04-15
**Purpose:** short, terse capture of the 7 real pain points Harsh experiences daily. Each point gets its own in-depth doc AFTER we discuss it, not before. This file is the navigation root — everything else links back here.

**This supersedes** the assumptions in `01_problem_and_context.md` and `03_test_strategy_options.md`. Those earlier docs were written before Harsh surfaced the real boss-points and should be revised (or replaced) once we work through the boss-points in order.

---

## BP-1 — No SSOT for UI docs + no target state

Backend has an SSOT in `unified-trading-pm`; the UI has nothing equivalent. Existing UI docs are a mix of outdated, migrated-past, and current. There's no authoritative "what the UI should look like" — no Figma / wireframes / target specs — and arguably there can't be one since ideas land daily. But we CAN have:

- Docs capturing what we already know _should_ exist
- Audit scripts that compare the current code against those docs (coding standards, implementation patterns, framework usage, architecture)
- A decision on which existing docs to keep, archive, or update

There are audit scripts already; they may need updating too.

**Status:** OPEN — to discuss.

---

## BP-2 — Widget foundation may not be solid

Every lifecycle tab uses a fixed layout **except trading**, which uses widgets so traders can customise their own workspace. Widgets started as an experiment — no solid foundation was ever formally agreed. An agent migrated all trading components from fixed layout to widgets, Harsh iterated without checking the foundation carefully, and now ~130 widgets sit on top of an unvetted base.

Harsh has already built root widgets for ~2-3 widget types (tables, summary, possibly one more) that other widgets extend. We need to:

- Audit whether the current foundation is actually good
- Confirm base widgets exist for every widget class
- Formalise the extension pattern so new widgets always build on a base

**Status:** OPEN — to discuss. **Highest urgency — directly under today's work.**

---

## BP-3 — Multi-repo UI future + tests must be per-layer

Currently only the trading lifecycle tab lives here. Other tabs live in separate repos (e.g. `deployment-ui`, used by team members for deploying backend services + data backfills). Research and promote tabs are in other repos too. All of those will be migrated _into_ this repo later.

The testing framework must be:

- Extensible to each part of the UI as it lands
- Layered, so we do NOT run the whole suite every time — define the layers and run only what's needed for a given change

**Status:** OPEN — more of a design constraint than a discussion topic.

---

## BP-4 — Multi-audience UI (same codebase, different entitlements)

One codebase serves:

1. Public website (anyone on the internet)
2. Internal team across every role (data science, analysts, traders, backoffice, admin, CTO, CEO)
3. PMS / investment-management clients (see their own strategies, accounts, money)
4. White-label customers (other companies plug in their own AWS/GCP, use our backend + UI code, download data, run their own backtesting/strategies, offer to their own clients)

Most filtering is backend-enforced (AWS/GCP rejects unauthorised requests, or data simply isn't there). For now we have to **mimic this with mock data + tests** so these access paths are covered before the real API is wired in.

**Status:** OPEN — to discuss, tightly coupled with BP-5.

---

## BP-5 — Subscription tiers (per-service × standard/premium/ultra)

Subscription layers exist on two dimensions:

- **Which services** a customer has subscribed to (each lifecycle tab = a service)
- **Which tier** they're on for each service (standard / premium / ultra)

Features and data visibility depend on this matrix. The matrix isn't fully defined yet — when it is, changing it should ideally be a **single config change** that propagates everywhere. Services are pretty well defined; tier contents are not.

Tests must cover this matrix dimension alongside the audience dimension from BP-4.

**Status:** OPEN — discuss alongside BP-4.

---

## BP-6 — Dead code / dead components

Some components and pages are left over from earlier pivots. They're not in use, they bloat the codebase, and they get in the way of audits and agents (who read them and get confused about what's current). Need an audit → archive/remove pass.

**Status:** OPEN — cleanup task, best done after the audit framework from BP-1 exists.

---

## BP-7 — Fragmented mock data

Mock data lives in many places: backend scripts, UI `lib/mocks/fixtures/`, UI `lib/mocks/generators/`, inline inside component `.tsx` files, probably more. Need:

- A central way to generate, store, and use mock data
- A discipline for updating it without breaking consumers
- Type checking as the first-line drift detector (per Harsh: "type checking would be the first one to highlight breakage")

**Status:** OPEN — prerequisite for any meaningful test layer.

---

## Proposed discussion order

**Revised 2026-04-15 after Harsh pushed back:** in an agent-primary workflow (Harsh + Ikenna mostly review UI, not code; agents do most of the implementation), docs ARE the specification. Stale/missing docs actively mislead agents and an agent cannot "audit the foundation" if there's no target state written down. So BP-1 moves to first. Previous ordering (BP-2 first) assumed humans learning from code, which is not this team's workflow.

| Order | BP                                                             | Why this order                                                                                                                                                                                                                                                              |
| ----- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1st   | **BP-1 — SSOT docs + audit scripts**                           | Agents are the primary workforce; they read docs, not code. Without a target state written down, every agent session operates from different assumptions. Split into two parallel streams: (a) doc hygiene (fast, mechanical), (b) target-state brain-dump (high-leverage). |
| 2nd   | **BP-2 — Widget foundation**                                   | With BP-1's target state in place, "is the foundation good?" becomes answerable — it's an audit _against something_ rather than a vibes check. Directly under today's work on the trading tab.                                                                              |
| 3rd   | **BP-7 — Mock data consolidation**                             | Prerequisite for any meaningful test layer. Can't lock down widget behaviour if the data underneath keeps shifting. Relatively contained.                                                                                                                                   |
| 4th   | **BP-4 + BP-5 together — Multi-audience + subscription tiers** | Same domain (who sees what). Defines a test matrix dimension. Must be understood before we write tests that claim coverage.                                                                                                                                                 |
| 5th   | **BP-6 — Dead code audit**                                     | Cleanup. The audit framework from BP-1 makes this tractable. Not urgent.                                                                                                                                                                                                    |
| 6th   | **BP-3 — Multi-repo / per-layer testing**                      | A design constraint on the testing framework, not a discussion topic in its own right. Absorbed into the test layer design as a requirement.                                                                                                                                |

### Why not BP-1 first (even though it sounds foundational)

BP-1 is the _container_ for everything else. Starting with it risks weeks of meta-discussion about what should be in the SSOT before we make progress on any concrete pain. Starting with BP-2 and BP-7 produces real artifacts (a widget foundation spec, a mock data spec) that become the _first entries_ in the SSOT — so BP-1 is built incrementally rather than designed from scratch.

### Why BP-4 + BP-5 go together

They are the same thing from two angles: BP-4 asks "who is the audience?", BP-5 asks "what did this audience pay for?". The tests need to cover both dimensions simultaneously. Discussing them separately would mean redoing the same matrix work twice.

---

## What I need from Harsh before the first discussion

Nothing formal — just agreement on the order above (or a different order if you disagree), then we start BP-2 with questions I'll draft once you confirm.

I will NOT start creating in-depth docs for any boss-point until we've discussed it and agreed on what it contains.

---

## Links

- [00_index.md](00_index.md) — folder index
- [02_codebase_facts.md](02_codebase_facts.md) — still mostly valid, kept as reference
- [03_test_strategy_options.md](03_test_strategy_options.md) — earlier test layer brainstorm (needs revision)
- [04_mock_data_and_backend_gap.md](04_mock_data_and_backend_gap.md) — earlier mock-data thinking (feeds BP-7 discussion)
- [05_repo_structure_question.md](05_repo_structure_question.md) — still valid, no change needed
- [06_agent_workflow_and_gates.md](06_agent_workflow_and_gates.md) — earlier agent gate thinking (revisit after boss-points)
- [99_open_questions_and_decisions.md](99_open_questions_and_decisions.md) — cross-doc question ledger (still the decisions log)
