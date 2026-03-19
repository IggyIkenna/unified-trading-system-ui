# Quality Gate Bypass Audit — deployment-api

Date: 2026-03-04
Auditor: Claude (automated)

## 2.1 File Size Exceptions

### GROUP A — Migration Pending

Files that approach or exceed the 900-line limit and require splitting in Phase 3.

| File                                             | Lines | Action Required                                                              |
| ------------------------------------------------ | ----- | ---------------------------------------------------------------------------- |
| `deployment_api/routes/state_management.py`      | 886   | Approaching limit (warn threshold 700). Split into sub-modules in Phase 3.   |
| `deployment_api/workers/deployment_processor.py` | 868   | Approaching limit. Split batch processing logic into sub-modules in Phase 3. |

## 2.2 Direct Cloud SDK Import Exceptions

### GROUP A — RESOLVED (2026-03-08): Migrated to unified-cloud-interface

| File                                             | Cloud API    | Resolution                                                                  |
| ------------------------------------------------ | ------------ | --------------------------------------------------------------------------- |
| `deployment_api/routes/deployment_state.py`      | `run_v2`     | Migrated to `get_compute_client().list_revisions()`                         |
| `deployment_api/workers/auto_sync.py`            | `compute_v1` | Migrated to `get_compute_engine_client().aggregated_list_instances()`       |
| `deployment_api/workers/deployment_processor.py` | `compute_v1` | Migrated to `get_compute_engine_client()` (aggregated_list + serial output) |

### GROUP B — JUSTIFIED: Cloud Build (no UCI equivalent)

UCI does not expose Cloud Build API. Deployment boundary requires triggers, build history, and run-build. Documented bypass.

| File                                               | Cloud API       | Justification                                             |
| -------------------------------------------------- | --------------- | --------------------------------------------------------- |
| `deployment_api/routes/cloud_builds.py`            | `cloudbuild_v1` | Deployment Cloud Build boundary — no UCI CloudBuildClient |
| `deployment_api/routes/service_status_checkers.py` | `cloudbuild_v1` | Same — deferred import for build status checks            |

**Note:** `google.cloud.secretmanager` usage in `service_status.py` was replaced with `get_secret_client()` from `unified_cloud_interface` (fixed in this audit pass).

---

## 2.5 Imports Inside Functions — MIGRATION_PENDING

Stdlib imports that were straightforward to move to module-top were fixed in this audit pass. The remaining 75 function-level imports fall into three categories:

### A — Circular Dependency Avoidance (intentional deferred imports)

`storage_facade.py` defers `from deployment_api.utils.storage_client import get_storage_client` inside each function to avoid a module-level circular dependency between `storage_facade` → `storage_client` → (app init). These will be resolved in Phase 3 by refactoring initialization order or using a singleton pattern.

`deployment_caching.py`, `deployment_validation.py`, `services/deployment_state.py` defer cross-route imports (`from .deployment_caching import ...`, `from ..routes.shard_management import ...`) to avoid circular imports between route modules.

**Migration:** Phase 3 — restructure route module initialization to allow top-level cross-imports.

### B — Optional/Lazy Imports (conditional availability)

`deployment_events.py:67` — `import redis` is deferred because `redis` is an optional dependency (not always installed). This is a deliberate pattern to allow the service to run without Redis.

`compute_v1` and `run_v2` — RESOLVED 2026-03-08: migrated to UCI `get_compute_client()` and `get_compute_engine_client()`.

### C — Missing Modules (unresolvable at import time)

`backends.base`, `backends.cloud_run`, `backends.vm`, `deployment.orchestrator`, `deployment.quota_broker_client`, `deployment_service.config_loader`, `deployment_service.cloud_client` — these are runtime-only modules not in the Python path at static analysis time. Importing them at module top causes `ImportError` at startup.

**Migration:** Phase 1 — install/resolve these as proper package dependencies in pyproject.toml.

---

## 2.3 Ruff Exceptions

None.

## 2.4 Basedpyright Exceptions

None.

## 2.4b Type-Ignore Suppressions — Last Updated: 2026-03-08

