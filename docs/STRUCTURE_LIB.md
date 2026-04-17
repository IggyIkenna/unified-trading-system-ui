# lib/ — Data Layer, Types, Stores, Fixtures, Config

Last verified: 2026-04-17
Re-sync: `ls lib/ && find lib -maxdepth 2 -type d`

`lib/` is the non-component code layer. It holds typed API clients, auth providers, Zustand stores, fixture + generator data used in mock mode, runtime flags, app config, static registries, help search, test utilities, and shared types/utilities.

Siblings: `docs/STRUCTURE_HOOKS.md`, `docs/STRUCTURE_COMPONENTS.md`, `docs/STRUCTURE_CONTEXT.md`.

---

## Folder Map

```
lib/
├── api/                  Typed fetch wrappers + mock handlers
├── auth/                 Auth providers (demo, firebase) + personas
├── config/               Static app config (services/, strategy schemas, branding)
├── help/                 Help tree + search index
├── mocks/                Fixtures + deterministic generators (NO MSW handlers)
│   ├── fixtures/         Per-domain seed data (.ts files)
│   └── generators/       Deterministic generators (market data, order book, pnl, etc.)
├── registry/             Shipped JSON/YAML registries (openapi, instruments, topology)
├── runtime/              Runtime flags (data-mode.ts)
├── stores/               Zustand state stores
├── testing/              Vitest + RTL test utilities
├── types/                Shared TypeScript types
├── utils/                Named utility modules (formatters, nav-helpers, pnl, …)
│
├── providers.tsx         Root provider tree
├── query-client.ts       React Query client config
├── execution-mode-context.tsx  Batch vs live mode context
├── reset-demo.ts         Demo state reset utility
├── design-tokens.ts      Design-token constants
├── deterministic-mock.ts Seedable PRNG helpers
├── execution-analytics-adapter.ts  Analytics adapter layer
├── lifecycle-mapping.ts / lifecycle-route-mappings.ts / lifecycle-types.ts
├── lightweight-charts-series.ts    Chart series helpers
├── reference-data.ts     Static reference lists (venues, shards, currencies)
├── taxonomy.ts           Business taxonomy (categories, entitlements)
├── strategy-registry.ts  Strategy metadata
├── demo-ids.ts           Canonical demo IDs
└── utils.ts              General utilities (cn(), small formatters)
```

---

## lib/api/ — Typed API Clients

Fetch wrappers, mode-aware routing, and in-memory mock-state modules used when mock mode is on.

| File                       | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `typed-fetch.ts`           | Generated-type-aware fetch wrapper                             |
| `fetch.ts`                 | Base fetch with error handling                                 |
| `with-mode.ts`             | Wraps a client so it honours mock vs real mode                 |
| `mock-handler.ts`          | Request interceptor dispatched when `isMockDataMode()` is true |
| `mock-onboarding-state.ts` | In-memory onboarding state for demos                           |
| `mock-trade-ledger.ts`     | In-memory trade ledger for demos                               |
| `approvals-client.ts`      | Approvals domain client                                        |
| `signup-client.ts`         | Signup / provisioning client                                   |
| `types.ts`                 | API-layer shared types                                         |

---

## lib/auth/ — Auth Providers

Pluggable auth. `get-provider.ts` returns the right implementation based on `NEXT_PUBLIC_AUTH_PROVIDER`. Note: auth mode is independent of data mode.

| File                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| `get-provider.ts`       | Resolves the active provider        |
| `demo-provider.ts`      | Local demo login flow               |
| `firebase-provider.ts`  | Firebase auth integration           |
| `firebase-config.ts`    | Firebase client config              |
| `authorize-client.ts`   | Authorization / entitlements client |
| `personas.ts`           | Canonical demo personas             |
| `types.ts` / `index.ts` | Public types + barrel               |

---

## lib/runtime/ — Runtime Flags

| File           | Purpose                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| `data-mode.ts` | `isMockDataMode()` — authoritative helper; never read `process.env` directly. |

### Data mode ideology

