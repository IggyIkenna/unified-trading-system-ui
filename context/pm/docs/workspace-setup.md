# Workspace Setup Guide

Single source of truth for setting up the unified trading system workspace.

---

## Prerequisites

### Before running bootstrap (must be done manually)

| Prerequisite           | Why                          | How                                                                                                                                    |
| ---------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub access**      | Clone ~60 private repos      | SSH: `ssh-keygen` + add to GitHub account, verify with `ssh -T git@github.com`<br>HTTPS: `gh auth login` (installs credential helpers) |
| **bash 4+** or **zsh** | Script execution             | macOS ships zsh; Linux usually has bash 4+                                                                                             |
| **macOS or Linux**     | Homebrew/apt for system deps | M-series and Intel Macs both supported                                                                                                 |

### After bootstrap (separate one-time setup — not automated)

| Prerequisite       | Why                                       | How                                                                                         |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| **GCP auth**       | Service GCP calls (BigQuery, GCS, PubSub) | `gcloud auth application-default login`                                                     |
| **act secrets**    | Run GitHub Actions locally via `act`      | Create `~/.act-secrets` from the template in `unified-trading-pm/docs/act-secrets-template` |
| **Cursor account** | IDE licence                               | Sign up at cursor.com — free tier works for development                                     |

### Handled automatically by bootstrap

- **Python 3.13** — installed via Homebrew (macOS) or apt (Linux) in Phase 1
- **uv, ripgrep, jq** — same
- **ruff, basedpyright** — installed into `.venv-workspace` in Phase 4

---

## New Machine Setup (end-to-end)

### Step 1: Bootstrap the workspace

Pick a workspace directory. All repos will live side-by-side here. Bootstrap is **self-contained** — no prior clone
required. It clones `unified-trading-pm` first (Phase 0), reads its `workspace-manifest.json`, and sets up everything.

```bash
# Pick ONE of these (or your own location):
#   Mac with iCloud:    ~/Documents/Documents - Mac/repos
#   Mac without iCloud: ~/Documents/repos
#   Linux:              ~/repos

mkdir -p /your/chosen/path/unified-trading-system-repos
cd /your/chosen/path/unified-trading-system-repos

# Single command — no prior clone needed:
bash <(curl -fsSL https://raw.githubusercontent.com/IggyIkenna/unified-trading-pm/main/scripts/workspace/workspace-bootstrap.sh)

# Or if you already have PM cloned:
bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh
```

What it does (7 phases):

| Phase                | What happens                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------- |
| 0. Seed PM           | Clones `unified-trading-pm` first (self-seeding); creates `bootstrap.sh` symlink          |
| 1. System deps       | Installs Python 3.13, uv, ripgrep, jq via Homebrew (macOS) or apt (Linux)                 |
| 2. Clone repos       | Reads `workspace-manifest.json`, fresh-clones all repos (SSH or `--https`)                |
| 3. Version alignment | Runs `run-version-alignment.sh --fix` — syncs dep versions across all repos               |
| 4. Workspace venv    | Creates `.venv-workspace/` with `ruff==0.15.0`, `basedpyright==1.38.2`, editable installs |
| 5. Per-repo setup    | Runs `scripts/setup.sh` in each repo (topological order: T0 first)                        |
| 6. Smoke test        | Verifies `import <package>` works for every Python repo                                   |

Safe to re-run. Skips repos already cloned and deps already installed.

