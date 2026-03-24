# Strategy Config Architecture — Cross-Cutting Concern

## Hard Rules

### 1. Strategies NEVER access raw data services

```
PROHIBITED:
  strategy-service  ←✗→  market-tick-data-service     (raw WebSocket ticks)
  strategy-service  ←✗→  market-data-processing-service (processed candles)

ALLOWED:
  strategy-service  ←✓→  features-* services           (computed features via pub/sub or GCS)
  strategy-service  ←✓→  ml-inference-api              (ML signals)
  strategy-service  ←✓→  position-balance-monitor       (positions, exposures)
  strategy-service  ←✓→  risk-and-exposure-service       (risk assessments)
```

**Why:** Raw tick data and processed market data flow INTO features services. If a strategy needs any of that data, it
should get it as a feature. Strategy should never deal with raw WebSocket connections, orderbook snapshots, or candle
assembly. By the time data reaches the strategy, it must be processed into something the strategy can act on quickly.

**What strategy receives:**

- Features (computed metrics: funding_rate, apy, basis_bps, ml_signal)
- Positions (current holdings from ExposureMonitor)
- Exposures (normalised position values from ExposureMonitor)
- Risk assessments (from RiskMonitor: health factor, margin usage, delta drift)
- PnL (from PnLMonitor: attribution, equity, settlements)

**What strategy does NOT do:**

- Calculate exposures (ExposureMonitor does that)
- Calculate risk (RiskMonitor does that)
- Calculate PnL (PnLCalculator does that)
- Fetch market data (data services do that)

Strategy's job: receive pre-computed inputs → decide what to do → emit `StrategyInstruction`.

### 2. All strategies are event-driven

There is no "timer-based" strategy. What appears time-based is actually event-driven from upstream feature updates that
happen to run on a schedule:

```
features-delta-one-service runs every 1H
  → publishes feature update to pub/sub
    → strategy-service receives event
      → strategy.generate_signal(features, positions, risk)
        → emit StrategyInstruction (or no-op)
```

**Three trigger types (all event-driven):**

| Trigger                   | Source                               | Example                         |
| ------------------------- | ------------------------------------ | ------------------------------- |
| Feature update            | features-\* services via pub/sub     | New 1H candle features computed |
| ML signal                 | ml-inference-api via pub/sub         | New model prediction available  |
| Exposure threshold breach | RiskMonitor/ExposureMonitor internal | Delta drift > 2%, HF < 1.5      |

The strategy subscribes to whichever triggers are relevant. Most of the time, the answer is "nothing to do" — the
strategy checks conditions and returns no-op.

**For market-making:** Same flow, but the trigger is "underlying moved by X%" rather than "new 1H candle". The feature
service publishes more frequently (sub-second if needed), and the market-making strategy recalculates pricing/orders on
each meaningful move.

**For arbitrage:** Trigger is "new pricing signal" or "arb opportunity threshold crossed". In sports, once a bet is
placed there's no rebalancing — you hold until settlement. The trigger is only for new opportunities.

### 3. Filtering: publisher vs receiver side

**Shared signals** (features, ML inference) are published to pub/sub topics. Multiple strategies subscribe to the same
topic. The question: who filters?

**Rule:** Strategy defines its trigger subscriptions. The EventDrivenStrategyEngine filters incoming events against the
strategy's subscription config before invoking `generate_signal()`.

```yaml
# Per-strategy subscription config
trigger_subscriptions:
  - source: features-delta-one
    filter: funding_rate_changed # only trigger on this feature
    threshold: 0.0001 # minimum change to trigger
  - source: ml-inference
    filter: model_id=defi_basis_v2
  - source: exposure-monitor
    filter: delta_drift > 0.02
```

**Gap:** This subscription config doesn't exist yet as a formal schema. Currently strategies get all features on every
candle. Plan item `p5-risk-strategy-subscription` partially addresses this, but trigger subscriptions are a separate
concern from risk subscriptions.

