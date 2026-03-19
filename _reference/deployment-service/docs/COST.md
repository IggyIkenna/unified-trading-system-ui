# Comprehensive Cost Analysis - Unified Trading System

**Last Updated:** February 10, 2026

**Purpose:** Cost framework for all services (compute, storage, egress, operations)
**Region:** asia-northeast1 (primary)
**Key Insight:** 80% of data rarely accessed → aggressive lifecycle policy saves 73-77% on storage

**Note on Storage Costs:** All storage line items include estimated retrieval costs from cold storage tiers (NEARLINE: $0.01/GB, COLDLINE: $0.02/GB, ARCHIVE: $0.05/GB). Retrieval costs are typically $50-400/year for quarterly ML retraining and occasional backtests.

---

## **Cost Categories**

1. **Storage:** GCS buckets (with aggressive lifecycle tiering) + retrieval costs
2. **Compute:** VMs/Cloud Run (daily batch + one-time backfills)
3. **BigQuery:** External tables (optional, $0 storage)
4. **Egress:** Data leaving GCP (visualizations, local dev)
5. **Operations:** API calls (already included in storage retrieval costs)
6. **UI Hosting:** Cloud Run services (deployment UI, backtest UI, future ML UIs)

---

## **1. Storage Costs by Service**

### 1.1 instruments-service

**Bucket:** `instruments-store-{category}-{project_id}` (3 buckets: CEFI, TRADFI, DEFI)

| Data Type                | Size       | Notes                           |
| ------------------------ | ---------- | ------------------------------- |
| **MVP (BTC + SPY)**      | ~5 MB/day  | 2 instruments × ~2.5 MB each    |
| **Full (11 MVP venues)** | ~50 MB/day | 11 venues × ~4.5 MB average     |
| **6 years historical**   | 109 GB     | 11 venues × 6 years × 50 MB/day |

**Annual Cost:** 109 GB × $0.023/GB × 12 = **$30.13/year**

**Query Pattern:** Infrequent (load once per downstream job)

---

### 1.2 market-tick-data-handler

**Buckets:** `market-data-tick-{category}-{project_id}` (3 buckets)

| Instrument             | Data Types             | Size/Day   | 6 Years | Notes                              |
| ---------------------- | ---------------------- | ---------- | ------- | ---------------------------------- |
| **BTC (24/7)**         | ohlcv_1m, trades, tbbo | 2 GB/day   | 4.4 TB  | 365 days/year × 6 years            |
| **SPY (market hours)** | ohlcv_1m, trades, tbbo | 800 MB/day | 1.2 TB  | ~252 trading days/year × 6 years   |
| **Other 9 MVP venues** | Similar                | TBD        | ~35 TB  | Estimate based on BTC/SPY patterns |

**MVP Total (BTC + SPY only):** ~5.6 TB
**Full MVP (11 venues):** ~40 TB

**Annual Cost (MVP):** 5.6 TB × 1024 GB × $0.023 × 12 = **$1,589/year**
**Annual Cost (Full):** 40 TB × 1024 GB × $0.023 × 12 = **$11,325/year**

**Query Pattern:** Heavy (features queries daily)

---

### 1.3 market-data-processing-service

**Buckets:** `market-data-candles-{category}-{project_id}`

| Timeframe | Size/Day (BTC + SPY) | 6 Years    | Notes         |
| --------- | -------------------- | ---------- | ------------- |
| 15s       | 300 MB               | 657 GB     | Most granular |
| 1m        | 100 MB               | 219 GB     |               |
| 5m        | 20 MB                | 44 GB      |               |
| 15m       | 10 MB                | 22 GB      |               |
| 1h        | 2 MB                 | 4.4 GB     |               |
| 4h        | 500 KB               | 1.1 GB     |               |
| 24h       | 100 KB               | 219 MB     |               |
| **Total** | ~432 MB/day          | **948 GB** | 7 timeframes  |

**Annual Cost (MVP):** 948 GB × $0.023 × 12 = **$262/year**

**Query Pattern:** Medium (features reads candles)

---

### 1.4 features-delta-one-service

**Buckets:** `features-delta-one-{category}-{project_id}`

| Timeframe | Feature Groups | Size/Day (2 inst) | 6 Years    | Notes                    |
| --------- | -------------- | ----------------- | ---------- | ------------------------ |
| 15s       | 20 groups      | 150 MB            | 329 GB     | Largest (high frequency) |
| 1m        | 20 groups      | 50 MB             | 110 GB     |                          |
| 5m        | 20 groups      | 10 MB             | 22 GB      |                          |
| 15m       | 20 groups      | 5 MB              | 11 GB      |                          |
| 1h        | 20 groups      | 1.5 MB            | 3.3 GB     |                          |
| 4h        | 20 groups      | 400 KB            | 877 MB     |                          |
| 24h       | 20 groups      | 100 KB            | 219 MB     |                          |
| **Total** |                | ~217 MB/day       | **476 GB** | 20 groups × 7 timeframes |

**Annual Cost (MVP):** 476 GB × $0.023 × 12 = **$131/year**

**Query Pattern:** Very Heavy (ML queries constantly)

---

### 1.5 features-calendar-service

**Bucket:** `features-calendar-{project_id}` (universal, no category)

| Feature Type    | Size/Month  | 6 Years    | Notes                     |
| --------------- | ----------- | ---------- | ------------------------- |
| Temporal        | 5 MB        | 360 MB     | Hour/day/month features   |
| Economic events | 1 MB        | 72 MB      | FOMC, NFP, etc.           |
| **Total**       | ~6 MB/month | **432 MB** | Shared by all instruments |

**Annual Cost:** 432 MB × $0.023 × 12 = **$0.12/year** (negligible)

**Query Pattern:** Medium (ML joins with delta-one)

---

### 1.6 ml-training-service

**Buckets:**

- `ml-training-artifacts-{project_id}` (intermediate outputs)
- `ml-models-store-{project_id}` (final models)

| Artifact Type                       | Size/Model | Models | Total       | Notes                      |
| ----------------------------------- | ---------- | ------ | ----------- | -------------------------- |
| Stage 1: selected_features.json     | 50 KB      | 32     | 1.6 MB      | Per model per quarter      |
| Stage 2: best_hyperparams.json      | 20 KB      | 32     | 640 KB      | Per model per quarter      |
| Stage 3: model.joblib               | 5 MB       | 32     | 160 MB      | LightGBM model per quarter |
| Stage 3: metadata.json              | 10 KB      | 32     | 320 KB      | Model metadata             |
| **Total per quarter**               |            |        | **~162 MB** |                            |
| **Total (20 quarters × 32 models)** |            | 640    | **3.2 GB**  | 2021-2025                  |

**Annual Cost:** 3.2 GB × $0.023 × 12 = **$0.88/year** (negligible)

**Query Pattern:** Low (load model once per inference run)

---

### 1.7 ml-inference-service

**Bucket:** `ml-predictions-store-{project_id}`

