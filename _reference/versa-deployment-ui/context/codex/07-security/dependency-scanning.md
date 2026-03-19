# Dependency Scanning

## TL;DR

- **All Python dependencies are pinned** in `pyproject.toml` with exact or minimum versions. No unpinned `pip install`
  in production.
- **pip-audit / safety for vulnerability scanning**: [STATUS UNKNOWN]. `pip-audit` has been mentioned in planning but
  its activation in CI pipelines is not confirmed. Target: run on every PR.
- **Docker image scanning**: [IMPLEMENTED]. Trivy scans every Docker image for CRITICAL and HIGH CVEs immediately after
  `docker build`, before quality gates and push. Build fails on any CRITICAL or HIGH finding.
- **Supply chain security**: dependencies are pinned, lockfile hashes are used where possible, and
  `unified-trading-services` is a private internal dependency cloned via authenticated git.
- **Ruff security rules**: ruff lint rules catch some security anti-patterns (e.g., `assert` in production code, bare
  `except`, `eval` usage). [IMPLEMENTED].
- **Pre-commit hooks** enforce formatting and linting consistency. [IMPLEMENTED].

---

## Dependency Pinning [IMPLEMENTED]

### pyproject.toml Strategy

Every service pins dependencies with minimum version constraints in `pyproject.toml`:

```toml
[project]
dependencies = [
    "pandas>=2.2.0",
    "pyarrow>=17.0.0",
    "pydantic>=2.10.0",
    "google-cloud-storage>=2.18.0",
    "google-cloud-bigquery>=3.25.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-xdist>=3.6.0",
    "pytest-asyncio>=0.24.0",
    "pytest-mock>=3.14.0",
    "ruff==0.15.0",          # Exact version -- must match CI
]
```

### Pinning Rules

| Rule                                       | Rationale                                                     |
| ------------------------------------------ | ------------------------------------------------------------- |
| Minimum version for production deps (`>=`) | Allow patch updates for security fixes                        |
| Exact version for ruff (`==`)              | Formatting must be identical across all environments          |
| `pytest-xdist` in all services             | Quality gates use parallel test execution                     |
| No unpinned deps                           | `pip install somepackage` without version is forbidden        |
| Private deps via git clone                 | `unified-trading-services` is cloned, not installed from PyPI |

### unified-trading-services: Internal Dependency

`unified-trading-services` is a private library shared across all 12 services. It is not on PyPI:

```
# In Cloud Build / GitHub Actions:
git clone https://{token}@github.com/org/unified-trading-services.git
pip install ./unified-trading-services

# In Docker:
COPY unified-trading-services/ /deps/unified-trading-services/
RUN pip install /deps/unified-trading-services/
```

This is the only dependency installed from a git clone. All others come from PyPI.

---

## Vulnerability Scanning [IMPLEMENTED — BLOCKING]

### pip-audit [IMPLEMENTED — BLOCKING in all repos]

`pip-audit` checks installed Python packages against the OSV (Open Source Vulnerabilities) database. It is a **blocking
quality gate** — a merge is rejected if any installed dependency has a known CVE.

```bash
# Runs automatically in quality-gates.sh; to run manually:
pip-audit --format json -o /tmp/pip-audit-output.json
```

Integration point: `scripts/quality-gates.sh` in every repo, and GitHub Actions / Cloud Build pipelines.

```bash
# Implemented blocking pattern in quality-gates.sh
pip-audit --format json -o /tmp/pip-audit-output.json 2>/dev/null \
    && log_success "pip-audit clean" \
    || { log_fail "pip-audit vulnerabilities found"; CODEX_VIOLATIONS=$((CODEX_VIOLATIONS + 1)); }
```

### Decision Matrix for Vulnerabilities

| Severity               | Action                              | Timeline        |
| ---------------------- | ----------------------------------- | --------------- |
| Critical (CVSS >= 9.0) | Block merge; fix immediately        | Same day        |
| High (CVSS 7.0-8.9)    | Block merge; fix before next deploy | Within 48 hours |
| Medium (CVSS 4.0-6.9)  | Block merge; fix before next deploy | Within 48 hours |
| Low (CVSS < 4.0)       | Block merge; fix before next deploy | Within 1 sprint |

---

## Internal Package Advisories [IMPLEMENTED — BLOCKING]

pip-audit only covers OSS packages on PyPI. Internal packages (`unified-trading-services`, `unified-config-interface`,
etc.) are tracked via the internal advisory file.

### Source of Truth

**File:** `unified-trading-pm/security/internal-advisories.yaml`

Append-only format — entries are never removed. Add `fixed_in` when a vulnerability is resolved.

