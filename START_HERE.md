# START HERE — UI Development Guide

**Welcome to the Unified Trading System UI.**

This document tells you exactly what to read and in what order before you start building.

---

## For Iggy (Product Owner)

**Read these to approve the architectural vision:**

1. **[ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)** (15 min)
   - Platform ideology, role model, three experience modes
   - Service areas and workflow lifecycle
   - Does this match the product vision? Approve or request changes

2. **[SETUP_SUMMARY.md](./SETUP_SUMMARY.md)** (10 min)
   - Overview of what was built and why
   - Next steps for all teams

3. **[context/API_FRONTEND_GAPS.md](./context/API_FRONTEND_GAPS.md)** (5 min)
   - Review known API gaps
   - Prioritize backend work based on UI needs

---

## For CosmicTrader & datadodo (UI Builders)

**Complete this onboarding before you start coding (45 min total):**

### Step 1: Understand the Platform (15 min)

📖 Read: **[ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)**

Learn:
- What the platform is (not just a website, but a unified institutional system)
- The three experience modes (public, client, internal)
- The six service areas (data, research, execution, reporting, admin, deployment)
- The core workflow: Design → Simulate → Promote → Run → Monitor → Explain → Reconcile
- Role model and organization-first architecture

**Why:** Everything you build flows from this. Understand the platform first.

---

### Step 2: Understand What Can Be Configured (10 min)

📖 Read: **[context/CONFIG_REFERENCE.md](./context/CONFIG_REFERENCE.md)**

Learn:
- Where to find backend configurations (config-registry.json)
- How configurations map to UI controls
- What services have what configurable fields
- How to regenerate the config registry when backend changes

**Why:** You'll need to build configuration UIs. Don't guess—query the registry.

---

### Step 3: Understand Data Partitioning (10 min)

📖 Read: **[context/SHARDING_DIMENSIONS.md](./context/SHARDING_DIMENSIONS.md)**

Learn:
- Five primary shards (CEFI, DeFi, Sports, TradFi, OnChain)
- How data is partitioned (shard → venue → instrument → org)
- Why sharding matters (failure isolation, per-shard config, data scoping)
- Common sharding mistakes to avoid

**Why:** Every data screen must be shard-aware. You can't mix data across shards.

---

### Step 4: Check API Readiness (5 min)

📖 Scan: **[context/API_FRONTEND_GAPS.md](./context/API_FRONTEND_GAPS.md)**

