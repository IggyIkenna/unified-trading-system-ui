# Reference Repositories

This directory contains reference implementations from previous versions of the unified trading system UI. These are **not** production code, but serve as architectural and pattern references for the current refactoring effort.

## Purpose

These repos exist to:

- Show patterns for different service areas and authentication models
- Demonstrate shell structures, role-based layouts, and navigation patterns
- Provide visual/UX reference for institutional-grade interfaces
- Illustrate best practices for client-facing vs internal-only surfaces
- Help inform architectural decisions without forcing copy-paste refactoring

## When to Use These

**Good use:**

- "How did the old system structure execution analytics?" → Look at `versa-execution-analytics-ui/`
- "What patterns did client reporting use for P&L and settlements?" → Check `versa-client-reporting/`
- "What does an institutional admin surface look like?" → Reference `versa-admin-ui/`

**Bad use:**

- Don't copy entire components/pages wholesale
- Don't treat these as the "correct" solution
- Don't assume old patterns are better than new ones
- Don't use them to override the architectural vision

## Reference Repos

### versa-admin-ui/

**Purpose:** Administration, onboarding, organization control, user management
**Audience:** Internal operators, org owners
**Key patterns:**

- Organization setup flows
- User role assignment
- Subscription management
- Settings and configuration

**When to reference:**

- Building admin surfaces for the new platform
- Understanding how organization hierarchy was modeled
- Client onboarding workflows (clients see limited subset)

---

### versa-audit-ui/

**Purpose:** Compliance, audit trail, provenance, event history
**Audience:** Internal compliance, audit teams (hidden from clients)
**Key patterns:**

- Event history and filtering
- Compliance reporting
- Audit trail visualization
- Evidence collection

**When to reference:**

- Building internal audit/compliance surfaces
- Understanding provenance tracking patterns
- Compliance-grade event logging

---

### versa-client-reporting/

**Purpose:** Client-facing P&L, performance reporting, settlement, investment management
**Audience:** Client users + internal reporting teams
**Key patterns:**

- P&L by strategy/portfolio
- Net/gross performance attribution
- Fee visibility and transparency
- Settlement and residuals
- Both client view (read-only) and internal view (operational)

**When to reference:**

- Building the reporting/investment management service area
- Understanding how to partition client vs internal views
- P&L visualization and drill-down patterns
- Fee and settlement UX

---

### deployment-ui/ + deployment-api/ + deployment-service/

**Purpose:** Complete deployment stack for production operations
**Audience:** Internal ops, deployment engineers (hidden from clients)

**deployment-ui/** (React/Next.js frontend)

- Deployment pipeline visualization
- Service health monitoring and alerting
- Configuration management UI
- Operational dashboards
- Rollback controls

**deployment-api/** (Backend API service)

- REST endpoints for deployment operations
- Health check aggregation from all services
- Deployment history and audit logging
- Configuration persistence
- WebSocket support for real-time status updates

**deployment-service/** (Core orchestration service)

- Deployment orchestration (CI/CD integration)
- Service topology management
- Infrastructure as Code (IaC) patterns
- Rollback/rollforward logic
- Multi-environment support (staging, prod, per-shard)

**When to reference:**

- Understanding full-stack deployment architecture
- Building operational readiness dashboards
- Implementing deployment control panels in other UIs
- Learning health check aggregation patterns
- Understanding multi-environment deployment strategies

---

### versa-execution-analytics-ui/

**Purpose:** Execution analysis, order flow, venue connectivity, trading operations
**Audience:** Internal traders, execution teams + clients with execution entitlements
**Key patterns:**

- Execution workflow visualization
- Venue and liquidity status
- Order book and fill analysis
- Execution quality metrics
- Live trading dashboards

**When to reference:**

- Building execution analytics and live trading surfaces
- Understanding execution workflow UX
- Venue connectivity and status patterns
- Institutional trading dashboard patterns

---

### versa-invoicing/

**Purpose:** Invoice generation, payment management, billing cycles
**Audience:** Internal finance, admins + clients receiving invoices
**Key patterns:**

- Invoice templates and generation
- Payment status tracking
- Billing cycle management
- Fee breakdowns

**When to reference:**

- Building invoicing and payment workflows
- Settlement and billing patterns
- Client-visible billing surfaces

---

### versa-onboarding/

**Purpose:** New user onboarding, demo/walkthrough flows, first-time setup
**Audience:** Prospective users, new clients, new internal staff
**Key patterns:**

- Guided setup flows
- Role-specific onboarding
- Demo data and sandboxes
- Permission explanations
- Progress tracking

**When to reference:**

- Building onboarding flows for new users
- Understanding demo role structures
- Permission explanation patterns

---

## How to Use

### 1. Explore a specific service area

When building a new service, first look at the corresponding reference repo:

```bash
# Example: building new execution analytics service
ls _reference/versa-execution-analytics-ui/
# Look at: components/, lib/, app/, hooks/
# Understand the shell structure, routing, role models
```

### 2. Reference specific patterns

Extract useful patterns without copying code:

```bash
# Example: understanding P&L visualization
# Look at: _reference/versa-client-reporting/components/
# Consider: How do they structure P&L data? What components are reusable?
# Decide: Can we improve on this pattern?
```

### 3. Understand role-based visibility

Each repo shows how to separate client vs internal surfaces:

```bash
# Example: admin surfaces hidden from clients
# Look at: versa-admin-ui/app/, versa-admin-ui/components/
# Understand: What makes a surface "internal-only"?
```

## Architecture Alignment

These repos predate the new architectural vision. Your job is to **assess them for alignment**, not follow them blindly.

**Good alignment:**

- Shell structures that separate public/authenticated/internal
- Role-based layouts that hide internal-only surfaces
- Service-aware navigation
- Clear separation of concerns

**Misalignment to fix:**

- Service names that don't align with the lifecycle model (Design→Simulate→Promote→Run→Monitor→Explain→Reconcile)
- Arbitrary category names that break the mental model
- Unclear public vs client vs internal boundaries
- Inconsistent shell/layout patterns

## Files to Check

For each reference repo, start here:

- **app/** — Route structure and page organization
- **components/** — Shell, layout, navigation patterns; domain-specific components
- **lib/** — Type definitions, mock data, utilities
- **hooks/** — Custom auth, role, context patterns
- **.cursorrules** or similar — Code patterns and conventions

## Quality Bar

When referencing, ask:

- ✅ Does this pattern align with the new vision?
- ✅ Is this the best approach, or can we improve it?
- ✅ Can we extract the pattern without copying implementation?
- ❌ Is this outdated/superceded by the new architecture?
- ❌ Does this contradict the unified platform vision?

Remember: **Best of both worlds.** Use old patterns where they're strong; improve where they're weak.

## Notes

- **NOT** production code
- **NOT** the source of truth for current implementation
- **Reference material** for pattern inspiration
- `.git` directories removed intentionally (these are not separate repos)
- Commit these to the main repo for context preservation
