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

## 11 — Persona-grounded gating system (read before extending)

> Written 2026-04-27 after a proper end-to-end read of `lib/auth/personas.ts` (all 32 personas) plus the playbook docs in `codex/14-playbooks/` (`audiences-and-journeys.md`, `cross-cutting/{visibility-slicing,sma-vs-pooled,client-reporting,fund-org-hierarchy}.md`, `playbooks/{03a,03b,03c}-demo-*.md`, `shared-core/{dart-pricing-axes,signal-broadcast-architecture}.md`). The earlier sections (§1–§10) describe the **filter** rework. This section describes the **gating** rework that the family-axis entitlement work in commit `dc033e6c` started — and what's needed to do it properly.

### 11.1 The actual pattern across the 32 personas

Personas group cleanly along **four orthogonal axes**, not the three I named earlier. Reading every persona's `entitlements + description + assigned_strategies` made this clear:

**Axis A — Stage in the funnel** (where the relationship is, commercially):

| Stage             | Personas                                                                                                                                                                                                                                                                                              | Entitlement signature                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Anonymous         | (none — server-rendered marketing site)                                                                                                                                                                                                                                                               | —                                                                                                                       |
| Light-auth        | none today; covered by `<BriefingAccessGate>` + access codes                                                                                                                                                                                                                                          | (cookie-flag, not a persona)                                                                                            |
| **Prospect**      | `prospect-im`, `prospect-dart-full`, `prospect-dart-signals-in`, `prospect-odum-signals`, `prospect-regulatory`, `prospect-platform`, `prospect-dart` (Sarah Quant), `prospect-perp-funding` (Desmond Ops), `prospect-im-under-regulatory`, `prospect-signals-only`, `desmond-{dart-full,signals-in}` | Heavy `investor-*` entitlements + the relevant trading-domain entries for "See It Live" demo links inside presentations |
| **Demo (Tier 2)** | `demo-signals-client`, `demo-im-reports-only`, `demo-allocator`, `demo-investor-lp`                                                                                                                                                                                                                   | Minimal — narrow to one product surface (reports / IR), explicit lock on the rest                                       |
| **Real client**   | `client-full`, `client-data-only`, `client-premium`, `elysium-defi`, `elysium-defi-full`, `client-regulatory`, `client-im-pooled`, `client-im-sma`                                                                                                                                                    | Plain trading entitlements + `reporting`; `assigned_strategies` populated for some                                      |
| Internal/admin    | `admin`, `admin-odum`, `internal-trader`, `im-desk-operator`                                                                                                                                                                                                                                          | `["*"]` wildcard                                                                                                        |
| Investor          | `investor`, `advisor`                                                                                                                                                                                                                                                                                 | Heavy `investor-*` set                                                                                                  |

