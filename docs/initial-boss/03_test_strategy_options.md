# 03 — Testing state & strategy

**Status:** REWRITTEN 2026-04-21 — previous version (2026-04-15 brainstorm of Layers A–H) was STALE; most of its speculation is either resolved or irrelevant now that BP-2 is complete and BP-3 cert is underway.
**Purpose:** ground-truth inventory of what testing exists today, what's missing, and how this relates to BP-3 `L6 Tested`. Framing for the next discussion.

---

## Ground truth — what's actually in the repo (2026-04-21)

### The root cause is unchanged

[package.json:20](../../package.json#L20) — `lint` is still a stub:

```json
"lint": "node -e \"console.log('Temporary rollout bypass: lint deferred for large debt set')\"",
```

[package.json:23](../../package.json#L23) — `typecheck` is still a stub:

```json
"typecheck": "node -e \"console.log('Temporary rollout bypass: typecheck deferred for large debt set')\"",
```

`tsc --noEmit` and `eslint .` never run as part of any gate. [tsconfig.json](../../tsconfig.json) has `"strict": true` and excludes `tests/e2e`, so if typecheck were un-stubbed it would check everything else with strict semantics.

### Test infrastructure that exists

All tests now live under [tests/](../../tests/) (moved from `__tests__/` + `e2e/` that 02 described).

| Suite                              | Count    | Runner     | Config                                                                 |
| ---------------------------------- | -------- | ---------- | ---------------------------------------------------------------------- |
| Unit (`tests/unit/`)               | 96 files | Vitest     | [vitest.config.ts](../../vitest.config.ts)                             |
| Integration (`tests/integration/`) | 8 files  | Vitest     | Same                                                                   |
| Audit (`tests/audit/`)             | 2 files  | Vitest     | Same                                                                   |
| E2E (`tests/e2e/`)                 | 48 specs | Playwright | [playwright.config.ts](../../playwright.config.ts)                     |
| E2E — already-running dev server   | —        | Playwright | [playwright.e2e.config.ts](../../playwright.e2e.config.ts)             |
| Static smoke (Tier 0, 3 specs)     | —        | Playwright | [playwright.static.config.ts](../../playwright.static.config.ts)       |
| Marketing (shadow-root shell)      | 1 spec   | Playwright | [playwright.marketing.config.ts](../../playwright.marketing.config.ts) |

Vitest: single project, `happy-dom`, `pool: "forks"`, globs `tests/**/*.{test,spec}.{ts,tsx}`, excludes `tests/e2e`.

E2E scope: smoke, tier0 route coverage (behaviour + static), auth flow, trading flow, strategy scale, DeFi strategy runs (`aave-lending`, `basis-trade`, `basis-trade-swap`, three `debug-basis-trade*.spec.ts`), lifecycle/observe/research/reports flows, org-isolation, permission catalogue, user-management, admin-flow, guided tour, indicators, playbooks (refactor g1-1 … g1-14, signal-broadcast, questionnaire), runbooks (regulatory onboarding), services (im-funds). FastAPI mock backend (8030) + UI (3100 in default config, 3000 for e2e) auto-started.

### Hooks & CI

- **Pre-commit** ([.pre-commit-config.yaml](../../.pre-commit-config.yaml)): Prettier + `eslint --fix` + conventional-commit + branch-drift. **No typecheck, no test run.**
- **Cloud Build** ([cloudbuild.yaml](../../cloudbuild.yaml)): runs `pnpm lint || true` (stub) and `CI=true pnpm test || true` (vitest with failure tolerance) + `next build` with `NEXT_PUBLIC_MOCK_API=true`. `|| true` means nothing blocks.
- **AWS CodeBuild** ([buildspec.aws.yaml](../../buildspec.aws.yaml)): `npm run typecheck` (stub), `npm run lint` (stub), `npm test` (vitest — actually runs). So vitest failures would fail an AWS build, but lint/typecheck are silent.
- **Custom script** ([scripts/quality-gates.sh](../../scripts/quality-gates.sh)): sources `unified-trading-pm/scripts/quality-gates-base/base-ui.sh`. Runs `typecheck + lint + tests + build` — but the typecheck/lint calls it makes hit the same stubbed scripts, so it's an expensive no-op for those two steps.

### Widget / data-layer surface under test

- 17 `*-data-context.tsx` files, one per domain ([components/widgets/\*/](../../components/widgets/)) — every cross-widget data hop passes through one of these.
- ~125 registered widgets across 17 `register.ts` files (count per-spec at `docs/audits/widget-certification-spec.md`).
- No `app/__harness/` route. No per-widget mount harness.
- No Zod schemas over `lib/mocks/fixtures/`. No generated-type ↔ fixture drift check.
- `lib/types/api-generated.ts` exists and is generated via `pnpm generate:types` from `lib/registry/openapi.json` — the contract bridge. Not currently validated against anything.

---

## What BP-3 already decided (don't re-open)

BP-3 per-widget certification defines **`L6 Tested`** as the per-widget testing bar — spec at [docs/audits/widget-certification-spec.md](../audits/widget-certification-spec.md). Nine levels L0–L8, sequential. L6 requires unit + integration + Playwright tests written and passing for that widget.

This means the old 03 framing ("pick layers A–H for a generic strategy") is superseded at the widget level: **every widget eventually gets unit + integration + e2e via L6**. The remaining strategy questions are about **non-widget layers** and **gate wiring**.

---

## Where the real gaps are (2026-04-21)

| Gap                                                | Status                                                                                                                         | Why it matters                                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Typecheck stub**                                 | Still stubbed. Unknown debt size.                                                                                              | Every cross-context shape break (yesterday's regression class) is invisible. Un-stubbing is the single highest-leverage action available. |
| **Lint stub**                                      | Still stubbed. `eslint.config.mjs` is minimal (next + prettier).                                                               | No rules enforced; new anti-patterns land silently.                                                                                       |
| **Pre-commit doesn't run tests or types**          | Prettier + ESLint `--fix` only.                                                                                                | Nothing local blocks a commit that broke tests.                                                                                           |
| **CI pipelines mask failures**                     | `\|\| true` on Cloud Build lint + test. AWS build stubs typecheck + lint.                                                      | Server-side gate is effectively "did `next build` succeed?"                                                                               |
| **No widget harness / isolated mount**             | Never built. Would let us cheaply verify each widget renders independently with minimal provider stack.                        | Without it, the only cross-widget safety net is the tier0 static smoke (which runs the full page, so it's slow and heavily coupled).      |
| **No fixture schema drift check**                  | `lib/mocks/fixtures/` has no Zod schemas tied to `lib/types/api-generated.ts`.                                                 | When OpenAPI regenerates, fixture drift is silent until something explodes at render.                                                     |
| **Data-context contract tests**                    | No test reads every field of a `*-data-context.tsx` shape.                                                                     | Yesterday's bug class (a context exposed shape change) is still undetectable short of a page-level crash.                                 |
| **L6 per-widget test bar not piloted**             | Spec defined, nothing on the cert tracker is at L6 yet.                                                                        | We don't know yet what "test a widget" concretely looks like in this codebase — needs a pilot.                                            |
| **Static-smoke coverage gated on tier 0 dev-tier** | [playwright.static.config.ts](../../playwright.static.config.ts) expects `bash scripts/dev-tiers.sh --tier 0` running on 3100. | Great for local verification; unclear how often it's actually run.                                                                        |

---

## Candidate investment layers — trimmed and re-scored

The old doc listed Layers A–H. Three are still useful to discuss; the rest are resolved or superseded.

### Layer A — Un-stub typecheck + lint [STILL THE TOP CANDIDATE]

Replace the `package.json` stubs with `tsc --noEmit` and `eslint .`. Critical unknown: debt size. Plan is the same as 2026-04-15:

1. Un-stub in a scratch branch, run once, count errors.
2. If small (<100): fix in a day, land un-stubbed.
3. If large: generate a baseline (e.g. `typescript-baseline.json` via a simple jq dump, or `eslint --format baseline`) so existing errors are frozen but new ones block. This is the standard pattern.

Catches yesterday's bug class directly. Independent of BP-3. Runs in <40s.

### Layer D' — Widget harness (revised) [HIGH VALUE, BUT PROTOTYPE FIRST]

Original: a dev-only `app/__harness/[widgetId]/page.tsx` that iterates the registry. Revised because BP-3 now exists:

- **Scope down to DeFi first** (matches BP-3 priority). 16 DeFi widgets, not 125.
- **Harness = provider stack from the real layout**, not a stripped one. Less fixture plumbing, catches provider-coupling bugs.
- **Tied to `L6 Tested`**: a widget's L6 gate can be "renders in harness without console errors + widget-specific assertion." Turns the harness into a reusable test fixture rather than a one-off Playwright sweep.

### Layer E — Static smoke wired into the gate [ALREADY WRITTEN, STILL NOT WIRED]

[tests/e2e/static-smoke.spec.ts](../../tests/e2e/static-smoke.spec.ts) + [playwright.static.config.ts](../../playwright.static.config.ts) exist. Nothing auto-runs them. Wiring options:

- **Pre-push hook** (fast subset: maybe 10–15 highest-value routes, ~30s)
- **CI required gate** (full 108-route sweep, ~2–4 min)
- **Agent verify script** (on-demand before declaring done)

### Resolved / dropped

- **Layer B (fixture Zod schemas)** — still useful, but lower priority than A. Defer.
- **Layer C (data-context contract tests)** — absorbed by L6's integration test bullet. Per-widget, not a separate layer.
- **Layer F (critical-path E2E)** — already in `tests/e2e/trading-flow.spec.ts`, `trader.spec.ts`, `trading.spec.ts`. Doesn't need a strategy decision; just needs CI to actually run them with failure-on.
- **Layer G (visual regression)** — confirmed non-goal in 07 § 8.
- **Layer H (Storybook)** — superseded by the harness idea. Not revisiting.

---

## Open questions for discussion

### About the gate layer

1. **Typecheck debt size.** Single most load-bearing unknown. Worth 10 minutes of agent work to produce a concrete count + sample errors before any decision.
2. **Where to run the gate.** Pre-commit blocks iteration; pre-push is friendlier; CI-only defeats the purpose. Most likely: pre-commit runs tsc + eslint on changed files only, CI runs full.
3. **AWS vs GCP build as the enforcement path.** Both exist, both partially gate. Is one canonical, or do they need to stay in lockstep?

### About BP-3 L6

4. **What does L6 concretely look like for one DeFi widget?** Before writing the per-widget L6 checklist in abstract, pick one widget (e.g. `defi-lending-widget` since it's currently modified in git status) and walk through: what's the unit test, what's the integration test, what's the Playwright test. Learn the shape, then generalise.
5. **Harness or no harness?** If we build one, L6's e2e bar can be "harness + assertions." Without one, L6's e2e has to be page-level, which couples to routing, auth, and the rest of the tab.
6. **`L6 Tested` sequencing relative to other levels.** Spec says L0→L8 strictly sequential. In practice, can L6 tests be sketched while L3–L5 are still in review, or must they wait?

### About fixtures / backend readiness

7. **Do we lock down fixtures now (Zod) or wait for the OpenAPI regenerate cycle?** If DeFi backend integration lands next week (per 07 § 2), fixtures will churn. Locking now may be throwaway work.
8. **Who owns `lib/registry/openapi.json`?** If it's regenerated from the FastAPI mock automatically, Layer B is cheap (run Zod generation off the same schema). If it's drift-prone, Layer B is harder.

---

## Recommended next step (to discuss, not to execute yet)

Two things to pick between before any code lands:

**Option 1 — Gate-first.** Un-stub typecheck + lint in a scratch branch, measure debt, decide baseline-vs-fix. Wire tier0 static-smoke into CI with `|| true` removed. ~1–3 days of work depending on debt. Catches the yesterday-class of bug at a system level immediately.

**Option 2 — L6-pilot-first.** Pick one DeFi widget, define its full L6 test set (unit + integration + e2e), land them, then use that shape to template the rest. ~1–2 days for the pilot. Slower to propagate, but produces a concrete L6 pattern the cert sweep can adopt.

Not mutually exclusive. Typical play is Option 1 in week 1, Option 2 starting week 2 once typecheck is live.

---

## Decisions log

- 2026-04-21: Doc rewritten. Previous Layer A–H brainstorm retired — resolved items dropped, remaining items re-scored against current infra + BP-3 cert spec. No new test-strategy decisions yet; this rewrite is a clean slate for the next discussion.
- _(No finalized decisions from the original 03 — it never passed DISCUSSING.)_
