# Global Filters v2 — design doc

**Started:** 2026-04-27
**Owner:** UI
**Status:** design — no code yet
**Tracks:** replacing the legacy 5-asset-group sharding (`CeFi/DeFi/TradFi/Sports/Prediction`) with the v2 strategy-architecture taxonomy (8 families, 18 archetypes) as the user-facing access + filter axis.

This doc is the SSOT for the redesign while it is in flight. Each phase has its own checklist; when a phase ships, its checklist gets ticked here, not in the old `live-review-findings.md` (deprecated for this work).

---

## 1 — Why

### 1.1 Today's filters

[`components/platform/global-scope-filters.tsx`](../../components/platform/global-scope-filters.tsx), mounted from [`components/shell/breadcrumbs.tsx:140`](../../components/shell/breadcrumbs.tsx#L140), renders 4 pills on `/services/trading/*` and `/services/reports/*`:

| Pill           | Source                                                     | Notes                                                                                                           |
| -------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| All Orgs       | `TRADING_ORGS`                                             | Hidden for client-scoped users (`isClientScoped`); shown read-only as their org name.                           |
| All Clients    | `TRADING_CLIENTS` filtered by org                          | Hidden for client-scoped users.                                                                                 |
| All Families   | hardcoded `["DeFi","CeFi","TradFi","Sports","Prediction"]` | This is **asset group**, not strategy family — it's the legacy 5-bucket sharding the user wants gone.           |
| All Strategies | mock `TRADING_STRATEGIES` cascading from above             | Driven by archetype labels in [`lib/mocks/fixtures/trading-data.ts`](../../lib/mocks/fixtures/trading-data.ts). |

State lives in [`lib/stores/global-scope-store.ts`](../../lib/stores/global-scope-store.ts). It already has fields for the new taxonomy (`strategyFamily`, `strategyArchetype`, `underlyingIds`) but the top-bar component never writes to them — those were added for [`components/architecture-v2/family-archetype-picker.tsx`](../../components/architecture-v2/family-archetype-picker.tsx).

### 1.2 Why move off asset-group sharding

Per [`codex/09-strategy/architecture-v2/README.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/README.md), the v2 architecture states **"category is label, family is code"** — the 5 asset groups are derived multi-valued tags, not routing axes. Using them as the user-facing access axis means:

- Clients with mixed exposure (e.g. a fund running carry trades on both CeFi perps and DeFi pools) get awkward dual-asset-group UX.
- Restriction logic ("this client only gets carry & yield") cannot be expressed without conflating it with an asset group.
- New families (vol trading, market making) don't map cleanly to a single asset group — they cross-cut.

The v2 taxonomy gives us 8 orthogonal families and 18 archetypes that map 1:1 to product/code paths, plus 5 venue asset groups that remain useful as a venue/category lens.

### 1.3 Existing v2 plumbing we can reuse

| Component / module                                                                                                                             | What it gives us                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`lib/architecture-v2/enums.ts`](../../lib/architecture-v2/enums.ts)                                                                           | `StrategyFamily`, `StrategyArchetype`, `ARCHETYPE_TO_FAMILY`, `VenueAssetGroupV2`      |
| [`lib/architecture-v2/families.ts`](../../lib/architecture-v2/families.ts)                                                                     | `FAMILY_METADATA` — labels, slugs, accent colors, icons                                |
| [`lib/architecture-v2/family-filter.ts`](../../lib/architecture-v2/family-filter.ts)                                                           | `makeFamilyFilterPredicate()` — tolerant row-matcher used by trading surfaces          |
| [`components/architecture-v2/family-archetype-picker.tsx`](../../components/architecture-v2/family-archetype-picker.tsx)                       | Cascading family → archetype → optional slot dropdown with persona/availability gating |
| [`lib/questionnaire/types.ts`](../../lib/questionnaire/types.ts)                                                                               | Answers axes that align 1:1 with the new filters                                       |
| [`lib/questionnaire/seed-catalogue-filters.ts`](../../lib/questionnaire/seed-catalogue-filters.ts)                                             | Translates questionnaire answers → catalogue filter shape                              |
| [`codex/14-playbooks/cross-cutting/visibility-slicing.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md) | Canonical role × entitlement × lock-state visibility rule                              |

### 1.4 What's NOT yet in place

- Widgets do not carry family/archetype/asset-group tags. [`components/widgets/widget-registry.ts`](../../components/widgets/widget-registry.ts) only has `category` (display group) and `requiredEntitlements`.
- Trading routes are still asset-group-sharded (`/services/trading/{defi,sports,options,predictions,markets,...}`).
- Top-bar filters never write to the v2 fields in `global-scope-store`.

---

## 2 — Scope of this redesign

| In scope                                                       | Out of scope                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Top-bar filter pills + their state shape                       | Routing changes to `/services/trading/{asset-group}/*` (Phase 3+ if needed) |
| Widget-registry tagging schema for filtering                   | Migrating every existing widget to the new tags (per-widget follow-up)      |
| Data-hook predicate updates that already read `useGlobalScope` | Backend / UAC schema changes (already shipped)                              |
| Questionnaire → default scope hydration                        | Questionnaire flow itself                                                   |
| Visibility rules for Org / Client pills (admin / org / client) | Full admin-permissions rebuild — already done in `admin-permissions.ts`     |

---

## 3 — Open design questions (to resolve **before** Phase 1 code)

These are the questions I asked at the end of the audit. Answers go inline here.

| #   | Question                                                                                                                                      | Decision (2026-04-27)                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Pill set: Org / Client / Asset Class / Family→Archetype / Strategy?                                                                           | **4 pills, no Asset Class.** Final set: Org · Client · Family→Archetype · Strategy. Asset-group filtering stays in the data layer (see §10) so it can be brought back to the UI cheaply.          |
| 2   | Single combined Family→Archetype cascading control vs two separate pills?                                                                     | **Single combined cascading control**, **multi-select** (checkboxes) on both family rows and archetype rows. Picking a family selects all of its archetypes; archetype rows toggle independently. |
| 3   | Venue + instrument-type filters — top-bar pills, advanced popover, or skip?                                                                   | **Skip from top-bar.** They explode the bar. Questionnaire still seeds them; surface-level filters can expose them later.                                                                         |
| 4   | Client-scoped users: show Asset Class when entitled to >1 (current), or always hide it?                                                       | **N/A** — Asset Class pill removed for everyone (decision 1).                                                                                                                                     |
| 5   | First PR scope: just Phase 1 (pills + store wiring), or Phase 1 + 2 (also tag widgets and start filtering)?                                   | **Phase 1 only.** Iterate on UX, then propagate tags across ~70 widgets.                                                                                                                          |
| 6   | Are the existing Org/Client filter visibility rules (admin sees all, org admin sees own org's clients, client sees nothing) the target state? | **Yes** — matches `visibility-slicing.md`.                                                                                                                                                        |

---

## 4 — Final pill design (Phase 1)

Visual order, left-to-right. **4 pills total.** Org and Client hide based on role.

### 4.1 Pill spec

| #   | Pill               | Type                     | Source of truth                                      | Multi/single | Persists to scope field                                                             |
| --- | ------------------ | ------------------------ | ---------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| 1   | Organization       | popover multi (checkbox) | `TRADING_ORGS`                                       | multi        | `organizationIds`                                                                   |
| 2   | Client             | popover multi (checkbox) | `TRADING_CLIENTS` filtered by selected orgs          | multi        | `clientIds`                                                                         |
| 3   | Family → Archetype | grouped multi (checkbox) | `STRATEGY_FAMILIES_V2` + `ARCHETYPE_TO_FAMILY`       | **multi**    | `strategyFamilyIdsV2: string[]` + `strategyArchetypeIds: string[]` (new — see §6.1) |
| 4   | Strategy instance  | popover multi (checkbox) | `STRATEGIES` filtered by org+client+family+archetype | multi        | `strategyIds`                                                                       |
| —   | Clear              | text button              |                                                      | —            | resets all of the above                                                             |

### 4.2 Role-based visibility

| Role                                             | Pills shown                                                  |
| ------------------------------------------------ | ------------------------------------------------------------ |
| **admin**                                        | Org · Client · Family→Archetype · Strategy                   |
| **org admin / internal** (`role === "internal"`) | Client · Family→Archetype · Strategy (Org hidden — implicit) |
| **client**                                       | {org name read-only} · Family→Archetype · Strategy           |

### 4.3 Family → Archetype dropdown structure (multi-select with checkboxes)

Single popover. Both family-header rows and archetype rows carry checkboxes; this is the same `groupBy` shape that `<CompactMultiSelect>` already renders for the existing Strategy pill, so we get the tri-state group checkbox (all / some / none) for free.

```
┌─────────────────────────────────────────────────────┐
│ ☐ All families                                      │
├─────────────────────────────────────────────────────┤
│ ▼ ☑ ML DIRECTIONAL                          (2)     │  ← family checkbox: all / some / none
│       ☑ ML Directional Continuous                   │  ← archetype checkboxes — independent
│       ☑ ML Directional Event Settled                │
├─────────────────────────────────────────────────────┤
│ ▶ ☐ CARRY & YIELD                           (6)     │  ← collapsed; click family checkbox to select all 6
└─────────────────────────────────────────────────────┘
```

Behavior:

- **Family-row checkbox** is tri-state: all archetypes selected → checked, some → indeterminate, none → unchecked. Toggling it selects/deselects every archetype in that family.
- **Archetype-row checkboxes** toggle independently. The family's tri-state derives from its children.
- **No archetypes selected → no filter applied.** A family checked with all-archetypes-selected behaves the same as no-filter for that family (for now; we'll re-evaluate when families gain non-archetype config).
- **Pill label**: `All families` when nothing selected; `Carry & Yield` when 1 family fully selected; `Carry Basis Perp` when 1 archetype selected; `N selected` when mixed/many.

### 4.4 Why no Asset Class pill (decision 1, locked)

The legacy 5-asset-group pill is dropped from the bar. Per architecture-v2, asset group is a **derived label**, not an identity axis — a single CARRY_BASIS_PERP strategy can run on CeFi (Binance) or DeFi (Hyperliquid), so picking by asset class hides the unified view of one strategy. Family is the identity axis we want users picking on.

**Reversibility commitment** (decision from user, 2026-04-27): even though the pill is gone, the data layer must preserve asset-group filterability so we can resurface a pill later without re-plumbing. See §10.

---

## 5 — Cascade and reset semantics

Today's cascade in [`global-scope-filters.tsx:484-547`](../../components/platform/global-scope-filters.tsx#L484-L547):

```
Org change      → clears Client + Strategy
Client change   → clears Strategy
Family change   → clears Strategy
Strategy change → no clears
```

Proposed cascade (4-pill, multi-select Family/Archetype):

```
Org change             → clears Client, Strategy
Client change          → clears Strategy
Family checkbox toggle → selects/deselects all child archetypes; clears Strategy
Archetype toggle       → updates parent family tri-state; clears Strategy
Strategy change        → no clears
```

Key invariant: **the user's left-most picks are sticky; downstream picks invalidate when their parent set changes.** Family/Archetype no longer cascades from a separate Asset Class pill — they're the top of their own tree.

---

## 6 — Store changes

### 6.1 Field shape (multi-select Family/Archetype, locked)

[`lib/stores/global-scope-store.ts`](../../lib/stores/global-scope-store.ts) today:

```ts
strategyFamily?: StrategyFamily;       // single, v2 — UNUSED by top bar after this redesign
strategyArchetype?: StrategyArchetype; // single, v2 — UNUSED by top bar after this redesign
strategyFamilyIds: string[];           // multi, LEGACY (asset groups)
```

The bar now uses **multi-select** for Family + Archetype, so we add two arrays and rename the legacy field:

```ts
// New (top-bar writes these)
strategyFamilyIdsV2: string[];   // values from STRATEGY_FAMILIES_V2 (e.g. "CARRY_AND_YIELD")
strategyArchetypeIds: string[];  // values from STRATEGY_ARCHETYPES_V2 (e.g. "CARRY_BASIS_PERP")

// Renamed from strategyFamilyIds → assetGroupIds (zustand migrate v1→v2)
assetGroupIds: string[];         // legacy 5-asset-group filter, kept for reversibility (§10)

// Existing single-pick fields kept for back-compat consumers (architecture-v2 picker, signals dashboard)
strategyFamily?: StrategyFamily;
strategyArchetype?: StrategyArchetype;
```

The single-pick `strategyFamily` / `strategyArchetype` fields stay because [`components/architecture-v2/family-archetype-picker.tsx`](../../components/architecture-v2/family-archetype-picker.tsx) and a few signals-dashboard consumers already write to them. Top-bar redesign does not touch those — separate concern.

### 6.2 Migration plan

Bump zustand `version: 1 → 2` in `global-scope-store.ts`. Migrate hook:

```ts
migrate: (persisted, version) => {
  if (version < 2) {
    const s = persisted?.scope ?? {};
    return {
      scope: {
        ...INITIAL_SCOPE,
        ...s,
        // Rename legacy field
        assetGroupIds: Array.isArray(s.strategyFamilyIds) ? s.strategyFamilyIds : [],
        // New v2 multi-select fields
        strategyFamilyIdsV2: [],
        strategyArchetypeIds: [],
      },
    };
  }
  return persisted;
};
```

Drop `strategyFamilyIds` from the type after migration.

---

## 7 — Phases & checklist

### Phase 1 — top-bar filter UX (THIS REDESIGN)

User's request: get the filters looking right and feeling right, then propagate.

- [x] §3 design questions answered (4-pill, multi-select, no Asset Class)
- [x] Visual comparison reviewed — Variant A (4 pills) chosen
- [ ] Add `strategyFamilyIdsV2: string[]` + `strategyArchetypeIds: string[]` to `global-scope-store.ts`
- [ ] Rename legacy `strategyFamilyIds → assetGroupIds`; bump zustand `version: 1 → 2` with migrate hook (see §6.2)
- [ ] Replace the legacy "All Families" pill in `<GlobalScopeFilters>` with a Family→Archetype grouped multi-select (checkbox tri-state on family rows; checkbox on archetype rows). Reuse the existing `<CompactMultiSelect>` group-by code path
- [ ] Drop the Asset Class pill from the top bar (UI removal only — store field stays per §10)
- [ ] Strategy pill: filter source switches from `assetClass`-based to `archetypeIds + familyIdsV2`-based
- [ ] Update all `useGlobalScope` consumers that read `strategyFamilyIds` (asset groups) → `assetGroupIds` (~10 call sites; grep `strategyFamilyIds` before PR)
- [ ] Unit tests: role-gated rendering, cascade behavior, family↔archetype tri-state
- [ ] Smoke-test on `/services/trading/overview`, `/services/trading/terminal`, `/services/reports`

### Phase 2 — widget tagging schema

Not started until Phase 1 has shipped and is settled.

- [ ] Extend `WidgetDefinition` with optional `assetGroups`, `families`, `archetypes`, `instrumentTypes`
- [ ] Document the "empty/undefined = applies to all" semantic
- [ ] Tag the ~10 most asset-group-specific widgets first (sports-my-bets, defi-yield-chart, options-greek-surface, predictions-\*, etc.) as a worked example
- [ ] Render gate in `<WidgetGrid>` that filters by current scope
- [ ] Tests for "empty tags = always shown" and "tagged widget hides when filter excludes it"

### Phase 3 — data-hook predicates

- [ ] Update `use-positions`, `use-orders`, `use-strategies`, `use-trading`, `use-pnl`, `use-risk` to consume `strategyFamily` / `strategyArchetype` via `makeFamilyFilterPredicate`
- [ ] Update mock generators to populate `strategy_family` / `strategy_id` so the predicate has data to match on
- [ ] Tests for each hook with each axis of filter active

### Phase 4 — questionnaire → default scope

- [ ] On first sign-in after questionnaire submit, hydrate `global-scope-store` with the seed
- [ ] Reuse `seedFiltersFromQuestionnaire` — no new logic needed, just write to the store
- [ ] One-shot — does not re-overwrite the user's later picks

### Phase 5 — route consolidation (optional, separate plan)

The asset-group-sharded routes (`/services/trading/sports`, `/services/trading/defi`, …) become candidates for unification once tagging + filtering is mature. Out of scope for now — track separately if/when the user asks.

---

## 8 — References

- Visibility model: [`codex/14-playbooks/cross-cutting/visibility-slicing.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md)
- v2 taxonomy: [`codex/09-strategy/architecture-v2/README.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/README.md)
- Catalogue pattern: [`codex/14-playbooks/cross-cutting/catalogues.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/catalogues.md)
- Per-client overrides: [`codex/09-strategy/cross-cutting/client-strategy-config.md`](../../../unified-trading-pm/codex/09-strategy/cross-cutting/client-strategy-config.md)
- Existing v2 picker: [`components/architecture-v2/family-archetype-picker.tsx`](../../components/architecture-v2/family-archetype-picker.tsx)
- Existing predicate: [`lib/architecture-v2/family-filter.ts`](../../lib/architecture-v2/family-filter.ts)
- Questionnaire types: [`lib/questionnaire/types.ts`](../../lib/questionnaire/types.ts)

---

## 10 — Reversibility: keep asset-group filtering alive without the pill

**Constraint (user, 2026-04-27):** removing the Asset Class pill is a UI-only change. If we ever decide to bring it back (or expose it on a per-surface filter), we must not have to re-plumb the data layer. Reintroducing the pill should be a one-file edit in `<GlobalScopeFilters>`.

### 10.1 What we keep

| Layer                         | What stays                                                                                                      | Why                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `global-scope-store.ts`       | `assetGroupIds: string[]` (renamed from `strategyFamilyIds`)                                                    | Top bar doesn't write to it; downstream hooks can still read it; new pill drops in by writing to it. |
| `setStrategyFamilyIds` action | Renamed to `setAssetGroupIds`; kept on the store interface even though the bar doesn't call it                  | Reintroduces the pill = one component edit. No store-shape work.                                     |
| Data hooks                    | `use-positions`, `use-orders`, `use-strategies`, etc. **continue to honor `assetGroupIds`** in their predicates | Keeps the filter functional from URL params, deep links, or future surface-level filters.            |
| `WidgetDefinition`            | When Phase 2 lands, `assetGroups?: VenueAssetGroupV2[]` stays a first-class tag on widgets                      | Widgets are still inherently asset-group-bound (sports, DeFi yield); tagging continues regardless.   |
| Mock fixtures                 | `STRATEGIES[].assetClass` stays                                                                                 | Strategy → asset-group mapping is meaningful even when the user can't filter on it from the bar.     |
| Questionnaire seeds           | `seedFiltersFromQuestionnaire()` keeps writing `assetGroupIds`                                                  | Onboarding can pre-scope a client to their entitled asset groups even with no visible pill.          |

### 10.2 What we drop

- The Asset Class **pill UI** in `<GlobalScopeFilters>` (variant A choice).
- The `strategyAllLabel` derivation that read the legacy field for display.

### 10.3 How to re-add the pill later (smoke test for reversibility)

If we ever bring it back, the diff is roughly:

1. In `<GlobalScopeFilters>`, render a `<CompactMultiSelect>` against `VENUE_ASSET_GROUPS_V2`, bound to `scope.assetGroupIds` / `setAssetGroupIds`.
2. (Optional) Cascade: clearing other pills when asset-group changes — opt-in.

No store change, no hook change, no widget tag change. **If a future PR claiming to "reintroduce the asset-group pill" touches more than `<GlobalScopeFilters>`, the reversibility commitment has been broken — flag it in review.**

### 10.4 Test coverage

Phase 1 PR adds two assertion-level tests that lock the contract:

- `assetGroupIds` round-trips through the store (set → get → migrate v1→v2 from a legacy `strategyFamilyIds` payload).
- A data hook (e.g. `use-strategies`) still filters by `assetGroupIds` when it is non-empty, even though no UI writes to it.

---

## 9 — Change log

| Date       | What                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-27 | Doc started. Audit complete. Phase 1 design ready for review.                                                                                                                                 |
| 2026-04-27 | Decisions locked: 4-pill bar (no Asset Class), Family→Archetype is a single grouped multi-select with checkboxes (tri-state on family rows). Asset-group filtering kept reversible — see §10. |
