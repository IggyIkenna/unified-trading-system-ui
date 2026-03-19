# Live Mode (UTD v3)

Live mode is the deployment mode for **long-running services** (e.g. Cloud Run Services, always-on containers) as opposed to **batch** one-off jobs (Cloud Run Jobs, VMs that exit when done). The same deployment machinery is used; only how missing data is checked and how job/service completion is monitored differ.

**Design principle:** Abstract as much from batch as possible; only override where needed (the two seams below). Do not omit shared code where relevant—reuse batch code everywhere (config loader, shard builder, catalog, backend selection, refresh loop); override only at GCS path resolution and status-fetch. No duplicate orchestration. Mode is parameterized via `deployment_mode` in state and `--mode` in CLI/API.

**Codex:** See [04-architecture/batch-live-symmetry.md](../../unified-trading-codex/04-architecture/batch-live-symmetry.md) and [04-architecture/deployment-topology-diagrams.md](../../unified-trading-codex/04-architecture/deployment-topology-diagrams.md) for the 4 seams (data inbound, data outbound, persistence thread, trigger) and topology.

---

## Shared Code vs Mode-Specific Overrides

| Component               | Shared?     | Notes                                                                                                                                                                    |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Config loader           | ✅ Shared   | Same `config_loader`, service configs, sharding YAML.                                                                                                                    |
| Shard builder           | ✅ Shared   | Same `shard_builder`; `cli_flags` in config supply `--operation` and `--mode` per service.                                                                               |
| Catalog                 | ✅ Shared   | Same `catalog` for bucket/path templates and dimensions.                                                                                                                 |
| Backend selection       | ✅ Shared   | Same backends (Cloud Run, VM, etc.); only which API is called for status differs.                                                                                        |
| Refresh loop structure  | ✅ Shared   | Same refresh endpoint and flow; branch only on `deployment_mode` to choose status source.                                                                                |
| **GCS path resolution** | ❌ Override | **Seam 1:** Batch = no prefix; live = `live/` prefix. Applied in CLI `data-status`, API `data_status.py` (and turbo), and cache key.                                     |
| **Status-fetch step**   | ❌ Override | **Seam 2:** Batch = Jobs API (executions) or VM status; live = Cloud Run Services API (revisions, Ready condition). Applied in `api/routes/deployments.py` refresh path. |

---

## When to Use Live Mode

- **Batch:** Historical backfills, scheduled daily jobs, date-scoped processing. Data is read from/written to GCS under `by_date/day=YYYY-MM-DD/` (or service-specific prefixes). Completion is tracked via **Cloud Run Jobs** (executions) or VM status.
- **Live:** Long-running pipelines where the **live data sink** persists asynchronously to GCS (e.g. under a `live/` prefix). Completion is tracked via **Cloud Run Services** (revisions, health), not Jobs.

Use **live** when you are running services that stream or process in real time and persist to GCS on a separate thread; use **batch** for historical or date-loop workloads.

---

## data-status `--mode live`

Data-status checks **what data exists** in GCS. For batch, it checks historical paths (e.g. `instrument_availability/by_date/day=...`, `raw_tick_data/by_date/day=...`). For live, it checks the **persisted output of the live data sink** (same buckets, under a `live/` prefix).

### Convention

- **Batch:** Paths like `raw_tick_data/by_date/day=2024-01-15/...`, `processed_candles/by_date/day=...`, etc.
- **Live:** Same structure under `live/`: e.g. `live/raw_tick_data/by_date/day=...`, `live/processed_candles/...`. The persistence thread (or BroadcastSink persistence) writes under this prefix.

### CLI

```bash
# Batch (default): historical by_date paths
python -m deployment_service data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-01-31

# Live: persisted live sink paths (live/ prefix)
python -m deployment_service data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-01-31 --mode live
```

### API

- **GET /api/data-status:** Query param `mode=batch` (default) or `mode=live`.
- **GET /api/data-status/turbo:** Query param `mode=batch` (default) or `mode=live`.

Same listing/counting logic is used; only the GCS path resolution differs (batch vs `live/` prefix).

---

## Live Job / Service Monitoring

For **batch** deployments, the refresh loop uses the **batch status path**: e.g. Cloud Run Jobs API `get_status_batch(execution_ids)` to see if each job execution has succeeded or failed.

For **live** deployments, the refresh loop uses the **live status path**: it checks **Cloud Run Services** (revisions, readiness) instead of Jobs. There are no one-off execution IDs; the deployment is represented by a long-running service and its revisions.

### How It Works

1. **State:** Deployment state has a `deployment_mode` field: `"batch"` (default) or `"live"`.
2. **Refresh:** When the UI or API calls **POST /api/deployments/{id}/refresh**:
   - If `deployment_mode == "live"` and `compute_type == "cloud_run"`, the backend calls the **Cloud Run Services API** (get service, list revisions, check Ready condition). It updates shard/state status from revision health.
   - Otherwise it uses the existing **batch** path (Jobs API or VM status).
3. **Deploy request:** Optional `mode` field on the deploy request (`"batch"` | `"live"`) is stored in state so refresh uses the correct path.

Service name for live is taken from `state.config.service_name` or `state.service`; region from `state.config.region` or default.

---

## Summary

| Aspect                    | Batch                                    | Live                                      |
| ------------------------- | ---------------------------------------- | ----------------------------------------- |
| **Data paths**            | `by_date/day=...` (and service-specific) | `live/` + same structure                  |
| **data-status**           | `--mode batch` (default)                 | `--mode live`                             |
| **Completion monitoring** | Jobs API (executions) or VM status       | Cloud Run Services API (revisions, Ready) |
| **State**                 | `deployment_mode: "batch"`               | `deployment_mode: "live"`                 |

Shared code (config loader, shard builder, catalog, backend selection, refresh loop structure) is reused; only path resolution and the status-fetch step are mode-specific.

---

## Docker and CLI Compatibility

- **Terraform / Docker:** UTD v3 invocations (Terraform, configs) pass `--operation` and `--mode` to service containers. Example: `args: ["--operation", "instrument", "--mode", "batch"]` or `["--operation", "execute", "--mode", "live"]`. Service images must accept these flags (per codex CLI standards).
- **Deploy API:** Request body accepts optional `mode` (`"batch"` \| `"live"`); stored in deployment state and used by the refresh endpoint to choose Jobs API vs Services API.

---

## Backwards Compatibility

- **Services:** All pipeline services accept `--operation <op>` and `--mode batch|live` (and other CLI args). Existing images continue to work.
- **UTD v3:** Uses the new structure (state with `deployment_mode`, data-status with `mode` query/flag, refresh branching on mode). No change required to existing batch-only usage; `mode` defaults to `batch` when omitted.
