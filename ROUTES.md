# Route Structure - Front Layer

## Active Routes (Keep)

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Landing page (Platform) | Active - 6 Commercial Offerings grid |
| `/engagement` | Engagement models (how we work) | Active - uses SiteHeader |
| `/docs` | API documentation | Active - uses SiteHeader |
| `/investor-relations` | Investor/board slide deck | Active (moved from /presentation) |
| `/contact` | Contact form, all "get in touch" flows | Active - uses SiteHeader |
| `/services/data` | Data Provision public marketing page | Active - 3-tab (Catalogue/Pricing/Demo) |
| `/portal/data` | Client data portal (auth required) | Active - org-scoped subscriptions |
| `/admin/data` | Internal data admin (Odum only) | Active - all orgs view |
| `/admin` | Auth layer, role assignment | Needs build |
| `/demo/preview` | Static demo showcase for presentations | Active |
| `/login` | Authentication | Active |

## Internal Operations Routes (NEW)

| Route | Purpose | Status |
|-------|---------|--------|
| `/internal/data-etl` | ETL pipeline management dashboard | NEW - full pipeline visibility |

## Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SiteHeader` | `/components/shell/site-header.tsx` | Single source of truth for navigation |

## Data Service Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ShardCatalogue` | `/components/data/shard-catalogue.tsx` | Browse instruments by category/venue/folder |
| `FreshnessHeatmap` | `/components/data/freshness-heatmap.tsx` | GitHub-style data availability calendar |
| `OrgDataSelector` | `/components/data/org-data-selector.tsx` | Org dropdown (admin=all, client=locked) |
| `DataSubscriptionManager` | `/components/data/data-subscription-manager.tsx` | Active subscription cards with usage |
| `CloudPricingSelector` | `/components/data/cloud-pricing-selector.tsx` | GCP/AWS toggle with pricing |
| `DataServicesShowcase` | `/components/marketing/data-services-showcase.tsx` | Now at /services/data |

## Data Service Types

| File | Path | Purpose |
|------|------|---------|
| `data-service-types.ts` | `/lib/data-service-types.ts` | All TypeScript types including ETL pipeline types |
| `data-service-mock-data.ts` | `/lib/data-service-mock-data.ts` | Mock data for demo/dev including ETL pipelines |

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
| Client | `/portal/data` | Signed-in orgs | Own subscriptions, query history, catalogue |
| Admin | `/admin/data` | Odum team | All orgs, pipeline health, billing |
| Internal | `/internal/data-etl` | Odum ops | Full ETL pipeline management |

## Navigation Links (SiteHeader)

- Platform (/)
- Engagement Models (/engagement)
- Documentation (/docs)
- Investor Relations (/investor-relations)
- Contact (/contact)

## Routes to Delete (After Migration)

| Route | Reason |
|-------|--------|
| `/pricing` | Renamed to /engagement (DONE - deleted) |
| `/presentation` | Renamed to /investor-relations (DONE - moved) |
| `/strategy-platform/*` | Internal platform - separate app |
| `/data-platform/*` | Internal platform - separate app |
| `/client-portal/*` | Client-facing - separate app |
| `/api-gateway/*` | API layer - separate service |

## Refactoring Completed

- [x] Created shared `SiteHeader` component as single source of truth
- [x] Restored Commercial Offerings (6 services) to landing page
- [x] DataServicesShowcase moved to /services/data
- [x] Updated /engagement to use SiteHeader
- [x] Updated /docs to use SiteHeader
- [x] Updated /contact to use SiteHeader
- [x] Moved /presentation to /investor-relations
- [x] Built /services/data public marketing page with 3 tabs
- [x] Built /portal/data client portal page
- [x] Built /admin/data internal admin page
- [x] Built /internal/data-etl ETL pipeline dashboard
- [x] Added ETL pipeline types (ETLPipelineConfig, ETLStageStatus, etc.)
- [x] Added VenueCoverage and DataGap tracking types
- [x] Added mock ETL pipeline data for all venues
