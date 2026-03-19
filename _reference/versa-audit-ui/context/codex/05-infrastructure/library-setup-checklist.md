# Library Setup Checklist

## TL;DR

Complete checklist for setting up a new library from scratch: tier architecture, dependency management, quality gates,
publishing to Artifact Registry.

**Libraries contain business logic**: Services are thin orchestrators that delegate to libraries.

---

## Prerequisites

- [ ] GitHub CLI (`gh`) installed and authenticated
- [ ] `uv` package manager installed
- [ ] Workspace venv at `.venv-workspace/` exists
- [ ] `UNIFIED_TRADING_WORKSPACE_ROOT` environment variable set
- [ ] Determine library tier (0, 1, or 2)

---

## Tier Architecture

### Tier 0: No Dependencies

**Examples:** unified-api-contracts, unified-config-interface, unified-events-interface, unified-internal-contracts

**Allowed Dependencies:**

- Standard library only
- Third-party packages (pydantic, pandas, numpy, etc.)
- NO other unified libraries

**Use Cases:**

- Configuration schemas
- Event definitions
- External API contracts
- Domain models

### Tier 1: Depends on Tier 0 Only

**Examples:** unified-trading-services

**Allowed Dependencies:**

- Tier 0 libraries
- Third-party packages
- NO Tier 2 libraries (prevents circular imports)

**Use Cases:**

- Cloud primitives (storage, secrets, pubsub)
- Service framework (ServiceCLI, BaseModeHandler)
- Cross-cutting concerns

### Tier 2: Depends on Tier 0 Only

**Examples:** unified-market-interface, unified-trade-execution-interface, unified-domain-client

**Allowed Dependencies:**

- Tier 0 libraries
- unified-trading-services (Tier 1) - ONLY exception
- Third-party packages
- NO other Tier 2 libraries (prevents circular imports)

**Use Cases:**

- Domain-specific business logic
- Market data adapters
- Execution adapters
- Feature engineering

---

## Phase 1: Repository Creation

### 1.1 Create GitHub Repository

```bash
cd $UNIFIED_TRADING_WORKSPACE_ROOT

gh repo create IggyIkenna/<library-name> \
  --private \
  --description "Brief library description" \
  --clone

cd <library-name>
```

### 1.2 Grant Team Access

```bash
# Add CosmicTrader (read/write)
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/IggyIkenna/<library-name>/collaborators/CosmicTrader \
  -f permission='push'

# Add datado (read/write)
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/IggyIkenna/<library-name>/collaborators/datado \
  -f permission='push'

# Verify
gh api /repos/IggyIkenna/<library-name>/collaborators
```

---

## Phase 2: Directory Structure

### 2.1 Create Core Directories

```bash
mkdir -p <package_name>/ tests/unit tests/integration docs/ scripts/ .github/workflows

# Note: Libraries contain business logic
# - Services delegate to libraries
# - Export public API at top level (__init__.py)
# - Follow tier architecture rules
```

### 2.2 Create Package Files

```bash
# Package __init__.py
cat > <package_name>/__init__.py << 'EOF'
"""<Package description>."""

__version__ = "0.1.0"

# Export public API at top level
# Services import from package root, not nested modules
# Example:
# from .<module> import PublicClass, public_function
# __all__ = ["PublicClass", "public_function"]
EOF
```

---

## Phase 3: Configuration Files

### 3.1 Create pyproject.toml

**For Tier 0 Library:**

```bash
cat > pyproject.toml << 'EOF'
[project]
name = "<package-name>"
version = "0.1.0"
description = "Brief description"
requires-python = ">=3.13,<3.14"
dependencies = [
    "pydantic>=2.10.5,<3.0.0",
    # Add third-party dependencies only
    # NO other unified libraries
]

[project.optional-dependencies]
dev = [
    "pytest>=9.0.1",
    "pytest-cov>=7.0.0",
    "pytest-asyncio>=0.25.0",
    "pytest-xdist>=3.6.1",
    "pytest-mock>=3.14.0",
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

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short --strict-markers"
markers = [
    "integration: integration tests requiring external services",
]

[tool.coverage.run]
source = ["<package_name>"]
omit = ["tests/*"]

[tool.coverage.report]
precision = 2
show_missing = true
skip_covered = false
fail_under = 35
EOF
```

**For Tier 1 Library:**

```bash
cat > pyproject.toml << 'EOF'
[project]
name = "<package-name>"
version = "0.1.0"
description = "Brief description"
requires-python = ">=3.13,<3.14"
dependencies = [
    # Tier 0 dependencies
    "unified-config-interface>=1.0.0,<2.0.0",
    "unified-events-interface>=1.0.0,<2.0.0",
    "unified-api-contracts>=1.0.0,<2.0.0",
    # Third-party dependencies
    "pydantic>=2.10.5,<3.0.0",
    "google-cloud-storage>=2.18.2,<3.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=9.0.1",
    "pytest-cov>=7.0.0",
    "pytest-asyncio>=0.25.0",
    "pytest-xdist>=3.6.1",
    "pytest-mock>=3.14.0",
    "ruff==0.15.0",
    "basedpyright>=1.25.0",
]

# ... rest same as Tier 0 ...
EOF
```

