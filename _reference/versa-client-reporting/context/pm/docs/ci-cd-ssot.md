# CI/CD Single Source of Truth

> **Canonical owner**: `unified-trading-pm` (PM repo) **Referenced by**: `.cursor/rules/ci-cd/ci-rollout-ownership.mdc`,
> `unified-trading-codex/05-infrastructure/` **Full flow**: `docs/repo-management/CI-CD-FLOW.md` — staging lock, SIT
> debounce, deployment-tests build source, version cascade

This document is the definitive reference for how CI/CD works in this workspace. Before touching any CI workflow,
quality gate, or dependency install, read this.

---

## 1. Ownership Map — What Lives Where

Everything that runs across multiple repos is owned in PM and propagated. Never fix a per-repo file when the real fix
belongs here.

### Quality Gate Logic (instantly inherited — no rollout needed)

| File                                              | Owns                                                    |
| ------------------------------------------------- | ------------------------------------------------------- |
| `scripts/quality-gates-base/base-service.sh`      | Gate logic for all Python service/API repos (~50 repos) |
| `scripts/quality-gates-base/base-library.sh`      | Gate logic for library/interface repos                  |
| `scripts/quality-gates-base/base-ui.sh`           | Gate logic for TypeScript/React UI repos (14 repos)     |
| `scripts/quality-gates-base/.prettierignore-base` | Shared prettier ignore rules (inherited by all repos)   |

Per-repo `scripts/quality-gates.sh` is a **~10-line config stub only** (sets `SERVICE_NAME`, `SOURCE_DIR`,
`MIN_COVERAGE`). It sources the base script live from PM at runtime. Changes to base scripts propagate to all repos
immediately — no commit, no rollout needed.

### CI Workflow Files (require rollout — static YAML per repo)

Per-repo `.github/workflows/quality-gates.yml` files are thin callers:

```yaml
jobs:
  quality-gates:
    uses: IggyIkenna/unified-trading-pm/.github/workflows/python-quality-gates.yml@<active_branch>
    with:
      dep_repos: "unified-trading-library unified-config-interface"
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

The reusable workflows that contain all the real CI logic:

| Reusable workflow                            | Owns                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `.github/workflows/python-quality-gates.yml` | Full CI job for Python repos (Python setup, uv, tools, dep clone, install, run QG, record status) |
| `.github/workflows/ui-quality-gates.yml`     | Full CI job for UI repos (Node.js setup, PM clone, npm ci, run QG)                                |

The `@<active_branch>` ref is pinned to `active_feature_branch` from `workspace-manifest.json` and re-pinned
automatically by `.github/workflows/rollout-action-ref.yml` on every push to `main`/`staging`.

### Rollout Scripts (run when per-repo files need updating)

| Script                                                                      | What it patches                                                | When to run                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `scripts/propagation/rollout-quality-gates-ci-workflows.py`                 | Per-repo `.github/workflows/quality-gates.yml`                 | Any change to CI workflow shape, env vars, or branch refs        |
| `scripts/propagation/rollout-quality-gates-ci-workflows.py --workflow-call` | Full regeneration of thin callers from manifest `dependencies` | When reusable workflow structure changes                         |
| `scripts/propagation/rollout-quality-gates-unified.py`                      | Per-repo `scripts/quality-gates.sh` stubs                      | Only when base script adds a new required stub variable          |
| `scripts/propagation/rollout-action-ref.yml` (GHA)                          | `@<ref>` in all thin callers                                   | Auto-fires on `workspace-manifest.json` push to `main`/`staging` |

### GitHub Secrets Propagation

`scripts/workspace/propagate-github-secrets.sh` sets GitHub Actions secrets and variables across all 66 repos:

| Secret/Variable    | Source                | Purpose                                                      |
| ------------------ | --------------------- | ------------------------------------------------------------ |
| TELEGRAM_BOT_TOKEN | env or prompt         | Telegram notifications (masked)                              |
| TELEGRAM_CHAT_ID   | env or prompt         | Telegram chat/group ID (variable, non-sensitive)             |
| GCP_PROJECT_ID     | `.act-secrets` or env | GCP project for CI; fallback: `test-project` when unset      |
| AWS_ACCOUNT_ID     | `.act-secrets` or env | AWS account for ECR, CodeBuild, S3; same availability as GCP |

Run: `bash unified-trading-pm/scripts/workspace/propagate-github-secrets.sh` (or `--dry-run` first).

**AWS credentials**: Bootstrap (`deployment-service/scripts/bootstrap/bootstrap_aws.sh`) uses `aws configure` or env
vars. For GitHub Actions: set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` as repo secrets (or use
OIDC). Optional for `.act-secrets` if running `act` with AWS-backed workflows.

