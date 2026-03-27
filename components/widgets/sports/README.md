# Sports trading widgets

Workspace tab: `sports` (`/services/trading/sports`).

## Provider

`SportsDataProvider` in `components/widgets/sports/sports-data-context.tsx` holds:

- Global filters (leagues, date range, status, search) and derived `filteredFixtures`
- `selectedFixtureId` / `selectedFixture` for master–detail with **Fixtures** and **Fixture Detail** widgets
- `arbThreshold` shared with **Arb Scanner** (min arb %)
- `allBets` / `openBets` / `settledBets` from mock data
- `activeTab` / `handleViewArb` for cross-widget navigation (e.g. jump to arb context)

Mock sources remain under `components/trading/sports/mock-data.ts` and `mock-fixtures.ts` (see `docs/widgets/mock-data-changes.md`).

## Widgets

| id                      | Role                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `sports-filter-bar`     | Platform `FilterBar` (date, status, search) + league pills (`LeagueBadge`)                             |
| `sports-fixtures`       | Grouped fixture list (`FixtureSection`, `FixturesMatchCard`)                                           |
| `sports-fixture-detail` | `FixtureDetailPanel` for the selected fixture                                                          |
| `sports-arb`            | `ArbTab` with context-controlled arb threshold                                                         |
| `sports-my-bets`        | `KpiStrip`, `DataTableWidget` (open / settled singles), `CollapsibleSection`, accumulator summary rows |
| `sports-live-scores`    | Horizontal ticker of live / HT / suspended matches                                                     |

## Presets

Registered in `components/widgets/sports/register.ts`:

- **Default** — filter bar, fixtures + detail, my bets (matches widget spec layout).
- **Arb focus** — filter bar, arb + fixtures, live scores ticker, my bets.

## Spec

Canonical decomposition: [`sports-widgets.md`](./sports-widgets.md).
