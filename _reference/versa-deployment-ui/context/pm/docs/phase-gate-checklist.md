# Phase Gate Checklist — Pre-Live-Trading Gates

**Last updated:** 2026-03-08 **Target:** First live trade week of March 20, 2026 **Source of truth:**
`master_pre_deployment_plan_chain.plan.md`

---

## What Must Be Green Before First Live Trade

All gates below must pass before the live trading week (March 20). Gates are listed in dependency order — a blocked gate
blocks all gates that follow it.

---

## Gate 1 — Phase 0: Environment Clean

**Status: DONE** **Owner:** N/A (completed) **Plan:** `archive/phase0_audit_remediation.plan.md`

| Check                                      | Status |
| ------------------------------------------ | ------ |
| No `os.environ` in prod library source     | DONE   |
| No `try/except ImportError` in prod source | DONE   |
| No hardcoded GCP project IDs               | DONE   |
| No secrets in git history                  | DONE   |
| No `time.sleep()` inside `async def`       | DONE   |
| No `pip install` in Dockerfiles (use uv)   | DONE   |
| All quality gates running                  | DONE   |

---

## Gate 2 — Phase 0b: Audit Standards

**Status: DONE** **Owner:** N/A (completed) **Plan:** `workspace_audit_remediation_2026_03_07.plan.md`

| Check                                   | Status                                   |
| --------------------------------------- | ---------------------------------------- |
| All P0 (CRITICAL) items resolved        | DONE — API keys rotated, .env removed    |
| All P1 (HIGH) items resolved            | DONE — ruff errors, QG bypasses, hooks   |
| All P2 (MEDIUM) items resolved          | DONE — SSOT, DAG, security hardening     |
| All P3 (MEDIUM-LOW) items resolved      | DONE — standards drift, hygiene, docs    |
| P4 (LOW): fix-cloudbuild-template-drift | PENDING — non-blocking, post-sprint OK   |
| P4 (LOW): fix-coverage-pct-placeholders | PENDING — non-blocking, measure per-repo |

---

## Gate 3 — Phase 1: Foundation Infrastructure

**Status: DONE** **Owner:** N/A (completed) **Plan:** `archive/phase1_foundation_prep.plan.md`

| Check                                                                    | Status |
| ------------------------------------------------------------------------ | ------ |
| All 55 repos have `scripts/quickmerge.sh`                                | DONE   |
| All 55 repos have `.github/workflows/version-bump.yml`                   | DONE   |
| All 55 repos have commit-msg hooks                                       | DONE   |
| dep-branch clone in all `quality-gates.yml`                              | DONE   |
| Cloud Build feature branch trigger template created                      | DONE   |
| `execution-service` visualizer-ui/api extracted                          | DONE   |
| UTD V3 four-way split complete                                           | DONE   |
| UI audit clean (no embedded UI in service repos)                         | DONE   |
| `ibkr-gateway-infra/` Terraform moved to `deployment-service/terraform/` | DONE   |
| 3 cursor rules: cloud-agnostic, dag-enforcement, ui-service-separation   | DONE   |
| Manifest `ci_status` fields on all 55 repos                              | DONE   |
| QG baseline recorded for all 30 repos with QG                            | DONE   |
| `quality-gates.sh` added to 12 missing repos                             | DONE   |
| Cloud Build audit: all 29 repos test inside Docker                       | DONE   |
| AWS parity: `buildspec.aws.yaml` on all 45 repos                         | DONE   |
| Terraform files verified: `deployment-service/terraform/gcp/` + `aws/`   | DONE   |

---

## Gate 4 — Phase 2: Library Tier Hardening (T0→T3)

**Status: IN_PROGRESS** **Owner:** Person A (T0–T2) / Person B (T2–T3) **Plan:** `phase2_library_tier_hardening.plan.md`
**Blocked by:** None — T0 work active now