### Other PM-Owned Propagation Scripts

| Script                                                                                   | What it owns                                                               |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `scripts/repo-management/run-version-alignment.sh`                                       | Version cascade: workspace-manifest, pyproject.toml, imports, uv.lock      |
| `scripts/validation/check-workflow-tokens.py`                                            | Validates GH_PAT usage across all repo workflows                           |
| `scripts/propagation/rollout-quickmerge.py` + `.github/workflows/rollout-quickmerge.yml` | Quickmerge-based batch commits across all repos                            |
| `scripts/workspace/propagate-github-secrets.sh`                                          | Propagates TELEGRAM_BOT_TOKEN, GCP_PROJECT_ID, AWS_ACCOUNT_ID to all repos |

---

## 2. The No-Direct-Install Principle

**Never run `pip install`, `uv pip install`, or `npm install <package>` to add a new dependency to a repo — in a local
shell, agent session, or CI step.**

This creates invisible state: one dev's machine has it, another's doesn't. CI uses a fresh venv on every run. The
version alignment script won't see it. You get "works on my machine" failures and drift between developers.

### Flat Dependencies Rule

**Every repo has exactly one dependency list: `[project.dependencies]`. No `[project.optional-dependencies]` exists
anywhere — not `dev`, not `test`, not any group.**

All deps are mandatory and declared flat. Tests run locally, in Cloud Build, Code Build, and GitHub Actions. Every
environment needs every dependency. Optional groups create silent omissions and version conflicts between environments.
There is no deployment scenario where we build per-role images. The complexity is pointless.

### Correct Flow for Adding a Dependency

```
1. Edit pyproject.toml   →   add to [project.dependencies] ONLY — never optional-dependencies
2. Edit imports          →   use the new package in source code
3. Update manifest       →   if it's a new internal/sibling dep, add to dependencies[] in
                              workspace-manifest.json for that repo
4. Run uv lock           →   cd <repo> && uv lock   (updates uv.lock)
5. Run setup             →   uv sync                (installs locally — no extras)
6. Run QG                →   bash scripts/quality-gates.sh
```

Step 3 is required for internal workspace deps — the version alignment script and CI dep-clone step both read from
`workspace-manifest.json`.

### Version Alignment Will Catch It

`bash unified-trading-pm/scripts/repo-management/run-version-alignment.sh` runs four checks:

- Manifest versions match `pyproject.toml` versions
- Imports in source match declared deps
- `uv.lock` is in sync with `pyproject.toml`
- All sibling repos needed by this repo are declared in manifest

If you install something directly without updating these, the alignment script will flag the mismatch on the next run.

---

## 3. The Two-Pass Quickmerge Model

All commits go through quickmerge, never raw `git push`:

```
Pass 1: bash scripts/quality-gates.sh          # Full: lint + typecheck + tests + codex + security
Pass 2: bash scripts/quickmerge.sh "msg" --agent  # Lightweight: lint + format + typecheck + codex
```

In Claude Code / agent sessions: always use `--agent`. Never `--dep-branch`. Branch is read automatically from
`active_feature_branch` in `workspace-manifest.json`.

---

## 4. Branch Model and CI Triggers

| Branch                               | Purpose                          | CI trigger                |
| ------------------------------------ | -------------------------------- | ------------------------- |
| `feat/*`                             | Feature work                     | QG on PR only             |
| `live-defi-rollout` (current active) | Active feature branch            | QG on PR + push           |
| `staging`                            | Convergence for breaking changes | SIT validates before main |
| `main`                               | Always stable                    | QG + cascade              |

The `uses: ...@<active_branch>` in thin callers means CI always runs against the latest reusable workflow on the active
feature branch. When a branch merges, `rollout-action-ref.yml` updates all thin callers to the new active branch
automatically.

---

## 4b. Composite Quality Gates Action

A reusable composite action `run-quality-gates` is available in `.github/actions/run-quality-gates/` of the PM repo. It
encapsulates the full Pass 1 + Pass 2 logic (install deps, run `scripts/quality-gates.sh`, run quickmerge
`--quality-gates-only`) so that any repo's CI workflow can call it without duplicating logic.

