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

Current state: `__tests__/` (old Jest), `tests/` (Vitest), `e2e/` (Playwright) — three locations.

**DECIDED: Single `tests/` folder with `e2e/` nested inside.**

```
tests/
  unit/         ← Vitest: component/function unit tests
  integration/  ← Vitest: API/store/hook integration tests
  audit/        ← Vitest: existing audit tests
  e2e/          ← Playwright: moved from root e2e/
```

**On test output artifacts (`test-results/`, `coverage/`, `playwright-report/`):**
These are generated OUTPUT, not source — they must NOT live inside `tests/`. They stay gitignored at root (or wherever the tool drops them). Do not move them.

**What needs updating after the move:**

- All three Playwright configs: `testDir: "./e2e"` → `testDir: "./tests/e2e"`
- `playwright.static.config.ts` `globalSetup` path if it references `./e2e/warmup.setup.ts`
- `vitest.config.ts` `include` paths to match new layout

**Actions (when instructed):**

- [ ] Create `tests/unit/`, `tests/integration/`, `tests/audit/`, `tests/e2e/`
- [ ] Move `e2e/` content → `tests/e2e/`
- [ ] Move existing `tests/` content into appropriate subdirs
- [ ] Migrate valid `__tests__/` content → `tests/unit/` or `tests/integration/`
- [ ] Update all three Playwright configs: `testDir` + any path references
- [ ] Update `vitest.config.ts` include paths
- [ ] Delete `__tests__/` and root `e2e/` once migrated

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

### 9. Build/test output artifacts

- `tsconfig.tsbuildinfo`, `coverage/`, `playwright-report/`, `test-results/`

These are generated output — must be gitignored, not committed.

**Actions (when instructed):**

- [ ] Check `.gitignore` — confirm which are already excluded
- [ ] Add any missing entries
- [ ] Delete local copies if accidentally committed

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

When ready to execute, do in this order to avoid compounding breakage:

1. **Lockfile + `setup.sh`** (item 4) — isolated, low risk
2. **Delete Jest files** (item 3) — isolated, no deps
3. **`src/` migration** (item 1) — biggest change, do standalone with full build verify
4. **Test folder consolidation** (item 2) — after `src/` is stable
5. **Gitignore + artifact cleanup** (item 9) — quick housekeeping
6. **AI files + `issues.md`** (items 8, 11) — trivial moves
7. **Deployment configs** (item 10) — after confirming active target
