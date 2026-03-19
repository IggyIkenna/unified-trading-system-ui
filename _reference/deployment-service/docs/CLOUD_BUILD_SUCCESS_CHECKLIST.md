# Cloud Build Success Checklist

## Purpose

This document tracks Cloud Build pipeline health for all 13 repositories. Success criteria: every repo must have a working Cloud Build trigger that builds, tests, and pushes Docker images to Artifact Registry on every merge to main.

## Pre-Flight Checks (Run Once)

- [ ] Verify gcloud CLI is authenticated: `gcloud auth list`
- [ ] Verify project is set: `gcloud config get-value project` (should be `test-project`)
- [ ] Verify region is correct: `asia-northeast1`
- [ ] UCS base image exists: `gcloud artifacts docker images list asia-northeast1-docker.pkg.dev/test-project/unified-trading-library --include-tags`

## Architecture: Test-in-Image Pattern

All services (except deployment-service) follow this pattern:

```yaml
steps: 1. Configure Docker auth
  2. Ensure artifact repos exist
  3. Pull UCS base image (asia-northeast1-docker.pkg.dev/$PROJECT_ID/unified-trading-library/unified-trading-library:latest)
  4. Build service image
  5. Run quality gates INSIDE image (docker run --entrypoint "" ... /bin/bash -c "scripts/quality-gates.sh --no-fix --quick")
  6. Push ONLY if tests pass
```

**Critical Requirements:**

- Ruff version: `ruff==0.15.0` (pyproject.toml, .pre-commit-config.yaml, GitHub Actions)
- Python version: `3.13`
- Environment variables: `CLOUD_BUILD=true`, `CLOUD_MOCK_MODE=true`, `GCP_PROJECT_ID=$PROJECT_ID`
- Entrypoint override: `--entrypoint ""` then `/bin/bash -c`

## Audit Results Summary

### ✅ All Repos Pass Audit (13/13)

All cloudbuild.yaml files follow the test-in-image pattern correctly:

| Repo                           | Artifact Repo           | Image Name                     | Timeout | Notes                           |
| ------------------------------ | ----------------------- | ------------------------------ | ------- | ------------------------------- |
| execution-service              | execution               | execution-service              | 1800s   | E2_HIGHCPU_8                    |
| features-calendar-service      | features                | calendar-service               | 1800s   | E2_HIGHCPU_8                    |
| features-delta-one-service     | features                | delta-one-service              | 1200s   | E2_MEDIUM                       |
| features-onchain-service       | features                | onchain-service                | 1800s   | E2_HIGHCPU_8                    |
| features-volatility-service    | features                | volatility-service             | 1200s   | E2_MEDIUM                       |
| instruments-service            | instruments             | instruments-service            | 1800s   | E2_HIGHCPU_8                    |
| market-data-processing-service | market-data             | market-data-processing-service | 1800s   | E2_HIGHCPU_8                    |
| market-tick-data-handler       | market-data             | market-tick-data-handler       | 1800s   | E2_HIGHCPU_8                    |
| ml-inference-service           | ml-inference-service    | ml-inference-service           | 1200s   | E2_MEDIUM                       |
| ml-training-service            | ml-training-service     | ml-training-service            | 1200s   | E2_MEDIUM                       |
| strategy-service               | strategy-service        | strategy-service               | 1200s   | E2_MEDIUM                       |
| unified-trading-library        | unified-trading-library | unified-trading-library        | 900s    | E2_MEDIUM, Dockerfile.ci        |
| deployment-service             | deployment-dashboard    | deployment-dashboard           | 1800s   | E2_HIGHCPU_32, Cloud Run deploy |

**Notes:**

- `unified-trading-library` is the base image - doesn't pull another base
- `deployment-service` deploys to Cloud Run, has Python + Node.js quality gates

---

## Per-Repo Checklist

### 1. execution-service

**Artifact Registry:** `execution`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe execution --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe execution-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps (configure-docker, ensure-repo, pull-base-image, build, quality-gates, push)
- [ ] Image pushed to registry with both tags (:latest, :$SHORT_SHA)

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/execution/execution-service \
  --include-tags --format="table(package,version,metadata.imageSizeBytes,metadata.updateTime)"
