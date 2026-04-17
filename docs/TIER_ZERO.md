# Tier 0 — Static smoke testing

**Last verified:** 2026-04-17
**Supersedes:** `docs/under-review/TIER_ZERO_COMPREHENSIVE_AUDIT_RUNBOOK.md` + `docs/under-review/END_TO_END_STATIC_TIER_ZERO_TESTING.md`
**Config SSOT:** [`playwright.static.config.ts`](../playwright.static.config.ts)
**Tests live in:** [`tests/e2e/`](../tests/e2e/)

---

## 1. Purpose & scope

Tier 0 is the **fast smoke-before-anything-else CI gate** for the Next.js UI. It runs the app in pure client-mock mode (`NEXT_PUBLIC_MOCK_API=true`, in-browser `installMockHandler()` intercepts `/api/*`) and proves:

- Every static `app/` page route renders without compile/runtime errors.
- The `app/` filesystem and the test route registry stay in sync.
- A small, non-negotiable subset of interactions (approve access request, ack alert + toast, reconciliation/backtest/manage-request heuristics) still behave.

| In scope (Tier 0)                                                                            | Out of scope                                                                         |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Next.js UI on **`http://localhost:3100`** with `NEXT_PUBLIC_MOCK_API=true`                   | Real venue WebSockets, live order books, real IdP auth                               |
| In-browser fixtures: `lib/*-mock-data.ts`, `lib/strategy-registry.ts`, `lib/trading-data.ts` | T1+ HTTP to `unified-trading-api` / `auth-api` (see `scripts/dev-tiers.sh` tier 1/2) |
| Goal: every surface renders; primary actions mutate mock state; no dead links on audit paths | Goal: production-traffic parity                                                      |

**Port SSOT:** `playwright.static.config.ts` pins `baseURL=http://localhost:3100`. `dev-tiers.sh --tier 0` must bind the same port. If you override to 3000, set `PLAYWRIGHT_BASE_URL`.

---

## 2. Prerequisites

The Playwright static config **does not** start its own dev server. Boot the UI first:

```bash
cd unified-trading-system-ui
bash scripts/dev-tiers.sh --tier 0
# Verify:
lsof -i :3100
```

> `dev-tiers.sh --tier 0` spawns Next.js in the background and exits immediately. Always confirm the process with `lsof -i :3100` (or `curl -sf http://localhost:3100/health`) before launching Playwright.

Manual equivalent:

```bash
NEXT_PUBLIC_MOCK_API=true NEXT_PUBLIC_UI_INTEGRATION=tier0_offline pnpm dev
```

---

## 3. How to run

### Full Tier 0 suite (requires dev server)

```bash
pnpm exec playwright test --config playwright.static.config.ts
```

### Registry audit only (no dev server required)

Fast filesystem/registry alignment check — useful in CI when no browser is available:

```bash
PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 \
  pnpm exec playwright test tests/e2e/tier0-app-route-coverage.spec.ts \
  --config playwright.static.config.ts
```

### Debug a single spec

```bash
pnpm exec playwright test tests/e2e/tier0-behavior-audit.spec.ts \
  --config playwright.static.config.ts --project chromium
```

### Repo-wide UI quality gates

```bash
bash scripts/quality-gates.sh
```

UI QG runs `tsc --noEmit` + ESLint (TypeScript output, not pytest).

---

## 4. What's tested today

The static config's `testMatch` is authoritative:

```ts
testMatch: ["static-smoke.spec.ts", "tier0-app-route-coverage.spec.ts", "tier0-behavior-audit.spec.ts"];
```

