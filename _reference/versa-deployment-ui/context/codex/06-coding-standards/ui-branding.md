# UI Branding Standardization

## Shared Component Library

All UIs in the Unified Trading System must use `@unified-trading/ui-kit` for shared components. This ensures visual
consistency, reduces duplication, and centralizes design-system changes.

### `@unified-trading/ui-kit` Exports

The ui-kit package (`unified-trading-ui-kit`) provides:

- **Primitives**: Badge, Button, Card (Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter), Checkbox,
  Dialog, Input, Label, Select, Tabs (Tabs, TabsList, TabsTrigger, TabsContent)
- **Layout**: AppHeader, PageLayout, SidebarNav
- **Status**: StatusDot, CloudModeBadge, MockModeBanner
- **Utilities**: `cn()` (clsx + tailwind-merge), mock handler helpers (`installMockHandlers`, `registerMockHandler`,
  `mockJson`, `mockDelay`)
- **Styling**: `globals.css` (importable via `@unified-trading/ui-kit/globals.css`)

### Technology Stack

| Layer       | Standard                              |
| ----------- | ------------------------------------- |
| Framework   | React 18.3                            |
| Primitives  | Radix UI (`@radix-ui/react-*`)        |
| Styling     | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Variants    | `class-variance-authority` (cva)      |
| Class merge | `clsx` + `tailwind-merge`             |
| Icons       | `lucide-react`                        |
| Bundler     | Vite 5                                |
| Testing     | Vitest + Testing Library + Playwright |

### React Version Status

Target: **React 18.3** across all UIs.

**On 18.3** (compliant):

- batch-audit-ui
- client-reporting-ui
- deployment-ui
- ml-training-ui
- trading-analytics-ui

**On 18.2** (needs upgrade):

- execution-analytics-ui
- live-health-monitor-ui
- logs-dashboard-ui
- onboarding-ui
- settlement-ui
- strategy-ui

**Special**:

- unified-trading-ui-kit: peer dependency `^18.0.0` (accepts all 18.x)
- unified-admin-ui: monorepo with own package structure

### ui-kit Adoption Status

**Using `@unified-trading/ui-kit`**:

- batch-audit-ui
- client-reporting-ui
- execution-analytics-ui
- live-health-monitor-ui
- logs-dashboard-ui
- ml-training-ui
- onboarding-ui
- settlement-ui
- strategy-ui
- trading-analytics-ui

**Not yet using ui-kit**:

- deployment-ui -- uses same Radix/Tailwind/cva stack directly; its patterns are the reference design that should be
  extracted into ui-kit
- unified-admin-ui -- monorepo with its own `@unified-admin/core` package

### Reference Design: deployment-ui

`deployment-ui` is the reference implementation for the system's visual language. Its component patterns (Card layouts,
Badge variants, AppHeader, SidebarNav) have already been extracted into `@unified-trading/ui-kit`. Any new shared
components should follow deployment-ui's styling conventions before being added to the ui-kit.

### Rules

1. **All new UI components that are reusable across repos must go into `@unified-trading/ui-kit`** -- never duplicate
   component code across UI repos.
2. **Import shared components from `@unified-trading/ui-kit`**, not from Radix directly (unless the primitive is not yet
   wrapped in ui-kit).
3. **Use CSS custom properties** (`var(--color-*)`) from ui-kit's globals.css for theming -- never hardcode colors.
4. **React 18.3 is the target** -- all UIs on 18.2 should upgrade in their next maintenance cycle.
5. **Tailwind v4** with the `@tailwindcss/vite` plugin is the standard -- no `tailwind.config.js` files.
