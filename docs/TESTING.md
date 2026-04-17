# Testing Guide

Last verified: 2026-04-17

## Overview

This document describes the testing strategy for the trading dashboard to ensure:

1. Every button/interactive element has a working handler
2. Every filter properly propagates to downstream components
3. Every dialog has confirm/cancel actions
4. Every form submission provides feedback

## Stack

- **Vitest 4.1.1** — unit/integration/audit runner (canonical). Jest was fully removed in Phase B.
- **happy-dom 20.x** — DOM environment (NOT jsdom).
- **`pool: "forks"`** — prevents zombie node processes (required by workspace UI rules).
- **@testing-library/react 16** + **@testing-library/user-event 14** — rendering + interaction.
- **Playwright 1.58** — E2E and static smoke tests.
- Tests live under `tests/{unit,integration,audit,e2e}/`. The legacy `__tests__/` directory is empty after the Phase D reorg and should not receive new tests.

## WARNING — quality-gate stubs currently disabled

`pnpm lint` and `pnpm tsc` are **temporary noop stubs** in `package.json` (rollout bypass for a large debt set). They print a message and exit 0 without running any checks. Do not rely on them as a gate.

Until the stubs are restored, invoke the real tools directly:

```bash
pnpm exec tsc --noEmit        # real TypeScript check
pnpm exec eslint .            # real ESLint run
```

CI reviewers: treat a green `pnpm lint` / `pnpm typecheck` in logs as meaningless until this line is removed from `TESTING.md`.

## Test Categories

### Unit Tests (`tests/unit/`)

Individual component tests that verify:

- Props are correctly received and rendered
- Event handlers are called with correct arguments
- State changes reflect in UI
- Edge cases are handled

### Integration Tests (`tests/integration/`)

Tests that verify components work together:

- Filter propagation from context to child components
- Data flow through the component tree
- State synchronization across components

### Audit Tests (`tests/audit/`)

Automated audits that catch common issues:

- Buttons without onClick handlers
- Forms without onSubmit handlers
- Dialogs without action buttons
- Inputs without onChange handlers

### E2E / Static Smoke Tests (`tests/e2e/`)

Playwright drives a real browser against a running dev server (default `http://localhost:3100`).

Two configs exist:

| Config                        | Purpose                                                                                            | testMatch                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `playwright.static.config.ts` | Tier-0 static smoke (route coverage + behaviour audit). Runs `tests/e2e/warmup.setup.ts` globally. | `static-smoke.spec.ts`, `tier0-app-route-coverage.spec.ts`, `tier0-behavior-audit.spec.ts` |
| `playwright.e2e.config.ts`    | Full E2E against an already-running dev server. Serial (`workers: 1`).                             | All specs in `tests/e2e/`                                                                  |

Neither config starts the dev server — start it first (e.g. `bash scripts/dev-tiers.sh --tier 0` or `pnpm dev`).

## Running Tests

```bash
# Vitest (unit + integration + audit)
pnpm test                 # interactive/watch by default
pnpm test:watch           # explicit watch
pnpm test:coverage        # v8 coverage into build-artifacts/coverage/
pnpm test:ci              # single run + coverage (CI mode)

# Per-project (Vitest project filter)
pnpm test:unit
pnpm test:integration
pnpm test:audit

# Playwright
pnpm test:e2e                                                     # default config
pnpm test:e2e:ui                                                  # Playwright UI mode
pnpm test:e2e:headed                                              # headed browser
npx playwright test --config playwright.static.config.ts          # Tier-0 static smoke
npx playwright test --config playwright.e2e.config.ts             # E2E vs running server

# Everything
pnpm test:all             # Vitest CI + Playwright default
```

Vitest config (`vitest.config.ts`) includes `tests/**/*.{test,spec}.{ts,tsx}` and excludes `tests/e2e/**`.

## Test Utilities

### `lib/testing/test-utils.tsx`

Re-exports everything from `@testing-library/react` plus `userEvent`. Adds the helpers below.

#### `renderWithProviders(ui, options)`

Renders a component with all necessary providers and returns a configured `userEvent` instance.

```tsx
import { renderWithProviders, screen } from "@/lib/testing/test-utils";

const { user } = renderWithProviders(<MyComponent />, {
  initialContext: { strategyIds: ["s1", "s2"] },
});

await user.click(screen.getByText("Submit"));
```

`initialContext` accepts `Partial<MockTradingContext>`: `{ mode, organizationIds, clientIds, strategyIds, asOfDatetime }`.

#### `auditInteractiveElements(container)`

Scans a rendered component and returns all interactive elements with their handler status.

```tsx
import { auditInteractiveElements } from "@/lib/testing/test-utils";

const { buttons, links, inputs, selects } = auditInteractiveElements(container);

// Check for orphaned buttons
const orphanedButtons = buttons.filter((b) => !b.hasHandler && !b.disabled);
```

#### `assertAllButtonsHaveHandlers(container)`

Throws if any non-disabled button lacks a handler.

