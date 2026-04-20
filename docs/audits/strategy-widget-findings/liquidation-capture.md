---
archetype: LIQUIDATION_CAPTURE
status: draft-awaiting-review
---

# LIQUIDATION_CAPTURE — Widget Audit

## 1. Archetype summary

**Thesis:** Earn protocol-paid liquidation bonuses (5-10% of seized collateral) by repaying under-collateralised debt
on DeFi lending venues (Aave V3, Compound V3, Euler, Morpho, Kamino) the moment a position crosses `health_factor < 1.0`.
Alpha is structural (protocol pays a fixed bonus for cleanup work); there is zero directional risk per successful
liquidation. Cost comes from failed attempts (wasted gas, lost MEV auctions) and from gas-price regimes that make
marginal opps unprofitable.

**Position shape:** No carried position. Each opportunity is a single `ATOMIC_ON_CHAIN` multicall bundle:

```
FLASH_LOAN (debt_asset, = position.debt)
REPAY     (protocol, on_behalf_of=underwater_address, amount=position.debt)
SEIZE     (protocol, underwater_address, collateral_asset)
SWAP      (collateral_asset → debt_asset, via DEX, MEV-aware)
REPAY_FLASH_LOAN (debt_asset, amount=borrowed+fee)
# residual surplus = net profit, settled to executor wallet
```

Submitted as a Flashbots bundle on Ethereum (public mempool with priority gas on L2s / Solana). Reverts atomically if
net profit falls short mid-bundle — no partial-state risk.

**P&L drivers:**

- Gross: `seized_collateral_usd × liquidation_bonus_bps / 10_000`
- Minus flash-loan fee (Aave ≈ 5 bps on `debt_amount`), gas, DEX slippage on the collateral → debt swap
- Net profit only accrues on **included** bundles; lost MEV auctions cost gas for the losing submission only when
  bundles are publicly posted

**Kill switches (archetype doc §Risk profile):**

- Protocol incident (oracle failure, governance pause)
- Abnormal bundle-failure rate (indicates competitor advantage or RPC issue)
- Gas-price spike making the opp universe unprofitable in aggregate
- MEV-policy suspension (no submission path → stand down)

**UI-visible config knobs (archetype doc §Config schema):** `protocols_eligible[]`, `min_profit_usd`,
`max_debt_repay_usd`, `priority_fee_strategy`, `submission_mode` (Flashbots / public mempool / MEV Blocker),
`dex_slippage_tolerance`, `execution_policy_ref`, `mev_policy_ref`, `share_class` (USD).

**Sources:**

- v2 SSOT: [architecture-v2/archetypes/liquidation-capture.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/liquidation-capture.md)
- Cross-cutting: [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)
- Engine code (only): [strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py)
- Legacy e2e config (cascade-sniping variant, not the core archetype): [strategy_service/configs/liquidation_capture_eth.yaml](../../../../strategy-service/configs/liquidation_capture_eth.yaml)

**Migration status:** Per [MIGRATION.md §2 + §8](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md)
there is **no legacy archived doc**. The archetype is formalised by v2 around the existing
`strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py` engine. Codex footprint is
therefore thin: one archetype doc, no supporting legacy notes, and one YAML config describing a `cascade_capture`
variant (sniping discounted collateral after a cascade — distinct from the core flash-loan liquidation loop the
archetype doc describes).

## 2. Concrete strategies in this archetype

Archetype doc §Example instances:

| Instance ID                                  | Protocol    | Chain                                                       | Notes                                                    |
| -------------------------------------------- | ----------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| `LIQUIDATION_CAPTURE@aave-ethereum-prod`     | Aave V3     | Ethereum                                                    | Primary; Flashbots relay                                 |
| `LIQUIDATION_CAPTURE@aave-arbitrum-prod`     | Aave V3     | Arbitrum                                                    | Public mempool; cheaper gas, more opps per $             |
| `LIQUIDATION_CAPTURE@aave-multichain-prod`   | Aave V3     | Ethereum + Arbitrum + Optimism + Polygon + Avalanche + Base | Single strategy fans opportunity watcher across 6 chains |
| `LIQUIDATION_CAPTURE@compound-ethereum-prod` | Compound V3 | Ethereum                                                    | Smaller opp flow than Aave, higher avg ticket            |
| `LIQUIDATION_CAPTURE@euler-ethereum-prod`    | Euler       | Ethereum                                                    | Risk-segmented markets; bonus structure similar          |
| `LIQUIDATION_CAPTURE@morpho-ethereum-prod`   | Morpho      | Ethereum                                                    | Per-market liquidators; high variance                    |
| `LIQUIDATION_CAPTURE@kamino-solana-prod`     | Kamino      | Solana                                                      | Non-EVM; Jito bundles instead of Flashbots               |