```

---

### 2. features-calendar-service

**Artifact Registry:** `features`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe features --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe features-calendar-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/features/calendar-service \
  --include-tags
```

---

### 3. features-delta-one-service

**Artifact Registry:** `features`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe features --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe features-delta-one-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/features/delta-one-service \
  --include-tags
```

---

### 4. features-onchain-service

**Artifact Registry:** `features`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe features --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe features-onchain-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/features/onchain-service \
  --include-tags
```

---

### 5. features-volatility-service

**Artifact Registry:** `features`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe features --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe features-volatility-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/features/volatility-service \
  --include-tags
```

---

### 6. instruments-service

**Artifact Registry:** `instruments`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe instruments --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe instruments-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/instruments/instruments-service \
  --include-tags
```

---

### 7. market-data-processing-service

**Artifact Registry:** `market-data`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe market-data --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe market-data-processing-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/market-data/market-data-processing-service \
  --include-tags
```

---

### 8. market-tick-data-handler

**Artifact Registry:** `market-data`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe market-data --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe market-tick-data-handler-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/market-data/market-tick-data-handler \
  --include-tags
```

---

### 9. ml-inference-service

**Artifact Registry:** `ml-inference-service`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe ml-inference-service --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe ml-inference-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/ml-inference-service/ml-inference-service \
  --include-tags
```

---

### 10. ml-training-service

**Artifact Registry:** `ml-training-service`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe ml-training-service --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe ml-training-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/ml-training-service/ml-training-service \
  --include-tags
```

---

### 11. strategy-service

**Artifact Registry:** `strategy-service`

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe strategy-service --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe strategy-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/strategy-service/strategy-service \
  --include-tags
```

---

### 12. unified-trading-library

**Artifact Registry:** `unified-trading-library`

**Special:** This is the base image for all other services.

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe unified-trading-library --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe unified-trading-library-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps
- [ ] Image pushed to registry with both tags

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/unified-trading-library/unified-trading-library \
  --include-tags
```

**Note:** Build uses `Dockerfile.ci` (not `Dockerfile`). This image has no parent - it's based on `python:3.13-slim`.

---

### 13. deployment-service

**Artifact Registry:** `deployment-dashboard`

**Special:** Deploys to Cloud Run, has Python + Node.js quality gates.

- [ ] cloudbuild.yaml validated ✅ (audit passed)
- [ ] Artifact repo exists: `gcloud artifacts repositories describe deployment-dashboard --location=asia-northeast1`
- [ ] GitHub trigger exists: `gcloud builds triggers describe deployment-service-build --region=asia-northeast1`
- [ ] Test commit pushed to main
- [ ] Build triggered successfully
- [ ] Build passed all steps (python-lint, python-test, yaml-validation, ui-lint, build, push, deploy, set-iam)
- [ ] Image pushed to registry with both tags
- [ ] Cloud Run service deployed: `gcloud run services describe deployment-dashboard --region=asia-northeast1`

**Verify image:**

```bash
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/deployment-dashboard/deployment-dashboard \
  --include-tags
```

**Verify Cloud Run:**

```bash
gcloud run services describe deployment-dashboard --region=asia-northeast1
```

---

## Troubleshooting Guide

### Build fails at pull-base-image

**Symptom:** `Error: manifest for asia-northeast1-docker.pkg.dev/.../unified-trading-library:latest not found`

**Root Cause:** UCS base image doesn't exist or wasn't pushed.

**Fix:**

1. Check if UCS image exists: `gcloud artifacts docker images list asia-northeast1-docker.pkg.dev/test-project/unified-trading-library --include-tags`
2. If missing, trigger a build for `unified-trading-library` repo first
3. Ensure UCS Cloud Build completes successfully before building dependent services

### Build fails at quality-gates step

**Symptom:** Tests fail inside Docker image.

**Root Cause:** Quality gates pass locally but fail in Cloud Build.

**Fix:**

1. Run quality gates locally first: `cd {service} && bash scripts/quality-gates.sh --no-fix --quick`
2. If local passes but Cloud Build fails, check:
   - Dockerfile includes test files: `COPY tests/ tests/`
   - Dockerfile includes dev deps: `RUN uv pip install --system -e ".[dev]"`
   - Environment variables are set correctly in cloudbuild.yaml
