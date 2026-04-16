# F — Widget Registry, Merging & Preset Audit

**Date:** 2026-03-28  
**Scope:** `components/widgets/widget-registry.ts`, `components/widgets/preset-registry.ts`, all `components/widgets/*/register.ts` (16 domains), related trading `app/(platform)/services/trading/*/page.tsx` side-effect imports  
**Previous audit:** First audit

## 1. Current State

- **Registration API:** `registerWidget(def)` stores definitions in a `Map` (`widget-registry.ts`). Each definition includes `id`, `label`, `description`, `icon`, `category`, grid `minW`/`minH`/`defaultW`/`defaultH`, optional `maxW`/`maxH`, `requiredEntitlements`, `availableOn` (tab ids), optional `singleton`, and `component`.
- **Preset API:** `registerPresets(tab, presets[])` appends to a per-tab list (`preset-registry.ts`). `getPresetsForTab` injects a synthetic **Blank Canvas** preset when no empty layout exists.
- **Domains:** 16 folders each own a `register.ts`: `accounts`, `alerts`, `book`, `bundles`, `defi`, `instructions`, `markets`, `options`, `orders`, `overview`, `pnl`, `positions`, `predictions`, `risk`, `sports`, `strategies`, `terminal`.
- **Entitlements:** Almost all execution widgets require `["execution-basic", "execution-full"]`. Exception: `calendar-events` (`terminal/register.ts`) uses `["data-basic", "data-pro"]` and is available on `terminal` and `overview`.
- **Non-singleton widgets (5):** `instr-detail-panel`, `options-greek-surface`, `sports-live-scores`, `order-book`, `price-chart` — duplicate instances allowed (`instructions/register.ts` L80–81; `options/register.ts` L188–189; `sports/register.ts` L116–117; `terminal/register.ts` L67–68, L81–82).
- **Total registered widgets:** **104** across 16 domains.

## 2. Findings

### 2.1 Full widget inventory (by domain / `register.ts`)

Group columns: **ID** · **Label** · **min W×H** · **default W×H** · **singleton** · **availableOn** · **Description (short)**

#### Accounts (`components/widgets/accounts/register.ts`)

| Widget ID                   | Label              | min | default | S   | Tabs     | Notes         |
| --------------------------- | ------------------ | --- | ------- | --- | -------- | ------------- |
| `accounts-kpi-strip`        | NAV Summary        | 3×1 | 12×2    | Y   | accounts | KPI strip     |
| `accounts-balance-table`    | Per-Venue Balances | 6×3 | 12×5    | Y   | accounts | Table         |
| `accounts-margin-util`      | Margin Utilization | 4×3 | 12×4    | Y   | accounts | Utilization   |
| `accounts-transfer`         | Transfer Panel     | 3×4 | 4×7     | Y   | accounts | Actions       |
| `accounts-transfer-history` | Transfer History   | 4×3 | 8×4     | Y   | accounts | Table/history |

#### Alerts (`alerts/register.ts`)

| Widget ID            | Label         | min | default | S   | Tabs   | Notes           |
| -------------------- | ------------- | --- | ------- | --- | ------ | --------------- |
| `alerts-kpi-strip`   | Alert Summary | 4×1 | 12×2    | Y   | alerts | KPI strip       |
| `alerts-table`       | Alert Feed    | 6×5 | 12×9    | Y   | alerts | Main table      |
| `alerts-kill-switch` | Kill Switch   | 3×4 | 4×6     | Y   | alerts | Control surface |

#### Trade Booking (`book/register.ts`)

| Widget ID                 | Label                | min | default | S   | Tabs | Notes                 |
| ------------------------- | -------------------- | --- | ------- | --- | ---- | --------------------- |
| `book-trade-history`      | Trade History        | 6×4 | 12×8    | Y   | book | Table (top in preset) |
| `book-hierarchy-bar`      | Hierarchy Selector   | 6×1 | 12×1    | Y   | book | Context strip         |
| `book-order-form`         | Book Order Entry     | 4×5 | 6×8     | Y   | book | Core form             |
| `book-algo-config`        | Algo Configuration   | 3×3 | 6×4     | Y   | book | Params                |
| `book-record-details`     | Record Details       | 3×3 | 6×3     | Y   | book | Record-only fields    |
| `book-preview-compliance` | Preview & Compliance | 4×3 | 6×5     | Y   | book | Preview               |

