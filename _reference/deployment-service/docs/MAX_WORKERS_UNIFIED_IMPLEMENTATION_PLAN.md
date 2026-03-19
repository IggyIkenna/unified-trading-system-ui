# MAX_WORKERS: Unified Implementation Plan

**Purpose:** Complete implementation guide for date-level parallelism across entire system
**Status:** Ready to implement
**Date:** February 10, 2026

---

## ⭐ RECOMMENDED: See Adaptive Strategy

**This document describes the static MAX_WORKERS approach.**

**For the RECOMMENDED self-regulating approach with automatic RAM management:**
→ See **[ADAPTIVE_MAX_WORKERS_DESIGN.md](ADAPTIVE_MAX_WORKERS_DESIGN.md)**

**Adaptive benefits:**

- ✅ Auto-detects I/O vs CPU bound
- ✅ Monitors RAM and prevents OOM
- ✅ Machine-agnostic (works on any C2 size)
- ✅ No manual tuning needed

**This document is still useful for:**

- Understanding core MAX_WORKERS concept
- Static approach if preferred
- Deployment orchestrator integration (applies to both)

---

## Core Concept

**MAX_WORKERS defines both sharding AND parallelism:**

```
User Input:
  --start-date 2024-01-01
  --end-date 2024-01-16
  --shard-by date
  --max-workers 4

Deployment Orchestrator Creates Shards:
  Shard 1: --start-date 2024-01-01 --end-date 2024-01-04, MAX_WORKERS=4
  Shard 2: --start-date 2024-01-05 --end-date 2024-01-08, MAX_WORKERS=4
  Shard 3: --start-date 2024-01-09 --end-date 2024-01-12, MAX_WORKERS=4
  Shard 4: --start-date 2024-01-13 --end-date 2024-01-16, MAX_WORKERS=4

  Total: 4 shards (instead of 16)
  Each VM: Processes 4 dates in parallel

Service Execution:
  date_range = [2024-01-01, 2024-01-02, 2024-01-03, 2024-01-04]
  max_workers = 4

  with Pool(processes=4) as pool:
      results = pool.map(process_date, date_range)

  # All 4 dates processed in parallel on same VM
```

**Special Case (only 16 days, MAX_WORKERS=16):**

```
Deployment Orchestrator Creates:
  Shard 1: --start-date 2024-01-01 --end-date 2024-01-16, MAX_WORKERS=16

  Total: 1 shard
  1 VM processes all 16 dates in parallel
```

---

## Deployment Orchestrator Changes

### 1. Shard Creation Logic Update

**File:** `deployment-service/api/routes/deployments.py` (or wherever shard creation happens)

**Current (Before):**

```python
def create_shards(start_date, end_date, shard_by, **kwargs):
    if shard_by == "date":
        # Create 1 shard per date
        shards = []
        for date in generate_date_range(start_date, end_date):
            shards.append({
                "cli_args": f"--start-date {date} --end-date {date}",
                "env_vars": {}
            })
        return shards  # 365 shards for 365 days
```

**Updated (After):**

