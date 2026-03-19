# New Repo Setup — Complete Workflow

## Overview

Standard workflow for creating a new repository in the unified trading system workspace, from GitHub creation to
workspace integration.

**Repo Types:**

- **Services**: Pure orchestrators using ServiceCLI, delegate to libraries, no business logic
- **Libraries**: Follow tier architecture (0, 1, 2), no circular imports, contain business logic
- **UIs**: TypeScript/React/Vue, smoke tests, no Python quality gates

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- `uv` package manager installed (Python repos only)
- Node.js 20+ installed (UI repos only)
- Workspace venv at `.venv-workspace/` (run `bash .cursor/workspace-configs/setup-workspace-venv-complete.sh` if
  missing)

## Step 1: Create GitHub Repository

```bash
# Navigate to workspace root
cd /Users/ikennaigboaka/Documents/repos/unified-trading-system-repos

# Create repo via GitHub CLI
gh repo create IggyIkenna/<repo-name> \
  --private \
  --description "Brief description" \
  --clone

# Navigate to new repo
cd <repo-name>
```

## Step 2: Grant Team Access

Grant access to collaborators:

```bash
# Add CosmicTrader (read/write)
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/IggyIkenna/<repo-name>/collaborators/CosmicTrader \
  -f permission='push'

# Add datado (read/write)
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/IggyIkenna/<repo-name>/collaborators/datado \
  -f permission='push'
```

**Verify access:**

```bash
gh api /repos/IggyIkenna/<repo-name>/collaborators
```

## Step 3: Determine Repo Type

Before scaffolding, determine the repo type:

### Repo Type Decision Tree

```
Is it a user interface?
├─ Yes → UI repo (TypeScript, React/Vue, Playwright tests)
└─ No → Is it a service or library?
   ├─ Service → Orchestrator (ServiceCLI, thin adapters, delegates to libraries)
   └─ Library → What tier?
      ├─ Tier 0: No dependencies (unified-api-contracts, unified-config-interface, unified-events-interface)
      ├─ Tier 1: Depends on Tier 0 only (unified-trading-services)
      └─ Tier 2: Depends on Tier 0 only (UMI, UTEI, UDC, etc.)
```

**Service vs Library:**

- **Service**: Orchestrates workflows, has batch/live modes, uses ServiceCLI, deployed as Docker image
- **Library**: Reusable business logic, published to Artifact Registry, imported by services

**Library Tier Rules:**

- Tier 0: No dependencies on other unified libraries
- Tier 1: Depends on Tier 0 only (currently only unified-trading-services)
- Tier 2: Depends on Tier 0 only (NO circular imports, NO Tier 1 dependencies except UTS)

---

## Step 4: Scaffold Repository Structure

### For Libraries (Tier 0-2)

See [library-setup-checklist.md](library-setup-checklist.md) for complete library setup.

Quick scaffold:

````bash
# Create directory structure
mkdir -p <package_name>/ tests/unit tests/integration docs/ scripts/

# Create pyproject.toml
cat > pyproject.toml << 'EOF'
[project]
name = "<package-name>"
version = "0.1.0"
description = "Brief description"
requires-python = ">=3.13,<3.14"
dependencies = [
    "pydantic>=2.10.5,<3.0.0",
    # Add Tier 0 dependencies only for Tier 1/2 libraries
]

[project.optional-dependencies]
dev = [
    "pytest>=9.0.1",
    "pytest-cov>=7.0.0",
    "pytest-asyncio>=0.25.0",
    "ruff==0.15.0",
    "basedpyright>=1.25.0",
]

[tool.ruff]
line-length = 120
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "W", "I"]
ignore = []

[tool.basedpyright]
typeCheckingMode = "strict"
reportAny = "error"
reportUnknownMemberType = "error"
reportUnknownArgumentType = "error"
reportUnknownVariableType = "error"
reportUnknownParameterType = "error"
reportMissingParameterType = "error"
EOF

# Create package __init__.py
cat > <package_name>/__init__.py << 'EOF'
"""<Package description>."""

__version__ = "0.1.0"

# Export public API at top level
# from .<module> import PublicClass, public_function
# __all__ = ["PublicClass", "public_function"]
EOF

# Create README
cat > README.md << 'EOF'
# <Package Name>

Brief description.

**Tier**: [0/1/2]
**Dependencies**: [List Tier 0 dependencies]

## Installation

```bash
uv pip install -e .
````

## Usage

```python
from <package_name> import ...
```

## Development

```bash
# Install dev dependencies
uv pip install -e ".[dev]"

