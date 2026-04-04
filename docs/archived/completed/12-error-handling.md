# Task 12 — Error Handling, Loading States & Resilience

**Source:** Codebase audit, WORK_TRACKER (new section)
**Priority:** P2 — prevents white screens in production, improves perceived reliability

---

## Agent Execution Model

| Phase | What | Model | Output |
|-------|------|-------|--------|
| **Phase 1 — Discovery** | Run the audit commands below. Find every page without error handling, every missing error.tsx/loading.tsx, every data-fetching page without tristate. | **Smart** (claude-4-opus or claude-3.7-sonnet) | Concrete list: unprotected pages, missing boundary files, pages needing tristate |
| **Phase 2 — Execution** | Take Phase 1 list and mechanically: create error.tsx/loading.tsx/not-found.tsx files, add tristate handling to unprotected pages, extend ErrorBoundary coverage. | **Cheap** (claude-3.5-sonnet) | Code changes + passing typecheck |

**This task is small enough for a single session.** Parts 1-3 (create boundary files) are
quick and mechanical. Part 4 (tristate enforcement) is the bulk of the work but repetitive.
Part 5 (ErrorBoundary extension) is 2-3 files.

### Discovery Commands (Phase 1 — run BEFORE starting any part)

```bash
cd unified-trading-system-ui

# Missing Next.js boundary files
echo "=== error.tsx ===" && find app/ -name "error.tsx" -type f
echo "=== loading.tsx ===" && find app/ -name "loading.tsx" -type f
echo "=== not-found.tsx ===" && find app/ -name "not-found.tsx" -type f

# ErrorBoundary coverage
rg -l "ErrorBoundary" app/ components/

# Existing error/loading components (use these, don't create new ones)
echo "=== Shared components ===" 
ls -la components/shared/error-boundary.tsx components/shared/api-error.tsx components/shared/spinner.tsx components/shared/empty-state.tsx components/ui/skeleton.tsx

# Pages that fetch data (need tristate handling)
rg -l "useQuery|useMutation|isLoading|isFetching" app/ --glob '*.tsx' | wc -l
rg -l "useQuery|useMutation|isLoading|isFetching" app/ --glob '*.tsx'

# Pages that handle errors (already OK)
rg -l 'isError|ApiError|ErrorBoundary' app/ --glob '*.tsx'

# Pages with NO error handling (the gap)
# Compare the two lists above — pages in the first but not the second need work

# Layouts with ErrorBoundary (which route groups are protected?)
rg -l "ErrorBoundary" app/ --glob 'layout.tsx'

# Total page count
find app/ -name "page.tsx" -type f | wc -l

# Suspense usage
rg -l "Suspense" app/ --glob '*.tsx'

# Toast-based error handling
rg -l 'toast.*error|toast\.error|error.*toast' app/ components/ --glob '*.tsx'
```

> **The page lists in Part 4 below are historical snapshots from 2026-03-28.**
> Always run the discovery commands to get current unprotected pages before starting work.

---

## Goal

Every page in the app must gracefully handle three states: **loading**, **error**, and
**empty**. Right now most pages handle none of them — a failed API call shows a white screen
or a stuck spinner.

**Current state (138 pages total):**
- **ZERO** `error.tsx` files (Next.js route error boundaries)
- **ZERO** `loading.tsx` files (Next.js route loading UI)
- **ZERO** `not-found.tsx` files
- `ErrorBoundary` component exists — used in 7 service layouts + widget-wrapper (good)
- `ApiError` component exists — shows retry button + error message (good)
- Only **17 pages** use `<Suspense>` for loading
- Only **8 files** use toast-based error notification
- **45 pages** have NO error handling at all — no ErrorBoundary ancestor, no isError check
- `console.error` appears in only 1 file (ErrorBoundary itself — fine)

**After this task:** Every route group has error/loading boundaries. Every page that fetches
data handles the loading/error/empty tristate. Users never see a white screen or an
unrecoverable error.

---

## Part 1 — Add `error.tsx` to every route group

**Problem:** Next.js `error.tsx` files catch unhandled errors at the route level and show a
fallback UI instead of a white screen. We have zero of them.

**Deliverable:**

Create `error.tsx` in these locations:

| Location | Catches errors in |
|----------|-------------------|
| `app/error.tsx` | Root fallback — catches anything that escapes route groups |
| `app/(platform)/error.tsx` | All platform pages |
| `app/(platform)/services/error.tsx` | All service pages (trading, research, etc.) |
| `app/(ops)/error.tsx` | All ops pages |
| `app/(public)/error.tsx` | All public pages |

