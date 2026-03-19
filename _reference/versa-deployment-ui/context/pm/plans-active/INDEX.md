# Active Plans Index

**Last updated:** 2026-03-16 (cleanup: 3 completed plans archived — cross_venue_position_aggregation_2026_03_15,
uac_citadel_remediation, ui_api_alerting_observability_2026_03_14) **Per-repo readiness checklist SSOT:**
`unified-trading-codex/10-audit/repos/{repo}.yaml` (codex v3.0 — CR/DR/BR).

---

## Master Plans (5 Active)

### 1. CI/CD & Code Rollout Master

**File:** [cicd_code_rollout_master_2026_03_13.plan.md](cicd_code_rollout_master_2026_03_13.plan.md) **Type:** mixed |
**Status:** active (76/92 done) | **Scope:** Pipeline bug fixes, citadel hardening, workflow rollout to 67 repos,
library tier completion (T0→T3), service/UI hardening, deployment infra, 1.0.0 stability gate.

### 2. CI/CD E2E Testing & Validation

**File:** [cicd_e2e_testing_master_2026_03_13.plan.md](cicd_e2e_testing_master_2026_03_13.plan.md) **Type:** infra |
**Status:** active (0/54, blocked by Plan 1 Phase 3+) | **Scope:** Validate every CI/CD path. 8 phases from static
validation to golden path E2E.

### 3. DeFi Keys & Data Integration

**File:** [defi_keys_data_integration_2026_03_13.plan.md](defi_keys_data_integration_2026_03_13.plan.md) **Type:** mixed
| **Status:** active (0/21, mostly human) | **Scope:** 30 vendor API keys, VCR cassettes, data freshness SLAs for 33
venues, production backfill pipeline.

### 4. Presentations

**File:** [presentations_2026_03_13.plan.md](presentations_2026_03_13.plan.md) **Type:** business | **Status:** active
(0/6, human) | **Deadlines:** Rehearsal 2: March 18 | Board meeting: March 31

### 5. Website Master

**File:** [website_master_2026_03_13.plan.md](website_master_2026_03_13.plan.md) **Type:** business | **Status:** active
(0/5) | **Blocked by:** Plan 4 (presentations)

---

## Supporting Plans

### 6. Strategy System Citadel Master

**File:** [strategy_system_citadel_master_2026_03_15.plan.md](strategy_system_citadel_master_2026_03_15.plan.md)
**Type:** mixed | **Status:** active (~22/44 done after Wave 2-3) | **Scope:** Strategy universe expansion, config
system N10, events canonicalization, UI/API completeness, testing framework, dependency tracking.

### 7. Sports Hub — Residual Actions

**File:** [sports_hub_residual_actions_2026_03_15.plan.md](sports_hub_residual_actions_2026_03_15.plan.md) **Type:**
human | **Status:** active (2/12) | **Scope:** All human work: Secret Manager credentials, Playwright CSS selectors,
CAPTCHA, GeoComply.

### 8. UI Trader Acceptance Testing

**File:** [ui_trader_acceptance_testing_2026_03_15.plan.md](ui_trader_acceptance_testing_2026_03_15.plan.md) **Type:**
human+agent | **Status:** active (0/36) | **Scope:** Smoke tests, visual audit, layout fixes, API mock validation,
stress scenarios, trader sign-off.

---

## Resumed Plans (active — resumed from archive, incomplete todos)

### 9. Quality Gates Full Fix

**File:** [quality_gates_full_fix_2026_03_10.plan.md](quality_gates_full_fix_2026_03_10.plan.md) **Type:** infra |
**Status:** active — resumed from archive (incomplete todos) (~11/22 done) | **Scope:** Systematically fix all failing
tests and coverage gaps across all repos; no bypasses; T0–T3 libs ≥80%, services/APIs ≥70%.

### 10. Registry Completeness — Implementation Detail

**File:** [registry_completeness_implementation_detail.plan.md](registry_completeness_implementation_detail.plan.md)
**Type:** code | **Status:** active — resumed from archive (incomplete todos) (~1/30 done) | **Scope:** Add missing
instrument types, sports market granularity (BTTS end-to-end), BetSide/CommissionModel enums, and consumer adoption
across 11 repos; enum consolidation with UCI re-exports from UAC.

### 11. Production Mock E2E

