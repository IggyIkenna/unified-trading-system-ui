# Widget Certification Specification

**Date:** 2026-04-16
**Status:** ACTIVE — framework for per-widget quality audit
**Extends:** [BP2-base-widget-migration-spec.md](BP2-base-widget-migration-spec.md) § 0
**Scope:** All 125 registered widgets across 17 domains (verified 2026-04-20 against `registerWidget(...)` calls in `components/widgets/*/register.ts`)
**Priority:** DeFi widgets first, then common tabs, then remaining domains

---

## How This Document Works

Each widget progresses through **9 certification levels** (L0–L8). Levels are sequential — a widget must pass L(n) before advancing to L(n+1). Each level has a checklist, an owner (agent or human), and clear pass/fail criteria.

**Per-widget status** is tracked in `docs/audits/widget-certification-status.md` (level rollups) and `docs/widget-certification/<widget-id>.json` (full per-level truth + `findings[]` audit trail). Agents update both as they complete levels.

**Agent rule:** Agents execute L0–L2, L6, and L7 autonomously. L3–L5 and L8 require human walkthrough after agent prep.

**Find → fix → mark-done (L7 / L8 workflow):** L7 and L8 are not just audits — each violation is logged to the widget's cert JSON `findings[]` with `status: "todo"`, fixed in the same session, then flipped to `status: "fixed"`. **The cert JSON is the tracker; no separate doc.** A level only passes once every finding on it is `fixed` or explicitly `deferred` with a reason. See the `findings[]` schema block after L8.

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

**2026-04-17 update — L2 globally satisfied:** Commits `32ba8ab` (structured `{domain, tier}` entitlements, all 17 `register.ts` files migrated, 5 `PageEntitlementGate` wrappers wired) and `f9f29ea` (65 automated tests for 2.2–2.5 in `__tests__/integration/entitlement-wiring.test.ts`, `__tests__/components/platform/*entitlement-gate.test.tsx`, `__tests__/lib/config/trading-entitlements.test.ts`) collectively cover L2 for every widget. JSONs back-filled with `l2.status = "pass"` on 2026-04-20; re-audit per-widget only if the wiring test fails or entitlements are added.

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

### L7 — Coding Standards (agent-automated, find→fix→verify)

_Grep-able code-level hygiene against the modules in [`docs/audit-scripts/`](../audit-scripts/). Each check is a **find → log → fix → mark-done** cycle inside the same per-widget session. Every violation is recorded in the widget's own `docs/widget-certification/<widget-id>.json` under `findings[]` with `level: "l7"`. The JSON is the tracker — no separate doc._

| #   | Check                                | Audit-script module | How to verify                                                                                                   | Fix action                                                                           |
| --- | ------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 7.1 | No hardcoded colors                  | B color-tokens      | `grep -En '#[0-9a-fA-F]{3,8}\b\|rgb[a]?\(\|hsl[a]?\(' <widget-file>` — zero matches outside allowlisted escapes | Replace with tailwind tokens (`bg-muted`, `text-foreground`, …) or CSS vars          |
| 7.2 | Mock data placement clean            | E mock-data         | Reference data imported only from `lib/constants/` or `lib/config/`; no duplicated fixtures                     | Move to correct location, delete duplicates                                          |
| 7.3 | File size + complexity within limits | J perf, K code-org  | Widget file ≤ 500 lines; no single function / component > 200 lines                                             | Split into subcomponents or extract custom hooks                                     |
| 7.4 | Naming conventions                   | M naming            | Components PascalCase, hooks `useCamelCase`, files kebab-case                                                   | Rename + update every importer                                                       |
| 7.5 | i18n-readiness logged                | N i18n              | Count user-visible strings; no fix required until i18n ships                                                    | Log count in `findings[]` with `status: "deferred", deferReason: "i18n not shipped"` |
| 7.6 | Security patterns clean              | O security          | No `dangerouslySetInnerHTML`, `eval`, `new Function`, or `innerHTML =` with non-static input                    | Sanitize or remove                                                                   |
| 7.7 | Performance anti-patterns absent     | J perf              | No inline object/array literals in `useEffect` / `useMemo` deps; expensive derives memoized                     | Extract stable refs, add `useMemo` / `useCallback`                                   |

