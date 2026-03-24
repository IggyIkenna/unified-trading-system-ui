# Sports Data Migration: GCS Bucket Refactoring

**Priority:** P1-high
**Owner:** Harsh
**Status:** Specification Phase
**Target:** Before sports implementation begins

---

## Overview

This document defines the migration strategy for refactoring existing sports data in GCS buckets to match the unified
trading system's structure (hive partitioning, hierarchical clustering, data status tracking).

**Existing Data:** 50GB+ across 6 GCS buckets
**Target:** Unified structure with `gs://market-data-raw/SPORTS/{venue}/{date}/`

---

## 1. Current GCS Bucket Structure

**Source:**
[sportsbetting-services/configs/cloud_storage_config.yaml](../../sports-betting-services/configs/cloud_storage_config.yaml)

| Bucket                                 | Size    | Contents                                     | Issues                               |
| -------------------------------------- | ------- | -------------------------------------------- | ------------------------------------ |
| `football-raw-data-all-sources-*`      | Unknown | API-Football, FootyStats, Understat, Weather | No hive partitioning, mixed sources  |
| `market-data-tick-sports-*-v3`         | 50GB+   | Odds API tick data                           | No date partitioning, flat structure |
| `football-mapped-consolidated-*`       | Unknown | Cleaned/mapped data, canonical IDs           | No status tracking                   |
| `football-ml-features-*`               | Unknown | ML features by version/league/season         | No date clustering                   |
| `football-ml-models-and-predictions-*` | Unknown | Trained models, predictions, scalers         | No version hierarchy                 |
| `football-backtest-results-*`          | Empty   | Backtest outputs                             | No structure yet                     |

**Problems:**

- ❌ **No hive partitioning** - Cannot efficiently query by date
- ❌ **Mixed data sources** - Raw data bucket contains multiple providers
- ❌ **No data status tracking** - Cannot detect missing dates
- ❌ **No sharding strategy** - Large files, slow queries
- ❌ **Inconsistent naming** - Doesn't match unified system conventions

---

## 2. Target GCS Bucket Structure

### Unified Structure

```
gs://market-data-raw/SPORTS/
├── BETFAIR/
│   ├── 2024-01-01/
│   │   ├── odds.parquet
│   │   └── markets.parquet
│   ├── 2024-01-02/
│   └── status/
│       └── manifest.json
├── PINNACLE/
│   ├── 2024-01-01/odds.parquet
│   └── status/manifest.json
├── API_FOOTBALL/
│   ├── 2024-01-01/
│   │   ├── fixtures.parquet
│   │   ├── teams.parquet
│   │   └── stats.parquet
│   └── status/manifest.json
└── ODDS_API/
    ├── 2024-01-01/odds.parquet
    └── status/manifest.json

gs://instruments-data/SPORTS/
├── fixtures/
│   ├── 2024-01-01/fixtures.parquet
│   └── status/manifest.json
├── teams/
│   ├── 2024-01-01/teams.parquet
│   └── status/manifest.json
├── leagues/
│   └── leagues.parquet  # Static, no date partition
└── mappings/
    ├── 2024-01-01/
    │   ├── team_mapping.parquet
    │   ├── fixture_mapping.parquet
    │   └── league_mapping.parquet
    └── status/manifest.json

gs://features-sports/
├── t24h/
│   ├── ENG-PREMIER_LEAGUE/
│   │   ├── 2024-2025/
│   │   │   ├── 2024-08-16/team_features.parquet
│   │   │   ├── 2024-08-17/team_features.parquet
│   │   │   └── 2024-08-16/odds_features.parquet
│   │   └── status/manifest.json
│   └── GER-BUNDESLIGA/
│       └── 2024-2025/...
├── t60m/{league}/{season}/{date}/...
├── t0/{league}/{season}/{date}/...
└── ht/{league}/{season}/{date}/...

gs://ml-models/SPORTS/
├── match_odds/
│   ├── v1/
│   │   ├── model.pkl
│   │   ├── scaler.pkl
│   │   ├── config.json
│   │   └── metadata.json
│   └── v2/...
├── over_under/
│   └── v1/...
└── correct_score/
    └── v1/...
```

**Benefits:**

- ✅ **Hive partitioning** - Efficient date-based queries
- ✅ **Separated by source** - Each API has its own path
- ✅ **Data status tracking** - Manifest files per date
- ✅ **Hierarchical clustering** - league/season/date for features
- ✅ **Consistent naming** - Matches crypto/DeFi structure

---

## 3. Sharding Strategy