| Check                                                          | Status  | Notes                                                  |
| -------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| p2-global-violation-sweep (all repos)                          | DONE    | T0/T1/T2/T3 source packages all clean                  |
| T0: Layer 0 contract alignment tests (AC, UIC)                 | DONE    | 71 UEI / 666 AC / 608 UIC / 227 URDI / 94 EAL / 83 MEL |
| T0: D1 lint-only (ruff clean, 6 repos)                         | DONE    |                                                        |
| T0: D2 unit-only (all 6 repos unit tests pass)                 | DONE    |                                                        |
| T0: D3 basedpyright (0 errors, 6 repos)                        | DONE    |                                                        |
| T0: D4 quickmerge --quick                                      | PENDING | Requires quickmerge run                                |
| T0: D5 quickmerge (full, act simulation) = T0 GREEN GATE       | PENDING | Unlocks T1 work                                        |
| T0: deploy structure (cloudbuild, pyproject, manifest)         | PENDING | Not yet started                                        |
| T0: code rewrite (URDI, MEL, VCR cassettes, large file splits) | PENDING | Not yet started                                        |
| T1: UTS + UCI — all steps (A→E)                                | PENDING | Blocked on T0 D5                                       |
| T2: UMI, UTEI, UML, UFC, UPI, UDEI, USEI — all steps (A→E)     | PENDING | Blocked on T1 D5                                       |
| T3: UDC + consumers — all steps (A→E)                          | PENDING | Blocked on T2 D5                                       |

**Unblocking action:** Run `bash scripts/quickmerge.sh` for all 6 T0 repos (UEI, AC, UIC, URDI, EAL, MEL) to reach
D4/D5.

---

## Gate 5 — Phase 3: Service Hardening

**Status: PENDING** **Owner:** Person A + Person B (all services) **Plan:**
`phase3_service_hardening_integration.plan.md` **Blocked by:** Gate 4 (Phase 2 T0–T3 all green)

| Check                                                        | Status  | Notes                     |
| ------------------------------------------------------------ | ------- | ------------------------- |
| instruments-service (IS) D5 green (gates all other services) | PENDING | Blocked on Phase 2        |
| MTDH + MDPS D5 green                                         | PENDING | Blocked on IS green       |
| FCS/FDS/FVS/FOS D5 green                                     | PENDING | Blocked on MTDH+MDPS      |
| MLTR + MLIN D5 green                                         | PENDING | Blocked on features green |
| STR + EXEC D5 green                                          | PENDING | Blocked on ML green       |
| PBS/PNL/RES/AS D5 green                                      | PENDING | Blocked on EXEC green     |
| T5 APIs (ERA/MDA/CRA) D5 green                               | PENDING | Blocked on all T4 green   |
| T6 UIs (11 repos) D5 green                                   | PENDING | Blocked on T5 green       |

---

## Gate 6 — Phase 4: Integration Tests

**Status: IN_PROGRESS** **Owner:** Person A + Person B **Plan:** folded into phase2 + phase3 tier STEP B todos

| Check                                                                    | Status  | Notes                                                |
| ------------------------------------------------------------------------ | ------- | ---------------------------------------------------- |
| Layer 0: Contract alignment tests (AC↔UIC)                              | DONE    | test_contract_alignment.py, test_ac_uic_alignment.py |
| Layer 1: Schema robustness tests per service (test_schema_robustness.py) | PENDING | Folded into each tier STEP B                         |
| Layer 1.5: Per-component integration tests per service                   | PENDING | Blocking in quickmerge --unit-only                   |
| Layer 2: verify_infra.py → GET /infra/health                             | PENDING | Post-deploy only — requires cloud infra              |
| Layer 3a: system-integration-tests smoke (<5 min)                        | PENDING | After L2 passes                                      |
| Layer 3b: system-integration-tests full_e2e (15–30 min)                  | PENDING | After L3a passes                                     |

---

## Gate 7 — Phase 5: Pre-Deployment Infrastructure

**Status: PENDING** **Owner:** DevOps / Person A **Blocked by:** Cloud infra provisioning

| Check                                           | Status  | Notes                                       |
| ----------------------------------------------- | ------- | ------------------------------------------- |
| GCS buckets provisioned + IAM verified          | PENDING | Owner: DevOps                               |
| PubSub topics + subscriptions provisioned       | PENDING | Owner: DevOps                               |
| Secret Manager entries populated (all API keys) | PENDING | Owner: Person A (api_keys_and_auth.plan.md) |
| Cloud Run services deployed (all T4 services)   | PENDING | Owner: deployment-service + deployment-api  |
| GET /infra/health returns 200 for all services  | PENDING | verify_infra.py passes                      |

---

## Gate 8 — Phase 6: Cloud Build

**Status: PENDING** **Owner:** Person B **Plan:** `aws_migration.plan.md` **Partially complete:** `buildspec.aws.yaml`
added to all 45 repos (DONE 2026-03-06)

