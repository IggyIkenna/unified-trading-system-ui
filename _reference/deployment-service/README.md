# deployment-engine

Deployment orchestration engine for the unified trading system. Extracted from `deployment-service`.

## What it does

- Orchestrates T+1 batch jobs with dependency graph and cascade failure propagation
- Tracks data completion across services via the data catalog
- Loads YAML sharding configuration (venues, services, cloud providers)
- Provides cloud-agnostic storage operations
- Verifies infrastructure connectivity (Layer 2 gate) before deployments

## Structure

```
deployment_engine/
    orchestrator.py     — T+1 job orchestration
    catalog.py          — Data completion tracking
    config_loader.py    — YAML config loading
    cloud_client.py     — Cloud-agnostic storage
    monitor.py          — Deployment progress monitoring
    shard_builder.py    — Shard construction
    shard_calculator.py — Shard calculation
    backends/           — Cloud execution backends (GCP, AWS)
scripts/
    verify_infra.py     — Layer 2 infra connectivity verification
```

## Usage

```bash
# Install
uv pip install -e ".[dev]"

# Verify infrastructure
python scripts/verify_infra.py --project-id my-project

# Run quality gates
bash scripts/quality-gates.sh
```

## Dependencies

- `unified-trading-library` — cloud primitives, event logging
- Arch tier: devops | Merge level: 6

## Related repos

- `deployment-api` — thin FastAPI that imports this package; exposes `/infra/health`
- `deployment-ui` — React UI for deployment management
- `system-integration-tests` — Layer 3a/3b smoke tests triggered post-deploy