### Fixtures & Reference Data

**Shard by:** Day
**Rationale:** ~100-500 fixtures/day across all leagues, manageable file size

```
gs://instruments-data/SPORTS/fixtures/2024-01-01/fixtures.parquet  # ~10-50 MB
```

### Odds Data

**Shard by:** Day or Week
**Rationale:** Depends on tick frequency

| Data Type                  | Shard By | File Size (Approx) | Rationale                     |
| -------------------------- | -------- | ------------------ | ----------------------------- |
| Opening odds (T-24h)       | Day      | ~5-10 MB           | One row per fixture           |
| Closing odds (T-0)         | Day      | ~5-10 MB           | One row per fixture           |
| Live odds (ticks)          | Day      | ~100-500 MB        | High frequency                |
| Historical odds (Odds API) | Week     | ~50-100 MB         | Preprocessed, lower frequency |

**Recommendation:** Start with daily, switch to weekly if file sizes <10 MB

### Features

**Shard by:** Day, partitioned by league/season
**Rationale:** Features computed per fixture, natural hierarchy

```
gs://features-sports/t0/ENG-PREMIER_LEAGUE/2024-2025/2024-08-16/team_features.parquet  # ~1-5 MB
```

**Note:** Use bigger shards than crypto (week/month acceptable) if daily files too small

### Models

**Shard by:** Version (no date sharding)
**Rationale:** Models versioned, not date-dependent

```
gs://ml-models/SPORTS/match_odds/v1/model.pkl  # ~50-200 MB
```

---

## 4. Data Status Tracking Integration

### Manifest File Format

**Location:** `gs://market-data-raw/SPORTS/{source}/status/manifest.json`

```json
{
  "source": "ODDS_API",
  "coverage": {
    "start_date": "2020-01-01",
    "end_date": "2024-12-31",
    "total_days": 1826,
    "complete_days": 1820,
    "missing_days": 6,
    "completeness_pct": 99.67
  },
  "missing_dates": [
    "2020-03-15",
    "2020-03-16",
    "2020-12-25",
    "2024-06-10",
    "2024-07-22",
    "2024-11-30"
  ],
  "last_updated": "2026-02-12T10:00:00Z",
  "expected_files_per_day": 1,
  "actual_files": {
    "2024-12-31": ["odds.parquet"],
    "2024-12-30": ["odds.parquet"]
  }
}
```

### Missing Data Detection Script

```python
# scripts/check-sports-data-status.py
from datetime import datetime, timedelta, timezone
from google.cloud import storage
import json

def check_data_status(source: str, start_date: str, end_date: str) -> dict:
    """Check data completeness for a source."""
    client = storage.Client()
    bucket_name = "market-data-raw"
    prefix = f"SPORTS/{source}/"

    # Generate expected dates
    expected_dates = generate_date_range(start_date, end_date)

    # List existing dates
    blobs = client.list_blobs(bucket_name, prefix=prefix)
    existing_dates = set()
    for blob in blobs:
        # Extract date from path: SPORTS/ODDS_API/2024-01-01/odds.parquet
        parts = blob.name.split("/")
        if len(parts) >= 3 and is_valid_date(parts[2]):
            existing_dates.add(parts[2])

    # Calculate gaps
    missing_dates = set(expected_dates) - existing_dates
    completeness = (len(existing_dates) / len(expected_dates)) * 100

    # Return status
    return {
        "source": source,
        "coverage": {
            "start_date": start_date,
            "end_date": end_date,
            "total_days": len(expected_dates),
            "complete_days": len(existing_dates),
            "missing_days": len(missing_dates),
            "completeness_pct": round(completeness, 2)
        },
        "missing_dates": sorted(list(missing_dates))[:100],  # First 100
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
```

### Daily Data Status Check (Cron Job)

```bash
#!/bin/bash
# scripts/daily-sports-data-check.sh

# Run daily at 01:00 UTC (after T+1 data should be available)
python3 scripts/check-sports-data-status.py \
  --source ODDS_API \
  --start-date 2020-01-01 \
  --end-date $(date -u +%Y-%m-%d)

python3 scripts/check-sports-data-status.py \
  --source API_FOOTBALL \
  --start-date 2020-01-01 \
  --end-date $(date -u +%Y-%m-%d)

# Alert if completeness < 95%
```

---

## 5. Migration Scripts

### Script 1: Migrate Raw Data

**File:** `sportsbetting-services/scripts/migrate-sports-raw-data.py`

**Purpose:** Refactor `football-raw-data-all-sources-*` → `market-data-raw/SPORTS/{source}/{date}/`

