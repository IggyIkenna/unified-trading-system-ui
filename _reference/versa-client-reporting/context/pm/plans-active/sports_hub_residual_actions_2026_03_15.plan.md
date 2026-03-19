---
name: sports-hub-residual-actions
overview: |
  Residual human-required actions for the Sports Hub infrastructure.
  All code scaffolding, registries, adapters, configs, and GCS-wired endpoints
  are implemented. These items require live site access, real credentials, and
  browser testing that cannot be automated by an agent.
todos:
  - id: r1-secret-manager-credentials
    content: |
      [HUMAN] Create Secret Manager secrets for all 78 venues following
      naming convention: sports-{venue_key}-credentials
      Each secret contains JSON with keys: username, password, api_key (if API venue),
      totp_secret (if 2FA venue). Config already references these via
      SPORTS_VENUE_CREDENTIALS in unified-config-interface.
      Priority: Start with Tier 1 API venues (betfair_ex_uk, pinnacle, smarkets,
      matchbook, betdaq, polymarket, kalshi) then US exchange/DFS, then scrapers.
    status: pending
  - id: r2-playwright-selectors-us-books
    content: |
      [HUMAN] Fill Playwright CSS selectors for US sportsbook browser adapters.
      Files: unified-sports-execution-interface/adapters/browser/us_books.py
      Venues: DraftKings, FanDuel, BetMGM, BetRivers, ESPN Bet, Hard Rock,
      Fanatics, William Hill US, Bovada, BetOnline, MyBookie, BetUS,
      Bally Bet, BetParx.
      Each adapter has login(), place_bet(), cancel_bet(), get_balance()
      stubs with NotImplementedError. Requires:
      1. Create accounts on each venue
      2. Inspect login page DOM for username/password/submit selectors
      3. Inspect bet slip DOM for stake input, odds display, confirm button
      4. Test with Playwright in headed mode first, then headless
      5. Handle GeoComply verification for geo-fenced states
    status: pending
  - id: r3-playwright-selectors-us-dfs
    content: |
      [HUMAN] Fill Playwright CSS selectors for US DFS platforms.
      Files: unified-sports-execution-interface/adapters/browser/us_dfs.py
      Venues: Betr (US DFS), Pick6, PrizePicks, Underdog, Fliff.
      DFS platforms use pick'em format — different DOM than traditional books.
      Selectors needed: player prop selection, over/under toggle, entry amount.
    status: pending
  - id: r4-playwright-selectors-us-exchanges
    content: |
      [HUMAN] Fill Playwright CSS selectors for US exchange adapters.
      Files: unified-sports-execution-interface/adapters/browser/us_exchanges.py
      Venues: Novig, BetOpenly, ProphetX.
      Exchange UI has back/lay columns — different from bookmaker bet slips.
      NJ residency required for ProphetX.
    status: pending
  - id: r5-playwright-selectors-uk-books
    content: |
      [HUMAN] Fill Playwright CSS selectors for UK sportsbooks.
      Files: unified-sports-execution-interface/adapters/browser/uk_books.py
      Venues: William Hill, Ladbrokes UK, Coral, Paddy Power, Sky Bet,
      Betway, 888sport, BetVictor, BoyleSports, Virgin Bet, LiveScore Bet,
      Grosvenor, Betfair Sportsbook UK, Casumo, LeoVegas.
      Note: Betfair SB is fixed-odds (NOT exchange) — different from betfair_ex_uk.
      UKGC-licensed venues may require GamStop verification.
    status: pending
  - id: r6-playwright-selectors-eu-books
    content: |
      [HUMAN] Fill Playwright CSS selectors for EU sportsbooks.
      Files: unified-sports-execution-interface/adapters/browser/eu_books.py
      Venues: Unibet (UK/FR/IT/NL/SE), Betsson, MarathonBet, Coolbet,
      NordicBet, 1xBet, Winamax (FR/DE), ParionsSport, PMU, NetBet FR,
      Tipico DE, Codere IT, Svenska Spel, ATG SE, 888sport SE, Mr Green SE.
      Locale-specific challenges:
      - FR venues (ANJ-licensed): French residency required, FR language DOM
      - SE venues (SGA-licensed): BankID login for Svenska Spel, ATG
      - DE venues (GGL-licensed): 5.3% turnover tax affects bet sizing
      - IT venues (ADM-licensed): Italian residency required
    status: pending
  - id: r7-playwright-selectors-au-books
    content: |
      [HUMAN] Fill Playwright CSS selectors for Australian sportsbooks.
      Files: unified-sports-execution-interface/adapters/browser/au_books.py
      Venues: Sportsbet, TAB, Neds, PointsBet AU, Ladbrokes AU,
      Betr AU, BetRight, PlayUp, TabTouch, bet365 AU, Dabble AU.
      Note: bet365 AU has AGGRESSIVE anti-bot (Cloudflare + hCaptcha).
      Australian residency required for all AU-licensed venues.
    status: pending
  - id: r8-run-quality-gates
    content: |
      [HUMAN/AGENT] Run quality gates across all 12 touched repos:
      unified-api-contracts, unified-config-interface,
      unified-sports-execution-interface, unified-internal-contracts,
      client-reporting-api, deployment-api, execution-service,
      risk-and-exposure-service, position-balance-monitor-service,
      pnl-attribution-service, alerting-service, strategy-service,
      features-sports-service.
      Command per repo: cd <repo> && bash scripts/quality-gates.sh
      48 test functions scaffolded across 9 test files — verify all pass.
    status: pending
  - id: r9-captcha-solver-integration
    content: |
      [HUMAN] Integrate CAPTCHA solving service for high-security venues.
      Venues requiring CAPTCHA: bet365_au (hCaptcha), bovada (varies).
      Options: 2Captcha, Anti-Captcha, CapSolver API.
      Wire into BrowserBettingAdapter._solve_captcha() override.
      Add solver API key to Secret Manager as sports-captcha-solver-credentials.
    status: pending
  - id: r10-geocomply-integration
    content: |
      [HUMAN] Set up GeoComply or equivalent geolocation verification
      for US geo-fenced venues. Required by: DraftKings, FanDuel, BetMGM,
      BetRivers, ESPN Bet, Hard Rock, Fanatics, Bally Bet, BetParx,
      Novig, ProphetX, Betr, Pick6, PrizePicks, Underdog, Fliff.
      Requires physical US presence in licensed states.
      Wire provider into VenueExecutionProfile.geolocation_provider field.
    status: pending
  - id: r11-polymarket-kalshi-api-adapters
    content: |
      [AGENT] Create REST API adapter classes for Polymarket and Kalshi.
      Polymarket: Already implemented (PolymarketCLOBAdapter).
      Kalshi: KalshiAdapter created in adapters/exchanges/kalshi.py with
      RSA-PSS auth, place/cancel/list orders, get balance/positions.
      Wired into SportsExecutionRouter as kalshi_direct data source.
      27 unit tests passing (aioresponses mocks for all endpoints).
    status: done
  - id: r12-e2e-arb-smoke-test
    content: |
      [AGENT] E2E smoke test created: system-integration-tests/tests/smoke/test_sports_arb_pipeline.py
      14 test classes covering: venue registry completeness, USEI router coverage,
      strategy components, risk/position modules, PnL attribution, alerting,
      CRA sports endpoints, browser adapter coverage, paper trading round-trip,
      credential config coverage. Tests use mock/paper mode only.
      [HUMAN] Live execution test with testnet/paper accounts remains.
    status: done
