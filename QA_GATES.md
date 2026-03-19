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
rm -rf node_modules package-lock.json .next
npm ci  # Clean install, not npm install
```

**Why:** Hot reload caches old node_modules. Fresh install ensures all deps are correct.

---

### Step 2: Type Check (Catch TypeScript Errors)

```bash
npm run type-check
# or if not available:
npx tsc --noEmit
```

**Why:** TypeScript errors don't stop hot-reload, but they WILL fail at deploy. Catch them before build.

---

### Step 3: Build (Full Production Build)

```bash
npm run build
# or if not available:
npx vite build
```

**Why:** Development build is different from production. This catches:
- Tree-shaking errors
- Dead code elimination issues
- Minification breakage
- Asset pipeline problems

**Success = zero errors, zero warnings.**

---

### Step 4: Unit & Integration Tests

```bash
npm test -- --run
# or for Node test runners:
npm run test:unit
npm run test:integration
```

**Why:** Tests run against fresh code, not hot-reload cache.

---

### Step 5: Smoke Test Routes (Manual or Automated)

If you have a smoke test suite:

```bash
npm run test:smoke
# or check specific critical routes:
# GET / → 200
# GET /auth/signin → 200
# GET /dashboard → 200 (with mock auth)
```

**Why:** Routing, navigation, and component mounting can break silently in TypeScript.

---

## TL;DR: The Script

Create `.scripts/verify.sh`:

```bash
#!/bin/bash
set -e

echo "🧹 Cleaning dependencies..."
rm -rf node_modules package-lock.json .next .vite

echo "📦 Fresh install..."
npm ci

echo "🔍 Type checking..."
npm run type-check || npx tsc --noEmit

echo "🔨 Building..."
npm run build

echo "✅ Running tests..."
npm test -- --run

echo "✨ All gates passed. Ready for PR/deploy."
```

Then run:
```bash
bash .scripts/verify.sh
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
**Fix:** Run single failing test, check mock scope (should be in `shared/mocks/`)

### ❌ "Configuration not found"
**Cause:** Config import path broken (e.g., moved config file)
**Fix:** Re-verify `shared/config/` has the file you're importing

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
3. ✅ **Run QA gates** (`bash .scripts/verify.sh`)
4. ✅ All gates pass
5. ✅ **THEN** create PR

**If QA gates fail:**
- Do NOT push to PR
- Fix the issue locally
- Re-run gates
- Repeat until all pass

---

## Reference in V0 Prompt

Keep this one-liner in your system prompt:

> **QA GATE:** Before PR/deploy, run `bash .scripts/verify.sh` (clean install → type-check → build → test). See QA_GATES.md for details.
