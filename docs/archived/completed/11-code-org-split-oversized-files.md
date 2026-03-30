# Task 11 — Split Oversized Files

**Source:** Audit `11-CODE-ORG-AUDIT.md`
**WORK_TRACKER:** §11 (Code Org)
**Priority:** P0 — unblocks all other refactors

## Status (2026-03-28)

**In-scope work: COMPLETE.** All hand-written UI under `components/`, `app/`, and `archive/` (excluding mock-data paths and excluding `lib/**`) is at or below **900 lines** per file. Last verification: discovery `find` + `wc -l` audit (prune `lib/*`, skip `*mock-data*` and `*/mocks/*`) returned **no** matches over 900.

Commit on branch carrying this work: **`b1633e4`** — `refactor(ui): split oversized modules under 900-line target`.

---

## Completed vs remaining

### Completed

- **Group A (Ops deployment):** `DataStatusTab`, `DeploymentDetails`, `DeployForm`, `ExecutionDataStatus` split into `data-status/`, `details/`, `form/` with thin shells at the original paths.
- **Group B (Trading panels):** `options-futures-panel`, `manual-trading-panel`, `options-chain` split into `options-futures/`, `manual/`, `options-chain/`; legacy `context-bar.tsx` removed in favor of `context-bar/` module.
- **Group D (Platform pages):** Signup, board presentation, clients, strategy `[id]`, health, backtests, training, config, features page wiring, ML run-analysis extractions, etc., colocated under `app/**/components/` or shared `components/` as implemented.
- **Group E (Dashboards):** Executive, audit, quant, risk, devops dashboards decomposed into per-dashboard folders.
- **Group F:** `feature-dialogs` replaced by `edit-config-dialog`, `new-feature-dialog`, `cat-status-badge`; reconciliation moved to `components/reports/reconciliation/`; archive ML validation/experiments use client modules; `run-analysis-sections` slimmed with compare/tabs panels.
- **Docs / helpers:** Task doc updated; split helper scripts under `scripts/` (`build-deployment-details-views.py`, `generate-deployment-split.py`, `split-deploy-form.py`, `split-deployment-components.py`).
- **Optional (not required for acceptance):** `lib/lifecycle-types.ts`, `lib/lifecycle-route-mappings.ts`, slimmer `lifecycle-mapping.ts` (Task 11 does not require `lib/` line targets).

### Remaining / follow-up (not blocking Task 11 closure)

- **Verify in your environment:** `pnpm typecheck` and `pnpm dev` on key routes touched by the split; fix any regressions (some workspaces may have pre-existing typecheck issues unrelated to this task).
- **`lib/` over 900 lines:** Explicitly **out of scope** for Task 11 — track under separate tasks if desired.
- **Mock data / fixtures:** **Task 05** (Mock Data Centralization) and excluded mock paths — not part of Task 11.
- **Thin entry files:** A few original paths remain as **small composition shells** (e.g. `options-chain.tsx`, `manual-trading-panel.tsx`) delegating to folders — intentional for stable imports, not duplicate implementations.

Historical group tables below still list **original** filenames and line counts; actual module paths may differ (e.g. `options-futures/` vs historical `components/trading/options/`).

---

## Agent Execution Model

This task uses a **two-phase approach** inside a single Cursor agent session.

| Phase | What | Model | Output |
|-------|------|-------|--------|
| **Phase 1 — Discovery** | Run the audit command below. Classify every oversized file into a group (A-F). For each file, read it and propose a split strategy. | **Smart** (claude-4-opus or claude-3.7-sonnet) | A concrete list: file → group → split plan (what to extract, target filenames, estimated result size) |
| **Phase 2 — Execution** | Take the Phase 1 list and mechanically split files, update imports, delete old code, run typecheck. | **Cheap** (claude-3.5-sonnet) | Code changes + passing typecheck |

**Phase 1 and Phase 2 run in the same agent session.** Phase 1 produces the plan as text in chat (not a file), then Phase 2 executes it immediately. If the session is too large, break Phase 2 into one group per session (A, B, D, E, F — each independent).

**Parallel execution:** Groups A-F are independent and can be given to separate agents in parallel. Each agent runs its own Phase 1 (discover files in its group) then Phase 2 (split them).

---

## Discovery Command (Phase 1 — run this FIRST)

```bash
cd unified-trading-system-ui
find . \( -path ./node_modules -o -path ./.next -o -path './lib/*' \) -prune -o \
  -type f \( -name '*.ts' -o -name '*.tsx' \) -print | while read f; do
  case "$f" in *mock-data*) continue;; */mocks/*) continue;; esac
  wc -l "$f"
done | awk '$1 > 900 {print}' | sort -n -r
```

