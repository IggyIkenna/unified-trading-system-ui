# Root Structure Cleanup

Working audit of root-level clutter. Check each item before acting — some have non-obvious dependencies.

---

## Critical (requires careful auditing before touching)

### 1. Duplicate test runners — Jest vs Vitest

- `jest.config.js`, `jest.setup.js`, `jest-dom.d.ts` ← Jest
- `vitest.config.ts` ← Vitest (workspace standard per rules)
- `__tests__/` ← likely Jest
- `tests/` ← likely Vitest

**Decision needed:** Confirm which runner is active (`package.json` `test` script). Delete the other runner's config + directory entirely. Do not keep both.

- [ ] Check `package.json` scripts to confirm active runner
- [ ] Grep `__tests__/` files for `describe`/`it` — confirm Jest syntax
- [ ] Grep `tests/` files — confirm Vitest syntax
- [ ] Delete inactive runner's config files
- [ ] Consolidate test directories into one

---

### 2. Duplicate lockfiles — npm vs pnpm

- `package-lock.json` ← npm
- `pnpm-lock.yaml` ← pnpm

**Decision needed:** Only one package manager should be in use. Check CI scripts and `package.json` to confirm which is authoritative. Delete the stale one and add it to `.gitignore`.

- [ ] Check `.github/` workflows + `scripts/setup.sh` for which manager CI uses
- [ ] Check `package.json` `packageManager` field if present
- [ ] Delete stale lockfile
- [ ] Add stale lockfile pattern to `.gitignore`

---

### 3. Three Playwright configs

- `playwright.config.ts`
- `playwright.e2e.config.ts`
- `playwright.static.config.ts`

**Decision needed:** Check what each config targets (baseURL, reporter, test dir). Likely can be consolidated into one config with [projects](https://playwright.dev/docs/test-configuration#projects). Ensure `npm run smoketest` still works after consolidation.

- [ ] Read each config and document what differs
- [ ] Consolidate into `playwright.config.ts` with named projects or env flags
- [ ] Delete the other two

---

### 4. `archive/` directory

Contains: `archive/components`, `archive/ml`, `archive/services`

Workspace rule: **delete deprecated code, don't archive it.** Safe rollback = git history.

- [ ] Confirm nothing in `archive/` is imported anywhere (`grep -r "from.*archive"`)
- [ ] Delete the entire `archive/` directory

---

### 5. Two scripts directories

- `.scripts/` — contains only `verify.sh`
- `scripts/` — main scripts directory

- [ ] Check if `verify.sh` is referenced in CI, `package.json`, or pre-commit hooks
- [ ] Move `verify.sh` into `scripts/` if used, delete if not
- [ ] Remove `.scripts/`

---

## Medium (lower risk, cleaner to fix)

### 6. AI/agent files at root

These don't belong in the repo root:

- `AGENT_PROMPT.md`
- `START_HERE.md`
- `V0_SYSTEM_PROMPT.txt`
- `UI_STRUCTURE_MANIFEST.json`

- [ ] Move `AGENT_PROMPT.md` and `START_HERE.md` to `docs/`
- [ ] Move or delete `V0_SYSTEM_PROMPT.txt` (check if still used)
- [ ] Move `UI_STRUCTURE_MANIFEST.json` to `docs/` or regenerate it on-demand

---

### 7. Build/test artifacts that may be tracked in git

- `tsconfig.tsbuildinfo`
- `coverage/`
- `playwright-report/`
- `test-results/`

- [ ] Check `.gitignore` — are these already excluded?
- [ ] Add any missing entries to `.gitignore`
- [ ] Delete local copies if committed by mistake

---

### 8. Deployment configs at root

Three different cloud targets mixed at root:

- `cloudbuild.yaml` (GCP)
- `buildspec.aws.yaml` (AWS)
- `firebase.json` + `.firebase/` (Firebase)
- `nginx.conf`

- [ ] Determine which cloud target is active/in-use
- [ ] Consider moving all into `deploy/` or `infra/` subdirectory
- [ ] If AWS or Firebase is no longer active, delete those configs

---

### 9. `issues.md` at root

A dev note file — not a valid doc type. Delete or move content into a GitHub issue.

- [ ] Read content, open GitHub issue if still relevant, then delete file

---

## Minor (low risk, do last)

### 10. Two ESLint configs

- `eslint.config.base.js` — base rules
- `eslint.config.mjs` — extends base

This pattern is fine but `eslint.config.base.js` could live in a `config/` folder to reduce root noise. Low priority.

- [ ] Decide if worth moving (breaks nothing either way)

---

### 11. Five `.env.*` files

- `.env.example`, `.env.integration`, `.env.local`, `.env.preview`, `.env.production`

Standard Next.js pattern — acceptable. Just verify `.env.local` is in `.gitignore`.

- [ ] Confirm `.env.local` is gitignored
- [ ] Confirm `.env.production` doesn't contain real secrets

---

## Quick wins (do these first, no audit needed)

- [ ] Delete `issues.md`
- [ ] Verify `.gitignore` covers `tsconfig.tsbuildinfo`, `coverage/`, `playwright-report/`, `test-results/`
- [ ] Move `AGENT_PROMPT.md`, `START_HERE.md`, `V0_SYSTEM_PROMPT.txt` to `docs/`
