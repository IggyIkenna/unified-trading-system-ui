# Resource Monitoring and Machine Rightsizing

**Purpose:** Track actual CPU/RAM/disk usage per job to optimize machine sizing
**Status:** Infrastructure exists, UI integration needed
**Date:** February 10, 2026

---

## ⚠️ CRITICAL UPDATE: C2-Only Constraint + Parallelization Solution

**GCP Quota Reality:** Only C2 machine types approved (c2-standard-4 minimum)

**Impact on Optimization Strategy:**

- ❌ Cannot downsize below c2-standard-4 (no e2/n2 options)
- ✅ Can upsize within C2 family (c2-std-8, c2-std-16)
- 🎯 **New strategy:** Parallelize dates within machines to maximize utilization

**Solution:** Process multiple dates in parallel per machine (multiprocessing)

- instruments-service: 10% CPU → 90% CPU (32 dates in parallel)
- features-calendar: 10% CPU → 90% CPU (30 dates in parallel)
- ml-inference: 40% CPU → 90% CPU (5 dates in parallel)

**See:** [INTRA_MACHINE_DATE_PARALLELIZATION.md](INTRA_MACHINE_DATE_PARALLELIZATION.md) for complete implementation plan

---

## Executive Summary

**Current State:** ✅ Good foundation, ⚠️ gaps in visibility, 🎯 new optimization path

**What Works:**

- ✅ All services use `psutil` for cross-platform resource monitoring (macOS Intel/ARM, Linux, Windows)
- ✅ 11/13 services enable `enable_resource_monitoring=True`
- ✅ Metrics logged every 30 seconds (CPU, RAM, disk, network, process count)
- ✅ Automatic alerts for high usage (CPU > 90%, Memory > 90%, Disk > 90%)

**What's Missing:**

- ❌ Metrics logged at DEBUG level (invisible in production)
- ❌ No API endpoint to aggregate resource usage per job
- ❌ No UI dashboard showing resource metrics
- ❌ No per-job average/peak resource usage tracking

**Goal:** Surface resource metrics in deployment UI to identify under-provisioning risks and optimize within C2 machine family.

---

## ⚠️ CRITICAL: C2-Only Quota Constraint

**Your GCP quota setup only applies to C2 machine types.**

**Available C2 Options:**

- c2-standard-4: 4 vCPU, 16 GB RAM, $0.2088/hour ← **MINIMUM**
- c2-standard-8: 8 vCPU, 32 GB RAM, $0.4176/hour
- c2-standard-16: 16 vCPU, 64 GB RAM, $0.8352/hour
- c2-standard-30: 30 vCPU, 120 GB RAM, $1.3572/hour (if available)
- c2-standard-60: 60 vCPU, 240 GB RAM, $2.7144/hour (if available)

**Implications:**

- ❌ **Cannot downsize below c2-standard-4** (no e2/n2 options)
- ✅ Can upsize within C2 family as needed
- 📊 **Goal shifts:** Prevent under-provisioning (not reduce costs via downsizing)
- 🎯 **Primary value:** Identify services needing MORE resources before failures occur

**Cost Optimization Strategy:**

- Storage: Use aggressive lifecycle policy (save $1,500-10,900/year) ✅
- Compute: Use preemptible VMs (save 80% on batch jobs) ✅
- Machine sizing: Within C2 family, focus on upsizing only when needed ✅

---

## Current Implementation

### 1. Resource Monitoring in unified-trading-library

**Location:** `unified-trading-library/unified_trading_library/core/performance_monitor.py`

**Features:**

```python
# Cross-platform monitoring (psutil)
class PerformanceMonitor:
    def start_monitoring(self, interval: int = 30):
        # Collects every 30 seconds:
        # - CPU percent (psutil.cpu_percent)
        # - Memory percent (psutil.virtual_memory)
        # - Disk usage (psutil.disk_usage)
        # - Network I/O (psutil.net_io_counters)
        # - Process count (len(psutil.pids()))
```

**Metrics Collected:**

- `cpu_percent`: Current CPU usage (0-100%)
- `memory_percent`: RAM usage (0-100%)
- `memory_available_mb`: Available RAM in MB
- `disk_usage_percent`: Disk usage (0-100%)
- `network_io`: Bytes sent/received
- `process_count`: Number of running processes