| Timeframe          | Predictions/Day | Size/Day    | 6 Years    | Notes          |
| ------------------ | --------------- | ----------- | ---------- | -------------- |
| 1h                 | 24 predictions  | 50 KB       | 110 MB     | Per instrument |
| 4h                 | 6 predictions   | 15 KB       | 33 MB      | Per instrument |
| **Total (2 inst)** |                 | ~130 KB/day | **285 MB** | BTC + SPY      |

**Annual Cost:** 285 MB × $0.023 × 12 = **$0.08/year** (negligible)

**Query Pattern:** Low (strategy reads sequentially)

---

### 1.8 strategy-service

**Bucket:** `strategy-store-{project_id}`

| Data Type                    | Size/Day    | 6 Years    | Notes                |
| ---------------------------- | ----------- | ---------- | -------------------- |
| Strategy instructions        | 200 KB      | 439 MB     | Per strategy per day |
| Backtest results             | 500 KB      | 1.1 GB     | Per strategy per day |
| **Total (6 MVP strategies)** | ~4.2 MB/day | **9.2 GB** |                      |

**Annual Cost:** 9.2 GB × $0.023 × 12 = **$2.54/year**

---

### 1.9 execution-service

**Bucket:** `execution-store-{project_id}`

| Data Type                    | Size/Day   | 6 Years   | Notes                |
| ---------------------------- | ---------- | --------- | -------------------- |
| Execution results            | 2 MB       | 4.4 GB    | Per strategy per day |
| Fill analytics               | 500 KB     | 1.1 GB    | Per strategy per day |
| **Total (6 MVP strategies)** | ~15 MB/day | **33 GB** |                      |

**Annual Cost:** 33 GB × $0.023 × 12 = **$9.11/year**

---

### Storage Cost Summary

| Service                | MVP (BTC + SPY) | Full MVP (11 venues) | Query Frequency |
| ---------------------- | --------------- | -------------------- | --------------- |
| instruments            | $30/year        | $30/year             | Low             |
| market-tick            | **$1,589/year** | **$11,325/year**     | Heavy           |
| market-data-processing | $262/year       | $1,800/year          | Medium          |
| features-delta-one     | **$131/year**   | **$900/year**        | Very Heavy      |
| features-calendar      | $0.12/year      | $0.12/year           | Medium          |
| ml-training            | $0.88/year      | $0.88/year           | Low             |
| ml-inference           | $0.08/year      | $0.50/year           | Low             |
| strategy               | $2.54/year      | $15/year             | Low             |
| execution              | $9.11/year      | $55/year             | Low             |
| **TOTAL**              | **$2,025/year** | **$14,126/year**     |                 |

**90% of cost:** market-tick (78%) + features (6%)

---

## **2. Compute Costs by Service**

### Compute Pricing (asia-northeast1)

| Machine Type   | vCPUs  | RAM   | Cost/Hour | Cost/Day (24h) |
| -------------- | ------ | ----- | --------- | -------------- |
| e2-micro       | 0.25-2 | 1 GB  | $0.0084   | $0.20          |
| e2-small       | 0.5-2  | 2 GB  | $0.0168   | $0.40          |
| e2-medium      | 1-2    | 4 GB  | $0.0336   | $0.81          |
| c2-standard-4  | 4      | 16 GB | $0.2088   | $5.01          |
| c2-standard-8  | 8      | 32 GB | $0.4176   | $10.02         |
| c2-standard-16 | 16     | 64 GB | $0.8352   | $20.04         |

**VM Startup Overhead:** ~3-5 minutes per job (image pull, initialization)

---

### 2.1 instruments-service (Daily Job)

| Dimension           | Value     | Notes                              |
| ------------------- | --------- | ---------------------------------- |
| **Runtime**         | ~10 min   | 11 venues, API calls to exchanges  |
| **Machine Type**    | e2-medium | Light (API calls, JSON processing) |
| **RAM**             | 4 GB      |                                    |
| **Tolerance**       | < 1 hour  | Must complete before market-tick   |
| **Parallelization** | 11 shards | 1 per venue                        |

**Daily Cost:**

- VM time: (10 min / 60) × $0.0336 = $0.0056
- Startup overhead: (5 min / 60) × $0.0336 × 11 shards = $0.0307
- **Total: $0.036/day = $13.28/year**

---

### 2.2 market-tick-data-handler (Daily Job)

| Dimension           | Value         | Notes                            |
| ------------------- | ------------- | -------------------------------- |
| **Runtime**         | ~2 hours      | API rate limits, large downloads |
| **Machine Type**    | c2-standard-4 | Network I/O intensive            |
| **RAM**             | 16 GB         | Buffer large API responses       |
| **Tolerance**       | < 4 hours     | Can run overnight                |
| **Parallelization** | 25 shards     | Per venue per data_type          |

**Daily Cost (MVP - BTC + SPY):**

- VM time: 2 shards × 2 hours × $0.2088 = $0.84
- Startup: 2 × (5 min / 60) × $0.2088 = $0.035
- **Total: $0.87/day = $319/year**

**Daily Cost (Full MVP - 11 venues):**

- VM time: 25 shards × 2 hours × $0.2088 = $10.44
- Startup: 25 × (5 min / 60) × $0.2088 = $0.44
- **Total: $10.88/day = $3,971/year**

**Optimization:** Paradise batching reduces startup overhead (1 VM runs multiple shards)

---

### 2.3 market-data-processing-service (Daily Job)

| Dimension           | Value         | Notes                              |
| ------------------- | ------------- | ---------------------------------- |
| **Runtime**         | ~30 min       | Read ticks, compute 7 timeframes   |
| **Machine Type**    | c2-standard-4 | CPU-intensive (candle aggregation) |
| **RAM**             | 16 GB         | Hold tick data in memory           |
| **Tolerance**       | < 2 hours     | Features depends on this           |
| **Parallelization** | 15 shards     | Per venue per timeframe            |

**Daily Cost (MVP):**

- VM time: 2 instruments × 7 timeframes × 0.5 hr × $0.2088 = $1.46
- Startup: 14 × (5 min / 60) × $0.2088 = $0.24
- **Total: $1.70/day = $622/year**

---

### 2.4 features-delta-one-service (Daily Job)

| Dimension           | Value         | Notes                                 |
| ------------------- | ------------- | ------------------------------------- |
| **Runtime**         | ~45 min       | Feature calculations (TA-Lib, pandas) |
| **Machine Type**    | c2-standard-4 | CPU + memory intensive                |
| **RAM**             | 16 GB         | Load candles + compute features       |
| **Tolerance**       | < 3 hours     | ML can wait                           |
| **Parallelization** | 20 shards     | Per feature_group                     |

**Daily Cost (MVP):**

- VM time: 2 inst × 7 tf × 20 groups × 0.75 hr × $0.2088 = $43.85
- Startup: 280 shards × (5 min / 60) × $0.2088 = $4.87
- **Total: $48.72/day = $17,783/year**

**Biggest compute cost!** Feature calculation is expensive.

**Optimization Opportunity:**

- Use c2-standard-8 (2x vCPUs) → halve runtime → same daily cost but finishes in 22 min

---

### 2.5 features-calendar-service (Monthly Job)

