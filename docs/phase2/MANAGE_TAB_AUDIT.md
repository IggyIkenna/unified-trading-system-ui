# Phase 2f: Manage Lifecycle Tab — Deep Audit Results

**Audit date:** 2026-03-21
**Auditor:** Claude (automated)
**Repo:** unified-trading-system-ui
**Plan:** `unified-trading-pm/plans/active/ui_phase2_manage_tab_audit_2026_03_21.plan.md`
**Branch:** `feat/service-centric-navigation`

---

## Context

- Mock data is intentional — identical to the real backend API response shapes. All pages currently use mock/local data or MSW-backed API hooks. This is expected and is NOT flagged as an issue.
- The audit focuses on: **Are the components, navigation, and redirections sensible for an admin panel?** Does the UI facilitate the admin workflow: managing organisations, fund allocations, users, fees, and compliance?

---

## Executive Summary

| Category | Total Checks | PASS | ISSUE | INFO |
| -------- | ------------ | ---- | ----- | ---- |
| A. Structural Issues | 3 | 1 | 1 | 1 |
| B. Component Inventory | 5 | 3 | 1 | 1 |
| C. Navigation & Routing | 4 | 0 | 3 | 1 |
| D. Data Wiring | 2 | 1 | 0 | 1 |
| E. UX Audit | 3 | 0 | 2 | 1 |
| F. Access Control | 3 | 2 | 0 | 1 |
| **Total** | **20** | **7** | **7** | **6** |

**Severity breakdown:**

| Severity | Count | Description |
| -------- | ----- | ----------- |
| P0-blocking | 0 | No blocking issues |
| P1-fix | 3 | Must fix — no tab navigation between manage pages, mandates stub, compliance shell break |
| P2-improve | 3 | Should fix — hidden pages in nav, cross-links, responsive gaps |
| P3-cosmetic | 1 | Nice to fix — native select in fee simulator |

---

## Section A: Structural Issues

### A1. Route group mismatch — Tab navigation is missing

```
Task: A1
Status: ISSUE
Severity: P1-fix
Affected: MANAGE_TABS (5 tabs), all manage pages
```

**Finding:** MANAGE_TABS is defined in `components/shell/service-tabs.tsx` (lines 135–141) with 5 entries:

| Tab | href | Page Location |
| --- | ---- | ------------- |
| Clients | `/manage/clients` | `app/(ops)/manage/clients/page.tsx` |
| Mandates | `/manage/mandates` | `app/(ops)/manage/mandates/page.tsx` |
| Fees | `/manage/fees` | `app/(ops)/manage/fees/page.tsx` |
| Users | `/manage/users` | `app/(ops)/manage/users/page.tsx` |
| Compliance | `/compliance` | `app/(ops)/compliance/page.tsx` |

**No layout ever imports or renders MANAGE_TABS.** The `manage/layout.tsx` is a metadata-only wrapper — just a `<div>` with a page title. The (ops) layout renders `UnifiedShell` (lifecycle nav Row 1) but adds no Row 2 ServiceTabs.

**Impact for the admin:** When an admin lands on `/manage/clients`, there are no tabs to jump to Fees, Users, or Mandates. The admin must go back to the lifecycle nav dropdown (which only shows 3 of the 5 pages) or type URLs manually. This fundamentally breaks the admin panel workflow — an admin panel needs persistent sub-navigation.

**Recommendation:** Make `app/(ops)/manage/layout.tsx` a client component that renders `<ServiceTabs tabs={MANAGE_TABS} />` above `{children}`. This gives the admin a persistent tab bar across all 5 Manage pages.

Note: `/compliance` lives outside the `/manage/` path prefix — when implementing tabs, the tab component needs to handle this (it already does — `ServiceTabs` matches by `href`, not by prefix).

---

### A2. (ops) layout audit

```
Task: A2
Status: PASS
Severity: —
```

**Finding:** The (ops) layout chain is sensible for an admin panel:

```
app/(ops)/layout.tsx
  → RequireAuth (login required)
  → OpsShellInner
    → Role check: internal || admin (correct — only admins should see this)
    → Unauthorized → "Access Denied" + redirect to /trading (correct)
    → UnifiedShell orgName="Odum Internal" (correct — admin context is always internal)
      → manage/layout.tsx → page content
```

