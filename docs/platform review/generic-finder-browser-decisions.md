# Generic Finder Browser — Design Decisions

> **Source:** Platform review discussion 2026-03-26 (follow-up to meeting 2026-03-25)
> **Related:** Item 2 in `research-build-enhancements.md` (Features Visualisation shared with Data Pipeline)
> **Status:** Decided, pending implementation

---

## Decision: Extract Finder Layout as a Generic Component

**From discussion:**

The features catalogue page (`/services/research/features`) has 4 layout modes (finder, catalogue, grid, tree). The **Finder layout** is the best one — a macOS Finder-style progressive column drill-down with a permanent detail panel on the right.

**Decision:** Extract the Finder layout as a generic, reusable `<FinderBrowser>` component. Each consuming page provides:

1. **Column definitions** — an array of column configs (label, width, data source, render overrides)
2. **Detail panel renderer** — a function that receives current selections and returns JSX
3. **Context strip stats** — a function that computes aggregated metrics for the current scope

The generic component handles:

- Selection state management across N columns
- Progressive column reveal (columns appear as user drills deeper)
- Breadcrumb navigation (clickable path segments)
- Aggregated context strip (stats bar at top)
- Collapsible detail panel (open by default)
- `ColRow` highlight pattern (bg-primary on active, hover:bg-muted/60 on inactive)

---

## Column Hierarchies per Page

Derived from `deployment-service/configs/sharding_config.yaml` (SSOT for sharding dimensions).

### Feature Catalogue (`/services/research/features`)

| Col 1                                                 | Col 2                                 | Col 3                                    | Col 4 (items)                         |
| ----------------------------------------------------- | ------------------------------------- | ---------------------------------------- | ------------------------------------- |
| Service (features-delta-one, features-calendar, etc.) | Category (momentum, volatility, etc.) | Group (EMA variants, RSI variants, etc.) | Individual features (paged, 100/page) |

**Detail panel:** Feature config, parameters, version history, model usage, dependencies, tags.

### Instruments (`/services/data/instruments`)

| Col 1                                 | Col 2                                              | Col 3 (items)          |
| ------------------------------------- | -------------------------------------------------- | ---------------------- |
| Category (cefi, defi, tradfi, sports) | Venue (BINANCE-SPOT, DERIBIT, UNISWAPV3-ETH, etc.) | Individual instruments |

**Detail panel:** Symbol, exchange, instrument type, base/quote asset, contract size, listing date, status.

**Source:** `sharding_config.yaml` → `instruments-service.batch.dimensions: [category, venue, date]`
**Data:** `data-catalogue.instruments-service.yaml` — venue listings per category with start dates.

### Raw Data (`/services/data/raw`)

| Col 1                                 | Col 2 | Col 3                                                   | Col 4 (items)                                                 |
| ------------------------------------- | ----- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Category (cefi, defi, tradfi, sports) | Venue | Instrument Type (spot, perpetual, future, option, odds) | Data Types (trades, book_snapshot_5, derivative_ticker, etc.) |

**Detail panel:** Completion %, date range, total size, freshness, upstream venue status, sample rate.

**Source:** `sharding_config.yaml` → `market-tick-data-service.batch.dimensions: [category, venue, instrument_type, data_type, date]`
**Data:** `data-catalogue.market-tick-data-service.yaml` — completion percentages per data type.

### Processed Data (`/services/data/processing`)

| Col 1                         | Col 2 | Col 3           | Col 4 (items)                                   |
| ----------------------------- | ----- | --------------- | ----------------------------------------------- |
| Category (cefi, defi, tradfi) | Venue | Instrument Type | Timeframes (15s, 1min, 5min, 15min, 1h, 4h, 1d) |

**Detail panel:** Completion %, processing lag, upstream dependency status, OHLCV bar count, blocked/ready indicator.

**Source:** `sharding_config.yaml` → `market-data-processing-service.batch.dimensions: [category, venue, instrument_type, date, timeframe]`
**Data:** `data-catalogue.market-data-processing-service.yaml` — all currently 0% (blocked upstream).

---

## Detail Panel Behaviour

- **Collapsible** — toggle button on panel header
- **Open by default** — users see detail immediately
- **Generic** — each page provides its own renderer; the Finder just wraps it in the collapsible container
- **Context-aware** — shows summary stats at higher levels, full detail at the leaf (item) level

---

## Design Notes

- Column count varies per page (3 for instruments, 4 for features/raw/processed) — the generic component handles this via the `columns` array length and `visibleWhen` conditions
- The `date` dimension from sharding config is NOT a column — dates are a detail/filter concern, not a drill-down axis
- Column widths: first columns are fixed-width (w-[148px] to w-[210px]), the last column before the detail panel is `flex-1`
- The detail panel width defaults to `w-[420px]` but can be overridden per page
- Pagination (100 items/page) applies only to the last column when item count is large