| Dimension           | Value     | Notes                            |
| ------------------- | --------- | -------------------------------- |
| **Runtime**         | ~5 min    | Generate time features for month |
| **Machine Type**    | e2-medium | Light (date math, pandas)        |
| **RAM**             | 4 GB      |                                  |
| **Tolerance**       | < 30 min  | Runs monthly, not daily          |
| **Parallelization** | 3 shards  | temporal, economic_events, macro |

**Monthly Cost:**

- VM time: 3 × (5 min / 60) × $0.0336 = $0.0084
- Startup: 3 × (5 min / 60) × $0.0336 = $0.0084
- **Total: $0.017/month = $0.20/year** (negligible)

---

### 2.6 ml-training-service (Quarterly Job)

| Stage                       | Runtime    | Machine Type  | Tolerance | Notes                                   |
| --------------------------- | ---------- | ------------- | --------- | --------------------------------------- |
| **Stage 1: Pre-selection**  | 30 min     | c2-standard-8 | < 2 hours | Correlation matrix + feature importance |
| **Stage 2: Grid search**    | 2 hours    | c2-standard-8 | < 6 hours | 3-fold CV × 12 combos = 36 model trains |
| **Stage 3: Final training** | 20 min     | c2-standard-8 | < 1 hour  | Single model on full data               |
| **Total per model**         | ~2.8 hours |               | < 8 hours |                                         |

**Parallelization:** 16 models × 3 stages = **48 stage-shards per quarter**

**Quarterly Cost (1 quarter):**

- VM time: 48 shards × 2.8 hr × $0.4176 = $56.12
- Startup: 48 × (5 min / 60) × $0.4176 = $1.67
- **Total: $57.79/quarter**

**Annual Cost (4 quarters):** $57.79 × 4 = **$231/year**

**Note:** Can batch in Paradise (1 VM runs multiple sequential stages, saves startup overhead)

---

### 2.7 ml-inference-service (Daily Job)

| Dimension           | Value         | Notes                                 |
| ------------------- | ------------- | ------------------------------------- |
| **Runtime**         | ~5 min        | Load model, predict on 1 day features |
| **Machine Type**    | c2-standard-4 | CPU for inference                     |
| **RAM**             | 16 GB         | Model + features in memory            |
| **Tolerance**       | < 1 hour      | Must complete before strategy         |
| **Parallelization** | 8 shards      | 2 inst × 2 tf × 2 targets             |

**Daily Cost:**

- VM time: 8 × (5 min / 60) × $0.2088 = $0.14
- Startup: 8 × (5 min / 60) × $0.2088 = $0.14
- **Total: $0.28/day = $101/year**

---

### 2.8 strategy-service (Weekly Job)

| Dimension           | Value         | Notes                          |
| ------------------- | ------------- | ------------------------------ |
| **Runtime**         | ~15 min       | Generate strategy instructions |
| **Machine Type**    | c2-standard-4 | Logic + I/O                    |
| **RAM**             | 16 GB         |                                |
| **Tolerance**       | < 2 hours     | Can batch weekly               |
| **Parallelization** | 6 shards      | 6 MVP strategies               |

**Weekly Cost:**

- VM time: 6 × (15 min / 60) × $0.2088 = $0.31
- Startup: 6 × (5 min / 60) × $0.2088 = $0.10
- **Total: $0.41/week = $21.62/year**

---

### 2.9 execution-service (Daily Job)

| Dimension           | Value         | Notes                           |
| ------------------- | ------------- | ------------------------------- |
| **Runtime**         | ~45 min       | Tick-level backtesting          |
| **Machine Type**    | c2-standard-8 | CPU-intensive (matching engine) |
| **RAM**             | 32 GB         | Hold full day of ticks          |
| **Tolerance**       | < 4 hours     | Can run overnight               |
| **Parallelization** | 6 shards      | Per strategy config             |

**Daily Cost:**

- VM time: 6 × (45 min / 60) × $0.4176 = $1.88
- Startup: 6 × (5 min / 60) × $0.4176 = $0.21
- **Total: $2.09/day = $763/year**

---

### Compute Cost Summary

| Service                | Frequency | Daily Cost  | Annual Cost | Primary Cost Driver                  |
| ---------------------- | --------- | ----------- | ----------- | ------------------------------------ |
| instruments            | Daily     | $0.04       | $13         | API calls                            |
| market-tick            | Daily     | $0.87 (MVP) | $319 (MVP)  | Network I/O, API rate limits         |
| market-data-processing | Daily     | $1.70       | $622        | CPU (candle aggregation)             |
| **features-delta-one** | Daily     | **$48.72**  | **$17,783** | **CPU + RAM (feature calculations)** |
| features-calendar      | Monthly   | $0.02       | $0.20       | Negligible                           |
| ml-training            | Quarterly | $14.45      | $231        | CPU (model training)                 |
| ml-inference           | Daily     | $0.28       | $101        | CPU (inference)                      |
| strategy               | Weekly    | $0.06       | $22         | Logic processing                     |
| execution              | Daily     | $2.09       | $763        | CPU (matching engine)                |
| **TOTAL**              |           | **$68.23**  | **$19,854** |                                      |

**90% of cost:** features-delta-one (89%)

**Optimization:** features-delta-one is the bottleneck

- Consider c2-standard-8 (2x faster) or c2-standard-16 (4x faster)
- Use Paradise batching to reduce startup overhead

---

## **3. VM Startup Overhead Analysis**

### Problem: 5-Minute Startup per Shard

**Example:** features-delta-one with 280 shards (20 groups × 7 tf × 2 inst)

- Sequential execution: 280 × 5 min startup = **23.3 hours of pure overhead!**
- This is 48% waste if each shard only runs 5 minutes!

### Solution: Paradise Batching

**Paradise Strategy:**

```
1 VM runs multiple shards sequentially
  Startup: 5 min (once)
  Shard 1: 45 min
  Shard 2: 45 min
  ...
  Shard N: 45 min
  Total: 5 min + (N × 45 min)
```

**Savings:**

- 10 shards/VM: Startup overhead reduced from 50 min to 5 min (90% reduction)
- **Annual savings: 280 shards × (5 min startup) × $0.4176 × 365 = $71,544 saved!**

**Implementation:** Already in deployment-service Paradise orchestrator

---

## **4. BigQuery Costs (Features Query Layer)**

### 4.1 BigQuery Storage

**Materialized Views (7 timeframes):**

- Data: 476 GB (compressed 0.8x vs GCS)
- Cost: 476 GB × $0.023 × 12 = **$131/year**

### 4.2 BigQuery Queries

**Query Volume:** 10% of 50 TB = 5 TB/month

| Query Type         | Volume/Month | Cost/Month | Cost/Year |
| ------------------ | ------------ | ---------- | --------- |
| ML Training        | 4 TB         | $24        | $288      |
| ML Inference       | 0.5 TB       | $3         | $36       |
| Ad-hoc exploration | 0.5 TB       | $3         | $36       |
| **Total**          | 5 TB         | **$30**    | **$360**  |

