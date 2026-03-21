# Entitlement & Access Control Matrix

**Generated:** 2026-03-21 | **Source:** Phase 1 Audit

This matrix maps every access control layer for each route, showing where gates align and where they conflict.

---

## Access Control Layers

The UI has **3 independent access control layers**:

| Layer | Location | Mechanism | Granularity |
|-------|----------|-----------|-------------|
| **L1. Route Group** | `app/(ops)/layout.tsx` | `user.role === "internal" \|\| "admin"` | Binary: internal vs external |
| **L2. Lifecycle Nav** | `lifecycle-nav.tsx` → `isItemAccessible()` | URL prefix matching + entitlement check | Broad prefix-based |
| **L3. Service Tabs** | `service-tabs.tsx` → `requiredEntitlement` | Per-tab entitlement field | Per-tab granular |

---

## isItemAccessible Rules (Layer 2)

```
/admin, /ops, /devops, /internal, /manage/*, /compliance, /config, /engagement
  → isInternal() required (role = internal or admin)

/service/research/*
  → hasEntitlement("strategy-full") OR hasEntitlement("ml-full")

/service/trading/* OR /service/execution/*
  → hasEntitlement("execution-basic") OR hasEntitlement("execution-full")

/service/reports/*
  → hasEntitlement("reporting")

Everything else (/service/data/*, /service/observe/*, /health, /dashboard, etc.)
  → Always accessible (returns true)
```

---

## Per-Persona Access Matrix

### Persona: `client-data-only` (entitlements: `["data-basic"]`)

| Route | L1 (group) | L2 (nav) | L3 (tab) | Effective | Issue |
|-------|-----------|----------|----------|-----------|-------|
| `/service/data/*` | ✓ platform | ✓ always | ✓ no gate | **ACCESSIBLE** | — |
| `/service/research/overview` | ✓ platform | ✗ needs strategy-full/ml-full | ✓ no gate | **LOCKED at nav** | Nav shows locked, but URL works? |
| `/service/research/ml/*` | ✓ platform | ✗ locked | ✗ ml-full | **LOCKED** | Consistent |
| `/service/research/strategy/*` | ✓ platform | ✗ locked | ✗ strategy-full | **LOCKED** | Consistent |
| `/service/trading/*` | ✓ platform | ✗ needs execution-basic/full | ✓ no gate | **LOCKED at nav** | Tab has no gate — URL bypass? |
| `/service/execution/*` | ✓ platform | ✗ locked | ✓ no gate | **LOCKED at nav** | Same issue |
| `/service/reports/*` | ✓ platform | ✗ needs reporting | ✓ no gate | **LOCKED at nav** | Same issue |
| `/service/observe/*` | ✓ platform | ✓ always | — (no tabs rendered) | **ACCESSIBLE** | No access control at all |
| `/health` | ✓ platform | ✓ always | — (no tabs rendered) | **ACCESSIBLE** | — |
| `/dashboard` | ✓ platform | ✓ always | — (standalone) | **ACCESSIBLE** | — |
| `/manage/*` | ✗ ops (rejected) | ✗ internal only | — | **BLOCKED** | Consistent |

### Persona: `client-premium` (entitlements: `["data-pro", "execution-full", "strategy-full"]`)

| Route | L2 (nav) | L3 (tab) | Effective | Issue |
|-------|----------|----------|-----------|-------|
| `/service/data/*` | ✓ | ✓ | **ACCESSIBLE** | — |
| `/service/research/overview` | ✓ (has strategy-full) | ✓ no gate | **ACCESSIBLE** | — |
| `/service/research/ml/*` | ✓ (nav accepts strategy-full) | ✗ tab needs ml-full | **NAV OK, TAB LOCKED** | ⚠ User can navigate to research hub but ML tabs show locks |
| `/service/research/strategy/*` | ✓ | ✓ strategy-full | **ACCESSIBLE** | — |
| `/service/research/execution/*` | ✓ | ✓ execution-basic (has execution-full) | **ACCESSIBLE** | — |
| `/service/trading/*` | ✓ (has execution-full) | ✓ no gate | **ACCESSIBLE** | — |
| `/service/reports/*` | ✗ needs reporting | ✓ no gate | **LOCKED at nav** | ⚠ No reporting entitlement |

### Persona: `client-full` (entitlements: `["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"]`)

| Route | L2 (nav) | L3 (tab) | Effective |
|-------|----------|----------|-----------|
| All /service/* routes | ✓ | ✓ | **ACCESSIBLE** |
| `/manage/*`, `/admin` | ✗ internal only | — | **BLOCKED** |

### Persona: `admin` / `internal-trader` (entitlements: `["*"]`)

| Route | L1 (group) | L2 (nav) | L3 (tab) | Effective |
|-------|-----------|----------|----------|-----------|
| All routes | ✓ | ✓ (wildcard) | ✓ (wildcard) | **ACCESSIBLE** |

---

## Identified Gaps

### Gap 1: URL Bypass (P1)

**Layer 2 (isItemAccessible)** only controls visibility in the lifecycle nav dropdown. It does NOT prevent direct URL access. A `client-data-only` user can type `/service/trading/overview` directly and access the page because:
- L1: platform group allows all authenticated users
- L3: TRADING_TABS has no `requiredEntitlement` on any tab
- No server-side middleware enforces entitlements

**Affected routes:** All /service/trading/*, /service/execution/*, /service/reports/* pages that have no tab-level entitlement.

### Gap 2: /service/observe/* No Access Control (P2)

The `/service/observe/*` prefix is not checked by `isItemAccessible` — it always returns `true`. This means:
- Any authenticated user can access `/service/observe/news` and `/service/observe/strategy-health`
- These pages may contain strategy health data that should require `strategy-full`
- Since OBSERVE_TABS is never rendered, there's also no tab-level entitlement check

### Gap 3: Nav Lock vs Tab Lock Misalignment (P2)

For `/service/research/*`:
- Nav locks the ENTIRE prefix if user lacks strategy-full OR ml-full
- But individual tabs have specific entitlements (ml-full, strategy-full, execution-basic)
- Result: A user with ONLY execution-basic can't reach the Research Hub via nav (locked) but could access `/service/research/execution/algos` via direct URL

### Gap 4: PROMOTE/OBSERVE Tab Routes No Entitlement (P2)

PROMOTE_TABS and OBSERVE_TABS have zero `requiredEntitlement` fields. Routes like:
- `/service/research/strategy/candidates` — strategy content, no gate
- `/service/research/execution/tca` — execution content, no gate
- `/service/trading/risk` — risk data, no gate

These are accessible to any user who can navigate to them (URL or lifecycle dropdown).

---

## Entitlement Coverage Summary

| Entitlement | Routes Gated (L3) | Routes Gated (L2) | Notes |
|-------------|-------------------|-------------------|-------|
| `data-basic` | 0 tabs | 0 routes | Data is always accessible |
| `data-pro` | 0 tabs | 0 routes | No UI distinction between basic/pro (API-driven) |
| `execution-basic` | 1 tab | /service/trading/*, /service/execution/* | Gap: only 1 tab locked, many routes open |
| `execution-full` | 0 tabs | Same as execution-basic | No distinction from basic at UI level |
| `ml-full` | 3 tabs | /service/research/* (partial) | Well-gated in BUILD_TABS |
| `strategy-full` | 2 tabs | /service/research/* (partial) | Well-gated in BUILD_TABS |
| `reporting` | 0 tabs | /service/reports/* | Gap: nav locks it, tabs don't |