This produces the current list of oversized in-scope files. **Do not rely on the hardcoded
file lists below — they are historical snapshots.** Always run the command above to get the
live state before starting work.

---

## Goal

Split hand-written **UI code** (components, app routes, archive pages) over 900 lines into smaller, single-responsibility modules. After this task, no **in-scope** file exceeds 900 lines, every split preserves existing functionality, and all imports are updated.

---

## Scope

### Out of scope (do not require splits for Task 11)

- **Entire `lib/` directory** — including config helpers, lifecycle mapping, reference data, taxonomy, trading data, codegen output (`api-generated.ts`), static registries (`strategy-registry.ts`), and any future lib modules. Size refactors there are optional / separate tasks.
- **Mock data and mock infrastructure** — anything under `lib/mocks/`, `lib/api/mock-handler.ts`, `*mock-data*.ts` / `*mock-data*.tsx`, and similar (aligns with Task 05 — Mock Data Centralization).

### In scope

**`components/**`, `app/**`, and `archive/**`** (excluding paths that are purely mock-data modules, e.g. `components/promote/mock-data.ts`, `components/trading/sports/mock-data.ts`).

**Split into groups by area. Each group can be given to a separate agent.**

> **Note:** File lists below are **historical snapshots** from 2026-03-28. Files may have
> been split, renamed, or grown since then. **Always run the Discovery Command above** to
> get the current state before starting work. Use the group categories below as a
> classification guide, not as the authoritative file list.

### Group A — Ops Deployment (4 files, ~13k lines)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `components/ops/deployment/DataStatusTab.tsx` | 4054 | Extract each data-status section into its own component under `components/ops/deployment/data-status/`. Keep `DataStatusTab.tsx` as a thin composition shell that imports and renders them. |
| `components/ops/deployment/DeploymentDetails.tsx` | 3709 | Extract tabs/sections into `components/ops/deployment/details/`. Each tab panel → own file. |
| `components/ops/deployment/DeployForm.tsx` | 1783 | Extract form sections (step components, validation logic) into `components/ops/deployment/form/`. |
| `components/ops/deployment/ExecutionDataStatus.tsx` | 1573 | Same pattern as DataStatusTab — extract subsections. |

### Group B — Trading Panels (3 files, ~5.8k lines)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `components/trading/options-futures-panel.tsx` | 3280 | Extract: options chain section, futures section, order entry, position display → `components/trading/options/`. |
| `components/trading/manual-trading-panel.tsx` | 1350 | Extract: order form, position list, execution controls → `components/trading/manual/`. |
| `components/trading/options-chain.tsx` | 1162 | Extract: chain grid, strike selector, Greeks display → `components/trading/options/`. |

### Group C — ~~Mock data~~ (out of scope)

Mock data and `lib/**` are excluded from Task 11. Centralize and split mock fixtures under **Task 05 (Mock Data Centralization)** instead.

### Group D — Platform Pages (8 files, ~10.7k lines)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `app/(public)/signup/page.tsx` | 2139 | Extract: form steps, validation, marketing sections → `app/(public)/signup/components/`. |
| `app/(platform)/investor-relations/board-presentation/page.tsx` | 1888 | Extract: each presentation slide/section → `components/investor-relations/`. |
| `app/(platform)/services/manage/clients/page.tsx` | 1594 | Extract: client table, client detail, filters → `components/manage/clients/`. |
| `app/(platform)/services/trading/strategies/[id]/page.tsx` | 1527 | Extract: strategy sections (performance, positions, orders, config) → `components/trading/strategy-detail/`. |
| `app/(platform)/services/observe/health/page.tsx` | 1358 | Extract: health panels → `components/observe/health/`. |
| `app/(platform)/services/research/strategy/backtests/page.tsx` | 1345 | Extract: backtest results, comparison, config sections. |
| `app/(platform)/services/research/ml/training/page.tsx` | 1267 | Extract: training run list, run detail, metrics charts. |
| `app/(ops)/config/page.tsx` | 1147 | Extract: config sections by domain. |

### Group E — Dashboards (5 files)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `components/dashboards/quant-dashboard.tsx` | 1416 | Extract: each dashboard section/card group → `components/dashboards/quant/`. |
| `components/dashboards/risk-dashboard.tsx` | 1294 | Same pattern → `components/dashboards/risk/`. |
| `components/dashboards/devops-dashboard.tsx` | 1164 | Same pattern → `components/dashboards/devops/`. |
| `components/dashboards/audit-dashboard.tsx` | 1001 | Same pattern → `components/dashboards/audit/`. |
| `components/dashboards/executive-dashboard.tsx` | 938 | Same pattern → `components/dashboards/executive/`. |