### 4.3 Materialized View Refresh

**Event-Driven (Incremental):**

- Events: 100/month (feature updates)
- Data per refresh: ~47 GB (2 days of features)
- Cost: (0.047 TB) × $6 × 100 = $28.20/month
- **Annual: $338**

### 4.4 BigQuery Total

| Component  | Annual Cost   |
| ---------- | ------------- |
| MV Storage | $131          |
| Queries    | $360          |
| MV Refresh | $338          |
| **Total**  | **$829/year** |

**Trade-off:** Pay $829/year for 10-20x faster queries vs GCS direct

---

## **5. Egress Costs (Visualizations & Local Dev)**

### Scenario: 10% of 50 TB Egressed Monthly

**Use Cases:**

- Download to local for Jupyter notebooks
- Export to visualization tools
- Backup to external systems

**Cost:** 5 TB/month to internet

- First 1 TB: $143
- Next 4 TB: $532
- **Total: $676/month = $8,110/year**

**Optimization:**

- Use Cloud Workbench (Jupyter in GCP) → $0 egress
- Use Looker/Data Studio (GCP-native) → $0 egress
- Only download final results, not raw data

**Potential Savings:** Up to $8,110/year by keeping analysis in GCP

---

## **6. UI Hosting Costs (Cloud Run)**

### 6.1 deployment-service UI

**Service:** Deployment orchestration UI (Vue.js + FastAPI backend)

| Resource     | Spec        | Cost                 |
| ------------ | ----------- | -------------------- |
| **CPU**      | 1 vCPU      | $0.00002448/vCPU-sec |
| **RAM**      | 512 MB      | $0.00000273/GB-sec   |
| **Requests** | ~1000/month | $0.40/million        |

**Monthly Cost:**

- Idle time: $0 (pay per request only)
- Active: 1000 requests × 2 sec × ($0.00002448 + $0.00000273 × 0.5) = $0.05
- Requests: 1000 / 1,000,000 × $0.40 = $0.0004
- **Total: $0.05/month = $0.60/year** (negligible)

### 6.2 execution-service Backtest UI (Future)

**Service:** Backtest visualization (charts, fill analysis)

**Estimate:** Similar to deployment UI

- **$1-5/month** depending on usage
- **$12-60/year**

### 6.3 ML Training Dashboard (Future)

**Service:** Model metrics, feature importance, training progress

**Estimate:**

- Light usage: $1/month
- Heavy usage: $10/month
- **$12-120/year**

### 6.4 Strategy Dashboard (Future)

**Service:** Strategy performance, signal analysis

**Estimate:**

- **$5-10/month = $60-120/year**

**Total UI Hosting:** $84-300/year (all negligible compared to compute/storage)

---

## **7. Total Cost Summary**

### MVP (BTC + SPY, 6 Years Historical)

| Category                     | Annual Cost      | % of Total            |
| ---------------------------- | ---------------- | --------------------- |
| **Storage (GCS)**            | $2,025           | 9%                    |
| **Compute (Daily Jobs)**     | $19,854          | 88%                   |
| **BigQuery (Optional)**      | $829             | 4%                    |
| **Egress (10% to internet)** | $8,110           | Excluded from total\* |
| **UI Hosting**               | $84              | <1%                   |
| **TOTAL**                    | **$22,792/year** |                       |

\*Egress is controllable (use GCP tools → $0)

### Full MVP (11 Venues, 6 Years)

| Category   | Annual Cost      |
| ---------- | ---------------- |
| Storage    | $14,126          |
| Compute    | $23,000 (est)    |
| BigQuery   | $2,500 (est)     |
| UI Hosting | $300             |
| **TOTAL**  | **$39,926/year** |

---

## **8. Cost Optimization Strategies**

### 8.1 Reduce Compute (Save $10,000+/year)

**Problem:** features-delta-one = $17,783/year (89% of compute)

**Optimizations:**

1. **Use c2-standard-8** (2x faster) → Halve shards needed
   - Savings: ~$8,000/year
2. **Paradise batching** → Reduce startup overhead
   - Savings: ~$3,000/year
3. **Cache intermediate results** → Skip recalculations
   - Savings: ~$2,000/year

**Total Potential: ~$13,000/year savings**

### 8.2 Reduce Egress (Save $8,110/year)

**Problem:** 5 TB/month to internet = $8,110/year

**Optimizations:**

1. **Use Cloud Workbench** for Jupyter → $0 egress
2. **Use Looker/Data Studio** for viz → $0 egress
3. **Download only final results** → 90% reduction

**Potential Savings: $7,299/year** (keep egress to < 500 GB/month)

### 8.3 Use Coldline for Old Data (Save $9,830/year)

**Problem:** Querying old data (> 1 year) is rare

**Solution:** Lifecycle policy

```json
{
  "rule": [
    {
      "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
      "condition": { "age": 365 }
    }
  ]
}
```

**Savings:** 40 TB older data × ($0.023 - $0.007) × 12 = $9,830/year

### 8.4 Optimized Architecture

| Original           | Optimized  | Savings                |
| ------------------ | ---------- | ---------------------- |
| Compute: $17,783   | $4,783     | $13,000                |
| Egress: $8,110     | $811       | $7,299                 |
| Storage: $2,025    | $2,025     | $0 (need fast access)  |
| **Total: $27,918** | **$7,619** | **$20,299/year (73%)** |

---

## **9. Key Instrument Cost Focus**

### 90% of Analysis: BTC + SPY

**Why These Two:**

- BTC: CEFI representative (24/7 trading, high volume)
- SPY: TRADFI representative (market hours, holidays)
- Cover both trading paradigms
- Together = 90% of our query/compute workload

**Cost Allocation:**

| Data Type | BTC Cost    | SPY Cost   | Total (90%) | Full MVP (11 venues) |
| --------- | ----------- | ---------- | ----------- | -------------------- |
| Storage   | $1,820      | $205       | $2,025      | $14,126              |
| Compute   | $16,800     | $954       | $17,754     | $23,000              |
| Queries   | $320        | $40        | $360        | $2,500               |
| **Total** | **$18,940** | **$1,199** | **$20,139** | **$39,626**          |

**Insight:** BTC alone is 83% of costs (24/7 vs market hours)

---

## **10. Production Deployment Timeline**

### Phase 1: MVP Data (BTC + SPY) - 2 Weeks

**Tasks:**

1. Generate market-tick (BTC 24/7, SPY market hours) - 3 days
2. Generate all features (20 groups × 7 timeframes) - 4 days
3. Run ml-training (Stage 1 → 2 → 3, quarterly) - 2 days
4. Run ml-inference (daily, 2021-2025) - 2 days
5. Validation & monitoring - 3 days

**Cost:** ~$700 (compute) + $340 (storage first month)

### Phase 2: Full MVP (11 Venues) - 1 Month

**Cost:** ~$3,300 (compute) + $1,177 (storage first month)

### Ongoing: Daily Operations

**Cost:** $68/day = $2,047/month = $24,564/year

**Breakdown:**

