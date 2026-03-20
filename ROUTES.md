# Route Structure — Unified Trading System UI

Last updated: 2026-03-20

## Public Routes — `app/(public)/`

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Landing page (6 Commercial Offerings grid) | Active |
| `/login` | Authentication | Active |
| `/signup` | New user registration | Active |
| `/engagement` | Engagement models (how we work) | Active |
| `/docs` | API documentation | Active |
| `/investor-relations` | Investor/board slide deck | Active |
| `/contact` | Contact form | Active |
| `/services/data` | Data service marketing page (3-tab: Catalogue/Pricing/Demo) | Active |
| `/services/[domain]` | Service detail pages (public marketing) | Active |
| `/demo/preview` | Static demo showcase for presentations | Active |

## Platform Routes — `app/(platform)/`

All platform routes require authentication. Data scoped by org + entitlements.

### Service Hub

| Route | Purpose | Status |
|-------|---------|--------|
| `/overview` | Service hub — service grid, activity feed, quick actions, health bar | Active |
| `/service/[key]` | Per-service subscription page | Active |

### Data Service

| Route | Purpose | Status |
|-------|---------|--------|
| `/data` | Data service dashboard (was `/portal/data`) — org-scoped subscriptions, instrument views | Active |

### Trading Service (nested)

| Route | Purpose | Status |
|-------|---------|--------|
| `/trading` | Live Trading Platform — order entry, charts | Active |
| `/trading/positions` | Positions management (was `/positions`) | Active |
| `/trading/risk` | Risk dashboard (was `/risk`) | Active |
| `/trading/alerts` | Alert management (was `/alerts`) | Active |
| `/trading/markets` | Market overview (was `/markets`) | Active |

### Research Service (nested)

| Route | Purpose | Status |
|-------|---------|--------|
| `/research` | Research & Backtesting hub | Active |
| `/research/strategy/*` | Strategy platform — backtests, candidates (was `/strategy-platform/*`) | Active |
| `/research/ml/*` | ML models, features, experiments (was `/ml/*`) | Active |
| `/research/execution/*` | Execution research — algos, TCA | Active |

### Execution Service

| Route | Purpose | Status |
|-------|---------|--------|
| `/execution` | Live execution analytics | Active |

### Reports Service (nested)

| Route | Purpose | Status |
|-------|---------|--------|
| `/reports` | Reporting hub — P&L, settlement, attribution | Active |
| `/reports/executive` | Executive dashboard (was `/executive`) | Active |

### Health

| Route | Purpose | Status |
|-------|---------|--------|
| `/health` | Service health dashboard | Active |

## Ops Routes — `app/(ops)/`

Internal-only operational surfaces. Require auth + internal role.

| Route | Purpose | Status |
|-------|---------|--------|
| `/admin` | Admin dashboard — user, client, fee management | Active |
| `/admin/data` | Internal data admin (Odum only) — all orgs view | Active |
| `/devops` | DevOps dashboard — 6-tab layout (17K lines ported from deployment-ui) | Active |
| `/ops` | Service health, job monitoring | Active |
| `/manage/*` | Client/mandate/fee management | Active |
| `/compliance` | FCA info page (basic) | Active |
| `/config` | System configuration | Active |
| `/engagement` (ops) | Internal engagement admin | Active |
| `/internal/data-etl` | ETL pipeline management dashboard | Active |

## Redirects (Old Paths -> New Paths)

| Old Path | New Path | Notes |
|----------|----------|-------|
| `/portal/data` | `/data` | Data service moved into platform root |
| `/positions` | `/trading/positions` | Nested under trading |
| `/risk` | `/trading/risk` | Nested under trading |
| `/alerts` | `/trading/alerts` | Nested under trading |
| `/markets` | `/trading/markets` | Nested under trading |
| `/strategy-platform/*` | `/research/strategy/*` | Nested under research |
| `/ml/*` | `/research/ml/*` | Nested under research |
| `/executive` | `/reports/executive` | Nested under reports |
| `/pricing` | `/engagement` | Renamed (completed earlier) |
| `/presentation` | `/investor-relations` | Renamed (completed earlier) |

## Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SiteHeader` | `components/shell/site-header.tsx` | Single source of truth for navigation |

## Data Service Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ShardCatalogue` | `components/data/shard-catalogue.tsx` | Browse instruments by category/venue/folder |
| `FreshnessHeatmap` | `components/data/freshness-heatmap.tsx` | GitHub-style data availability calendar |
| `OrgDataSelector` | `components/data/org-data-selector.tsx` | Org dropdown (admin=all, client=locked) |
| `DataSubscriptionManager` | `components/data/data-subscription-manager.tsx` | Active subscription cards with usage |
| `CloudPricingSelector` | `components/data/cloud-pricing-selector.tsx` | GCP/AWS toggle with pricing |
| `DataServicesShowcase` | `components/marketing/data-services-showcase.tsx` | Now at /services/data |

## Data Service Types

| File | Path | Purpose |
|------|------|---------|
| `data-service-types.ts` | `lib/data-service-types.ts` | All TypeScript types including ETL pipeline types |
| `data-service-mock-data.ts` | `lib/data-service-mock-data.ts` | Mock data for demo/dev including ETL pipelines |

## Data Sharding Hierarchy

```
Asset Class (cefi, tradfi, defi, onchain_perps)
  └─ Venue (binance, databento, uniswap_v3, etc.)
      └─ Folder (perpetuals, spot, futures, pool_state, etc.)
          └─ Instrument (BTCUSDT, ES.c.0, USDC-ETH-0.05)
              └─ Data Type (ohlcv, trades, book_snapshot_5, etc.)
                  └─ Date (ISO format)
```

## ETL Pipeline Stages

1. **ingest** - Raw data pulled from source (exchange API, vendor, onchain)
2. **validate** - Schema validation & quality checks
3. **normalise** - Transform to unified schema
4. **enrich** - Add derived fields, signals
5. **store_gcp** - Write to GCP storage
6. **store_aws** - Replicate to AWS storage
7. **index** - Index for query performance

## Three Access Tiers (Data Service)

| Tier | Route | Who | Description |
|------|-------|-----|-------------|
| Demo | `/services/data` | Anyone | Mock data, no auth, sales preview |
| Client | `/data` | Signed-in orgs | Own subscriptions, query history, catalogue |
| Admin | `/admin/data` | Odum team | All orgs, pipeline health, billing |
| Internal | `/internal/data-etl` | Odum ops | Full ETL pipeline management |

## Navigation Links (SiteHeader)

- Platform (/)
- Engagement Models (/engagement)
- Documentation (/docs)
- Investor Relations (/investor-relations)
- Contact (/contact)
