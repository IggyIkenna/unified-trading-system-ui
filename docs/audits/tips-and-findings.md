# Tips & Findings

Agent-facing reference for patterns, conventions, and how-tos discovered during audits and migrations. Each section is self-contained — agents should read the relevant section for the task at hand, not the whole document.

**Last updated:** 2026-04-16 (S0.3 mock cleanup completed for all DeFi widgets)

---

## Index

| #   | Section                                                           | When to read                                                           |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | [Schema-driven strategy config](#1-schema-driven-strategy-config) | Adding/editing strategies, strategy config fields, or option sets      |
| 2   | [FormWidget base pattern](#2-formwidget-base-pattern)             | Adding a new form widget or wrapping an existing one with submit/error |
| 3   | [Mock import rules (S0.3)](#3-mock-import-rules-s03)              | Touching any widget that uses data — must go through data context      |

---

## 1. Schema-driven strategy config

Both strategy config widgets (DeFi + CeFi) use a **schema-driven** renderer. The widget file contains zero per-strategy code — it reads a schema and renders fields dynamically via `SchemaForm`.

### Key files

| File                                            | What it is                                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `lib/config/strategy-config-schemas/types.ts`   | `ConfigFieldSchema` union type, `StrategyConfigSchema`, `buildDefaults()` helper                                        |
| `lib/config/strategy-config-schemas/options.ts` | Shared option arrays — venues, chains, tokens, algos. Single place to add a new value.                                  |
| `lib/config/strategy-config-schemas/defi.ts`    | DeFi strategy schemas (15 strategies) + `DEFI_STRATEGY_FAMILIES` groupings                                              |
| `lib/config/strategy-config-schemas/cefi.ts`    | CeFi strategy schemas (22 strategies) + `CEFI_STRATEGY_FAMILIES` groupings                                              |
| `lib/config/strategy-config-schemas/index.ts`   | Barrel re-export                                                                                                        |
| `components/shared/schema-driven-form.tsx`      | `SchemaForm` — generic renderer that maps field schemas to `NumberField` / `DropdownField` / `CheckboxGroup` / `Switch` |
| `components/shared/form-fields.tsx`             | The actual field components used by `SchemaForm`                                                                        |

### Field types

| `type` value   | Renders         | Required props                                  | Optional props   |
| -------------- | --------------- | ----------------------------------------------- | ---------------- |
| `number`       | `NumberField`   | `key`, `label`, `default` (number)              | `suffix`, `step` |
| `dropdown`     | `DropdownField` | `key`, `label`, `default` (string), `options`   | —                |
| `boolean`      | `Switch`        | `key`, `label`, `default` (boolean)             | —                |
| `multi-select` | `CheckboxGroup` | `key`, `label`, `default` (string[]), `options` | —                |

### Recipes

**Add a new DeFi strategy:**

1. `lib/types/defi.ts` — add ID to `DEFI_STRATEGY_IDS` array, add display name to `STRATEGY_DISPLAY_NAMES`
2. `lib/config/strategy-config-schemas/defi.ts` — add schema entry to `DEFI_STRATEGY_SCHEMAS`, add to a family in `DEFI_STRATEGY_FAMILIES`
3. (Optional) `lib/stores/defi-strategy-store.ts` — add seed data if needed
4. No widget code changes.

**Add a new CeFi strategy:**

1. `lib/config/strategy-config-schemas/cefi.ts` — add schema entry to `CEFI_STRATEGY_SCHEMAS`, add to a family in `CEFI_STRATEGY_FAMILIES`
2. No widget code changes.

**Add a field to an existing strategy:**

1. Append a `ConfigFieldSchema` object to the strategy's `fields` array in the schema file.
2. `SchemaForm` picks it up automatically.

**Add a new option value (venue, chain, token, etc.):**

1. Edit the relevant array in `lib/config/strategy-config-schemas/options.ts`.
2. Every strategy referencing that option set gets the new value.

**Add a new field type (e.g. range slider):**

1. Add a new interface to the `ConfigFieldSchema` union in `types.ts`.
2. Add a new `case` to the `SchemaField` switch in `schema-driven-form.tsx`.
3. All schemas can now use the new type.

### What NOT to do

- Do NOT add per-strategy form components to the widget files. All field rendering goes through `SchemaForm`.
- Do NOT hardcode option arrays in widget files. They belong in `options.ts`.
- Do NOT put display names or family groupings in the widget. They belong in the schema file or `lib/types/defi.ts`.

---

## 2. FormWidget base pattern

`FormWidget` (`components/shared/form-widget.tsx`) is the standard wrapper for any widget that contains a form. `useFormSubmit` is the companion hook for submit-capable forms.

### When to use FormWidget

- Any widget that has form inputs (Select, Input, Checkbox) — even if it has no submit button (use for consistent layout + error banner).
- Pass `error` + `onClearError` from `useFormSubmit()` to get the dismissible error banner.
- Pass `isLoading={true}` to show a skeleton while data loads.
- Pass `className` to override default spacing (e.g. `className="px-1 pb-1"`).

### When to use useFormSubmit

- Any widget with a submit/execute/save button.
- Wrap the submit handler: `onClick={() => handleSubmit(myHandler)}`.
- Add `|| isSubmitting` to the button's `disabled` prop.
- The hook catches errors and surfaces them via the `error` state.

### Pattern

```tsx
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";

export function MyWidget(_props: WidgetComponentProps) {
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();
  // ... state ...

  return (
    <FormWidget error={error} onClearError={clearError}>
      {/* form fields */}
      <Button
        disabled={!isValid || isSubmitting}
        onClick={() =>
          handleSubmit(() => {
            /* submit logic */
          })
        }
      >
        Submit
      </Button>
    </FormWidget>
  );
}
```

### Widgets already migrated

| Widget                    | Has submit | Notes                                            |
| ------------------------- | ---------- | ------------------------------------------------ |
| `defi-staking`            | Yes        | + submit guard                                   |
| `defi-liquidity`          | Yes        | + submit guard                                   |
| ~~`book-record-details`~~ | —          | Merged into `book-order-entry` 2026-04-22 (WU-1) |
| ~~`book-algo-config`~~    | —          | Merged into `book-order-entry` 2026-04-22 (WU-1) |
| `order-entry`             | Yes        | + submit guard, replaced CardContent             |
| `defi-lending`            | Yes        | + submit guard + mock cleanup                    |
| `accounts-transfer`       | Yes        | + submit guard on all 4 modes                    |
| `defi-flash-loans`        | Yes        | + submit guard + S0.3 mock cleanup               |
| `defi-transfer`           | Yes        | + submit guard (send + bridge) + S0.3 cleanup    |
| `defi-swap`               | Yes        | + submit guard + S0.3 cleanup (3 mock files)     |
| `defi-basis-trade`        | Yes        | + submit guard + S0.3 cleanup + types moved      |
| `defi-wallet-summary`     | No         | S0.3 mock cleanup only (no submit)               |

---

## 3. Mock import rules (S0.3)

**Rule:** Widgets must NEVER import from `lib/mocks/` directly. All mock data flows through the domain's `*-data-context.tsx` provider.

**Why:** When real API data sources replace mocks, you swap the implementation inside the data context once. If widgets import mocks directly, every widget becomes a migration point.

**Where mock gating belongs:**

| Data type             | Correct location                         | Example                                                       |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Config constants      | `lib/config/services/<domain>.config.ts` | `DEFI_CHAINS`, `DEFI_TOKENS`, `GAS_TOKEN_MIN_THRESHOLDS`      |
| Reference data arrays | `lib/config/services/<domain>.config.ts` | `SLIPPAGE_OPTIONS`, `FLASH_VENUES`                            |
| Calculation functions | Expose via `use<Domain>Data()` hook      | `getMockPrice`, `generateSwapRoute`, `calculateBasisTrade*()` |
| Mock data objects     | Expose via `use<Domain>Data()` hook      | `chainPortfolios`, `basisTradeMarketData`, `basisTradeAssets` |
| Domain types          | `lib/types/<domain>.ts`                  | `BasisTradeMarketData`, `BasisTradeHistoryEntry`              |

**How to fix a mock violation:**

1. Identify what the widget imports from `lib/mocks/`.
2. Classify each import: is it config/reference-data or calculation/mock-data?
3. Config constants go to `lib/config/services/<domain>.config.ts`.
4. Calculations and mock data get added to the data context interface and exposed through the `use<Domain>Data()` hook.
5. Update the widget to use the data context instead of the direct mock import.
6. Verify no other widget still imports the same mock — if the mock file has zero widget consumers, the cleanup is complete.
