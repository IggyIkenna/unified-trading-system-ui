---
status: open
owner: ComsicTrader
started: 2026-04-25
purpose: Context brief for the DART terminal audit against strategy architecture v2 + playbooks personas/entitlements
sources:
  - codex/09-strategy/architecture-v2/** (read 2026-04-25)
  - codex/09-strategy/cross-cutting/** (read 2026-04-25)
  - codex/14-playbooks/** (read 2026-04-25; _archived_pre_v2 skipped)
---

# DART v2 Audit Context

Single context-preserving brief for the upcoming UI audit. Distills two large codex trees (~180 docs) into the load-bearing facts the audit needs. Every section cites the codex paths so we can re-open the source if we need to.

> **Audit target:** the trading terminal (DART) side first, then the rest of the lifecycle tabs. We are checking whether the UI matches the v2 model that replaced the asset-class-as-primary-axis model.

---

## 0. Updates landed 2026-04-25 (post-brief delta)

A burst of commits on **2026-04-25** materially extended the model since the initial codex read. All sections below incorporate these, but call-outs:

- **6 new personas** (now 14 total in PM): `elysium-defi-full`, `prospect-dart-full`, `prospect-dart-signals-in`, `prospect-perp-funding`, `demo-im-reports-only`, `demo-signals-client`. UI side: `lib/auth/persona-dashboard-shape.ts` extended; **vitest gate** asserts every `PERSONAS` entry has explicit `PERSONA_TILE_SHAPES` + `PERSONA_SUBROUTE_SHAPES` registration (regression that hit Desmond on prod-login). Dynamic `PersonaId` derivation in PM `sync_restriction_profiles_to_ui.py`. (UI: `8d24cf2b`, `f0fa1d46`, `0c8547a8`; PM: `7a4b90f`.)
- **Catalogue scale: ~5,000 envelopes**, not ~200–300. New `EnvelopeBrowser` ([components/strategy-catalogue/EnvelopeBrowser.tsx](../../components/strategy-catalogue/EnvelopeBrowser.tsx)) virtualises with `@tanstack/react-virtual` past 100 rows; route `/services/strategy-catalogue/envelope`. Backed by GCS-loaded `envelope.json` + `strategy_instruments.json` + `availability.json` via [lib/architecture-v2/envelope-loader.ts](../../lib/architecture-v2/envelope-loader.ts) and `app/api/catalogue/envelope/route.ts` (ADC, 5-min cache). (UI: `40ab5186`, `ce22ba42`, `e7359feb`.)
- **Access resolver consolidated** at [lib/entitlements/strategy-route.ts](../../lib/entitlements/strategy-route.ts): `resolveSlotAccess`, `resolveArchetypeAccess`, `canEnterTerminal`, `isVisible`. Reads optional `persona.assigned_strategies` first, then falls back to entitlement logic. **This is the start of the §3.1 unification** that the brief listed as fragmented. (UI: `40ab5186`.)
- **4-level filter cascade** is now the standard pattern: `category → family → archetype → strategy/access`. Rolled into IM reporting (performance / trades / portfolio-analytics), terminal manual-trading instrument scoping, and EnvelopeBrowser. New `useStrategyScopedInstruments` hook intersects allowed instruments with venue base list. (UI: `28ad5026`, `0be7b2bc`.)
- **Terminology rename**: `asset_class → asset_group`. New SSOT module [lib/architecture-v2/terminology.ts](../../lib/architecture-v2/terminology.ts) (`TERMS.PRIMARY_CATEGORY`, `ASSET_GROUP`, `STRATEGY_FAMILY`, `STRATEGY_ARCHETYPE`, access-state labels, tenor labels) — prevents drift like the "DeFi/DeFi" mis-label. PM codex SSOT: [`06-coding-standards/terminology-ssot.md`](../../../unified-trading-pm/codex/06-coding-standards/terminology-ssot.md).
- **FOMO grid renders ALL instances** (legacy "hide subscribed" pre-filter dropped). Per-card lock badges: green `Subscribed` / green `Available` / amber `Reports only` / zinc `Locked` (with `/contact?service=dart-full&action=unlock&instance=…` CTA). Header math fixed: now reads `"{N} services"` instead of misleading `"{visible} of {all}"`. (UI: `a42a9851`.)
- **Admin lock-state page gated**: `/services/strategy-catalogue/admin/lock-state` now wraps `AdminOnlyGate`; `STRATEGY_CATALOGUE_SUB_TABS` "Admin · Lock state" tab requires `admin` entitlement. `restriction-profiles.ts` synced from PM YAMLs. Legacy "Elysium —" prefix dropped from 4 venue-set-variant labels (Base/Premium/Multi-EVM/Multi-EVM+Solana — they're generic ladder names, not Elysium-specific). (UI: `fc2b15af`.)
- **Path D (Odum Signals — outbound)** added to strategy-eval as **fourth commercial path** alongside DART Full / Signals-In / Reg Umbrella. New step-7 conditional section captures delivery mechanism (webhook / REST pull / batch), schema preference, latency tolerance, exec context. Section L₂ links to `/briefings/signals-out`. (UI: `40f49173`.)
- **Strategy-eval = 8-step wizard** (was 16-section scroll page) with stepper + per-step validation + `holdingPeriod` axis (intraday / overnight-STBT / positional / long-term / mixed). Server-side draft save + cross-device resume via Firestore (`strategy_evaluation_drafts/{sha256(email)}`). Magic-link confirmation + status page. (UI: `76c3c46b`, `1442230d`, `148f044b`, `e5f7abda`, `1a10bed6`.)
- **PM Phase 9-11 plan** [`plans/active/dart_ui_strategy_filtering_and_onboarding_2026_04_24.md`](../../../unified-trading-pm/plans/active/dart_ui_strategy_filtering_and_onboarding_2026_04_24.md) is now the SSOT for all the above. Phase 9 = envelope + admin locking/routing/org-attach. Phase 10 = strategy-instruments resolver + 4-level cascade + demo-persona link. Phase 11 = 5k catalogue UI + `asset_class→asset_group` rename + access-aware lock states. (PM: `f70926c`.)
- **PM codex additions today**: `instruments-resolver-architecture.md`, `terminology-ssot.md`, `data-status-drilldown.md` (strict mode = production default). (PM: `20c4532`, `baaacb2`, `e3c0d97`.)

---

## 1. The pivot in one paragraph

v1 organized everything by asset class (CeFi / DeFi / TradFi / Sports / Prediction). That couldn't cleanly answer "what does this client see and what is gated" — entitlements, strategy availability, and code paths were tangled per category. v2 collapses ~53 strategies into **8 families × 18 archetypes × 7 composition axes**. Category is now **derived** from `(archetype, config)`. Business differentiation (SaaS DART vs IM vs Reg Umbrella) is **metadata**: visibility, lock-state, entitlements, product routing — not code forks. The same components serve every persona; persona-specific filters slice them.

Sources: [`09-strategy/architecture-v2/README.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/README.md), [`09-strategy/architecture-v2/strategy-catalogue-3tier.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/strategy-catalogue-3tier.md), [`14-playbooks/_ssot-rules/03-same-system-principle.md`](../../../unified-trading-pm/codex/14-playbooks/_ssot-rules/03-same-system-principle.md).

---

## 2. The new strategy taxonomy

### 2.1 Families (8)

`ML_DIRECTIONAL`, `RULES_DIRECTIONAL`, `CARRY_AND_YIELD`, `ARBITRAGE_STRUCTURAL`, `MARKET_MAKING`, `EVENT_DRIVEN`, `VOL_TRADING`, `STAT_ARB_PAIRS`. One family per strategy, always.

### 2.2 Archetypes (18) — code paths per family

E.g. `CARRY_BASIS_PERP`, `CARRY_STAKED_BASIS`, `YIELD_ROTATION_LENDING`, `MARKET_MAKING_CONTINUOUS`, `MARKET_MAKING_EVENT_SETTLED`, `STAT_ARB_PAIRS_FIXED`, `STAT_ARB_CROSS_SECTIONAL`, `ARBITRAGE_PRICE_DISPERSION`, `LIQUIDATION_CAPTURE`, `VOL_TRADING_OPTIONS`, `EVENT_DRIVEN`, `ML_DIRECTIONAL_CONTINUOUS`, `ML_DIRECTIONAL_EVENT_SETTLED`, `RULES_DIRECTIONAL_CONTINUOUS`, `RULES_DIRECTIONAL_EVENT_SETTLED`, `CARRY_BASIS_DATED`, `CARRY_RECURSIVE_STAKED`, `YIELD_STAKING_SIMPLE`. Source: [`architecture-v2/archetypes/`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/).

### 2.3 The 7 composition axes

| Axis              | Examples                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| signal source     | ML, rules, TA, funding-rate, yield-spread, event-schedule, orderbook, liquidation-watcher, greeks, mempool |
| edge method       | value, rate-differential, spread-capture, arb, z-score, momentum, vol-divergence                           |
| staking method    | Kelly, fractional-Kelly, fixed-%, fixed-notional, vol-scaled, delta-paired, inventory-skewed               |
| venue eligibility | venue list + constraints (slow-moving)                                                                     |
| expression        | spot, perp, atm_call, 25d_call, synthetic, LP, basket                                                      |
| hold policy       | `SAME_CANDLE_EXIT`, `HOLD_UNTIL_FLIP`, `CONTINUOUS`, `ONE_SHOT`                                            |
| share class       | USDT, USDC, ETH, BTC, USD, GBP, EUR, SOL                                                                   |

Source: [`architecture-v2/axes/`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/axes/).

### 2.4 Identifier grammar (slot label)

`ARCHETYPE@venue-asset-instrument-period-quote-env` — e.g. `CARRY_BASIS_PERP@binance-eth-perp-10m-usdt-prod`. Family is **never** stored in the slot; always derived from archetype via `ARCHETYPE_TO_FAMILY`. Source: [`architecture-v2/naming-convention.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/naming-convention.md).

### 2.5 Lifecycle / maturity (forward-only staircase)

`smoke → backtest_minimal → backtest_1yr → backtest_multi_year → paper_1d → paper_14d → paper_stable → live_early → live_stable` (+ terminal `retired`). Forward-only; demotions require explicit admin action and emit `STRATEGY_LIFECYCLE_DEMOTED`. **Allocation CTAs only allowed at `paper_stable` or later.** Source: [`architecture-v2/strategy-lifecycle-maturity.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/strategy-lifecycle-maturity.md).

### 2.6 Lock state (4 values, per-instance)

| State                            | Who sees                          | Who can allocate    |
| -------------------------------- | --------------------------------- | ------------------- |
| `PUBLIC`                         | DART clients + IM desk + admin    | any DIY client + IM |
| `INVESTMENT_MANAGEMENT_RESERVED` | IM desk + admin                   | IM desk only        |
| `CLIENT_EXCLUSIVE`               | Client X + IM (read-only) + admin | Client X only       |
| `RETIRED`                        | admin only (historical)           | nobody              |

**Default = `INVESTMENT_MANAGEMENT_RESERVED`.** Only `STAT_ARB_PAIRS_FIXED × CEFI × spot|perp` is `PUBLIC` by explicit allowlist. Source: [`architecture-v2/restriction-policy.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/restriction-policy.md), [`architecture-v2/cross-cutting/strategy-availability-and-locking.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/strategy-availability-and-locking.md).

### 2.7 Product routing (orthogonal to maturity)

`dart_only` | `im_only` | `both` | `internal_only`. Decides **visibility, not execution** — an instance always runs against `odum-paper`/`odum-live`; routing only gates customer-facing surfaces.

### 2.8 Hard blocks (BL-1 … BL-10)

10 explicitly blocked `(archetype × category × instrument)` combos — e.g. DeFi options (no venue), Kalshi event-settled (no exec adapter), DeFi perp MM (protocol-owned). UI must hide these regardless of questionnaire answers or lock state. Source: [`architecture-v2/block-list.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/block-list.md).

---

## 3. Personas, entitlements, and the visibility model

### 3.1 Visibility-slicing predicate

```
visible(user, item) :=
    user.role == "admin"
  OR ( item.audience ⊇ user.role
      AND item.entitlement ⊆ user.entitlements
      AND item.lock_state is visible to user.role
      AND item.maturity ≥ user.role's minimum
      AND (item.org_scope is null OR item.org_scope == user.org_id) )
```

Applied uniformly to: dashboard tiles, service tabs, catalogue rows, sub-pages, table rows. Source: [`14-playbooks/cross-cutting/visibility-slicing.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md). The function is currently **fragmented** across `lib/config/auth.ts`, `components/shell/lifecycle-nav.tsx`, `lib/auth/demo-provider.ts`; consolidation tracked in roadmap (Phase 10.6+).

### 3.2 Entitlements (current)

Base flags (`lib/config/auth.ts`): `data-basic`, `data-pro`, `execution-basic`, `execution-full`, `ml-full`, `strategy-full`, `reporting`, `investor-relations`. Domain-tier pairs: `{ trading-common | trading-defi | trading-sports | trading-options | trading-predictions } × { basic | premium }`. Wildcard `"*"` admin-only.

### 3.3 The 14 personas (`14-playbooks/demo-ops/profiles/*.yaml`)

Updated 2026-04-25 — was 8, now 14. New entries marked **NEW**.

| Persona                            | Tiles unlocked                                     | Tiles padlocked        | Tiles hidden                                                         | Notable                                                                                                                                                                                                        |
| ---------------------------------- | -------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin`                            | all                                                | —                      | —                                                                    | short-circuits access_control                                                                                                                                                                                  |
| `anon`                             | —                                                  | —                      | all                                                                  | public marketing only                                                                                                                                                                                          |
| `client-full`                      | data, research, promote, trading, observe, reports | —                      | investor-relations, admin                                            | flavour `turbo` hides reporting, `deep_dive` unlocks all                                                                                                                                                       |
| `prospect-dart`                    | data, research, trading, observe, reports          | promote (upsell tease) | investor-relations, admin                                            | flavour `broader_platform` unlocks promote                                                                                                                                                                     |
| `desmond-dart-full`                | data, research, promote, trading, observe, reports | —                      | investor-relations, admin                                            | paired with `desmond-signals-in` via DemoPlanToggle (2026-04-24); pre-seeded questionnaire; assigned `CARRY_BASIS_PERP`, `ARBITRAGE_PRICE_DISPERSION`, `STAT_ARB_CROSS_SECTIONAL`, `ML_DIRECTIONAL_CONTINUOUS` |
| `desmond-signals-in`               | data, trading, observe, reports                    | research, promote      | investor-relations, admin                                            | research/promote tiles redirect to `/services/dart/locked?from=…`; "N/M strategies available — X more unlock with DART Full"                                                                                   |
| `elysium-defi-full` **NEW**        | data, research, promote, trading, observe, reports | —                      | investor-relations, admin                                            | Patrick / Elysium DeFi Full upgrade-preview; toggle from base `elysium-defi` via DemoPlanToggle; assigned DeFi staked-basis archetypes                                                                         |
| `prospect-dart-full` **NEW**       | data, research, promote, trading, observe, reports | —                      | investor-relations, admin                                            | generic DART Full prospect (mirrors `client-full` shape but org isn't paying yet)                                                                                                                              |
| `prospect-dart-signals-in` **NEW** | data, trading, observe, reports                    | research, promote      | investor-relations, admin                                            | generic DART Signals-In prospect (mirrors `desmond-signals-in` without the Telegram context)                                                                                                                   |
| `prospect-perp-funding` **NEW**    | data, trading, observe, reports                    | research, promote      | investor-relations, admin                                            | Reg-Umbrella + DART Signals-In prospect; cross-exchange perp-funding arb (CeFi + DeFi)                                                                                                                         |
| `demo-im-reports-only` **NEW**     | reports                                            | —                      | data, research, promote, trading, observe, investor-relations, admin | clean IM allocator-view demo (distinct from warmer `client-im-pooled`/`client-im-sma` which have investor-relations)                                                                                           |
| `demo-signals-client` **NEW**      | data, trading, observe, reports                    | research, promote      | investor-relations, admin                                            | clean Signals-In product showcase (distinct from `desmond-signals-in` and `prospect-dart-signals-in`)                                                                                                          |
| `prospect-im`                      | reports, investor-relations                        | data                   | research, promote, trading, observe, admin                           | turbo demo typical                                                                                                                                                                                             |
| `prospect-regulatory`              | reports                                            | data, trading, observe | research, promote, investor-relations, admin                         | deep-dive may unlock trading+observe to surface handoff                                                                                                                                                        |

**Demo-Plan toggle pairs** (DemoPlanToggle re-renders nav + sub-tabs without page reload): `desmond-dart-full ↔ desmond-signals-in`, `elysium-defi ↔ elysium-defi-full`.

**Persona-shape gate** ([tests/unit/lib/auth/persona-dashboard-shape.test.ts](../../tests/unit/lib/auth/persona-dashboard-shape.test.ts)): vitest asserts every `PERSONAS` entry has explicit `PERSONA_TILE_SHAPES` + `PERSONA_SUBROUTE_SHAPES` registration. Without this, missing personas silently fell through to `DEFAULT_TILE_SHAPE` which hid 3 of 5 tiles + locked DART (the regression that hit Desmond on prod-login today). Exports: `REGISTERED_TILE_SHAPE_IDS`, `REGISTERED_SUBROUTE_SHAPE_IDS`.

**Prod-login UAT redirect** (`app/(public)/login/page.tsx` → `lib/auth/personas.ts:isDemoPersonaEmail`): demo persona emails on `www.odum-research.com` auto-redirect to `uat.odum-research.com` and land on `/dashboard` (not `/investor-relations`) so DemoPlanToggle is in scope from first paint.

**Still planned, not yet instantiated:** `investor`, `advisor`, `internal-trader`. Source: [`14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md).

### 3.4 Service families (closed enum, `_ssot-rules/12-service-family-scope-rules.md`)

| Family                | Surfaces granted                                     | Excluded                   |
| --------------------- | ---------------------------------------------------- | -------------------------- |
| `IM`                  | reporting, client_portal                             | observe, research, promote |
| `RegUmbrella`         | reporting, compliance_overlay                        | observe, research, promote |
| `DART`                | reporting, observe, research, promote, trading, data | strategy_catalogue_admin   |
| `DART_reporting_only` | reporting                                            | everything else            |
| `IM_desk`             | strategy_catalogue_admin, reporting                  | —                          |
| `admin`               | everything                                           | —                          |

`check_service_family_scope(user, route)` runs **before** the generic visibility gate.

---

## 4. Commercial / entitlement model (the 13 building blocks)

Every demo restriction profile and production entitlement composes from the **same 13 atomic blocks**. Source: [`14-playbooks/_ssot-rules/05-building-block-dimensions.md`](../../../unified-trading-pm/codex/14-playbooks/_ssot-rules/05-building-block-dimensions.md).

| #   | Block                                        | #   | Block                                     |
| --- | -------------------------------------------- | --- | ----------------------------------------- |
| 1   | Reporting core                               | 8   | Venue packs                               |
| 2   | Regulatory umbrella reporting                | 9   | Chain packs                               |
| 3   | IM allocator reporting                       | 10  | Instrument-type packs                     |
| 4   | Strategy-service entry                       | 11  | Analytics packs                           |
| 5   | Instructions integration                     | 12  | Exclusivity / non-compete (Tier B uplift) |
| 6   | Research / promote pipeline (full DART only) | 13  | Custom solution premium (Tier B uplift)   |
| 7   | Execution layer                              |     |                                           |

**DART commercial paths** (from `_ssot-rules/04-dart-commercial-axes.md`):

- **Signals-only DART** = blocks 1+4+5+7+8+9+10+(opt 11). **No block 6.** Research/promote rendered LOCKED-VISIBLE.
- **Full DART** = signals-only + block 6.
- **Reporting-only** routes to IM or Reg Umbrella, not DART.
- **Path D — Odum Signals (outbound)** _added 2026-04-25 to strategy-eval_: fourth commercial path. Odum broadcasts signals **out** to a counterparty's execution stack. Captures delivery mechanism (webhook / REST pull / batch / other), schema preference (Odum standard vs map to client schema), latency tolerance, execution context. HMAC signing + idempotency keys per `/briefings/signals-out`. No capital flows; Odum does not see counterparty fills. Source: [`14-playbooks/shared-core/signal-broadcast-architecture.md`](../../../unified-trading-pm/codex/14-playbooks/shared-core/signal-broadcast-architecture.md).

**Show / don't-show discipline** (`_ssot-rules/06-show-dont-show-discipline.md`): every surface chooses one of two exclusion modes:

- `LOCKED-VISIBLE` — appears in nav with padlock + upgrade-path CTA. For scope-adjacent surfaces.
- `HIDDEN-ENTIRELY` — does not appear and is not reachable. For out-of-audience or internal-only.

Forbidden in any client view: internal cost columns, Tier A vs B numbers, other-client data, `CODE_NOT_WRITTEN`/`CODE_WRITTEN` maturity, internal ops/admin/devops/config routes, competitor comparisons, Odum engineering internals, model internals, pre-`paper_stable` instances on FOMO tearsheets.

---

## 5. The DART tab structure (audit target)

> Source of truth: [`09-strategy/architecture-v2/dart-tab-structure.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/dart-tab-structure.md).

### 5.1 Lifecycle collapse (8 → 4)

After 2026-04-20 the authenticated shell collapses 8 lifecycle stages into **4 user-visible stages**:

| Stage     | Label    | Audience                                                                                        |
| --------- | -------- | ----------------------------------------------------------------------------------------------- |
| `acquire` | Data     | admin/internal only (until DataStatusTab matures)                                               |
| `run`     | **DART** | admin/internal/DART clients — absorbs Research + Promote + Run + Execute + Observe + Deployment |
| `manage`  | Manage   | admin/internal/IM/Reg                                                                           |
| `report`  | Reports  | everyone with `reporting`                                                                       |

Internal `LifecycleStage` TS enum (`build`, `promote`, `execute`, `observe`) is retained but hidden from nav via `persona-lifecycle-shape.ts`; surfaces re-emerge as DART sub-tabs.

### 5.2 DART sub-tabs (11 max, persona-gated)

URLs are kept under `/services/trading/*` historically; not renamed.

| ID                 | Label                | Route                                           | Entitlements                           |
| ------------------ | -------------------- | ----------------------------------------------- | -------------------------------------- |
| `research`         | Research             | `/services/research/overview`                   | `strategy-full` OR `ml-full`           |
| `promote`          | Promote              | `/services/promote/pipeline`                    | `strategy-full` OR `ml-full`           |
| `strategy-config`  | Strategy Config      | `/services/trading/strategies/[slot]/config`    | `strategy-full` **AND** `ml-full`      |
| `execution-config` | Execution Config     | `/services/trading/deployment`                  | `strategy-full`                        |
| `terminal`         | Terminal             | `/services/trading/terminal`                    | `execution-basic` OR `execution-full`  |
| `signal-intake`    | Signal Intake        | `/services/signals/dashboard`                   | `execution-full` (Signals-In) OR admin |
| `observe`          | Observe              | `/services/observe/*`                           | `execution-basic` OR `execution-full`  |
| `deployment`       | Deployment           | `/services/trading/deployment`                  | admin OR `strategy-full`               |
| `reports-sub`      | Reports (embedded)   | `/services/reports/overview?embedded=1`         | `reporting`                            |
| `catalogue-truth`  | Catalogue Truthiness | `/services/strategy-catalogue/admin/truthiness` | admin only                             |

Gating rules:

1. **Strategy Config requires BOTH** `strategy-full` AND `ml-full`. Signals-In never sees it.
2. **Terminal** — primary surface is Analytics + Reconciliation (read-only). Manual Execution collapsed-by-default with amber "Emergency only — audit-logged" banner.
3. **Signal Intake** — DART Signals-In + admin only.
4. **Data / features pages** — read-only for all non-admin (user directive: "they're not configuring; that's given to them").
5. **Observe** — read-only for Reg Umbrella personas.

### 5.3 Per-persona DART matrix (excerpt)

| Persona                                    | Research | Promote | Strategy Config | Execution Config | Terminal                 | Signal Intake | Observe       | Deployment | Reports-sub | Catalogue Truth |
| ------------------------------------------ | -------- | ------- | --------------- | ---------------- | ------------------------ | ------------- | ------------- | ---------- | ----------- | --------------- |
| admin                                      | ✓        | ✓       | ✓               | ✓                | ✓                        | ✓             | ✓             | ✓          | ✓           | ✓               |
| client-full (DART Full)                    | ✓        | ✓       | ✓               | ✓                | ✓                        | –             | ✓             | ✓          | ✓           | –               |
| desmond-signals-in / prospect-signals-only | –        | –       | –               | –                | ✓ (analytics+recon only) | ✓             | ✓ (read-only) | –          | ✓           | –               |
| client-premium (no ML)                     | –        | –       | –               | 🔒               | ✓                        | –             | ✓             | –          | ✓           | –               |
| elysium-defi                               | –        | –       | –               | –                | ✓ (DeFi only)            | –             | ✓ (DeFi only) | –          | 🔒          | –               |

✓ visible · 🔒 locked-visible · – hidden

### 5.4 Version-bump contract on parameter edit

When a user edits live strategy parameters, a modal **must** enforce one of:

| Action                 | UX                                                            | Audit event                                                |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| Bump version (v5 → v6) | Green CTA. Diff summary.                                      | `STRATEGY_VERSION_BUMPED`                                  |
| Hot-reload in place    | Red-bordered warning; requires typing `I-ACCEPT-PARITY-BREAK` | `STRATEGY_PARAM_AD_HOC_CHANGE` (with persona email + diff) |
| Cancel                 | Neutral                                                       | none                                                       |

This is the only mechanism preserving backtest-to-live parity. Cited in CLAUDE.md ("Batch = Live").

### 5.5 Strategy catalogue (3-tier + envelope browser)

Source: [`architecture-v2/strategy-catalogue-3tier.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/strategy-catalogue-3tier.md). Updated 2026-04-25: catalogue scale is now **~5,000 envelope cells** (full combinatoric universe), not the 99 declared instances or 200–300 expanded set.

| Tier | viewMode         | Surface                                     | Audience                         | Mutations                                                                                                         |
| ---- | ---------------- | ------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1    | `admin-universe` | `/services/admin/strategy-universe`         | admin + IM ops + internal-trader | none — read-only universe                                                                                         |
| 2    | `admin-editor`   | `/services/admin/strategy-lifecycle-editor` | admin + internal-trader          | maturity + product-routing inline edits                                                                           |
| 3a   | `client-reality` | `/services/strategy-catalogue?tab=reality`  | subscribed clients               | none — shows live P&L of subscribed instances                                                                     |
| 3b   | `client-fomo`    | `/services/strategy-catalogue?tab=explore`  | all entitled clients             | allocation-request CTA — gated by product routing + maturity ≥ `paper_stable`                                     |
| —    | EnvelopeBrowser  | `/services/strategy-catalogue/envelope`     | all entitled                     | none — virtualised accordion (category → family → archetype → cell), 4-level cascade, lock badges, bespoke ∞ chip |

**FOMO grid** ([components/strategy-catalogue/FomoTearsheetCard.tsx](../../components/strategy-catalogue/FomoTearsheetCard.tsx)) now renders **all** instances with per-card lock badges (green Subscribed / green Available / amber Reports-only / zinc Locked). Locked cards: opacity-60 + "Contact us to unlock" CTA → `/contact?service=dart-full&action=unlock&instance=…`.

**Admin lock-state** at `/services/strategy-catalogue/admin/lock-state` is wrapped in `AdminOnlyGate`; non-admin personas hitting the URL directly see "Admin only" + upgrade-elsewhere CTAs. The "Admin · Lock state" sub-tab requires `admin` entitlement and renders as locked-chip otherwise.

### 5.6 PerformanceOverlay (continuous backtest → paper → live)

Three render modes: `overlay` (3 series, alpha-decay diagnosis) · `stitched` (one continuous line for FOMO tearsheets) · `split` (3 stacked sub-charts for allocator). API: `GET /api/v1/strategy-instances/{instance_id}/performance?views=backtest,paper,live&from=30d&to=now`. Source: [`architecture-v2/performance-overlay.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/performance-overlay.md).

### 5.7 Data wiring (UAC → GCS envelope → UI, lifecycle in Firestore)

Updated 2026-04-25 — the static-snapshot model expanded to a GCS-backed envelope.

- **Static reference data** (instances, variants, enums) → `lib/registry/ui-reference-data.json` (regenerated on UAC merge).
- **Full ~5k-cell envelope** + per-cell `availability` + `strategy_instruments` mapping → GCS bucket, served via `app/api/catalogue/envelope/route.ts` (ADC, 5-min cache header). Client accessor: [lib/architecture-v2/envelope-loader.ts](../../lib/architecture-v2/envelope-loader.ts) (in-memory cache). Regenerated by PM `scripts/dev/regen-catalogue.sh` (wraps the three UAC catalogue scripts with `--upload`).
- **Access resolver**: [lib/entitlements/strategy-route.ts](../../lib/entitlements/strategy-route.ts) — `resolveSlotAccess`, `resolveArchetypeAccess`, `canEnterTerminal`, `isVisible`. Reads `persona.assigned_strategies` first (Desmond + Patrick are seeded with real catalogue slot labels), then falls back to entitlement logic. **Returns one of:** `terminal` · `reports-only` · `locked-visible` · `hidden`.
- **Terminology SSOT**: [lib/architecture-v2/terminology.ts](../../lib/architecture-v2/terminology.ts) `TERMS.*` — prevents drift like the "DeFi/DeFi" mis-label. PM source: [`06-coding-standards/terminology-ssot.md`](../../../unified-trading-pm/codex/06-coding-standards/terminology-ssot.md). **`asset_class → asset_group` rename in flight** (Phase 11).
- **Mutable lifecycle state** (`maturity_phase`, `product_routing`) → Firestore `strategy_instance_lifecycle/{instance_id}`, hot-reloaded every 5 min via `LifecycleReloader`. Admin editor is the **only** mutating surface — emits `PhaseTransition` + `STRATEGY_LIFECYCLE_CHANGED`.
- **Strategy-eval drafts** → Firestore `strategy_evaluation_drafts/{sha256(email)}`, debounced 1.5s save via `/api/strategy-evaluation/save-draft`. Cross-device resume via `?draft=email` query param (server-component bakes prior payload into initial render — no client fetch).

---

## 6. Information architecture (top-level)

Source: [`14-playbooks/information-architecture.md`](../../../unified-trading-pm/codex/14-playbooks/information-architecture.md), [`14-playbooks/implementation-mapping/route-mapping.md`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/route-mapping.md).

```
Public         /, /investment-management, /platform, /regulatory, /firm, /contact, /demo, /docs, /login, /signup
Briefings      /briefings/{investment-management, platform, regulatory}     (light-auth)
Platform       /dashboard
               /services/{data, research, strategy-catalogue, ml-model-catalogue,
                          execution-algo-catalogue, trading, execution, promote,
                          observe, reports, manage}
               /investor-relations/*
               /settings/*, /onboarding
Ops            /admin/*, /ops/*, /config, /devops, /approvals, /engagement, /internal, /health
```

Four catalogues (parallel surfaces):

1. **Strategy Catalogue** — `/services/strategy-catalogue/*` — **shipped Phase 10 (2026-04-19)**.
2. Data Catalogue — `/services/data/*` — exists; needs catalogue-pattern unification (roadmap).
3. ML Model Catalogue — `/services/research/ml/*` — exists; needs unification.
4. Execution Algo Catalogue — `/services/execution/*` — exists as orphans; needs unification.

**Reports is a SHARED surface** — one `/services/reports/*` for IM, Reg Umbrella, and DART, audience-filtered.

---

## 7. Concrete UI implications (audit checklist seeds)

For each item below: ✅ verified · ❌ missing · ⚠ partial · ❓ unaudited (this audit's starting state).

### 7.1 Terminal (`/services/trading/terminal`)

- ❓ Family/Archetype picker at top, scoping all child views and persisting to localStorage.
- ❓ Picker filtered by persona entitlements + product routing (admin sees all 8×18; signals-in sees Signals-In subset; IM sees `im_only|both`).
- ❓ Deep-link support: `?family=CARRY_AND_YIELD&archetype=CARRY_BASIS_PERP`.
- ❓ Primary surface = Analytics + Reconciliation (read-only).
- ❓ Amber "Emergency only — audit-logged" banner above Manual Execution.
- ❓ Manual Execution collapsed by default.
- ❓ Reality / Paper / Live tabs with P&L from correct source (client fills · `odum-paper` series · `odum-live` series).

### 7.2 Strategy Config (`/services/trading/strategies/[slot]/config`)

- ❓ Hidden when persona lacks BOTH `strategy-full` AND `ml-full`.
- ❓ Initial render = read-only.
- ❓ Edit → modal with three actions (Bump version · Hot-reload with `I-ACCEPT-PARITY-BREAK` · Cancel).
- ❓ Audit event emitted (`STRATEGY_VERSION_BUMPED` or `STRATEGY_PARAM_AD_HOC_CHANGE`).

### 7.3 Strategy Catalogue (Reality / Explore / Envelope)

- ❓ Reality tab shows only subscribed instances (lock-state invisible to client).
- ⚠ Explore/FOMO now renders **all** instances with per-card lock badges (post-2026-04-25). Verify `paper_stable+` gating on allocation CTA + BL-1..BL-10 hiding still hold.
- ❓ Allocation CTA only appears on `paper_stable+` instances.
- ❓ FOMO tearsheets pull from `odum-paper`/`odum-live`, never from real client data.
- ❓ Slot label rendering uses canonical `ARCHETYPE@venue-asset-instrument-period-quote-env` form (and pretty-printer where applicable).
- ❓ EnvelopeBrowser (5k cells, virtualised) renders 4-level cascade and lock badges correctly per persona; bespoke ∞ chip on bespoke-capable archetypes.
- ✅ Admin lock-state page wraps `AdminOnlyGate` (UI commit `fc2b15af`). Verify in browser anyway with non-admin persona.

### 7.4 Persona/entitlement enforcement

- ⚠ Single `visible(user, item)` predicate — partially consolidated 2026-04-25 in [lib/entitlements/strategy-route.ts](../../lib/entitlements/strategy-route.ts). Verify catalogue, FOMO, terminal-instrument-scoping, and admin-gating all route through it (no parallel paths).
- ❓ Service-family pre-check (`check_service_family_scope`) runs before generic visibility gate.
- ❓ `LOCKED-VISIBLE` vs `HIDDEN-ENTIRELY` distinction respected per-surface (rule 06).
- ❓ DemoPlanToggle pairs (`desmond-dart-full ↔ desmond-signals-in`, `elysium-defi ↔ elysium-defi-full`) re-render nav + sub-tab matrix without page reload.
- ✅ Persona-shape registration gate test passes for all 14 personas (UI commit `f0fa1d46`). Re-run on each persona add.
- ✅ Prod-login UAT redirect covers all demo persona emails (UI commit `0c8547a8`). Verify Desmond's gmail still routes to `/dashboard` not `/investor-relations`.

### 7.5 Forbidden surfaces in client views

- ❓ No internal cost columns.
- ❓ No Tier A/B numbers.
- ❓ No other-client data (positions, instructions, reporting).
- ❓ No `CODE_NOT_WRITTEN` / `CODE_WRITTEN` maturity rows.
- ❓ No `IM_RESERVED` rows for non-IM personas (other than IM-desk read-only).
- ❓ No `CLIENT_EXCLUSIVE` rows for other clients.
- ❓ Hard blocks (BL-1..BL-10) hidden regardless of questionnaire answers.

### 7.6 Cross-cutting

- ❓ Catalogue Truthiness page (admin-only) reconciles UAC ↔ live strategy-service registry via `/api/v1/registry/{archetypes,ml-models,features}` with `X-Admin-Token`.
- ❓ Reports surface is one component tree, audience-filtered (no `im-*`, `dart-*`, `reg-*` forks).
- ❓ Paper trading look-and-feel = live (rule 03e).
- ❓ Manual Execution audit events flow to UTL.

---

## 8. Known open gaps from the codex (not our audit's job to fix, but to be aware of)

- ~~`prospect-reg`, `prospect-dart` (signals/full split)~~ — **shipped 2026-04-25** (`prospect-dart-full` + `prospect-dart-signals-in` + `prospect-perp-funding`). Still TBD: `investor`, `advisor`, `internal-trader`.
- Visibility-slicing function is partially consolidated 2026-04-25 (`lib/entitlements/strategy-route.ts`); call-site sweep still pending.
- ML Model Catalogue, Execution Algo Catalogue, Data Catalogue — surface-pattern unification pending.
- 12 UAC additions (`uac-registry-gaps.md`) shipping in parallel waves; #1, #2, #7 in PR-A.
- BL-10 dated-future auto-roll = manual rolls only until Phase 11.
- 177 routes audited 2026-04-20; ~40% are orphan or partial-archive candidates.
- `asset_class → asset_group` rename in flight (Phase 11) — watch for half-renamed call sites during audit.

---

## 10. Instruments + Watchlist audit findings (2026-04-25)

> Gathered in this session. SSOT for the terminal watchlist instruments implementation decisions.

### 10.1 GCS bucket architecture (confirmed)

Five write buckets, one per asset class, all written daily by `instruments-service`:

| Category   | Bucket                                      | Path shape                                                                            |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| CeFi       | `instruments-store-cefi-{project_id}`       | `instrument_availability/by_date/day={date}/venue={venue}/instruments.parquet`        |
| TradFi     | `instruments-store-tradfi-{project_id}`     | same                                                                                  |
| DeFi       | `instruments-store-defi-{project_id}`       | same                                                                                  |
| Sports     | `instruments-store-sports-{project_id}`     | **different**: `sports_reference/by_date/day={date}/entity={entity}/{entity}.parquet` |
| Prediction | `instruments-store-prediction-{project_id}` | `instrument_availability/by_date/day={date}/instruments.parquet` (no venue level)     |

Sports uses a completely different path — `sports_reference/`, not `instrument_availability/`. Any uniform read across categories must dispatch on category at path level. This caused a prod incident before; documented in `codex/02-data/per-category-bucket-layouts.md`.

The UI **never touches GCS directly**. All instrument data comes through `GET /instruments/registry` or `GET /instruments/list` on `unified-trading-api`, which proxies GCS. The 5-bucket split is a backend storage concern.

### 10.2 Backend API (confirmed, all 3 endpoints live)

| Endpoint                     | Filters                                                      | Notes                                                |
| ---------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `GET /instruments/list`      | `venue`, `asset_group`, `page`, `page_size`                  | `additionalProperties: true` response (loose schema) |
| `GET /instruments/catalogue` | none                                                         | Full metadata per instrument                         |
| `GET /instruments/registry`  | `venue`, `category`, `instrument_type`, `status`, pagination | Richer filter surface; prefer this for watchlist     |

`CanonicalInstrument` (UAC) key fields for the watchlist: `instrument_key` (format `VENUE:TYPE:SYMBOL`), `venue`, `instrument_type`, `symbol`, `base_asset`, `quote_asset`, `asset_class`, `available_from_datetime`, `available_to_datetime`, `tick_size`.

### 10.3 Current terminal watchlist data flow (updated 2026-04-25)

```
useTerminalPageData (use-terminal-page-data.ts:107)
  ├── useInstruments()          → GET /api/instruments/list   (base instrument list)
  ├── useTickers()              → GET /api/market-data/tickers (prices)
  └── DEFAULT_INSTRUMENTS       → 5 hardcoded CeFi instruments (mock mode + live fallback)

instruments memo (lines 121-184):
  isMockDataMode() = true  → DEFAULT_INSTRUMENTS copies (hardcoded prices)
  isMockDataMode() = false → maps instArr from useInstruments() + tickers, falls back to DEFAULT_INSTRUMENTS

useStrategyScopedInstruments(linkedStrategyId ?? "manual", instruments, (inst) => inst.instrumentKey)
  → scopedInstruments (readonly)

watchlistInstruments memo:
  linkedStrategyId = null → scopedInstruments.filter(i => i.category === "CeFi")
  linkedStrategyId set    → scopedInstruments (strategy-scoped)

instrumentsByCategory (grouped by watchlistInstruments[n].category)
→ TerminalDataContext.instruments = [...watchlistInstruments]
→ TerminalWatchlistWidget
→ WatchlistPanel (category tabs + symbol rows)
```

### 10.4 Phase 10 status (updated 2026-04-25)

| Task                                                                          | Owner            | Status      | Notes                                                                                                                              |
| ----------------------------------------------------------------------------- | ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| P10.1.1 — Real parquet resolver in `enumerate_strategy_instruments.py`        | Teammate (UAC)   | **Open**    | Replaces stub; reads `instruments-store-*` buckets                                                                                 |
| P10.1.2 — Per-category bucket auth + retry                                    | Teammate (UAC)   | **Open**    | Needed for P10.1.1                                                                                                                 |
| P10.1.3 — Cloud Scheduler nightly cron                                        | Teammate (infra) | **Open**    | Blocker for P10.6                                                                                                                  |
| P10.2.1 — Client accessor for `strategy_instruments.json`                     | Us               | **Done**    | Shipped as `envelope-loader.ts` (superset of planned `strategy-instruments.ts`)                                                    |
| P10.3.1 — 4-level filter cascade in `StrategyCatalogueSurface`                | Us               | **Done**    | Commit `0be7b2bc`                                                                                                                  |
| P10.3.2 — Fix "DeFi/DeFi" mis-label in family chip                            | Us               | **Done**    | `EnvelopeBrowser.tsx` line 408 now calls `formatFamily(row.family)`. 2026-04-26.                                                   |
| P10.4.1 — Terminal watchlist instrument scoping                               | Us               | **Done**    | Implemented 2026-04-25: `useStrategyScopedInstruments` wired into `use-terminal-page-data.ts` with CeFi-only default               |
| P10.5.1 — Category dropdown in IM reporting (perf/trades/portfolio-analytics) | Us               | **Done**    | Cascade already existed. Fixed label formatting (`CATEGORY_LABELS`, `formatFamily`, `formatArchetype`) in all 3 pages. 2026-04-26. |
| P10.6.1–6.4 — Demo personas → instrument lists via `instrumentsForSlot`       | Us               | **Blocked** | Blocked on P10.1.3 (no real keys in stub resolver yet)                                                                             |
| P10.7.1 — `instruments-resolver-architecture.md` codex doc                    | Teammate         | **Done**    | Commit `20c4532` — canonical SSOT for strategy→instruments join                                                                    |
| P10.7.2 — Update `strategy-catalogue-3tier.md` with 4-level filter            | Teammate         | **Open**    | Doc update only                                                                                                                    |

**All UI-side Phase 10 tasks complete.** Only P10.6.x remains and is blocked on teammate's P10.1.x.
**What is blocked:** P10.6.x (waiting on teammate's P10.1.x — real parquet resolver + Cloud Scheduler).
**Do NOT start:** the instruments finder page wiring (Data service `/services/data/instruments`) — that is a separate track from our own audit, not part of Phase 10 at all.

### 10.5 Decisions locked (2026-04-25)

All decisions below were aligned on 2026-04-25 and implemented. Do not revisit unless circumstances change.

| #   | Decision                                            | Outcome                                                                                                |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| D1  | Base instrument list source for terminal watchlist  | `useInstruments()` API (already called at line 115). Mock mode stays on `DEFAULT_INSTRUMENTS`.         |
| D2  | Identifier field for `useStrategyScopedInstruments` | Custom: `(inst) => inst.instrumentKey`. Implemented.                                                   |
| D3  | No-strategy default (strategyId = null)             | CeFi-only filter on `watchlistInstruments` memo. Implemented.                                          |
| D4  | Live prices for all watchlist rows                  | Real mode only — tickers merged in existing `instruments` memo path. Mock mode keeps hardcoded prices. |
| D5  | Category tab model                                  | Keep `instrumentsByCategory` tab model unchanged.                                                      |

### 10.6 Remaining open items (as of 2026-04-26)

**Blocked on teammate (P10.1.x):**

| Item    | What                                                              | Blocker                                            |
| ------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| P10.6.1 | Extend `Persona` interface: `assigned_strategies: string[]`       | Can write the type, but no real keys until P10.1.3 |
| P10.6.2 | Seed Desmond DART-Full with assigned strategy slots               | P10.1.3                                            |
| P10.6.3 | Seed Patrick (Elysium) base with assigned strategy slots          | P10.1.3                                            |
| P10.6.4 | `demo-provider.ts` calls `instrumentsForSlot` per persona at boot | P10.1.3                                            |

**Separate track (not Phase 10):**

| Item                                   | What                                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instruments finder page wiring (G1–G7) | Data service `/services/data/instruments` — adapter function, hook wiring, pagination. Tracked in `unified-trading-pm/plans/ai/audit_instruments_gcs_2026_04_25.md`. Start when explicitly prioritised. |

### 10.7 Known non-issues (do NOT fix)

- `DataCategory` vs backend `category` param mismatch (`prediction_market` → `prediction`, `onchain_perps` has no backend category) — relevant for the Data service instruments page, NOT for the terminal watchlist. Terminal uses `useInstruments()` unfiltered.
- Static snapshot sports = 0 — irrelevant for the terminal which uses the live API.
- `InstrumentEntry` (data-service.ts) schema drift — that type is for the Data service instruments finder, not terminal.

---

## 9. How to use this doc

1. Start the audit at the **Terminal** sub-tab (§ 7.1) since that's the user's chosen entry point.
2. For each ❓ item: read the cited code, verify in browser per CLAUDE.md runtime rule, then flip to ✅/❌/⚠ with one-line note.
3. Append every ask the user raises during the audit as a checkbox row in [live-review-findings.md](./live-review-findings.md) (per memory rule).
4. When in doubt about model intent, re-open the cited codex doc — do not invent.
