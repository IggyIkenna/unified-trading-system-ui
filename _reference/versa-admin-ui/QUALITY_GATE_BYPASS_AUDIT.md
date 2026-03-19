# Quality Gate Bypass Audit — unified-admin-ui

Date: 2026-03-11
Auditor: Claude (automated)
Review period: 2026-03-11

## Summary

No active type-check suppressions in source code. Two eslint-disable-next-line comments in
source files with legitimate justifications documented below. Build output files (`coverage/`)
are excluded from audit scope.

---

## 1. Coverage Exception

**Rule:** MIN_COVERAGE=70 (Python)
**Exception type:** N/A — TypeScript/React frontend repository
**Justification:** This repository contains only TypeScript/React source code. Python coverage
measurement is not applicable. Frontend component coverage is measured via vitest (vitest.config.ts).
No Python test suite is present or required.
**Owner:** UI team
**Status:** PERMANENT EXCEPTION

---

## 2. ESLint Suppressions

### 2.1 no-console in mock-api.ts

**File:** `packages/batch-audit/src/lib/mock-api.ts`
**Suppression:** `// eslint-disable-next-line no-console`
**Rule suppressed:** `no-console`
**Reason:** Mock API development utility that must emit diagnostic output during local development
and test runs. Console output is intentional for test visibility in this non-production mock file.
**Owner:** UI team
**Status:** JUSTIFIED — mock/dev file, not production code path.

### 2.2 react-hooks/exhaustive-deps in DeploymentDetails.tsx

**File:** `packages/deployment/src/components/DeploymentDetails.tsx`
**Suppression:** `// eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit 'status' object to avoid re-running on every status poll`
**Rule suppressed:** `react-hooks/exhaustive-deps`
**Reason:** The `status` object is intentionally excluded from the dependency array to prevent
infinite re-render loops during polling. Including the full status object would cause the effect
to re-fire on every poll tick, which is architecturally incorrect. The inline comment documents
the intent.
**Owner:** UI team
**Status:** JUSTIFIED — polling anti-pattern prevention; inline comment documents intent.

---

## 3. TypeScript Suppressions

**Active @ts-ignore / @ts-expect-error directives:** 0
**Status:** CLEAN — no TypeScript suppressions in source.

---

## 4. Review Schedule

- **Last reviewed:** 2026-03-11
- **Next review:** 2026-06-11 (quarterly)
- **Action required:** None. Suppressions are at correct count. Monitor for new additions.