```yaml
# severity: CRITICAL | HIGH | MEDIUM | LOW
# affected_versions: PEP 440 specifier (e.g. "<2.0.0", ">=1.0.0,<2.0.0")
advisories:
  - id: INTERNAL-YYYY-NNN
    package: unified-trading-services
    affected_versions: "<2.0.0"
    fixed_in: "2.0.0"
    severity: HIGH
    description: "Brief description of the vulnerability"
    reported_at: "2026-02-27"
    reported_by: "github-username"
```

### How to Add an Advisory

1. Append a new entry to `unified-trading-pm/security/internal-advisories.yaml`
2. Commit to `unified-trading-pm` main branch
3. All repos pick it up automatically on next quality gate run (via `$REPO_ROOT` path)

### Checker Script

**Script:** `unified-trading-pm/scripts/check-internal-advisories.sh`

- Reads `internal-advisories.yaml`
- Checks all installed package versions against advisory specifiers
- Exits non-zero (BLOCKING) if any match found and no `fixed_in` covers the installed version

### SBOM Audit Trail

Each quality gate run stores a pip-audit JSON snapshot in GCS via `get_storage_client()` from `unified_trading_services`
(never direct `google.cloud.storage`):

- **Script:** `unified-trading-pm/scripts/sbom-store.py`
- **Storage path:** `gs://{SBOM_BUCKET}/sboms/{service_name}/{date}/{timestamp}.json`
- **Env vars required:** `GCP_PROJECT_ID`, `SBOM_BUCKET` (default: `uts-sbom-audit`), `SERVICE_NAME`
- Upload is **non-blocking** — failure does not fail the build

```bash
# Env vars for SBOM storage (add to Cloud Build / GitHub Actions):
GCP_PROJECT_ID=...
SBOM_BUCKET=uts-sbom-audit
SERVICE_NAME=my-service
```

---

## Docker Image Scanning [IMPLEMENTED]

### Tool: Trivy (aquasec/trivy)

Trivy runs as a Cloud Build step immediately after `docker build` and before quality gates and push. The build fails
with exit code 1 if any CRITICAL or HIGH CVE is found in the image.

```yaml
# Trivy step added to every cloudbuild.yaml that has a docker build step
- name: "aquasec/trivy"
  id: "trivy-scan"
  args:
    - "image"
    - "--exit-code"
    - "1"
    - "--severity"
    - "CRITICAL,HIGH"
    - "--no-progress"
    - "<image>:latest"
  waitFor: ["build"]
```

### Scanning Scope

| Layer            | What's Scanned                     | Scanner                                 |
| ---------------- | ---------------------------------- | --------------------------------------- |
| OS packages      | Debian/Ubuntu base image packages  | Trivy [IMPLEMENTED]                     |
| Python packages  | pip-installed packages in image    | Trivy [IMPLEMENTED]                     |
| Application code | Static analysis of Python source   | ruff (already in CI)                    |
| Secrets          | Leaked credentials in image layers | [PLANNED] (e.g., Trivy secret scanning) |

### Implemented Integration

```
Cloud Build Pipeline (implemented):

  docker build -> trivy-scan -> quality-gates -> docker push
                      |
                      v
                Scan results
                      |
              +-------+-------+
              |               |
         No CRITICAL/    CRITICAL/HIGH
         HIGH vulns       found
              |               |
         Continue         Exit 1 —
         pipeline         build fails
```

### Repos with Trivy Scanning

- `instruments-service/cloudbuild.yaml` — scans `instruments/instruments-service:latest`
- `position-balance-monitor-service/cloudbuild.yaml` — scans
  `position-balance-monitor-service/position-balance-monitor-service:latest`

---

## Supply Chain Security [IMPLEMENTED]

### Controls in Place

| Control                       | Description                                                       | Status        |
| ----------------------------- | ----------------------------------------------------------------- | ------------- |
| Pinned versions               | All deps have version constraints in pyproject.toml               | [IMPLEMENTED] |
| Private internal dep          | unified-trading-services cloned via authenticated git (not PyPI)  | [IMPLEMENTED] |
| No arbitrary package installs | Dockerfile only installs from pyproject.toml                      | [IMPLEMENTED] |
| Reproducible builds           | Same pyproject.toml produces same install (within version ranges) | [IMPLEMENTED] |
| Pre-commit hooks              | Enforce code quality before commit                                | [IMPLEMENTED] |
| Branch protection             | No direct push to main; all changes via PR                        | [IMPLEMENTED] |

### Planned Controls

| Control                 | Description                                                              | Status        |
| ----------------------- | ------------------------------------------------------------------------ | ------------- |
| SBOM generation         | pip-audit JSON stored in GCS via sbom-store.py on every quality gate run | [IMPLEMENTED] |
| Internal advisories     | unified-trading-pm/security/internal-advisories.yaml + checker script    | [IMPLEMENTED] |
| Hash verification       | `pip install --require-hashes` with lockfile                             | [PLANNED]     |
| Dependency review on PR | GitHub Dependency Review Action                                          | [PLANNED]     |
| Dependabot / Renovate   | Automated dependency update PRs                                          | [PLANNED]     |
| Signing                 | Docker image signing with cosign/sigstore                                | [PLANNED]     |

