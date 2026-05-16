# Semantic Versioning Standards

## Overview

All repos in the unified trading system use [Semantic Versioning 2.0.0](https://semver.org/). Version bumps are managed
by CI (`semver-agent.yml`) on merge to the `staging` branch. **Agents and developers MUST NOT manually edit version
fields in `pyproject.toml`** — CI owns all version bumps.

## Commit Prefix → Version Bump Mapping

| Commit prefix | Pre-1.0.0 effect   | Post-1.0.0 effect  |
| ------------- | ------------------ | ------------------ |
| `fix:`        | PATCH (0.x.y+1)    | PATCH (x.y.z+1)    |
| `feat:`       | MINOR (0.x+1.0)    | MINOR (x.y+1.0)    |
| `feat!:`      | MINOR (0.x+1.0) ⚠️ | MAJOR — blocked ⛔ |
| `chore:`      | no bump            | no bump            |

### Pre-1.0.0 Override (MANDATORY)

On `0.x.x` repos `feat!:` bumps **MINOR**, never MAJOR. This is intentional and enforced by `semver-agent.yml`.

MINOR overflow cap: `0.9.x + MINOR → 0.10.0` (correct). Never auto-cross to `1.0.0`.

## MAJOR Version Bump Approval Gate

**Effective: 2026-03-11 — Plan #64**

### Rule

Any MAJOR version bump for any repo in the unified trading system — including the initial promotion from `0.x.x` to
`1.0.0` — requires explicit human approval via a GitHub Issue.

No automated system, agent, or script may directly bump a MAJOR version without this approval loop.

### Approval Flow

```
1. Trigger (automatic or manual):
   - semver-agent.yml detects MAJOR bump needed on staging → creates Issue
   - bash scripts/approve-major-bump.sh {repo} {X.0.0} --reason "..." → creates Issue

2. GitHub Issue created:
   - Title: "[MAJOR BUMP PENDING] {repo}: {current} → {proposed}"
   - Label: "major-bump-pending"
   - Body includes machine-readable metadata block for GHA handler

3. Telegram alert sent to system owner with issue link

4. Human with write access reviews + comments /approve (or /reject)

5. major-bump-issue-handler.yml fires:
   - Verifies commenter write access via GH API
   - Bumps pyproject.toml on staging branch ONLY (never main)
   - Dispatches version-bump to unified-trading-pm (updates staging_versions)
   - Sends Telegram confirmation
   - Closes issue
```

### Pre-1.0.0 Override

On `0.x.x` repos:

- `feat!:` → MINOR bump (e.g. `0.3.2` → `0.4.0`)
- MINOR grows indefinitely: `0.9.0` → `0.10.0` → `0.11.0` (correct)
- `1.0.0` cross is NEVER automatic — always requires the approval flow above

### Scope

This gate applies to ALL repos:

- Service repos (execution-service, strategy-service, etc.)
- Library repos (unified-trading-library, unified-events-interface, etc.)
- Infrastructure repos (unified-trading-pm, unified-trading-codex, deployment-service)
- API/UI repos

### References

- GHA templates: `unified-trading-pm/scripts/propagation/templates/`
  - `request-major-bump.yml` — human-initiated request (creates issue + Telegram)
  - `major-bump-issue-handler.yml` — handles /approve and /reject comments
  - `semver-agent.yml` — automatic detection and issue creation
- Admin script: `unified-trading-pm/scripts/approve-major-bump.sh`
- Cursor rule: `unified-trading-pm/cursor-rules/core/major-bump-approval-required.mdc`
- Plan #64: `unified-trading-pm/plans/active/major_version_bump_approval_gate_2026_03_11.md`

## v1.0.0 Stability Gate

Before ANY repo crosses from `0.x.x` to `1.0.0`, ALL of the following must be true:

- CR5: merged to main via CI cascade
- DR3: feature environment deployed and healthy
- DR4: staging SIT pass (system-integration-tests green)
- BR2: circuit breaker validated (N/A for libraries)
- BR3: UEI event handling validated
- BR4: PnL/performance targets declared AND measured
- BR8: explicit human sign-off in the current session

No agent may declare BR8 or set v1.0.0 autonomously. Present the checklist summary to the user and wait.

## Per-Repo Semver Rules

Each repo has a `semver_rules_ref` in `unified-trading-pm/workspace-manifest.json` pointing to an entry in
`unified-trading-pm/docs/per-repo-semver-rules.yaml`. Before proposing any bump, read the per-repo rules.

SSOT: `unified-trading-pm/cursor-rules/core/per-repo-semver-rules.mdc`
