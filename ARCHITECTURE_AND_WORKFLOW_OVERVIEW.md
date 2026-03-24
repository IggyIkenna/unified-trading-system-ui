# Unified Trading System UI — Architecture & Workflow Overview

**READ THIS FIRST.** This document orients every agent and developer to the core ideology, architecture, and role-based design of the Unified Trading System UI platform.

---

## 1. What This Platform Is

This is **not just a website**. It is a unified institutional platform and commercial offering supporting:

- **Data**: Market data catalogue, subscriptions, API access
- **Research & Simulation**: Model training, strategy backtesting, execution backtesting, signal configuration
- **Trading & Execution**: Live trading operations, execution analytics, position monitoring
- **Reporting & Investment Management**: P&L, performance, fees, settlement, reconciliation
- **Internal Operations**: Admin, onboarding, deployment, audit, compliance

The same system serves three distinct user tiers:

1. **Prospective Users** — exploring services via public marketing
2. **Client Organizations** — authenticated users with subscribed services and org-level permissions
3. **Internal Operators** — full platform access for deployment, compliance, and operations

**Core principle:** One firm, one platform, one operating model—with different access levels and information depth based on role and service entitlements.

---

## 2. Design & Product Doctrine

The platform must **feel**:

- **Institutional** — premium, dark, calm, operator-grade
- **Client-trustworthy** — better than generic SaaS admin tools; better than clunky fund admin portals
- **Coherent** — unified across public, client, and internal experiences
- **Information-forward** — clear role/service boundaries, strong status/provenance cues

### Visual & UX Standards

- Dark institutional design language (premium palette)
- Dense but elegant information hierarchy
- Strong status and identity indicators (org, role, service entitlements)
- Unified shell logic across public, authenticated, and internal surfaces
- Clear role-based access boundaries with helpful restriction messaging

---

## 3. Core Workflow Model: Design → Simulate → Promote → Run → Monitor → Explain → Reconcile

This lifecycle influences every area of the platform:

| Stage         | Description                                      | Who Uses It                       | Services                         |
| ------------- | ------------------------------------------------ | --------------------------------- | -------------------------------- |
| **Design**    | Build, configure, define strategies and models   | Quants, researchers, internal     | Research/Simulation              |
| **Simulate**  | Backtest, compare, evaluate candidates           | Quants, researchers, internal     | Research/Simulation              |
| **Promote**   | Select candidates, prepare for deployment review | Strategy team, internal approvers | Research/Simulation → Trading    |
| **Run**       | Live operations, active trading, live monitoring | Traders, ops, internal            | Trading/Execution                |
| **Monitor**   | Oversight, alerts, risk management               | Traders, risk team, internal      | Trading/Execution, Alerting      |
| **Explain**   | Attribution, P&L analysis, signal diagnostics    | Quants, PMs, clients (scoped)     | Reporting, Analytics             |
| **Reconcile** | Settlement, invoicing, audit, compliance         | Finance, compliance, internal     | Reporting, Investment Management |

**In the UI:** Service areas and workflows should use this language. Avoid arbitrary category names that break the mental model.

---

## 4. Role Model & Authentication

**One authentication system. Organization-first.**

### Authentication Flow

1. User registers or is invited to an organization
2. Organization owner/admin assigns role and service entitlements
3. Login returns a token containing:
   - `user_id`
   - `org_id`
   - `role` (owner, admin, trader, quant, compliance, etc.)
   - `service_entitlements` (data, research, execution, reporting, etc.)
   - `permission_level` (internal, client, or prospective)

### Post-Login Experience

The experience must be:

- **Role-aware** — show only relevant features and workflows
- **Organization-aware** — data scoped to the user's organization
- **Service-aware** — show available vs locked services clearly

---

## 5. Three Experience Modes

### A. Public / Marketing / Exploratory

**Access level:** No authentication required

Prospective clients land here to:

- Understand the firm and service offerings
- Explore available services
- Understand pricing and capabilities
- Sign up or request access

**Key pages:**

- Home / landing
- Service descriptions (data, research, execution, reporting)
- Pricing / subscription
- Sign-in portal

---

### B. Client / Organization User

**Access level:** Authenticated; scoped to subscribed services and organization data

Logged-in clients see:

- Services their organization has access to
- Their own organization's data only
- Role-appropriate (not internal-only) tools
- Clear messaging on locked services and upgrade paths
- Scoped versions of research, execution, and reporting tools

**Key properties:**

- Org-level data isolation
- Least-privilege access to internal tools
- Premium client versions of shared features
- Restricted from admin, deployment, and full audit surfaces

---

### C. Internal User

**Access level:** Authenticated; full or delegated platform access depending on role

Internal users (by role) can access:

- **Admin/Owner** — organization management, user permissions, service subscriptions, billing
- **Research/Quant** — full model training, all backtesting, unlimited simulation
- **Trading/Execution** — live trading controls, full execution analytics, risk override
- **Reporting/Finance** — invoice generation, settlement ops, payment confirmations
- **Compliance/Audit** — full provenance, event history, audit logs, regulatory evidence
- **Deployment/DevOps** — system deployment, infrastructure, CI/CD, monitoring

