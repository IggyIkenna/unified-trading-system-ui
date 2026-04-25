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

### 3.3 The 8 personas (`14-playbooks/demo-ops/profiles/*.yaml`)

| Persona               | Tile pattern                                                                                               | Notable                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `admin`               | all unlocked                                                                                               | short-circuits access_control                                                                       |
| `anon`                | all hidden                                                                                                 | public marketing only                                                                               |
| `client-full`         | data, research, promote, trading, observe, reports unlocked; investor-relations + admin hidden             | flavour `turbo` hides reporting, `deep_dive` unlocks all                                            |
| `prospect-dart`       | data, research, trading, observe, reports unlocked; promote padlocked (upsell tease)                       | flavour `broader_platform` unlocks promote                                                          |
| `desmond-dart-full`   | full DART entitlements + investor-relations                                                                | paired with `desmond-signals-in` via DemoPlanToggle (launched 2026-04-24); pre-seeded questionnaire |
| `desmond-signals-in`  | research/promote tiles render but redirect to `/services/dart/locked?from=…`; no `strategy-full`/`ml-full` | upgrade walkthrough: "N/M strategies available — X more unlock with DART Full"                      |
| `prospect-im`         | reports + investor-relations unlocked; data padlocked; rest hidden                                         | turbo demo typical                                                                                  |
| `prospect-regulatory` | reports unlocked; data/trading/observe padlocked; research/promote/investor-relations hidden               | deep-dive may unlock trading+observe to surface handoff                                             |

**Planned but not yet instantiated:** `prospect-reg`, `investor`, `advisor`, `internal-trader`. Source: [`14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md).

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

### 5.5 Strategy catalogue (3-tier, one component, four `viewMode` props)

Source: [`architecture-v2/strategy-catalogue-3tier.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/strategy-catalogue-3tier.md).

| Tier | viewMode         | Surface                                     | Audience                         | Mutations                                                                     |
| ---- | ---------------- | ------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| 1    | `admin-universe` | `/services/admin/strategy-universe`         | admin + IM ops + internal-trader | none (read-only ~200–300 rows)                                                |
| 2    | `admin-editor`   | `/services/admin/strategy-lifecycle-editor` | admin + internal-trader          | maturity + product-routing inline edits                                       |
| 3a   | `client-reality` | `/services/strategy-catalogue?tab=reality`  | subscribed clients               | none — shows live P&L of subscribed instances                                 |
| 3b   | `client-fomo`    | `/services/strategy-catalogue?tab=explore`  | all entitled clients             | allocation-request CTA — gated by product routing + maturity ≥ `paper_stable` |

### 5.6 PerformanceOverlay (continuous backtest → paper → live)

Three render modes: `overlay` (3 series, alpha-decay diagnosis) · `stitched` (one continuous line for FOMO tearsheets) · `split` (3 stacked sub-charts for allocator). API: `GET /api/v1/strategy-instances/{instance_id}/performance?views=backtest,paper,live&from=30d&to=now`. Source: [`architecture-v2/performance-overlay.md`](../../../unified-trading-pm/codex/09-strategy/architecture-v2/performance-overlay.md).

### 5.7 Data wiring (UAC → UI snapshot, lifecycle in Firestore)

- Static reference data (instances, variants, enums, ~200–300 entries) → `lib/registry/ui-reference-data.json` (regenerated on UAC merge).
- Mutable lifecycle state (`maturity_phase`, `product_routing`) → Firestore `strategy_instance_lifecycle/{instance_id}`, hot-reloaded every 5 min via `LifecycleReloader`.
- Admin editor is the **only** mutating surface — emits `PhaseTransition` + `STRATEGY_LIFECYCLE_CHANGED`.

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

### 7.3 Strategy Catalogue (Reality / Explore)

- ❓ Reality tab shows only subscribed instances (lock-state invisible to client).
- ❓ Explore tab filters by `product_routing ⊇ persona.tier` AND `maturity ≥ paper_stable` AND not in `BL-1..BL-10`.
- ❓ Allocation CTA only appears on `paper_stable+` instances.
- ❓ FOMO tearsheets pull from `odum-paper`/`odum-live`, never from real client data.
- ❓ Slot label rendering uses canonical `ARCHETYPE@venue-asset-instrument-period-quote-env` form.

### 7.4 Persona/entitlement enforcement

- ❓ Single `visible(user, item)` predicate (currently fragmented; consolidation pending Phase 10.6+).
- ❓ Service-family pre-check (`check_service_family_scope`) runs before generic visibility gate.
- ❓ `LOCKED-VISIBLE` vs `HIDDEN-ENTIRELY` distinction respected per-surface (rule 06).
- ❓ DemoPlanToggle (`desmond-dart-full` ↔ `desmond-signals-in`) re-renders nav + sub-tab matrix without page reload.

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

- `prospect-reg`, `prospect-dart` (signals/full split), `investor`, `advisor`, `internal-trader` personas — TBD.
- Visibility-slicing function is fragmented across 3 files; unification tracked Phase 10.6+.
- ML Model Catalogue, Execution Algo Catalogue, Data Catalogue — surface-pattern unification pending.
- 12 UAC additions (`uac-registry-gaps.md`) shipping in parallel waves; #1, #2, #7 in PR-A.
- BL-10 dated-future auto-roll = manual rolls only until Phase 11.
- 177 routes audited 2026-04-20; ~40% are orphan or partial-archive candidates.

---

## 9. How to use this doc

1. Start the audit at the **Terminal** sub-tab (§ 7.1) since that's the user's chosen entry point.
2. For each ❓ item: read the cited code, verify in browser per CLAUDE.md runtime rule, then flip to ✅/❌/⚠ with one-line note.
3. Append every ask the user raises during the audit as a checkbox row in [live-review-findings.md](./live-review-findings.md) (per memory rule).
4. When in doubt about model intent, re-open the cited codex doc — do not invent.
