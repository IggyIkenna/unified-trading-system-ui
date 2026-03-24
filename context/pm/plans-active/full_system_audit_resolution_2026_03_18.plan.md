---
name: full_system_audit_resolution_2026_03_18
overview: Resolve all findings from the 31-section production readiness audit (2026-03-18). 8 FAILs, 12 WARNs, 11 PASS.
type: mixed
epic: none
completion_gates:
  code: C4
  deployment: none
  business: none
repo_gates: []
depends_on: []
locked_by: live-defi-rollout
locked_since: 2026-03-18
todos:
  - "P0-01: [SCRIPT] Switch RUN_INTEGRATION=true in all repos' quality-gates.sh (§8/§10)"
  - "P0-02: [SCRIPT] Remove .[dev] extras from all 37 Dockerfiles — use uv pip install -e . (§7/§22)"
  - "P0-03: [SCRIPT] Remove .[dev] extras from all 25 cloudbuild.yaml/buildspec.aws.yaml (§15)"
  - "P0-04: [AGENT] Add AUTH_FAILURE event to 4 API services: config-api, trading-analytics-api, ml-training-api, batch-audit-api (§3)"
  - "P0-05: [AGENT] Create S2S_AUTH_SUCCESS and S2S_AUTH_FAILURE event types in UEI; wire in execution-service auth_s2s.py (§3)"
  - "P0-06: [SCRIPT] Register 16 unregistered active plans in SSOT-INDEX (§9)"
  - "P0-07: [SCRIPT] Fix 20 repos manifest version drift — sync workspace-manifest.json versions to pyproject.toml (§9)"
  - "P0-08: [SCRIPT] Add concurrency groups to all GHA workflows (§15)"
  - "P0-09: [AGENT] Migrate 37 Dockerfiles from uv pip install to uv sync --frozen with uv.lock (§22)"
  - "P0-10: [AGENT] Assess all 66 readiness YAML files — fill CR/DR/BR status from current repo state (§19)"
  - "P1-01: [AGENT] Narrow or document 251 broad except Exception — annotate with # broad-except-ok or narrow to specific exceptions (§3/§8)"
  - "P1-02: [AGENT] Reduce 192 type:ignore to <10 — fix underlying type issues or document in BYPASS_AUDIT.md (§8)"
  - "P1-03: [AGENT] Remove 7 try/except ImportError fallbacks — fail loud (§8): UTL base_service.py, health.py, metrics.py; URDI ibkr.py; exec-service benchmarks/conftest.py; SIT check_security.py; codex test template"
  - "P1-04: [AGENT] Merge/remove 110 coverage-boost files — consolidate into primary test files (§10)"
  - "P1-05: [AGENT] Add VCR cassettes to 5 interface repos with zero: unified-sports-reference-interface, unified-defi-execution-interface, unified-ml-interface, unified-config-interface, unified-events-interface (§24)"
  - "P1-06: [AGENT] Add integration_dependencies field to workspace-manifest.json for all repos (§10)"
  - "P1-07: [SCRIPT] Create 6 missing readiness YAML files: config-api, unified-feature-orchestration-library, unified-features-interface, unified-sports-reference-interface, unified-trading-ui-kit, user-management-ui (§19)"
  - "P1-08: [AGENT] Add semver_rules_ref to 2 repos: config-api, user-management-ui (§18)"
  - "P2-01: [AGENT] Add float-ok annotations to 15 UIC risk.py monetary float fields or convert to Decimal (§5)"
  - "P2-02: [AGENT] Implement 9 stubbed methods in execution-service/engine/live/persistence/postgresql.py or remove from import graph (§13)"
  - "P2-03: [AGENT] Reduce 752 noqa suppressions — fix underlying lint issues or use ruff config (§8)"
  - "P2-04: [AGENT] Fix 3 files over 900L: deployment_processor.py (1351L), generate_topology_svg.py (973L), cloud_builds.py (921L) (§2)"
  - "P2-05: [AGENT] Migrate execution-results-api config.py from bare BaseSettings to UnifiedCloudConfig (§30)"
  - "P2-06: [AGENT] Migrate elysium-defi-system config.py from raw os.environ to UnifiedCloudConfig (§30)"
  - "P2-07: [AGENT] Calibrate MIN_COVERAGE for 13 repos at default 70; fix 6 QG/pyproject mismatches (§11)"
  - "P2-08: [AGENT] Add pool: forks to unified-trading-ui-auth/vitest.config.ts (§16)"
  - "P2-09: [AGENT] Add health endpoints to ml-inference-service and ml-training-service (§6)"
  - "P2-10: [AGENT] Roll out AGENTS.md to all 71 repos (only PM has it currently) (§23)"
  - "P2-11: [AGENT] Roll out agent-audit.yml to 44 repos missing it (only 28/72 have it) (§23)"
  - "P2-12: [AGENT] Add 10 repos missing from topology service_flows: batch-audit-api, config-api, deployment-api, features-commodity-service, ml-inference-api, ml-training-api, trading-analytics-api, batch-live-reconciliation-service, trading-agent-service (§31)"
  - "P3-01: [AGENT] Create cefi, tradfi, defi portable backtest files in SIT (§28)"
  - "P3-02: [AGENT] Add dead-code detection (vulture) to QG base scripts (§14)"
  - "P3-03: [AGENT] Replace pip install uv with base image uv in 20+ cloudbuild files (§15)"
  - "P3-04: [AGENT] Stop exporting deprecated CloudTarget from UTL __init__.py (§14)"
  - "P3-05: [AGENT] Resolve 46+ USEI sports browser adapter stubs or remove from import graph (§13)"
  - "P3-06: [AGENT] Resolve 30+ UMI adapter stubs (tradfi/defi/alt_data/onchain) or remove (§13)"
