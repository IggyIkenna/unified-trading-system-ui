# Root Structure Cleanup

Working audit of root-level clutter. Decisions logged below each item. Do not execute until explicitly instructed.

---

## Critical

### 1. Move source code into `src/`

Currently `app/`, `components/`, `hooks/`, `lib/`, `styles/`, `context/` all sit at root alongside config files — hard to tell source from config at a glance.

**DECIDED: Move all source code into `src/`.**

- `public/` stays at root — Next.js hard-requires it there, no exceptions.
- `tests/` stays at root — it's not source code, it's a peer concern.
- Everything else (`app/`, `components/`, `hooks/`, `lib/`, `styles/`, `context/`) moves to `src/`.
- **Do this before thousands of new tests are written** — all new tests will import from `@/components/...` etc. and migrating path aliases after the fact is 10x more work.

**What needs updating after the move:**

- `tsconfig.json` — `paths` aliases (`@/*` → `./src/*`)
- `next.config.mjs` — confirm Next.js picks up `src/app/` (it does automatically if `src/app/` exists)
- `vitest.config.ts` — update any root-relative includes
- `components.json` (shadcn) — `aliases.components`, `aliases.utils` paths
- Any hardcoded relative imports that skip the alias (e.g., `../../lib/utils`)

**Actions (when instructed):**

- [ ] Move `app/`, `components/`, `hooks/`, `lib/`, `styles/`, `context/` → `src/`
- [ ] Update `tsconfig.json` path aliases
- [ ] Update `components.json` shadcn aliases
- [ ] Update `vitest.config.ts` include/exclude paths
- [ ] Verify `next.config.mjs` picks up `src/app/` correctly
- [ ] Run `tsc --noEmit` + `pnpm build` to confirm nothing broke

---

### 2. Centralize all tests under `tests/`

Current state: `__tests__/` (Vitest, 34 files), `tests/` (Vitest, 1 file — `api.integration.test.ts` from PM SSOT template), `e2e/` (Playwright, 42 files) — three locations.

**DECIDED: Single `tests/` folder with `e2e/` nested inside.**

```
tests/
  unit/         ← Vitest: component/function unit tests
  integration/  ← Vitest: API/store/hook integration tests
  audit/        ← Vitest: existing audit tests
  e2e/          ← Playwright: moved from root e2e/
  helpers/      ← shared utilities (persona-wrapper.tsx, test-wrapper.tsx)
```

**On test output artifacts (`test-results/`, `coverage/`, `playwright-report/`):**
These are generated OUTPUT, not source — they must NOT live inside `tests/`. They route into `build-artifacts/` (see item 9). Gitignored.

**What needs updating after the move:**

- All three Playwright configs: `testDir: "./e2e"` → `testDir: "./tests/e2e"`
- `playwright.static.config.ts` `globalSetup` path if it references `./e2e/warmup.setup.ts`
- `vitest.config.ts` `include` paths to match new layout

**Actions (when instructed):**

- [ ] Create `tests/unit/`, `tests/integration/`, `tests/audit/`, `tests/e2e/`, `tests/helpers/`
- [ ] Move `e2e/` content → `tests/e2e/`
- [ ] Move existing `tests/` content into appropriate subdirs
- [ ] Migrate valid `__tests__/` content → `tests/unit/` / `tests/integration/` / `tests/audit/` / `tests/helpers/`
- [ ] Update all three Playwright configs: `testDir` + any path references
- [ ] Update `vitest.config.ts` include paths
- [ ] Delete `__tests__/` and root `e2e/` once migrated

---

### 2a. Test audit findings (gates Phase C of execution)

Audit run 2026-04-17. Vitest: **34 test files, 6 failing, 273 tests passing / 50 failing**.

**Decisions per failing file (delete recent-broken, update salvageable):**

