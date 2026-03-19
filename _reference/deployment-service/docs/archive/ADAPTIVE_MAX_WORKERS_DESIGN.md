# Adaptive MAX_WORKERS - Dynamic Resource Auto-Scaling

**Purpose:** Self-regulating parallelism that maximizes CPU while preventing OOM
**Date:** February 10, 2026
**Status:** Design complete, ready to implement

---

## Core Concept

**The Problem:**

- CPU over-subscription: ✅ Safe (processes queue naturally, no crash)
- RAM over-subscription: ❌ Fatal (OOM kill, job failure)
- Static MAX_WORKERS: Can't adapt to variable data sizes or machine conditions

**The Solution: Adaptive Parallelism**

- Start with configured MAX_WORKERS
- Monitor RAM usage in real-time
- **Reduce workers if RAM > 85%** (prevent OOM)
- **Can increase workers if RAM < 60%** (maximize throughput)
- Service auto-scales within available resources
- No manual Terraform tuning needed

---

## I/O-Bound vs CPU-Bound Strategy

### I/O-Bound Tasks (Network, Disk)

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

---

### CPU-Bound Tasks (Computation)

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

## Adaptive MAX_WORKERS Algorithm

### Design

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

## I/O-Bound Task Handling

### Aggressive CPU Over-Subscription

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

## CPU-Bound Task Handling

### Conservative CPU Matching

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

## RAM-Based Backpressure

### Real-Time Worker Throttling

**Prevent OOM before it happens:**

```python
class RAMAwarePool:
    """Pool that throttles worker spawning based on RAM availability"""

    def __init__(self, max_workers, memory_per_worker_gb, safety_factor=1.5):
        self.max_workers = max_workers
        self.memory_per_worker_gb = memory_per_worker_gb
        self.safety_factor = safety_factor
        self.active_workers = 0
        self.workers_lock = threading.Lock()

    def can_spawn_worker(self) -> bool:
        """Check if safe to spawn another worker based on RAM"""
        memory = psutil.virtual_memory()

        # Calculate if spawning another worker would be safe
        additional_memory_needed_gb = self.memory_per_worker_gb * self.safety_factor
        available_memory_gb = memory.available / (1024**3)

        if available_memory_gb < additional_memory_needed_gb:
            logger.debug(
                f"RAM backpressure: only {available_memory_gb:.1f} GB available, "
                f"need {additional_memory_needed_gb:.1f} GB, waiting..."
            )
            return False

        return True

    def process_with_backpressure(self, dates, process_func, config):
        """Process dates with RAM-aware backpressure"""
        results = []
        pending_dates = list(dates)
        futures = []

        with concurrent.futures.ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            while pending_dates or futures:
                # Submit new work if RAM allows
                while pending_dates and len(futures) < self.max_workers:
                    if self.can_spawn_worker():
                        date = pending_dates.pop(0)
                        future = executor.submit(process_func, date, config)
                        futures.append((date, future))

                        with self.workers_lock:
                            self.active_workers += 1

                        logger.debug(f"Submitted date {date} (active workers: {self.active_workers})")
                    else:
                        # RAM backpressure - wait before submitting more
                        time.sleep(5)
                        break

                # Check for completed work
                done_futures = []
                for date, future in futures:
                    if future.done():
                        try:
                            result = future.result()
                            results.append(result)
                            done_futures.append((date, future))

                            with self.workers_lock:
                                self.active_workers -= 1

                            logger.info(f"Date {date} completed (active: {self.active_workers})")
                        except Exception as e:
                            logger.error(f"Date {date} failed: {e}")
                            results.append({"date": date, "status": "failed", "error": str(e)})
                            done_futures.append((date, future))

                            with self.workers_lock:
                                self.active_workers -= 1

                # Remove completed futures
                for item in done_futures:
                    futures.remove(item)

                # Small delay before next check
                if futures:
                    time.sleep(1)

        return results
```

**Key Features:**

- ✅ Checks RAM before spawning each worker
- ✅ Waits if RAM unavailable (backpressure)
- ✅ Never exceeds RAM capacity
- ✅ Automatically queues work when constrained
- ✅ No manual tuning needed

---

## Dynamic Worker Adjustment

### Proactive RAM Management

**Monitor and adjust during execution:**

