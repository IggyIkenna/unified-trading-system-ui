# Feature Branch Workflow

**Last Updated:** 2026-02-28 **SSOT:** This document. Cross-refs: `always-use-quickmerge.mdc`,
`conventional-commits.mdc`, `library-versioning.mdc`, `path-dependency-ci.mdc`, `never-revert-local-changes.mdc`

This document defines the complete development workflow for feature branches across the 50+ repo workspace — from local
development through CI to main merge.

---

## Mental Model: Branch = Snapshot

When you check out a git branch or tag, `pyproject.toml` comes with it at that commit's version. The version in the file
IS the snapshot. You never need to manually edit version numbers on a branch — the git state already includes the right
toml.

```
git checkout v1.2.3          # pyproject.toml says version = "1.2.3" ✅
git checkout feat/rollback   # pyproject.toml says whatever it said at last commit ✅
# No manual toml editing needed on branches
```

---

## Branch Model

| Branch type             | Quickmerge behaviour                     | When to use                |
| ----------------------- | ---------------------------------------- | -------------------------- |
| `feat/*` or `feature/*` | QG only — no PR, branch pushed to remote | Active feature development |
| `staging`               | QG + auto-PR to main                     | Ready to integrate to main |
| `main`                  | Branch protection — no direct push       | Production                 |

**Promoting feature → main:**

```bash
git checkout staging
git merge feat/my-feature
bash scripts/quickmerge.sh "feat: my feature description"
# → quality gates run on staging → auto-PR to main → auto-merge when CI passes
```

**Nothing to commit on staging (everything worked first time):**

```bash
git commit --allow-empty -m "chore: promote feat/X to staging"
bash scripts/quickmerge.sh "chore: promote feat/X to staging"
```

---

## Conventional Commits (Required)

All commit messages must use the conventional format. The GitHub Action on main reads the prefix to determine the
version bump.

| Prefix                                         | Pre-1.0.0 bump (current) | Post-1.0.0 bump       | Example                              |
| ---------------------------------------------- | ------------------------ | --------------------- | ------------------------------------ |
| `feat:`                                        | minor (0.1.0 → 0.2.0)    | minor (1.2.0 → 1.3.0) | `feat: add ConfigReloader to UTS`    |
| `fix:`                                         | patch (0.1.0 → 0.1.1)    | patch (1.2.3 → 1.2.4) | `fix: correct tier boundary check`   |
| `feat!:` / `BREAKING CHANGE:`                  | minor (0.1.0 → 0.2.0) \* | major (1.x.x → 2.0.0) | `feat!: remove ConfigStore from UCI` |
| `chore:`, `docs:`, `refactor:`, `test:`, `ci:` | none                     | none                  | `chore: update .gitignore`           |

\* Pre-1.0.0: BREAKING is treated as minor — the version NEVER crosses to 1.0.0 automatically. `1.0.0` is only set when
all plan items for that repo/tier are done and the final quickmerge PR lands on main.

**Never bump version locally on branches.** The GitHub Action does it on merge to main.

---

## Dependency Cascade

When you have changes in multiple repos that depend on each other (e.g., T1 depends on T0 which you also changed),
quickmerge cascades automatically.

```bash
# You have changes in both unified-config-interface (T1) and unified-trading-services (T1)
# Run quickmerge on T1 (the higher-tier repo):
cd unified-trading-services
bash scripts/quickmerge.sh "feat: ConfigReloader extraction" --dep-branch "feat/config-reloader"
```

What happens:

1. Stage 1 detects `unified-config-interface` has local changes
2. **Cascades into UCI**: runs
   `quickmerge.sh "feat: ConfigReloader extraction" --dep-branch "feat/config-reloader" --quick` inside UCI
3. UCI's changes are committed and pushed to the `feat/config-reloader` branch
4. UTS quality gates run using UCI's local path dep (already updated)
5. UTS `feat/config-reloader` branch is pushed with a PR

Cascade order is topological: T0 always processed before T1, T1 before T2, etc., determined by
`workspace-manifest.json (SSOT)`.

