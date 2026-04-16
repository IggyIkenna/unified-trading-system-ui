# Trading Terminal — Tab Grouping Summary

> **Source:** Platform review meeting 2026-03-25 + tab audit (2026-03-26)
> **Purpose:** Define the ordering, grouping, and asset-class relevance of all trading service tabs.
> **Status:** Partially implemented. The actual code (`components/shell/service-tabs.tsx`) has evolved beyond this flat structure — asset-specific tabs now use `familyGroup`/`group` properties with sub-tabs (DeFi: DeFi + Bundles + Staking; Sports: Sports + Place Bets + Accumulators; Options: Options + Combo Builder + Pricing; Predictions: Predictions + Aggregators). The common tabs ordering and the entitlement model described here remain accurate. See `service-tabs.tsx` for the authoritative implementation.

---

## The Problem

The current `TRADING_TABS` is a flat 16-tab list in no particular order:

> Overview, Terminal, DeFi Ops, Options & Futures, Sports, Predictions, Bundles, Instructions, Positions, Orders, Alerts, Book Trade, Accounts, P&L Breakdown, Risk, Markets

This is overwhelming and unsorted. An internal trader sees the same flat list as a DeFi-only client.

**Core design decision:** Keep one unified tab bar (not two-tier navigation — see meeting notes). Use the existing Global Scope filter (org/client/strategy) for data scoping. Solve the "too many tabs" problem through **grouping and ordering** of the flat list, not by adding a second navigation layer.

---

## Asset-Class Framework

Five asset-class groups (from meeting clarification 2026-03-26):

| Group                    | What it covers                      | Example clients                                          |
| ------------------------ | ----------------------------------- | -------------------------------------------------------- |
| **CeFi**                 | Centralised crypto exchanges        | Binance, OKX, Deribit spot/perps                         |
| **DeFi**                 | On-chain protocols                  | Aave, Uniswap, Curve, flash loans                        |
| **TradFi**               | Traditional finance                 | Equities, FX, fixed income, commodities, options/futures |
| **Sports + Predictions** | Sports betting + prediction markets | Football bookmakers, Polymarket, Kalshi                  |
| **Common**               | Relevant to all asset classes       | Any client using our platform                            |

---

## Proposed Tab Grouping and Ordering

Tabs are grouped into **Common First, then Asset-Specific** within the same flat `TRADING_TABS` array. A visual separator or group label can mark the boundary between common and asset-specific tabs.

### Group 1: Common Tabs (shown to all users, all asset classes)

These tabs are relevant regardless of which asset classes a client subscribes to. They come first.

| #   | Tab               | Current Route                    | Status                            | Action                   |
| --- | ----------------- | -------------------------------- | --------------------------------- | ------------------------ |
| 1   | **Overview**      | `/services/trading/overview`     | Full (1,277 lines)                | Enhance                  |
| 2   | **Strategies**    | `/services/trading/strategies`   | Full (669 lines) — not in tab bar | Add to tab bar + Enhance |
| 3   | **Terminal**      | `/services/trading/terminal`     | Full (1,847 lines)                | Enhance                  |
| 4   | **Positions**     | `/services/trading/positions`    | Full (911 lines)                  | Enhance                  |
| 5   | **Orders**        | `/services/trading/orders`       | Full (823 lines)                  | Enhance                  |
| 6   | **Alerts**        | `/services/trading/alerts`       | Full (967 lines)                  | Enhance                  |
| 7   | **Accounts**      | `/services/trading/accounts`     | Full (877 lines)                  | Enhance                  |
| 8   | **P&L Breakdown** | `/services/trading/pnl`          | Full (1,715 lines)                | Enhance                  |
| 9   | **Risk**          | `/services/trading/risk`         | Full (2,764 lines)                | Enhance                  |
| 10  | **Markets**       | `/services/trading/markets`      | Full but mock-only (1,725 lines)  | Rebuild                  |
| 11  | **Book Trade**    | `/services/trading/book`         | Full (947 lines)                  | Enhance                  |
| 12  | **Instructions**  | `/services/trading/instructions` | Placeholder (19 lines)            | Rebuild                  |

**Rationale for Strategies being #2:** Strategies is the anchor — it defines what the user is operating. Knowing which strategies are running and their status is the first thing any user needs before drilling into positions, orders, or risk.

---

### Group 2: Asset-Specific Tabs (conditionally shown / locked for non-subscribers)

These tabs appear for all users but are locked (with FOMO indicator) for non-subscribed asset classes.