**Workflow per check:**

1. Run the grep / read against the widget file.
2. Clean → mark the check `pass` with a note.
3. Violations found → write each into `findings[]` with `level: "l7"`, `check: "7.x"`, `status: "todo"`.
4. Fix each violation in the same session.
5. Re-run the grep to verify zero remaining matches.
6. Flip each `findings[]` entry's `status` from `"todo"` → `"fixed"` (add a `fix:` string), or → `"deferred"` with a `deferReason:` if it cannot be fixed in this pass.
7. Only then mark the check `pass`.

**Pass criteria:** 7.1–7.4, 7.6, 7.7 all `pass` and every `level: "l7"` `findings[]` entry flipped to `"fixed"` or `"deferred"`. 7.5 remains globally `deferred` until i18n ships. Status → `L7 ✓`.

**Rule — `app/globals.css` is read-only during L7 / L8:** Agents must NOT edit `app/globals.css` while executing a widget's L7 or L8 session. If a widget legitimately needs a token that doesn't exist yet, log the violation in `findings[]` with `status: "deferred"` and `deferReason: "missing token — requests --<proposed-name> in globals.css"`. A single consolidation pass lands all deferred token requests after the sweep completes. This keeps parallel agents from fighting over the theme file.

---

### L8 — Visual & UX Consistency (agent find+fix → human verify)

_Design-system adherence. Agent mechanically fixes typography-scale, spacing-scale, and shared-primitive-adoption drift; perceptual checks (a11y keyboard walk, responsive at `minW`) stay human-verified. Same find→log→fix→mark-done cycle as L7; findings tracked in the same JSON under `level: "l8"`._

| #   | Check                                          | Audit-script module | Owner         | How to verify                                                                                                                                              | Fix action                                                           |
| --- | ---------------------------------------------- | ------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 8.1 | Typography uses the scale                      | A typography        | Agent         | `grep -E 'text-\[\|fontSize' <widget-file>` — zero matches                                                                                                 | Replace `text-[14px]` with `text-sm` etc.                            |
| 8.2 | Spacing uses the scale                         | C spacing           | Agent         | `grep -E '\b[pm][lrtbxy]?-\[\|gap-\[' <widget-file>` — zero matches                                                                                        | Replace `p-[13px]` with token spacing                                |
| 8.3 | Shared primitives used                         | D shared-components | Agent         | Widget uses `Card`, `Button`, `Input`, `Badge` from `components/ui/*` rather than custom `<div>` + tailwind                                                | Migrate to shared primitives                                         |
| 8.4 | Accessibility — alt / labels / aria / keyboard | H a11y              | Agent + Human | Agent: grep for `<img` without `alt`, `<input` without label, interactive `<div onClick>` without role/tabIndex. Human: keyboard-only + screen-reader pass | Add missing attrs; promote interactive divs to `button` / add `role` |
| 8.5 | Responsive at minW and typical viewports       | I responsive        | Human         | Renders correctly at `minW`/`minH` from `register.ts`; no horizontal scroll at 1280 / 1920 / mobile                                                        | Add breakpoints or adjust layout                                     |

**Agent prep:** Agent fully auto-fixes 8.1–8.3 and grep-preps 8.4. Human completes 8.4 walkthrough and 8.5 resize test.

**Pass criteria:** All 5 checks `pass`; every `level: "l8"` `findings[]` entry flipped to `"fixed"` or `"deferred"`. Status → `L8 ✓` — widget is **STABLE + POLISHED**.

---

### `findings[]` schema (L7 / L8 tracker)

The widget's cert JSON **is** the tracking artifact. Each violation becomes one entry; status flips as the fix lands in the same session.

```jsonc
"findings": [
  {
    "level": "l7",
    "check": "7.1",
    "description": "defi-lending-widget.tsx:142 — #3b82f6 hardcoded for ROI badge",
    "status": "fixed", // "todo" | "in-progress" | "fixed" | "deferred"
    "fix": "Replaced with bg-primary/10 text-primary" // present when status=fixed
    // "deferReason": "..."                            // present when status=deferred
  }
]
```

