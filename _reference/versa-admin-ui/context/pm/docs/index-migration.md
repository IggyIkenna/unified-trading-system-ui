# Cursor Index Migration (Skip Re-Indexing)

When your workspace path changes (iCloud sync, different machine), Cursor starts re-indexing from scratch. This can take
**30+ minutes** for large workspaces.

**Solution:** Copy the index from the old path to the new path!

---

## How to Run the Migration

**Script:** `unified-trading-pm/scripts/migrate-cursor-index.sh`

### For Your Other Laptop

When you switch to your other laptop (MacOld path):

1. Open workspace once in Cursor (creates new index folder)
2. Close Cursor (Cmd+Q)
3. Edit the script to use:
   ```bash
   OLD_PATH="Users-${USER}-Documents-repos-unified-trading-system-repos"
   NEW_PATH="Users-${USER}-Documents-Documents-MacOld-repos-unified-trading-system-repos"
   ```
4. Run: `bash scripts/migrate-cursor-index.sh`
5. Reopen Cursor

### Manual Migration

If the script doesn't work, copy manually:

```bash
# Close Cursor first!
cd ~/.cursor/projects

# Copy from old to new
cp -R Users-USERNAME-Documents-repos-unified-trading-system-repos/* \
      Users-USERNAME-Documents-Documents-Mac-repos-unified-trading-system-repos/
```

---

## How Cursor Indexing Works

### What's Stored Locally

**In `~/.cursor/projects/<workspace-path>/`:**

- File paths and metadata
- Tool execution cache
- Terminal history
- Conversation attachments
- Workspace settings

### What's Stored in Cloud

- Code embeddings (for semantic search)
- File content vectors

**This means:** When you copy the local index, Cursor can match it with the cloud embeddings using file hashes. It
doesn't need to re-process everything.

---

## Why It Works

Your files are **exactly the same** - just at a different root path:

- Old: `/Users/.../Documents/repos/unified-trading-system-repos/`
- New: `/Users/.../Documents/Documents - Mac/repos/unified-trading-system-repos/`

The **relative paths** are identical:

- `unified-trading-services/src/...` (same in both)
- `unified-config-interface/src/...` (same in both)

So the index **content** is still valid - only the root path changed.

---

## Troubleshooting

### "Still says Loading... after migration"

**Wait 2-3 minutes** - Cursor may be verifying the index against current files.

**Check:** Settings → Indexing & Docs

- If it says "Indexing..." with progress, it's working
- Progress should be much faster than 0% → 100%
- Likely just checking changed files

### "Index shows as empty"

**Cursor may have invalidated it** due to path mismatch.

**Solutions:**

1. Close Cursor
2. Re-run migration: `bash scripts/migrate-cursor-index.sh`
3. Open Cursor again

### "Want to force fresh index"

Delete the new index folder and let Cursor rebuild:

```bash
# Close Cursor first!
rm -rf ~/.cursor/projects/Users-USERNAME-Documents-Documents-Mac-repos-unified-trading-system-repos/
```

Then reopen Cursor (will re-index from scratch).

---

## Storage Savings

**Without migration:**

- Full re-index: ~30-45 minutes
- High CPU usage during indexing
- Battery drain on laptop

**With migration:**

- Instant or 1-5 minute verification
- Low CPU usage
- Minimal battery impact

---

## For Team Collaboration

When sharing this workspace setup with colleagues:

1. They run `setup-workspace-root.sh` (sets up paths)
2. Open workspace in Cursor (starts indexing)
3. **Optional:** If they also have an old path indexed, run `migrate-cursor-index.sh`

**Note:** Index migration is optional - if they're setting up fresh, let Cursor index normally.

---

## Technical Details

### Index Structure

```
~/.cursor/projects/<workspace-path>/
├── agent-tools/           # 602 cached tool executions
├── agent-transcripts/     # Conversation history
├── assets/                # Images, attachments
├── terminals/             # 964 terminal sessions
├── mcps/                  # MCP plugin cache
├── worker.log             # Indexing log (2.8MB)
├── .workspace-trusted     # Trust settings
└── mcp-cache.json         # MCP metadata
```

### What Gets Updated

When you copy the index, Cursor needs to:

1. ✅ Verify file hashes (fast - local check)
2. ✅ Match with cloud embeddings (fast - hash lookup)
3. ⚠️ Re-index changed files (if any)
4. ⚠️ Update absolute paths (quick string replace)

This is **much faster** than:

1. ❌ Scan all files
2. ❌ Read all content
3. ❌ Generate embeddings
4. ❌ Upload to cloud
5. ❌ Build metadata

---

## Summary

- **Script:** `scripts/migrate-cursor-index.sh` for future use
- **Expected time savings:** ~30-45 minutes of re-indexing per migration
- **When switching laptops:** Run the migration script again with updated paths
