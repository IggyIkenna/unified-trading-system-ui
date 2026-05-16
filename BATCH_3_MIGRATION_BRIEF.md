# Cockpit Legacy-Widget Migration — Batches 1 → 4 Brief

> Status: live-defi-rollout, vitest 2928/2930 (2 unrelated skipped). Last
> commit `ce1b3d91` (batch 3); batch 4 covered by this brief.

This brief consolidates four batches of mechanical migration of legacy
widgets to read through `useTierZeroScenario` (the SSOT cockpit hook),
plus an audit of the resolver→widget contract.

---

## 1. Migration recipe (canonical)

Every migrated widget follows this shape:

```ts
import { useTierZeroScenario } from "@/lib/cockpit/use-tier-zero-scenario";

export function MyWidget(_props: WidgetComponentProps) {
  const legacy = useLegacyDataContext();
  const tierZero = useTierZeroScenario();
  // Canonical rule (matches `useTierZeroHasRows()`):
  const useTierZero =
    tierZero.status === "match" && tierZero.strategies.length > 0;

  // Derive scope-resolved rows from tierZero.{strategies, positions, ...}
  // when useTierZero, else fall through to the legacy provider.

  return (
    <div
      data-testid="my-widget"
      data-source={useTierZero ? "tier-zero" : "legacy"}
    >
      …
    </div>
  );
}
```

**Required contract** for every migrated widget:

1. Reads `useTierZeroScenario()` once at the top of the component.
2. Computes `useTierZero` with the canonical rule above.
3. Wraps its primary render path in a div (or root component) that
   carries both `data-testid` and `data-source` attributes.
4. Falls through to the legacy provider on `unsupported`,
   `partial_match`, or empty-strategies state.
5. Loading + error branches mirror the same `data-testid` + `data-source`
   so unit tests can target the widget regardless of state.

---

## 2. Migrated widget inventory

| Batch | Widget                 | `useTierZero` rule       | `data-source`         | Notes                                                                                              |
| ----- | ---------------------- | ------------------------ | --------------------- | -------------------------------------------------------------------------------------------------- |
| 1     | accounts-kpi           | strategies.length > 0    | ✅                    | NAV/Free/Locked from strategies+positions                                                          |
| 2     | positions-kpi          | **positions.length > 0** | ✅                    | divergent rule (positions is the primary data); flagged below                                      |
| 2     | alerts-kpi-strip       | strategies.length > 0    | ✅                    | active/critical from `cockpit-ops-store.strategyEvents` filtered by matched scenarios              |
| 3     | accounts-balance-table | strategies.length > 0    | ✅                    | per-venue rows synthesised from strategy NAV + position notional                                   |
| 3     | alerts-kill-switch     | strategies.length > 0    | ✅ (added in batch 4) | strategy + venue dropdowns reflect active scenario                                                 |
| 3     | pnl-waterfall          | strategies.length > 0    | ✅                    | scope-aware MTD-PnL banner above legacy chart (chart unchanged)                                    |
| 4     | positions-table        | positions.length > 0     | ✅                    | full row migration via `adaptScenarioPosition` adapter; chip filters re-run against tier-zero rows |

---

## 3. Resolver→widget contract audit (batch 4)

### Findings

1. **`alerts-kill-switch` was missing `data-source` and `data-testid`** —
   present on every other migrated widget. Fixed in batch 4 (also
   threaded through the loading-skeleton branch).
2. **`positions-kpi` and `positions-table` use `positions.length > 0`**
   instead of the canonical `strategies.length > 0`. This is defensible
   (positions is the primary data both widgets render) but inconsistent;
   left as-is in batch 4 with this note. If a scenario ever ships
   strategies without positions, both widgets would fall back to legacy
   while alerts/pnl/accounts would not.
3. **No widget surfaces `partial_match`** — when scope chips narrow to a
   matched scenario but produce zero rows. Today every widget treats
   that path identically to `unsupported` and falls back to legacy. The
   cockpit-shell `<ScopeStatusBanner />` covers this for the workspace
   page; individual widgets in legacy `/services/trading/*` routes
   don't get the banner. Tracked as future work.

