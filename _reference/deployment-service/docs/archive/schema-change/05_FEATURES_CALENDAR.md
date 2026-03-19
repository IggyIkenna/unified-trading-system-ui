# Features-Calendar-Service - GCS Schema Change

## Current Structure (prefix-value)

```
gs://features-calendar-{project}/
  calendar/
    temporal/
      by_date/
        day-2023-01-01/
          features.parquet
    economic_events/
      by_date/
        day-2023-01-01/
          features.parquet
    scheduled_events/
      by_date/
        day-2023-01-01/
          features.parquet
    macro/
      by_date/
        day-2023-01-01/
          features.parquet
```

**Path Format:** `calendar/{category}/by_date/day-{date}/features.parquet`

**Levels:** 3 (category, day, file)

---

## Required for BigQuery Hive Partitioning (key=value)

```
gs://features-calendar-{project}/
  calendar/
    category=temporal/
      by_date/
        day=2023-01-01/
          features.parquet
    category=economic_events/
      by_date/
        day=2023-01-01/
          features.parquet
```

**Path Format:** `calendar/category={category}/by_date/day={date}/features.parquet`

**Changes:**

- Rename top-level folders: `temporal` → `category=temporal`
- `day-` → `day=`

**Structure:** UNCHANGED (still 3 levels)
**Nesting order:** UNCHANGED (category → day → file)
**Change type:** FORMATTING ONLY

---

## Code Changes Required

**File:** `features_calendar_service/app/core/orchestration_service.py` line 174

**Current:**

```python
output_path = f"calendar/{category}/by_date/day-{date_str}/features.parquet"
```

**New:**

```python
output_path = f"calendar/category={category}/by_date/day={date_str}/features.parquet"
```

**Lines changed:** 1 line

---

## Downstream Impact

**Services that read calendar features:**

- ml-training-service (merges with delta-one)
- ml-inference-service (same)
- deployment-service (missing data)

**Locations:** ~5-10

---

## BigQuery External Table (After Migration)

```sql
CREATE EXTERNAL TABLE features_calendar.all_calendar
HIVE PARTITIONING:
  mode: AUTO
  sourceUriPrefix: gs://features-calendar-{project}/calendar/

PARTITION BY day
CLUSTER BY category

-- Query
SELECT * FROM all_calendar
WHERE day = '2023-01-01'
  AND category = 'temporal';
```

---

## Breaking Changes

**Severity:** LOW (simple structure, few consumers)

**Locations:** ~8

- features-calendar output (1 line)
- ml-training calendar merge (~3)
- ml-inference calendar merge (~2)
- deployment-service (~2)