#### Bundles (`bundles/register.ts`)

| Widget ID            | Label               | min | default | S   | Tabs    | Notes                 |
| -------------------- | ------------------- | --- | ------- | --- | ------- | --------------------- |
| `bundle-templates`   | Bundle Templates    | 3×3 | 4×5     | Y   | bundles | Gallery               |
| `bundle-steps`       | Execution Steps     | 4×4 | 8×7     | Y   | bundles | Flow editor           |
| `bundle-pnl`         | P&L Estimate        | 3×2 | 4×3     | Y   | bundles | KPIs                  |
| `bundle-actions`     | Bundle Actions      | 3×1 | 4×1     | Y   | bundles | CTA bar               |
| `defi-atomic-bundle` | DeFi Atomic Bundles | 4×5 | 8×8     | Y   | bundles | DeFi-specific builder |

#### DeFi (`defi/register.ts`)

| Widget ID             | Label               | min | default | S   | Tabs | Notes      |
| --------------------- | ------------------- | --- | ------- | --- | ---- | ---------- |
| `defi-wallet-summary` | Wallet Summary      | 3×2 | 4×2     | Y   | defi | KPI/header |
| `defi-lending`        | DeFi Lending        | 3×4 | 4×6     | Y   | defi | Panel      |
| `defi-swap`           | DeFi Swap           | 3×4 | 4×6     | Y   | defi | Panel      |
| `defi-liquidity`      | Liquidity Provision | 3×5 | 4×7     | Y   | defi | Panel      |
| `defi-staking`        | Staking             | 3×4 | 4×6     | Y   | defi | Panel      |
| `defi-flash-loans`    | Flash Loan Builder  | 4×5 | 6×7     | Y   | defi | Multi-step |
| `defi-transfer`       | Transfer & Bridge   | 3×4 | 4×6     | Y   | defi | Panel      |
| `defi-rates-overview` | Rates Overview      | 4×3 | 8×4     | Y   | defi | Comparison |

#### Instructions (`instructions/register.ts`)

| Widget ID              | Label                | min | default | S     | Tabs         | Notes         |
| ---------------------- | -------------------- | --- | ------- | ----- | ------------ | ------------- |
| `instr-summary`        | Pipeline Summary     | 4×1 | 12×1    | Y     | instructions | KPI strip     |
| `instr-pipeline-table` | Instruction Pipeline | 6×6 | 12×11   | Y     | instructions | Main table    |
| `instr-detail-panel`   | Instruction Detail   | 4×3 | 12×3    | **N** | instructions | Master-detail |

#### Markets (`markets/register.ts`)

| Widget ID                 | Label              | min | default | S   | Tabs    | Notes         |
| ------------------------- | ------------------ | --- | ------- | --- | ------- | ------------- |
| `markets-controls`        | Markets Controls   | 4×1 | 12×1    | Y   | markets | Control bar   |
| `markets-order-flow`      | Market Order Flow  | 6×4 | 12×7    | Y   | markets | Main feed     |
| `markets-live-book`       | Live Order Book    | 8×4 | 12×7    | Y   | markets | Book          |
| `markets-my-orders`       | My Orders          | 6×3 | 12×5    | Y   | markets | Orders        |
| `markets-recon`           | Reconciliation     | 4×3 | 12×4    | Y   | markets | Recon         |
| `markets-latency-summary` | Latency Summary    | 4×3 | 12×5    | Y   | markets | KPI list      |
| `markets-latency-detail`  | Latency Detail     | 6×4 | 12×6    | Y   | markets | Detail charts |
| `markets-defi-amm`        | DeFi Pool Activity | 6×3 | 12×5    | Y   | markets | DeFi table    |

#### Options & Futures (`options/register.ts`)