**Key principle:** Internal-only surfaces (admin, deployment, compliance deep-dives) are hidden from clients and only shown to internal users with appropriate roles.

---

## 5.1 Universal Service Funnel — Same Destination, Different Entry Points

Every service area follows the SAME funnel. Users arrive from different doors but always converge on the SAME service detail page with data-driven filtering.

### The Three Doors

| Door         | Who                          | Entry Point                         | Journey                                                                                                     |
| ------------ | ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Prospect** | Unauthenticated visitor      | Landing page → `/services/{domain}` | Sees marketing page → "Subscribe" CTA → Register → Login → Subscription overview → Service detail           |
| **Client**   | Authenticated, subscribed    | Login → `/service/overview`         | Sees subscription overview (entitled vs locked) → Click entitled service → Service detail (org-scoped data) |
| **Internal** | Authenticated, internal role | Login → `/service/overview`         | Sees all services available → Click any service → Service detail (all data, plus admin/ops surfaces)        |

### The Subscription Overview (Hub)

After authentication, ALL users land on `/service/overview` — the subscription-aware hub.

**What clients see:**

- Services they're subscribed to: full-color cards with quick stats → click for detail
- Services they're NOT subscribed to: locked cards with "Upgrade" → click shows what they'd get
- Link to the same detailed page internal users see, but with org-scoped data

**What internal users see:**

- All services available (wildcard entitlements)
- Per-client view option (select a client org to see what they see)
- Admin/ops links visible that clients never see

### The Service Detail (Same Page, Different Data)

Every service detail page handles three states:

- **Subscribed:** Full functionality, org-scoped data
- **Not subscribed:** Locked overlay with "Upgrade" CTA showing what they'd get
- **Internal:** Full data, no restrictions, plus admin/ops links

**Key rule:** ONE page per service area. The API scopes the data based on `org_id` + `entitlements` from the auth token. Never build separate client vs internal versions of the same page.

---

## 6. Service / Product Areas

### Public-Facing Services

Users see these services (locked or available) at every experience level:

1. **Data** — Market data catalogue, subscriptions, API access
2. **Research / Simulation** — Model training, strategy backtesting, signal development
3. **Trading / Execution** — Live trading, execution analytics, position monitoring
4. **Reporting / Investment Management** — P&L, performance, fees, settlement visibility
5. **Compliance / Audit** — (Internal and client-restricted views; strong provenance)

### Internal-Only or Restricted Services

These are hidden from client users and only shown to internal personnel:

6. **Admin / Onboarding** — User management, organization control, service subscriptions
7. **Deployment / DevOps** — Infrastructure, CI/CD, deployment readiness, monitoring
8. **Audit / Compliance (Deep)** — Full event history, regulatory evidence, internal-only audit

---

## 7. Post-Login Service Hub

After authentication, users land on a **service-aware cover page** that shows:

- **Available services** — services the organization is subscribed to
- **Locked services** — services not yet subscribed; upgrade paths visible
- **Hidden services** — internal-only services not shown to the user's role
- **Quick entry points** — links to the most relevant workflows for that user's role

Example flows:

- A **client quant** sees: Data (available), Research (available), Execution (locked), Admin (hidden)
- An **internal trader** sees: All services available with their full, unrestricted versions
- A **prospective user** sees: Public service descriptions and sign-up call-to-action

---

## 8. Information Architecture & Key Workflows

### The Shell

- **Public shell** — logo, navigation, sign-in, public service pages
- **Authenticated shell** — org/role badge, service navigation, user menu, logout
- **Internal shell** — admin/ops panels, compliance/audit access, deployment controls

All shells should feel like one system with clear transitions between modes.

### Navigation Logic

- Services are discoverable via role-aware navigation
- Hidden services don't appear in menus, links, or commands
- Access denied messages are helpful, not cryptic
- The platform clearly explains why a service is locked (upgrade needed, org not subscribed, role not authorized)

### Design → Simulate → Promote → Run Pattern in Navigation

- **Design/Simulate** area: research platform, model training, backtesting tools
- **Promote**: review candidates, submit for deployment, view approval status
- **Run/Monitor**: live dashboard, positions, risk, orders, execution analytics
- **Explain/Reconcile**: reports, P&L, attribution, settlement

---

## 9. Role-Based Access & Visibility Rules

### Client vs Internal

| Feature                      | Client                    | Internal                       |
| ---------------------------- | ------------------------- | ------------------------------ |
| Data subscription management | Org admin only            | All internal                   |
| Strategy backtesting         | Yes (full for subscribed) | Yes (full)                     |
| Live trading controls        | If entitled               | Yes (full)                     |
| View other orgs' data        | No                        | Yes (with audit trail)         |
| Admin/onboarding panel       | No                        | Yes (role-dependent)           |
| Deployment/DevOps panel      | No                        | Yes (ops/deployment role only) |
| Full audit history           | No (scoped)               | Yes (compliance role)          |

### Service Entitlements

Clients are subscribed to specific service packs. Org admins can:

- View current subscriptions
- Request upgrades
- Manage user access to entitled services