# Run tests
pytest

# Run quality gates
bash scripts/quality-gates.sh
```

EOF

# Create docs

cat > docs/ARCHITECTURE.md << 'EOF'

# Architecture

## Overview

Brief architecture overview.

## Tier Architecture

**Tier**: [0/1/2]

**Allowed Dependencies**:

- Tier 0: None
- Tier 1: Tier 0 only
- Tier 2: Tier 0 only (NO Tier 1 except UTS)

## Components

- Component 1: Description
- Component 2: Description EOF

cat > docs/CONFIGURATION.md << 'EOF'

# Configuration

## Environment Variables

- `VAR_NAME`: Description EOF

cat > docs/TESTING.md << 'EOF'

# Testing

## Unit Tests

```bash
pytest tests/unit/
```

## Integration Tests

```bash
pytest tests/integration/
```

EOF

# Create QUALITY_GATE_BYPASS_AUDIT.md

cat > QUALITY_GATE_BYPASS_AUDIT.md << 'EOF'

# Quality Gate Bypass Audit

## 2.1 File Size Exceptions

None.

## 2.2 Ruff Exceptions

None.

## 2.3 Basedpyright Exceptions

None. EOF

# Create .cursorrules

cat > .cursorrules << 'EOF'

# <Repo Name> — Per-Repo Rules

Inherits workspace rules from `../.cursorrules`.

## Library Identity

This is a Tier [0/1/2] library: [brief description].

## Tier Architecture Rules

- Tier 0: No dependencies on other unified libraries
- Tier 1: Depends on Tier 0 only
- Tier 2: Depends on Tier 0 only (NO circular imports)

## Library-Specific Patterns

- Pattern 1: Description
- Pattern 2: Description

## Public API

Export all public symbols at top level in **init**.py. Services import from package root, not nested modules.

EOF

````

### For Services

See [service-setup-checklist.md](service-setup-checklist.md) for complete service setup using ServiceCLI.

Quick scaffold:

```bash
# Create directory structure
mkdir -p <service_name>/ tests/unit tests/integration schemas/ scripts/ docs/

# Create config.py
cat > <service_name>/config.py << 'EOF'
"""Service configuration."""

from unified_config_interface import UnifiedCloudConfig


class <ServiceName>Config(UnifiedCloudConfig):
    """Configuration for <service-name>."""

    service_name: str = "<service-name>"
    # Add service-specific fields
EOF

# Create handlers.py (see service-setup-checklist.md for full example)
cat > <service_name>/handlers.py << 'EOF'
"""Service mode handlers."""

from unified_trading_services import BaseModeHandler
# Import from unified libraries, not local business logic

class BatchHandler(BaseModeHandler):
    # Delegate to unified libraries
    pass

class LiveHandler(BaseModeHandler):
    # Delegate to unified libraries
    pass
EOF

# Create cli.py using ServiceCLI
cat > <service_name>/cli.py << 'EOF'
"""CLI interface."""

from unified_trading_services import ServiceCLI
from <service_name>.config import <ServiceName>Config
from <service_name>.handlers import BatchHandler, LiveHandler

def main() -> None:
    config = <ServiceName>Config()
    handlers = {"batch": BatchHandler(config), "live": LiveHandler(config)}
    cli = ServiceCLI(service_name=config.service_name, handlers=handlers, config=config)
    cli.run()
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml ./
RUN pip install uv && uv pip install --system -e ".[dev]"

COPY . .

CMD ["python", "-m", "<service_name>"]
EOF

# Create cloudbuild.yaml
cat > cloudbuild.yaml << 'EOF'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/<service-name>:$SHORT_SHA'
      - '.'
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/<service-name>:$SHORT_SHA'
EOF

# Create .env.example
cat > .env.example << 'EOF'
GCP_PROJECT_ID=your-project-id
ENVIRONMENT=development
EOF

# Create test_event_logging.py
cat > tests/unit/test_event_logging.py << 'EOF'
"""Test event logging compliance."""

from unified_events_interface import setup_events, log_event


def test_event_logging_setup():
    """Test event logging setup."""
    setup_events(service_name="<service-name>", mode="batch")
    log_event("STARTED")
    log_event("STOPPED")
EOF
```

### For UIs

See [ui-setup-checklist.md](ui-setup-checklist.md) for complete UI setup.

Quick scaffold:

```bash
# Initialize React project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install
npm install react-router-dom @tanstack/react-query axios
npm install -D @playwright/test vitest @testing-library/react