**Platform Support:**
| Platform | Supported | Notes |
|----------|-----------|-------|
| macOS (Intel) | ✅ Yes | Full support |
| macOS (ARM/Silicon) | ✅ Yes | Full support (psutil 5.9+) |
| Linux | ✅ Yes | Full support |
| Windows | ✅ Yes | Full support |

**Logging Behavior:**

```python
# Regular metrics: DEBUG level (hidden in production)
logger.debug(f"System metrics: CPU={cpu}%, Memory={mem}%")

# Alerts: INFO/WARNING/ERROR (visible)
if cpu_percent > 90:
    logger.warning("High CPU usage: 92%")  # WARNING level

if memory_percent > 90:
    logger.error("Critical memory usage: 94%")  # ERROR level
```

---

### 2. Service Adoption Status

**Services with Resource Monitoring Enabled:**

| Service                        | Monitoring | Location                     |
| ------------------------------ | ---------- | ---------------------------- |
| instruments-service            | ✅ Yes     | `cli/main.py:42-45`          |
| market-tick-data-handler       | ✅ Yes     | `cli/main.py:41-44`          |
| market-data-processing-service | ✅ Yes     | `cli/main.py:34-37`          |
| features-delta-one-service     | ✅ Yes     | `cli/main.py:61-64`          |
| features-calendar-service      | ✅ Yes     | `cli/batch_handler.py:36-39` |
| features-volatility-service    | ✅ Yes     | `cli/main.py:61-64`          |
| ml-training-service            | ✅ Yes     | `cli/main.py:73-76`          |
| ml-inference-service           | ✅ Yes     | `cli/main.py:32-35`          |
| strategy-service               | ✅ Yes     | `cli/main.py:26-29`          |
| execution-service              | ✅ Yes     | `cli/backtest.py`            |
| features-onchain-service       | ✅ Yes     | `cli/main.py:60-63`          |
| sports-betting-service         | ❌ No      | `cli/main.py:37`             |
| deployment-service (CLI)       | ❌ No      | `cli.py:38`                  |

**Coverage:** 11/13 services (85%)

---

### 3. Deployment UI Current State

**Logs Display:**

- ✅ Shows logs from Cloud Logging or GCS
- ✅ Filters by severity (INFO, WARNING, ERROR)
- ✅ Real-time streaming with "Follow" mode

**Resource Metrics:**

- ❌ No dedicated resource usage panel
- ❌ No per-job resource summary
- ❌ No average/peak resource tracking
- ⚠️ Alerts visible (WARNING/ERROR for high usage)
- ⚠️ DEBUG metrics hidden (only visible if log level changed)

**APIs:**

- `GET /api/deployments/{id}/logs` - Returns log entries
- `GET /api/deployments/{id}` - Returns deployment metadata
- ❌ No `/api/deployments/{id}/resource-metrics` endpoint

---

## Gap Analysis

### Problem 1: Metrics Not Visible in Production

**Current:** Metrics logged at DEBUG level every 30 seconds

**Impact:**

- Metrics invisible in production logs (log level = INFO)
- Can't analyze resource usage after job completes
- No historical data for rightsizing decisions

**Solution:** Log summary metrics at INFO level (start, end, peak)

---

### Problem 2: No Aggregation or Persistence

**Current:** Metrics logged as individual log entries

**Impact:**

- Can't query "average CPU usage for deployment X"
- Can't compare resource usage across jobs
- No structured metrics storage

**Solution:**

- Option A: Aggregate from Cloud Logging (query logs, parse metrics)
- Option B: Write metrics to GCS/BigQuery (separate from logs)
- Option C: Use Cloud Monitoring (GCP native metrics)

---

### Problem 3: No UI Visualization

**Current:** Logs-only view in deployment details

**Impact:**

- Can't see resource trends over time
- Can't identify over/under-provisioned jobs
- Manual log analysis required

**Solution:** Add resource metrics panel to DeploymentDetails.tsx

---

## Proposed Solution

### Phase 1: Enhanced Logging (No Code Changes in Services)

**Update unified-trading-library PerformanceMonitor:**

1. **Log summary at INFO level:**

