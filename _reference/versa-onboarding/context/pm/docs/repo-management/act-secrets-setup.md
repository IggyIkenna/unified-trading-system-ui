# Act Secrets Setup — SSOT

**SSOT:** This document. Codex pointer: `00-SSOT-INDEX.md` → Act secrets.

## Why Act Needs GH_PAT

Quickmerge runs **act** (nektos/act) to simulate GitHub Actions locally before creating a PR. Many workflows (e.g.
`quality-gates`) clone **sibling repos** (e.g. `unified-trading-codex`) using `secrets.GH_PAT`. Without a valid token,
act cannot clone those repos and the simulation fails.

**If act fails:** Quickmerge now **aborts** (does not continue). You must fix the secrets before quickmerge can
complete.

## Setup (One-Time)

1. **Generate the secrets file:**

   ```bash
   bash unified-trading-pm/scripts/workspace/generate-act-secrets.sh
   ```

2. **Edit `.act-secrets` at workspace root** (e.g. `unified-trading-system-repos/.act-secrets`):

   ```
   GH_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   # Optional: GCP project for workspace scripts (act, dev, agents). Source before running scripts that need it.
   # GCP_PROJECT_ID=your-project-id
   ```

   Create a token at https://github.com/settings/tokens with `repo` scope.

3. **Re-run quickmerge** — act will use the secrets and pass.

## File Location

- **Path:** `<workspace-root>/.act-secrets`
- **Same for everyone:** Relative to workspace root; not committed (gitignored).
- **Fallback:** `~/.secrets` (legacy) if `.act-secrets` is missing.

## When Act Fails

Quickmerge prints:

```
❌ Act simulation FAILED — quickmerge aborted

Act needs GH_PAT to clone sibling repos (e.g. unified-trading-codex). Without it, CI simulation cannot run.

Fix:
  1. bash unified-trading-pm/scripts/workspace/generate-act-secrets.sh
  2. Edit <workspace-root>/.act-secrets and add:  GH_PAT=ghp_xxxxxxxxxxxx
  3. Re-run quickmerge

SSOT: unified-trading-pm/docs/repo-management/act-secrets-setup.md
```

## Skipping Act

Use `--quick` to skip act (e.g. when iterating on lint/tests only):

```bash
bash scripts/quickmerge.sh "feat: X" --quick
```

CI will still run on push; act is a local pre-check.

## References

- **Generate script:** `unified-trading-pm/scripts/workspace/generate-act-secrets.sh`
- **Quickmerge:** `unified-trading-pm/scripts/quickmerge.sh` (Stage 4)
- **CI-CD flow:** `unified-trading-pm/docs/repo-management/CI-CD-FLOW.md`