| Widget ID               | Label               | min | default | S     | Tabs    | Notes       |
| ----------------------- | ------------------- | --- | ------- | ----- | ------- | ----------- |
| `options-control-bar`   | Options Controls    | 6×1 | 12×1    | Y     | options | Control bar |
| `options-watchlist`     | Watchlist           | 2×4 | 3×10    | Y     | options | Side list   |
| `options-chain`         | Options Chain       | 6×5 | 9×8     | Y     | options | Grid        |
| `options-trade-panel`   | Options Trade Panel | 3×4 | 3×6     | Y     | options | Entry       |
| `futures-table`         | Futures Table       | 5×4 | 9×6     | Y     | options | Table       |
| `futures-trade-panel`   | Futures Trade Panel | 3×3 | 3×5     | Y     | options | Entry       |
| `options-strategies`    | Strategy Builder    | 5×4 | 9×6     | Y     | options | Builder     |
| `options-scenario`      | Scenario Analysis   | 5×4 | 9×6     | Y     | options | Scenario    |
| `options-greek-surface` | Greek / vol surface | 4×3 | 6×4     | **N** | options | Surface     |

#### Orders (`orders/register.ts`)

| Widget ID          | Label         | min | default | S   | Tabs   | Notes      |
| ------------------ | ------------- | --- | ------- | --- | ------ | ---------- |
| `orders-kpi-strip` | Order Summary | 4×1 | 12×1    | Y   | orders | KPI strip  |
| `orders-table`     | Orders Table  | 6×5 | 12×10   | Y   | orders | Main table |

#### Overview (`overview/register.ts`)

| Widget ID         | Label                       | min | default | S   | Tabs     | Notes     |
| ----------------- | --------------------------- | --- | ------- | --- | -------- | --------- |
| `scope-summary`   | Scope & Controls            | 4×1 | 12×2    | Y   | overview | Header    |
| `pnl-chart`       | P&L / NAV / Exposure Charts | 3×2 | 12×4    | Y   | overview | Charts    |
| `kpi-strip`       | Key Metrics                 | 3×1 | 12×2    | Y   | overview | KPI strip |
| `strategy-table`  | Strategy Performance        | 4×2 | 12×4    | Y   | overview | Table     |
| `pnl-attribution` | P&L Attribution             | 2×2 | 3×3     | Y   | overview | Tile      |
| `alerts-preview`  | Alerts                      | 2×2 | 3×3     | Y   | overview | Tile      |
| `recent-fills`    | Recent Fills                | 2×2 | 3×3     | Y   | overview | Tile      |
| `health-grid`     | System Health               | 2×2 | 3×3     | Y   | overview | Tile      |

#### P&L (`pnl/register.ts`)

| Widget ID              | Label            | min | default | S   | Tabs | Notes           |
| ---------------------- | ---------------- | --- | ------- | --- | ---- | --------------- |
| `pnl-controls`         | P&L Controls     | 4×2 | 12×2    | Y   | pnl  | Control surface |
| `pnl-waterfall`        | P&L Waterfall    | 4×4 | 7×8     | Y   | pnl  | Chart           |
| `pnl-time-series`      | P&L Time Series  | 4×3 | 12×5    | Y   | pnl  | Chart           |
| `pnl-by-client`        | P&L by Client    | 3×3 | 5×8     | Y   | pnl  | Table           |
| `pnl-factor-drilldown` | Factor Breakdown | 4×3 | 12×5    | Y   | pnl  | Drilldown       |
| `pnl-report-button`    | P&L Report       | 2×1 | 2×1     | Y   | pnl  | CTA             |

#### Positions (`positions/register.ts`)

| Widget ID             | Label            | min | default | S   | Tabs      | Notes      |
| --------------------- | ---------------- | --- | ------- | --- | --------- | ---------- |
| `positions-kpi-strip` | Position Summary | 4×1 | 12×2    | Y   | positions | KPI strip  |
| `account-balances`    | Account Balances | 4×2 | 12×3    | Y   | positions | Balances   |
| `positions-table`     | Positions Table  | 6×5 | 12×8    | Y   | positions | Main table |

#### Predictions (`predictions/register.ts`)