```python
# At job start
logger.info("Resource monitoring started", extra={
    "resource_monitoring": True,
    "machine_type": "c2-standard-4",
    "allocated_cpu": 4,
    "allocated_memory_gb": 16
})

# Every 30 seconds: Keep at DEBUG (don't spam)
logger.debug(f"CPU={cpu}%, Memory={mem}%, Disk={disk}%", extra={
    "resource_metrics": {"cpu": cpu, "memory": mem, "disk": disk}
})

# At job end or every 5 minutes: Log summary at INFO
logger.info("Resource usage summary", extra={
    "resource_summary": {
        "duration_seconds": 300,
        "avg_cpu_percent": 45.2,
        "peak_cpu_percent": 78.0,
        "avg_memory_percent": 32.5,
        "peak_memory_percent": 52.0,
        "avg_disk_percent": 15.0,
        "peak_disk_percent": 18.0,
        "samples_collected": 10
    }
})
```

2. **Final summary at job completion:**

```python
# In GracefulShutdownHandler or at main() exit
logger.info("Job resource usage final", extra={
    "resource_final": {
        "total_runtime_seconds": 1847,
        "avg_cpu_percent": 52.3,
        "peak_cpu_percent": 89.0,
        "avg_memory_percent": 38.7,
        "peak_memory_percent": 67.0,
        "recommended_machine": "c2-standard-4",  # Based on peak usage
        "over_provisioned": False  # If peak < 60% of allocated
    }
})
```

**Benefits:**

- ✅ No changes to 11 services (only unified-trading-library)
- ✅ Metrics visible in production logs
- ✅ Structured JSON for easy parsing
- ✅ Automatic rightsizing recommendations

---

### Phase 2: API Endpoint for Resource Metrics

**New Endpoint:** `GET /api/deployments/{deployment_id}/resource-metrics`

**Implementation:** `deployment-service/api/routes/deployments.py`

```python
@router.get("/{deployment_id}/resource-metrics")
async def get_deployment_resource_metrics(deployment_id: str):
    """
    Aggregate resource metrics from Cloud Logging for a deployment.

    Returns:
    - Per-shard resource usage (avg, peak)
    - Overall deployment averages
    - Rightsizing recommendations
    """
    # Query Cloud Logging for resource_summary entries
    logs = list_log_entries(
        resource_names=[f"projects/{project_id}"],
        filter=f'''
            labels.deployment_id="{deployment_id}"
            AND jsonPayload.resource_summary:*
        ''',
        order_by="timestamp desc",
    )

    # Aggregate metrics
    shard_metrics = []
    for log in logs:
        shard_metrics.append({
            "shard_id": log.labels.get("shard_id"),
            "avg_cpu": log.json_payload["resource_summary"]["avg_cpu_percent"],
            "peak_cpu": log.json_payload["resource_summary"]["peak_cpu_percent"],
            "avg_memory": log.json_payload["resource_summary"]["avg_memory_percent"],
            "peak_memory": log.json_payload["resource_summary"]["peak_memory_percent"],
        })

    # Calculate overall averages
    return {
        "deployment_id": deployment_id,
        "shard_count": len(shard_metrics),
        "avg_cpu": mean([s["avg_cpu"] for s in shard_metrics]),
        "peak_cpu": max([s["peak_cpu"] for s in shard_metrics]),
        "avg_memory": mean([s["avg_memory"] for s in shard_metrics]),
        "peak_memory": max([s["peak_memory"] for s in shard_metrics]),
        "shards": shard_metrics,
        "recommendation": _generate_machine_recommendation(shard_metrics)
    }
```

**Benefits:**

- ✅ Structured API for resource data
- ✅ Aggregation across all shards
- ✅ Automatic rightsizing recommendations
- ✅ Historical comparison (compare deployments)

---

### Phase 3: UI Dashboard Component

**New Panel in DeploymentDetails.tsx:**