### Lock File Strategy [PLANNED]

Currently, dependencies are specified with version ranges (`>=`) in `pyproject.toml`. A lockfile would pin exact
versions with hashes:

```bash
# Target: generate lockfile
pip-compile pyproject.toml --generate-hashes -o requirements.lock

# Target: install from lockfile
pip install --require-hashes -r requirements.lock
```

This ensures bit-for-bit reproducible installs and prevents supply chain substitution attacks.

---

## Ruff Security Rules [IMPLEMENTED]

Ruff already enforces several security-relevant lint rules:

| Rule        | What It Catches                                         | Category    |
| ----------- | ------------------------------------------------------- | ----------- |
| `S101`      | `assert` used outside tests (can be stripped with `-O`) | Security    |
| `S102`      | `exec()` usage                                          | Security    |
| `S103`      | `os.chmod` with permissive mode                         | Security    |
| `S104`      | Binding to `0.0.0.0`                                    | Security    |
| `S105-S107` | Hardcoded passwords, temp file paths                    | Security    |
| `S108`      | Insecure temp file creation                             | Security    |
| `S110`      | `try-except-pass` (swallowed errors)                    | Security    |
| `S301-S303` | Pickle, marshal, md5/sha1 for security                  | Security    |
| `S311`      | `random` module for crypto (use `secrets`)              | Security    |
| `S324`      | Insecure hash function (md5, sha1)                      | Security    |
| `S506`      | Unsafe YAML load                                        | Security    |
| `S608`      | SQL injection via string formatting                     | Security    |
| `B006-B008` | Mutable default arguments                               | Correctness |
| `B905`      | `zip()` without `strict=True`                           | Correctness |

### Configuration

```toml
# In pyproject.toml
[tool.ruff.lint]
select = [
    "E", "W",     # pycodestyle
    "F",           # pyflakes
    "I",           # isort
    "B",           # flake8-bugbear
    "S",           # flake8-bandit (security)
    "UP",          # pyupgrade
    "RUF",         # ruff-specific
]
```

---

## Monitoring and Reporting [PLANNED]

### Vulnerability Dashboard

Target: a centralized view of dependency health across all 12 services:

```
Service                    | Deps | Critical | High | Medium | Low | Last Scan
---------------------------|------|----------|------|--------|-----|----------
instruments-service        |  24  |    0     |   0  |    1   |  2  | 2025-01-15
market-tick-data-service   |  31  |    0     |   1  |    0   |  1  | 2025-01-15
features-delta-one-service |  28  |    0     |   0  |    2   |  0  | 2025-01-15
...
```

### Alerting

| Event                                    | Channel                            | Action                  |
| ---------------------------------------- | ---------------------------------- | ----------------------- |
| Critical vulnerability in production dep | Slack #security-alerts             | Fix immediately         |
| New high-severity CVE published          | Slack #security-alerts             | Assess and schedule fix |
| Scan failure (scanner itself broke)      | Slack #pipeline-alerts             | Fix scanner config      |
| Dependency update available              | Automated PR (Dependabot/Renovate) | Review and merge        |

---

## Implementation Roadmap

| Phase       | Components                                     | Priority                 |
| ----------- | ---------------------------------------------- | ------------------------ |
| **Phase 1** | pip-audit in quality-gates.sh (all services)   | High                     |
| **Phase 2** | Docker image scanning via Trivy in Cloud Build | High — **[IMPLEMENTED]** |
| **Phase 3** | Lockfile generation + hash verification        | Medium                   |
| **Phase 4** | Dependabot/Renovate for automated updates      | Medium                   |
| **Phase 5** | SBOM generation + image signing                | Low                      |
| **Phase 6** | Centralized vulnerability dashboard            | Low                      |

---

## Implementation Status

| Component                               | Status        |
| --------------------------------------- | ------------- |
| Pinned dependencies in pyproject.toml   | [IMPLEMENTED] |
| Private dep via authenticated git clone | [IMPLEMENTED] |
| Ruff security rules (flake8-bandit)     | [IMPLEMENTED] |
| Pre-commit hooks                        | [IMPLEMENTED] |
| Branch protection                       | [IMPLEMENTED] |
| pip-audit in CI                         | [PLANNED]     |
| Docker image vulnerability scanning     | [IMPLEMENTED] |
| Lockfile with hash verification         | [PLANNED]     |
| Dependabot / Renovate                   | [PLANNED]     |
| SBOM generation                         | [PLANNED]     |
| Docker image signing                    | [PLANNED]     |
| Centralized vulnerability dashboard     | [PLANNED]     |