```python
"""Migrate raw sports data to unified structure."""
from google.cloud import storage
import pandas as pd
from pathlib import Path

def migrate_raw_data(source_bucket: str, target_bucket: str, dry_run: bool = True):
    """
    Migrate raw data from old structure to new structure.

    Old: football-raw-data-all-sources-*/api_football/fixtures_2024_01.parquet
    New: market-data-raw/SPORTS/API_FOOTBALL/2024-01-01/fixtures.parquet
    """
    client = storage.Client()
    source = client.bucket(source_bucket)
    target = client.bucket(target_bucket)

    # List all files in source bucket
    blobs = source.list_blobs()

    for blob in blobs:
        # Parse old path
        path_parts = blob.name.split("/")
        if "api_football" in path_parts:
            # Extract date from filename (e.g., fixtures_2024_01.parquet)
            # Group by day, create target path
            target_path = convert_to_hive_path(blob.name)

            if dry_run:
                print(f"Would migrate: {blob.name} → {target_path}")
            else:
                # Copy to new location
                source_blob = source.blob(blob.name)
                target_blob = target.blob(target_path)
                target_blob.rewrite(source_blob)
                print(f"✓ Migrated: {target_path}")

def convert_to_hive_path(old_path: str) -> str:
    """Convert old path to hive-partitioned path."""
    # Example: api_football/fixtures_2024_01.parquet
    #       → SPORTS/API_FOOTBALL/2024-01-{day}/fixtures.parquet

    # Parse source and extract date
    # This will need custom logic per bucket structure
    pass
```

**Usage:**

```bash
# Dry-run (no changes)
python3 scripts/migrate-sports-raw-data.py --dry-run

# Execute migration
python3 scripts/migrate-sports-raw-data.py

# Verify
python3 scripts/validate-sports-migration.py --source raw-data
```

---

### Script 2: Migrate Features

**File:** `sportsbetting-services/scripts/migrate-sports-features.py`

**Purpose:** Refactor `football-ml-features-*` → `features-sports/{horizon}/{league}/{season}/{date}/`

```python
"""Migrate features to horizon-based structure."""

def migrate_features(source_bucket: str, target_bucket: str, dry_run: bool = True):
    """
    Migrate features from old to new structure.

    Old: football-ml-features-*/v1/EPL/2024/team_features.parquet
    New: features-sports/t0/ENG-PREMIER_LEAGUE/2024-2025/2024-08-16/team_features.parquet
    """
    # Read old features
    # Determine horizon (based on feature timestamp vs. fixture timestamp)
    # Group by league/season/date
    # Write to new structure
    pass
```

---

### Script 3: Migrate Models

**File:** `sportsbetting-services/scripts/migrate-sports-models.py`

**Purpose:** Refactor `football-ml-models-and-predictions-*` → `ml-models/SPORTS/{model_type}/{version}/`

```python
"""Migrate ML models to unified structure."""

def migrate_models(source_bucket: str, target_bucket: str, dry_run: bool = True):
    """
    Migrate models from old to new structure.

    Old: football-ml-models-and-predictions-*/model_2a_v1.pkl
    New: ml-models/SPORTS/match_odds/v1/model.pkl
    """
    # Copy models
    # Rename with semantic names (model_2a → match_odds)
    # Add metadata.json per version
    pass
```

---

### Script 4: Validate Migration

**File:** `sportsbetting-services/scripts/validate-sports-migration.py`

**Purpose:** Verify migration completeness (all data transferred, no corruption)

```python
"""Validate sports data migration."""
from google.cloud import storage
import hashlib

def validate_migration(source_bucket: str, target_bucket: str, data_type: str):
    """
    Validate migration by comparing file counts and checksums.

    Args:
        source_bucket: Old bucket name
        target_bucket: New bucket name
        data_type: raw-data, features, models
    """
    client = storage.Client()

    # Count files in source
    source_blobs = list(client.bucket(source_bucket).list_blobs())
    source_count = len(source_blobs)

    # Count files in target
    target_prefix = f"SPORTS/{data_type.upper()}/"
    target_blobs = list(client.bucket(target_bucket).list_blobs(prefix=target_prefix))
    target_count = len(target_blobs)

    # Compare counts
    if source_count != target_count:
        print(f"⚠️ File count mismatch: {source_count} source, {target_count} target")
        return False

    # Sample checksum validation (first 100 files)
    for source_blob in source_blobs[:100]:
        # Find corresponding target blob
        target_path = convert_to_target_path(source_blob.name, data_type)
        target_blob = client.bucket(target_bucket).blob(target_path)

        # Compare checksums
        if source_blob.md5_hash != target_blob.md5_hash:
            print(f"❌ Checksum mismatch: {source_blob.name}")
            return False

    print(f"✅ Migration validated: {target_count} files, checksums match")
    return True
```

