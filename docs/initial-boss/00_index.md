# initial-boss — UI scoping & discussion docs

## What this folder is

A working space for **scoping the testing & development workflow** for `unified-trading-system-ui`. These are NOT plans — they are evolving discussion docs that capture context, findings, options, and decisions as we work through the problem with Harsh.

When a section is finalized enough, it can be promoted into a real plan (which lives in `unified-trading-pm/plans/`).

## Why "initial-boss"

These docs precede the actual plan. They are the "boss fight" before we can write a plan that won't have to be rewritten three times.

## How to use

- **Read this index first.** It tells you where each topic lives.
- **Each doc has section status markers:** `[OPEN]`, `[DISCUSSING]`, `[TENTATIVE]`, `[FINALIZED]`, `[DEFERRED]`. Don't trust anything that isn't `[FINALIZED]`.
- **Decisions log at the bottom of each doc** captures _what was decided and why_, with a date. This is the part future-you should trust.
- **Open questions are explicit** at the bottom of each doc — these are blockers waiting on Harsh.
- **When a doc gets too big**, split it. The index here is the source of truth for what lives where.

## Start here

**→ [boss_points.md](boss_points.md)** is the canonical entry point.

It captures the 7 real pain points Harsh surfaced on 2026-04-15 and proposes the order in which we discuss them. The earlier docs (01-06) were drafted before the boss-points and may need revision once we work through them — treat boss-points as the current source of truth for scope and priority.

## Current docs

| File                                 | Topic                                                                      | Status                               |
| ------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------ |
| **`boss_points.md`**                 | **Canonical list of 7 pain points + discussion order**                     | **DISCUSSING — primary doc**         |
| `01_problem_and_context.md`          | Earlier context doc (needs revision after boss-points)                     | STALE — revisit                      |
| `02_codebase_facts.md`               | What actually exists in the repo (test infra, widgets, mocks, hooks)       | DISCUSSING — still reference         |
| `03_test_strategy_options.md`        | Earlier test layer brainstorm (needs revision)                             | STALE — revisit                      |
| `04_mock_data_and_backend_gap.md`    | Earlier mock-data thinking (feeds BP-7)                                    | STALE — revisit when discussing BP-7 |
| `05_repo_structure_question.md`      | Single repo vs split — captured rationale for not splitting                | TENTATIVE — still valid              |
| `06_agent_workflow_and_gates.md`     | Earlier agent gate thinking (revisit after boss-points)                    | STALE — revisit                      |
| `07_trading_target_state.md`         | **BP-1 Stream B — pre-filled findings from code, Harsh confirms/corrects** | **DISCUSSING — pre-filled draft**    |
| `99_open_questions_and_decisions.md` | Cross-doc open questions and a global decisions log                        | DISCUSSING — authoritative           |

## Conventions

- **Dates are absolute** (2026-04-15, not "yesterday")
- **File paths are absolute or repo-relative** with `[markdown links](path)` so they're clickable
- **No prose for prose's sake** — bullets, tables, short paragraphs
- **Trace every recommendation to a piece of evidence** in the codebase, not just intuition
- **When in doubt, mark it OPEN** — false certainty is worse than no answer

## Related but separate

- `unified-trading-pm/plans/ai/ui_testing_strategy_2026_04_15.plan.md` — premature plan draft from earlier in the same session. **Do not treat as authoritative.** Once these scoping docs converge, a real plan will be written from scratch in `unified-trading-pm/plans/` and that draft will be deleted.
- `unified-trading-system-ui/converstaion.md` — transcript of an earlier conversation with another agent that suggested splitting the repo. We are NOT going down that path; rationale captured in `05_repo_structure_question.md`.
