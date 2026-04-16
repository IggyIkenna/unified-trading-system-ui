# 02 — Codebase facts

**Status:** DISCUSSING (need Harsh to confirm/correct)
**Last updated:** 2026-04-15
**Purpose:** lock down what actually exists so we don't re-derive it every session.

---

## Stack [TENTATIVE]

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** React + Radix UI primitives + Tailwind
- **State:** Zustand for global state, React Query for server state
- **Forms:** react-hook-form + @hookform/resolvers
- **Charts:** lightweight-charts + (probably others)
- **Tests:** Vitest (unit/integration), Playwright (e2e)
- **Node:** 22+
- **Package manager:** pnpm (lockfile: `pnpm-lock.yaml`, but also `package-lock.json` exists — **need to confirm which is canonical**)

## Routes [TENTATIVE]

- **108 Tier 0 routes** registered in [e2e/tier0-route-registry.ts](../../e2e/tier0-route-registry.ts)
- Enforced by [e2e/tier0-app-route-coverage.spec.ts](../../e2e/tier0-app-route-coverage.spec.ts) — meaning new routes must be added to the registry or the test fails
- Routes are organized by lifecycle tab (data, research, promote, terminal, reports, observe, backoffice, etc.)

## Widget system [TENTATIVE]

This is the most important architectural piece for the testing story.

### Files

- **Type definitions:** [components/widgets/widget-registry.ts](../../components/widgets/widget-registry.ts) — defines `WidgetDefinition`, `WidgetPlacement`, `WidgetComponentProps`
- **Eager barrel:** [components/widgets/register-all.ts](../../components/widgets/register-all.ts) — imports every domain's `register.ts`
- **Per-domain registers:** `components/widgets/{domain}/register.ts` — calls `registerWidget({...})` and `registerPresets(...)`

### Domains (17 total)

```
accounts, alerts, book, bundles, defi, instructions, markets, options, orders,
overview, pnl, positions, predictions, risk, sports, strategies, terminal
```

### Widget count

- ~130 widgets total. Exact count via `register.ts` files:

  | Domain       | Widgets |
  | ------------ | ------- |
  | accounts     | 7       |
  | alerts       | 4       |
  | book         | 7       |
  | bundles      | 6       |
  | defi         | 17      |
  | instructions | 4       |
  | markets      | 9       |
  | options      | 10      |
  | orders       | 3       |
  | overview     | 9       |
  | pnl          | 5       |
  | positions    | 3       |
  | predictions  | 12      |
  | risk         | 14      |
  | sports       | 6       |
  | strategies   | 4       |
  | terminal     | 9       |
  | **Total**    | **129** |

### `WidgetDefinition` shape

```typescript
interface WidgetDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: string; // for grouping in the catalogue
  minW;
  minH: number;
  maxW?;
  maxH?: number;
  defaultW;
  defaultH: number;
  requiredEntitlements: string[];
  availableOn: string[]; // which tabs this widget appears on
  singleton?: boolean;
  component: ComponentType<WidgetComponentProps>;
}
```

This is a **goldmine for testing** — the registry can be iterated programmatically, every widget is addressable by id, and we know its required entitlements and which tabs it lives on.

## Data layer [TENTATIVE]

### Hooks

- React Query hooks live under [hooks/api/](../../hooks/api/)
- Naming: `use-orders.ts`, `use-positions.ts`, `use-market-data.ts`, etc. (~20 files)
- Each hook calls `typedFetch<...>(withMode(url, scope.mode, ...), token)` — typed against generated OpenAPI types

### Generated types

- [lib/types/api-generated.ts](../../lib/types/api-generated.ts) — generated from `lib/registry/openapi.json`
- Regenerated via `pnpm generate:types` (script: `openapi-typescript lib/registry/openapi.json -o lib/types/api-generated.ts`)
- **This is the contract bridge.** When the real backend lands, this file becomes the drift detector.

### Mock backend

- Lives in `unified-trading-api` (sibling Python repo)
- Started by Playwright on port 8030 with env `CLOUD_MOCK_MODE=true CLOUD_PROVIDER=local DISABLE_AUTH=true`
- Command: `.venv/bin/uvicorn unified_trading_api.main:create_app --factory --host 0.0.0.0 --port 8030`

### Local mock fixtures & generators

- [lib/mocks/fixtures/](../../lib/mocks/fixtures/) — static seed fixtures (~30+ files: orders, positions, market data, defi, sports, etc.)
- [lib/mocks/generators/](../../lib/mocks/generators/) — deterministic generators (`mock01`, `order-book`, `pnl-generators`, etc.)
- Mock mode controlled by `process.env.NEXT_PUBLIC_MOCK_API === "true"` — see [lib/runtime/data-mode.ts](../../lib/runtime/data-mode.ts)

### Data contexts (shared state wrappers)

- Pattern: `components/widgets/{domain}/{domain}-data-context.tsx`
- Confirmed example: [components/widgets/orders/orders-data-context.tsx](../../components/widgets/orders/orders-data-context.tsx) (539 lines)
- These wrap multiple widgets in a domain and expose a shared shape via React context
- **This is the cross-widget breakage surface.** A change to the context shape silently breaks every consuming widget.
- **Need to inventory all `*-data-context.tsx` files** to know how many of these breakage surfaces exist.