**File:** [production_mock_e2e_plan_d90c8f20.plan.md](production_mock_e2e_plan_d90c8f20.plan.md) **Type:** infra |
**Status:** active — resumed from archive (incomplete todos) (~13/26 done) | **Scope:** Bring all 60+ repos to
production-standard mock E2E testability — libraries via UAC/UIC validation and VCR cassettes; services/APIs via mock
data replay and load checks; UIs via mock API and smoke tests.

### 12. User Management Platform

**File:** [user_management_platform_2026_03_13.plan.md](user_management_platform_2026_03_13.plan.md) **Type:** code |
**Status:** active — resumed from archive (incomplete todos); unique scope not covered by other active plans |
**Scope:** New `user-management-ui` repo — full lifecycle user management (onboard/modify/off-board) with provisioning
for GitHub, Slack, M365, GCP IAM, and website portal per role.

### 13. Quality Gates Systemic Remediation (2026-03-16)

**File:** [quality_gates_systemic_remediation_2026_03_16.plan.md](quality_gates_systemic_remediation_2026_03_16.plan.md)
**Type:** infra | **Status:** active (new) | **Scope:** Systemic remediation of all quality gate failures identified in
the 2026-03-16 audit — covers type errors, coverage gaps, lint violations, and codex compliance across all tiers.

---

## Archived Plans (2026-03-16 cleanup)

26 plans archived across all sessions. See `plans/archive/` for full files.

| Plan                                           | Reason                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| feature_enrichment_reversal_dynamics           | Completed 2026-03-16 — 65 new features, 290 tests across 4 services                     |
| live_batch_protocol_completeness_2026_03_10    | Complete (100% done)                                                                    |
| strategy_visibility_grafana_2026_03_10         | Design doc; superseded by cicd_code_rollout_master feature-grafana                      |
| stub_completion_interfaces_and_infra           | Self-archived; todos extracted to other active plans                                    |
| data_availability_live_expectations_2026_03_10 | Superseded; todos extracted to defi_keys_data_integration                               |
| full_autonomous_agent_ci                       | Superseded; todos redistributed to cicd_e2e_testing_master and cicd_code_rollout_master |
| ui_trading_desk_strategy_merge                 | Complete (46/46)                                                                        |
| uac_citadel_implementation_execution           | Complete (79/79)                                                                        |
| liquidation_band_prediction                    | Complete (6/6)                                                                          |
| sit_build_source_ci_rollout                    | Complete (10/10)                                                                        |
| cross_venue_position_aggregation               | Complete (37/37)                                                                        |
| registry_completeness_implementation_detail    | Moved to active (resumed — incomplete todos remain)                                     |
| uac_citadel_architecture                       | Superseded by completed execution plan                                                  |
| uac_citadel_implementation                     | Spec doc; execution complete                                                            |
| infrastructure_canonical_layer                 | Design doc; todos:[]                                                                    |
| integration_tests_codex_compliance             | Done per completion summary                                                             |
| uac_residual_refactors_expanded                | Research doc consumed by active plans                                                   |
| registry_completeness_refactor                 | Superseded by implementation_detail                                                     |
| uac_residual_refactors_provider_manifest       | Phase 3 done; nesting deferred                                                          |
| uac_canonical_normalization_master             | Deferred — current canonical/domain/ layout accepted as final                           |
| mode_config_env_architecture                   | Deferred — UDC stays separate; Phase 1 env_canon done                                   |
| internal_contract_replay_and_drift_infra       | Deferred — all stubs, blocked by 7 plans                                                |
| ui_api_flow_validation_citadel_grade           | Phases 1-2 done; enforcement gates deferred                                             |
| interfaces_capability_contract_unification     | Core items done (registry, errors, guardrails); mapping deferred                        |
| sports_execution_venue_coverage                | ~15/23 done; remaining human work tracked in sports_hub                                 |
| cross_venue_position_aggregation_2026_03_15    | Completed 2026-03-16                                                                    |
| uac_citadel_remediation                        | Completed 2026-03-16                                                                    |
| ui_api_alerting_observability_2026_03_14       | Completed 2026-03-16                                                                    |

### Architectural Decisions (codified)

- **UAC owns enums** (InstrumentType, Venue) — UCI will re-export
- **LogLevel lives in UIC** — operational config, not external API schema
- **UDC stays separate from UTL** — merge deferred indefinitely
- **Current `canonical/domain/` layout is final** — no restructuring
- **EventSeverity = LogLevel** — backward-compat alias in UIC
