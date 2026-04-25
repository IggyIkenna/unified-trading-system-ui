---
title: "Widget certification — deferred questions for teammate review"
status: deferred-awaiting-teammate-review
scope: BP-3 DeFi widget audit, open questions requiring teammate input
last_updated: 2026-04-20
---

# Widget Certification — Deferred Questions for Teammate Review

Questions parked during the BP-3 DeFi widget audit that need teammate input before they can be resolved. Parent: [widget-certification-tracker.md](./widget-certification-tracker.md) §6 (open questions).

Each section below is a self-contained question with problem statement, options, tradeoffs, and what would tip the decision. When a question is resolved, update the parent tracker §6 and leave the resolution summary at the bottom of the section here.

---

## Q6 — Composite workflow placement

**Status:** deferred pending teammate input. Parent: [tracker §6 Theme C](./widget-certification-tracker.md#6-open-questions-rolled-up).

### 1. The problem

Four DeFi archetypes require **multi-leg execution** that today has no single review-and-submit surface. Operators hop between primitive widgets and reconcile state mentally.

| Archetype              | Leg chain                                                                          | Atomicity                                              |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| YIELD_ROTATION_LENDING | WITHDRAW (source venue) → BRIDGE (source chain → dest chain) → SUPPLY (dest venue) | sequential, non-atomic                                 |
| CARRY_STAKED_BASIS     | STAKE (ETH → LST) → PLEDGE + BORROW (LST on Aave → stable) → SHORT (perp leg)      | sequential, non-atomic                                 |
| CARRY_RECURSIVE_STAKED | SUPPLY LST → BORROW stable → SWAP stable → LST × N loops                           | sequential per loop; per-loop HF projection required   |
| LIQUIDATION_CAPTURE    | Flash-borrow → repay-debt → claim-collateral → swap collateral → repay flash       | **atomic flash-bundle** (all legs in one tx or revert) |

Today each primitive widget (`defi-swap`, `defi-transfer`, `defi-lending`, `defi-staking`, `defi-flash-loans`) maps 1:1 to a single on-chain tx. The operator manually chains them.

### 2. What needs to exist (agreed)

Regardless of approach, the UI must surface:

- **Review-across-legs** — a single dialog previewing all legs before any signature.
- **Cost projection** — gas per leg + bridge fees + slippage per leg, summed; payback period for rotation, net-profit for liquidation, HF projection for recursive.
- **Cross-leg constraints** — bridge-in-flight state for YRL, per-loop HF math for CRS, atomic-or-revert for LIQ, hedge-leg timing for CSB.
- **Instance-tagged events** — every leg emits with the same `strategy_id` so the tracker can reconcile a workflow's legs as one unit.

### 3. Options

#### (a) Dedicated composite widgets

New widgets — one per archetype — whose sole job is multi-leg orchestration:

- `defi-rotation-workflow-widget` (YRL)
- `CarryStakedBasisWorkflowWidget` (CSB)
- `defi-recursive-loop-builder` (CRS)
- `defi-liquidation-execute-widget` (LIQ)

Each composite uses the **same backend services** primitive widgets use, but wraps them in a workflow surface. Primitives remain single-leg. Composites live alongside primitives in the registry.

**Pros:**

- Primitives stay primitive — they don't grow awareness of sibling legs.
- Atomic bundles (LIQ flash-loan) have no sensible decomposition; this is their natural home.
- Cross-leg projection (CRS per-loop HF, YRL net-APY-after-fees) lives in one surface.
- Operator mental model matches widget naming ("executing a rotation" → `rotation-workflow`).
- Each composite's UX can diverge from the others without contaminating primitives.

**Cons:**

- 4 new widgets to design + build (P0–P1 priority; already listed in tracker §4).
- Duplication risk — composites may re-implement UI patterns from primitives unless a shared leg-row sub-component is extracted.
- More widgets to register, certify, and document.

#### (b) Auto-compose on primitives

No new widgets. Existing primitives grow an **auto-orchestrate** mode:

- `defi-lending-widget` detects "supply target is on a different chain/venue than current holdings" and silently orchestrates WITHDRAW + BRIDGE + SUPPLY.
- `defi-swap-widget` can pre-step with a BRIDGE if source asset is on a different chain.
- `defi-flash-loans-widget` becomes the host for LIQ's atomic bundle (already sort-of is, today).

**Pros:**

- Fewer widgets in the registry.
- Operator doesn't context-switch between primitive and composite widgets for the same archetype.
- If auto-compose is optional (opt-in toggle), manual single-leg use still works.

**Cons:**

- Primitives stop being primitive. `defi-lending-widget` now knows about bridges. `defi-swap-widget` knows about cross-chain. Separation of concerns erodes.
- LIQ's atomic flash-bundle doesn't decompose into primitive legs cleanly — `defi-flash-loans-widget` already carries multi-leg semantics today, and this approach doubles down on that (potentially fine, potentially a sign the widget should be promoted to a composite).
- CRS's per-loop HF projection has no natural home in a primitive — it's intrinsically a "show me the whole loop chain with projections" view.
- Cross-leg cost summary (gas + bridge + slippage) lives... where? In whichever primitive you happened to open first? That's arbitrary.

#### (c) Hybrid — composites for atomic/projected, auto-compose for sequential

Mix:

- **Composites for:** LIQ (atomic flash-bundle has no decomposition), CRS (per-loop HF projection).
- **Auto-compose for:** YRL (plain sequential withdraw+bridge+supply), CSB (stake+pledge+short, sequential).

**Pros:**

- Minimizes new widget count.
- Uses composites only where they're demonstrably necessary (atomicity / per-leg projection).

**Cons:**

- Inconsistent operator experience — "why does rotation live inside the lending widget but liquidation has its own widget?". Harder to teach + harder to document.
- Decision "is this archetype atomic enough / projected enough to deserve a composite?" is judgment-based and risks drifting over time.
- Cross-leg cost summary problem (from option b) still applies to YRL and CSB.

#### (d) Open — teammate may propose alternative

e.g. a **composition layer** that lives between primitives and the page: a per-archetype "workflow descriptor" that composes primitives declaratively and renders a review pane, without any of the primitives themselves being modified. Would need design.

### 4. Recommendation (from main agent, not a decision)

Lean: **(a) dedicated composite widgets**, because:

- LIQ atomic bundle is non-negotiable — it has to be a composite.
- CRS per-loop HF projection needs a single-surface review; bolting that onto `defi-lending-widget` bloats the primitive.
- YRL and CSB don't obviously _require_ composites, but having them (for consistency with LIQ and CRS) keeps the operator mental model uniform across archetypes.
- Primitives stay minimal and easy to test/certify.

Counter-lean: **(b) auto-compose** is lighter if the team is willing to treat `defi-flash-loans-widget` and `defi-lending-widget` as already-composite widgets under the hood, and accept some primitive bloat in exchange for fewer registry entries.

### 5. What would tip the decision

- **If atomic flash-bundles need to be heavily extended in BP-4** (e.g. arbitrage-assisted liquidations, multi-collateral liquidations): (a) wins — LIQ needs its own home.
- **If we anticipate many more chain-pair rotations in BP-4** (e.g. Solana, Hyperliquid): (b) may win — auto-compose scales with new chains without new widgets.
- **If consistency across archetypes matters more than widget count**: (a) wins.
- **If registry count matters more than per-widget clarity**: (b) or (c) wins.

### 6. Ask for teammate

Please:

- Pick (a), (b), (c), or (d-propose-your-own).
- Flag any architectural concern I've missed (e.g. existing UI patterns in the repo that bias this, team conventions about composite widgets, previous decisions on this topic).
- If (d), describe the shape of the alternative so I can add it here for comparison.

Once a decision lands, update the parent tracker §6 Theme C with the choice and link back here.

---

## Q8 — Attribution model: how does the trade-attribution tuple flow into widgets?

**Status:** deferred pending teammate input. Parent: [tracker §6 Theme D](./widget-certification-tracker.md#6-open-questions-rolled-up).

### Q8.1 The problem

Every trade / order / position must be attributable to a tuple of entities so downstream systems (events, P&L, risk, audit, kill-switch, UI rollups) can roll up correctly. Today that's broken in two layers:

1. **Widgets hardcode attribution.** 6 DeFi execute widgets emit `strategy_id` as a venue-shaped literal (`"AAVE_LENDING"`, `"BASIS_TRADE"`, `"ETHENA_BENCHMARK"`, `"CROSS_CHAIN_SOR"`), and `client_id: "internal-trader"`. Neither reflects the actual active strategy instance or client.
2. **Schema gaps.** The OpenAPI-derived order/position types carry some attribution but not all — `organisation_id`, `account_id`, `wallet_id`, `user_id` are absent. The tracker, P&L, and audit-trail will join on attributes that orders don't carry.

This question has to be resolved before we can fix the hardcoded literals cleanly — otherwise we'd fix `strategy_id` now and come back to add org/account/wallet later.

### Q8.2 Context (non-negotiable facts)

- **Mock data is derived from backend OpenAPI schemas.** UI is under active development against those schemas. Backend is under development, many parts stable. Once UI is look-and-feel + functionally ready, we wire backend. So the shape we commit to in the UI will drive what gets wired.
- **Two reasons the UI exists:** (a) prove end-to-end wiring, (b) support the 0.01% of trades where a human intervenes — reconcile broken state, seize a one-off opportunity, or override automation. When (b) happens, the operator must pin the manual trade to the right org + client + strategy + account so it rolls up correctly.
- **Every trade must tie to multi-entity attribution:** organisation, client, strategy instance, account/wallet, venue, time, user. All monitor widgets (positions, orders, history) must be groupable / filterable by any of these.

### Q8.3a Corrected picture after UI context resync (2026-04-24)

**Finding:** the original Q8.3 table below was based on a UI `context/` snapshot
that was 20 days behind UAC/UIC masters. After resyncing (commit `f6ba0c5`),
several "missing" fields turned out to already exist upstream. Corrected picture:

**Master state of execution schemas (post-resync):**

| Schema                              | `client_id`  | `strategy_id` |                 `account_id`                 | Notes                                                              |
| ----------------------------------- | :----------: | :-----------: | :------------------------------------------: | ------------------------------------------------------------------ |
| `CanonicalOrder`                    |   optional   |   optional    | **optional, composite `client:venue:label`** | `account_id` already encodes `(client, venue, label)` in one field |
| `CanonicalFill`                     |   optional   |   optional    |          optional (same composite)           | same pattern                                                       |
| `FillEventMessage` (UIC pub/sub)    |   optional   |   optional    |                  ❌ missing                  | real gap                                                           |
| `OrderRequestMessage` (UIC pub/sub) | **required** | **required**  |    — (derived via venue_account_registry)    | clean                                                              |
| `ManualInstruction` (UIC)           |   present    |    present    |                 **required**                 | fully tagged for manual trades                                     |

**Reframed minimal primary key (per user alignment):**

The audit landed on this simpler framing for what a trade/order/position
record actually needs:

```
(strategy_id, client_id)                # always required
(account_id)                            # only if client has >1 account on the venue embedded in strategy_id
```

Because `strategy_id` (the slot label `ARCHETYPE@venue-asset-instrument-period-quote-env`)
**encodes venue, asset, instrument, timeframe, share_class, env**, most
derivation happens via lookups rather than redundant fields:

| Want to know                          | How to derive                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| venue, share_class, archetype, family | Parse from `strategy_id` (slot-label grammar)                                     |
| config_hash, config_version           | `ConfigRegistry.get(strategy_id, client_id, at=timestamp)`                        |
| organisation, entity, paper-vs-live   | `CLIENT_REGISTRY.get(client_id).entity` / `.account_type`                         |
| venue_account                         | `venue_account_registry.get(client_id, venue)`, or explicit `account_id` if multi |
| user (operator)                       | `ManualInstruction.submitted_by` (OAuth sub) — only on manual trades              |

**Implication for Q8a:** we do **not** need `organisation_id` as a separate
field on execution records. Organisation is metadata _about_ a client, held
in auth-api for UI display. UI auth session resolves user → org → client
once; every API call just passes `client_id`. This simplifies the schema
ask to backend.

**What's actually still missing (unchanged from Q8):**

- `FillEventMessage.account_id` (real gap in UIC pub/sub)
- `client_id` / `strategy_id` / `account_id` are **optional** (not required)
  on `CanonicalOrder`/`CanonicalFill` — user's call: keep optional for now
- `POST /execution/orders` mock-data generator doesn't persist `client_id` /
  `account_id` onto created records (route bug, fixable independently)

### Q8.3 Current state (found in the repo)

#### Backend-derived schema types

| Type              | File                                                                                                                            | Attribution carried                                                                                                       | Missing                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `MockOrder`       | [lib/api/mock-trade-ledger.ts:8-34](../../lib/api/mock-trade-ledger.ts)                                                         | `strategy_id`, `client_id`, `instrument_id`, `venue` (string), `asset_group`, `lane`, `algo_type`, `correlation_id`       | `organisation_id`, `account_id`, `wallet_id`, `user_id`, `client_order_id` / `idempotency_key`                 |
| `DeFiOrderParams` | [lib/types/defi.ts:474-491](../../lib/types/defi.ts)                                                                            | `strategy_id`, `client_id`, `instrument_id`, `venue`, `asset_group`, `lane`, `algo_type`, `instruction_type`, `is_atomic` | same as above                                                                                                  |
| `MockPosition`    | [lib/api/mock-position-ledger.ts:9-22](../../lib/api/mock-position-ledger.ts)                                                   | `strategy_id` (nullable)                                                                                                  | `organisation_id`, `client_id`, `account_id`, `wallet_id`, `user_id`, `correlation_id`                         |
| `PositionRecord`  | [components/widgets/positions/positions-data-context.tsx:71-107](../../components/widgets/positions/positions-data-context.tsx) | `strategy_id`, `client_name` (display), `account_id` (display), `chain`                                                   | `organisation_id`, proper `client_id` (currently `client_name` is a display string padded at view-model layer) |
| `TradeHistoryRow` | [lib/types/defi.ts:239-261](../../lib/types/defi.ts)                                                                            | `strategy_id?` (optional), `tx_hash?`                                                                                     | `client_id`, `organisation_id`, `account_id`, `user_id`                                                        |

#### Entity hierarchy (already defined)

```text
Organization (id)
  └─ Client (id, orgId)
      └─ Strategy (id, clientId)        ← strategy_id unique within client scope
      └─ Account (id, organizationId, clientId, venueAccountId, ...)
```

Source files:

- `TradingOrganization` — [lib/types/trading.ts:1-5](../../lib/types/trading.ts)
- `TradingClient` — [lib/types/trading.ts:7-13](../../lib/types/trading.ts)
- `TradingAccount` — [lib/mocks/fixtures/trading-data.ts:74-86](../../lib/mocks/fixtures/trading-data.ts)
- `Strategy` — [lib/strategy-registry.ts:191-301](../../lib/strategy-registry.ts)
- `TradingStrategy` — [lib/mocks/fixtures/trading-data.ts:53-68](../../lib/mocks/fixtures/trading-data.ts)

#### Host-context that already exists

`useGlobalScope` at [lib/stores/global-scope-store.ts](../../lib/stores/global-scope-store.ts) — Zustand store:

```typescript
interface GlobalScopeState {
  organizationIds: string[]; // multi-select
  clientIds: string[]; // multi-select
  strategyIds: string[]; // multi-select
  strategyFamilyIds: string[];
  underlyingIds: string[];
  mode: "live" | "batch";
  asOfDatetime?: string;
}
```

- **Multi-select arrays** → used as inclusive filter (OR within a dimension).
- Consumed by all major data contexts for filtering: [components/widgets/defi/defi-data-context.tsx:188](../../components/widgets/defi/defi-data-context.tsx), [components/widgets/accounts/accounts-data-context.tsx:52](../../components/widgets/accounts/accounts-data-context.tsx), [components/widgets/options/options-data-context.tsx:130](../../components/widgets/options/options-data-context.tsx), etc.
- **Not an "active" tuple for submission** — it's a filter store, not a "what am I about to submit as" store.
- `setSelectedAccount()` for single-account selection exists locally in [components/widgets/terminal-data-context.tsx:33](../../components/widgets/terminal-data-context.tsx).

#### Hardcoded widgets (to be fixed once attribution model is decided)

All 6 emit `client_id: "internal-trader"` alongside the broken `strategy_id`. None emit org/account/wallet/user.

| Widget                    | Line       | Hardcoded `strategy_id`                                            | Hardcoded `client_id` |
| ------------------------- | ---------- | ------------------------------------------------------------------ | --------------------- |
| `defi-staking-widget`     | L129       | `"ETHENA_BENCHMARK"`                                               | `"internal-trader"`   |
| `defi-lending-widget`     | L259       | `"AAVE_LENDING"`                                                   | `"internal-trader"`   |
| `defi-swap-widget`        | L348       | `"BASIS_TRADE"` / `"STAKED_BASIS"` / `"AAVE_LENDING"` (mode-based) | `"internal-trader"`   |
| `defi-transfer-widget`    | L220, L387 | `"AAVE_LENDING"`, `"CROSS_CHAIN_SOR"`                              | `"internal-trader"`   |
| `defi-flash-loans-widget` | L232-234   | `"AAVE_LENDING"`                                                   | `"internal-trader"`   |
| `defi-basis-trade-widget` | L90        | `"BASIS_TRADE"`                                                    | `"internal-trader"`   |

### Q8.4 Three sub-questions to resolve

#### Q8a — Backend schema scope: does the order/position shape need to extend before UI wiring?

**Facts:**

- Current orders carry `strategy_id` + `client_id` + `correlation_id`. No `organisation_id`, `account_id`, `wallet_id`, `user_id`, `client_order_id`.
- Current positions carry only `strategy_id` (with `client_name`/`account_id`/`chain` padded at widget-view layer).
- Downstream systems (P&L, risk, audit, kill-switch) expect to key on the full tuple.

**Options:**

- **(a1) Extend schema now.** Add `organisation_id`, `account_id`, `wallet_id?`, `user_id?`, `client_order_id` / `idempotency_key` to `Order`, `Position`, `Fill`, `TradeHistoryRow` in the OpenAPI spec. UI commits to emitting them. Backend team picks them up when wiring.
- **(a2) Leave schema minimal; infer downstream.** `Order` keeps `strategy_id` + `client_id`. Downstream services do `client → orgId` lookup and treat `account_id` as implicit via `(strategy_id, venue) → account` mapping. UI doesn't need to emit org/account.
- **(a3) Additive: schema stays minimal for pub/sub, adds an `attribution_envelope` object** carrying the full tuple. Kept as optional payload; pub/sub + audit read from envelope.

**Recommendation:** (a1). Losing `account_id` and `user_id` means audit can't answer "which operator submitted this, on which account" without joining 3 tables at query time. Better to emit the full tuple once, at submission, than to try to reconstruct it after the fact.

#### Q8b — Active-tuple source in the UI: where does a widget get its defaults?

**Facts:**

- `useGlobalScope` today is a multi-select filter, not a single-active-tuple. `organizationIds[]` and `clientIds[]` can have many values.
- Widgets must submit with a **single** concrete tuple per order.
- Operator may be in one of three modes: (1) drilled into a specific instance via route (e.g. `/trading/clients/acme/instances/yrl-usdc-01`), (2) browsing broadly across clients (filter mode), (3) opening a widget cold with no context.

**Options:**

- **(b1) Route-driven active-tuple.** When the route encodes a specific instance (`.../instances/:strategyId`), a `useActiveAttribution()` hook returns the full tuple (org, client, strategy, account). Widgets read it. When route is broad (`/trading/defi`), hook returns `undefined` and widgets fall through to b2 / b3.
- **(b2) Derive from filter store when unambiguous.** If `useGlobalScope` has exactly one of each dimension selected, treat that as the active tuple. Multi-select → no default, widget must prompt.
- **(b3) Widget-local selectors always.** Every execute widget has `{org, client, strategy, account}` pickers. Operator picks explicitly every time. Guarantees intent, slowest UX.
- **(b4) Combination: route-driven + widget-local override.** Route provides defaults; widget always shows the selectors but pre-fills. Operator can override for unusual cases (manual reconcile of another strategy's position).

**Recommendation:** (b4). Matches how the operator already navigates — route already encodes intent — but keeps the selectors visible so manual trades can override without a navigation detour. Falls back to empty selectors when opened cold.

#### Q8c — Widget-local selector scope on execute widgets

**Facts:**

- The 0.01% manual-trade use case requires operator to pin trades to arbitrary org/client/strategy/account.
- Operator may need to reconcile a position that belongs to a different client than the currently-routed one.
- Display-only widgets (tables, monitors) are a separate question (see §5 below).

**Options:**

- **(c1) Full selector pane on every execute widget.** `{org → client → strategy → account}` cascaded selectors at the top of every execute widget. Pre-filled from b1/b4. Always overridable.
- **(c2) Selector pane only when no route default.** If route-driven active-tuple exists, hide selectors (badge only). Otherwise show them.
- **(c3) Selector pane collapsed by default.** Pre-filled from route; collapsed summary ("Executing as: acme-capital / delta-one / yrl-usdc-01 / acc-aave-1"); operator clicks to expand & override.

**Recommendation:** (c3). Always visible as a summary badge (so operator knows what they're submitting as), click to change. Avoids "did I forget to change the client?" accidents while staying out of the way for the 99.9% default case.

#### Q8d (implicit) — Monitor widgets: which attribution columns are always present?

**Facts:**

- Tables / history / position widgets show rows of trades and positions.
- Operators filter/group/pivot on these columns.

**Options:**

- **(d1) Full attribution always visible** — columns for org, client, strategy, account, venue, time. Default-visible but toggleable.
- **(d2) Minimal default (strategy, venue, time) + opt-in** — operator adds org/client/account columns via a column picker.
- **(d3) Context-sensitive** — when in a specific-client route, hide org/client columns (redundant). When broad, show all.

**Recommendation:** (d3). Noise reduction when context is specific; full detail when broad. Operator never loses information but isn't drowning in redundant columns either.

### Q8.5 Summary of recommendations (not decisions)

| Sub-q | Topic                    | Recommendation                                                  |
| ----- | ------------------------ | --------------------------------------------------------------- |
| Q8a   | Schema extension         | Extend now: add org, account, wallet?, user?, client_order_id   |
| Q8b   | Active-tuple source      | Route-driven defaults + widget-local override                   |
| Q8c   | Execute widget selectors | Collapsed summary badge, expand-to-override                     |
| Q8d   | Monitor widget columns   | Context-sensitive (hide redundant columns when route is narrow) |

### Q8.6 What would tip decisions

- **If backend team resists schema churn** (q8a): go a3 (additive envelope) or a2 (infer downstream) — but accept audit debt.
- **If operator workflow is always "drill into instance then act"** (q8b/c): route-driven with less override affordance (b1 + c2) is fine.
- **If manual reconcile / cross-client trades are common** (q8b/c): always-visible selectors (b4 + c1).
- **If downstream systems already do `client → org` / `(strategy, venue) → account` lookup** (q8a): schema can stay minimal.

### Q8.7 Ask for teammate

Please resolve Q8a–Q8d individually, or propose an alternative framing. Specifically:

- **Q8a:** confirm or adjust the proposed schema extension list. If extending, we also need to agree on mandatory vs optional for each field (e.g. is `user_id` mandatory? `wallet_id` only for DeFi orders?).
- **Q8b:** is the route-driven active-tuple pattern acceptable, or do we have a preferred way to express "active attribution" in this codebase that I haven't found?
- **Q8c:** summary-badge vs full-selector-pane vs minimum-viable — is there existing UX precedent in other trading surfaces in this repo that should be matched?
- **Q8d:** is context-sensitive columns OK, or should we pick one default that's always-on?

Once decisions land, update parent tracker §6 Theme D with the choices, and link back here. The fix for the 6 hardcoded widgets depends on these answers.

---

## Codex / architecture updates proposed (from audit)

These surfaced during the per-archetype widget audits. Mostly minor edits to `architecture-v2/archetypes/*.md`, but two (§CBP.b and §CSB.b) require archetype-taxonomy decisions from the backend / architecture owner — those decisions don't affect which widgets exist, but they do affect how the operator configures instances and how the archetype registry is shaped.

### `architecture-v2/archetypes/yield-staking-simple.md`

- Add `reward_model: rebase | exchange_rate` column to the Supported venues table.
- Add explicit default to Risk profile: `depeg kill switch default = 100 bps (1%)`.

### `architecture-v2/archetypes/yield-rotation-lending.md`

- Call out Chainlink oracle divergence as an explicit kill-switch (tiered 1-2% warn / 2-3% reduce / >3% exit).
- Non-scope note: "Leveraged variants (supply-collateral → borrow stable → re-supply) from legacy `btc-lending-yield` and `sol-lending-yield` are `CARRY_RECURSIVE_STAKED`, not this archetype."

### `architecture-v2/archetypes/carry-basis-perp.md`

- **§CBP.a** Document that `FUNDING_RATE_FLOOR` is an instance-level knob (`target_funding_rate_bps`), not a global default.
- **§CBP.b — decision required (was Q10)** "WBTC + Aave + perp-short" variant placement — does it stay in CBP or migrate to CSB? Currently ambiguous in codex + MIGRATION.md. _Impact on UI: zero — the legs (supply WBTC on Aave, short perp) already map to existing widgets. Placement affects archetype registry, config schema, and how operator picks the instance-creation template, not widget count._

### `architecture-v2/archetypes/carry-staked-basis.md`

- **§CSB.a** Add `use_aave_collateral: bool` to §Config schema — differentiates 2-leg (legacy) vs 3-leg (v2) variant.
- **§CSB.b — decision required (was Q9)** One archetype with `use_aave_collateral` flag, or split into `CARRY_STAKED_BASIS` (2-leg) + `CARRY_STAKED_BASIS_LEVERAGED` (3-leg)? _Impact on UI: zero — both variants compose the same primitive actions (stake, pledge, borrow, short) and the operator chooses leg count at instance-config time. Choice affects archetype registry size + risk-engine branching, not widget catalog._

### `architecture-v2/archetypes/liquidation-capture.md`

- Add explicit MEV-policy-per-chain table.
- Surface `max_health_factor` (exists in engine at `liquidation_capture.py:95`, missing from §Config schema).
- Document `HOLD_LEG_AND_ALERT` stranded-collateral semantics.
- Reclassify `liquidation_capture_eth.yaml` — it's a cascade-dip-buy, not the flash-loan loop (naming collision).

### `architecture-v2/archetypes/carry-basis-dated.md`

- **Decision required — does CBD belong in the archetype registry at all?** Main-agent flagged to user: CBD is in `DEFI_STRATEGY_FAMILIES` and has a codex doc, but (a) no backend pipeline work exists for it, (b) user was unaware of CBD's existence before this audit, (c) no stakeholder has been identified who is running or planning to run dated-basis carry on Deribit/CME. Possible outcomes:
  - **Remove** from `DEFI_STRATEGY_FAMILIES` and archive the codex doc — if no one owns it, it shouldn't be in the catalog.
  - **Keep as reserved-for-future** — leave codex doc and registry entry, but label explicitly `speculative — no active owner`.
  - **Reactivate** — if a teammate actually does plan CBD work, declare "IBKR ↔ CME cross-venue routing policy" and put on BP-4 roadmap.
- Widget-cert impact: no fixture, no widget, no codex edits until the above is resolved. Tracker status stays `⏸️ parked`.

### `architecture-v2/archetypes/amm-lp-provision.md` (NEW — archetype missing from codex)

- **Decision required — add AMM_LP_PROVISION to `DEFI_STRATEGY_FAMILIES` and draft an archetype doc, or remove the widgets?** The mirror-image of the CBD problem: CBD has a codex entry with no UI, ALP has UI with no codex entry.
- **Evidence the archetype is shipped in the UI:**
  - [`components/widgets/defi/defi-liquidity-widget.tsx`](../../components/widgets/defi/defi-liquidity-widget.tsx): execution surface for concentrated liquidity (Uniswap V3-style). Operations: `ADD_LIQUIDITY` / `REMOVE_LIQUIDITY`. Emits `strategy_id: "AMM_LP"`, `algo_type: "AMM_CONCENTRATED"` at L160. Per-pool price range + fee tier selector (DEFI_FEE_TIERS: 0.01 / 0.05 / 0.30 / 1.00).
  - [`components/widgets/strategies/active-lp-dashboard-widget.tsx`](../../components/widgets/strategies/active-lp-dashboard-widget.tsx): monitoring surface. Columns: pool, range, in-range Y/N, TVL, 24h fees, IL%, last rebalance. KPI strip: total TVL, position count, 24h fees, avg IL.
  - Pool fixture already exists in `useDeFiData` context (`liquidityPools`) and fee-tier config exists at `lib/config/services/defi.config.ts:DEFI_FEE_TIERS`.
- **Possible outcomes:**
  - **Codify as archetype** — draft `architecture-v2/archetypes/amm-lp-provision.md` with the usual schema (venues, chain support, IL tolerance, rebalance triggers, fee-tier strategy, range-selection policy). Add `AMM_LP_PROVISION` to `DEFI_STRATEGY_FAMILIES`. This is the option if the desk actually runs LP strategies.
  - **Remove widgets** — if no desk runs AMM LP, delete `defi-liquidity-widget` and `active-lp-dashboard-widget`. Clean up `liquidityPools` from `useDeFiData` and `DEFI_FEE_TIERS` from config.
  - **Park** — label the widgets as speculative/prototype (similar to the reserved-for-future CBD outcome), but don't wire them to real execution paths.
- **Why this needs teammate input:** main agent has no visibility into whether AMM LP is a real desk strategy. User reports they have not been running concentrated-LP positions in-session, but desks may have others or plans for it. If yes → codex + full archetype audit. If no → widget cleanup ticket.
- **Widget-cert impact if codified:** the §2 matrix ALP column needs real per-widget verdicts (currently mostly ➖). `defi-liquidity-widget` inherits the §3.1 `strategy_id: "AMM_LP"` fix regardless of the codification outcome (attribution shouldn't depend on catalog presence).
- **Cross-reference:** tracked in the live review findings doc as issue #11 ([docs/audits/live-review-findings.md](../audits/live-review-findings.md)). The findings-doc row stays `[>]` (deferred) pending teammate call; flip to `[x]` once the archetype is either codified or the widgets are removed.

### Ask for teammate (codex section)

- **Straightforward edits** (YS, YRL, LIQ, CBD status-flip): action these directly in the relevant archetype docs unless you see a reason not to.
- **Decisions required:** §CBP.b, §CSB.b, the CBD routing-policy statement, and **the ALP codification call above**. If you have an opinion, land it; if not, flag and we can loop in the wider team. These are archetype-taxonomy / config-schema decisions — no widget code hinges on them (except the §3.1 `strategy_id` fix, which is independent).

---

## Resolution log

When a question is resolved, summarize the decision here with date + decider. Keep the discussion above intact as historical record.

No decisions logged yet.

---

## Backend handoff — `unified-trading-api` gaps (audit 2026-04-24)

These came out of the client/account/strategy tagging audit ([full audit doc](../../../unified-trading-pm/plans/ai/audit_client_account_strategy_tagging_2026_04_24.md)) after the UI `context/` was resynced. They are **not widget-specific** — fixes the backend team owns on `unified-trading-api` + UAC/UIC. No UI-side work depends on them; they're here so the handoff is in one place.

Per user direction: do **not** implement these from the UI side. Pass to backend team for scheduling.

### High-priority (primary-key / tagging hygiene)

- **B1** — `FillEventMessage` missing `account_id`. Location: `unified-internal-contracts/unified_internal_contracts/pubsub.py`. Fix: add optional `account_id: str | None` (composite `client:venue:label`, matches `CanonicalFill`) so pub/sub subscribers can attribute fills without re-joining orders.
- **B2** — `POST /execution/orders` doesn't persist `client_id` / `account_id` on created order/fill/position records. Location: `unified-trading-api/routes/execution.py`. Fix: when body contains these, write them onto the generated records so `GET /orders?client_id=X` returns what was just created.
- **B3** — `GET /execution/orders` and `GET /execution/fills` missing `strategy_id` filter. Location: `unified-trading-api/routes/execution.py`. Fix: add `strategy_id` query param alongside existing `client_id` / `account_id` / `category` / `strategy_family`. `GET /positions/active` already has it.

### Medium-priority (query ergonomics / typing)

- **B4** — `/analytics/strategies` missing `client_id`, `family`, `archetype` filters. Location: `unified-trading-api/routes/trading_analytics.py`. Fix: add these so UI can show "strategies for client X" or "all ML_DIRECTIONAL archetypes" without client-side filtering.
- **B5** — `/analytics/strategy-configs` has no query params. Location: same route file. Fix: add `strategy_id`, `client_id`, `at` (timestamp for historical config).
- **B6** — All `/analytics/*` response schemas are `additionalProperties: true` (untyped). Location: unified-trading-api response models. Fix: add typed Pydantic response models so UI can type-bind.

### Low-priority (versioning / audit completeness — keep optional)

- **B7** — `ClientInstruction` doesn't carry full event tag (`archetype_build_version`, `config_hash`, `config_version`, `slot_version`) as separate fields. Location: `unified-api-contracts/unified_api_contracts/internal/validation/instruction.py`. Fix: add as optional fields so every instruction is self-describing for audit.
- **B8** — `StrategyConfigDict.config_hash` not a first-class field. Location: `strategy-service/strategy_service/types.py`. Fix: compute SHA-256 at config load, store, log, use for audit correlation (per `codex/06-coding-standards/strategy-identity-versioning.md`).

### Deliberately out of scope

- `organisation_id` as a field on execution records — **not needed**. Organisation is metadata about a client (held in auth-api), not on trades. `client_id` alone is sufficient primary key.
- `user_id` / `wallet_id` as required on all orders — only `ManualInstruction` needs `submitted_by` (OAuth sub), already present. Non-manual orders are emitted by strategy-service, not a user.
- Making `client_id` / `strategy_id` required on `CanonicalOrder`/`CanonicalFill` — user's call: keep optional now; tighten when historical records are migrated.

### Infra — sync script lives in PM repo

The audit re-frame was triggered by finding `unified-trading-system-ui/context/` had drifted 20 days behind UAC/UIC masters. A manual sync script is being added at `unified-trading-pm/scripts/sync-ui-context.sh` — infra-ready, not auto-triggered; run when UI needs fresh schemas.
