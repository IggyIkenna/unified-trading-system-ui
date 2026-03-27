# Tab: News

**Route:** `/services/trading/news` _(new — does not exist yet)_ **Page file:**
`app/(platform)/services/trading/news/page.tsx` _(to be created)_ **Lines:** N/A | **Status:** Not a tab yet

**Related existing surfaces:**

- Quick View sidebar (right panel in `app/(platform)/services/trading/layout.tsx`) — shows up to 4 news items with
  severity dots, links to `/services/trading/markets`
- `/services/observe/news` — existing news page in the Observe lifecycle (not trading-specific)

---

## Current State

News exists in two places today:

**1. Quick View sidebar card** (`TradingSidebar` in `layout.tsx`):

- Shows top 4 news items from `useNewsFeed()`
- Severity dot color per item: breaking (rose), high (amber), medium (blue), low (muted)
- Shows: title (2-line clamp), source name
- Links to `/services/trading/markets` (wrong destination — should link to a dedicated news page)
- No filtering, no category, no asset-class context

**2. `hooks/api/use-news.ts` — `NewsItem` schema:**

```typescript
interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  severity: "breaking" | "high" | "medium" | "low";
  instruments: string[]; // e.g. ["BTC-USD", "SPY", "ETH-USD"]
  summary: string;
}
```

Missing fields: asset class, category (macro/micro/sector), region, topic tags, sentiment.

**3. Seed data covers:** SEC/regulatory news, Fed rates, crypto protocol upgrades, DeFi governance, sports events, macro
(CPI, central bank rates), FX (BOJ), sports betting volumes — a good cross-asset mix already.

---

## Meeting Review Items

From `cross-cutting-quickview-news-liveasof.md` (Section 2):

> "Add a new section, put some jargon in there, just some ability to filter it down by category so they see the news
> that's relevant for sports, see the news that's relevant for TradFi, DeFi."

> "For TradFi you want one more breakdown, just on the actual asset classes: fixed income, currencies."

> "News severity that makes sense."

---

## Proposed Filter Taxonomy

### Primary filter: Asset Class

Maps directly to our 5 asset-class groups:

| Filter                   | What it covers                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **All**                  | Unfiltered — everything                                                                            |
| **CeFi**                 | Centralised exchange news: listings/delistings, exchange outages, regulation affecting CeFi venues |
| **DeFi**                 | Protocol upgrades, governance votes, TVL changes, smart contract events, on-chain exploits         |
| **TradFi**               | Equities, macro, central bank decisions, commodities, FX, fixed income                             |
| **Sports + Predictions** | Sports fixtures, odds movements, tournament draws, regulatory news for betting markets             |

### Secondary filter: Topic / Category

Finer-grained tagging within asset classes. Multiple tags per article.

| Tag                   | Description                                                            | Applicable to        |
| --------------------- | ---------------------------------------------------------------------- | -------------------- |
| **Macro**             | GDP, CPI, inflation, central bank decisions, broad economic indicators | TradFi, CeFi, DeFi   |
| **Regulation**        | SEC, FCA, MiCA, CFTC, exchange rules, compliance changes               | All                  |
| **Earnings**          | Corporate earnings, revenue, guidance                                  | TradFi (equities)    |
| **Fixed Income**      | Bond yields, treasury auctions, rate moves, duration                   | TradFi               |
| **Currencies / FX**   | Central bank FX intervention, carry trade, spot FX moves               | TradFi, CeFi         |
| **Commodities**       | Oil, gold, metals, agricultural                                        | TradFi               |
| **Protocol**          | Blockchain upgrades, forks, EIPs, consensus changes                    | DeFi, CeFi           |
| **Governance**        | On-chain DAO votes, proposal outcomes                                  | DeFi                 |
| **Liquidity**         | TVL changes, pool migrations, listing changes, delistings              | DeFi, CeFi           |
| **Security**          | Exploits, hacks, vulnerabilities, circuit breakers                     | DeFi, CeFi           |
| **Fixtures / Events** | Match draws, tournament schedules, upcoming events                     | Sports + Predictions |
| **Results**           | Match outcomes, final scores, notable upsets                           | Sports + Predictions |
| **Odds Movement**     | Significant shifts in betting odds or prediction market prices         | Sports + Predictions |
| **Institutional**     | Large institutional moves, fund launches, ETFs, prime brokerage        | All                  |

### Tertiary filter: Region / Geography

Relevant for macro and regulatory news:

| Region                    | Examples                         |
| ------------------------- | -------------------------------- |
| **Global / Cross-Border** | IMF, BIS, FATF, G7/G20 decisions |
| **United States**         | Fed, SEC, CFTC, US Treasury      |
| **European Union**        | ECB, MiCA, EBA                   |
| **United Kingdom**        | BoE, FCA                         |
| **Asia Pacific**          | BOJ, PBOC, MAS, RBI              |
| **Emerging Markets**      | Country-specific macro           |

