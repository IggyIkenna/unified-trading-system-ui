# L — Error Handling & Edge Cases Audit

**Date:** 2026-03-28  
**Scope:** `app/` (excluding `archive/`), `components/`, `hooks/`, `lib/` — `*.tsx` / `*.ts`, excluding `node_modules`  
**Previous audit:** First audit

## 1. Current State

| Area                      | What exists                                                                                                                                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React Query**           | `QueryClientProvider` in `lib/providers.tsx`; client from `lib/query-client.ts` with `staleTime` 5m, `retry: 1`, `refetchOnWindowFocus: false`. No `defaultOptions.queries.meta`, global `throwOnError`, or `QueryCache`/`MutationCache` `onError` logging/toast. |
| **Demo gate**             | `Providers` blocks children until mock fetch handler is installed (`Preparing demo…`, `aria-busy`) when `NEXT_PUBLIC_MOCK_API` or demo auth — good first-paint guard.                                                                                             |
| **Documented pattern**    | `.cursorrules`: API via React Query hooks only; no `useEffect` fetching.                                                                                                                                                                                          |
| **Strong local example**  | `components/widgets/positions/positions-table-widget.tsx`: loading spinner, error card with **Retry** + `refetchPositions`, then table (`L185–L205`).                                                                                                             |
| **URL / JSON edge cases** | `JSON.parse` for onboarding draft and book `prefill` wrapped in `try/catch` (`app/(public)/login/page.tsx` `L82–L89`, `signup/page.tsx` `L709–L713`, `components/widgets/book/book-data-context.tsx` `L260–L275`).                                                |
| **Suspense**              | 13 files use `<Suspense>` (e.g. `app/(platform)/services/trading/positions/page.tsx` `L21–L23`).                                                                                                                                                                  |
| **Next.js conventions**   | **No** `app/**/error.tsx`, `global-error.tsx`, `loading.tsx`, or `not-found.tsx` under `app/` (verified via `find`).                                                                                                                                              |

## 2. Findings

### 2.1 Route-level and crash containment

| ID  | Severity    | Finding                                                                                      | Evidence                                                                                            | Use instead                                                                                                                    |
| --- | ----------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| L1  | 🔴 Critical | No Next.js error UI routes; runtime/render errors are not contained per segment or globally. | `find app -name 'error.tsx' -o -name 'global-error.tsx'` → **no files**                             | Add `app/error.tsx` + `app/global-error.tsx` with reset/retry and user-safe copy; optional segment `loading.tsx` for slow RSC. |
| L2  | 🔴 Critical | No React **Error Boundary** wrapping the tree in `Providers` or layout.                      | `lib/providers.tsx` — only `QueryClientProvider` → `AuthProvider` → `AppAccessProvider` (`L58–L63`) | Add a small `AppErrorBoundary` class boundary around `children` (log + fallback UI).                                           |

### 2.2 React Query: loading / error / empty

| ID  | Severity    | Finding                                                                                                                                                               | Evidence                                                                                                                                                                                                                                  | Use instead                                                                                                                                  |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| L3  | 🔴 Critical | **~28** `app/**/*.tsx` files import `@/hooks/api` but **do not** reference `isError` (or equivalent `error` destructure) — query failures often have no dedicated UI. | Set difference: `rg 'from \"@/hooks/api\"' app -l` (**43** files) minus `rg '\\bisError\\b' app -l` (**15** files) → **28** pages (sample: `app/(ops)/admin/users/[id]/page.tsx`, execution cluster, `trading/strategies/[id]/page.tsx`). | Per query: `if (isError)` branch with message + **Retry** (`refetch`); avoid conflating with “not found”.                                    |
| L4  | 🟡 High     | User detail treats missing data as “not found” without distinguishing **fetch error** vs **404**.                                                                     | `app/(ops)/admin/users/[id]/page.tsx` `L61–L70`: `useProvisionedUser(params.id)` — `isLoading` only; then `if (!user) return … User not found`                                                                                            | Use `isError`, `error`, and HTTP-aware `fetchJson` (or query `meta`) to show “Failed to load” + retry vs “User not found”.                   |
| L5  | 🟡 High     | Positions pipeline **hides true empty API success** by seeding mock rows when the array is empty.                                                                     | `components/widgets/positions/positions-data-context.tsx` `L197–L220`: if `result.length === 0`, `getPositionsForScope(...)` fills data                                                                                                   | When API returns `[]`, show an **empty state** (“No positions for this scope”); reserve mock seed for demo-only or explicit mock flag.       |
| L6  | 🟢 Medium   | `QueryClient` defaults have no shared **error feedback** (toast/logging).                                                                                             | `lib/query-client.ts` — queries only; no `mutationCache`/`queryCache` callbacks                                                                                                                                                           | Optional: `defaultOptions.mutations.onError` / global handler to `toast.error` + structured log (without swallowing per-component handling). |

**Counts (app pages):** ~**138** `page.tsx` files; **43** import `@/hooks/api`; **15** mention `isError`; **21** mention refetch/retry copy (not all tied to errors).

### 2.3 Suspense

| ID  | Severity  | Finding                                                                                                                     | Evidence                                       | Use instead                                                                                                                        |
| --- | --------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| L7  | 🟢 Medium | Suspense is **sparse** (~**13** files) vs many `use client` data pages; most async UX relies on inline spinners or nothing. | `rg '<Suspense' --glob '*.tsx'` → **13** files | Align with Next 15 + React Query: Suspense boundaries where `useSuspenseQuery` is adopted, or consistent inline loading per shell. |

### 2.4 Mutations and event handlers