---

## 6. Sharding Strategy Specification

### Fixtures (Daily Sharding)

**Why Daily:**

- ~100-500 fixtures/day across all leagues
- File size: 10-50 MB (optimal)
- Query pattern: "Get fixtures for date range"

**Example:**

```
gs://instruments-data/SPORTS/fixtures/
├── 2024-08-16/fixtures.parquet  # Premier League opening day (~10 fixtures)
├── 2024-08-17/fixtures.parquet  # Multiple leagues (~200 fixtures)
└── 2024-12-26/fixtures.parquet  # Boxing Day (~50 fixtures)
```

### Odds (Daily or Weekly Sharding)

**Daily sharding if:**

- Using live odds (tick data, high frequency)
- File size >10 MB/day

**Weekly sharding if:**

- Using historical odds (Odds API, preprocessed)
- File size <10 MB/day

**Example (Daily):**

```
gs://market-data-raw/SPORTS/ODDS_API/
├── 2024-08-16/odds.parquet  # ~5 MB (100 fixtures × 15 bookmakers)
└── 2024-08-17/odds.parquet  # ~10 MB (200 fixtures × 15 bookmakers)
```

**Example (Weekly):**

```
gs://market-data-raw/SPORTS/ODDS_API/
├── 2024-W33/odds.parquet  # Week 33 (Aug 12-18), ~50 MB
└── 2024-W34/odds.parquet  # Week 34 (Aug 19-25), ~50 MB
```

**Recommendation:** Start with daily, monitor file sizes, switch to weekly if <5 MB/day

### Features (Daily, Hierarchical)

**Why Hierarchical:**

- Features grouped by league/season (logical boundary)
- Query pattern: "Get features for Premier League 2024-2025 season, date range"
- File size: 1-5 MB/day per league

**Example:**

```
gs://features-sports/t0/
├── ENG-PREMIER_LEAGUE/
│   └── 2024-2025/
│       ├── 2024-08-16/
│       │   ├── team_features.parquet  # ~1 MB (20 teams × 10 fixtures)
│       │   ├── odds_features.parquet  # ~500 KB
│       │   └── h2h_features.parquet   # ~200 KB
│       └── 2024-08-17/...
└── GER-BUNDESLIGA/
    └── 2024-2025/...
```

### Models (Version-Based, No Date Sharding)

**Why Version-Based:**

- Models are artifacts (not time-series data)
- Query pattern: "Load model version v3"
- No need for date partitioning

**Example:**

```
gs://ml-models/SPORTS/match_odds/
├── v1/
│   ├── model.pkl          # ~100 MB
│   ├── scaler.pkl         # ~1 MB
│   ├── config.json        # Hyperparameters
│   ├── metadata.json      # Training metrics, date trained
│   └── training_data.txt  # Dataset used (date range)
├── v2/...
└── v3/...
```

---

## 7. Migration Phases

### Phase 1: Dry-Run & Validation (Week 1)

1. ✅ Run dry-run migration (no changes)
2. ✅ Review migration plan (file counts, target paths)
3. ✅ Identify issues (missing data, corrupt files)
4. ✅ Fix issues before actual migration
5. ✅ Get approval to proceed

### Phase 2: Migrate Raw Data (Week 2)

1. ✅ Migrate `football-raw-data-all-sources-*` → `market-data-raw/SPORTS/{source}/`
2. ✅ Migrate `market-data-tick-sports-*-v3` → `market-data-raw/SPORTS/ODDS_API/`
3. ✅ Create manifest files (data status tracking)
4. ✅ Validate migration (checksums, file counts)

### Phase 3: Migrate Features (Week 3)

1. ✅ Migrate `football-ml-features-*` → `features-sports/{horizon}/{league}/{season}/{date}/`
2. ✅ Determine horizon for each feature (based on timestamp)
3. ✅ Create manifest files
4. ✅ Validate migration

### Phase 4: Migrate Models (Week 4)

1. ✅ Migrate `football-ml-models-and-predictions-*` → `ml-models/SPORTS/{model_type}/{version}/`
2. ✅ Rename models (model_2a → match_odds)
3. ✅ Add metadata.json per version
4. ✅ Validate migration

### Phase 5: Cleanup (Week 5)