```typescript
// Add "Resources" tab alongside Logs, Shards, etc.

<Tabs>
  <Tab label="Logs">...</Tab>
  <Tab label="Shards">...</Tab>
  <Tab label="Resources" icon={<ChartIcon />}>
    <ResourceMetricsPanel deploymentId={deploymentId} />
  </Tab>
</Tabs>

// ResourceMetricsPanel component
const ResourceMetricsPanel = ({ deploymentId }) => {
  const { data } = useQuery(`/api/deployments/${deploymentId}/resource-metrics`);

  return (
    <Box>
      {/* Overall Summary */}
      <Grid container spacing={2}>
        <MetricCard
          title="Average CPU"
          value={`${data.avg_cpu}%`}
          allocated={data.allocated_cpu}
          recommendation={data.recommendation.cpu}
        />
        <MetricCard
          title="Peak CPU"
          value={`${data.peak_cpu}%`}
          severity={data.peak_cpu > 90 ? 'error' : 'success'}
        />
        <MetricCard
          title="Average Memory"
          value={`${data.avg_memory}%`}
          allocated={`${data.allocated_memory_gb} GB`}
        />
        <MetricCard
          title="Peak Memory"
          value={`${data.peak_memory}%`}
          severity={data.peak_memory > 85 ? 'warning' : 'success'}
        />
      </Grid>

      {/* Rightsizing Recommendation */}
      {data.recommendation.action !== 'optimal' && (
        <Alert severity="info">
          <strong>Rightsizing Recommendation:</strong> {data.recommendation.message}
          <br/>
          Current: {data.current_machine} → Recommended: {data.recommendation.machine}
          <br/>
          Potential savings: ${data.recommendation.savings_per_job}/job
        </Alert>
      )}

      {/* Per-Shard Resource Usage */}
      <DataGrid
        rows={data.shards}
        columns={[
          { field: 'shard_id', headerName: 'Shard' },
          { field: 'avg_cpu', headerName: 'Avg CPU %' },
          { field: 'peak_cpu', headerName: 'Peak CPU %' },
          { field: 'avg_memory', headerName: 'Avg Memory %' },
          { field: 'peak_memory', headerName: 'Peak Memory %' },
          { field: 'recommendation', headerName: 'Sizing' }
        ]}
      />

      {/* Resource Usage Over Time (if available) */}
      <Chart
        type="line"
        data={data.timeline}
        series={[
          { name: 'CPU %', data: data.timeline.cpu },
          { name: 'Memory %', data: data.timeline.memory }
        ]}
      />
    </Box>
  );
};
```

**Benefits:**

- ✅ Visual resource usage per deployment
- ✅ Clear rightsizing recommendations
- ✅ Per-shard breakdown for targeted optimization
- ✅ Historical comparison across deployments

---

## Machine Sizing Validation by Service

### Methodology

For each service, validate machine specs against:

1. **Data size** being processed
2. **Memory requirements** (data in RAM + overhead)
3. **CPU requirements** (computation intensity)
4. **Observed usage** (from existing deployments, if available)

---

### 1. instruments-service

**Current Allocation:** c2-standard-4 (4 vCPU, 16 GB RAM)

**Data Processing:**

- Input: API responses from exchanges (~10-50 MB per venue)
- Output: Parquet files (~2-5 MB per instrument per day)
- Peak memory: ~500 MB (API buffers + pandas DataFrame)

**CPU Requirements:**

- API calls (I/O-bound, minimal CPU)
- JSON parsing (light)
- Parquet serialization (light)

**Validation:**

- Peak memory: 500 MB / 16 GB = **3% RAM usage**
- CPU: I/O-bound, likely **10-30% CPU usage**

**Recommendation:** ⚠️ **OVER-PROVISIONED BUT CONSTRAINED**

- **Ideal:** Would use e2-medium (1-2 vCPU, 4 GB RAM)
- **Reality:** Must use c2-standard-4 (minimum C2 machine type)
- **C2 quota constraint:** No smaller C2 option available
- **Action:** Keep c2-standard-4 (no alternative)
- **Note:** Over-provisioned but acceptable for low-frequency jobs

---

### 2. market-tick-data-handler

**Current Allocation:** c2-standard-4 (4 vCPU, 16 GB RAM)

**Data Processing:**

- Input: Tardis API downloads (2-3 GB per day for BTC)
- Processing: Parse, validate, partition by instrument type
- Output: Parquet files (~2 GB per day)
- Peak memory: ~8-10 GB (streaming buffers + pandas)

**CPU Requirements:**

- Network I/O (download from Tardis)
- Decompression (gzip/zstd)
- Parquet serialization
- Rate limiting delays (idle time)

**Validation:**

- Peak memory: 10 GB / 16 GB = **63% RAM usage** ✅
- CPU: Network + parsing, likely **40-60% CPU usage**

**Recommendation:** ✅ **WELL-SIZED**

