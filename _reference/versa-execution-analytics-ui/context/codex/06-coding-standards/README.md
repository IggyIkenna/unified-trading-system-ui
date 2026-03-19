# Coding Standards

## TL;DR

All services follow a unified set of coding standards enforced by quality gates, pre-commit hooks, and Cursor rules. The
key rules: no `os.getenv()` / `os.environ.get()` / `os.environ[KEY]` (use `UnifiedCloudConfig` for config values,
`get_secret_client()` for secrets), no bare `except:` (use `@handle_api_errors`), no `print()` (use `logging`), no naive
datetimes (use UTC), imports at top of file, ruff for formatting/linting. Quality gates run in two phases (auto-fix then
verify) and must pass before quickmerge. The 51-point production readiness checklist governs all services.

**Cloud provider SSOT:**

- `CLOUD_PROVIDER=gcp|aws|local` is the single source of truth for which cloud is active. Read it via
  `get_cloud_provider()` from `unified_cloud_interface.constants` — never call `os.getenv("CLOUD_PROVIDER")` in service
  code.
- Use `GCP_PROJECT_ID` (not `GOOGLE_CLOUD_PROJECT`) everywhere. `GOOGLE_CLOUD_PROJECT` is banned; quality gates enforce
  this.
- `unified_cloud_interface/constants.py` and `unified_cloud_interface/factory.py` are the ONLY files allowed to read
  `CLOUD_PROVIDER` directly from env (they are the bootstrap layer).

**Bootstrap Phase Exception:**

Some modules access `os.environ` directly during the bootstrap phase before the configuration system is initialized.
These are intentional, documented exceptions to the no-`os.environ` rule:

| Location                                                                                                                                            | Variable(s)                                                                                                           | Reason                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `unified-config-interface/__init__.py` — `_resolve_config_store_bucket()`                                                                           | `CONFIG_STORE_BUCKET`                                                                                                 | Resolves the GCS bucket for the config store itself; runs before any `UnifiedCloudConfig` exists                          |
| `unified-cloud-interface/constants.py` — `get_cloud_provider()`, `get_project_id()`, `get_region()`, `get_bigquery_location()`, `get_bucket_name()` | `CLOUD_PROVIDER`, `GCP_PROJECT_ID`, `AWS_ACCOUNT_ID`, `GCS_REGION`, `AWS_REGION`, `BIGQUERY_LOCATION`, `*_GCS_BUCKET` | Root bootstrap layer — `unified-cloud-interface` IS the bootstrap; `UnifiedCloudConfig` does not yet exist when these run |
| `unified-cloud-interface/factory.py` — `_detect_secrets_provider()`, `_detect_credentials_path()`, `_detect_aws_profile()`                          | `SECRETS_CLOUD_PROVIDER`, `GOOGLE_APPLICATION_CREDENTIALS`, `AWS_PROFILE`                                             | Pre-config client construction; cloud credentials must be resolved before any config client is created                    |
| `deployment-service/config_loader.py` — `load_runtime_topology_config()`                                                                            | `RUNTIME_TOPOLOGY_PATH`, `WORKSPACE_ROOT`                                                                             | Filesystem path discovery for the topology file that feeds the config system itself                                       |

All other `os.environ` / `os.getenv()` access in service code is banned. Use `get_config_store()` or a
`UnifiedCloudConfig` subclass exclusively.

**Cloud SDK isolation (hard-fail CI):**

- **STEP 5.10:** Direct cloud SDK imports (`from google.cloud`, `import boto3`, `import botocore`) are banned outside
  `unified_cloud_interface/providers/`. Violations cause exit 1. Route all cloud I/O through `unified-cloud-interface`
  (`get_storage_client()`, `get_secret_client()`, `get_queue_client()`).
- **STEP 5.11:** Protocol-leaking symbols (`CloudTarget`, `gcs_bucket`, `upload_to_gcs_batch`, `bigquery_dataset`,
  `StandardizedDomainCloudService`) are banned in service and library code. Violations cause exit 1. Use
  `get_data_sink()` / `get_event_bus()` from UCI instead. See [intent-level-api-pattern.md](intent-level-api-pattern.md)
  for migration guide and routing_key convention. Exceptions require an entry in `QUALITY_GATE_BYPASS_AUDIT.md` at the
  workspace root.

