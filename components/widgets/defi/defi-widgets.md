# DeFi Operations — Widget Decomposition Spec

**Page:** `app/(platform)/services/trading/defi/page.tsx`
**Component:** `components/trading/defi-ops-panel.tsx`
**Tier:** 3 (low priority — tab-per-operation pattern, moderate complexity)

---

## 1. Page Analysis

| Metric           | Value                                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page lines       | 19 (thin wrapper with header)                                                                                                                                                                                  |
| Component lines  | ~1,542 (defi-ops-panel.tsx)                                                                                                                                                                                    |
| Sections visible | 6 tabs: Lending, Swap, Liquidity, Staking, Flash Loans, Transfer (send/bridge)                                                                                                                                 |
| Data hooks used  | None — 100% inline mock data                                                                                                                                                                                   |
| Inline mock data | `LENDING_PROTOCOLS` (3 protocols × assets), `SWAP_TOKENS`, `MOCK_SWAP_ROUTE`, `LIQUIDITY_POOLS` (5 pools), `STAKING_PROTOCOLS` (3), `FEE_TIERS`, `FLASH_OPERATION_TYPES`, `DEFI_CHAINS`, `MOCK_TOKEN_BALANCES` |
| Sub-components   | 6 inline tab components: `LendingTab`, `SwapTab`, `LiquidityTab`, `StakingTab`, `FlashLoanTab`, `TransferTab`                                                                                                  |
| External imports | `placeMockOrder`, `toast`                                                                                                                                                                                      |

Each tab is a self-contained form with its own state. The `DeFiOpsPanel` wraps them in a Card with a 6-column tab strip.

---

## 2. Widget Decomposition

| id                    | label               | description                                                                            | icon             | minW | minH | defaultW | defaultH | singleton |
| --------------------- | ------------------- | -------------------------------------------------------------------------------------- | ---------------- | ---- | ---- | -------- | -------- | --------- |
| `defi-lending`        | DeFi Lending        | Protocol selector, lend/borrow/withdraw/repay, APY display, health factor preview      | `Landmark`       | 3    | 4    | 4        | 6        | yes       |
| `defi-swap`           | DeFi Swap           | Token pair selector, amount input, slippage, route display with price impact and gas   | `ArrowLeftRight` | 3    | 4    | 4        | 6        | yes       |
| `defi-liquidity`      | Liquidity Provision | Add/remove liquidity, pool selector, fee tier, price range, pool TVL/APR info          | `Droplets`       | 3    | 5    | 4        | 7        | yes       |
| `defi-staking`        | Staking             | Stake/unstake, protocol selector, APY, annual yield, TVL, unbonding info               | `Coins`          | 3    | 4    | 4        | 6        | yes       |
| `defi-flash-loans`    | Flash Loan Builder  | Multi-step flash loan bundle with borrow/repay legs, operation steps, P&L preview      | `Zap`            | 4    | 5    | 6        | 7        | yes       |
| `defi-transfer`       | Transfer & Bridge   | Send tokens (single chain) or bridge cross-chain with protocol selection, gas estimate | `Send`           | 3    | 4    | 4        | 6        | yes       |
| `defi-wallet-summary` | Wallet Summary      | Token balances, connected wallet, chain selector                                       | `Wallet`         | 3    | 2    | 4        | 2        | yes       |
| `defi-rates-overview` | Rates Overview      | Protocol APY comparison table across lending, staking, LP yields                       | `BarChart3`      | 4    | 3    | 8        | 4        | yes       |

---

## 3. Data Context Shape

```typescript
interface DeFiData {
  // Wallet
  connectedWallet: string | null;
  selectedChain: string;
  setSelectedChain: (c: string) => void;
  tokenBalances: Record<string, number>;

  // Lending
  lendingProtocols: LendingProtocol[];
  selectedLendingProtocol: string;
  setSelectedLendingProtocol: (p: string) => void;
  healthFactor: number;

  // Swap
  swapTokens: string[];
  swapRoute: SwapRoute | null;

  // Liquidity
  liquidityPools: LiquidityPool[];

  // Staking
  stakingProtocols: StakingProtocol[];

  // Flash loans
  flashSteps: FlashLoanStep[];
  addFlashStep: () => void;
  removeFlashStep: (id: string) => void;
  updateFlashStep: (id: string, field: string, value: string) => void;
  flashPnl: { grossProfit: number; flashFee: number; gasEstimate: number; netPnl: number };

  // Transfer
  transferMode: "send" | "bridge";
  setTransferMode: (m: "send" | "bridge") => void;

  // Actions
  executeDeFiOrder: (params: DeFiOrderParams) => void;
}
```

