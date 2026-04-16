# Widget Certification Specification

**Date:** 2026-04-16
**Status:** ACTIVE — framework for per-widget quality audit
**Extends:** [BP2-base-widget-migration-spec.md](BP2-base-widget-migration-spec.md) § 0
**Scope:** All 131 registered widgets across 18 domains
**Priority:** DeFi widgets first, then common tabs, then remaining domains

---

## How This Document Works

Each widget progresses through **7 certification levels** (L0–L6). Levels are sequential — a widget must pass L(n) before advancing to L(n+1). Each level has a checklist, an owner (agent or human), and clear pass/fail criteria.

**Per-widget status** is tracked in `docs/audits/widget-certification-status.md`. That file is the single tracking artifact — agents update it as they complete levels.

**Agent rule:** Agents execute L0–L2 and L6 autonomously. L3–L5 require human walkthrough after agent prep.

---

## Certification Levels

### L0 — Foundation (agent-automated)

_BP-2 cross-cutting. Most widgets already pass — agents verify and fix stragglers._

| #   | Check                                        | How to verify                                                                      | Fix if failing                            |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| 0.1 | Error boundary wraps widget                  | Confirm `WidgetErrorBoundary` in `widget-wrapper.tsx` covers all grid widgets      | Already done — verify, don't re-implement |
| 0.2 | `requiredEntitlements` set (non-empty array) | Read `register.ts` → check `requiredEntitlements` field                            | Add correct entitlements matching domain  |
| 0.3 | `availableOn` set (non-empty array)          | Read `register.ts` → check `availableOn` field                                     | Add correct tab IDs                       |
| 0.4 | No `any` types or `@ts-ignore`               | `grep -n 'any\|@ts-ignore' <widget-file>`                                          | Fix types                                 |
| 0.5 | No direct mock imports                       | Widget file must NOT import from `lib/mocks/`                                      | Move data to domain `*-data-context.tsx`  |
| 0.6 | Loading state handled                        | Widget or its base renders skeleton/spinner when data context is loading           | Add `isLoading` check from context hook   |
| 0.7 | Empty state handled                          | Widget shows message when data array is empty / no selection                       | Add empty guard                           |
| 0.8 | Error state handled                          | Widget shows error message when data context reports an error                      | Add `error` check from context hook       |
| 0.9 | Dead code removed                            | No commented-out blocks, no unreachable branches, no "can be safely deleted" stubs | Delete dead code                          |

**Pass criteria:** All 9 checks green. Agent updates status to `L0 ✓`.

---

### L1 — Data Hygiene (agent-automated)

_Widget's data flow is clean — all data comes from context, scoping works._

| #   | Check                                        | How to verify                                                                   | Fix if failing                                 |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1.1 | Data sourced exclusively from domain context | Widget reads data via `use*Data()` hook, never via inline fetch/import          | Refactor to use context hook                   |
| 1.2 | Context reads from `useGlobalScope()`        | Domain `*-data-context.tsx` calls `useGlobalScope()` and filters by scope       | Add scope reading + filtering to context       |
| 1.3 | Org filter changes data                      | When org filter changes in global scope, widget's data set changes accordingly  | Wire scope → filtering in context              |
| 1.4 | Client filter cascades                       | Client filter narrows data further within selected org                          | Wire cascade in context via `scope-helpers.ts` |
| 1.5 | Strategy filter cascades                     | Strategy filter narrows to specific strategies                                  | Wire cascade in context                        |
| 1.6 | "No filter" shows all data                   | Empty scope arrays → context returns unfiltered dataset                         | Ensure empty = all, not empty = nothing        |
| 1.7 | Reference data in correct location           | Token lists, venue lists, config constants in `lib/constants/` or `lib/config/` | Move from `lib/mocks/` to proper location      |

**Pass criteria:** All 7 checks green. Agent updates status to `L1 ✓`.

