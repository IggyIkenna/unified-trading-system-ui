# hooks/ — Data Fetching and Utility Hooks

Custom React hooks. Split into three zones: root-level utilities (auth, UI primitives, transport), `api/` for React Query server-data hooks, and `deployment/` for deployment-api-specific hooks.

**Last verified:** 2026-04-17
**Re-sync check:** `ls hooks/api/ | wc -l && ls hooks/`
(If the count in this doc drifts from `ls hooks/api/ | wc -l`, this doc is stale.)

Current count: **34** files in `hooks/api/`, **10** files at `hooks/` root (8 hooks + 2 subfolders), **6** files in `hooks/deployment/`.

---

## Folder Map

```
hooks/
├── use-app-access.tsx          App role / access gating (AppAccessProvider + useAppAccess)
├── use-auth.tsx                Auth state and session management
├── use-mobile.ts               Mobile breakpoint detection
├── use-protocol-status.ts      Tracks active WS/SSE/REST/Mock connection registry
├── use-scoped-categories.ts    Category scoping for the current user/role
├── use-sports-live-updates.ts  Sports fixtures live-update subscription (SSE-backed)
├── use-tab-param.ts            URL ?tab= query-param sync
├── use-ticking-now.ts          Re-renders on interval; returns Date.now() ms
├── use-toast.ts                Toast notification trigger (sonner wrapper)
├── use-websocket.ts            Generic WebSocket client hook with status tracking
│
├── api/                        React Query data-fetching hooks (one per domain) — 34 files
│   └── (see table below)
│
└── deployment/                 Deployment-api hooks (legacy camelCase naming)
    ├── _api-stub.ts            Internal fetch wrapper — adds auth headers
    ├── useConfig.ts            Service configuration from deployment-api
    ├── useDebounce.ts          Generic debounce utility
    ├── useEpics.ts             Epic readiness data
    ├── useHealth.ts            Service health polling
    └── useServices.ts          Service list and per-service status
```

---

## Root-Level Hooks

| Hook                         | Purpose                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `use-app-access.tsx`         | Exports `AppAccessProvider` + `useAppAccess()` returning `{ role, permissions, ... }` for role-gated routes. |
| `use-auth.tsx`               | Auth session: `{ user, isAuthenticated, isLoading, login, logout }`; reads `lib/stores/auth-store.ts`.       |
| `use-mobile.ts`              | Returns `boolean` — true below mobile breakpoint.                                                            |
| `use-protocol-status.ts`     | Global registry of live connections. `registerConnection` / `unregisterConnection` + `useProtocolStatus()`.  |
| `use-scoped-categories.ts`   | Returns `ScopedCategories` — category list visible to the current access scope.                              |
| `use-sports-live-updates.ts` | SSE-style subscription to fixture live updates; `useSportsLiveUpdates({ enabled })`.                         |
| `use-tab-param.ts`           | Two-way-bind React state to `?tab=` URL param.                                                               |
| `use-ticking-now.ts`         | `useTickingNowMs(intervalMs)` — forces re-render and returns the current time.                               |
| `use-toast.ts`               | `toast()` helper — thin wrapper around `sonner`. Use instead of importing `sonner` directly.                 |
| `use-websocket.ts`           | Generic WS client — `WebSocketStatus` union, auto-reconnect, message callback.                               |

---

## hooks/api/ — React Query Data Hooks (34 files)

Each file exports one or more React Query hooks for a single data domain. Query keys follow `[domain, ...params]`; invalidation is domain-scoped. Pattern:

```ts
import { useQuery, useMutation } from "@tanstack/react-query";

export function useStrategies(filters?: StrategyFilters) {
  return useQuery({
    queryKey: ["strategies", filters],
    queryFn: () => fetchStrategies(filters),
  });
}
```

### Transport primitives (SSE)

| File                  | Purpose                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `use-sse.ts`          | Generic SSE client — `useSSE<T>()`, `UseSSEOptions`, `UseSSEReturn`. Base for all stream hooks below.                                 |
| `use-sse-channels.ts` | Typed SSE channel hooks: `usePositionStream`, `useRiskAlertStream`, `useSignalStream`, `usePredictionStream`, `useDeployEventStream`. |

