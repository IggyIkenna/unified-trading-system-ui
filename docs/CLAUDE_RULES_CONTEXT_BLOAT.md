# Claude Code Context Bloat — Cleanup Brief

**Created:** 2026-04-16
**Problem:** Every Claude Code message in any repo loads **all 139 rule files** (~185KB / ~50k tokens) from the workspace-level `.claude/rules/`. This consumes 25-30% of context before the conversation even starts.

---

## The numbers

| What             | Count    | Size                |
| ---------------- | -------- | ------------------- |
| Total rule files | 139      | 185KB (~50k tokens) |
| `core/`          | 43 files | 73KB                |
| `dependencies/`  | 10 files | 14KB                |
| `imports/`       | 7 files  | 14KB                |
| `misc/`          | 11 files | 11KB                |
| `services/`      | 7 files  | 11KB                |
| `quality-gates/` | 10 files | 8KB                 |
| `architecture/`  | 8 files  | 8KB                 |
| `config/`        | 6 files  | 9KB                 |
| `workflow/`      | 9 files  | 8KB                 |
| `ci-cd/`         | 5 files  | 6KB                 |
| `testing/`       | 5 files  | 9KB                 |
| `ui/`            | 5 files  | 3KB                 |
| `standards/`     | 5 files  | 4KB                 |
| `documentation/` | 4 files  | 4KB                 |
| Top-level `.md`  | 3 files  | 5KB                 |

**Plus per-message overhead:** system prompt, tool definitions, MCP instructions, git status, memory = ~30-40k tokens more.

**Total fixed overhead per turn:** ~80-100k tokens out of 200k context = 40-50% consumed before first word.

---

## Root cause

Rules live at **workspace level** (`unified-trading-system-repos/.claude/rules/`). Claude Code loads ALL of them regardless of which repo you're working in. So when working in the UI repo, you get 130+ Python-backend rules about basedpyright, uv, quickmerge, ServiceCLI, cloud-agnostic I/O, schema governance, etc.

---

## What's irrelevant when working in the UI repo

These rules are Python/backend-only and have zero relevance to `unified-trading-system-ui`:

| Category                               | Files                                                                                                                                                                                                             | Why irrelevant to UI                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `imports/` (all 7)                     | adapter-models, contracts-integration, no-schema-outside-contracts, service-domain-schema, uic-may-import-uac, uac-usage, uac-version-alignment                                                                   | Python schema governance — UI has no Pydantic models                     |
| `core/basedpyright-safety`             |                                                                                                                                                                                                                   | UI uses `tsc`, not basedpyright                                          |
| `core/cloud-agnostic`                  |                                                                                                                                                                                                                   | UI doesn't import google.cloud or boto3                                  |
| `core/cloud-build-test-in-image`       |                                                                                                                                                                                                                   | UI doesn't use Docker test-in-image                                      |
| `core/batch-live-symmetry`             |                                                                                                                                                                                                                   | UI doesn't have batch/live modes                                         |
| `core/event-logging`                   |                                                                                                                                                                                                                   | UI doesn't use `setup_events()` / `log_event()`                          |
| `core/instruments-domain-and-api-keys` |                                                                                                                                                                                                                   | UI doesn't use UDC/UTS/UCI Python libraries                              |
| `core/mandatory-setup-sh`              |                                                                                                                                                                                                                   | UI uses `npm`/`pnpm`, not `scripts/setup.sh`                             |
| `core/always-use-quickmerge`           |                                                                                                                                                                                                                   | UI doesn't have `quickmerge.sh`                                          |
| `core/schema-governance-index`         |                                                                                                                                                                                                                   | Python schema governance                                                 |
| `core/schema-service-owned`            |                                                                                                                                                                                                                   | Python schema placement                                                  |
| `core/canonical-schema-semver`         |                                                                                                                                                                                                                   | Pydantic schema versioning                                               |
| `core/provider-api-version-manifest`   |                                                                                                                                                                                                                   | External API schema versions                                             |
| `core/async-http-aiohttp`              |                                                                                                                                                                                                                   | Python async HTTP                                                        |
| `core/concurrency-max-workers`         |                                                                                                                                                                                                                   | Python ThreadPoolExecutor                                                |
| `core/single-project-id-env-var`       |                                                                                                                                                                                                                   | GCP_PROJECT_ID in Python config                                          |
| `core/utc-datetime`                    |                                                                                                                                                                                                                   | Python datetime.now(timezone.utc)                                        |
| `core/hook-tooling-policy`             |                                                                                                                                                                                                                   | prek / pre-commit for Python                                             |
| `core/external-import-standards`       |                                                                                                                                                                                                                   | Python import paths                                                      |
| `core/no-backward-compat-shims`        |                                                                                                                                                                                                                   | Python re-export stubs                                                   |
| `core/search-before-implementing`      |                                                                                                                                                                                                                   | Search unified Python libraries                                          |
| `core/no-type-any-use-specific`        |                                                                                                                                                                                                                   | Python type:ignore patterns                                              |
| `core/gcp-auth-in-tests`               |                                                                                                                                                                                                                   | Python GCP test auth                                                     |
| `core/dag-enforcement`                 |                                                                                                                                                                                                                   | Python tier DAG                                                          |
| `core/codex-maintenance`               |                                                                                                                                                                                                                   | Codex doc maintenance                                                    |
| `core/cursor-folder-boundary`          |                                                                                                                                                                                                                   | Cursor-specific                                                          |
| `config/` (all 6)                      | config-store, dynamic-config, no-hardcoded-project-ids, workspace-root-variable, workspace-venv-fallback, workspace-venv-sync                                                                                     | Python config / venv management                                          |
| `dependencies/` (all 10)               |                                                                                                                                                                                                                   | Python dependency management (uv, pyproject.toml, workspace-constraints) |
| `architecture/` (most)                 | execution-service-structure, ibkr-gateway, service-structure, services-as-orchestrators, singleton-adapter, thin-adapters, runtime-topology                                                                       | Python service architecture                                              |
| `services/` (most)                     | execution-service, instruments-service, servicecli-framework, service-setup-checklist, new-repo-setup, repo-type-detection                                                                                        | Python service setup                                                     |
| `ci-cd/` (most)                        | act-secrets, artifact-registry, auth-setup, cicd-setup, path-dependency-ci                                                                                                                                        | Python CI/CD                                                             |
| `quality-gates/` (most)                | quality-gates-propagation-risk, safe-linting-execution, production-readiness-validators, exclude-build-artifacts, quality-gates-audit-factors                                                                     | Python quality gates                                                     |
| `testing/` (most)                      | integration-testing-layers, vcr-ownership, pytest-collection, test-coverage-targets                                                                                                                               | Python testing                                                           |
| `misc/` (most)                         | pylance-extra-paths, pyright-unknown-types, python-version-consistency, library-versioning, unified-libraries-artifact-registry, validator-integration, gbt-feature-design-principles, sports-migration-standards | Python tooling                                                           |
| `standards/` (most)                    | builtin-generics, no-empty-fallbacks, hardening-standards                                                                                                                                                         | Python coding standards                                                  |
| `workflow/` (several)                  | lobster-workflows, phase0-baseline, plans-to-deployable, full-cicd-flow, single-repo-vs-workspace-setup, dependency-alignment-and-setup-flow                                                                      | Python workspace workflow                                                |

**Estimate: ~110-120 of the 139 rules are irrelevant to the UI repo.**

---

## What IS relevant to the UI repo

~15-20 rules total:

| Rule                                     | Why relevant                          |
| ---------------------------------------- | ------------------------------------- |
| `ui/ui-no-python-quality-gates`          | Confirms TypeScript-only gates        |
| `ui/ui-setup-checklist`                  | UI setup checklist                    |
| `ui/ui-smoke-tests-and-deslop`           | Playwright smoke tests                |
| `ui/ui-quality-gates-typescript`         | tsc/ESLint gates                      |
| `ui/ui-runtime-validation`               | Runtime verification for UI           |
| `core/runtime-verification-required`     | Run code, check for errors            |
| `core/conventional-commits`              | Commit message format (universal)     |
| `core/no-summary-docs`                   | Don't create summary docs (universal) |
| `core/delete-deprecated`                 | No parallel code paths (universal)    |
| `core/plan-placement`                    | Where plans go (universal)            |
| `core/token-optimization`                | Token management (universal)          |
| `core/parallel-agent-execution`          | Multi-agent coordination (universal)  |
| `core/sub-agent-workflow-standard`       | Sub-agent patterns (universal)        |
| `core/never-revert-local-changes`        | Git safety (universal)                |
| `core/accurate-codebase-analysis`        | Exclude node_modules etc. (universal) |
| `core/context7-usage`                    | External lib docs (universal)         |
| `core/ui-service-separation`             | UI must be its own repo               |
| `services/trading-analytics-ui`          | UI-specific service rules             |
| `documentation/prettier-docs-formatting` | Markdown formatting                   |
| `core/rollout-tracking`                  | Plan tracking (universal)             |

---

## Recommended fix