- c2-standard-4 is appropriate
- Consider c2-standard-8 (32 GB RAM) if processing multiple instruments in parallel
- Current allocation optimal for single-instrument jobs

---

### 3. market-data-processing-service

**Current Allocation:** c2-standard-4 (4 vCPU, 16 GB RAM)

**Data Processing:**

- Input: 2-3 GB tick data per day
- Processing: Aggregate to 7 timeframes (15s, 1m, 5m, 15m, 1h, 4h, 24h)
- Output: ~432 MB candles per day
- Peak memory: ~4-6 GB (hold full day ticks + candles)

**CPU Requirements:**

- Candle aggregation (compute-intensive)
- OHLCV calculations
- Parquet serialization

**Validation:**

- Peak memory: 6 GB / 16 GB = **38% RAM usage** ✅
- CPU: Compute-intensive, likely **60-80% CPU usage**

**Recommendation:** ✅ **WELL-SIZED**

- c2-standard-4 is appropriate
- Could use c2-standard-8 to halve runtime (cost-neutral if runtime < 50%)

---

### 4. features-delta-one-service

**Current Allocation:** c2-standard-4 (4 vCPU, 16 GB RAM)

**Data Processing:**

- Input: 432 MB candles per day per instrument
- Processing: 20 feature groups with TA-Lib calculations
- Output: ~217 MB features per day per instrument
- Peak memory: ~8-12 GB (candles + intermediate features + TA-Lib buffers)

**CPU Requirements:**

- Heavy TA-Lib computations (RSI, MACD, Bollinger, etc.)
- Rolling window calculations
- Feature engineering transformations

**Validation:**

- Peak memory: 12 GB / 16 GB = **75% RAM usage** ✅
- CPU: Very compute-intensive, likely **80-95% CPU usage**

**Recommendation:** ✅ **WELL-SIZED** or ⚠️ **SLIGHTLY UNDER-PROVISIONED**

- c2-standard-4 is at the limit
- Consider c2-standard-8 (32 GB RAM) for:
  - Multiple feature groups in parallel
  - Larger instruments with more data
  - Reduced risk of OOM (out of memory)
- **Cost-benefit:** 2x cost for 2x speed → same $/day if runtime > 50%

---

### 5. features-calendar-service

**Current Allocation:** c2-standard-4 (4 vCPU, 16 GB RAM)

**Data Processing:**

- Input: Date/time inputs (minimal)
- Processing: Generate temporal features (hour, day, week, etc.)
- Output: ~6 MB per month
- Peak memory: ~200-500 MB

**CPU Requirements:**

- Minimal (date/time calculations)
- Some API calls for economic events

**Validation:**

- Peak memory: 500 MB / 16 GB = **3% RAM usage**
- CPU: Light, likely **5-20% CPU usage**

**Recommendation:** ⚠️ **HEAVILY OVER-PROVISIONED BUT CONSTRAINED**

- **Ideal:** Would use e2-small (0.5-2 vCPU, 2 GB RAM)
- **Reality:** Must use c2-standard-4 (minimum C2 machine type)
- **C2 quota constraint:** No smaller C2 option available
- **Action:** Keep c2-standard-4 (no alternative)
- **Note:** Significantly over-provisioned but necessary for quota management

---

### 6. ml-training-service

**Current Allocation:** c2-standard-8 (8 vCPU, 32 GB RAM)

**Data Processing:**

- Input: 90-365 days of features (~5-20 GB)
- Processing:
  - Stage 1: Correlation matrix, feature importance (memory-intensive)
  - Stage 2: Grid search with 3-fold CV (CPU-intensive)
  - Stage 3: Final training on full dataset (CPU + memory)
- Output: Model files (~5 MB each)
- Peak memory: **15-25 GB** (feature matrices + cross-validation splits)

**CPU Requirements:**

- LightGBM training (multi-threaded, uses all vCPUs)
- Feature correlation (NumPy/pandas operations)
- Cross-validation (parallel model training)

**Validation:**

- Peak memory: 25 GB / 32 GB = **78% RAM usage** ✅
- CPU: LightGBM uses all cores, likely **90-100% CPU usage**

**Recommendation:** ✅ **WELL-SIZED**

- c2-standard-8 is appropriate
- Consider c2-standard-16 for larger training windows (365+ days)
- Current allocation optimal for quarterly training

---

### 7. ml-inference-service