Each `error.tsx` should:
1. Be a `"use client"` component (Next.js requirement).
2. Accept `{ error, reset }` props.
3. Display a user-friendly error message using design system tokens.
4. Show a "Try again" button that calls `reset()`.
5. Show a "Go to dashboard" link as fallback escape.
6. Log the error (but don't expose stack traces to users).

**Template:**

```typescript
"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="text-destructive size-10" />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md text-body">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Go to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
```

Customize each `error.tsx` slightly for its context (e.g., ops error page might link to
`/ops` instead of `/dashboard`). Don't create 5 identical copies — if they're truly
identical, create a shared `ErrorPage` component and re-export it.

**Files:** 5 new `error.tsx` files, possibly 1 shared `components/platform/error-page.tsx`

---

## Part 2 — Add `loading.tsx` to route groups

**Problem:** Without `loading.tsx`, page transitions show nothing while the new page's data
loads. The user sees a flash of blank content.

**Deliverable:**

Create `loading.tsx` in:

| Location | What it shows |
|----------|---------------|
| `app/(platform)/services/loading.tsx` | Skeleton layout matching the service page structure |
| `app/(ops)/loading.tsx` | Simple skeleton |

Each `loading.tsx` should:
1. Use `<Skeleton>` components (from `components/ui/skeleton.tsx`).
2. Match the general layout of the pages it covers (header skeleton + content area skeleton).
3. Not be overly detailed — a rough shape is better than an exact replica that needs
   updating every time the page changes.

**Template:**

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-section p-page">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-4 gap-card mt-section">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 mt-section" />
    </div>
  );
}
```

**Files:** 2-3 new `loading.tsx` files

---

## Part 3 — Add `not-found.tsx`

**Problem:** Invalid URLs show the default Next.js 404 page — unstyled, no navigation.

**Deliverable:**

Create:
- `app/not-found.tsx` — root 404 page

Should show:
- A clear "Page not found" message in design system styling
- A link back to the dashboard
- Optionally, a search or suggestion

**Files:** 1 new file

---

## Part 4 — Enforce loading/error/empty tristate in data-fetching pages

**Problem:** 45 pages have no error handling. Many pages fetch data via React Query hooks
but only handle the success case — they don't check `isLoading`, `isError`, or empty data.

**Deliverable:**

1. **Identify all pages that fetch data.** Search for React Query usage:
   ```bash
   rg -l "useQuery\|useMutation\|isLoading\|isFetching" app/ --glob '*.tsx'
   ```

2. For each, verify it handles all three states:
   - **Loading:** Shows `<Spinner>` or `<Skeleton>` while data loads
   - **Error:** Shows `<ApiError>` component with retry
   - **Empty:** Shows `<EmptyState>` when data returns but is empty

3. For the **45 pages with no error handling**, add at minimum:
   ```typescript
   if (isLoading) return <Spinner />;
   if (isError) return <ApiError error={error} onRetry={refetch} />;
   if (!data || data.length === 0) return <EmptyState title="No data available" />;
   ```

4. **Priority order** — fix the most critical pages first:
   - Trading pages (positions, orders, strategies, alerts, pnl) — users expect these to always work
   - Dashboard page — first thing users see
   - Research pages — long-running queries that are most likely to fail
   - Ops/admin pages — less critical but still need basic handling

**Existing components to use:**
- `<Spinner />` — `components/shared/spinner.tsx` — import `from "@/components/shared/spinner"`
- `<ApiError />` — `components/shared/api-error.tsx` (accepts `error` + `onRetry`)
- `<EmptyState />` — `components/shared/empty-state.tsx` (accepts `icon`, `title`, `description`, `action`)
- `<ErrorBoundary />` — `components/shared/error-boundary.tsx` (wraps sections that might throw)

**Do NOT create new loading/error components.** Use the existing shared ones. This is the
whole point of Task 04 — shared components exist, use them.

**The 45 pages with no error handling:**
```
app/(platform)/settings/page.tsx
app/(platform)/settings/notifications/page.tsx
app/(platform)/settings/api-keys/page.tsx
app/(platform)/services/execution/candidates/page.tsx
app/(platform)/services/execution/handoff/page.tsx
app/(platform)/services/execution/benchmarks/page.tsx
app/(platform)/onboarding/page.tsx
app/(platform)/investor-relations/board-presentation/page.tsx
app/(platform)/investor-relations/page.tsx
app/(platform)/investor-relations/disaster-recovery/page.tsx
app/(platform)/dashboard/page.tsx
app/health/page.tsx
app/(public)/page.tsx
app/(public)/services/regulatory/page.tsx
app/(public)/services/platform/page.tsx
app/(public)/services/backtesting/page.tsx
app/(public)/services/data/page.tsx
app/(public)/services/investment/page.tsx
app/(public)/contact/page.tsx
app/(public)/docs/page.tsx
app/(public)/signup/page.tsx
app/(public)/demo/preview/page.tsx
app/(public)/demo/page.tsx
app/(public)/terms/page.tsx
app/(public)/login/page.tsx
app/(public)/privacy/page.tsx
app/(public)/pending/page.tsx
app/(ops)/devops/page.tsx
app/(ops)/approvals/page.tsx
app/(ops)/ops/page.tsx
app/(ops)/ops/jobs/page.tsx
app/(ops)/ops/services/page.tsx
app/(ops)/config/page.tsx
app/(ops)/admin/page.tsx
app/(ops)/admin/organizations/[id]/page.tsx
app/(ops)/admin/data/page.tsx
app/(ops)/admin/users/[id]/page.tsx
app/(ops)/admin/users/[id]/offboard/page.tsx
app/(ops)/admin/users/[id]/modify/page.tsx
app/(ops)/admin/users/page.tsx
app/(ops)/admin/users/requests/page.tsx
app/(ops)/admin/users/catalogue/page.tsx
app/(ops)/internal/page.tsx
app/(ops)/internal/data-etl/page.tsx
app/(ops)/engagement/page.tsx
```

Note: Some public pages (terms, privacy, login) may not fetch data — those are fine without
error handling. Focus on pages that actually call APIs.

---

## Part 5 — Extend ErrorBoundary coverage

**Problem:** `ErrorBoundary` is currently used in 7 service layouts and widget-wrapper.
But execution, settings, investor-relations, and all ops layouts don't have it.

**Deliverable:**

Add `<ErrorBoundary>` wrapping in these layouts:

| Layout | Currently has ErrorBoundary? |
|--------|------------------------------|
| `app/(platform)/services/trading/layout.tsx` | Yes |
| `app/(platform)/services/research/layout.tsx` | Yes |
| `app/(platform)/services/reports/layout.tsx` | Yes |
| `app/(platform)/services/promote/layout.tsx` | Yes |
| `app/(platform)/services/manage/layout.tsx` | Yes |
| `app/(platform)/services/data/layout.tsx` | Yes |
| `app/(platform)/services/observe/layout.tsx` | Yes |
| `app/(platform)/services/execution/layout.tsx` | **No — add** |
| `app/(platform)/settings/layout.tsx` | **Check — add if missing** |
| `app/(ops)/layout.tsx` | **No — add** |

**Files:** 2-3 layout files

---

## Rules

1. **Use existing components.** `ApiError`, `EmptyState`, `Spinner`, `Skeleton`,
   `ErrorBoundary` all exist. Use them. Don't create new error/loading components.
2. **Design system tokens.** All error/loading UI must use semantic tokens (`text-destructive`,
   `text-muted-foreground`, etc.) — no raw Tailwind colors.
3. **Don't over-engineer.** A simple tristate check (loading → error → empty → render)
   is sufficient. Don't build elaborate retry/fallback/cache systems.
4. **error.tsx must be "use client".** Next.js requirement. Don't forget it.
5. **Don't duplicate ErrorBoundary logic.** If a layout already wraps children in
   `<ErrorBoundary>`, don't also add one in every page component. The boundary is the
   parent's job; the page's job is handling query-level isLoading/isError.

---

## Acceptance Criteria

- [x] `error.tsx` exists in `app/`, `app/(platform)/`, `app/(platform)/services/`, `app/(ops)/`, `app/(public)/`
- [x] `loading.tsx` exists in `app/(platform)/services/` and `app/(ops)/`
- [x] `not-found.tsx` exists in `app/`
- [x] All 45 unprotected pages assessed — 32 pages now use ApiError, 13 use EmptyState, 16 use Spinner
- [x] `ErrorBoundary` covers all platform service layouts + ops layout (10 layouts)
- [x] `ApiError` component used for all API error displays (no new error components)
- [x] `EmptyState` component used for all "no data" displays (no inline "No data" text)
- [x] `Spinner` used for all loading indicators (no inline `Loader2 + animate-spin`)
- [x] `pnpm typecheck` passes
- [ ] App loads correctly; navigating to an invalid URL shows the 404 page — needs manual verification

---

## Self-Evaluation Checklist

When you finish, stop and honestly answer these before claiming done:

1. **Do errors actually look good?** Open a page, temporarily break the API response (return
   500 from MSW handler), and verify the error UI renders properly. Is it styled with design
   system tokens? Does the retry button work? Does it look professional — like a system that
   expected this failure and handles it gracefully — or does it look like an afterthought?

2. **Are the error.tsx files useful?** Do they show enough information for a developer to
   debug (error message, maybe a digest ID) while not showing too much for an end user
   (no stack traces, no internal paths)? The balance matters.

3. **Did I handle ALL the data-fetching pages?** The 45-page list is the minimum. There may
   be more pages that fetch data via hooks that weren't caught by the heuristic search.
   Scan through the major lifecycle sections (trading, research, promote, data, reports)
   and verify each page has tristate handling.

4. **Is the loading state fast enough?** If a loading skeleton is too detailed, it might
   flash for a split second and cause layout shift. If it's too simple, it might not
   match the final layout. Check that the Skeleton composition roughly matches the real
   page structure without being a pixel-perfect copy.

5. **Did I break any existing pages?** Some pages might have their own custom loading/error
   handling that works fine. Don't overwrite it with the generic pattern if the custom
   version is better. Check before replacing.

6. **Would a user trust this system?** Financial platforms need to feel bulletproof. A user
   who sees "Something went wrong" with a clear retry button trusts the system more than
   one who sees a white screen. But a user who sees error pages frequently trusts it less
   than one who never sees them. The error handling should feel like a safety net that rarely
   deploys — not a frequent occurrence.

**If the answer to any of these is "no" — go fix it before marking done.**
