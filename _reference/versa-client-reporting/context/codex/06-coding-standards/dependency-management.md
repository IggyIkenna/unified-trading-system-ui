# Dependency Management

## TL;DR

All dependencies are managed via `pyproject.toml` with pinned versions. **Commit `uv.lock`** — quality gates run
`uv lock` automatically when deps change; include `uv.lock` in commits. Dev dependencies (pytest, ruff, mypy, prek) are
in `[project.optional-dependencies] dev`. Ruff version MUST be identical across `pyproject.toml`,
`.pre-commit-config.yaml`, `quality-gates.sh`, and CI configs. unified-trading-services is installed separately (SSH for
local, HTTPS+PAT for CI/Docker). When a test skips due to a missing dependency, add it to dev deps -- never leave it
skipping.

**Status:** [IMPLEMENTED] in all services.

---

## pyproject.toml Structure

### Production Dependencies

```toml
[project]
name = "my-service"
version = "0.1.0"
requires-python = ">=3.13,<3.14"
dependencies = [
    # Core data processing
    "numpy>=2.1.0,<2.4.0",
    "pandas>=2.2.3,<3.0.0",
    "polars>=1.0.0",

    # Validation
    "pydantic>=2.12.5",
    "pydantic-settings>=2.12.0",

    # Utilities
    "python-dateutil>=2.8.0",
    "python-dotenv>=1.0.0",

    # AWS (for cloud-agnostic support)
    "boto3>=1.40.70",

    # NOTE: unified-trading-services installed separately
]
```

### Dev Dependencies

```toml
[project.optional-dependencies]
dev = [
    # Testing
    "pytest>=9.0.1",
    "pytest-cov>=7.0.0",
    "pytest-asyncio>=0.25.0",
    "pytest-mock>=3.14.0",
    "pytest-timeout>=2.4.0",
    "pytest-xdist>=3.6.0",     # Required for parallel execution

    # Linting/formatting - MUST match CI version exactly
    "ruff==0.15.0",

    # Code quality
    "mypy>=1.19.1",
    "prek>=0.3.0",
]
```

### Installation

```bash
# Install with dev deps (prefer uv for speed)
pip install uv && uv pip install --system -e ".[dev]"
# Or: pip install -e ".[dev]"

# Install production only
uv pip install --system -e .
# Or: pip install -e .
```

**UV:** Use `uv pip install --system` in Dockerfiles, cloudbuild, and CI for faster installs. Fallback to `pip` when uv
not available.

---

## Unified Libraries Split: Transitive vs Direct Dependencies

**As of v1.5.0** (Feb 2026), unified-trading-services has been split into focused libraries. Services can use either
**transitive dependencies** (current, simple) or **direct imports** (target, explicit).

### Two Valid Patterns

**Pattern A: Transitive Dependencies (Default)**

```toml
# pyproject.toml - service only declares comment about UCS
[project]
dependencies = [
    "pandas>=2.0.0",
    # NOTE: unified-trading-services installed separately via SSH/PAT
    # Split libraries (events, config, market, order, algo) installed transitively
]
```

Services get split libraries automatically through UCS dependencies (uv lock resolves all transitive deps).

**Pattern B: Direct Imports (Migration Target)**

```toml
# pyproject.toml - service documents which split libraries it uses
[project]
dependencies = [
    "pandas>=2.0.0",
    # NOTE: Unified libraries installed separately via SSH/PAT:
    #   - unified-trading-services (cloud abstractions)
    #   - unified-events-interface (event logging)
    #   - unified-config-interface (configuration)
    #   - unified-order-interface (order execution) [if needed]
]
```

Services explicitly list which libraries they use (better clarity, independent versioning).

### When to Use Each Pattern

**Use Pattern A (transitive):**

- Simple services (instruments, features-_, ml-_)
- Uses only events + config (2 libraries)
- No urgency to migrate
- Transitive deps work fine

**Use Pattern B (direct imports):**

- Complex services (execution-service, position-balance-monitor-service)
- Uses 3+ libraries (events, config, order, algo)
- NEW services (start clean)
- Benefits from explicit dependencies

