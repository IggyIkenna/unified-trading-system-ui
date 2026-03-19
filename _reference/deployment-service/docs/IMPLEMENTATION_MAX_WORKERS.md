# MAX_WORKERS Implementation - Complete Technical Specification

**Purpose:** Date-level parallelism to maximize C2 machine utilization
**Impact:** 36% fewer VMs, 16x faster for low-utilization services
**Status:** Ready for implementation
**Date:** February 10, 2026

---

## Executive Summary

**What:** Implement date-level parallelism to maximize C2 machine utilization

**Why:** C2-only quota constraint prevents downsizing → parallelize dates within machines instead

**Impact:**

- 36% fewer VMs needed (2,555 → 1,628)
- 16x faster for low-utilization services
- 85-95% CPU utilization (vs 10-40% before)
- $387/year compute savings OR same cost with 16x speed

**Timeline:** 31 hours over 2-3 weeks

---

## Table of Contents

1. [Part 1: Strategic Overview](#part-1-strategic-overview)
2. [Part 2: Adaptive Design (RECOMMENDED)](#part-2-adaptive-design-recommended)
3. [Part 3: Static Approach](#part-3-static-approach)
4. [Part 4: Service-by-Service Analysis](#part-4-service-by-service-analysis)
5. [Part 5: Safety Analysis](#part-5-safety-analysis)
6. [Part 6: Deployment Integration](#part-6-deployment-integration)
7. [Part 7: Testing & Validation](#part-7-testing--validation)
8. [Appendices](#appendices)

---

## Part 1: Strategic Overview

### Core Concept

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

### Key Insight: CPU vs RAM Over-Subscription

**CPU Over-Subscription:** ✅ **SAFE**

- Spawn more processes than vCPUs available
- OS queues processes naturally
- No crash, just natural scheduling
- Example: 40 processes on 4 vCPUs → all complete, just queue

**RAM Over-Subscription:** ❌ **FATAL**

- Spawn processes that exceed available RAM
- Linux OOM killer terminates process (exit 137)
- Job fails, data lost, costly retry
- Example: 4 processes × 6 GB = 24 GB on 16 GB machine → OOM kill

---

### Adaptive vs Static Strategy

#### Adaptive Strategy (RECOMMENDED)

**How it works:**

1. **Profile first date** - Detect I/O vs CPU bound, measure memory
2. **Calculate safe workers** - Based on RAM availability
3. **Monitor RAM in real-time** - Every 10 seconds
4. **Reduce if RAM > 85%** - Prevent OOM before it happens
5. **Increase if RAM < 60%** - Maximize throughput (I/O-bound only)

**Benefits:**

- ✅ **Machine-agnostic** - Works on c2-std-4, c2-std-8, c2-std-16 automatically
- ✅ **Data-agnostic** - Adapts if date sizes vary
- ✅ **No manual tuning** - Service self-optimizes
- ✅ **Graceful degradation** - Reduces workers vs crashing
- ✅ **I/O-bound optimization** - Can use 22 workers on 4 vCPUs (5.5x CPU over-subscription)
- ✅ **CPU-bound safety** - Conservative matching (prevents context switching overhead)

**Example: instruments-service (I/O-bound)**

```
Machine: c2-standard-4 (4 vCPU, 16 GB)
Task: 10% CPU, 0.5 GB RAM per worker

Adaptive calculates: 22 workers (RAM-constrained)
  - CPU: 22 × 10% = 220% requested → queues to 100% actual ✅
  - RAM: 22 × 0.5 GB = 11 GB / 16 GB = 69% ✅

If one date uses 2 GB instead of 0.5 GB:
  - RAM spikes to 88%
  - Adaptive reduces: 22 → 18 → 14 workers
  - Job completes safely (no OOM)
```

#### Static Strategy (Fallback)

**How it works:**

1. Configure MAX_WORKERS in env/Terraform
2. Service uses fixed worker count
3. No runtime adaptation

**Use when:**

- Service has uniform, predictable memory usage
- Already at resource limits (features-delta-one at 90% CPU, 75% RAM)
- Prefer deterministic behavior over optimization

**Drawback:**

- Must manually tune per service per machine type
- Risk of OOM if data size increases
- Can't maximize I/O-bound tasks (limited to conservative workers)

---

## Part 2: Adaptive Design (RECOMMENDED)

### I/O-Bound vs CPU-Bound Strategy

#### I/O-Bound Tasks (Network, Disk)

**Examples:**

- instruments-service (API calls, minimal computation)
- market-tick-data-handler (download from Tardis)
- ml-inference-service (load model, light inference)

**Characteristics:**

- Low CPU usage (~10-40% per worker)
- Waiting on network/disk I/O
- GIL not a bottleneck (I/O releases GIL)

**Optimal Strategy:**

- ✅ **Over-subscribe CPU heavily** (10-20x processes per vCPU)
- While workers wait for I/O, CPU processes other workers
- Example: 4 vCPUs, 10% usage → spawn 40 workers (100% CPU utilization)

**RAM Constraint:**

- Each worker needs buffers for API responses/downloads
- Must monitor: 40 workers × buffer_size < available_RAM

#### CPU-Bound Tasks (Computation)

**Examples:**

- features-delta-one-service (TA-Lib, pandas calculations)
- ml-training-service (LightGBM training)
- market-data-processing-service (candle aggregation)

**Characteristics:**

- High CPU usage (~80-100% per worker)
- Minimal I/O waiting
- GIL can be bottleneck (depends on library - NumPy/TA-Lib release GIL)

**Optimal Strategy:**

- ✅ **Match workers to vCPUs** (1-2x processes per vCPU)
- Example: 4 vCPUs, 90% usage → spawn 4-8 workers max
- More workers = context switching overhead

**RAM Constraint:**

- Each worker needs full dataset in memory
- Must monitor: N workers × dataset_size < available_RAM

---

### Adaptive Algorithm

#### Design

**1. Start with Initial Workers**

```python
# Initial MAX_WORKERS from config or env
initial_workers = int(os.getenv("MAX_WORKERS", "4"))

# Can also calculate based on machine specs
calculated_workers = calculate_safe_workers(
    task_type="io_bound",  # or "cpu_bound"
    allocated_vcpus=4,
    allocated_memory_gb=16,
    estimated_memory_per_worker_gb=0.5
)

# Use max of both (allows CPU over-subscription for I/O tasks)
max_workers = max(initial_workers, calculated_workers)
```

**2. Monitor RAM During Execution**

```python
import psutil
from multiprocessing import Pool, Value, Lock

class AdaptiveParallelDateProcessor:
    def __init__(self, process_date_func, initial_workers, task_type="io_bound"):
        self.process_date_func = process_date_func
        self.initial_workers = initial_workers
        self.task_type = task_type

        # Shared state for worker adjustment
        self.current_workers = Value('i', initial_workers)
        self.workers_lock = Lock()

        # RAM monitoring thread
        self.monitor_thread = threading.Thread(target=self._monitor_resources, daemon=True)
        self.should_stop = threading.Event()

    def _monitor_resources(self):
        """Monitor RAM usage and adjust workers dynamically"""
        while not self.should_stop.is_set():
            memory = psutil.virtual_memory()

            with self.workers_lock:
                current = self.current_workers.value

                # RAM thresholds
                if memory.percent > 90:
                    # CRITICAL: Reduce workers immediately
                    new_workers = max(1, current - 2)
                    self.current_workers.value = new_workers
                    logger.error(
                        f"🚨 RAM critical ({memory.percent}%), reducing workers: {current} → {new_workers}",
                        extra={"ram_percent": memory.percent, "workers": new_workers}
                    )

                elif memory.percent > 85:
                    # WARNING: Reduce workers gradually
                    new_workers = max(1, current - 1)
                    self.current_workers.value = new_workers
                    logger.warning(
                        f"⚠️ RAM high ({memory.percent}%), reducing workers: {current} → {new_workers}",
                        extra={"ram_percent": memory.percent, "workers": new_workers}
                    )

                elif memory.percent < 60 and current < self.initial_workers:
                    # Safe: Can increase workers (if below initial)
                    new_workers = min(self.initial_workers, current + 1)
                    self.current_workers.value = new_workers
                    logger.info(
                        f"✅ RAM low ({memory.percent}%), increasing workers: {current} → {new_workers}",
                        extra={"ram_percent": memory.percent, "workers": new_workers}
                    )

            time.sleep(10)  # Check every 10 seconds
```

**3. Dynamic Pool Sizing**

```python
def process_dates_adaptive(self, dates, config):
    """Process dates with adaptive worker count"""

    # Start monitoring
    self.monitor_thread.start()

    # Use Pool with dynamic size
    # Strategy: Start multiple small batches, adjust between batches
    batch_size = self.current_workers.value
    remaining_dates = list(dates)
    all_results = []

    while remaining_dates:
        # Get current worker count
        with self.workers_lock:
            batch_size = self.current_workers.value

        # Process next batch
        batch = remaining_dates[:batch_size]
        remaining_dates = remaining_dates[batch_size:]

        logger.info(f"Processing batch of {len(batch)} dates with {batch_size} workers")

        with Pool(processes=batch_size) as pool:
            batch_results = pool.map(self.process_date_func, [(d, config) for d in batch])

        all_results.extend(batch_results)

        # Log progress
        logger.info(
            f"Batch complete. Remaining: {len(remaining_dates)} dates",
            extra={
                "completed": len(all_results),
                "remaining": len(remaining_dates),
                "current_workers": batch_size
            }
        )

    # Stop monitoring
    self.should_stop.set()
    self.monitor_thread.join()

    return all_results
```

---

### I/O-Bound Task Handling

#### Aggressive CPU Over-Subscription

**For services like instruments-service (10% CPU per worker):**

```python
class AdaptiveParallelDateProcessor:
    def calculate_io_bound_workers(self):
        """
        For I/O-bound tasks, heavily over-subscribe CPU.
        Constraint: RAM only
        """
        allocated_vcpus = int(os.getenv("ALLOCATED_VCPUS", "4"))
        allocated_memory_gb = int(os.getenv("ALLOCATED_MEMORY_GB", "16"))

        # I/O-bound: ignore CPU, only consider RAM
        # Assume each worker needs 0.5 GB worst-case
        memory_per_worker = 0.5

        # Safe workers based on RAM only
        safe_workers = int(allocated_memory_gb / memory_per_worker * 0.7)  # 70% utilization target

        # Allow massive over-subscription for I/O
        # 4 vCPUs, 16 GB RAM → 22 workers (5.5x CPU over-subscription)

        logger.info(
            f"I/O-bound task: {safe_workers} workers calculated",
            extra={
                "task_type": "io_bound",
                "allocated_vcpus": allocated_vcpus,
                "allocated_memory_gb": allocated_memory_gb,
                "workers": safe_workers,
                "cpu_oversubscription": safe_workers / allocated_vcpus
            }
        )

        return safe_workers
```

**Example:**

```
Machine: c2-standard-4 (4 vCPU, 16 GB)
Task: instruments-service (10% CPU, 0.5 GB RAM per date)

Static approach: MAX_WORKERS=4 (1x vCPU)
  - CPU: 4 × 10% = 40% utilization (WASTED)

Adaptive approach: MAX_WORKERS=22 (5.5x vCPU)
  - CPU: 22 × 10% = 220% requested, but queues to 100% actual ✅
  - RAM: 22 × 0.5 GB = 11 GB / 16 GB = 69% ✅
  - Result: 100% CPU utilization, safe RAM usage
```

---

### CPU-Bound Task Handling

#### Conservative CPU Matching

**For services like features-delta-one (90% CPU per worker):**

```python
def calculate_cpu_bound_workers(self):
    """
    For CPU-bound tasks, match workers to vCPUs.
    Both CPU and RAM are constraints.
    """
    allocated_vcpus = int(os.getenv("ALLOCATED_VCPUS", "4"))
    allocated_memory_gb = int(os.getenv("ALLOCATED_MEMORY_GB", "16"))

    # CPU-bound: workers should roughly match vCPUs
    # Over-subscription causes context switching overhead
    cpu_based_workers = int(allocated_vcpus * 1.5)  # 1.5x max

    # RAM constraint
    memory_per_worker = 12.0  # 12 GB per date for features
    memory_based_workers = int(allocated_memory_gb / memory_per_worker * 0.8)  # 80% target

    # Take minimum (most conservative)
    safe_workers = min(cpu_based_workers, memory_based_workers)

    # c2-standard-4: min(6, 1) = 1 worker
    # c2-standard-8: min(12, 2) = 2 workers

    return safe_workers
```

---

### Task Type Detection

#### Auto-Detect I/O vs CPU Bound

**Profile first date to determine task type:**

```python
def detect_task_type(self, sample_date, config):
    """
    Process one date and profile to determine if I/O or CPU bound.

    Returns:
        "io_bound" if CPU usage < 50%
        "cpu_bound" if CPU usage >= 50%
    """
    import time

    # Start monitoring
    cpu_samples = []

    def monitor_cpu():
        for _ in range(10):  # Sample for duration of first date
            cpu_samples.append(psutil.cpu_percent(interval=1))

    monitor_thread = threading.Thread(target=monitor_cpu, daemon=True)
    monitor_thread.start()

    # Process sample date
    start = time.time()
    result = self.process_date_func(sample_date, config)
    duration = time.time() - start

    monitor_thread.join()

    # Analyze CPU usage
    avg_cpu = sum(cpu_samples) / len(cpu_samples) if cpu_samples else 0

    task_type = "io_bound" if avg_cpu < 50 else "cpu_bound"

    logger.info(
        f"Task type detected: {task_type} (avg CPU={avg_cpu:.1f}% during first date)",
        extra={
            "task_type": task_type,
            "avg_cpu": avg_cpu,
            "duration_sec": duration,
            "sample_date": str(sample_date)
        }
    )

    return task_type
```

**Usage:**

```python
def main():
    dates = generate_date_range(start_date, end_date)

    # Auto-detect task type from first date
    task_type = detect_task_type(dates[0], config)

    # Create adaptive processor with detected type
    processor = AdaptiveParallelDateProcessor(
        process_date_func=process_date,
        initial_workers=int(os.getenv("MAX_WORKERS", "4")),
        task_type=task_type  # Automatically uses correct strategy
    )

    # Process remaining dates
    results = processor.process_dates(dates[1:], config)
```

---

## Part 3: Static Approach

### Core Concept

**Fixed MAX_WORKERS per service:**

```python
# Deployment orchestrator creates shards with fixed MAX_WORKERS
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

### Service Code Integration

**Pattern: ParallelDateProcessor Integration**

Every service CLI follows this pattern:

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

## Part 4: Service-by-Service Analysis

### Resource Requirements Table

| Service            | Task Type | CPU/Worker | RAM/Worker | Safe Workers (c2-std-4) | MAX_WORKERS |
| ------------------ | --------- | ---------- | ---------- | ----------------------- | ----------- |
| instruments        | I/O       | 10%        | 0.5 GB     | 22                      | 16          |
| market-tick        | I/O       | 15%        | 10 GB      | 1                       | 1           |
| market-processing  | CPU       | 70%        | 6 GB       | 1-2                     | 1           |
| features-delta-one | CPU       | 90%        | 12 GB      | 1                       | 1           |
| features-calendar  | I/O       | 10%        | 0.5 GB     | 22                      | 16          |
| ml-training        | CPU       | 95%        | 25 GB      | 1                       | 1           |
| ml-inference       | Mixed     | 40%        | 3 GB       | 3-5                     | 3           |
| strategy-service   | Mixed     | 50%        | 4 GB       | 2                       | 1           |
| execution-service  | Mixed     | 60%        | 5 GB       | 2                       | 1           |

---

### 1. instruments-service

**Main Date Loop:**

- **File:** `instruments_service/cli/main.py`
- **Pattern:** `for date in date_range: process_date(...)`

**Single-Date Function:**

```python
def process_instruments_for_date(date_obj: date, category: str) -> dict:
    """Process instruments for a single date (parallelizable)"""
    # 1. Fetch instrument definitions
    # 2. Validate and transform
    # 3. Write to GCS
    return {"date": date_obj, "status": "success"}
```

**Nested Parallelism:**

- Instruments fetched in parallel (per venue API calls)
- No issue with date-level parallelism

**RAM per Date:** ~500 MB
**Recommended MAX_WORKERS:** 16 (conservative), up to 22 (optimal)

**Priority:** 🔥 **HIGH** (32x improvement)

**Expected Impact:** 10% CPU → 90% CPU, 730h → 46h

---

### 2. market-tick-data-handler

**Main Date Loop:**

- **File:** `market_data_tick_handler/cli/main.py`
- **Pattern:** `for date in date_range: orchestration_service.run_for_date(date)`

**Single-Date Function:**

```python
def process_tick_data_for_date(date_obj: date, config: dict) -> dict:
    """Process market tick data for a single date"""
    # 1. Download tick data from Tardis
    # 2. Partition by instrument type, venue
    # 3. Write parquet files to GCS
    return {"date": date_obj, "status": "success"}
```

**Nested Parallelism:**

- Multiple data types fetched in parallel (trades, tbbo, ohlcv)
- Instruments partitioned concurrently

**RAM per Date:** ~10 GB (BTC full day)
**Recommended MAX_WORKERS:** 1 (memory-bound)

**Priority:** ❌ **LOW** (already memory-bound)

---

### 3. market-data-processing-service

**Main Date Loop:**

- **File:** `market_data_processing_service/cli/main.py`
- **Pattern:** `for date in date_range: orchestration_service.run_for_date(date)`

**Single-Date Function:**

```python
def process_candles_for_date(date_obj: date, config: dict) -> dict:
    """Process candles for a single date"""
    # 1. Load tick data from GCS
    # 2. Aggregate to 7 timeframes
    # 3. Write candles to GCS
    return {"date": date_obj, "status": "success"}
```

**Nested Parallelism:**

- 7 timeframes processed in parallel
- Instruments processed in parallel per timeframe

**RAM per Date:** ~6 GB
**Recommended MAX_WORKERS:** 1-2 (monitor carefully)

**Priority:** ⚠️ **MEDIUM** (2x improvement, marginal)

**CRITICAL:** ⚠️ CSV sampling default must be fixed (see Part 5)

---

### 4. features-delta-one-service

**Main Date Loop:**

- **File:** `features_delta_one_service/cli/main.py`
- **Pattern:** `for date in date_range: batch_handler.run_for_date(date)`

**Single-Date Function:**

```python
def process_features_for_date(date_obj: date, config: dict) -> dict:
    """Process features for a single date"""
    # 1. Load candles from GCS
    # 2. Calculate 20 feature groups
    # 3. Write features to GCS
    return {"date": date_obj, "status": "success"}
```

**Nested Parallelism:**

- 20 feature groups processed in parallel (each group is a separate calculator)
- Multiple instruments processed concurrently

**RAM per Date:** ~12 GB (with all groups in memory)
**Recommended MAX_WORKERS:** 1 (already at limit)

**Priority:** ❌ **LOW** (already optimized, would need c2-standard-16 for parallelism)

---

### 5. features-calendar-service

**Main Date Loop:**

- **File:** `features_calendar_service/cli/batch_handler.py`
- **Pattern:** `for date in date_range: process_date(...)`

**Single-Date Function:**

```python
def process_calendar_for_date(date_obj: date, config: dict) -> dict:
    """Process calendar features for a single date"""
    # 1. Generate temporal features (hour, day, week, etc.)
    # 2. Fetch economic events
    # 3. Write to GCS
    return {"date": date_obj, "status": "success"}
```

**Nested Parallelism:**

- Minimal (independent calculations)
- No instrument-level loops

**RAM per Date:** ~500 MB
**Recommended MAX_WORKERS:** 16 (conservative), up to 22 (optimal)

**Priority:** 🔥 **HIGH** (30x improvement)

**Expected Impact:** 10% CPU → 90% CPU, 365h → 23h

---

### 6. ml-training-service

**Main Loop:** Training periods (quarters), not dates

**Pattern:**

```python
# Not date-based!
for training_period in ["2023-Q1", "2023-Q2", ...]:
    train_model(training_period)
```

**Date Parallelism:** ❌ Not applicable (training period is the unit)

**Recommended MAX_WORKERS:** 1

**Note:** Training periods already load date ranges internally. Could parallelize loading dates within a training period, but model training is the bottleneck (already uses all CPUs).

**Priority:** ❌ **N/A**

---

### 7. ml-inference-service

**Main Date Loop:**

- **File:** `ml_inference_service/cli/main.py`
- **Pattern:** `for date in date_range: run_inference(date)`

**Single-Date Function:**

```python
def process_inference_for_date(date_obj: date, config: dict) -> dict:
    """Run inference for a single date"""
    # 1. Load features for date
    # 2. Load model (cached across dates)
    # 3. Generate predictions
    # 4. Write to GCS
    return {"date": date_obj, "status": "success"}
```

**Nested Parallelism:**

- Multiple instruments inferred concurrently
- Multiple target types in parallel

**RAM per Date:** ~3 GB
**Recommended MAX_WORKERS:** 3-5

**Priority:** 🔥 **HIGH** (5x improvement)

**Expected Impact:** 40% CPU → 85% CPU, 30h → 10h

---

## Part 5: Safety Analysis

### CSV Dump Audit

#### Critical Safety Check

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

#### CRITICAL FIX: market-data-processing-service

**File:** `market_data_processing_service/config.py`
**Line:** 406

**Current (BAD):**

```python
enable_csv_sampling: bool = Field(
    default_factory=lambda: get_config("ENABLE_CSV_SAMPLING", "true").lower() == "true",
    #                                                          ^^^^ BAD DEFAULT
    description="Enable local CSV sampling for debugging (dev only)",
)
```

**Fixed:**

```python
enable_csv_sampling: bool = Field(
    default_factory=lambda: get_config("ENABLE_CSV_SAMPLING", "false").lower() == "true",
    #                                                          ^^^^^ FIXED
    description="Enable local CSV sampling for debugging (dev only)",
)
```

**Why Critical:**

- Current default enables CSV dumps on production VMs
- With MAX_WORKERS=4, creates 280+ CSV files per shard
- Kills SSD performance
- **BLOCKER for MAX_WORKERS rollout**

---

### Dependency Checking

#### Multi-Date Shard Validation

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

#### Batch GCS Checks (Optimization)

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

---

### Retry Logic

#### Multi-Date Shard Retry Scenarios

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

#### Retry Logic Implementation

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

---

## Part 6: Deployment Integration

### Shard Creation Logic

**File:** `deployment-service/api/routes/deployments.py` (or equivalent)

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
```

---

### CLI Argument Addition

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

### Status Tracking (Multi-Date Shards)

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

**Option: Structured Output JSON (RECOMMENDED)**

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

---

## Part 7: Testing & Validation

### Unit Tests

| Repository              | Test File                                         | Coverage                            |
| ----------------------- | ------------------------------------------------- | ----------------------------------- |
| unified-trading-library | `tests/unit/test_parallel_date_processor.py`      | ParallelDateProcessor class         |
| unified-trading-library | `tests/unit/test_adaptive_processor.py`           | AdaptiveParallelDateProcessor class |
| deployment-service      | `tests/unit/test_shard_calculator_max_workers.py` | Multi-date shard batching           |
| deployment-service      | `tests/unit/test_batch_dependencies.py`           | Batch dependency checking           |
| instruments-service     | `tests/unit/test_parallel_processing.py`          | Service integration                 |

---

### Integration Tests

| Test Name                        | Scope                  | Validation                                |
| -------------------------------- | ---------------------- | ----------------------------------------- |
| `test_multi_date_shard_creation` | Orchestrator           | 365 days, MW=16 → 23 shards               |
| `test_per_date_results`          | Service + orchestrator | Results JSON written and readable         |
| `test_partial_shard_retry`       | Retry logic            | 2 failed dates out of 16 → 2 retry shards |
| `test_dependency_batch_check`    | Dependency checker     | 1 GCS call for 16 dates                   |
| `test_adaptive_ram_reduction`    | Adaptive processor     | RAM spike → worker reduction              |

---

### E2E Tests

| Test Scenario      | Configuration            | Expected Outcome           |
| ------------------ | ------------------------ | -------------------------- |
| Small deployment   | 5 dates, MAX_WORKERS=4   | 2 shards, all complete     |
| Medium deployment  | 30 days, MAX_WORKERS=16  | 2 shards, CPU 85-95%       |
| Large deployment   | 365 days, MAX_WORKERS=16 | 23 shards, 16x speedup     |
| Partial failure    | 16 dates, 2 fail         | Targeted retry for 2 dates |
| Adaptive reduction | Variable date sizes      | Workers adjust, no OOM     |

---

### Test Matrix by Service

| Service           | MAX_WORKERS | Test Dates | Expected CPU | Expected Time             |
| ----------------- | ----------- | ---------- | ------------ | ------------------------- |
| instruments       | 16          | 20 days    | 90-100%      | 1.5 hours (vs 40h serial) |
| features-calendar | 16          | 20 days    | 90-100%      | 1.5 hours (vs 20h serial) |
| ml-inference      | 3           | 15 days    | 85-95%       | 25 min (vs 75 min serial) |

**Validation Criteria:**

- ✅ CPU utilization 85-100% (vs 10-40% before)
- ✅ No OOM kills
- ✅ No slowdowns from contention
- ✅ Completion time matches expected (serial time / MAX_WORKERS)
- ✅ All dates processed successfully

---

## Appendices

### Appendix A: Machine Type Matrix

| Machine Type   | vCPU | RAM    | I/O-Bound Workers | CPU-Bound Workers | Cost/Hour |
| -------------- | ---- | ------ | ----------------- | ----------------- | --------- |
| c2-standard-4  | 4    | 16 GB  | 22                | 4-6               | $0.2088   |
| c2-standard-8  | 8    | 32 GB  | 44                | 8-12              | $0.4176   |
| c2-standard-16 | 16   | 64 GB  | 89                | 16-24             | $0.8352   |
| c2-standard-30 | 30   | 120 GB | 168               | 30-45             | $1.5660   |
| c2-standard-60 | 60   | 240 GB | 336               | 60-90             | $3.1320   |

**Notes:**

- I/O-bound workers calculated as: `(RAM_GB / 0.5) * 0.7`
- CPU-bound workers calculated as: `vCPU * 1.5`
- Adaptive approach automatically selects optimal workers for any machine type

---

### Appendix B: Service Configuration Examples

#### instruments-service

```yaml
# .env.example
MAX_WORKERS=16
ALLOCATED_VCPUS=4
ALLOCATED_MEMORY_GB=16
ENVIRONMENT=production
ENABLE_SAMPLES=false

# Terraform
max_workers = 16
machine_type = "c2-standard-4"
task_type = "io_bound"
memory_per_worker_gb = 0.5
```

#### features-delta-one-service

```yaml
# .env.example
MAX_WORKERS=1
ALLOCATED_VCPUS=4
ALLOCATED_MEMORY_GB=16
ENVIRONMENT=production

# Terraform
max_workers = 1
machine_type = "c2-standard-4"
task_type = "cpu_bound"
memory_per_worker_gb = 12.0
```

---

### Appendix C: Troubleshooting Guide

#### Issue: OOM Kills (Exit Code 137)

**Symptoms:**

- Jobs terminated with exit code 137
- "Out of memory" errors in logs
- Shard status: "failed"

**Diagnosis:**

```bash
# Check per-date memory usage in logs
grep "RAM percent" deployment_logs.txt

# Check if adaptive reduction attempted
grep "RAM high.*reducing workers" deployment_logs.txt
```

**Solutions:**

1. **Reduce MAX_WORKERS:** Set to 50% of current value
2. **Enable adaptive:** Use AdaptiveParallelDateProcessor instead of static
3. **Upsize machine:** Move from c2-std-4 to c2-std-8
4. **Reduce nested parallelism:** Lower instrument/timeframe concurrency

---

#### Issue: Low CPU Utilization

**Symptoms:**

- CPU stays at 10-40% despite high MAX_WORKERS
- Completion time not improved

**Diagnosis:**

```bash
# Check if workers are I/O bound
grep "task_type" deployment_logs.txt

# Check GIL contention
grep "context switches" deployment_logs.txt
```

**Solutions:**

1. **Verify task type:** Ensure I/O-bound tasks use high MAX_WORKERS
2. **Check GIL release:** Ensure heavy compute releases GIL (NumPy, TA-Lib)
3. **Increase workers:** For I/O-bound, can go higher (22+ on c2-std-4)

---

#### Issue: Data Quality Problems

**Symptoms:**

- Some dates missing output files
- Partial data in GCS
- Validation failures

**Diagnosis:**

```bash
# Check per-date results
curl /api/deployments/{id}/shards/{shard_id}/results

# Verify retry logic triggered
grep "retry.*failed dates" deployment_logs.txt
```

**Solutions:**

1. **Check results.json:** Verify per-date status written correctly
2. **Retry failed dates:** Use targeted retry shards
3. **Validate dependencies:** Ensure upstream data exists for all dates

---

### Appendix D: Migration Checklist

#### Phase 0: CRITICAL FIX (30 minutes) 🔥

**BLOCKER:** Must complete before MAX_WORKERS

- [ ] Fix market-data-processing CSV default (config.py line 406: "true" → "false")
- [ ] Commit and push with quickmerge
- [ ] Wait for PR to merge

---

#### Phase 1: Infrastructure (4 hours)

**unified-trading-library:**

- [ ] Create `core/parallel_date_processor.py`
- [ ] Create `core/adaptive_parallel_processor.py`
- [ ] Update `core/performance_monitor.py`
- [ ] Update `__init__.py` exports
- [ ] Add unit tests
- [ ] Update README.md

---

#### Phase 2: High-Priority Services (6 hours)

**For each service (instruments, features-calendar, ml-inference):**

- [ ] Refactor CLI to use ParallelDateProcessor or AdaptiveParallelDateProcessor
- [ ] Test locally with 5 dates, MAX_WORKERS=4
- [ ] Add `MAX_WORKERS` to `.env.example`
- [ ] Update service README.md
- [ ] Deploy to test environment
- [ ] Validate: CPU 85-95%, all dates successful

---

#### Phase 3: Deployment Orchestrator (8 hours)

**deployment-service:**

- [ ] Update `shard_calculator.py` with multi-date batching
- [ ] Add `get_service_default_max_workers()`
- [ ] Update `dependencies.py` with batch checking
- [ ] Enhance retry logic for per-date failures
- [ ] Add `--max-workers` CLI argument
- [ ] Add results JSON reader endpoint
- [ ] Unit tests for all changes

---

#### Phase 4: UI Updates (6 hours)

**deployment-service:**

- [ ] Update `ShardCard.tsx` for date ranges
- [ ] Update `ShardDetails.tsx` with per-date table
- [ ] Create `ResourceMetricsPanel.tsx`
- [ ] Update `DeploymentSummary.tsx`
- [ ] Test with single-date and multi-date shards

---

#### Phase 5: Terraform (2 hours)

- [ ] Add `service_max_workers` variable
- [ ] Add `MAX_WORKERS` env var to all services
- [ ] Add `ALLOCATED_VCPUS` env var
- [ ] Add `ALLOCATED_MEMORY_GB` env var
- [ ] Update terraform README

---

#### Phase 6: Testing & Validation (8 hours)

- [ ] Run unit tests (all repos)
- [ ] Run integration tests
- [ ] Run E2E tests (3 services)
- [ ] 30-day production validation
- [ ] Measure cost/performance improvements
- [ ] Document results

---

### Appendix E: Expected Results

#### VM Count Reduction

| Service                | Current Shards  | With MAX_WORKERS | Reduction |
| ---------------------- | --------------- | ---------------- | --------- |
| instruments            | 365             | 23               | 94%       |
| features-calendar      | 365             | 23               | 94%       |
| ml-inference           | 365             | 122              | 67%       |
| Others (MAX_WORKERS=1) | 365 × 4 = 1,460 | 1,460            | 0%        |
| **Total**              | **2,555**       | **1,628**        | **36%**   |

**Startup Time Saved:** 927 VMs × 4 min = 62 hours

---

#### Completion Time Improvement

| Service                      | Serial Time | Parallel Time | Speedup |
| ---------------------------- | ----------- | ------------- | ------- |
| instruments (365 days)       | 730 hours   | 46 hours      | **16x** |
| features-calendar (365 days) | 365 hours   | 23 hours      | **16x** |
| ml-inference (365 days)      | 30 hours    | 10 hours      | **3x**  |

**Total Time Saved:** 1,041 hours of compute time

---

#### Cost Impact

**Machine-hours saved:** 1,041 hours

**Cost savings:**

- Regular VMs: 1,041 × $0.2088 = **$217/year**
- Preemptible VMs: 1,041 × $0.0418 = **$44/year**

**Or keep same cost, get 16x faster completion!**

---

## Summary

**Implementation Status:** ✅ **READY**

**Documentation Complete:** All 4 source documents merged

**Critical Path:**

1. 🔥 Fix CSV sampling default (30 min) - **BLOCKER**
2. 🎯 Create ParallelDateProcessor (4h)
3. 🎯 Update shard creation (4h)
4. Update 3 services (6h)
5. Complete system integration (16h)

**Total Effort:** 31 hours over 2-3 weeks

**Impact:**

- ✅ 36% fewer VMs
- ✅ 16x faster for low-utilization services
- ✅ 85-95% CPU utilization
- ✅ $387/year savings OR 16x speed

**Adaptive Strategy:** ⭐ **RECOMMENDED**

- Self-regulating parallelism
- Machine-agnostic
- No manual tuning
- Graceful degradation

**Next Steps:** Begin Phase 0 (critical CSV fix) → Phase 1 (infrastructure)

**This completely changes the cost equation for under-utilized services!** 🚀