The layout correctly:
- Requires authentication
- Restricts to internal/admin roles
- Shows "Odum Internal" as the org context (admins operate in the internal org context)
- Uses the same `UnifiedShell` as the platform (consistent chrome)

The only gap is the missing ServiceTabs in `manage/layout.tsx` — covered in A1.

---

### A3. Role-based access — lifecycle nav visibility

```
Task: A3
Status: INFO
Severity: —
```

**Finding:** Manage is correctly hidden from non-admin users. Two-layer enforcement:

1. **Nav level** — `lifecycle-nav.tsx` `opsRoutes` filter removes all Manage entries for non-internal users. The Manage stage disappears entirely from the lifecycle nav.
2. **Route level** — `(ops)/layout.tsx` role check blocks rendering and redirects non-internal users to `/trading`.

This is the correct behavior for an admin panel. External clients should never see org management, fee schedules, or user admin.

---

## Section B: Component Inventory — Are the right components on each page?

### B1. Clients page (`/manage/clients`) — Organisation management

```
Task: B1
Status: PASS
Severity: —
```

**File:** `app/(ops)/manage/clients/page.tsx` (~365 lines)

**What this page does:** Manages client organisations — the core entity of the admin panel.

**List view — components and admin-fit assessment:**

| Component | What it shows | Admin-fit? |
| --------- | ------------- | ---------- |
| Card grid (3 cols) | One card per org: name, status badge (active/onboarding), type (internal/client), tier, monthly fee, usage | YES — at-a-glance org overview is exactly what an admin needs |
| "Create Org" button + Dialog | Name, type (internal/client), subscription tier selection | YES — onboarding a new client org is the primary admin action |
| Status badges | active (green), onboarding (amber) | YES — admin needs to see org lifecycle state |
| Tier + Monthly Fee display | Per-card tier and fee summary | YES — commercial context per org |

**Detail view (click a card) — 4 tabs:**

| Tab | Components | Admin-fit? |
| --- | ---------- | ---------- |
| **Overview** | 4 stat cards: Members, Tier, API Keys, Usage (GB) | YES — quick admin snapshot. Good KPIs for an admin. |
| **Users** | Member count + text "Visit User Management to manage members" | PARTIAL — should link to `/manage/users?org={orgId}`, not just be text |
| **Subscription** | Tier selector (dropdown), monthly fee, management fee %, AUM | YES — admin can change subscription tier inline |
| **API & Usage** | Active API Keys count, data usage this month | YES — admin needs to monitor API key and data consumption |

**Assessment:** The Clients page is well-aligned to what an admin needs. The card grid gives a fast overview, the detail view has the right 4 tabs (overview, users, subscription, usage). The "Create Org" flow is complete with toast feedback.

**One gap:** The Users tab in detail view says "Visit User Management to manage members" but doesn't link there. Should be a clickable link to `/manage/users` filtered by the selected org.

---

### B2. Mandates page (`/manage/mandates`) — Investment mandate management

```
Task: B2
Status: ISSUE
Severity: P1-fix
```

**File:** `app/(ops)/manage/mandates/page.tsx` (~110 lines)

**What this page should do:** Manage investment mandates — allocation targets, risk limits, compliance boundaries, IMA agreements.

**What it actually shows:** 4 placeholder cards with "Coming Soon" badge:

| Card | Description | Admin needs this? |
| ---- | ----------- | ----------------- |
| Mandate Configuration | Allocation targets, risk limits, investment guidelines | YES — core admin function |
| Compliance Monitoring | Mandate adherence tracking, breach alerts | YES — regulatory requirement |
| Allocation Tracking | Current vs target allocations, rebalancing | YES — operational oversight |
| Mandate Documentation | IMA agreements, amendments, audit trail | YES — compliance record-keeping |

**Assessment:** The 4 categories are the right things for a mandates page. The problem is they're placeholders — no actual data, no interactivity. This is the only stub page in the Manage tab. An admin cannot manage mandates at all today.