# Create quality gates script (TypeScript only, no Python)
mkdir -p scripts
cat > scripts/quality-gates.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "=== Quality Gates for <ui-name> ==="

# Step 1: ESLint
npm run lint

# Step 2: TypeScript compiler
npm run type-check

# Step 3: Tests
npm run test:smoke

echo "=== Quality gates passed ==="
EOF

chmod +x scripts/quality-gates.sh
```

## Step 5: Add Quality Gates Scripts

### For Python Repos (Services and Libraries)

**Do NOT copy a full `quality-gates.sh` from another repo.** All gate logic lives centrally in
`unified-trading-pm/scripts/quality-gates-base/`. Create a thin config stub only:

```bash
mkdir -p scripts

# --- SERVICE repo stub ---
cat > scripts/quality-gates.sh << 'STUB'
#!/usr/bin/env bash
# Repo-specific settings only. Body: unified-trading-pm/scripts/quality-gates-base/base-service.sh
SERVICE_NAME="<repo-name>"
SOURCE_DIR="<package_dir>"
MIN_COVERAGE=70
RUN_INTEGRATION=false
PYTEST_WORKERS=${PYTEST_WORKERS:-2}
LOCAL_DEPS=()
WORKSPACE_ROOT="$(cd "$(git rev-parse --show-toplevel)/.." && pwd)"
source "${WORKSPACE_ROOT}/unified-trading-pm/scripts/quality-gates-base/base-service.sh"
STUB

# --- LIBRARY repo stub (use this instead for library/interface repos) ---
# cat > scripts/quality-gates.sh << 'STUB'
# #!/usr/bin/env bash
# # Repo-specific settings only. Body: unified-trading-pm/scripts/quality-gates-base/base-library.sh
# SOURCE_DIR="<package_dir>"
# MIN_COVERAGE=70
# LOCAL_DEPS=()
# WORKSPACE_ROOT="$(cd "$(git rev-parse --show-toplevel)/.." && pwd)"
# source "${WORKSPACE_ROOT}/unified-trading-pm/scripts/quality-gates-base/base-library.sh"
# STUB

chmod +x scripts/quality-gates.sh

# Copy quickmerge.sh from PM (canonical location)
cp ../unified-trading-pm/scripts/quickmerge.sh scripts/
chmod +x scripts/quickmerge.sh
```

See `unified-trading-pm/scripts/quality-gates-base/README.md` for all stub templates and required variable reference.

### For UI Repos

```bash
# Quality gates already created in Step 4 scaffold
# Verify it exists
ls -l scripts/quality-gates.sh
```

---

## Step 6: Initialize Dependencies

### For Python Repos

```bash
# Install dependencies
uv pip install -e ".[dev]"

# Generate uv.lock
uv lock

# Run quality gates to verify setup
bash scripts/quality-gates.sh --no-fix
```

### For UI Repos

```bash
# Dependencies already installed in Step 4 scaffold
# Run quality gates to verify setup
bash scripts/quality-gates.sh --no-fix
```

## Step 7: Update Workspace Manifest

```bash
cd ../unified-trading-pm

# Edit workspace-manifest.json
# Add entry to "repositories" array:
```

```json
{
  "name": "<repo-name>",
  "path": "<repo-name>",
  "type": "library", // or "service" or "ui"
  "arch_tier": 0, // 0, 1, or 2 (Python only)
  "doc_standard": "complete",
  "dependencies": [],
  "merge_level": "auto"
}
```

```bash
# Add to "versions" if versioned library:
```

```json
{
  "<package-name>": "0.1.0"
}
```

```bash
# Add to "topologicalOrder" at appropriate level (L0=PM, L1=codex, L2=T0 libs, L3+=higher tiers)
# Add to "publishingOrder" at appropriate step for libraries

# Commit manifest update
bash scripts/quickmerge.sh "feat: add <repo-name> to workspace manifest"
```

---

## Step 8: Install in Workspace Venv

### For Python Repos

```bash
cd /Users/ikennaigboaka/Documents/repos/unified-trading-system-repos

# Activate workspace venv
source .venv-workspace/bin/activate

# Install new package in editable mode
uv pip install -e <repo-name>/