**Rule:** never leave an L7 or L8 finding at `"todo"` across sessions. Fix it, or flip it to `"deferred"` with a reason. The cert JSON is the audit trail — it must reflect the actual state of the widget at the moment the session ends.

---

## Widget Status Codes

Each widget in the tracking table shows its current level:

| Code       | Meaning                                                   |
| ---------- | --------------------------------------------------------- |
| `—`        | Not started                                               |
| `L0 ✓`     | Foundation verified                                       |
| `L1 ✓`     | Data hygiene clean                                        |
| `L2 ✓`     | Entitlements verified (human-confirmed)                   |
| `L3 ✓`     | Mode handling verified                                    |
| `L4 ✓`     | Functionally certified                                    |
| `L5 ✓`     | Strategy execution confirmed                              |
| `L6 ✓`     | Tested                                                    |
| `L7 ✓`     | Coding standards clean                                    |
| `L8 ✓`     | Visual + UX consistency — widget is **STABLE + POLISHED** |
| `L0–L1 🔧` | Agent working on L0–L1 fixes                              |
| `N/A`      | Widget not applicable for this level                      |

A widget marked **STABLE + POLISHED** (L8 ✓) means: data is clean, entitlements work, modes handled, functionally certified, strategies verified, tests pass, coding standards clean, and visual + UX consistency verified against the design system.

---

## Per-Widget SSOT Schema (JSON fields)

Each widget's `docs/widget-certification/<widget-id>.json` carries the full truth for that widget. Three sections sit alongside `levels` to capture concerns that L0–L6 don't cover on their own. Added 2026-04-20.

### `relationships` — how the widget couples to other widgets

Surfaces master→detail links, peer dependencies, merge candidates. Feeds the backend-wiring decisions in BP-5 and dead-code decisions in BP-8.

```jsonc
"relationships": {
  "mode": "standalone" | "master" | "detail" | "peer",
  "masterOf": ["<widget-id>", ...],    // IDs this widget drives (populated when mode=master)
  "detailOf": ["<widget-id>", ...],    // IDs that drive this widget (populated when mode=detail)
  "selectionKey": "instrumentId" | "orderId" | "strategyId" | ... | null,
  "mergeCandidate": { "with": "<widget-id>", "rationale": "..." } | null,
  "keepSeparate": { "rationale": "..." } | null,
  "notes": "..."
}
```

- `mode: standalone` — widget renders independently, no cross-widget coupling.
- `mode: master` — widget owns a selection that drives one or more detail widgets.
- `mode: detail` — widget renders content for a selection made elsewhere.
- `mode: peer` — widget reads the same selection but neither drives nor depends on a single master.
- `mergeCandidate` is a recommendation, not a commitment — merging happens only after human review.

### `dataContract` — how the widget receives data in production

Documents the delivery channel choice per widget, so BP-5 backend wiring can be sequenced per-widget rather than per-domain.

```jsonc
"dataContract": {
  "channels": ["rest" | "websocket" | "sse" | "pubsub" | "polling"],
  "primary": "rest" | "websocket" | "sse" | "pubsub" | "polling",
  "cadence": "on-demand" | "interval:<ms>" | "event-driven" | "batch",
  "staleness": "realtime" | "near-realtime:<=1s" | "seconds" | "minutes" | "batch",
  "mockSource": "<file path under lib/mocks/ or null>",
  "backendOwner": "<service-name>" | "unknown",
  "notes": "..."
}
```

- `channels` lists every delivery path the widget supports; `primary` picks the default.
- `cadence` describes how often data refreshes; use `interval:500ms` format for timed polls.
- `staleness` is the user-visible SLA — what users see, not what the pipe delivers.

### `coverage` — asset-class × strategy × venue completeness

Answers "does this widget actually handle every case it claims to?" Pairs with L5 (strategy execution) but is asserted separately because coverage is a code-level question the agent can answer without a human walkthrough.