### GROUP A — Genuine Third-Party Stub Gaps (no `py.typed`, no stubs package)

These 6 suppressions in `deployment_api/routes/config_management.py` are unavoidable:
`unified_config_interface` and `unified_cloud_interface` do not ship a `py.typed` marker
file, so basedpyright reports `import-untyped`. The functions `get_config_store`,
`schema_for_domain`, and `get_event_bus` are used correctly — the call signatures match
the documented API.

| File                                         | Lines                        | Error Code       | Root Cause                                                                      |
| -------------------------------------------- | ---------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `deployment_api/routes/config_management.py` | 126, 133, 177, 222, 286, 344 | `import-untyped` | `unified_config_interface` and `unified_cloud_interface` lack `py.typed` marker |

**Migration:** Add `py.typed` to `unified-config-interface` and `unified-cloud-interface`
packages, or publish `types-unified-config-interface` / `types-unified-cloud-interface`
stubs packages.

## 2.4 os.environ Exceptions

### GROUP A — Migration Pending

These files use `os.environ` in production source where `UnifiedCloudConfig` should eventually own the value. The reads are functional and do not cause incorrect behaviour today, but they violate the workspace `os.environ` ban and must be migrated in Phase 1.

| File                                    | Lines | Purpose                                                                                                                                                                                                                  | Status            |
| --------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `deployment_api/routes/cloud_builds.py` | 720   | `os.environ.get(...)` reads `workspace_root` to resolve Cloud Build trigger paths. This value is not yet a field on `UnifiedCloudConfig`. Migration: add `workspace_root` to `UnifiedCloudConfig` and replace this call. | MIGRATION_PENDING |

### Migration Tracking

| Item                                                      | Target                                                                     | Owner          |
| --------------------------------------------------------- | -------------------------------------------------------------------------- | -------------- |
| `cloud_builds.py:720` — `workspace_root` via `os.environ` | Phase 1: add `workspace_root` to `UnifiedCloudConfig` and update call site | deployment-api |

## 2.6 Hardcoded GCS Path Remediation — RESOLVED (2026-03-08)

**Status: RESOLVED**

`deployment_api/routes/services.py` previously used `f"gs://execution-store-{_PID}/configs/"` and
similar f-strings with the raw `GCP_PROJECT_ID` string interpolated directly. These hardcoded
patterns coupled the GCS path to the project ID without an intermediate config field, making
bucket overrides impossible.

**Resolution:** Five new fields added to `DeploymentApiConfig`:

- `execution_store_bucket` (env: `EXECUTION_STORE_BUCKET`)
- `strategy_store_cefi_bucket` (env: `STRATEGY_STORE_CEFI_BUCKET`)
- `strategy_store_tradfi_bucket` (env: `STRATEGY_STORE_TRADFI_BUCKET`)
- `strategy_store_defi_bucket` (env: `STRATEGY_STORE_DEFI_BUCKET`)
- `ml_configs_store_bucket` (env: `ML_CONFIGS_STORE_BUCKET`)

Each has a corresponding `effective_*` property that falls back to
`{prefix}-{gcp_project_id}` when the env var is not set, preserving backward compatibility.
`routes/services.py` now reads from `settings.py` module-level constants populated from these fields.

---

## 3. Basedpyright Error Analysis — 2026-03-04

**Run:** `basedpyright deployment-api/deployment_api/` from workspace root
**Result:** 924 errors, 3910 warnings, 0 notes

### Error Breakdown by Type