**Status:** [IMPLEMENTED] and enforced across all 14 services.

---

## Document Map

| Topic                                           | Canonical Doc                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Running quality gates / CI setup                | [quality-gates.md](quality-gates.md)                                                       |
| Developer formatting setup (VSCode, pre-commit) | [formatting-standards.md](formatting-standards.md)                                         |
| Forbidden code patterns                         | [STANDARDS.md](STANDARDS.md)                                                               |
| Config class patterns                           | [configuration-management.md](configuration-management.md)                                 |
| Testing patterns                                | [testing.md](testing.md)                                                                   |
| Integration testing layers (0–3)                | [integration-testing-layers.md](integration-testing-layers.md)                             |
| File/function size limits                       | [file-splitting-guide.md](file-splitting-guide.md)                                         |
| Error handling                                  | [error-handling.md](error-handling.md)                                                     |
| Workspace dependency pinning                    | [dependency-management.md](dependency-management.md) (§ Workspace-wide dependency pinning) |
| Contribution workflow                           | [contribution-guide.md](contribution-guide.md)                                             |
| Strategy data access & event-driven rules       | [09-strategy/config-architecture.md](../09-strategy/cross-cutting/config-architecture.md)  |

---

## Quality Gates Structure (Centralized Base Scripts)

All per-repo `scripts/quality-gates.sh` files are **thin config stubs** — never full implementations. The shared gate
logic lives in `unified-trading-pm/scripts/quality-gates-base/` which is the SSOT for all gate checks.

### Base script locations

```
unified-trading-pm/scripts/quality-gates-base/
├── base-service.sh   # Services (FastAPI apps, workers, APIs) — sourced by all service repos
├── base-library.sh   # Libraries and interfaces — sourced by all library/interface repos
├── base-codex.sh     # Docs-only repos (no Python source) — sourced by codex and docs repos
├── base-ui.sh        # TypeScript/React UI repos — sourced by all 11 UI repos
└── README.md         # Stub templates, version bump protocol, new-repo setup instructions
```

### Per-repo stub — canonical shape

Each `scripts/quality-gates.sh` declares only the repo-specific variables then sources the appropriate base:

```bash
#!/usr/bin/env bash
# Repo-specific settings only. Body: unified-trading-pm/scripts/quality-gates-base/base-service.sh
SERVICE_NAME="my-service"
SOURCE_DIR="my_service"
MIN_COVERAGE=70
RUN_INTEGRATION=false
PYTEST_WORKERS=${PYTEST_WORKERS:-2}
LOCAL_DEPS=()
WORKSPACE_ROOT="$(cd "$(git rev-parse --show-toplevel)/.." && pwd)"
source "${WORKSPACE_ROOT}/unified-trading-pm/scripts/quality-gates-base/base-service.sh"
```

### Rules

- **Never put gate logic in a per-repo quality-gates.sh.** Config variables only; body stays in PM.
- **To add a new check for all repos**, edit the appropriate base script in PM — no per-repo commits needed.
- **New-repo setup**: copy the stub template for your repo type from
  `unified-trading-pm/scripts/quality-gates-base/README.md`. Fill in the required variables. Do not copy any gate logic.

| Repo type | Base script       | Required variables                                              |
| --------- | ----------------- | --------------------------------------------------------------- |
| Service   | `base-service.sh` | `SERVICE_NAME`, `SOURCE_DIR`, `MIN_COVERAGE`, `RUN_INTEGRATION` |
| Library   | `base-library.sh` | `SOURCE_DIR`, `MIN_COVERAGE`                                    |
| Docs-only | `base-codex.sh`   | `SERVICE_NAME`                                                  |
| UI        | `base-ui.sh`      | none (self-describing via `package.json`)                       |

---

## Core Principles

1. **Consistency over preference.** Every service uses the same patterns, same tools, same config structure.
2. **Fix root cause, never shortcut.** When quality gates fail, diagnose and fix -- never skip tests, add `|| true`, or
   disable checks.
3. **Cloud-agnostic by default.** Use unified-trading-services abstractions. No direct GCP/AWS imports.
4. **UTC everywhere.** All datetime operations use UTC-aware datetimes. No naive datetime objects.
5. **Config via classes, not env vars.** All configuration flows through `UnifiedCloudConfig` subclasses (from
   unified-config-interface).