```jsonc
"coverage": {
  "assetClasses": ["defi" | "cefi" | "tradfi" | "sports" | "predictions"],
  "strategies": ["<strategy-id from lib/strategy-registry.ts>", ...],
  "venues": ["all"] | ["<venue-id>", ...],
  "commonTabs": ["<tab-id>"] | null,    // only populated when widget is shared across tabs via availableOn
  "verifiedOn": ["<asset-class | tab-id>", ...],    // where end-to-end verification has actually happened
  "gaps": ["<short description>", ...],
  "notes": "..."
}
```

- `assetClasses` lists every class the widget is expected to serve — derived from `availableOn` in `register.ts` and from strategy registry entries the widget touches.
- `strategies` enumerates every strategy ID this widget supports (e.g. `basis-trade`, `recursive-staked-basis`).
- `venues` is `["all"]` when the widget is venue-agnostic, or an explicit list when venue logic is hard-coded.
- `commonTabs` is populated only when `availableOn` spans multiple tabs; same widget rendering on `overview` + `risk` must be verified against both.
- `verifiedOn` is ground truth — what's been walked through, not what's claimed.

### Pass criteria for the new sections

These sections are **not** levels — they are fields filled in during the same agent+human pass that does L3–L5. A widget is considered schema-complete when all three sections contain non-placeholder values and a human has signed off on `relationships.mergeCandidate` / `relationships.keepSeparate`.

---

## Execution Plan

### Phase 1 — Agent sweep: L0 + L1 + L7 for all 125 widgets

Agents can run in parallel per domain (17 domains = up to 17 parallel agents). Each agent:

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

### Phase 3 — Strategy execution: L5 + L8 agent-prep (DeFi first)

Agent mechanically fixes L8.1–L8.3 (typography / spacing / shared primitives) during this phase. Harsh walks through each DeFi strategy type end-to-end:

- Basis Trade, Recursive Staked Basis, AMM LP, Lending/Borrowing, Flash Loans, Staking, Cross-chain Bridge

For each: configure parameters → submit → verify result in downstream widgets (positions, P&L, etc.).

### Phase 4 — Testing: L6 (per certified widget)

Once a widget passes L5, an agent writes tests:

- Unit tests (render states, loading, empty, error)
- Integration tests (context + widget with fixture data)
- Playwright test (golden path E2E)

### Phase 4b — Visual + UX polish: L8 human walkthrough

For each widget that cleared L7 in Phase 1 and L8.1–L8.3 in Phase 3, Harsh does the L8.4 keyboard + screen-reader pass and L8.5 resize test. Agent fixes any residual findings on the spot.

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

## Parallel Work Track: Theme Infrastructure

The [`docs/audit-scripts/`](../audit-scripts/) coding-standard modules are now **folded into L7 and L8** (find→fix per widget, tracked in each cert JSON). What remains parallel is the infrastructure those checks validate against:

- Central color schema (single-file dark/light/user theme changes) — L7.1 passes more cleanly once this is finalized
- Widget chrome preset finalization (select from A–T, create sub-variants)

This track does not block widget certification; L7/L8 will still pass widgets against the current token set, flagging drift as `findings[]` deferred on the theme track rather than the widget.

---

## Relationship to Existing Artifacts

| Artifact                               | Role                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `BP2-base-widget-migration-spec.md`    | Source of § 0 cross-cutting requirements (L0 base)                      |
| `BP2-widget-foundation-audit.md`       | Initial audit — findings feed L0 verification                           |
| `docs/audits/findings/*.md` (10 files) | Per-class audit findings from BP-2                                      |
| `docs/audit-scripts/` (15 modules)     | Source of L7 (B, E, J, K, M, N, O) and L8 (A, C, D, H, I) grep patterns |
| `widget-certification-status.md`       | Per-widget tracking table (level rollup)                                |
| `docs/widget-certification/*.json`     | Per-widget cert JSON — full truth for `levels.l0`–`l8` and `findings[]` |
| `boss_points.md`                       | Links to this spec from BP-3 onward                                     |