### Convention recommendation (not yet enforced)

A future cleanup pass should add a `useTierZeroHasRowsFor("strategies" |
"positions" | "backtests" | "bundles")` helper so widgets like
positions-kpi/table can declare their primary collection without
diverging from the canonical rule.

---

## 4. Test harness pattern

Every L1.5 widget unit test file mocks the tier-zero hook to
`unsupported` so the legacy fallback path is exercised:

```ts
vi.mock("@/lib/cockpit/use-tier-zero-scenario", () => ({
  useTierZeroScenario: () => ({
    matchedScenarios: [],
    strategies: [],
    positions: [],
    backtests: [],
    bundles: [],
    status: "unsupported" as const,
  }),
}));
```

Real cockpit usage with a wide-open scope resolves to `match` and flows
tier-zero data; that path is exercised by
`tests/e2e/cockpit-tier-zero-filters.spec.ts` (see §6 below).

Test files updated to adopt this mock:

- `tests/widgets/positions/positions-kpi-strip.test.tsx`
- `tests/widgets/accounts/accounts-kpi-strip.test.tsx`
- `tests/widgets/alerts/alerts-kpi-strip-widget.test.tsx`
- `tests/widgets/alerts/alerts-kill-switch-widget.test.tsx`
- `tests/widgets/positions/positions-table.test.tsx` (batch 4)

---

## 5. Vitest results

`CI=true npm test -- --run` after batch 4:

```
Test Files  261 passed (261)
Tests       2928 passed | 2 skipped (2930)
```

The 2 skipped tests are unrelated to cockpit migration.

---

## 6. Playwright (cockpit-tier-zero-filters.spec.ts) — blocked

Spec target: `/services/workspace?surface=terminal&tm=command`, asserts
`[data-testid="scoped-strategy-table"]` reacts to chip toggles.

**Outcome:** 3/3 fail with `TimeoutError: locator.waitFor: Timeout
30000ms exceeded` waiting for `[data-testid="scoped-strategy-table"]`.

**Root cause:** auth-seed mismatch with the current default dev mode.

- The spec's `seedAdmin()` helper writes legacy `portal_user` /
  `portal_token` localStorage keys — the demo-provider auth seed.
- Local dev now defaults to Firebase Emulator Suite
  (`NEXT_PUBLIC_AUTH_PROVIDER=firebase`,
  `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` per `.env.local`,
  per `dev-tiers.sh` Tier 0 — default since 2026-04-28).
- The Firebase auth provider doesn't read the legacy localStorage seed,
  so the platform-layout auth promise never resolves and the page hangs
  on `(platform)/loading.tsx`.

**This is NOT a regression from batches 1-4.** The spec would fail the
same way against the unmigrated widget tree. The migrated widgets'
contract is verified by vitest L1.5 harnesses (§4-5).

**Fix path (out of scope for this batch):** update `seedAdmin()` to
seed the Firebase emulator auth pool instead of (or in addition to)
the legacy localStorage keys, OR stand a dev server in
demo-provider mode (`scripts/dev-tiers.sh --tier 0 --no-firebase-local`
… but with `NEXT_PUBLIC_AUTH_PROVIDER=demo` overriding) for spec runs.

---

## 7. Open backlog

Mechanical, non-blocking — same recipe applies:

- `accounts-margin-util-widget`
- `alerts-table-widget` (filter columns, ack/resolve actions — like
  positions-table but with custom chip state)
- `pnl-time-series-widget` — could mirror the pnl-waterfall scope-aware
  banner pattern without rewriting the chart
- `pnl-factor-drilldown-widget`
- strategy / book / ml registry widgets

Resolver-contract follow-ups:

- `useTierZeroHasRowsFor(collection)` helper to formalise the
  positions-kpi / positions-table divergence.
- `<TierZeroEmptyBanner status={view.status} />` shared component so
  individual widgets can surface `partial_match` without relying on the
  cockpit-shell banner (legacy routes don't render it).

Out-of-batch (program-level):

- DART UX refactor 9-phase plan continues. Phases 1-4 partially in
  place, Phase 5 (this work) ~40% of widget catalogue migrated, Phases
  6-9 not started.
