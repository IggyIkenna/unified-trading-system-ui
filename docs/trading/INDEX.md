# docs/trading/ — Trading lifecycle tab reference

**Last updated:** 2026-04-16

Trading-tab-specific docs. Platform-wide docs (routes, UX rules, data mode, audit scripts) live in `docs/`.

---

## Widget catalogue

| File                                       | What                                                                                 | Status                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------- |
| [WIDGET_CATALOGUE.md](WIDGET_CATALOGUE.md) | 124 widgets across 17 domains — class taxonomy, preset audit, base widget candidates | Active — updated 2026-04-16 |

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

## Platform-wide docs (in `docs/`)

These apply across all services, not just trading:

| File                                                 | What                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| [../ROUTES.md](../ROUTES.md)                         | Full route inventory (generated from `page.tsx` files)       |
| [../UX_OPERATING_RULES.md](../UX_OPERATING_RULES.md) | Hard UX rules: permissions, batch/live, taxonomy drift = bug |
| [../UX_FLOW_SPEC.md](../UX_FLOW_SPEC.md)             | Canonical user journeys: login, signup, role-based views     |
| [../DATA_MODE_IDEOLOGY.md](../DATA_MODE_IDEOLOGY.md) | Rules for mock vs real data mode (`isMockDataMode()`)        |
| [../audit-scripts/](../audit-scripts/)               | 15 audit script templates (A-O): typography, tokens, a11y... |