```tsx
import { assertAllButtonsHaveHandlers } from "@/lib/testing/test-utils";

it("should have handlers on all buttons", () => {
  const { container } = render(<MyComponent />);
  assertAllButtonsHaveHandlers(container);
});
```

#### Other exports

- `generateInteractiveElementsReport(container)` — human-readable audit report string.
- `testFilterPropagation(container, filterSelector, attr, value)` — clicks a filter and checks downstream `[data-*]` attributes.
- `assertFilterAffectsData(before, after, description)` — throws when a filter has no effect.
- `createMockStrategy(overrides?)`, `createMockClient(overrides?)` — mock data generators.
- `TestWrapper`, `defaultMockContext`, `MockTradingContext` — provider wrapper and context types.

## Writing Tests

Use Vitest's `vi` (not `jest`). With `globals: true` in `vitest.config.ts`, `describe` / `it` / `expect` are available without import.

### Testing Button Handlers

```tsx
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("MyComponent", () => {
  it("calls onAction when the button is clicked", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(<MyComponent onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onAction).toHaveBeenCalled();
  });
});
```

### Testing Filter Propagation

```tsx
describe("FilterPropagation", () => {
  it("filters data when a strategy is selected", () => {
    const allData = [{ strategyId: "s1" }, { strategyId: "s2" }];
    const selectedIds = ["s1"];

    const filtered = allData.filter((d) => selectedIds.length === 0 || selectedIds.includes(d.strategyId));

    expect(filtered).toHaveLength(1);
  });
});
```

### Testing Dialog Actions

```tsx
import { vi } from "vitest";

describe("ConfirmDialog", () => {
  it("renders confirm and cancel buttons", () => {
    render(<ConfirmDialog open />);
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onConfirm when confirmed", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(<ConfirmDialog open onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalled();
  });
});
```

### Mocks (Vitest ↔ Jest cheatsheet)

| Jest                    | Vitest                |
| ----------------------- | --------------------- |
| `jest.fn()`             | `vi.fn()`             |
| `jest.spyOn(obj, "m")`  | `vi.spyOn(obj, "m")`  |
| `jest.mock("mod", fac)` | `vi.mock("mod", fac)` |
| `jest.useFakeTimers()`  | `vi.useFakeTimers()`  |
| `jest.clearAllMocks()`  | `vi.clearAllMocks()`  |

## ESLint Rules

### Custom rules — planned, verify activation

Two custom rules exist on disk at `eslint-rules/` but are **not currently wired up** in `eslint.config.mjs`:

- `eslint-rules/require-button-handler.js` — warns when a `<button>` lacks an `onClick` handler.
- `eslint-rules/require-filter-prop.js` — warns when data-display components do not accept filter props.
- `eslint-rules/index.js` — plugin barrel.

`eslint.config.mjs` currently only composes `eslint-config-next` + `eslint-config-prettier` and ignores `_reference/**`, `coverage/**`, `lib/types/api-generated.ts`. To activate the custom rules, add a plugin entry (flat-config form):

```js
// eslint.config.mjs (planned)
import tradingDashboard from "./eslint-rules/index.js";

export default [
  ...nextConfig,
  {
    plugins: { "trading-dashboard": tradingDashboard },
    rules: {
      "trading-dashboard/require-button-handler": "warn",
      "trading-dashboard/require-filter-prop": "warn",
    },
  },
  eslintConfigPrettier,
];
```

Until that lands, the rules do not run even if you invoke `pnpm exec eslint .`.

## Best Practices

### 1. Test User Flows, Not Implementation

```tsx
// Good: tests what the user sees
expect(screen.getByText("Success!")).toBeInTheDocument();

// Avoid: tests internal state
expect(component.state.isSuccess).toBe(true);
```

### 2. Use Testing Library Queries Correctly

Preferred order: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort).

```tsx
const button = screen.getByRole("button", { name: /submit/i });
```

### 3. Always Test Loading and Error States

```tsx
it("shows a loading state", () => {
  render(<MyComponent isLoading />);
  expect(screen.getByRole("progressbar")).toBeInTheDocument();
});

it("shows an error state", () => {
  render(<MyComponent error="Something went wrong" />);
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### 4. Test Filter Edge Cases

```tsx
it("shows all items when filter is empty", () => {
  /* ... */
});
it("shows no items when filter matches nothing", () => {
  /* ... */
});
it("handles single-item filter", () => {
  /* ... */
});
it("handles multi-item filter", () => {
  /* ... */
});
```

## Coverage Requirements

- **Branches**: 50% minimum
- **Functions**: 50% minimum
- **Lines**: 50% minimum
- **Statements**: 50% minimum

Run `pnpm test:coverage` to see current coverage (output: `build-artifacts/coverage/`).

## CI Integration

Tests run automatically on:

- Pull requests
- Pushes to main

The CI pipeline will fail if:

- Any Vitest or Playwright test fails
- Coverage drops below thresholds
- ESLint rules are violated (once `pnpm lint` is un-stubbed — see the WARNING at the top)
