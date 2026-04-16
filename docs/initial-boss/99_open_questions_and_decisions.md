# 99 — Open questions & cross-doc decisions log

**Status:** DISCUSSING — this doc is the running ledger
**Last updated:** 2026-04-16

---

## How to use this doc

- **Open questions** are listed by topic with the doc they came from. As Harsh answers them, the answer goes inline and the question is moved to the **Decisions log** at the bottom with a date.
- **Decisions log** is the _only_ place future agents should trust as authoritative. Anything in the other docs marked DISCUSSING / TENTATIVE / OPEN is provisional.

---

## Open questions — by priority

### Highest priority (blocks any forward motion)

1. ~~**[01] Confirm yesterday's incident root cause.**~~ → _Moved to decisions log 2026-04-16._
2. **[02] How big is the type debt?** Concrete number from `tsc --noEmit` is needed before we can size Phase 0. **Action:** un-stub typecheck briefly, run it, count errors, decide. Could be 50 errors or 5,000.
3. **[06] What's in `AGENT_PROMPT.md` today?** Required before we can update it with the gate requirement.
4. **[06] Is there a husky / pre-commit setup already?** Determines whether we add or extend.
5. **[02] What does the existing CI run?** `cloudbuild.yaml` and `buildspec.aws.yaml` exist — what's gated there today?

### High priority (shapes the strategy)

6. ~~**[01] How many agents in parallel typically?**~~ → _Answered implicitly — multiple agents in parallel on non-overlapping files is the normal workflow._
7. ~~**[01] What was the symptom of yesterday's bug?**~~ → _Moved to decisions log 2026-04-16._
8. **[04] How much do hooks depend on FastAPI mock vs local fixtures?** OrdersDataContext imports both — why? Is one canonical?
9. **[04] What is the FastAPI mock's role long-term?** Will local fixtures go away once it's mature, or are both kept indefinitely?
10. **[06] Tolerance for slow gates?** 3 / 5 / 10 minutes per agent task?
11. **[06] Branch strategy** — OK to switch to per-task feature branches or stay single-branch?

### Medium priority (refine the design but don't block start)

12. ~~**[01] Are any tabs/widgets considered "locked, never touch"?**~~ → _No. Everything is in motion. Target-state doc (07) captures priority: common tabs + DeFi = top priority, other strategy tabs = parallelisable agent work._
13. **[02] Which lockfile is canonical**, `pnpm-lock.yaml` or `package-lock.json`?
14. ~~**[02] What does `END_TO_END_STATIC_TIER_ZERO_TESTING.md` already document?**~~ → _Moved to under-review. Describes full tier-zero testing flow — useful reference but not blocking._
15. **[03] Layer D fixture story** — does the harness use real provider stack or a stripped one? How are entitlements faked?
16. **[03] Inventory of `*-data-context.tsx` files** — how many exist? Affects Layer C scope.
17. **[04] Backend ETA?** Mock-only for 1 month or 6 months? Affects investment in mock fixture infrastructure.
18. ~~**[05] Do you ever ship pieces of UI independently?**~~ → _No — single deploy. FINALIZED in 05._
19. ~~**[05] Are agents hitting actual file-level conflicts?**~~ → _No — pain is silent regressions, not conflicts. FINALIZED in 05._

### Low priority (defer until after Phase 0)

20. ~~**[03] Visual regression confirmed deferred?**~~ → _Yes. Confirmed non-goal in 07 § 8._
21. ~~**[03] Storybook confirmed skipped?**~~ → _Yes. Layer D supersedes._
22. **[06] Smart test selection** — start with full gate or aim for smart selection from day 1?
23. **[04] OpenAPI generation flow** — who updates `lib/registry/openapi.json`, when, and how?

---

## Decisions log (timestamped, authoritative)

### FINALIZED

- **FINALIZED (2026-04-16):** Do not split the repo. Single deploy, no file-level conflicts, widget registry provides isolation. _(Source: 05_repo_structure_question.md)_
- **FINALIZED (2026-04-16):** Trading target state — all 8 sections confirmed by Harsh. _(Source: 07_trading_target_state.md)_
- **FINALIZED (2026-04-16):** Three-level entitlement model: whole-tab (`execution-basic` gate) / per-sub-tab (`requiredEntitlement` on `TRADING_TABS`) / per-widget (`requiredEntitlements` on `WidgetDefinition`). "Show + lock, never hide" model. _(Source: 07 § 7)_
- **FINALIZED (2026-04-16):** Data scoping = backend filters by scope (org/client/strategy). Same widget renders for everyone; the data is different. Not widget scoping. _(Source: 07 § 7)_
- **FINALIZED (2026-04-16):** `402 Payment Required` for entitlement failures — must be single-source (one file definition). _(Source: 07 § 7)_
- **FINALIZED (2026-04-16):** Non-goals confirmed: mobile, offline, localization/i18n, white-label UI divergence, non-trading lifecycle tabs, standalone page conversions. _(Source: 07 § 8)_
- **FINALIZED (2026-04-16):** Priority model: common tabs + DeFi = Harsh's attention (top priority), other strategy tabs = parallelisable agent work. _(Source: 07 § 8)_
- **FINALIZED (2026-04-16):** Observe page sharing: `/services/observe/risk` and `/services/observe/alerts` are thin wrappers importing from trading. Keep as-is. _(Source: 07 § 8)_
- **FINALIZED (2026-04-15):** `lint` and `typecheck` scripts in package.json are stubbed to no-ops. This is the load-bearing root cause of the regression problem. _(Source: 02_codebase_facts.md)_
- **FINALIZED (2026-04-15):** Seven boss-points canonical, captured in boss*points.md. Discussion order: BP-1 → BP-2 → BP-7 → BP-4+BP-5 → BP-6, BP-3 absorbed. *(Source: boss*points.md)*