## Testing infrastructure that exists [TENTATIVE]

### Vitest

- Config: [vitest.config.ts](../../vitest.config.ts)
- Env: jsdom
- Pool: forks (to avoid zombie processes)
- Test root: `__tests__/**/*.{test,spec}.{ts,tsx}`
- Projects: `unit`, `integration`, `audit` (referenced in package.json scripts)
- **21 existing test files**, including:
  - UI primitives: button, tabs, badge, select, card
  - Trading components: book-page, manual-trading-panel-enhanced, kill-switch-panel, scope-summary
  - Audit: interactive-elements
  - Integration: cross-tab-widgets, user-onboarding, filter-propagation, zustand-selectors
  - Lib: personas, user-management-types, stores, seed-data, config, grid-config

### Playwright

- Config: [playwright.config.ts](../../playwright.config.ts)
- Spins up FastAPI mock backend (8030) + UI (3100) automatically
- Test root: `e2e/`
- **35+ specs**, including:
  - Smoke: `smoke.spec.ts` (11 pages), `static-smoke.spec.ts` (108 routes against Tier 0)
  - Critical paths: `trading-flow.spec.ts`, `trader.spec.ts`, `trading.spec.ts`
  - Navigation/routing: `navigation.spec.ts`, `tier0-app-route-coverage.spec.ts`, `tier0-behavior-audit.spec.ts`
  - Lifecycle: `lifecycle.spec.ts`, `data-flow.spec.ts`, `research-flow.spec.ts`, `reports-flow.spec.ts`, `observe-flow.spec.ts`
  - Audit: `org-isolation.spec.ts`, `permission-catalogue.spec.ts`, `user-management.spec.ts`, `admin-flow.spec.ts`
  - Edge cases: `bundle-size.spec.ts`, `latency-simulation.spec.ts`, `responsive.spec.ts`, `data-freshness.spec.ts`, `no-client-mock-data.spec.ts`
  - Sub-suites: `e2e/strategies/`, `e2e/runbooks/`

### Static smoke test (existing, important)

- [e2e/static-smoke.spec.ts](../../e2e/static-smoke.spec.ts) already iterates all 108 Tier 0 routes
- Logs in via demo persona, navigates each route, asserts:
  1. HTTP 200
  2. Renders without uncaught JS exceptions
  3. Has visible content (not blank)
  4. No "Cannot read properties of undefined" errors
- **Runs against mock mode (NEXT_PUBLIC_MOCK_API=true)** — no backend needed
- **Status:** exists, but unclear if it's actually being run before commits / merges

## The bypass (the actual root cause) [FINALIZED]

[package.json:19-23](../../package.json#L19-L23):

```json
"lint": "node -e \"console.log('Temporary rollout bypass: lint deferred for large debt set')\"",
"typecheck": "node -e \"console.log('Temporary rollout bypass: typecheck deferred for large debt set')\"",
```

Both the lint and typecheck npm scripts are stubbed to no-ops. Anything that runs `pnpm typecheck` or `pnpm lint` will silently pass without checking anything. **This means even if the gate existed, it would pass on broken code.**

This is the single most important fact in the entire investigation. Until this is fixed, every other layer of testing has a hole big enough to drive a truck through.

## Other documents already in the repo [TENTATIVE]

These exist as context. Not yet reviewed in depth — flag if any are authoritative:

- [docs/AGENT_FINDINGS.md](../AGENT_FINDINGS.md)
- [docs/DATA_MODE_IDEOLOGY.md](../DATA_MODE_IDEOLOGY.md)
- [docs/END_TO_END_STATIC_TIER_ZERO_TESTING.md](../END_TO_END_STATIC_TIER_ZERO_TESTING.md)
- [docs/MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md](../MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md)
- [docs/MOCK_STATIC_EVALUATION_SPEC.md](../MOCK_STATIC_EVALUATION_SPEC.md)
- [docs/FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md](../FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md)
- [docs/STRUCTURE\_\*.md](../) — various structure overviews
- Root: `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md`, `ARCHITECTURE_HARDENING.md`, `CODEBASE_STRUCTURE.md`, `QA_GATES.md`, `TESTING.md`, `WIDGET_CATALOGUE.md`

**Need to read at least `END_TO_END_STATIC_TIER_ZERO_TESTING.md`, `QA_GATES.md`, and `TESTING.md` before finalizing the test strategy** — they may already document gates that just aren't being enforced.

## Open questions for Harsh

1. Is `pnpm-lock.yaml` or `package-lock.json` canonical? (Both exist.)
2. What does `END_TO_END_STATIC_TIER_ZERO_TESTING.md` already document about gates? Is anything in there obsolete or already obsolete?
3. The 21 vitest tests — are any of them currently failing? (We can't tell because nothing runs them automatically.)
4. Is there a CI pipeline (Cloud Build / GitHub Actions / AWS CodeBuild) that runs any of these tests? `cloudbuild.yaml` and `buildspec.aws.yaml` both exist — what do they do?
5. Has anyone done an inventory of all `*-data-context.tsx` files? (I can do this, but want to confirm the pattern is universal.)

## Decisions log

- 2026-04-15: Confirmed `lint` and `typecheck` scripts are stubbed in package.json. Marked as the load-bearing root cause. Status FINALIZED.