- **Single switch:** mock data is gated by `NEXT_PUBLIC_MOCK_API`.
- **Helper-first:** call `isMockDataMode()` from `lib/runtime/data-mode.ts` — do not read the env var inline.
- **Auth is independent:** `NEXT_PUBLIC_AUTH_PROVIDER=demo` does not imply mock data.
- **Mock mode:** fetch interception + fixture-backed responses keep the UI self-sufficient.
- **Real mode:** no silent fallback to fixtures — show real data, empty states, or explicit errors.

---

## lib/mocks/ — Fixtures and Generators

Used only when `isMockDataMode()` is true, and by Vitest tests. There is no MSW handler layer; interception happens in `lib/api/mock-handler.ts`.

### fixtures/

Per-domain seed data as plain `.ts` modules. Key files:

- `mock-data-index.ts` / `mock-data-seed.ts` — top-level aggregators
- `trading-data.ts`, `execution-platform.ts`, `strategy-platform.ts` — core domain seeds
- `defi-*.ts` — DeFi lending, liquidity, staking, swap, transfer, risk
- `reports-*.ts`, `recon-runs.ts`, `pnl-attribution.ts` — reporting/ops seeds

### generators/

Deterministic generators for time-varying views.

- `deterministic.ts` — seedable PRNG primitives
- `market-data.ts`, `order-book.ts`, `order-flow-generators.ts`
- `pnl-generators.ts`, `defi-yield-generators.ts`

---

## lib/stores/ — Zustand Stores

| File                                        | Purpose                                                   |
| ------------------------------------------- | --------------------------------------------------------- |
| `auth-store.ts`                             | Current user, entitlements, auth lifecycle actions        |
| `global-scope-store.ts`                     | Global filter context (org, shard, date range, asOfDate)  |
| `filter-store.ts`                           | Feature-level filters; resets across domains              |
| `ui-prefs-store.ts`                         | Theme, sidebar, table density — persisted to localStorage |
| `workspace-store.ts` / `workspace-sync.ts`  | Workspace layout + cross-tab sync                         |
| `promote-lifecycle-store.ts`                | Promote workflow state                                    |
| `defi-strategy-store.ts`                    | DeFi strategy builder state                               |
| `combo-persistence.ts` / `scope-helpers.ts` | Persistence helpers + scope selectors                     |

Usage:

```tsx
import { useGlobalScopeStore } from "@/lib/stores/global-scope-store";
const selectedOrg = useGlobalScopeStore((s) => s.selectedOrg);
```

---

## lib/testing/ — Test Utilities

`lib/testing/test-utils.tsx` is the single test-utility module. Used by Vitest (`vitest.config.ts`, `pool: "forks"`) and RTL.

| Export                                                | Purpose                                                |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `renderWithProviders` (`test-utils.tsx:38`)           | Renders a tree wrapped in the standard provider stack  |
| `auditInteractiveElements` (`test-utils.tsx:65`)      | Returns audit report of buttons/links/inputs in a tree |
| `assertAllButtonsHaveHandlers` (`test-utils.tsx:254`) | Fails the test if any button lacks an `onClick`        |

---

## lib/registry/ — Shipped Registries

Read-only data shipped with the bundle. Source of truth for routes, instruments, topology.

| File                                             | Purpose                               |
| ------------------------------------------------ | ------------------------------------- |
| `openapi.yaml` / `openapi.json`                  | API contract snapshot                 |
| `generated.ts`                                   | Generated bindings from registry JSON |
| `config-registry.json`                           | Backend config registry snapshot      |
| `instruments.ts` / `instruments-snapshot.json`   | Instrument universe                   |
| `runtime-topology.yaml` / `system-topology.json` | Service/runtime topology              |
| `sharding_config.yaml`                           | Shard definitions                     |
| `ui-reference-data.json`                         | UI-facing reference lists             |

---

## lib/config/ — Application Config

Build-time constants. Not env vars, not secrets.

| File                | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `api.ts`            | API base URLs and endpoint paths                    |
| `auth.ts`           | Auth provider settings                              |
| `branding.ts`       | Brand copy, logo paths                              |
| `services.ts`       | Platform service registry (metadata + entitlements) |
| `platform-stats.ts` | Marketing/landing page stats                        |
| `index.ts`          | Barrel                                              |