**Axis B — Commercial path** (which Odum product they're on):

The four products are documented in [shared-core/dart-pricing-axes.md](../../../unified-trading-pm/codex/14-playbooks/shared-core/dart-pricing-axes.md) and [shared-core/signal-broadcast-architecture.md](../../../unified-trading-pm/codex/14-playbooks/shared-core/signal-broadcast-architecture.md). Persona evidence:

| Path                                                          | Personas                                                                                                                  | Surface they live on                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IM** (Investment Management — Odum runs strategies)         | `prospect-im`, `client-im-pooled`, `client-im-sma`, `demo-im-reports-only`, `demo-allocator`, `demo-investor-lp`          | `/services/reports/*` + (optionally) `/investor-relations/*`. Per [client-reporting.md](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/client-reporting.md), this is the **shared reporting surface** — same pages as Reg Umbrella. |
| **DART Full** (client builds + runs on Odum infra)            | `prospect-dart-full`, `prospect-dart`, `prospect-platform`, `desmond-dart-full`, `client-full`                            | Full `/services/{data,research,promote,trading,observe,reports}/*` tree                                                                                                                                                                           |
| **DART Signals-In** (client keeps strategy IP, Odum executes) | `prospect-dart-signals-in`, `desmond-signals-in`, `prospect-signals-only`, `demo-signals-client`, `prospect-perp-funding` | Same shell as DART Full but `/research/*` and `/promote/*` are gated. Per [03c-demo-dart.md](../../../unified-trading-pm/codex/14-playbooks/playbooks/03c-demo-dart.md), the `strategy-full` + `ml-full` entitlements are the gate.               |
| **Reg Umbrella** (Odum lends FCA wrapper)                     | `prospect-regulatory`, `client-regulatory`, `prospect-im-under-regulatory`                                                | `/services/reports/*` (UI-identical to IM per [03a-demo-reg-umbrella.md](../../../unified-trading-pm/codex/14-playbooks/playbooks/03a-demo-reg-umbrella.md)). Plus `investor-regulatory` if applicable.                                           |
| **Odum Signals** (outbound signal leasing)                    | `prospect-odum-signals`                                                                                                   | Reports-only view; no trading surface; counterparty executes elsewhere                                                                                                                                                                            |

**Axis C — Asset/family scope** (what they actually trade):

This is the axis the v2 architecture is built around. Today most personas express scope via **`{ domain: trading-defi, tier: basic }`-style asset-group entries**. A few express it via `assigned_strategies` slot labels (Patrick, Desmond). My family-axis entitlement (commit `dc033e6c`) added a third expression mechanism but only used it on test fixtures.

Real personas in `personas.ts` carry varying scope shapes:

| Persona                           | Scope expression                                                                                                                                                              | What it means                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `client-full`                     | 5× `{domain: ..., tier: "premium"}`                                                                                                                                           | Full asset universe, premium across the board                             |
| `client-premium`                  | 5× `{domain: ..., tier: "basic"}` + `strategy-full`                                                                                                                           | Same universe at basic tier, has the strategy builder                     |
| `elysium-defi`                    | `{domain: trading-defi, tier: basic}` + `assigned_strategies: [CARRY_BASIS_PERP@..., CARRY_STAKED_BASIS@...]`                                                                 | DeFi-only, **two specific Carry slots routed**                            |
| `elysium-defi-full`               | Same domain, plus `strategy-full`, plus 5 `assigned_strategies` (adds CARRY_RECURSIVE_STAKED + 2 YIELD_ROTATION)                                                              | Upgrade-preview of Patrick's tier                                         |
| `desmond-dart-full`               | `trading-common` + `trading-defi` (basic) + 11 `assigned_strategies` across CARRY_BASIS_PERP, ARBITRAGE_PRICE_DISPERSION, STAT_ARB_CROSS_SECTIONAL, ML_DIRECTIONAL_CONTINUOUS | Cross-exchange perp-funding arb persona; closed list of 11 specific slots |
| `prospect-perp-funding`           | `trading-common` + `trading-defi` (basic) + `investor-regulatory`                                                                                                             | Reg Umbrella + DART Signals-In hybrid                                     |
| `carry-yield-basic-client` (mine) | `{family: CARRY_AND_YIELD, tier: basic}` only                                                                                                                                 | New family-axis test                                                      |

**Key insight I missed earlier:** `assigned_strategies` is a **closed-list** scope mechanism that already exists. It expresses scope at the `(archetype, venue, instrument, chain)` slot-label grain. Per the comment block at `lib/config/auth.ts:152-162`, it's resolved by `lib/entitlements/strategy-route.ts` and seeded from `AdminStrategyAssignment` records in production. **Real personas use this when the spec is "exactly these 11 strategies, nothing else."**

**Axis D — Tier within a path** (basic vs premium):

`TIER_ORDER: { basic: 0, premium: 1 }`. Premium covers basic. Applies to both `TradingEntitlement` and (now) `StrategyFamilyEntitlement`. Shows up in personas like `client-full` (premium across all 5 domains) vs `client-premium` (basic across all 5).

### 11.2 What the gating system actually has to do

Synthesised from the playbook docs — every screen the user sees must answer all four questions:

1. **Does this user belong on this surface at all?** (Axis A — Stage. e.g. anonymous can't see `/dashboard`; demo prospect can't see `/admin`.)
2. **Does this user's commercial path include this product?** (Axis B — Path. e.g. Reg Umbrella prospect sees Reports, not Trading.)
3. **Does this user's asset/family scope include this widget's content?** (Axis C — Scope. e.g. Carry & Yield client sees lending/staking; doesn't see vol-trading widgets.)
4. **Is the user's tier high enough?** (Axis D — Tier.)

Each axis maps to a different gating layer:

| Axis                     | Layer                                                                                      | Mechanism today                                                                                                                                   | Gap                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Stage                | Route group (`(public)`, `(platform)`, `(ops)`) + `<RequireAuth>`                          | Routing + role check                                                                                                                              | Demo personas need **locked-visible** mode, not hidden — per pb3a §"Implementation gap". Today services are hidden, not padlocked.                                                                       |
| B — Path                 | Per-route `<EntitlementGate>` / `<PageEntitlementGate>`                                    | Existing — checks `trading-common`, `data-pro`, `reporting`, etc.                                                                                 | The current implementation **mixes Path and Scope** into a single set of strings. Splitting them would let Reg Umbrella + IM share the same gates without entitlement creep.                             |
| C — Scope (asset/family) | `requiredEntitlements` on widgets                                                          | `TradingEntitlement` (asset group, legacy) + `StrategyFamilyEntitlement` (family, new — added this session) + `assigned_strategies` (closed list) | **Three parallel mechanisms** with overlapping semantics. Today nothing reads `assigned_strategies` at the widget gate; only `lib/entitlements/strategy-route.ts` consumes it. This is the biggest mess. |
| D — Tier                 | `TIER_ORDER` predicate inside `checkTradingEntitlement` / `checkStrategyFamilyEntitlement` | Works correctly                                                                                                                                   | The `tier` field is duplicated across both shapes. Could collapse to one if A+B+C+D were unified.                                                                                                        |

### 11.3 The proposed unified gating model

After reading everything, I'd recommend collapsing the four parallel mechanisms (`TradingEntitlement`, `StrategyFamilyEntitlement`, `assigned_strategies`, plain string entitlements) into a **single declarative entitlement record per user**, with the resolver computing access at gate-check time. Concretely:

```ts
interface UserEntitlements {
  // Axis A — stage gate (handled by route group + role, not stored here)

  // Axis B — commercial path
  paths: ("IM" | "DART_FULL" | "DART_SIGNALS_IN" | "REG_UMBRELLA" | "ODUM_SIGNALS")[];

  // Axis C — scope (the union of three sub-axes the user can hold)
  scope: {
    assetGroups?: { group: VenueAssetGroupV2; tier: TradingTier }[]; // CEFI, DEFI, etc.
    families?: { family: StrategyFamilyKey; tier: TradingTier }[]; // CARRY_AND_YIELD, etc.
    archetypes?: { archetype: StrategyArchetype; tier: TradingTier }[]; // optional finer grain
    assignedStrategies?: string[]; // exact slot labels — overrides everything narrower
  };

  // Axis D — tier is embedded in each scope entry above

  // Plain feature flags (data-pro, reporting, ml-full, etc.) — unchanged
  features: Entitlement[];

  // Investor-relations claims (board, plan, archive, etc.) — unchanged
  irClaims: Entitlement[];
}
```

Then the gate-check predicate becomes:

```ts
function canAccessWidget(user: UserEntitlements, widget: WidgetDefinition): boolean {
  // Stage check happens at route group, not here.

  // Path check: if widget declares paths, user must hold at least one of them.
  if (widget.paths && !widget.paths.some((p) => user.paths.includes(p))) return false;

  // Feature-flag check: standard OR-list.
  if (widget.requiredFeatures && !widget.requiredFeatures.some((f) => user.features.includes(f))) return false;

  // Scope check: if widget declares any scope axis, user must satisfy at least one
  // declared axis (asset group OR family OR archetype OR assigned-strategy match).
  if (widget.scope) {
    const matchesAssetGroup = widget.scope.assetGroups?.some((req) =>
      user.scope.assetGroups?.some((have) => have.group === req && tierOk(have.tier, req.tier)),
    );
    const matchesFamily = widget.scope.families?.some((req) =>
      user.scope.families?.some((have) => have.family === req.family && tierOk(have.tier, req.tier)),
    );
    const matchesArchetype = widget.scope.archetypes?.some((req) =>
      user.scope.archetypes?.some((have) => have.archetype === req.archetype && tierOk(have.tier, req.tier)),
    );
    const matchesAssigned = widget.archetypes?.some((arch) =>
      user.scope.assignedStrategies?.some((slot) => slot.startsWith(arch + "@")),
    );
    if (!(matchesAssetGroup || matchesFamily || matchesArchetype || matchesAssigned)) return false;
  }

  return true;
}
```

This collapses the four parallel mechanisms into one consistent shape. The widget definition gains explicit `paths` and `scope` fields rather than the ambiguous `requiredEntitlements` (which today mixes asset-group, family, feature flags, and IR claims into one OR-list).

### 11.4 Why this is better than what's there today

**Today's pain:**

- A widget with `requiredEntitlements: [{domain: trading-defi, tier: basic}, "data-pro"]` is ambiguous about whether it's gating on "DeFi access" or "data tier". Both are checked OR-style, so a `data-pro`-only persona unlocks a DeFi widget — which is wrong if the widget shows DeFi-specific content.
- `assigned_strategies` exists but is invisible to widget gates today. A persona like `desmond-dart-full` with 11 explicit slot labels has _no way to express that scope to a widget_ without also holding the (less precise) `trading-common`/`trading-defi` domain entries. That's why his persona currently carries both — redundant.
- Reg Umbrella and IM are UI-identical (per [03a/03b](../../../unified-trading-pm/codex/14-playbooks/playbooks/) docs) but their personas express the difference via the _absence_ of `data-pro`/`execution-full`/`strategy-full` rather than via a positive `path: "REG_UMBRELLA"` claim. That makes "is this user on Reg Umbrella?" a derived question across N negative checks instead of one positive read.
- The locked-visible requirement from pb3a §"Implementation gap" (`current implementation hides services; pb3a requires LOCKED-VISIBLE`) can't be cleanly satisfied because the gate is binary (entitled or not). A separate "is this surface marketable to this user?" axis is needed — currently absent.

**The unified model fixes all four:**

- Path is explicit, so Reg Umbrella demos can render every service tile as locked-visible just by checking `widget.paths.includes(user.paths[0])`.
- Scope is a multi-source OR (asset group, family, archetype, assigned-strategy) — `assigned_strategies` finally has a place at the widget layer.
- Feature flags (`data-pro`, `reporting`) live in their own axis, separate from scope, so they don't accidentally unlock asset-specific widgets.
- Tier ordering remains a per-axis per-entry predicate, no surprises.

### 11.5 Recommended phased migration

**Don't rewrite all 32 personas at once.** The current shape works; this is a refactor to clarity, not a feature. The migration plan:

| Phase        | Scope                                                                                                                                                                                                                                                        | Risk                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| 11.5.a (now) | Add the `paths` and `scope` fields to `WidgetDefinition` alongside `requiredEntitlements` (no removal yet). Build the unified resolver. New widgets opt in; old widgets still work.                                                                          | Low — additive                         |
| 11.5.b       | Tag a worked example: convert all 32 personas to the unified shape. Keep the legacy `entitlements` field as a derived view for back-compat.                                                                                                                  | Medium — touches every persona         |
| 11.5.c       | Migrate widget gates one feature area at a time (start with DeFi + Trading; finish with Reports + IR).                                                                                                                                                       | Low — per-area, can ship incrementally |
| 11.5.d       | Remove the legacy `entitlements` array once nothing reads it. Delete `EntitlementGate.acceptAnyFamilyEntitlement` / `PageEntitlementGate.acceptFamilies` (the workaround flags I added in `708d9538`) — they become unnecessary because `paths` is explicit. | Low — cleanup                          |

### 11.6 Open questions before any of 11.5 ships

1. **Should `paths` be a closed enum or extensible?** I'm proposing `IM | DART_FULL | DART_SIGNALS_IN | REG_UMBRELLA | ODUM_SIGNALS` — five values matching the four products plus the DART split. If a sixth product appears, the enum has to grow. Acceptable?
2. **Where does `assigned_strategies` live?** I'm proposing `user.scope.assignedStrategies`. Today it's at the persona level. Moving it inside `scope` keeps all scope mechanisms together, but might break the existing `lib/entitlements/strategy-route.ts` consumer. (Probably OK — that resolver is small.)
3. **Do investor-relations claims (`investor-board`, `investor-plan`, etc.) belong in `features` or in their own `irClaims` bucket?** I had a separate bucket above. `features` is also fine if we want one less concept.
4. **Locked-visible mode** — when a widget fails the path check, should the gate render `<UpgradeCard>` or hide the widget entirely? Per pb3a, demo personas should see locked-visible; per real-client expectations, hidden may be cleaner. Likely a per-route decision (`renderLocked: "card" | "hidden"`).
5. **Tier semantics on `paths`.** Today `paths` is a flat list. Should we have `paths: { path: ..., tier: basic|premium }[]`? Looking at the personas, tier varies within a path (e.g. DART Full premium vs basic), so probably yes — but it overlaps with the asset-group tier in `scope`. Need to decide if path-tier and scope-tier are independent or linked.

### 11.7 Why this is in the doc, not in the code yet

I'd like to nail down the answers to §11.6 before touching `WidgetDefinition` or `personas.ts`. The current state (after `dc033e6c` + `708d9538`) is functional — Carry & Yield personas work end-to-end — but adding more family-axis personas on top of the current scheme will compound the mess. Better to decide on the unified model first, then propagate.

---

## 9 — Change log

| Date       | What                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-27 | Doc started. Audit complete. Phase 1 design ready for review.                                                                                                                                                                                                                                                                                             |
| 2026-04-27 | Decisions locked: 4-pill bar (no Asset Class), Family→Archetype is a single grouped multi-select with checkboxes (tri-state on family rows). Asset-group filtering kept reversible — see §10.                                                                                                                                                             |
| 2026-04-27 | §11 added: persona-grounded gating-system design after a proper end-to-end read of all 32 personas + 7 playbook docs. Identifies four orthogonal axes, three parallel scope mechanisms today (`TradingEntitlement` + `StrategyFamilyEntitlement` + `assigned_strategies`), and proposes a unified `UserEntitlements` shape. Five open questions in §11.6. |
