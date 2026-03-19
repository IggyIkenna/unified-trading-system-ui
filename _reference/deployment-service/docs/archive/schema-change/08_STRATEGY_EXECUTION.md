# Strategy & Execution Services - GCS Schema Change

## Strategy Service

### Current Structure (prefix-value)

```
gs://strategy-store-{project}/
  strategy_instructions/
    {strategy_id}/
      day-2023-01-01/
        instructions.parquet
```

**Path Format:** `strategy_instructions/{strategy_id}/day-{date}/instructions.parquet`

**Levels:** 2 (strategy_id, day)

### Required for BigQuery (key=value)

```
gs://strategy-store-{project}/
  strategy_instructions/
    strategy_id={strategy_id}/
      day=2023-01-01/
        instructions.parquet
```

**Path Format:** `strategy_instructions/strategy_id={strategy_id}/day={date}/instructions.parquet`

**Changes:**

- Add `strategy_id=` prefix to folder
- `day-` → `day=`

**Structure:** UNCHANGED
**Change type:** FORMATTING ONLY

### Code Changes

**Estimated locations:** ~5

- Strategy output path
- Execution input path (reads instructions)
- deployment-service templates

---

## Execution Service

### Current Structure (prefix-value)

```
gs://execution-store-{project}/
  results/
    {date}/
      {strategy_id}/
        {instruction_type}/
          {run_id}/
            results.parquet
```

**Note:** Uses `{date}` not `day-{date}` (slightly different!)

### Required for BigQuery

```
gs://execution-store-{project}/
  results/
    date={date}/
      strategy_id={strategy_id}/
        instruction_type={instruction_type}/
          run_id={run_id}/
            results.parquet
```

**Changes:**

- `{date}` → `date={date}` (add prefix)
- `{strategy_id}` → `strategy_id={strategy_id}`
- `{instruction_type}` → `instruction_type={instruction_type}`
- `{run_id}` → `run_id={run_id}`

### Code Changes

**Estimated locations:** ~8

- Execution output paths
- deployment-service templates
- Any backtest analysis tools

---

## Combined Impact

**strategy-service:**

- Output: 1 location
- Input (ML predictions): Already updated

**execution-service:**

- Output: ~5 locations
- Input (strategy, market-tick): Must update

**Total:** ~15 locations across both services

---

## Breaking Changes

**Severity:** LOW (limited consumers)

**Affected:**

- Strategy → Execution pipeline
- Backtest analysis tools
- deployment-service

**Risk:** LOW - fewer dependencies than data services