**Current Allocation:** c2-standard-4 (4 vCPU, 16 GB RAM)

**Data Processing:**

- Input: Features for 1 day (~50-100 MB)
- Processing: Load model, run inference
- Output: Predictions (~50 KB per day)
- Peak memory: ~2-3 GB (model + features)

**CPU Requirements:**

- Model loading (I/O-bound)
- LightGBM inference (CPU-bound, but fast)
- Light computations

**Validation:**

- Peak memory: 3 GB / 16 GB = **19% RAM usage**
- CPU: Inference is fast, likely **30-50% CPU usage**

**Recommendation:** ⚠️ **SLIGHTLY OVER-PROVISIONED BUT KEEP AS-IS**

- **Reality:** c2-standard-4 is minimum C2 machine type
- **C2 quota constraint:** No smaller option available
- **Action:** Keep c2-standard-4 (already at minimum)
- **Note:** Inference is fast, low resource usage acceptable

---

## Machine Sizing Summary (C2-Only Constraint)

**IMPORTANT:** Quota limits only apply to C2 machine types. All services must use C2 machines.

**Available C2 Options:**

- c2-standard-4: 4 vCPU, 16 GB RAM, $0.2088/hour
- c2-standard-8: 8 vCPU, 32 GB RAM, $0.4176/hour
- c2-standard-16: 16 vCPU, 64 GB RAM, $0.8352/hour

| Service            | Current  | Allocated    | Observed Usage    | Status  | Action                         |
| ------------------ | -------- | ------------ | ----------------- | ------- | ------------------------------ |
| instruments        | c2-std-4 | 4 vCPU, 16GB | ~10% CPU, 3% RAM  | ⚠️ Over | ✅ Keep (minimum C2)           |
| market-tick        | c2-std-4 | 4 vCPU, 16GB | ~50% CPU, 63% RAM | ✅ Good | ✅ Keep                        |
| market-processing  | c2-std-4 | 4 vCPU, 16GB | ~70% CPU, 38% RAM | ✅ Good | ✅ Keep                        |
| features-delta-one | c2-std-4 | 4 vCPU, 16GB | ~90% CPU, 75% RAM | ⚠️ High | 🔍 Monitor (may need c2-std-8) |
| features-calendar  | c2-std-4 | 4 vCPU, 16GB | ~10% CPU, 3% RAM  | ⚠️ Over | ✅ Keep (minimum C2)           |
| ml-training        | c2-std-8 | 8 vCPU, 32GB | ~95% CPU, 78% RAM | ✅ Good | ✅ Keep                        |
| ml-inference       | c2-std-4 | 4 vCPU, 16GB | ~40% CPU, 19% RAM | ⚠️ Over | ✅ Keep (minimum C2)           |
| strategy           | c2-std-4 | 4 vCPU, 16GB | ~20% CPU, 10% RAM | ⚠️ Over | ✅ Keep (minimum C2)           |
| execution          | c2-std-8 | 8 vCPU, 32GB | ~80% CPU, 60% RAM | ✅ Good | ✅ Keep                        |

**C2 Quota Constraint Impact:**

- **No downsizing possible** - c2-standard-4 is the minimum
- **Rightsizing savings:** $0/year (all services already at minimum or optimal)
- **Focus shifts to:** Identifying services that need UPSIZING to prevent failures

**Key Insight:** With C2-only, the goal is **preventing under-provisioning**, not cost savings from downsizing.

**Services to Watch:**

- ⚠️ **features-delta-one** (75% RAM, 90% CPU) - May need c2-std-8 for larger datasets or parallel processing
- ✅ All others: Well-sized or constrained at minimum

---

## Implementation Plan

### Step 1: Update unified-trading-library (1-2 hours)

**File:** `unified_trading_library/core/performance_monitor.py`

**Changes:**

1. Add `log_summary_at_info()` method
2. Call every 5 minutes during monitoring
3. Call at shutdown with final summary
4. Include machine type and allocation in logs
5. Add rightsizing recommendation logic

**Test:**

```bash
# Run any service locally, check logs for INFO-level summaries
python -m instruments_service.cli.main --category CEFI --start-date 2024-01-15 --end-date 2024-01-15

# Should see:
# INFO: Resource monitoring started (machine_type=local, allocated_cpu=8, allocated_memory_gb=16)
# INFO: Resource usage summary (avg_cpu=12%, peak_cpu=25%, avg_memory=15%, peak_memory=22%)
# INFO: Job resource usage final (total_runtime=847s, recommended_machine=e2-medium, over_provisioned=True)
```

