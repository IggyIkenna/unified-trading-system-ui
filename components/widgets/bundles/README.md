# Bundles workspace widgets

The atomic bundle builder is a single widget on the `bundles` tab. State lives in `BundlesDataProvider` (`bundles-data-context.tsx`); the builder owns template gallery, leg editor, P&L estimate, and simulate/submit actions in one scrollable surface with a sticky action footer.

## Widgets

| id                   | File                            | Role                                                                                    |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| `bundle-builder`     | `bundle-builder-widget.tsx`     | Template gallery (toggleable) + step editor + P&L KPI strip + sticky simulate/submit    |
| `defi-atomic-bundle` | `defi-atomic-bundle-widget.tsx` | DeFi-specific atomic bundles with Tenderly simulation (independent of `bundle-builder`) |

## History

`bundle-templates`, `bundle-steps`, `bundle-pnl`, `bundle-actions` were merged into `bundle-builder` on 2026-04-22 — all four wrote to the same shared `useBundlesData()` context and only made sense together (P&L read the steps; actions fired based on steps; templates loaded into steps). See `docs/audits/live-review-findings.md` row #17 and `unified-trading-pm/plans/active/trading_widget_merge_audit_2026_04_22.md` WU-2.

## Data and fixtures

- Types: `lib/types/bundles.ts`
- Reference lists: `lib/config/services/bundle.config.ts`
- Template fixtures: `lib/mocks/fixtures/bundle-templates.ts`
- Operation colors: `lib/utils/bundles.ts`

## Presets

Registered in `register.ts`: `bundles-default`, `bundles-compact`, `bundles-full`.

## Page

`app/(platform)/services/trading/bundles/page.tsx` — `Suspense`, provider, `WidgetGrid tab="bundles"`, side-effect import of `./register`.
