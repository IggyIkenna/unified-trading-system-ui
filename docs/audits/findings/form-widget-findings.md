# FormWidget (form class) — Audit Findings

**Date:** 2026-04-16
**Auditor:** Claude Agent
**Spec section:** BP-2 Migration Spec, S 2
**Status:** AUDIT COMPLETE — ready for migration

---

## 1. Widget Inventory (actual vs spec)

| #   | Widget ID              | File                                             | Actual Lines | Spec Lines | Domain      | Data Source             | Classification        |
| --- | ---------------------- | ------------------------------------------------ | ------------ | ---------- | ----------- | ----------------------- | --------------------- |
| 1   | `order-entry`          | `terminal/order-entry-widget.tsx`                | 212          | 212        | Terminal    | `useTerminalData()`     | Full form             |
| 2   | `book-order-form`      | `book/book-order-form-widget.tsx`                | 250          | 250        | Book        | `useBookTradeData()`    | Full form             |
| 3   | `book-algo-config`     | `book/book-algo-config-widget.tsx`               | 194          | 194        | Book        | `useBookTradeData()`    | Full form             |
| 4   | `book-record-details`  | `book/book-record-details-widget.tsx`            | **60**       | ~150       | Book        | `useBookTradeData()`    | Full form (small)     |
| 5   | `defi-lending`         | `defi/defi-lending-widget.tsx`                   | 272          | 272        | DeFi        | `useDeFiData()`         | Full form             |
| 6   | `defi-swap`            | `defi/defi-swap-widget.tsx`                      | 365          | 365        | DeFi        | `useDeFiData()`         | Full form             |
| 7   | `defi-liquidity`       | `defi/defi-liquidity-widget.tsx`                 | 183          | ~250       | DeFi        | `useDeFiData()`         | Full form             |
| 8   | `defi-staking`         | `defi/defi-staking-widget.tsx`                   | 153          | ~200       | DeFi        | `useDeFiData()`         | Full form             |
| 9   | `defi-flash-loans`     | `defi/defi-flash-loans-widget.tsx`               | 248          | ~300       | DeFi        | `useDeFiData()`         | Full form             |
| 10  | `defi-transfer`        | `defi/defi-transfer-widget.tsx`                  | 407          | 407        | DeFi        | `useDeFiData()`         | Full form             |
| 11  | `defi-strategy-config` | `defi/defi-strategy-config-widget.tsx`           | **1,157**    | 1,157      | DeFi        | `defi-strategy-store`   | Full form (oversized) |
| 12  | `defi-staking-rewards` | `defi/defi-staking-rewards-widget.tsx`           | 165          | ~200       | DeFi        | `useDeFiData()`         | Full form             |
| 13  | `accounts-transfer`    | `accounts/accounts-transfer-widget.tsx`          | 426          | 426        | Accounts    | `useAccountsData()`     | Full form             |
| 14  | `options-trade-panel`  | `options/options-trade-panel-widget.tsx`         | **10**       | 10         | Options     | `useOptionsData()`      | **Thin shell**        |
| 15  | `futures-trade-panel`  | `options/options-futures-trade-panel-widget.tsx` | **27**       | 27         | Options     | `useOptionsData()`      | **Thin shell**        |
| 16  | `pred-trade-panel`     | `predictions/pred-trade-panel-widget.tsx`        | **25**       | 25         | Predictions | `usePredictionsData()`  | **Thin shell**        |
| 17  | `cefi-strategy-config` | `strategies/cefi-strategy-config-widget.tsx`     | **567**      | 567        | Strategies  | Standalone (no context) | Full form             |

---

## 2. Thin Shells (DO NOT migrate to base)

Three widgets are thin shells that delegate to domain components. Per spec instructions, these should NOT be migrated to a base. Only apply cross-cutting requirements (S 0).

| Widget                | Lines | Delegates to                                                                                       |
| --------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| `options-trade-panel` | 10    | `<TradePanel instrument={selectedInstrument} />` from `@/components/trading/options-futures-panel` |
| `futures-trade-panel` | 27    | `<TradePanel instrument={instrument} />` from same component + `futureRowToInstrument` adapter     |
| `pred-trade-panel`    | 25    | `<MarketSelector>` + `<TradePanelInner>` from `@/components/trading/predictions/trade-tab`         |