| Widget ID                | Label             | min | default | S   | Tabs        | Notes     |
| ------------------------ | ----------------- | --- | ------- | --- | ----------- | --------- |
| `pred-markets-grid`      | Markets           | 4×4 | 8×7     | Y   | predictions | Grid      |
| `pred-market-detail`     | Market Detail     | 4×5 | 4×7     | Y   | predictions | Detail    |
| `pred-portfolio-kpis`    | Portfolio KPIs    | 4×1 | 12×2    | Y   | predictions | KPI strip |
| `pred-open-positions`    | Open Positions    | 6×3 | 12×4    | Y   | predictions | Table     |
| `pred-settled-positions` | Settled Positions | 6×2 | 12×3    | Y   | predictions | Table     |
| `pred-odum-focus`        | ODUM Focus        | 4×4 | 12×6    | Y   | predictions | Charts    |
| `pred-arb-stream`        | Arb Stream        | 4×4 | 6×6     | Y   | predictions | Stream    |
| `pred-arb-closed`        | Closed Arbs       | 3×3 | 6×4     | Y   | predictions | List      |
| `pred-trade-panel`       | Quick Trade       | 4×5 | 6×7     | Y   | predictions | Entry     |
| `pred-top-markets`       | Top Markets       | 3×3 | 6×4     | Y   | predictions | Cards     |
| `pred-recent-fills`      | Recent Trades     | 3×3 | 6×4     | Y   | predictions | List      |

#### Risk (`risk/register.ts`)

| Widget ID                   | Label                  | min | default | S   | Tabs | Notes      |
| --------------------------- | ---------------------- | --- | ------- | --- | ---- | ---------- |
| `risk-kpi-strip`            | Risk KPIs              | 4×1 | 12×2    | Y   | risk | KPI strip  |
| `risk-strategy-heatmap`     | Strategy Heatmap       | 6×3 | 12×4    | Y   | risk | Heatmap    |
| `risk-utilization`          | Highest Utilization    | 4×2 | 12×3    | Y   | risk | Bars       |
| `risk-var-chart`            | Component VaR          | 4×3 | 12×4    | Y   | risk | Chart      |
| `risk-stress-table`         | Stress Scenarios       | 6×3 | 12×4    | Y   | risk | Table      |
| `risk-exposure-attribution` | Exposure Attribution   | 6×3 | 12×5    | Y   | risk | Table + TS |
| `risk-greeks-summary`       | Portfolio Greeks       | 4×2 | 12×5    | Y   | risk | Greeks     |
| `risk-margin`               | Margin & Health        | 4×3 | 6×5     | Y   | risk | Margin     |
| `risk-term-structure`       | Term Structure         | 4×3 | 6×4     | Y   | risk | Bars       |
| `risk-limits-hierarchy`     | Limits Hierarchy       | 6×3 | 12×5    | Y   | risk | Tree       |
| `risk-what-if-slider`       | What-If Slider         | 4×2 | 12×2    | Y   | risk | Slider     |
| `risk-circuit-breakers`     | Circuit Breaker Status | 4×2 | 12×3    | Y   | risk | Cards      |
| `risk-correlation-heatmap`  | Correlation Heatmap    | 4×3 | 12×4    | Y   | risk | Matrix     |

#### Sports (`sports/register.ts`)

| Widget ID               | Label          | min | default | S     | Tabs   | Notes     |
| ----------------------- | -------------- | --- | ------- | ----- | ------ | --------- |
| `sports-fixtures`       | Fixtures       | 4×6 | 8×10    | Y     | sports | List/grid |
| `sports-fixture-detail` | Fixture Detail | 4×5 | 4×8     | Y     | sports | Detail    |
| `sports-arb`            | Arb Scanner    | 4×4 | 6×6     | Y     | sports | Scanner   |
| `sports-my-bets`        | My Bets        | 4×3 | 12×5    | Y     | sports | Positions |
| `sports-live-scores`    | Live Scores    | 3×1 | 12×1    | **N** | sports | Ticker    |

#### Strategies (`strategies/register.ts`)

| Widget ID              | Label            | min | default | S   | Tabs       | Notes     |
| ---------------------- | ---------------- | --- | ------- | --- | ---------- | --------- |
| `strategies-kpi-strip` | Strategy Summary | 4×1 | 12×2    | Y   | strategies | KPI strip |
| `strategies-catalogue` | Strategy List    | 6×6 | 12×9    | Y   | strategies | Grid      |
| `strategies-grid-link` | Batch Grid Link  | 4×1 | 12×1    | Y   | strategies | CTA       |