**For mock data phase:** This needs at minimum a mandates list (similar to the Clients card grid) showing each client org's mandates with key fields: client name, mandate type, AUM allocation, risk limits, status. The detail cards can follow later. The placeholder descriptions correctly scope what the page should eventually contain.

**Recommendation:** Implement a mock mandates list view with:
- Table or card grid of mandates (one per client org)
- Key columns: Client, Mandate Type, Asset Classes, AUM Target, Risk Limits, Status
- Click to expand/detail view with the 4 categories shown in the placeholders

---

### B3. Fees page (`/manage/fees`) — Fee schedule management

```
Task: B3
Status: PASS
Severity: —
```

**File:** `app/(ops)/manage/fees/page.tsx` (~366 lines)

**What this page does:** Manages fee schedules per client and provides fee projection simulation.

**Components and admin-fit assessment:**

| Component | What it shows | Admin-fit? |
| --------- | ------------- | ---------- |
| Header badges | MRR total, Total AUM | YES — admin needs aggregate commercial metrics |
| Fee Schedule Table | Client, AUM, Mgmt %, Perf %, Data %, Est. Annual Revenue | YES — exactly what a fund admin needs |
| Inline editing | Click Edit → fee inputs appear → Save/Cancel | YES — admin can adjust fees per client |
| Fee Simulator | Select client + AUM + return % → calculates mgmt/perf/data/total fees | YES — excellent admin tool for fee projections and client proposals |

**Assessment:** This is a strong admin page. The fee table has the right columns (the three fee types — management, performance, data — map to the real fee model). The simulator is genuinely useful for what-if analysis. The inline editing pattern is admin-friendly (no modal, no page navigation, just click-edit-save).

**Minor note:** The simulator's client picker uses a native `<select>` instead of the shadcn `Select` component used elsewhere on the page. Cosmetic inconsistency — P3.

---

### B4. Users page (`/manage/users`) — User & access management

```
Task: B4
Status: PASS
Severity: —
```

**File:** `app/(ops)/manage/users/page.tsx` (~352 lines)

**What this page does:** Manages users across all organisations — invite, role assignment, status management.

**Components and admin-fit assessment:**

| Component | What it shows | Admin-fit? |
| --------- | ------------- | ---------- |
| Search bar | Filter by name or email | YES — essential for admin with many users |
| Org filter dropdown | Filter users by organisation | YES — admin manages multiple orgs |
| "Invite User" button + Dialog | Name, email, org (from API), role | YES — admin onboards new users |
| User Table | Name, Email, Org, Role, Last Login, Status, Actions | YES — all the right columns for user admin |
| Inline role editing | Click role → dropdown → select new role | YES — fast role changes without modal |
| Suspend/Activate toggle | Per-user status action | YES — admin needs to enable/disable users |
| Status badges | active (green), suspended (red) | YES — visual status clarity |

**Assessment:** The Users page has the right components for user administration. The table columns match what an admin needs: who is the user, which org, what role, when were they last active, and are they active or suspended. The invite dialog collects the right fields. The inline role editing is efficient.

**One code-level note:** Line 57 has a variable naming issue (`const [inviteName, setInviteOrg]` — the setter is misnamed). This is a bug to fix but doesn't affect the component/UX assessment — the intent and layout are correct.

---

### B5. Compliance page (`/compliance`) — Regulatory information

```
Task: B5
Status: INFO
Severity: P1-fix (shell inconsistency)
```

**File:** `app/(ops)/compliance/page.tsx` (~180 lines)

**What this page does:** Displays FCA regulatory information — registration, permitted activities, key documents.

**Components and admin-fit assessment:**

| Component | What it shows | Admin-fit? |
| --------- | ------------- | ---------- |
| FCA Registration card | Reference number, firm type, status | YES — admin/compliance officer needs this |
| Registered Office card | Company address, registration details | YES — legal reference |
| Permitted Activities card | 5 FCA-authorised activities | YES — regulatory scope |
| Key Documents card | Client Agreement, Best Execution, Conflicts, Complaints | YES — compliance document index |
| Contact/FCA link | Compliance email, FCA Register link | YES — external references |

**Assessment:** The content is correct for a compliance page. All the information an admin or compliance officer needs is present.