```python
def create_shards(start_date, end_date, shard_by, max_workers=1, service_name=None, **kwargs):
    """
    Create shards respecting MAX_WORKERS for date parallelism.

    Args:
        max_workers: Number of dates to process in parallel per shard
        service_name: Used to get service-specific default MAX_WORKERS
    """
    if shard_by == "date":
        # Get service-specific MAX_WORKERS if not provided
        if max_workers is None or max_workers == 1:
            max_workers = get_service_default_max_workers(service_name)

        date_range = list(generate_date_range(start_date, end_date))
        shards = []

        # Batch dates into groups of max_workers
        for i in range(0, len(date_range), max_workers):
            date_batch = date_range[i:i+max_workers]
            shards.append({
                "cli_args": f"--start-date {date_batch[0]} --end-date {date_batch[-1]}",
                "env_vars": {
                    "MAX_WORKERS": str(len(date_batch))  # Actual batch size
                }
            })

        return shards
        # 365 days, MAX_WORKERS=16 → 23 shards
        # 16 days, MAX_WORKERS=16 → 1 shard
        # 5 days, MAX_WORKERS=16 → 1 shard (MAX_WORKERS=5)

def get_service_default_max_workers(service_name: str) -> int:
    """Get recommended MAX_WORKERS for service"""
    SERVICE_MAX_WORKERS = {
        "instruments-service": 16,
        "features-calendar-service": 16,
        "ml-inference-service": 3,
        "market-data-processing-service": 1,
        "market-tick-data-handler": 1,
        "features-delta-one-service": 1,
        "ml-training-service": 1,
        "strategy-service": 1,
        "execution-service": 1,
    }
    return SERVICE_MAX_WORKERS.get(service_name, 1)
```

**Impact:**

- instruments-service: 365 days → 23 shards (16 dates each)
- features-calendar: 365 days → 23 shards
- ml-inference: 365 days → 122 shards (3 dates each)
- Others: 365 shards (MAX_WORKERS=1, unchanged)

---

### 2. CLI Argument Addition

**Add `--max-workers` to deployment CLI:**

**File:** `deployment-service/cli.py` or deployment request endpoint

```python
@click.option('--max-workers', type=int, default=None,
              help='Number of dates to process in parallel per machine (default: service-specific)')
def deploy_service(service_name, start_date, end_date, max_workers, ...):
    """
    Deploy service with date parallelism.

    --max-workers: Controls both:
      1. How dates are batched into shards
      2. How many processes spawn per VM
    """
    shards = create_shards(
        start_date=start_date,
        end_date=end_date,
        shard_by="date",
        max_workers=max_workers,  # User override or service default
        service_name=service_name
    )
```

**Examples:**

```bash
# Default (service-specific)
deploy instruments-service --start-date 2024-01-01 --end-date 2024-12-31
# → 23 shards with MAX_WORKERS=16 (service default)

# Override (force serial)
deploy instruments-service --start-date 2024-01-01 --end-date 2024-12-31 --max-workers 1
# → 365 shards with MAX_WORKERS=1 (user override)

# Override (aggressive)
deploy instruments-service --start-date 2024-01-01 --end-date 2024-12-31 --max-workers 32
# → 12 shards with MAX_WORKERS=32

# Small range
deploy instruments-service --start-date 2024-01-01 --end-date 2024-01-05 --max-workers 16
# → 1 shard with MAX_WORKERS=5 (only 5 dates available)
```

---

## Service Code Changes

### Pattern: ParallelDateProcessor Integration

**Every service CLI follows this pattern:**

```python
# cli/main.py or cli/batch_handler.py
import os
from unified_trading_library.core.parallel_date_processor import ParallelDateProcessor

def process_single_date(date_obj, config):
    """
    Process one date (runs in separate process).

    This function must be:
    1. Pickleable (no lambda, no nested class)
    2. Stateless (receives all config via args)
    3. Self-contained (imports inside if needed)
    """
    # Your existing single-date logic
    return run_service_for_date(date_obj, config)

def main():
    # Parse CLI args
    start_date = parse_date(args.start_date)
    end_date = parse_date(args.end_date)
    date_range = list(generate_date_range(start_date, end_date))

    # Get MAX_WORKERS from env (set by deployment orchestrator)
    max_workers = int(os.getenv("MAX_WORKERS", "1"))

    if max_workers > 1 and len(date_range) > 1:
        # Parallel processing
        logger.info(f"Processing {len(date_range)} dates with {max_workers} workers")

        processor = ParallelDateProcessor(
            process_date_func=process_single_date,
            num_workers=min(max_workers, len(date_range))  # Don't exceed date count
        )
        results = processor.process_dates(date_range, config)
    else:
        # Serial processing (fallback)
        logger.info(f"Processing {len(date_range)} dates serially")
        results = [process_single_date(d, config) for d in date_range]

    # Check results
    success_count = sum(1 for r in results if r.get("status") == "success")
    logger.info(f"Completed: {success_count}/{len(date_range)} successful")

    # Exit with appropriate code
    sys.exit(0 if success_count == len(date_range) else 1)
```