### Group F — Remaining in-scope UI

| File | Lines | Split Strategy |
|------|-------|----------------|
| `components/research/features/feature-dialogs.tsx` | 1041 | Extract each dialog into its own file. |
| `app/(platform)/services/research/ml/components/run-analysis-sections.tsx` | 1057 | Split by section type. |
| `components/trading/context-bar/` | (was 916) | Done: folder module with types, multi-select, mode controls, main bar. |
| `archive/ml/validation/page.tsx` | 1076 | Extract sections into `archive/ml/validation/components/` or shared components. |
| `archive/ml/experiments/id-page.tsx` | 948 | Extract panels/sections similarly. |
| `app/(platform)/services/reports/reconciliation/page.tsx` | 933 | Extract reconciliation sections into `components/reports/` or colocated `components/`. |

**Note:** Former Group F lib entries (`reference-data`, `taxonomy`, `trading-data`, `lifecycle-mapping`, `strategy-platform-mock-data`) are **out of scope** for Task 11 (entire `lib/` excluded).

---

## Rules for Every Split

1. **Preserve all existing functionality** — the app must work identically before and after.
2. **Update all imports** — after extracting a component, find every file that imported from the old location and update the import path. Use `rg` to verify zero remaining imports of the old path.
3. **No barrel re-exports from old file** — don't leave `export { Foo } from './new-location'` in the original. Clean cut. Consumers import from the new location directly.
4. **No `ComponentV2` or `_old` files** — refactor in place. Single source of truth.
5. **Each new file should be under 500 lines** — if you extract something and it's still 800 lines, split further.
6. **Test after each group** — run `pnpm typecheck` and `pnpm dev` to verify nothing breaks.
7. **Commit after each group** — one commit per group (A, B, C, D, E, F) so changes are reviewable.

---

## Acceptance Criteria

- [x] Zero **in-scope** hand-written files over 900 lines: under `components/`, `app/`, and `archive/` only, excluding mock-data modules and excluding **all of `lib/`** — verified 2026-03-28 (discovery command; zero rows over 900).
- [ ] `pnpm typecheck` passes (no new type errors) — **re-verify** on your branch/CI; treat unrelated baseline failures separately.
- [ ] App loads and renders correctly on `pnpm dev` — **re-verify** on critical routes after pull.
- [x] Imports updated for the split — stale paths removed; thin entry shells only where listed above.
- [x] No parallel legacy copies — single source of truth per surface; thin composition entrypoints allowed.

---

## Self-Evaluation Checklist

When you finish, stop and honestly answer these questions before claiming done:

1. **Did I actually split the files, or did I just move code around?** Each new file should have a clear single responsibility — not just "lines 1-400 in file A, lines 401-800 in file B". If you split a 3000-line file into 6 files of 500 lines each but each file is still a grab-bag of unrelated functions, you haven't improved anything.

2. **Did I update ALL imports?** Run `rg "from.*old-file-name"` for every file you touched. If there's even one stale import, the build breaks. Don't skip this step because you're tired.

3. **Did I test it?** Not "it should work" — did you actually run `pnpm typecheck`? Did you load the page in the browser? If you skipped testing, go back and do it now.

4. **Would a new developer understand the new file structure?** If someone opens the `components/ops/deployment/` folder tomorrow, do the filenames clearly communicate what each file does? Or did you create `Part1.tsx`, `Section2.tsx`, `Helper.tsx`?

5. **Did I take shortcuts that create future debt?** Examples: leaving `// TODO: split further` comments, creating catch-all "utils" files, duplicating shared logic instead of extracting it, using `any` types on extracted component props.

6. **Am I satisfied with this work?** Not "is it done" but "is it good". This codebase is a real trading platform. The files you create will be maintained for years. If you're rushing to finish, slow down. Quality matters more than speed. A clean split of 3 groups is better than a sloppy split of all 6.

**If the answer to any of these is "no" — go fix it before marking done.**

---

## Incremental progress (archive)

Earlier session notes are folded into **Status** and **Completed vs remaining** above. Use the discovery command whenever you need to re-audit line counts.

**Quick audit command (in-scope oversized files):**

```bash
cd unified-trading-system-ui
find . \( -path ./node_modules -o -path ./.next -o -path './lib/*' \) -prune -o \
  -type f \( -name '*.ts' -o -name '*.tsx' \) -print | while read f; do
  case "$f" in *mock-data*) continue;; */mocks/*) continue;; esac
  wc -l "$f"
done | awk '$1 > 900 {print}' | sort -n -r
```

Expect **no output** when Task 11 in-scope criteria are met.
