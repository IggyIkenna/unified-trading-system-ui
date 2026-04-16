# Module G — Navigation, Shell & Filter Propagation Audit

---

## Part 1: Route Mapping Completeness

Read `lib/lifecycle-mapping.ts` — the `routeMappings` array and `getRouteMapping()` function.
Read `components/shell/service-tabs.tsx` — all tab definitions (`DATA_TABS`, `BUILD_TABS`, `TRADING_TABS`, etc.).

For every `href` in every tab definition:

1. Does it have a matching entry in `routeMappings`?
2. If not, does it match via prefix?
3. If not, does it fall through to a fallback (observe, trading)?
4. If not, `getRouteMapping` returns `undefined` — the lifecycle button won't highlight.

Output a table:

| Tab Set | Tab Label | href | routeMappings Match | Lifecycle Stage | Bug? |
| ------- | --------- | ---- | ------------------- | --------------- | ---- |

## Part 2: Active Tab Logic

Read the `isActive` logic in:

- `components/shell/service-tabs.tsx` (ServiceTabs)
- `components/shell/trading-vertical-nav.tsx` (TradingVerticalNav)

Check for:

1. Are the implementations identical? (Should extract to shared helper)
2. Do any tabs with `familyGroup` lack `exact: true` on the family index tab? (Causes parent+child double-highlight)
3. Does `isFamilyActive` in TradingVerticalNav work correctly after adding `exact: true`?

## Part 3: Breadcrumb Accuracy

Read `components/shell/breadcrumbs.tsx`.

For every platform route, check:

1. Does the breadcrumb show the correct label?
2. Does it show the correct hierarchy (lifecycle → service → page)?
3. Are there routes where the breadcrumb shows "Observe" when the user is in "Trading"? (This happens if the route is mapped to the wrong `primaryStage`)

## Part 4: Global Scope Filter Propagation

Read:

- `lib/stores/global-scope-store.ts` — what fields are stored
- `components/platform/global-scope-filters.tsx` — what the UI writes
- `components/platform/live-asof-toggle.tsx` — mode toggle

Then search ALL platform pages and hooks for:

1. Which pages/hooks call `useGlobalScope()`?
2. Which pages/hooks use the `organizationIds`, `clientIds`, `strategyIds` values to filter their data?
3. Which pages SHOULD use global scope but DON'T? (Any page that shows org/client/strategy-scoped data)

Output a table:

| Page/Hook | Uses useGlobalScope? | Filters by org? | Filters by client? | Filters by strategy? | Gap? |
| --------- | -------------------- | --------------- | ------------------ | -------------------- | ---- |

## Part 5: Workspace State Completeness

Read:

- `lib/stores/workspace-store.ts` — what is persisted
- `components/widgets/workspace-toolbar.tsx` — what controls are exposed

Check:

1. Can workspaces be created, saved, duplicated, exported, imported on ALL widget-grid pages? Or only trading?
2. Is workspace state per-tab correct? (Each tab has independent workspaces)
3. Can custom panels be deleted from the UI? (Known bug: §1.3)
4. Does workspace export include filter state, or only widget layout?

## Output Expectations

- Route mapping completeness table
- Active tab logic comparison (identical? differences?)
- Filter propagation coverage table (which pages consume global scope)
- Gap list: pages that should filter by global scope but don't
