# Quickmerge Architecture

Quickmerge is the standard commit workflow for all service repos. It runs all quality checks automatically before
creating a PR.

## Pipeline Stages

1. **Dependency Validation** (10s) — Check dependencies vs main branch; cascade if different
2. **Pre-Flight Audit** (15s) — Codex compliance check, auto-fix violations
3. **Local Quality Gates** (30s) — Docker with ruff==0.15.0, basedpyright, pytest
4. **Act Simulation** (1-2 min) — Exact GitHub Actions simulation with environment-aware project ID
5. **Auto-Fix** (inline) — LLM agent fixes failures, max 3 attempts
6. **Push & PR Creation** (5s) — Automated PR with auto-merge enabled

**Total time:** ~2-5 minutes

## Usage

```bash
# Standard (dependencies match main)
bash scripts/quickmerge.sh "feat: description"

# Differential branching (dependencies differ from main)
bash scripts/quickmerge.sh "feat: description" --dep-branch "my-feature"
```

## Environment Awareness

- Branch builds: `ENVIRONMENT=development` → uses `GCP_PROJECT_ID_DEV`
- Main builds: `ENVIRONMENT=production` → uses `GCP_PROJECT_ID`

## Why Not Standalone Quality Gates

Running `bash scripts/quality-gates.sh` directly skips dependency validation, environment detection, and PR creation.
Always use quickmerge.

See also: `06-coding-standards/quality-gates.md`