# Verify installation
python -c "import <package_name>; print(<package_name>.__version__)"
```

### For UI Repos

```bash
# UIs are not installed in workspace venv
# They run independently with npm/pnpm
```

---

## Step 9: Update Dependent Repos (Dependency Chain)

**CRITICAL:** When creating a new library, ALL dependent repos must be updated.

### Dependency Chain by Tier

**Tier 0 Library Created:**
```
1. Update all Tier 1 libraries that depend on it
2. Update all Tier 2 libraries that depend on it
3. Update all services that depend on it
```

**Tier 1 Library Created:**
```
1. Update all Tier 2 libraries that depend on it (if any)
2. Update all services that depend on it
```

**Tier 2 Library Created:**
```
1. Update all services that depend on it
```

**Service Created:**
```
No downstream updates needed (services are leaf nodes)
```

### Update Process for Each Dependent Repo

For each repo that depends on the new package:

```bash
cd <dependent-repo>

# Add dependency to pyproject.toml
# [project.dependencies]
# "<package-name>>=0.1.0,<1.0.0"

# Or for local dev:
# [tool.uv.sources]
# <package-name> = { path = "../<repo-name>" }

# Update lock file
uv lock

# Install updated dependencies
uv pip install -e ".[dev]"

# Update imports in code
# from <package_name> import ...

# Run quality gates
bash scripts/quality-gates.sh

# Commit changes
bash scripts/quickmerge.sh "feat: add <package-name> dependency"
```

### Example: Creating a New Tier 0 Library

```bash
# 1. Create unified-new-interface (Tier 0)
cd unified-new-interface
# ... scaffold and implement ...
bash scripts/quickmerge.sh "feat: initial implementation"

# 2. Update unified-trading-services (Tier 1)
cd ../unified-trading-services
# Add to pyproject.toml: unified-new-interface>=1.0.0,<2.0.0
uv lock && bash scripts/quality-gates.sh
bash scripts/quickmerge.sh "feat: add unified-new-interface dependency"

# 3. Update unified-market-interface (Tier 2)
cd ../unified-market-interface
# Add to pyproject.toml: unified-new-interface>=1.0.0,<2.0.0
uv lock && bash scripts/quality-gates.sh
bash scripts/quickmerge.sh "feat: add unified-new-interface dependency"

# 4. Update all services
cd ../instruments-service
# Add to pyproject.toml: unified-new-interface>=1.0.0,<2.0.0
uv lock && bash scripts/quality-gates.sh
bash scripts/quickmerge.sh "feat: add unified-new-interface dependency"

# Repeat for all other services...
```

## Step 10: Update Workspace Gitignore (If Needed)

If the repo was previously in `.gitignore`:

```bash
cd /Users/ikennaigboaka/Documents/repos/unified-trading-system-repos

# Edit .gitignore
# Remove line: <repo-name>/

# Commit change
cd unified-trading-pm
bash scripts/quickmerge.sh "chore: remove <repo-name> from gitignore"
```

---

## Step 11: Initial Commit

```bash
cd <repo-name>

# Stage all files
git add -A

# Commit
git commit -m "feat: initial scaffold for <repo-name>"

# Push to GitHub
git push origin main
```

---

## Step 12: Set Up Branch Protection

```bash
# Enable branch protection for main
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/IggyIkenna/<repo-name>/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=quality-gates \
  -f enforce_admins=false \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f restrictions=null
```

---

## Step 13: Add GitHub Actions Workflow

> **SSOT**: `unified-trading-pm/docs/ci-cd-ssot.md`
> Do NOT hand-write these files. Use the rollout script — it reads `dep_repos` from the manifest and writes the correct thin caller.

```bash
# From workspace root — generates the file from the canonical template:
python3 unified-trading-pm/scripts/propagation/rollout-quality-gates-ci-workflows.py \
  --workflow-call --repo <repo-name>
```

### What Gets Generated (Python Repos)

```yaml
name: Quality Gates

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality-gates:
    uses: IggyIkenna/unified-trading-pm/.github/workflows/python-quality-gates.yml@<active_branch>
    with:
      dep_repos: "unified-trading-library unified-config-interface" # from manifest dependencies[]
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

All CI logic (Python 3.13.9 setup, uv, tools, dep clone, `uv sync`, run QG, record status) lives in
`unified-trading-pm/.github/workflows/python-quality-gates.yml`. Never inline it here.

### What Gets Generated (UI Repos)

