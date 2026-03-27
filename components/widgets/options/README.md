# Options & futures workspace widgets

The trading **Options** route (`/services/trading/options`) uses a widget grid with a shared `OptionsDataProvider`. UI sections are implemented in `components/widgets/options/*`; heavy presentation remains in `components/trading/options-futures-panel.tsx` (exported tabs and panels).

## Widget IDs

| ID                      | Role                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| `options-control-bar`   | Toolbar: asset class, venue, settlement, main tabs, watchlist visibility |
| `options-watchlist`     | `WatchlistPanel` bound to context watchlists / selection                 |
| `options-chain`         | Crypto or TradFi options chain table                                     |
| `options-trade-panel`   | `TradePanel` for chain / strategy selection                              |
| `futures-table`         | Crypto futures list (`FuturesTab`)                                       |
| `futures-trade-panel`   | `TradePanel` fed by `selectedFuture` after a futures row click           |
| `options-strategies`    | Futures spreads matrix + options combo builder                           |
| `options-scenario`      | Scenario shock grid (`ScenarioTab`)                                      |
| `options-greek-surface` | Crypto greeks surface; TradFi vol surface                                |

## Data context

`options-data-context.tsx` holds mock-driven selection state (underlying, venue, expiry, instruments, scenario sliders, order fields) and derived rows (`optionRows`, `futureRows`, `payoffData`). Chain and table widgets clear `selectedFuture` when picking options so the options trade panel stays authoritative for non-future instruments.

## Presets

Registered in `components/widgets/options/register.ts`:

- **Default** — control bar, watchlist, chain, trade panel, greek/vol surface, futures table (matches widget spec layout).
- **Strategies & scenario** — control bar, strategies, scenario, trade panel, chain.

## Source spec

See [`options-widgets.md`](./options-widgets.md) (read-only for implementation; do not edit the spec in rollout tasks).