**Note:** Some widgets are pure UI (control bars, config panels) and don't filter by scope. For these, mark 1.2–1.6 as `N/A` with a note. Only mark N/A when the widget genuinely has no data to filter — not as a shortcut.

---

### L2 — Entitlement Verification (agent prep → human verify)

_Entitlement gates fire correctly for this widget._

| #   | Check                                          | Owner | How to verify                                                                      |
| --- | ---------------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| 2.1 | `requiredEntitlements` matches domain function | Agent | Cross-reference widget's entitlements against domain (e.g., DeFi → `defi-trading`) |
| 2.2 | UpgradeCard renders when entitlement missing   | Human | Switch to non-entitled user profile → widget shows lock/upgrade card               |
| 2.3 | Widget catalog shows lock badge                | Human | Open widget catalog → locked widgets show lock icon + disabled "Add" button        |
| 2.4 | Page-level gate blocks if applicable           | Human | Navigate to gated page without entitlement → frosted overlay visible               |
| 2.5 | Admin/internal bypass works                    | Human | Switch to admin profile → all widgets accessible                                   |

**Agent prep:** Agent verifies 2.1 programmatically and documents the expected behavior for 2.2–2.5. Human runs through the visual checks.

**Pass criteria:** 2.1 green (agent), 2.2–2.5 confirmed (human). Status → `L2 ✓`.

---

### L3 — Mode Handling (agent audit → human verify)

_Widget behaves correctly across live/paper/batch modes._

| #   | Check                                     | Owner | How to verify                                                                         |
| --- | ----------------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| 3.1 | Mode relevance documented                 | Agent | For each widget, document which modes apply (live ✓/paper ✓/batch ✓/N/A)              |
| 3.2 | Data context reads mode from global scope | Agent | `*-data-context.tsx` reads `scope.mode` and adjusts data/behavior                     |
| 3.3 | Batch mode: order entry disabled          | Human | Toggle to batch → order/trade submission buttons disabled or hidden                   |
| 3.4 | Batch mode: visual indicator present      | Human | Widget or layout shows batch/as-of indicator so user knows they're in historical mode |
| 3.5 | Paper mode: behavior defined              | Agent | Document expected paper mode behavior (even if not yet wired — capture the spec)      |
| 3.6 | WebSocket/interval disabled in batch      | Agent | Terminal's 500ms sim and WebSocket connections stop in batch mode                     |

**Agent prep:** Agent completes 3.1, 3.2, 3.5, 3.6 and documents findings. Human tests 3.3, 3.4 in browser.

**Pass criteria:** Agent checks green + human confirms visual behavior. Status → `L3 ✓`.

**Note:** Paper mode is defined but not yet exposed in the trading UI toggle. For L3, document expected paper behavior; don't block certification on paper mode being fully wired. That's a separate implementation task.

---

### L4 — Functional Certification (agent scan → human walkthrough)

_Every interactive element in the widget works correctly._

| #   | Check                                             | Owner | How to verify                                                                        |
| --- | ------------------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| 4.1 | No dead buttons (empty onClick, console.log-only) | Agent | Grep for `onClick={() => {}}`, `onClick={() => void 0}`, console-only handlers       |
| 4.2 | No dead links (href="#", 404 targets)             | Agent | Grep for `href="#"`, check route targets exist                                       |
| 4.3 | All form fields present for domain function       | Human | Visual check — can the user fill in everything needed for this widget's purpose?     |
| 4.4 | Submit/action produces correct result             | Human | Click submit → correct toast/state change/data update happens                        |
| 4.5 | Restricted-access redirects handled               | Agent | If widget links to gated pages, verify the gate exists (not a 404)                   |
| 4.6 | No performance anti-patterns in access checks     | Agent | Entitlement checks not running on every render (should be memoized or store-derived) |
| 4.7 | Tab/accordion/collapsible state works             | Human | If widget has tabs or collapsible sections, they toggle correctly                    |
| 4.8 | Scroll behavior correct                           | Human | Content scrolls within widget bounds, no overflow leaking                            |

