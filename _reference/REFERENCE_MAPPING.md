# Reference Repo Mapping to Service Areas

This document maps the reference repos to the service areas defined in the refactoring vision, along with assessment of alignment and value.

---

## Service Areas in Refactoring Vision

| Service Area | Audience | Visibility | Purpose | Lifecycle Alignment |
|---|---|---|---|---|
| **Data** | Clients + Internal | Polished catalog + deep internal access | Data subscriptions, API access, catalogue | Design, Run |
| **Research / Simulation / Build** | Internal + Entitled Clients | Role-gated | Model training, backtesting, signal config | Design, Simulate, Promote |
| **Trading / Run / Monitor** | Internal + Entitled Clients | Role-gated | Live operations, orders, positions | Run, Monitor |
| **Execution / Execution Analytics** | Internal + Entitled Clients | Role-gated | Execution analysis, venue connectivity | Run, Monitor, Explain |
| **Reporting / Explain / Reconcile / Investment Management** | Clients + Internal | Client view + internal operations | P&L, performance, fees, settlement | Explain, Reconcile |
| **Admin / Onboarding / Organization Control** | Internal + Limited Admins | **HIDDEN from clients** | User management, subscriptions, settings | Onboarding |
| **Deployment / DevOps / Operational Readiness** | Internal only | **HIDDEN from clients** | Infrastructure, deployment pipeline, health | Deployment |
| **Audit / Compliance / Provenance** | Internal only | **HIDDEN from clients** | Event history, audit trail, compliance | Explain, Reconcile, Audit |

---

## Reference Repo Assessment

### `versa-admin-ui/`

**Maps to:** Admin / Onboarding / Organization Control

**Alignment: ✅ STRONG**
- Correctly positioned as internal-only
- Organization-first model aligns with vision
- User role and subscription management patterns are relevant
- Onboarding flows map to the vision

**Value: HIGH**
- Reference for: Admin surfaces, org hierarchy, user role assignment
- Use for: Understanding how admins manage users, subscriptions, org settings

**Current Codebase:** Already has `app/admin/` and `components/shell/role-layout.tsx`
- **Assessment:** Current approach is basic. Reference repo shows richer patterns worth considering.
- **Action:** Use as reference for deepening admin surfaces, but align with current structure first.

---

### `versa-audit-ui/`

**Maps to:** Audit / Compliance / Provenance (Internal-only)

**Alignment: ✅ STRONG**
- Correctly positioned as internal-only
- Audit trail and compliance surfaces align with vision
- Provenance tracking is institutional-grade

**Value: HIGH**
- Reference for: Event history, audit trail visualization, compliance reporting
- Use for: Understanding how to structure audit/compliance surfaces

**Current Codebase:** Has `app/reports/` and references to compliance, but audit detail is minimal
- **Assessment:** Current app lacks depth in audit surfaces. Reference is valuable.
- **Action:** Use as reference for building out audit/compliance service area.

---

### `versa-client-reporting/`

**Maps to:** Reporting / Explain / Reconcile / Investment Management

**Alignment: ✅ STRONG**
- Correctly partitions client view (read-only) from internal view (operational)
- P&L, performance, fees, settlement UX is well-developed
- Lifecycle alignment: Explain, Reconcile

**Value: HIGH**
- Reference for: P&L visualization, performance attribution, fee transparency, settlement UX
- Use for: Understanding how to build client-facing reporting that aligns with internal ops

**Current Codebase:** Has `app/reports/page.tsx` and some dashboards, but reporting depth is limited
- **Assessment:** Current reporting is basic. Reference repo shows strong client/internal partitioning.
- **Action:** Use as reference for building out reporting/investment management service area. Pay attention to how it partitions client vs internal views.

---

### `versa-execution-analytics-ui/`

**Maps to:** Execution / Execution Analytics (Run + Monitor)

**Alignment: ✅ STRONG**
- Execution workflow visualization aligns with vision
- Venue connectivity and order flow patterns are relevant
- Live trading dashboard patterns are institutional-grade

**Value: HIGH**
- Reference for: Execution analytics, venue status, order book, fill analysis
- Use for: Understanding execution workflow UX at institutional level

**Current Codebase:** Has `app/execution/` with pages for algos, benchmarks, candidates, handoff, etc.
- **Assessment:** Current execution service is well-structured but could deepen with reference patterns.
- **Action:** Use as reference for execution analytics details. Assess whether current structure or reference structure is stronger. (Likely current structure is already good; reference is for deepening, not replacing.)

---

### `versa-deployment-ui/`

**Maps to:** Deployment / DevOps / Operational Readiness (Internal-only)

**Alignment: ✅ STRONG**
- Correctly positioned as internal-only
- Deployment pipeline and health monitoring align with vision
- Operational readiness patterns are relevant

**Value: MEDIUM-HIGH**
- Reference for: Deployment UI, service health, operational dashboards
- Use for: Understanding how to build deployment/ops surfaces

**Current Codebase:** Has `app/devops/` and `app/ops/` but minimal implementation
- **Assessment:** Current deployment/ops surfaces are stubs. Reference shows what full implementation looks like.
- **Action:** Use as reference for building out deployment/ops service area. May want to merge current structure with reference patterns.

