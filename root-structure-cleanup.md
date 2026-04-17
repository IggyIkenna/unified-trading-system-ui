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

- `playwright.config.ts` — full E2E, spins up API + UI via `webServer`
- `playwright.e2e.config.ts` — runs against already-running dev server (no webServer)
- `playwright.static.config.ts` — tier 0 static smoke only, specific `testMatch` + `globalSetup`

**DECIDED: Keep all three. Revisit after new test structure is in place.**

- They serve genuinely different purposes, not duplicates.

**Actions: None yet.**

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

- [ ] Update configs to emit into `build-artifacts/`
- [ ] Replace gitignore entries with `/build-artifacts/`
- [ ] Delete any committed local copies (`git rm -r --cached coverage playwright-report test-results tsconfig.tsbuildinfo` if tracked)
- [ ] Run `pnpm test:ci` + `pnpm exec playwright test --list` to confirm outputs land in new folder

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