**Local changes are NEVER discarded during cascade.** The stash/pop mechanism preserves everything.

---

## Never Revert Local Changes

When quickmerge detects a dependency conflict (dep has changes not on main), the **only valid response** is
`--dep-branch`. Never `git reset --hard`.

```bash
# ❌ FORBIDDEN — destroys your feature branch changes in the dep
cd unified-config-interface && git reset --hard origin/main

# ✅ CORRECT — preserves all changes, cascades automatically
bash scripts/quickmerge.sh "feat: X" --dep-branch "feat/X"
```

The local changes in the dependency repo ARE the feature. Discarding them defeats the entire purpose of the feature
branch.

---

## Versioning on Feature Branches

### Pre-Stable Policy (all repos, current state)

All repos are `0.x.x` until they pass a full quickmerge on `main` under the Phase 0-CI pipeline. **`1.0.0` = first
stable release = first successful CI-validated merge to main.**

- `0.x.y` preserves relative evolution (e.g. UTS `0.2.2` has more history than AC `0.1.0`)
- No repo should be `>=1.0.0` in `workspace-manifest.json` until it is proven stable on CI
- `pyproject.toml` versions in all repos must match the manifest (a CI check verifies this)

### Behaviour by location

| Location                           | Behaviour                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `pyproject.toml` on feature branch | Unchanged from last main merge — do NOT edit                                |
| `workspace-manifest.json`          | SSOT for all versions; all `0.x.x` until first stable CI merge              |
| Artifact Registry (production)     | Only receives clean semver (e.g. `0.1.1`, eventually `1.0.0`) on main merge |
| Artifact Registry (feature)        | Receives `0.1.0+feat-branch.sha` from feature Cloud Build                   |
| GitHub Action on main merge        | Auto-bumps pyproject.toml + workspace-manifest.json based on commit prefix  |

Feature branch artifacts use ephemeral version injection in the Cloud Build container (never committed):

```bash
# Cloud Build ephemeral step — only inside the container, never touches the repo
VERSION=$(grep '^version' pyproject.toml | sed 's/version = "//;s/"//')
BRANCH_TAG=$(echo $BRANCH_NAME | tr '/' '-' | cut -c1-20)
sed -i "s/version = \"$VERSION\"/version = \"$VERSION+$BRANCH_TAG.$SHORT_SHA\"/" pyproject.toml
python -m build --wheel
# Wheel: unified_config_interface-1.3.0+feat-config-reloader.abc123-py3-none-any.whl
```

PEP 440 local versions (`+`) are only matched by exact pin — they are never accidentally installed by `>=1.3.0`
constraints.

---

## CI: Feature Branch Dep Resolution

GitHub Actions clones dependencies using `${DEP_BRANCH:-main}` with a fallback:

```yaml
- name: Clone unified-config-interface
  run: |
    # Read dep-branch label from PR (set by quickmerge --dep-branch)
    DEP_BRANCH=$(gh pr view $PR_NUMBER --json labels \
      --jq '.labels[].name | select(startswith("dep-branch: ")) | ltrimstr("dep-branch: ")' \
      2>/dev/null || echo "")
    BRANCH="${DEP_BRANCH:-main}"
    # Fall back to main if branch doesn't exist in dep repo (already merged/deleted)
    if git ls-remote --heads https://github.com/org/unified-config-interface "$BRANCH" | grep -q "$BRANCH"; then
      git clone -b "$BRANCH" .../unified-config-interface ../unified-config-interface
    else
      git clone .../unified-config-interface ../unified-config-interface
    fi
```

**How the label gets there:** quickmerge Stage 5 adds a `dep-branch: feat/X` label to the PR body and label when
`--dep-branch` is set.

---

## Temporary Manifests (Dev Cycle Snapshots)

For complex multi-repo refactors where you want to share the "current state" of what branches are being tested:

Location: `unified-trading-pm/feature-manifests/*.json`