```python
class AdaptiveParallelDateProcessor:
    """
    Parallel date processor with dynamic worker adjustment.

    Monitors RAM usage and adjusts worker count in real-time:
    - RAM > 90%: Reduce workers (prevent OOM)
    - RAM > 85%: Reduce workers (warning zone)
    - RAM < 60%: Increase workers (underutilized)

    CPU over-subscription is fine (natural queuing).
    RAM over-subscription is fatal (OOM kill).
    """

    def __init__(
        self,
        process_date_func: Callable,
        initial_workers: int,
        task_type: str = "io_bound",  # or "cpu_bound"
        memory_per_worker_gb: float = None,  # Auto-calculated if None
    ):
        self.process_date_func = process_date_func
        self.initial_workers = initial_workers
        self.task_type = task_type
        self.memory_per_worker_gb = memory_per_worker_gb

        # Shared state
        self.current_workers = Value('i', initial_workers)
        self.active_workers = Value('i', 0)
        self.ram_samples = deque(maxlen=60)  # Last 60 samples (10 min at 10s interval)

        # Monitoring
        self.monitor_thread = threading.Thread(target=self._adaptive_monitor, daemon=True)
        self.should_stop = threading.Event()

        logger.info(
            f"Adaptive parallelism initialized: {initial_workers} workers ({task_type})",
            extra={
                "initial_workers": initial_workers,
                "task_type": task_type,
                "memory_per_worker_gb": memory_per_worker_gb
            }
        )

    def _adaptive_monitor(self):
        """Monitor resources and adjust workers dynamically"""
        consecutive_high_ram = 0
        consecutive_low_ram = 0

        while not self.should_stop.is_set():
            memory = psutil.virtual_memory()
            cpu_percent = psutil.cpu_percent(interval=1)

            # Track RAM samples
            self.ram_samples.append(memory.percent)

            # Calculate moving average (smooth out spikes)
            avg_ram = sum(self.ram_samples) / len(self.ram_samples)

            with self.workers_lock:
                current = self.current_workers.value
                active = self.active_workers.value

                # Critical RAM (reduce immediately)
                if avg_ram > 90:
                    consecutive_high_ram += 1
                    if consecutive_high_ram >= 2:  # 2 consecutive high readings
                        new_workers = max(1, current - 2)
                        self.current_workers.value = new_workers
                        logger.error(
                            f"🚨 RAM CRITICAL ({avg_ram:.1f}%), reducing workers: {current} → {new_workers}",
                            extra={
                                "ram_percent": avg_ram,
                                "ram_available_gb": memory.available / (1024**3),
                                "workers_before": current,
                                "workers_after": new_workers,
                                "active_workers": active
                            }
                        )
                        consecutive_high_ram = 0

                # High RAM (reduce gradually)
                elif avg_ram > 85:
                    consecutive_high_ram += 1
                    consecutive_low_ram = 0

                    if consecutive_high_ram >= 3:  # 3 consecutive high readings (30s)
                        new_workers = max(1, current - 1)
                        self.current_workers.value = new_workers
                        logger.warning(
                            f"⚠️ RAM high ({avg_ram:.1f}%), reducing workers: {current} → {new_workers}"
                        )
                        consecutive_high_ram = 0

                # Low RAM and I/O-bound (can increase)
                elif avg_ram < 60 and self.task_type == "io_bound" and current < self.initial_workers:
                    consecutive_low_ram += 1
                    consecutive_high_ram = 0

                    if consecutive_low_ram >= 5:  # 5 consecutive low readings (50s)
                        # Only increase if we reduced earlier
                        new_workers = min(self.initial_workers, current + 1)
                        self.current_workers.value = new_workers
                        logger.info(
                            f"✅ RAM low ({avg_ram:.1f}%), CPU={cpu_percent}%, increasing workers: {current} → {new_workers}"
                        )
                        consecutive_low_ram = 0

                else:
                    # Stable zone (60-85% RAM)
                    consecutive_high_ram = 0
                    consecutive_low_ram = 0

            time.sleep(10)

    def process_dates(self, dates, config):
        """Process dates with adaptive parallelism"""

        # Start adaptive monitoring
        self.monitor_thread.start()

        # Process dates in adaptive batches
        results = []
        remaining = list(dates)

        while remaining:
            # Get current worker count (may have changed)
            with self.workers_lock:
                workers = self.current_workers.value

            # Take next batch
            batch = remaining[:workers * 2]  # 2x batch size for smoother flow
            remaining = remaining[workers * 2:]

            logger.info(f"Processing {len(batch)} dates with {workers} workers (adaptive)")

            # Process batch
            with Pool(processes=workers) as pool:
                # Update active workers
                with self.workers_lock:
                    self.active_workers.value = workers

                batch_results = pool.starmap(
                    self.process_date_func,
                    [(d, config) for d in batch]
                )

                # Clear active workers
                with self.workers_lock:
                    self.active_workers.value = 0

            results.extend(batch_results)

            # Log progress and current state
            memory = psutil.virtual_memory()
            logger.info(
                f"Batch complete: {len(results)}/{len(dates)} total, RAM={memory.percent}%, workers={workers}"
            )

        # Stop monitoring
        self.should_stop.set()

        return results
```