1. ✅ Verify new structure works (run feature calculation, model training)
2. ✅ Archive old buckets (don't delete yet)
3. ✅ Update all code references (paths.py, config files)
4. ✅ Delete old buckets (after 30-day grace period)

---

## 8. Migration Checklist

### Pre-Migration

- [ ] Backup all buckets (export to cold storage)
- [ ] Calculate total data size (estimate migration time)
- [ ] Review dry-run output (identify issues)
- [ ] Get approval from team
- [ ] Schedule migration (low-usage window)

### During Migration

- [ ] Run migration scripts (one bucket at a time)
- [ ] Monitor progress (log file counts, errors)
- [ ] Validate each bucket after migration
- [ ] Update manifest files
- [ ] Test read operations (verify data readable)

### Post-Migration

- [ ] Run validation scripts (checksums, counts)
- [ ] Update sportsbetting-services code (new paths)
- [ ] Update cloud_storage_config.yaml (new bucket names)
- [ ] Run E2E test (full pipeline on migrated data)
- [ ] Archive old buckets (don't delete immediately)
- [ ] Monitor for 30 days (ensure no issues)
- [ ] Delete old buckets (after grace period)

---

## 9. Rollback Plan

**If migration fails or causes issues:**

### Option 1: Revert to Old Buckets

```bash
# Update code to use old bucket names
# Old buckets still exist (not deleted)
# Immediate rollback (<1 hour)
```

### Option 2: Re-Run Migration

```bash
# Fix migration script issues
# Delete partial migration
# Re-run from scratch
```

### Option 3: Dual-Read Mode

```bash
# Read from both old and new buckets
# Prefer new, fallback to old if missing
# Gradual migration, zero downtime
```

---

## 10. Integration with Unified System

### Data Status Dashboard

After migration, sports data status integrated into unified observability:

```python
# unified-trading-services/data_status.py

def check_all_data_status():
    """Check data status for all asset classes."""
    statuses = []

    # Crypto
    statuses.append(check_data_status("CRYPTO", "BINANCE", "2020-01-01", "2024-12-31"))

    # Sports
    statuses.append(check_data_status("SPORTS", "ODDS_API", "2020-01-01", "2024-12-31"))
    statuses.append(check_data_status("SPORTS", "API_FOOTBALL", "2020-01-01", "2024-12-31"))

    return statuses
```

### Missing Data Alerts

```python
# If completeness < 95%, alert team
for status in statuses:
    if status["coverage"]["completeness_pct"] < 95:
        alert_team(f"Data gap detected: {status['source']} only {status['coverage']['completeness_pct']:.1f}% complete")
```

---

## 11. Cost Estimates

### Storage Costs

| Bucket    | Current Size | After Migration | Cost/Month (GCP) |
| --------- | ------------ | --------------- | ---------------- |
| Raw data  | Unknown      | ~20 GB          | ~$0.40           |
| Odds data | 50 GB        | ~50 GB          | ~$1.00           |
| Features  | Unknown      | ~10 GB          | ~$0.20           |
| Models    | Unknown      | ~5 GB           | ~$0.10           |
| **Total** | ~100 GB      | ~85 GB          | ~$1.70           |

**Savings:** Deduplication + compression during migration may reduce size by 15-20%

### Migration Costs

- **Egress:** $0 (intra-region, asia-northeast1)
- **Operations:** ~$0.10 (100k+ file copies)
- **Compute:** $2 (GCE VM for running migration scripts)
- **Total:** ~$2.10 (one-time)

---

## 12. Success Metrics

**Migration Complete:**

- ✅ All 6 buckets refactored
- ✅ 100% data transferred (validated via checksums)
- ✅ Hive partitioning enabled
- ✅ Data status tracking enabled
- ✅ Manifest files created
- ✅ Old buckets archived (not deleted)

**Data Quality:**

- ✅ Completeness >95% for all sources
- ✅ No corrupt files (all readable)
- ✅ Date ranges match expectations
- ✅ File sizes reasonable (<500 MB/file)

**Integration:**

- ✅ sportsbetting-services code updated (new paths)
- ✅ E2E test passes (full pipeline on migrated data)
- ✅ Query performance acceptable (<5s for date range)

---

## References

- Existing Buckets:
  [sportsbetting-services/configs/cloud_storage_config.yaml](../../sports-betting-services/configs/cloud_storage_config.yaml)
- Codex: `02-data/hive-partitioning.md`
- Codex: `02-data/data-quality.md`
- Codex: `02-data/missing-data-strategy.md`