**For Tier 2 Library:**

```bash
cat > pyproject.toml << 'EOF'
[project]
name = "<package-name>"
version = "0.1.0"
description = "Brief description"
requires-python = ">=3.13,<3.14"
dependencies = [
    # Tier 0 dependencies
    "unified-config-interface>=1.0.0,<2.0.0",
    "unified-events-interface>=1.0.0,<2.0.0",
    "unified-api-contracts>=1.0.0,<2.0.0",
    # Tier 1 dependencies (only UTS allowed)
    "unified-trading-services>=2.0.0,<3.0.0",
    # Third-party dependencies
    "pydantic>=2.10.5,<3.0.0",
    "pandas>=2.2.3,<3.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=9.0.1",
    "pytest-cov>=7.0.0",
    "pytest-asyncio>=0.25.0",
    "pytest-xdist>=3.6.1",
    "pytest-mock>=3.14.0",
    "ruff==0.15.0",
    "basedpyright>=1.25.0",
]

# ... rest same as Tier 0 ...
EOF
```

### 3.2 Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
.venv/
venv/
ENV/
env/

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local

# Credentials
*credentials*.json
*service-account*.json

# Logs
*.log

# UV
uv.lock
EOF
```

---

## Phase 4: Testing Setup

### 4.1 Create conftest.py

```bash
cat > tests/conftest.py << 'EOF'
"""Shared test fixtures."""

import os
from pathlib import Path

import pytest
from google.auth import default
from google.auth.exceptions import DefaultCredentialsError
from google.oauth2 import service_account


@pytest.fixture(scope="session")
def gcp_auth_info():
    """Get GCP authentication info."""
    # 1. SA key file (GitHub Actions)
    creds_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if creds_file and Path(creds_file).exists():
        credentials = service_account.Credentials.from_service_account_file(creds_file)
        import json
        project_id = json.load(open(creds_file)).get("project_id")
        return credentials, project_id, creds_file

    # 2. ADC (local dev + Cloud Build)
    try:
        credentials, project = default()
        project_id = project or os.getenv("GCP_PROJECT_ID") or os.getenv("GCP_PROJECT_ID")
        return credentials, project_id or "test-project", None
    except DefaultCredentialsError:
        pass

    # 3. No credentials → unit tests use mocks
    return None, "test-project", None


@pytest.fixture(scope="session")
def gcp_credentials(gcp_auth_info):
    """Get GCP credentials."""
    credentials, _, _ = gcp_auth_info
    return credentials


@pytest.fixture(scope="session")
def gcp_project_id(gcp_auth_info):
    """Get GCP project ID."""
    _, project_id, _ = gcp_auth_info
    return project_id


@pytest.fixture(autouse=True)
def _skip_integration_without_creds(request, gcp_auth_info):
    """Skip integration tests without GCP credentials."""
    if "integration" in request.keywords:
        credentials, _, _ = gcp_auth_info
        if credentials is None:
            pytest.skip("No GCP credentials — skipping integration test")
EOF
```

### 4.2 Create Basic Unit Tests

```bash
cat > tests/unit/test_import.py << 'EOF'
"""Test basic imports."""

import <package_name>


def test_version():
    """Test version is defined."""
    assert hasattr(<package_name>, "__version__")
    assert isinstance(<package_name>.__version__, str)
EOF
```

---

## Phase 5: Quality Gates Scripts

### 5.1 Create Quality Gates Script

**Do NOT copy a full `quality-gates.sh` body.** All gate logic lives centrally in
`unified-trading-pm/scripts/quality-gates-base/base-library.sh`. Create a thin config stub only:

```bash
cat > scripts/quality-gates.sh << 'STUB'
#!/usr/bin/env bash
# Repo-specific settings only. Body: unified-trading-pm/scripts/quality-gates-base/base-library.sh
SOURCE_DIR="<package_dir>"
MIN_COVERAGE=70
LOCAL_DEPS=()
WORKSPACE_ROOT="$(cd "$(git rev-parse --show-toplevel)/.." && pwd)"
source "${WORKSPACE_ROOT}/unified-trading-pm/scripts/quality-gates-base/base-library.sh"
STUB

chmod +x scripts/quality-gates.sh
```

Replace `<package_dir>` with the Python package directory name (underscore form, e.g. `unified_events_interface`). Set
`MIN_COVERAGE` to `(actual_coverage - 1%)` after the first successful test run.

See `unified-trading-pm/scripts/quality-gates-base/README.md` for the full variable reference and all stub templates.

### 5.2 Create Quickmerge Script

```bash
cat > scripts/quickmerge.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Quickmerge for <package-name>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

