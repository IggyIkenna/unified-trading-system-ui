# Cross-Cutting Enhancements — Quick View, News, Live vs As-Of

> **Source:** Platform review meeting 2026-03-25
> **Scope:** Platform-wide features that apply across multiple lifecycle stages
> **Status:** Not started (Promote tab in progress first)

---

## 1. Quick View — Persistent on Every Tab

**From meeting:**

> "Make sure that quick view exists on every tab because it doesn't currently, I think, exist on every tab on the trading terminal. That way the user can always see the high level so they don't need to always worry about whether they're on the alerts tab that always sees the important stuff there."

**What this means:**

- A persistent **Quick View** panel that shows critical high-level information regardless of which tab the user is on
- Currently missing from some tabs in the Trading terminal
- Should show: key alerts, important metrics, things the user always needs to see

**Implementation approach:**

- This is a shell-level component, not per-tab — it lives in the layout so it persists across tab navigation
- Likely a collapsible sidebar or top bar that shows:
  - Active alerts (critical/high severity)
  - Key portfolio metrics (total P&L, margin usage, largest position)
  - System health indicator
- The user shouldn't have to navigate to Alerts tab to see if something is on fire

**Where it applies:** Every service tab within the Trading terminal. May also apply to other lifecycle stages (Research, Data) but the meeting specifically discussed it in the Trading context.

---

## 2. News Section Enhancement

**From meeting:**

> "Add a new section, put some jargon in there, just some ability to filter it down by category so they see the news that's relevant for sports, see the news that's relevant for TradFi, DeFi."

> "For TradFi you want one more breakdown, just on the actual asset classes: fixed income, currencies."

> "News severity that makes sense."

**Current state:** News exists at `/services/observe/news` — basic news feed.

**What to build:**

### 2.1 Category Filtering

| Top-Level Category | Sub-Categories                                  |
| ------------------ | ----------------------------------------------- |
| Sports             | Football, Tennis, etc.                          |
| Crypto / DeFi      | DeFi protocols, token news, on-chain events     |
| TradFi             | Fixed Income, Currencies, Equities, Commodities |
| General            | Macro, regulation, cross-cutting                |

- A lot of non-sports news overlaps (macro affects both crypto and TradFi)
- Sports and crypto tend to have their own specific news streams
- Commodities also has its own specific news

### 2.2 News Severity

- Severity levels on news items (critical, high, medium, low/informational)
- Visual indicator per news item
- Filter by severity

### 2.3 Placement

- The meeting mentioned "add a new section" — this could mean:
  - Enhance the existing `/services/observe/news` page
  - Add a news widget to the Quick View panel (see Section 1)
  - Both

---

## 3. Live vs As-Of (Batch) Mode Toggle — Platform-Wide

**From meeting:**

> "I'm going to do this actually being used so I'm just going to mock it like it's still in mock but it can still have the functionality because the only difference is going to be doing backend calls, right so we just want still all the calls but live/simulated and as of vs live should feed through to every possible tab."

**Confirmed understanding (2026-03-26):**

- **Live mode:** Real-time data from live systems — what's happening right now
- **As-Of mode (Batch):** Historical point-in-time view — "show me the state as of date X"
  - Use case: A strategy generated 10 signals on a date. If we backtest that day's data using the same strategy, does it create the same signals? (Validates that live and backtest pipelines are aligned)
  - Almost all backend services have batch (as-of) vs live mode already
- **Simulated mode:** Paper trading / sandbox (related but distinct from as-of)

### 3.1 Where It Makes Sense

| Area                       | Live vs As-Of Relevance | Notes                                                                                                 |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Trading**                | High — classic use case | Live: real positions. As-of: what would positions have been?                                          |
| **Features**               | High — new angle        | Live: current feature values. As-of: what were they on date X? Validates feature pipeline consistency |
| **Models / ML**            | High — new angle        | Live: current model output. As-of: what would the model have predicted?                               |
| **Data pipeline**          | Medium                  | Live: current data state. As-of: historical data at a point in time                                   |
| **Research / Backtesting** | Inherently as-of        | Backtesting is already historical by nature                                                           |
| **Governance**             | Irrelevant              | Governance decisions are point-in-time records, not replayable                                        |
| **Account statements**     | Irrelevant              | Statements are snapshots, not replayable                                                              |

### 3.2 The Concept

> "Where the UI is doing static views, that's not a backend integration. That's a UI functionality that needs to improve. Whereas fake data, yeah, that's a mock source versus reality."

Two distinct concerns:

1. **Static vs dynamic UI** — some views are static (UI problem, not a data source problem)
2. **Mock vs real data source** — mock data for development vs real backend data for production

The live/as-of toggle is about #2 — it switches the data source. It shouldn't be confused with #1 (UI interactivity improvements).

### 3.3 Trading Terminal Exception

> "Maybe the trading terminal to trade in the past; in that way it is potentially a bit weird. I don't really know what that means."

> "From an audit perspective you don't want to be booking trades historically like real trades anyway. You want trades to happen when you click it. For a fake trade that we want to stick into a back test, it doesn't really make sense to do it through this UI anyway because that should just be programmatic."

**Decision:** The "trade" action (placing orders) in the terminal does NOT work in as-of mode — you can only trade live. But viewing positions, P&L, signals, etc. in as-of mode is fine. Booking historical trades for backtests should be done programmatically, not through the UI.

### 3.4 Implementation

- Global toggle (probably in the shell header or context bar)
- When in as-of mode, a date/date-range picker appears
- The toggle feeds through to API calls: live endpoints vs batch/historical endpoints
- Visual indicator: when in as-of mode, the entire UI should have a subtle visual distinction (border, banner, or background tint) so the user knows they're not looking at live data

---

## Summary of Cross-Cutting Items

| Item                    | Scope                                    | Priority Guess                    |
| ----------------------- | ---------------------------------------- | --------------------------------- |
| Quick View panel        | Trading terminal (all tabs)              | High — usability improvement      |
| News category filtering | Observe → News (and possibly Quick View) | Medium                            |
| News severity           | Observe → News                           | Medium                            |
| Live vs As-Of toggle    | Platform-wide (where relevant)           | High — architectural pattern      |
| Simulated mode          | Trading-specific                         | Medium — related to paper trading |

---

## Open Questions

- [ ] Quick View: sidebar, top bar, or floating panel? What specific metrics/alerts to show?
- [ ] News: should the enhanced news also appear as a widget in the Trading terminal Quick View?
- [ ] Live vs As-Of: global toggle in the shell header or per-page toggle?
- [ ] As-Of mode visual distinction: subtle background tint? Banner? Both?
- [ ] Which tabs specifically should hide the as-of toggle because it's irrelevant?
