# Version Cascade Flow

**SSOT:** `unified-trading-pm/docs/repo-management/version-cascade-flow.md`

This file is a codex mirror. The authoritative version with full detail lives in PM docs above. Read that file first.
This entry exists so the codex SSOT index can reference it and agents can discover the flow from within codex search.

---

## Summary

The version cascade is the automated chain that keeps `workspace-manifest.json` consistent after any repo merges a
change to main (or staging). It is **selective** — only repos that actually import the changed repo receive a
`dependency-update` dispatch. Most changes affect fewer than 10 of the 62 repos in the workspace.

## Three-Tier Model

```
feat/*    → QG only, no PR (feature iteration)
staging   → convergence zone; breaking changes + SIT validation
main      → always stable; only updated after SIT passes
```

- **Hotfix path** (`fix:`, `feat:`, `chore:`): PR goes directly to main. No staging needed.
- **Breaking change path** (`feat!:`, `BREAKING CHANGE:`): MUST use `--to-staging`. Cascade through staging → SIT
  validates → staging-to-main merges.

## Selective Cascade Logic

When repo R bumps version:

1. PM finds repos whose `dependencies[]` list includes R
2. PM dispatches `dependency-update` **only to those direct dependents**
3. Each dependent updates constraint; if it then bumps → its dependents cascade next
4. Repos with no path to R in the dependency graph are never touched

This means: a T2 library change cascades to its T3/T4 dependents only — not to all 62 repos.

## Stability Definition

A repo reaches `1.0.0` when:

- All plan items done
- Passes full quickmerge on main
- All its dependencies are also stable (`1.0.0+`)
- GitHub Action (not a human) sets the version

Pre-1.0.0 rule: `feat!:` on a `0.x.x` repo bumps **minor**, not major. Never auto-crosses to `1.0.0`.

## GHA Workflows

| Workflow                                    | Trigger                                | Purpose                             |
| ------------------------------------------- | -------------------------------------- | ----------------------------------- |
| `version-bump.yml` (each repo)              | push to main/staging                   | Bump + dispatch to PM               |
| `update-repo-version.yml` (PM)              | repository_dispatch: version-bump      | Update manifest, cascade dep-update |
| `update-dependency-version.yml` (each repo) | repository_dispatch: dependency-update | Pin constraint; MAJOR → staging PR  |
| `staging-to-main.yml` (PM)                  | repository_dispatch: staging-validated | Merge staging → main                |

## Version Alignment & Drift Protection

Three layers prevent stale versions from entering the pipeline:

1. **Pre-commit** (`check-branch-drift.sh`): Blocks commit if local branch is behind origin. Instant, no network call
   for version check. Override: `SKIP_BRANCH_DRIFT=1` (human-only, agents banned).
2. **Quality gates** (`version-alignment-gate.sh`): Checks self + dependency versions vs remote PM manifest on
   staging/main. One fetch, ~3s. Blocks QG on drift. Override: `--skip-version-alignment` (human-only, agents banned).
3. **Admin force-sync** (safety gate 3): Reads all repos' versions from remote manifest. Blocks if remote has bumps your
   local doesn't have. Override: `--force-version-override` (human-only, agents banned).
4. **Quickmerge stage 1.6**: Dependency version canary. Warning only (does not block). Alerts before PR creation.

All override flags are **human-only** — agents MUST NOT use them. If QG blocks on version drift, pull latest and
re-align.

---

## Workflow Template Management

Per-repo GHA workflows are canonical templates in PM — never edit per-repo copies directly.

- **Templates SSOT:** `unified-trading-pm/scripts/workflow-templates/`
- **Rollout (generic):** `bash unified-trading-pm/scripts/propagation/rollout-workflow-templates.sh`
- **Rollout (semver-agent):** `bash unified-trading-pm/scripts/propagation/rollout-semver-agent.sh`
- **Rollout (pre-commit):** `bash unified-trading-pm/scripts/propagation/rollout-pre-commit-configs.sh`

**Pattern:** Webhook-triggered workflows (`issue_comment`, `pull_request`, `repository_dispatch`) use flat template
copies because private repos block cross-repo `workflow_call`. Only `workflow_dispatch` supports reusable forwarding.

**Semver agent** uses `__REPO_NAME__` / `__SOURCE_DIR__` placeholders — rollout script substitutes per-repo values.

**Rule:** Never edit per-repo workflow copies. Edit the PM template, run the rollout script, commit the generated
copies.

---

## References

- **Full doc:** `unified-trading-pm/docs/repo-management/version-cascade-flow.md`
- **Local dev flow:** `unified-trading-pm/docs/repo-management/CI-CD-FLOW.md`
- **Breaking change commits:** `cursor-rules/dependencies/breaking-change-major-version-protocol.mdc`
- **Quickmerge usage:** `cursor-rules/core/always-use-quickmerge.mdc`
- **Version policy:** `workspace-manifest.json` → `versions_policy`