---

## Standards Summary

| Standard                    | Rule                                                                                                                      | Enforcement                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Python version**          | **`>=3.13,<3.14`** (hard requirement)                                                                                     | `pyproject.toml`, quality gates                                         |
| Formatting                  | ruff format (same version everywhere)                                                                                     | Prek hooks, quality gates                                               |
| Linting                     | ruff check (E, F, W, I rules)                                                                                             | Pre-commit hooks, quality gates                                         |
| Config                      | Extend `UnifiedCloudConfig` from `unified_config_interface`                                                               | Checklist item 03b                                                      |
| Error handling              | Use `@handle_api_errors`, `@handle_storage_errors`                                                                        | Checklist item 04b                                                      |
| Logging                     | `setup_events()` or `setup_service()` + `log_event()` (unified_events_interface / unified_trading_services); no `print()` | Checklist item 04, event-logging.mdc                                    |
| Event logging               | `log_event()` for lifecycle/domain events                                                                                 | `test_event_logging.py`                                                 |
| Datetimes                   | UTC-aware everywhere                                                                                                      | Checklist item 04f                                                      |
| Imports                     | All at top of file, grouped                                                                                               | `.cursorrules`                                                          |
| Testing                     | `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/smoke/`                                                         | Quality gates                                                           |
| Git workflow                | Quickmerge with `--files`, no direct push                                                                                 | Branch protection                                                       |
| Dependencies                | Pinned in `pyproject.toml`, dev deps separate                                                                             | Checklist item 02                                                       |
| Exit codes                  | Non-zero on any failure                                                                                                   | Checklist item 04g                                                      |
| Cloud-agnostic              | `get_storage_client()`, `get_secret_client()`, `get_compute_backend()`                                                    | Checklist item 06b                                                      |
| Secrets                     | `get_secret_client()`, never hardcoded                                                                                    | Checklist item 05                                                       |
| Schema validation           | `validate_timestamp_date_alignment()` before upload                                                                       | Checklist item 22c                                                      |
| **unified-api-contracts**   | Use unified-api-contracts schemas for external API responses; no `dict[str, Any]`                                         | Codex 02-data/unified-unified-api-contracts-chain.md                    |
| **Zero-baseline typecheck** | `.basedpyright-baseline.json` must be absent — all repos must have zero basedpyright errors without baseline suppression  | STEP 5.22 in `quality-gates-base/base-service.sh` and `base-library.sh` |

---

## Package Manager Standard: uv

**ALL services use `uv` for Python package management** (not pip):

```bash
# Dockerfiles
RUN uv pip install --system -e ".[dev]"

# Local development
uv pip install -e ".[dev]"

# CI (GitHub Actions)
uv pip install -e ".[dev]"
```

**Benefits of uv:**

- 10-100x faster than pip
- Deterministic resolution (creates `uv.lock`)
- Better error messages
- Native `pyproject.toml` support
- Cross-platform consistency

**Migration:** Change all `pip install` to `uv pip install` in Dockerfiles, scripts, and docs.

See also: `04-architecture/cloud-agnostic-architecture.md` → Docker Base Image Inheritance

---

## Docker Standards

**ALL Python services MUST use the shared Artifact Registry base image** (except UI repos which are Node.js/React):

```dockerfile
ARG PROJECT_ID
FROM --platform=linux/amd64 asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-library/unified-trading-library:latest

COPY pyproject.toml .
COPY <package_dir>/ ./<package_dir>/

RUN uv pip install --system --no-cache-dir -e .
```

**What the shared base provides:**

- Python 3.13
- `uv` package manager (pre-installed — never `RUN pip install uv`)
- `ripgrep` (for quality gates)
- `curl`, `ca-certificates`
- `gcsfuse` + Google Cloud SDK

**Benefits:**

- Consistent environment across all services
- No redundant installs (ripgrep, uv, cloud SDK)
- Faster builds (shared layers via Artifact Registry content-addressing)
- Simplified Dockerfiles

See: `06-coding-standards/dockerfile-standards.md` for full spec.

---

## Configuration Standards [IMPLEMENTED]

### The Pattern (Post-Consolidation Feb 2026)

