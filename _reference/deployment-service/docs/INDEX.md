# Documentation Index

**Last Updated:** February 28, 2026

**Start here.** This index maps common tasks to the right documents.

---

## MAX_WORKERS & Optimization

| Task                                                         | Document                                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **⭐ START HERE:** Complete MAX_WORKERS implementation guide | [IMPLEMENTATION_MAX_WORKERS.md](IMPLEMENTATION_MAX_WORKERS.md)               |
| Production readiness audit (CSV, dependencies, BigQuery)     | [../audit/CURRENT_AUDIT.md](../audit/CURRENT_AUDIT.md)                       |
| GCS lifecycle policy (save 76% storage)                      | [GCS_LIFECYCLE_AGGRESSIVE_STRATEGY.md](GCS_LIFECYCLE_AGGRESSIVE_STRATEGY.md) |
| Cost analysis (lifecycle, backfill, monitoring)              | [COST.md](COST.md)                                                           |

---

## Quick Links

### Setup & Infrastructure

| Task                                        | Document                                                 |
| ------------------------------------------- | -------------------------------------------------------- |
| First-time setup, validation                | [SETUP.md](SETUP.md)                                     |
| GCP/AWS access, secrets, builds, quotas     | [INFRASTRUCTURE.md](INFRASTRUCTURE.md)                   |
| Deployment UI (dashboard, Cloud Build logs) | (see deployment-ui repo)                                 |
| GCS FUSE on VMs (faster I/O)                | [GCS_FUSE_VM_SETUP.md](GCS_FUSE_VM_SETUP.md)             |
| Multi-cloud migration (GCP → AWS)           | [MIGRATION.md](MIGRATION.md)                             |
| AWS migration execution details             | [AWS_MIGRATION_EXECUTION.md](AWS_MIGRATION_EXECUTION.md) |

### Deployment & Operations

| Task                                                        | Document                                 |
| ----------------------------------------------------------- | ---------------------------------------- |
| Deploy services, sharding, data catalog                     | [CLI.md](CLI.md)                         |
| **Live mode:** data-status --mode live, live job monitoring | [LIVE_MODE.md](LIVE_MODE.md)             |
| Backfill runbook, troubleshooting                           | [RUNBOOKS.md](RUNBOOKS.md)               |
| Cache strategy, deployment state, VM self-deletion          | [CACHE_AND_STATE.md](CACHE_AND_STATE.md) |
| Dashboard UI spec                                           | [UI_SPEC.md](UI_SPEC.md)                 |

### Quality & Hardening

| Task                                   | Document                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| Hardening checklist, 4-stage readiness | [HARDENING.md](HARDENING.md)                                                         |
| Service audit framework                | [COMPREHENSIVE_SERVICE_AUDIT_FRAMEWORK.md](COMPREHENSIVE_SERVICE_AUDIT_FRAMEWORK.md) |
| E2E specs (MDPS, features-calendar)    | [E2E_SPECS.md](E2E_SPECS.md)                                                         |
| Testing walkthrough                    | [TESTING.md](TESTING.md)                                                             |

### ML & Data

| Task                                         | Document                                                       |
| -------------------------------------------- | -------------------------------------------------------------- |
| ML architecture, BigQuery, feature pipelines | [ML_IMPLEMENTATION.md](ML_IMPLEMENTATION.md)                   |
| BigQuery external tables setup               | [BIGQUERY_INTEGRATION_GUIDE.md](BIGQUERY_INTEGRATION_GUIDE.md) |
| GCS paths, schema, key=value format          | [GCS_AND_SCHEMA.md](GCS_AND_SCHEMA.md)                         |

### Cost & Optimization

| Task                                          | Document                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| Cost analysis (storage, compute, BigQuery)    | [COST.md](COST.md)                                                           |
| GCS lifecycle policy (aggressive strategy)    | [GCS_LIFECYCLE_AGGRESSIVE_STRATEGY.md](GCS_LIFECYCLE_AGGRESSIVE_STRATEGY.md) |
| MAX_WORKERS implementation (date parallelism) | [IMPLEMENTATION_MAX_WORKERS.md](IMPLEMENTATION_MAX_WORKERS.md)               |

### External/Contractor Specs

| Task                       | Document             |
| -------------------------- | -------------------- |
| External specs (condensed) | [SPECS.md](SPECS.md) |

---

## By Role

**New joiner:** SETUP → TESTING → CLI → INDEX (this file)
**Deployment ops:** CLI → RUNBOOKS → CACHE_AND_STATE → IMPLEMENTATION_MAX_WORKERS
**Hardening / checklist:** HARDENING → COMPREHENSIVE_SERVICE_AUDIT_FRAMEWORK → ../audit/CURRENT_AUDIT.md
**ML / features:** ML_IMPLEMENTATION → GCS_AND_SCHEMA → BIGQUERY_INTEGRATION_GUIDE
**Multi-cloud / AWS:** MIGRATION → AWS_MIGRATION_EXECUTION → INFRASTRUCTURE
**Cost optimization:** COST → GCS_LIFECYCLE_AGGRESSIVE_STRATEGY → IMPLEMENTATION_MAX_WORKERS

---

## Audit

| Document                                            | Purpose                                   |
| --------------------------------------------------- | ----------------------------------------- |
| [audit/CURRENT_AUDIT.md](../audit/CURRENT_AUDIT.md) | Current system-wide and per-service audit |
| [audit/ARCHIVE.md](../audit/ARCHIVE.md)             | Historical audits                         |

---

## Sports Betting Features

| Task                                | Document                                                                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Sports feature pipeline integration | [../unified-trading-codex/04-architecture/sports-integration-plan.md](../../unified-trading-codex/04-architecture/sports-integration-plan.md) |
| Sports feature horizons             | [../unified-trading-codex/04-architecture/sports-feature-horizons.md](../../unified-trading-codex/04-architecture/sports-feature-horizons.md) |

---

## Config Layout

See [configs/README.md](../configs/README.md) for config directory structure and checklist usage.