**Strategy-catalog UI already names one production instance** —
[lib/mocks/fixtures/strategy-catalog-data.ts:915](../../../lib/mocks/fixtures/strategy-catalog-data.ts#L915) lists
`DEFI_LIQUIDATION_CAPTURE_ETH` with target APY 15–60%, 45% win rate, HF<1.0 trigger, Flashbots deployment. Venues are
`AAVEV3-ETHEREUM` + `COMPOUND-ETHEREUM`; readiness is BACKTEST (not LIVE) so UI-complete requirement is to validate
the wiring path, not to go live.

**Legacy `liquidation_capture_eth.yaml`** ([strategy_service/configs/liquidation_capture_eth.yaml](../../../../strategy-service/configs/liquidation_capture_eth.yaml))
describes a **different shape** — a "liquidation cascade capture" that buys discounted WETH/WBTC/wstETH **after**
cascade events rather than performing the liquidation itself. That is closer to a `RULES_DIRECTIONAL_CONTINUOUS`
dip-buy triggered by a cross-instrument feature. Flag: the naming collision will confuse operators. Either rename the
YAML (`liquidation_cascade_dip_capture_eth.yaml`) or reclassify it explicitly in codex.

**Bot-vs-operator framing:** Real liquidation capture runs fully automated (on-chain-to-on-chain latency << 12 s block
time). The UI's role is **operator supervision** — monitor the opportunity queue, inspect large/sensitive opps before
auto-submit, set risk bounds, and intervene manually when MEV competition or gas regime shifts. Pure manual
submission from UI cannot compete for most opps; the widget surface should reflect that.

---

## 3. UI capability requirements

Derived from archetype doc §Token/position flow + §Config schema + cross-cutting `mev-protection.md`. Grouped by
execute · monitor · support · exit. Operator is primarily a supervisor, but must be able to drive an opp end-to-end
to prove the backend path is wired.

### 3a. Execute

- **Select active instance** among the 7 example instances (protocol × chain) — determines which opportunity queue the
  operator sees
- **Opportunity pick & submit** — one-click "execute" on a row of the liquidation queue; builds the atomic bundle for
  that `(protocol, underwater_address, debt_asset, collateral_asset, debt_amount)` tuple
- **Flash-loan bundle preview** — pre-submit display of all 5 legs (FLASH_LOAN → REPAY → SEIZE → SWAP → REPAY_FLASH)
  with per-leg venue, asset, amount, and role
- **Submission-mode selector** — Flashbots / PUBLIC_MEMPOOL / MEV_BLOCKER / MANIFOLD (per [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)).
  Default from `mev_policy_ref`. On L2/Solana, public mempool is usually right.
- **Priority-fee strategy** — AGGRESSIVE / STANDARD / CUSTOM override (archetype `priority_fee_strategy`). CUSTOM lets
  operator type a tip gwei/compute-budget
- **DEX slippage tolerance** — `dex_slippage_tolerance` (default 0.5%) for the collateral → debt swap leg
- **Pre-submit profit gate** — hard-block if `expected_net_profit_usd < min_profit_usd` (archetype default $50). Must
  refuse submission, not just warn, to prevent manual override of the core risk knob.
- **Strategy instance tag** on emitted `AtomicInstruction` — must match the active instance ID (e.g.
  `LIQUIDATION_CAPTURE@aave-ethereum-prod`). Today the generic flash-loan widget hardcodes `strategy_id: "AAVE_LENDING"`,
  wrong for every liquidation.
- **Manual "dry-run simulate"** — execute the bundle against a fork/simulator to confirm it would have succeeded
  pre-submit. High-value safeguard for operator-initiated large opps.

### 3b. Monitor

- **Liquidation opportunity queue** — live list of underwater positions on eligible protocols with `HF < threshold`
  (default threshold 1.0; archetype supports "watch" above 1.0 via `max_health_factor` param in engine —
  [liquidation_capture.py:95](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py#L95)).
  Columns: protocol, chain, underwater addr (truncated), collateral asset + USD, debt asset + USD, HF, liquidation
  bonus bps, expected net profit USD, time since HF crossed threshold. This is **the** primary monitor.
- **Health-factor distribution histogram** — across all watched positions, `p(HF)` distribution; operator can see
  "there are 42 positions with HF in [1.0, 1.05] on Aave Arbitrum right now" to gauge opp density
- **Per-protocol opportunity rate** — opps/hour and total-bonus/hour by `(protocol, chain)` — which venue is paying?
- **Bundle inclusion rate** — fraction of submitted bundles that landed on-chain vs lost / reverted — key MEV-competition
  signal
- **Gas-price + priority-fee regime per chain** — live gwei + tip distribution; correlated against `min_profit_usd`
  gate to show how many queued opps are currently profitable
- **Won / lost PnL timeline** — cumulative realized profit from winning bundles; cumulative gas spent on losing bundles;
  net = strategy P&L
- **MEV competition panel** — detected frontrunners/competitors on recent opps (same underwater address, different
  liquidator); sophistication signal
- **DEX-liquidity sanity per collateral asset** — can we actually swap 500 WETH → USDC with < slippage tolerance right
  now? Feeds the `dex_slippage_bps` gate in engine
  ([liquidation_capture.py:88](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py#L88))
- **Protocol health / kill-switch state** — oracle-fresh flag, governance-pause flag per eligible protocol; feeds
  archetype kill switches
- **Seized-collateral inventory (transient)** — between SEIZE leg and SWAP leg the position holds raw collateral
  briefly; on successful bundles this inventory is always zero net. On **failed** bundles (SWAP fails mid-bundle,
  execution-service compensation policy = HOLD_LEG_AND_ALERT per
  [liquidation_capture.py:181](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py#L181))
  operator must see and decide how to dispose of the stranded collateral

### 3c. Support

- **Executor wallet balances + gas tokens** per chain — need ETH on Ethereum/Arbitrum/Optimism/Base for gas, MATIC
  on Polygon, AVAX on Avalanche, SOL on Solana. Below threshold = can't submit on that chain.
- **MEV policy review** — which `mev_policy_ref` / submission mode each chain uses; archetype-doc says policies are
  artifact-versioned. Operator must see current policy version.
- **Flash-loan fee per protocol** — Aave 5 bps, some chains different. Pre-submit clarity.
- **Strategy-level config snapshot** — `min_profit_usd`, `max_debt_repay_usd`, `priority_fee_strategy`,
  `dex_slippage_tolerance` — read-only view of active instance's config, with link to the config-edit surface for
  engineer/admin scope.
- **Per-chain bundler health** — Flashbots relay status, Jito block-engine status, Manifold status. If down, strategy
  stands down.
- **Opportunity ingest lag** — latency from on-chain `HF<1` event to queue surface; must be sub-second for competitive
  strategies

### 3d. Exit

LIQUIDATION_CAPTURE has no held position to exit — opportunities either land (one atomic bundle, profit captured) or
revert. Two exit-adjacent concerns remain:

- **Pause / kill-switch the strategy** — operator stops emitting new bundles (protocol incident, bundle-failure rate
  too high, gas regime degraded). Instance-level pause button with reason code.
- **Stranded-collateral disposition** — when a bundle partially lands (SEIZE succeeded, SWAP failed mid-bundle under
  `HOLD_LEG_AND_ALERT`), operator must be able to:
  - See the stranded balance per chain per asset
  - Drive a manual swap via `defi-swap-widget` to convert back to debt asset
  - Tag the resulting fill with the same instance ID so P&L attribution stays correct
- **Emergency cancel** — in-flight bundle cancel/replace with higher tip when priority-fee regime shifts between
  submission and inclusion (Ethereum only). Separate from the pause flow.

---

## 4. Widget-by-widget verification

Legend: ✅ fits · 🟡 partial · ❌ does not serve · ➖ tangential/n-a

### 4a. `liquidation-monitor-widget` — primary monitor surface · 🟡 partial

File: [components/widgets/strategies/liquidation-monitor-widget.tsx](../../../components/widgets/strategies/liquidation-monitor-widget.tsx)

The single most archetype-relevant widget in the UI today. A cross-protocol at-risk-positions table with HF-coloured
rows and liquidation-price proximity. **Already L0/L1/L2 certified** per
[docs/widget-certification/liquidation-monitor.json](../../widget-certification/liquidation-monitor.json).

- ✅ Cross-protocol rows: Aave V3, Morpho Blue, Compound V3, Kamino represented in fixture
  ([strategies-data-context.tsx:167-217](../../../components/widgets/strategies/strategies-data-context.tsx#L167-L217))
- ✅ HF-coloured severity bands at `>2.0 / >=1.5 / <1.5`
  ([liquidation-monitor-widget.tsx:12-22](../../../components/widgets/strategies/liquidation-monitor-widget.tsx#L12-L22))
- ✅ Per-row columns: protocol, collateral + USD, debt + USD, HF, liquidation price, distance % — matches §3b queue
  columns closely ([liquidation-monitor-widget.tsx:30-101](../../../components/widgets/strategies/liquidation-monitor-widget.tsx#L30-L101))
- ✅ Entitlements + availableOn plumbing: `requiredEntitlements: [{domain: "trading-common", tier: "basic"}]`,
  `availableOn: ["strategies", "defi", "risk"]`
  ([components/widgets/strategies/register.ts:140-155](../../../components/widgets/strategies/register.ts#L140-L155))
- 🟡 **No underwater-address column** — `AtRiskPosition` type
  ([strategies-data-context.tsx:30-39](../../../components/widgets/strategies/strategies-data-context.tsx#L30-L39))
  has `protocol/collateral/debt` but no `underwater_address`. The engine requires it
  ([liquidation_capture.py:114](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py#L114))
  as a param on every emitted `AtomicInstruction`. Without it the operator cannot drive a one-click execute from a
  queue row.
- 🟡 **No expected-profit / bonus column** — the whole decision variable (`expected_net_profit_usd`,
  `liquidation_bonus_bps`) is missing from the table. Engine computes it
  ([liquidation_capture.py:99-107](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py#L99-L107));
  queue has to show it for the operator to triage sensitive opps.
- 🟡 **No chain column** — fixture is chain-ambiguous (Aave V3 could be Ethereum or any of the 5 L2s). With multichain
  instances in scope, chain must be first-class.
- ❌ **KPI strip has two hardcoded placeholder values** — "Cascade Zone $2,740", "24h Liquidated $4.2M" at
  [liquidation-monitor-widget.tsx:113-114](../../../components/widgets/strategies/liquidation-monitor-widget.tsx#L113-L114).
  Already flagged in the widget-cert findings (L4 item). For this archetype the KPI strip should carry: queue-depth,
  total-bonus-available, bundle-inclusion-rate-24h, realized-PnL-24h.
- ❌ **No "execute" CTA** per row — widget is observe-only. That's consistent with the L0 certification (inline-table
  class) but means it cannot satisfy §3a one-click submit. Execute must live in a companion widget, not this one.
- ➖ Title/icon "AlertTriangle" reads as a risk-warning rather than an opportunity queue — language ambiguity between
  **our** position being at risk (risk use case) vs **others'** positions being liquidatable (strategy use case). Same
  data, two audiences. Widget description at [register.ts:143-144](../../../components/widgets/strategies/register.ts#L143-L144)
  says "cascade risk monitor showing at-risk DeFi positions" — the risk framing is currently dominant.

**Gap → action:** Add `underwater_address`, `chain`, `bonus_bps`, `expected_net_profit_usd` columns to the
`AtRiskPosition` type and fixture. Replace hardcoded KPIs with computed ones. Decide the dual-audience story: keep as
risk widget and build a **separate** `liquidation-opportunity-queue` widget with execute CTA, OR extend this widget
with a "perspective" toggle (`mine | opportunities`). Lean toward separate widget — execute surface belongs with
strategy, not risk.

### 4b. `defi-flash-loans-widget` — partial fit for execute surface · 🟡 partial

File: [components/widgets/defi/defi-flash-loans-widget.tsx](../../../components/widgets/defi/defi-flash-loans-widget.tsx)

Designed as a generic flash-loan bundle builder: auto-prepended `FLASH_BORROW` leg, operator adds arbitrary steps,
auto-appended `FLASH_REPAY` leg, gross/fee/gas/net P&L preview.

- ✅ **Flash-loan structure mirrors the archetype's atomic bundle shape** —
  [defi-flash-loans-widget.tsx:44-65](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L44-L65) is the
  auto-prepend; [L189-201](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L189-L201) is auto-append.
  This is the only widget in the UI today that speaks "flash bundle" natively.
- ✅ Step builder lets operator add REPAY / TRADE / SWAP / TRANSFER legs between borrow and repay
  ([L67-187](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L67-L187))
- ✅ Net-P&L preview with gross / fee / gas / net decomposition
  ([L203-217](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L203-L217)) — mirrors §3b P&L but does not
  account for `dex_slippage_bps` leg
- ✅ Submit emits `is_atomic: true` instruction
  ([L246](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L246)) matching `ATOMIC_ON_CHAIN` execution
  mode
- ❌ **Hardcoded `strategy_id: "AAVE_LENDING"`** at
  [L232](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L232) regardless of operation intent. A
  liquidation bundle submitted here will be tagged to lending, not to `LIQUIDATION_CAPTURE@<instance>`. **Blocker,
  same pattern as YIELD_STAKING_SIMPLE and YIELD_ROTATION_LENDING audits.**
- ❌ **Hardcoded flash-borrow asset + amount placeholder** (`ETH`, `100 ETH`, `$27.50 fee` at
  [L55-61](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L55-L61)) — should be driven by the selected
  liquidation opp's `debt_asset` + `debt_amount`.
- ❌ **No submission-mode selector** (Flashbots / mempool / MEV Blocker) — core archetype knob missing. Per
  [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)
  this is a policy-versioned choice per chain + size.
- ❌ **No priority-fee selector** — archetype `priority_fee_strategy: AGGRESSIVE` has no UI control
- ❌ **No `min_profit_usd` pre-submit gate** — widget allows submit at any net P&L; archetype mandates a hard floor
- ❌ **Liquidation-specific ergonomics missing** — no way to populate the bundle from a queue row (should be
  "execute-from-opportunity", not hand-built). Generic step editor is right for power-user scenarios, wrong for the
  hot path of liquidation which is a canned 5-step template.

**Gap → action:** Either (a) extend this widget with a `mode={generic|liquidation}` prop where liquidation mode
accepts an `AtRiskPosition` and pre-fills the canonical 5-leg template + binds `strategy_id` to the active instance,
or (b) build a dedicated `defi-liquidation-execute-widget` that reuses the flash-loan bundle rendering. (a) is less
code; (b) is clearer separation. Either way, submission-mode + priority-fee + min-profit gates are required.

### 4c. `defi-health-factor-widget` — ❌ does not serve this archetype

File: [components/widgets/defi/defi-health-factor-widget.tsx](../../../components/widgets/defi/defi-health-factor-widget.tsx)

Same conclusion as prior two audits: hard-wired to weETH recursive-staking (own position). Per
[L90-128](../../../components/widgets/defi/defi-health-factor-widget.tsx#L90-L128) the widget reads `weeth_oracle_rate`,
`weeth_market_rate`, `staking_rate_pct`, `borrow_rate_pct`, `leverage`, `leveraged_spread_pct` — all fields belong to
`CARRY_RECURSIVE_STAKED`, not to `LIQUIDATION_CAPTURE`.

The pre-work question for this audit was: can it visualise other wallets' positions? Answer: **no, not as-built.**
The widget consumes `healthFactorDashboard` which is a single-position struct. It cannot drive a cross-address HF
distribution. For liquidation capture the operator needs the HF **distribution** across hundreds of watched
underwater addresses, which is a different chart type (histogram) over a different data shape (array of external
positions, not one own position).

**Gap → action:** Do not shoehorn. Leave this widget to `CARRY_RECURSIVE_STAKED`. For this archetype, add a new
`defi-liquidation-hf-distribution` widget (histogram / density of external position HFs per protocol) that feeds from
the same `AtRiskPosition[]` fixture used by the liquidation monitor. Small widget, high clarity.

### 4d. `defi-strategy-config-widget` — ❌ does not cover this archetype

File: [components/widgets/defi/defi-strategy-config-widget.tsx](../../../components/widgets/defi/defi-strategy-config-widget.tsx)

The DeFi strategy-config widget drives off `DEFI_STRATEGY_FAMILIES` and `DEFI_STRATEGY_SCHEMAS`
([lib/config/strategy-config-schemas/defi.ts:376-417](../../../lib/config/strategy-config-schemas/defi.ts#L376-L417)).
Those families cover Lending / Basis / Staking / Recursive / Cross-Chain / LP — **no Liquidation group**, and
`LIQUIDATION_CAPTURE` is **absent from `DEFI_STRATEGY_IDS`**
([lib/types/defi.ts:34-50](../../../lib/types/defi.ts#L34-L50)). Operator cannot even select the strategy in the
config widget.

Note: `lib/architecture-v2/archetypes.ts:97-99` and `lib/architecture-v2/enums.ts:48,68,89` do declare the archetype
at the v2 taxonomy layer, and `strategy-catalog-data.ts:915` lists the instance in the catalog. The gap is **the
widget's own config surface** — the two worlds aren't joined.

**Gap → action:** Add `"LIQUIDATION_CAPTURE"` to `DEFI_STRATEGY_IDS`, add a `Liquidation` family group with the 7
example instances, and author a `DEFI_STRATEGY_SCHEMAS["LIQUIDATION_CAPTURE"]` mirror of the archetype doc's config
schema (`protocols_eligible[]`, `min_profit_usd`, `max_debt_repay_usd`, `priority_fee_strategy`, `submission_mode`,
`dex_slippage_tolerance`, `mev_policy_ref`). **Blocker.**

### 4e. `defi-trade-history-widget` — ✅ adequate (monitor: realised P&L)

File: [components/widgets/defi/defi-trade-history-widget.tsx](../../../components/widgets/defi/defi-trade-history-widget.tsx)

The `FLASH_BORROW` / `FLASH_REPAY` type badges already render
([defi-trade-history-widget.tsx:24-25](../../../components/widgets/defi/defi-trade-history-widget.tsx#L24-L25)) and
the widget decomposes instant P&L (gas, slippage, alpha). If strategy-instance tagging is fixed (blocker 6a.1) this
widget is the right home for "Won bundles today" retrospection.

- ➖ No specific liquidation filter/group, but the feed is strategy-agnostic by design; a strategy-instance filter
  driven by layout context would suffice

**Gap → action:** None widget-scoped. Correct tagging upstream makes this widget work for the archetype.

### 4f. `defi-yield-chart-widget` — ➖ tangential

File: [components/widgets/defi/defi-yield-chart-widget.tsx](../../../components/widgets/defi/defi-yield-chart-widget.tsx)

APY/cumulative-P&L/daily-P&L time series. Liquidation capture is event-driven and lumpy (archetype doc §Risk profile:
"opp frequency is the constraint on annualized returns") — APY isn't the natural metric. Cumulative P&L works but the
"vs Ethena" baseline already flagged in prior audits is particularly wrong here (Ethena is a carry benchmark, not
comparable to a MEV-bot strategy). Use the widget only if baseline is made pluggable.

**Gap → action:** No archetype-specific fix; inherit baseline-pluggability enhancement from YIELD_STAKING_SIMPLE /
YIELD_ROTATION_LENDING audits.

### 4g. `defi-wallet-summary-widget` — ✅ fits (support)

File: [components/widgets/defi/defi-wallet-summary-widget.tsx](../../../components/widgets/defi/defi-wallet-summary-widget.tsx)

Same verdict as prior audits. Per-chain balances + gas-token threshold warnings cover the executor-wallet support
requirement. Non-controversial.

### 4h. `defi-swap-widget` — ✅ fits (stranded-collateral disposition path)

File: [components/widgets/defi/defi-swap-widget.tsx](../../../components/widgets/defi/defi-swap-widget.tsx)

Relevant only for the §3d.stranded-collateral path. If a liquidation bundle reverts mid-execution with seized
collateral held (HOLD_LEG_AND_ALERT compensation policy per
[liquidation_capture.py:181](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py#L181)),
operator manually swaps collateral → debt asset through this widget.

- ❌ **Same hardcoded `strategy_id`** blocker at
  [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348) — the swap tagged to a basis
  / lending strategy, not the originating liquidation instance. Same fix as 6a.1.

### 4i. `defi-rates-overview-widget` — ➖ not applicable

Supply/borrow APY tables are irrelevant to the liquidation archetype (we don't hold supply or borrow positions).

### 4j. `defi-reward-pnl-widget` — ➖ not applicable

No reward-token accrual in liquidation capture. Profit is in seized-collateral-minus-debt-repaid, already captured by
trade-history.

### 4k. Missing coverage (no widget today)

| Capability (from §3)                                          | Status     | Proposed widget                                                                   |
| ------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| One-click execute from opportunity row (queue → flash bundle) | ❌ missing | **new:** `defi-liquidation-execute-widget` (or flash-loans mode extension)        |
| Submission mode / priority fee / MEV policy selector          | ❌ missing | within execute widget above; surface `mev_policy_ref` version                     |
| HF-distribution histogram across external positions           | ❌ missing | **new:** `defi-liquidation-hf-distribution-widget`                                |
| Bundle inclusion rate + MEV competition panel                 | ❌ missing | **new:** `defi-bundle-inclusion-stats-widget`                                     |
| Gas-price + priority-fee regime per chain                     | ❌ missing | **new:** `defi-gas-regime-widget` (shared with any MEV-adjacent archetype)        |
| Stranded-collateral dashboard (between bundle legs)           | ❌ missing | **new:** `defi-stranded-collateral-widget` — tied to compensation policies        |
| DEX liquidity sanity check per collateral asset / size        | ❌ missing | could extend `defi-swap-widget` with pre-trade depth view, but standalone cleaner |

---

## 5. Codex updates proposed

Thin codex footprint — archetype doc is internally coherent. Four small adds:

1. **Explicit MEV-policy-per-chain table in archetype doc.** Currently §Execution semantics says "Submission via
   Flashbots (Ethereum + Base) / equivalent bundlers (other chains)" but leaves Arbitrum / Optimism / Polygon /
   Avalanche / Solana implicit. Cross-reference the concrete mapping in
   [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)
   or restate it as a table in the archetype doc.
2. **`max_health_factor` param in §Config schema.** The engine accepts `max_health_factor` with default 1.0
   ([liquidation_capture.py:95](../../../../strategy-service/strategy_service/engine/strategies/v2/arbitrage_structural/liquidation_capture.py#L95))
   — this is the "watch" threshold and should be first-class in the archetype config so UI can expose it.
3. **Rename or reclassify `strategy_service/configs/liquidation_capture_eth.yaml`.** That YAML describes a
   cascade-dip-capture strategy (buy discounted WETH/WBTC/wstETH post-cascade) which is a different archetype
   (`RULES_DIRECTIONAL_CONTINUOUS` with a cross-instrument feature trigger). The naming collision will propagate
   downstream into UI and config review.
4. **Explicit "stranded collateral" section** under §Execution semantics or §Risk profile. Archetype uses
   `CompensationPolicy.HOLD_LEG_AND_ALERT` for partial failures; codex should describe what operator does next.

No schema changes needed beyond (2).

---

## 6. Gaps summary

### 6a. Blockers (must-fix before archetype is UI-complete)

1. **`LIQUIDATION_CAPTURE` missing from DeFi strategy-config surface.** Not in `DEFI_STRATEGY_IDS`
   ([lib/types/defi.ts:34-50](../../../lib/types/defi.ts#L34-L50)); no family in `DEFI_STRATEGY_FAMILIES`
   ([lib/config/strategy-config-schemas/defi.ts:376-417](../../../lib/config/strategy-config-schemas/defi.ts#L376-L417));
   no schema entry. Operator cannot configure any of the 7 example instances via `defi-strategy-config-widget`.
   **P0.**
2. **Hardcoded `strategy_id` in execute widgets** — [defi-flash-loans-widget.tsx:232](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L232)
   (`"AAVE_LENDING"`) and [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348). Same
   pattern flagged in `yield-rotation-lending.md §6a.1` and `yield-staking-simple.md §4a`. Liquidation bundles and any
   stranded-collateral swaps will be mis-tagged. **P0 — cross-archetype fix.**
3. **No opportunity-queue → execute path.** `liquidation-monitor-widget` is observe-only and
   `defi-flash-loans-widget` is hand-built bundles; the primary workflow (click an underwater position → submit a
   pre-built 5-leg flash bundle tagged to the active instance) has no UI. **P0.**
4. **`AtRiskPosition` type missing three archetype-critical columns**: `underwater_address`, `chain`,
   `expected_net_profit_usd` / `bonus_bps`
   ([strategies-data-context.tsx:30-39](../../../components/widgets/strategies/strategies-data-context.tsx#L30-L39)).
   Without these, the queue cannot drive execution and cannot be triaged. **P0.**
5. **No submission-mode / priority-fee / MEV-policy UI control anywhere.** Core archetype config knobs are
   invisible. Operator cannot deliberately pick between Flashbots and public mempool per submission. **P0.**

### 6b. Enhancement wishlist (non-blocking but high-value)

1. **New widget `defi-liquidation-opportunity-queue`** — dedicated execute-capable queue, separates strategy use case
   from the `liquidation-monitor-widget` risk use case. Columns: protocol, chain, underwater_addr, collateral USD, debt
   USD, HF, bonus bps, expected net profit USD, age in queue. Row actions: `Simulate` (dry-run), `Execute` (submit
   bundle), `Exclude` (skip this opp for this session).
2. **New widget `defi-liquidation-hf-distribution`** — histogram of HFs across all watched external positions per
   protocol; operator sees "is there opp density right now?"
3. **New widget `defi-bundle-inclusion-stats`** — won/lost timeline, inclusion rate, avg tip paid, MEV competitor list.
4. **New widget `defi-gas-regime`** — per-chain live gas + priority-fee with min-profit-break-even overlay. Shared
   with any MEV-adjacent archetype; candidate for cross-cutting `defi/` slot.
5. **New widget `defi-stranded-collateral`** — shows non-zero intermediate-state balances (between SEIZE and SWAP
   legs), with one-click manual swap. Small but critical for `HOLD_LEG_AND_ALERT` compensation paths across all
   atomic archetypes.
6. **Extend `liquidation-monitor-widget` KPI strip** — replace hardcoded "Cascade Zone" / "24h Liquidated" with
   computed `queue_depth`, `total_bonus_available_usd`, `inclusion_rate_24h`, `realized_pnl_24h`.
7. **Pluggable comparison baseline in `defi-yield-chart-widget`** — shared with prior audits. For liquidation, baseline
   should be "risk-free rate" (SOFR) per the strategy-catalog entry, not "vs Ethena".

---

## 7. Verified-in-browser checklist

Golden-path scenarios to run after 6a blockers land. Until then, marked **BLOCKED**.

1. **BLOCKED** — Browse `/trading/defi` with `LIQUIDATION_CAPTURE@aave-ethereum-prod` as the active instance;
   liquidation-opportunity-queue widget renders with at least one underwater position HF<1.05, showing protocol /
   chain / underwater_address / collateral / debt / HF / bonus / expected-profit.
2. **BLOCKED** — Operator clicks "Simulate" on a queue row → flash-loan bundle widget opens pre-filled with the
   canonical 5-leg template (FLASH_LOAN → REPAY → SEIZE → SWAP → REPAY_FLASH) → dry-run returns "would succeed, net
   profit $X".
3. **BLOCKED** — Operator clicks "Execute" → submission-mode selector defaults to Flashbots (Ethereum) / public
   mempool (Arbitrum) per `mev_policy_ref` → confirmation modal shows priority-fee + expected inclusion block → submit
   → emitted `AtomicInstruction` tagged `strategy_id: "LIQUIDATION_CAPTURE@aave-ethereum-prod"`.
4. **BLOCKED** — `defi-trade-history-widget` shows the resulting `FLASH_BORROW` row and child fills (REPAY, SEIZE,
   SWAP, REPAY_FLASH_LOAN) with correct strategy tag.
5. **BLOCKED** — Attempt to submit an opp with `expected_net_profit_usd < min_profit_usd` → UI refuses (not just warns).
6. **BLOCKED** — Simulate a partial-bundle failure (SWAP leg reverts) → `defi-stranded-collateral-widget` flags the
   held collateral with one-click manual-swap route.
7. **BLOCKED** — HF distribution widget renders a histogram of external positions per protocol; narrowing a chain
   filter recomputes.
8. **PARTIAL** — `liquidation-monitor-widget` renders with scope cascade + sort on HF + KPI strip (KPIs currently
   hardcoded — blocker 6a.5 and known-issue in widget-cert).
9. ✅ — `defi-wallet-summary-widget` shows executor-wallet gas balances on all 6 EVM chains + Solana for the
   multichain instance.
10. **BLOCKED** — Strategy config for `LIQUIDATION_CAPTURE@aave-ethereum-prod` editable via
    `defi-strategy-config-widget` with fields `protocols_eligible[]`, `min_profit_usd`, `max_debt_repay_usd`,
    `priority_fee_strategy`, `submission_mode`, `dex_slippage_tolerance`.
11. **BLOCKED** — Pause strategy from instance control → no new bundles emitted; in-flight bundles unaffected.

---

## 8. Open questions for user

1. **Dual audience for at-risk positions.** The same `AtRiskPosition` fixture feeds both (a) **our** positions that
   might get liquidated (risk use case, `defi-health-factor-widget` adjacent) and (b) **others'** positions we can
   liquidate (strategy use case, this archetype). Keep one widget with a `perspective` toggle, or two widgets backed
   by a shared data source? Recommend two — clarity > code-share.
2. **Manual-execute scope.** Real liquidations run fully automated (latency << 12 s). Do we want a manual
   execute-from-queue CTA at all, or is the UI purely for supervision + kill-switch? Legitimate case for manual:
   large/sensitive opps where MEV-policy override is desired. Legitimate case for auto-only: every manual submission
   loses to bots anyway. My read: build it for parity (manual is the proof that backend path is wired), but label the
   "Execute" CTA as "Simulate" + "Simulate & Submit" with a big tip-required warning.
3. **Flash-loan widget extension vs new widget.** Current `defi-flash-loans-widget` is a generic bundle builder.
   Extend with a `mode={generic|liquidation}` prop, or build `defi-liquidation-execute-widget` from scratch? Extension
   is less code; dedicated widget has clearer single-purpose ergonomics. Lean: dedicated widget, reuse bundle
   rendering components.
4. **Where does `priority_fee_strategy` + `submission_mode` live?** Strategy-level config (per-instance default in
   `defi-strategy-config-widget`), execution-level override (per-submission in the execute widget), or both? Matches
   CeFi execution-policy pattern where policy has a default but op can override; recommend both with the execute-widget
   showing the effective policy badge.
5. **Stranded-collateral ownership.** Does the stranded-collateral widget belong in the liquidation-capture family or
   cross-cutting? Every atomic-bundle archetype (recursive staking, cross-chain rotation) has the same failure mode
   with HOLD_LEG_AND_ALERT. Lean cross-cutting.
6. **`liquidation_capture_eth.yaml` reclassification.** That config is a cascade-dip-capture strategy, not the flash-loan
   liquidation loop. Rename + move, or keep the collision with a disclaimer? Rename preferred; it's misleading as-is.

---

_Status: draft — awaiting user review. Sibling archetypes covered: `yield-staking-simple.md`,
`yield-rotation-lending.md`._