**Key Changes:**

1. Extract single-date logic into standalone function
2. Read MAX_WORKERS from environment
3. Use ParallelDateProcessor if MAX_WORKERS > 1
4. Fall back to serial if MAX_WORKERS=1

---

## Complete Audit Areas

### 1. Paradise Batching Compatibility

**What is Paradise?**

- Groups multiple small jobs into batches to reduce startup overhead
- Example: 100 jobs × 2 min each = 200 min serial, or batch into 10 groups of 10

**Interaction with MAX_WORKERS:**

```
Scenario: 365 days, MAX_WORKERS=16

Without Paradise:
  - 23 shards (365 / 16)
  - 23 VMs spawn
  - Startup overhead: 23 × 4 min = 92 min

With Paradise (batch_size=4):
  - 23 shards grouped into 6 batches
  - 6 VMs spawn (reused for multiple shards)
  - Startup overhead: 6 × 4 min = 24 min
  - Savings: 68 min startup time

Compatibility: ✅ NO CONFLICT
  - Paradise batches shards (VM-level)
  - MAX_WORKERS parallelizes dates (process-level within VM)
  - Both optimizations stack nicely
```

**Recommendation:** Keep Paradise batching for services with many shards

**File to Check:** Search for Paradise references in deployment orchestrator

---

### 2. Shard Status Tracking (Multi-Date Shards)

**Challenge:** If shard covers 4 dates, how to track which dates succeeded/failed?

**Current Status Model:**

```python
# Shard status is atomic
{
    "shard_id": "instruments-20240101-20240101",
    "status": "completed",  # or "failed"
    "exit_code": 0
}
```

**Enhanced Status Model (NEW):**

```python
{
    "shard_id": "instruments-20240101-20240104",
    "status": "partially_completed",  # NEW status
    "exit_code": 0,  # Overall shard exit code
    "date_statuses": {  # NEW: Per-date breakdown
        "2024-01-01": "success",
        "2024-01-02": "success",
        "2024-01-03": "failed",
        "2024-01-04": "success"
    },
    "dates_successful": 3,
    "dates_failed": 1
}
```

**How to Capture Per-Date Status:**

**Option A: Parse Logs**

```python
# Service logs per-date completion
logger.info(f"Date {date} completed", extra={"date_status": "success", "date": str(date)})

# Deployment orchestrator parses logs to extract date statuses
date_statuses = parse_logs_for_date_statuses(deployment_id)
```

**Option B: Exit Code + GCS Marker Files**

```python
# Service writes marker file per successful date
def process_single_date(date):
    result = run_for_date(date)
    if result["status"] == "success":
        write_success_marker(date)  # gs://markers/{date}.success
    return result

# Deployment orchestrator checks GCS for markers
date_statuses = check_success_markers(date_range)
```

**Option C: Structured Output JSON**

```python
# Service writes final summary JSON to GCS
results_summary = {
    "shard_id": shard_id,
    "dates": [
        {"date": "2024-01-01", "status": "success", "duration_sec": 120},
        {"date": "2024-01-02", "status": "success", "duration_sec": 115},
        {"date": "2024-01-03", "status": "failed", "error": "API timeout"},
        {"date": "2024-01-04", "status": "success", "duration_sec": 118}
    ]
}
write_to_gcs(f"gs://metadata/{shard_id}/results.json", results_summary)

# Deployment orchestrator reads summary file
results = read_from_gcs(f"gs://metadata/{shard_id}/results.json")
```

**Recommendation:** **Option C** (most reliable and structured)

**Files to Update:**