```yaml
name: Quality Gates

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality-gates:
    uses: IggyIkenna/unified-trading-pm/.github/workflows/ui-quality-gates.yml@<active_branch>
    with:
      node-version: "22"
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

### Commit

```bash
cd <repo>
git add .github/workflows/quality-gates.yml
# Commit via quickmerge on the next pass — never git push directly
```

## Dependency Chain Flow Summary

When adding a new repo to the dependency chain:

### Tier 0 Library (No Dependencies)

```
1. Create repo (Steps 1-6)
2. Update workspace manifest (Step 7)
3. Install in workspace venv (Step 8)
4. Update dependent Tier 1/2 libraries (Step 9)
5. Update services (Step 9)
6. Initial commit and branch protection (Steps 11-12)
7. Add GitHub Actions workflow (Step 13)
```

### Tier 1 Library (Depends on Tier 0)

```
1. Create repo (Steps 1-6)
2. Add Tier 0 dependencies to pyproject.toml
3. Update workspace manifest (Step 7)
4. Install in workspace venv (Step 8)
5. Update dependent Tier 2 libraries (Step 9)
6. Update services (Step 9)
7. Initial commit and branch protection (Steps 11-12)
8. Add GitHub Actions workflow (Step 13)
```

### Tier 2 Library (Depends on Tier 0 only)

```
1. Create repo (Steps 1-6)
2. Add Tier 0 dependencies to pyproject.toml
3. Update workspace manifest (Step 7)
4. Install in workspace venv (Step 8)
5. Update services (Step 9)
6. Initial commit and branch protection (Steps 11-12)
7. Add GitHub Actions workflow (Step 13)
```

### Service (Depends on Tier 0, 1, 2)

```
1. Create repo (Steps 1-6) using ServiceCLI framework
2. Add library dependencies to pyproject.toml
3. Update workspace manifest (Step 7)
4. Install in workspace venv (Step 8)
5. No downstream updates needed (services are leaf nodes)
6. Initial commit and branch protection (Steps 11-12)
7. Add GitHub Actions workflow (Step 13)
```

### UI (No Python Dependencies)

```
1. Create repo (Steps 1-6) with TypeScript/React/Vue
2. Update workspace manifest (Step 7) with type: "ui"
3. No workspace venv install (Step 8 skipped)
4. No downstream updates needed (UIs are leaf nodes)
5. Initial commit and branch protection (Steps 11-12)
6. Add GitHub Actions workflow (Step 13) with Node.js
```

## Checklist Template

Use this checklist for each new repo:

- [ ] Step 1: Create GitHub repo via `gh repo create`
- [ ] Step 2: Grant access to CosmicTrader and datado
- [ ] Step 3: Determine repo type (service/library/UI) and tier (0/1/2 for libraries)
- [ ] Step 4: Scaffold structure (pyproject.toml/package.json, README, docs, .cursorrules)
- [ ] Step 5: Add quality-gates.sh and quickmerge.sh (Python) or quality-gates.sh only (UI)
- [ ] Step 6: Run `uv lock` (Python) or `npm ci` (UI) and verify quality gates pass
- [ ] Step 7: Update workspace-manifest.json with correct type and tier
- [ ] Step 8: Install in workspace venv (`uv pip install -e <repo>/`) for Python repos only
- [ ] Step 9: Update dependent repos (add to pyproject.toml, run `uv lock`) - follow dependency chain
- [ ] Step 10: Remove from .gitignore if needed
- [ ] Step 11: Initial commit and push
- [ ] Step 12: Set up branch protection
- [ ] Step 13: Add GitHub Actions workflow (Python or Node.js based on repo type)

## Common Issues

### Issue: `uv lock` fails with dependency conflict

**Solution:** Check dependency versions in codex `06-coding-standards/dependency-management.md`. Align versions across
all repos.

### Issue: Workspace venv doesn't have new package

**Solution:** Run `uv pip install -e <repo>/` from workspace root with venv activated.

### Issue: Quality gates fail on first run

**Solution:** Run `bash scripts/quality-gates.sh` (without `--no-fix`) to auto-fix formatting issues.

### Issue: GitHub CLI auth fails

**Solution:** Run `gh auth login` and follow prompts.

### Issue: Branch protection setup fails

**Solution:** Verify you have admin access to the repo. Check GitHub settings manually if CLI fails.

## References

| Document | Description |
|----------|-------------|
| [service-setup-checklist.md](service-setup-checklist.md) | Complete service setup with ServiceCLI |
| [library-setup-checklist.md](library-setup-checklist.md) | Complete library setup by tier |
| [ui-setup-checklist.md](ui-setup-checklist.md) | Complete UI setup with TypeScript |
| `unified-trading-pm/workspace-manifest.json` | Workspace manifest |
| `06-coding-standards/dependency-management.md` | Dependency alignment |
| `quickmerge-templates/quality-gates.sh` | Quality gates template |
| `quickmerge-templates/quickmerge.sh` | Quickmerge template |
| `unified-libraries/LIBRARY-DEPENDENCY-MATRIX.md` | Tier architecture |
````
