# Refactoring Guide — Transparent, Traceable, Safe

**Problem:** Refactors can silently hide old code, creating confusion about what's the "real" version.

**Solution:** This guide ensures refactors are transparent, can be paused/resumed, and have clear history.

---

## Rule 1: Ask Before Any Breaking Change

**Before you refactor anything structural, ask the user.**

### What Counts as "Breaking"?

| Change                | Example                                  | Ask?                       |
| --------------------- | ---------------------------------------- | -------------------------- |
| Create new page       | Add `TradesPage.tsx`                     | ✅ **YES**                 |
| Hide old page         | Stop showing `/positions`                | ✅ **YES**                 |
| Rename route          | `/positions` → `/execution/positions`    | ✅ **YES**                 |
| Move component        | `services/data/` → `services/execution/` | ✅ **YES**                 |
| Reorganize navigation | Change menu structure                    | ✅ **YES**                 |
| Delete dead code      | Remove unused function                   | ❌ No (if truly unused)    |
| Refactor internals    | Change component structure               | ❌ No (if route/name same) |
| Update styling        | Change colors, spacing                   | ❌ No                      |

### How to Ask

```
"I plan to [specific change]. This will [specific impact].
The user will see [what changes]. Should I proceed?

Current: [show current structure]
After: [show new structure]"
```

**Example:**

```
"I plan to move the Positions page from /positions to /execution/positions
and reorganize it under the execution service domain.

Current structure:
  /positions → services/data/pages/PositionsPage.tsx
  Routes: /data, /positions, ...

New structure:
  /execution/positions → services/execution/pages/PositionsPage.tsx
  Routes: /data, /execution/positions, ...

Old route /positions will redirect to /execution/positions.

Should I proceed?"
```

---

## Rule 2: Use UI_STRUCTURE_MANIFEST.json as Source of Truth

### Before Refactoring

1. **Read the manifest:**

   ```bash
   cat UI_STRUCTURE_MANIFEST.json
   ```

2. **Check the status:**
   - Is `refactor_in_progress` = `true`?
     - **YES:** Resume previous refactor (see Rule 4)
     - **NO:** Starting new refactor (see Rule 3)

3. **Understand current state:**
   - Look at `current_structure.routes` and `current_structure.components`
   - This is the actual structure users see

### During Refactoring

1. **Update `target_structure`** to show what you're building toward
2. **Mark `refactor_in_progress: true`**
3. **Document in `refactor_history`:**
   ```json
   {
     "id": "refactor-xyz-YYYY-MM-DD",
     "title": "Clear, specific title",
     "type": "refactor",
     "from_state": "current structure",
     "to_state": "target structure",
     "description": "What and why",
     "status": "in_progress",
     "approved_by": "User name",
     "approval_date": "ISO timestamp"
   }
   ```

### After Refactoring

1. **Update `current_structure`** to match actual code
2. **Mark `refactor_in_progress: false`**
3. **Update refactor history status to `completed`**
4. **Document in `breaking_changes_log`** if anything user-visible changed

---

## Rule 3: Starting a New Refactor

**Step-by-step process:**

### 1. Ask for Approval

```
"I want to refactor [what].

Current: [show current state from manifest]
Target: [show target state]
Why: [explain reasoning]

Should I proceed?"
```

### 2. Get User Approval

- User says **"yes"** → proceed to Step 3
- User says **"no"** or **"wait"** → stop, don't refactor
- User says **"let me think"** → wait for next message

### 3. Update Manifest (Target)

```json
// UI_STRUCTURE_MANIFEST.json
{
  "_meta": {
    "refactor_in_progress": true,
    "refactor_branch": "refactor/my-feature-2026-03-20"
  },

  "target_structure": {
    "status": "target",
    "routes": [
      // Describe what routes will exist after refactor
    ],
    "components": {
      // Describe component structure after refactor
    },
    "changes": [
      "What will move",
      "What will be renamed",
      "What will be deleted"
    ]
  },

  "refactor_history": [
    {
      "id": "refactor-my-feature-2026-03-20",
      "title": "Clear title of what's being refactored",
      "type": "refactor",
      "from_state": "Current description",
      "to_state": "Target description",
      "description": "Why this refactor? What's the goal?",
      "status": "in_progress",
      "approved_by": "User name",
      "approval_date": "ISO timestamp"
    }
  ]
}
```

### 4. Make the Changes