**Action:** Apply S 0.1 (error boundary in grid) and S 0.2 (loading state) only. No base migration.

---

## 3. Shared Patterns (what goes in the base)

### 3.1 Form State Management

All 14 full-form widgets use raw `useState` for every form field. Zero use of `react-hook-form`, `zod`, `formik`, or any form library.

### 3.2 Submit Pattern

Every form follows the same submit flow:

```
<Button onClick={() => { contextMethod(payload); clearFields(); toast.success(...); }}>
```

- No `isSubmitting` state: submit button is never disabled during async submission
- No error handling: no `try/catch` around submit, no error display on failure
- Success feedback: most DeFi widgets use `toast.success()` from sonner; Book/Terminal do not

### 3.3 Layout

All full-form widgets share:

- Top-level `<div className="space-y-3 p-1">` (or `p-2`, `px-1 pb-1`)
- shadcn `Input`, `Select`, `Button` components throughout
- Submit button at bottom: `<Button className="w-full" disabled={amountNum <= 0}>`
- No `<form>` element anywhere — all use `<div>` + `onClick` handlers

### 3.4 Missing States (confirmed across all 14 full-form widgets)

| State                             | Count with it             | Count without |
| --------------------------------- | ------------------------- | ------------- |
| Loading skeleton                  | **0**                     | 14            |
| Submit-in-progress (isSubmitting) | **0**                     | 14            |
| Error display after failure       | **0**                     | 14            |
| Input validation                  | **0**                     | 14            |
| Empty state                       | N/A (forms always render) | N/A           |

### 3.5 Base Should Provide

| Feature          | Implementation                                                                   |
| ---------------- | -------------------------------------------------------------------------------- |
| Layout shell     | `<div className="space-y-3 p-1">` wrapper with consistent padding                |
| Submit state     | `isSubmitting` boolean, disables form + shows spinner during submission          |
| Error banner     | Dismissible error message after failed submission                                |
| Success feedback | Standardise on `toast.success()` from sonner                                     |
| Loading skeleton | When `isLoading` prop is true, render skeleton placeholder                       |
| Form wrapper     | Optional `<form>` element with `onSubmit` for keyboard support (Enter to submit) |

### 3.6 What Stays in Each Child

- Form fields and their layout (completely different across widgets)
- Form state shape (each form has unique fields)
- Submit handler logic (which context method to call, what payload to construct)
- Mode switching (`accounts-transfer` has 4 modes, `defi-swap` has basis-trade modes)
- Domain-specific preview panels (health factor, route details, P&L preview)
- Domain-specific validation rules (if added later)

---

## 4. Mock Import Violations (S 0.3)

### 4.1 Direct mock imports in widget files

| Widget             | Mock Import                                 | What's Imported                                                                               | Action                                                                                                              |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `defi-lending`     | `@/lib/mocks/fixtures/defi-protocol-params` | `calculateHealthFactorDelta`, `getAssetParams`                                                | Move to `defi-data-context.tsx` — these are calculation functions, not pure data                                    |
| `defi-swap`        | `@/lib/mocks/fixtures/defi-transfer`        | `DEFI_CHAINS`, `GAS_TOKEN_MIN_THRESHOLDS`, `MOCK_CHAIN_PORTFOLIOS`                            | `DEFI_CHAINS` is config -> `lib/config/services/defi.config.ts`. Gas/portfolio mock data -> `defi-data-context.tsx` |
| `defi-swap`        | `@/lib/mocks/fixtures/defi-basis-trade`     | `BASIS_TRADE_MOCK_DATA`, `calculateBasisTradeFundingImpact`, `calculateBasisTradeCostOfCarry` | Move calculations + data to `defi-data-context.tsx`                                                                 |
| `defi-swap`        | `@/lib/mocks/fixtures/defi-swap`            | `generateSwapRoute`, `getMockPrice`                                                           | Move to `defi-data-context.tsx` (route generation is data logic)                                                    |
| `defi-flash-loans` | `@/lib/mocks/fixtures/defi-swap`            | `SWAP_TOKENS`                                                                                 | Reference data -> `lib/config/services/defi.config.ts` or expose via `useDeFiData()`                                |
| `defi-transfer`    | `@/lib/mocks/fixtures/defi-transfer`        | `DEFI_CHAINS`, `DEFI_TOKENS`, `GAS_TOKEN_MIN_THRESHOLDS`, `MOCK_CHAIN_PORTFOLIOS`             | `DEFI_CHAINS`/`DEFI_TOKENS` are config -> `defi.config.ts`. Gas/portfolio -> `defi-data-context.tsx`                |
| `defi-transfer`    | `@/lib/mocks/fixtures/defi-swap`            | `getMockPrice`                                                                                | Move to `defi-data-context.tsx`                                                                                     |