Every service MUST have a config class extending `UnifiedCloudConfig` from unified-config-interface:

- **UnifiedCloudConfig** extends **BaseConfig** (unified-config-interface)
- BaseConfig provides: .env loading, validation, service_name, project_id, environment
- UnifiedCloudConfig adds: 600+ GCP/AWS cloud fields, API secrets, resource management
- Load config via `load_config()` or ConfigStore; validate via `validate_config_for_startup()`

```python
# {service}/config.py
from unified_config_interface import UnifiedCloudConfig
from pydantic import Field, AliasChoices

class MyServiceConfig(UnifiedCloudConfig):
    my_field: str = Field(
        default="value",
        validation_alias=AliasChoices("MY_FIELD", "LEGACY_NAME"),
    )

# Singleton pattern
_config: MyServiceConfig | None = None

def get_service_config() -> MyServiceConfig:
    global _config
    if _config is None:
        _config = MyServiceConfig()
    return _config
```

### Anti-Patterns

```python
# WRONG: os.getenv anywhere outside config.py
project_id = os.getenv("GCP_PROJECT_ID", "")

# WRONG: get_config with empty fallback
project_id = get_config("GCP_PROJECT_ID", "")

# WRONG: hardcoded fallback
project_id = get_config("GCP_PROJECT_ID", "test-project")

# WRONG: own BaseSettings not extending UnifiedCloudConfig
class MyConfig(BaseSettings):
    pass

# CORRECT: direct attribute access from config singleton
from my_service.config import get_service_config
config = get_service_config()
project_id = config.gcp_project_id
```

---

## Bootstrap Phase Exception

> **Anchor:** `#bootstrap-phase-exception` — referenced from source code comments.

Some modules in the core infrastructure tier access `os.environ` directly during the bootstrap phase, before the
configuration system (`UnifiedCloudConfig`) has been initialized. These are intentional, reviewed exceptions — not
violations of the no-`os.environ` rule.

### What qualifies as a bootstrap phase exception

A location qualifies if ALL of the following are true:

1. The `os.environ` read happens in a module that IS the configuration infrastructure (UCI, unified-config-interface) OR
   runs before any `UnifiedCloudConfig` instance can exist.
2. The value cannot be placed inside a `UnifiedCloudConfig` field because the field system itself depends on the value
   being resolved first.
3. The exception is documented here AND in the repo's `QUALITY_GATE_BYPASS_AUDIT.md`.
4. An inline comment citing this section is present at every bootstrap `os.environ` call.

### Approved bootstrap exceptions (2026-03-08)

| Module                                                                                                                                              | Variables read                                                                                                        | Justification                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `unified-config-interface/__init__.py` — `_resolve_config_store_bucket()`                                                                           | `CONFIG_STORE_BUCKET`                                                                                                 | Config store bucket must be known to initialize the config store itself           |
| `unified-cloud-interface/constants.py` — `get_cloud_provider()`, `get_project_id()`, `get_region()`, `get_bigquery_location()`, `get_bucket_name()` | `CLOUD_PROVIDER`, `GCP_PROJECT_ID`, `AWS_ACCOUNT_ID`, `GCS_REGION`, `AWS_REGION`, `BIGQUERY_LOCATION`, `*_GCS_BUCKET` | UCI is the bootstrap layer; no config class exists before these functions run     |
| `unified-cloud-interface/factory.py` — `_detect_secrets_provider()`, `_detect_credentials_path()`, `_detect_aws_profile()`                          | `SECRETS_CLOUD_PROVIDER`, `GOOGLE_APPLICATION_CREDENTIALS`, `AWS_PROFILE`                                             | Cloud credentials resolved at client construction time; pre-config initialization |
| `deployment-service/config_loader.py` — `load_runtime_topology_config()`                                                                            | `RUNTIME_TOPOLOGY_PATH`, `WORKSPACE_ROOT`                                                                             | Locates the topology file that the config system itself reads                     |

### Required inline comment pattern

Every bootstrap `os.environ` access must have this comment immediately above it:

```python
# Bootstrap phase: direct os.environ access is intentional here.
# <One sentence explaining why UnifiedCloudConfig cannot be used yet.>
# See: unified-trading-codex/06-coding-standards/README.md#bootstrap-phase-exception
```

