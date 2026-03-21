# QA Gates — Pre-Deploy Verification

**Problem:** Code looks fine during hot-reload dev, but fails at deploy time due to:
- Broken imports/links not caught locally
- Hot reload masking actual compilation errors
- Dependency mismatches (`node_modules` stale)
- TypeScript errors not checked
- Tests passing locally but failing in CI

**Solution:** Run this verification before every PR/deployment. Cold-builds catch what hot-reload hides.

---

## The Full Verification Process

### Step 1: Clean Install (Fresh Dependencies)

```bash
rm -rf node_modules .next
pnpm install
```

**Why:** Hot reload caches old node_modules. Fresh install ensures all deps are correct.

---

### Step 2: Type Check (Catch TypeScript Errors)

```bash
pnpm tsc --noEmit
```

**Why:** TypeScript errors don't stop hot-reload, but they WILL fail at deploy. Catch them before build.

---

### Step 3: Lint

```bash
pnpm lint
```

**Why:** ESLint catches unused imports, missing handlers, prop type issues.

---

### Step 4: Build (Full Production Build)

```bash
pnpm build
```

**Why:** Development build is different from production. This catches:
- Tree-shaking errors
- Dead code elimination issues
- Minification breakage
- Asset pipeline problems

**Success = zero errors, zero warnings.**

---

### Step 5: Unit & Integration Tests

```bash
pnpm test
```

**Why:** Tests run against fresh code, not hot-reload cache.

---

### Step 6: Smoke Test Routes (Manual or Automated)

If you have a smoke test suite:

```bash
pnpm test:smoke
# or check specific critical routes:
# GET / → 200
# GET /login → 200
# GET /dashboard → 200 (with mock auth)
# GET /service/overview → 200 (with mock auth)
```

**Why:** Routing, navigation, and component mounting can break silently in TypeScript.

---

## TL;DR: The Script

One-liner:

```bash
pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test
```

---

## When to Run

- ✅ **Before every PR** (after you think you're "done")
- ✅ **Before deployment to staging/prod**
- ✅ **After major dependency updates** (package.json changes)
- ✅ **After refactoring** (especially file moves, component renames)
- ✅ **When hot-reload looks good but you're nervous**

---

## Common Failures & Fixes

### ❌ "Cannot find module X"
**Cause:** Import path broken, or dependency missing from package.json
**Fix:** Check spelling, verify dep is installed, check barrel exports

### ❌ "Type 'X' is not assignable to type 'Y'"
**Cause:** TypeScript narrowing or prop type mismatch
**Fix:** Fix the type error (don't `// @ts-ignore`)

### ❌ Build succeeds, but tests fail
**Cause:** Mock setup or test isolation issue
**Fix:** Run single failing test, check mock scope (should be in `lib/mocks/`)

### ❌ "Configuration not found"
**Cause:** Config import path broken (e.g., moved config file)
**Fix:** Re-verify `lib/config/` has the file you're importing

---

## Why This Matters

Hot reload in development ≠ actual build. You might see:
- ✅ Page renders in browser
- ❌ But TypeScript compilation fails
- ❌ But imports are broken
- ❌ But build step can't minify code
- ❌ But tests can't mount component

Running QA gates before PR catches ALL of these. Saves 30 min of CI debugging.

---

## Agent Protocol

**Before marking refactor/feature as DONE:**

1. ✅ Code changes complete
2. ✅ Component renders (hot reload)
3. ✅ **Run QA gates** (`pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test`)
4. ✅ All gates pass
5. ✅ **THEN** create PR

**If QA gates fail:**
- Do NOT push to PR
- Fix the issue locally
- Re-run gates
- Repeat until all pass