- `unified-trading-library/core/parallel_date_processor.py` - Write results JSON
- `deployment-service/api/routes/deployments.py` - Read results JSON
- `deployment-service/ui/src/components/ShardDetails.tsx` - Display per-date status

---

### 3. Dependency Checking (Multi-Date Shards)

**Current Dependency Model:**

```python
# Check if upstream data exists for ONE date
def check_dependencies(service, date, category):
    if service == "features-delta-one":
        # Depends on: market-data-processing
        return check_candles_exist(date, category)
```

**With Multi-Date Shards:**

```python
def check_dependencies(service, start_date, end_date, category):
    """Check if upstream data exists for ALL dates in range"""
    if service == "features-delta-one":
        date_range = generate_date_range(start_date, end_date)

        # Check each date
        missing_dates = []
        for date in date_range:
            if not check_candles_exist(date, category):
                missing_dates.append(date)

        if missing_dates:
            return {
                "ready": False,
                "missing_dates": missing_dates,
                "message": f"Candles missing for {len(missing_dates)} dates"
            }

        return {"ready": True}
```

**Optimization:** Batch GCS existence checks

```python
def check_dependencies_batch(service, date_range, category):
    """Check dependencies for multiple dates in one GCS operation"""
    if service == "features-delta-one":
        # Build all expected paths
        expected_paths = [
            build_candle_path(date, category) for date in date_range
        ]

        # Check existence in batch (list_blobs with prefix)
        existing_paths = batch_check_gcs_existence(expected_paths)

        missing_dates = [
            date for date, path in zip(date_range, expected_paths)
            if path not in existing_paths
        ]

        return {
            "ready": len(missing_dates) == 0,
            "missing_dates": missing_dates
        }
```

**Files to Update:**

- `deployment-service/api/utils/dependency_checker.py` (or equivalent)
- Support date range instead of single date
- Batch GCS checks for efficiency

---

### 4. Retry Logic (Multi-Date Shards)

**Scenarios:**

**Scenario A: All dates in shard failed**

```python
Shard: dates [2024-01-01, 2024-01-02, 2024-01-03, 2024-01-04]
Result: All 4 failed (upstream data missing)

Action: Retry entire shard
```

**Scenario B: Some dates failed**

```python
Shard: dates [2024-01-01, 2024-01-02, 2024-01-03, 2024-01-04]
Result: Date 3 failed (API timeout), others succeeded

Action: Create new shard with only failed date
  Retry Shard: --start-date 2024-01-03 --end-date 2024-01-03, MAX_WORKERS=1
```

**Scenario C: Shard timed out**

```python
Shard: dates [2024-01-01 ... 2024-01-16], MAX_WORKERS=16
Result: Timeout after 2 hours (only 12 dates completed)

Action:
  1. Check results.json for completed dates
  2. Create new shard with remaining 4 dates
  Retry Shard: --start-date 2024-01-13 --end-date 2024-01-16, MAX_WORKERS=4
```

**Retry Logic Implementation:**

```python
def create_retry_shards(failed_shard):
    """
    Create retry shards based on per-date failure info.

    Optimizations:
    1. If all dates failed → retry entire shard (upstream issue)
    2. If some dates failed → create single-date shards for failed dates
    3. If shard timed out → check partial completion, retry remaining
    """
    # Read results from shard
    results = read_shard_results(failed_shard["shard_id"])

    if results is None:
        # No results file → complete failure
        logger.warning(f"Shard {failed_shard['shard_id']} failed completely, retrying")
        return [failed_shard]  # Retry same shard

    # Get failed dates
    failed_dates = [
        r["date"] for r in results["dates"]
        if r["status"] != "success"
    ]

    if not failed_dates:
        # All dates succeeded (weird, but OK)
        logger.info(f"Shard {failed_shard['shard_id']} actually succeeded")
        return []

    # Create single-date shards for failed dates
    retry_shards = []
    for date in failed_dates:
        retry_shards.append({
            "cli_args": f"--start-date {date} --end-date {date}",
            "env_vars": {"MAX_WORKERS": "1"},  # Single date retry
            "retry_of": failed_shard["shard_id"],
            "retry_date": str(date)
        })

    logger.info(f"Created {len(retry_shards)} retry shards for failed dates")
    return retry_shards
```

