# Task 11 — Split Oversized Files

**Source:** Audit `11-CODE-ORG-AUDIT.md`
**WORK_TRACKER:** §11 (Code Org)
**Priority:** P0 — unblocks all other refactors

---

## Goal

Split all hand-written files over 900 lines into smaller, single-responsibility modules. After this task, no hand-written file exceeds 900 lines, every split preserves existing functionality, and all imports are updated.

---

## Scope

**37 files over 900 lines.** Exclude generated/data-registry files that are not hand-maintained UI:
- `lib/types/api-generated.ts` (18k lines — codegen, not our problem)
- `lib/strategy-registry.ts` (7.5k lines — static registry data, split only if beneficial)

**Split into groups by area. Each group can be given to a separate agent.**

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

### Group C — Mock Data Files (6 files, ~12.6k lines)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `lib/api/mock-handler.ts` | 4459 | Split by domain: `lib/api/mock-handlers/trading.ts`, `research.ts`, `data.ts`, `ops.ts`, etc. Keep `mock-handler.ts` as aggregator that imports and registers all. |
| `lib/ml-mock-data.ts` | 2907 | Move to `lib/mocks/fixtures/ml/`. Split by entity: models, training-runs, experiments, metrics. |
| `lib/build-mock-data.ts` | 2595 | Move to `lib/mocks/fixtures/build/`. Split by entity. |
| `lib/data-service-mock-data.ts` | 2452 | Move to `lib/mocks/fixtures/data-service/`. Split by entity. |
| `components/promote/mock-data.ts` | 1684 | Move to `lib/mocks/fixtures/promote/`. |
| `components/trading/sports/mock-data.ts` | 1555 | Move to `lib/mocks/fixtures/sports/`. |

**Note:** Mock data splits overlap with Task 05 (Mock Data Centralization). For this task, focus on file-size splits and moving to `lib/mocks/`. Full schema alignment is Task 05.

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

### Group E — Dashboards (4 files, ~4.9k lines)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `components/dashboards/quant-dashboard.tsx` | 1416 | Extract: each dashboard section/card group → `components/dashboards/quant/`. |
| `components/dashboards/risk-dashboard.tsx` | 1294 | Same pattern → `components/dashboards/risk/`. |
| `components/dashboards/devops-dashboard.tsx` | 1164 | Same pattern → `components/dashboards/devops/`. |
| `components/dashboards/audit-dashboard.tsx` | 1001 | Same pattern → `components/dashboards/audit/`. |

### Group F — Remaining (5+ files)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `lib/reference-data.ts` | 1369 | Split by domain: venues, instruments, currencies, etc. |
| `lib/taxonomy.ts` | 1110 | Split by taxonomy category. |
| `lib/trading-data.ts` | 1086 | Split by entity: positions, orders, alerts. |
| `components/research/features/feature-dialogs.tsx` | 1041 | Extract each dialog into its own file. |
| `app/(platform)/services/research/ml/components/run-analysis-sections.tsx` | 1057 | Split by section type. |
| `lib/strategy-platform-mock-data.ts` | 937 | Move to `lib/mocks/fixtures/strategy/`. |
| `components/trading/context-bar.tsx` | 916 | Extract sub-panels. |
| `lib/lifecycle-mapping.ts` | 911 | Extract route-mappings data into separate file from logic. |

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

- [ ] Zero hand-written files over 900 lines (excluding `api-generated.ts` and `strategy-registry.ts`)
- [ ] `pnpm typecheck` passes (no new type errors)
- [ ] App loads and renders correctly on `pnpm dev`
- [ ] All imports updated — `rg` for old component names shows zero orphaned imports
- [ ] No re-export shims left in original files

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