isProject: false
---

# Full System Audit Resolution — 2026-03-18

## Context

Full 31-section production readiness audit run on 2026-03-18. **Overall grade: FAIL** (8 FAILs, 12 WARNs, 11 PASS).

### Audit Results Summary

| §   | Section               | Grade    | Key Issue                                                                       |
| --- | --------------------- | -------- | ------------------------------------------------------------------------------- |
| 1   | Workspace Governance  | WARN     | 2 repos missing semver_rules_ref                                                |
| 2   | Code Quality          | WARN     | 3 files >900L; ~3 repos not fully basedpyright strict                           |
| 3   | Security              | **FAIL** | 4 APIs missing AUTH_FAILURE; S2S events don't exist; 251 broad except Exception |
| 4   | Architecture          | PASS     | deployment-api cloud SDK justified                                              |
| 5   | Schema Governance     | WARN     | 15 UIC float fields without float-ok annotation                                 |
| 6   | Observability         | PASS     | 2 services missing health endpoints (minor)                                     |
| 7   | Deployment            | **FAIL** | 30 Dockerfiles using .[dev] extras                                              |
| 8   | Technical Debt        | **FAIL** | RUN_INTEGRATION=false everywhere; 192 type:ignore; 7 except ImportError         |
| 9   | Cross-Repo Alignment  | **FAIL** | 16/22 plans unregistered; 20 repos version drift                                |
| 10  | Integration Tests     | **FAIL** | RUN_INTEGRATION=false; 110 coverage-boost files; no integration_dependencies    |
| 11  | Coverage Regression   | WARN     | 13 repos default MIN_COVERAGE=70; 6 mismatches                                  |
| 12  | Cloud-Agnostic        | PASS     | SDK imports properly confined                                                   |
| 13  | Stubs                 | WARN     | 197 NotImplementedError; postgresql.py 9 concrete stubs                         |
| 14  | Orphaned Code         | WARN     | No dead-code tooling; deprecated CloudTarget still exported                     |
| 15  | CI/CD Pipeline        | **FAIL** | 25 .[dev] in CI; zero concurrency groups                                        |
| 16  | UI/npm Governance     | WARN     | 1 repo missing vitest pool:"forks"                                              |
| 17  | Tooling SSOT          | PASS     | All repos use thin stubs + base scripts                                         |
| 18  | Semver Hardening      | PASS     | 2 repos missing semver_rules_ref (minor)                                        |
| 19  | Readiness Gates       | **FAIL** | ALL 66 readiness files 100% unassessed                                          |
| 20  | Batch-Live Mode       | PASS     | All T4 services support both modes                                              |
| 21  | Position Recon        | PASS     | Full recon + recovery + rebalance chain                                         |
| 22  | CI/CD Versioning      | **FAIL** | 0/37 Dockerfiles use uv sync --frozen                                           |
| 23  | Agent Infrastructure  | PASS     | Only 28/72 repos have agent-audit.yml (minor)                                   |
| 24  | VCR Cassettes         | WARN     | 5 interface repos zero cassettes                                                |
| 25  | Data Freshness        | PASS     | 32 sources, all 9 producers wired                                               |
| 26  | Performance Testing   | PASS     | Nightly CI, baseline.json, p99 assertions                                       |
| 27  | Contract Completeness | PASS     | UIC + UAC completeness + adoption scripts                                       |
| 28  | E2E Smoke             | WARN     | Missing cefi/tradfi/defi portable backtests                                     |
| 29  | API Domain Coverage   | WARN     | Sports + DeFi lack dedicated APIs                                               |
| 30  | Config Architecture   | WARN     | 2 repos bypass UnifiedCloudConfig                                               |
| 31  | Infra Parity          | WARN     | 10 repos missing from topology service_flows                                    |

