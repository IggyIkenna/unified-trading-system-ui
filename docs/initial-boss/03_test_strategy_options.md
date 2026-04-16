# 03 — Test strategy options

**Status:** DISCUSSING
**Last updated:** 2026-04-15
**Purpose:** lay out the testing layers we could use, with tradeoffs, so we can decide what to invest in vs defer.

---

## Framing [DISCUSSING]

The goal is **not** to hit a coverage number or build a comprehensive test suite. The goal is to **catch the regression class that hit on 2026-04-14 before the developer ships / declares "done"**.

That regression class is:

- **Shared context refactor breaks consuming widgets silently** (cross-widget dependency)
- **Broken widgets render blank or crash without alerting the developer**
- **Lint / typecheck would have caught it but they're stubbed**

Every test layer below is evaluated against:

- **Does it catch the yesterday-class of bug?** (load-bearing)
- **What does it cost to set up?**
- **What does it cost to run on every agent task?**
- **Does it generate noise / false positives** that will annoy a developer iterating fast?

## The candidate layers [DISCUSSING]

### Layer A — Static analysis (typecheck + lint)

**What:** Un-stub `pnpm typecheck` and `pnpm lint`. Run `tsc --noEmit` and `eslint .`.

**Catches yesterday's bug?** Yes, almost certainly. If a context provider's exposed shape changes and a consumer reads a removed field, TypeScript flags it as an error. This is the cheapest, fastest, highest-leverage layer.

**Setup cost:**

- Un-stub the scripts: 30 seconds
- Run typecheck and see how bad the debt is: ~30 seconds
- Triage the debt: unknown — could be 50 errors (1 hour fix) or 5,000 errors (a week of work)
- If too much debt to fix immediately: generate a baseline file (e.g. tsc-baseline) so existing errors are suppressed but new ones block. This is the standard escape hatch.

**Run cost per agent task:** 20-40 seconds.

**Risks / noise:**

- Existing debt might be enormous, in which case un-stubbing without a baseline blocks all work
- ESLint can be over-aggressive — may need to tune rules

**Status:** **everyone agrees this should happen.** The only question is sizing the debt.

---

### Layer B — Mock fixture invariants

**What:** For each file in [lib/mocks/fixtures/](../../lib/mocks/fixtures/), define a Zod schema in a sibling `.schema.ts`. Vitest test parses the fixture with the schema and fails on shape drift. Where possible, derive the Zod schema from `lib/types/api-generated.ts`.

**Catches yesterday's bug?** Partially. If yesterday's bug was an agent editing the mock fixture itself and changing the shape, this catches it. If the bug was in the context provider, this doesn't catch it directly — but it locks down the data so the _next_ agent has a stable foundation.

**Setup cost:** ~1 day for the 5-10 most-consumed fixtures, then incremental.

**Run cost per agent task:** <5 seconds (vitest).

**Risks / noise:** Schemas drift from generators if not maintained. Need a single source of truth — the OpenAPI generated types.

**Status:** **probably yes**, but lower urgency than Layer A.

---

### Layer C — Data-context contract tests

**What:** For every `*-data-context.tsx` file (orders, positions, risk, book, etc.), write a vitest + RTL test that:

1. Renders the provider with a known mock fixture
2. Has a test consumer component that reads every field of the context shape
3. Asserts every field is present and typed correctly
4. Snapshots the shape so additions are intentional

**Catches yesterday's bug?** **Direct hit.** This is the test we wish existed on 2026-04-13.

**Setup cost:** ~30-60 minutes per data context. Need to inventory how many exist first — if there are 17 (one per widget domain), that's a ~10-day project. If there are 5-6, it's a ~1 day project.

**Run cost per agent task:** ~10-30 seconds for the relevant ones.

**Risks / noise:** Snapshot churn during active development. **Mitigation:** only snapshot the _shape_ (keys + types), not values.

**Status:** **strong yes** for any data context that's being actively edited. Defer the rest until they're touched.

---

### Layer D — Widget harness (Playwright + new harness route)

**What:**

1. Create a Next.js dev-only route: `app/__harness/[widgetId]/page.tsx`
2. The route reads `widgetId` from URL params, looks up the `WidgetDefinition` from the widget registry, mounts the component inside a minimal provider stack with a deterministic mock fixture
3. Write `e2e/widget-harness.spec.ts` that imports the registry, iterates all 129 widgets, navigates to `/__harness/[id]` for each, asserts:
   - No console errors
   - No unhandled promise rejections
   - Widget root element renders (not blank)
   - No "Cannot read properties of undefined" errors