- features-delta-one: $49/day (71%)
- execution: $2/day (3%)
- market-data-processing: $1.70/day (3%)
- ml-inference: $0.28/day (<1%)
- Other: $15/day (22%)

---

## **11. Discussion Points**

### 11.1 Is BigQuery Worth $829/Year?

**For:**

- 10-20x faster queries (2 sec vs 20-30 sec)
- Better for development/exploration
- Materialized views stay current (< 1 min lag)

**Against:**

- GCS parallel reader works (20-30 sec acceptable for batch)
- Saves $829/year
- One less dependency

**Recommendation:** YES for development, optional for production

### 11.2 Compute vs Storage Trade-offs

**Current:** $19,854/year compute vs $2,025/year storage (10:1 ratio)

**This is CORRECT for data processing:**

- We compute features daily (expensive)
- We store results once (cheap)
- Can't optimize storage much (need the data)
- CAN optimize compute (Paradise batching, bigger VMs)

### 11.3 VM Startup Overhead

**Problem:** 5 min startup × 280 shards/day = 23 hours wasted

**Solution:** Paradise batching (already implemented)

- Batch 10 shards/VM → 90% startup overhead reduction
- Saves $3,000+/year

### 11.4 Time Tolerance per Service

**Hard Constraints:**

- instruments → market-tick (< 1 hour gap)
- market-tick → market-data-processing (< 2 hour gap)
- market-data-processing → features (< 3 hour gap)
- features → ml-inference (< 4 hour gap)

**Total Pipeline:** < 10 hours end-to-end (fits in overnight window)

**Acceptable:** Daily batch completes before next trading day

---

## **12. Cost Projections**

### Scenario A: MVP (BTC + SPY, Optimized)

| Component           | Annual Cost      |
| ------------------- | ---------------- |
| Storage             | $2,025           |
| Compute (optimized) | $7,619           |
| BigQuery            | $829             |
| UI Hosting          | $84              |
| **Total**           | **$10,557/year** |

### Scenario B: Full MVP (11 Venues, Optimized)

| Component           | Annual Cost      |
| ------------------- | ---------------- |
| Storage             | $14,126          |
| Compute (optimized) | $12,000          |
| BigQuery            | $2,500           |
| UI Hosting          | $300             |
| **Total**           | **$28,926/year** |

### Scenario C: Production Scale (50 Instruments, 5 Years)

| Component        | Annual Cost       |
| ---------------- | ----------------- |
| Storage (200 TB) | $56,500           |
| Compute          | $50,000           |
| BigQuery         | $10,000           |
| Egress           | $5,000            |
| UI Hosting       | $1,000            |
| **Total**        | **$122,500/year** |

---

## **13. Analysis Workload Cost Model (Active Development)**

### Scenario: 1000 Iterations/Month × 3 Areas = 3000 Total

**Use Cases:**

1. **ML Feature Analysis:** Query features, run training experiments (hyperparameter tuning, feature selection experiments)
2. **Strategy Backtesting:** Query ML predictions, test strategy variants
3. **Execution Optimization:** Query tick data, test execution algorithms

### Cost Breakdown

| Analysis Area          | Query Size        | Compute Time      | Cost/Iteration | Cost/Month (1000×) |
| ---------------------- | ----------------- | ----------------- | -------------- | ------------------ |
| ML Feature Analysis    | 100 GB (BigQuery) | 10 min (c2-std-4) | $0.621         | $621               |
| Strategy Backtest      | 50 MB (BigQuery)  | 5 min (c2-std-4)  | $0.018         | $18                |
| Execution Optimization | 2 GB (GCS)        | 30 min (c2-std-8) | $0.209         | $209               |

**Monthly Analysis Cost:** $848/month = **$10,167/year**

**Cost Drivers:**

- **BigQuery queries (ML analysis):** $586/month (69% of analysis cost)
- **Compute (execution sims):** $261/month (31%)

### Complete Annual Cost (2 Instruments, 6 Years, 3K Iterations/Month)

| Component                | Annual Cost | % of Total |
| ------------------------ | ----------- | ---------- |
| Storage (GCS + BigQuery) | $1,966      | 12%        |
| Daily Backfill Compute   | $4,446      | 27%        |
| **Analysis/Backtesting** | **$10,167** | **61%**    |
| MV Refresh (10% changes) | $3          | <1%        |
| **TOTAL**                | **$16,582** |            |

**Key Insight:** Active development (3K iterations/month) costs 2.3x more than passive daily backfill!

### Scenario Comparison

| Scenario                         | Iterations/Month | Annual Cost | Use Case                      |
| -------------------------------- | ---------------- | ----------- | ----------------------------- |
| **Passive (Storage + Backfill)** | 0                | $6,415      | Just maintain historical data |
| **Light Development**            | 1K               | $9,804      | Occasional experiments        |
| **Active Development**           | 3K               | **$16,582** | **Heavy R&D (current)**       |
| **Production + Heavy R&D**       | 10K              | $40,304     | Continuous optimization       |

**Scaling:** Each 1000 iterations/month adds ~$3,389/year

### Cost Optimization for Analysis

**Problem:** ML feature analysis is expensive ($621/month for 1000 iterations)

- 97.7 TB BigQuery scans/month = $586/month

**Optimizations:**

1. **Cache feature queries** (50% reduction)
   - Store frequently-accessed date ranges locally
   - Savings: $293/month = $3,516/year

2. **Use external table for exploration** (free queries, slower)
   - Development: Query external table (free, slower)
   - Production: Query MV (fast, costs money)
   - Savings: Up to $586/month = $7,032/year

3. **Sample data for experiments** (90% reduction)
   - Don't need full 6 years for every experiment
   - Query 10% sample → 90% cost reduction
   - Savings: $528/month = $6,336/year

**With optimizations:** $10,167 → $3,551/year (65% savings)

---

## **14. Key Recommendations**

### For MVP (BTC + SPY)

**Infrastructure:**

- ✅ GCS parallel reader (primary) - No BigQuery dependency
- ✅ BigQuery MV (optional) - For fast development queries
- ✅ Event-driven refresh - Only $3/year (not $400/month!)

**Expected Costs:**

- **Minimum (storage + daily backfill):** $6,415/year
- **Development (+ 3K iterations/month):** $16,582/year
- **Optimized development:** $10,000/year (caching, sampling)

### Optimization Priorities

1. **Paradise batching** → Save $3,000/year (reduce VM startup overhead)
2. **Cache analysis queries** → Save $3,516/year
3. **Use Coldline for old data** → Save $1,500/year (BTC + SPY scale)
4. **Sample data for experiments** → Save $6,336/year

**Total Potential Savings:** $14,352/year (87% of analysis cost!)

### BigQuery: Worth It?

**Cost:** $829/year (storage + refresh + queries)
**Benefit:** 10-20x faster queries (2 sec vs 20-30 sec)

**For Development:** ✅ YES - $829 for faster iteration is worth it
**For Production:** ⚠️ Optional - GCS reader is acceptable for batch

**Recommendation:** Implement both, make it configurable (already done!)

---

## **15. Automated Cost Cleanup Scripts**