### Auth / Identity / Admin

| File                     | Key exports                                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `use-firebase-users.ts`  | `useFirebaseUsers()` — lists Firebase auth users with pagination.                                                                                                                                        |
| `use-user-management.ts` | `useProvisionedUsers`, `useProvisionedUser`, `useQuotaCheck`, `useOnboardUser`, `useModifyUser`, `useOffboardUser`, `useReprovisionUser`, `useUserWorkflows`, `useAccessTemplates`, `useCreateTemplate`. |
| `use-organizations.ts`   | `useOrganizations()`, `useOrganization()`.                                                                                                                                                               |
| `use-audit.ts`           | `useAuditLog()`, `useAuditEntry()`.                                                                                                                                                                      |

### Market data / Instruments

| File                 | Key exports                                         |
| -------------------- | --------------------------------------------------- |
| `use-market-data.ts` | `useMarketData()`, `useOrderBook()`, `useTicker()`. |
| `use-instruments.ts` | `useInstruments()`, `useInstrument()`.              |
| `use-calendar.ts`    | `useEconomicResults()`, `useCorporateActions()`.    |
| `use-news.ts`        | `useNewsFeed()`.                                    |

### Orders / Trading / Positions

| File                      | Key exports                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `use-orders.ts`           | `useOrders()`, `useOrder()`, `useSubmitOrder()`.                                                                         |
| `use-trading.ts`          | `useTradingAccounts()`, `useTradingActivity()`.                                                                          |
| `use-positions.ts`        | `usePositions()`, `usePosition()`.                                                                                       |
| `use-performance.ts`      | `useClients`, `usePerformanceSummary`, `useOpenPositions`, `useCoinBreakdown`, `useBalanceBreakdown`, `useTradeHistory`. |
| `use-transfer-history.ts` | `useTransferHistory()`.                                                                                                  |
| `use-strategies.ts`       | `useStrategies()`, `useStrategy()`, `usePromoteStrategy()`.                                                              |
| `use-ml-models.ts`        | `useMlModels()`, `useExperiment()`, `useTrainingRun()`.                                                                  |

### DeFi

| File                 | Key exports                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `use-defi-detail.ts` | `useFundingMatrix`, `useLstCollateral`, `useVenueAllocation`, `useBasisDirections`, `useLendingRates`, `useLendingPositions`, `useLPPositionRange`, `useImpermanentLoss`, `useRebalanceHistory`, `useLPMLConfidence` (+ more). |

### Sports

| File            | Key exports                                            |
| --------------- | ------------------------------------------------------ |
| `use-sports.ts` | `useFixtures()`, `useLeagues()`, `useSportsHistory()`. |

### Risk / Safety controls

| File                              | Key exports                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `use-risk.ts`                     | `useRiskSummary()`, `useRiskExposures()`.                                                                                             |
| `use-risk-alert-notifications.ts` | `useRiskAlertNotifications()`.                                                                                                        |
| `use-alerts.ts`                   | `useAlerts()`, `useMarkAlertRead()`.                                                                                                  |
| `use-emergency-close.ts`          | `useEmergencyCloseAll(clientId)` — kill-all-positions mutation.                                                                       |
| `use-recovery-controls.ts`        | `useKillSwitchStatus`, `useKillSwitchActivate`, `useKillSwitchDeactivate`, `useCircuitBreakerStates`, `useForceOpenBreaker` (+ more). |
| `use-unwind-preview.ts`           | `useUnwindPreview(request)`, `useUnwindComparison(totalExposure)` — TWAP/MARKET unwind simulator.                                     |
| `use-reconciliation.ts`           | `useReconciliationSnapshot`, `useReconciliationHistory`, `useReconciliationEvaluate`.                                                 |

### Ops / Platform / Infrastructure