4. Gate this route to dev only (`process.env.NODE_ENV !== "production"`) so it doesn't ship

**Catches yesterday's bug?** **Yes, by side effect.** Even if you didn't write a test for the orders widgets specifically, the harness would mount them after the context change, hit the runtime crash, and fail the spec. This is the safety net for "I broke a widget I wasn't even touching."

**Setup cost:** ~1-2 days (route + test + fixture wiring). The fixture story is the trickiest part — does the harness use the same providers the real route uses, or a stripped-down version?

**Run cost per agent task:** ~3-5 minutes if all 129 widgets, parallelized. Could be reduced to ~30 seconds by only running widgets affected by the changed files (parsed from git diff).

**Risks / noise:**

- Some widgets may need specific entitlements / auth context to render — the harness needs to fake those
- Some widgets may need specific scope / org / venue selections — the harness needs sensible defaults
- Widgets that talk to the FastAPI mock backend may need that backend running (Playwright already starts it)

**Status:** **biggest leverage win** of any layer, IF we can solve the fixture story cleanly. Strong yes, but needs prototyping.

---

### Layer E — Full-page static smoke (already exists)

**What:** [e2e/static-smoke.spec.ts](../../e2e/static-smoke.spec.ts) — already written, iterates all 108 Tier 0 routes, asserts no crash + visible content + no console errors. Runs against mock mode.

**Catches yesterday's bug?** Likely yes. If the orders widget rendered blank or crashed, the orders page route would have caught it.

**Setup cost:** Zero — already exists.

**Run cost per agent task:** ~2-4 minutes.

**Risks / noise:** Slow if all 108 routes run on every change. **Mitigation:** smart selection (only run pages affected by the changed files).

**Status:** **strong yes — wire it into the gate immediately.** Verify it's actually green today first.

---

### Layer F — Critical-path E2E (already exists)

**What:** Existing specs like [e2e/trading-flow.spec.ts](../../e2e/trading-flow.spec.ts), [e2e/trader.spec.ts](../../e2e/trader.spec.ts), [e2e/navigation.spec.ts](../../e2e/navigation.spec.ts) — simulate user journeys end-to-end.

**Catches yesterday's bug?** Maybe. Depends on whether the broken widget was on a critical path.

**Setup cost:** Zero — already exists.

**Run cost per agent task:** ~5-15 minutes for the full set.

**Risks / noise:** Slowest layer. Not affordable on every agent task.

**Status:** Yes for _a small subset_ before declaring done (3-5 specs). Full set runs nightly or pre-merge to main.

---

### Layer G — Visual regression (Chromatic / Percy)

**What:** Screenshot widgets / pages, flag pixel changes.

**Catches yesterday's bug?** No. Yesterday's bug was functional, not visual.

**Setup cost:** Medium-high. Adds a service dependency (Chromatic / Percy) or self-hosted infrastructure.

**Status:** **Deferred** per Harsh's stated preference. Revisit when functionality is locked.

---

### Layer H — Storybook

**What:** Component catalogue with isolated stories per widget.

**Catches yesterday's bug?** Only if you write tests against the stories. Otherwise it's just a visual catalogue.

**Setup cost:** Medium. Adds a second build system to maintain alongside Next.js.

**Reason to skip:** The widget harness route in Layer D gives you the same benefit (mount widgets in isolation) without a second build system, and it lives in the actual app with the real provider stack.

**Status:** **Defer / skip** unless we find a specific reason Layer D can't do what Storybook would.

---

## Tentative recommendation [DISCUSSING — not yet finalized]

Order of investment (my current thinking, subject to debate):

1. **Layer A first.** Cheapest, highest impact. Cannot proceed without this.
2. **Layer E next** (it already exists, just wire it into the gate).
3. **Layer D in parallel with C.** Layer D is the safety net; Layer C is the precision tool.
4. **Layer B** as a force-multiplier for Layer C — without locked fixtures, contract tests can drift.
5. **Layer F** as the "before main merge" gate, not the per-task gate.
6. **Skip G and H** for now.

## What we still need to figure out

- **Layer A debt sizing** — is it 50 errors or 5,000? Determines whether Phase 0 is hours or days.
- **Layer D fixture story** — does the harness use the real provider stack or a stripped one? How do entitlements/auth work in the harness?
- **The agent gate composition** — exactly which layers run when an agent says "done"?
- **The gate location** — pre-commit hook? pre-push hook? An npm script the agent invokes directly? CI?
- **How to teach agents** to actually run the gate. Editing `AGENT_PROMPT.md`? A wrapper script? A hook?

## Decisions log

- _(empty — nothing finalized yet)_
