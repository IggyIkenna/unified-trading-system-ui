# Testing Guide

## Overview

This document describes the testing strategy for the trading dashboard to ensure:
1. Every button/interactive element has a working handler
2. Every filter properly propagates to downstream components
3. Every dialog has confirm/cancel actions
4. Every form submission provides feedback

## Test Categories

### Unit Tests (`__tests__/components/`)
Individual component tests that verify:
- Props are correctly received and rendered
- Event handlers are called with correct arguments
- State changes reflect in UI
- Edge cases are handled

### Integration Tests (`__tests__/integration/`)
Tests that verify components work together:
- Filter propagation from context to child components
- Data flow through the component tree
- State synchronization across components

### Audit Tests (`__tests__/audit/`)
Automated audits that catch common issues:
- Buttons without onClick handlers
- Forms without onSubmit handlers
- Dialogs without action buttons
- Inputs without onChange handlers

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (during development)
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Run specific test category
pnpm test:unit
pnpm test:integration
pnpm test:audit

# Run in CI mode
pnpm test:ci
```

## Test Utilities

### `lib/testing/test-utils.tsx`

#### `auditInteractiveElements(container)`
Scans a rendered component and returns all interactive elements with their handler status.

```tsx
import { auditInteractiveElements } from "@/lib/testing/test-utils"

const { buttons, links, inputs, selects } = auditInteractiveElements(container)

// Check for orphaned buttons
const orphanedButtons = buttons.filter(b => !b.hasHandler && !b.disabled)
```

#### `assertAllButtonsHaveHandlers(container)`
Throws an error if any non-disabled button lacks a handler.

```tsx
import { assertAllButtonsHaveHandlers } from "@/lib/testing/test-utils"

it("should have handlers on all buttons", () => {
  const { container } = render(<MyComponent />)
  assertAllButtonsHaveHandlers(container) // Throws if any button is orphaned
})
```

#### `renderWithProviders(ui, options)`
Renders a component with all necessary providers.

```tsx
import { renderWithProviders } from "@/lib/testing/test-utils"

const { user } = renderWithProviders(<MyComponent />, {
  initialContext: { strategyIds: ["s1", "s2"] }
})

await user.click(screen.getByText("Submit"))
```

## Writing Tests

### Testing Button Handlers

```tsx
describe("MyComponent", () => {
  it("should call onAction when button is clicked", async () => {
    const onAction = jest.fn()
    const user = userEvent.setup()
    
    render(<MyComponent onAction={onAction} />)
    
    await user.click(screen.getByRole("button", { name: /submit/i }))
    
    expect(onAction).toHaveBeenCalled()
  })
})
```

### Testing Filter Propagation

```tsx
describe("FilterPropagation", () => {
  it("should filter data when strategy is selected", () => {
    const allData = [{ strategyId: "s1" }, { strategyId: "s2" }]
    const selectedIds = ["s1"]
    
    const filtered = allData.filter(d => 
      selectedIds.length === 0 || selectedIds.includes(d.strategyId)
    )
    
    expect(filtered).toHaveLength(1)
  })
})
```

### Testing Dialog Actions

```tsx
describe("ConfirmDialog", () => {
  it("should have confirm and cancel buttons", async () => {
    render(<ConfirmDialog open={true} />)
    
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
  })
  
  it("should call onConfirm when confirmed", async () => {
    const onConfirm = jest.fn()
    const user = userEvent.setup()
    
    render(<ConfirmDialog open={true} onConfirm={onConfirm} />)
    
    await user.click(screen.getByRole("button", { name: /confirm/i }))
    
    expect(onConfirm).toHaveBeenCalled()
  })
})
```

## ESLint Rules

### `require-button-handler`
Warns when a `<button>` element doesn't have an onClick handler.

### `require-filter-prop`
Warns when data display components don't accept filter props.

To enable:
```js
// eslint.config.js
module.exports = {
  plugins: {
    "trading-dashboard": require("./eslint-rules"),
  },
  rules: {
    "trading-dashboard/require-button-handler": "warn",
    "trading-dashboard/require-filter-prop": "warn",
  },
}
```

## Best Practices

### 1. Test User Flows, Not Implementation
```tsx
// Good: Tests what user sees
expect(screen.getByText("Success!")).toBeInTheDocument()

// Avoid: Tests internal state
expect(component.state.isSuccess).toBe(true)
```

### 2. Use Testing Library Queries Correctly
```tsx
// Preferred order:
// 1. getByRole - most accessible
// 2. getByLabelText - for form fields
// 3. getByText - for text content
// 4. getByTestId - last resort

const button = screen.getByRole("button", { name: /submit/i })
```

### 3. Always Test Loading and Error States
```tsx
it("should show loading state", () => {
  render(<MyComponent isLoading />)
  expect(screen.getByRole("progressbar")).toBeInTheDocument()
})

it("should show error state", () => {
  render(<MyComponent error="Something went wrong" />)
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})
```

### 4. Test Filter Edge Cases
```tsx
it("should show all items when filter is empty", () => { /* ... */ })
it("should show no items when filter matches nothing", () => { /* ... */ })
it("should handle single item filter", () => { /* ... */ })
it("should handle multiple item filter", () => { /* ... */ })
```

## Coverage Requirements

- **Branches**: 50% minimum
- **Functions**: 50% minimum
- **Lines**: 50% minimum
- **Statements**: 50% minimum

Run `pnpm test:coverage` to see current coverage.

## CI Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

The CI pipeline will fail if:
- Any test fails
- Coverage drops below thresholds
- ESLint rules are violated