### 2026-04-16 (new)

- **DECIDED:** BP-1 Stream B (target-state brain-dump) is **complete**. All 8 sections in 07_trading_target_state.md confirmed [STABLE].
- **DECIDED:** BP-1 Stream A (doc hygiene) is **complete**. Doc inventory done, active trading docs promoted to `docs/trading/`, stale docs deleted or kept in `docs/under-review/`, ROUTES.md fully updated. Widget catalogue updated with 10 new widgets (124 total).
- **DECIDED:** BP-2 (widget foundation) is **complete**. Foundation audit, 10 widget class audits, cross-tab providers, chrome presets. Artifacts in `docs/audits/BP2-*` and `docs/audits/findings/`.
- **DECIDED:** Former BP-3 (multi-repo/per-layer testing) **removed** — was a design constraint, not a pain point. Useful parts absorbed into BP-3 (audience), BP-4 (tiers), and BP-6 (mock data). Boss-points renumbered from 7 to 6.
- **DECIDED:** New execution order: BP-1 ✓ → BP-2 ✓ → BP-6 (mock data, next) → BP-3+BP-4 (audience+tiers) → BP-5 (dead code). _Superseded 2026-04-16 — see below._
- **DECIDED:** `converstaion.md` (repo-splitting transcript) deleted — decision captured in 05.
- **DECIDED:** 25 stale/output docs deleted from under-review (audit outputs, old plans, stale trackers, unused handbooks).
- **DECIDED:** `01_problem_and_context.md` superseded by boss_points.md + 07.

### 2026-04-16 (roadmap restructure)

- **DECIDED:** Two new boss points added: Per-widget certification pipeline (L0–L6) and Cosmetic & Theming Foundation. Boss-points list expanded from 6 to 8.
- **DECIDED:** BPs renumbered to match execution order. Final numbering: BP-1 ✓ → BP-2 ✓ → BP-3 (widget certification) → BP-4 (cosmetic, parallel) → BP-5 (mock data) → BP-6+BP-7 (audience+tiers) → BP-8 (dead code).
- **DECIDED:** Backend wiring (BP-5, was BP-6) deferred — not ready to jump to it. Widget-level quality (BP-3) comes first.
- **DECIDED:** Entitlement system audit confirms production-ready: 23 entitlements, 7 tiers, show+lock at tab/widget/page levels, all 122 widgets set `requiredEntitlements`. Gap: paper mode not yet exposed in trading UI.
- **DECIDED:** Filter/scoping system audit confirms functional: org/client/strategy cascade filtering works against mock data. Gap: `asOfDatetime` not consumed, `strategyFamilyIds` not fully integrated downstream.
- **DECIDED:** Live/batch modes production-ready. Paper mode 20% done (defined, not wired). Two parallel mode systems (GlobalScope vs ExecutionMode) need consolidation.
- **DECIDED:** Widget functional readiness healthy: zero dead buttons, all 122 widgets set entitlements+availableOn, toast notifications used legitimately. 65+ strategy types have UI support.

### 2026-04-15

- **DECIDED:** `lint` and `typecheck` scripts in [package.json](../../package.json) are stubbed to no-ops. This is the load-bearing root cause of the regression problem. _(Source: 02_codebase_facts.md)_
- **DECIDED:** Seven boss-points canonical, captured in [boss_points.md](boss_points.md). Earlier docs (01, 03, 04, 06) marked STALE pending revision after boss-point discussions. _(Source: boss_points.md)_
- **DECIDED:** Boss-point discussion order is BP-1 → BP-2 → BP-6 → BP-3+BP-4 → BP-5. Former BP-3 removed and absorbed (see 2026-04-16 decisions). _(Source: boss_points.md)_
- **DECIDED:** Backend not being ready is NOT a blocker for any of the proposed test layers — they all work against mocks. _(Source: 04_mock_data_and_backend_gap.md)_
- **DECIDED:** Layer A (un-stub typecheck + lint) is the highest-leverage first action.
- **DECIDED:** Visual regression and Storybook are out of scope for now.
- **DECIDED:** BP-1 split into two parallel streams: (a) doc hygiene, (b) target-state brain-dump. Stream (b) now complete (2026-04-16).

---

## How to update this doc

- When Harsh answers a question, paste the answer inline in italics under the question, then move the question into the Decisions log with the date.
- When a decision is upgraded from TENTATIVE to FINALIZED, move it to the FINALIZED subsection.
- When a new question comes up in any other doc, add it here with a [01]/[02]/etc. tag pointing to the source doc.
- Don't delete answered questions — strikethrough them and note where they were resolved.