**Agent prep:** Agent completes 4.1, 4.2, 4.5, 4.6 and documents findings. Human does 4.3, 4.4, 4.7, 4.8 visual walkthrough.

**Pass criteria:** All checks green. Status → `L4 ✓`.

---

### L5 — Strategy Execution Readiness (human-heavy, DeFi first)

_The widget works end-to-end for its target strategies with mock data._

| #   | Check                                                      | Owner | How to verify                                                                                       |
| --- | ---------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| 5.1 | Target strategies documented                               | Agent | List which strategy types this widget serves (from strategy registry)                               |
| 5.2 | All required params can be set                             | Human | For each target strategy: can the user fill in all required fields?                                 |
| 5.3 | Execution flow completes (mock)                            | Human | Click through: configure → submit → see result (fill, position, P&L update)                         |
| 5.4 | Edge cases handled (zero balance, max values, empty state) | Human | Try: zero balance, max allowed values, missing optional fields                                      |
| 5.5 | Cross-widget flow works                                    | Human | If strategy execution spans multiple widgets, the full flow works (e.g., config → order → position) |
| 5.6 | Asset class coverage verified                              | Human | Widget works for each relevant asset class (not just one hardcoded example)                         |

**Agent prep:** Agent completes 5.1 by cross-referencing widget against `lib/strategy-registry.ts`. Human does the walkthrough.

**Pass criteria:** Human confirms execution flow for all target strategies. Status → `L5 ✓`.

**Scope:** Start with DeFi strategies (~7 types, 16 widgets). Then CeFi, TradFi, Sports, Predictions in that order.

---

### L6 — Tested (agent writes → human reviews)

_Widget has automated tests covering its certified behavior._

| #   | Check                                           | Owner        | How to verify                                                               |
| --- | ----------------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| 6.1 | Unit test exists (Vitest)                       | Agent writes | `components/widgets/<domain>/__tests__/<widget>.test.tsx` exists and passes |
| 6.2 | Unit test covers: render, loading, empty, error | Agent writes | Test renders widget in each state with mocked context                       |
| 6.3 | Integration test covers: context + widget       | Agent writes | Test mounts widget inside its domain provider with fixture data             |
| 6.4 | Playwright test covers critical path            | Agent writes | E2E test for the golden path (navigate → interact → verify result)          |
| 6.5 | Tests pass in CI                                | Agent        | `npm test -- --run` and `npm run smoketest` pass                            |

**Pass criteria:** Tests written and passing. Human reviews test quality. Status → `L6 ✓`.

---

## Widget Status Codes

Each widget in the tracking table shows its current level:

| Code       | Meaning                                 |
| ---------- | --------------------------------------- |
| `—`        | Not started                             |
| `L0 ✓`     | Foundation verified                     |
| `L1 ✓`     | Data hygiene clean                      |
| `L2 ✓`     | Entitlements verified (human-confirmed) |
| `L3 ✓`     | Mode handling verified                  |
| `L4 ✓`     | Functionally certified                  |
| `L5 ✓`     | Strategy execution confirmed            |
| `L6 ✓`     | Tested — widget is **STABLE**           |
| `L0–L1 🔧` | Agent working on L0–L1 fixes            |
| `N/A`      | Widget not applicable for this level    |

A widget marked **STABLE** (L6 ✓) means: data is clean, entitlements work, modes handled, functionally certified, strategies verified, and tests pass.

---

## Execution Plan

### Phase 1 — Agent sweep: L0 + L1 for all 131 widgets

Agents can run in parallel per domain (18 domains = up to 18 parallel agents). Each agent:

1. Reads all widgets in its domain
2. Verifies L0 checks (fix mock imports, add loading/empty/error states)
3. Verifies L1 checks (context reads scope, filtering works)
4. Updates `widget-certification-status.md` with results
5. Writes a domain-level findings doc if new issues discovered

