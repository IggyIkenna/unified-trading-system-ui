# Contributing to Instruments Service

## Development Workflow

### Session Start

Before starting work, sync with main:

```bash
git checkout main
git pull origin main
```

Check for any conflicts with local uncommitted work. If conflicts exist, resolve them or ask for guidance.

### Making Changes

**ALWAYS follow this sequence**:

1. **Make code changes**
2. **Write unit tests** for your changes
3. **Run tests locally**:
   ```bash
   python -m pytest tests/unit/test_your_change.py -v
   ```
4. **Verify all tests pass**
5. **ONLY THEN commit and push**

### Committing Changes: Enhanced Quickmerge

Use the enhanced quickmerge script:

```bash
bash scripts/quickmerge.sh "descriptive commit message"
```

**What quickmerge does**:

1. Syncs with latest main (pulls updates)
2. Creates timestamped branch
3. Commits all changes (pre-commit hooks run: ruff format, linting)
4. Pushes branch to GitHub
5. Creates PR with auto-merge enabled
6. **Stays on PR branch** (you can continue working)

**After quickmerge**:

- You're on the PR branch (e.g., `auto/20260209-170726-29618`)
- PR is waiting for CI to pass (~3-5 minutes)
- You can continue making changes on this branch
- When CI passes, PR auto-merges to main

### Multiple Quickmerges in One Session

When you're ready to submit more changes:

```bash
# Make new changes + tests
# Run tests locally
bash scripts/quickmerge.sh "next set of changes"
```

Quickmerge will:

- Pull latest main (including your previous PR if it merged)
- Create NEW branch from updated main
- Include your current changes
- Submit new PR
- Keep you on the new branch

### End of Session

Manually sync with main to verify all PRs merged:

```bash
git checkout main
git pull origin main
gh pr list  # Check if any PRs are still open
```

If a PR failed CI:

```bash
git checkout auto/timestamp  # The failed PR branch
# Fix issues
git add -A && git commit -m "fix: address CI failures"
git push  # Updates the existing PR
```

### Critical Rules

**NEVER**:

- ❌ Run quickmerge without tests
- ❌ Run quickmerge with failing tests
- ❌ Push directly to main (`git push origin main` will be rejected)
- ❌ Use `--no-verify` to skip hooks
- ❌ Work on main branch (always work on PR branches)

**ALWAYS**:

- ✅ Write tests BEFORE quickmerge
- ✅ Run tests locally BEFORE quickmerge
- ✅ Let pre-commit hooks run (ruff format/check)
- ✅ Wait for CI to pass before depending on merged code

### Test Requirements

Every code change MUST include tests:

**For new features**:

- Unit tests covering happy path
- Unit tests covering edge cases (holidays, UTC spanning, etc.)
- Integration tests if feature touches multiple components

**For bug fixes**:

- Unit test reproducing the bug
- Unit test verifying the fix

**For refactors**:

- Ensure existing tests still pass
- Add tests for any new behavior

### Pre-Commit Hooks

Hooks run automatically on commit:

- `ruff check --fix` - Linting with auto-fix
- `ruff format` - Code formatting
- `trim trailing whitespace`
- `fix end of files`
- `check yaml/toml`

If hooks modify files, the commit aborts. Review changes and commit again.

### Quality Gates (CI)

GitHub Actions runs on every PR:

1. Ruff version check (must match local)
2. Linting (`ruff check`)
3. Formatting (`ruff format --check`)
4. Unit tests (`pytest tests/unit/`)
5. Integration tests (if present)

PRs only auto-merge if ALL checks pass.

### Branch Protection

Main branch has protection enabled:

- Requires pull request
- Requires quality gates to pass
- No force push
- No direct push

This is why quickmerge is required.

### Working with Multiple Agents/Sessions

**Problem**: If multiple Cursor sessions work on same repo simultaneously, changes can conflict.

**Solution**:

- Each session works on its own PR branch
- Quickmerge handles syncing with main
- If conflict detected, quickmerge stops and alerts you
- Resolve conflicts, then retry quickmerge

### Troubleshooting

**"No changes to commit"**:

- You already ran quickmerge recently
- No new changes since last commit

**"Merge conflict detected"**:

- Someone else merged to main
- Your changes conflict with theirs
- Resolve conflicts in files marked with `<<<<<<<`
- Run `git add -A` then retry quickmerge

**"PR failed CI"**:

```bash
gh pr view auto/timestamp  # Check failure details
gh pr checks auto/timestamp  # See which check failed
git checkout auto/timestamp  # Fix on that branch
# Fix issue
git add -A && git commit -m "fix: CI failure"
git push  # Updates existing PR, re-runs CI
```

**"Lost changes after quickmerge"**:

- Changes are NOT lost
- They're on the PR branch (not main)
- Check: `git branch -a | grep auto/`
- Checkout the branch: `git checkout auto/timestamp`

### File Locations

- Source code: `instruments_service/`
- Tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Config: `instruments_service/config.py`
- Scripts: `scripts/`
- Documentation: `docs/`

### For More Details

See workspace-level documentation:

- `.cursorrules` - Global development rules
- `deployment-service/docs/` - Architecture docs
- `deployment-service/configs/checklist.template.yaml` - Production checklist