- Work toward `target_structure`
- Keep git history clean (commit messages reference the refactor ID)
- Don't leave multiple versions around

### 5. At End of Session

Update `current_structure` to match the actual code:

```json
{
  "current_structure": {
    "status": "in-refactor",
    "routes": [...],  // What currently exists
    "components": {...},  // What currently exists
    "last_verified": "ISO timestamp",
    "verified_by": "Your name"
  },

  "_meta": {
    "refactor_in_progress": true  // Still in progress
  }
}
```

---

## Rule 4: Resuming a Refactor (Session Resume)

**When you start a new session and `refactor_in_progress: true`:**

### 1. Read the Manifest

```bash
cat UI_STRUCTURE_MANIFEST.json
```

### 2. Understand the Refactor

Look at the active entry in `refactor_history`:

- **What's being refactored?** (from `id` and `title`)
- **From what state?** (from `from_state`)
- **To what state?** (from `to_state`)
- **When was it approved?** (from `approval_date`)
- **Who approved it?** (from `approved_by`)

### 3. Check Current vs Target

Compare:

- **Manifest's `current_structure`** ← what was done last
- **Manifest's `target_structure`** ← what you're building toward
- **Actual code** ← what's really there

If they don't match:

```
"The manifest says we're at [X], but I see [Y] in the code.
Last session ended at [date]. Did you make changes?
Should I continue toward [target]?"
```

### 4. Continue From Where You Left Off

Work toward `target_structure`. The manifest tells you:

- Where you are
- Where you're going
- Why you're doing this

### 5. Update Manifest As You Go

As you make progress, update `current_structure` to reflect actual state.

---

## Rule 5: If Refactor Needs to Pause

**If work stops mid-refactor and needs to resume later:**

### Document Clearly

```json
{
  "_meta": {
    "refactor_in_progress": true,
    "refactor_paused_reason": "Waiting for API_FRONTEND_GAPS.md update",
    "pause_date": "2026-03-20T17:00:00Z",
    "next_steps": "Implement new routing after API is ready"
  },

  "current_structure": {
    "last_verified": "2026-03-20T17:00:00Z",
    "verified_by": "CosmicTrader",
    "notes": "Moved 3 of 5 pages. Stopped before updating navigation."
  }
}
```

### Document Next Steps

In the refactor_history entry:

```json
{
  "status": "in_progress",
  "progress": "50%",
  "last_activity": "2026-03-20T17:00:00Z",
  "next_action": "Implement route redirects for old paths",
  "blocker": "Waiting for API_FRONTEND_GAPS.md resolution"
}
```

### When Resuming

Agent reads the notes and knows:

- What's been done
- What's left
- Why it paused
- What to do next

---

## Rule 6: Completing a Refactor

### 1. Verify All Changes Are Done

- [ ] All code moved/renamed as planned
- [ ] All routes updated
- [ ] Redirects in place for old paths
- [ ] No old versions left around
- [ ] Tests pass
- [ ] Code follows .cursorrules

### 2. Update Manifest to Completed

```json
{
  "_meta": {
    "refactor_in_progress": false,
    "refactor_branch": "refactor/my-feature-2026-03-20"
  },

  "current_structure": {
    "status": "stable",
    "routes": [...],
    "components": {...},
    "last_verified": "ISO timestamp",
    "verified_by": "Your name"
  },

  "refactor_history": [
    {
      "id": "refactor-my-feature-2026-03-20",
      "status": "completed",
      "completed_date": "ISO timestamp",
      "final_notes": "What was accomplished"
    }
  ]
}
```

### 3. Document Breaking Changes

If anything user-visible changed, add to `breaking_changes_log`:

```json
{
  "breaking_changes_log": [
    {
      "id": "breaking-change-1",
      "date": "ISO timestamp",
      "type": "route-change",
      "description": "Positions page moved from /positions to /execution/positions",
      "old_path": "/positions",
      "new_path": "/execution/positions",
      "impact": "Users with bookmarks or links to /positions will be redirected",
      "redirect_active": true,
      "approved_by": "User name"
    }
  ]
}
```

### 4. Commit with Clear Message

```bash
git commit -m "refactor: [id] Complete refactoring of [what]

Moved [from] to [to].
Updated routes [old] → [new].
Redirects in place for backwards compatibility.

Refactor ID: refactor-my-feature-2026-03-20
Manifest updated and verified."
```

