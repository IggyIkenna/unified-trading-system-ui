# Tab: DeFi Ops

**Route:** `/services/trading/defi`
**Page file:** `app/(platform)/services/trading/defi/page.tsx`
**Lines:** 19 | **Status:** Placeholder
**Component:** `components/trading/defi-ops-panel.tsx` — 1,542 lines (the actual implementation)

---

## Current State

Thin page that renders `DeFiOpsPanel`. The component is substantial (1,542 lines) and covers multiple DeFi operation types via internal sub-tabs.

**`DeFiOpsPanel` internal structure:**

- Internal `DeFiTab` union: `lending`, `swap`, `liquidity`, `staking`, `flash`, `transfer`
- Uses `placeMockOrder` from `@/lib/api/mock-trade-ledger` — not wired to `hooks/api`
- Toast notifications via `useToast`
- Tabbed DeFi operations: likely lending/borrowing, token swaps, LP position management, staking, flash loan builder, asset transfers

**Data sources:** `placeMockOrder` (mock only). No real API hooks in the component's opening section.

**Filtering/scoping:** None at page level. Unknown at component level (likely none).

---

## Meeting Review Items

From `trading-defi-ops-combo-builder.md`:

- **Two distinct concepts:** (1) Atomic bundles — DeFi-specific all-or-nothing on-chain transactions; (2) Combo Builder — general multi-leg trade construction (which applies to all asset classes, not just DeFi).
- **Atomic bundles belong here:** DeFi Ops is the right home for on-chain atomic bundle construction. These are inherently DeFi — they depend on smart contract execution atomicity.
- **Combo Builder moves to Bundles tab:** The general cross-asset combo builder (options spreads, sports accumulators, etc.) should live in the Bundles tab, not here.
- **Current DeFi ops scope is right:** Lending, swaps, LP, staking, flash loans, transfers — these are all DeFi-native operations and belong in this tab.

---

## Improvements Needed

1. **Wire to real DeFi API hooks:** Replace `placeMockOrder` with actual DeFi protocol interactions via `hooks/api/`. Priority: lending (Aave), swaps (Uniswap/DEX), LP management, staking. Flash loans and atomic bundles are lower priority initially.
2. **Atomic bundle builder (new sub-tab):** Add an "Atomic Bundle" sub-tab for constructing multi-step DeFi transactions that execute atomically on-chain. This is distinct from the mock order placement that exists now.
3. **On-chain position context:** Show current DeFi protocol positions (Aave health factor, Uniswap LP ranges, staking rewards) before taking action. User needs context before modifying a position.
4. **Gas estimation:** For every DeFi operation, show estimated gas cost before confirming. "This swap will cost ~$8 in gas at current prices."
5. **Protocol risk indicators:** Health factor for lending positions, impermanent loss estimate for LP, slippage for swaps. These are DeFi-specific risk metrics that should be visible before confirming.
6. **Transaction history:** After completing a DeFi operation, link to the transaction on-chain (Etherscan/block explorer) and show it in the Instructions/audit trail.
7. **Global scope integration:** Filter DeFi positions and operations to the currently scoped org/client/strategy.

---

## Asset-Class Relevance

**DeFi only** — this tab is entirely DeFi-specific. Non-DeFi users should see this as locked (with FOMO if subscribed to another tier).

---

## Action

**Rebuild** — the page structure (placeholder + panel component) is fine. The panel itself needs to be wired to real DeFi APIs and the atomic bundle builder needs to be added. The combo builder portion should be extracted to the Bundles tab.
