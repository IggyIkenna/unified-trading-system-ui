# Deployment Split Audit Report

**Date:** 2026-03-04  
**Archive:** /tmp/unified-trading-deployment-v3-archive (v3 clone for comparison)  
**Split repos:** deployment-service, deployment-api, deployment-ui, system-integration-tests

---

## 1. Archive Location

- **v3 archive:** /tmp/unified-trading-deployment-v3-archive
- **Action:** Remove after plan execution: rm -rf /tmp/unified-trading-deployment-v3-archive

---

## 2. UI Migration Status: PENDING (Not Complete)

### v3 UI (archive) - Full Feature Set

| Tab         | Component         | Status in v3            |
| ----------- | ----------------- | ----------------------- |
| Deploy      | DeployForm        | Wired, full CLI builder |
| Data Status | DataStatusTab     | Wired                   |
| Builds      | CloudBuildsTab    | Wired                   |
| Readiness   | ReadinessTab      | Wired                   |
| Status      | ServiceStatusTab  | Wired                   |
| Config      | ServiceDetails    | Wired                   |
| History     | DeploymentHistory | Wired                   |

**Layout:** ServiceList sidebar + tabbed main content. All 7 tabs active per service.

### deployment-ui - Scaffold Only

| Route    | Page              | Status              |
| -------- | ----------------- | ------------------- |
| /        | DeploymentsList   | Services table only |
| /deploy  | DeployTrigger     | Simple form         |
| /history | DeploymentHistory | Basic list          |

**Gap:** deployment-ui has the same components but they are NOT wired into App.tsx. Only 3 pages routed. Full v3 tab layout is NOT implemented.

---

## 3. API Migration: COMPLETE

- 26 route modules match 1:1 between v3 api/ and deployment-api
- Services, workers, middleware migrated

---

## 4. Audit Summary

| Repo                     | Migration  | Blocking Gaps             |
| ------------------------ | ---------- | ------------------------- |
| deployment-service       | Complete   | Stale owner in configs    |
| deployment-api           | Complete   | Tier violation, E501      |
| deployment-ui            | INCOMPLETE | Full tab layout not wired |
| system-integration-tests | Scaffolded | basedpyright config       |

---

## 5. UI Migration To-Do

1. Replace deployment-ui App.tsx with v3-style tab layout (ServiceList + 7 tabs)
2. Wire existing components into tabs
3. Update API client base URL for deployment-api

---

## 8. UI Migration Completed (2026-03-04)

- **App.tsx:** Ported v3 tab layout (ServiceList + 7 tabs: Deploy, Data Status, Builds, Readiness, Status, Config, History)
- **Wrapped in RequireAuth** (deployment-ui auth retained)
- **Dependencies added:** lucide-react, @radix-ui/\*, class-variance-authority, @tailwindcss/vite, @types/node
- **Vite proxy:** /api -> http://localhost:8004 (for dev with deployment-api)
- **Dev server:** Runs at http://localhost:5173/

**Build note:** Pre-existing type errors in ServiceStatusTab, useConfig, useServices remain. App.tsx port is complete; full build passes once those are fixed.
