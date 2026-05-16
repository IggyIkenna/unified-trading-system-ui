# Documentation Standards

Every repo in the unified trading system must maintain a canonical set of documentation files. Missing or stub docs (3
lines or fewer, or containing only "TODO") count as **missing** for audit purposes (S5.4) and block the documentation
gate in Phase 0.

---

## S5.1 — Service-Canonical Required Docs

All service repos (`*-service`, `*-api`, deployment-api, etc.) must contain:

| File                           | Purpose                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `README.md`                    | Entry point: purpose, quickstart, links to other docs                 |
| `docs/ARCHITECTURE.md`         | Component diagram (text/ASCII), key classes/modules, data flows       |
| `docs/CONFIGURATION.md`        | Config class name, all fields with types and defaults, secrets list   |
| `docs/GCS_PATHS.md`            | Bucket name pattern, all path templates with variable descriptions    |
| `docs/DEPLOYMENT_GUIDE.md`     | Prerequisites, deployment steps, rollback procedure, health check URL |
| `docs/TESTING.md`              | How to run tests, coverage target, known exclusions                   |
| `docs/SCHEMA_VALIDATION.md`    | Schema location, validation approach, example pass/fail               |
| `QUALITY_GATE_BYPASS_AUDIT.md` | Every `# qg-bypass` exemption with owner, date, and rationale         |

**Note:** `docs/ARCHITECTURE.md` must live under `docs/` — not at the repo root. If a service has it at the root, move
it.

---

## S5.2 — Library-Canonical Required Docs

All library repos (`unified-*-interface`, `unified-trading-library`, `matching-engine-library`, etc.) must contain:

| File                           | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `README.md`                    | Entry point: what the library provides, install, usage examples |
| `docs/ARCHITECTURE.md`         | Module structure, public API surface, extension points          |
| `docs/CONFIGURATION.md`        | Any config classes or env vars the library reads, with defaults |
| `docs/TESTING.md`              | How to run tests, coverage target, mock/fixture patterns        |
| `QUALITY_GATE_BYPASS_AUDIT.md` | Every `# qg-bypass` exemption with owner, date, and rationale   |

---

## S5.3 — UI-Canonical Required Docs (WARN only, not blocking)

All UI repos (`deployment-ui`, `*-dashboard`, etc.) should contain:

| File                       | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `README.md`                | Entry point: purpose, local dev setup, env vars                           |
| `docs/ARCHITECTURE.md`     | Component structure, state management, API integration points             |
| `docs/DEPLOYMENT_GUIDE.md` | Build, deploy, CDN/hosting, rollback                                      |
| `docs/TESTING.md`          | How to run tests, coverage target, Playwright/Cypress setup if applicable |

---

## S5.4 — Stub Definition

A doc is a **stub** (counts as missing) if it:

- Has 3 lines or fewer, OR
- Contains only "TODO" or placeholder text, OR
- Has no real content (empty sections only)

### Minimum content per doc type

| Doc                    | Not a stub if it contains                                                   |
| ---------------------- | --------------------------------------------------------------------------- |
| `ARCHITECTURE.md`      | Purpose, component diagram (text or ASCII), key classes/modules, data flows |
| `CONFIGURATION.md`     | Config class name, all fields with types and defaults, secrets list         |
| `DEPLOYMENT_GUIDE.md`  | Prerequisites, deployment steps, rollback procedure, health check URL       |
| `GCS_PATHS.md`         | Bucket name pattern, all path templates with variable descriptions          |
| `SCHEMA_VALIDATION.md` | Schema location, validation approach, example pass/fail                     |
| `TESTING.md`           | How to run tests, coverage target, known exclusions                         |

---

## S5.5 — Placement Rules

- All docs except `README.md` and `QUALITY_GATE_BYPASS_AUDIT.md` live under `docs/`.
- `docs/` must be a directory, not a single file named `docs`.
- `QUALITY_GATE_BYPASS_AUDIT.md` lives at the repo root (not under `docs/`).

---

## S5.6 — No Hardcoded IDs in Docs

Docs must not contain hardcoded GCP project IDs, bucket names, or service account emails. Use placeholders:

| Forbidden pattern        | Replace with         |
| ------------------------ | -------------------- |
| `odum-trading-prod`      | `{project_id}`       |
| `gs://odum-trading-*`    | `gs://{bucket_name}` |
| `*@odum-trading-*.iam.*` | `{service_account}`  |

**Audit command:**

```bash
grep -rn "odum-\|trading-prod-\|trading-staging-" docs/ README.md 2>/dev/null
```

---

## S5.7 — Audit Script

```bash
#!/usr/bin/env bash
# Run from any service repo root
REQUIRED_SERVICE_DOCS=(
  "README.md"
  "docs/ARCHITECTURE.md"
  "docs/CONFIGURATION.md"
  "docs/GCS_PATHS.md"
  "docs/DEPLOYMENT_GUIDE.md"
  "docs/TESTING.md"
  "docs/SCHEMA_VALIDATION.md"
  "QUALITY_GATE_BYPASS_AUDIT.md"
)

for doc in "${REQUIRED_SERVICE_DOCS[@]}"; do
  if [ ! -f "$doc" ]; then
    echo "MISSING: $doc"
  elif [ "$(wc -l < "$doc")" -le 3 ]; then
    echo "STUB:    $doc"
  else
    echo "OK:      $doc"
  fi
done

# Hardcoded ID scan
grep -rn "odum-\|trading-prod-\|trading-staging-" docs/ README.md 2>/dev/null \
  && echo "WARNING: hardcoded project IDs found above" \
  || echo "OK: no hardcoded IDs"
```

---

## S5.8 — Priority Order for Gap Filling

When filling doc gaps, use this priority:

1. `docs/DEPLOYMENT_GUIDE.md` — highest audit risk; missing from core services
2. `docs/SCHEMA_VALIDATION.md` — required for data pipeline correctness
3. `docs/GCS_PATHS.md` — required before production data writes
4. `docs/TESTING.md` — required for onboarding and coverage audit
5. `docs/ARCHITECTURE.md` — required for any review or refactor
6. `docs/CONFIGURATION.md` — required for ops runbook

---

## S5.9 — Schema Contract Docs

Schema governance documentation lives in:

- **Canonical schema groups:** [02-data/canonical-schema-groups.md](../02-data/canonical-schema-groups.md) — UAC
  (`unified_api_contracts.canonical`) = normalization outputs; UIC (`unified_internal_contracts/`) = internal messaging
  contracts
- **Schema governance:** [02-data/schema-governance.md](../02-data/schema-governance.md) — Validation integration point,
  DRY/SoC enforcement, STEP 5.12 quality gate
- **Schema contract audit:** `unified-trading-pm/plans/active/schema_governance_full_audit.md` — Full audit results
  for UAC normalization quality, UIC utilization, cross-contract deduplication

Service docs (`docs/SCHEMA_VALIDATION.md`) must reference the canonical schemas used, not redefine them.

---

## S5.10 — Enforcement

Phase 0 (`phase0_standards_enforcement.md`) runs the audit script on all repos and produces a baseline gap table.
Phase 1 doc filling (`documentation_standards_enforcement.md`) is blocked until Phase 0 baseline is established.

The documentation gate passes when:

- All service repos have all 8 required docs (no missing, no stub)
- All library repos have all 5 required docs (no missing, no stub)
- Zero docs contain hardcoded GCP project IDs or bucket names
- `docs/ARCHITECTURE.md` is under `docs/` (not root) in all repos