## Phase 0 — Critical FAIL Resolution (P0, all PARALLEL)

Fixes the 8 FAIL sections. Must be done before any other work.

```
P0-01 ──┐
P0-02 ──┤
P0-03 ──┤
P0-04 ──┤── ALL PARALLEL ──▶ QG gate: all repos pass quality-gates.sh
P0-05 ──┤
P0-06 ──┤
P0-07 ──┤
P0-08 ──┤
P0-09 ──┤
P0-10 ──┘
```

### P0 Items

- [x] **P0-01** [SCRIPT] Switch `RUN_INTEGRATION=true` in ALL repos' quality-gates.sh
  - Blast radius: ALL 35+ repos with integration tests
  - Script: `sed -i '' 's/RUN_INTEGRATION=false/RUN_INTEGRATION=true/' */scripts/quality-gates.sh`
  - Hardening: Add check in base-service.sh that FAILs if `RUN_INTEGRATION=false`

- [x] **P0-02** [SCRIPT] Remove `.[dev]` from ALL 37 Dockerfiles
  - Change: `uv pip install -e ".[dev]"` → `uv pip install -e .`
  - Hardening: Add rg check in base-service.sh codex section

- [x] **P0-03** [SCRIPT] Remove `.[dev]` from ALL 25 cloudbuild.yaml/buildspec.aws.yaml
  - Same pattern as P0-02 but in CI config files
  - Hardening: Add check in CI workflow template

- [x] **P0-04** [AGENT] Add AUTH_FAILURE to 4 API services
  - config-api, trading-analytics-api, ml-training-api, batch-audit-api
  - Pattern: copy from alerting-service auth middleware

- [x] **P0-05** [AGENT] Create S2S_AUTH_SUCCESS/S2S_AUTH_FAILURE in UEI
  - Add to unified-events-interface/schemas.py
  - Wire in execution-service/auth_s2s.py

- [x] **P0-06** [SCRIPT] Register 16 plans in SSOT-INDEX
  - List: config_lifecycle_flows, cross_service_architecture_audit, defi_operation_capability, instruments_service_batch_validation, live_batch_alignment_audit, mock_data_rollout, quality_gates_full_fix, quality_gates_systemic_remediation, registry_completeness, sports_hub_residual, strategy_system_citadel_master, ui_consolidation_ux_hardening, ui_navigation_ux_model, ui_platform_redesign, ui_trader_acceptance_testing, user_management_platform

