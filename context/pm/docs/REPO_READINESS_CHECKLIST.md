# Repo Readiness Checklist — SSOT

> **CANONICAL CHECKLIST TEMPLATE:** `unified-trading-codex/10-audit/REPO_READINESS_CHECKLIST.yaml` **Per-repo status:**
> `unified-trading-codex/10-audit/repos/{repo-name}.yaml`

**Canonical definition of per-repo readiness stages for all 65 repos in the workspace manifest.**

Every repo must progress through three independent readiness axes: **Code (CR)**, **Deployment (DR)**, and **Business
(BR)**. Axis progression is independent — a repo can be at CR5 but DR1 — but the v1.0.0 gate requires specific minimums
across all three axes.

SSOT for: `cursor-rules/core/repo-readiness-checklist.mdc`, `cursor-rules/core/semver-v1-hardening.mdc` Master tracker:
`plans/active/code_readiness_master_plan_2026_03_11.md`

---

## Code Readiness (CR)

Per-repo code stages, executed in order. CR stages directly map to the plan gate levels C0–C5.

| Stage | Gate  | Criteria                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------- |
| CR0   | C0    | Not started                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| CR1   | C1    | **Functionality 100%** — audit confirms: zero `NotImplementedError` in core paths, zero stub handlers returning `{}` or `pass`, no `TODO`/`FIXME` markers in production-path code. Make-sense criteria: run the trading system audit checklist (§2 Functionality) against this repo. Every stub must be tracked in an active plan.                                                                                                           |
| CR2   | C2    | **Unit tests 100% passing** — `bash scripts/quality-gates.sh` unit stage green; coverage ≥ floor (80% for libraries, 70% for services); zero skipped tests without documented reason in the test file itself. Coverage XML written to disk (`--cov-report=xml`).                                                                                                                                                                             |
| CR3   | (C3½) | **Integration tests 100% passing** — every _direct_ downstream dependency declared in `workspace-manifest.json` is exercised by at least one integration test (not just mocked). Uses emulators/mocks per `cicd_mock_hardening_2026_03_11.md`. Make-sense criteria: count the repo's `dependencies` in the manifest; each must appear in `tests/integration/`. Tests run credential-free (`CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true`). |
| CR4   | C4    | **Quality gate passing locally** — `bash scripts/quality-gates.sh` Pass 1 fully green: ruff, basedpyright (0 errors), coverage floor, codex checks, security scan, all tests pass. No `                                                                                                                                                                                                                                                      |     | :` bypasses added to reach green. |
| CR5   | C5    | **Quickmerge to feature branch** — `bash scripts/quickmerge.sh "feat: ..." --agent` to `feat/code-readiness-<repo>` or equivalent feature branch. PR created and CI passes. This is NOT a merge to `main` or `staging`; it is the signal that CI validates the code on its own.                                                                                                                                                              |

### CR3 Integration Test Manifest Rule

For a repo with manifest dependencies `[A, B, C]`:

- `tests/integration/test_a_integration.py` must exist and be non-trivially passing
- `tests/integration/test_b_integration.py` must exist and be non-trivially passing
- `tests/integration/test_c_integration.py` must exist and be non-trivially passing
- "Non-trivially passing" = tests exercise real business logic, not just `assert True`

Repos with zero manifest dependencies (e.g. MEL, EAL) satisfy CR3 automatically — they have no downstream deps to
integration-test.

---

## Deployment Readiness (DR)

| Stage | Criteria                                                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DR0   | Not started (default)                                                                                                                                                                                                                  |
| DR1   | **Deployable** — Docker image builds; `cloudbuild.yaml` correct; infra provisioned (GCS buckets, PubSub topics, Secret Manager entries populated per `api_keys_and_auth.md`); `scripts/setup-workspace.sh` succeeds for this repo |
| DR2   | **CI smoke tests pass** — `production_mock_e2e` suite green in GitHub Actions; emulators + mocks; zero live cloud calls; `CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true` throughout                                                        |
| DR3   | **Feature environment deployed** — at least one successful deployment to the `feat/` or `dev` Cloud Run environment; `GET /health` returns 200; `GET /readiness` returns 200; basic smoke route returns expected payload               |
| DR4   | **Staging SIT pass** — `system-integration-tests` full suite passes with this repo as the target; uses real credentials in staging; no circuit breaker trips during the SIT run                                                        |
| DR5   | **Load/performance pass** — P99 latency meets repo-specific SLA (declared in the plan owning this repo); no memory leaks under 10-minute sustained load; throughput ≥ target                                                           |
| DR6   | **Production-ready** — all security gates green (zero CRITICAL CVEs, auth middleware verified, no `DISABLE_AUTH` in prod config); post-deploy health checks pass for ≥24 hours; runbook exists in `docs/`                              |