**Files to Update:**

- `deployment-service/api/routes/deployments.py` - Retry logic
- `deployment-service/ui/src/components/ShardDetails.tsx` - Show retry info

---

### 5. UI Display for Multi-Date Shards

**Current Shard Display:**

```
Shard ID: instruments-20240101-20240101
Status: Completed ✅
Date: 2024-01-01
Duration: 2h 15m
```

**Updated Display (Multi-Date Shard):**

```
Shard ID: instruments-20240101-20240116
Status: Completed ✅
Date Range: 2024-01-01 to 2024-01-16 (16 dates)
Parallelism: 16 workers (MAX_WORKERS=16)
Duration: 2h 18m (serial would be ~36h, 15.7x speedup)

Per-Date Status:
  ✅ 2024-01-01 (completed in 8m)
  ✅ 2024-01-02 (completed in 7m)
  ...
  ✅ 2024-01-16 (completed in 9m)

Resource Usage:
  Avg CPU: 87%
  Peak CPU: 95%
  Avg Memory: 45%
  Peak Memory: 62%
```

**Components to Update:**

- `ShardCard.tsx` - Show date range and parallelism
- `ShardDetails.tsx` - Expand to show per-date status
- `DeploymentSummary.tsx` - Aggregate across multi-date shards

---

### 6. Data Status Checker Compatibility

**Current Data Status:**

```python
# Check if data exists for specific date
def check_data_status(service, category, date):
    path = build_expected_path(service, category, date)
    return gcs_blob_exists(path)
```

**With Multi-Date Shards (No Change Needed!):**

```python
# Data status is still per-date
# Doesn't care about shard boundaries

# If shard processed days 1-4, data status checks each day independently:
check_data_status("instruments", "CEFI", "2024-01-01")  # ✅
check_data_status("instruments", "CEFI", "2024-01-02")  # ✅
check_data_status("instruments", "CEFI", "2024-01-03")  # ❌ (if this date failed)
check_data_status("instruments", "CEFI", "2024-01-04")  # ✅
```

**Result:** ✅ No changes needed to data-status logic!

Data status operates at date granularity, independent of shard boundaries.

---

## CSV/Sample Dump Audit

### Critical Safety Check

**Must ensure:** NO disk dumps on production VMs

**Audit Commands:**

```bash
# Find all to_csv calls
cd unified-trading-system-repos
rg "to_csv\(" --type py -g "!tests/" -g "!.venv/" -g "!archive/"

# Find sample directories
rg "samples?/|debug.*write|dump.*csv" --type py -g "!tests/" -g "!.venv/"

# Find ENABLE_SAMPLES or similar flags
rg "ENABLE.*SAMPLE|DEBUG.*DUMP|WRITE.*CSV" --type py -g "!tests/" -g "!.venv/"
```

**For Each Finding:**

**Pattern 1: Guarded by Environment Check ✅**

```python
if os.getenv("ENVIRONMENT") == "dev":
    df.to_csv('samples/debug.csv')  # OK - local only
```

**Pattern 2: Always Enabled ❌**

```python
df.to_csv('/tmp/debug.csv')  # BAD - runs on VMs!
```

**Fix:**

```python
# Add environment guard
if os.getenv("ENVIRONMENT") == "dev" and os.getenv("ENABLE_SAMPLES") == "true":
    df.to_csv('samples/debug.csv')
```

**Pattern 3: Tardis Response Caching ⚠️**

```python
# Cache Tardis responses to avoid re-downloading
response.content.to_file('/tmp/tardis_cache/response.json')
```

