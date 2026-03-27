# Sports Betting — Widget Decomposition Spec

**Page:** `app/(platform)/services/trading/sports/page.tsx`
**Component:** `components/trading/sports/sports-page.tsx`
**Tier:** 3 (low priority — well-structured with sub-tabs, moderate complexity)

---

## 1. Page Analysis

| Metric           | Value                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Page lines       | 7 (thin wrapper — `<SportsPage />`)                                                   |
| Component lines  | ~278 (sports-page.tsx) + sub-tab components                                           |
| Sub-components   | `FilterBar` (inline ~90 lines), `FixturesTab`, `ArbTab`, `MyBetsTab` — separate files |
| Supporting files | `types.ts`, `mock-data.ts`, `mock-fixtures.ts`, `helpers.ts`, `shared.tsx`            |
| Data hooks used  | None — 100% mock data via `MOCK_FIXTURES`, `FOOTBALL_LEAGUES`                         |
| Inline mock data | Filter logic inline; fixtures and leagues from co-located mock files                  |

The page has a global filter bar (date range, status, search, league pills) that feeds filtered fixtures into 3 tabs: Fixtures, Arb, My Bets.

---

## 2. Widget Decomposition

| id                      | label          | description                                                                         | icon       | minW | minH | defaultW | defaultH | singleton |
| ----------------------- | -------------- | ----------------------------------------------------------------------------------- | ---------- | ---- | ---- | -------- | -------- | --------- |
| `sports-filter-bar`     | Sports Filters | Date range (today/week/all), status (live/upcoming/completed), league pills, search | `Filter`   | 6    | 1    | 12       | 2        | yes       |
| `sports-fixtures`       | Fixtures       | Fixture cards/list showing teams, scores, live stats, odds, market depth            | `Trophy`   | 4    | 4    | 8        | 8        | yes       |
| `sports-fixture-detail` | Fixture Detail | Single fixture expanded view with stats, timeline, odds movement, trade panel       | `FileText` | 4    | 5    | 4        | 8        | yes       |
| `sports-arb`            | Arb Scanner    | Live arb opportunities across bookmakers with decay bars                            | `Zap`      | 4    | 4    | 6        | 6        | yes       |
| `sports-my-bets`        | My Bets        | Open and settled bets table with P&L                                                | `Wallet`   | 4    | 3    | 12       | 5        | yes       |
| `sports-live-scores`    | Live Scores    | Compact ticker of live match scores                                                 | `Activity` | 3    | 1    | 12       | 1        | no        |

---

## 3. Data Context Shape

```typescript
interface SportsData {
  // Filters
  filters: {
    leagues: FootballLeague[];
    dateRange: "today" | "week" | "all";
    statusFilter: "all" | "live" | "upcoming" | "completed";
    search: string;
  };
  setFilters: (f: GlobalFilters) => void;

  // Fixtures
  allFixtures: Fixture[];
  filteredFixtures: Fixture[];
  selectedFixtureId: string | null;
  setSelectedFixtureId: (id: string | null) => void;
  selectedFixture: Fixture | null;

  // Arb
  arbThreshold: number;
  setArbThreshold: (t: number) => void;

  // Bets
  openBets: Bet[];
  settledBets: Bet[];

  // Navigation
  activeTab: "fixtures" | "arb" | "my-bets";
  setActiveTab: (t: string) => void;
  handleViewArb: (fixtureId?: string) => void;
}
```

---

## 4. Mock Data Instructions

- `components/trading/sports/mock-data.ts` → `lib/mocks/fixtures/sports-fixtures.ts`
- `components/trading/sports/mock-fixtures.ts` (leagues, arb thresholds) → `lib/mocks/fixtures/sports-leagues.ts`
- Types from `components/trading/sports/types.ts` → `lib/types/sports.ts`
- Helpers from `components/trading/sports/helpers.ts` → keep co-located or `lib/utils/sports.ts`
- Shared components (`StatusPill`, `DualStatBar`, `LeagueBadge`) stay in `components/trading/sports/shared.tsx` — they're domain-specific

---

## 5. UI/UX Notes

- The filter bar has a distinct dark theme (`bg-[#0d0d0d]`, `border-zinc-800`) that differs from the standard theme — standardize to use CSS variables when widgetized.
- League pills use horizontal scrolling — works well in narrow widgets.
- Fixture cards should support both grid and list views (toggle in filter bar).
- Live fixtures should have a subtle pulse/glow indicator.
- Tab triggers have custom bottom-border active state — will be replaced by widget tab system in the workspace.

---

## 6. Collapsible Candidates

| Section            | Why                                                  |
| ------------------ | ---------------------------------------------------- |
| League pills row   | Second row of filters; collapse when space is tight  |
| Settled bets       | Secondary to open bets; collapse by default          |
| Fixture live stats | Within fixture detail; can collapse for compact view |

---

## 7. Reusable Component Usage

| Shared widget        | Where used                                                                  |
| -------------------- | --------------------------------------------------------------------------- |
| `FilterBarWidget`    | Replace custom filter bar (date range, status, search as FilterDefinitions) |
| `DataTableWidget`    | My Bets table (open + settled)                                              |
| `CollapsibleSection` | Settled bets, league pills, fixture stats detail                            |
| `KpiStrip`           | Bets summary: total staked, active bets, P&L, win rate                      |

---

## 8. Default Preset Layout

```
sports-default:
  sports-filter-bar:     { x: 0,  y: 0,  w: 12, h: 2 }
  sports-fixtures:       { x: 0,  y: 2,  w: 8,  h: 8 }
  sports-fixture-detail: { x: 8,  y: 2,  w: 4,  h: 8 }
  sports-my-bets:        { x: 0,  y: 10, w: 12, h: 4 }

sports-arb-focus:
  sports-filter-bar:     { x: 0,  y: 0,  w: 12, h: 2 }
  sports-arb:            { x: 0,  y: 2,  w: 6,  h: 7 }
  sports-fixtures:       { x: 6,  y: 2,  w: 6,  h: 7 }
  sports-live-scores:    { x: 0,  y: 9,  w: 12, h: 1 }
  sports-my-bets:        { x: 0,  y: 10, w: 12, h: 4 }
```

---

## 9. Questions to Resolve

1. **Shared filter bar with predictions?** — Both sports and predictions have similar filter patterns (status, venue/league, search). Should there be a unified sports+predictions filter context?
2. **Fixture detail: drill-down or persistent widget?** — Currently clicking a fixture could open detail inline. In widget mode, should the detail widget always be visible (master-detail pattern) or appear on demand?
3. **Arb tab: merge with predictions arb?** — Sports arb and prediction arb have very similar UX (cards with decay bars, execute buttons). Share a `BaseArbStreamWidget`?
4. **Dark theme override** — The sports page uses hardcoded dark colors (`#0d0d0d`, `zinc-800`). When widgetized, should these use theme tokens or maintain the sportsbook aesthetic?
