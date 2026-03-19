# deployment-service-v2 - GCS Schema Change

## Current Path Templates (prefix-value)

**File:** `deployment_service/catalog.py` - SERVICE_GCS_CONFIGS

```python
SERVICE_GCS_CONFIGS = {
    "instruments-service": {
        "path_template": "instrument_definitions/by_date/day-{date}/instruments.parquet"
    },
    "market-tick-data-handler": {
        "path_template": "raw_tick_data/by_date/day-{date}/data_type-{data_type}/{instrument_type}/"
    },
    "market-data-processing-service": {
        "path_template": "processed_candles/by_date/day-{date}/timeframe-{timeframe}/"
    },
    "features-delta-one-service": {
        "path_template": "by_date/day-{date}/feature_group-{group}/timeframe-{timeframe}/"
    },
    "features-calendar-service": {
        "path_template": "calendar/{category}/by_date/day-{date}/"
    },
}
```

---

## Required for BigQuery Compatibility (key=value)

```python
SERVICE_GCS_CONFIGS = {
    "instruments-service": {
        "path_template": "instrument_definitions/by_date/day={date}/instruments.parquet"
    },
    "market-tick-data-handler": {
        "path_template": "raw_tick_data/by_date/day={date}/data_type={data_type}/instrument_type={instrument_type}/"
    },
    "market-data-processing-service": {
        "path_template": "processed_candles/by_date/day={date}/timeframe={timeframe}/"
    },
    "features-delta-one-service": {
        "path_template": "by_date/day={date}/feature_group={group}/timeframe={timeframe}/"
    },
    "features-calendar-service": {
        "path_template": "calendar/category={category}/by_date/day={date}/"
    },
}
```

**Changes:** Simple find/replace

- `day-` → `day=`
- `data_type-` → `data_type=`
- `timeframe-` → `timeframe=`
- `feature_group-` → `feature_group=`
- Folders without prefix get prefix added: `{category}` → `category={category}`

---

## Additional Locations Requiring Updates

### 1. Sharding Configs

**Files:** `configs/sharding.*.yaml` (path_template fields)

**No changes needed** - These are variable templates, not literal paths

### 2. Dependencies Config

**File:** `configs/dependencies.yaml` (path_template in check sections)

**Update:**

```yaml
check:
  path_template: "by_date/day={date}/" # Was: day-{date}
```

**Locations:** ~10 path templates

### 3. Data Status CLI

**File:** `deployment_service/cli.py`

**Path construction in:**

- `_display_fixed_service_status()` (~5 locations)
- `_check_service_data()` (~3 locations)
- `_fast_scan_service()` (~2 locations)

**Total:** ~10 locations

### 4. API Routes

**File:** `api/routes/data_status.py`

**Path construction:** ~3 locations

### 5. Test Files

**Files:** `tests/unit/test_*.py`, `tests/integration/test_*.py`

**Mock paths and assertions:** ~20-30 locations

---

## Code Impact Summary

**Files to modify:** ~8 files
**Locations:** ~50 path constructions
**Test updates:** ~30 assertions

**Complexity:** MEDIUM (many locations but simple changes)

---

## Dual-Path Support During Transition

**Recommended:** Support both formats temporarily

```python
def check_data_exists(bucket, date, timeframe):
    # Try new format first
    new_path = f"by_date/day={date}/timeframe={timeframe}/"
    if gcs_exists(bucket, new_path):
        return True, new_path

    # Fall back to old format
    old_path = f"by_date/day-{date}/timeframe-{timeframe}/"
    if gcs_exists(bucket, old_path):
        return True, old_path

    return False, None
```

**Allows:**

- New services write new format
- Old data still readable
- Gradual migration
- No hard cutover needed

---

## Breaking Changes

**Severity:** HIGH (central orchestration system)

**Impact:**

- ALL service path checks
- Missing data detection
- Deploy missing functionality
- Data status displays

**Risk:** HIGH - if wrong, all data shows as missing

**Mitigation:**

- Dual-path support
- Extensive testing
- Gradual rollout per service
