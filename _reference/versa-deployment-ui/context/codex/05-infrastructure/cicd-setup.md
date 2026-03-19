# CI/CD Setup

> **SSOT**: `unified-trading-pm/docs/ci-cd-ssot.md`
>
> That document is the canonical reference for: which scripts own what (QG base scripts, reusable workflows, rollout
> scripts), how to add a dependency correctly (no direct installs), the two-pass quickmerge model, branch model and CI
> triggers, and adding a new repo.

Do not duplicate CI/CD setup steps here. Read the SSOT first.

## Quick Reference

| Task                                   | Where                                                                 |
| -------------------------------------- | --------------------------------------------------------------------- |
| Fix a quality gate check               | `unified-trading-pm/scripts/quality-gates-base/base-service.sh`       |
| Fix a CI workflow step                 | `unified-trading-pm/.github/workflows/python-quality-gates.yml`       |
| Add a dep to a repo                    | `pyproject.toml` → `workspace-manifest.json` → `uv lock` → `uv sync`  |
| Generate a new repo's CI workflow      | `rollout-quality-gates-ci-workflows.py --workflow-call --repo <name>` |
| Re-pin action refs after branch change | Automatic via `rollout-action-ref.yml` on manifest push               |

See also: `05-infrastructure/new-repo-setup.md` — full new-repo checklist. See also: `05-infrastructure/README.md` —
infrastructure overview.
