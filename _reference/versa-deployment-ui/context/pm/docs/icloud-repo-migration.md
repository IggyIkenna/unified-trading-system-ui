# iCloud Repo Migration — Agent Prompt

Use this prompt to migrate a git repo from iCloud Drive to local `~/Code` with clean commits. Run per-repo via agents.

---

## Quick Start

```bash
REPO_PATH="/path/to/your/repo"   # <-- SET THIS

cd "$REPO_PATH"
ROOT=$(git rev-parse --show-toplevel)
git checkout -B main
git status -sb

# Ensure .gitignore has required patterns (see Ignore Patterns Reference)
# Ensure .cursorignore has required patterns (see Ignore Patterns Reference)
# Ensure workspace root .cursorignore exists (see Workspace Root .cursorignore)

# Remove tracked junk if any:
git ls-files -z -- ".venv/*" "venv/*" "__pycache__/*" "node_modules/*" ".next/*" "dist/*" "build/*" ".turbo/*" ".venv-workspace/*" ".pytest_cache/*" ".mypy_cache/*" ".ruff_cache/*" "htmlcov/*" | wc -c
# If non-zero: git rm -r --cached --ignore-unmatch .venv venv __pycache__ node_modules .next dist build .turbo .venv-workspace .pytest_cache .mypy_cache .ruff_cache htmlcov

git add .gitignore .cursorignore && git add -A
git diff --cached --stat   # sanity check
git commit -m "WIP: savepoint (pre-move from iCloud)" --no-verify
git push origin main

# Clone to ~/Code:
REPO_NAME=$(basename "$ROOT")
REMOTE_URL=$(git remote get-url origin)
DST="$HOME/Code/unified-trading-system-repos/$REPO_NAME"
mkdir -p "$(dirname "$DST")"
rm -rf "$DST"
git clone "$REMOTE_URL" "$DST"
cd "$DST" && git checkout main && git rev-parse HEAD
```

---

## Context

- Repo lives on iCloud Drive (slow).
- Goal: commit only real source/config, push to remote, then clone to `~/Code` for fast local work.
- Avoid full recursive scans (`find .`, `du` on whole repo).
- Use targeted checks only.

---

## Rules

- Avoid full recursive scans. Do NOT run `find .` or `du` on the whole repo.
- Use targeted checks only.
- Bypass hooks with `--no-verify` when committing.
- DO push at the end (we use remote as the fast copy mechanism).

---

## Parallel Agent Execution (Batch Migrations)

When migrating multiple repos (e.g. 61 repos), **use parallel agents**:

- Launch 4–8 agents in parallel, each with `REPO_PATH` set to a different repo
- Prepend to each agent prompt: `REPO_PATH=/path/to/repo-X. cd $REPO_PATH. Then execute steps 1–9.`
- Different repos = zero file conflict risk; always safe to parallelize
- Per workspace rules: cross-repo operations are ideal for parallel agents (max 4 recommended, up to 8 for migration)

**When running batch migration (61 repos):** Ensure workspace root `.cursorignore` exists at
`~/Code/unified-trading-system-repos/` before or after the first clone.

---

## Remote Cleanliness (CRITICAL)

The **remote must be clean** after push. Ensure:

- **All local changes committed:** `.gitignore`, `.cursorignore`, and junk removal (`git rm --cached`) must all be in
  the commit before push
- **Deletions propagate to remote:** When we `git rm -r --cached` junk and commit, the push updates remote — those files
  are removed from remote too
- **Nothing in .gitignore should exist on remote:** After push, remote must not contain `.venv/`, `venv/`,
  `node_modules/`, `__pycache__/`, etc.
- **Single commit:** One commit with: (1) .gitignore/.cursorignore updates, (2) junk removal from index. Push once.
  Remote = clean.

---

## Steps

1. **Identify repo root + force main at current HEAD:**
   - `ROOT=$(git rev-parse --show-toplevel)`
   - `git checkout -B main`
   - `git status -sb`

