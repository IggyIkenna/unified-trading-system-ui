# Comprehensive Service Audit Framework

**Purpose:** Complete audit checklist for all services
**Scope:** Cloud-agnostic architecture, path migration, testing alignment, code quality
**Apply to:** All 10 services (instruments, market-tick, market-data-processing, features-\*, ML, strategy, execution)

---

## Audit Checklist (100 Points Total)

### 1. Cloud-Agnostic Architecture (20 points)

**1.1 No Direct Cloud Provider Imports (5 points)**

- [ ] No `from google.cloud import` in production code
- [ ] No `import boto3` in production code
- [ ] Only `unified-trading-library` abstractions used
- [ ] Check: `grep -r "from google.cloud" {service}/ --include="*.py" | grep -v test`
- [ ] Check: `grep -r "import boto3" {service}/ --include="*.py" | grep -v test`

**1.2 Uses Unified-Cloud-Services Methods (5 points)**

- [ ] Uses `get_storage_client()` not `get_gcs_client()`
- [ ] Uses `get_query_client()` not direct BigQuery client
- [ ] Uses `get_secret_client()` not direct Secret Manager
- [ ] Uses `StandardizedDomainCloudService` for domain operations
- [ ] Check: `grep -r "get_gcs_client\|get_bigquery_client" {service}/`

**1.3 CLOUD_PROVIDER Environment Variable (5 points)**

- [ ] `.env.example` includes `CLOUD_PROVIDER=gcp`
- [ ] Config extends `UnifiedCloudServicesConfig` or `BaseServiceConfig`
- [ ] Code respects CLOUD_PROVIDER env var
- [ ] Has `buildspec.aws.yaml` or equivalent AWS config
- [ ] Check: `grep "CLOUD_PROVIDER" .env.example`

**1.4 No Hardcoded Project IDs in Production Code (5 points)**

- [ ] No literal "test-project" in service code
- [ ] Uses `config.gcp_project_id` or equivalent
- [ ] Bucket templates use `{project_id}` placeholder
- [ ] Scripts use config, not hardcoded IDs
- [ ] Check: `grep -r "test-project" {service}/ --include="*.py" | grep -v test | grep -v .env`

---

### 2. GCS Path Format Migration (20 points)

**2.1 Uses key=value Format (10 points)**

- [ ] All paths use `day={date}` not `day-{date}`
- [ ] All paths use `timeframe={tf}` not `timeframe-{tf}`
- [ ] All paths use `data_type={type}` not `data_type-{type}`
- [ ] All paths use `feature_group={group}` not `feature_group-{group}`
- [ ] All paths use `category={cat}` not top-level category folders
- [ ] Check: `grep -r "day-\|timeframe-\|data_type-\|feature_group-" {service}/app/ {service}/cli/`

**2.2 Day-First Ordering (5 points)**

- [ ] All paths have `by_date/day=` as first partition
- [ ] Pattern: `by_date/day={date}/...` not `{other}/by_date/day={date}/`
- [ ] Consistent with BigQuery PARTITION BY DATE(day)
- [ ] Check: `grep -r "by_date" {service}/app/ | grep -v "day="`

**2.3 Path Consistency Across Service (5 points)**

- [ ] Output paths match documented schema
- [ ] Input paths match upstream service output
- [ ] Tests verify path format
- [ ] Documentation shows correct format
- [ ] Check: Compare docs/GCS_PATHS.md with actual code

---

### 3. Testing Infrastructure (20 points)

**3.1 Python Version Alignment (5 points)**

- [ ] `.github/workflows/*.yml` uses same Python version as Cloud Build
- [ ] `cloudbuild.yaml` uses same Python as GitHub Actions
- [ ] Local quality gates use same Python
- [ ] `pyproject.toml` requires-python matches CI
- [ ] Check: Compare python versions in workflows, cloudbuild, pyproject

**3.2 Quality Gate Consistency (5 points)**

- [ ] Cloud Build runs same tests as GitHub Actions
- [ ] Local `scripts/quality-gates.sh` matches CI
- [ ] Same ruff version across all configs
- [ ] Same pytest command and flags
- [ ] Check: Compare test commands in `.github/workflows/`, `cloudbuild.yaml`, `scripts/quality-gates.sh`

