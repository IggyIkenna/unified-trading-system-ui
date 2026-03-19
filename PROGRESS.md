# Phase 2 Refactor Progress

**Branch:** refactor/phase2-structure
**Started:** 2026-03-19
**Status:** IN PROGRESS

---

## Step 1: Create Target Directory Structure
**Status:** ✅ DONE

### Directories Created:
- [x] `app/(public)/` - layout.tsx created
- [x] `app/(platform)/` - layout.tsx created
- [x] `app/(ops)/` - layout.tsx created
- [x] `lib/config/` - api.ts, branding.ts, auth.ts, services.ts, index.ts
- [ ] `lib/mocks/` - Step 6
- [ ] `lib/mocks/handlers/` - Step 6
- [ ] `lib/mocks/fixtures/` - Step 5-6
- [ ] `lib/stores/` - Step 8
- [ ] `lib/types/` - Step 9
- [ ] `hooks/api/` - Step 10

---

## Step 2: Create lib/config/ (Centralized Config)
**Status:** ✅ DONE

### Files Created:
- `lib/config/api.ts` - API endpoints, base URLs, timeouts
- `lib/config/branding.ts` - Company identity, design tokens
- `lib/config/auth.ts` - Roles, entitlements, personas
- `lib/config/services.ts` - Service registry with entitlements
- `lib/config/index.ts` - Barrel export

---

## Step 3: Create Shell Layouts (Route Group Infrastructure)
**Status:** ✅ DONE

### Files Created:
- `app/(public)/layout.tsx` - Public shell with header + footer
- `app/(platform)/layout.tsx` - Platform shell with auth + UnifiedShell
- `app/(ops)/layout.tsx` - Ops shell with internal-only access gate

---

## Step 4: Move Existing Pages into Route Groups
**Status:** ⏳ TODO

---

## Step 5: Auth Personas + useAuth Upgrade
**Status:** ⏳ TODO

---

## Step 6: MSW Mock Infrastructure
**Status:** ⏳ TODO

---

## Step 7: Migrate Inline Mock Data → Fixtures
**Status:** ⏳ TODO

---

## Step 8: State Management Plumbing
**Status:** ⏳ TODO

---

## Step 9: Type Generation
**Status:** ⏳ TODO

---

## Step 10: Wire Data Catalogue Page End-to-End
**Status:** ⏳ TODO

---

## Step 11: Cleanup Orphans
**Status:** ⏳ TODO

---

## Step 12: Update Manifest Status
**Status:** ⏳ TODO

---

## Quality Gate
```bash
pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test
```
**Status:** ⏳ NOT RUN