2. **Ensure `.gitignore` exists (repo-level)** — append if missing (see
   [Ignore Patterns Reference](#ignore-patterns-reference)):
   - Python: `.venv/`, `venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.cache/`
   - Node/UI: `node_modules/`, `.next/`, `dist/`, `build/`, `.turbo/`
   - Coverage: `coverage/`, `.nyc_output/`, `htmlcov/`, `.coverage`
   - OS: `.DS_Store`
   - Workspace: `.venv-workspace/`
   - Security (BLOCKING): `*credentials*.json`, `*-service-account.json`, etc.

3. **Ensure `.cursorignore` exists (repo-level)** — create or append (see
   [Ignore Patterns Reference](#ignore-patterns-reference)):
   - Use glob patterns: `**/.venv/**`, `**/node_modules/**`, etc.

4. **Ensure `.cursorignore` exists (workspace root)** — if migrating into existing workspace
   (`~/Code/unified-trading-system-repos/`):
   - Workspace root has no `.gitignore` (it is not a git repo)
   - Create or update workspace root `.cursorignore` with patterns from
     [Workspace Root .cursorignore](#workspace-root-cursorignore)

5. **Detect tracked junk** (no filesystem scan):

   ```bash
   git ls-files -z -- ".venv/*" "venv/*" "__pycache__/*" "node_modules/*" ".next/*" "dist/*" "build/*" ".turbo/*" ".venv-workspace/*" ".pytest_cache/*" ".mypy_cache/*" ".ruff_cache/*" "htmlcov/*" | wc -c
   ```

   If non-zero, remove from index (cached only, not disk):

   ```bash
   git rm -r --cached --ignore-unmatch .venv venv __pycache__ node_modules .next dist build .turbo .venv-workspace .pytest_cache .mypy_cache .ruff_cache htmlcov
   ```

6. **Stage in safe order:**

   ```bash
   git add .gitignore .cursorignore
   git add -A
   ```

7. **Sanity check before commit:**

   ```bash
   git status -sb
   git diff --cached --stat
   ```

   If the stat looks huge/unexpected (e.g. millions of lines from .venv), STOP and report.

8. **Commit locally to main:**

   ```bash
   git commit -m "WIP: savepoint (pre-move from iCloud)" --no-verify
   ```

9. **Push to remote:**

   ```bash
   git push origin main
   ```

10. **Clone to ~/Code** (run from local machine, not iCloud):

    ```bash
    REPO_NAME=$(basename "$ROOT")
    REMOTE_URL=$(git remote get-url origin)
    DST="$HOME/Code/unified-trading-system-repos/$REPO_NAME"
    mkdir -p "$(dirname "$DST")"
    rm -rf "$DST"
    git clone "$REMOTE_URL" "$DST"
    cd "$DST" && git checkout main && git rev-parse HEAD
    ```

11. **Verify remote is clean:** Fresh clone must not contain `.venv/`, `node_modules/`, `__pycache__/`, etc. — if
    present, junk was not properly removed and pushed.

---

## Ignore Patterns Reference

### .gitignore (repo-level) — append if missing

```
# Python
.venv/
venv/
__pycache__/
*.pyc
.pytest_cache/
.mypy_cache/
.ruff_cache/
.cache/

# Node / UI
node_modules/
.next/
dist/
build/
.turbo/

# Coverage
coverage/
.nyc_output/
htmlcov/
.coverage

# OS
.DS_Store

# Workspace
.venv-workspace/

# Security (BLOCKING per quality-gates)
*credentials*.json
*-service-account.json
service-account*.json
*secret*.json
central-element-323112-*.json
.env
.env.local
.env.*.local
**/secrets/
**/credentials/

# Cursor (track .cursorignore, ignore indexing artifacts)
.cursorindexingignore
```

### .cursorignore (repo-level) — use glob patterns for Cursor

```
**/.venv/**
**/venv/**
**/node_modules/**
**/.next/**
**/dist/**
**/build/**
**/.turbo/**
**/__pycache__/**
**/.cache/**
**/.venv-workspace/**
**/.pytest_cache/**
**/.mypy_cache/**
**/.ruff_cache/**
**/htmlcov/**
**/coverage/**
**/*credentials*.json
**/*.parquet
**/*.csv
**/playwright-report/**
**/test-results/**
**/*.db
**/*.sqlite
**/*.sqlite3
**/.DS_Store
```

### Workspace Root .cursorignore

The workspace root (`~/Code/unified-trading-system-repos/`) is not a git repo — only `.cursorignore` matters there. For
a **new** workspace root, either:

- Copy the existing workspace `.cursorignore` from the current iCloud workspace, or
- Use this simpler deny-list if the workspace is minimal:

```
**/.venv/**
**/venv/**
**/node_modules/**
**/.next/**
**/dist/**
**/build/**
**/__pycache__/**
**/.venv-workspace/**
**/*credentials*.json
**/*.parquet
**/*.csv
**/.DS_Store
```

---

## Variations

### If remote doesn't exist or push fails

Fallback: use **git bundle** (create on iCloud, copy single file, clone from bundle):

```bash
# In iCloud repo
git bundle create /tmp/REPO_NAME.bundle --all

# Copy /tmp/REPO_NAME.bundle to local (manual or cp)
# Then:
git clone /tmp/REPO_NAME.bundle "$HOME/Code/unified-trading-system-repos/REPO_NAME"
```

### If repo has no remote

Add remote first:

```bash
git remote add origin <URL>
git push -u origin main
```

### Batch for 61 repos

**Option A: One agent per repo**

- Launch 4–8 agents in parallel, each with `REPO_PATH` set to a different repo.
- Prepend to prompt: `REPO_PATH=/path/to/repo-X. cd $REPO_PATH. Then execute steps 1–11.`

**Option B: Single agent with loop**

- Provide list of repo paths.
- Agent loops: for each path, cd there, run steps 1–10 (through push).
- Step 11 (clone): run once at end, looping over remote URLs from each repo.

**Option C: Clone-only batch (after all pushes done)**

```bash
# After all 61 repos have been pushed from iCloud
BASE="$HOME/Code/unified-trading-system-repos"
mkdir -p "$BASE"
# For each repo, if you have remote URLs:
while read url; do
  name=$(basename "$url" .git)
  git clone "$url" "$BASE/$name"
done < repo_urls.txt
```

---

## Output Required

- Current branch + commit hash after push
- Whether tracked junk was found and removed (step 5)
- Cached diff stat lines (insertions/deletions)
- Push success/failure
- Clone destination path
- **Remote clean:** Confirmation that fresh clone has no junk (`.venv/`, `node_modules/`, etc.)
- **Batch:** If parallel agents used, report per-repo status (success/fail, commit hash)

---

## Reference: unified-api-contracts

- Branch: main
- Commit: 7a18e01
- Tracked junk: none found
- Push: success (2768b20..7a18e01 main -> main)
- Remote: github.com:IggyIkenna/unified-api-contracts.git
