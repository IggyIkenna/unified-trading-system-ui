# lib/ — Data Layer, Types, Stores, Mocks, Config

`lib/` is the non-component code layer. It contains types, Zustand stores, MSW mock handlers, React Query client config, application config, and utility functions.

---

## Folder Map

```
lib/
├── config/                     Application configuration constants
├── stores/                     Zustand state stores
├── mocks/                      MSW mock service worker setup + handlers
│   ├── handlers/               Per-domain mock API handlers
│   └── fixtures/               Test personas
├── types/                      TypeScript type definitions
├── testing/                    Test utilities
├── registry/                   (folder — content TBC)
│
├── [domain]-types.ts           Domain-specific TypeScript types (flat files)
├── [domain]-mock-data.ts       Domain-specific mock data (flat files)
│
├── config files (flat)         lifecycle-mapping.ts, reference-data.ts, taxonomy.ts, trading-data.ts, strategy-registry.ts
├── providers.tsx               React provider tree
├── query-client.ts             React Query client configuration
├── execution-mode-context.tsx  Batch vs live mode React context
├── reset-demo.ts               Demo state reset utility
└── utils.ts                    General utilities (cn(), formatters, etc.)
```

---

## lib/config/ — Application Configuration

Static configuration constants that are loaded at build time (not from environment). Not to be confused with backend service configuration (which lives in `context/api-contracts/openapi/config-registry.json`).

| File                | Purpose                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `api.ts`            | API base URLs and endpoint paths                                                                          |
| `auth.ts`           | Auth provider settings, redirect URLs                                                                     |
| `branding.ts`       | Company name, logo paths, colour tokens, marketing copy                                                   |
| `services.ts`       | Service registry — list of all platform services with metadata (name, icon, description, entitlement key) |
| `platform-stats.ts` | Marketing stats for landing page (e.g. "99.9% uptime")                                                    |
| `index.ts`          | Re-exports all config                                                                                     |

**When to use:** These are constants, not env vars. Do not put secrets here. Environment-specific values belong in `.env.*` files and are accessed via `process.env`.

---

## lib/stores/ — Zustand State Stores

Four stores, each single-responsibility.

### auth-store.ts

- Current user: `user_id`, `organisation_id`, `role`, `entitlements`
- Auth state: `isAuthenticated`, `isLoading`
- Actions: `login()`, `logout()`, `refreshToken()`

### global-scope-store.ts

- Global filter state shared across all platform pages
- Fields: `selectedOrg`, `selectedShard`, `selectedDateRange`, `asOfDate`
- This store is the source of truth for "what data context am I currently viewing"
- Components that render data should read from this store for filter values

### filter-store.ts

- Feature-level filter state (more granular than global scope)
- Fields vary by active domain — strategy filters, venue filters, instrument filters
- Resets when navigating between major domains

### ui-prefs-store.ts

- User UI preferences: `theme` (dark/light), `sidebarCollapsed`, `tablePageSize`, `defaultView`
- Persisted to localStorage via Zustand persist middleware

**Pattern for using stores in components:**

```tsx
import { useGlobalScopeStore } from "@/lib/stores/global-scope-store";
const selectedOrg = useGlobalScopeStore((s) => s.selectedOrg);
```

---

## lib/mocks/ — MSW Mock Service Worker

Used in development when `NEXT_PUBLIC_MOCK_API=true` and in Jest unit tests.

### Data mode ideology (authoritative)

- **Single switch:** mock data mode is controlled only by `NEXT_PUBLIC_MOCK_API`.
- **Helper-first:** runtime code must use `isMockDataMode()` from `lib/runtime/data-mode.ts` instead of reading `process.env.NEXT_PUBLIC_MOCK_API` directly.
- **Auth is independent:** `NEXT_PUBLIC_AUTH_PROVIDER=demo` does not imply mock API mode.
- **Mock mode behavior:** fetch interception + fixture-backed responses keep the UI self-sufficient with no backend.
- **Real mode behavior:** do not silently fall back to fixtures for API-backed views; show real API data, empty states, or explicit errors.

### Setup files

- `browser.ts` — MSW browser worker setup (used in development)
- `server.ts` — MSW Node server setup (used in Jest tests via `jest.setup.js`)
- `utils.ts` — Shared mock utilities (delay helpers, error response builders)

### fixtures/

- `personas.ts` — User personas for testing (trader, quant, admin, executive, compliance, client)

### handlers/index.ts

Registers all handlers. When adding a new domain, import and register here.

### handlers/ — Per-Domain Handlers

Each file intercepts API calls for one domain and returns mock data.