### config/services/

Per-service config modules: `accounts.config.ts`, `alerts.config.ts`, `bundle.config.ts`, `data-service.config.ts`, `defi.config.ts`, `defi-bundles.config.ts`, `instructions.config.ts`, `markets.config.ts`, `pnl.config.ts`, `promote.config.ts`, `strategies.config.ts`, `trading.config.ts`, `trading-nav-paths.config.ts`.

### config/strategy-config-schemas/

`types.ts`, `cefi.ts`, `defi.ts`, `options.ts`, `index.ts` — strategy parameter schemas consumed by the strategy builder.

---

## lib/help/ — Help System

| File             | Purpose                              |
| ---------------- | ------------------------------------ |
| `help-tree.ts`   | Hierarchical help topic tree         |
| `help-search.ts` | Search index / matcher over the tree |

---

## lib/types/ — Shared Types

Domain types shared across components, hooks, and API clients: `accounts.ts`, `api-generated.ts`, `backtest-analytics.ts`, `bundles.ts`, `data-service.ts`, `defi.ts`, `deployment.ts`, `execution-platform.ts`, `instructions.ts`, `markets.ts`, `ml.ts`, `options.ts`, `pnl.ts`, `strategy-platform.ts`, `trading.ts`, `user-management.ts`. `api-generated.ts` is regenerated from OpenAPI; do not hand-edit.

---

## lib/utils/ — Named Utilities

Modular utilities (use these over dumping into root `utils.ts`): `formatters.ts`, `nav-helpers.ts`, `pnl.ts`, `indicators.ts`, `bundles.ts`, `instructions.ts`, `export.ts`.

---

## Top-Level Infrastructure Files

| File                                                                        | Purpose                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `providers.tsx`                                                             | Root provider tree (QueryClient, Auth, Theme, Toaster) |
| `query-client.ts`                                                           | React Query defaults (stale time, retry)               |
| `execution-mode-context.tsx`                                                | Batch vs live mode context                             |
| `reset-demo.ts`                                                             | Resets stores + query cache for demo                   |
| `design-tokens.ts`                                                          | Colour / spacing / typography tokens                   |
| `deterministic-mock.ts`                                                     | Seedable PRNG helpers used by generators               |
| `execution-analytics-adapter.ts`                                            | Adapter between execution stores and analytics views   |
| `lightweight-charts-series.ts`                                              | Series builders for `lightweight-charts`               |
| `lifecycle-mapping.ts`, `lifecycle-route-mappings.ts`, `lifecycle-types.ts` | Lifecycle stages → routes/components                   |
| `reference-data.ts`                                                         | Static reference data (venues, shards, currencies)     |
| `taxonomy.ts`                                                               | Business taxonomy (categories, entitlement keys)       |
| `strategy-registry.ts`                                                      | Strategy metadata registry                             |
| `demo-ids.ts`                                                               | Canonical IDs used across demo fixtures                |
| `utils.ts`                                                                  | `cn()` + small shared helpers                          |

There is no `lib/hooks/` directory — React hooks live in the top-level `hooks/` folder (see `docs/STRUCTURE_HOOKS.md`).

---

## Where to Put New Code

| What you're adding          | Where                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| New shared type             | `lib/types/<name>.ts`                                            |
| New fixture set             | `lib/mocks/fixtures/<domain>.ts` + register in `mock-data-index` |
| New deterministic generator | `lib/mocks/generators/<name>.ts`                                 |
| New API client              | `lib/api/<name>-client.ts` via `typed-fetch`                     |
| New mock interception       | Extend `lib/api/mock-handler.ts` (no MSW handlers)               |
| New Zustand store           | `lib/stores/<concern>-store.ts`                                  |
| New app config constant     | `lib/config/<area>.ts` or `lib/config/services/<svc>.config.ts`  |
| New strategy schema         | `lib/config/strategy-config-schemas/<venue>.ts`                  |
| New shared utility          | `lib/utils/<name>.ts` (reserve root `utils.ts` for `cn()` etc.)  |
| New test helper             | Extend `lib/testing/test-utils.tsx`                              |
