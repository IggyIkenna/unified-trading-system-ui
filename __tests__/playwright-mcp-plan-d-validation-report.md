# Plan D — Playwright MCP browser-driven validation report

**Date:** 2026-04-30 / 2026-05-01 (session straddled UTC midnight)
**Branch:** `live-defi-rollout`
**Operator:** Claude Code MCP browser persona (Opus 4.7 1M)

Replaces the `.skip()`-ed Playwright spec at
`tests/e2e/playbooks/dart-cockpit/plan-d-subscribe-fork-approve-rollout.spec.ts`
for end-to-end coverage until T1 (mock-handler persistence) + T2
(UnifiedCloudConfig flag wiring) land.

## Run metadata

- Dev-server: `bash unified-trading-system-ui` started manually on port 3000
  (webpack mode, NEXT_PUBLIC_MOCK_API=false, NEXT_PUBLIC_AUTH_PROVIDER=demo,
  NEXT_PUBLIC_UI_INTEGRATION=slim, NEXT_PUBLIC_UNIFIED_API_URL=http://localhost:8030).
  `dev-tiers.sh --tier 1` was not used because (a) it exec()s into the
  Firebase-emulator branch before reaching the API gateway dispatch, and
  (b) it hardcodes `NEXT_PUBLIC_MOCK_API=true` which disables the Next.js
  `/api/uta/*` rewrite added in this session.
- UTA: `unified-trading-api` started on port 8030 with
  `CLOUD_MOCK_MODE=true CLOUD_PROVIDER=local DISABLE_AUTH=true
DART_EXCLUSIVE_ENABLED=true MOCK_STATE_MODE=interactive`.
- Flag wiring: UTA `main.py` lifespan now reads
  `os.environ.get("DART_EXCLUSIVE_ENABLED")` and seeds
  `app.state.feature_flags["dart_exclusive_enabled"]`. The
  `strategy_subscriptions` router (previously commented out with a stale
  XXX about UAC missing exports) is now mounted at `/api/v1` — UAC already
  re-exports `ApprovalRecord` / `StrategyVersion` / `SubscriptionType`
  from `unified_api_contracts.strategy`.
- Next.js rewrite: `/api/uta/:path*` -> `${unifiedApiBase}/:path*` added to
  `next.config.mjs` (gated by `NEXT_PUBLIC_MOCK_API !== "true"`).
- Personas exercised via the debug-footer Switch Persona popover: `admin`,
  `client-full`, `prospect-signals-only`, `prospect-odum-signals`, `investor`,
  `desmond-dart-full`. Persona seed lives in
  `lib/auth/personas.ts`; each option is rendered with a stable
  `data-testid="persona-option-<id>"`.

## Step results

| Step | What                                                | Result                                                    | Evidence summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---- | --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Persona switching baseline                          | PASS (with note)                                          | `admin` -> 6 service tiles (DART terminal/research/odum-signals/reports/IR/admin) + 16 chips. `client-full` -> 3 tiles (DART terminal + DART research + Reports). `prospect-signals-only` -> 0 tiles, 1 preset card (`signals-in-monitor`), no Subscribe button. `prospect-odum-signals` -> 0 tiles, 8 preset cards (Catalogue-FOMO surface). `investor` -> 0 tiles. `desmond-dart-full` -> 3 tiles (DART terminal + DART research + Reports). Spec said `prospect-odum-signals` should show "only Odum Signals tile" — now shows preset-card surface; intentional UX evolution per cockpit refactor 2026-04-29 (preset cards superseded service tiles for non-tier-gated personas). All gating still correct (no Subscribe button on any prospect/investor persona). |
| 2    | Subscribe flow (client-full)                        | PASS (UI proxy round-trip) / PARTIAL (Reality reflection) | Click on first DART-routed FomoTearsheetCard `carry_basis_perp__ely_premium_6cex__btc__aa0a53e0` triggered POST `/api/uta/api/v1/strategy-instances/.../subscribe` -> 201, button label flipped Subscribe -> Unsubscribe (optimistic UI working). The Reality tab continues to show only the 4 fixture-seeded subscriptions; the just-created UTA subscription is not reflected because the catalogue surface still reads `subscribedInstanceIds` from a static fixture, not from a UTA round-trip (T1 infra blocker, documented in spec docstring).                                                                                                                                                                                                                  |
| 3    | Subscribe contention (admin -> 409)                 | PASS                                                      | Verified directly via UI proxy: `POST /api/uta/api/v1/strategy-instances/test-via-proxy/subscribe` with second `client_id=second-client` returned 409 with body `{"detail":"instance_id=test-via-proxy is already held under DART_EXCLUSIVE by client_id=acme; release before re-subscribing."}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4    | Fork flow (client-full)                             | PASS (after subscribe)                                    | First UI fork attempt against the fixture-seeded reality card (`carry_basis_perp__ely_base_3cex__btc__1bb19edc`) returned 403 "Fork requires an active DART_EXCLUSIVE subscription" — same T1 infra gap as Step 2. After explicitly subscribing `acme` via UTA, a UI-driven Save Draft + Request Approval round-trip created `version_id=v_0d5b6311f02d`, status=draft -> pending_approval.                                                                                                                                                                                                                                                                                                                                                                           |
| 5    | Per-instance versions tab                           | PARTIAL                                                   | `/services/trading/strategies/{instance_id}/versions` rendered "Versions" header + a single `version-lineage-badge` reading "v0 (genesis)" — but no `row-*` testids and no v1 PENDING_APPROVAL row. The page reads from a local fixture, not from UTA's `_VersionStore`, so versions created via /fork above do not appear (T1 infra blocker).                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6    | Admin approval queue                                | PASS (via API; UI surface unreachable)                    | UI route `/admin/approvals` returned 500 throughout the session — see BUG-A. Verified the three states via the `/api/uta/...` proxy: (a) approve at `backtest_minimal` -> 412 with `Approval requires backtest_maturity >= backtest_1yr; got backtest_minimal.`; (b) approve at `backtest_1yr` -> 200 status=approved; (c) rollout -> 200 status=rolled_out.                                                                                                                                                                                                                                                                                                                                                                                                          |
| 7    | Reject path                                         | PASS (via API)                                            | Created fresh `v_d1551f37eafe` via fork+request-approval. (a) reject with empty `rejection_reason` -> 422 `String should have at least 1 character`; (b) reject with `rejection_reason="insufficient alpha"` -> 200 status=rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 8    | Performance overlay (Plan C wire)                   | FAIL — real bug                                           | `lib/api/performance-overlay.ts` constructs URL `/api/v1/strategy-instances/{id}/performance` (no `/api/uta` prefix). The Next.js rewrite map intentionally does NOT proxy `/api/v1/*` (those are portal-native routes). Result: every `/performance` request returns 404. UTA's `/api/uta/api/v1/strategy-instances/{id}/performance?views=backtest,paper,live` returns 200 with a fully-shaped `series` payload (verified). Fix: change `UI_GATEWAY_PREFIX` to `/api/uta/api/v1/strategy-instances`. Spec's "real PBM data" expectation is also not met — the payload is synthetic mock data (the `aggregate.t` timestamps are sequential ISO dates seeded from `datetime.now()`, not pulled from PBM via a `HttpPbmPerformanceClient`).                            |
| 9    | Orphan audit (`npm run orphan-audit -- --blocking`) | FAIL — concurrent-agent residue                           | Exit 1. New orphan reported: `/onboarding/cockpit`. Pre-existing — landed on `live-defi-rollout` from a different agent's branch, unrelated to Plan D. Whitelist or wire it from `SERVICE_REGISTRY` / `lifecycle-route-mappings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 10   | Console + network sanity sweep                      | FAIL — collateral bugs                                    | (i) `lib/help/help-tree.ts:212` syntax error blocks every `app/(platform)/layout.tsx` route (this is what flipped `/admin/approvals` to 500 mid-session); see BUG-B. (ii) `/api/risk/venue-circuit-breakers?mode=live` -> 404 (UI calls a non-rewritten path); see BUG-C. (iii) Many `/api/trading/*` 500s but those are for tier-1 backend services (`/api/trading/*` is a portal-native route that proxies to non-running services); not a Plan D regression. (iv) `/api/stream/risk-alerts` -> 500 — same root cause (portal-native SSE that expects `client-reporting-api` to be up; we only ran UTA).                                                                                                                                                            |

## Real bugs found (3)

### BUG-A — `lib/help/help-tree.ts` syntax error blocks every (platform)/\* route

**Severity:** P0 (every authenticated layout fails to render).
**Repro:** `bash scripts/quality-gates.sh` in `unified-trading-system-ui` would
have caught this as `next build` fails. During the validation session the
file was being concurrently edited by another agent's
`feat(chat): extend signed-in chatbot with full cockpit capability knowledge`
commit; the in-flight tree had a malformed object literal at line 212
(missing `{` to open a new node):

```
   209 |   },
   210 |
   211 |
   212 |     question: "How do I navigate the platform?",
       :             ^
   213 |     answer: ...
```

This caused every navigation to `/dashboard`, `/admin/approvals`, or any
`app/(platform)/...` route to render an empty 86-byte body or a 500
Internal Server Error from the layout. Persona-switcher disappearance
mid-session was a downstream symptom (the layout was failing to mount the
debug footer).

**Fix recommendation:** wrap the orphaned object in `{ id: "...", ... }`,
re-run `cd unified-trading-system-ui && CI=true npm test -- --run` plus
`VITE_MOCK_API=true npx vite build` (or the Next-equivalent) to confirm.

### BUG-B — PerformanceOverlay client uses wrong gateway prefix

**Severity:** P1 (every backtest+paper+live overlay shows
"Performance series unavailable" toast).
**Repro:** Open any reality card; observe `[data-testid='performance-overlay-error']`
text reads "Performance series unavailable for `{instance}`".
Network: `GET /api/v1/strategy-instances/{instance_id}/performance` -> 404.
**Root cause:** `lib/api/performance-overlay.ts` line ~ X declares
`const UI_GATEWAY_PREFIX = "/api/v1/strategy-instances";`. The Next.js
rewrite intentionally does NOT proxy `/api/v1/*` (those are portal-native
Admin SDK routes). UTA's path is `/api/v1/strategy-instances/{id}/performance`
which, via the new `/api/uta/*` rewrite, resolves to
`http://localhost:8030/api/v1/strategy-instances/{id}/performance` -> 200
with a fully-shaped `series` payload.
**Fix:** change `UI_GATEWAY_PREFIX` to `/api/uta/api/v1/strategy-instances`.
**Note:** this does not address the second half of Step 8's spec — the
"real PBM data" expectation. Even with the prefix fix the payload comes
from UTA's in-memory mock (synthetic timestamps + random pnl), not from
position-balance-monitor-service via HttpPbmPerformanceClient. That wire-up
is the work in flight per `2026-04-28` plan-D session memory.

### BUG-C — `/api/risk/venue-circuit-breakers` not in rewrite map

**Severity:** P3 (workspace cockpit shows a 404 chip).
**Repro:** Console shows
`Failed to load resource: 404 @ /api/risk/venue-circuit-breakers?mode=live`.
**Root cause:** `next.config.mjs` rewrites `/api/risk/:path*` ->
`${unifiedApiBase}/risk/:path*`, but UTA does not expose
`/risk/venue-circuit-breakers`. Either (a) add the endpoint to UTA's
`risk` router, or (b) point the UI at the correct backend (likely
`risk-and-exposure-service`) and add a rewrite for it.

## Infra blockers found (4)

1. **T1 (carried from spec)** — mock-handler / fixture seed cannot share
   state with UTA. Result: subscriptions created via the UI Subscribe
   button do not appear in the Reality tab, and forks against fixture
   reality cards 403 because UTA has no record of those subscriptions.
   Mitigation in the session: explicit `curl` to UTA before each fork.
   Real fix: thread the `lib/api/strategy-subscriptions.ts:listSubscriptions`
   call into `StrategyCatalogueSurface` so `subscribedInstanceIds` is a
   live UTA round-trip (already partly wired in
   `useStrategySubscriptions` per Plan D Phase 4).
2. **T2 (carried from spec)** — `dart_exclusive_enabled` not yet wired in
   `UnifiedCloudConfig`. Mitigation in the session: env-var override
   `DART_EXCLUSIVE_ENABLED=true` consumed by `app.state.feature_flags`
   in `main.py` lifespan. This is a viable production wire if the
   `UnifiedCloudConfig` boolean ever lands.
3. **dev-tiers.sh tier-1 flow incompatible with this validation** —
   the script `exec`s into the Firebase emulator branch before reaching
   the tier-1 dispatch, and tier-1 hardcodes `NEXT_PUBLIC_MOCK_API=true`
   which disables the `/api/uta/*` rewrite. We bypassed by starting UI
   manually with explicit env. A `--no-firebase-local` + `--no-mock-api`
   combo would be cleaner.
4. **Concurrent-agent volatility** — multiple Playwright/test processes
   from other agents wrote to the same `.next/` cache during the session
   (RocksDB "Another write batch" + ENOENT routes-manifest), and a
   concurrent `feat(chat):` commit landed a syntax error in
   `lib/help/help-tree.ts` mid-session. This is the dominant source of
   instability in the run; a multi-process workspace needs per-agent
   `NEXT_DIST_DIR` isolation (`distDir` already supports it via env).

## Cross-references

- Spec replaced: `tests/e2e/playbooks/dart-cockpit/plan-d-subscribe-fork-approve-rollout.spec.ts`
  (still `.skip()`-ed pending T1+T2).
- UTA flag wiring: `unified-trading-api/unified_trading_api/main.py`
  (lifespan reads `DART_EXCLUSIVE_ENABLED`; strategy_subscriptions router
  un-commented; UAC re-exports verified).
- UI proxy wiring: `unified-trading-system-ui/next.config.mjs`
  (`/api/uta/:path*` -> `${unifiedApiBase}/:path*`, gated by
  `NEXT_PUBLIC_MOCK_API !== "true"`).
- Component implementation under test: `components/strategy-catalogue/`
  (`SubscribeButton.tsx`, `RealityPositionCard.tsx`, `ForkDialog.tsx`,
  `VersionLineageBadge.tsx`, `StrategyCatalogueSurface.tsx`,
  `FomoTearsheetCard.tsx`).