### Purpose

Automated scripts to reduce storage costs by deleting old artifacts, logs, and unused resources.

### Available Scripts

**`scripts/cleanup-cloud-build-artifacts.sh`**

- **What it deletes**: Cloud Build logs and artifacts older than N days (default: 90 days)
- **Buckets cleaned**:
  - `gs://artifacts.test-project.appspot.com` (build artifacts)
  - `gs://test-project_cloudbuild` (build logs)
- **Estimated savings**: ~$5-20/month depending on build frequency
- **Usage**: `DAYS_TO_KEEP=90 ./scripts/cleanup-cloud-build-artifacts.sh`
- **Dry run**: `DRY_RUN=true ./scripts/cleanup-cloud-build-artifacts.sh`

**`scripts/cleanup-cloud-run-executions.sh`**

- **What it deletes**: Cloud Run Job executions older than N days (default: 30 days)
- **Impact**: Frees memory quota (executions count toward quota even after completion)
- **Estimated savings**: Prevents quota exhaustion, enables more concurrent jobs
- **Usage**: `DAYS_TO_KEEP=30 ./scripts/cleanup-cloud-run-executions.sh`
- **Dry run**: `DRY_RUN=true ./scripts/cleanup-cloud-run-executions.sh`

**`scripts/cleanup-cloud-run-revisions.sh`**

- **What it deletes**: Old Cloud Run service revisions (keeps latest N per service, default: 3)
- **Impact**: Frees memory quota (all revisions count toward quota)
- **Estimated savings**: Prevents quota exhaustion, $5-10/month
- **Usage**: `KEEP_REVISIONS=3 ./scripts/cleanup-cloud-run-revisions.sh`

### Current Cleanup Status (Dry Run Results)

**Cloud Build Artifacts**:

- 55 builds older than 90 days found
- Estimated savings: ~$10-15/month

**Cloud Run Executions**:

- 3 instrument-daily-backfill executions older than 30 days
- Minimal current impact (well-maintained)

### Recommended Schedule

**Weekly** (via Cloud Scheduler):

```bash
# Keep 30 days of executions
./scripts/cleanup-cloud-run-executions.sh

# Keep 3 revisions per service
./scripts/cleanup-cloud-run-revisions.sh
```

**Monthly** (manual or scheduled):

```bash
# Keep 90 days of build artifacts
./scripts/cleanup-cloud-build-artifacts.sh
```

**Annual Savings**: ~$120-240/year from automated cleanup

---

## **16. Next Steps**

1. **Review & approve** this cost model
2. **Implement BigQuery** (external tables + MV + Cloud Function)
3. **Test on real data** (155 days currently in GCS)
4. **Measure actual costs** for 1 week
5. **Optimize based on real metrics**
6. **Schedule cleanup scripts** (Cloud Scheduler or cron)

---

## **17. GCS Lifecycle Policy - Aggressive Storage Optimization**

### Key Insight

**Your access pattern:**

- MVP instruments (BTC, SPY): ~10-20% of data, accessed frequently
- Non-MVP instruments: ~80% of data, rarely or never accessed
- Historical data: Most queries focus on recent 30-90 days

**Implication:** Most data should move to cold storage **very quickly**

---

### Aggressive Lifecycle Policy

#### Timeline

| Age        | Storage Class | Cost per GB/month | Cumulative Savings |
| ---------- | ------------- | ----------------- | ------------------ |
| 0-3 days   | STANDARD      | $0.023            | Baseline           |
| 3-14 days  | NEARLINE      | $0.013            | 43% cheaper        |
| 14-90 days | COLDLINE      | $0.007            | 70% cheaper        |
| 90+ days   | ARCHIVE       | $0.0025           | 89% cheaper        |

#### Policy JSON

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 3, "matchesStorageClass": ["STANDARD"] }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 14, "matchesStorageClass": ["NEARLINE"] }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 90, "matchesStorageClass": ["COLDLINE"] }
      }
    ]
  }
}
```

---

### Cost Analysis (MVP: BTC + SPY, 6 Years)

#### Current State (All STANDARD)

**Total Storage:** 7,133 GB

- Instruments: 109 GB
- Market Tick: 5,600 GB
- Market Data Processing: 948 GB
- Features: 476 GB

**Monthly Cost:** 7,133 GB × $0.023 = $164.06/month
**Annual Cost:** $1,968/year

#### With Aggressive Lifecycle (80% Rarely Accessed)

**Assumptions:**

- **5% accessed in last 3 days** (STANDARD) - Active MVP instruments only
- **5% accessed in last 14 days** (NEARLINE) - Recent MVP + occasional lookback
- **10% accessed in last 90 days** (COLDLINE) - Historical analysis on MVP
- **80% older than 90 days** (ARCHIVE) - Non-MVP instruments + old data

**Storage Distribution:**

| Storage Class | % of Data | Amount (GB) | Cost/GB/month | Monthly Cost |
| ------------- | --------- | ----------- | ------------- | ------------ |
| STANDARD      | 5%        | 357 GB      | $0.023        | $8.21        |
| NEARLINE      | 5%        | 357 GB      | $0.013        | $4.64        |
| COLDLINE      | 10%       | 713 GB      | $0.007        | $4.99        |
| ARCHIVE       | 80%       | 5,706 GB    | $0.0025       | $14.27       |
| **Total**     | 100%      | 7,133 GB    | -             | **$32.11**   |

**Annual Cost:** $385/year
**Annual Savings:** $1,968 - $385 = **$1,583/year (80% reduction)**

---

### Retrieval Cost Impact

#### Realistic Scenarios

**Scenario 1: Daily MVP Operations (BTC, SPY)**

**Access Pattern:**

- Recent 7 days: STANDARD (free retrieval)
- Occasional lookback 30 days: Mix of STANDARD/NEARLINE

**Data Retrieved:** 50 GB/month (mostly STANDARD)
**Retrieval Cost:** ~$0.50/month = $6/year

**Net Savings:** $1,583 - $6 = **$1,577/year**

---

**Scenario 2: Quarterly ML Retraining**

**Access Pattern:**

- 90-day training window
- Mix: 60% STANDARD/NEARLINE (free/$0.01), 30% COLDLINE ($0.02), 10% ARCHIVE ($0.05)

**Data Retrieved:** 200 GB/quarter (800 GB/year)

- 480 GB STANDARD/NEARLINE: $4.80
- 240 GB COLDLINE: $4.80
- 80 GB ARCHIVE: $4.00
- **Total:** $13.60/year

**Net Savings:** $1,583 - $14 = **$1,569/year**

---

**Scenario 3: Historical Backtest (Once per Year)**

**Access Pattern:**

- Full 6 years of data for 2 instruments
- 5% STANDARD, 5% NEARLINE, 10% COLDLINE, 80% ARCHIVE

**Data Retrieved:** 1,000 GB once/year

- 50 GB STANDARD: $0
- 50 GB NEARLINE: $0.50
- 100 GB COLDLINE: $2.00
- 800 GB ARCHIVE: $40.00
- **Total:** $42.50/year

**Net Savings:** $1,583 - $43 = **$1,540/year**

---

#### Combined Annual Retrieval Costs

| Operation                 | Frequency  | Cost/Year    |
| ------------------------- | ---------- | ------------ |
| Daily MVP operations      | Daily      | $6           |
| Quarterly ML retraining   | 4x/year    | $14          |
| Historical backtest       | 1x/year    | $43          |
| Ad-hoc exploration        | Occasional | $20          |
| **Total Retrieval Costs** | -          | **$83/year** |

**Net Annual Savings:** $1,583 - $83 = **$1,500/year (76% reduction)**

---

### At Scale (Full MVP: 11 Venues)

#### Current (All STANDARD)

**Total Storage:** ~50 TB
**Annual Cost:** $14,000/year

#### With Aggressive Lifecycle (80% in ARCHIVE)

**Storage Distribution:**

- 5% STANDARD: 2.5 TB × $0.023 × 12 = $690/year
- 5% NEARLINE: 2.5 TB × $0.013 × 12 = $390/year
- 10% COLDLINE: 5 TB × $0.007 × 12 = $420/year
- 80% ARCHIVE: 40 TB × $0.0025 × 12 = $1,200/year
- **Total:** $2,700/year

**Retrieval Costs (Full Scale):**

- Daily operations: $30/year
- Quarterly retraining: $70/year
- Historical backtests: $200/year
- Ad-hoc: $100/year
- **Total:** $400/year

**Net Annual Cost:** $2,700 + $400 = $3,100/year
**Annual Savings:** $14,000 - $3,100 = **$10,900/year (78% reduction)**

---

### Conservative Alternative (7/30/365 day transitions)

**For comparison, a less aggressive policy:**

**Timeline:**

- STANDARD → NEARLINE: 7 days (vs 3 days aggressive)
- NEARLINE → COLDLINE: 30 days (vs 14 days aggressive)
- COLDLINE → ARCHIVE: 365 days (vs 90 days aggressive)

**Cost Analysis (MVP):**

- 20% STANDARD, 20% NEARLINE, 40% COLDLINE, 20% ARCHIVE
- Monthly cost: $100.06
- Annual cost: $1,201
- **Annual Savings:** $767/year (39% reduction)

**Comparison:**

- Aggressive (3/14/90): **$1,500/year savings** (76% reduction)
- Conservative (7/30/365): **$767/year savings** (39% reduction)
- **Difference:** $733/year more with aggressive

**Recommendation:** ✅ **Use Aggressive Policy**

- 2x the savings
- MVP-focused access pattern supports it
- Retrieval costs minimal ($83/year)
- Policy fully reversible if needed

---

### Implementation

```bash
cd deployment-service
./scripts/setup-gcs-lifecycle-policies.sh
```

**Monitoring:**

Week 1: Verify NEARLINE transitions (3 days)

```bash
gsutil ls -L gs://features-delta-one-cefi-{project}/by_date/**/*.parquet | \
  grep "Storage class" | sort | uniq -c
