# docs/trading/ — Active reference for trading lifecycle tab

**Last updated:** 2026-04-16

These docs are actively referenced during trading tab development. Stale or unused docs have been removed or moved to `docs/under-review/`.

---

## Core reference

| File                                           | What                                                                                        | Status                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------- |
| [WIDGET_CATALOGUE.md](WIDGET_CATALOGUE.md)     | 124 widgets across 17 domains — class taxonomy, preset audit, base widget candidates        | Active — updated 2026-04-16 |
| [ROUTES.md](ROUTES.md)                         | Full route inventory (generated from `page.tsx` files)                                      | Active — updated 2026-04-16 |
| [DATA_MODE_IDEOLOGY.md](DATA_MODE_IDEOLOGY.md) | Rules for mock vs real data mode (`isMockDataMode()`)                                       | Active — short, still valid |
| [UX_OPERATING_RULES.md](UX_OPERATING_RULES.md) | Hard UX rules: same page different permissions, batch/live structural, taxonomy drift = bug | Active — still valid        |
| [UX_FLOW_SPEC.md](UX_FLOW_SPEC.md)             | Canonical user journeys: login, signup, role-based views, subscription layer                | Active — design spec        |

## DeFi (current priority)

| File                                                               | What                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [defi/DEFI_DEMO_HANDOVER.md](defi/DEFI_DEMO_HANDOVER.md)           | Frontend changes for DeFi demo, strategy flows, file change manifest                             |
| [defi/MORNING-AUDIT-CHECKLIST.md](defi/MORNING-AUDIT-CHECKLIST.md) | Manual QA checklist for DeFi demo (login, tabs, widgets, strategies)                             |
| [defi/STRATEGY-GUIDE.md](defi/STRATEGY-GUIDE.md)                   | DeFi strategy reference for non-DeFi people (AAVE lending, basis trade, staked basis, recursive) |

## Platform review (per-tab decisions from meeting 2026-03-25)

| File                                                                                                                             | What                                                              |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [platform-review/tabs/00-tab-grouping-summary.md](platform-review/tabs/00-tab-grouping-summary.md)                               | Tab ordering, grouping, asset-class relevance                     |
| [platform-review/tabs/01-overview.md](platform-review/tabs/01-overview.md) through [18-news.md](platform-review/tabs/18-news.md) | Per-tab review: current state, meeting items, improvements needed |
| [platform-review/trading-defi-ops-combo-builder.md](platform-review/trading-defi-ops-combo-builder.md)                           | DeFi atomic bundles vs combo builder — where each belongs         |
| [platform-review/trading-asset-class-navigation.md](platform-review/trading-asset-class-navigation.md)                           | Asset-class filtering and navigation decisions                    |
| [platform-review/trading-accounts-risk-pnl-reconciliation.md](platform-review/trading-accounts-risk-pnl-reconciliation.md)       | Cross-tab data flow: accounts, risk, PnL, reconciliation          |
| [platform-review/trading-sports-predictions.md](platform-review/trading-sports-predictions.md)                                   | Sports + predictions tab design decisions                         |
| [platform-review/cross-cutting-quickview-news-liveasof.md](platform-review/cross-cutting-quickview-news-liveasof.md)             | Quick view panel, news feed, live/as-of mode                      |
| [platform-review/review chat decisions.md](platform-review/review%20chat%20decisions.md)                                         | Decisions from review chat sessions                               |

## Audit scripts (reusable templates)

15 audit script templates (A through O) covering: typography, color tokens, spacing/layout, shared components, mock data, widget audit, nav shell, accessibility, responsive, performance, code org, error handling, naming, i18n, security.

Located in [audit-scripts/](audit-scripts/).