> **TODO — CODIFY:** Trigger subscriptions need: (a) `TriggerSubscription` Pydantic model in
> `unified-internal-contracts` with fields: `source: str`, `filter: str`, `threshold: Decimal | None`,
> `granularity: str | None` (b) `trigger_subscriptions: list[TriggerSubscription]` field in strategy config TypedDict
> (c) EventDrivenStrategyEngine must filter incoming events against subscriptions before invoking `generate_signal()` —
> currently it passes everything through (d) This enables: same features pub/sub topic, different strategies filtering
> differently; market-making strategy triggers on 5bp move, DeFi strategy triggers on hourly features only

### 4. Config-driven: live = batch = same code

```
StrategyConfig (mode-agnostic)
  → EventDrivenStrategyEngine (same for live and backtest)
    → PnLCalculator.calculate_attribution() (identical)
      → PnLAttribution (same structure always)
```

The only difference is the data source:

- **Live:** `CloudDataProvider` → features from GCS/pub/sub → real-time events
- **Batch:** `CSVDataProvider` → features from CSV files → replayed events

Same config + same engine + different time window = different results. A config attached to 1 day of data = intraday
analysis. Same config + 2 years = full backtest.

### 5. Multi-strategy per instance

Strategy-service MUST support multiple `(strategy_id, client_id, config)` tuples in one process, both live and batch:

```
strategy-service instance (LIVE)
  ├── (DEFI_ETH_BASIS, odum, config_a)    ← async task
  ├── (DEFI_ETH_BASIS, alpha, config_b)   ← async task (same strategy, different client+config)
  ├── (DEFI_ETH_STAKED_BASIS, odum, config_c) ← async task
  └── (DEFI_USDT_LENDING, odum, config_d) ← async task

strategy-service instance (BATCH — same architecture)
  ├── (DEFI_ETH_BASIS, odum, config_a, 2025-01-01..2025-12-31) ← async task
  ├── (DEFI_ETH_BASIS, odum, config_a_v2, 2025-01-01..2025-12-31) ← parallel param sweep
  └── (DEFI_ETH_STAKED_BASIS, odum, config_c, 2024-06-01..2025-12-31) ← different window
```

The unit of execution is `(strategy_id, client_id, config)` — NOT strategy alone, NOT client alone. The config
determines everything: thresholds, subscriptions, instruments, risk limits. Different configs with the same strategy_id
are different instances.

**Rules:**

- Each `(strategy, client, config)` tuple is an isolated async task
- Strategies NEVER communicate with each other (no shared state)
- Shared triggers fan out: one pub/sub message → delivered to all subscribed strategies via internal Redis or in-process
  event bus
- A client not configured for a trigger type simply doesn't receive it (e.g., client X subscribed to ML signals, client
  Y only to features)
- Clones (same strategy, same settings, different clients) share triggers efficiently: one message triggers all clones
  simultaneously

**Horizontal scaling:**

- Shard by client, strategy type, or config group
- Each shard is a strategy-service instance with a subset of tuples
- Stateless: all state is in GCS config + PBMS positions + PnL snapshots
- Adding a new shard = deploying another instance with different tuple assignments

**Batch mode — identical architecture:**

- Run multiple `(strategy, client, config)` tuples in parallel
- Each attaches to its own config + data time window
- No interaction between parallel backtests
- Same EventDrivenStrategyEngine, same PnLCalculator, same SettlementService

### 6. Positions are per-client, strategies are templates

See [client-onboarding.md](client-onboarding.md) for the full rule. Key point: one strategy instance per
`(client_id, strategy_id)` tuple. The strategy template code is shared; positions diverge due to execution timing.

## Strategy Config vs Execution Config Boundary

This separation is critical for independent backtesting. Strategy backtests test different strategy configs (thresholds,
subscriptions). Execution backtests test different execution configs (algos, order types) against the SAME set of
strategy instructions.

### Lives in Strategy Config