| File                 | Intercepts                                        |
| -------------------- | ------------------------------------------------- |
| `auth.ts`            | `/api/auth/*` — login, logout, token refresh      |
| `alerts.ts`          | `/api/alerts/*`                                   |
| `audit.ts`           | `/api/audit/*`                                    |
| `data.ts`            | `/api/data/*` — data subscriptions, coverage      |
| `deployment.ts`      | `/api/deployments/*` — deployment state, triggers |
| `execution.ts`       | `/api/execution/*` — fills, TCA, venues           |
| `market-data.ts`     | `/api/market-data/*` — OHLCV, order book, tickers |
| `ml.ts`              | `/api/ml/*` — experiments, models, training       |
| `positions.ts`       | `/api/positions/*`                                |
| `reporting.ts`       | `/api/reports/*`                                  |
| `risk.ts`            | `/api/risk/*`                                     |
| `service-status.ts`  | `/api/services/*` — service health                |
| `strategy.ts`        | `/api/strategies/*`                               |
| `trading.ts`         | `/api/trading/*` — orders, accounts               |
| `user-management.ts` | `/api/users/*`, `/api/organisations/*`            |

**Pattern for adding a new handler:**

```ts
// lib/mocks/handlers/my-domain.ts
import { http, HttpResponse } from "msw";
export const myDomainHandlers = [http.get("/api/my-domain", () => HttpResponse.json({ data: [] }))];

// lib/mocks/handlers/index.ts
import { myDomainHandlers } from "./my-domain";
export const handlers = [...existingHandlers, ...myDomainHandlers];
```

---

## Domain Type + Mock Data Files (Flat in lib/)

These files are a current structural gap — they sit at the root of `lib/` without a parent folder. They follow a consistent naming pattern.

| File                              | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `data-service-types.ts`           | TypeScript types for the data service domain |
| `data-service-mock-data.ts`       | Mock data for data service features          |
| `execution-platform-types.ts`     | Types for execution platform                 |
| `execution-platform-mock-data.ts` | Mock data for execution platform             |
| `ml-types.ts`                     | Types for ML domain                          |
| `ml-mock-data.ts`                 | Mock data for ML features                    |
| `strategy-platform-types.ts`      | Types for strategy platform                  |
| `strategy-platform-mock-data.ts`  | Mock data for strategy platform              |

**Note:** The MSW handlers in `lib/mocks/handlers/` should use these mock data files as their data source. If you add a new mock data value, add it to the `*-mock-data.ts` file and import it in the handler.

---

## Constants / Reference Data Files (Flat in lib/)

| File                   | Purpose                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `lifecycle-mapping.ts` | Maps lifecycle stages (Design, Simulate, Promote, Run, Monitor, Explain, Reconcile) to route paths and component states |
| `reference-data.ts`    | Static reference data: venue list, asset class list, currency list, shard definitions                                   |
| `taxonomy.ts`          | Business taxonomy: service categories, role definitions, entitlement keys                                               |
| `trading-data.ts`      | Trading-specific constants: order types, order statuses, execution modes                                                |
| `strategy-registry.ts` | Strategy registry: known strategy types, parameter definitions                                                          |

---

## lib/types/ — TypeScript Types

Currently contains `deployment.ts` (deployment-specific types). This folder should grow to hold all non-domain-specific shared types (pagination, API response wrappers, shared UI state types).

---

## Infrastructure Files (Flat in lib/)

| File                         | Purpose                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `providers.tsx`              | Root React provider tree — wraps app with QueryClientProvider, AuthProvider, ThemeProvider, Toaster      |
| `query-client.ts`            | React Query client config — default stale time, retry logic, error handling                              |
| `execution-mode-context.tsx` | React context for batch vs live mode — consumed by `execution-mode-toggle.tsx` and mode-aware components |
| `reset-demo.ts`              | Utility to reset all demo state (stores + query cache) — used by demo reset button                       |
| `utils.ts`                   | General utilities: `cn()` (class merging), date formatters, number formatters, currency formatters       |

---

## Where to Put New Code

| What you're adding                      | Where                                                           |
| --------------------------------------- | --------------------------------------------------------------- |
| New domain types                        | `lib/<domain>-types.ts` (follow existing pattern)               |
| New mock data for a domain              | `lib/<domain>-mock-data.ts`                                     |
| New MSW handler for a domain            | `lib/mocks/handlers/<domain>.ts` + register in `index.ts`       |
| New Zustand store                       | `lib/stores/<concern>-store.ts`                                 |
| New app config constant                 | `lib/config/services.ts` or `lib/config/index.ts`               |
| New shared utility                      | `lib/utils.ts` (if small) or `lib/utils/<name>.ts` (if complex) |
| New shared TypeScript type (non-domain) | `lib/types/<name>.ts`                                           |