**Analysis:**

- If cache is in memory: ✅ OK
- If cache writes to disk: ⚠️ Check size and frequency
- If thousands of small files: ❌ BAD for SSD

**Fix:**

- Use in-memory caching (Redis, Python dict with TTL)
- Or write to GCS (not local disk)
- Or disable caching on VMs

---

### Expected Findings by Service

**High Risk (Check First):**

1. **market-tick-data-handler** - Tardis response caching, tick data samples
2. **features-delta-one-service** - Intermediate feature dumps, TA-Lib debug output
3. **ml-training-service** - Training data samples, model checkpoints to disk
4. **execution-service** - Backtest intermediate states, order logs

**Low Risk:**

1. instruments-service - Simple API → parquet flow
2. features-calendar-service - Minimal processing
3. ml-inference-service - Simple inference flow

---

## Dependency Checking Optimization

### Current Approach (Inefficient for Multi-Date)

```python
# Check each date individually (N GCS API calls)
for date in date_range:
    if not check_candles_exist(date, category):
        missing.append(date)
# 16 dates = 16 GCS list_blobs calls
```

### Optimized Approach (Batch Check)

```python
def check_dependencies_batch(service, date_range, category):
    """
    Check dependencies for date range in 1-2 GCS operations.

    Strategy: List all blobs with prefix, check against expected dates.
    """
    if service == "features-delta-one":
        # Expected paths for all dates
        expected_dates = set(date_range)

        # List all blobs in date range (single GCS call)
        prefix = f"processed_candles/by_date/"
        start_prefix = f"{prefix}day={date_range[0]}/"
        end_prefix = f"{prefix}day={date_range[-1]}/"

        # List blobs between start and end
        existing_blobs = list_blobs_in_range(bucket, prefix, start_prefix, end_prefix)

        # Extract dates from blob paths
        existing_dates = set()
        for blob in existing_blobs:
            match = re.search(r'day=(\d{4}-\d{2}-\d{2})/', blob.name)
            if match:
                existing_dates.add(match.group(1))

        # Find missing dates
        missing_dates = expected_dates - existing_dates

        return {
            "ready": len(missing_dates) == 0,
            "missing_dates": list(missing_dates),
            "check_method": "batch",
            "gcs_calls": 1  # vs 16 for individual checks
        }
```

**Benefits:**

- ✅ 1 GCS API call instead of N
- ✅ Faster dependency checking
- ✅ Lower GCS operations cost
- ✅ Scales with MAX_WORKERS

**Files to Update:**

- `deployment-service` dependency checker
- Add `check_dependencies_batch()` function
- Use for multi-date shards

---

## Complete Implementation Checklist

### A. unified-trading-library Changes

- [ ] **Create** `core/parallel_date_processor.py`
  - `ParallelDateProcessor` class
  - `calculate_optimal_workers()` function
  - Results JSON writer
  - Error handling and retry support

- [ ] **Update** `core/performance_monitor.py`
  - Log summaries at INFO level (not just DEBUG)
  - Include MAX_WORKERS in metrics
  - Calculate actual vs theoretical speedup

- [ ] **Add** documentation in README
  - MAX_WORKERS usage
  - Date parallelization guide
  - Service integration examples

---

### B. Service Updates (Priority Order)

**Priority 1: instruments-service (32x improvement)**

- [ ] Refactor `cli/main.py` to use ParallelDateProcessor
- [ ] Extract `process_single_date()` function
- [ ] Test locally with MAX_WORKERS=4
- [ ] Add to `.env.example`: `MAX_WORKERS=16`
- [ ] **Audit:** Search for CSV dumps, disable on VMs
- [ ] Deploy to test environment
- [ ] Validate: 16 dates in parallel, CPU 85-95%

**Priority 2: features-calendar-service (30x improvement)**

- [ ] Same steps as instruments-service
- [ ] Default MAX_WORKERS=16

