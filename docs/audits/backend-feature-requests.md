---
status: open
owner: ComsicTrader
started: 2026-04-21
audience: backend team (execution-service, accounts-service, unified-internal-contracts)
---

# Backend Feature Requests (from UI)

Single source of truth for API/endpoints the UI has **mocked today** and needs **wired later**. Backend team checks these off as endpoints land; UI team swaps the mock hook for the real one in a one-line change.

## How to read this

- **ID** — stable identifier referenced from widget cert JSONs (`backendFeatureRequest` field)
- **Widget(s)** — UI consumer(s) of the endpoint
- **Current UI stub** — what the UI does today (usually a mock hook under `lib/hooks/mocks/`)
- **Expected contract** — request shape + response shape (aligned with `unified-internal-contracts` where a schema already exists)
- **Owning service** — which backend service should ship this
- **Status** — `pending` (UI mocks) · `in-progress` (backend building) · `shipped` (UI can swap hook)

## Workflow

1. UI identifies a backend gap → creates a mock hook in `lib/hooks/mocks/` → adds a row here → tags cert JSON with `backendFeatureRequest: "<ID>"`.
2. Backend team picks up → builds endpoint → updates status here + flips to `shipped`.
3. UI team replaces the mock hook's body with a real `fetch()` (interface unchanged) → cert JSON drops the `backendFeatureRequest` tag.

---

## Requests

### BFR-001 — Kill-switch execution actions

- **Widget(s):** [components/widgets/alerts/alerts-kill-switch-widget.tsx](../../components/widgets/alerts/alerts-kill-switch-widget.tsx)
- **Current UI stub:** [lib/hooks/mocks/use-kill-switch-actions.ts](../../lib/hooks/mocks/use-kill-switch-actions.ts) — simulates ~150ms latency, returns a synthetic `{request_id, accepted_at}` envelope. Widget renders a sonner toast with the request id.
- **Expected contract:**
  ```
  POST /execution/kill-switch
  Request: {
    action: "pause_strategy" | "cancel_orders" | "flatten_positions" | "disable_venue",
    scope: "strategy" | "client" | "venue" | "global",
    entity_id: string,       // strategy_id / client_id / venue_id, matching scope
    rationale: string,       // operator audit text (required)
    idempotency_key: string, // client-generated UUID; server rejects duplicates within 5 min
  }
  Response 202: {
    request_id: string,
    accepted_at: string,     // ISO-8601 UTC
    estimated_completion_ms: number | null,
  }
  Response 409: { code: "already_accepted", request_id: string }
  ```
- **Owning service:** execution-service (`unified-trading-services` / dedicated kill-switch endpoint)
- **Status:** `pending`
- **Blocking widget cert?** yes — `docs/widget-certification/alerts-kill-switch.json` flags handleConfirm as mock-only

### BFR-002 — Accounts transfer submission + status

- **Widget(s):** [components/widgets/accounts/accounts-transfer-widget.tsx](../../components/widgets/accounts/accounts-transfer-widget.tsx)
- **Current UI stub:** [lib/hooks/mocks/use-accounts-transfer.ts](../../lib/hooks/mocks/use-accounts-transfer.ts) — fakes submission + returns a synthetic `{transfer_id, status: "submitted"}`; widget still calls `accounts-data-context.addTransferEntry` so the in-session history UX is preserved.
- **Expected contract:**

  ```
  POST /accounts/transfer
  Request: {
    direction: "deposit" | "withdraw" | "internal" | "cross_venue",
    from_account_id: string,
    to_account_id: string,   // same as from_account_id for deposit/withdraw
    from_venue: string,
    to_venue: string,
    asset: string,           // e.g. "USDT", "ETH", "BTC"
    amount: string,          // stringified decimal, venue-minor-unit-precision
    network: string | null,  // on-chain transfers only
    address: string | null,  // withdraw only
    memo: string | null,     // some venues require; nullable otherwise
    idempotency_key: string,
  }
  Response 202: {
    transfer_id: string,
    status: "submitted" | "confirming" | "settled" | "rejected",
    submitted_at: string,    // ISO-8601 UTC
    estimated_settlement_ms: number | null,
  }

  GET /accounts/transfer/:transfer_id
  Response 200: {
    transfer_id: string,
    status: "submitted" | "confirming" | "settled" | "rejected",
    updated_at: string,
    on_chain_tx_hash: string | null,
    confirmations: number | null,
    failure_reason: string | null,
  }
  ```

- **Owning service:** accounts-service (likely new) or extension of `unified-trade-execution-interface`
- **Status:** `pending`
- **Blocking widget cert?** partial — widget passes all L0-L7 checks; backend wiring is an L3 follow-up

### BFR-003 — Bridge route quotes + gas oracle (defi-transfer)

- **Widget(s):** [components/widgets/defi/defi-transfer-widget.tsx](../../components/widgets/defi/defi-transfer-widget.tsx) — Bridge mode "Available routes" card list, and Send/Bridge "Gas estimate" readout
- **Current UI stub:**
  - Routes: [lib/mocks/fixtures/defi-transfer.ts](../../lib/mocks/fixtures/defi-transfer.ts) `getMockBridgeRoutes()` returns 4 static protocols (Across, Stargate, CCTP, Hop) with `isBestReturn` / `isFastest` flags hard-coded.
  - Gas: [hooks/use-gas-estimate.ts](../../hooks/use-gas-estimate.ts) `useGasEstimate({ chain, operation })` computes the EIP-1559 formula from `CHAIN_GAS_BASELINE` + `DEFI_GAS_UNITS` in [lib/config/services/defi.config.ts](../../lib/config/services/defi.config.ts) with a 5s jitter tick.
