# 99 — Open questions & cross-doc decisions log

**Status:** DISCUSSING — this doc is the running ledger
**Last updated:** 2026-04-15

---

## How to use this doc

- **Open questions** are listed by topic with the doc they came from. As Harsh answers them, the answer goes inline and the question is moved to the **Decisions log** at the bottom with a date.
- **Decisions log** is the _only_ place future agents should trust as authoritative. Anything in the other docs marked DISCUSSING / TENTATIVE / OPEN is provisional.

---

## Open questions — by priority

### Highest priority (blocks any forward motion)

1. **[01] Confirm yesterday's incident root cause.** Was it the orders-data-context.tsx file, or somewhere else? What was the symptom?
2. **[02] How big is the type debt?** Concrete number from `tsc --noEmit` is needed before we can size Phase 0. **Action:** un-stub typecheck briefly, run it, count errors, decide. Could be 50 errors or 5,000.
3. **[06] What's in `AGENT_PROMPT.md` today?** Required before we can update it with the gate requirement.
4. **[06] Is there a husky / pre-commit setup already?** Determines whether we add or extend.
5. **[02] What does the existing CI run?** `cloudbuild.yaml` and `buildspec.aws.yaml` exist — what's gated there today?

### High priority (shapes the strategy)

6. **[01] How many agents in parallel typically?** 2-3 or 5-10? Affects gate concurrency design.
7. **[01] What was the symptom of yesterday's bug?** Runtime crash, blank widget, wrong data, layout? Affects which test layer would have caught it.
8. **[04] How much do hooks depend on FastAPI mock vs local fixtures?** OrdersDataContext imports both — why? Is one canonical?
9. **[04] What is the FastAPI mock's role long-term?** Will local fixtures go away once it's mature, or are both kept indefinitely?
10. **[06] Tolerance for slow gates?** 3 / 5 / 10 minutes per agent task?
11. **[06] Branch strategy** — OK to switch to per-task feature branches or stay single-branch?

### Medium priority (refine the design but don't block start)

12. **[01] Are any tabs/widgets considered "locked, never touch"?** Influences stability ledger design.
13. **[02] Which lockfile is canonical**, `pnpm-lock.yaml` or `package-lock.json`?
14. **[02] What does `END_TO_END_STATIC_TIER_ZERO_TESTING.md` already document?** May obsolete some of our planning.
15. **[03] Layer D fixture story** — does the harness use real provider stack or a stripped one? How are entitlements faked?
16. **[03] Inventory of `*-data-context.tsx` files** — how many exist? Affects Layer C scope.
17. **[04] Backend ETA?** Mock-only for 1 month or 6 months? Affects investment in mock fixture infrastructure.
18. **[05] Do you ever ship pieces of UI independently?** Confirms "no split" is correct.
19. **[05] Are agents hitting actual file-level conflicts** today, or only silent regressions?

### Low priority (defer until after Phase 0)

20. **[03] Visual regression confirmed deferred?** (Implicit yes from conversation.)
21. **[03] Storybook confirmed skipped?** (Tentative yes — Layer D supersedes.)
22. **[06] Smart test selection** — start with full gate or aim for smart selection from day 1?
23. **[04] OpenAPI generation flow** — who updates `lib/registry/openapi.json`, when, and how?

---

## Decisions log (timestamped, authoritative)

### 2026-04-15

- **DECIDED:** `lint` and `typecheck` scripts in [package.json](../../package.json) are stubbed to no-ops. This is the load-bearing root cause of the regression problem. _(Source: 02_codebase_facts.md)_
- **DECIDED:** Seven boss-points canonical, captured in [boss_points.md](boss_points.md). Earlier docs (01, 03, 04, 06) marked STALE pending revision after boss-point discussions. _(Source: boss_points.md)_
- **DECIDED:** Boss-point discussion order is BP-1 → BP-2 → BP-7 → BP-4+BP-5 → BP-6, with BP-3 absorbed as a design constraint on the test framework. BP-1 moved to first (from originally-proposed 4th) because this team is agent-primary: Harsh + Ikenna mostly review UI, not code, so docs ARE the specification for agents. A stale/missing doc actively misleads every agent session. _(Source: boss_points.md "Proposed discussion order" table, revised after Harsh's pushback on 2026-04-15)_
- **TENTATIVE:** Do not split the repo into Nx/Turborepo packages. Rationale captured in [05_repo_structure_question.md](05_repo_structure_question.md). Final pending Harsh confirming open questions 18 and 19.
- **TENTATIVE:** Backend not being ready is NOT a blocker for any of the proposed test layers — they all work against mocks. _(Source: 04_mock_data_and_backend_gap.md)_
- **TENTATIVE:** Layer A (un-stub typecheck + lint) is the highest-leverage first action. Cannot proceed sensibly without it.
- **TENTATIVE:** Visual regression and Storybook are out of scope for now.
- **TENTATIVE:** BP-1 will be split into two parallel streams when we start it: (a) doc hygiene — fast, mechanical inventory of existing UI docs with keep/archive/update calls; (b) target-state brain-dump — Harsh writes down what trading should look like, kept minimal where unclear per Harsh's instinct. Stream (a) can run while Harsh focuses on stream (b).

---

## How to update this doc

- When Harsh answers a question, paste the answer inline in italics under the question, then move the question into the Decisions log with the date.
- When a decision is upgraded from TENTATIVE to FINALIZED, update the marker and copy it to a "FINALIZED" subsection so it's findable.
- When a new question comes up in any other doc, add it here with a [01]/[02]/etc. tag pointing to the source doc.
- Don't delete answered questions — moving them to the log preserves history.