Learn:
- Which APIs are 🔴 blocked (don't build features that depend on these)
- Which APIs are 🟡 in progress (plan, but wait)
- Which APIs are 🟢 ready (build now)

**Why:** Avoid building features that depend on missing APIs.

---

### Step 5: Review Coding Rules (5 min)

📖 Skim: **[CODING_RULES_QUICK_START.md](./CODING_RULES_QUICK_START.md)**

Or read the full version: **[.cursorrules](./.cursorrules)**

Learn:
- How to organize code (services/ folder structure)
- What components should be shared (filters, tables, headers)
- What should be centralized (config, mocks, types)
- How to refactor (in place, never create V2)

**Why:** These rules prevent common mistakes (multiple versions of truth, scattered components, hardcoded values).

---

## Before You Start Coding Each Feature

**Use this 15-minute checklist:**

### 1. Understand Data Partitioning (2 min)
- [ ] Is this feature for one shard (CEFI) or multi-shard?
- [ ] Which venues in that shard?
- [ ] How will users select shard/venue?

### 2. Find the Configuration (3 min)
- [ ] Open `context/api-contracts/openapi/config-registry.json`
- [ ] Search for your service (e.g., "execution-service")
- [ ] List all configurable fields, types, defaults
- [ ] Plan which fields to expose in the UI

### 3. Check API Readiness (2 min)
- [ ] Check `context/API_FRONTEND_GAPS.md`
- [ ] Your feature depends on which APIs?
- [ ] Are they 🔴 blocked? 🟡 in progress? 🟢 ready?
- [ ] If blocked, defer the feature. If in progress, plan it but wait.

### 4. Find API Specs (3 min)
- [ ] Open `context/api-contracts/openapi/<your-api>.yaml`
- [ ] See endpoint signatures and response shapes
- [ ] Open `context/api-contracts/canonical-schemas/` to see Pydantic models
- [ ] Understand the data shapes you'll receive

### 5. Plan Architecture (5 min)
- [ ] Will this be a new page? New route?
- [ ] Which service domain folder? (services/execution/, services/data/, etc.)
- [ ] Will you use existing shared components? (FilterBar, DataTable, etc.)
- [ ] What configuration will you need? (API endpoints, timeouts, etc.)
- [ ] What permission checks? (useAuth() hook)

**Done?** Start coding. You have all the information you need.

---

## Key File Locations

| What you need | Where to find it |
|---|---|
| Platform vision | [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md) |
| Configuration reference | [context/CONFIG_REFERENCE.md](./context/CONFIG_REFERENCE.md) |
| Sharding model | [context/SHARDING_DIMENSIONS.md](./context/SHARDING_DIMENSIONS.md) |
| API readiness | [context/API_FRONTEND_GAPS.md](./context/API_FRONTEND_GAPS.md) |
| Coding rules (quick) | [CODING_RULES_QUICK_START.md](./CODING_RULES_QUICK_START.md) |
| Coding rules (full) | [.cursorrules](./.cursorrules) |
| Pre-build checklist | [context/CONTEXT_GUIDE.md](./context/CONTEXT_GUIDE.md) |
| Config schema reference | `context/api-contracts/openapi/config-registry.json` |
| API specs | `context/api-contracts/openapi/*.yaml` |
| Data schemas | `context/api-contracts/canonical-schemas/` |
| Service types | `context/internal-contracts/schemas/` |

---

## Recommended Project Structure

When you start building, use this structure:

```
src/
├── services/
│   ├── data/
│   │   ├── components/     ← Data-specific components
│   │   ├── pages/          ← Data service pages
│   │   ├── hooks/          ← Data-specific hooks
│   │   ├── types/          ← Data-specific types
│   │   └── routes.tsx
│   │
│   ├── execution/          ← Similar structure
│   ├── research/
│   ├── reporting/
│   └── admin/
│
├── shared/                 ← Shared across ALL services
│   ├── components/         ← Filters, tables, headers (shared)
│   ├── hooks/
│   │   ├── api/            ← API hooks (centralized)
│   │   ├── useAuth.ts      ← Auth hook (centralized)
│   │   └── index.ts
│   │
│   ├── config/             ← All configuration (centralized)
│   │   ├── api.ts          ← API endpoints
│   │   ├── branding.ts     ← Colors, fonts, logo
│   │   ├── constants.ts    ← Magic numbers, error messages
│   │   └── index.ts
│   │
│   ├── types/              ← Shared types
│   ├── mocks/              ← Central mock API (not per-page)
│   └── utils/
│
└── layout/                 ← Global routing
    ├── PublicShell.tsx
    ├── AuthenticatedShell.tsx
    ├── router.tsx
    └── index.ts
```

---

## Key Rules (TL;DR)

### ✅ DO

- ✅ Organize by **service domain** (services/ structure matches backend)
- ✅ Use **shared components** (FilterBar, DataTable) for consistency
- ✅ Get **configuration from config/** (no hardcoded values)
- ✅ Use **shared hooks** (useAuth, useExecutionAPI) for centralization
- ✅ Use **centralized mocks** (shared/mocks/, same everywhere)
- ✅ **Update in place** when refactoring (no V2, Refactored versions)
- ✅ **Check API readiness** before building (API_FRONTEND_GAPS.md)

### ❌ DON'T

- ❌ Create `PositionsTableV2`, `PositionsTableRefactored` (one source of truth)
- ❌ Implement filters per-domain (DataFilter, ExecutionFilter are different)
- ❌ Hardcode API endpoints, colors, strings in components
- ❌ Create per-page mock implementations
- ❌ Scatter auth logic across components
- ❌ Leave old code alongside new code
- ❌ Build features that depend on 🔴 blocked APIs

---

## Common Questions

### Q: Where do I find what the backend API returns?
**A:** `context/api-contracts/openapi/config-registry.json` (configs) and `context/api-contracts/canonical-schemas/` (data shapes)

### Q: How do I know if an API is ready?
**A:** Check `context/API_FRONTEND_GAPS.md` — look for your service

### Q: Should I create DataFilter and ExecutionFilter?
**A:** No. Create one `shared/components/filters/FilterBar.tsx` and use it everywhere

### Q: Where should the logo URL go?
**A:** `shared/config/branding.ts` (not in components)

### Q: Can I create PositionsPageV2 while refactoring?
**A:** No. Update `PositionsPage.tsx` in place, then delete old code

### Q: Can I hardcode `http://localhost:8004`?
**A:** No. Use `API_CONFIG` from `shared/config/api.ts`

### Q: Should I mock the API per test?
**A:** No. Use centralized `shared/mocks/api.ts` (used in dev AND tests)

---

## Next Steps

1. **Read the three essential documents** (45 min)
   - ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md
   - context/CONFIG_REFERENCE.md
   - context/SHARDING_DIMENSIONS.md

2. **Skim the coding rules** (10 min)
   - CODING_RULES_QUICK_START.md (quick reference)
   - .cursorrules (detailed rules)

3. **For each feature you build** (15 min prep)
   - Use the pre-build checklist above
   - Understand shard/venue scope
   - Check API readiness
   - Find API specs
   - Plan architecture

4. **Start coding**
   - Follow the recommended structure
   - Use shared components/hooks/config (don't build new ones)
   - Update in place when refactoring
   - No hardcoded values

---

## Getting Help

- **What's this service supposed to do?** → [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)
- **What can be configured?** → [context/CONFIG_REFERENCE.md](./context/CONFIG_REFERENCE.md)
- **How is data partitioned?** → [context/SHARDING_DIMENSIONS.md](./context/SHARDING_DIMENSIONS.md)
- **Is this API ready?** → [context/API_FRONTEND_GAPS.md](./context/API_FRONTEND_GAPS.md)
- **How do I structure code?** → [CODING_RULES_QUICK_START.md](./CODING_RULES_QUICK_START.md) or [.cursorrules](./.cursorrules)
- **What does the API return?** → `context/api-contracts/openapi/` (specs) and `context/api-contracts/canonical-schemas/` (schemas)

---

## Summary

You now have:
- ✅ Clear platform vision
- ✅ Configuration reference (no guessing)
- ✅ Data partitioning model (proper scoping)
- ✅ API readiness tracking (avoid surprises)
- ✅ Coding rules (consistent architecture)
- ✅ Shared components/config/hooks (DRY, maintainable)
- ✅ Recommended project structure

**Everything is documented. Nothing is left to guesswork.**

**Read the documents. Follow the rules. Build great UI.**

---

**Ready?**

→ Start with [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)

Go build. 🚀
