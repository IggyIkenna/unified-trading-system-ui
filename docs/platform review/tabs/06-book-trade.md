# Tab: Book Trade

**Route:** `/services/trading/book`
**Page file:** `app/(platform)/services/trading/book/page.tsx`
**Lines:** 947 | **Status:** Full implementation

---

## Current State

Back-office manual trade booking form — for booking trades that didn't go through the normal algo/execution path (OTC trades, exchange-assigned positions, corrections).

**What it renders:**

- Two modes via `Tabs`: **Execute** (live order to venue) vs **Record Only** (book without sending)
- Category tabs (asset-class grouping for venue selection): determines which venues are available
- Order detail cards: instrument, side, price, quantity, notional, fees
- Algo card: algo type selection (basic — limit/market/TWAP/VWAP)
- Compliance preview: pre-trade checks run via `usePreTradeCheck`
- Org + client + strategy selectors (from API: `useOrganizationsList`)
- Submit flow: Preview → Confirm → Submit with `usePlaceOrder`
- Entitlement guard: `hasEntitlement` from `useAuth` gates the Execute mode
- URL `prefill` parameter: allows pre-populating the form from other pages (e.g., from a reconcile flow)

**Data sources:** `usePlaceOrder`, `usePreTradeCheck`, `useOrganizationsList`, `useAuth`

**Filtering/scoping:** Org select from API. Category tabs drive venue list. Strategy from `REGISTRY_STRATEGIES`.

---

## Meeting Review Items

From `trading-accounts-risk-pnl-reconciliation.md`:

- **OTC trade bookings:** When doing deep-dive trade matching reconciliation, users may need to book an OTC/manually-assigned trade to resolve a position discrepancy. This page already supports "Record Only" mode for exactly this.
- The `prefill` URL parameter should be used by the quick reconcile flow to pre-populate this form with the unmatched trade details.

---

## Improvements Needed

1. **Reconcile flow integration:** The quick reconcile workflow (from Positions tab, unhealthy row) should link to this page with a pre-filled form via the `prefill` param. "Record this OTC trade" as a resolution action.
2. **Sports/predictions booking:** Currently category tabs suggest CeFi/DeFi/TradFi venues. Add sports bookmakers and prediction market venues (Polymarket, Kalshi) as bookable categories.
3. **Execution algo integration:** The algo card currently shows basic algos. Per the meeting decision, advanced ODUM algos should appear here for users with the right entitlement (the `execution-full` entitlement). The basic set (Limit, Market, TWAP, VWAP) should be the default.
4. **Pre-trade check display:** The compliance preview is there but its output format could be clearer — show pass/fail per check explicitly rather than a generic preview.
5. **Audit trail link:** After booking a trade (Record Only mode), link to the audit trail entry immediately so the user can confirm the booking is recorded.

---

## Asset-Class Relevance

**Common** — applies to all asset classes. The category tabs already attempt to segment by asset class for venue selection. Needs sports/predictions venue category added.

---

## Action

**Enhance** — reconcile integration, sports/predictions venues, advanced algo entitlement surfacing, clearer pre-trade output.