---

## Task Type Detection

### Auto-Detect I/O vs CPU Bound

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

## Memory Estimation Per Worker

### Auto-Calculate from First Date

**Learn memory requirements from execution:**

```python
def estimate_memory_per_worker(self, sample_date, config):
    """
    Process one date and measure actual memory usage.

    Returns:
        Memory in GB used by one date worker
    """
    import gc

    # Force GC before measurement
    gc.collect()

    # Get baseline memory
    process = psutil.Process()
    baseline_memory = process.memory_info().rss / (1024**3)  # GB

    # Process sample date
    result = self.process_date_func(sample_date, config)

    # Force GC to clear temporary objects
    gc.collect()

    # Measure peak memory
    peak_memory = process.memory_info().rss / (1024**3)

    # Calculate per-worker memory
    memory_used = peak_memory - baseline_memory
    memory_with_overhead = memory_used * 1.5  # 50% overhead

    logger.info(
        f"Memory per worker estimated: {memory_with_overhead:.2f} GB (measured: {memory_used:.2f} GB)",
        extra={
            "baseline_memory_gb": baseline_memory,
            "peak_memory_gb": peak_memory,
            "worker_memory_gb": memory_used,
            "estimated_with_overhead_gb": memory_with_overhead
        }
    )

    return memory_with_overhead
```

**Use for adaptive calculation:**

```python
# Process first date and learn
memory_per_worker = estimate_memory_per_worker(dates[0], config)

# Calculate safe workers based on actual measurement
allocated_memory = int(os.getenv("ALLOCATED_MEMORY_GB", "16"))
safe_workers = int(allocated_memory / memory_per_worker * 0.8)  # 80% target

logger.info(f"Adaptive MAX_WORKERS: {safe_workers} (based on measured memory usage)")
```

---

## Complete Implementation

### unified-trading-library Update

**File:** `unified_trading_library/core/adaptive_parallel_processor.py` (NEW)

**Classes:**

1. `AdaptiveParallelDateProcessor` - Main adaptive processor
2. `RAMAwarePool` - Pool with backpressure
3. `TaskProfiler` - Auto-detect I/O vs CPU bound

**Functions:**

1. `calculate_io_bound_workers()` - Aggressive CPU over-subscription
2. `calculate_cpu_bound_workers()` - Conservative CPU matching
3. `detect_task_type()` - Auto-detect from first date
4. `estimate_memory_per_worker()` - Learn from execution

**Configuration:**

```python
# Auto-adaptive (recommended)
processor = AdaptiveParallelDateProcessor(
    process_date_func=process_date,
    initial_workers=int(os.getenv("MAX_WORKERS", "4")),
    auto_detect=True,  # Automatically profile and adapt
)

# Manual configuration
processor = AdaptiveParallelDateProcessor(
    process_date_func=process_date,
    initial_workers=16,
    task_type="io_bound",  # Force I/O-bound strategy
    memory_per_worker_gb=0.5,  # Explicit memory estimate
)
```

---

## Service Integration Pattern

### Updated CLI Pattern with Adaptive Processing

