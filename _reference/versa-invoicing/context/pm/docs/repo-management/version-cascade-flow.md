# Version Cascade Flow — SSOT

**SSOT:** This document. Single entry point for understanding the three-tier branch model, version bump dispatch chain,
selective dependency cascade, hotfix path, breaking change path, and stability criteria.

**See also:** `CI-CD-FLOW.md` (local developer commands) | `sync-to-main-flow.md` (Phase 3 detail) **Codex:**
`unified-trading-codex/08-workflows/version-cascade-flow.md` (mirrors this doc) **Cursor rules:**
`workflow/full-cicd-flow.mdc`, `core/always-use-quickmerge.mdc`,
`dependencies/breaking-change-major-version-protocol.mdc`

---

## Three-Tier Branch Model

```
feat/*       — local iteration; QG only, no PR
  |
  | (--to-staging, breaking changes only)
  v
staging      — convergence zone; all cascade/SIT happens here
  |
  | (auto, after SIT validates staging)
  v
main         — always stable; only updated when SIT passes
```

**Rule:** `main` is NEVER a direct target for breaking changes. Non-breaking changes MAY go directly to main (hotfix
path). Breaking changes MUST go through staging.

---

## Hotfix Path (non-breaking)

Applies to: `fix:`, `feat:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:` commits.

```
Developer on feat/X or any branch
  → bash scripts/quickmerge.sh "fix: ..."
  → QG passes locally (act simulation + quality gates)
  → PR auto-created targeting main
  → PR merges to main
  → version-bump.yml triggers (push to main)
  → repo bumps patch (fix:) or minor (feat:)
  → dispatches version-bump to PM
  → PM updates manifest, bumps PM patch
  → PM dispatches dependency-update to direct dependents
  → dependents update constraint in pyproject.toml → [skip ci] commit
  → no QG triggered downstream (non-breaking constraint range update)
```

**Key:** Non-breaking changes produce a new compatible constraint for dependents. Dependents receive
`>=M.N.0,<(M+1).0.0` — they already satisfy this. No code changes needed downstream. The `[skip ci]` commit prevents
infinite QG loops.

---

## Breaking Change Path (staging model)

Applies to: `feat!:` or commits containing `BREAKING CHANGE:` in the body.

```
Developer on feat/X
  → bash scripts/quickmerge.sh "feat!: ..." --to-staging
  → Stage 1: check staging_status.locked in workspace-manifest.json
      → if locked: EXIT with queue message ("Staging locked. Re-run when clear.")
      → if unlocked: proceed
  → Stage 2: recursive DAG walk from current repo upward
      → for each dependent in topologicalOrder: checkout feat/X, run QG
      → all must pass before continuing
  → Stage 3: merge feat/X → staging for each dependent (topological order)
      → PR created targeting staging for each repo
  → On staging push: version-bump.yml triggers
      → pre-1.0.0 rule: feat!: bumps MINOR (0.1.0 → 0.2.0), never crosses to 1.0.0
      → dispatches version-bump to PM with branch: staging
  → PM receives dispatch, updates staging_versions map
      → sets staging_status.locked = true
      → PM dispatches dependency-update to direct dependents of the changed repo
          → dependents that actually depend on it create branch + PR → staging
          → dependents that do NOT depend on it: not touched
  → SIT (system-integration-tests) receives the dependency-update last
      → SIT runs smoke tests: contract alignment, schema validation, mock integration
      → If SIT passes: dispatches staging-validated to PM
  → PM receives staging-validated:
      → runs staging-to-main.yml
      → merges staging → main in topological order
      → promotes staging_versions → versions in manifest
      → sets staging_status.locked = false
      → next quickmerge --to-staging unblocked
```

---

## Selective Cascade: Why Not All 60 Repos

The dispatch chain is **selective** — based on actual dependency edges, not tier level.

When a repo bumps its version:

1. PM's `update-repo-version.yml` reads `workspace-manifest.json`
2. It finds every repo whose `dependencies[]` list contains the bumped repo
3. It dispatches `dependency-update` **only to those direct dependents**
4. Each direct dependent updates its constraint, optionally bumps its own version
5. If a dependent bumps its version → it dispatches back to PM → PM finds ITS direct dependents → cascade continues

Example: `execution-algo-library` (T2) bumps with `fix:`:

- PM finds dependents of `execution-algo-library`: e.g. `execution-service`, `strategy-service`
- Only those two get `dependency-update` dispatched
- `market-tick-data-service` (which doesn't import execution-algo-library) is NOT touched
- The cascade never reaches repos that don't import anything in the changed chain

Example: `unified-events-interface` (T0) bumps with `feat!:`:

- Nearly every repo depends on T0 (UEI)
- PM dispatches to all direct dependents of UEI
- Each of those may bump and cascade to their dependents
- Full DAG traversal, but still only along actual dependency edges
- `strategy-ui` (no Python dep on UEI) is skipped

**The workspace-manifest.json dependency graph IS the cascade topology.**

---

## PM's Role in the Cascade

PM (`unified-trading-pm`) is a **management repo**, not a library. Repos do not import PM. When PM's version bumps, it
does NOT trigger cascades to service repos.

PM's version is bumped:

- On every `repository_dispatch` received: PM bumps its own patch (manifest bookkeeping)
- On PM's own code changes: PM runs quickmerge → its own version-bump.yml bumps normally

PM's version in `workspace-manifest.json` tracks "the manifest changed this many times". It is NOT a semantic signal
about workspace stability — that is `staging_status.locked`.

---

## Stability Criteria: When Is a Repo "Stable"?

A repo is stable (`1.0.0+`) when ALL of the following are true:

1. All plan items for that repo are complete (check `unified-trading-pm/plans/active/`)
2. The repo passes full quickmerge on main (all 5 stages, no shortcuts)
3. All repos that depend on it are also stable (or have declared compatibility)
4. The repo's staging branch has been merged to main via the staging-to-main flow
5. `workspace-manifest.json versions[repo]` shows `1.0.0+` (GitHub Action bumped it)

**Never manually set 1.0.0.** The GitHub Action bumps it automatically. If the manifest still shows `0.x.x` after a
merge, the PR did not land — investigate.

**Pre-1.0.0 rule:** While at `0.x.x`:

- `fix:` → patch bump (0.1.0 → 0.1.1)
- `feat:` → minor bump (0.1.0 → 0.2.0)
- `feat!:` / `BREAKING CHANGE:` → minor bump (0.1.0 → 0.2.0) — never crosses to 1.0.0
- `1.0.0` requires manual plan-completion gate + is set by the first post-stable quickmerge

**Downstream stability:** A repo cannot be declared stable if its dependencies are `0.x.x`. The cascading convergence
ensures this: if dep is `0.x.x`, the constraint `>=0.N.0,<1.0.0` is compatible but signals pre-stability. Track this in
the SVG diagram (node colors).

---

## Staging Lock Mechanism

`workspace-manifest.json` contains:

```json
"staging_status": {
  "locked": false,
  "locked_since": null,
  "locked_reason": null,
  "lock_version": null
}
```

- `locked = true`: set when a breaking change cascade enters staging (SIT running or cascade pending)
- New `--to-staging` quickmerge attempts while locked → EXIT with queue message (not hard fail)
- Non-breaking `fix:`/`feat:` quickmerge to main → NOT blocked by staging lock
- Lock is cleared by PM's `staging-to-main.yml` after SIT validates staging
- SVG diagram (`scripts/manifest/generate_workspace_dag.py`) shows locked state visually

---

## GHA Workflow Map

| Workflow                              | Location  | Trigger                                  | Purpose                                                                     |
| ------------------------------------- | --------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `version-bump.yml`                    | each repo | push to main (or staging)                | Parse commit, bump version, dispatch to PM                                  |
| `update-repo-version.yml`             | PM        | `repository_dispatch: version-bump`      | Update manifest, bump PM patch, cascade dep-update                          |
| `update-dependency-version.yml`       | each repo | `repository_dispatch: dependency-update` | Pin new constraint; MAJOR → PR to staging; MINOR/PATCH → direct commit      |
| `quality-gates.yml`                   | each repo | push, PR                                 | Run full quality gate suite                                                 |
| `staging-to-main.yml`                 | PM        | `repository_dispatch: staging-validated` | Merge staging → main in topological order, promote versions, unlock staging |
| `workspace-quickmerge-validation.yml` | PM        | schedule (every 6h)                      | Canary: clone T0-T2 repos, verify quickmerge passes                         |

---

## Manifest State Fields

| Field                          | Section   | Meaning                                                        |
| ------------------------------ | --------- | -------------------------------------------------------------- |
| `versions`                     | top-level | Current stable versions on main                                |
| `staging_versions`             | top-level | Versions currently on staging (converging)                     |
| `staging_status.locked`        | top-level | True when cascade/SIT running                                  |
| `repositories[R].dependencies` | per-repo  | Actual dependency edges (used for cascade routing)             |
| `topologicalOrder`             | top-level | Tier order for cascade sequencing (T0 first)                   |
| `versions_policy`              | top-level | Rules: GHA-only bumps, pre-stable convention, stable threshold |

---

## Quickmerge Flag Reference

| Flag                | When to use                                            |
| ------------------- | ------------------------------------------------------ |
| (none)              | `fix:`/`feat:`/`chore:` → PR to main                   |
| `--to-staging`      | `feat!:`/`BREAKING CHANGE:` → cascade through staging  |
| `--no-pr`           | QG only on feat/_ branch (auto-added when on `feat/_`) |
| `--dep-branch NAME` | Force dep cascade on a named branch (feature mode)     |
| `--quick`           | Skip act simulation (faster, less safe)                |
| `--unit-only`       | Lint + type + unit only (no integration tests)         |

**Mutual exclusion:** `--branch NAME` + `--to-staging` → hard fail with clear message.

**Branch auto-derivation (--to-staging):** dep-branch is auto-derived from current git branch name. No need to repeat
it. `--to-staging` on `feat/my-feature` cascades as `feat/my-feature` across all dep repos.

---

## Troubleshooting

| Symptom                                     | Cause                              | Fix                                                                            |
| ------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `--to-staging` exits "Staging locked"       | SIT running or cascade pending     | Wait for staging to clear (watch PM GHA), then re-run                          |
| Manifest shows old version after merge      | PR didn't land                     | Check PM's `update-repo-version.yml` run log                                   |
| Dep-update creates PR but QG fails          | Breaking change broke downstream   | Fix downstream, re-run quickmerge on that repo                                 |
| `staging_versions` diverges from `versions` | Cascade in-flight                  | Normal — resolves when SIT passes                                              |
| version-bump shows 1.0.0 on 0.x.x repo      | Pre-1.0.0 guard missing            | Roll out fixed template via `rollout-version-bump-workflow.py`                 |
| Multiple PM dispatch race                   | Concurrent version-bump dispatches | `concurrency: manifest-update` guard in `update-repo-version.yml` handles this |