**Agent output per domain:** Updated status table + list of issues that need human review.

**Estimated agent work:** L0 + L1 are fully automatable. Most widgets already pass L0 partially (entitlements, availableOn, error boundary are done). Main gaps: mock imports (~15 widgets), loading/empty/error states (~100+ widgets), scope filtering verification.

### Phase 2 — Human review: L2 + L3 + L4 (DeFi first)

After agents complete L0–L1, Harsh reviews DeFi widgets:

1. **L2:** Switch user profiles, verify entitlement gates
2. **L3:** Toggle live/batch, verify widget behavior changes
3. **L4:** Walk through each widget — buttons, forms, links, scrolling

Agents prepare checklists and expected behaviors before each human session.

### Phase 3 — Strategy execution: L5 (DeFi first)

Harsh walks through each DeFi strategy type end-to-end:

- Basis Trade, Recursive Staked Basis, AMM LP, Lending/Borrowing, Flash Loans, Staking, Cross-chain Bridge

For each: configure parameters → submit → verify result in downstream widgets (positions, P&L, etc.).

### Phase 4 — Testing: L6 (per certified widget)

Once a widget passes L5, an agent writes tests:

- Unit tests (render states, loading, empty, error)
- Integration tests (context + widget with fixture data)
- Playwright test (golden path E2E)

### Phase 5 — Repeat for remaining domains

After DeFi is fully certified, apply the same process to:

1. Common tabs (Overview, Terminal, Risk, Orders, Positions, P&L, Accounts, Alerts)
2. CeFi strategies
3. TradFi strategies
4. Sports / Predictions / Options

---

## Domain Priority Order

| Priority | Domain(s)                                | Widget Count | Rationale                          |
| -------- | ---------------------------------------- | ------------ | ---------------------------------- |
| 1        | DeFi                                     | 16           | Harsh's top priority, most complex |
| 2        | Overview, Terminal, Risk                 | 25           | Common tabs — every user sees them |
| 3        | Orders, Positions, P&L, Accounts, Alerts | 21           | Core trading infrastructure        |
| 4        | Strategies, Book, Bundles, Instructions  | 24           | Execution workflow                 |
| 5        | Markets, Options, Sports, Predictions    | 37           | Domain-specific, lower priority    |

---

## What Agents CANNOT Do (Human-Only)

1. Visual verification of entitlement gates (see the lock icon, frosted overlay)
2. Visual verification of mode switching (toggle live/batch, see widget change)
3. Strategy execution walkthrough (configure params, submit, verify results)
4. Form completeness judgment (are all the right fields present?)
5. UX quality assessment (does the widget feel right?)
6. Cross-widget flow testing (config widget → order widget → position widget)
7. Deciding whether a widget's mode relevance is correct

Agents prepare, document, and fix code. Humans verify behavior and sign off.

---

## Parallel Work Track: Cosmetic & Theming

Independent of the L0–L6 pipeline, a parallel track for visual consistency:

- Central color schema (single-file dark/light/user theme changes)
- Widget chrome preset finalization (select from A–T, create sub-variants)
- Coding standard audit scripts (existing ones in `docs/audit-scripts/`)
- Typography, spacing, and color token consistency

This track does not block widget certification and can run alongside it.

---

## Relationship to Existing Artifacts

| Artifact                               | Role                                               |
| -------------------------------------- | -------------------------------------------------- |
| `BP2-base-widget-migration-spec.md`    | Source of § 0 cross-cutting requirements (L0 base) |
| `BP2-widget-foundation-audit.md`       | Initial audit — findings feed L0 verification      |
| `docs/audits/findings/*.md` (10 files) | Per-class audit findings from BP-2                 |
| `widget-certification-status.md`       | Per-widget tracking table (the live tracker)       |
| `boss_points.md`                       | Links to this spec from BP-3 onward                |