_Region filter is most useful for TradFi and Regulation news. Deemphasise or collapse for Sports/Predictions and DeFi._

### Quaternary filter: Sentiment (optional, AI-derived)

| Sentiment   | Visual         |
| ----------- | -------------- |
| **Bullish** | Green arrow up |
| **Bearish** | Red arrow down |
| **Neutral** | Gray dash      |

---

## Updated `NewsItem` Schema

The `use-news.ts` hook's `NewsItem` interface needs to be extended:

```typescript
export type NewsAssetClass =
  | "cefi"
  | "defi"
  | "tradfi"
  | "sports_predictions"
  | "cross";
export type NewsTopic =
  | "macro"
  | "regulation"
  | "earnings"
  | "fixed_income"
  | "currencies"
  | "commodities"
  | "protocol"
  | "governance"
  | "liquidity"
  | "security"
  | "fixtures"
  | "results"
  | "odds_movement"
  | "institutional";
export type NewsRegion = "global" | "us" | "eu" | "uk" | "apac" | "em";
export type NewsSentiment = "bullish" | "bearish" | "neutral";

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  severity: NewsSeverity; // existing
  instruments: string[]; // existing — affected canonical instrument IDs
  summary: string; // existing
  // NEW:
  assetClass: NewsAssetClass;
  topics: NewsTopic[]; // multi-tag
  region?: NewsRegion; // mainly for macro/regulation
  sentiment?: NewsSentiment; // optional, AI-derived
  url?: string; // link to original article
  relatedFixtureId?: string; // for sports news — links to fixture
}
```

---

## Page Layout

The dedicated `/services/trading/news` page (which the Quick View sidebar card should link to):

```
┌─────────────────────────────────────────────────────────────┐
│  News                                        [Live | As-Of] │
├─────────────────────────────────────────────────────────────┤
│  Severity: [All] [Breaking] [High] [Medium] [Low]           │
│  Asset:    [All] [CeFi] [DeFi] [TradFi] [Sports+Pred]       │
│  Topic:    [Macro] [Regulation] [Protocol] [Governance]...  │
│  Region:   [Global] [US] [EU] [UK] [APAC]                   │
│  Sentiment:[All] [Bullish] [Bearish] [Neutral]              │
│  Search:   [___________________________]                    │
├─────────────────────────────────────────────────────────────┤
│  BREAKING  [rose dot]  SEC Approves Spot Bitcoin ETF...     │
│             Reuters · 9:12 AM · CeFi, Regulation · Bullish  │
│             [BTC-USD] [BTC-USDT]                            │
│                                                             │
│  HIGH      [amber dot] Federal Reserve Holds at 4.25%       │
│             Bloomberg · 8:45 AM · Macro, US                 │
│             [SPY] [QQQ] [TLT]                               │
│                                                             │
│  HIGH      [amber dot] Ethereum Pectra Upgrade Apr 15        │
│             CoinDesk · 7:30 AM · DeFi, Protocol             │
│             [ETH-USD] [ETH-USDT]                            │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Per-item display:**

- Severity badge (colored, prominent)
- Headline (1–2 lines)
- Source + timestamp (relative: "2h ago")
- Asset class badge + topic tags
- Affected instruments (clickable instrument chips → link to instrument in terminal)
- Sentiment indicator (if available)
- Expandable summary on click (no new page needed — inline expand)

**Sorting:** Default sort by severity desc, then timestamp desc. Allow sort by timestamp only.

---

## Quick View Sidebar Card (existing — minor update)

The existing sidebar card already works well for glanceable news. Minor updates needed:

1. **Fix link destination:** Currently links to `/services/trading/markets` — should link to `/services/trading/news`
2. **Add severity badge text:** Currently just a dot; consider adding a "BREAKING" label for breaking news items
3. **Show asset class:** Add a tiny badge (e.g., "DeFi", "Macro") next to the source name so context is immediate
   without opening the full page

No structural changes needed to the sidebar card — it's a preview only.

---

## Asset-Class Relevance

**Common** — news is relevant to all asset classes. The asset-class filter determines what each user sees by default (a
DeFi-only client defaults to DeFi filter).

---

## Action

**New page** — create `/services/trading/news/page.tsx` with filter bar and news feed. Update the Quick View sidebar
link to point to this new page. Extend `NewsItem` schema in `use-news.ts` to include `assetClass`, `topics`, `region`,
`sentiment`, `url`.

The existing `/services/observe/news` page can remain as an ops/system-health focused news view and eventually be
updated with the same filter schema.
