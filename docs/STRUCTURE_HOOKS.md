# hooks/ — Data Fetching and Utility Hooks

Custom React hooks. Split into three zones: root-level utilities, `api/` for server data fetching, and `deployment/` for deployment-specific data.

---

## Folder Map

```
hooks/
├── use-auth.tsx             Auth state and session management
├── use-mobile.ts            Mobile breakpoint detection
├── use-toast.ts             Toast notification trigger
│
├── api/                     React Query data-fetching hooks (one per domain)
│   ├── use-alerts.ts
│   ├── use-audit.ts
│   ├── use-chat.ts
│   ├── use-manage.ts
│   ├── use-news.ts
│   ├── use-deployments.ts
│   ├── use-instruments.ts
│   ├── use-market-data.ts
│   ├── use-ml-models.ts
│   ├── use-orders.ts
│   ├── use-organizations.ts
│   ├── use-positions.ts
│   ├── use-reports.ts
│   ├── use-risk.ts
│   ├── use-service-status.ts
│   ├── use-strategies.ts
│   └── use-trading.ts
│
└── deployment/              Deployment-specific hooks (different naming convention)
    ├── _api-stub.ts         API call stub (wraps fetch for deployment endpoints)
    ├── useConfig.ts         Service config data
    ├── useDebounce.ts       Debounce utility hook
    ├── useEpics.ts          Epic readiness data
    ├── useHealth.ts         Service health data
    └── useServices.ts       Service list and status data
```

---

## Root-Level Hooks

### use-auth.tsx
- Returns `{ user, isAuthenticated, isLoading, login, logout }`
- Reads from `lib/stores/auth-store.ts`
- Also handles token refresh and session expiry

### use-mobile.ts
- Returns `boolean` — true if viewport is below mobile breakpoint
- Used by shell components to collapse sidebar or adjust layout

### use-toast.ts
- Returns `{ toast }` function
- Thin wrapper around `sonner` toast library
- Use this instead of importing sonner directly

---

## hooks/api/ — React Query Data Hooks

Each file exports one or more hooks for a single data domain. All hooks follow the same pattern:

```ts
// Pattern
import { useQuery, useMutation } from '@tanstack/react-query'

export function useStrategies(filters?: StrategyFilters) {
  return useQuery({
    queryKey: ['strategies', filters],
    queryFn: () => fetchStrategies(filters),
  })
}

export function useUpdateStrategy() {
  return useMutation({
    mutationFn: (data: UpdateStrategyInput) => updateStrategy(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategies'] })
  })
}
```

Query keys follow `[domain, ...params]` pattern. Invalidation is domain-scoped.

### Domain → Hook file mapping

| Domain | Hook file | Key exports |
|---|---|---|
| Alerts | `use-alerts.ts` | `useAlerts()`, `useMarkAlertRead()` |
| Audit | `use-audit.ts` | `useAuditLog()`, `useAuditEntry()` |
| Deployments | `use-deployments.ts` | `useDeployments()`, `useTriggerDeployment()` |
| Instruments | `use-instruments.ts` | `useInstruments()`, `useInstrument()` |
| Market data | `use-market-data.ts` | `useMarketData()`, `useOrderBook()`, `useTicker()` |
| ML models | `use-ml-models.ts` | `useMlModels()`, `useExperiment()`, `useTrainingRun()` |
| Orders | `use-orders.ts` | `useOrders()`, `useOrder()`, `useSubmitOrder()` |
| Organizations | `use-organizations.ts` | `useOrganizations()`, `useOrganization()` |
| Positions | `use-positions.ts` | `usePositions()`, `usePosition()` |
| Reports | `use-reports.ts` | `useReports()`, `useReport()` |
| Risk | `use-risk.ts` | `useRiskSummary()`, `useRiskExposures()` |
| Service status | `use-service-status.ts` | `useServiceStatus()`, `useAllServicesStatus()` |
| Strategies | `use-strategies.ts` | `useStrategies()`, `useStrategy()`, `usePromoteStrategy()` |
| Chat | `use-chat.ts` | `useChat()` |
| Management | `use-manage.ts` | `useMandates()`, `useFeeSchedules()`, `useDocuments()`, `useGenerateReport()`, `useScheduledReports()` |
| News | `use-news.ts` | `useNewsFeed()` |
| Trading | `use-trading.ts` | `useTradingAccounts()`, `useTradingActivity()` |

### How hooks connect to MSW mocks

In development with `NEXT_PUBLIC_MOCK_API=true`, the fetch calls in these hooks are intercepted by MSW handlers in `lib/mocks/handlers/`. The query function calls `fetch('/api/...')` and MSW returns mock data instead of hitting a real server.

To trace a hook to its mock:
1. Find the API path the hook calls (e.g. `/api/strategies`)
2. Open `lib/mocks/handlers/strategy.ts`
3. Find the matching `http.get('/api/strategies', ...)` handler

### Adding a new API hook

1. Create `hooks/api/use-<domain>.ts`
2. Define query key as `['<domain>', ...params]`
3. Add the corresponding MSW handler to `lib/mocks/handlers/<domain>.ts`
4. Register the handler in `lib/mocks/handlers/index.ts`
5. Add the domain type definitions to `lib/<domain>-types.ts`

---

## hooks/deployment/ — Deployment Hooks

These hooks are used only by components in `components/ops/deployment/`. They have a different naming convention (`useX` camelCase instead of `use-x` kebab-case) — this is a legacy inconsistency. Do not extend this convention to new hooks.

| File | Purpose |
|---|---|
| `_api-stub.ts` | Internal fetch wrapper — adds auth headers to deployment API calls. Named with `_` prefix to indicate it is not a public hook. |
| `useConfig.ts` | Fetches service configuration from deployment-api |
| `useDebounce.ts` | Generic debounce hook (delays a value update) |
| `useEpics.ts` | Fetches epic readiness data from deployment-api |
| `useHealth.ts` | Polls service health endpoints |
| `useServices.ts` | Fetches service list and individual service status |

These hooks call the Python FastAPI deployment-api backend (reference implementation in `_reference/deployment-api/`). In mock mode they return static data from `_api-stub.ts`.

---

## Naming and Style Rules

| Rule | Example |
|---|---|
| File names in `hooks/api/`: kebab-case | `use-market-data.ts` |
| File names in `hooks/deployment/`: legacy camelCase | `useServices.ts` — do not copy |
| Hook function names: `use` prefix, camelCase | `useStrategies()`, `usePositions()` |
| Query key: array starting with domain string | `['strategies', filters]` |
| Mutation hooks: prefixed with action verb | `useSubmitOrder()`, `usePromoteStrategy()` |
| Avoid `any` in return types | Always type the `data` from `useQuery` |

---

## React Query Client Configuration

Configured in `lib/query-client.ts`. Key settings:
- `staleTime`: 30 seconds for most queries (data is not refetched on every mount)
- `retry`: 2 retries with exponential backoff
- `refetchOnWindowFocus`: false (prevents unwanted refetches in trading context)
- Global error handler: logs to console in dev, shows toast in production