| File                                         | Role                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/e2e/tier0-route-registry.ts`          | **SSOT list** of URLs Tier 0 must hit. Arrays (`PUBLIC_PAGES`, `DATA_PAGES`, …) roll up to `ALL_TIER0_ROUTES` / `TIER0_REGISTRY_PATHS`. `TIER0_DYNAMIC_SAMPLE_PATHS` holds sample URLs for dynamic segments.                                                                                                                                          |
| `tests/e2e/tier0-app-route-coverage.spec.ts` | Fails if a static-segment `page.tsx` under `app/` is missing from the registry, or if the registry lists a static path that doesn't exist (dynamic samples excluded). Pure logic check — runs with `PLAYWRIGHT_SKIP_GLOBAL_SETUP=1`.                                                                                                                  |
| `tests/e2e/static-smoke.spec.ts`             | Loads every registry URL through persona login (`data-testid="persona-card"`). Catches compile/runtime/unhandled-route noise at scale. Unhandled `/api/*` routes now **fail** the run (previously warn-only).                                                                                                                                         |
| `tests/e2e/tier0-behavior-audit.spec.ts`     | Small set of non-negotiable interaction assertions: admin approve/deny access request round-trip, alert ack + toast, reconciliation/backtests/manage-request surface heuristics, footer `/compliance` link not 404, landing vs dashboard venue-count consistency, persona reflected in authenticated shell, Reset Demo button visible in mock footer. |
| `tests/e2e/warmup.setup.ts`                  | Optional Turbopack warm-up before parallel smoke. `PLAYWRIGHT_SKIP_GLOBAL_SETUP=1` disables it.                                                                                                                                                                                                                                                       |

### Adding a new static page

1. Add `page.tsx` under `app/` (static segments only, or add a sample URL to `TIER0_DYNAMIC_SAMPLE_PATHS` for dynamic routes).
2. Add `{ path, name }` to the appropriate array in `tests/e2e/tier0-route-registry.ts` (must roll up into `ALL_TIER0_ROUTES`).
3. Run the coverage spec, then the full static suite.

> Do not put `*/` inside JS block comments in `tests/e2e/*.ts` (breaks parsing).

---

## 5. TODO — planned P0 journey tests (NOT YET IMPLEMENTED)

> **CALLOUT — STATUS: NOT IN REPO.** No `tests/e2e/tier0-journeys/` directory exists. None of the seven journey spec files listed below are implemented. The rows below are an **acceptance spec / backlog**, not current coverage. Do not claim these are green in audit reports.

`static-smoke.spec.ts` is URL smoke only. `tier0-behavior-audit.spec.ts` covers a minimal subset (e.g. journey 1 approve path, journey 6 ack + toast). Full P0 automation is outstanding.

| #   | Journey                                                                                                                 | Covered today                                     | Target file                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | End-to-end user provisioning → admin sees request → approve → client sees active entitlement                            | Partial (approve + approved UI in behavior audit) | `tests/e2e/tier0-journeys/provision-approve.spec.ts`     |
| 2   | Create new strategy or venue with persisted mock state (survives nav; reset clears)                                     | No                                                | `tests/e2e/tier0-journeys/create-strategy-venue.spec.ts` |
| 3   | Backtest run → results (configure → run → assert key result fields)                                                     | No                                                | `tests/e2e/tier0-journeys/backtest-results.spec.ts`      |
| 4   | Every book-trade path per strategy class (delta-one, options, sports, predictions, DeFi, …)                             | No                                                | `tests/e2e/tier0-journeys/book-trade-matrix.spec.ts`     |
| 5   | Position vs exchange reconciliation (diff → resolve → cleared)                                                          | No                                                | `tests/e2e/tier0-journeys/reconcile-positions.spec.ts`   |
| 6   | Alerts: view → acknowledge → row leaves active queue                                                                    | Partial (ack + toast in behavior audit)           | `tests/e2e/tier0-journeys/alerts-ack.spec.ts`            |
| 7   | Client IM onboarding: tier + product scope → document uploads (POA, ID, agreements, invoicing) → admin review → cleared | No                                                | `tests/e2e/tier0-journeys/client-onboarding-im.spec.ts`  |

### Shared hardening (all seven)

- Use personas from `lib/auth/personas.ts`; no real credentials.
- After each journey, optionally chain Reset Demo and assert seed state.
- Prefer `data-testid` on primary buttons/tables over brittle text selectors.

### Reset Demo coverage gap

There is **no Tier 0 test** that mutates mock state → clicks **Reset Demo** → asserts defaults. `tests/e2e/reset-demo.spec.ts` targets the 8030 API mock server, **not** the Tier 0 client mock. Add a `playwright.static.config.ts`-scoped reset test when P0 journeys land. Canonical reset logic is `lib/reset-demo.ts`:

1. Resets Zustand stores (`filter-store`, `auth-store`, `ui-prefs-store`).
2. Resets `lib/api/mock-provisioning-state.ts` (`resetState()`) — users + access requests return to defaults; localStorage key `mock-provisioning-state` is rewritten.
3. Clears React Query cache.
4. Removes: `portal_user`, `portal_token`, `odum_user`, `nav-preference`, `unified-ui-prefs`, `unified-global-scope`.
5. Navigates to `/` (full reload).

Any new mock `localStorage` key must be wired into `resetDemo()` or explicitly documented as excluded.

---

## 6. Troubleshooting

| Symptom                                               | Diagnosis & fix                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Playwright connects but every page fails instantly    | Dev server not on 3100. `lsof -i :3100` — if empty, re-run `bash scripts/dev-tiers.sh --tier 0` and wait 8–10s.                                              |
| `dev-tiers.sh` "exits immediately"                    | Expected — it spawns Next.js in the background. Verify with `lsof -i :3100` or `curl -sf http://localhost:3100/health`.                                      |
| `tier0-app-route-coverage.spec.ts` fails              | A `page.tsx` was added without a registry entry, or the registry lists a deleted path. Edit `tests/e2e/tier0-route-registry.ts` and rerun.                   |
| "Unhandled API route" failure                         | Missing client mock handler. Add it under `lib/api/` (client mock install site) and align with `lib/reset-demo.ts`.                                          |
| Page stuck on "Loading…" after 5s                     | Broken data fetch — not a partial render. Flag as P1 finding, not a pass.                                                                                    |
| Admin approve button not visible                      | `loginAsAdmin` must click the **Internal** tab first, then the `admin@odum` persona card, then wait for URL redirect. (Fixed in 2026-03-23 audit iteration.) |
| Reconciliation locator "strict mode violation"        | Nested layouts produce 2 `<main>` elements. Use `page.locator('main').last()`.                                                                               |
| UI QG output looks like pytest                        | You're in the wrong repo. UI QG runs `tsc --noEmit` + ESLint. TypeScript output expected.                                                                    |
| `*/` in e2e TS file breaks parser                     | Don't embed `*/` inside block comments (`**/` in a glob-like comment closes the block).                                                                      |
| Footer link appears fine but returns 404 when clicked | `static-smoke.spec.ts` now checks `/compliance` in behavior audit. Extend: loop every `Link` `href` from layout shell and actually navigate.                 |
| Venue count differs between landing & dashboard       | `PLATFORM_STATS` source must be single. Covered by `landing page and dashboard venue counts are consistent` in behavior audit.                               |

### Systematic console-error capture

Use `page.on('console')` in a Playwright loop across all registry routes; export JSON `{ route, len, comingSoon, loading, errors }`. Use this for rapid scans before deep-diving individual routes.

---

## 7. CI integration

| Gate                           | Command                                                                                                                                    | Role                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Registry audit (no server)** | `PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 pnpm exec playwright test tests/e2e/tier0-app-route-coverage.spec.ts --config playwright.static.config.ts` | Fast pre-flight: static `app/` routes ⊆ registry. CI-friendly with no browser/dev-server dependency.                            |
| **Full static Tier 0 suite**   | `pnpm exec playwright test --config playwright.static.config.ts`                                                                           | Runs `static-smoke.spec.ts` + `tier0-app-route-coverage.spec.ts` + `tier0-behavior-audit.spec.ts`. Requires dev server on 3100. |
| **P0 journey suite** (target)  | `pnpm exec playwright test tests/e2e/tier0-journeys`                                                                                       | **Not present yet** — see §5.                                                                                                   |
| **Full UI QG**                 | `bash scripts/quality-gates.sh`                                                                                                            | `tsc --noEmit`, ESLint, Vitest pool-forks unit tests, optional build smoke (`NEXT_PUBLIC_MOCK_API=true pnpm build`).            |

### Hardening roadmap

1. Grow `tier0-behavior-audit.spec.ts` and add `tests/e2e/tier0-journeys/` for the seven flows in §5.
2. Keep "unhandled API route" as a **hard failure** (not warn-only) as mock handler coverage extends.
3. Add a shell-wide link crawler: loop every `Link` `href` rendered by the layout and navigate to catch typo'd paths.
4. Persona matrix: log in as each persona → navigate `/dashboard` → assert footer role. Navigate admin-only routes as client persona → expect redirect / empty state.

### Tier promotion (T0 → T1 → T2)

Per PM `system-tiers.md`: same feature set; topology swaps from in-browser mock client to HTTP gateways, then to fleet services. UI must call a single API abstraction so switching env vars swaps transport, not screens.

---

## 8. Artifacts

- **Config:** [`playwright.static.config.ts`](../playwright.static.config.ts)
- **Route registry SSOT:** [`tests/e2e/tier0-route-registry.ts`](../tests/e2e/tier0-route-registry.ts)
- **Active specs:** `tests/e2e/static-smoke.spec.ts`, `tests/e2e/tier0-app-route-coverage.spec.ts`, `tests/e2e/tier0-behavior-audit.spec.ts`
- **Reset demo:** [`lib/reset-demo.ts`](../lib/reset-demo.ts)
- **Personas:** [`lib/auth/personas.ts`](../lib/auth/personas.ts)
- **Tier launcher:** [`scripts/dev-tiers.sh`](../scripts/dev-tiers.sh)
- **Test results output:** `./build-artifacts/test-results/static-smoke-results.json`

---

## 9. Security

Never store production or personal credentials in this file. Use `lib/auth/personas.ts` demo accounts for all automation. Rotate any secret that appears in chat or committed history.