### How to request a new exception

Open a PR to this document adding a row to the table above. The PR must include:

- The inline comment added to the source location.
- An entry in the repo's `QUALITY_GATE_BYPASS_AUDIT.md`.
- A one-sentence justification that satisfies criterion (2) above.

---

## Error Handling Standards [IMPLEMENTED]

### The Pattern

```python
from unified_trading_services import handle_api_errors, handle_storage_errors

@handle_api_errors(max_retries=3)
async def fetch_external_data():
    return await make_api_call()

@handle_storage_errors(max_retries=2)
async def write_to_storage():
    return await upload_data()
```

### Anti-Patterns

```python
# WRONG: bare except
try:
    do_something()
except:
    pass

# WRONG: catch-all with only logging
try:
    do_something()
except Exception as e:
    logger.error(e)

# WRONG: custom retry decorator
@my_custom_retry(attempts=3)
def fetch_data():
    pass

# WRONG: hardcoded retry counts outside config
MAX_RETRIES = 5  # Should be in config
```

---

## Logging Standards [IMPLEMENTED]

```python
from unified_events_interface import setup_events, log_event
from unified_trading_services import GracefulShutdownHandler

def main():
    setup_events(service_name="my-service", mode="batch")
    # Or: from unified_trading_services import setup_service, GCSEventSink, log_event (with sink config)
    shutdown_handler = GracefulShutdownHandler(cleanup_callback=cleanup)
    log_event("STARTED")
    # ... service logic ...
```

Requirements:

- Lifecycle events via `log_event()` from unified_events_interface (or UTS wrapper). See
  `.cursor/rules/event-logging.mdc`.
- JSON format for Cloud Logging; third-party loggers suppressed to WARNING
- SIGTERM/SIGINT handlers for graceful shutdown
- No `print()` statements for logging

---

## UTC Datetime Compliance [IMPLEMENTED]

| Pattern        | Correct                                                  | Wrong                       |
| -------------- | -------------------------------------------------------- | --------------------------- |
| Current time   | `datetime.now(timezone.utc)`                             | `datetime.now()`            |
| From timestamp | `datetime.fromtimestamp(x, tz=timezone.utc)`             | `datetime.fromtimestamp(x)` |
| Constructor    | `datetime(Y, M, D, tzinfo=timezone.utc)`                 | `datetime(Y, M, D)`         |
| Pandas         | `pd.to_datetime(x, utc=True)`                            | `pd.to_datetime(x)`         |
| Parse string   | `datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)` | `datetime.strptime(s, fmt)` |
| Deprecated     | --                                                       | `datetime.utcnow()`         |

Exception: `.replace(tzinfo=None)` allowed ONLY for downstream library compatibility (e.g., yfinance). Must include
comment: `# TZ-NAIVE: intentional for {library} compatibility`

---

## Import Organization [IMPLEMENTED]

All imports at the top of the file, grouped:

```python
# 1. Standard library
import asyncio
import sys
from datetime import datetime, timezone

# 2. Third-party
import pandas as pd
from pydantic import Field

# 3. Local / project
from unified_events_interface import setup_events, log_event
from my_service.config import get_service_config
```

Never import inside functions (executed every call). Exception: circular dependency issues (rare, must be documented).

---

## Cloud-Agnostic Design [IMPLEMENTED]

```python
# WRONG: direct GCP import
from google.cloud import storage
client = storage.Client()

# CORRECT: cloud-agnostic abstraction
from unified_trading_services import get_storage_client, get_secret_client, get_compute_backend

# Storage operations
client = get_storage_client()  # Auto-detects GCP/AWS from CLOUD_PROVIDER env

# Secret management
secrets = get_secret_client()

# Compute operations (deployment service / orchestrator)
backend = get_compute_backend(backend_type="vm")  # Compute Engine or EC2
job = backend.deploy_shard(shard_id="...", docker_image="...", ...)
```

Required abstractions:

- `get_storage_client()` instead of `google.cloud.storage` or `boto3.client('s3')`
- `get_secret_client()` instead of `secretmanager` or `boto3.client('secretsmanager')`
- `get_query_client()` instead of BigQuery or Athena
- `get_compute_backend()` instead of direct Compute Engine/Cloud Run or EC2/ECS APIs
- No hardcoded GCP project IDs -- use `config.gcp_project_id` or `config.cloud_project_id`
- No hardcoded bucket names -- use `config.{bucket_field}`