| Setting                | Why Strategy                           | Example                                          |
| ---------------------- | -------------------------------------- | ------------------------------------------------ |
| Rebalancing thresholds | Strategy decides WHEN to act           | `delta_drift_threshold: 0.02`                    |
| Trigger subscriptions  | Strategy decides WHAT events matter    | `trigger_on: [features-delta-one, ml-inference]` |
| Risk limits            | Strategy decides risk tolerance        | `min_health_factor: 1.5`                         |
| Instrument selection   | Strategy decides WHAT to trade         | `instruments: [WALLET:SPOT_ASSET:ETH, ...]`      |
| Signal logic           | Strategy decides entry/exit conditions | `min_funding_rate: 0.0001`                       |
| Position sizing        | Strategy decides HOW MUCH              | `spot_allocation_pct: 0.90`                      |

SSOT: `strategy-service/strategy_service/config.py` (TypedDicts)

### Lives in Execution Config

| Setting                  | Why Execution                      | Example                             |
| ------------------------ | ---------------------------------- | ----------------------------------- |
| Execution algorithm      | Execution decides HOW to fill      | `algo: TWAP`, `algo: AlmgrenChriss` |
| post_only / reduce_only  | Execution venue-specific flag      | `post_only: true` (maker-only)      |
| Order splitting / sizing | Execution decides slice sizes      | `child_order_size: 0.1`             |
| Rate limits              | Execution manages venue throttling | `max_orders_per_second: 10`         |
| SOR venue selection      | Execution picks best venue         | Automatic across `allowed_venues`   |
| Gas parameters           | Execution manages on-chain costs   | `priority_fee_gwei: 2.0`            |
| Alpha measurement        | Execution tracks vs benchmark      | `benchmark_type: ARRIVAL`           |

SSOT: `execution-service/execution_service/service_config.py` Algorithms:
`execution-service/execution_service/algorithms/` (7 algos in registry)

### How Strategy Communicates Execution Preferences

Strategy emits `StrategyInstruction` with HINTS, not commands:

```python
StrategyInstruction(
    operation=OperationType.SWAP,
    token_in="USDT", token_out="WETH",
    amount=Decimal("50000"),
    # --- Strategy decisions ---
    direction="LONG",
    max_slippage_bps=30,
    benchmark_price=Decimal("3500"),
    benchmark_type="TWAP",
    allowed_venues=["UNISWAPV3-ETHEREUM", "CURVE-ETHEREUM"],  # SOR hint
    stop_loss_price=Decimal("3400"),
    # --- Execution preference hints ---
    order_type=OrderType.LIMIT,    # prefer limit, execution may override
    metadata={"execution_style": "passive"},  # hint only
)
```

> **TODO — CODIFY:** Execution preference hints are currently stuffed into `metadata` dict (untyped). These should
> become first-class typed fields on `StrategyInstruction`:
> `execution_style: Literal["passive", "aggressive", "urgent"]`, `ref_underlying: str | None`,
> `edge_offset: Decimal | None`, `leg_group_id: str | None`, `leg_role: Literal["leader", "follower"] | None`,
> `execution_mode: Literal["same_candle_exit", "hold_until_flip", "passive_limit", "aggressive_fill"]`. This avoids
> stringly-typed metadata and enables schema validation.

Execution-service receives this and applies its own config to decide the actual execution.

### Reference Pricing & Underlying Fixing

Applies to: market-making, options, arbitrage, any multi-leg strategy.

**Key distinction:**

- **Benchmark price** = what execution measures slippage against AFTER the fill
- **Reference underlying** = what execution tracks to UPDATE order prices BEFORE the fill
- These can be the same thing, but are not guaranteed to be

**How it works:**

Strategy sends an instruction with a price and a reference underlying:

```
instruction.price = 5.00            # I want to buy at 5.00
instruction.benchmark_price = 6.00  # underlying is currently at 6.00
instruction.ref_underlying = "ETH-USD"  # track this to adjust my price
```

If the underlying moves from 6.00 to 4.00, execution-service adjusts the order price from 5.00 to 3.00 (maintaining the
1.00 offset). Strategy set the EDGE (1.00 below underlying); execution maintains it by tracking the underlying.

**This is execution config, not strategy config**, because:

- Strategy sets the EDGE (the price relative to underlying at instruction time)
- Execution manages the mechanics: monitoring underlying, updating orders, respecting rate limits
- Strategy does NOT stream market data — execution-service has its own fast feed for this

**Applies to arbitrage:** If trading spot vs perp basis:

- Strategy sends: buy spot at X below ref, sell perp at Y above ref
- Execution tracks the ref underlying and adjusts both legs
- The spread between X and Y is the strategy's edge — execution preserves it

**Current state:** NOT implemented. Gap in execution-service — no "fix to underlying" concept. Orders are
fire-and-forget with fixed limit prices.

> **TODO — CODIFY:** Reference pricing needs: (a) `ref_underlying` and `edge_offset` fields on `ExecutionInstruction`
> (or in metadata) (b) `UnderlyingTracker` component in execution-service that subscribes to a fast market data feed for
> the ref instrument and recalculates order price on move > threshold (c) `ref_update_threshold_bps` and
> `ref_update_rate_limit_per_second` in execution config (d) `benchmark_price` stays as-is for post-fill slippage
> measurement — it is NOT the same as `ref_underlying` (benchmark = measure after, ref = track before)

### Multi-Leg Execution: Leader/Follower Model

For non-atomic multi-leg trades (cross-exchange arb, spot-perp basis, calendar spreads):

**Two execution models:**

| Model               | When                                   | Example                                                   |
| ------------------- | -------------------------------------- | --------------------------------------------------------- |
| **Atomic combo**    | DeFi (all legs in one tx)              | Flash loan bundle: borrow→swap→stake→deposit→borrow→repay |
| **Leader/follower** | CeFi/TradFi (legs on different venues) | Buy Dec future on Deribit, sell spot on Binance           |

**Atomic combos:** All instructions packaged into one atomic transaction. `is_atomic=True` on the DeFiSignal. All
succeed or all revert. Only valid for DeFi operations (SWAP, LEND, BORROW, STAKE, FLASH_BORROW, FLASH_REPAY) — NOT for
TRADE instructions (which go to CeFi order books).

**Leader/follower:**

- **Follower** = less liquid leg, execute FIRST (passive, limit order)
- **Leader** = more liquid leg, hedge AGGRESSIVELY once follower fills

Why follower first? The less liquid leg is harder to fill. Once you get filled on it, you need to hedge immediately on
the more liquid leg where you're confident of getting a fill.

**Example: Dec futures arb (BTC Dec future @ $6 vs spot @ $6)**

```
Strategy edge: buy future at $1 below underlying

Follower leg: BUY Dec future
  price = $5 when underlying = $6 (ref_underlying = "BTC-USD")
  If underlying moves to $4: order updates to $3
  FILLED at $3 when underlying was $4

Leader leg: SELL spot (auto-triggered by follower fill)
  Aggressive market order on more liquid venue
  Target: sell at $4 (current underlying)
  May get filled at $3.98 (slippage on leader is measured separately)
```

**Strategy config for this:**

- Which leg is leader, which is follower
- The edge/spread the strategy wants
- Whether to allow trading through theoretical price on the leader (`max_leader_slippage_bps` — how much worse than
  theoretical is acceptable for the hedge)

**Execution config for this:**

- How aggressively to fill the leader once follower is filled
- Update frequency for follower orders when underlying moves
- Rate limits per venue
- Whether to cancel follower if underlying moves too far (staleness protection)

**Config DRY rule:** If "aggressive mode" is just `max_leader_slippage_bps: 1000` (wide tolerance) and "passive mode" is
`max_leader_slippage_bps: 5` (tight tolerance), then DON'T create separate "aggressive" and "passive" presets. The
underlying config fields express all combinations. Presets are convenience wrappers at most, never new config
dimensions.

**Current state:** NOT implemented. Execution-service has no leader/follower concept.