```yaml
# Per-repo .github/workflows/quality-gates.yml — using composite action
jobs:
  quality-gates:
    uses: IggyIkenna/unified-trading-pm/.github/workflows/python-quality-gates.yml@<active_branch>
    with:
      dep_repos: "unified-trading-library unified-config-interface"
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

The composite action location: `unified-trading-pm/.github/actions/run-quality-gates/action.yml`. All CI logic changes
go there — never into per-repo workflow files.

---

## 4c. SIT Debounce and Starvation Detection

### 5-Minute Quiet Window (Debounce)

SIT (`system-integration-tests`) does not trigger immediately on every merge. A 5-minute quiet window prevents
back-to-back merges from each launching their own SIT run (which would cause SIT starvation and queue storms).

Mechanism: `staging_status.locked` is set to `true` when SIT starts. The debounce timer resets on every new merge to
`staging`. SIT only fires after 5 minutes of no new merges.

### SIT Starvation Detection

If `staging_status.locked` remains `true` for more than 1 hour without SIT completing, the starvation detector fires:

- Sends a Telegram alert: `SIT lock held >1h — possible starvation. Manual intervention may be required.`
- Does NOT auto-unlock — human must investigate and unlock via `bash scripts/unlock-sit.sh`

This prevents a stuck SIT run from permanently blocking the `staging → main` pathway.

---

## 5. Adding a New Repo

1. Add the repo to `workspace-manifest.json` with correct `type`, `dependencies`, `arch_tier`, and add it to
   `topologicalOrder.levels` in the appropriate level (SSOT for tier ordering)
2. Run `scripts/propagation/rollout-quality-gates-unified.py --repo <name>` to write the QG stub
3. Run `scripts/propagation/rollout-quality-gates-ci-workflows.py --workflow-call --repo <name>` to write the thin CI
   caller
4. Add `uv.lock`, `pyproject.toml` with `[project.dependencies]` and `[project.optional-dependencies.dev]`
5. Add Dockerfile using the shared base image pattern (see `.cursor/rules/ci-cd/cicd-setup.mdc`)
6. First commit via quickmerge creates the branch and PR

---

## 5b. CI Status — Automatic Updates

`ci_status` in `workspace-manifest.json` is the **single source of truth** for quality gate state. It is updated
**automatically** when quality gates run — no agent or manual step required.

| When                    | What happens                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Local QG passes         | Base script updates `repositories[repo].ci_status = "LOCAL_PASS"` in manifest (won't downgrade FEATURE_GREEN+) |
| Local QG fails          | EXIT trap sets `repositories[repo].ci_status = "FAILING"` (regression allowed from any state)                  |
| GHA QG passes (feature) | Reusable workflow dispatches `ci-status-update` to PM → `ci_status = "FEATURE_GREEN"`                          |
| GHA QG passes (staging) | Same dispatch → `ci_status = "STAGING_GREEN"`                                                                  |
| GHA QG fails            | Same dispatch with `status = "FAILING"`                                                                        |
| Merge to staging        | `feature-branch-to-staging.yml` dispatches `ci_status = "STAGING_PENDING"` (reset — fresh QG required)         |
| SIT passes              | `sit-gate.yml` sets all pending repos to `SIT_VALIDATED`                                                       |
| Promotion to main       | `staging-to-main.yml` resets promoted repos to `FEATURE_GREEN`                                                 |
| PM receives dispatch    | `ci-status-update.yml` updates manifest, regenerates `WORKSPACE_MANIFEST_DAG.svg`, commits with `[skip ci]`    |

**ci_status lifecycle (8 states):** `NOT_CONFIGURED` → `LOCAL_PASS` → `FEATURE_GREEN` → `STAGING_PENDING` →
`STAGING_GREEN` → `SIT_VALIDATED` Any state can regress to `FAILING`. `EXEMPT` is terminal (PM, IaC repos).

The DAG SVG shows each repo's status as a colored dot/left-edge: orange=LOCAL_PASS, lime=FEATURE_GREEN,
yellow=STAGING_PENDING, green=STAGING_GREEN, emerald=SIT_VALIDATED, red=FAILING, grey=EXEMPT/NOT_CONFIGURED.
`quality_gate_status` is removed — `ci_status` is the single SSOT.

**If DAG stays gray / Status 400:** The dispatch requires `GH_PAT` with `workflow` scope. Run
`bash unified-trading-pm/scripts/workspace/propagate-github-secrets.sh` to push GH_PAT from `.act-secrets` to all repos.
For local act runs, ensure `.act-secrets` has `GH_PAT=`. Status 400 = token lacks `workflow` scope or is missing.

---

## 6. Where NOT to Edit

| Tempting but wrong                                 | Correct place                                           |
| -------------------------------------------------- | ------------------------------------------------------- |
| Add a gate check to per-repo `quality-gates.sh`    | `scripts/quality-gates-base/base-service.sh`            |
| Fix a CI env var in one repo's `quality-gates.yml` | `python-quality-gates.yml` reusable workflow            |
| Add `pip install ruff` to a CI step                | Update `setup-python-tools/action.yml` composite action |
| Fix prettier ignore in one repo                    | `scripts/quality-gates-base/.prettierignore-base`       |
| Hardcode a version in one repo's workflow          | `workspace-manifest.json` + version alignment           |

---

## 7. Cloud Build and CodeBuild — SSOT

### Ownership

| Per-repo file        | Template in PM                       | Rollout script          |
| -------------------- | ------------------------------------ | ----------------------- |
| `cloudbuild.yaml`    | `configs/cloudbuild-*-template.yaml` | `rollout-cloudbuild.py` |
| `buildspec.aws.yaml` | `configs/buildspec-*-template.yaml`  | `rollout-buildspec.py`  |

### Service Account (GCP Cloud Build)

Cloud Build uses the **project default service account** — you do not configure it in cloudbuild.yaml:

| Project type         | Service account                                        |
| -------------------- | ------------------------------------------------------ |
| New projects (2024+) | `PROJECT_NUMBER-compute@developer.gserviceaccount.com` |
| Legacy               | `PROJECT_NUMBER@cloudbuild.gserviceaccount.com`        |

**Best practice:** Ensure the default SA has:

- `roles/artifactregistry.reader` (pull wheels, base image)
- `roles/artifactregistry.writer` (push images, publish wheels)

Or create a dedicated SA and set it on the build trigger (least privilege).

### Rollout Commands

```bash
# Cloud Build (services, APIs, UIs)
python3 scripts/propagation/rollout-cloudbuild.py [--dry-run] [--repo NAME]

