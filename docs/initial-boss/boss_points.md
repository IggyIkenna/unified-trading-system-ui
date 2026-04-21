# Boss-Points — the canonical pain-point list

**Status:** IN PROGRESS — BP-1 and BP-2 complete, BP-3 starting
**Last updated:** 2026-04-16
**Purpose:** short, terse capture of the real pain points Harsh experiences daily. Each point gets its own in-depth doc AFTER we discuss it, not before. This file is the navigation root — everything else links back here.

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

## BP-3 — Per-Widget Certification (L0–L6 pipeline)

Every widget must pass a 7-level certification pipeline before it's considered stable. This is the main active work stream — it covers subscriptions, scoping, mode handling, functional correctness, strategy execution, and testing at the individual widget level. Backend wiring (BP-5) and the systemic entitlement matrix (BP-6+BP-7) come after widgets are certified.

**Certification levels:**

| Level | Name                     | Owner         | What it verifies                                                              |
| ----- | ------------------------ | ------------- | ----------------------------------------------------------------------------- |
| L0    | Foundation               | Agent         | Error boundary, entitlements set, no mock imports, loading/empty/error states |
| L1    | Data Hygiene             | Agent         | Data from context only, scope filtering works (org/client/strategy)           |
| L2    | Entitlement Verification | Agent + Human | Gates fire correctly, UpgradeCard renders, show+lock model works              |
| L3    | Mode Handling            | Agent + Human | Live/paper/batch relevance documented, mode affects widget behavior           |
| L4    | Functional Certification | Agent + Human | All buttons work, no dead links/404s, forms complete, scrolling OK            |
| L5    | Strategy Execution       | Human         | End-to-end strategy run through UI (DeFi first, then others)                  |
| L6    | Tested                   | Agent + Human | Unit tests, integration tests, Playwright tests written and passing           |

**Why before BP-6+BP-7 (audience/tiers):** L2 certification surfaces whether entitlement gates work per-widget before we reason about the full audience × tier matrix. Fix individual gates first, then validate the systemic picture.

**Why before BP-5 (mock data):** L0 cleans up direct mock imports from widget files. Once moved to data contexts, the mock data landscape is cleaner and BP-5 has a smaller, well-defined scope.

**Priority order:** DeFi (16 widgets) → Common tabs (Overview, Terminal, Risk — 29 widgets) → Core trading (Orders, Positions, P&L, Accounts, Alerts — 17 widgets) → Execution workflow (Strategies, Book, Bundles, Instructions — 23 widgets) → Domain-specific (Markets, Options, Sports, Predictions — 37 widgets)

**Agent work:** L0 + L1 fully automated. L2–L4 agent prep + human verify. L5 human-heavy. L6 agent writes tests.

**Spec:** `docs/audits/widget-certification-spec.md`
**Tracking:** `docs/audits/widget-certification-status.md` (122 widgets, per-widget level)

**Status:** STARTING — spec and tracking table created, L0+L1 DeFi sweep ready to launch.

---

## BP-4 — Cosmetic & Theming Foundation

Central color schemas, widget chrome finalization, and coding standard audit scripts. Runs **in parallel** with BP-3 — does not block or get blocked by widget certification.

- **Widget chrome presets** — 20 presets (A–T) created for testing visual separation. Once winners are shortlisted, create sub-variants (A1, A2, etc.). See `docs/audits/findings/widget-chrome-presets.md`.
- **Central color schema** — single-file dark/light/user theme changes so retheming doesn't require touching every component. Currently color values are scattered across CSS variables, Tailwind config, and inline styles.
- **Coding standard audit scripts** — 15 scripts already exist in `docs/audit-scripts/` (A–O covering typography, color tokens, spacing, shared components, mock data, widgets, nav shell, accessibility, responsive, performance, code org, error handling, naming, i18n, security). Extend with new audits as needed.
- **Dead code sweep** — overlaps with BP-8; anything clearly cosmetic-only can be cleaned here without waiting for BP-8's full audit pass.

**Status:** OPEN — chrome presets (A–T) ready for Harsh to test and shortlist. Color schema and audit extension deferred.

---

## BP-5 — Fragmented mock data

Mock data lives in many places: backend scripts, UI `lib/mocks/fixtures/`, UI `lib/mocks/generators/`, inline inside component `.tsx` files, probably more. Need:

- A central way to generate, store, and use mock data
- A discipline for updating it without breaking consumers
- Type checking as the first-line drift detector (per Harsh: "type checking would be the first one to highlight breakage")
- Test layers must be extensible per-tab and per-change (not run-everything-every-time)

Also includes deferred work from BP-2: lazy provider activation for cross-tab widget sharing (see `docs/audits/BP2-cross-tab-providers.md`), and the real API/WebSocket wiring strategy.

**Status:** OPEN — starts after BP-3 L0–L1 sweep completes, which cleans up widget-side mock imports and narrows the scope of this problem.