| File                                                                             | Age (git log) | Decision                 | Reason                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------- | ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `__tests__/components/strategy-platform/active-lp-dashboard.test.tsx`            | 2026-04-16    | **Delete**               | Created yesterday in commit `9011f6f`; broken by concurrent `StrategiesDataProvider` refactor. Shallow smoke test.                                                                                                |
| `__tests__/components/strategy-platform/commodity-regime-dashboard.test.tsx`     | 2026-04-16    | **Delete**               | Same commit, same cause.                                                                                                                                                                                          |
| `__tests__/components/strategy-platform/enhanced-basis-dashboard.test.tsx`       | 2026-04-16    | **Delete**               | Same commit, same cause.                                                                                                                                                                                          |
| `__tests__/components/strategy-platform/events-feed-dashboard.test.tsx`          | 2026-04-16    | **Delete**               | Same commit, same cause.                                                                                                                                                                                          |
| `__tests__/components/strategy-platform/lending-protocol-arb-dashboard.test.tsx` | 2026-04-16    | **Delete**               | Same commit, same cause.                                                                                                                                                                                          |
| `__tests__/components/strategy-platform/liquidation-monitor-dashboard.test.tsx`  | 2026-04-16    | **Delete**               | Same commit, same cause.                                                                                                                                                                                          |
| `__tests__/audit/static-marketing-pages.test.ts`                                 | 2026-04-17    | **Update (1 assertion)** | 18/19 pass. Only `"advisory agreement"` / `"AR appointment"` check drifted vs current `regulatory.html` copy. Update test to match current copy. Real value — covers FCA ref 975797, brand, no-stale-venue-count. |

**Replacement coverage (write new properly-wrapped tests):**

The 6 strategy-platform widgets are production code — deletion leaves a coverage gap. Write new tests that wrap widgets in `StrategiesDataProvider` (using `__tests__/helpers/test-wrapper.tsx` harness pattern) with mocked strategies data. Prioritise by production traffic, not all 6 mechanically.

**Actions (when instructed):**

- [ ] Update `static-marketing-pages.test.ts` regulatory-page assertion to match current copy
- [ ] Delete 6 `__tests__/components/strategy-platform/*.test.tsx` files
- [ ] Write replacement tests with `StrategiesDataProvider` wrapper (scope TBD per widget priority)
- [ ] Verify `pnpm test -- --run` exits 0 after cleanup

---

### 3. Duplicate test runners — Jest vs Vitest

**DECIDED: Keep Vitest, delete Jest.**

- `package.json` `test` = `vitest`. CI runs `pnpm test:ci` = vitest. Workspace rules mandate Vitest.
- Jest and Vitest are API-compatible — no test rewrites needed.

**Actions (when instructed):**

- [ ] Delete `jest.config.js`, `jest.setup.js`, `jest-dom.d.ts`
- [ ] Confirm `__tests__/` has no Vitest-valid tests before deleting (done during item 2 migration)

---

### 4. Duplicate lockfiles — npm vs pnpm

**DECIDED: pnpm is canonical. Delete `package-lock.json`.**

- CI uses `pnpm/action-setup@v2` + `pnpm install --frozen-lockfile`.
- `package-lock.json` is stale and misleading.

**Also: `setup.sh` calls `npm install` — must be updated to pnpm.**

- `setup.sh` is a PM SSOT template. Fix locally first, then flag for PM propagation.

**Actions (when instructed):**

- [ ] Delete `package-lock.json`
- [ ] Add `package-lock.json` to `.gitignore`
- [ ] Update `scripts/setup.sh`: `npm install --silent --legacy-peer-deps` → `pnpm install --frozen-lockfile`
- [ ] Flag PM SSOT codex template for same change

---

### 5. Three Playwright configs

- `playwright.config.ts` (36 lines) — full E2E, spins up API + UI via `webServer`, baseURL 3000, retries=2, html+json reporter
- `playwright.e2e.config.ts` (20 lines) — no webServer, baseURL env-var default 3100, serial workers, minimal reporter
- `playwright.static.config.ts` (41 lines) — no webServer, baseURL 3100, `globalSetup`, `testMatch` whitelist for 3 tier-0 specs

**DECIDED: Keep three separate configs — consolidating into one with `projects` needs conditional logic (which `webServer` runs, which `testMatch` applies) and obscures the three intentionally-different run modes. Three thin files invoked by explicit `--config=` flags is clearer than one file with mode branching.**

**BUT extract shared base to DRY up ~10 duplicated lines** (chromium project def, `forbidOnly`, `use.trace`/`screenshot`). Each config then spreads `...baseConfig`.

**Phase D + E both touch all three configs:**