# Cloud Build + wheel-only libraries (skips LIBRARY_CUSTOM_CLOUDBUILD)
python3 scripts/propagation/rollout-cloudbuild.py --include-library [--dry-run]

# CodeBuild (AWS)
python3 scripts/propagation/rollout-buildspec.py [--dry-run] [--repo NAME]
```

### Exceptions — Why They Exist

**SKIP_REPOS** (never apply any template):

| Repo                     | Reason                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| unified-trading-pm       | No deployable artifact; PM is scripts/configs only                                            |
| unified-trading-codex    | Docs only; no cloudbuild                                                                      |
| unified-trading-library  | Wheel + base Docker image; different flow than service/api/library                            |
| ibkr-gateway-infra       | Python + Terraform; no Docker image; infra-specific                                           |
| system-integration-tests | Lint + smoke tests only; uses `cloudbuild-sit-template.yaml` now; test harness, no prod image |

**LIBRARY_CUSTOM_CLOUDBUILD** (skip when --include-library): UAC, URDI, and execution-algo-library have flows that
differ from the standard library template (clone-pm-scripts, monorepo-aware lint, version checks). The generic
`cloudbuild-library-template.yaml` does not yet support these.

| Repo                             | Reason                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| unified-api-contracts            | Full flow: clone-pm-scripts, quality-gates, cloud-sdk-isolation, store-metadata, version check, notify-deployment |
| unified-reference-data-interface | Same as UAC; monorepo-aware lint                                                                                  |
| execution-algo-library           | Simpler: cloud-sdk-isolation, run-tests, store-metadata; no clone-pm-scripts                                      |

**Can exceptions be removed?** Yes, if we:

1. Add `cloudbuild-utl-template.yaml` for unified-trading-library (wheel + base image)
2. Add `cloudbuild-infra-template.yaml` for ibkr-gateway-infra (Python + Terraform)
3. Add `cloudbuild-sit-template.yaml` for system-integration-tests (lint + smoke + no-op push/scan)
4. Enhance `cloudbuild-library-template.yaml` to include clone-pm-scripts, quality-gates, cloud-sdk-isolation,
   store-metadata, notify-deployment — then remove LIBRARY_CUSTOM_CLOUDBUILD

Until then, custom cloudbuilds are manually maintained

### Build Smoke (All Repos in GHA)

`build-smoke-all-repos.yml` verifies every repo builds (Docker image or wheel) in GitHub Actions — no Cloud Build
needed.

- **Trigger**: `workflow_dispatch` (manual) or weekly schedule
- **Quick mode**: `inputs.quick=true` — test 1 repo per type (~5 min)
- **Full mode**: matrix over all ~64 repos, max 20 parallel (~10–15 min wall clock)
- **Per repo**: `docker build` for services/APIs/UIs; `python -m build --wheel` for libraries

Run: Actions → Build Smoke (All Repos) → Run workflow.

All custom cloudbuilds (SKIP_REPOS + LIBRARY_CUSTOM_CLOUDBUILD) should include `auth-precheck` as the first step (fail
fast on missing AR access).

### SIT Build Source (Option A — Build from Source)

SIT gets images via **build-from-source**: clone v1 repos from the **staging** branch before compose, then build
locally. SIT does **not** pull pre-built images from Artifact Registry.

- **Flow**: SIT workflow clones the `staging` branch of each service repo (from `staging_status.pending_repos` or
  manifest), builds Docker images locally, then runs `docker compose` against the staged stack.
- **Rationale**: Ensures SIT tests exactly what will be promoted to main — no drift between staged code and tested
  artifacts.

### build-smoke vs SIT Deployment Tests

| Workflow                    | Purpose                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `build-smoke-all-repos.yml` | Per-repo build verification — each repo builds (Docker or wheel) in isolation. No integration.                |
| SIT deployment-tests        | Integration tests against the **staged stack** — services talk to each other, contracts validated, E2E flows. |

### Staging Flow and Gate Sequence

```
merge to staging → sit-gate → debounce (5 min quiet) → smoke-test-gate → staging-validated → staging-to-main
```

- **sit-gate**: Records `pending_repos`, sets `staging_status.locked = true`, triggers debounce timer.
- **debounce**: 5-minute quiet window; timer resets on every new merge to staging. Prevents queue storms.
- **smoke-test-gate**: After debounce, SIT runs build-from-source + deployment tests.
- **staging-validated**: SIT passes → `staging-to-main.yml` merges staging to main.

### Race-Condition Protection

- **Debounce**: Prevents back-to-back merges from each launching its own SIT run (starvation, queue storms).
- **sit-staging concurrency group**: All SIT-related workflows use
  `concurrency: { group: sit-staging, cancel-in-progress: false }` so only one SIT run executes at a time. No parallel
  SIT runs racing to update manifest.

### When Cloud Build Fires

| Trigger                | When images are built                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Merge to `main`        | `qg-passed` dispatch → cloud-build-router → Cloud Build trigger. Images built and pushed to AR. |
| QG passed on `staging` | Same `qg-passed` path; router routes to staging project. Images built for staging environment.  |

Cloud Build does **not** run on every PR or push to `feat/*` — only on `qg-passed` (which fires after merge to `main` or
after QG success on `staging`).

---

## Pre-Build Auth Validation

Before Cloud Build or CodeBuild runs, validate that credentials have the right permissions. This avoids mid-build
failures when pulling wheels or pushing images.

### Standalone script (run locally or in CI)

```bash
# Validate GCP + AWS auth (uses gcloud/aws from env)
python3 unified-trading-pm/scripts/validation/validate-build-auth.py

# GCP only
python3 unified-trading-pm/scripts/validation/validate-build-auth.py --gcp-only

# Also check .act-secrets has expected keys
python3 unified-trading-pm/scripts/validation/validate-build-auth.py --check-secrets
```

### In Cloud Build (auth-precheck step)

All cloudbuild templates (service, api, ui) include an `auth-precheck` step that runs first:

- Verifies GCP token
- Verifies Python AR (unified-libraries) read — fails fast if SA lacks roles/artifactregistry.reader
- Verifies Docker AR (unified-trading-library or unified-trading-system) read

If auth-precheck fails, the build stops before expensive steps (Docker build, quality gates).

Custom cloudbuilds (SKIP_REPOS + LIBRARY_CUSTOM_CLOUDBUILD) also include auth-precheck as the first step.

### Secrets alignment

- **GCP**: Cloud Build uses the project's Cloud Build service account. Ensure it has:
  - `roles/artifactregistry.reader` (pull wheels, pull base image)
  - `roles/artifactregistry.writer` (push images, publish wheels)
- **AWS**: CodeBuild uses the CodeBuild service role. Ensure it has ECR push, CodeArtifact (if used).
- **.act-secrets**: GCP_PROJECT_ID, AWS_ACCOUNT_ID — used by act and local scripts. Align with GitHub secrets via
  `propagate-github-secrets.sh`.