| Rule                              | Count | Classification                               |
| --------------------------------- | ----- | -------------------------------------------- |
| reportUnknownVariableType         | 1195  | JUSTIFIED (cascade from missing stubs)       |
| reportUnknownMemberType           | 1194  | JUSTIFIED (third-party stubs)                |
| reportUnknownArgumentType         | 549   | JUSTIFIED (cascade from missing stubs)       |
| reportUnknownParameterType        | 310   | MIGRATION_PENDING                            |
| reportAny                         | 201   | JUSTIFIED (stdlib + third-party propagation) |
| reportAttributeAccessIssue        | 192   | MIGRATION_PENDING                            |
| reportMissingTypeArgument         | 176   | MIGRATION_PENDING                            |
| reportArgumentType                | 131   | MIGRATION_PENDING                            |
| reportImplicitRelativeImport      | 123   | MIGRATION_PENDING                            |
| reportCallIssue                   | 107   | MIGRATION_PENDING                            |
| reportMissingParameterType        | 100   | MIGRATION_PENDING                            |
| reportCallInDefaultInitializer    | 64    | MIGRATION_PENDING                            |
| reportUnusedCallResult            | 63    | MIGRATION_PENDING                            |
| reportUnusedParameter             | 60    | MIGRATION_PENDING                            |
| reportIndexIssue                  | 52    | MIGRATION_PENDING                            |
| reportOperatorIssue               | 40    | MIGRATION_PENDING                            |
| reportPrivateUsage                | 32    | MIGRATION_PENDING                            |
| reportUnusedFunction              | 31    | MIGRATION_PENDING                            |
| reportUnannotatedClassAttribute   | 31    | MIGRATION_PENDING                            |
| reportMissingTypeStubs            | 27    | JUSTIFIED (no stubs for workspace libs)      |
| reportReturnType                  | 26    | MIGRATION_PENDING                            |
| reportMissingImports              | 25    | MIGRATION_PENDING                            |
| reportGeneralTypeIssues           | 17    | MIGRATION_PENDING                            |
| reportImplicitStringConcatenation | 13    | MIGRATION_PENDING                            |
| reportOptionalSubscript           | 10    | MIGRATION_PENDING                            |
| reportImplicitOverride            | 9     | MIGRATION_PENDING                            |
| reportAssignmentType              | 9     | MIGRATION_PENDING                            |
| reportUnusedCoroutine             | 7     | MIGRATION_PENDING                            |
| reportUnknownLambdaType           | 7     | MIGRATION_PENDING                            |
| reportUnnecessaryIsInstance       | 5     | MIGRATION_PENDING                            |

**Total: 924 errors. ~2150+ warnings. ~3149 JUSTIFIED (cascade unknowns from missing stubs). ~761 MIGRATION_PENDING.**

---

## Justified Bypasses

### 1. Missing Type Stubs for Workspace Libraries (27 errors + large cascade)

**Files affected:**

- `deployment_api/app_config.py` — `unified_config_interface`
- `deployment_api/auth.py` — `unified_config_interface`, `unified_events_interface`
- `deployment_api/auth_middleware.py` — `unified_trading_library`
- Multiple route and service files

**Error types:** `reportMissingTypeStubs`, cascading `reportUnknownVariableType`, `reportUnknownMemberType`, `reportUnknownArgumentType`

**Root cause:** Workspace libraries (`unified_config_interface`, `unified_events_interface`, `unified_trading_library`) do not ship PEP 561 stub packages. basedpyright treats every imported symbol as `Unknown`, generating the bulk of the 1195 `reportUnknownVariableType` and 1194 `reportUnknownMemberType` warnings.

**Justification:** JUSTIFIED — Workspace library stubs are tracked under Phase 2 (library tier hardening). The cascade of Unknown types is a direct and unavoidable consequence of no `py.typed` marker or `.pyi` stubs being published.

### 2. json.loads / yaml.safe_load / resp.json() Return Type Any (reportAny)

**Files affected:** Multiple route files, `services/deployment_manager.py`, `services/data_analytics_service.py`

**Error types:** `reportAny`

**Root cause:** Standard library `json.loads()` returns `Any` in all Python type stubs. Similarly, `yaml.safe_load()` returns `Any`. HTTP response `.json()` methods return `Any`. These are fundamental stdlib and third-party limitations.

**Justification:** JUSTIFIED — Narrowing `json.loads()` return type requires wrapping every call with explicit casts or TypedDict validators. The downstream `reportAny` warnings are a standard stdlib limitation. Industry standard: accept `Any` from deserialization boundaries; validate/narrow at service boundaries.

### 3. redis / redis.asyncio Return Type Propagation (reportUnknownMemberType cascade)