---

## Business Readiness (BR)

| Stage | Criteria                                                                                                                                                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR0   | Not started (default)                                                                                                                                                                                                                                            |
| BR1   | **Acceptance criteria defined** — plan owning this repo has a `B1` section with measurable acceptance criteria                                                                                                                                                   |
| BR2   | **Circuit breaker validated** — circuit breaker trips correctly on fault injection (`FaultInjectionTransport`); recovery path tested; 3-state machine (CLOSED → OPEN → HALF*OPEN) verified. \_Skip for repos with no circuit breaker (e.g. libraries, UIs).*     |
| BR3   | **Event handling validated** — all UEI events emitted by this repo fire correctly in integration tests; event schema matches UAC canonical; correlation_id propagated; log_event() called at the correct lifecycle points                                        |
| BR4   | **PnL / performance targets met** — domain-specific KPIs declared and measured: ML accuracy ≥ threshold; strategy Sharpe ≥ target; execution alpha ≥ benchmark; latency P99 < SLA; data completeness ≥ 99.9%. _Declare "N/A" with reason for non-revenue repos._ |
| BR5   | **PnL optimization validated** (revenue-path repos only) — at least one full backtest run confirms the strategy/model/execution contribution is positive; backtest artifacts stored in `gs://unified-backtests/<repo>/`                                          |
| BR6   | **Batch vs live validation** — t+1 check: batch output matches live run expectations within declared tolerance; `live_batch_protocol_completeness` plan items complete for this repo                                                                             |
| BR7   | **Staging vs live parity** — N-minute replay of staging calls against prod-equivalent environment; output delta within tolerance                                                                                                                                 |
| BR8   | **User approved** — human sign-off that the commercial objective for this repo is met. This is a manual gate — no agent can set BR8 autonomously.                                                                                                                |

---

## v1.0.0 Gate — What It Means

A repo's version reaches `1.0.0` only when ALL of the following are satisfied:

| Axis       | Minimum Required                           | Notes                                                                        |
| ---------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Code       | CR5 (quickmerge to main, not just feature) | For v1.0.0, CR5 means merged to `main` via the cascade, not just to `feat/*` |
| Deployment | DR3 (feature env deployed at least once)   | Proves the repo has shipped as a real service                                |
| Deployment | DR4 (staging SIT pass)                     | Proves cross-service compatibility                                           |
| Business   | BR2 (circuit breaker)                      | Required for all service repos; N/A for libraries/UIs                        |
| Business   | BR3 (event handling)                       | Required for all repos that emit UEI events                                  |
| Business   | BR4 (perf targets met)                     | Domain KPIs declared and measured                                            |
| Business   | BR8 (user approved)                        | **No agent may set this.** User reviews all undone items.                    |

**Every unmet item must be tracked in an active plan with a completion timeline.** If an item is declared N/A, the
reason must appear in the plan's `repo_gates` note.

**Pre-1.0.0 rule preserved:** On `0.x.x`, `feat!:` bumps MINOR (never crosses to `1.0.0`). CI does NOT auto-promote to
`1.0.0`. The `1.0.0` version is set manually after BR8 (user approval).

---

## Semver Bump Authority — GHA Only

**Version bumps NEVER happen locally.** `pyproject.toml` and `package.json` versions are NEVER edited by agents, humans,
or scripts outside of GitHub Actions.

The sole authority is `semver-agent.yml`, a **separate GHA workflow** (not part of quality-gates.yml) that:

- Triggers when `quality-gates.yml` completes with `success` on the `staging` branch
- Reads active PM plans to understand what work was completed vs what was planned
- Analyzes the git diff and classifies bump magnitude using `docs/per-repo-semver-rules.yaml`
- Dispatches `version-bump` to PM → updates `staging_versions` in `workspace-manifest.json`

