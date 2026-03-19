# Bootstrap From Scratch — Unified Trading System

Complete guide to setting up the workspace from zero, assuming the `unified-trading-system-repos` directory already
exists (even if empty).

**Last verified:** 2026-03-13 | **Repos:** 67 | **Python:** 3.13.9 | **Node:** 22+

---

## Table of Contents

1. [Workspace Root Structure](#1-workspace-root-structure)
2. [Prerequisites (What You Need Before Starting)](#2-prerequisites)
3. [System Dependencies](#3-system-dependencies)
4. [GitHub Access & Authentication](#4-github-access--authentication)
5. [GCP Authentication](#5-gcp-authentication)
6. [AWS Authentication](#6-aws-authentication)
7. [Run the Bootstrap Script](#7-run-the-bootstrap-script)
8. [Post-Bootstrap: Dev Environment Setup](#8-post-bootstrap-dev-environment-setup)
9. [Claude Code Setup](#9-claude-code-setup)
10. [Manual Token Setup (.act-secrets)](#10-manual-token-setup-act-secrets)
11. [Verify Everything Works](#11-verify-everything-works)
12. [What the Bootstrap Actually Does (Reference)](#12-what-the-bootstrap-actually-does)
13. [Symlinks: What Comes from Git vs What Bootstrap Creates](#13-symlinks-what-comes-from-git-vs-what-bootstrap-creates)
14. [Day-to-Day Maintenance](#14-day-to-day-maintenance)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Workspace Root Structure

After bootstrap, your workspace root should look like this:

```
~/Code/unified-trading-system-repos/          # WORKSPACE_ROOT
├── .claude/                                   # Claude Code config (created in Section 9)
│   ├── CLAUDE.md → ../unified-trading-pm/cursor-configs/CLAUDE.md  (symlink)
│   └── settings.local.json                    # local permissions
├── .cursor/                                   # Cursor/IDE config (created by Phase 6)
│   ├── rules/ → ../unified-trading-pm/.cursor/rules/               (symlink)
│   ├── plans/ → ../unified-trading-pm/plans/cursor-plans           (symlink)
│   └── workspace-configs/ → ../unified-trading-pm/cursor-configs/  (symlink)
├── .cursorignore → unified-trading-pm/cursor-configs/cursorignore  (symlink)
├── .venv-workspace/                           # workspace venv (Phase 4)
├── .env.dev                                   # local env vars (Section 8)
├── .env.dev.template                          # env var template
├── .act-secrets                               # GH_PAT token (Section 10, chmod 600)
├── bootstrap.sh → unified-trading-pm/scripts/workspace/workspace-bootstrap.sh
├── unified-trading-system-repos.code-workspace → .cursor/workspace-configs/...
│
├── unified-trading-pm/                        # DevOps + scripts + config (SSOT)
├── unified-trading-codex/                     # Standards + audit
├── unified-trading-library/                   # Core library (T1)
├── unified-config-interface/                  # Cloud config (T1)
├── unified-events-interface/                  # Event bus (T0)
├── execution-service/                         # Trade execution (Service)
├── ... (67 repos total)                       # All repos from workspace-manifest.json
│
└── Each repo contains:
    ├── .venv/                                 # per-repo venv (Phase 5)
    ├── scripts/
    │   ├── quality-gates.sh                   # committed file (propagated from PM)
    │   ├── setup.sh                           # committed file (propagated from PM)
    │   ├── quickmerge.sh → ../../unified-trading-pm/scripts/quickmerge.sh  (symlink, committed)
    │   └── pre-flight-audit.sh → ...          # symlink, committed
    └── .readiness-ref                         # committed text file (Phase 2.5)
```

**Key distinction:** The `.cursor/` and `.claude/` directories at workspace root are **not in git** — they are created
by bootstrap Phase 6 and the Claude Code setup step. Per-repo files like `scripts/quickmerge.sh` (symlink) and
`scripts/quality-gates.sh` (real file) **are committed to git** — `git clone` gets them automatically.

---

## 2. Prerequisites

You need a machine with:

- **macOS** (Apple Silicon M1-M5 or Intel) or **Linux** (x86_64 or arm64)
- **bash 4+** or **zsh** (macOS ships with zsh; bash 3.2 is too old — upgrade via Homebrew)
- **git** (with SSH key or HTTPS token for github.com)
- ~30 GB free disk (67 repos + venvs + node_modules for UI repos)

**If you have nothing installed at all**, start from Section 2 below.

---

## 3. System Dependencies

Install these in order. The bootstrap script will attempt to install missing ones, but it's faster to do it upfront.

### macOS (Homebrew)

```bash
# Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Core tools
brew install git jq ripgrep awscli node

# GitHub CLI (required for quickmerge, PR creation, collaborator management)
brew install gh

# Docker Desktop (required for emulator-based testing)
# Download from: https://www.docker.com/products/docker-desktop

# Python 3.13.9 — EXACT version required
# Option A (recommended): via uv
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.zshrc  # or restart terminal
uv python install 3.13.9

# Option B: via pyenv
brew install pyenv
pyenv install 3.13.9
pyenv global 3.13.9

# Option C: via Homebrew (may not be exact 3.13.9 patch)
brew install python@3.13

# uv (Python package manager — replaces pip everywhere)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Google Cloud SDK
brew install google-cloud-sdk
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y git jq curl build-essential

# ripgrep
sudo apt install -y ripgrep

# Node 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# GitHub CLI
sudo apt install -y gh

# Python 3.13.9 via pyenv (recommended)
curl https://pyenv.run | bash
# Add to ~/.bashrc:
#   export PYENV_ROOT="$HOME/.pyenv"
#   export PATH="$PYENV_ROOT/bin:$PYENV_ROOT/shims:$PATH"
source ~/.bashrc
pyenv install 3.13.9
pyenv global 3.13.9

# uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Google Cloud SDK
# https://cloud.google.com/sdk/docs/install#linux

# Docker
# https://docs.docker.com/engine/install/ubuntu/
```

### Verify Python Version

```bash
python3 --version
# Must output: Python 3.13.9
# If not, check: which python3  and ensure pyenv shims or uv-managed Python is on PATH
```

### pyenv Users — Critical Shell Config

If using pyenv, add these to `~/.bashrc` or `~/.zshrc` to prevent uv from downloading its own Python (which breaks all
50+ venvs if the cache is cleared):

```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PYENV_ROOT/shims:$PATH"
export UV_PYTHON="$PYENV_ROOT/versions/3.13.9/bin/python3.13"
export UV_PYTHON_PREFERENCE=system
export UV_PYTHON_DOWNLOADS=never
export PYENV_VIRTUALENV_DISABLE_PROMPT=1
```

---

## 4. GitHub Access & Authentication

### SSH Key (recommended)

```bash
# Generate key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Paste at: GitHub → Settings → SSH and GPG Keys → New SSH Key

# Test
ssh -T git@github.com
# Should see: "Hi <username>! You've successfully authenticated..."
```

### HTTPS (alternative — no SSH key needed)

```bash
gh auth login
# Select: GitHub.com → HTTPS → Login with web browser
```

### Repository Access

Both `CosmicTrader` and `datadodo` need write access to all 67 repos. If invites have expired or are missing:

```bash
# From workspace root:
bash unified-trading-pm/scripts/repo-management/add-repo-collaborators.sh --write

# Dry run first:
bash unified-trading-pm/scripts/repo-management/add-repo-collaborators.sh --write --dry-run
```

Users will receive email invitations that they must accept. Invites expire after 7 days — if they expire, just re-run
the script (it deletes expired invites and sends fresh ones).

To check current status:

```bash
# Check a specific repo
gh api repos/IggyIkenna/<repo-name>/collaborators --jq '.[].login'
gh api repos/IggyIkenna/<repo-name>/invitations --jq '.[] | "\(.invitee.login): expired=\(.expired)"'
```

---

## 5. GCP Authentication

Required account: `datadodo@gmail.com` Required project: `odum-research` (pre-flight check) / `central-element-323112`
(dev config)

```bash
# Install gcloud if not done
# macOS: brew install google-cloud-sdk
# Linux: https://cloud.google.com/sdk/docs/install

# Login (opens browser)
gcloud auth login
# Select: datadodo@gmail.com

# Set Application Default Credentials (ADC) — needed by Python SDKs
gcloud auth application-default login

# Set project
gcloud config set project odum-research

# Verify
gcloud auth list
# Should show: datadodo@gmail.com (ACTIVE)
gcloud config get-value project
# Should show: odum-research

# Create dev-specific config (used by setup-dev-environment.sh)
gcloud config configurations create unified-trading-dev
gcloud config configurations activate unified-trading-dev
gcloud config set project central-element-323112
gcloud config set account datadodo@gmail.com
```

**Note:** For local development with `CLOUD_MOCK_MODE=true`, real GCP credentials are not strictly required — services
use in-memory mocks. But the bootstrap pre-flight check validates them.

---

## 6. AWS Authentication

```bash
aws configure
# Access Key ID: <your-key>
# Secret Access Key: <your-secret>
# Region: ap-northeast-1  (Tokyo — closest to Binance exchange)
# Output format: json

# Verify
aws sts get-caller-identity

# Optional: create named dev profile
aws configure --profile unified-trading-dev
```

Like GCP, `CLOUD_MOCK_MODE=true` uses moto mocks — real AWS credentials are optional for most local work.

---

## 7. Run the Bootstrap Script

### Option A: Fresh machine (PM repo not cloned yet)

```bash
mkdir -p ~/Code/unified-trading-system-repos
cd ~/Code/unified-trading-system-repos

# One-liner bootstrap (clones PM first, then everything else):
bash <(curl -fsSL https://raw.githubusercontent.com/IggyIkenna/unified-trading-pm/main/scripts/workspace/workspace-bootstrap.sh)

# Use --https if no SSH key:
bash <(curl -fsSL https://raw.githubusercontent.com/IggyIkenna/unified-trading-pm/main/scripts/workspace/workspace-bootstrap.sh) --https
```

### Option B: PM already cloned

```bash
cd ~/Code/unified-trading-system-repos
bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh
```

### Bootstrap Flags

| Flag                | Effect                                        |
| ------------------- | --------------------------------------------- |
| `--check`           | Verify mode — reports issues, changes nothing |
| `--https`           | Use HTTPS clone URLs instead of SSH           |
| `--skip-fresh`      | Preserve existing repos (don't re-clone)      |
| `--skip-system`     | Skip system dependency installation           |
| `--skip-auth-check` | Skip pre-flight auth verification             |

### What bootstrap does (7 phases)

| Phase | Name                | Details                                                         |
| ----- | ------------------- | --------------------------------------------------------------- |
| PRE   | Auth checks         | GitHub SSH/HTTPS, org membership, GCP ADC, AWS CLI, act secrets |
| 0     | Self-seeding        | Clone unified-trading-pm if not present                         |
| 1     | System deps         | Python 3.13.9, uv, ripgrep, jq, AWS CLI                         |
| 2     | Clone repos         | All 67 repos from workspace-manifest.json                       |
| 2.5   | Readiness-ref files | `.readiness-ref` in each repo (codex audit link)                |
| 3     | Version alignment   | `run-version-alignment.sh --fix` (dep alignment across repos)   |
| 4     | Workspace venv      | `.venv-workspace` + shared scripts + git hooks in all repos     |
| 5     | Per-repo setup      | `run-all-setup.sh --rollout-first` (per-repo .venv + deps)      |
| 6     | Workspace symlinks  | `.cursor/rules`, `.cursor/plans`, `.cursor/workspace-configs`   |
| 7     | Import smoke test   | `import <pkg>` for every Python repo                            |

---

## 8. Post-Bootstrap: Dev Environment Setup

After bootstrap completes, run the dev environment setup for additional configuration:

```bash
bash unified-trading-pm/scripts/workspace/setup-dev-environment.sh
```

This adds:

- `.env.dev` from template (environment variables for local development)
- GCP dev configuration (`unified-trading-dev` gcloud config)
- AWS profile verification
- T0→T1→T2→T3 library install into `.venv-workspace` (topological order)
- Import verification for all core libraries

### Edit .env.dev

```bash
cp .env.dev.template .env.dev  # (setup-dev-environment.sh does this if needed)
# Then edit .env.dev:
#   GCP_PROJECT_ID=central-element-323112
#   CLOUD_MOCK_MODE=true          (safe default — no live cloud calls)
#   USE_SECRET_MANAGER=false      (read API keys from env vars, not Secret Manager)
#   RUNTIME_MODE=batch            (batch mode for dev)
```

Full env var reference: `unified-trading-pm/docs/dev-environment-vars.md`

---

## 9. Claude Code Setup

Claude Code is the CLI agent (`claude`) used for AI-assisted development across the workspace. It needs its own
configuration separate from Cursor/VS Code.

### Step 1: Install Claude Code

```bash
# Install via npm (requires Node 22+)
npm install -g @anthropic-ai/claude-code

# Verify
claude --version
# Should output: x.x.x (Claude Code)

# If you prefer npx (no global install):
npx @anthropic-ai/claude-code
```

### Step 2: Authenticate

```bash
claude
# First run opens browser for Anthropic authentication
# Sign in with your Anthropic account
```

### Step 3: Create the workspace `.claude/` directory

The `.claude/` directory at workspace root is **not in git** — you need to create it and the CLAUDE.md symlink:

```bash
cd ~/Code/unified-trading-system-repos

# Create .claude directory
mkdir -p .claude

# Create symlink to workspace rules (CRITICAL — this is how Claude Code knows the project rules)
ln -sf ../unified-trading-pm/cursor-configs/CLAUDE.md .claude/CLAUDE.md

# Verify symlink works
cat .claude/CLAUDE.md | head -5
# Should show: "# Unified Trading System — Claude Code Instructions"
```

### Step 4: Configure local permissions

Create `.claude/settings.local.json` for workspace-level permissions:

```json
{
  "permissions": {
    "allow": ["Bash", "Git", "Grep", "Global", "WebSearch"],
    "deny": [],
    "ask": []
  }
}
```

```bash
cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash",
      "Git",
      "Grep",
      "Global",
      "WebSearch"
    ],
    "deny": [],
    "ask": []
  }
}
EOF
```

### Step 5: Configure global settings (optional)

Global settings at `~/.claude/settings.json` apply to all workspaces:

```bash
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'EOF'
{
  "permissions": {
    "allow": []
  },
  "model": "claude-sonnet-4-6"
}
EOF
```

### Step 6: Set workspace root environment variable

Add to `~/.zshrc` or `~/.bashrc`:

```bash
export UNIFIED_TRADING_WORKSPACE_ROOT="$HOME/Code/unified-trading-system-repos"
```

Then run the IDE setup script (handles both Cursor and Claude Code):

```bash
bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh
```

### Step 7: Verify Claude Code

```bash
cd ~/Code/unified-trading-system-repos
claude

# In the Claude Code session, verify it loaded workspace rules:
# It should know about: quality-gates.sh, quickmerge.sh, uv (not pip), etc.
# Test: ask "what venv should I use for running tests?"
# Expected: "per-repo .venv via quality-gates.sh, never .venv-workspace"
```

### Key Claude Code rules for this workspace

These are enforced by `.claude/CLAUDE.md`:

- **Tests:** `bash scripts/quality-gates.sh` — never `pytest` directly
- **Packages:** `uv pip install` — never `pip install`
- **Commits:** `git add` + `git commit` only — never run `quickmerge.sh` unless explicitly told
- **Types:** `basedpyright` — never `pyright`
- **No destructive git:** Never `git reset --hard` without confirmation
- **Sub-agents:** Must pass `SUB_AGENT_MANDATORY_RULES.md` at top of prompt

### Switching machines / workspace paths

If your workspace path changes (different machine, iCloud sync, etc.):

```bash
bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh
```

This script automatically:

1. Updates `UNIFIED_TRADING_WORKSPACE_ROOT` in shell config
2. Creates Claude Code conversation history symlinks (preserves past sessions)
3. Updates Claude Code permissions for the new path
4. Updates Cursor workspace configs

See `unified-trading-pm/docs/both-ides-setup.md` for details.

---

## 10. Manual Token Setup (.act-secrets)

**This is the ONLY file that requires manually pasting tokens.** It is never committed to git.

```bash
# Generate the template
bash unified-trading-pm/scripts/workspace/generate-act-secrets.sh

# Edit it
nano ~/.act-secrets
```

Add your GitHub Personal Access Token:

```
# act secrets — never commit this file
GH_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get a GH_PAT:**

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Scopes needed: `repo`, `workflow`, `read:org`
4. Copy the token and paste into `.act-secrets`

This token is used by:

- `act` (nektos/act) for local GitHub Actions simulation
- `quickmerge.sh` for PR creation and auto-merge
- Version cascade workflows

The file is `chmod 600` (owner-only read/write) and gitignored.

---

## 11. Verify Everything Works

### Quick check

```bash
# Re-run bootstrap in check mode
bash bootstrap.sh --check

# Or from PM:
bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh --check
```

### Activate workspace venv

```bash
source .venv-workspace/bin/activate
which python    # should be .venv-workspace/bin/python
python --version  # should be 3.13.x
```

### Verify core imports

```bash
python -c "from unified_events_interface import setup_events, log_event; print('UEI OK')"
python -c "from unified_config_interface import UnifiedCloudConfig; print('UCI OK')"
python -c "import unified_trading_library; print('UTL OK')"
python -c "import unified_market_interface; print('UMI OK')"
```

### Run quality gates on a single repo

```bash
cd execution-service
bash scripts/quality-gates.sh
```

**Never** run `pytest` directly — always use `quality-gates.sh` (uses per-repo `.venv`, not workspace venv).

### Open the workspace in VS Code / Cursor

```bash
code .cursor/workspace-configs/unified-trading-system-repos.code-workspace
# Or: Cursor → File → Open Workspace from File → select the above file
```

---

## 12. What the Bootstrap Actually Does (Reference)

### Symlink Architecture

See [Section 13](#13-symlinks-what-comes-from-git-vs-what-bootstrap-creates) for the full breakdown of which symlinks
come from `git clone` vs which are created by bootstrap.

### Virtual Environment Model

| Venv               | Location       | Purpose                              | Used by                              |
| ------------------ | -------------- | ------------------------------------ | ------------------------------------ |
| `.venv-workspace`  | Workspace root | IDE IntelliSense, cross-repo imports | VS Code / Cursor, ruff, basedpyright |
| `.venv` (per-repo) | Each repo root | CI-faithful testing, quality gates   | `quality-gates.sh`, `pytest`         |

**Pinned tools in `.venv-workspace`:** `ruff==0.15.0`, `basedpyright==1.38.2`

### Propagation Scripts (run by bootstrap Phase 5)

- `setup.sh` — per-repo: creates `.venv`, installs deps via `uv pip install -e .`
- `quality-gates.sh` — per-repo: lint, format, typecheck, tests, codex compliance
- `quickmerge.sh` — per-repo: two-pass commit + PR workflow

These are propagated from PM templates by `run-all-setup.sh --rollout-first`.

### Version Alignment (run by bootstrap Phase 3)

`run-version-alignment.sh --fix` performs:

- Broken symlink check
- npm dependency drift check (UI repos)
- Canonical npm version alignment
- `uv.lock` drift detection
- Internal + external Python dependency alignment
- `[tool.uv.sources]` editable entries validation
- Internal deps must be editable (not from Artifact Registry)

---

## 13. Symlinks: What Comes from Git vs What Bootstrap Creates

This is a common source of confusion. Some symlinks are **committed to git** (you get them on `git clone`). Others are
**workspace-local** and must be created by bootstrap or setup scripts.

### Already in git (created by rollout, committed to each repo)

These exist in every repo after `git clone` — no bootstrap needed:

| File                          | Type          | Notes                                                                                          |
| ----------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `scripts/quickmerge.sh`       | Symlink (git) | Points to `../../unified-trading-pm/scripts/quickmerge.sh`. Works because PM is a sibling dir. |
| `scripts/pre-flight-audit.sh` | Symlink (git) | Points to PM validation script.                                                                |
| `scripts/quality-gates.sh`    | Real file     | Copied from PM template, customized per repo (PACKAGE_NAME, MIN_COVERAGE).                     |
| `scripts/setup.sh`            | Real file     | Copied from PM template, customized per repo.                                                  |
| `.readiness-ref`              | Real file     | Text file with relative path to codex audit YAML.                                              |

**Important:** The symlinks (`quickmerge.sh`, `pre-flight-audit.sh`) resolve relative to the workspace — they assume
`unified-trading-pm` is a sibling directory. If PM is not cloned, these symlinks will be broken (but `git clone` of the
target repo still succeeds — the symlink just won't resolve until PM is cloned too).

### Created by bootstrap Phase 6 (NOT in git)

These are workspace-level and must be recreated on each new machine:

| Symlink                                       | Created by                          | Target                                                        |
| --------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `.cursor/rules/`                              | `setup-cursor-rules-symlink.sh`     | `../unified-trading-pm/.cursor/rules/`                        |
| `.cursor/plans/`                              | `setup-cursor-plans-symlink.sh`     | `../unified-trading-pm/plans/cursor-plans`                    |
| `.cursor/workspace-configs/`                  | `setup-workspace-config-symlink.sh` | `../unified-trading-pm/cursor-configs/`                       |
| `unified-trading-system-repos.code-workspace` | `setup-workspace-config-symlink.sh` | `.cursor/workspace-configs/unified-trading-system-repos...`   |
| `.cursorignore`                               | `setup-workspace-config-symlink.sh` | `unified-trading-pm/cursor-configs/cursorignore`              |
| `bootstrap.sh`                                | `workspace-bootstrap.sh` Phase 6    | `unified-trading-pm/scripts/workspace/workspace-bootstrap.sh` |

### Created manually (NOT in git, NOT by bootstrap)

| Item                          | Created by                 | Notes                                                       |
| ----------------------------- | -------------------------- | ----------------------------------------------------------- |
| `.claude/CLAUDE.md`           | Manual (Section 9)         | Symlink to `../unified-trading-pm/cursor-configs/CLAUDE.md` |
| `.claude/settings.local.json` | Manual (Section 9)         | Workspace-local Claude Code permissions                     |
| `.act-secrets`                | `generate-act-secrets.sh`  | GH_PAT token file (chmod 600)                               |
| `.env.dev`                    | `setup-dev-environment.sh` | From `.env.dev.template`                                    |

### Created by bootstrap Phase 4 (NOT in git, local only)

| Item                  | Notes                                                       |
| --------------------- | ----------------------------------------------------------- |
| `.git/hooks/pre-push` | Copied (not symlinked) into each repo by `install-hooks.sh` |
| `.venv-workspace/`    | Workspace venv with ruff, basedpyright, all libs editable   |
| `<repo>/.venv/`       | Per-repo venv created by `setup.sh`                         |

### What about `fix-broken-symlinks.sh`?

This script does **not exist** and is **not needed for fresh bootstrap**. It was referenced in
`setup-dev-environment.sh` as an optional tool for remediating pre-existing broken symlinks (e.g., after workspace path
changes). The script handles its absence gracefully — it prints a SKIP message and suggests running the individual
symlink setup scripts instead:

```bash
# If you encounter broken symlinks after bootstrap, re-run the individual setup scripts:
bash unified-trading-pm/scripts/workspace/setup-cursor-rules-symlink.sh
bash unified-trading-pm/scripts/workspace/setup-cursor-plans-symlink.sh
bash unified-trading-pm/scripts/workspace/setup-workspace-config-symlink.sh
bash unified-trading-pm/scripts/workspace/setup-pre-flight-symlinks.sh
```

---

## 14. Day-to-Day Maintenance

### After pulling new changes

```bash
# Sync workspace venv (after version alignment changes)
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh

# Or full re-setup (preserves existing repos)
bash bootstrap.sh --skip-fresh
```

### After `pyproject.toml` changes in any repo

```bash
# Re-run version alignment
bash unified-trading-pm/scripts/repo-management/run-version-alignment.sh --fix

# Then re-run setup for affected repos
bash unified-trading-pm/scripts/repo-management/run-all-setup.sh
```

### Full quality gates across all repos

```bash
bash unified-trading-pm/scripts/repo-management/run-all-quality-gates.sh
```

### Add collaborators to new repos

```bash
bash unified-trading-pm/scripts/repo-management/add-repo-collaborators.sh --write
```

### Propagate GitHub secrets (Telegram, etc.)

```bash
bash unified-trading-pm/scripts/workspace/propagate-github-secrets.sh
```

---

## 15. Troubleshooting

### "Python 3.13.9 not found"

```bash
# Check what's installed
python3 --version
which python3

# Install exact version via uv (fastest)
uv python install 3.13.9

# Or via pyenv
pyenv install 3.13.9 && pyenv global 3.13.9 && pyenv rehash
```

### Import errors after bootstrap

```bash
# Re-install a specific library into workspace venv
source .venv-workspace/bin/activate
uv pip install -e unified-events-interface/

# Re-install all libraries in topological order
bash unified-trading-pm/scripts/workspace/setup-dev-environment.sh
```

### Broken symlinks

```bash
# Check for broken symlinks
find . -maxdepth 2 -type l ! -exec test -e {} \; -print 2>/dev/null | grep -v .venv

# Fix workspace-level symlinks
bash unified-trading-pm/scripts/workspace/setup-cursor-rules-symlink.sh
bash unified-trading-pm/scripts/workspace/setup-cursor-plans-symlink.sh
bash unified-trading-pm/scripts/workspace/setup-workspace-config-symlink.sh
```

### Per-repo venv issues

```bash
cd <repo-name>
rm -rf .venv
bash scripts/setup.sh
# This recreates .venv and installs all deps fresh
```

### "gh not authenticated"

```bash
gh auth login
# Then verify:
gh auth status
```

### act secrets issues

```bash
# Regenerate template
bash unified-trading-pm/scripts/workspace/generate-act-secrets.sh

# Verify it exists
ls -la ~/.act-secrets
# Should be: -rw------- (chmod 600)
```

### pyenv shim errors / "version not installed"

```bash
# If pyenv global is set to a version that doesn't exist:
pyenv install 3.13.9
pyenv global 3.13.9
pyenv rehash
```

### Docker not running (emulator tests fail)

```bash
# Start Docker Desktop, then verify:
docker info
# Emulators (Pub/Sub, GCS, BigQuery) need Docker for local testing
```

---

## CLI Tools Summary

| Tool           | Required?  | Purpose                                             | Install                                            |
| -------------- | ---------- | --------------------------------------------------- | -------------------------------------------------- |
| `git`          | Yes        | Source control                                      | `brew install git`                                 |
| `python3.13`   | Yes        | Runtime (exact 3.13.9)                              | `uv python install 3.13.9`                         |
| `uv`           | Yes        | Python package manager (replaces pip)               | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| `jq`           | Yes        | JSON parsing (manifest, API responses)              | `brew install jq`                                  |
| `rg` (ripgrep) | Yes        | Fast code search                                    | `brew install ripgrep`                             |
| `gh`           | Yes        | GitHub CLI (PRs, quickmerge, collaborators)         | `brew install gh`                                  |
| `node` (22+)   | UI repos   | Frontend builds (React, Vite)                       | `brew install node`                                |
| `docker`       | Testing    | Emulators (Pub/Sub, GCS, BigQuery)                  | Docker Desktop                                     |
| `gcloud`       | Optional\* | GCP auth, project config                            | `brew install google-cloud-sdk`                    |
| `aws`          | Optional\* | AWS auth, TradFi testnet                            | `brew install awscli`                              |
| `claude`       | Yes        | AI-assisted development (Claude Code CLI)           | `npm install -g @anthropic-ai/claude-code`         |
| `act`          | Optional   | Local GitHub Actions simulation                     | `brew install act`                                 |
| `terraform`    | Optional   | Dev infrastructure provisioning                     | `brew install terraform`                           |
| `basedpyright` | Auto       | Type checking (installed in .venv-workspace)        | Via bootstrap                                      |
| `ruff`         | Auto       | Linting + formatting (installed in .venv-workspace) | Via bootstrap                                      |
| `prettier`     | Auto       | YAML/MD formatting (via npx)                        | Via node/npx                                       |

\*Optional for local dev with `CLOUD_MOCK_MODE=true`; required for staging/prod.

---

## Tokens & Credentials Needed

| Credential          | Where to get it                            | Where it goes        | In git? |
| ------------------- | ------------------------------------------ | -------------------- | ------- |
| GitHub SSH key      | `ssh-keygen -t ed25519`                    | `~/.ssh/id_ed25519`  | No      |
| GitHub PAT (GH_PAT) | github.com/settings/tokens                 | `~/.act-secrets`     | No      |
| GCP ADC             | `gcloud auth application-default login`    | `~/.config/gcloud/`  | No      |
| AWS credentials     | `aws configure`                            | `~/.aws/credentials` | No      |
| Anthropic auth      | `claude` (first run opens browser)         | `~/.claude/`         | No      |
| Testnet API keys    | Exchange-specific (Binance, Deribit, etc.) | `.env.dev`           | No      |

**`.act-secrets` is the only file requiring manual token pasting.** Everything else is handled by CLI login flows
(`gh auth login`, `gcloud auth login`, `aws configure`, `claude`).
