# 05 — Repo structure question (split or not?)

**Status:** FINALIZED — do not split
**Last updated:** 2026-04-16

---

## The question [DISCUSSING]

Should `unified-trading-system-ui` be split into multiple repos / packages (Nx / Turborepo / pnpm workspaces) so that:

- Different lifecycle tabs live in separate packages
- Agents can work in isolation
- Tests run per-package and the failure surface is contained
- Shared components live in a "core" package

This was the strong recommendation from a different agent in the prior conversation ([conversation transcript](../../converstaion.md)).

## Why splitting is tempting [DISCUSSING]

- Backend was successfully split from a monolith into 32 repos, providing a proven analogue
- Hard isolation between agents — they literally cannot touch files outside their package
- Per-package test suites — only run tests for the packages that changed
- Cleaner ownership boundaries
- Easier to lock down "stable" packages while iterating on others

## Why splitting is the wrong answer for THIS codebase [TENTATIVE]

### 1. The widget registry already provides isolation

[components/widgets/widget-registry.ts](../../components/widgets/widget-registry.ts) defines a `WidgetDefinition` interface. Each widget:

- Lives in its own folder under [components/widgets/{domain}/](../../components/widgets/)
- Has its own `register.ts`
- Is addressable by a unique `id`
- Has declared `requiredEntitlements` and `availableOn` tabs

Two agents working on different widget folders **already don't conflict at the file level**. The isolation Nx would give you is already present at the directory level for the actual unit of work.

### 2. Yesterday's bug would still happen after a split

Yesterday's incident was a shared **data context** breaking consuming widgets. In any split scheme, that context would live in either:

- A shared `core` package — meaning the bug now spans package boundaries and is _harder_ to debug
- The `orders` package — meaning everything that consumes orders data is locked into the `orders` package

The bug class is "shared dependency changes break consumers." Splitting doesn't fix that — it just relocates it.

### 3. Harsh isn't actually hitting parallel-edit conflicts

From the conversation: agents work in parallel BUT mostly don't touch the same files. The reported pain isn't merge conflicts, it's silent regressions. **Splitting solves merge conflicts, not silent regressions.**

### 4. The shared surface area is enormous

Even a "minimal" split would require migrating these into a core package, all currently single-source-of-truth:

- `lib/mocks/` — fixtures + generators
- `lib/types/api-generated.ts` — generated types
- `hooks/api/` — React Query hooks (consumed by every widget domain)
- `lib/stores/` — Zustand stores (global scope, etc.)
- `lib/runtime/` — data mode, scope helpers
- `lib/api/` — fetch wrappers, mock-trade-ledger
- `components/shared/` — shared UI primitives
- `components/ui/` — Radix UI wrappers
- `components/widgets/widget-registry.ts` itself
- Theming, entitlements, auth, routing helpers
- `app/` — Next.js routing layer (cannot be split, it's framework-level)

Every cross-package change forces a coordinated multi-package release.

### 5. Build complexity and tooling cost

Next.js + Turborepo / Nx + workspace dependencies + import path rewrites + cross-package type generation + CI matrix changes. Estimated 2-4 weeks of migration work + ongoing coordination overhead.

### 6. Backend's situation was different

The backend split worked because:

- Each microservice has a **clean runtime boundary** (network calls, separate processes)
- Schemas are exchanged via **explicit contracts** (UAC, UIC) with version negotiation
- A frontend doesn't have those boundaries — it's one process, one bundle, one runtime

A frontend "monorepo with packages" is **not** the same kind of split. It's a build-time abstraction over what is still one runtime.

### 7. The actual root cause is fixable in 1-2 days

Un-stub typecheck + lint, build a widget harness route, write data-context contract tests. Total estimated effort: 1-2 weeks. **Zero migration risk, no build system change, no lockfile shuffling.**

## What would change my mind [DISCUSSING]

We'd revisit splitting if, after the testing layers from `03_test_strategy_options.md` are in place, we still see:

- Agents hitting frequent file-level conflicts (not the case today)
- Test runtimes blowing past the 3-minute budget because they have to scan the whole tree (mitigatable with smart test selection)
- A genuine need to ship pieces of the UI independently (e.g., a separate "trading terminal" deployment vs an "analytics dashboard" deployment) — currently NOT a requirement

## Decision [FINALIZED]

**Do not split the repo.** Solve the regression problem with tests + a gate. Revisit only if testing layers fail to address the pain.

Open questions resolved:

1. **Single deploy** — always a single deploy of the whole UI. No independent shipping.
2. **No file-level conflicts** — the pain is silent regressions, not merge conflicts. Splitting solves the wrong problem.
3. **No external pressure** — purely an architecture question, answered by the evidence above.

## Decisions log

- 2026-04-15: Captured rationale for not splitting. Status TENTATIVE pending Harsh confirming.
- 2026-04-16: FINALIZED. All open questions resolved — single deploy, no conflicts, no pressure to split. Widget registry provides sufficient isolation. `converstaion.md` (transcript of agent that recommended splitting) deleted.