- **Backend state (already exists, not exposed to UI yet):**
  - `execution-service/execution_service/defi_execution/protocols/bridge.py` — `SocketBridgeConnector.get_bridge_quotes()` wraps Socket v2 `/quote` and aggregates Across / Stargate / Hop / LayerZero / LI.FI.
  - `unified-api-contracts/unified_api_contracts/internal/domain/defi/transfers.py:33-42` — `BridgeProtocol` StrEnum: `NATIVE | STARGATE | ACROSS | HOP | LAYERZERO | SOCKET | LIFI`.
  - `execution-service/execution_service/services/bridge_cost_model.py` — per-(source, dest) cost estimates keyed by `BridgeProtocol`.
  - Strategy configs: `e2e-testing/configs/defi/strategies/defi_cross_chain_sor.yaml`, `defi_cross_chain_yield_arb.yaml` reference `bridge_protocol: socket|native` with `max_bridge_fee_pct`.
  - `unified-trading-api/unified_trading_api/routes/trading_analytics.py:522-541` — declares `CROSS_CHAIN_SOR` and `CROSS_CHAIN_YIELD_ARB` strategy families.
- **Expected contract:**

  ```
  GET /defi/bridge/quotes
  Query: {
    token: string,           // e.g. "USDC", "ETH"
    amount: string,          // stringified decimal (native units)
    from_chain: string,      // DEFI_CHAINS member
    to_chain: string,        // DEFI_CHAINS member
    max_bridge_fee_pct: number | null,  // optional filter per strategy config
  }
  Response 200: {
    quoted_at: string,       // ISO-8601 UTC
    routes: Array<{
      protocol: BridgeProtocol,    // enum above; NATIVE covers Circle CCTP-style official routes
      output_amount: string,       // stringified decimal
      fee_pct: number,             // 0.0004 = 0.04 %
      fee_usd: string,             // stringified decimal
      estimated_time_sec: number,  // service-level ETA, not block confirmations
      gas_source_native: string,   // source-chain gas in native token qty (stringified)
      gas_source_usd: string,
      is_best_return: boolean,     // server-picked
      is_fastest: boolean,         // server-picked
      route_id: string,            // opaque identifier; UI echoes back on submit
    }>,
  }

  POST /defi/bridge/submit
  Request: {
    route_id: string,               // from the GET response
    token: string,
    amount: string,
    from_chain: string,
    to_chain: string,
    to_address: string,
    max_slippage_bps: number,
    idempotency_key: string,
  }
  Response 202: { order_id, submitted_at, on_chain_tx_hash: string | null }

  GET /defi/gas/quote
  Query: { chain: string, operation: "NATIVE_TRANSFER"|"ERC20_TRANSFER"|"BRIDGE_LOCK" }
  Response 200: {
    chain, operation,
    gas_units: number,
    base_fee_gwei: string,
    priority_fee_gwei: string,
    native_symbol: string,
    native_usd: string,
    native_fee: string,       // derived, for convenience
    usd_fee: string,
    as_of: string,
  }
  ```

  WS variant `defi.gas.quote` pushing the same shape on each new block is preferred over polling — the UI hook is already shaped to accept either.

- **Owning service:** execution-service (bridge endpoints re-use `SocketBridgeConnector`); gas oracle likely also execution-service or a new thin `quotes-service` wrapping Blocknative / `eth_feeHistory`.
- **Status:** `pending` (public routes); connector + enum + cost model + strategy configs already `shipped` internally.
- **Blocking widget cert?** no — widget passes L0-L8; this is an L3 wire-up follow-up. Cert JSON tagged with `backendFeatureRequest: "BFR-003"`.
- **Open alignment questions** (raise with backend before endpoint land):
  1. UI mock lists `CCTP` as a distinct protocol; backend enum folds Circle CCTP under `NATIVE`. Either add `CCTP` to the enum or have the UI map it. Recommend: UI drops CCTP and relies on `NATIVE` returning Circle when the path is USDC-eligible.
  2. UI cert JSON previously listed `WORMHOLE` under `coverage.venues`; backend enum doesn't include it. Recommend dropping until/unless Socket backend adds it.
  3. Should `is_best_return` / `is_fastest` ever both be true on the same route, or should the UI coalesce into a single "Best" badge when they agree? Backend decides ranking policy.

---

## Conventions

- All timestamps: ISO-8601 UTC (ending `Z`). No local timezones on the wire.
- Monetary amounts: stringified decimals to preserve precision. Never JS `number`.
- Idempotency keys: required on every mutation endpoint. UI sends a client-generated UUID.
- Error envelope: `{ code: string, message: string, details?: object }`. Codes documented alongside each endpoint.

## Not in scope for this doc

- UX-only cert findings (L8 arbitrary sizes, token migrations, a11y labels) — these don't need backend input; see [docs/audits/live-review-findings.md](./live-review-findings.md).
- Strategy archetype questions (`AMM_LP_PROVISION` codex addition etc.) — see [docs/trading/widget-certification-deferred-questions.md](../trading/widget-certification-deferred-questions.md).
- Opportunity/screener feed — see [unified-trading-pm/plans/ai/screeners-tab-plan.md](../../../unified-trading-pm/plans/ai/screeners-tab-plan.md).