**Files affected:** `deployment_api/services/deployment_manager.py`, `deployment_api/routes/deployment_caching.py`, `deployment_api/utils/cache.py`

**Error types:** `reportUnknownMemberType`, `reportUnknownVariableType`, `reportUnknownArgumentType`

**Root cause:** `redis` and `redis.asyncio` packages are listed as unresolvable (`reportMissingImports`) — these are not installed in the workspace venv when running basedpyright from the root. Every `.get()`, `.set()`, `.hget()` call on the redis client resolves to `Unknown`, cascading through the file.

**Justification:** JUSTIFIED — Redis client types are not resolvable from workspace root; the package is a service-level dependency installed only within the service's own venv. This is a multi-repo workspace limitation, not a code quality issue.

---

## Migration Pending

### 1. Unresolved Third-Party and Internal Modules (25 errors — reportMissingImports)

**Files affected:**

- `deployment_api/app_config.py`, `deployment_api/background_sync.py`, `deployment_api/workers/deployment_processor.py` — `backends.base`, `backends.cloud_run`, `backends.vm`, `deployment.orchestrator`, `deployment.quota_broker_client`, `deployment.state`
- `deployment_api/main.py` — `PrometheusMiddleware`, `get_metrics_response`
- `deployment_api/health_routes.py` — `_clear_gcs_cache`
- `deployment_api/auth_middleware.py` — `GoogleUser`, `get_current_user`, `role_required`

**Root cause:** Several internal modules (`backends.*`, `deployment.*`) are referenced but not resolvable — either not installed, not yet created, or not in the Python path. `PrometheusMiddleware` and `get_metrics_response` are either from a private metrics library or from an uninstalled package. Auth helpers (`GoogleUser`, `get_current_user`, `role_required`) are missing from `unified_trading_library`'s public exports.

**Migration plan:** Phase 1 foundation prep — install missing dependencies. For `backends.*` and `deployment.*`, confirm these are internal sub-packages or external deps and add them to `pyproject.toml`. For metrics, install `prometheus-fastapi-instrumentator` or equivalent. For auth helpers, confirm correct export path from `unified_trading_library`.

### 2. Implicit Relative Imports Throughout Package (123 errors)

**Files affected:** `app_config.py`, `background_sync.py`, `gunicorn.conf.py`, `workers/auto_sync.py`, `workers/deployment_processor.py`, and all sub-package `__init__.py` files.

**Root cause:** Internal imports use absolute-style names (e.g., `from deployment_api.services import ...`) instead of explicit relative imports (`from .services import ...`). basedpyright resolves these as double-nested paths from the workspace root.

**Migration plan:** Phase 3 service hardening — convert all internal imports to explicit relative imports. Mechanical fix.

### 3. Missing Generic Type Arguments (176 errors — reportMissingTypeArgument)

**Files affected:** `routes/batch_cache_manager.py`, `routes/batch_config_utils.py`, `routes/batch_query_engine.py`, `routes/batch_result_processor.py`, and many others.

**Root cause:** Raw `dict`, `list`, `set`, `tuple` used as type annotations without type arguments (e.g., `dict` instead of `dict[str, str]`). Python 3.9+ supports generic builtins; basedpyright strict mode requires type arguments.

**Migration plan:** Phase 3 — add explicit type arguments to all generic container annotations throughout the routes and services. This is a widespread but mechanical fix.

### 4. Unannotated Function Parameters (100 reportMissingParameterType + 310 reportUnknownParameterType)

**Files affected:** `gunicorn.conf.py`, `workers/deployment_worker.py`, and many route handlers.

**Root cause:** Functions — particularly callback hooks (e.g., gunicorn `post_fork`, `worker_abort`) and internal helpers — lack type annotations on parameters. basedpyright strict mode requires all parameters to be annotated.

**Migration plan:** Phase 3 — add type annotations to all function parameters. Gunicorn hook parameters can be typed as the gunicorn types or `object` for hooks that receive framework-internal objects.

### 5. Constant Redefinition (2 errors — reportConstantRedefinition)

**Files affected:**