---

## BP-6 — Multi-audience UI (same codebase, different entitlements)

One codebase serves:

1. Public website (anyone on the internet)
2. Internal team across every role (data science, analysts, traders, backoffice, admin, CTO, CEO)
3. PMS / investment-management clients (see their own strategies, accounts, money)
4. White-label customers (other companies plug in their own AWS/GCP, use our backend + UI code, download data, run their own backtesting/strategies, offer to their own clients)

Most filtering is backend-enforced (AWS/GCP rejects unauthorised requests, or data simply isn't there). For now we have to **mimic this with mock data + tests** so these access paths are covered before the real API is wired in.

**Note:** Other lifecycle tabs (deployment, research, promote) currently live in separate repos and will migrate into this repo over time. The test framework built here must be extensible to each tab as it lands.

**Status:** OPEN — to discuss, tightly coupled with BP-7.

---

## BP-7 — Subscription tiers (per-service × standard/premium/ultra)

Subscription layers exist on two dimensions:

- **Which services** a customer has subscribed to (each lifecycle tab = a service)
- **Which tier** they're on for each service (standard / premium / ultra)

Features and data visibility depend on this matrix. The matrix isn't fully defined yet — when it is, changing it should ideally be a **single config change** that propagates everywhere. Services are pretty well defined; tier contents are not.

Tests must cover this matrix dimension alongside the audience dimension from BP-6. The test layer must also be per-layer (not run-everything-every-time) so it scales as new tabs/services land.

**Status:** OPEN — discuss alongside BP-6.

---

## BP-8 — Dead code / dead components

Some components and pages are left over from earlier pivots. They're not in use, they bloat the codebase, and they get in the way of audits and agents (who read them and get confused about what's current). Need an audit → archive/remove pass.

**Status:** OPEN — cleanup task, best done after the audit framework from BP-1 exists and BP-3 certification work surfaces dead widget files.

---

## Execution order

| Order    | BP                                                    | Status       | Notes                                                                                             |
| -------- | ----------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| 1st      | **BP-1 — SSOT docs + audit scripts**                  | **COMPLETE** | Stream A (doc hygiene) + Stream B (target state) done.                                            |
| 2nd      | **BP-2 — Widget foundation**                          | **COMPLETE** | Foundation audit, 10 class audits, cross-tab providers, chrome presets.                           |
| 3rd      | **BP-3 — Per-widget certification**                   | **STARTING** | L0–L6 pipeline. DeFi first. Agent sweep for L0+L1, human review for L2–L5.                        |
| Parallel | **BP-4 — Cosmetic & theming**                         | OPEN         | Chrome preset shortlisting, color schema. Runs alongside BP-3.                                    |
| 4th      | **BP-5 — Mock data + API wiring**                     | OPEN         | Starts after BP-3 L0–L1 cleans up widget-side mock imports. Prerequisite for any real test layer. |
| 5th      | **BP-6 + BP-7 — Multi-audience + subscription tiers** | OPEN         | Same domain. Verify systemic audience×tier matrix after per-widget gates are working (BP-3 L2).   |
| 6th      | **BP-8 — Dead code audit**                            | OPEN         | Cleanup. BP-3 certification work surfaces dead files; BP-1 framework makes this tractable.        |

### Why BP-3 before BP-5

BP-3 L0 cleans up direct mock imports in widgets. Once those are moved to data contexts, the mock data problem in BP-5 becomes cleaner and better-scoped. Running BP-5 first would mean designing the centralization strategy around a messier landscape.

### Why BP-3 before BP-6+BP-7

BP-3 L2 verifies per-widget entitlement gates. It's better to confirm individual gates work correctly before reasoning about the systemic audience × tier matrix. Don't validate the matrix against broken gates.

### Why BP-6 + BP-7 go together

They are the same thing from two angles: BP-6 asks "who is the audience?", BP-7 asks "what did this audience pay for?". The tests need to cover both dimensions simultaneously.

### Former BP-3 (Multi-repo UI / per-layer testing) — REMOVED

Was a design constraint, not a standalone pain point. Its useful parts absorbed into:

- **BP-6 (audience):** "other tabs will migrate in" → test framework must be extensible per-tab
- **BP-7 (tiers):** "tests must be per-layer" → don't run everything every time
- **BP-5 (mock data):** test layer extensibility is a design constraint on the mock/API wiring

---

## Links

- [00_index.md](00_index.md) — folder index
- [02_codebase_facts.md](02_codebase_facts.md) — still mostly valid, kept as reference
- [03_test_strategy_options.md](03_test_strategy_options.md) — earlier test layer brainstorm (needs revision)
- [04_mock_data_and_backend_gap.md](04_mock_data_and_backend_gap.md) — earlier mock-data thinking (feeds BP-5 discussion)
- [99_open_questions_and_decisions.md](99_open_questions_and_decisions.md) — cross-doc question ledger (still the decisions log)