```json
{
  "name": "feat-config-reloader-extraction",
  "created_at": "2026-02-28T...",
  "description": "Moving ConfigReloader from UCI to UTS",
  "branches": {
    "unified-config-interface": "feat/config-reloader",
    "unified-trading-services": "feat/config-reloader"
  },
  "artifact_versions": {
    "unified-config-interface": "0.1.0+feat-config-reloader.abc123",
    "unified-trading-services": "0.2.2+feat-config-reloader.def456"
  },
  "status": "in_progress"
}
```

Cloud Build reads this file (clones `unified-trading-pm` via GH_PAT in pre-step) to resolve which branch/artifact to
install for each dependency.

---

## Refactor Scope (Multi-Repo Refactor Mode)

When doing a large multi-repo refactor where tests are intentionally failing:

In `unified-trading-pm/workspace-manifest.json`:

```json
"refactor_scope": {
  "active": true,
  "reason": "Extracting ConfigReloader from UCI to UTS — tests expected to fail until both repos pass",
  "in_flight_repos": ["unified-config-interface", "unified-trading-services"],
  "ci_mode": "warn-only",
  "started": "2026-02-28"
}
```

When `refactor_scope.active = true`:

- Quickmerge warns on test failures instead of exiting 1
- GitHub Actions posts a comment "refactor_scope active" but does not block merge
- Agents do NOT attempt to revert code or versions to fix tests

---

## Tier Ordering Invariant

**NEVER change service code without having a passing library tier it depends on.**

```
T0 green → T1 green → T2 green → T3 green → T4 (services) green → T5 (API) green → T6 (UIs) green
```

Within each tier, always work in dependency order (check `workspace-manifest.json`). Tiers have no inter-lib deps within
the same level — repos at the same tier can be worked in parallel.

## Meta-Flow Per Tier (always in this order)

```
STEP A: Fix deploy structure (cloudbuild.yaml, quality-gates.sh, pyproject.toml)
STEP B: Write/fix tests FIRST (import smoke test, unit tests, contract tests)
STEP C: Code rewrite (tier violations, type errors, import paths, QG violations)
STEP D: quickmerge --unit-only   ← fast feedback, catches critical issues
STEP E: quickmerge (full)        ← tier is only "green" when this passes
```

## Two-Step Quickmerge

```bash
# STEP D: fast feedback
bash scripts/quickmerge.sh "feat: rewrite UCI imports" --unit-only
# → lint + type check + unit tests only; skips integration tests + act
# → CI may fail on integration tests — expected and acceptable at this stage
# → catches: import errors, syntax errors, type errors, unit test regressions

# Fix any critical issues from --unit-only, then:

# STEP E: full validation
bash scripts/quickmerge.sh "feat: rewrite UCI imports"
# → all tests + act simulation; tier is "green" only when this passes
```

## Two-Pass Model (Agents and CI)

Agents and CI scripts should split quality validation into two passes to avoid re-running slow tests unnecessarily:

```bash
# Pass 1 — full quality gates (all checks)
bash scripts/quality-gates.sh
# → lint, format, tests, typecheck, codex, security — everything

# Pass 2 — quickmerge lightweight verify (no tests, no act)
bash scripts/quickmerge.sh "feat: ..." --agent
# → lint + format + typecheck + codex only
# → tests already passed in Pass 1; act is wasted overhead in automated sessions
```

`--agent` implies `--skip-tests` + skip act. It is **required** for all agent callers (Claude Code, `run-agent.sh`,
GitHub Actions). NEVER use `--quick` from an automated caller — use `--agent` so intent is documented.

To also skip typecheck in quickmerge (if it ran in Pass 1): `--agent --skip-typecheck`.

## Documentation & Config Repo Versioning

`unified-trading-pm` and `unified-trading-codex` are not deployed services, but they carry `pyproject.toml` with semver
versioning and a `version-bump.yml` GitHub Action. This serves three purposes:

1. **Audit trail**: know which version of docs/manifest was "reality" at any point in time
2. **Agent context**: Cursor agents operating on these docs know what version of the spec they are reading
3. **CI/CD validation**: the PM repo's version-bump also updates `workspace-manifest.json` versions map for its own
   entry