#### Terminal (`terminal/register.ts`)

| Widget ID         | Label                | min | default | S     | Tabs                   | Notes       |
| ----------------- | -------------------- | --- | ------- | ----- | ---------------------- | ----------- |
| `instrument-bar`  | Instrument & Account | 4×1 | 12×1    | Y     | terminal               | Control bar |
| `order-book`      | Order Book           | 2×2 | 3×8     | **N** | terminal               | Ladder      |
| `price-chart`     | Price Chart          | 3×2 | 6×8     | **N** | terminal               | Chart       |
| `order-entry`     | Order Entry          | 2×3 | 3×8     | Y     | terminal               | Form        |
| `market-trades`   | Market Trades        | 2×2 | 6×3     | Y     | terminal               | Tape        |
| `calendar-events` | Calendar Events      | 3×2 | 6×3     | Y     | **terminal, overview** | Calendar    |

---

### 2.2 Merge candidate analysis

| Domain           | Pattern                   | Current widget IDs                                                                                            | Proposed merged widget                                                                                                                              | Effort                                                                                            | Constraints                                                                                                                         |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **book**         | Multi-step flow           | `book-hierarchy-bar`, `book-order-form`, `book-algo-config`, `book-record-details`, `book-preview-compliance` | **Trade entry workspace** — single resizable panel with steps/sections (hierarchy → form → algo → record → preview) and persistent validation state | 🟡 **High** — ~800–1500 LOC refactor across 5 components + layout; new container + shared context | All **singleton: true** — merge aligns with one logical workflow; `book-trade-history` may stay separate or as tab inside workspace |
| **book**         | Master + auxiliary        | `book-trade-history` + above                                                                                  | Optional: **split view** history + entry, or tabs within one widget                                                                                 | 🟡 High                                                                                           | Default preset stacks history above entry — merging reduces vertical scroll                                                         |
| **orders**       | KPI + table               | `orders-kpi-strip`, `orders-table`                                                                            | **Orders dashboard** — sticky summary strip + table (shared filters)                                                                                | 🟢 **Medium** — ~200–400 LOC                                                                      | Both singleton; **high** value / low risk                                                                                           |
| **positions**    | KPI + balances + table    | `positions-kpi-strip`, `account-balances`, `positions-table`                                                  | **Positions workspace** — unified filter context + collapsible balances strip                                                                       | 🟡 High                                                                                           | Three singletons; balances overlap **Accounts** domain — watch duplication with `accounts-balance-table`                            |
| **accounts**     | KPI + related tables      | `accounts-kpi-strip`, `accounts-balance-table`, `accounts-margin-util`                                        | **Accounts overview** — single scroll with sections (or tabs: Balances / Margin)                                                                    | 🟡 High                                                                                           | Transfer + history stay separate panels unless “money movement” merged later                                                        |
| **alerts**       | KPI + table + control     | `alerts-kpi-strip`, `alerts-table`, `alerts-kill-switch`                                                      | **Alerts console** — KPI + feed + docked kill switch (right rail)                                                                                   | 🟡 High                                                                                           | Kill switch must remain **high visibility** — layout merge, not hiding                                                              |
| **strategies**   | KPI + grid + CTA          | `strategies-kpi-strip`, `strategies-catalogue`, `strategies-grid-link`                                        | **Strategies hub** — KPI header + catalogue + footer CTA as one card stack                                                                          | 🟢 Medium                                                                                         | Grid link is thin — easy to fold as footer                                                                                          |
| **markets**      | Controls + surface        | `markets-controls` + (`markets-order-flow` \| `markets-live-book`)                                            | **Markets desk shell** — control bar as slot/facade over active surface                                                                             | 🟡 High                                                                                           | Presets already pair controls with surfaces; formal merge simplifies preset rows                                                    |
| **options**      | Controls + chain + trade  | `options-control-bar`, `options-chain`, `options-trade-panel`, `futures-table`, `futures-trade-panel`         | **Derivatives workspace** — resizable 3-column (watchlist / chain / ticket) with futures mode                                                       | 🔴 **Critical scope** — 1–2 dev-weeks                                                             | `futures-trade-panel` **orphaned from default preset** (see 2.3) — merge or preset fix urgent                                       |
| **pnl**          | Controls + charts         | `pnl-controls` + waterfall/time series/client                                                                 | Already cohesive presets; optional **single “P&L shell”** with inner tabs                                                                           | 🟢 Medium                                                                                         | Less urgent than book/options                                                                                                       |
| **defi**         | Wallet header + panels    | `defi-wallet-summary` + active panel                                                                          | **DeFi shell** — wallet ribbon + tabbed or stepped panels                                                                                           | 🟡 High                                                                                           | Many equal-weight panels; merge risks hiding liquidity/staking                                                                      |
| **bundles**      | Steps + P&L + actions     | `bundle-steps`, `bundle-pnl`, `bundle-actions`                                                                | **Bundle builder** — right-rail summary + bottom action bar                                                                                         | 🟡 High                                                                                           | `defi-atomic-bundle` is parallel builder — consider tab inside one “Bundles” widget                                                 |
| **instructions** | KPI + table + detail      | `instr-summary`, `instr-pipeline-table`, `instr-detail-panel`                                                 | **Instruction console** — split pane with optional detail                                                                                           | 🟢 Medium                                                                                         | Detail is **singleton: false** — merge should preserve optional second detail or tab                                                |
| **predictions**  | Grid + trade              | `pred-markets-grid`, `pred-trade-panel`                                                                       | **Prediction desk** — master-detail + ticket                                                                                                        | 🟡 High                                                                                           | `pred-market-detail` exists but underused in presets                                                                                |
| **sports**       | List + detail             | `sports-fixtures`, `sports-fixture-detail`                                                                    | Already **master-detail** in presets — optional single widget with split pane                                                                       | 🟢 Medium                                                                                         | Good candidate for code merge without UX change                                                                                     |
| **risk**         | Many independent analyses | 13 widgets                                                                                                    | **Do not merge wholesale** — instead **Risk shell** with **tabs/sections** and lazy-loaded panels                                                   | 🔴 Critical — multi-week                                                                          | CRO preset is very tall — **layout composition** beats widget count reduction                                                       |