- [x] **P0-07** [SCRIPT] Fix manifest version drift for 20 repos
  - Read pyproject.toml version, update workspace-manifest.json
  - Hardening: Add version-drift check to overnight orchestrator

- [x] **P0-08** [SCRIPT] Add concurrency groups to ALL GHA workflows
  - Pattern: `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }`
  - For manifest-mutating: `cancel-in-progress: false`

- [x] **P0-09** [AGENT] Migrate Dockerfiles to `uv sync --frozen`
  - Requires: generate uv.lock in each repo first
  - Phased: T0 libs first, then T1, then services

- [ ] **P0-10** [AGENT] Assess readiness YAMLs
  - Run automated checks (QG pass = CR4, has Dockerfile = DR1, etc.)
  - Fill in what can be derived; mark remaining as "requires manual assessment"

## Phase 1 — FAIL Cleanup + High-Value WARNs (P1, PARALLEL after P0)

```
P0 complete ──▶ P1-01 through P1-08 ALL PARALLEL ──▶ QG gate
```

- [x] **P1-01** Narrow 251 broad `except Exception`
- [x] **P1-02** Reduce 192 `type: ignore` to <10
- [x] **P1-03** Remove 7 `try/except ImportError` fallbacks
- [x] **P1-04** Merge/remove 110 coverage-boost files
- [x] **P1-05** Add VCR cassettes to 5 interface repos
- [x] **P1-06** Add `integration_dependencies` to manifest
- [x] **P1-07** Create 6 missing readiness YAMLs
- [x] **P1-08** Add semver_rules_ref to 2 repos

## Phase 2 — WARN Resolution (P2, PARALLEL after P1)

```
P1 complete ──▶ P2-01 through P2-12 ALL PARALLEL ──▶ QG gate
```

- [x] **P2-01** Float-ok annotations for 15 UIC risk.py fields
- [ ] **P2-02** Document postgresql.py (2 classes, 9 stubs) as architectural placeholder — IS wired in persistence/**init**.py and has tests; implement when USE_DATABASE=true live path is needed
- [ ] **P2-03** Audit noqa suppressions workspace-wide — custom qg-\*/gs-uri codes already inline-documented; create BYPASS_AUDIT.md for repos with standard ruff codes (F401/E402/C901/N802/PLW0603)
- [ ] **P2-04** Split 3 oversized files
- [x] **P2-05** execution-results-api → UnifiedCloudConfig
- [x] **P2-06** elysium-defi-system → UnifiedCloudConfig
- [ ] **P2-07** Calibrate 13 MIN_COVERAGE + fix 6 mismatches
- [x] **P2-08** vitest pool:"forks" for unified-trading-ui-auth
- [x] **P2-09** Health endpoints for ml-inference-service, ml-training-service
- [ ] **P2-10** Roll out AGENTS.md to 71 repos
- [ ] **P2-11** Roll out agent-audit.yml to 44 repos
- [ ] **P2-12** Add 10 repos to topology service_flows

## Phase 3 — Polish + Future-Proofing (P3, PARALLEL after P2)

- [ ] **P3-01** Portable backtests (cefi/tradfi/defi)
- [ ] **P3-02** Dead-code detection (vulture) in QG
- [ ] **P3-03** Replace `pip install uv` with base image in cloudbuild
- [ ] **P3-04** Remove deprecated CloudTarget export
- [ ] **P3-05** Resolve 46+ USEI sports browser stubs
- [ ] **P3-06** Resolve 30+ UMI adapter stubs

## Quality Gate Hardening Recommendations

To prevent these issues from recurring, add the following checks to base-service.sh / base-library.sh:

### 1. RUN_INTEGRATION enforcement (prevents §8/§10 regression)

```bash
# In base-service.sh, before test execution:
if [ "$RUN_INTEGRATION" != "true" ]; then
  echo "FAIL: RUN_INTEGRATION must be true. Set RUN_INTEGRATION=true in quality-gates.sh"
  exit 1
fi
```

