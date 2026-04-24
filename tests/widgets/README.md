# L1.5 Widget Harness — authoring guide

Per-widget harness tests that fill cert **L6 (Tested)**. Pattern established by the pilot
[defi-lending-widget.test.tsx](defi/defi-lending-widget.test.tsx).

## Scope (what belongs here)

- Single widget rendered in isolation with a mocked data-context.
- Testid mounts, interactive surfaces (clicks, input changes), reactive output.
- Execute-button enable/disable + executeOrder payload shape.
- Empty-state + loading-state branches referenced in cert L0.6/L0.7.

## Out of scope (push elsewhere)

- Real routes → L2 route smoke (`tests/smoke/`, not yet seeded)
- Multi-widget trader flows → L3b strategy specs (`tests/e2e/strategies/`)
- Visual regression → L4 (deferred per rollout plan)
- OpenAPI ↔ fixture shape → L0 contract (`tests/contract/`, not yet seeded)

See [`codex/06-coding-standards/ui-testing-layers.md`](../../../unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md)
for the 8-layer SSOT.

## File layout

```
tests/widgets/
  _helpers/
    mock-<family>-context.ts     # per data-context-family mock factory
  <domain>/
    <widget-id>.test.tsx         # one per widget in widget-registry.ts
```

One file per widget. Filename matches the `widgetId` in
[`docs/manifest/widget-certification/<widget-id>.json`](../../docs/manifest/widget-certification).

## Authoring template (Vitest + happy-dom)

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMock<Family>Data } from "../_helpers/mock-<family>-context";

const mockData = buildMock<Family>Data();

// 1. Mock the data-context hook — tests control the surface the widget reads.
vi.mock("@/components/widgets/<family>/<family>-data-context", () => ({
  use<Family>Data: () => mockData,
}));

// 2. Mock any other non-trivial hooks the widget pulls from globally.
vi.mock("@/hooks/use-active-strategy-id", () => ({
  useActiveStrategyId: () => "STRATEGY_FAMILY@slot-env",
}));

// 3. Silence side-effect libs (toast, analytics, etc.).
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { <WidgetName> } from "@/components/widgets/<family>/<widget-id>-widget";

describe("<widget-id> — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMock<Family>Data()); // reset between tests
  });

  it("mounts root testid", () => {
    render(<<WidgetName> />);
    expect(screen.getByTestId("<widget-id>-widget")).toBeTruthy();
  });

  // ... 5–10 more tests covering cert L0/L1/L4 behaviors
});
```

## What each test should cover

Aim for ~6–10 tests per widget, organized as `describe` blocks:

| Block                | Example assertions                                                 |
| -------------------- | ------------------------------------------------------------------ |
| `render`             | Root testid mounts; empty-state branch; loading-state branch       |
| `<main interaction>` | Toggle operations, change modes, protocol select, asset select     |
| `<reactive output>`  | Amount → expected-output; slider → preview; select → dependent row |
| `<execute / submit>` | Disabled when inputs invalid; enabled when valid; payload shape    |

Keep the test file lean. If an assertion needs a full integration setup (real
provider chain, real store), it belongs in L2/L3, not here.

## Hermeticity rule

Per SSOT: no network calls. `vi.mock` covers all data sources; no `fetch`, no
WebSocket, no timers that hit real services. If the widget uses `useWebSocket`,
assert on its `subscribe`/`unsubscribe` calls against a mock, not a live
connection.

## Coverage gate

Every widget with cert `l0 + l1 + l7 = pass` MUST have a matching test file
under `tests/widgets/`. The coverage gate script reads
`docs/manifest/widget-certification/*.json` and fails on main-merge if a
READY cert has no matching spec. On `feat/*`, this warns.

After landing a new spec, update the widget's cert file:

```diff
   "l6": {
-    "status": null,
-    "by": null,
-    "date": null,
-    "notes": "L6 deferred — tests to be written after L5 human sign-off."
+    "status": "pass",
+    "by": "agent+tests",
+    "date": "YYYY-MM-DD",
+    "notes": "L1.5 harness spec: <N> tests covering <what>. See tests/widgets/<domain>/<widget-id>.test.tsx"
   },
```

## Running

```bash
# One widget
npx vitest run tests/widgets/<domain>/<widget-id>.test.tsx

# All widget harness specs
npx vitest run tests/widgets/

# Watch mode while authoring
npx vitest tests/widgets/<domain>/<widget-id>.test.tsx
```

## Rollout plan

See [`unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md`](../../../unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md)
for the wave order (common tabs → DeFi → terminal/markets → risk/strategies)
and the explicit out-of-scope list (predictions, sports, CeFi).