Internal users can:

- Manage subscriptions for all orgs
- View cross-org analytics
- Manage billing and settlement

---

## 10. Key Design Patterns

### Pattern: Locked Service Visibility

When a client user tries to access a locked service:

1. Show the service card/link in a disabled/grayed state
2. Explain why it's locked (not subscribed, role not authorized, feature not available)
3. Provide an "upgrade" or "request access" CTA if applicable
4. Do NOT hide the service entirely (transparency matters)

### Pattern: Org-Level Data Isolation

All data queries must be scoped to `org_id`. Never return cross-org data to client users.

### Pattern: Role-Aware Depth

The same feature (e.g., execution analytics) exists in both client and internal versions:

- **Client version**: org's data only, limited drill-down, restrictions on exports
- **Internal version**: cross-org analytics, full drill-down, unrestricted access

The UX should feel like the same tool, not a separate product.

### Pattern: Status & Provenance

Every important entity (strategy, order, model, report) should show:

- Who created/modified it (with timestamp)
- Current status (draft, in-review, live, archived)
- Permissions/visibility (org-only, internal-only, shared)
- Any restrictions or caveats

---

## 11. Commercial Modularity

Services are sold as **packages**:

- **Data Only** — access to data catalogue, subscriptions, API
- **Data + Research** — add backtesting and model training
- **Data + Research + Execution** — add live trading and execution analytics
- **Full Suite** — all services
- **Custom Packs** — bespoke combinations for larger clients

The platform must:

- Enforce these package boundaries
- Show clear upgrade/downgrade paths
- Log all access and usage for billing
- Support trial/demo access with time/feature limits

---

## 12. Development Priorities for Future Work

This architectural foundation enables the following deepening prompts (in order):

1. **Public Landing & Service Discovery** — marketing pages, service descriptions, signup flow
2. **Authenticated Service Hub** — post-login dashboard, service discovery, entitlement display
3. **Data Service UX** — catalogue, subscriptions, API management
4. **Research/Simulation Platform** — model training, backtesting, signal configuration
5. **Trading Dashboard** — positions, orders, risk, live execution analytics
6. **Reporting & Investment Management** — P&L, performance, attribution, settlement
7. **Admin & Onboarding** — org management, user roles, service subscriptions
8. **Deployment & DevOps** — infrastructure, CI/CD, monitoring (internal-only)
9. **Audit & Compliance** — provenance, event history, regulatory evidence (internal-restricted)

---

## 13. Context & References

### In This Repository

- **`/context/AGENT_UI_STRUCTURE.md`** — Detailed implementation prompt for the first structural refactor
- **`/context/CONTEXT_GUIDE.md`** — Guide to using context documents in this repo
- **`/context/codex/`** — Unified Trading System codex (patterns, standards, architecture decisions)
- **`/context/pm/`** — Product management docs, feature inventory, commercial milestones
- **`/context/api-contracts/`** — API schemas and contract definitions
- **`/context/internal-contracts/`** — Internal event and schema definitions

### Parent System References

- **Unified Trading System** — `unified-trading-system-repos` (multi-repo workspace)
- **PM Repository** — `unified-trading-pm` (plans, standards, codex, scripts)
- **Codex SSOT** — `unified-trading-codex/00-SSOT-INDEX.md` (architecture, coding standards, observability)

---

## 14. How to Use This Document

### For Agents Starting Fresh

1. **Read sections 1–5** to understand what the platform is and what roles matter
2. **Skim section 3** (workflow model) to see how services connect
3. **Reference section 6–9** when deciding where features belong
4. **Check section 10** for design patterns when building new features
5. **Use section 13** to find detailed context docs for deeper questions

### For Implementation Prompts

When you receive a prompt to build a feature or refactor an area:

1. Map it to one of the **three experience modes** (public, client, internal)
2. Identify which **service area** it belongs to
3. Check the **role-based access rules** (section 9)
4. Apply the relevant **design patterns** (section 10)
5. Ensure **commercial modularity** is respected (section 11)

### For Architecture Questions

- **"Where should this feature live?"** → See sections 6–9
- **"Who can see this?"** → See section 9 (role-based rules)
- **"How do we name this service/workflow?"** → See section 3 (lifecycle model)
- **"What's the design language?"** → See section 2

---

## 15. Core Principles (TL;DR)

1. **One system, three tiers** — public, client, internal; same UI language; different data/permissions
2. **Role-aware by default** — always know who's logged in, what services they're entitled to, what they can do
3. **Org-first architecture** — all data scoped to org; org admins control access; client data never leaks to other clients
4. **Workflow-aligned naming** — use Design→Simulate→Promote→Run→Monitor→Explain→Reconcile language; avoid arbitrary categories
5. **Transparency on restrictions** — don't hide locked features; explain why they're locked and how to unlock them
6. **Institutional feel** — dark, premium, calm, operator-grade; strong status cues; clear provenance
7. **No ad-hoc one-offs** — every feature should fit into the service/role/workflow model; resist designing in isolation

---

**Version:** 1.0
**Last Updated:** 2026-03-19
**Maintainer:** Unified Trading System UI Team