**Priority 3: ml-inference-service (5x improvement)**

- [ ] Same steps
- [ ] Default MAX_WORKERS=3

**Priority 4: market-data-processing-service (2x, optional)**

- [ ] Same steps
- [ ] Default MAX_WORKERS=2 (conservative)
- [ ] Monitor RAM carefully

**Skip (Memory-Bound):**

- market-tick-data-handler (MAX_WORKERS=1)
- features-delta-one-service (MAX_WORKERS=1)
- ml-training-service (MAX_WORKERS=1)

---

### C. Deployment Orchestrator Updates

- [ ] **Update shard creation** in `api/routes/deployments.py`
  - Add `max_workers` parameter
  - Batch dates into multi-date shards
  - Set MAX_WORKERS env var per shard

- [ ] **Add service defaults**
  - `SERVICE_MAX_WORKERS` constant
  - Map service → recommended MAX_WORKERS

- [ ] **Update dependency checker**
  - Support date ranges (not just single dates)
  - Batch GCS existence checks
  - Return per-date status

- [ ] **Enhance retry logic**
  - Read per-date results from JSON
  - Create targeted retry shards
  - Support partial shard success

- [ ] **Add CLI argument**
  - `--max-workers N` option
  - Overrides service default
  - Documented in help text

---

### D. UI Updates

- [ ] **ShardCard.tsx**
  - Display date range (not just single date)
  - Show MAX_WORKERS value
  - Show "16 dates in parallel" indicator

- [ ] **ShardDetails.tsx**
  - Expand to show per-date status table
  - Columns: Date, Status, Duration, Retry Info
  - Highlight failed dates
  - Show overall shard completion: "14/16 dates successful"

- [ ] **DeploymentSummary.tsx**
  - Aggregate across multi-date shards
  - Show total dates processed vs total dates requested
  - Show average dates per shard (indicates parallelism)

- [ ] **ResourceMetricsPanel.tsx** (new)
  - Show CPU/RAM utilization
  - Compare: actual workers vs MAX_WORKERS
  - Show speedup achieved: "15.7x faster than serial"

---

### E. Terraform Updates

- [ ] **Add MAX_WORKERS env var** to all service job templates

  ```hcl
  env {
    name  = "MAX_WORKERS"
    value = var.max_workers[var.service_name]
  }
  ```

- [ ] **Define service-specific defaults**

  ```hcl
  variable "max_workers" {
    type = map(number)
    default = {
      "instruments-service"         = 16
      "features-calendar-service"   = 16
      "ml-inference-service"        = 3
      # ... others = 1
    }
  }
  ```

- [ ] **Document in terraform/README.md**
  - MAX_WORKERS purpose
  - How to override per service
  - RAM safety considerations

---

### F. Testing & Validation

- [ ] **Unit tests** for ParallelDateProcessor
  - Mock date processing function
  - Test various MAX_WORKERS values
  - Test with uneven date counts

- [ ] **Integration tests** per service
  - 5 dates with MAX_WORKERS=3
  - Verify 2 shards created (3 dates + 2 dates)
  - Verify parallel processing in logs
  - Verify all dates completed

- [ ] **E2E test** with full deployment
  - 30 days, MAX_WORKERS=16
  - Monitor resource usage
  - Validate speedup
  - Check data quality

- [ ] **Load test** with 365 days
  - Compare: serial vs parallel completion time
  - Measure: VM count reduction
  - Validate: no data loss or corruption

---

## Audit Results to Document

After completing audits, document:

### 1. CSV/Sample Dump Findings

**Create:** `CSV_DUMP_AUDIT_RESULTS.md`

**For each service:**

- Files checked
- CSV/dump locations found
- Whether guarded by ENVIRONMENT check
- Action taken (added guard, removed dump, etc.)

---

### 2. Paradise Batching Interaction

**Create:** `PARADISE_MAX_WORKERS_COMPATIBILITY.md`

**Document:**