**3.3 Cloud-Agnostic Test Suite (5 points)**

- [ ] Has `tests/unit/test_cloud_agnostic.py` or equivalent
- [ ] Tests path format (day=value)
- [ ] Tests bucket naming with {project_id}
- [ ] Tests CLOUD_PROVIDER env var switching
- [ ] Tests no direct cloud imports
- [ ] Check: `ls tests/unit/test_cloud_agnostic*.py`

**3.4 Tests Work Without Real Credentials (5 points)**

- [ ] Uses mocks for cloud operations
- [ ] Uses `CLOUD_MOCK_MODE=true` or equivalent
- [ ] Tests pass in CI without credentials
- [ ] No API calls to real cloud services
- [ ] Check: Run `pytest` without credentials, should pass or skip (not fail)

---

### 4. Startup Validation (15 points)

**4.1 Cloud Connection Validation (5 points)**

- [ ] Validates cloud storage connection at startup
- [ ] Exits with code 1 if connection fails
- [ ] Clear error message on connection failure
- [ ] Test exists for connection failure
- [ ] Check: Look for `validate_startup()` or equivalent in `cli/main.py`

**4.2 Bucket Existence & Writability (5 points)**

- [ ] Checks output buckets exist
- [ ] Checks output buckets are writable (test upload)
- [ ] Exits with code 1 if bucket inaccessible
- [ ] Test exists for missing bucket scenario
- [ ] Check: Startup validation includes bucket write test

**4.3 BigQuery/Database Table Validation (5 points)**

- [ ] If service uses BigQuery, validates table exists
- [ ] If service uses database, validates connectivity
- [ ] Exits with code 1 if table/database unavailable
- [ ] Test exists for missing table scenario
- [ ] Check: Startup validation for all data stores used

---

### 5. Dependency Validation (15 points)

**5.1 Upstream Dependency Checking (5 points)**

- [ ] Has DependencyChecker or equivalent
- [ ] Checks upstream services' data exists
- [ ] Called at startup (not just during processing)
- [ ] Exits with code 1 if required deps missing
- [ ] Check: `grep -r "DependencyChecker\|check_dependencies" {service}/cli/`

**5.2 Downstream Validation (5 points)**

- [ ] Checks downstream buckets/tables writable
- [ ] Validates can write to output locations
- [ ] Fails before processing if outputs unreachable
- [ ] Test exists for downstream write failure
- [ ] Check: Startup validation includes downstream checks

**5.3 API Key / Secret Validation (5 points)**

- [ ] Validates external API keys at startup (if service needs them)
- [ ] Clear error if keys missing or invalid
- [ ] Exits with code 1 on key validation failure
- [ ] Test exists for missing/invalid key scenarios
- [ ] Check: Startup validation for all external dependencies

---

### 6. Failure Mode Testing (10 points)

**6.1 Startup Failure Tests (5 points)**

- [ ] Test: Cloud connection failure → exit 1
- [ ] Test: Missing bucket → exit 1
- [ ] Test: Missing table → exit 1
- [ ] Test: Invalid API key → exit 1
- [ ] Test: Missing upstream data → exit 1
- [ ] Check: `ls tests/unit/test_startup_validation.py` or search for failure tests

**6.2 Processing Failure Tests (5 points)**

- [ ] Test: Malformed input data handling
- [ ] Test: Downstream write failure handling
- [ ] Test: Partial processing failure (some shards fail)
- [ ] Test: Resource exhaustion (memory, disk)
- [ ] All failure tests work without real credentials
- [ ] Check: `grep -r "test_.*failure\|test_.*error" tests/`

---

### 7. Documentation Quality (10 points)

**7.1 No Hardcoded Values (5 points)**

- [ ] Docs use `{project_id}` not "test-project"
- [ ] Docs use `{region}` not hardcoded regions
- [ ] Examples show config patterns, not literals
- [ ] Check: `grep -r "test-project" docs/`

**7.2 Path Format Documented Correctly (5 points)**