**Severity summary:** 🔴 Book + Options + Risk need architectural decisions before blind merges. 🟡 Accounts/Positions/Markets/Predictions have clear KPI+table or control+surface patterns. 🟢 Orders/Strategies/Instructions/Sports are smaller wins.

---

### 2.3 Preset coverage

| Tab              | Presets (from `register.ts`)                              | Widgets included (summary)                                                                                                              | Notes vs merge analysis                                                        |
| ---------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **accounts**     | `accounts-default`                                        | KPI strip, balance table, transfer, margin util, transfer history                                                                       | Includes all 5 registered widgets — **good**                                   |
| **alerts**       | `alerts-default`                                          | KPI strip, table, kill switch                                                                                                           | Full coverage                                                                  |
| **book**         | `book-default`                                            | Trade history, hierarchy, order form, algo, record details, preview/compliance                                                          | All 6 widgets — **very tall** canvas; merge would simplify preset              |
| **bundles**      | `bundles-default`, `bundles-compact`                      | All 5 widgets (different layout)                                                                                                        | Full coverage                                                                  |
| **defi**         | `defi-default`, `defi-advanced`                           | Default: wallet, lending, swap, staking, rates, transfer — **no liquidity** in default                                                  | **Gap:** `defi-liquidity` only in advanced                                     |
| **instructions** | `instructions-default`, `instructions-with-detail`        | Default omits `instr-detail-panel`; “with detail” adds it                                                                               | Intentional — **good**                                                         |
| **markets**      | `markets-default`, `markets-live-book`, `markets-latency` | None include **`markets-defi-amm`**                                                                                                     | **Gap:** DeFi pool widget never preset                                         |
| **options**      | `options-default`, `options-strategies-preset`            | Default has chain, trade panel, greek surface, futures table — **no `futures-trade-panel`**                                             | **Gap:** Futures flow incomplete on first load                                 |
| **orders**       | `orders-default`                                          | Both widgets                                                                                                                            | Full                                                                           |
| **overview**     | `overview-default`                                        | 8 widgets — **no `calendar-events`** despite `availableOn`                                                                              | **Gap:** data entitlement widget hidden until manual add                       |
| **pnl**          | `pnl-default`, `pnl-time-series`                          | Neither includes **`pnl-report-button`**                                                                                                | **Gap:** CTA only via catalogue                                                |
| **positions**    | `positions-default`                                       | All 3                                                                                                                                   | Full                                                                           |
| **predictions**  | `predictions-default`, `predictions-arb-focus`            | Default: grid, trade panel, KPIs, open positions — omits **`pred-market-detail`**, **`pred-settled-positions`**, **`pred-top-markets`** | **Gap:** detail widget underrepresented; settled/top markets discovery         |
| **risk**         | `risk-cro-briefing`, `risk-quick`                         | Quick omits 9 widgets (by design)                                                                                                       | **Expectation:** power users use catalogue or duplicate tab — OK if documented |
| **sports**       | `sports-default`, `sports-arb-focus`                      | Default: fixtures, detail, my bets — **no `sports-live-scores`** in default                                                             | **Gap:** ticker only in arb preset                                             |
| **strategies**   | `strategies-default`                                      | All 3                                                                                                                                   | Full                                                                           |
| **terminal**     | `terminal-default`                                        | All except user-added duplicates for multi book/chart                                                                                   | **Full** for singleton set                                                     |

