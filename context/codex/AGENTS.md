# AGENTS.md — unified-trading-codex

## Quick Reference for AI Agents

### Key Commands

- **Quality gates**: `cd unified-trading-codex && bash scripts/quality-gates.sh`
- **Source dir**: `unified-trading-codex/` (documentation repo — no Python package)

### Mandatory Rules

Before any action, read:
`unified-trading-pm/cursor-configs/SUB_AGENT_MANDATORY_RULES.md`

### Rules Summary

- Plans, docs, cursor rules changes → target **main** directly (doc-only fast-path)
- Scripts, workflows changes → target **staging** (SIT validates before main)
- `uv pip install` not `pip install`
- No `# type: ignore` to hide architectural violations

### Workspace

WORKSPACE_ROOT: `/Users/ikennaigboaka/Code/unified-trading-system-repos`