- **Phase D** (item 2): `testDir: "./e2e"` → `"./tests/e2e"` × 3 configs, and `globalSetup: "./e2e/warmup.setup.ts"` → `"./tests/e2e/warmup.setup.ts"` in `playwright.static.config.ts`
- **Phase E** (item 9): `reporter` output paths + `outputDir` → `build-artifacts/*` × 3 configs

**Actions (when instructed):**

- [x] Phase D: update `testDir` in all three configs (+ `globalSetup` in static)
- [x] Phase E: update `reporter` + `outputDir` in all three configs
- [ ] Phase E.1 (optional, after D+E verified): extract `playwright.base.config.ts` with shared chromium project + `forbidOnly` + base `use` block; all three configs spread it

---

### 6. `archive/` directory

**DECIDED: Keep intentionally.**

- Nothing imports from it (confirmed by grep).
- Retained as reference for components that may be brought back — last iterated version not easily recoverable from git history.

**Actions: None.**

---

### 7. `.scripts/` directory

**DECIDED: Already deleted by user.** ✓

---

## Medium

### 8. AI/agent files at root

- `AGENT_PROMPT.md`
- `START_HERE.md`
- `V0_SYSTEM_PROMPT.txt`
- `UI_STRUCTURE_MANIFEST.json`

**DECIDED: Defer — handle after `src/` migration and test consolidation are complete.**

- [ ] Check references in CI/scripts/cursor rules
- [ ] Move to `docs/` or delete per findings

---

### 9. Build/test output artifacts → route into `build-artifacts/`

Current: `tsconfig.tsbuildinfo`, `coverage/`, `playwright-report/`, `test-results/` all land at repo root — polluting the top-level listing and making it hard to tell source from generated output.

**DECIDED: Route ALL generated test/build output into single `build-artifacts/` folder.**

```
build-artifacts/
  coverage/           ← vitest coverage (istanbul/v8 reports)
  playwright-report/  ← playwright HTML reporter output
  test-results/       ← playwright trace / screenshots / videos
  tsbuildinfo         ← tsc incremental build info
```

**What needs updating:**

- `vitest.config.ts` — `test.coverage.reportsDirectory: "./build-artifacts/coverage"`
- `playwright.config.ts` + `playwright.e2e.config.ts` + `playwright.static.config.ts`:
  - `outputDir: "./build-artifacts/test-results"` (trace/screenshots)
  - `reporter: [["html", { outputFolder: "./build-artifacts/playwright-report", open: "never" }]]`
- `tsconfig.json` — `compilerOptions.tsBuildInfoFile: "./build-artifacts/tsbuildinfo"`
- `.gitignore` — add `/build-artifacts/` (replace individual entries for coverage/, playwright-report/, test-results/, tsconfig.tsbuildinfo)
- `next.config.mjs` — verify `.next/` isn't redirected (keep `.next/` as-is; it's a Next.js convention and separate concern)

**Actions (when instructed):**

- [x] Update configs to emit into `build-artifacts/` (vitest.config.ts, 3 playwright configs, tsconfig.json)
- [x] Replace gitignore entries with `/build-artifacts/`
- [x] Move stale root-level `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo` into `build-artifacts/` (none were tracked — git-clean after move)
- [x] Verified: `pnpm exec vitest list` discovers tests, `tsc --noEmit` emits to `build-artifacts/tsbuildinfo`, `playwright test --list` succeeds on both static (122 tests) and e2e (568 tests) configs

---

### 10. Deployment configs at root

- `cloudbuild.yaml` (GCP Cloud Build)
- `buildspec.aws.yaml` (AWS CodeBuild)
- `firebase.json` + `.firebase/` (Firebase)
- `nginx.conf`

**DECIDED: Keep all — project is intentionally multi-cloud.**

**Actions: None.**

---

### 11. `issues.md` at root

**Decision needed:** Read content — open a GitHub issue if still relevant, then delete.

- [ ] Review and delete

---

## Minor (do last)

### 12. Two ESLint configs

- `eslint.config.base.js` + `eslint.config.mjs` (extends base)

Fine as-is. Low priority.

---

### 13. Five `.env.*` files

Standard Next.js pattern — acceptable.

- [ ] Confirm `.env.local` is gitignored
- [ ] Confirm `.env.production` has no real secrets

---

## Recommended execution order