**Synthetic preset:** Every tab with registered presets also gets **Blank Canvas** via `getPresetsForTab` (`preset-registry.ts` L12–25).

**Tabs with NO presets:** None of the 16 trading widget tabs are missing `registerPresets` — each domain file calls `registerPresets`.

**User expectation:** Default layouts are generally credible **trade-desk** views; weakest first-run stories are **options futures ticket**, **markets DeFi AMM**, **overview calendar** (entitlement-gated), and **predictions market detail / settled / top markets**.

---

### 2.4 Widget configuration & UX gaps

| Issue                        | Widget(s)                                                          | Evidence                                                                                       | Severity  | Recommendation                                                                       |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| Preset omission              | `futures-trade-panel`                                              | `options/register.ts` L26 — `futures-table` without adjacent ticket                            | 🟡 High   | Add column or second preset “Futures focus”; or merge with table widget              |
| Preset omission              | `markets-defi-amm`                                                 | No preset in `markets/register.ts` L22–64                                                      | 🟡 High   | Add “DeFi markets” preset or row in default                                          |
| Preset omission              | `pnl-report-button`                                                | Not in `pnl` presets (`pnl/register.ts` L11–39)                                                | 🟢 Medium | Add slim row to default or dock in `pnl-controls`                                    |
| Preset omission              | `calendar-events`                                                  | `availableOn` includes `overview` (`terminal/register.ts` L130) but `overview` preset omits it | 🟢 Medium | Add tile preset variant “Overview + calendar” or document data entitlement           |
| Preset omission              | `pred-market-detail`, `pred-settled-positions`, `pred-top-markets` | `predictions-default` layouts (`predictions/register.ts` L36–41)                               | 🟡 High   | Second preset “Research” or split grid/detail default                                |
| Preset omission              | `sports-live-scores`                                               | Only in `sports-arb-focus`                                                                     | 🟢 Medium | Add 1-row ticker to `sports-default`                                                 |
| Minimum size risk            | `accounts-kpi-strip`                                               | `minW: 3` (`accounts/register.ts` L40) for multi-metric strip                                  | 🟢 Medium | Raise `minW` to 4–6 or enable overflow scroll                                        |
| Minimum size risk            | `bundle-actions`                                                   | `minH: 1` — single-row CTAs                                                                    | 🟢 Medium | Verify touch target / wrap on narrow widths                                          |
| Tall canvas / scroll         | `risk-cro-briefing`                                                | 13 widgets, y up to 34+ (`risk/register.ts` L39–52)                                            | 🟡 High   | Prefer sections/tabs or multiple presets over one vertical stack                     |
| Empty state (catalogue scan) | Many data-heavy widgets                                            | Repo-wide: only **3** widget `*.tsx` files match empty-state phrases in quick ripgrep          | 🟡 High   | **Verify per-widget** — likely inconsistent empty handling (audit Module L overlaps) |
| Duplicate conceptual surface | `account-balances` vs `accounts-balance-table`                     | Different tabs but similar data domain                                                         | 🟢 Medium | Align copy, filters, and eventually shared data hook                                 |