### 4.2 Spec accuracy check

- Spec says `defi-staking-rewards` imports from mocks — **INCORRECT**: it uses `useDeFiData()` cleanly, no mock imports
- Spec says `defi-lending` imports from mocks — **CONFIRMED** (protocol params)
- Spec says `defi-swap` imports from mocks — **CONFIRMED** (3 mock files)
- Spec says `defi-transfer` imports from mocks — **CONFIRMED** (2 mock files)
- Spec says `defi-flash-loans` imports from mocks — **CONFIRMED** (SWAP_TOKENS)

### 4.3 Data context also imports mocks (not a widget violation but noted)

`defi-data-context.tsx` imports from 8 mock fixture files. This is acceptable per S 0.3 rules (data context is the correct place for mock gating), but should be noted for future cleanup when real data sources are connected.

---

## 5. Decomposition Required

### 5.1 defi-strategy-config (1,157 lines)

This widget is severely oversized and must be decomposed. Current structure:

- **15 TypeScript interfaces** for config shapes (lines 42-131)
- **1 `defaultConfig` function** with 15-case switch (lines 132-281)
- **~10 hardcoded constant arrays** (lines 287-299)
- **3 shared form field helpers**: `NumberField`, `CheckboxGroup`, `DropdownField` (lines 305-401)
- **12 per-strategy form renderers** (lines 407-875)
- **Main widget component** (lines 888-1157)

**Recommended decomposition:**

| Extract to                                      | Contents                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `lib/types/defi-strategy-config.ts`             | All 15 config interfaces + `StrategyConfig` union                                  |
| `lib/config/services/defi-strategy-defaults.ts` | `defaultConfig()`, strategy families, constant arrays                              |
| `components/shared/form-fields.tsx`             | `NumberField`, `CheckboxGroup`, `DropdownField` (shared with cefi-strategy-config) |
| `defi/defi-strategy-forms/` directory           | 12 per-strategy form renderers as individual files or grouped by family            |
| `defi/defi-strategy-config-widget.tsx`          | Main widget (strategy selector + form dispatcher + action buttons) ~100 lines      |

### 5.2 cefi-strategy-config (567 lines)

Same structure as defi-strategy-config but for CeFi strategies:

- **11 config interfaces** (lines 88-171)
- **Duplicated `NumberField`, `CheckboxGroup`, `DropdownField`** — identical to defi-strategy-config
- **11 per-family form renderers** (lines 317-441)
- **Standalone state** — uses local `useState` with no data context

**Recommended decomposition:** Same approach. Extract shared form field helpers to a single shared file, break out per-family forms.

### 5.3 Duplicated Code

`NumberField`, `CheckboxGroup`, and `DropdownField` are **character-for-character identical** in both `defi-strategy-config-widget.tsx` and `cefi-strategy-config-widget.tsx`. These must be extracted to `components/shared/form-fields.tsx`.

---

## 6. Other Issues Found

### 6.1 No `<form>` elements

None of the 14 full-form widgets use a `<form>` element. All use `<div>` with `onClick` handlers. This means:

- No keyboard submission (Enter key does nothing)
- No native form validation or accessibility
- No `onSubmit` event

**Recommendation:** The FormWidget base should optionally wrap content in `<form onSubmit>` to enable keyboard submission.

### 6.2 Inconsistent padding

- Most use `p-1` top-level padding
- `order-entry` uses `Card > CardContent` with `px-3 pb-3 pt-2`
- `book-order-form` uses `p-2`
- `accounts-transfer` uses `px-1 pb-1`

The base should standardise this.

### 6.3 `defi-strategy-config` uses a store, not context

Unlike all other form widgets that use a domain `use*Data()` hook, `defi-strategy-config` imports directly from `@/lib/stores/defi-strategy-store`. This is not a violation but is an architectural divergence worth noting. The base's `isLoading` and error handling patterns may not apply directly.

### 6.4 `cefi-strategy-config` is fully disconnected

`cefi-strategy-config` has no data context and no store. All state is local `useState`. Configs are initialized from `defaultConfigFor()` and never persisted. The "Save Config" and "Deploy" buttons only fire toasts. This widget needs to be wired into `strategies-data-context.tsx` when real persistence is added.

### 6.5 `book-record-details` is much smaller than spec estimate

Spec says ~150 lines; actual is 60 lines. It's a simple 3-field form (counterparty, source reference, fee) wrapped in a `CollapsibleSection`. It can still adopt the base but the benefit is minimal.

---

## 7. Migration Plan Summary

### Migrate to FormWidget base (14 widgets):

| Widget                 | Complexity    | Mock Cleanup  | Notes                                                 |
| ---------------------- | ------------- | ------------- | ----------------------------------------------------- |
| `order-entry`          | Low           | None          | Clean, well-structured                                |
| `book-order-form`      | Medium        | None          | Multi-mode (execute/record), multi-category tabs      |
| `book-algo-config`     | Low           | None          | Conditional rendering by execution mode and DeFi/CeFi |
| `book-record-details`  | Trivial       | None          | 60 lines, minimal benefit from base                   |
| `defi-lending`         | Medium        | Yes (1 file)  | Health factor preview section                         |
| `defi-swap`            | High          | Yes (3 files) | Basis-trade modes, SOR route rendering                |
| `defi-liquidity`       | Low           | None          | Clean                                                 |
| `defi-staking`         | Low           | None          | Clean                                                 |
| `defi-flash-loans`     | Medium        | Yes (1 file)  | Multi-step builder, not a traditional form            |
| `defi-transfer`        | High          | Yes (2 files) | 2 modes (send/bridge), bridge route selection         |
| `defi-strategy-config` | **Very High** | None          | Must decompose first (1,157 lines)                    |
| `defi-staking-rewards` | Low           | None          | Action cards, not a traditional form; assess fit      |
| `accounts-transfer`    | Medium        | None          | 4 transfer type modes                                 |
| `cefi-strategy-config` | High          | None          | Must decompose first (567 lines), wire into context   |

### Do NOT migrate (3 thin shells):

| Widget                | Lines | Action                       |
| --------------------- | ----- | ---------------------------- |
| `options-trade-panel` | 10    | Apply S 0 cross-cutting only |
| `futures-trade-panel` | 27    | Apply S 0 cross-cutting only |
| `pred-trade-panel`    | 25    | Apply S 0 cross-cutting only |

---

## 8. Migration Order Recommendation

1. **Extract shared form fields** (`NumberField`, `CheckboxGroup`, `DropdownField`) to `components/shared/form-fields.tsx`
2. **Create `FormWidget` base** with layout shell, submit state, error banner, loading skeleton
3. **Migrate clean small widgets first** (defi-staking, defi-liquidity, book-record-details, book-algo-config)
4. **Migrate medium widgets** (order-entry, defi-lending with mock cleanup, accounts-transfer)
5. **Decompose + migrate large widgets** (defi-strategy-config, cefi-strategy-config)
6. **Migrate complex widgets** (defi-swap, defi-transfer, defi-flash-loans — with mock cleanup)
7. **Apply S 0 cross-cutting** to thin shells