# Parse arguments
COMMIT_MESSAGE="${1:-}"
DEP_BRANCH=""
FILES=""

shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --dep-branch) DEP_BRANCH="$2"; shift 2 ;;
        --files) FILES="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$COMMIT_MESSAGE" ]]; then
    echo "Usage: bash scripts/quickmerge.sh \"commit message\" [--dep-branch branch-name] [--files \"file1 file2\"]"
    exit 1
fi

# Activate venv
if [[ ! -d .venv ]]; then
    echo "Creating virtual environment..."
    python3.13 -m venv .venv
fi

source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
uv pip install -e ".[dev]"

# Run quality gates (auto-fix)
echo "Running quality gates (auto-fix)..."
bash scripts/quality-gates.sh

# Run quality gates (verify)
echo "Running quality gates (verify)..."
bash scripts/quality-gates.sh --no-fix

# Stage files
if [[ -n "$FILES" ]]; then
    git add $FILES
else
    git add -A
fi

# Commit
git commit -m "$COMMIT_MESSAGE"

# Push
if [[ -n "$DEP_BRANCH" ]]; then
    git push -u origin "$DEP_BRANCH"
else
    git push origin HEAD
fi

echo "=== Quickmerge complete ==="
EOF

chmod +x scripts/quickmerge.sh
```

---

## Phase 6: Documentation

### 6.1 Create README.md

````bash
cat > README.md << 'EOF'
# <Package Name>

Brief package description.

**Tier**: [0/1/2]
**Dependencies**: [List Tier 0 dependencies]

## Installation

```bash
uv pip install -e .
````

## Usage

```python
from <package_name> import PublicClass, public_function

# Example usage
obj = PublicClass()
result = public_function()
```

## Development

### Run Tests

```bash
pytest
```

### Run Quality Gates

```bash
bash scripts/quality-gates.sh
```

### Commit Changes

```bash
bash scripts/quickmerge.sh "feat: add feature"
```

## Architecture

See `docs/ARCHITECTURE.md` for detailed architecture.

## License

Private - All Rights Reserved EOF

````

### 6.2 Create ARCHITECTURE.md

```bash
cat > docs/ARCHITECTURE.md << 'EOF'
# Architecture

## Overview

<Package-name> is a Tier [0/1/2] library that [brief description].

## Tier Architecture

**Tier**: [0/1/2]

**Allowed Dependencies**:
- Tier 0: No unified libraries, only third-party
- Tier 1: Tier 0 only
- Tier 2: Tier 0 only (plus unified-trading-services)

**Circular Import Prevention**:
- Quality gates enforce no circular imports
- Each tier can only depend on lower tiers
- Tier 2 libraries cannot depend on each other

## Components

### Component 1

Description of component 1.

### Component 2

Description of component 2.

## Public API

All public symbols are exported at the top level in `__init__.py`.

Services import from package root:
```python
from <package_name> import PublicClass  # Correct
# NOT: from <package_name>.module import PublicClass
```

## Testing Strategy

- Unit tests: Synthetic fixtures, mocked dependencies
- Integration tests: Real API/GCS calls (marked with @pytest.mark.integration)

## Dependencies

### Tier 0 Dependencies
- List Tier 0 dependencies

### Tier 1 Dependencies (if Tier 2)
- unified-trading-services (only allowed Tier 1 dependency)

### Third-Party Dependencies
- List third-party dependencies
EOF
```

### 6.3 Create QUALITY_GATE_BYPASS_AUDIT.md

```bash
cat > QUALITY_GATE_BYPASS_AUDIT.md << 'EOF'
# Quality Gate Bypass Audit

## 2.1 File Size Exceptions

None.

## 2.2 Ruff Exceptions

None.

## 2.3 Basedpyright Exceptions

None.
EOF
```

### 6.4 Create .cursorrules

```bash
cat > .cursorrules << 'EOF'
# <Package Name> — Per-Repo Rules

Inherits workspace rules from `../.cursorrules`.

## Library Identity

This is a Tier [0/1/2] library: [brief description].

## Tier Architecture Rules

- Tier 0: No dependencies on other unified libraries
- Tier 1: Depends on Tier 0 only
- Tier 2: Depends on Tier 0 only (NO circular imports)

## Public API

Export all public symbols at top level in __init__.py.
Services import from package root, not nested modules.

## Business Logic

This library contains business logic.
Services are thin orchestrators that delegate to this library.

## Library-Specific Patterns

- Pattern 1: Description
- Pattern 2: Description

## Testing

- Unit tests: Synthetic fixtures, mocked dependencies
- Integration tests: Real API/GCS calls (marked with @pytest.mark.integration)
EOF
```