```

Week 2: Validate COLDLINE transitions (14 days)

```bash
gsutil ls -Lr gs://market-data-tick-cefi-{project}/raw_tick_data/ | \
  grep "Storage class" | awk '{print $3}' | sort | uniq -c
```

Month 3: Confirm ARCHIVE transitions (90 days)

```bash
for bucket in $(gsutil ls | grep test-project); do
  echo "=== $bucket ==="
  gsutil du -s "$bucket"
  gsutil ls -Lr "$bucket" | grep "Storage class" | \
    awk '{print $3}' | sort | uniq -c
done
```

---

## **18. Massive Backfill Cost Analysis**

### Scenario: 50 TB in 24 Hours

**Configuration:** 500 C2 machines processing entire 6-year dataset

### Cost Calculations

| Machine Type                  | Total Cost | Cost per TB | With Preemptible |
| ----------------------------- | ---------- | ----------- | ---------------- |
| c2-standard-4                 | **$2,506** | $50.11/TB   | **$501**         |
| c2-standard-8                 | **$5,011** | $100.22/TB  | **$1,002**       |
| Mixed (300×std-4 + 200×std-8) | **$3,508** | $70.16/TB   | **$702**         |

**Add storage for first month:** +$1,177
**Add operations:** +$50

**Total One-Time Cost:**

- Regular VMs: $4,735 (with c2-std-4)
- **Preemptible VMs: $1,728** (recommended)

**Cost per TB processed: $34.56/TB with preemptible** 🎯

---

### Complete 24-Hour Backfill Breakdown

| Stage     | Service                        | Machines | Type     | Hours | Cost       |
| --------- | ------------------------------ | -------- | -------- | ----- | ---------- |
| 1         | instruments-service            | 10       | c2-std-4 | 24    | $50        |
| 2         | market-tick-data-handler       | 50       | c2-std-4 | 24    | $251       |
| 3         | market-data-processing-service | 100      | c2-std-4 | 24    | $501       |
| 4         | features-delta-one-service     | 250      | c2-std-8 | 24    | $2,506     |
| 5         | ml-training-service            | 50       | c2-std-8 | 24    | $501       |
| 6         | ml-inference-service           | 30       | c2-std-4 | 24    | $150       |
| 7         | strategy-service               | 10       | c2-std-4 | 24    | $50        |
| **Total** |                                | **500**  |          |       | **$4,009** |

---

### Recommended Approach: Hybrid

**Phase 1 (Day 1): Recent 90 Days**

- 200 × c2-std-4 × 24 hours
- Cost: $200 (preemptible)
- Output: Production-ready ML system

**Phase 2 (Days 2-31): Historical Data**

- 20 × c2-std-4 × 2 hours/day × 30 days
- Cost: $251 (regular VMs for reliability)
- Output: Complete 6-year dataset

**Total Cost:** $451
**Timeline:** Production-ready Day 1, complete by Day 31
**Best balance:** Speed + cost + validation

---

### Comparison: One-Time vs Incremental

| Approach                 | Machines    | Duration  | Cost (Regular) | Cost (Preemptible) | Production Ready |
| ------------------------ | ----------- | --------- | -------------- | ------------------ | ---------------- |
| **Massive Parallel**     | 500         | 24 hours  | **$4,009**     | **$802**           | Day 1            |
| **Optimized Sequential** | 300→250→100 | 24 hours  | $1,754         | $351               | Day 1            |
| **Hybrid (Recommended)** | 200→20      | 24h + 30d | $1,253         | $451               | Day 1 (partial)  |
| **Incremental**          | 20          | 30 days   | $291           | $58                | Day 30           |
| **Staged (Best)**        | 200→100→50  | 30 days   | $2,088         | $418               | Day 14           |

---

### Preemptible VM Considerations

**Savings:**

- Regular: 500 × c2-std-4 × 24h = $2,505
- Preemptible: 500 × c2-std-4 × 24h × 0.2 = **$501**
- **Savings: $2,004 (80% reduction)**

**Trade-off:**

- Can be preempted (interrupted) anytime
- Need retry logic
- Acceptable for batch processing
- Not recommended for time-sensitive operations

**Recommendation:** ✅ Use preemptible for backfill (retries acceptable, massive savings)

---

## **19. Resource Monitoring and C2 Machine Rightsizing**

### C2-Only Constraint

**GCP Quota Reality:** Only C2 machine types approved (c2-standard-4 minimum)

**Available C2 Options:**

- c2-standard-4: 4 vCPU, 16 GB RAM, $0.2088/hour ← **MINIMUM**
- c2-standard-8: 8 vCPU, 32 GB RAM, $0.4176/hour
- c2-standard-16: 16 vCPU, 64 GB RAM, $0.8352/hour

**Implications:**

- ❌ **Cannot downsize below c2-standard-4** (no e2/n2 options)
- ✅ Can upsize within C2 family as needed
- 🎯 **Goal shifts:** Prevent under-provisioning (not reduce costs via downsizing)
- 🎯 **Primary value:** Identify services needing MORE resources before failures occur

---

### Current Monitoring Implementation

**Infrastructure:**

- ✅ All services use `psutil` for cross-platform resource monitoring
- ✅ 11/13 services enable `enable_resource_monitoring=True`
- ✅ Metrics logged every 30 seconds (CPU, RAM, disk, network, process count)
- ✅ Automatic alerts for high usage (CPU > 90%, Memory > 90%, Disk > 90%)

**Gaps:**

- ❌ Metrics logged at DEBUG level (invisible in production)
- ❌ No API endpoint to aggregate resource usage per job
- ❌ No UI dashboard showing resource metrics
- ❌ No per-job average/peak resource usage tracking

---

### Machine Sizing Summary (C2-Only)

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
- **Focus:** Identifying services that need UPSIZING to prevent failures

**Services to Watch:**

- ⚠️ **features-delta-one** (75% RAM, 90% CPU) - May need c2-std-8 for larger datasets
- ✅ All others: Well-sized or constrained at minimum

---

### Solution: Date-Level Parallelization

**Since we can't downsize, maximize utilization instead:**

**Services with Low CPU (<40%):**

- instruments-service: 10% CPU → **Process 16 dates in parallel** → 90% CPU
- features-calendar: 10% CPU → **Process 16 dates in parallel** → 90% CPU
- ml-inference: 40% CPU → **Process 3 dates in parallel** → 85% CPU

**Implementation:** See [IMPLEMENTATION_MAX_WORKERS.md](IMPLEMENTATION_MAX_WORKERS.md)

**Impact:**

- 36% fewer VMs needed (2,555 → 1,628)
- 16x faster for low-utilization services
- **$387/year compute savings** OR same cost with 16x speed

---

### Enhanced Logging (Proposed)

**Update unified-trading-library PerformanceMonitor:**

```python
# At job end or every 5 minutes: Log summary at INFO
logger.info("Resource usage summary", extra={
    "resource_summary": {
        "duration_seconds": 300,
        "avg_cpu_percent": 45.2,
        "peak_cpu_percent": 78.0,
        "avg_memory_percent": 32.5,
        "peak_memory_percent": 52.0,
        "samples_collected": 10
    }
})

