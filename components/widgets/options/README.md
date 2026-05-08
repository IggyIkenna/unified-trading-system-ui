# Options & futures workspace widgets

The trading **Options** route (`/services/trading/options`) uses a widget grid with a shared `OptionsDataProvider`. UI sections are implemented in `components/widgets/options/*`; heavy presentation remains in `components/trading/options-futures-panel.tsx` (exported tabs and panels).

## Widget IDs

| ID                      | Role                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `options-control-bar`   | Toolbar: asset class, venue, settlement, main tabs, watchlist visibility                                         |
| `options-watchlist`     | `WatchlistPanel` bound to context watchlists / selection                                                         |
| `options-chain`         | Crypto or TradFi options chain table + docked `TradePanel` (right-side pane when an option contract is selected) |
| `futures-table`         | Crypto futures list (`FuturesTab`) + docked `TradePanel` (bottom pane when a futures row is selected)            |
| `options-strategies`    | Futures spreads matrix + options combo builder on the left, `ScenarioTab` payoff pane on the right               |
| `options-greek-surface` | Crypto greeks surface; TradFi vol surface                                                                        |

## Data context

`options-data-context.tsx` holds mock-driven selection state (underlying, venue, expiry, instruments, scenario sliders, order fields) and derived rows (`optionRows`, `futureRows`, `payoffData`). Chain clears `selectedFuture` when picking options so the docked trade panel stays authoritative for non-future instruments.

## History

`options-trade-panel`, `futures-trade-panel`, `options-scenario` were merged into their host widgets on 2026-04-22 (WU-3) — all three were pure readers of context state set by another widget (`selectedInstrument`, `selectedFuture`, asset class). Hosting them as embedded panes removes the "dead half-widget" UX (empty trade panel until another widget is selected) and preserves the same user flow in fewer grid slots. See `docs/audits/live-review-findings.md` row #17 and `unified-trading-pm/plans/active/trading_widget_merge_audit_2026_04_22.md` WU-3.

## Presets

Registered in `components/widgets/options/register.ts`:

- **Default** — control bar, watchlist, chain (docks trade panel), greek/vol surface, futures table (docks trade panel).
- **Strategies & scenario** — control bar, strategies (with embedded scenario pane), chain.
- **Full** — adds more rows and the greek surface panel.

## Source spec

See [`options-widgets.md`](./options-widgets.md) (read-only for implementation; do not edit the spec in rollout tasks).
