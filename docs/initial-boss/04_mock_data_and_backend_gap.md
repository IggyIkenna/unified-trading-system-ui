# 04 — Mock data & the backend gap

**Status:** OPEN — barely scoped, needs Harsh's input
**Last updated:** 2026-04-15

---

## Why this matters [DISCUSSING]

Backend is not ready. **Mocks are the only source of truth right now.** That means:

- Tests can only verify behaviour against mock data — there is no "real" answer to compare against
- Mock data structure is itself a moving target (subscription model still being shaped)
- When the real backend lands, every test will need to be re-validated against the actual API
- The contract bridge is `lib/types/api-generated.ts` — generated from `lib/registry/openapi.json` — which means schema changes flow from OpenAPI → generated types → consumers

This document is about how to test in a way that is **valuable now** AND **transitions cleanly when the real backend lands**.

---

## What exists today [TENTATIVE]

### Two mock layers in the UI repo

1. **Local fixtures** ([lib/mocks/fixtures/](../../lib/mocks/fixtures/)) — static seed data files. Used by some hooks and contexts directly (e.g. `getOrdersForScope` in [orders-data-context.tsx](../../components/widgets/orders/orders-data-context.tsx)).
2. **Local generators** ([lib/mocks/generators/](../../lib/mocks/generators/)) — deterministic data generators (`mock01`, `pnl-generators`, `order-book`, etc.) for cases where static fixtures aren't enough.

### Mock backend (FastAPI in `unified-trading-api`)

- Sibling Python repo: `/home/hk/unified-trading-system-repos/unified-trading-api`
- Started by Playwright on port 8030 with `CLOUD_MOCK_MODE=true CLOUD_PROVIDER=local DISABLE_AUTH=true`
- React Query hooks call `typedFetch` against this backend
- **Same OpenAPI schema** as the future real backend — generated types in `lib/types/api-generated.ts` come from this

### The mock-mode flag

- [lib/runtime/data-mode.ts](../../lib/runtime/data-mode.ts) — `isMockDataMode()` reads `NEXT_PUBLIC_MOCK_API === "true"`
- Critical comment in that file: "Mock data mode is controlled ONLY by NEXT_PUBLIC_MOCK_API. Auth mode (demo/firebase) is independent."
- This is the toggle that lets a single codebase work against mocks vs real backend

## Open questions about mocks [OPEN]

1. **How much do hooks depend on the FastAPI mock vs local fixtures?** I see `useOrders` calling `typedFetch` (FastAPI route), but `OrdersDataContext` ALSO imports `getOrdersForScope` from `lib/mocks/fixtures/mock-data-index` and `getLedgerOrders` from `lib/api/mock-trade-ledger`. So there are at least three sources for orders data flowing through one component. **Why?** Is one source canonical and the others legacy? Are they merged? Is one used in dev and another in tests?

2. **What does `mock-trade-ledger` do?** Sounds like it's a stateful in-memory ledger for the UI to simulate order placement. Need to read it.

3. **What is `getOrdersForScope`?** Sounds like a fixture filter by scope (org / venue / asset class). Need to understand the scope model.

4. **Is the FastAPI mock backend canonical** — i.e., is the goal to have the UI ONLY talk to the FastAPI mock, with local fixtures going away? Or are local fixtures intentionally kept for offline / static deploys?

5. **What is `data-mode-ideology.md` ([docs/DATA_MODE_IDEOLOGY.md](../DATA_MODE_IDEOLOGY.md))?** Sounds like it documents this exact question. Need to read.

6. **How does the OpenAPI generation flow work in practice?** Who updates `lib/registry/openapi.json`? When? Is it generated from the FastAPI mock backend, or hand-written, or pulled from somewhere else?

## What testing strategies are sensitive to backend status [DISCUSSING]

| Strategy                            | Backend ready?   | Notes                                                                  |
| ----------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| Type checking                       | ✅ Works now     | Generated types are the contract                                       |
| Lint                                | ✅ Works now     | No backend dependency                                                  |
| Vitest unit (hooks, utils)          | ✅ Works now     | Mock the network layer                                                 |
| Vitest integration (contexts)       | ✅ Works now     | Use local fixtures or mocked hooks                                     |
| Vitest fixture invariants (Layer B) | ✅ Works now     | Validates fixture shape against generated types                        |
| Playwright widget harness (Layer D) | ✅ Works now     | Uses FastAPI mock backend or context-level mocks                       |
| Playwright static smoke (Layer E)   | ✅ Already works | Already runs against FastAPI mock backend                              |
| Playwright critical path (Layer F)  | ✅ Already works | Same                                                                   |
| Contract drift detection            | ⏳ Future        | When real backend lands, regenerate types and let TS errors flag drift |

**Conclusion:** every layer in `03_test_strategy_options.md` works against mocks today. **Backend readiness is not a blocker for any of the proposed testing.** When backend lands, the same tests run against the real thing — they should still pass if the mock-vs-real schemas match.

## The "transition to real backend" plan [OPEN]

When the real backend is ready, the migration looks like:

1. Point `lib/registry/openapi.json` at the real backend's OpenAPI spec
2. Run `pnpm generate:types` — this updates `lib/types/api-generated.ts`
3. **TypeScript flags every drift** between old mock shape and new real shape — this is exactly the use case typecheck is designed for
4. Fix the drift in consumers
5. Decide what to do with local fixtures: keep for offline / static deploys, or delete
6. Re-run all test layers against the real backend (probably in a separate CI job)

**This entire migration is gated on Layer A (typecheck) being live.** Without typecheck, the drift is invisible.

## Open questions for Harsh

1. (See "Open questions about mocks" above — all 6.)
2. When is the real backend expected to be ready? Are we testing against mocks for 1 month or 6?
3. Is there value in running tests against BOTH the FastAPI mock AND local fixtures, or pick one?
4. Are there any widgets / hooks where the mock data is _known to be wrong_ relative to what the real backend will return? Those should be tagged so we don't lock them down via tests we'll have to rewrite.

## Decisions log

- _(empty — nothing finalized yet)_
