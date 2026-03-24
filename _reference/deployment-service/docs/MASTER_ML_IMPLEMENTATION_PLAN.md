# Master ML Implementation Plan - Complete System Integration

**Purpose:** Comprehensive guide covering ALL aspects of ML system implementation
**Scope:** Infrastructure → features → machine learning → execution
**Status:** ✅ Infrastructure Complete - Ready for Production Testing
**Last Updated:** February 9, 2026

---

## ⚠️ IMPORTANT UPDATE (Feb 9, 2026)

**CRITICAL DISCOVERY:** All production services already use BigQuery-compatible `key=value` folder format!

**What This Means:**

- ✅ No code migration needed
- ✅ BigQuery external tables ready after data generation
- ✅ Only documentation/script cleanup needed

See [BIGQUERY_HIVE_PARTITIONING_VALIDATION.md](BIGQUERY_HIVE_PARTITIONING_VALIDATION.md) for complete audit.

---

## Table of Contents

1. [GCS Structure Status](#gcs-structure-status)
2. [Service Status Summary](#service-status-summary)
3. [BigQuery Integration](#bigquery-integration)
4. [ML Pipeline Completion Tasks](#ml-pipeline-completion-tasks)
5. [Data Generation Phases](#data-generation-phases)
6. [Testing & Validation](#testing-validation)
7. [Deployment & Operations](#deployment-operations)

---

## 1. GCS Structure Status

### Production Format (CURRENT - BigQuery Compatible) ✅

**All services already use `key=value` format in production code:**

```
gs://features-delta-one-{category}-{project}/
  by_date/
    day=2023-01-01/                    ← key=value format
      feature_group=technical_indicators/  ← key=value format
        timeframe=1m/                   ← key=value format
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
          NASDAQ:ETF:SPY-USD.parquet

Total: Nested structure with ~140 files per instrument per day (20 groups × 7 timeframes)
```

**Current Structure Benefits:**

- ✅ BigQuery external tables compatible (hive partitioning)
- ✅ Nested organization (easy to understand)
- ✅ Partition by `day`, `feature_group`, `timeframe`
- ✅ No code changes needed

**BigQuery External Table Setup:**

```sql
CREATE EXTERNAL TABLE features_data.features_1m_cefi
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://features-delta-one-cefi-{project}/by_date/day=*/feature_group=*/timeframe=1m/*.parquet'],
  hive_partitioning_options = '{
    "mode": "AUTO",
    "sourceUriPrefix": "gs://features-delta-one-cefi-{project}/by_date/"
  }'
);
-- Automatically extracts: day, feature_group, timeframe as queryable columns
```

### Legacy Data

If you have old data with `day-2023-01-01/` format:

- ✅ BigQuery external tables will ignore it (pattern matching)
- ✅ No migration needed for new data
- ✅ Safe coexistence (no conflict)

**Status:** ✅ MIGRATION COMPLETE (production already correct)

---

## 2. Service Status Summary

**Audit Date:** February 9, 2026
**Result:** ✅ All services production-ready with `key=value` format

### 2.1 instruments-service ✅

**Path Format:** `instrument_availability/by_date/day={date}/venue={venue}/instruments.parquet`

**Partition Folders:** `day=`, `venue=`

**Status:** ✅ BigQuery ready

**Code:** `instruments_service/app/core/cloud_instrument_storage.py`

---

### 2.2 market-tick-data-handler ✅

**Path Format:** `raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={type}/venue={venue}/...`

**Partition Folders:** `day=`, `data_type=`, `instrument_type=`, `venue=`, `symbol=`

**Status:** ✅ BigQuery ready

**Code:** `market_data_tick_handler/app/core/data_orchestration_service.py`

---

### 2.3 market-data-processing-service ✅

**Path Format:** `processed_candles/by_date/day={date}/timeframe={tf}/data_type={type}/...`

**Partition Folders:** `day=`, `timeframe=`, `data_type=`

**Status:** ✅ BigQuery ready

**Code:** `market_data_processing_service/app/core/cloud_candle_storage.py`

---

### 2.4 features-delta-one-service ✅

**Path Format:** `by_date/day={date}/feature_group={group}/timeframe={tf}/{instrument}.parquet`

**Partition Folders:** `day=`, `feature_group=`, `timeframe=`

**Status:** ✅ BigQuery ready

**Code:** `features_delta_one_service/app/core/feature_writer.py`

**Legacy References:** `scripts/data_catalog.py` uses old format (needs update)

---

### 2.5 features-calendar-service ✅

**Path Format:** `calendar/category={category}/by_date/day={date}/features.parquet`

**Partition Folders:** `category=`, `day=`

**Status:** ✅ BigQuery ready

**Code:** `features_calendar_service/app/core/orchestration_service.py`

**Code Changes Required:**

**File:** `features_delta_one_service/app/core/feature_writer.py`

**Current (OLD):**

```python
def _build_output_path(self, date, feature_group, timeframe, instrument_id):
    return f"by_date/day-{date}/feature_group-{feature_group}/timeframe-{timeframe}/{instrument_id}.parquet"
```

**New (REQUIRED):**

```python
def _build_output_path(self, date, instrument_id):
    return f"by_date/day-{date}/{instrument_id}.parquet"

def write_features(self, features_df, date, instrument_id):
    # Add metadata columns
    features_df['feature_group'] = self._get_current_feature_group()
    features_df['timeframe'] = self.timeframe
    features_df['day'] = date.strftime('%Y-%m-%d')

    # Write single parquet with ALL feature groups
    path = self._build_output_path(date, instrument_id)
    upload_parquet(features_df, path)
```

**Testing:** Verify schema includes feature_group, timeframe columns

**Rollout:** Keep old code until new structure validated

### 2.5 features-calendar-service

**Impact:** Minor (already flat structure)

**Current:** `calendar/temporal/by_date/day-{date}/features.parquet`

**Action:** Ensure schema compatible with new BigQuery approach

### 2.6 ml-training-service

**Impact:** Update CloudFeatureProvider to read new structure

**Code Changes Required:**

**File:** `ml_training_service/app/core/gcs_feature_reader.py`

**Current (reads nested):**

```python
path = f"by_date/day-{date}/feature_group-{group}/timeframe-{tf}/{inst}.parquet"
```

**New (reads flat):**

```python
path = f"by_date/day-{date}/{inst}.parquet"
# Filter by feature_group and timeframe in DataFrame
df = df[df['timeframe'] == timeframe]
if feature_groups:
    df = df[df['feature_group'].isin(feature_groups)]
```

**Testing:** Ensure both old and new structures work during transition

### 2.7 ml-inference-service

**Impact:** Same as ml-training (uses same FeatureSubscriber)

**Action:** Update feature loading logic

### 2.8 strategy-service & execution-service

**Impact:** None (consume ML predictions, not features)

**Status:** ✅ No changes needed

---

## 3. BigQuery Integration

**Status:** ✅ Ready after data generation

### 3.1 External Tables (Production Approach)

**Setup Script:** `deployment-service/scripts/create_bigquery_external_tables.sh`

**What It Creates:**

```sql
-- Example: Features 1m external table
CREATE EXTERNAL TABLE features_data.features_1m_cefi
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://features-delta-one-cefi-{project}/by_date/day=*/feature_group=*/timeframe=1m/*.parquet'],
  hive_partitioning_options = '{
    "mode": "AUTO",
    "sourceUriPrefix": "gs://features-delta-one-cefi-{project}/by_date/"
  }'
);
```

**Properties:**

- **Storage Cost:** $0 (pointer to GCS, no duplication)
- **Query Cost:** $6/TB scanned (only pay when querying)
- **Freshness:** Always current (reads GCS directly)
- **Refresh:** Not needed (automatic)
- **Partitions:** Automatically extracts `day`, `feature_group`, `timeframe` from folder names

**Usage Example:**

```sql
-- Query features for BTC, January 2023
SELECT
  timestamp,
  instrument_id,
  rsi_14,
  macd,
  swing_high
FROM `test-project.features_data.features_1m_cefi`
WHERE day BETWEEN '2023-01-01' AND '2023-01-31'
  AND instrument_id = 'BINANCE-FUTURES:PERPETUAL:BTC-USDT'
  AND feature_group = 'technical_indicators';
```

### 3.2 Materialized Views (NOT USED)

**Decision:** External tables only (no materialized views)

**Why:**

- Materialized views cost $131/year storage + $3-338/year refresh
- 10-20x faster queries (2 sec vs 20-30 sec) not worth cost for batch ML training
- GCS parallel reader acceptable for production (20-30 sec is fine)
- External tables sufficient for ad-hoc analysis and debugging

**If Needed Later:**

- Can add materialized views on top of external tables
- Cloud Function for event-driven refresh
- Cost/benefit should be evaluated based on actual usage

### 3.3 Primary Data Access: GCS Parallel Reader

**For Production ML Training:**

```python
from ml_training_service.app.core.gcs_feature_reader import GCSFeatureReader

reader = GCSFeatureReader(project_id="test-project")
features_df = reader.read_features(
    instrument_ids=["BINANCE-FUTURES:PERPETUAL:BTC-USDT"],
    start_date="2023-01-01",
    end_date="2023-12-31",
    timeframes=["1m"],
    feature_groups=["technical_indicators", "market_structure"]
)
```

**Properties:**

- Direct parquet reads from GCS (no BigQuery dependency)
- Parallel downloads for speed
- Works with nested GCS structure
- 20-30 sec typical query time (acceptable for batch)
- $0 cost beyond GCS storage

**When to Use:**

- ✅ Production ML training pipelines
- ✅ Batch feature loading
- ✅ Reproducible data loading (no external dependencies)

**When to Use BigQuery External Tables:**

- ✅ Ad-hoc SQL queries for exploration
- ✅ Data quality checks
- ✅ Fast debugging (2 sec queries)
- ✅ Integration with BI tools

### 3.4 Documentation

**Complete Guides:**

- [BIGQUERY_INTEGRATION_GUIDE.md](BIGQUERY_INTEGRATION_GUIDE.md) - Setup, usage, cost optimization
- [BIGQUERY_HIVE_PARTITIONING_VALIDATION.md](BIGQUERY_HIVE_PARTITIONING_VALIDATION.md) - Service audit and validation
- [GCS_AND_SCHEMA.md](GCS_AND_SCHEMA.md) - Path formats and standards

**Scripts:**

- `deployment-service/scripts/create_bigquery_external_tables.sh` - One-time setup (run after data exists)

**File:** `features-delta-one-service/cloud_functions/refresh_bigquery_mv/main.py`

```python
def refresh_on_gcs_change(event, context):
    file_name = event['name']  # by_date/day-2023-01-01/instrument.parquet

    # Extract day from path
    match = re.search(r'day-(\d{4}-\d{2}-\d{2})/', file_name)
    if not match:
        return

    day = match.group(1)

    # Refresh all timeframe MVs (data includes all timeframes)
    for tf in ['15s', '1m', '5m', '15m', '1h', '4h', '24h']:
        view_id = f'features_data.features_{tf}_mv_v2'
        bq_client.query(f"CALL BQ.REFRESH_MATERIALIZED_VIEW('{view_id}')")

    print(f"✅ Refreshed all MVs for day={day}")
```

**Deploy:**

```bash
gcloud functions deploy refresh-features-mv \
  --trigger-bucket features-delta-one-cefi-test-project \
  --trigger-event-filters type=google.cloud.storage.object.v1.finalized
```

**Cost:** ~$20/month (100 refresh events, incremental)

---

## 4. ML Pipeline Completion Tasks

**Status:** ✅ Infrastructure Complete (Feb 9, 2026)

### 4.1 3-Stage Pipeline ✅

**Status:** Code complete, ready for testing with real data

**Implementation:**

- ✅ Handlers created (preselection, hyperparam_grid, final_training)
- ✅ CLI wired with mode routing
- ✅ All 5 arguments added (`--training-period`, `--correlation-threshold`, `--importance-threshold`, `--selection-metric`, `--cv-folds`)
- ✅ 73/73 unit tests passing

**Usage:**

```bash
# Stage 1: Feature pre-selection (1000s → 300 features)
ml-training --mode pre-selection --training-period 2023-Q1 \
  --correlation-threshold 0.95 --importance-threshold 0.001

# Stage 2: Hyperparameter grid search (3-fold CV, 12 combos)
ml-training --mode hyperparameter-grid --training-period 2023-Q1 \
  --cv-folds 3 --selection-metric f1_weighted

# Stage 3: Final training (100% data, best params)
ml-training --mode final-training --training-period 2023-Q1
```

**Output Locations:**

- Stage 1: `gs://ml-training-artifacts-{project}/stage1-preselection/{training_period}/selected_features.json`
- Stage 2: `gs://ml-training-artifacts-{project}/stage2-hyperparams/{training_period}/best_hyperparams.json`
- Stage 3: `gs://ml-models-store-{project}/models/{model_id}/training-period-{YYYY-MM}/model.joblib`

**Next:** Test end-to-end with real features data

### 4.2 Walk-Forward Model Selection ✅

**Status:** Complete and tested

**Implementation:**

- ✅ Fixed in `ml-inference-service/ml_inference_service/app/inference/orchestrator.py`
- ✅ Uses `load_model_for_inference_date()` instead of `load_model()`
- ✅ 9/9 new unit tests passing (all walk-forward scenarios)
- ✅ Prevents lookahead bias

**Example:**

```python
# Inference on 2023-04-01 uses model trained in 2023-03 (or earlier)
# NEVER uses model trained in 2023-04 or later
inference_date = datetime(2023, 4, 1, tzinfo=timezone.utc).date()
model_result = self.model_loader.load_model_for_inference_date(
    variant_config=variant_config,
    inference_date=inference_date
)
# Logs: "✅ Using model from training_period=2023-03"
```

**Test Coverage:**

- ✓ Inference date before first model (returns None)
- ✓ Inference date between training periods (uses older model)
- ✓ Inference same month as training (uses previous quarter)
- ✓ Multiple models available (picks most recent before date)

### 4.3 GCS Feature Reader ✅

**Status:** Production-ready

**Implementation:**

- ✅ Parallel parquet reader from GCS
- ✅ Handles nested `key=value` structure
- ✅ No BigQuery dependency
- ✅ 20-30 sec typical query time

**Location:** `ml-training-service/ml_training_service/app/core/gcs_feature_reader.py`

**Usage:**

```python
from ml_training_service.app.core.gcs_feature_reader import GCSFeatureReader

reader = GCSFeatureReader(project_id="test-project")
df = reader.read_features(
    instrument_ids=["BINANCE-FUTURES:PERPETUAL:BTC-USDT"],
    start_date="2023-01-01",
    end_date="2023-12-31",
    timeframes=["1m"],
    feature_groups=["technical_indicators", "market_structure"]
)
```

### 4.4 Critical Bug Fixes ✅

**All fixed in 12 PRs (Feb 9, 2026):**

1. ✅ **market-data-processing path format** - Changed to `timeframe=`, `data_type=`
2. ✅ **unified-trading-library GCP-only code** - Now cloud-agnostic
3. ✅ **Walk-forward model selection** - Fixed lookahead bias
4. ✅ **Missing CLI args** - All 5 added to ml-training
5. ✅ **Ruff version alignment** - All repos synced to v0.15.0

### 4.5 Mode-Aware Dependencies (Config Ready)

**Status:** Configuration complete

**Implementation:**

- ✅ `MODE_AWARE_SERVICES` defined in `deployment-service`
- ✅ `stage_dependencies` in `configs/dependencies.yaml`
- ✅ `mode` dimension in `configs/sharding.ml-training-service.yaml`

**Example:**

```yaml
# ml-training-service has 3 modes with different dependencies
mode_aware_services:
  ml-training-service:
    modes:
      - pre-selection # Depends on: features-delta-one, features-calendar
      - hyperparameter-grid # Depends on: stage1 artifacts
      - final-training # Depends on: stage2 artifacts
```

**Next:** CLI integration for mode-aware data status display

---

## 6. Data Generation Phases (Original Plan)

### Phase 1: Infrastructure (COMPLETE ✅)

**Deliverables:**

- [x] Mock data seeder
- [x] GCS parallel reader
- [x] 3-stage handlers
- [x] Walk-forward selection
- [x] Enhanced metrics
- [x] Mode-aware configs

### Phase 2: Mock Data Testing (PARTIALLY COMPLETE)

**Completed:**

- [x] 54,720 rows seeded (38 days, 4 groups, 1m, 1 instrument)
- [x] Training works (4 models trained)
- [x] Metrics show models are useless on random data (expected)

**Remaining:**

- [ ] Generate mock for ALL 20 groups
- [ ] Generate for ALL 7 timeframes
- [ ] Generate for BTC + SPY (test holiday handling)
- [ ] 15 months of data (2020-10 to 2021-12)

### Phase 3: Real Data Integration (NEXT - Requires Market-Tick)

**Prerequisites (YOUR TASK):**

```bash
# 1. Generate market-tick for BTC (24/7)
market-tick-data-handler \
  --venues BINANCE-FUTURES \
  --instruments BINANCE-FUTURES:PERPETUAL:BTC-USDT \
  --start-date 2020-10-01 --end-date 2021-12-31

# 2. Generate market-tick for SPY (market hours, holidays)
market-tick-data-handler \
  --venues NASDAQ \
  --instruments NASDAQ:ETF:SPY-USD \
  --start-date 2020-10-01 --end-date 2021-12-31
```

**Then:**

```bash
# 3. Generate features (NEW STRUCTURE)
features-delta-one --mode batch \
  --category CEFI TRADFI \
  --feature-groups ALL \
  --timeframes ALL \
  --start-date 2020-10-01 --end-date 2021-12-31 \
  --output-format v2  # Use new flat structure

# 4. Setup BigQuery
cd deployment-service
./scripts/setup_bigquery_external_tables_NEW_STRUCTURE.sh

# 5. Run ML training (3 stages × 4 quarters)
for PERIOD in 2021-03 2021-06 2021-09 2021-12; do
  ml-training --mode pre-selection --training-period $PERIOD ...
  ml-training --mode hyperparameter-grid --training-period $PERIOD ...
  ml-training --mode final-training --training-period $PERIOD ...
done

# 6. Run inference (daily, walk-forward)
ml-inference --start-date 2021-01-01 --end-date 2021-12-31 ...

# 7. Delete old structure
cd deployment-service
./scripts/delete_old_gcs_structure.sh  # Requires typing DELETE to confirm
```

---

## 7. Service-by-Service Update Checklist

### Instruments Service

- [ ] No changes needed ✅

### Market-Tick-Data-Handler

- [ ] Consider external table for future
- [ ] Structure already BigQuery-compatible

### Market-Data-Processing-Service

- [ ] No changes needed ✅

### Features-Delta-One-Service ⚠️ REQUIRES UPDATES

- [ ] Update feature_writer.py for new structure
- [ ] Add feature_group, timeframe as data columns
- [ ] Write 1 file per instrument per day (not 140)
- [ ] Test with 1 day before full regeneration
- [ ] Verify schema matches expected
- [ ] Update tests for new structure

### Features-Calendar-Service

- [ ] Verify schema compatible
- [ ] No structure changes needed (already flat)

### ML-Training-Service ⚠️ REQUIRES UPDATES

- [ ] Update gcs_feature_reader.py for new paths
- [ ] Update CloudFeatureProvider
- [ ] Test GCS reader with new structure
- [ ] Test BigQuery reader (via unified-trading-library)
- [ ] Verify both readers return identical data

### ML-Inference-Service ⚠️ REQUIRES UPDATES

- [ ] Update feature_subscriber.py
- [ ] Same changes as ml-training
- [ ] Test inference with new structure

### Strategy-Service

- [ ] No changes needed (consumes ML predictions) ✅

### Execution-Services

- [ ] No changes needed ✅

### Unified-Trading-Deployment-V2 ⚠️ REQUIRES UPDATES

- [ ] Update missing data checker (support both structures)
- [ ] Simpler path checks: `by_date/day-{date}/{inst}.parquet`
- [ ] Update data-status display
- [ ] Document transition period

---

## 8. Testing & Validation Strategy

### 8.1 Unit Tests (Local Quality Gates)

**Requirement:** Match GitHub Actions and Cloud Build

**Standard test suite for ALL repos:**

```bash
# Quality gates (must match CI)
ruff check {service}/ tests/
ruff format --check {service}/ tests/
pytest tests/unit/ -v
pytest tests/integration/ -v --tb=short

# Fast tests only (< 2 min total)
# Skip: E2E tests (too slow for local)
```

**Action Items:**

- [ ] Verify each repo has unit tests
- [ ] Add integration tests where missing
- [ ] Ensure local quality gates match CI

### 8.2 Integration Tests (Per Service)

**features-delta-one:**

- [ ] Test write to new structure
- [ ] Verify schema includes metadata columns
- [ ] Test BigQuery can read external table

**ml-training:**

- [ ] Test GCS reader with new structure
- [ ] Test BigQuery reader
- [ ] Test Stage 1 → 2 → 3 flow
- [ ] Test quarterly training periods

**ml-inference:**

- [ ] Test walk-forward model selection
- [ ] Test with multiple training periods
- [ ] Verify no-lookahead enforcement

### 8.3 End-to-End Tests (Full Pipeline)

**Test 1: Instruments → Features → ML**

```bash
# Generate 1 day end-to-end
instruments → market-tick → market-data-processing → features-delta-one → ml-training
```

**Test 2: ML → Strategy → Execution**

```bash
# Use ML predictions for strategy
ml-inference → strategy → execution
```

**Test 3: Parallel Shard Execution**

```bash
# 16 model configs in parallel
# Verify no conflicts, all complete
```

---

## 9. Cost Analysis Summary

### Current (Old Structure, GCS Only)

- Storage: $1,877/year
- Queries: Direct GCS (20-30 sec)

### After Migration (New Structure + BigQuery)

- GCS storage: $1,877/year (same)
- BigQuery external table: $0
- BigQuery MV: $11,305/year (ADDITIONAL - for speed)
- **Total: $13,182/year**

### With Optimizations

- Use external tables for dev (free)
- Use MVs only for production training
- **Optimized: $7,234/year**

---

## 10. Implementation Timeline

### Week 1: Code Updates (Current Session - 95% Done)

- [x] Walk-forward fix
- [x] CLI args
- [x] BigQuery module
- [x] Mode-aware configs
- [x] Documentation
- [ ] features-delta-one new structure (30% done)

### Week 2: Data Generation (Requires Market-Tick)

- [ ] YOU: Generate market-tick (BTC + SPY, 15 months)
- [ ] Run features-delta-one with new structure
- [ ] Validate 1 day before full run
- [ ] Generate all 20 groups × 7 timeframes
- [ ] Setup BigQuery external tables + MVs

### Week 3: ML Training & Testing

- [ ] Run 3-stage pipeline (4 quarters)
- [ ] Train 16 model configs
- [ ] Test walk-forward inference
- [ ] Validate no-lookahead
- [ ] Performance testing

### Week 4: Cleanup & Production

- [ ] Delete old GCS structure
- [ ] Final documentation
- [ ] Production deployment checklist
- [ ] Monitoring setup

---

## 11. Success Criteria

### Infrastructure ✅

- [x] Code complete
- [x] Tests passing
- [x] Documentation complete

### Data

- [ ] New structure populated (15 months × 2 instruments)
- [ ] BigQuery tables created
- [ ] Old structure deleted

### ML Pipeline

- [ ] 3-stage pipeline tested end-to-end
- [ ] Walk-forward validated with real data
- [ ] 16 model configs trained
- [ ] Mode-aware data-status working

### Production Ready

- [ ] All quality gates passing
- [ ] All PRs merged
- [ ] Monitoring in place
- [ ] Cost tracking enabled

---

## 12. Critical Path Dependencies

```
Market-Tick Data (YOUR TASK)
  ↓
Features-Delta-One (new structure)
  ↓
BigQuery Setup (external tables + MVs)
  ↓
ML Training (3-stage pipeline)
  ↓
ML Inference (walk-forward)
  ↓
Validation & Production
```

**Blocker:** Waiting on market-tick data for BTC + SPY

**Once unblocked:** ~1 week to complete all phases

---

## 13. Open Questions & Decisions

### Q1: When to delete old structure?

**A:** After new structure 100% validated (Week 3)

### Q2: Support both structures during transition?

**A:** Yes, deployment-service checks both

### Q3: Materialized views worth $11K/year?

**A:** Yes for development (10x faster), optional for production

### Q4: External tables sufficient?

**A:** For dev yes, for production training MVs better

---

## 14. Next Session Action Items

**Immediate (30 min):**

- [ ] Verify all PRs merged
- [ ] Pull latest from all repos

**This Week:**

- [ ] Update features-delta-one for new structure
- [ ] Test with 1 day
- [ ] Document schema changes

**Next Week:**

- [ ] Generate market-tick data
- [ ] Regenerate all features
- [ ] Run ML pipeline end-to-end

---

**This document is the MASTER plan. Update as each phase completes.**