Phased. Each phase = one commit. Do not batch phases.

1. **Phase A — Lockfile + `setup.sh`** (item 4) — isolated, low risk
2. **Phase B — Delete Jest files** (item 3) — isolated, no deps
3. **Phase C — Test audit actions** (item 2a) — delete 6 stale strategy-platform tests, fix 1 drifted assertion in `static-marketing-pages.test.ts`. Makes test suite green before moving anything.
4. **Phase D — Test folder consolidation** (item 2) — `__tests__/` + `tests/` + `e2e/` → unified `tests/{unit,integration,audit,e2e,helpers}/`. Requires Phase C (don't move broken tests).
5. **Phase E — Test/build output routing** (item 9) — route outputs into `build-artifacts/`, update `.gitignore`
6. **Phase F — `src/` migration** (item 1) — biggest change, standalone commit with full `tsc --noEmit` + `pnpm build` verify. Deferred until after test suite + outputs are clean, so any import breakage surfaces in a clean test run.
7. **Phase G — AI files + `issues.md`** (items 8, 11) — trivial moves
8. **Phase H — Deployment configs** (item 10) — after confirming active target

**Why this order (diff from earlier draft):**

- Phase C moved up: green tests before consolidation. Moving a broken test suite obscures which failures are from moves vs existing.
- Phase E moved before Phase F: clean output folders make post-`src/` verification readable.
- Phase F (`src/` migration) deferred: was originally Phase 3, but with fresh evidence that recent refactors (widget providers) produced fragile tests, doing `src/` _after_ test cleanup lets us re-verify imports against a stable suite.

---

## Follow-ups surfaced during Phases A–E

Items flagged while executing the phased refactor but not part of the original item list. Track here so they're not lost.

### FU-1. PM SSOT `setup.sh` template — npm → pnpm propagation

- `scripts/setup.sh` in this repo was rewritten in Phase A to use `pnpm install --frozen-lockfile` instead of `npm install`.
- The source-of-truth template lives in `unified-trading-pm/codex/` and is rolled out to all repos via `rollout-quality-gates-unified.py` (or the equivalent setup-template rollout script).
- **Risk:** next template rollout will overwrite this repo's `setup.sh` back to `npm`.
- [ ] Update the codex setup-template SSOT to reflect pnpm for UI repos (or carve a UI-specific template), then re-roll.

### FU-2. Broken `test:unit` / `test:integration` / `test:audit` scripts

`package.json` declares:

```json
"test:unit": "vitest --project unit",
"test:integration": "vitest --project integration",
"test:audit": "vitest --project audit",
```

But `vitest.config.ts` has no `projects` array — these flags reference nothing. The scripts fail with "No matching projects found."

**Two options:**

- (A) Declare `test.projects` in `vitest.config.ts` with entries for `unit` (`tests/unit/**`), `integration` (`tests/integration/**`), `audit` (`tests/audit/**`).
- (B) Replace the `--project` flag with a directory filter: `vitest tests/unit`, etc.

- [ ] Pick A or B; fix scripts so `pnpm test:unit` etc. work.

### FU-3. Replacement coverage for 6 deleted strategy-platform widget tests

Phase C deleted 6 strategy-platform dashboard tests (1-day-old shallow smoke tests broken by concurrent `StrategiesDataProvider` refactor). Per audit, they provided no meaningful coverage.

Widgets needing fresh coverage (in priority order TBD per production traffic):

- `active-lp-dashboard`
- `commodity-regime-dashboard`
- `enhanced-basis-dashboard`
- `events-feed-dashboard`
- `lending-protocol-arb-dashboard`
- `liquidation-monitor-dashboard`

- [ ] Write new integration tests with proper `StrategiesDataProvider` wrapper (use `tests/helpers/test-wrapper.tsx`).
- [ ] Scope per widget — don't re-create as shallow smoke tests.

### FU-4. Stale doc references to `__tests__/` and `e2e/`

Phase D moved tests to `tests/{unit,integration,audit,e2e,helpers}/` but these docs still point at the old paths:

- `docs/initial-boss/02_codebase_facts.md`
- `docs/initial-boss/03_test_strategy_options.md`
- `docs/under-review/FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md`

- [ ] Grep for `__tests__/` and `^e2e/` in `docs/`; update to `tests/...` paths.
