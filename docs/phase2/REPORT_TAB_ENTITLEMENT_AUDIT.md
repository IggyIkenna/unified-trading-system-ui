# Report Tab — Entitlement & Access Audit (Phase 2g)

**Date:** 2026-03-21
**Scope:** Entitlement gating across all layers for Report lifecycle pages

---

## Layer Model

| Layer | Mechanism              | What It Controls                          | Report Status     |
| ----- | ---------------------- | ----------------------------------------- | ----------------- |
| L1    | Route group            | `(platform)` requires authentication      | ✓ Authenticated   |
| L2    | `isItemAccessible()`   | Lifecycle nav visibility/lock             | ✓ Gated on `reporting` |
| L3    | `requiredEntitlement`  | Tab-level FOMO lock in ServiceTabs        | ✗ **NOT GATED**   |
| L4    | Layout entitlement     | Layout-level redirect for unauthorized    | ✗ **NOT GATED**   |
| L5    | API/server-side        | Backend endpoint authorization            | ✗ No API exists   |

---

## Detailed Analysis

### L1: Route Group (PASS)

`app/(platform)/` requires authentication via `RequireAuth` in the platform layout. Any unauthenticated user is redirected to login. This is correctly enforced.

### L2: Lifecycle Nav (`isItemAccessible`)

**File:** `components/shell/lifecycle-nav.tsx:97`

```typescript
if (path.startsWith("/service/reports")) return hasEntitlement("reporting")
```

When the user lacks `reporting`:
- Report lifecycle nav item shows Lock icon
- Dropdown for Report is not expandable
- User cannot navigate to report pages via the nav

**Status:** Working as designed.

### L3: Tab-Level Entitlement (GAP)

**File:** `components/shell/service-tabs.tsx:144-150`

```typescript
export const REPORTS_TABS: ServiceTab[] = [
  { label: "P&L", href: "/service/reports/overview" },
  { label: "Executive", href: "/service/reports/executive" },
  { label: "Settlement", href: "/service/reports/settlement" },
  { label: "Reconciliation", href: "/service/reports/reconciliation" },
  { label: "Regulatory", href: "/service/reports/regulatory" },
]
```

None of the 5 tabs have `requiredEntitlement`. The ServiceTabs component's FOMO locking logic is never triggered for Report tabs. Even if a user without `reporting` reaches the page, all tabs are fully accessible.

### L4: Layout Entitlement Gate (GAP)

**File:** `app/(platform)/service/reports/layout.tsx`

```typescript
export default function ReportsServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return (
    <>
      <ServiceTabs tabs={REPORTS_TABS} entitlements={user?.entitlements} />
      {children}
    </>
  )
}
```

No entitlement check. No redirect. The layout renders regardless of the user's entitlements.

### L5: Server-Side (N/A)

No API endpoints exist for report data. All data is inline mocks. When APIs are built, they must enforce `reporting` entitlement.

---

## Persona Access Matrix

| Persona            | Entitlements                  | Has `reporting` | L2 Nav | L3 Tabs | L4 Layout | Can Access? |
| ------------------ | ----------------------------- | --------------- | ------ | ------- | --------- | ----------- |
| internal-trader    | `["*"]`                       | ✓ (wildcard)    | ✓      | ✓       | ✓         | ✓ Expected  |
| client-full        | `["data-pro","execution-full","ml-full","reporting","strategy-full"]` | ✓ | ✓ | ✓ | ✓ | ✓ Expected |
| client-data-only   | `["data-basic"]`              | ✗               | Locked | ✓       | ✓         | ✓ **BUG** (via URL) |

---

## URL Bypass Scenario

**Steps to reproduce (client-data-only):**

1. Log in as client-data-only (analyst@betafund.com / demo)
2. Observe: Report lifecycle nav item shows Lock icon
3. Type `/service/reports/overview` in browser URL bar
4. Result: P&L page loads with full mock data visible
5. All 5 report tabs are accessible via the tab bar

**Impact:** User without `reporting` entitlement sees all reporting data. This is a P1 entitlement bypass.

---

## Recommended Fix

### Option A: Layout-Level Gate (Recommended)

Add entitlement check to `app/(platform)/service/reports/layout.tsx`:

```typescript
"use client"
import { ServiceTabs, REPORTS_TABS } from "@/components/shell/service-tabs"
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"

export default function ReportsServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const hasReporting = user?.entitlements?.includes("*") || user?.entitlements?.includes("reporting")

  if (!hasReporting) {
    redirect("/overview")
  }

  return (
    <>
      <ServiceTabs tabs={REPORTS_TABS} entitlements={user?.entitlements} />
      {children}
    </>
  )
}
```

**Pros:** Single gate protects all 5 routes + any future report routes. **Cons:** Needs client-side redirect (or middleware).

### Option B: Tab-Level Entitlement (Supplementary)

Add `requiredEntitlement: "reporting"` to all REPORTS_TABS. This adds FOMO lock icons to tabs for users without `reporting` but does NOT prevent URL bypass alone.

### Recommendation: A + B

Both should be implemented. A prevents access; B communicates access restrictions visually.

---

## Comparison With Other Tab Sets

| Tab Set       | Tab-Level Entitlements | Layout Gate | URL Bypass Risk |
| ------------- | ---------------------- | ----------- | --------------- |
| DATA_TABS     | None                   | None        | Same gap        |
| BUILD_TABS    | ml-full, strategy-full, execution-basic | None | Partial (tabs gated, layout not) |
| PROMOTE_TABS  | None                   | None        | Same gap        |
| TRADING_TABS  | None                   | None        | Same gap        |
| OBSERVE_TABS  | None                   | None        | Same gap        |
| MANAGE_TABS   | None                   | None        | Same gap        |
| REPORTS_TABS  | None                   | None        | Same gap        |

The URL bypass gap is systemic across all lifecycle tabs, not unique to Report. BUILD_TABS is the only tab set with any tab-level entitlements.