- [ ] `docs/GCS_PATHS.md` shows `day={date}` format
- [ ] Architecture docs show key=value format
- [ ] Examples match actual code paths
- [ ] Migration from old format documented
- [ ] Check: Verify `docs/GCS_PATHS.md` matches code

---

## Audit Scoring

**How to score:**

- Each checkbox = 1 point (most sections)
- Some critical items worth more (noted)
- Deduct points for issues found

**Ranges:**

- 90-100: Production-ready ✅
- 75-89: Good, minor fixes needed ⚠️
- 60-74: Needs work, critical gaps 🔧
- Below 60: Major issues, not production-ready ❌

---

## Per-Service Audit Template

**Service:** **\*\***\_\_\_\_**\*\***
**Date:** **\*\***\_\_\_\_**\*\***
**Auditor:** **\*\***\_\_\_\_**\*\***

### Quick Scores

| Category                 | Score        | Notes |
| ------------------------ | ------------ | ----- |
| 1. Cloud-Agnostic        | \_\_/20      |       |
| 2. Path Format           | \_\_/20      |       |
| 3. Testing               | \_\_/20      |       |
| 4. Startup Validation    | \_\_/15      |       |
| 5. Dependency Validation | \_\_/15      |       |
| 6. Failure Testing       | \_\_/10      |       |
| **TOTAL**                | **\_\_/100** |       |

### Critical Issues (P0 - Must Fix)

1. ***
2. ***
3. ***

### High Priority Issues (P1 - Fix This Week)

1. ***
2. ***

### Medium Priority (P2 - Fix Next Week)

1. ***
2. ***

---

## Master Audit Tracking

**Apply this framework to:**

| Service                 | Score    | Status | Last Audit | Critical Issues                         |
| ----------------------- | -------- | ------ | ---------- | --------------------------------------- |
| instruments             | 72/100   | ⚠️     | 2026-02-09 | No startup validation                   |
| market-tick             | 78/100   | ⚠️     | 2026-02-09 | No BigQuery check                       |
| market-data-processing  | 75/100   | 🚨     | 2026-02-09 | **Mixed path formats!**                 |
| features-delta-one      | \_\_/100 | ❓     | Not done   | TBD                                     |
| features-calendar       | \_\_/100 | ❓     | Partial    | TBD                                     |
| features-onchain        | \_\_/100 | ❓     | Not done   | TBD                                     |
| features-volatility     | \_\_/100 | ❓     | Not done   | TBD                                     |
| ml-training             | \_\_/100 | ❓     | Not done   | TBD                                     |
| ml-inference            | \_\_/100 | ❓     | Not done   | TBD                                     |
| strategy                | \_\_/100 | ❓     | Not done   | TBD                                     |
| execution               | \_\_/100 | ❓     | Not done   | TBD                                     |
| unified-trading-library | 61/100   | ⚠️     | 2026-02-09 | StandardizedDomainCloudService GCP-only |

---

## Critical Findings from Current Audits

### **BLOCKER: market-data-processing-service**

- 🚨 Uses `timeframe-{tf}` instead of `timeframe={tf}` (line 284)
- 🚨 Uses `data_type-{type}` instead of `data_type={type}` (line 421)
- 🚨 Uses `venue-` instead of `venue=` (dependency_checker.py)
- **Impact:** BigQuery hive partitioning will FAIL
- **Priority:** P0 - Fix immediately

### **BLOCKER: unified-trading-library**

- 🚨 `StandardizedDomainCloudService` uses GCP-only `CloudAuthFactory`
- **Impact:** Cannot use AWS with domain services
- **Priority:** P0 - Fix immediately

### **CRITICAL: instruments-service**

- ❌ No startup validation (doesn't check cloud/buckets)
- **Impact:** May start without cloud connectivity, fails later
- **Priority:** P1 - Add validation

---

## Next Steps

1. **Apply this framework** to remaining 7 services
2. **Fix P0 blockers** (market-data-processing path format, unified-trading-library GCP-only)
3. **Add startup validation** to all services
4. **Complete** path format migration across all services
5. **Verify** testing alignment (Python versions, commands)

---

**Use this document as the master checklist for achieving production readiness across the entire system.**