---

## 3. Worst Offenders

| Rank | File / area                                      | Issue                                                            | Approx. impact           |
| ---- | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------ |
| 1    | `book/register.ts` + preset                      | Six-widget vertical workflow — highest merge ROI and scroll pain | Structural               |
| 2    | `options/register.ts`                            | `futures-trade-panel` registered but not in default preset       | Functional gap           |
| 3    | `markets/register.ts`                            | `markets-defi-amm` never appears in a preset                     | Discovery gap            |
| 4    | `risk/register.ts`                               | `risk-cro-briefing` stacks 13 widgets in one column              | Performance / UX scroll  |
| 5    | `predictions/register.ts`                        | Several registered widgets absent from `predictions-default`     | Incomplete default story |
| 6    | `pnl/register.ts`                                | `pnl-report-button` orphaned from presets                        | Minor CTA visibility     |
| 7    | `overview/register.ts` vs `terminal/register.ts` | `calendar-events` on overview but not in overview preset         | Cross-tab inconsistency  |
| 8    | `accounts/register.ts`                           | `accounts-kpi-strip` `minW: 3` may be tight for content          | Layout breakage risk     |

---

## 4. Recommended Fixes

1. **Options — ship `futures-trade-panel` in a first-run layout**  
   Extend `options-default` or add `options-futures` preset with `futures-table` + `futures-trade-panel` side-by-side or stacked.

2. **Markets — surface DeFi**  
   Add preset `markets-defi` or one row in `markets-default` including `markets-defi-amm` for DeFi entitlement users (when wired).

3. **Book — phased merge**  
   Phase 1: shared React context for hierarchy + order + algo state. Phase 2: single `BookTradeWorkspace` widget with internal sections; keep `book-trade-history` as sibling or tab.

4. **Orders / Strategies — quick wins**  
   Compose `orders-kpi-strip` + `orders-table` in one parent widget (props drilling or context). Fold `strategies-grid-link` into catalogue footer.

5. **Risk — decompose “CRO” vertically**  
   Replace mega-column with 2–3 presets: “Macro”, “Limits & stress”, “Greeks & correlation” or use tabbed container widget.

6. **Predictions — preset parity**  
   Add preset including `pred-market-detail` (master-detail) and optionally `pred-settled-positions`.

7. **P&L / Overview**  
   Add `pnl-report-button` to `pnl-default` footer; add optional overview preset variant with `calendar-events` for `data-basic` users.

8. **Empty states**  
   Run a follow-up pass (align Module L) ensuring each data widget uses shared `EmptyState` pattern from design system.

---

## 5. Remediation Priority

| Phase            | Focus                                                                                               | Effort  | Outcome                              |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------- | ------------------------------------ |
| **P0 (0.5–1 d)** | Fix **options** preset for `futures-trade-panel`; add **markets** preset row for `markets-defi-amm` | ~4–8 h  | Removes functional/discovery holes   |
| **P1 (2–4 d)**   | **Book** workspace spike — context + layout prototype                                               | ~2–4 d  | Validates merge approach             |
| **P2 (3–5 d)**   | **Orders** + **Strategies** compositional merges                                                    | ~3–5 d  | Reduces widget count and preset rows |
| **P3 (1–2 w)**   | **Risk** preset split / shell                                                                       | ~1–2 w  | Improves load and navigation         |
| **P4 (ongoing)** | **Positions vs Accounts** balance deduplication + empty states                                      | Ongoing | Data model and UX consistency        |

**Effort totals (rough):** P0 **<1 dev-day**; full book+options+risk program **2–4+ dev-weeks** depending on test coverage and API wiring.