### Option A: Repo-level rules (recommended)

Move UI-relevant rules to `unified-trading-system-ui/.claude/rules/` and keep only truly universal rules at workspace level. Claude Code checks both levels.

**Workspace level** (~20 universal rules): conventional-commits, no-summary-docs, delete-deprecated, plan-placement, never-revert-local-changes, parallel-agent-execution, token-optimization, runtime-verification-required, context7-usage, rollout-tracking, accurate-codebase-analysis.

**UI repo level** (~10 rules): All `ui/*` rules, trading-analytics-ui, prettier-docs-formatting, ui-service-separation.

**Python repos** keep the rest at workspace level (they need them).

**Problem:** This means Python repos still load all 139 rules. You'd need to also move Python-only rules to a repo level or use a different mechanism.

### Option B: Consolidate aggressively at workspace level

Merge the 139 files into ~15-20 consolidated files by theme. Many rules are near-duplicates or could be a single table row instead of a full file.

Candidates for merging:

| Merge into                      | Files to merge                                                                                                                                                                                                                            | Current files |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `python-schema-governance.md`   | imports/\* + schema-governance-index + schema-service-owned + canonical-schema-semver + provider-api-version-manifest                                                                                                                     | 12 files → 1  |
| `python-quality-gates.md`       | quality-gates/\* + safe-linting-execution + basedpyright-safety + exclude-build-artifacts                                                                                                                                                 | 12 files → 1  |
| `python-dependencies.md`        | dependencies/\* + dependency-chain-updates + uv-package-manager                                                                                                                                                                           | 10 files → 1  |
| `python-services.md`            | services/\* + servicecli + service-structure + services-as-orchestrators + thin-adapters                                                                                                                                                  | 10 files → 1  |
| `python-config-and-cloud.md`    | config/\* + cloud-agnostic + instruments-domain + single-project-id                                                                                                                                                                       | 9 files → 1   |
| `python-ci-cd.md`               | ci-cd/\* + cloud-build-test-in-image + always-use-quickmerge                                                                                                                                                                              | 7 files → 1   |
| `python-testing.md`             | testing/\* + gcp-auth-in-tests                                                                                                                                                                                                            | 6 files → 1   |
| `python-coding-standards.md`    | standards/\* + async-http + utc-datetime + builtin-generics + concurrency + event-logging                                                                                                                                                 | 10 files → 1  |
| `universal-git-and-workflow.md` | conventional-commits + never-revert + plan-placement + rollout-tracking + pr-review + full-cicd-flow                                                                                                                                      | 6 files → 1   |
| `universal-agent-behavior.md`   | no-summary-docs + delete-deprecated + token-optimization + parallel-agent-execution + sub-agent-workflow + agents-follow-cursor-rules + rule-amnesia-detection + accurate-codebase-analysis + context7-usage + search-before-implementing | 10 files → 1  |
| `ui-rules.md`                   | ui/\* + trading-analytics-ui + ui-service-separation                                                                                                                                                                                      | 7 files → 1   |

**139 files → ~12 files.** Even if each consolidated file is the same total content, fewer files means less frontmatter/header overhead and easier maintenance.

### Option C: Both (best)

1. Consolidate 139 → ~12-15 files
2. Tag each consolidated file with `applies_to: [python, ui, all]`
3. Move to repo-level `.claude/rules/` where appropriate

---

## Equivalent Cursor cleanup

This is the same problem you solved for Cursor. The `.cursor/rules/*.mdc` files (copied from `unified-trading-pm/cursor-rules/`) have the same structure and the same bloat. The consolidation here should be done in parallel with the Cursor rules — they share the same source of truth in `unified-trading-pm/cursor-rules/`.

### Source of truth chain

```
unified-trading-pm/cursor-rules/*.mdc   (SSOT for Cursor)
        ↓ copied to
.cursor/rules/*.mdc                     (per-repo Cursor rules)

unified-trading-system-repos/.claude/rules/*.md  (SSOT for Claude Code)
        ↓ loaded by
Claude Code sessions                    (all 139 files, every message)
```

Both need the same consolidation. The content is largely identical — just different file extensions (`.mdc` vs `.md`).

---

## Action items

1. **Audit which rules overlap** between `.claude/rules/` and `.cursor/rules/` — likely 90%+ identical content
2. **Consolidate** 139 files → ~12-15 themed files
3. **Scope** Python-only rules so they don't load in UI sessions
4. **Measure** before/after: open a fresh Claude Code session, say "hi", check token usage
5. **Update sync system** (`sync-rules-and-docs.py`) to handle consolidated files
