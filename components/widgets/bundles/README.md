# Bundles workspace widgets

Atomic bundle builder is split into four singleton widgets on the `bundles` tab. State lives in `BundlesDataProvider` (`bundles-data-context.tsx`) so templates, legs, P&amp;L, and actions stay in sync.

## Widgets

| id                 | File                          | Role                                                                                      |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------- |
| `bundle-templates` | `bundle-templates-widget.tsx` | Pre-built template gallery; 2-column grid from `sm` breakpoint; optional collapsible help |
| `bundle-steps`     | `bundle-steps-widget.tsx`     | Visual flow rail, per-leg editors, reorder/duplicate/remove, add leg, clear all           |
| `bundle-pnl`       | `bundle-pnl-widget.tsx`       | `KpiStrip` (4 metrics) + `CollapsibleSection` line breakdown                              |
| `bundle-actions`   | `bundle-actions-widget.tsx`   | Leg count badge, simulate (placeholder), submit (disabled wiring TBD)                     |

## Data and fixtures

- Types: `lib/types/bundles.ts`
- Reference lists: `lib/config/services/bundle.config.ts`
- Template fixtures: `lib/mocks/fixtures/bundle-templates.ts`
- Operation colors: `lib/utils/bundles.ts`

## Presets

Registered in `register.ts`: `bundles-default` and `bundles-compact` (layouts match [`bundles-widgets.md`](./bundles-widgets.md) section 8).

## Page

`app/(platform)/services/trading/bundles/page.tsx` — `Suspense`, provider, `WidgetGrid tab="bundles"`, side-effect import of `./register`.
