# Sync-to-Main Flow

**Full CI/CD flow SSOT:** `docs/repo-management/CI-CD-FLOW.md` (alignment → setup → sync → conflict resolution).

Sync all workspace repos to `main` safely via quickmerge (PR + auto-merge). Replaces direct `git push origin main`,
which fails under branch protection.

## Overview

`sync-all-to-main.sh` processes repos in **dependency order** (from `workspace-manifest.json` topologicalOrder) so
dependencies are merged before dependents. Each repo is synced via **quickmerge**, which creates a PR, runs quality
gates, and enables auto-merge.

## Flow (per repo)

1. **Ensure .gitignore** — Add heavy-file exclusions (.coverage, .venv, node_modules, etc.) if missing.
2. **Stage changes** — `git add -A`.
3. **Fetch and merge** — `git fetch origin main && git merge origin/main`.
   - If **merge conflicts** → abort, FAIL, report. Resolve manually and re-run.
4. **Convert commits to staged** — If local has commits ahead of origin, `git reset --soft origin/main` so quickmerge
   can commit them on a branch.
5. **Run quickmerge** — Creates branch from origin/main, commits changes, pushes, creates PR, enables auto-merge.
   - If **quickmerge fails** (quality gates, PR creation, or auto-merge) → FAIL, report.
6. **Skip if no changes** — If nothing to commit, OK (no-op).

## Prerequisites

- **gh CLI** installed and authenticated (`gh auth login`).
- **Auto-merge** enabled on each repo (Settings → General → Allow auto-merge).
- **quickmerge.sh** in each repo's `scripts/` (or PM's copy used as fallback).

## Usage

```bash
# From workspace root or unified-trading-pm/scripts/repo-management/
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh

# When path deps have local changes (avoids DEPENDENCY CONFLICT DETECTED)
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --dep-branch "chore/sync-all"

# Dry run (list repos, no changes)
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --dry-run

# Limit to first N repos
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --limit 10

# Sync only one repo

# Sync only repos matching a glob (e.g. unified-*, *-service)
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --filter "unified-*" --dep-branch "chore/sync-all"
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --filter "*-service"
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --repo execution-service
```

**`--filter PATTERN`** — Sync only repos whose names match the glob (e.g. `unified-*`, `*-service`, `execution-*`).
Preserves dependency order among matches.

**`--dep-branch NAME`** — Pass to quickmerge when path dependencies (unified-trading-library, unified-config-interface,
unified-events-interface, etc.) have local changes that differ from origin/main. Quickmerge will cascade changes to that
branch in dependency order. Use when sync fails with `DEPENDENCY CONFLICT DETECTED`.

## Failure Modes

| Failure                           | Cause                                                         | Resolution                                                           |
| --------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `DEPENDENCY CONFLICT DETECTED`    | Path deps (unified-\*-interface, etc.) have local changes     | Re-run with `--dep-branch "chore/sync-all"` (or any branch name)     |
| `merge conflict with origin/main` | Remote has diverged; local and remote both changed same files | Resolve conflicts manually: `cd <repo>`, fix, commit, re-run sync    |
| `fetch failed`                    | Network or auth issue                                         | Check `gh auth status`, retry                                        |
| `quickmerge failed`               | Quality gates failed, or PR creation/auto-merge failed        | Run `bash scripts/quality-gates.sh` locally, fix issues, re-run sync |
| `no quickmerge.sh`                | Repo missing scripts/quickmerge.sh                            | Copy from PM SSOT or add repo to sync exclusion                      |

## Output

```
Sync to main: 58 repos (dependency order, quickmerge flow)

  OK unified-trading-pm (no changes)
  OK unified-trading-codex
  FAIL execution-service — quickmerge failed

Done: 56 OK, 1 FAIL, 1 skipped
Failed repos:
  - execution-service: quickmerge failed (quality gates or PR auto-merge)

Resolve: fix conflicts manually, or run quality gates locally, then re-run.
```

## Related

- **Full CI/CD flow (SSOT)** — `docs/repo-management/CI-CD-FLOW.md`
- **quickmerge.sh** — SSOT: `unified-trading-pm/scripts/quickmerge.sh`
- **workspace-manifest.json** — topologicalOrder defines dependency order
- **Cursor rules** — `always-use-quickmerge.mdc`, `never-revert-local-changes.mdc`

## Precursor: Run All Quality Gates

Before running sync, you can validate all repos with `run-all-quality-gates.sh`:

```bash
# From workspace root
bash unified-trading-pm/scripts/repo-management/run-all-quality-gates.sh
```

This runs quality gates (lint, typecheck, unit tests) in dependency order for every repo. It does NOT push. Use it to
surface failures before attempting sync/quickmerge.

See: `scripts/repo-management/run-all-quality-gates.sh`