isProject: false
---

# Sports Hub — Residual Actions Plan

## Context

All code infrastructure for the sports betting hedge fund is implemented:

- **78 venue execution profiles** in UAC registry (0 missing from Odds API)
- **78 credential configs** in UCfgI with Secret Manager path conventions
- **69 browser adapter classes** grouped by region (US/UK/EU/AU)
- **5 sports reporting endpoints** in client-reporting-api wired to GCS
- **5 venue management endpoints** in deployment-api
- **Sports risk engine**, position tracker, PnL attribution, alerting rules, Kelly sizing, steam detection, market
  making strategy — all implemented
- **48 test functions** scaffolded across 9 repos

## What Remains (Human-Required)

### Phase 1: Credentials & Access (r1)

Create Secret Manager secrets for all 78 venues. Start with API venues (7), then expand.

### Phase 2: Browser Selectors (r2–r7)

Fill Playwright CSS selectors for each venue's login, bet slip, and balance pages. Requires creating accounts on each
venue and inspecting DOM in headed browser mode. Grouped by region for parallel work streams.

### Phase 3: Quality Gates & Integration (r8, r11, r12)

Run QG across all repos, build Polymarket/Kalshi REST adapters, run E2E smoke test.

### Phase 4: Anti-Bot & Geo (r9, r10)

Integrate CAPTCHA solving and GeoComply for restricted venues.
