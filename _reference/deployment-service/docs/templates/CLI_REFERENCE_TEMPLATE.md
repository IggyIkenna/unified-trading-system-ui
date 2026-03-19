# {Service Name} CLI Reference

## Usage

```bash
python -m {service_package}.cli.main [OPTIONS]
```

Or using the installed console script:

```bash
{console-script} [OPTIONS]
```

## Commands

### Main Command: batch (--operation & --mode)

Process data in batch mode (per codex cli-standards).

```bash
{console-script} --operation <op> --mode batch [OPTIONS]
```

### Check Dependencies: `check-deps`

Validate upstream dependencies exist.

```bash
{console-script} check-deps --category CEFI --date 2024-01-15
```

### Health Check: `health`

Check service health status.

```bash
{console-script} health
```

## Required Arguments

| Argument       | Description                    | Values                                |
| -------------- | ------------------------------ | ------------------------------------- |
| `--operation`  | What to run (service-specific) | e.g. `instrument`, `fetch`, `compute` |
| `--mode`       | How to run                     | `batch`, `live`                       |
| `--category`   | Market category                | `CEFI`, `TRADFI`, `DEFI`              |
| `--start-date` | Start date                     | `YYYY-MM-DD`                          |
| `--end-date`   | End date                       | `YYYY-MM-DD`                          |

## Optional Arguments

### Meta Arguments (Standardized)

| Argument        | Description                                  | Default  |
| --------------- | -------------------------------------------- | -------- |
| `--force`       | Force overwrite existing outputs             | `false`  |
| `--log-level`   | Logging level                                | `INFO`   |
| `--dry-run`     | Write to local `data/sample/` instead of GCS | `false`  |
| `--max-workers` | Parallel processing workers                  | `4`      |
| `--max-results` | Limit output files per run                   | No limit |

### Service-Specific Arguments

| Argument                  | Description                  | Default         |
| ------------------------- | ---------------------------- | --------------- |
| `--venue`                 | Specific venue               | All venues      |
| `--feature-group`         | Feature group to process     | All groups      |
| `--timeframe`             | Base timeframe               | Service default |
| `--skip-dependency-check` | Skip upstream validation     | `false`         |
| `--fail-on-missing-deps`  | Fail if dependencies missing | `true`          |

## Examples

### Basic Batch Processing

```bash
python -m {service_package}.cli.main \
    --operation <op> \
    --mode batch \
    --category CEFI \
    --start-date 2024-01-01 \
    --end-date 2024-01-31
```

### Process Specific Venue

```bash
python -m {service_package}.cli.main \
    --operation <op> \
    --mode batch \
    --category CEFI \
    --venue BINANCE-FUTURES \
    --start-date 2024-01-01 \
    --end-date 2024-01-31
```

### Dry Run (Local Output)

```bash
python -m {service_package}.cli.main \
    --operation <op> \
    --mode batch \
    --category CEFI \
    --start-date 2024-01-01 \
    --end-date 2024-01-01 \
    --dry-run
```

### Force Reprocess with Debug Logging

```bash
python -m {service_package}.cli.main \
    --operation <op> \
    --mode batch \
    --category TRADFI \
    --start-date 2024-01-01 \
    --end-date 2024-01-07 \
    --force \
    --log-level DEBUG
```

### Check Dependencies

```bash
python -m {service_package}.cli.main check-deps \
    --category CEFI \
    --date 2024-01-15
```

## Sharding Integration

This service integrates with the deployment sharding system in `deployment-service`:

```bash
# Calculate shards
python deploy.py calculate --service {service-name} \
    --start-date 2024-01-01 --end-date 2024-01-31

# Deploy shards
python deploy.py deploy --service {service-name} \
    --start-date 2024-01-01 --end-date 2024-01-31 \
    --compute cloud_run
```

Sharding dimensions (from `configs/sharding.{service-name}.yaml`):

- `category`: CEFI, TRADFI, DEFI
- `venue`: Exchange-specific (hierarchical)
- `date`: Daily partitioning

## Exit Codes

| Code | Meaning                 |
| ---- | ----------------------- |
| 0    | Success                 |
| 1    | Error (check logs)      |
| 2    | Dependency check failed |
| 130  | Interrupted (Ctrl+C)    |

## Environment Variables

See `.env.example` for configuration options:

```bash
# Cloud Provider
CLOUD_PROVIDER=gcp

# GCP Configuration
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Service Configuration
{SERVICE}_GCS_BUCKET_CEFI={service}-store-cefi-{project_id}
{SERVICE}_GCS_BUCKET_TRADFI={service}-store-tradfi-{project_id}
{SERVICE}_GCS_BUCKET_DEFI={service}-store-defi-{project_id}
```

## Related Documentation

- [CONFIGURATION.md](CONFIGURATION.md) - Configuration options
- [DEPENDENCIES.md](DEPENDENCIES.md) - Upstream/downstream dependencies
- [deployment-service/configs/sharding.{service-name}.yaml](../deployment-service/configs/) - Sharding configuration