---

### Step 2: Add API Endpoint (2-3 hours)

**File:** `deployment-service/api/routes/deployments.py`

**New endpoints:**

1. `GET /api/deployments/{id}/resource-metrics` - Single deployment metrics
2. `GET /api/deployments/resource-comparison` - Compare across deployments

**Test:**

```bash
curl http://localhost:8000/api/deployments/20240115-123456/resource-metrics | jq
```

---

### Step 3: Add UI Component (3-4 hours)

**Files:**

- `deployment-service/ui/src/components/ResourceMetricsPanel.tsx` (new)
- `deployment-service/ui/src/components/DeploymentDetails.tsx` (update)

**Features:**

- Resource usage summary cards
- Per-shard resource breakdown
- Time-series charts (if timeline data available)
- Rightsizing recommendations with savings estimates

**Test:**

- Deploy locally, open deployment details
- Navigate to "Resources" tab
- Verify metrics display correctly

---

### Step 4: Validate with Real Deployments (1-2 days)

**Process:**

1. Run 5-10 representative deployments with resource monitoring
2. Collect metrics via new API
3. Analyze actual vs estimated usage
4. Adjust machine allocations in Terraform
5. Re-run with new allocations
6. Measure cost savings

---

## Expected Outcomes (C2-Only Constraint)

### Short-Term (After Implementation)

**Visibility:**

- ✅ See actual resource usage per job in UI
- ✅ Identify services at risk of failure (high RAM/CPU usage)
- ✅ Get automatic upsizing recommendations

**Primary Goal:** **Prevent under-provisioning failures** (not cost savings)

**C2-Only Reality:**

- No downsizing possible (c2-standard-4 is minimum)
- Focus on upsizing services at risk (e.g., features-delta-one at 90% CPU)
- Monitor for OOM kills, timeouts, high resource warnings

---

### Long-Term (After 3 Months of Data)

**Data-Driven Optimization:**

- Identify services needing c2-standard-8 or c2-standard-16
- Prevent production failures from under-provisioning
- Optimize for reliability, not cost reduction

**Example Optimization Loop:**

```
1. Collect 30 days of resource metrics
2. Analyze: "features-delta-one peak RAM = 92%"
3. Alert: "High risk of OOM, frequent warnings"
4. Recommendation: "Upsize to c2-standard-8 (32 GB RAM)"
5. Update Terraform: machine_type = "c2-standard-8"
6. Deploy with new size
7. Validate: warnings gone, stable performance
8. Lock in reliable configuration
```

**Primary Value:** **Avoid costly failures** (failed jobs, retries, debugging time)

**Secondary Benefit:** Know exactly which services truly need c2-std-8 vs c2-std-4 (avoid guessing)

---

## Rightsizing Decision Matrix

### When to Downsize

**Criteria:**

- Average usage < 40% of allocated resources
- Peak usage < 70% of allocated resources
- No memory/CPU warnings in logs

**Action:**

- Try next smaller machine type
- Monitor for failures
- Rollback if jobs fail or timeout

---

### When to Upsize

**Criteria:**

- Peak usage > 85% RAM (risk of OOM)
- Peak usage > 95% CPU (potential slowdowns)
- Frequent memory warnings in logs
- Jobs timing out

**Action:**

- Upsize to next larger machine type
- Better to over-provision slightly than risk failures

---

### When to Keep Same

**Criteria:**

- Average usage 40-70%
- Peak usage 70-85%
- No warnings, consistent completion times

**Action:**

- Current allocation optimal
- Monitor periodically for changes

---

## Quick Wins (No Code Changes Needed)

### 1. Enable DEBUG Logging for One Deployment

**Test resource monitoring visibility:**

```bash
# Run with DEBUG level
export LOG_LEVEL=DEBUG
python -m features_delta_one_service.cli.main --category CEFI --start-date 2024-01-15 --end-date 2024-01-15

# Check logs for periodic metrics
# Should see every 30 seconds: "System metrics: CPU=X%, Memory=Y%, Disk=Z%"
```

---

### 2. Query Cloud Logging Manually

