# ML Services - GCS Schema Change

## ML Training & Inference (CONSUMERS ONLY - No Output Path Changes)

### ml-training-service

**Current GCS Reads:**

- Features: `by_date/day-{date}/feature_group-{group}/timeframe-{tf}/{inst}.parquet`
- Calendar: `calendar/{category}/by_date/day-{date}/features.parquet`

**New GCS Reads:**

- Features: `by_date/day={date}/feature_group={group}/timeframe={tf}/{inst}.parquet`
- Calendar: `calendar/category={category}/by_date/day={date}/features.parquet`

**Code Changes:**

- `gcs_feature_reader.py`: Update path construction (~5 lines)
- `cloud_feature_provider.py`: No changes (uses reader)

**GCS Outputs (Unchanged):**

- Stage 1: `stage1-preselection/model-{id}/training-period-{period}/selected_features.json`
- Stage 2: `stage2-hyperparams/model-{id}/training-period-{period}/best_hyperparams.json`
- Models: `models/{model_id}/training-period-{period}/model.joblib`

**No changes to ML outputs!** Only input path reading changes.

---

### ml-inference-service

**Current GCS Reads:**

- Features: Same as ml-training
- Models: `models/{model_id}/training-period-{period}/model.joblib`

**New GCS Reads:**

- Features: Same updated paths as ml-training

**Code Changes:**

- `feature_subscriber.py`: Update path construction (~3 lines)

**GCS Outputs (Unchanged):**

- Predictions: `predictions/batch/{date}/{prediction_id}.parquet`

**No changes to inference outputs!** Only feature input paths.

---

## Strategy & Execution Services (NO CHANGES)

**strategy-service:**

- Reads: ML predictions (path unchanged)
- Writes: Strategy instructions (path unchanged)
- **Impact:** NONE

**execution-service:**

- Reads: Strategy instructions, market-tick, instruments
- Market-tick path changes affect execution
- **Impact:** Update market-tick path construction (~5 locations)

---

## Summary: ML Services

**Output paths:** UNCHANGED (no migration needed for ML outputs)
**Input paths:** Must update to read new formats
**Severity:** LOW (simple find/replace in ~15 locations)

**ML pipeline outputs are NOT affected by this migration!**
