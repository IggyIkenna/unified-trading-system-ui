# Sports Schema Paths

## Overview

This document defines the canonical GCS path structures for sports features and sports odds data. Paths use Hive-style
partitioning (key=value) for BigQuery external table compatibility and efficient date-based queries.

---

## Canonical Paths

### sports_features

```
sports_features/by_date/day={date}/feature_group={feature_group}/
```

| Partition     | Description                  | Example                                                  |
| ------------- | ---------------------------- | -------------------------------------------------------- |
| day           | Processing date (YYYY-MM-DD) | day=2025-03-04                                           |
| feature_group | Feature group identifier     | feature_group=team_features, feature_group=odds_features |

**Example full path:**

```
gs://<bucket>/sports_features/by_date/day=2025-03-04/feature_group=team_features/features.parquet
```

### sports_odds

```
sports_odds/by_date/day={date}/venue={venue}/
```

| Partition | Description                    | Example                       |
| --------- | ------------------------------ | ----------------------------- |
| day       | Processing date (YYYY-MM-DD)   | day=2025-03-04                |
| venue     | Odds provider/venue identifier | venue=BETFAIR, venue=PINNACLE |

**Example full path:**

```
gs://<bucket>/sports_odds/by_date/day=2025-03-04/venue=BETFAIR/odds.parquet
```

---

## Pre-Upload Validation: validate_timestamp_date_alignment

**Required:** Call `validate_timestamp_date_alignment()` before every GCS write. This is mandatory per
[schema-governance.md](./schema-governance.md) and the schema-service-owned rule.

```python
from unified_domain_client import validate_timestamp_date_alignment

# Before every write
validate_timestamp_date_alignment(df, date=processing_date)
writer.write(df)  # only after validation passes
```

| Check                   | Description                                   |
| ----------------------- | --------------------------------------------- |
| Timestamp column exists | At least one datetime column found            |
| Date alignment          | Timestamps match expected partition date      |
| Threshold               | % of aligned rows >= threshold (default 100%) |
| Timezone                | Timestamps must be UTC                        |

Services writing to `sports_features` or `sports_odds` must define schemas in `schemas/output_schemas.py` and run this
validation before upload. See [schema-governance.md](./schema-governance.md) for full validation requirements.

---

## Path Migration Reference

For migrating legacy paths (e.g. day-YYYY-MM-DD or flat folder structures) to Hive format, reference:

**`market-tick-data-service/scripts/migrate_gcs_path_to_hive.py`**

That script demonstrates:

- Dry-run vs execute mode
- Server-side copy (no download/re-upload)
- day- to day= and dimension folder to key=value transformations
- Project ID from config or GCP_PROJECT_ID
- Date range and category filtering

**Usage pattern:**

```bash
# Dry-run (preview)
python scripts/migrate_gcs_path_to_hive.py --project-id PROJECT --start-date 2025-01-01 --end-date 2025-01-10

# Execute
python scripts/migrate_gcs_path_to_hive.py --project-id PROJECT --start-date 2025-01-01 --end-date 2025-01-10 --execute
```

Sports services adapting similar migrations should follow the same pattern: dry-run first, then execute; use server-side
copy where possible; delete old paths only after verification.

---

## Related

- [schema-governance.md](./schema-governance.md) — Schema definition, validation, NaN handling
- [hive-schema-compatibility.md](./hive-schema-compatibility.md) — Hive partitioning rationale
- [sports-data-migration.md](./sports-data-migration.md) — Broader sports bucket refactoring

---

## Data Layer Separation

| Layer         | Service                                                  | Purpose                           | Odds? |
| ------------- | -------------------------------------------------------- | --------------------------------- | ----- |
| **Reference** | instruments-service                                      | Leagues, teams, stadiums, venues  | No    |
| **Features**  | features-sports-service                                  | 1000+ features, calculators, ML   | No    |
| **Market**    | market-tick-data-service, market-data-processing-service | Odds snapshots, ticks, sharp/soft | Yes   |

**Odds flow:** Odds come via market-tick-data-service (consumes UMI) and market-data-processing-service.
features-sports-service and strategy-service consume odds data; they never fetch directly from bookmakers. Interfaces
(UMI, USEI) own API keys.