| File                    | Key exports                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `use-service-status.ts` | `useServiceStatus()`, `useAllServicesStatus()`.                                                                                     |
| `use-deployments.ts`    | `useDeployments()`, `useTriggerDeployment()`.                                                                                       |
| `use-data-pipeline.ts`  | `useDataPipelineStages`, `useDataPipelineJobs`, `useDataPipelineAlerts`.                                                            |
| `use-data-status.ts`    | `useDataStatus`, `useDataStatusTurbo`, `useCoverageSummary`, `useVenueFilters`, `usePipelineOverview`, `useInstrumentAvailability`. |

### Compliance / Billing / Mgmt

| File              | Key exports                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `use-manage.ts`   | `useMandates()`, `useFeeSchedules()`, `useDocuments()`, `useGenerateReport()`, `useScheduledReports()`. |
| `use-invoices.ts` | `useInvoices(orgId)`, `useInvoice(id)`, `useGenerateInvoice()`, plus `VALID_TRANSITIONS` state machine. |
| `use-reports.ts`  | `useReports()`, `useReport()`.                                                                          |
| `use-chat.ts`     | `useChat()` — in-app chat/assistant stream.                                                             |

---

## hooks/deployment/ — Deployment Hooks

Used only by `components/ops/deployment/*`. Legacy `useX` camelCase naming — **do not extend this convention to new hooks**. These call the Python FastAPI `deployment-api` backend; in mock mode they return static data from `_api-stub.ts`.

| File             | Purpose                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| `_api-stub.ts`   | Internal fetch wrapper, adds auth headers. Leading `_` = not a public hook. |
| `useConfig.ts`   | Fetches service configuration from deployment-api.                          |
| `useDebounce.ts` | Generic debounce utility (delays a value update).                           |
| `useEpics.ts`    | Fetches epic readiness data.                                                |
| `useHealth.ts`   | Polls service health endpoints.                                             |
| `useServices.ts` | Fetches service list and individual service status.                         |

---

## MSW Mock Wiring

In development with `NEXT_PUBLIC_MOCK_API=true`, hook fetch calls are intercepted by MSW, so `/api/*` requests resolve from fixtures without backend services.

- Use `isMockDataMode()` from `lib/runtime/data-mode.ts` — never read `process.env.NEXT_PUBLIC_MOCK_API` directly in hooks/components.
- In non-mock mode, hooks must NOT silently replace missing API payloads with fixtures. Return real data, explicit empty states, or surface errors.

Trace a hook to its mock:

1. Find the API path the hook calls (e.g. `/api/strategies`).
2. Open `lib/mocks/handlers/<domain>.ts`.
3. Find the matching `http.get('/api/...', ...)` handler.

---

## Adding a New API Hook

1. Create `hooks/api/use-<domain>.ts`.
2. Define query key as `['<domain>', ...params]`.
3. Add MSW handler in `lib/mocks/handlers/<domain>.ts`.
4. Register handler in `lib/mocks/handlers/index.ts`.
5. Add domain type definitions in `lib/<domain>-types.ts`.
6. Bump the count at the top of this doc and re-run `ls hooks/api/ | wc -l` to verify.

---

## Naming and Style Rules

| Rule                                                | Example                                    |
| --------------------------------------------------- | ------------------------------------------ |
| File names in `hooks/api/`: kebab-case              | `use-market-data.ts`                       |
| File names in `hooks/deployment/`: legacy camelCase | `useServices.ts` — do not copy             |
| Hook function names: `use` prefix, camelCase        | `useStrategies()`, `usePositions()`        |
| Query key: array starting with domain string        | `['strategies', filters]`                  |
| Mutation hooks: prefixed with action verb           | `useSubmitOrder()`, `usePromoteStrategy()` |
| Avoid `any` in return types                         | Always type the `data` from `useQuery`     |

---

## React Query Client Configuration

Configured in `lib/query-client.ts`:

- `staleTime`: 30s for most queries.
- `retry`: 2 retries with exponential backoff.
- `refetchOnWindowFocus`: `false` (prevents unwanted refetches in trading context).
- Global error handler: logs to console in dev, shows toast in production.