---

## Rule 7: Rolling Back a Refactor

**If a refactor goes wrong and needs to be undone:**

### 1. Tell the User

```
"The refactor has an issue: [problem].
I can roll back to [previous state] (lose recent changes)
or fix the issue (continue refactor).
Which would you prefer?"
```

### 2. If Rolling Back

```bash
# Revert all commits from this refactor
git revert [commit-sha]...

# Update manifest back to pre-refactor state
# Mark refactor as "rolled_back" in refactor_history
```

```json
{
  "refactor_history": [
    {
      "id": "refactor-my-feature-2026-03-20",
      "status": "rolled_back",
      "rolled_back_date": "ISO timestamp",
      "rolled_back_reason": "Description of what went wrong",
      "rolled_back_by": "Your name"
    }
  ]
}
```

### 3. Update Manifest to Pre-Refactor State

```json
{
  "_meta": {
    "refactor_in_progress": false
  },

  "current_structure": {
    "status": "reverted",
    "last_verified": "ISO timestamp"
  }
}
```

---

## Quick Reference: Refactor Checklist

### Before Starting

- [ ] Read manifest
- [ ] Ask user for approval
- [ ] Get explicit "yes"

### During Refactor

- [ ] Update manifest `target_structure`
- [ ] Mark `refactor_in_progress: true`
- [ ] Document in `refactor_history`
- [ ] Make code changes toward target
- [ ] Commit with refactor ID in message

### At Session End

- [ ] Update manifest `current_structure` to actual state
- [ ] Note any blockers or next steps
- [ ] Commit manifest update

### When Resuming

- [ ] Read manifest
- [ ] Verify current vs target
- [ ] Continue toward target
- [ ] Update manifest as progress made

### When Completing

- [ ] Verify all changes done
- [ ] Mark `refactor_in_progress: false`
- [ ] Document breaking changes
- [ ] Commit with completion message

### If Pausing Mid-Refactor

- [ ] Document pause reason in manifest
- [ ] Document next steps
- [ ] Update current_structure to actual state
- [ ] Commit manifest update

### If Rolling Back

- [ ] Tell user
- [ ] Get approval
- [ ] Revert commits
- [ ] Update manifest to pre-refactor state
- [ ] Document what went wrong

---

## Example: Complete Refactor Lifecycle

### Session 1: Ask & Start

```
User: "The Positions page is confusing. Can we reorganize it?"

Agent: "I'd like to move the Positions page from the data service to the
execution service. This makes more sense architecturally. The route would
change from /positions to /execution/positions, with a redirect in place.
Should I proceed?"

User: "Yes, do it."

Agent: Updates manifest, starts refactoring
```

### Session 1: End

```json
{
  "_meta": {
    "refactor_in_progress": true
  },
  "current_structure": {
    "last_verified": "2026-03-20T17:00:00Z",
    "verified_by": "Agent"
  },
  "refactor_history": [
    {
      "status": "in_progress",
      "last_activity": "2026-03-20T17:00:00Z",
      "progress": "50% - Moved files, updating routes next"
    }
  ]
}
```

### Session 2: Resume & Complete

```
Agent reads manifest:
- Refactor is 50% done
- Moving from /positions to /execution/positions
- Last activity was moving files

Agent continues: Updates routes, tests, completes refactor
```

### Session 2: End (Refactor Complete)

```json
{
  "_meta": {
    "refactor_in_progress": false
  },
  "current_structure": {
    "status": "stable",
    "last_verified": "2026-03-20T18:30:00Z"
  },
  "refactor_history": [
    {
      "status": "completed",
      "completed_date": "2026-03-20T18:30:00Z"
    }
  ],
  "breaking_changes_log": [
    {
      "old_path": "/positions",
      "new_path": "/execution/positions",
      "redirect": true
    }
  ]
}
```

---

## Key Principles

✅ **Transparency:** User knows what's happening at every step

✅ **Traceability:** Manifest shows where you were, where you're going, why

✅ **Session Continuity:** Pause/resume without losing context

✅ **Single Source of Truth:** Manifest is the record, code is the implementation

✅ **Rollback Capability:** Can undo if something goes wrong

✅ **No Silent Changes:** Breaking changes require approval

✅ **Clean Git History:** Commits reference refactor IDs, easy to trace

---

**Remember:** Refactors are structural changes to how users experience the app. Always ask before making them.