# Final summary at job completion
logger.info("Job resource usage final", extra={
    "resource_final": {
        "total_runtime_seconds": 1847,
        "avg_cpu_percent": 52.3,
        "peak_cpu_percent": 89.0,
        "avg_memory_percent": 38.7,
        "peak_memory_percent": 67.0,
        "recommended_machine": "c2-standard-4",
        "over_provisioned": False
    }
})
```

---

## **20. Combined Optimization Impact**

### Optimization Stack

| Optimization                      | Annual Savings                        | Implementation             |
| --------------------------------- | ------------------------------------- | -------------------------- |
| **1. GCS Lifecycle (Aggressive)** | **$1,500** (MVP) / **$10,900** (Full) | Apply lifecycle policy now |
| **2. Preemptible VMs**            | 80% of compute costs                  | Use for batch jobs         |
| **3. Date Parallelization**       | **$387** OR 16x speed                 | MAX_WORKERS implementation |
| **4. Paradise Batching**          | $3,000/year                           | Already implemented        |
| **5. Eliminate Egress**           | Up to $8,110/year                     | Use GCP-native tools       |
| **6. Analysis Optimization**      | $6,336/year                           | Cache queries, sample data |
| **Total Potential**               | **$1,859-11,287/year** (MVP to Full)  |                            |

---

### MVP (BTC + SPY) - Optimized Cost Structure

| Component                      | Before Optimization | After Optimization | Savings                |
| ------------------------------ | ------------------- | ------------------ | ---------------------- |
| Storage (with lifecycle)       | $1,968/year         | $468/year          | **$1,500/year**        |
| Compute (with parallelization) | $19,854/year        | $19,467/year\*     | **$387/year**          |
| Egress (use GCP tools)         | $8,110/year         | $811/year          | **$7,299/year**        |
| Analysis (caching)             | $10,167/year        | $3,551/year        | **$6,616/year**        |
| **Total**                      | **$40,099/year**    | **$24,297/year**   | **$15,802/year (39%)** |

\*Or keep compute cost same, get 16x faster completion

---

### Full MVP (11 Venues) - Optimized Cost Structure

| Component                | Before Optimization | After Optimization | Savings                |
| ------------------------ | ------------------- | ------------------ | ---------------------- |
| Storage (with lifecycle) | $14,000/year        | $3,100/year        | **$10,900/year**       |
| Compute                  | $23,000/year        | $14,720/year       | **$8,280/year**        |
| **Total**                | **$37,000/year**    | **$17,820/year**   | **$19,180/year (52%)** |

---

## **21. Timeline to Full Savings**

### Week 1 (3-Day Threshold)

**Transitions:** 90% of data → NEARLINE
**Monthly Savings:** ~$70 ($840/year)
**Cumulative:** 43% reduction

### Week 2 (14-Day Threshold)

**Transitions:** 80% of data → COLDLINE
**Monthly Savings:** ~$110 ($1,320/year)
**Cumulative:** 67% reduction

### Month 3 (90-Day Threshold)

**Transitions:** 80% of data → ARCHIVE
**Monthly Savings:** ~$132 ($1,583/year)
**Cumulative:** 80% reduction

**Full savings realized in 90 days!**

---

## **22. Cost Optimization Priorities**

### Immediate (This Week)

1. **Apply GCS lifecycle policy** → Save $1,500/year (MVP) or $10,900/year (Full)
2. **Fix CSV sampling default** → Enable MAX_WORKERS safely
3. **Use preemptible VMs** → Save 80% on batch jobs

### Short-Term (Next Month)

4. **Implement MAX_WORKERS** → Save $387/year OR 16x speed
5. **Add resource monitoring UI** → Prevent under-provisioning failures
6. **Use GCP-native tools** → Reduce egress by 90%

### Long-Term (Next Quarter)

7. **Cache analysis queries** → Save $3,516/year
8. **Sample data for experiments** → Save $6,336/year
9. **Continuous rightsizing** → Identify services needing c2-std-8

---

**This framework provides complete cost visibility and optimization path. Ready to implement!**
