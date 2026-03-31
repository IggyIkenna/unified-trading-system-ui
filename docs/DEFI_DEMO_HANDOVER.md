# DeFi Demo — Frontend Handover & UAT Guide

## Overview

This document covers all frontend changes made for the DeFi client demo, what each
strategy's demo flow looks like, what should be responsive to user actions, and what
tests to write. Intended for the dev doing UAT hardening.

## Demo Login

**Email:** `patrick@bankelysium.com`
**Password:** `demo`
**Organization:** Elysium
**Role:** client

### What Patrick sees:

**UNLOCKED (has entitlement):**

- Overview, Book, Orders, Positions, Alerts, Risk, P&L, Accounts, Instructions
- **DeFi tab** (full: wallet, lending, swap, LP, staking, flash loans, transfer, rates, trade history, strategy config)
- Staking sub-tab, Bundles sub-tab

**LOCKED (no entitlement — shows as FOMO-locked tab):**

- Strategies tab (`strategy-families` entitlement required)
- Sports tab (`sports-trading`)
- Predictions tab (`predictions-trading`)
- Options tab (`options-trading`)
- Terminal (available but not DeFi-relevant)

**NOT VISIBLE (separate service groups, client role):**

- Build / Research
- Data
- Observe / Ops
- Admin

### Demo Strategies (available under Patrick's org):

- AAVE_LENDING — stablecoin lending
- BASIS_TRADE — multi-venue basis
- STAKED_BASIS — weETH + hedge
- RECURSIVE_STAKED_BASIS — demo only (will be locked post-demo)

### Other Personas (for comparison):

- `admin@odum.internal` / `demo` — sees everything (wildcard `*`)
- `trader@odum.internal` / `demo` — internal desk, all features
- `pm@alphacapital.com` / `demo` — full client, no DeFi-specific
- `analyst@betafund.com` / `demo` — data-only, minimal access

## OpenAPI Sync

Run this to ensure frontend types match backend:

```bash
bash unified-trading-pm/scripts/openapi/generate-unified-openapi.sh
```

This generates:

- `lib/registry/openapi.json` — full OpenAPI spec from all services
- `lib/registry/ui-reference-data.json` — registries, enums, config schemas
- `lib/types/api-generated.ts` — TypeScript types from OpenAPI

**The `ui-reference-data.json` is the SSOT for:**

- `OperationType` enum (20 types including SWAP, LEND, FLASH_BORROW, etc.)
- Venue names (canonical IDs like AAVEV3-ETHEREUM, HYPERLIQUID)
- Instrument types per venue
- Venue categories (cefi, defi, tradfi, sports)

Frontend types in `lib/types/defi.ts` MUST stay in sync with this file.

## Strategy Docs (Codex Reference)

Full e2e workflow per strategy in:

- `unified-trading-pm/codex/09-strategy/defi/aave-lending.md` — § E2E Manual Trading Workflow
- `unified-trading-pm/codex/09-strategy/defi/basis-trade.md` — § E2E Manual Trading Workflow
- `unified-trading-pm/codex/09-strategy/defi/staked-basis.md` — § E2E Manual Trading Workflow
- `unified-trading-pm/codex/09-strategy/defi/recursive-staked-basis.md` — § E2E Manual Trading Workflow
- `unified-trading-pm/codex/09-strategy/defi/ethena-benchmark.md` — § E2E Manual Trading Workflow
- `unified-trading-pm/codex/09-strategy/defi/market-making-lp.md` — § E2E Manual Trading Workflow

Each includes: step-by-step instructions, instruction types, algos, instant P&L per step,
position state, risk metrics, exit workflow, and trade history table.

## Changes Made (Summary)

### New Files Created

| File                                                      | Purpose                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `components/widgets/defi/defi-trade-history-widget.tsx`   | Trade history with instant P&L decomposition                            |
| `components/widgets/defi/defi-rebalance-dialog.tsx`       | Rebalance preview with per-strategy allocation                          |
| `components/widgets/defi/defi-strategy-config-widget.tsx` | Strategy config viewer/editor                                           |
| `lib/mocks/fixtures/defi-risk.ts`                         | Risk profiles, delta, treasury, reconciliation, trade history mock data |