**See:** `05-infrastructure/unified-libraries/LIBRARY-DEPENDENCY-MATRIX.md` for per-service recommendations. The
ecosystem comprises 7 libraries, 13 services, and 4 deployment repos (deployment-service, deployment-api, deployment-ui,
system-integration-tests).

---

## unified-trading-services Installation

unified-trading-services is NOT listed in `pyproject.toml` dependencies because it is a private GitHub repo. **Status
quo:** All environments use the **UCS image** from Artifact Registry (no clone).

| Context        | Method                | Command / Image                                                                     |
| -------------- | --------------------- | ----------------------------------------------------------------------------------- |
| Local dev      | UCS image (container) | `docker run ... asia-northeast1-docker.pkg.dev/.../unified-trading-services:latest` |
| Cloud Build    | UCS image as base     | Quality-gates step uses `unified-trading-services:latest`; no clone                 |
| GitHub Actions | Pull UCS image        | `gcloud auth configure-docker` + `docker pull` + run tests in container             |
| Dockerfile     | UCS image as base     | `FROM asia-northeast1-docker.pkg.dev/.../unified-trading-services:latest`           |

**Local:** `quality-gates.sh` uses container mode when `USE_UCS_IMAGE=1` (default) and the image exists. Fallback: local
pip if image not available.

**UCS image:** Built by unified-trading-services Cloud Build after quality gates pass; pushed to
`asia-northeast1-docker.pkg.dev/$PROJECT_ID/unified-trading-services/unified-trading-services:latest`.

---

## Pinning Strategy

| Dependency Type          | Strategy                        | Example               |
| ------------------------ | ------------------------------- | --------------------- |
| Core libraries           | Range pin (compatible range)    | `numpy>=2.1.0,<2.4.0` |
| Validation               | Minimum pin                     | `pydantic>=2.12.5`    |
| Dev tools                | Exact pin (ruff) or minimum pin | `ruff==0.15.0`        |
| Testing                  | Minimum pin                     | `pytest>=9.0.1`       |
| unified-trading-services | Latest from main                | Installed separately  |

### Why Ruff Is Exact-Pinned

Ruff changes formatting behavior between versions. If local dev uses `ruff==0.14.0` but CI uses `ruff==0.15.0`, code
formatted locally gets reformatted by CI, causing pre-commit to modify files during commit, leading to infinite
formatting loops.

---

## Ruff Version Synchronization

Ruff version MUST be identical in four locations per service:

| Location                   | Format                       |
| -------------------------- | ---------------------------- |
| `pyproject.toml`           | `"ruff==0.15.0"` in dev deps |
| `.pre-commit-config.yaml`  | `rev: v0.15.0`               |
| `scripts/quality-gates.sh` | `pip install ruff==0.15.0`   |
| CI config (if explicit)    | `pip install ruff==0.15.0`   |

### Checking Consistency

```bash
cd deployment-service
./scripts/check-ruff-versions.sh
```

### Updating Across All Repos

```bash
cd deployment-service
./scripts/update-precommit-hooks.sh
```

After updating `.pre-commit-config.yaml`, always reinstall hooks:

```bash
prek install
```

---

## Adding New Dependencies

### Production Dependency

1. Add to `[project] dependencies` in `pyproject.toml`
2. Use a compatible range pin: `"newlib>=1.0.0,<2.0.0"`
3. Verify no version conflicts: `pip install -e .`
4. Verify imports resolve: `python -c "import newlib"`
5. Update `.env.example` if the lib requires env vars

### Dev Dependency

1. Add to `[project.optional-dependencies] dev`
2. Use minimum pin: `"newlib>=1.0.0"`
3. Install: `pip install -e ".[dev]"`
4. Verify tests still pass: `pytest tests/ -v`

### Missing Dependency (Test Skipping)

When you see a test skipping because of a missing import:

```
SKIPPED tests/unit/test_cloud_agnostic.py - AWS libraries not installed
```

Fix:

1. Add the missing package to dev deps:
   ```toml
   dev = [
       # ... existing deps ...
       "boto3>=1.34.0",
       "aiobotocore>=2.11.0",
   ]
   ```