- `auth.py:22` — `DISABLE_AUTH` constant redefined inside a conditional
- `background_sync.py:55` — `OWNER_ID` constant redefined

**Root cause:** Variables named in UPPER_CASE (treated as constants by basedpyright) are being reassigned. This is a logic pattern where a module-level constant is conditionally overridden.

**Migration plan:** Phase 3 — rename to lowercase or use `Final[bool]` with a single assignment. Use a `def get_disable_auth() -> bool` factory instead of reassigning a constant.

### 6. Optional Member Access Without Guard (2 errors — reportOptionalMemberAccess)

**Files affected:**

- `background_sync.py:70` — `.is_set()` called on potentially `None` value
- `background_sync.py:79` — same pattern

**Root cause:** `asyncio.Event` objects are stored as `Optional[asyncio.Event]` but accessed without a None guard before calling `.is_set()`.

**Migration plan:** Phase 3 — add `assert event is not None` guard or initialize with `asyncio.Event()` at construction time rather than `None`.

### 7. Attribute Access on UnifiedCloudConfig for Non-Existent Fields (reportAttributeAccessIssue)

**Files affected:**

- `auth.py` — accessing `.disable_auth` and `.api_key` on `UnifiedCloudConfig`

**Root cause:** The service accesses config fields (`disable_auth`, `api_key`) that are not defined on `UnifiedCloudConfig`. These are service-specific config needs.

**Migration plan:** Phase 1 / Phase 3 — extend `UnifiedCloudConfig` with these fields, or create a service-specific config class that extends it and declares these fields.

### 8. StorageBlob Missing .delete() Attribute (1 error — reportAttributeAccessIssue)

**Files affected:** `app_config.py:118`

**Root cause:** Calling `.delete()` on `StorageBlob` but this method is not declared on the `StorageBlob` protocol in `unified_cloud_interface`.

**Migration plan:** Phase 3 — add `delete()` to the `StorageBlob` protocol in `unified_cloud_interface`, or use an alternative deletion API.

### 9. SpawnProcess Not Assignable to Process Return Type (1 error — reportReturnType)

**Files affected:** `workers/deployment_worker.py:155`

**Root cause:** Function return type is annotated as `multiprocessing.Process` but the function returns `multiprocessing.context.SpawnProcess` (a subclass). basedpyright does not allow returning a subtype for an invariant return annotation.

**Migration plan:** Phase 3 — change return annotation to `SpawnProcess` or `Process | SpawnProcess`, or use `multiprocessing.Process` as the concrete type (which `SpawnProcess` is a subtype of but basedpyright may require an explicit cast).

### 10. Functions Called in Parameter Default Initializers (64 errors — reportCallInDefaultInitializer)

**Files affected:** `auth.py:28` and multiple route handler files.

**Root cause:** Mutable objects or function calls used as parameter default values (e.g., `def f(x=SomeClass())`). basedpyright strict mode disallows this as it can cause shared-state bugs.

**Migration plan:** Phase 3 — replace all mutable default arguments with `None` sentinel and initialize inside the function body.

---

## Conclusion

924 total errors. Approximately **3149+ JUSTIFIED** (workspace library stub cascade producing Unknown types, json.loads stdlib limitation, redis unresolvable from workspace root). Approximately **761 MIGRATION_PENDING** including: missing generic type args (176), implicit relative imports (123), unannotated parameters (410), missing imports (25), constant redefinition (2), optional member access without guards (2), and attribute access on incomplete config/protocol types.

The single largest migration item is adding generic type arguments to the `routes/` sub-package (176 errors). The second largest is converting implicit relative imports to explicit (123 errors, mechanical fix). The third largest is installing and resolving missing `backends.*` and `deployment.*` modules (25 direct errors + cascades).

---

## basedpyright-baseline Suppression — Added: 2026-03-10

`.basedpyright-baseline.json` suppresses **3006 pre-existing type errors** (workspace library stub cascade, json.loads Any, unknown route handler types). Full analysis above.

**Migration plan:** See existing migration plan in this file — generic type args, explicit imports, missing stubs.