> **TODO — CODIFY:** Leader/follower needs: (a) `MultiLegInstruction` model in execution-service with
> `legs: list[LegInstruction]`, each leg having `role: "leader" | "follower"`, `ref_underlying`, `edge_offset` (b)
> `MultiLegOrchestrator` in execution-service that watches follower fills and auto-triggers leader legs with aggressive
> execution (c) Strategy-side: `StrategyInstruction` needs `leg_group_id` and `leg_role` fields so execution knows which
> instructions form a multi-leg group (d) Config: `leader_follower_config.yaml` schema with `max_leader_slippage_bps`,
> `follower_staleness_timeout_seconds`, `leader_aggression_mode`

### Execution Constraint Hierarchy

Six layers of constraints, from hardest to softest. Each layer narrows what's possible:

```
Layer 1: HARD RULES (instruction type)
  └─ Layer 2: VENUE RESTRICTIONS (book type, order types)
       └─ Layer 3: ALGO RESTRICTIONS (which algos support which instruction types)
            └─ Layer 4: ALGO AVAILABILITY (which algos available on which venues)
                 └─ Layer 5: STRATEGY TYPICAL FLOW (usual defaults for this strategy type)
                      └─ Layer 6: NUANCE CONFIG (per-client, per-trade fine-tuning)
```

**Layer 1 — Hard rules by instruction type:**

| Instruction Type   | post_only? | limit? | market?   | TWAP? | Atomic?    | Notes                                       |
| ------------------ | ---------- | ------ | --------- | ----- | ---------- | ------------------------------------------- |
| SWAP               | NO         | NO     | YES (SOR) | NO    | YES (DeFi) | Swaps are immediate, price is SOR-optimised |
| LEND / BORROW      | NO         | NO     | N/A       | NO    | YES (DeFi) | Protocol interaction, not order book        |
| STAKE / UNSTAKE    | NO         | NO     | N/A       | NO    | YES (DeFi) | Protocol interaction                        |
| FLASH_BORROW/REPAY | NO         | NO     | N/A       | NO    | MUST       | Always atomic                               |
| TRADE (CeFi CLOB)  | YES        | YES    | YES       | YES   | NO         | Full order book flexibility                 |
| TRADE (TradFi FIX) | NO         | YES    | YES       | YES   | NO         | Exchange-dependent                          |

> **TODO — CODIFY:** This matrix is documentation only. It MUST become a machine-readable validation table (YAML or
> Python dict) in `unified-api-contracts/registry/` or `execution-service/config/`. The instruction router MUST validate
> incoming instructions against this matrix and REJECT invalid combinations (e.g., post_only on a SWAP) before
> attempting execution. Without this, invalid instructions fail at the venue level with cryptic errors instead of clean
> pre-validation.

**Layer 2 — Venue restrictions:**

- Hyperliquid: supports post_only, reduce_only
- Binance: supports post_only on spot and futures
- Deribit: supports post_only, reduce_only
- Uniswap: NO order book, only swaps with max_slippage
- Aave: NO order book, only protocol interactions

SSOT: [`VENUE_CAPABILITIES`](../../unified-api-contracts/unified_api_contracts/registry/venue_constants.py)

> **TODO — CODIFY:** `VENUE_CAPABILITIES` exists and lists high-level capabilities (SPOT_TRADE, PERP_TRADE, LEND, etc.)
> but does NOT include order-type-level detail (post_only support, reduce_only support, cancel/replace support). These
> need to be added as sub-capabilities so the instruction router can validate `post_only=True` against venue support
> before sending.

**Layer 3 — Algo restrictions:**

| Algorithm                | TRADE? | SWAP? | LEND? | Multi-leg? | Notes                               |
| ------------------------ | ------ | ----- | ----- | ---------- | ----------------------------------- |
| TWAP                     | YES    | NO    | NO    | NO         | Time-slice, needs order book        |
| VWAP                     | YES    | NO    | NO    | NO         | Volume-weighted, needs order book   |
| AlmgrenChriss            | YES    | NO    | NO    | NO         | Optimal execution, needs order book |
| POVDynamic               | YES    | NO    | NO    | NO         | Percentage of volume                |
| PassiveAggressiveHybrid  | YES    | NO    | NO    | NO         | Mix maker/taker                     |
| SOR (Smart Order Router) | NO     | YES   | NO    | NO         | DEX venue selection                 |
| AtomicBundle             | NO     | YES   | YES   | NO         | DeFi atomic transaction             |