| #   | Tab                                | Current Route                   | Asset Class          | Status                 | Action  |
| --- | ---------------------------------- | ------------------------------- | -------------------- | ---------------------- | ------- |
| 13  | **Combos** _(rename from Bundles)_ | `/services/trading/bundles`     | Common (cross-asset) | Placeholder (19 lines) | Rebuild |
| 14  | **DeFi Ops**                       | `/services/trading/defi`        | DeFi                 | Placeholder (19 lines) | Rebuild |
| 15  | **Options & Futures**              | `/services/trading/options`     | TradFi + CeFi        | Placeholder (19 lines) | Rebuild |
| 16  | **Sports**                         | `/services/trading/sports`      | Sports + Predictions | Placeholder (19 lines) | Rebuild |
| 17  | **Predictions**                    | `/services/trading/predictions` | Sports + Predictions | Placeholder (18 lines) | Rebuild |

**Note on Combos:** Combos is placed at the top of the asset-specific group because it spans multiple asset classes (basis trades for CeFi, options spreads for TradFi, accumulators for Sports). It's not purely asset-specific, but it's specialist enough to not be in the common group.

---

## FOMO / Lock Logic

For asset-specific tabs (#13–17):

- Users subscribed to that asset class: tab is active and navigable
- Users not subscribed: tab is visible, grayed out, with a lock icon
- Clicking a locked tab shows a teaser / "Contact us to unlock" prompt
- ODUM internal users (entitlement: `*`): all tabs unlocked

This is already supported by the `requiredEntitlement` field on `ServiceTab` in `service-tabs.tsx`.

---

## Activity Dot Mapping

Each tab maps to a workflow activity type (from meeting — the colored dots concept):

| Activity        | Color  | Tabs                                                                   |
| --------------- | ------ | ---------------------------------------------------------------------- |
| **Monitoring**  | Blue   | Overview, Alerts, Strategies                                           |
| **Analysing**   | Cyan   | P&L Breakdown, Risk, Markets                                           |
| **Trading**     | Green  | Terminal, Book Trade, Sports, Predictions, DeFi Ops, Options & Futures |
| **Configuring** | Purple | Instructions, Combos                                                   |
| **Reconciling** | Amber  | Positions, Orders, Accounts                                            |

Activity dots help users orient: "Where am I in my workflow?" This is especially useful for new users facing 17 tabs for the first time.

---

## What's Being Removed

No tabs are removed. The current 16 tabs remain, with one addition (Strategies added to tab bar).

---

## Changes to `TRADING_TABS` in `service-tabs.tsx`

```typescript
export const TRADING_TABS: ServiceTab[] = [
  // ── Group 1: Common ──────────────────────────────────────────────
  { label: "Overview", href: "/services/trading/overview" },
  { label: "Strategies", href: "/services/trading/strategies" }, // NEW — add to tab bar
  { label: "Terminal", href: "/services/trading/terminal" },
  { label: "Positions", href: "/services/trading/positions" },
  { label: "Orders", href: "/services/trading/orders" },
  { label: "Alerts", href: "/services/trading/alerts" },
  { label: "Accounts", href: "/services/trading/accounts" },
  { label: "P&L Breakdown", href: "/services/trading/pnl" },
  { label: "Risk", href: "/services/trading/risk" },
  { label: "Markets", href: "/services/trading/markets" },
  { label: "Book Trade", href: "/services/trading/book" },
  { label: "Instructions", href: "/services/trading/instructions" },

  // ── Group 2: Asset-Specific (subscription-gated) ─────────────────
  {
    label: "Combos",
    href: "/services/trading/bundles",
    requiredEntitlement: "execution-basic",
  },
  {
    label: "DeFi Ops",
    href: "/services/trading/defi",
    requiredEntitlement: "defi-trading",
  },
  {
    label: "Options & Futures",
    href: "/services/trading/options",
    requiredEntitlement: "options-trading",
  },
  {
    label: "Sports",
    href: "/services/trading/sports",
    requiredEntitlement: "sports-trading",
  },
  {
    label: "Predictions",
    href: "/services/trading/predictions",
    requiredEntitlement: "predictions-trading",
  },
];
```

**Note:** Entitlement strings aligned with finalized three-level entitlement model (see `docs/initial-boss/07_trading_target_state.md` § 7).

---

## Considerations / Open Questions

1. **Visual separator:** Should there be a visible divider or label between Group 1 (Common) and Group 2 (Asset-Specific) in the tab bar? Or just ordering?
2. **Sports + Predictions merge:** The meeting merged these into one asset-class group. Should they become one tab with sub-tabs (e.g., a Sports & Predictions tab with Sports / Arb Grid / Predictions sub-navigation), or remain two separate tabs as they are now?
3. **Combos entitlement:** "Combos" is cross-asset — should it be gated at all? Or is it available to anyone who has at least one asset-class subscription?
4. **Strategies tab visibility:** Should clients see all strategies (filtered to graduated ones) or just their own strategies? The entitlement / data scoping approach means the tab is common but the data is filtered.
5. **Tab count after adding Strategies:** Goes from 16 to 17. Still manageable as a flat scrollable list.