```python
# cli/main.py
from unified_trading_library.core.adaptive_parallel_processor import AdaptiveParallelDateProcessor

def process_single_date(date_obj, config):
    """Process one date (runs in separate process)"""
    return run_service_for_date(date_obj, config)

def main():
    # Parse args
    dates = generate_date_range(start_date, end_date)

    # Get initial MAX_WORKERS (can be overridden, but will adapt anyway)
    initial_workers = int(os.getenv("MAX_WORKERS", "4"))

    # Create adaptive processor
    processor = AdaptiveParallelDateProcessor(
        process_date_func=process_single_date,
        initial_workers=initial_workers,
        auto_detect=True,  # Automatically detect I/O vs CPU bound
    )

    # Process dates with adaptive parallelism
    # - Profiles first date
    # - Detects task type (I/O or CPU bound)
    # - Estimates memory per worker
    # - Calculates safe MAX_WORKERS
    # - Monitors RAM and adjusts dynamically during execution
    results = processor.process_dates(dates, config)

    # Check results
    success_count = sum(1 for r in results if r.get("status") == "success")

    logger.info(
        f"Adaptive processing complete: {success_count}/{len(dates)} successful",
        extra={
            "initial_workers": initial_workers,
            "final_workers": processor.current_workers.value,
            "task_type": processor.detected_task_type,
            "avg_ram_percent": sum(processor.ram_samples) / len(processor.ram_samples)
        }
    )
```

---

## Benefits of Adaptive Approach

### 1. No Manual Tuning Needed

**Old approach (static):**

```yaml
# Terraform must hardcode MAX_WORKERS per service
service_max_workers:
  instruments-service: 16 # What if data size varies?
  features-calendar: 16 # What if running on c2-standard-8?
```

**New approach (adaptive):**

```python
# Service automatically adapts to:
# - Actual data size (may vary by date)
# - Actual machine type (c2-std-4 vs c2-std-8)
# - Current system load
# - Memory availability

# Terraform just provides hint (can be overridden by service)
MAX_WORKERS=16  # Starting point, service adapts from there
```

---

### 2. Safe for Variable Data Sizes

**Problem:**

```
Date 1: BTC only (500 MB) → MAX_WORKERS=16 works fine
Date 2: BTC + 10 altcoins (5 GB) → MAX_WORKERS=16 causes OOM!
```

**Solution:**

```
Adaptive processor detects RAM spike on Date 2:
  - RAM hits 85%
  - Reduces workers: 16 → 12 → 8 → 4
  - Completes Date 2 with 4 workers (safe)
  - RAM drops back to 60%
  - Increases workers back to 16 for remaining dates
```

---

### 3. Machine-Type Agnostic

**Same service code works on any machine:**

| Machine        | RAM   | Calculated Workers (I/O-bound) |
| -------------- | ----- | ------------------------------ |
| c2-standard-4  | 16 GB | 22 workers (0.5 GB/worker)     |
| c2-standard-8  | 32 GB | 44 workers                     |
| c2-standard-16 | 64 GB | 89 workers                     |

**No Terraform changes needed when upsizing machines!**

---

### 4. Graceful Degradation

**Under memory pressure:**

- Reduces workers automatically (no OOM)
- Completes successfully (slower, but safe)
- Logs warnings (visible for debugging)

**Better than:**

- Static MAX_WORKERS causing OOM (job fails)
- Manual intervention to reduce workers
- Restart with different config

---

## Logging and Observability

### Adaptive Decisions Logged

```python
# Worker reduction
logger.warning(
    "RAM high, reducing workers",
    extra={
        "adaptive_action": "reduce_workers",
        "ram_percent": 87.5,
        "ram_available_gb": 2.1,
        "workers_before": 16,
        "workers_after": 14,
        "reason": "memory_pressure"
    }
)

# Worker increase
logger.info(
    "RAM low, increasing workers",
    extra={
        "adaptive_action": "increase_workers",
        "ram_percent": 55.0,
        "ram_available_gb": 7.2,
        "workers_before": 8,
        "workers_after": 10,
        "reason": "underutilized"
    }
)

# Task type detection
logger.info(
    "Task type detected: io_bound",
    extra={
        "task_profiling": {
            "task_type": "io_bound",
            "sample_cpu_percent": 12.5,
            "sample_memory_gb": 0.6,
            "sample_duration_sec": 120,
            "recommended_workers": 22
        }
    }
)
```

---

### UI Integration

**Resource metrics panel shows adaptive behavior:**