### Files Modified

| File                                                            | What Changed                                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/types/defi.ts`                                             | Added: strategy IDs, operation types (aligned with UAC enum), algo-per-instruction mapping, instant P&L, risk dimensions, delta neutrality, reconciliation, rebalance, treasury types |
| `lib/config/services/defi.config.ts`                            | Added: instruction type labels, algo type labels, canonical venue display names, slippage options                                                                                     |
| `lib/mocks/fixtures/defi-lending.ts`                            | Added: venue_id, chain fields to lending protocols                                                                                                                                    |
| `lib/mocks/fixtures/defi-swap.ts`                               | Added: algo_type to swap route                                                                                                                                                        |
| `lib/mocks/fixtures/defi-liquidity.ts`                          | Added: venue_id to liquidity pools                                                                                                                                                    |
| `lib/mocks/fixtures/defi-staking.ts`                            | Added: venue_id to staking protocols                                                                                                                                                  |
| `lib/mocks/fixtures/mock-data-seed.ts`                          | Added: 5 DeFi alerts (HF low, funding negative, treasury, IL, depeg)                                                                                                                  |
| `lib/mocks/fixtures/reconciliation.ts`                          | Added: 5 DeFi reconciliation records                                                                                                                                                  |
| `components/widgets/defi/defi-data-context.tsx`                 | Added: risk, delta, treasury, trade history, reconciliation, rebalance state                                                                                                          |
| `components/widgets/defi/defi-flash-loans-widget.tsx`           | Added: instruction type → algo dropdown, max_slippage_bps                                                                                                                             |
| `components/widgets/defi/defi-wallet-summary-widget.tsx`        | Added: treasury status, rebalance button, delta KPI                                                                                                                                   |
| `components/widgets/defi/defi-lending-widget.tsx`               | Added: venue_id display, slippage, expected output                                                                                                                                    |
| `components/widgets/defi/defi-swap-widget.tsx`                  | Added: algo type selector                                                                                                                                                             |
| `components/widgets/defi/defi-rates-overview-widget.tsx`        | Added: venue_id to rate rows                                                                                                                                                          |
| `components/widgets/defi/defi-staking-widget.tsx`               | Updated: canonical venue IDs in order params                                                                                                                                          |
| `components/widgets/defi/defi-liquidity-widget.tsx`             | Updated: canonical venue IDs in order params                                                                                                                                          |
| `components/widgets/defi/register.ts`                           | Added: trade history + strategy config widgets                                                                                                                                        |
| `components/widgets/risk/risk-kpi-strip-widget.tsx`             | Added: DeFi delta exposure + risk profiles section                                                                                                                                    |
| `components/widgets/positions/positions-data-context.tsx`       | Added: net_delta, health_factor fields + DeFi positions                                                                                                                               |
| `components/widgets/positions/positions-table-widget.tsx`       | Added: Net Delta + HF columns                                                                                                                                                         |
| `components/widgets/overview/kpi-strip-widget.tsx`              | Added: DeFi Delta KPI card                                                                                                                                                            |
| `components/reports/reconciliation/reconciliation-types.ts`     | Added: balance/gas break types, accepted status                                                                                                                                       |
| `components/reports/reconciliation/reconciliation-columns.tsx`  | Added: badge styles for new types                                                                                                                                                     |
| `components/reports/reconciliation/reconciliation-constants.ts` | Added: DeFi venues + break types to filters                                                                                                                                           |
| `components/widgets/book/book-order-form-widget.tsx`            | Added: DeFi instruction type + algo + slippage dropdowns                                                                                                                              |
| `components/widgets/book/book-algo-config-widget.tsx`           | Added: DeFi algo detail view                                                                                                                                                          |
| `components/widgets/book/book-data-context.tsx`                 | Added: DeFi instruction/algo/slippage state                                                                                                                                           |

## Demo Strategies & Their UI Flows

### 1. AAVE Lending (simplest)

**User actions:**

1. DeFi tab → Wallet Summary: see treasury balance
2. Lending widget → select "Aave V3 (AAVEV3-ETHEREUM)" protocol
3. Select USDC, enter amount, set slippage → Execute
4. Trade history: see TRANSFER + LEND instructions with instant P&L
5. Positions tab: see aUSDC position appear with running interest
6. Risk tab: no HF (pure lending), protocol risk = low
7. PnL tab: see daily interest accruing

**What should respond:**

- [ ] Position table updates after LEND order fills
- [ ] Trade history shows instruction with P&L decomposition
- [ ] Wallet summary balance decreases by lent amount
- [ ] PnL chart shows interest income building over time

### 2. Basis Trade (multi-venue)

**User actions:**

1. Book tab → select instruction type: SWAP → algo: SOR_DEX → execute USDC→ETH
2. Book tab → select instruction type: TRANSFER → algo: DIRECT → transfer margin to Hyperliquid
3. Book tab → select instruction type: TRADE → algo: DIRECT_MARKET → SHORT ETH on Hyperliquid
4. Repeat steps 2-3 for other venues (Binance, OKX, Bybit, Aster)
5. Positions tab: see ETH LONG + perp SHORTs, net delta ≈ 0
6. Risk tab: basis risk = medium, funding rate risk = high

**What should respond:**

- [ ] Each instruction appears in trade history with running total
- [ ] Positions show ETH LONG + per-venue SHORTs
- [ ] Net delta in positions near zero
- [ ] PnL shows funding income accumulating
- [ ] Alerts fire if funding goes negative

### 3. Staked Basis (weETH + hedge)

**User actions:**

1. Swap USDC → ETH → weETH (two swaps in sequence)
2. Transfer margin → SHORT ETH perp
3. Positions: weETH LONG + ETH SHORT, net delta ≈ 0
4. Risk: weETH/ETH basis risk, depeg alert at 2%

**What should respond:**

- [ ] Staking widget shows weETH staking yield
- [ ] Trade history shows swap slippage (25 bps on ETH→weETH)
- [ ] Risk shows depeg tolerance
- [ ] Alert fires if weETH/ETH deviates >1.5%

### 4. Recursive Staked Basis (demo highlight)

**User actions:**

1. Flash loan widget → build atomic bundle:
   - FLASH_BORROW ETH (Morpho, 0% fee)
   - SWAP USDC→ETH
   - SWAP ETH→weETH
   - LEND weETH to AAVE (collateral)
   - BORROW ETH from AAVE
   - FLASH_REPAY
2. Transfer margin → SHORT ETH perp
3. Strategy config widget → show target leverage 2.5x, hedged=true
4. Positions: aWEETH collateral + ETH debt + perp SHORT
5. Risk: HF = 1.52, LTV = 80%, liquidation at HF < 1.0

**What should respond:**

- [ ] Flash loan P&L preview shows gross/fee/gas/net before execution
- [ ] Trade history shows atomic bundle (all steps at same timestamp)
- [ ] Position shows collateral, debt, perp with health factor
- [ ] Risk tab shows HF in time series (if toggled to chart)
- [ ] Config widget shows all recursive params
- [ ] Alert fires if HF drops below 1.25

### 5. Rebalance Flow

**User actions:**

1. Wallet summary shows treasury at 35% (above 20% target)
2. Rebalance button → preview dialog shows allocations
3. Confirm → instructions generated for each strategy
4. Trade history shows all rebalance instructions

**What should respond:**

- [ ] Rebalance preview shows per-strategy capital movement
- [ ] After confirm, trade history populates with TRANSFER instructions
- [ ] Treasury % moves toward target in wallet summary
- [ ] Positions update with increased allocations

### 6. Reconciliation

**User actions:**

1. Navigate to reconciliation (markets tab or dedicated view)
2. See DeFi breaks: AAVEV3 position difference, Uniswap fee discrepancy
3. Click Accept/Reject/Investigate on pending records
4. Status updates

**What should respond:**

- [ ] DeFi venues appear in filter dropdown
- [ ] Accept/Reject buttons update status
- [ ] Resolved records move to resolved state

## Test Specifications

### Unit Tests (per widget)

```typescript
// Trade History Widget
describe("DeFiTradeHistoryWidget", () => {
  it("renders trade history rows from context");
  it("shows instant P&L decomposition (gross, slippage, gas, fees, net)");
  it("shows running P&L total that accumulates correctly");
  it("color-codes positive/negative P&L");
  it("shows instruction type badges with correct colors");
});