- How Paradise batching works
- How MAX_WORKERS works
- Why they're compatible (different layers)
- Combined optimization potential

---

### 3. Dependency Checker Updates

**Update:** `deployment-service/docs/DEPENDENCY_CHECKING.md`

**Document:**

- Batch dependency checking
- Performance improvements (1 GCS call vs N)
- Multi-date shard support

---

### 4. Retry Logic Documentation

**Update:** `deployment-service/docs/RETRY_LOGIC.md` (or create)

**Document:**

- Per-date retry strategy
- Partial shard completion handling
- Timeout recovery

---

## Timeline and Effort Estimate

| Phase                  | Tasks                              | Effort       | Owner                   |
| ---------------------- | ---------------------------------- | ------------ | ----------------------- |
| **A. Infrastructure**  | ParallelDateProcessor, env vars    | 4h           | unified-trading-library |
| **B. Service Updates** | 3 services × 2h                    | 6h           | Per service             |
| **C. Orchestrator**    | Shard logic, dependency, retry     | 8h           | deployment-service      |
| **D. UI**              | Multi-date display, resource panel | 6h           | UI components           |
| **E. Terraform**       | Env vars, defaults                 | 2h           | Terraform modules       |
| **F. Testing**         | Unit, integration, E2E             | 8h           | All repos               |
| **G. Audits**          | CSV dumps, compatibility docs      | 4h           | Documentation           |
| **Total**              |                                    | **38 hours** |                         |

**Rollout:** 1-2 weeks with careful testing

---

## Expected Impact

### VM Count Reduction

| Service                | Current Shards  | With MAX_WORKERS | Reduction |
| ---------------------- | --------------- | ---------------- | --------- |
| instruments            | 365             | 23               | 94%       |
| features-calendar      | 365             | 23               | 94%       |
| ml-inference           | 365             | 122              | 67%       |
| Others (MAX_WORKERS=1) | 365 × 4 = 1,460 | 1,460            | 0%        |
| **Total**              | **2,555**       | **1,628**        | **36%**   |

**Startup Time Saved:** 927 VMs × 4 min = 62 hours

---

### Completion Time Improvement

| Service                      | Serial Time | Parallel Time | Speedup |
| ---------------------------- | ----------- | ------------- | ------- |
| instruments (365 days)       | 730 hours   | 46 hours      | **16x** |
| features-calendar (365 days) | 365 hours   | 23 hours      | **16x** |
| ml-inference (365 days)      | 30 hours    | 10 hours      | **3x**  |

**Total Time Saved:** 1,041 hours of compute time

---

### Cost Impact

**Machine-hours saved:** 1,041 hours

**Cost savings:**

- Regular VMs: 1,041 × $0.2088 = **$217/year**
- Preemptible VMs: 1,041 × $0.0418 = **$44/year**

**Or keep same cost, get 16x faster completion!**

---

## Summary

**Your Strategy:** ✅ Brilliant and Correct!

**Key Points:**

1. ✅ MAX_WORKERS defines both sharding (how dates batched) AND parallelism (processes per VM)
2. ✅ Nested parallelism is fine (CPU queues naturally, just watch RAM)
3. ✅ Must audit and disable CSV dumps on VMs
4. ✅ Deployment orchestrator creates multi-date shards based on MAX_WORKERS
5. ✅ Example: 16 days, MAX_WORKERS=16 → 1 shard processing all 16 in parallel

**Implementation Path:**

1. Create ParallelDateProcessor in unified-trading-library
2. Update deployment orchestrator shard creation (batch dates)
3. Update 3 high-priority services to use date parallelism
4. Audit and disable CSV dumps
5. Update UI to show multi-date shard status
6. Test and validate with real deployments

**Impact:** 36% fewer VMs, 16x faster for low-utilization services, optimal C2 machine usage

**Next steps:** Should I audit the CSV dumps and Paradise batching interaction now, or do you want to review this plan first?