---

### `versa-invoicing/`

**Maps to:** Reporting / Explain / Reconcile (Invoice & Payment Operations)

**Alignment: ✅ MODERATE**
- Invoicing is a subset of Reporting/Settlement
- Payment and billing cycle management are relevant
- Client visibility of invoices aligns with vision

**Value: MEDIUM**
- Reference for: Invoice generation, billing cycle management, payment status
- Use for: Understanding how to structure invoicing workflows

**Current Codebase:** No dedicated invoicing service yet
- **Assessment:** Current codebase doesn't have invoicing; reference is valuable for building it.
- **Action:** Use as reference for invoicing component of reporting/settlement service area.

---

### `versa-onboarding/`

**Maps to:** Admin / Onboarding / Organization Control + Public Marketing

**Alignment: ✅ STRONG**
- Onboarding flows align with vision
- Demo/walkthrough patterns are relevant for prospective users
- Role-specific onboarding matches role-based model

**Value: HIGH**
- Reference for: New user onboarding flows, demo roles, permission explanations
- Use for: Understanding how to guide users through signup and role assignment

**Current Codebase:** Has `app/login/` and `app/signup/` but minimal onboarding flow
- **Assessment:** Current onboarding is basic. Reference shows richer flow.
- **Action:** Use as reference for building out user onboarding experience.

---

## Reference Usage by Refactoring Phase

### Phase 1: Structural Foundation (Current)

**Focus:** Routes, shells, role-aware architecture

**Reference repos to consult:**
1. `versa-admin-ui/` — How should admin shell be structured?
2. `versa-onboarding/` — How should post-login flow guide users?
3. Current codebase `app/` — What's already strong?

**Action items:**
- Audit current `app/` structure
- Compare with reference repos for patterns
- Plan shell and routing improvements

---

### Phase 2: Public Landing + Service Discovery

**Focus:** Public marketing pages, service catalogue, login flow

**Reference repos to consult:**
1. `versa-onboarding/` — How to structure public landing?
2. `versa-client-reporting/` — How to showcase reporting service?
3. `versa-execution-analytics-ui/` — How to showcase execution service?

---

### Phase 3: Authenticated Service Hub

**Focus:** Post-login service discovery, role-aware access

**Reference repos to consult:**
1. All repos — How do they show "what's available to me"?
2. `versa-admin-ui/` — Role/permission model
3. `versa-onboarding/` — Post-login flows

---

### Phase 4: Client Portal + Service Entry

**Focus:** Client-facing surfaces for subscribed services

**Reference repos to consult:**
1. `versa-client-reporting/` — How to partition client view?
2. `versa-execution-analytics-ui/` — What can clients access?

---

### Phase 5: Internal Operational Surfaces

**Focus:** Admin, deployment, audit, compliance

**Reference repos to consult:**
1. `versa-admin-ui/` — Admin surfaces
2. `versa-deployment-ui/` — Ops surfaces
3. `versa-audit-ui/` — Compliance surfaces

---

## Architectural Decisions

### Shell Pattern

**Current:** `components/shell/unified-shell.tsx`, `role-layout.tsx`, `require-auth.tsx`
**Reference approach:** Each repo has own shell; `versa-admin-ui/` has admin-specific shell, etc.

**Decision:** Keep unified approach but deepen with role-specific customization. Don't fragment into separate shells unless necessary.

---

### Service Navigation

**Current:** Routes like `/admin/`, `/execution/`, `/ml/`, `/ops/`, `/strategies/`, etc.
**Reference approach:** Similar structure in each repo

**Decision:** Align with lifecycle model. Consider renaming routes where they don't align with Design→Simulate→Promote→Run→Monitor→Explain→Reconcile.

---

### Client vs Internal Partitioning

**Current:** Uses role-based access but mixing client and internal surfaces
**Reference approach:** `versa-client-reporting/` and `versa-admin-ui/` clearly separate

**Decision:** Be more explicit about client-visible vs internal-only surfaces.

---

### Post-Login Experience

**Current:** `app/page.tsx` is basic; users land on overview
**Reference approach:** `versa-onboarding/` and `versa-admin-ui/` show richer service-aware flows

**Decision:** Build a service-aware cover page that shows available services, role, organization.

---

## Implementation Checklist

When working on a service area:

- [ ] Check reference repo for that service area
- [ ] Extract 2-3 key patterns worth considering
- [ ] Compare with current codebase approach
- [ ] Decide: reference structure, current structure, or hybrid?
- [ ] Document decision in code comments/PR
- [ ] Don't copy code; extract and adapt patterns

---

## When to NOT Use References

- ❌ "This reference has it, so it must be right" — Assess alignment with vision instead
- ❌ Copying entire files without adaptation
- ❌ Using old patterns that contradict new vision
- ❌ Treating reference as the only way to solve something
- ❌ Ignoring what's already strong in current codebase

---

## Quality Gate

Before using a reference pattern:

1. **Does it align with the architectural vision?** If not, improve it or skip it.
2. **Is it better than what we have?** If not, keep current approach.
3. **Can we extract the pattern without copying code?** If not, manually adapt.
4. **Will this help future agents understand the system?** If not, document why we diverged.

Remember: **These are references, not requirements.**