2. Reinstall: `pip install -e ".[dev]"`
3. Verify the test now runs: `pytest tests/unit/test_cloud_agnostic.py -v`

Do NOT leave tests skipping when the fix is adding a pip package.

---

## Python Version Requirements

| Service                     | Python Version | Reason               |
| --------------------------- | -------------- | -------------------- |
| All services (except below) | `>=3.13,<3.14` | Standard             |
| execution-service           | `>=3.13,<3.14` | Same as all services |

This is validated by `quality-gates.sh` Step 0.

---

## Build System

```toml
[build-system]
requires = ["setuptools>=80.9.0", "wheel"]
build-backend = "setuptools.build_meta"
```

### Package Discovery

```toml
[tool.setuptools]
packages = ["{service_snake_case}"]
include-package-data = true
```

### CLI Entry Points

```toml
[project.scripts]
my-service = "my_service.cli.main:run_cli"
```

---

## Dockerfile Dependency Installation

**Use UCS image as base** (no clone, no GH_PAT):

```dockerfile
# Use unified-trading-services base image (has Python, UCS, uv)
ARG PROJECT_ID=test-project
FROM asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-services/unified-trading-services:latest

WORKDIR /app
COPY . .
RUN uv pip install --system -e .
```

For local builds: `gcloud auth configure-docker asia-northeast1-docker.pkg.dev` first.

---

## Checklist Reference

- **Item 02:** pyproject.toml with all dependencies pinned, no missing packages
- **Item 03:** .env.example documents all required env vars
- **Item 06:** Dockerfile with unified-trading-services installed correctly
- **Item 09b:** Quality gate alignment (same Python, same ruff, same tests)

---

## Workspace-wide dependency pinning

**Policy:** All repos use the same version range for each shared external package. Canonical ranges live in
`unified-trading-pm/workspace-constraints.toml` (generated). Internal workspace deps stay `>=0.x.0` editable; manifest
`versions` is SSOT.

**How it is produced:** Script `resolve-canonical-versions.py` (unified-trading-pm) reads all `pyproject.toml` files
from repos in **topological order** (from workspace-manifest.json), computes the tightest constraint per external
package, and writes `workspace-constraints.toml` plus a short report.

**How it is consumed:** Script `propagate-canonical-versions.py` reads `workspace-constraints.toml`, updates each repo’s
`pyproject.toml` (topological order), runs `uv lock` per repo. Use `--apply` to write changes and run uv lock;
optionally `--commit` to git add/commit pyproject.toml and uv.lock per repo. Then
`aggregate-workspace-deps.py --resolve` builds the workspace venv and lockfile (`.venv-workspace/requirements.lock`).

**Exact commands (from workspace root):**

```bash
python unified-trading-pm/scripts/workspace/resolve-canonical-versions.py
python unified-trading-pm/scripts/propagation/propagate-canonical-versions.py --apply    # optional: --commit
python unified-trading-pm/scripts/workspace/aggregate-workspace-deps.py --resolve
```

**Execution order:** Phase 1 resolve → Phase 2 propagate + uv lock → Phase 3 aggregate --resolve → Phase 4 basedpyright
per repo.

**Risks:** Bumping to the tightest constraint can break repos (e.g. numpy 1.x→2.x, pyarrow 14→23). Run Phase 4
validation and fix or document exceptions. DEPENDENCY-MATRIX-CANONICAL.json is deprecated; workspace-manifest.json is
the SSOT for repo registry and internal versions.

**Execution (agents):** When implementing or updating this workflow (codex, scripts, manifest), use **parallel agents**
per cursor rules (token-optimization.mdc, parallel-agent-execution.mdc): e.g. one agent for codex + SSOT index, one for
resolve/propagate scripts, one for manifest cleanup + aggregate script. Different repos/areas = zero conflict; launch up
to 4 agents in parallel.

**Canonical dependency manifest (SSOT):** A global list of all external packages and their version ranges is maintained
in the PM repo for visibility and tooling:

- **JSON (SSOT):** `unified-trading-pm/canonical-dependency-manifest.json` — machine-readable list of `externalPackages`
  with `name` and `versionRange`. Generated from `workspace-constraints.toml`.