**Shell inconsistency issue:** This page renders its **own custom header** with a logo, "Odum Research" text, and a "Back" button that goes to `/` (the public landing page). This is wrong in two ways:

1. The custom header **replaces** the `UnifiedShell` lifecycle nav — when the admin navigates here from `/manage/clients`, the entire top navigation disappears and is replaced by a minimal header
2. The "Back" button goes to `/` (the public marketing page) instead of back to the admin area

This breaks the admin workflow. An admin on the compliance page has lost all navigation context — no lifecycle nav, no manage tabs, just a standalone page with a "Back to landing" button.

**Recommendation:** Remove the custom `<header>` and `<main>` wrapper from the compliance page. Let it render inside the (ops) layout's `UnifiedShell` like every other manage page. The page content (cards) is correct — only the shell wrapper needs to change.

---

## Section C: Navigation & Routing

### C1. Lifecycle nav for Manage — hidden pages

```
Task: C1
Status: ISSUE
Severity: P2-improve
```

**Finding:** The lifecycle nav dropdown for "Manage" shows only 3 of 6 admin pages:

| # | Page | In lifecycle dropdown? | In MANAGE_TABS? |
| - | ---- | ---------------------- | --------------- |
| 1 | `/admin` (Admin Dashboard) | YES | NO |
| 2 | `/manage/clients` (Clients) | YES | YES |
| 3 | `/compliance` (Compliance) | YES | YES |
| 4 | `/manage/mandates` (Mandates) | NO — hidden | YES |
| 5 | `/manage/fees` (Fees) | NO — hidden | YES |
| 6 | `/manage/users` (Users) | NO — hidden | YES |

3 of 5 MANAGE_TABS pages (Mandates, Fees, Users) are not in `stageServiceMap` and cannot be discovered from the lifecycle nav dropdown.