---

## 4. Mock Data Instructions

All mock data is inline in `defi-ops-panel.tsx`. Extract:

- `LENDING_PROTOCOLS` → `lib/mocks/fixtures/defi-lending.ts`
- `SWAP_TOKENS`, `MOCK_SWAP_ROUTE` → `lib/mocks/fixtures/defi-swap.ts`
- `LIQUIDITY_POOLS`, `FEE_TIERS` → `lib/mocks/fixtures/defi-liquidity.ts`
- `STAKING_PROTOCOLS` → `lib/mocks/fixtures/defi-staking.ts`
- `FLASH_OPERATION_TYPES` → `lib/config/services/defi.config.ts` (reference data, not mock)
- `DEFI_CHAINS`, `DEFI_TOKENS`, `BRIDGE_PROTOCOLS`, `MOCK_TOKEN_BALANCES` → `lib/mocks/fixtures/defi-transfer.ts`
- Types → `lib/types/defi.ts`

---

## 5. UI/UX Notes

- Each DeFi operation is a vertical form — naturally fits 3-4 column widget width.
- The swap widget should have the token-flip animation (already has the arrow button).
- Health factor preview in lending uses a Current → After visual with color-coded thresholds — keep this; it's a good DeFi UX pattern.
- Flash loan builder needs step reordering — draggable steps would improve UX but are not required for initial widgetization.
- The `defi-rates-overview` widget is a new addition — useful for comparing yields across protocols at a glance.
- Token balance percentage buttons (25/50/75/100%) in staking are a good touch — replicate in other DeFi widgets.

---

## 6. Collapsible Candidates

| Section                      | Why                                                         |
| ---------------------------- | ----------------------------------------------------------- |
| Flash loan borrow/repay legs | Auto-prepended/appended; informational; collapse by default |
| Route display in swap        | Detailed route info; show only when a route is computed     |
| Bridge fee/time info         | Summary box; collapse in compact mode                       |
| Pool info in liquidity       | TVL/APR summary; secondary to the form                      |

---

## 7. Reusable Component Usage

| Shared widget        | Where used                                                                      |
| -------------------- | ------------------------------------------------------------------------------- |
| `KpiStrip`           | Wallet summary (chain, connected address, total balance), rates overview header |
| `CollapsibleSection` | Flash loan borrow/repay auto-legs, route details, bridge info                   |
| `DataTableWidget`    | Rates overview comparison table                                                 |

---

## 8. Default Preset Layout

```
defi-default:
  defi-wallet-summary:   { x: 0,  y: 0,  w: 12, h: 2 }
  defi-lending:          { x: 0,  y: 2,  w: 4,  h: 6 }
  defi-swap:             { x: 4,  y: 2,  w: 4,  h: 6 }
  defi-staking:          { x: 8,  y: 2,  w: 4,  h: 6 }
  defi-rates-overview:   { x: 0,  y: 8,  w: 8,  h: 4 }
  defi-transfer:         { x: 8,  y: 8,  w: 4,  h: 4 }

defi-advanced:
  defi-wallet-summary:   { x: 0,  y: 0,  w: 12, h: 2 }
  defi-flash-loans:      { x: 0,  y: 2,  w: 6,  h: 7 }
  defi-liquidity:        { x: 6,  y: 2,  w: 6,  h: 7 }
  defi-lending:          { x: 0,  y: 9,  w: 4,  h: 5 }
  defi-swap:             { x: 4,  y: 9,  w: 4,  h: 5 }
  defi-staking:          { x: 8,  y: 9,  w: 4,  h: 5 }
```

---

## 9. Questions to Resolve

1. **Wallet connection** — currently mock (`0x7a23...4f91`). When real wallet integration comes, should the wallet summary widget handle connection or delegate to a platform-level wallet manager?
2. **Flash loan vs bundle builder overlap** — the flash loan tab here and the separate `bundles` page have overlapping functionality. Should they share a common step-builder widget?
3. **Chain switching** — when the user switches chain in the transfer widget, should it affect all DeFi widgets (lending, swap, etc.)? Currently chain selection is only in the transfer tab.
4. **Rates overview: new widget** — this doesn't exist in the current implementation. Should we create it as part of widgetization, or defer?
