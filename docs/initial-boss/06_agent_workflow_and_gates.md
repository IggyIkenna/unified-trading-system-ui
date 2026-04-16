# 06 — Agent workflow & where the gate lives

**Status:** OPEN — needs Harsh's input on current workflow before we can finalize
**Last updated:** 2026-04-15

---

## What we need to figure out [OPEN]

The whole point of this work is **agents shouldn't be able to declare "done" without a verification gate running**. That requires us to:

1. Understand how Harsh actually launches & manages agents today
2. Figure out where in that workflow the gate naturally fits
3. Make the gate easy / automatic enough that agents don't skip it
4. Make sure the gate runs against the actual changes (not the whole tree, when avoidable)

We don't have enough info on (1) yet — this doc captures what we know and what we need to ask.

---

## What we know about the current agent workflow [TENTATIVE]

From the conversation:

- Harsh uses **Cursor** as the primary IDE
- Agent tooling: **Claude Code, Cursor's built-in agent (Composer / Sonnet / Haiku / Opus), Gemini, Codex**
- Pattern: **Harsh writes a plan in the morning** (with a more capable model, e.g. Opus), then **feeds it to a less-expensive model** (Sonnet / Composer / Haiku) to execute
- Multiple agents may run **in parallel** but typically on **non-overlapping files**
- All work happens on a **single git branch** (no feature branching today)
- Agents commit when they're "done" with no automated verification step
- Harsh discovers regressions by **manually opening the UI** later

The existence of files like `AGENT_PROMPT.md`, `START_HERE.md`, `AGENT_FINDINGS.md`, `MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md` in the repo strongly suggests there's already a documented agent protocol — **need to read these.**

## What gate options we have [DISCUSSING]

### Option 1 — Pre-commit hook (husky)

**What:** A git hook that runs before every commit, blocks the commit if the gate fails.

**Pros:**

- Standard, well-understood pattern
- Catches before the bad code is even committed
- Works for both human and agent commits

**Cons:**

- Slow gates (>30s) hurt iteration on humans typing
- Some agents bypass git hooks (we'd need to confirm)
- "Just run the agent again with --no-verify" is a real risk

### Option 2 — Pre-push hook (husky)

**What:** Same as pre-commit, but runs on `git push`.

**Pros:**

- More forgiving — devs can commit WIP freely
- Still catches before code leaves the local machine
- Easier to make slower (you push less often than you commit)

**Cons:**

- Many agents commit-and-push in one motion
- If an agent declares "done" without pushing, the gate never runs
- Requires Harsh to actually `git push` regularly to discover problems

### Option 3 — Explicit "agent verify" script

**What:** A `pnpm agent:verify` script that the agent is _required_ to run before saying done. The agent's prompt includes "always run `pnpm agent:verify` before declaring done."

**Pros:**

- Most flexible — different gates for different contexts
- Can be wired into agent prompts AND a git hook
- Fails fast and visibly

**Cons:**

- Relies on the agent actually running it (prompt discipline)
- Agents WILL forget — need belt-and-braces with a hook

### Option 4 — CI-only gate

**What:** Run the gate in CI (Cloud Build / AWS CodeBuild / GitHub Actions). Don't gate locally.

**Pros:**

- Cannot be bypassed — runs on the server
- Doesn't slow down local iteration

**Cons:**

- Discovery happens AFTER the agent has moved on to the next thing
- Round trip is minutes-to-hours, not seconds
- The whole point is to catch regressions BEFORE the developer has moved on
- **Doesn't actually solve the stated problem** — Harsh still won't notice for hours

### Option 5 — All of the above [PROBABLY THIS]

**What:**

- `pnpm agent:verify` script as the canonical entry point
- Husky pre-push hook that runs `pnpm agent:verify`
- Update `AGENT_PROMPT.md` to require running the script before declaring done
- CI also runs the same script as a final safety net

This is the standard "defense in depth" pattern: the agent runs the gate, the hook catches it if the agent forgets, and CI catches it if the hook is bypassed.

## The gate composition [DISCUSSING]

What does `pnpm agent:verify` actually run? Tentative composition (subject to debate in `03_test_strategy_options.md`):

```
pnpm agent:verify
  ├── tsc --noEmit                                          (~20s)
  ├── eslint . --max-warnings 0                             (~10s)
  ├── vitest run --changed                                  (~30s)
  ├── playwright test e2e/widget-harness.spec.ts \
  │     --grep "[changed widget ids]"                       (~30s)
  └── playwright test e2e/static-smoke.spec.ts              (~60-120s)

Target total: <3 minutes
```

The "changed widget ids" mechanism would parse `git diff` to find which widget folders were modified, then filter the harness spec to only run those.

## Agent prompt updates needed [DISCUSSING]

The agent's working prompt (likely [AGENT_PROMPT.md](../../AGENT_PROMPT.md), TBD) needs an explicit step:

> Before declaring any task done, run `pnpm agent:verify`. If it fails, fix the failures and re-run. Do not declare done until it passes. If you cannot make it pass, report the failure to the user — never silently work around it.

This wording matches the workspace's existing rule pattern (see [.claude/rules/core/runtime-verification-required.md](/home/hk/unified-trading-system-repos/.claude/rules/core/runtime-verification-required.md)).

## The "smart selection" question [OPEN]

The full gate (everything above) takes ~2-3 min. But we can be smarter:

- **Vitest** has built-in `--changed` mode that only runs tests touching files changed since the last commit
- **Playwright** doesn't have native change-aware filtering, but we can:
  - Parse `git diff --name-only` to find changed widget folders
  - Use `--grep` to run only the matching widget harness specs
  - Use a route-affinity map to run only the static smoke routes that include the changed widgets

Smart selection drops the gate from 3 min to ~30-60 sec for typical small changes. **But it has a risk:** if our change-detection is wrong, we miss tests we should have run.

**Tradeoff:** start with full gate. Add smart selection only after we have green-baseline confidence.

## Open questions for Harsh

1. **What's in `AGENT_PROMPT.md` today?** Need to read it before deciding how to update.
2. **Is there a husky / pre-commit setup already?** I haven't checked. If yes, we extend it; if not, we add it.
3. **CI status?** What does `cloudbuild.yaml` and `buildspec.aws.yaml` actually run? Is anything gated there today?
4. **Branch strategy?** Are you OK switching to feature branches per agent task, or does single-branch fit your style better? (Single-branch is fine if the gate is rigorous.)
5. **Agent runner?** Are agents launched via Cursor UI, or via CLI scripts in the repo? The gate's invocation point depends on this.
6. **Tolerance for slow gates?** Is 3 minutes per agent task too much? 5 minutes? 10 minutes?

## Decisions log

- _(empty — nothing finalized yet)_