```typescript
<AdaptiveMetricsCard>
  <Typography>MAX_WORKERS Configuration</Typography>
  <Box>
    Initial: 16 workers
    Final: 12 workers (reduced due to RAM pressure)
    Adjustments: 3 reductions, 1 increase
  </Box>

  <Typography>Task Profile</Typography>
  <Box>
    Type: I/O-bound (12% avg CPU per worker)
    Memory per worker: 0.6 GB
    CPU over-subscription: 3.0x
  </Box>

  <Timeline>
    0:00 - Started with 16 workers, RAM 45%
    0:15 - RAM spike to 88%, reduced to 14 workers
    0:30 - RAM spike to 92%, reduced to 12 workers
    0:45 - RAM stable at 78%, kept 12 workers
    1:00 - Completed with 12 workers avg
  </Timeline>
</AdaptiveMetricsCard>
```

---

## Configuration Options

### Service .env.example

```bash
# Static MAX_WORKERS (starting point)
MAX_WORKERS=16

# Or let service auto-calculate
# MAX_WORKERS=auto  # Uses adaptive algorithm

# Task type hint (optional, auto-detected if not set)
# TASK_TYPE=io_bound  # or cpu_bound

# Memory per worker (optional, auto-measured if not set)
# MEMORY_PER_WORKER_GB=0.5

# Adaptive tuning parameters
ADAPTIVE_RAM_HIGH_THRESHOLD=85  # Reduce workers above this
ADAPTIVE_RAM_CRITICAL_THRESHOLD=90  # Reduce workers immediately
ADAPTIVE_RAM_LOW_THRESHOLD=60  # Can increase workers below this

# Safety factor for memory calculations
MEMORY_SAFETY_FACTOR=1.5  # 50% overhead for buffers
```

---

## Deployment Orchestrator Integration

### Smart Defaults by Service

```python
# deployment-service-v2/deployment_service/shard_calculator.py

SERVICE_CONFIGS = {
    "instruments-service": {
        "max_workers": 16,
        "task_type": "io_bound",  # Hint to service
        "memory_per_worker_gb": 0.5,
        "allow_adaptive": True  # Service can adjust
    },
    "features-calendar-service": {
        "max_workers": 16,
        "task_type": "io_bound",
        "memory_per_worker_gb": 0.5,
        "allow_adaptive": True
    },
    "features-delta-one-service": {
        "max_workers": 1,
        "task_type": "cpu_bound",
        "memory_per_worker_gb": 12.0,
        "allow_adaptive": False  # Already maxed, don't adapt
    },
}
```

**Pass to service via env vars:**

```python
env_vars = {
    "MAX_WORKERS": str(service_config["max_workers"]),
    "TASK_TYPE": service_config["task_type"],
    "MEMORY_PER_WORKER_GB": str(service_config["memory_per_worker_gb"]),
    "ALLOW_ADAPTIVE": str(service_config["allow_adaptive"]).lower()
}
```

---

## GCS Utility Functions (Complete Implementations)

### write_json_to_gcs()

**Add to:** `unified-trading-library/unified_trading_library/storage/gcs_utils.py` (or similar)