**Get resource metrics for recent deployments:**

```bash
# Query Cloud Logging for resource warnings
gcloud logging read \
  'severity>=WARNING AND (jsonPayload.message:"High CPU" OR jsonPayload.message:"memory usage")' \
  --limit=50 \
  --format=json \
  --project=test-project

# Look for patterns:
# - Which services have frequent high CPU warnings? (may need upsizing)
# - Which services never have warnings? (may be over-provisioned)
```

---

### 3. Analyze Existing Logs

**Check recent deployment logs for resource info:**

```python
# In deployment-service
from google.cloud import logging as cloud_logging

client = cloud_logging.Client(project='test-project')
logger = client.logger('run.googleapis.com%2Fstderr')

# Query for resource metrics
entries = logger.list_entries(
    filter_='severity>=WARNING AND resource.type="cloud_run_job"',
    page_size=100
)

# Count warnings by service
service_warnings = {}
for entry in entries:
    service = entry.resource.labels.get('job_name', 'unknown')
    if 'CPU' in entry.payload or 'memory' in entry.payload:
        service_warnings[service] = service_warnings.get(service, 0) + 1

# Services with many warnings: consider upsizing
# Services with zero warnings: consider downsizing
```

---

## Timeline and Effort

### Immediate (This Week)

1. **Analyze existing logs** (1 hour)
   - Query Cloud Logging for resource warnings
   - Identify services at risk of failure (high CPU/RAM usage)
   - Focus on services hitting >85% RAM or >90% CPU

2. **Validate C2 allocations** (2 hours)
   - Confirm all services use C2 machine types
   - Check which services approach resource limits
   - Plan upsizing for high-risk services (e.g., features-delta-one)
   - **No downsizing possible** (c2-standard-4 is minimum)

---

### Short-Term (Next 2 Weeks)

3. **Update unified-trading-library** (4 hours)
   - Add INFO-level summary logging
   - Add rightsizing recommendation logic
   - Test across all services

4. **Add API endpoint** (4 hours)
   - Implement resource metrics aggregation
   - Test with sample deployments
   - Document API

5. **Add UI component** (6 hours)
   - Create ResourceMetricsPanel
   - Integrate into DeploymentDetails
   - Test with real data

---

### Long-Term (Next Month)

6. **Validate at scale** (ongoing)
   - Run 30+ days of real deployments
   - Collect resource metrics
   - Analyze patterns

7. **Systematic rightsizing** (2 days)
   - Update Terraform for all services
   - Document machine sizing rationale
   - Lock in optimized allocations

8. **Continuous monitoring** (ongoing)
   - Weekly review of resource metrics
   - Adjust as workload patterns change
   - Track cost savings over time

---

## Related Documentation

- [GCS_LIFECYCLE_AGGRESSIVE_STRATEGY.md](GCS_LIFECYCLE_AGGRESSIVE_STRATEGY.md) - Storage optimization
- [COST.md](COST.md) - Complete cost analysis
- [MASSIVE_BACKFILL_COST_ANALYSIS.md](MASSIVE_BACKFILL_COST_ANALYSIS.md) - Large-scale compute analysis

---

## Summary

**Current State:**

- ✅ Resource monitoring infrastructure exists (psutil, PerformanceMonitor)
- ✅ Cross-platform support (macOS Intel/ARM, Linux, Windows)
- ✅ 85% of services enable monitoring
- ❌ Metrics hidden at DEBUG level
- ❌ No UI visibility
- ❌ No aggregation API

**Proposed Solution:**

1. Log summaries at INFO level (no service changes)
2. Add API endpoint for metrics aggregation
3. Add UI panel for resource visualization
4. Validate machine sizing with real data
5. Update Terraform for optimal allocations

**Expected Benefits (C2-Only Constraint):**

- **Primary:** Prevent under-provisioning failures (OOM, timeouts)
- **Secondary:** Identify which services truly need c2-std-8 vs c2-std-4
- **Tertiary:** Optimize for reliability, not downsizing cost savings
- **Key Value:** Avoid costly production failures and debugging time

**Effort:** ~20 hours total (spread over 2 weeks)

**ROI:** Preventing one major failure (4-8 hours debugging + reruns) pays for the implementation

**Note:** With C2-only quota, there are no downsizing savings. The value is in reliability and knowing which services need MORE resources.