**Impact:** An admin clicking "Manage" in the top nav sees Admin, Clients, and Compliance. They have no way to know Fees, Users, or Mandates pages exist unless they use tab navigation (which doesn't render — A1) or know the URLs.

**This is less critical if A1 is fixed** — once ServiceTabs renders MANAGE_TABS in the manage layout, the admin can reach all 5 pages from any manage page. The lifecycle dropdown just needs to land them on one manage page; tabs do the rest.

**Recommendation:** Either:
1. Add `/manage/fees`, `/manage/users`, `/manage/mandates` to `stageServiceMap.manage` (makes them visible in the dropdown)
2. OR keep the dropdown focused (Admin, Clients, Compliance) and rely on MANAGE_TABS (once A1 is fixed) for the rest — this is the cleaner approach

---

### C2. (ops) navigation — no conflict

```
Task: C2
Status: INFO
Severity: —
```

**Finding:** The (ops) route group uses the same `UnifiedShell` as the (platform) route group. The lifecycle nav appears identically. There is no ops-specific sidebar or conflicting navigation.

The layout chain:
```
(ops)/layout.tsx → RequireAuth → OpsShellInner → UnifiedShell (lifecycle nav) → manage/layout.tsx → page
```

This is sensible — the admin sees the same lifecycle nav as everyone else, with the Manage stage highlighted. The only missing piece is Row 2 tabs (A1).

---

### C3. Manage-internal navigation — no way to move between pages

```
Task: C3
Status: ISSUE
Severity: P1-fix
```

**Finding:** From any Manage page, the admin's options to reach another Manage page:

| From | To | Method | Works? |
| ---- | -- | ------ | ------ |
| `/manage/clients` | `/manage/fees` | Admin page Quick Actions ("Manage Subscriptions") | YES (but only from /admin) |
| `/manage/clients` | `/manage/users` | Clients detail Users tab text (no link) | NO — text only |
| `/manage/fees` | `/manage/clients` | No link | NO |
| `/manage/fees` | `/manage/users` | No link | NO |
| `/manage/users` | `/manage/clients` | No link | NO |
| Any manage page | Any other | Tab navigation (MANAGE_TABS) | NO — tabs not rendered |
| Any manage page | 3 of 6 pages | Lifecycle nav dropdown | PARTIAL |

**Impact:** The admin panel has no sub-navigation. This is the most impactful UX gap in the Manage tab. An admin managing a new client would need to: create org on Clients → go back to lifecycle nav → somehow find Fees (which isn't in the dropdown) → then find Users (also not in the dropdown).

**Recommendation:** Fix A1 (add ServiceTabs to manage layout) — this single change resolves C3 entirely.

---

### C4. Cross-lifecycle links and redirections

```
Task: C4
Status: ISSUE
Severity: P2-improve
```

**Finding — within Manage:**

| Link | From | To | Sensible? |
| ---- | ---- | -- | --------- |
| "Create Org" button | `/admin` | `/manage/clients` | YES — correct |
| "Manage Subscriptions" button | `/admin` | `/manage/fees` | YES — correct |
| Org card "Manage" button | `/admin` | `/manage/clients` | YES — correct |
| "Back" button | `/compliance` | `/` (landing) | NO — should go to `/admin` or previous page |
| Users tab text | `/manage/clients` detail | References `/manage/users` | NO — text only, no link |

**Finding — cross-lifecycle (from Manage to other stages):**

No cross-lifecycle links exist. An admin viewing a client org has no way to jump to that client's positions (Run), strategies (Build), or risk exposure (Observe) from the Manage pages. This is acceptable for Phase 1 but should be considered for Phase 2 — linking admin context to operational context.

**Key fix:** Compliance page "Back" button → change from `/` to `/admin` or `router.back()`.

---

## Section D: Data Wiring — Mock data assessment

### D1. Mock data coverage and shape

```
Task: D1
Status: PASS
Severity: —
```

**Context:** All mock data is intentional — identical to real backend API response shapes. The current mix of local state and API hooks is the expected pre-integration state.

**Mock data inventory per page:**

| Page | Data Source | Mock Shape | Matches admin needs? |
| ---- | ----------- | ---------- | -------------------- |
| `/manage/clients` | `INITIAL_ORGS` (4 orgs) + `INITIAL_SUBS` (3 subs) | Org: id, name, type, status, memberCount, subscriptionTier, monthlyFee, apiKeys, usageGb. Sub: orgId, tier, entitlements[], fees, AUM | YES — right fields for org management |
| `/manage/fees` | `useOrganizationsList()` + local subscription state | Org list from API; fees: mgmt%, perf%, data%, AUM per client | YES — right fields for fee management |
| `/manage/users` | `INITIAL_USERS` (7 users) + `useOrganizationsList()` | User: id, name, email, org, role, lastLogin, status | YES — right fields for user admin |
| `/compliance` | Static content | FCA ref, address, activities, documents | YES — correct regulatory info |
| `/admin` | `useOrganizationsList()` + `useAuditEvents()` | Orgs + audit events (type, entity, actor, timestamp, details) | YES — right fields for admin dashboard |

**Assessment:** The mock data shapes are well-designed for the admin use case. The org model has the right fields (name, type, status, tier, fee, usage). The user model has the right fields (name, email, org, role, status). The audit events model is appropriate.

**One data gap:** The Mandates page has no mock data at all (stub). When implemented, it should follow the same pattern as Clients/Fees.

---

### D2. Data consistency across pages

```
Task: D2
Status: INFO
Severity: —
```

**Finding:** Currently, the Clients page uses its own `INITIAL_ORGS` while Fees, Users, and Admin use `useOrganizationsList()` from the API. This means the org list on Clients might differ from the org list on Fees/Users.

**Is this a problem now?** For the mock phase, not really — the mock API and `INITIAL_ORGS` contain the same orgs (Odum, Alpha Capital, Beta Fund, Vertex Partners). The shapes match.

**Will it be a problem later?** When wired to the real backend, all pages will use the same API hooks, so this resolves naturally. No action needed now, but flagged as a note for the API integration phase.

---

## Section E: UX Audit — Does the UI facilitate the admin workflow?

### E1. Admin workflow: Onboard Client → Set up Mandate → Configure Fees → Add Users

```
Task: E1
Status: ISSUE
Severity: P2-improve
```

**Expected admin workflow:**

```
1. Create Organisation → /manage/clients (Create Org dialog)
2. Define Mandate → /manage/mandates (set allocation targets, risk limits)
3. Set Fee Schedule → /manage/fees (configure mgmt/perf/data fees)
4. Add Users → /manage/users (invite users to the new org)
```

**Current state:**

| Step | Page | Status | Gap |
| ---- | ---- | ------ | --- |
| 1. Create Org | `/manage/clients` | WORKS — dialog creates org with name, type, tier | None |
| 2. Define Mandate | `/manage/mandates` | STUB — "Coming Soon" | Cannot complete step 2 |
| 3. Set Fees | `/manage/fees` | WORKS — fee table with inline editing | Fees table shows existing clients; new org created in step 1 won't appear here until data is shared (mock phase limitation — OK) |
| 4. Add Users | `/manage/users` | WORKS — invite dialog with org/role | Invite dialog lists orgs from API; new org from step 1 may not appear (same mock phase limitation — OK) |

**Assessment:** The workflow is mostly sound. Steps 1, 3, 4 are functional with the right components. Step 2 (Mandates) is the gap. The fact that a new org created in step 1 doesn't immediately appear in steps 3-4 is a mock data phase limitation that resolves with real API integration.

**What would improve the workflow (P2):**
- After creating an org, show a "Next steps" prompt: "Set up fee schedule → Add users"
- Clients detail view Users tab should link to `/manage/users` (currently text-only)
- Admin dashboard (`/admin`) Quick Actions already provides good entry points — "Create Org" and "Manage Subscriptions"

---

### E2. Loading, error, and empty states

```
Task: E2
Status: ISSUE
Severity: P2-improve
```

| Page | Loading State | Error State | Empty State |
| ---- | ------------- | ----------- | ----------- |
| `/manage/clients` | N/A (local data) | N/A | No empty state if no orgs |
| `/manage/mandates` | N/A (stub) | N/A | Page is effectively a styled empty state |
| `/manage/fees` | No skeleton/spinner | No error handling | "No client organizations found." — GOOD |
| `/manage/users` | N/A (local data) | N/A | "No users found matching your filters." — GOOD |
| `/compliance` | N/A (static) | N/A | N/A |
| `/admin` | No skeleton/spinner | No error handling | Renders empty grids if no data |

**Assessment:** For mock data phase, loading states are less critical (data is instant). But for a polished admin panel, the Fees and Admin pages (which use React Query hooks) should show skeletons while data loads. When the real API is wired up, slow responses will cause a flash of empty content.

**Recommendation:** Add `isLoading` checks with `Skeleton` components to Fees and Admin pages now — this makes the mock experience smoother and prepares for real API integration.

---

### E3. Responsive behavior

```
Task: E3
Status: INFO
Severity: P2-improve
```

**Admin panels are primarily desktop tools**, so responsive issues are lower priority. But for completeness:

| Page | Desktop | Tablet | Mobile |
| ---- | ------- | ------ | ------ |
| Clients (list) | 3-col grid — GOOD | 2-col — GOOD | 1-col — GOOD |
| Clients (detail) | 4-col stats — GOOD | 4-col (may compress) | Stacks — GOOD |
| Mandates | 2-col grid (no breakpoint) | May compress | ISSUE — no mobile breakpoint |
| Fees table | 7 columns — GOOD | May compress | ISSUE — no overflow-x-auto |
| Fees simulator | 3-col — GOOD | Stacks — GOOD | Stacks — GOOD |
| Users table | 7 columns — GOOD | May compress | ISSUE — no overflow-x-auto |
| Users toolbar | Row — GOOD | Row — GOOD | Stacks — GOOD |
| Compliance | 2-col grid — GOOD | Stacks — GOOD | Stacks — GOOD |
| Admin | Multi-breakpoint — GOOD | Adapts — GOOD | Adapts — GOOD |

**Key fix for mobile:** Add `overflow-x-auto` to the table wrappers in Fees and Users pages.

---

## Section F: Access Control

### F1. Internal-only enforcement

```
Task: F1
Status: PASS
Severity: —
```

| Persona | Role | Sees Manage in nav? | Can access /manage/* ? |
| ------- | ---- | ------------------- | ---------------------- |
| admin | admin | YES | YES |
| internal-trader | internal | YES | YES |
| client-full | client | NO | NO (Access Denied → /trading) |
| client-premium | client | NO | NO (Access Denied → /trading) |
| client-data-only | client | NO | NO (Access Denied → /trading) |

Two-layer enforcement is correct: nav-level filtering + route-level role check.

---

### F2. isItemAccessible logic

```
Task: F2
Status: PASS
Severity: —
```

All Manage routes match the `opsRoutes` list in `lifecycle-nav.tsx` and correctly require `isInternal()`:

| Path | Gated? |
| ---- | ------ |
| `/manage/clients` | YES (prefix `/manage`) |
| `/manage/mandates` | YES (prefix `/manage`) |
| `/manage/fees` | YES (prefix `/manage`) |
| `/manage/users` | YES (prefix `/manage`) |
| `/compliance` | YES (exact match) |
| `/admin` | YES (exact match) |

---

### F3. (ops) vs (platform) auth

```
Task: F3
Status: INFO
Severity: —
```

| Aspect | (platform) | (ops) |
| ------ | ---------- | ----- |
| Auth gate | `RequireAuth` | `RequireAuth` + role check |
| Role requirement | Any authenticated user | `internal` or `admin` |
| Unauthorized | Login form | "Access Denied" → redirect to `/trading` |
| Shell | `UnifiedShell` with user org | `UnifiedShell` with "Odum Internal" |
| ServiceTabs (Row 2) | Per-service layout provides tabs | **Missing** — needs fix (A1) |

The auth model is correct. The only structural gap is the missing ServiceTabs.

---

## Priority Summary

### P1-fix (Must fix — 3 items)

| ID | Finding | Impact on Admin Workflow | Recommendation |
| -- | ------- | ------------------------ | -------------- |
| A1/C3 | No tab navigation between the 5 Manage pages | Admin cannot navigate the admin panel efficiently | Add `<ServiceTabs tabs={MANAGE_TABS}>` to `manage/layout.tsx` |
| B2 | Mandates page is a stub — "Coming Soon" | Admin cannot manage investment mandates (step 2 of onboarding) | Implement mandates list view with mock data |
| B5 | Compliance page renders its own header, breaking shell and navigation | Admin loses all navigation when viewing compliance; "Back" goes to landing page | Remove custom header; let (ops) UnifiedShell provide navigation |

### P2-improve (Should fix — 3 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| C1 | Only 3 of 6 admin pages visible in lifecycle nav dropdown | Add Fees, Users, Mandates to `stageServiceMap.manage` OR rely on tabs (A1 fix) |
| C4 | No cross-links between manage pages; Compliance "Back" → `/` | Fix compliance "Back" to `/admin`; add link from Clients detail Users tab to `/manage/users` |
| E1 | No connected onboarding workflow (create org doesn't link to fees/users) | Add "Next steps" after org creation; link Clients Users tab to Users page |

### P3-cosmetic (Nice to fix — 1 item)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| B3 | Fee simulator uses native `<select>` instead of shadcn `Select` | Swap to `<Select>` for consistency |

---

## Component-Fit Assessment — Summary Table

| Page | Purpose | Components Match Purpose? | Key Gap |
| ---- | ------- | ------------------------- | ------- |
| `/admin` | Admin dashboard — overview, quick actions, audit trail | YES — stat cards, org cards, audit log, quick actions are all sensible | None |
| `/manage/clients` | Organisation management — CRUD, subscriptions, usage | YES — card grid, detail tabs (overview/users/sub/usage) are right | Users tab text needs to be a link |
| `/manage/mandates` | Investment mandate management | NO — stub with placeholders | Need real mandate list/detail UI |
| `/manage/fees` | Fee schedule management and simulation | YES — fee table, inline edit, simulator are all strong admin tools | Minor: native `<select>` |
| `/manage/users` | User management — invite, roles, status | YES — search, org filter, table, invite dialog, inline role edit all correct | Variable naming bug (cosmetic) |
| `/compliance` | Regulatory reference — FCA info, documents | YES — correct content for compliance | Custom header breaks shell |

---

## Feeds Into

- **Phase 3 cross-reference audit:** C4 (cross-lifecycle links), F1-F3 (access control patterns)
- **Implementation priorities:** A1 (tab navigation — biggest UX win), B2 (mandates), B5 (compliance shell fix)