- **Visual:** `unified-trading-pm/CANONICAL_DEPENDENCY_MANIFEST.svg` — grid of packages and ranges for at-a-glance
  review.
- **Generator:** `unified-trading-pm/scripts/manifest/generate_canonical_dependency_manifest.py`. Run after
  `resolve-canonical-versions.py` to refresh the manifest and SVG.

Internal/private repos are not in this manifest; they are in `workspace-manifest.json`. The combination of
workspace-manifest.json (internal repos + pip install -e) and canonical-dependency-manifest.json (external PyPI ranges)
is the full dependency picture. Cursor rule `canonical-external-deps.mdc` enforces: when adding a new external
dependency, use the range from the manifest or add it via the resolve → propagate flow and regenerate the manifest.

**PM push gate:** Never push or merge unified-trading-pm unless dependency alignment passes. Run
`check-dependency-alignment.py --json` (must report `"aligned": true`); use
`fix-internal-dependency-alignment.py --apply` for internal mismatches (code uses → add; else remove). Quickmerge runs
Stage 1.5 for PM. See `unified-trading-pm/scripts/manifest/README-DEPENDENCY-ALIGNMENT.md` and cursor rule
`pm-dependency-alignment-push.mdc`.

---

## Lockfile Strategy

- Use `uv.lock` for reproducible builds when available. Lockfiles capture the exact resolved versions of every
  transitive dependency.
- Lockfiles ensure CI/CD and local development use identical dependency versions, eliminating "works on my machine"
  issues.
- Lockfiles are committed to the repository. They are not generated artifacts -- they are source-controlled build
  inputs.
- Re-lock after any dependency change:
  ```bash
  uv lock
  ```
- If a service does not yet use `uv`, `pip freeze > requirements.lock` is an acceptable interim approach, but `uv.lock`
  is the target.

---

## Anti-Pattern: Git SSH Dependencies

NEVER use `git+ssh://` in `pyproject.toml` dependencies. Cloud Build cannot authenticate SSH.

```toml
# WRONG: Cloud Build has no SSH keys
dependencies = [
    "unified-trading-services @ git+ssh://git@github.com/IggyIkenna/unified-trading-services.git",
]

# WRONG: even HTTPS+PAT in pyproject.toml is fragile
dependencies = [
    "unified-trading-services @ git+https://x-access-token:${PAT}@github.com/...",
]
```

Correct approaches:

- **Published PyPI packages** for public or organization-scoped dependencies.
- **Local path references** for internal dependencies in Docker builds:
  ```dockerfile
  COPY unified-trading-services/ /app/unified-trading-services/
  RUN pip install -e /app/unified-trading-services
  ```
- unified-trading-services is installed via `pip install -e ../unified-trading-services` in Docker builds (cloned in a
  prior stage), not via git URLs in `pyproject.toml`.

---

## Version Pinning Strategy

| Dependency Type          | Strategy                          | Example              |
| ------------------------ | --------------------------------- | -------------------- |
| Core libraries           | Pin MAJOR.MINOR, allow PATCH      | `pandas>=2.2.0,<2.3` |
| Ruff                     | Pin EXACT version (must match CI) | `ruff==0.15.0`       |
| unified-trading-services | Always use latest from local path | Installed separately |
| Testing tools            | Minimum pin                       | `pytest>=9.0.1`      |
| Validation libs          | Minimum pin                       | `pydantic>=2.12.5`   |

### Why Pin MAJOR.MINOR

- PATCH versions contain bug fixes and are generally safe to auto-upgrade.
- MINOR versions may introduce new features or deprecations that could change behavior.
- MAJOR versions are breaking changes and must be upgraded deliberately.

### Why Ruff Is Exact-Pinned

Ruff changes formatting behavior between versions. Even a minor version bump can reformat files differently, causing
pre-commit hooks to modify files during commit. All four locations (pyproject.toml, .pre-commit-config.yaml,
quality-gates.sh, CI config) must use the same exact version. See
[Ruff Version Synchronization](#ruff-version-synchronization) above.