```python
import json
from google.cloud import storage
from typing import Any, Dict

def write_json_to_gcs(gcs_path: str, data: Dict[str, Any], project_id: str = None) -> None:
    """
    Write JSON data to GCS.

    Args:
        gcs_path: Full GCS path (gs://bucket/path/to/file.json)
        data: Dictionary to serialize as JSON
        project_id: Optional GCP project ID

    Raises:
        ValueError: If gcs_path format invalid
        google.cloud.exceptions.GoogleCloudError: If upload fails
    """
    if not gcs_path.startswith("gs://"):
        raise ValueError(f"Invalid GCS path (must start with gs://): {gcs_path}")

    # Parse path: gs://bucket/path/to/file.json
    path_without_prefix = gcs_path.replace("gs://", "")
    parts = path_without_prefix.split("/", 1)

    if len(parts) != 2:
        raise ValueError(f"Invalid GCS path format: {gcs_path}")

    bucket_name = parts[0]
    blob_path = parts[1]

    # Initialize client
    client = storage.Client(project=project_id) if project_id else storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)

    # Serialize and upload
    json_string = json.dumps(data, indent=2, default=str)  # default=str handles datetime
    blob.upload_from_string(
        json_string,
        content_type="application/json"
    )

    logger.debug(f"✅ Wrote JSON to {gcs_path} ({len(json_string)} bytes)")


def read_json_from_gcs(gcs_path: str, project_id: str = None) -> Dict[str, Any] | None:
    """
    Read JSON data from GCS.

    Args:
        gcs_path: Full GCS path (gs://bucket/path/to/file.json)
        project_id: Optional GCP project ID

    Returns:
        Dictionary if file exists, None if not found

    Raises:
        json.JSONDecodeError: If file content is not valid JSON
        google.cloud.exceptions.GoogleCloudError: If read fails
    """
    if not gcs_path.startswith("gs://"):
        raise ValueError(f"Invalid GCS path (must start with gs://): {gcs_path}")

    # Parse path
    path_without_prefix = gcs_path.replace("gs://", "")
    parts = path_without_prefix.split("/", 1)

    if len(parts) != 2:
        raise ValueError(f"Invalid GCS path format: {gcs_path}")

    bucket_name = parts[0]
    blob_path = parts[1]

    # Initialize client
    client = storage.Client(project=project_id) if project_id else storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)

    # Check existence
    if not blob.exists():
        logger.debug(f"File not found: {gcs_path}")
        return None

    # Download and parse
    content = blob.download_as_text()
    data = json.loads(content)

    logger.debug(f"✅ Read JSON from {gcs_path} ({len(content)} bytes)")

    return data


def gcs_file_exists(gcs_path: str, project_id: str = None) -> bool:
    """
    Check if a file exists in GCS.

    Args:
        gcs_path: Full GCS path (gs://bucket/path/to/file)
        project_id: Optional GCP project ID

    Returns:
        True if file exists, False otherwise
    """
    if not gcs_path.startswith("gs://"):
        return False

    path_without_prefix = gcs_path.replace("gs://", "")
    parts = path_without_prefix.split("/", 1)

    if len(parts) != 2:
        return False

    bucket_name = parts[0]
    blob_path = parts[1]

    client = storage.Client(project=project_id) if project_id else storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)

    return blob.exists()
```

**Usage in Services:**

```python
# In ParallelDateProcessor or service main()
from unified_trading_library.storage.gcs_utils import write_json_to_gcs

# Write results
results_path = f"gs://deployment-orchestration-{project}/results/{deployment_id}/{shard_id}/results.json"
write_json_to_gcs(results_path, results_summary)
```

**Usage in Orchestrator:**

```python
# In deployment API
from unified_trading_library.storage.gcs_utils import read_json_from_gcs, gcs_file_exists

# Read results
results_path = f"gs://deployment-orchestration-{project}/results/{deployment_id}/{shard_id}/results.json"
if gcs_file_exists(results_path):
    results = read_json_from_gcs(results_path)
```

---

## Summary

**Your insight is perfect!** 🎯

**Key Principles:**

1. ✅ **CPU over-subscription is safe** - Processes queue naturally, no crash
2. ✅ **RAM over-subscription is fatal** - Must prevent with adaptive logic
3. ✅ **Service auto-scales** - No manual Terraform tuning needed
4. ✅ **Machine-agnostic** - Works on any C2 machine type automatically
5. ✅ **I/O-bound:** Aggressive CPU over-subscription (22+ workers on 4 vCPUs)
6. ✅ **CPU-bound:** Conservative matching (4-6 workers on 4 vCPUs)

**Implementation:**

- Add `AdaptiveParallelDateProcessor` to unified-trading-library
- Services use adaptive processor (auto-detects task type)
- Real-time RAM monitoring adjusts workers
- Backpressure prevents OOM
- No crashes, graceful degradation

**GCS Utilities:**

- ✅ `write_json_to_gcs()` - Fully implemented above
- ✅ `read_json_from_gcs()` - Fully implemented above
- ✅ `gcs_file_exists()` - Fully implemented above

**Documentation:**

- ✅ ADAPTIVE_MAX_WORKERS_DESIGN.md created (complete design)
- ✅ All other docs updated to reference adaptive approach
- ✅ MASTER_IMPLEMENTATION_INDEX.md includes adaptive strategy
- ✅ GCS utilities now fully specified

**This makes the system truly self-optimizing!** 🚀