---

## Service Structure Requirements [IMPLEMENTED]

Every service MUST have:

```
{service}/
  {service_snake_case}/     # Source code
    config.py               # Config class extending UnifiedCloudConfig (from UCI)
    paths.py                # Centralized paths/constants
    models.py               # Domain models / typed structures
    schemas.py              # Service-owned schema definitions
    cli/                    # CLI entry points
  tests/
    unit/                   # Fast, mocked tests
    integration/            # API mocking tests
    e2e/                    # Full workflow tests
    smoke/                  # Shard combinatorics validation
  scripts/
    quality-gates.sh        # Quality gate runner
    quickmerge.sh           # Git workflow
    setup.sh                # Local dev setup
  Dockerfile                # Multi-stage build
  cloudbuild.yaml           # Quality gates before Docker build
  .github/workflows/
    quality-gates.yml       # CI/CD tests
  pyproject.toml            # Dependencies pinned
  config.yaml               # Service config defaults/overrides (if used)
  .env.example              # All required env vars documented
  .python-version           # Local Python toolchain pin
  .pre-commit-config.yaml   # Ruff, trailing whitespace (installed via prek)
```

---

## Production Readiness Checklist

The 52-point checklist in `deployment-service/configs/checklist.template.yaml` covers:

| Phase                              | Items       | Focus                                   |
| ---------------------------------- | ----------- | --------------------------------------- |
| Phase 1: Repository Foundation     | Items 1-6   | Repo, deps, config, logging, Dockerfile |
| Phase 2: Testing and Quality       | Items 7-12  | Unit/e2e/smoke tests, quality gates, CI |
| Phase 3: Deployment Infrastructure | Items 13-18 | Sharding, dependencies, Terraform       |
| Phase 4: Local Validation          | Items 19-22 | Local runs, schema validation           |
| Phase 5: Production Deployment     | Items 23-25 | Image builds, data completeness         |
| Phase 6: Documentation             | Items 26-33 | README, architecture, schemas           |
| Phase 7: Data Catalogue            | Items 34-37 | Shard enumeration, pipeline chain       |

---

## Detailed Standards

- [Quality Gates](./quality-gates.md) -- What quality-gates.sh does, phase 1 vs phase 2, ruff consistency
- [Testing Standards](./testing.md) -- Test structure, coverage, never-skip rules, dev dependencies
- [Contribution Guide](./contribution-guide.md) -- Quickmerge workflow, branch protection, step-by-step flow
- [Dependency Management](./dependency-management.md) -- pyproject.toml structure, pinning, ruff sync
- [Prek Migration Walkthrough](./PREK_MIGRATION_WALKTHROUGH.md) -- Standard rollout flow for hook/tooling migration

---

## Test Infrastructure: Emulators & Mocks

All CI tests run credential-free (`CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true`). Protocol-faithful emulators and mock
fixtures eliminate live cloud calls:

| Layer              | Tool                                      | Location                                                     |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------ |
| GCP Pub/Sub        | `PUBSUB_EMULATOR_HOST`                    | `unified-cloud-interface/tests/conftest.py`                  |
| GCS                | `STORAGE_EMULATOR_HOST` (fake-gcs-server) | `unified-cloud-interface/tests/conftest.py`                  |
| BigQuery           | `BIGQUERY_EMULATOR_HOST`                  | `trading-analytics-api/tests/conftest.py`                    |
| AWS S3/Secrets/SQS | `@mock_aws` (moto)                        | `unified-cloud-interface/tests/integration/test_aws_mode.py` |
| Exchange REST      | `responses` library                       | `unified-defi-execution-interface/tests/fixtures/`           |
| WebSocket feeds    | `MockWebSocketFeed`                       | `unified-market-interface/tests/fixtures/mock_ws_server.py`  |
| Cassette parity    | `test_cassette_schema_parity.py`          | `unified-api-contracts/tests/`                               |
| Network blocking   | `network_block_plugin.py`                 | `unified-trading-pm/scripts/dev/`                            |
| Fault injection    | `FaultInjectionTransport`                 | `unified-trading-pm/scripts/dev/fixtures/`                   |
| Tick replay        | `TickReplayEngine`                        | `unified-trading-pm/scripts/dev/fixtures/`                   |
| Full demo stack    | `demo-mode.sh`                            | `unified-trading-pm/scripts/`                                |