3. Test quality gates inside the local image:
   ```bash
   docker build -t test-image .
   docker run --rm --entrypoint "" \
     -e CLOUD_BUILD=true -e CLOUD_MOCK_MODE=true -e GCP_PROJECT_ID=test \
     test-image /bin/bash -c "scripts/quality-gates.sh --no-fix --quick"
   ```

### Build fails at push step

**Symptom:** `Error: repository does not exist`

**Root Cause:** Artifact Registry repository doesn't exist.

**Fix:**

1. Check if repo exists: `gcloud artifacts repositories describe {repo-name} --location=asia-northeast1`
2. Create manually: `gcloud artifacts repositories create {repo-name} --repository-format=docker --location=asia-northeast1`
3. Or let Cloud Build create it (ensure-repo step should handle this)

### Build times out

**Symptom:** Build exceeds timeout (1200s or 1800s).

**Root Cause:** Tests are too slow, or machine type is too small.

**Fix:**

1. Check timeout in cloudbuild.yaml: `timeout: '1800s'`
2. Increase timeout if needed (max 4h = 14400s)
3. Upgrade machine type:
   - E2_MEDIUM: 2 vCPU, 4 GB RAM
   - E2_HIGHCPU_8: 8 vCPU, 8 GB RAM
   - E2_HIGHCPU_32: 32 vCPU, 32 GB RAM
4. Optimize tests:
   - Use `--quick` flag (skips e2e, smoke tests)
   - Add `pytest-xdist` for parallel test execution
   - Reduce test fixtures, use mocks

### GitHub trigger doesn't exist

**Symptom:** `ERROR: (gcloud.builds.triggers.describe) NOT_FOUND: Requested entity was not found.`

**Root Cause:** Cloud Build trigger was never created for this repo.

**Fix:**

1. Create trigger manually via GCP Console or Terraform
2. Trigger name format: `{repo-name}-build`
3. Trigger on push to `main` branch
4. Region: `asia-northeast1`
5. Cloud Build config: `cloudbuild.yaml`

### Ruff version mismatch

**Symptom:** Formatting passes locally but fails in CI.

**Root Cause:** Different ruff versions between local and Cloud Build.

**Fix:**

1. Verify versions match: `cd deployment-service && ./scripts/check-ruff-versions.sh`
2. Update all to `ruff==0.15.0`:
   - `pyproject.toml`: `"ruff==0.15.0"`
   - `.pre-commit-config.yaml`: `rev: v0.15.0`
   - GitHub Actions: `ruff==0.15.0`
3. Reinstall hooks: `pre-commit install --install-hooks`

---

## Quick Reference Commands

### List all Cloud Build triggers

```bash
gcloud builds triggers list --region=asia-northeast1 --format="table(name,createTime,github.name,github.push.branch)"
```

### Get recent builds for a trigger

```bash
gcloud builds list --region=asia-northeast1 --filter="trigger_id=TRIGGER_ID" --limit=5
```

### Stream logs for a build

```bash
gcloud builds log BUILD_ID --region=asia-northeast1 --stream
```

### List all Artifact Registry repositories

```bash
gcloud artifacts repositories list --location=asia-northeast1
```

### List images in a repository

```bash
gcloud artifacts docker images list asia-northeast1-docker.pkg.dev/test-project/{repo-name} --include-tags
```

### Monitor all builds (use the monitoring script)

```bash
bash scripts/monitor-cloud-builds.sh
```

---

## Success Criteria

All 13 repos pass when:

- ✅ Cloud Build trigger exists
- ✅ Recent build (within 24h) exists
- ✅ Build status is SUCCESS
- ✅ Image pushed to Artifact Registry with both :latest and :$SHORT_SHA tags
- ✅ Quality gates passed inside image (all steps green)

**Next Steps:**

1. Run monitoring script: `bash scripts/monitor-cloud-builds.sh`
2. For any failures, check logs: `gcloud builds log BUILD_ID --region=asia-northeast1`
3. Fix root cause (see Troubleshooting Guide)
4. Trigger rebuild: Make a test commit or use `gcloud builds submit`
