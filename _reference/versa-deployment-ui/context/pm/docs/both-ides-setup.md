# Cursor + Claude Code Setup (Both IDEs)

When your workspace path changes (iCloud sync, different machine, etc.), **BOTH** Cursor and Claude Code need updates.

**Good news:** The setup script now handles both automatically!

---

## Quick Answer

**YES** - `setup-workspace-root.sh` now configures **BOTH** Cursor and Claude Code:

```bash
bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh
```

This one command:

1. ✅ Updates shell config (`UNIFIED_TRADING_WORKSPACE_ROOT`)
2. ✅ Updates 10 Cursor workspace configs
3. ✅ Creates Claude Code conversation symlinks
4. ✅ Updates Claude Code permissions in settings.json

Then restart **both IDEs** (Cmd+Q and reopen).

---

## What It Fixes

### Cursor Issues

- ❌ "Invalid Python interpreter" errors
- ❌ Can't find workspace venv
- ❌ Linter/formatter paths broken

### Claude Code Issues

- ❌ Missing conversation history
- ❌ Can't see past chats (112 conversations)
- ❌ Permission errors for workspace access

---

## How It Works

### For Cursor

Updates all 10 `.code-workspace` files in `.cursor/workspace-configs/`:

- `python.defaultInterpreterPath` → new path
- `ruff.path` → new path

### For Claude Code

1. **Conversation Symlinks:**

   ```
   Old: ~/.claude/projects/-Users-...-Documents-repos-...
   New: ~/.claude/projects/-Users-...-Documents-Documents - Mac-repos-...

   Creates: New → Old (symlink)
   ```

2. **Permissions:** Adds new path to `~/.claude/settings.json`:
   ```json
   {
     "permissions": {
       "allow": [
         "Bash(...old-path...)",
         "Bash(...new-path...)"  ← Added
       ]
     }
   }
   ```

---

## Before and After

### Before (Manual Setup)

❌ Update Cursor workspace configs (10 files) ❌ Create Claude Code symlink manually ❌ Edit Claude Code settings.json
manually ❌ Restart both IDEs ❌ Test each separately

### After (One Command)

✅ Run: `bash scripts/workspace/setup-workspace-root.sh` ✅ Restart both IDEs ✅ Everything works

---

## What Gets Updated

### Shell Config (~/.zshrc or ~/.bashrc)

```bash
export UNIFIED_TRADING_WORKSPACE_ROOT="/Users/.../Documents - Mac/repos"
```

### Cursor (10 files)

- `unified-trading-system-repos.code-workspace`
- `workspace-complete.code-workspace`
- `workspace-data-pipeline.code-workspace`
- ... 7 more workspace configs

### Claude Code (2 things)

- Symlink: `~/.claude/projects/-Users-...-Documents - Mac-repos-...` → old path
- Settings: `~/.claude/settings.json` permissions array

---

## Verification

After running the script and restarting:

### Check Cursor

1. Open Cursor
2. Check Python interpreter (bottom right) - should show Python 3.13.9
3. No "Invalid Python interpreter" errors

### Check Claude Code

1. Open Claude Code
2. Load your workspace
3. Click conversation history - all 112 conversations appear
4. No permission errors

---

## Switching Between Machines

**Your current Mac:**

```bash
export UNIFIED_TRADING_WORKSPACE_ROOT="/Users/.../Documents - Mac/repos"
```

**Your other laptop:**

```bash
export UNIFIED_TRADING_WORKSPACE_ROOT="/Users/.../Documents - MacOld/repos"
```

**To switch:**

1. Edit `~/.zshrc` with the new path
2. Run: `source ~/.zshrc`
3. Run: `bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh`
4. Restart both IDEs

**Done!** Both IDEs work with the new path.

---

## If You Only Have One IDE

### Only using Cursor?

The script handles it gracefully:

```
ℹ Claude Code not installed (no ~/.claude directory)
```

Skips Claude Code setup automatically.

### Only using Claude Code?

The script still works - just ignore the Cursor config updates.

---

## Troubleshooting

### "Cursor works but Claude Code still missing conversations"

**Check symlink exists:**

```bash
ls -la ~/.claude/projects/ | grep "Documents - Mac"
```

Should show a symlink (`→`) pointing to the old path.

**If missing, create manually:**

```bash
cd ~/.claude/projects
ln -s './-Users-USERNAME-Documents-repos-unified-trading-system-repos' \
      './-Users-USERNAME-Documents-Documents - Mac-repos-unified-trading-system-repos'
```

### "Claude Code works but Cursor shows Invalid Python"

**Check workspace root variable:**

```bash
echo $UNIFIED_TRADING_WORKSPACE_ROOT
```

**Re-run setup:**

```bash
bash unified-trading-pm/scripts/workspace/setup-workspace-root.sh
```

**Restart Cursor completely** (Cmd+Q, not just close window).

### "Script says Python3 not found"

Claude Code settings update needs Python3 to safely modify JSON.

**Workaround (manual):**

```bash
# Edit ~/.claude/settings.json
# Add your new workspace path to the "allow" array under "permissions"
```

---

## Summary

✅ **One script handles both IDEs** ✅ **One variable to change when switching machines** ✅ **No manual file editing
needed** ✅ **Works cross-platform (macOS + Linux)** ✅ **Your colleague can use the same script**

**The setup-workspace-root.sh script is now your single source of truth for IDE configuration.**

---

## Related Docs

- Main setup guide: `WORKSPACE_SETUP.md`
- Cursor storage: `CURSOR_STORAGE_ANALYSIS.md`
- Claude Code recovery: `~/.claude/CONVERSATION_RECOVERY.md`
- Script docs: `scripts/README-WORKSPACE.md`