| Check                                            | Status  | Notes                                     |
| ------------------------------------------------ | ------- | ----------------------------------------- |
| `buildspec.aws.yaml` on all service repos        | DONE    | 45 repos, completed 2026-03-06            |
| AWS CodeBuild triggers configured per service    | PENDING | Blocked on AWS account access             |
| aws_batch.py + aws_ec2.py match cloud_run.py API | DONE    | get_status_batch added (commit 49dc640)   |
| GCP Cloud Build QG verified on all service repos | DONE    | cloudbuild audit complete 2026-03-06      |
| End-to-end AWS pipeline smoke test passes        | PENDING | Blocked on AWS account + CodeBuild access |

---

## Gate 9 — Phase 7: Final Audit

**Status: IN_PROGRESS** **Owner:** Person A (audit runner) **Plan:** `trading_system_audit_prompt.plan.md`

| Check                                                    | Status  | Notes                             |
| -------------------------------------------------------- | ------- | --------------------------------- |
| Section 1: Manifest/versions — all repos consistent      | DONE    | Completed 2026-03-08              |
| Section 2: DAG tier boundaries — no violations           | PENDING |                                   |
| Section 3: SSOT docs — no staleness                      | PENDING |                                   |
| Section 4: Dependency bounds — all internal deps bounded | PENDING |                                   |
| Section 5: Cloud protocol — no direct cloud SDK usage    | PENDING |                                   |
| Section 6: Cursor rules — all rules enforced             | PENDING |                                   |
| Section 7: Event/venue standards — all canonical         | PENDING |                                   |
| Section 8: Quality gates — all repos green               | PENDING |                                   |
| Section 9: Type safety — no Any, no type:ignore bypasses | PENDING |                                   |
| Section 10: Security — no secrets, no leakage            | PENDING |                                   |
| Overall grade: A or better (no FAIL, ≤3 WARN)            | PENDING | Required before live trading week |

---

## Gate 10 — Live Trading Week (March 20)

**Status: PENDING** **Owner:** Both **Blocked by:** Gates 4–9

| Check                                                                    | Status  |
| ------------------------------------------------------------------------ | ------- |
| All quality gates green (Gates 4–9)                                      | PENDING |
| At least one sports arb strategy live                                    | PENDING |
| At least one CEFI ML signal strategy live                                | PENDING |
| At least one TradFi ML signal strategy live                              | PENDING |
| At least one DeFi MVP strategy live (staking, lending, recursive, basis) | PENDING |
| Portable backtests completed for all strategy categories                 | PENDING |
| PnL ≥ 0 over 5-day week                                                  | PENDING |
| ≤3 unhandled exceptions across all services                              | PENDING |
| Zero circuit breaker trips                                               | PENDING |
| All orders within 500ms of signal emission                               | PENDING |

---

## Blocked Items — Action Required

| Gate   | Item                                  | Blocker                                  | Owner    |
| ------ | ------------------------------------- | ---------------------------------------- | -------- |
| Gate 4 | T0 D4/D5 quickmerge runs              | Need to run `bash scripts/quickmerge.sh` | Person A |
| Gate 4 | T0 deploy structure + code rewrite    | Not yet started                          | Person A |
| Gate 5 | All T4–T6 service hardening           | Phase 2 not yet complete                 | A + B    |
| Gate 7 | GCS/PubSub/SecretManager provisioning | Cloud infra not yet provisioned          | DevOps   |
| Gate 7 | API keys in Secret Manager            | api_keys_and_auth.plan.md pending        | Person A |
| Gate 8 | AWS CodeBuild triggers                | AWS account access needed                | DevOps   |
| Gate 9 | Sections 2–10 audit                   | Phase 2 must complete first              | Person A |

---

## Non-Blocking Deferred Items (Post-Sprint OK)

| Item                                           | Notes                                                |
| ---------------------------------------------- | ---------------------------------------------------- |
| fix-cloudbuild-template-drift (P4)             | 44 cloudbuild.yaml canonical template enforcement    |
| fix-coverage-pct-placeholders (P4)             | Measure real coverage_pct per repo (35 placeholders) |
| Alerting-Service → Slack + PagerDuty (C.2)     | Post-first-deployment                                |
| API Audit compliance/reporting/analytics (C.3) | Create focused plan post-sprint                      |
| Reconciliation and Rebalancing (C.4)           | Defer unless blocking                                |
| Execution Services 57-test cleanup (C.5)       | Triage after Phase 3                                 |
| vc-pre-existing-blockers (version cascade)     | UI repos + UDEI import smoke — fix per repo          |
| vc-verify (version cascade end-to-end test)    | After all rollouts complete                          |
