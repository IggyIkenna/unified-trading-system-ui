# Sports Live Odds Connectivity

How we connect to bookmakers in **live** mode: no batch files, real-time (or near real-time) odds. This doc is the SSOT
for the three connectivity paths and the trade-offs (especially login/scrape).

---

## TL;DR

| Source                                               | Live path                    | Login/scrape?      | Latency                        |
| ---------------------------------------------------- | ---------------------------- | ------------------ | ------------------------------ |
| **The Odds API**                                     | REST poll → Pub/Sub          | No                 | 40–60s (their update interval) |
| **Exchanges** (Betfair, Smarkets, Matchbook, Betdaq) | REST/stream API → Pub/Sub    | No (API keys only) | 5–30s configurable             |
| **Scrapers** (SkyBet, Coral, etc.)                   | Browser automation → Pub/Sub | Yes (login + geo)  | 60s+; high maintenance         |

**Live “beef”:** `market-data-processing-service` (with `asset_class=SPORTS`, Batch B) is the producer: it polls these
adapters on a schedule and writes snapshots to GCS + publishes deltas to Pub/Sub. `features-sports-service` consumes via
**Pub/Sub** (live seam). So “connecting live” = that service calling USEI adapters on an interval and pushing to
Pub/Sub.

> **Note (2026-03-01):** `sports-odds-data-service` and `sports-odds-processing-service` have been consolidated into
> `market-data-processing-service` as part of the sports service consolidation. See `sports-integration-plan.md`
> Changelog 2026-03-01.

---

## 1. The Odds API (aggregator) — no login, no scrape

- **Provider:** [The Odds API](https://the-odds-api.com/) (the-odds-api.com). We use v4 REST only.
- **Live mechanism:** They do **not** offer WebSocket. Odds update on **fixed intervals**
  ([update-intervals](https://the-odds-api.com/sports-odds-data/update-intervals.html)):
  - Pre-match: 60s (featured markets), 5 min (outrights).
  - In-play: 40s (featured), 60s (additional).
  - Exchanges (when requested via Odds API): 30s pre-match, 20s in-play.
- **How we connect live:** A job in `market-data-processing-service` (asset_class=SPORTS) polls the Odds API at or just
  above their interval (e.g. every 45–60s). Each response is written to GCS (snapshots) and/or published to Pub/Sub
  (`market-data-updated` with asset_class=SPORTS). No login, no browser; just REST + API key (Secret Manager).
- **Bookmakers covered:** All keys in our `ODDS_API_KEY_MAP` (UK/EU/US/AU). One REST call can return many bookmakers; we
  map their keys to our canonical registry and emit `CanonicalOdds` per bookmaker.

---

## 2. Exchanges — API-only, no scrape

- **Adapters:** Betfair, Smarkets, Matchbook, Betdaq (USEI exchange adapters).
- **Live mechanism:** Each has a **REST API** (and some have streaming). We call `get_odds(fixture_id, markets)` (and
  optionally `get_fixtures_with_odds`) on a schedule. No browser, no login UI; credentials are API keys / client certs
  in Secret Manager.
- **How we connect live:** `market-data-processing-service` (asset_class=SPORTS) runs a loop (e.g. every 5s for
  exchanges) and calls each exchange adapter; results are written to GCS and published to Pub/Sub. Concurrency: asyncio
  gather across exchanges; rate limits per exchange (Betfair, Smarkets, etc.) are respected in each adapter.
- **Latency:** Typically 5–30s poll interval; sub-second if an exchange offers streaming and we add a stream client
  later.

---

## 3. Scrapers — login and scrape (“the tricky bit”)

- **Adapters:** SkyBet, Coral, Paddy Power, Ladbrokes, Bet365, Betway, Unibet, 888sport, William Hill, Betfred,
  BetVictor, BoyleSports, Bwin (USEI scraper adapters).
- **Current implementation:** Playwright (or similar) loads the bookmaker’s **public** page (e.g.
  `skybet.com/football/match/{fixture_id}`) and parses HTML to extract odds. Many of these sites **require login**
  and/or **geo** (UK only) to see full odds, so a “public only” scraper is fragile.
- **Live mechanism options:**
  1. **Prefer The Odds API:** For any bookmaker that Odds API already covers (e.g. sport888, coral, skybet,
     ladbrokes_uk), we **do not** need to scrape for live. Poll Odds API and map keys. That’s the main “live” path for
     those brands.
  2. **Scraper when necessary:** If we need a bookmaker not on Odds API, or need higher frequency than 40–60s, we run a
     **dedicated scraper worker** that:
     - Uses a real browser (Playwright) with a **logged-in session** (cookies/session storage).
     - Optionally uses **residential proxy** / geo to satisfy “UK only” or similar.
     - Polls at a conservative interval (e.g. 60s) to avoid rate limits and bot detection.
     - Publishes parsed odds (e.g. `CanonicalOdds`) to the same GCS + Pub/Sub pipeline.
  3. **Session handling:** Login flow (username/password, 2FA if required) and session refresh (re-login when cookie
     expires) must be implemented per bookmaker; credentials in Secret Manager. This is high-maintenance (site changes,
     selectors break, ToS risk).

- **Concurrency (Phase 3):** Max 4 concurrent scrapers; RAM guard (e.g. 85% → reduce to 2) to avoid OOM with multiple
  browsers.

---

## Where the “live beef” lives

- **Producer:** `market-data-processing-service` (asset_class=SPORTS, Batch B). It holds the list of adapters (Odds API,
  exchanges, scrapers), runs `run_live_polling()` (or equivalent), and for each cycle:
  - Calls each adapter’s `get_odds` (and optionally `get_fixtures_with_odds`).
  - Writes snapshots to GCS.
  - Publishes delta events to Pub/Sub topic `market-data-updated` (with asset_class=SPORTS attribute).
  - Performs arbitrage detection and normalization inline (previously in separate `sports-odds-processing-service`).
- **Consumers:**
  - `features-sports-service` in live mode uses `LiveDataSource` (Pub/Sub subscription) to receive records (fixture +
    odds or derived data) and runs the feature pipeline per fixture.
- So **connecting to bookmakers live** = ensuring `market-data-processing-service` is running with SPORTS category, the
  right adapters and config (Odds API key, exchange keys, and optionally scraper credentials/sessions) and that it
  publishes to the topic the downstream services subscribe to.

> **Note (2026-03-01):** The previous architecture had a separate `sports-odds-processing-service` consuming from
> `sports-odds-data-service`. Both are now consolidated into `market-data-processing-service` with `asset_class=SPORTS`.
> Arbitrage detection and odds normalization happen within the same service.

---

## Summary table

| Connectivity | Auth                   | Live implementation                              | Maintenance                     |
| ------------ | ---------------------- | ------------------------------------------------ | ------------------------------- |
| Odds API     | API key only           | Poll REST every 40–60s → GCS + Pub/Sub           | Low                             |
| Exchanges    | API key / cert         | Poll (or stream) API every 5–30s → GCS + Pub/Sub | Low                             |
| Scrapers     | Login + optional proxy | Browser automation, 60s poll → GCS + Pub/Sub     | High (selectors, ToS, sessions) |

Use **The Odds API for live** wherever it covers the bookmaker and 40–60s latency is acceptable; use **exchanges** for
low-latency API; use **scrapers** only when necessary and accept the operational cost.