Same conventional commit rules apply. `chore:` and `docs:` do NOT bump version (no-op). `feat:` bumps minor, `fix:`
bumps patch. Same pre-1.0.0 safety: BREAKING never bumps to 1.0.0 within 0.x.x range.

**Cross-repo manifest sync:** PM's `version-bump.yml` updates its own entry in `workspace-manifest.json` directly (same
repo). For all other repos (codex, services, libraries), their `version-bump.yml` bumps their own `pyproject.toml` but
cannot push to the PM repo. The PM manifest is updated by either: (a) the PM `version-bump.yml` detecting a repository
dispatch event, or (b) a periodic sync workflow. Until cross-repo triggers are wired, pull the PM manifest manually
after each repo's main merge and check the `versions` map.

**All 53 repos** must have a `version-bump.yml` GitHub Action. This is propagated as part of Phase 0 Stream A
(quickmerge template propagation). Each workflow bumps the repo's own `pyproject.toml` (or `package.json` for UIs).

---

## Quick Reference

```bash
# Agent/CI — two-pass (recommended for all automated sessions)
bash scripts/quality-gates.sh                                         # Pass 1: full validation
bash scripts/quickmerge.sh "feat: ..." --agent                        # Pass 2: lint+format+typecheck+codex, no tests, no act
bash scripts/quickmerge.sh "feat: ..." --agent --skip-typecheck       # Pass 2: lint+format+codex only

# Human — feature branch work (auto --no-pr on feat/* branches)
bash scripts/quickmerge.sh "feat: add new adapter"

# Human — fast feedback: unit tests only (catches critical issues)
bash scripts/quickmerge.sh "feat: add new adapter" --unit-only

# Human — skip act only (tests still run)
bash scripts/quickmerge.sh "feat: add new adapter" --quick

# Feature with dep changes (cascade + branch isolation)
bash scripts/quickmerge.sh "feat: multi-repo change" --dep-branch "feat/my-feature"

# Force no-PR on any branch
bash scripts/quickmerge.sh "chore: update config" --no-pr

# Promote feature to main (via staging)
git checkout staging && git merge feat/my-feature
bash scripts/quickmerge.sh "feat: my feature description"

# NEVER
git reset --hard origin/main      # destroys local changes
bash scripts/quality-gates.sh     # bypasses dep validation + PR (use as Pass 1 only, not instead of quickmerge)
git push origin main              # bypasses branch protection
```

---

## Integration Testing Layers

Quickmerge runs Layers 0 and 1 as part of quality gates. Layers 2 and 3 run post-deploy.

| Layer | Scope                                                           | In quickmerge?                       |
| ----- | --------------------------------------------------------------- | ------------------------------------ |
| 0     | Contract alignment (AC↔UIC schema pairs)                       | Yes                                  |
| 1     | Schema robustness per-service                                   | Yes                                  |
| 1.5   | Per-component integration tests with mocked direct dependencies | Yes — last local gate before Layer 2 |
| 2     | Infrastructure verify (GCS, PubSub, IAM)                        | No — post-deploy                     |
| 3a    | Pipeline smoke (fast happy path)                                | No — post-deploy                     |
| 3b    | Full E2E (corner cases, auth, perf)                             | No — post-deploy                     |

**SSOT:** `06-coding-standards/integration-testing-layers.md`

---

## Periodic Reflog Audit

Weekly check for unintended `reset --hard` or `reset to origin/main`. Alerts via macOS notification on failure.

**SSOT:** `unified-trading-pm/docs/audit-reflog-scheduled-job.md`

| Action                    | Command                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run manually (with alert) | `bash unified-trading-pm/scripts/repo-management/run-audit-reflog-with-alert.sh`                                                                                      |
| Start scheduled job       | `bash unified-trading-pm/scripts/repo-management/launchd/install-audit-reflog.sh` then `launchctl load ~/Library/LaunchAgents/com.unified-trading.audit-reflog.plist` |
| Cancel job                | `launchctl unload ~/Library/LaunchAgents/com.unified-trading.audit-reflog.plist`                                                                                      |
| Log                       | `/tmp/audit-reflog.log`                                                                                                                                               |