Full details: `unified-trading-pm/plans/archive/cicd_mock_hardening_2026_03_11.plan.md` (Plan #60) See also:
[quality-gates.md](quality-gates.md) § GCP Emulator Configuration, AWS Moto, Credential-Free CI Gate

---

## Event-Driven Architecture

All inter-service communication uses the canonical event system:

- Events defined in `unified-events-interface` (schemas.py)
- Lifecycle events follow `LifecycleEventType` enum from UIC
- Services emit events via `log_event()` — never direct PubSub calls
- Multi-tuple architecture: (service, event_type, timestamp, correlation_id, details)

See `03-observability/lifecycle-events.md` for the full event catalog. See cursor rule `strategy-data-access.mdc` for
strategy-specific constraints.

---

## Code Organization and Structure

- **Maximum file size: 1500 lines (hard limit).** Ideal target is <500 lines for most modules. The 1500-line limit is
  for centralized scripts and large adapters only. If a file exceeds this, split by responsibility. Large files are
  harder to review, test, and reason about.
- **Single Responsibility Principle:** each module should have one reason to change. A module that handles config
  parsing, data transformation, and API calls needs to be split.
- **Separate transformation, validation, and business logic** into distinct modules. For example: `transforms.py` for
  data transformations, `validators.py` for input/output validation, `service.py` for orchestration.
- **Use composition over inheritance** where appropriate. Prefer injecting dependencies (clients, configs) over deep
  class hierarchies.

---

## Technical Debt Tracking

- **No TODO/FIXME comments in production code.** Convert them to GitHub issues with labels (`tech-debt`, `cleanup`,
  `refactor`).
- **Placeholder functions** (`pass`, `raise NotImplementedError`) must reference a GitHub issue explaining what needs to
  be implemented and when:

  ```python
  # WRONG: unexplained placeholder
  def process_options():
      raise NotImplementedError

  # CORRECT: linked to a tracked issue
  def process_options():
      raise NotImplementedError("Options processing -- see GitHub issue #287")
  ```

- **Track technical debt in a backlog, not in source code comments.** Source code comments become invisible; issues are
  searchable, assignable, and prioritizable.

---

## unified-api-contracts Chain and External API Typing

**Chain:** config → SDK → validation (unified-api-contracts) → adapter → canonical schema.

- **External API responses** must be validated with unified-api-contracts Pydantic schemas before adapters transform to
  canonical formats.
- **Never use `dict[str, Any]`** for external API responses — use unified-api-contracts schema classes (e.g.,
  `BinanceTicker`, `TardisTrade`, `DatabentoOhlcvBar`).
- **Adapters** receive validated unified-api-contracts schemas, not raw JSON/dicts. Fail fast if response shape does not
  match schema.

```python
# WRONG: raw dict for external API response
def parse_tardis_trade(raw: dict[str, Any]) -> CanonicalTrade:
    ...

# CORRECT: validate with unified-api-contracts, then adapt
from unified_api_contracts.tardis.schemas import TardisTrade

def parse_tardis_trade(raw: dict[str, object]) -> CanonicalTrade:
    validated = TardisTrade.model_validate(raw)
    return _to_canonical(validated)
```

See `02-data/unified-unified-api-contracts-chain.md` for the full chain and interface integration test pattern.

---

## Type Hints

- **Add type hints to all public function signatures.** Internal/private helpers should also have hints, but public APIs
  are the priority.
- **Use modern Python 3.13+ syntax** where compatible. All services use Python 3.13.
- `Optional[X]` is acceptable everywhere; `X | None` is preferred for 3.13+ services.
- **mypy enforcement: [IMPLEMENTED - light mode]** -- run mypy in quality gates/CI with progressive typing defaults.
- **basedpyright zero-baseline policy [ENFORCED 2026-03-10]:** `.basedpyright-baseline.json` must not exist in any repo.
  All basedpyright errors must be fixed — baseline suppression is not allowed. Presence of the file causes a hard CI
  failure at STEP 5.22 in quality-gates. See
  `unified-trading-pm/plans/archive/zero_baseline_typecheck_2026_03_10.plan.md`.
- Focus on public APIs first, internal helpers second.

```python
# 3.13+ services (preferred)
def fetch_instruments(venue: str, date: date | None = None) -> list[dict[str, str]]:
    ...

# 3.13 services (all)
from typing import Optional, List, Dict
def fetch_instruments(venue: str, date: Optional[date] = None) -> List[Dict[str, str]]:
    ...
```

---

## Import Anti-Patterns

Extends the existing [Import Organization](#import-organization-implemented) section.

- **`try/except ImportError` around library imports is NEVER acceptable in any tier.** All tiers must fail loud if a
  dependency is missing. This matches the cursor rule in `no-empty-fallbacks.mdc`.

  **Why:** The Tier 3 exception was a temporary migration carve-out that is now expired. All repos must declare their
  dependencies explicitly in `pyproject.toml` and fail at import time if missing. Silent fallbacks hide missing
  dependencies and cause hard-to-debug runtime errors.

  **The fix:** If a `try/except ImportError` exists, delete it. If the import was optional, make it a hard dependency in
  `pyproject.toml`. If it was truly optional (feature flag), use a configuration check instead — not an import check.

---

## Exception Hierarchy

Services SHOULD define a base exception class and subclass for specific errors:

```python
# {service}/exceptions.py
class InstrumentsServiceError(Exception):
    """Base exception for all instruments-service errors."""
    pass

class InstrumentNotFoundError(InstrumentsServiceError):
    """Raised when an instrument cannot be found for the given criteria."""
    pass

class InstrumentValidationError(InstrumentsServiceError):
    """Raised when instrument data fails schema validation."""
    pass

class VenueConfigurationError(InstrumentsServiceError):
    """Raised when venue configuration is invalid or missing."""
    pass
```

Usage rules:

- Catch service-specific exceptions, not bare `Exception`.
- Use unified-trading-services decorators (`@handle_api_errors`, `@handle_storage_errors`) for cross-cutting retry/error
  handling -- these handle transient failures, timeouts, and retries.
- Service-specific exceptions handle domain logic errors (not found, invalid data, bad config).
- Let unexpected exceptions propagate up to the top-level handler where `log_event("FAILED", str(e))` captures them.

---

## Test Infrastructure: Emulators & Mocks

All CI tests run credential-free (`CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true`). Protocol-faithful emulators and mock
fixtures eliminate live cloud calls:

| Layer              | Tool                                      | Location                                                     |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------ |
| GCP Pub/Sub        | `PUBSUB_EMULATOR_HOST`                    | `unified-cloud-interface/tests/conftest.py`                  |
| GCS                | `STORAGE_EMULATOR_HOST` (fake-gcs-server) | `unified-cloud-interface/tests/conftest.py`                  |
| BigQuery           | `BIGQUERY_EMULATOR_HOST`                  | `trading-analytics-api/tests/conftest.py`                    |
| AWS S3/Secrets/SQS | `@mock_aws` (moto)                        | `unified-cloud-interface/tests/integration/test_aws_mode.py` |
| Exchange REST      | `responses` library                       | `unified-defi-execution-interface/tests/fixtures/`           |
| WebSocket feeds    | `MockWebSocketFeed`                       | `unified-market-interface/tests/fixtures/mock_ws_server.py`  |
| Cassette parity    | `test_cassette_schema_parity.py`          | `unified-api-contracts/tests/`                               |
| Network blocking   | `network_block_plugin.py`                 | `unified-trading-pm/scripts/dev/`                            |
| Fault injection    | `FaultInjectionTransport`                 | `unified-trading-pm/scripts/dev/fixtures/`                   |
| Tick replay        | `TickReplayEngine`                        | `unified-trading-pm/scripts/dev/fixtures/`                   |
| Full demo stack    | `demo-mode.sh`                            | `unified-trading-pm/scripts/`                                |

Full details: `unified-trading-pm/plans/archive/cicd_mock_hardening_2026_03_11.plan.md` (Plan #60) See also:
[quality-gates.md](quality-gates.md) § GCP Emulator Configuration, AWS Moto, Credential-Free CI Gate
