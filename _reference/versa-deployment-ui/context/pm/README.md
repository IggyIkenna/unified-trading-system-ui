# unified-trading-pm

Project management, workspace tooling, and shared configuration for the Unified Trading System. This is Level 0 (root)
in the workspace topology — the SSOT template host and workspace management repo.

---

## Quick Start

```bash
# 1. Clone into the workspace root alongside sibling repos
cd ~/repos/unified-trading-system-repos
git clone git@github.com:IggyIkenna/unified-trading-pm.git

# 2. Set up workspace paths and IDE config
bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh

# 3. Pull the team's Cursor rules into your local .cursor/rules/
bash unified-trading-pm/scripts/workspace/sync-rules-pull.sh

# 4. (Optional) Full workspace bootstrap — clones all repos, installs deps
bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh
```

Full setup guide: [docs/workspace-setup.md](docs/workspace-setup.md) | IDE coordination:
[docs/both-ides-setup.md](docs/both-ides-setup.md)

---

## Repo Layout

```
unified-trading-pm/
├── workspace-manifest.json        SSOT registry of all 60+ repos (types, deps, versions)
├── manifest_warnings.yaml         Bad-release annotations (append-only)
├── WORKSPACE_MANIFEST_DAG.svg     Visual dependency DAG (auto-generated)
│
├── docs/                          All documentation
│   ├── workspace-setup.md         Full workspace setup guide
│   ├── both-ides-setup.md         Cursor + Claude Code IDE coordination
│   └── index-migration.md         Cursor index migration guide
│
├── scripts/                       Workspace automation
│   ├── setup.sh                   SSOT template: environment bootstrap
│   ├── quality-gates.sh           SSOT template: lint + test pipeline
│   ├── quickmerge.sh              SSOT template: git + PR automation
│   ├── _workspace-lib.sh          Shared bash helpers
│   ├── workspace/                 Workspace setup, sync, and bootstrap
│   ├── propagation/               SSOT template rollout to all repos (4 scripts)
│   ├── validation/                Code quality, import, and dep checks (10 scripts)
│   ├── manifest/                  DAG generator and SBOM tools
│   ├── agents/                    LLM agent wrappers (3 scripts)
│   ├── repo-management/           GitHub repo and collaborator setup
│   └── migration/                 One-off migrations and cleanups (4 scripts)
│
├── cursor-rules/                  Git-tracked SSOT for all .cursor/rules/*.mdc
├── cursor-configs/                VS Code workspace profiles
│
├── plans/                         Project planning and execution
│   ├── active/                    Currently executing plans
│   ├── cicd/                      CI/CD infrastructure plans
│   ├── cursor-plans/              Cursor agent prompts and architecture plans
│   └── tasks/                     Agent task definitions (cursor/ + claude-code/)
│
├── github-integration/            GitHub Projects automation and issue management
├── security/                      Internal security advisories (append-only)
├── templates/                     Per-repo setup templates (AGENTS.md)
└── tests/                         pytest + bats tests
```

---

## Day-to-Day Workflow

### Push changes to the team

```bash
cd unified-trading-pm
bash scripts/quickmerge.sh "feat: describe your change"
```

Quickmerge automatically syncs Cursor rules, validates the manifest, creates a branch, and opens a PR.

### Pull the team's latest

```bash
cd unified-trading-pm && git pull
bash scripts/workspace/sync-rules-pull.sh
```

### Check rule drift

```bash
bash scripts/workspace/sync-workspace.sh
```

---

## Key Scripts

| Script                                       | Purpose                                     |
| -------------------------------------------- | ------------------------------------------- |
| `scripts/quickmerge.sh "msg"`                | Main command — syncs rules + commits + PR   |
| `scripts/workspace/sync-rules-pull.sh`       | Pull team rules into local `.cursor/rules/` |
| `scripts/workspace/sync-workspace.sh`        | Show diff between local and repo rules      |
| `scripts/workspace/workspace-bootstrap.sh`   | Full workspace setup from scratch           |
| `scripts/manifest/generate_workspace_dag.py` | Regenerate DAG SVG from manifest            |
| `scripts/quality-gates.sh`                   | Run full lint + type-check + test pipeline  |

---

## Required Workspace Structure

This repo **must** be a sibling directory alongside all other system repos:

```
~/repos/unified-trading-system-repos/     <- workspace root (open in Cursor)
├── .cursor/rules/                        <- local Cursor rules (IDE reads here)
├── unified-trading-pm/                   <- THIS repo
├── unified-trading-codex/                <- standards and specifications
├── instruments-service/                  <- service repo
└── ...60+ other repos
```

---

## See Also

- [docs/workspace-setup.md](docs/workspace-setup.md) — full workspace setup guide
- [docs/both-ides-setup.md](docs/both-ides-setup.md) — Cursor + Claude Code IDE setup
- `unified-trading-codex/05-infrastructure/` — infrastructure docs, versioning, CI/CD diagrams