> **Bootstrap vs sync** — `workspace-bootstrap.sh` is a **new machine** command (clone + system deps + venv + per-repo
> setup). For day-to-day venv refresh after version alignment, use `sync-workspace-venv.sh` (see
> [Day-to-Day Venv Sync](#day-to-day-venv-sync) below).

### Step 3: Set up workspace paths and IDE configs

```bash
bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh
```

This script auto-detects your workspace path and:

- Adds `export UNIFIED_TRADING_WORKSPACE_ROOT="/your/path"` to `~/.zshrc` or `~/.bashrc`
- Updates all Cursor `.code-workspace` files with your machine's path
- Creates Claude Code conversation symlinks (so old chats carry over between machines)
- Updates Claude Code permissions in `~/.claude/settings.json`

### Step 4: Set up Cursor rules and plans (symlinks)

```bash
# Symlink rules (edits go directly to git-tracked cursor-rules/)
bash unified-trading-pm/scripts/workspace/setup-cursor-rules-symlink.sh

# Symlink plans (edits go directly to git-tracked plans/cursor-plans/)
bash unified-trading-pm/scripts/workspace/setup-cursor-plans-symlink.sh
```

After this, your workspace looks like:

```
unified-trading-system-repos/           <- open this in Cursor
├── .cursor/
│   ├── rules/ -> unified-trading-pm/cursor-rules/          <- SYMLINK
│   └── plans/ -> unified-trading-pm/plans/cursor-plans/    <- SYMLINK
├── .claude/
│   └── CLAUDE.md                       <- Claude Code project instructions
├── .venv-workspace/                    <- shared venv (python, ruff, basedpyright, all deps)
├── unified-trading-pm/                 <- this repo
│   ├── cursor-rules/                   <- git-tracked rules (symlinked from .cursor/rules/)
│   ├── cursor-configs/                 <- git-tracked workspace configs
│   └── workspace-manifest.json         <- registry of all repos (manifest-driven)
├── unified-trading-codex/
├── instruments-service/
└── ...all other repos from manifest
```

### Step 5: Reload shell and restart IDEs

```bash
source ~/.zshrc   # or ~/.bashrc
```

Close and reopen **both Cursor and Claude Code** (Cmd+Q). This resolves "Invalid Python interpreter" errors in Cursor.

### Step 6: Verify

```bash
# Environment
echo $UNIFIED_TRADING_WORKSPACE_ROOT           # should print your path
which python                                    # .venv-workspace/bin/python
which ruff                                      # .venv-workspace/bin/ruff
which basedpyright                              # .venv-workspace/bin/basedpyright

# Cursor rules symlink works
ls -la .cursor/rules                            # should show -> .../unified-trading-pm/cursor-rules
ls .cursor/rules/*.mdc | wc -l                  # should be ~103

# Plans symlink works
ls -la .cursor/plans                            # should show -> .../unified-trading-pm/plans/cursor-plans

# Quality gates pass on PM repo
cd unified-trading-pm && bash scripts/quality-gates.sh
```

---

## Day-to-Day Venv Sync

Run this after any version alignment or `git pull` on `unified-trading-pm`:

```bash
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh          # refresh (idempotent)
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh --check  # verify only
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh --force  # full recreate
```

This is automatically called at the end of `run-version-alignment.sh --fix`. You only need to call it manually after a
plain `git pull` that bumped dep versions.

**What it does:** Reinstalls all repos as editable into `.venv-workspace` in topological order, and ensures pinned tool
versions (`ruff==0.15.0`, `basedpyright==1.38.2`). Does not touch per-repo `.venv` — those are rebuilt by
`run-all-setup.sh`.

**Why per-repo `.venv` is separate:**

| venv               | Purpose                                       | Rebuilt by                      |
| ------------------ | --------------------------------------------- | ------------------------------- |
| `.venv-workspace`  | IDE IntelliSense, `RUFF_CMD` in QG            | `sync-workspace-venv.sh`        |
| `.venv` (per-repo) | QG Python, basedpyright, pytest — CI-faithful | `run-all-setup.sh` / `setup.sh` |

**`BASEDPYRIGHT_CMD` always resolves from per-repo `.venv`**, never workspace — workspace has the union of all deps
which would mask missing declarations in individual repos' `pyproject.toml` and cause type errors that only appear in
CI. See `unified-trading-codex/06-coding-standards/quality-gates.md § Tool Version Pinning`.

---

## How Rules and Plans Work

Both `.cursor/rules/` and `.cursor/plans/` are **symlinks** into the PM repo:

```
.cursor/rules/ -> unified-trading-pm/cursor-rules/          (symlink)
.cursor/plans/ -> unified-trading-pm/plans/cursor-plans/     (symlink)
```

This means:

- **Edits in `.cursor/rules/` directly modify git-tracked files** in unified-trading-pm
- **No sync scripts needed** — there's no copy to get out of sync
- `**git pull` in unified-trading-pm immediately gives you the team's latest\*\* rules and plans
- **Conflict resolution is standard git** — if two developers edit the same rule, git merge handles it

### Multi-developer workflow

| Scenario                                           | What happens                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| You add a new rule, teammate adds a different rule | Both push via quickmerge. `git pull` gives you both. No conflict. |
| You both edit different lines of the same rule     | Git auto-merges. No conflict.                                     |
| You both edit the same lines of the same rule      | Git merge conflict. Resolve locally, then re-push.                |

---

## Day-to-Day Workflow

### Push your changes

```bash
cd unified-trading-pm
bash scripts/quickmerge.sh "feat: describe your change"
```

Quickmerge runs a 4-stage pipeline:

1. **Stage 1**: Dependency validation
2. **Stage 2**: Pre-flight audit
3. **Stage 3**: Quality gates (ruff + basedpyright + pytest)
4. **Stage 4**: Creates PR with auto-merge enabled

Rule edits are committed directly (no sync step) because `.cursor/rules/` is a symlink.

### Pull team's latest

```bash
cd unified-trading-pm && git pull
# Done — symlinks mean you immediately see the team's changes
```

### Work on any service repo

Each repo has the same quickmerge template:

```bash
cd instruments-service   # or any repo
bash scripts/quickmerge.sh "fix: describe your change"
```

---

## Switching Machines

When you move to a different laptop or the workspace path changes (e.g., iCloud sync):

```bash
# 1. Re-run setup (auto-detects new path)
cd /new/path/unified-trading-system-repos/unified-trading-pm
bash scripts/workspace/setup-workspace-root.sh

# 2. Re-create symlinks
bash scripts/workspace/setup-cursor-rules-symlink.sh
bash scripts/workspace/setup-cursor-plans-symlink.sh

# 3. Reload shell and restart both IDEs
source ~/.zshrc
```

The setup script detects old paths in workspace configs and replaces them with the new path.

---

## What Each Script Does

| Script                          | When to run                | What it does                                       |
| ------------------------------- | -------------------------- | -------------------------------------------------- |
| `workspace-bootstrap.sh`        | New machine (once)         | Clones all repos, installs deps, creates venv      |
| `setup-workspace-root.sh`       | New machine or path change | Sets env var, updates IDE configs                  |
| `setup-cursor-rules-symlink.sh` | New machine (once)         | Symlinks `.cursor/rules/` to `cursor-rules/`       |
| `setup-cursor-plans-symlink.sh` | New machine (once)         | Symlinks `.cursor/plans/` to `plans/cursor-plans/` |
| `quickmerge.sh`                 | To push changes            | Full pipeline: lint + test + PR                    |

---

## Troubleshooting

### "Invalid Python interpreter" in Cursor

1. Check: `ls .venv-workspace/bin/python` — does it exist?
2. If not: `bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh --skip-system`
3. If yes: Close Cursor completely (Cmd+Q) and reopen

### quality-gates.sh fails with "uv pip install failed"

PM uses the workspace venv, not a local `.venv`. Make sure `.venv-workspace/` exists:

```bash
cd $UNIFIED_TRADING_WORKSPACE_ROOT/unified-trading-system-repos
ls .venv-workspace/bin/python
```

If missing, re-run the bootstrap script.

### .cursor/rules/ is a directory instead of a symlink

If you had the old copy-based setup, migrate to symlinks:

```bash
bash unified-trading-pm/scripts/workspace/setup-cursor-rules-symlink.sh
```

This script migrates any local-only rules into cursor-rules/ before creating the symlink.

### Script can't find workspace root

Make sure the env var is set:

```bash
echo $UNIFIED_TRADING_WORKSPACE_ROOT
```

If empty, re-run:

```bash
bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh
source ~/.zshrc
```

---

## Workspace dependency pinning

Canonical external dependency versions and propagation: see **unified-trading-codex**
`06-coding-standards/dependency-management.md` (§ Workspace-wide dependency pinning) and
`unified-trading-pm/workspace-constraints.toml`. Scripts: `resolve-canonical-versions.py`,
`propagate-canonical-versions.py`, `aggregate-workspace-deps.py`.

### Canonical deps flow

Prerequisite: ensure `uv` is installed (`pip install uv` once; workspace-bootstrap.sh does this if missing). Then run
from **workspace root** (with `.venv-workspace` activated or Python 3.13 + uv on PATH):

```bash
# 1) Generate canonical constraints (tightest range per external package)
python unified-trading-pm/scripts/workspace/resolve-canonical-versions.py

# 2) Apply to all repos and run uv lock per repo
python unified-trading-pm/scripts/propagation/propagate-canonical-versions.py --apply
# Optional: add --commit to git add/commit pyproject.toml + uv.lock per repo

# 3) Install workspace venv and freeze exact versions to requirements.lock
python unified-trading-pm/scripts/workspace/aggregate-workspace-deps.py --resolve
```

Without `--resolve`, aggregate-workspace-deps uses the existing `.venv-workspace/requirements.lock` for a fast
re-install.

<!-- last-synced: 2026-03-09T16:42:53Z -->