| ID  | Severity  | Finding                                                                                                                                        | Evidence                                                 | Use instead                                                                                                                                               |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| L8  | 🟡 High   | **32** `useMutation` definitions in `hooks/api`; **8** of those files mention `onError` — many mutations rely on callers to handle failures.   | `rg 'useMutation\\(' hooks/api` + `rg onError hooks/api` | Define `onError` in hooks (toast + invalidate rules) **or** require every `mutate()` call site to pass `onError` / check `isError` — enforce one pattern. |
| L9  | 🟢 Medium | **10** app pages call `mutate` / `mutateAsync`; only **8** reference `isPending` / `isSuccess` / `mutation.isError` — easy to miss failure UX. | `rg 'mutate\\(' app` / `rg 'isPending                    | isSuccess                                                                                                                                                 | mutation\\.isError' app` | Surface mutation errors next to the triggering control + disable while pending. |

### 2.5 Forms and validation

| ID  | Severity  | Finding                                                                                                                         | Evidence                                                   | Use instead                                                                |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| L10 | 🟡 High   | **No** feature pages import `@/components/ui/form` or use `react-hook-form` + **zod** outside the shadcn primitive file itself. | `rg 'from \"@/components/ui/form\"'` → **0**; `rg 'useForm | zodResolver'`→ only`components/ui/form.tsx`                                | For high-risk forms (onboarding, orders, promote): shared `Form` + zod schemas in `lib/` or colocated; client-side validation before submit. |
| L11 | 🟢 Medium | Login/signup use **ad hoc** state + manual checks; works but inconsistent with a scalable validation SSOT.                      | `app/(public)/login/page.tsx` `handleLogin`                | Gradually adopt zod for shared rules (email, password strength, org slug). |

### 2.6 URL parameters

| ID  | Severity  | Finding                                                                                                                             | Evidence                                                                                                  | Use instead                                                                                          |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| L12 | 🟡 High   | Dynamic route params (`useParams`) are used **without** schema validation (UUID/slug).                                              | e.g. `app/(ops)/admin/users/[id]/page.tsx` `L59–L61`: `params.id` passed straight to `useProvisionedUser` | `z.string().uuid()` or safe string + `enabled: parsed.success`; show 400-style message when invalid. |
| L13 | 🟢 Medium | `useSearchParams` consumers (e.g. book prefill, filter bars) generally **defensive** (try/catch on JSON) but no typed query schema. | `book-data-context.tsx` `L257–L275`                                                                       | Optional: small zod helpers for known query keys (`strategy_id`, `prefill`).                         |

### 2.7 Policy and defensive coding

| ID  | Severity  | Finding                                                                                | Evidence                                                 | Use instead                                                                       |
| --- | --------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| L14 | 🟢 Medium | **13** components still call `fetch(` directly — error paths depend on each call site. | `rg 'fetch\\(' components --glob '*.tsx'` → **13** files | Migrate to `hooks/api/*` + uniform `fetchJson` error typing (per `.cursorrules`). |

## 3. Worst Offenders

| Rank | File / area                               | Primary issue                                                               |
| ---- | ----------------------------------------- | --------------------------------------------------------------------------- |
| 1    | **App tree**                              | No `error.tsx` / `global-error.tsx` / root error boundary (**L1**, **L2**). |
| 2    | **28 app pages**                          | Import API hooks without `isError` handling (**L3**).                       |
| 3    | **`positions-data-context.tsx`**          | Empty API success masked by mock seed (**L5**).                             |
| 4    | **`app/(ops)/admin/users/[id]/page.tsx`** | Error vs not-found conflation; param unvalidated (**L4**, **L12**).         |
| 5    | **`hooks/api` mutations**                 | Systemic lack of `onError` / caller discipline (**L8**).                    |
| 6    | **Forms ecosystem**                       | `components/ui/form.tsx` unused by features — no zod SSOT (**L10**).        |

## 4. Recommended Fixes

1. **P0 — Boundaries:** Add `app/error.tsx`, `app/global-error.tsx`, and an `AppErrorBoundary` in `lib/providers.tsx` around `children`.
2. **P0 — Query UX:** Introduce a thin **`QueryStateShell`** (or document a mandatory pattern): `isPending` → skeleton; `isError` → `Alert` + Retry; `isSuccess` + empty → `EmptyState` component from `@/components/ui` (create if missing).
3. **P1 — Positions honesty:** Gate mock fallback on `NEXT_PUBLIC_MOCK_API` or explicit demo persona; otherwise show real empty state.
4. **P1 — User detail (template):** Refactor `useProvisionedUser` consumers to branch `isError` / `isLoading` / `data` explicitly; validate `params.id`.
5. **P2 — Mutations:** Add default `onError` in hooks that maps to `toast` + optional `logEvent` when backend contracts exist; audit **10** `mutate` call sites.
6. **P2 — Forms:** Pilot zod + `Form` on one high-risk flow (e.g. promote modal or onboarding step), then expand.
7. **P2 — Direct `fetch`:** Track **13** component files toward `hooks/api` wrappers.

## 5. Remediation Priority

| Phase       | Items                                                              | Effort (indicative) |
| ----------- | ------------------------------------------------------------------ | ------------------- |
| **Phase 1** | **L1**, **L2**, **L3** (top 10 traffic pages)                      | ~1–1.5 dev-days     |
| **Phase 2** | **L5**, **L4**, **L12**, **L8** (hooks + positions + admin user)   | ~1.5–2 dev-days     |
| **Phase 3** | **L10**, **L14**, **L7** Suspense consistency, **L6** global toast | ~2–3 dev-days       |

**Total rough order:** ~4.5–6.5 developer-days for solid baseline error handling across primary platform paths.