---

## Phase 7: CI/CD Setup

### 7.1 Create GitHub Actions Workflow

```bash
mkdir -p .github/workflows

cat > .github/workflows/quality-gates.yml << 'EOF'
name: Quality Gates

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv pip install --system -e ".[dev]"

      - name: Run quality gates
        run: bash scripts/quality-gates.sh --no-fix --quick
        env:
          GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID_DEV }}
          ENVIRONMENT: development
EOF
```

### 7.2 Create Publishing Workflow

```bash
cat > .github/workflows/publish.yml << 'EOF'
name: Publish to Artifact Registry

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'

      - name: Install uv
        run: pip install uv

      - name: Build package
        run: |
          uv pip install --system build
          python -m build

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Publish to Artifact Registry
        run: |
          uv pip install --system twine
          twine upload --repository-url https://asia-northeast1-python.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/unified-libraries/ dist/*
EOF
```

---

## Phase 8: Initial Commit

```bash
# Stage all files
git add -A

# Commit
git commit -m "feat: initial scaffold for <package-name>"

# Push
git push origin main
```

---

## Phase 9: Branch Protection

```bash
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/IggyIkenna/<package-name>/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=quality-gates \
  -f enforce_admins=false \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f restrictions=null
```

---

## Phase 10: Workspace Integration

### 10.1 Update Workspace Manifest

```bash
cd $UNIFIED_TRADING_WORKSPACE_ROOT/unified-trading-pm

# Edit workspace-manifest.json
# Add to "repositories" array
```

```json
{
  "name": "<package-name>",
  "path": "<package-name>",
  "type": "library",
  "arch_tier": 0,  // or 1 or 2
  "doc_standard": "complete",
  "dependencies": [],
  "merge_level": "auto"
}
```

```bash
# Add to "versions"
```

```json
{
  "<package-name>": "0.1.0"
}
```

```bash
# Add to "topologicalOrder" at appropriate level (L2=T0 libs, L3=T1, L4+=higher tiers)
# Add to "publishingOrder" at appropriate step

# Commit manifest update
bash scripts/quickmerge.sh "feat: add <package-name> to workspace manifest"
```

### 10.2 Install in Workspace Venv

```bash
cd $UNIFIED_TRADING_WORKSPACE_ROOT
source .venv-workspace/bin/activate
uv pip install -e <package-name>/

# Verify installation
python -c "import <package_name>; print(<package_name>.__version__)"
```

---

## Phase 11: Update Dependent Repos (Dependency Chain)

**CRITICAL:** When creating a new library, ALL dependent repos must be updated.

### Dependency Chain by Tier

**Tier 0 Library Created:**
```
1. Update all Tier 1 libraries that will use it
2. Update all Tier 2 libraries that will use it
3. Update all services that will use it
```

**Tier 1 Library Created:**
```
1. Update all Tier 2 libraries that will use it (if any)
2. Update all services that will use it
```

**Tier 2 Library Created:**
```
1. Update all services that will use it
```

### Update Process

For each dependent repo:

```bash
cd <dependent-repo>

# Add dependency to pyproject.toml
# [project.dependencies]
# "<package-name>>=0.1.0,<1.0.0"

# Or for local dev:
# [tool.uv.sources]
# <package-name> = { path = "../<package-name>" }

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

---

## Verification Checklist

- [ ] Repository created and team access granted
- [ ] Directory structure complete
- [ ] pyproject.toml with correct tier dependencies
- [ ] Public API exported at top level in __init__.py
- [ ] Unit tests created and passing
- [ ] Quality gates pass locally
- [ ] GitHub Actions workflow runs
- [ ] Publishing workflow configured
- [ ] Documentation complete
- [ ] Branch protection enabled
- [ ] Workspace manifest updated with correct tier
- [ ] Installed in workspace venv
- [ ] Dependent repos updated (follow dependency chain)

---

## Common Issues

### Issue: Circular import detected

**Solution:** Check tier dependencies. Tier 2 libraries cannot depend on each other. Move shared code to Tier 0 or Tier 1.

### Issue: Quality gates fail on first run

**Solution:** Run without `--no-fix` to auto-fix formatting.

### Issue: Dependent repos not updated

**Solution:** Follow dependency chain. Tier 0 changes cascade to Tier 1, Tier 2, and services.

---

## Related Documents

| Document | Description |
|----------|-------------|
| [service-setup-checklist.md](service-setup-checklist.md) | Service setup with ServiceCLI |
| [new-repo-setup.md](new-repo-setup.md) | General repo setup workflow |
| [ui-setup-checklist.md](ui-setup-checklist.md) | UI setup with TypeScript |
| `unified-libraries/LIBRARY-DEPENDENCY-MATRIX.md` | Tier architecture details |
| `06-coding-standards/dependency-management.md` | Dependency alignment |
````