| Bump type                 | Trigger                                                  | Authority                                                            | Minimum state                     |
| ------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------- |
| `patch` (0.x.y → 0.x.y+1) | QG passes on staging; diff is PATCH-only                 | `semver-agent.yml` auto-dispatches                                   | QG green (CR4)                    |
| `minor` (0.x.y → 0.x+1.0) | QG passes on staging; diff is MINOR or MAJOR (pre-1.0.0) | `semver-agent.yml` auto-dispatches                                   | CR5 + QG green                    |
| `1.0.0`                   | All gates met; user approves                             | `major-bump-approval.yml` — **human triggers via workflow_dispatch** | CR5(main)+DR3+DR4+BR2+BR3+BR4+BR8 |
| `MAJOR` (post-1.0.0)      | QG passes; diff is MAJOR; version ≥1.0.0                 | `major-bump-approval.yml` — human or admin script approves           | Same as 1.0.0                     |

**Pre-1.0.0 override:** MAJOR diff on `0.x.x` → classified as MINOR. Never auto-crosses to 1.0.0.

**MAJOR approval options:**

1. Human triggers `major-bump-approval.yml` via GHA `workflow_dispatch`
2. Admin script: `bash unified-trading-pm/scripts/approve-major-bump.sh {repo} {version} --admin-pat $GH_PAT` (uses
   GH_PAT with admin rights to trigger the GHA workflow programmatically)

---

## Per-Repo Checklist Application

### Libraries (T0–T3)

| Stage               | T0 (MEL/EAL/UEI/UCI/AC/UIC)       | T1 (UTL/URDI)        | T2 (UMI/UTEI/UML/UFC/UDEI/USEI) | T3 (UDC)             |
| ------------------- | --------------------------------- | -------------------- | ------------------------------- | -------------------- |
| CR3 integration     | Auto-satisfied for zero-dep repos | Deps per manifest    | Deps per manifest               | Deps per manifest    |
| BR2 circuit breaker | N/A (libraries)                   | N/A                  | N/A                             | N/A                  |
| BR4 perf            | Latency of public API only        | Latency + throughput | Latency + throughput            | Latency + throughput |
| BR5 PnL             | N/A                               | N/A                  | N/A                             | N/A                  |
| DR6 prod            | N/A (libraries not deployed)      | N/A                  | N/A                             | N/A                  |

### Services (T4 — instruments-service through batch-live-reconciliation-service)

All stages apply. BR2 (circuit breaker) and BR5 (PnL optimization) required for revenue-path services. BR5 declared N/A
with reason for infrastructure services (instruments-service, market-tick-data-service).

### API Services (T5 — \*-api repos)

All stages apply. BR5 declared N/A (APIs are pass-through, not revenue-path directly).

### UI Repos (T6)

DR stages apply (deployment). BR2 and BR5 declared N/A. BR3 required only if the UI emits UEI events directly.

### Infrastructure / Devops

DR stages apply. BR stages mostly N/A (declare reason). CR stages apply.

---

## Tier Blocking Invariant

This invariant applies to the v1.0.0 promotion sequence:

```
T0 all CR5 + DR3 → T1 work unblocked
T0+T1 all CR5 + DR3 → T2 work unblocked
T0+T1+T2 all CR5 + DR3 → T3 work unblocked
T3 CR5 + DR3 → Services (T4) unblocked
T4 CR5 + DR4 → APIs (T5) unblocked
T5 CR5 + DR4 → UIs (T6) unblocked
All tiers DR4 + BR8 → v1.0.0 eligible
```

Note: This invariant applies to _readiness promotion_, not to day-to-day feature development. Multiple tiers can have
active feature work simultaneously; the invariant only gates tier-level readiness declarations.

---

## Repo Readiness State in Plans

Plans that track readiness progression use `repo_readiness_state` alongside `repo_gates`:

```yaml
repo_gates:
  - repo: unified-trading-library
    code: C4 # highest plan-gate level reached (C0-C5)
    deployment: none
    business: none
    readiness_note: "CR4 reached; CR3 integration tests pending for UTL→UEI dependency"
```

The `code_readiness_master_plan_2026_03_11.md` is the authoritative tracker for per-repo CR/DR/BR state across all
65 repos.