// Rebalance Dialog
describe("DeFiRebalanceDialog", () => {
  it("shows treasury current vs target percentage");
  it("shows per-strategy allocation with proposed changes");
  it("shows total instructions and gas estimate");
  it("calls onConfirm when Deploy/Reduce button clicked");
  it("shows Deploy for treasury high, Reduce for treasury low");
});

// Strategy Config Widget
describe("DeFiStrategyConfigWidget", () => {
  it("renders strategy selector with 4 demo strategies");
  it("shows correct config form per strategy type");
  it("RECURSIVE_STAKED_BASIS shows hedged toggle and reward mode");
  it("Save Config shows toast");
  it("Promote from Backtest shows toast");
});

// Book Order Form (DeFi mode)
describe("BookOrderForm DeFi", () => {
  it("shows instruction type dropdown when category is defi");
  it("filters algo dropdown based on selected instruction type");
  it("shows max slippage selector");
  it("hides Buy/Sell buttons in DeFi mode");
  it("keeps CeFi order form unchanged");
});

// Alerts (DeFi)
describe("AlertsTable DeFi", () => {
  it("shows DeFi alerts (HF low, funding negative, treasury, IL, depeg)");
  it("DeFi alerts have correct severity badges");
  it("DeFi alerts coexist with CeFi alerts");
});