### 2. .[dev] extras ban (prevents §7/§15/§22 regression)

```bash
# In base-service.sh codex checks:
if rg '\.\[dev\]' "$REPO_ROOT/Dockerfile" "$REPO_ROOT/cloudbuild.yaml" "$REPO_ROOT/buildspec.aws.yaml" 2>/dev/null | grep -v '^#'; then
  echo "FAIL: .[dev] extras found in build files. Use flat deps only."
  exit 1
fi
```

### 3. AUTH_FAILURE enforcement for API services (prevents §3 regression)

```bash
# In base-service.sh, for repos with api/ or routes/ directories:
if [ -d "$SOURCE_DIR/api" ] || [ -d "$SOURCE_DIR/routes" ]; then
  if ! rg 'AUTH_FAILURE' "$SOURCE_DIR/" --type py --glob '!tests/**' -q 2>/dev/null; then
    echo "FAIL: API service missing AUTH_FAILURE event logging"
    exit 1
  fi
fi
```

### 4. Broad except Exception cap (prevents §3/§8 regression)

```bash
# In base-service.sh codex checks:
BROAD_EXCEPT=$(rg 'except Exception' "$SOURCE_DIR/" --type py --glob '!tests/**' -c 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
if [ "$BROAD_EXCEPT" -gt 5 ]; then
  echo "FAIL: $BROAD_EXCEPT broad 'except Exception' found (max 5). Narrow to specific exceptions or annotate # broad-except-ok"
  exit 1
fi
```

### 5. Manifest version drift check (prevents §9 regression)

```bash
# In overnight orchestrator or version-alignment:
python3 -c "
import json, pathlib
try:
    import tomllib
except ImportError:
    import tomli as tomllib
m = json.load(open('unified-trading-pm/workspace-manifest.json'))
drift = []
for r in m['repos']:
    pp = pathlib.Path(r['name'] + '/pyproject.toml')
    if pp.exists():
        with open(pp, 'rb') as f:
            pv = tomllib.load(f).get('project', {}).get('version', '?')
        mv = r.get('version', '?')
        if pv != mv and mv != '?':
            drift.append(f'{r[\"name\"]}: manifest={mv} pyproject={pv}')
if drift:
    print(f'FAIL: {len(drift)} repos with version drift')
    for d in drift: print(f'  {d}')
    exit(1)
"
```

### 6. SSOT-INDEX plan registration check (prevents §9 regression)

```bash
# In PM quality-gates.sh:
ACTIVE=$(ls plans/active/*.plan.md 2>/dev/null | wc -l)
REGISTERED=$(rg '\.plan\.md' unified-trading-codex/00-SSOT-INDEX.md 2>/dev/null | wc -l)
if [ "$ACTIVE" -gt "$REGISTERED" ]; then
  echo "WARN: $ACTIVE active plans but only $REGISTERED registered in SSOT-INDEX"
fi
```

### 7. Coverage-boost file ban (prevents §10 regression)

```bash
# In base-service.sh:
BOOST_FILES=$(find tests/ -name 'test_coverage_boost_*' -o -name 'test_*_coverage.py' -o -name 'test_boost_*' 2>/dev/null | wc -l)
if [ "$BOOST_FILES" -gt 0 ]; then
  echo "FAIL: $BOOST_FILES coverage-boost files found. Merge into primary test files."
  exit 1
fi
```

### 8. Concurrency group enforcement (prevents §15 regression)

```bash
# In workflow template rollout:
for wf in */.github/workflows/*.yml; do
  if ! grep -q 'concurrency:' "$wf" 2>/dev/null; then
    echo "WARN: $wf missing concurrency group"
  fi
done
```

## Success Criteria

- Phase 0: All 8 FAIL sections → PASS or WARN
- Phase 1: All remaining FAIL criteria resolved; type:ignore < 10
- Phase 2: All WARN sections → PASS
- Phase 3: Full PASS on all 31 sections
- Final: Re-run full audit → overall grade PASS
