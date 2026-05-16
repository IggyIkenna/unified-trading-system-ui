# Task Template — Reusable for Any Agent Task

**Copy this structure when creating new tasks. Every task plan MUST use `.md` suffix and YAML frontmatter.**

---

## Plan File Format (Required)

All task plans must be saved as `<slug>.md` in `plans/active/` and include this YAML frontmatter:

```yaml
---
name: task-slug # kebab-case, matches filename
overview: One-line description
type: code | infra | deployment | business | mixed
epic: epic-code-completion | epic-deployment | epic-business | epic-infra | none
status: active | blocked | paused

completion_gates:
  code: C5 # C0–C5 or "none" — gate ALL repos must reach before archiving
  deployment: none
  business: none

repo_gates:
  - repo: repo-name
    code: C2 # highest gate currently reached
    deployment: none
    business: none

depends_on: []

todos:
  - id: task-id
    content: Description
    status: todo | in_progress | done | blocked
    note: ""

isProject: false
---
```

**Gate levels reference:**

| Gate | Meaning                                      |
| ---- | -------------------------------------------- |
| C0   | Not started                                  |
| C1   | Implementation complete (not tested)         |
| C2   | Unit tests passing, coverage maintained      |
| C3   | Linter + Codex gates (ruff, basedpyright)    |
| C4   | Full `quality-gates.sh` Pass 1               |
| C5   | Quickmerge complete (merged to staging/main) |

Full spec: `unified-trading-pm/plans/PLAN_FORMAT.md`

---

## 🔒 CRITICAL SAFEGUARDS (Always Include)

```bash
# 1. Record which files you will touch BEFORE making changes
FILES_TO_TOUCH="path/to/file1.py path/to/file2.py"

# 2. Create a named backup branch (reference point only — do NOT switch to it)
git checkout -b backup-before-[task]-$(date +%s)
git add -A && git commit -m "Backup before [task]" || echo "Nothing to commit"
BACKUP_BRANCH=$(git branch --show-current)
echo "🔒 BACKUP: $BACKUP_BRANCH"

# 3. Return to your working branch
git checkout -   # back to previous branch

# 4. Recovery if needed — ONLY restore the specific files you touched:
# git restore --source=$BACKUP_BRANCH -- $FILES_TO_TOUCH
#
# ❌ NEVER: git checkout $BACKUP_BRANCH         (switches whole branch)
# ❌ NEVER: git reset --hard $BACKUP_BRANCH     (destroys other agents' work)
# ✅ ALWAYS: git restore --source=$BACKUP_BRANCH -- <file1> <file2>
```

### NEVER Rules:

- ❌ NEVER skip tests or add `|| true`
- ❌ NEVER add `@pytest.mark.skip` without documented reason
- ❌ NEVER use `git reset --hard` — not for conflicts, not for reverts, not ever without explicit user confirmation
- ❌ NEVER revert the whole branch — other agents may be working on the same repo; only revert your own files
- ❌ NEVER add `# type: ignore` without fixing root cause first
- ❌ NEVER use `.get("key", {})` or `.get("key", [])` (fail loud!)
- ❌ NEVER use `Type Any` (check source code for actual type)
- ❌ NEVER auto-commit (report back first)

### MUST DO Rules:

- ✅ Fix root causes (not symptoms)
- ✅ Test frequently
- ✅ Keep a list of every file you touch; use that list if you need to revert
- ✅ Document exceptions in QUALITY_GATE_BYPASS_AUDIT.md
- ✅ Report back with structured format

---

## 📋 TASK STRUCTURE

````markdown
# Task: [Task Name]

**Goal**: [One sentence] **Method**: X fast sub-agents (Task tool) **Repos touched**: [list of repos]

## Prompt (Copy-Paste to Execute):

[Prompt text that explicitly uses Task tool]

## Sub-Agent Allocation:

Agent 1: [Description]

- Files: [list — used for scoped revert if needed]
- Task: [specific]

[Repeat for each agent]

## Success Criteria:

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Verification:

```bash
[Commands to verify success]
```
````

---

## ✅ Example Task Doc Structure

See `TASK_1_ADD_QUALITY_CHECKS.md`, `TASK_2_FIX_VIOLATIONS.md`, `TASK_3_TYPE_CLEANUP.md`

---

**Use this template to create new executable task docs as `<slug>.md` in `plans/active/`**