> **TODO — CODIFY:** This algo-instruction compatibility matrix is documentation only. It MUST become a machine-readable
> registry in `execution-service/execution_service/algorithms/` (alongside the existing `ExecAlgorithmRegistry`). Each
> algorithm should declare its `supported_operation_types: list[OperationType]` so the router auto-validates. Currently
> the registry discovers algos via introspection but doesn't check instruction compatibility.

**Layer 4 — Algo availability per venue:** Not all algos are available on all venues. TWAP requires streaming market
data from the venue. Some venues don't support the cancel/replace pattern needed for TWAP child orders.

> **TODO — CODIFY:** No machine-readable mapping of algo → supported venues exists. Should be a YAML registry in
> execution-service config: `algo_venue_compatibility.yaml` with entries like `TWAP: [BINANCE, DERIBIT, HYPERLIQUID]`,
> `SOR: [UNISWAPV3-ETHEREUM, CURVE-ETHEREUM, BALANCER-ETH]`. The router should validate algo+venue before dispatching. Currently
> algo availability is implicit in code (algo just fails if venue doesn't support required operations).

**Layer 5 — Strategy typical flow (documented in strategy docs):** Each strategy doc describes the "usual" execution
pattern. For basis trade: swap via SOR (passive), perp via limit. For recursive basis: atomic DeFi bundle + perp limit.
These are defaults, not hard constraints — config can override.

> **TODO — CODIFY:** Strategy typical flows are prose in docs. They should ALSO exist as default config templates in
> `strategy-service/configs/defaults/` — one YAML per strategy type with the "usual" execution preferences pre-filled.
> New clients start from the default template and override only what they need. This prevents each new config from being
> built from scratch and ensures the "usual" flow is the path of least resistance.

**Layer 6 — Nuance config (per-client fine-tuning):**

- `max_leader_slippage_bps`: how much through theoretical to allow on hedge leg
- `allow_cross_spread`: whether to allow orders that immediately fill (taker vs maker)
- `urgency_escalation_minutes`: time before escalating from passive to aggressive
- `ref_underlying_update_threshold_bps`: minimum underlying move before order price updates

These are in execution config, attached to the `(strategy, client, config)` tuple.

> **TODO — CODIFY:** These nuance config fields don't exist in any schema yet. They need to be added to an
> `ExecutionPreferencesConfig` TypedDict (or Pydantic model) in execution-service, validated at instruction routing
> time. Each field should have a default that matches the "strategy typical flow" (Layer 5) so that configs are minimal
> by default. The schema should be in `execution-service/execution_service/models/` and referenced from strategy docs.

### Same-Candle-Exit vs Hold-Until-Flip

Strategy config controls the holding pattern:

| Mode               | Behaviour                             | Order Implication                                |
| ------------------ | ------------------------------------- | ------------------------------------------------ |
| `same_candle_exit` | Enter and exit within one candle      | Execution must fill within candle window         |
| `hold_until_flip`  | Hold until opposing signal            | Limit order, cancel if not filled by next signal |
| `passive_limit`    | Post limit, accept not getting filled | post_only, no urgency                            |
| `aggressive_fill`  | Must fill within N minutes            | TWAP/VWAP with time horizon                      |

Strategy sets the mode; execution config determines the algorithm to achieve it.

> **TODO — CODIFY:** `execution_mode` exists on some strategy configs as a string but is NOT validated against the
> holding mode enum above. It needs to be: (a) A formal `ExecutionMode` StrEnum in `unified-internal-contracts` (b)
> Validated at strategy config load time (c) Mapped to execution behaviour in execution-service: `same_candle_exit` →
> escalation logic (passive first, then aggressive, then market if deadline approaching), `hold_until_flip` → cancel
> order on next signal if unfilled, `passive_limit` → post_only + no urgency escalation, `aggressive_fill` → TWAP/VWAP
> with `urgency_horizon_minutes` from execution config Currently `execution_mode: "same_candle_exit"` is a string in
> strategy config that execution doesn't read or enforce.

### Config Lifecycle: Local → GCS → Live

```
1. Define config locally (validated against config.py TypedDict schemas)
2. Test in batch mode (same config, historical data)
3. Optimise params in batch (grid search, param sweeps)
4. Upload winning config to GCS: gs://config/{strategy_id}/clients/{client_id}.yaml
5. Strategy-service hot-reloads from GCS (UCI config watcher)
6. Live run uses IDENTICAL config as the winning backtest
7. Only thing that changes: data source (CSV → CloudDataProvider)
```

Code paths don't change. Config doesn't change. Deployment infrastructure is the only delta.

## SSOT References

| Concept                | SSOT                                | File                                                   |
| ---------------------- | ----------------------------------- | ------------------------------------------------------ |
| Strategy config schema | TypedDicts                          | `strategy-service/strategy_service/config.py`          |
| Event-driven engine    | EventDrivenStrategyEngine           | `strategy-service/.../event_driven_strategy_engine.py` |
| Feature delivery       | CloudDataProvider / CSVDataProvider | `strategy-service/strategy_service/data/`              |
| Exposure calculation   | ExposureMonitor                     | `strategy-service/.../exposure_monitor.py`             |
| Risk assessment        | RiskMonitor                         | `strategy-service/.../risk_monitor.py`                 |
| PnL calculation        | PnLCalculator + SettlementService   | `strategy-service/.../pnl_calculator.py`               |
| Rebalancing config     | YAML                                | `strategy-service/configs/rebalancing_config.yaml`     |
| Risk subscriptions     | StrategyRiskProfile (not yet wired) | `unified-internal-contracts/risk.py:414`               |

## Gaps

1. **Trigger subscription config** — no formal schema for per-strategy event subscriptions (which pub/sub topics, which
   filters, which thresholds). Currently implicit.
2. **Multi-strategy instance support** — EventDrivenStrategyEngine runs one strategy. Need orchestrator layer that
   manages multiple async tasks per instance.
3. **Sharding config** — no formal definition of how to shard strategies across instances.
4. **Feature freshness gate** — if features stop arriving, strategy should NOT keep running on stale data.
   FreshnessMonitor integration needed (plan item in `defi_keys`).
5. **Underlying fixing in execution** — no "fix to underlying" concept. Orders are fire-and-forget with fixed limit
   prices. Execution-service needs a mode where it monitors an underlying price and updates order prices on move.
   Critical for market-making and options.
6. **execution_algo field on instructions** — strategy can hint `order_type` but cannot specify which execution
   algorithm to use. Currently algorithm is selected by execution-service router/orchestrator based on market
   conditions. Strategy should be able to hint preferred algo.
7. **Fill feedback pub/sub** — execution results are written to GCS, strategy reads async. No direct pub/sub feedback
   channel for fills. This adds latency for strategies that need fast fill feedback (market-making).
8. **Execution config schema** — execution-service config is `UnifiedCloudConfig` with storage buckets. No formal schema
   for per-strategy execution preferences (algo selection, post_only defaults, rate limit overrides). Need
   `ExecutionConfig` TypedDict alongside `StrategyConfig`.
9. **Same-candle-exit enforcement** — strategy sets `execution_mode: same_candle_exit` but execution-service doesn't
   enforce this as a deadline. Need time-bounded execution with escalation (passive → aggressive → market) if fill not
   achieved within candle.
10. **Leader/follower execution** — no concept of multi-leg leader/follower in execution-service. Currently each
    instruction is independent. Need: follower-fill → auto-trigger-leader pipeline.
11. **Algo availability registry** — no machine-readable mapping of which algos are available on which venues for which
    instruction types. Currently implicit in code. Should be YAML/JSON in execution-service config, validated at
    instruction routing time.
12. **Instruction type → algo compatibility** — no formal validation that a given algo can handle a given instruction
    type (e.g., TWAP can't run on a SWAP). Should be enforced in router.