// Risk Tab (DeFi section)
describe("RiskKpiStrip DeFi", () => {
  it("shows DeFi delta exposure cards when DeFi strategies active");
  it("shows strategy risk profiles table with color-coded badges");
  it("hides DeFi section when no DeFi strategies");
});

// Positions Tab (DeFi columns)
describe("PositionsTable DeFi", () => {
  it("shows Net Delta column for DeFi positions");
  it("shows Health Factor column with color coding");
  it("DeFi positions coexist with CeFi positions");
});

// Reconciliation (DeFi)
describe("ReconciliationTable DeFi", () => {
  it("includes DeFi venues in filter");
  it("shows balance and gas break types");
  it("Accept/Reject buttons work for pending records");
});
```

### Integration Tests

```typescript
// Full demo flow
describe("DeFi Demo E2E", () => {
  it("Lending: execute LEND → see position → see interest accruing");
  it("Basis: SWAP + TRANSFER + TRADE → net delta near zero");
  it("Rebalance: treasury high → preview → confirm → positions update");
  it("Reconciliation: DeFi break → accept → status resolved");
  it("Flash loan: build bundle → preview P&L → execute → trade history");
  it("Config: select strategy → view config → save → toast");
});
```

## Mock Data Sources

All mock data is in `lib/mocks/fixtures/`:

| File                | What                                                            |
| ------------------- | --------------------------------------------------------------- |
| `defi-lending.ts`   | 5 lending protocols with canonical venue_ids                    |
| `defi-swap.ts`      | Swap tokens + route with algo_type                              |
| `defi-liquidity.ts` | 5 LP pools with venue_ids                                       |
| `defi-staking.ts`   | 3 staking protocols with venue_ids                              |
| `defi-transfer.ts`  | 11 chains, 6 tokens, 5 bridge protocols                         |
| `defi-risk.ts`      | Risk profiles, delta, treasury, rebalance, recon, trade history |
| `mock-data-seed.ts` | DeFi alerts (5), positions (via context), strategies            |

## Key Architecture Notes

- **All IDs are canonical** — strategy IDs match backend, venue IDs match UAC, instrument IDs match canonical format
- **Instruction type → algo mapping** — `INSTRUCTION_ALGO_MAP` in `lib/types/defi.ts` defines which algos are available per instruction type
- **Mock execution** routes through `placeMockOrder()` in `lib/api/mock-trade-ledger.ts` — when backend is ready, replace this with `POST /api/defi/execute`
- **OpenAPI sync** validates that our frontend types match the backend — run after any backend enum changes
- **Strategy families tab is LOCKED** — don't touch, don't expose strategy management there
- **DeFi context** (`defi-data-context.tsx`) is the single source of state for all DeFi widgets
