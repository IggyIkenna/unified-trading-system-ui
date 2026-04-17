# Unified Trading System UI — Architecture & Workflow Overview (AROW)

**Last verified: 2026-04-17**
_Absorbs: ARCHITECTURE_HARDENING §3C / §7 / §11.1; V0_SYSTEM_PROMPT USPs._

**READ THIS FIRST.** This is the canonical platform-vision reference for the
Unified Trading System UI (Next.js 16.2.1 App Router). It describes the
platform as it actually is — not an aspirational target — and is verified
against the source of truth files listed in the appendix.

---

## 1. Platform Vision

### 1.1 What This Platform Is

The Unified Trading System UI is **ONE platform, not three**. Prospects,
clients, and internal operators all use the SAME pages. The API scopes data
by `org_id` + entitlements. There is never a `ClientPositionsTable` alongside
an `InternalPositionsTable` — there is one `PositionsTable`, filtered.

The platform covers the full institutional workflow:

- **Data** — instrument catalogue, venue coverage, data freshness monitoring
- **Research** — ML model training, signal configuration, backtesting
- **Promote** — multi-day strategy review, candidate basket, approval queue
- **Trading** — live terminal, positions, orders, accounts, market overview
- **Observe** — risk, alerts, news, strategy & system health
- **Reports** — P&L attribution, settlement, reconciliation, regulatory
- **Investor Relations** — board / shareholder presentations and demos
- **Admin & Ops** — onboarding, mandates, fees, deployments, service registry

### 1.2 Unique Selling Points

1. **Coverage.** 33 venues, 5 asset classes, full trading-system access —
   not a pretty shell over one exchange.
2. **Seamless internal/external.** Internal desks and external clients run
   on the same system. The only differences are entitlements and scope
   filters applied in the API.
3. **Backtest↔live diff.** If clients use our data, models, and strategies,
   they get first-class parity between backtest and live execution.

### 1.3 Design Doctrine

- Institutional, dark, calm, operator-grade
- Information-forward density without clutter
- Strong status, identity, and provenance cues (who, when, scope)
- One shell language across public, platform, and ops surfaces

---

## 2. Route Group Topology

The App Router is organised into three route groups with clear access rules.

| Group        | Mount              | Auth           | Audience           | Purpose                                  |
| ------------ | ------------------ | -------------- | ------------------ | ---------------------------------------- |
| `(public)`   | `app/(public)/*`   | None           | Prospects          | Marketing, signup, login, `/services/*`  |
| `(platform)` | `app/(platform)/*` | Required       | Client + Internal  | The product surface — same pages for all |
| `(ops)`      | `app/(ops)/*`      | Internal/admin | Internal operators | Admin, DevOps, compliance, manage        |

Key routes:

- `/dashboard` — post-login hub (see §4)
- `/services/{data|research|trading|reports|...}/*` — product surfaces
- `/services/[domain]` (under `(public)/`) — marketing / capability pages
- `/admin/*`, `/devops/*`, `/manage/*`, `/compliance` — ops-only
- `/investor-relations` — board / shareholder / investor access

> Historical note: earlier drafts used `/service/*` (singular) and
> `/service/overview`. Both are gone. The canonical prefix is `/services/*`
> and the post-login landing is `/dashboard`.

---

## 3. Personas and Entitlement Model

There is **no fixed 3-tier role hierarchy**. The platform has a small role
enum (`admin`, `internal`, `client`) and a flexible **entitlement** system
that drives everything else. Demo personas are defined in
`lib/auth/personas.ts`.

### 3.1 Demo Persona Catalogue

| Persona ID            | Role     | Org             | Entitlements (summary)                                                                                             | Purpose                                                   |
| --------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `admin`               | admin    | Odum Internal   | `*`                                                                                                                | Full system admin — platform, ops, deployments, users     |
| `internal-trader`     | internal | Odum Internal   | `*`                                                                                                                | Internal desk — all platform features, no ops/admin pages |
| `client-full`         | client   | Alpha Capital   | `data-pro`, `execution-full`, `ml-full`, `strategy-full`, `reporting`, all trading premium                         | External client, full subscription                        |
| `client-premium`      | client   | Vertex Partners | `data-pro`, `execution-full`, `strategy-full`, trading basic                                                       | Premium execution client, no ML                           |
| `client-data-only`    | client   | Beta Fund       | `data-basic`                                                                                                       | Minimal client — 180 instruments, CEFI only               |
| `elysium-defi`        | client   | Elysium         | `data-pro`, `execution-full`, `trading-defi:basic`, `reporting`                                                    | DeFi-only client — AAVE/basis/staked-basis strategies     |
| `investor`            | client   | Odum IR         | `investor-relations`, `investor-board`, `investor-plan`, `investor-platform`, `investor-im`, `investor-regulatory` | Investor / board member — all IR material                 |
| `advisor`             | client   | Odum IR         | `investor-relations`, `investor-board`, `investor-plan`                                                            | Strategic advisor — board + plan decks only               |
| `prospect-im`         | client   | Odum IR         | `investor-relations`, `investor-im`                                                                                | Investment-management prospect                            |
| `prospect-platform`   | client   | Odum IR         | `investor-relations`, `investor-platform`, `data-pro`, `execution-full`, `reporting`                               | Platform prospect with live demo access                   |
| `prospect-regulatory` | client   | Odum IR         | `investor-relations`, `investor-regulatory`, `reporting`                                                           | Regulatory-umbrella prospect                              |

### 3.2 Entitlement Shapes

Entitlements are strings **or** `{ domain, tier }` objects for tiered
trading domains (`trading-common`, `trading-defi`, `trading-sports`,
`trading-options`, `trading-predictions` with `basic|premium`).
`"*"` is the wildcard granted to internal roles.

### 3.3 Scope Rules

- **Role gate.** `internalOnly` services (Admin & Ops) require
  `role ∈ {admin, internal}`.
- **Entitlement gate.** Every service declares `requiredEntitlements`.
  A wildcard entitlement (`*`) grants access; otherwise at least one
  declared entitlement must be present.
- **Org scope.** `org_id` is attached to the token and propagates to every
  API call. Clients never see another org's data. Internal roles can
  cross-cut but every cross-org view is auditable.

### 3.4 No Separate "Experience Modes"

There is no public / client / internal code split. The same page is
rendered for everyone; the differences are:

1. Which services appear in the hub (via `getVisibleServices()`).
2. Which rows/columns the API returns.
3. Whether ops/admin links are rendered in the shell.

---

## 4. Post-Login Hub: `/dashboard`

`app/(public)/login/page.tsx` redirects authenticated users to
`/dashboard` (falling back to the original `redirect` query string if
present). The hub is the central discovery and entry point — NOT a
generic widget dashboard.

### 4.1 Hub Sections

1. **Service Grid.** One card per service from `SERVICE_REGISTRY` in
   `lib/config/services.ts`, filtered through `getVisibleServices(entitlements, role)`. Each card shows service name, icon, lifecycle colour, and entitlement-aware state.
2. **Activity Feed.** Recent cross-service events — e.g. "Strategy Alpha-7
   promoted to live", "Settlement #4521 completed", "Risk limit breach on
   Binance".
3. **Quick Actions.** Role-aware shortcuts. A client quant gets "New
   Backtest" and "Check Data Status"; an internal trader gets "Trading
   Dashboard" and "Deployment Status"; an admin gets "Manage Users" and
   "Audit Log".
4. **System Health Bar.** Aggregate service health. Internal users see
   all services; clients see only the ones they're entitled to.

### 4.2 Service Card States

| State         | Visual                      | Interaction                      | Who sees it                                |
| ------------- | --------------------------- | -------------------------------- | ------------------------------------------ |
| **Available** | Full colour, active         | Click → product surface          | Users with matching entitlement            |
| **Locked**    | Greyed, lock icon           | Click → upgrade modal            | Users without entitlement (service shown)  |
| **Hidden**    | Not rendered                | —                                | Wrong role (client cannot see admin)       |
| **Degraded**  | Yellow border, warning icon | Click → product surface + banner | Subscribed users when service is unhealthy |

### 4.3 Implementation References

- Registry: `lib/config/services.ts` → `SERVICE_REGISTRY`, `getVisibleServices()`
- Auth context: `hooks/use-auth.ts` → `{ role, org, entitlements, isInternal() }`
- API hooks: `hooks/api/use-service-status.ts` — service overview + freshness
- Page: `app/(platform)/dashboard/page.tsx`

---

## 5. Lifecycle Workflow Model

All service areas and navigation labels align with the platform lifecycle.

| Stage       | Nav label | Services                    |
| ----------- | --------- | --------------------------- |
| **Acquire** | Data      | Data                        |
| **Build**   | Research  | Research                    |
| **Promote** | Promote   | Research → Trading handoff  |
| **Run**     | Trading   | Trading                     |
| **Execute** | Trading   | Trading (live execution)    |
| **Observe** | Observe   | Trading, Alerting           |
| **Report**  | Reports   | Reports, Investor Relations |
| **Manage**  | Admin     | Admin & Ops                 |

(Lifecycle enum: `acquire | build | promote | run | execute | observe | manage | report`, per `ServiceDefinition.lifecycleStage` in `lib/config/services.ts`.)

**In the UI:** service-area language and navigation labels must use these
stage names. Avoid arbitrary categories that break the mental model.

---

## 6. Service Registry (Source of Truth)

The canonical list of services, their entry routes, and required
entitlements lives in `lib/config/services.ts`. The table below is derived
from it — do not edit this table in isolation; update the registry and
regenerate.

| Key                  | Label              | Entry Route                              | Lifecycle | Required Entitlements               | Internal-only |
| -------------------- | ------------------ | ---------------------------------------- | --------- | ----------------------------------- | ------------- |
| `data`               | Data               | `/services/data/overview`                | acquire   | `data-basic`, `data-pro`            | No            |
| `research`           | Research           | `/services/research/overview`            | build     | `strategy-full`, `ml-full`          | No            |
| `promote`            | Promote            | `/services/research/strategy/candidates` | promote   | `strategy-full`, `ml-full`          | No            |
| `trading`            | Trading            | `/services/trading/overview`             | run       | `execution-basic`, `execution-full` | No            |
| `observe`            | Observe            | `/services/trading/risk`                 | observe   | `execution-basic`, `execution-full` | No            |
| `reports`            | Reports            | `/services/reports/overview`             | report    | `reporting`                         | No            |
| `investor-relations` | Investor Relations | `/investor-relations`                    | report    | `investor-relations`                | No            |
| `admin`              | Admin & Ops        | `/admin`                                 | manage    | `*`                                 | **Yes**       |

---

## 7. Universal Service Funnel

Every service area follows the same funnel. Users arrive from different
doors but converge on the same product page, filtered by scope.

| Door         | Who                          | Entry Point                            | Journey                                                                                          |
| ------------ | ---------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Prospect** | Unauthenticated              | Landing → `(public)/services/[domain]` | Marketing page → "Subscribe" → register → login → `/dashboard` → click card → product surface    |
| **Client**   | Authenticated, subscribed    | Login → `/dashboard`                   | Hub shows entitled services (coloured) + locked services (greyed) → click → product (org-scoped) |
| **Internal** | Authenticated, internal role | Login → `/dashboard`                   | Hub shows all services → click → product (unrestricted, plus admin/ops links)                    |

Every service detail page handles three data states:

- **Subscribed:** full functionality, org-scoped data
- **Not subscribed:** locked overlay with "Upgrade" CTA explaining what the service provides
- **Internal:** full data, no restrictions, admin/ops links visible

**Rule:** ONE page per service area. Never build separate client vs
internal versions of the same page.

---

## 8. Lifecycle Naming Conventions

_(Absorbed from ARCHITECTURE_HARDENING §3C.)_

Service areas, navigation labels, and page titles MUST align with the
lifecycle model.

| Lifecycle Stage | Nav Label | Service Area                  | Colour Token                   |
| --------------- | --------- | ----------------------------- | ------------------------------ |
| Design          | Design    | Research / Simulate           | `--surface-design` (purple)    |
| Simulate        | Simulate  | Research / Simulate           | `--surface-simulate` (blue)    |
| Promote         | Promote   | Research → Trading handoff    | `--surface-promote` (green)    |
| Run             | Run       | Trading / Execution           | `--surface-run` (orange)       |
| Monitor         | Monitor   | Trading / Execution, Alerting | `--surface-monitor` (red)      |
| Explain         | Explain   | Reporting, Analytics          | `--surface-explain` (cyan)     |
| Reconcile       | Reconcile | Reporting, Settlement         | `--surface-reconcile` (yellow) |

### Naming Rules

- Navigation groups use lifecycle stage names, not arbitrary categories.
- Page titles can be more specific (e.g. "Backtest Results" under Simulate).
- Service hub cards use the service area name (e.g. "Research & Simulation").
- Internal documentation uses both (e.g. "Research/Simulate service — Design & Simulate stages").

### Forbidden Names

Do NOT use these as primary navigation labels:

- "Build" (too vague — use Design or Simulate)
- "Analyse" (too vague — use Explain)
- "Explore" (too vague — use the specific lifecycle stage)
- "Research" alone (use "Research & Simulation" or map to Design/Simulate)

---

## 9. Information Architecture & Shell

### 9.1 Shell Modes

- **Public shell** — logo, marketing nav, sign-in, `/services/*` landing pages
- **Platform shell** — org/role badge, service nav, user menu, logout
- **Ops shell** — admin/ops panels, compliance surfaces, deployment controls

All three feel like one system. Transitions between modes are explicit
but not jarring.

### 9.2 Navigation Rules

- Services are discoverable via role-aware navigation sourced from
  `getVisibleServices()`.
- Hidden services don't appear in menus, search, or command palettes.
- Access-denied messaging is explanatory, never cryptic.
- Locked services show WHY (not subscribed, role not authorised, feature
  unavailable) and HOW to unlock (upgrade, contact sales, request access).

### 9.3 State & Data

- **Auth:** `hooks/use-auth.ts` returns `{ role, org, entitlements }`.
  Internal = `["*"]`; clients = subset.
- **Shard-aware:** shard → venue → instrument. Market data is shared;
  positions/risk are org-scoped; registry is subscription-filtered.
  See `context/SHARDING_DIMENSIONS.md`.
- **State:** Zustand stores under `lib/stores/` (every store has
  `reset()`). React Query under `hooks/api/`. URL params own filter state.
- **Mocks:** MSW handlers under `lib/mocks/` — same endpoint, different
  data per persona.

---

## 10. Design Patterns

### 10.1 Locked Service Visibility

When a client hits a locked service:

1. Show the card/link in a disabled/greyed state.
2. Explain why (not subscribed, role, feature gating).
3. Provide an upgrade / request-access CTA where applicable.
4. Do NOT hide the service entirely — transparency matters.

### 10.2 Org-Level Data Isolation

All queries scoped to `org_id`. No cross-org data ever leaks to client
users. Internal cross-org views are auditable.

### 10.3 Role-Aware Depth

The same feature (e.g. execution analytics) adapts to scope rather than
forking. Client view = own-org data, limited drill-down, export
restrictions. Internal view = cross-org analytics, full drill-down. It
feels like the same tool, not a separate product.

### 10.4 Status & Provenance

Every important entity (strategy, order, model, report) surfaces:

- Creator / last modifier and timestamp
- Status (draft, in-review, live, archived)
- Visibility (org-only, internal-only, shared)
- Restrictions and caveats

---

## 11. Commercial Entitlements

_(Per-service entitlement mapping — replaces older "package table".
Source of truth: `lib/config/services.ts` and `lib/auth/personas.ts`.)_

### 11.1 Service → Entitlement Map

| Service            | Required Entitlements                 | Typical Persona                      |
| ------------------ | ------------------------------------- | ------------------------------------ |
| Data               | `data-basic` OR `data-pro`            | `client-data-only`, `client-full`    |
| Research           | `strategy-full` OR `ml-full`          | `client-full`, `client-premium`      |
| Promote            | `strategy-full` OR `ml-full`          | `client-full`, internal              |
| Trading            | `execution-basic` OR `execution-full` | `client-full`, `client-premium`      |
| Observe            | `execution-basic` OR `execution-full` | `client-full`, `client-premium`      |
| Reports            | `reporting`                           | `client-full`, `prospect-platform`   |
| Investor Relations | `investor-relations`                  | `investor`, `advisor`, all prospects |
| Admin & Ops        | `*` + role ∈ {admin, internal}        | `admin`                              |

### 11.2 Tiered Trading Domains

`trading-common`, `trading-defi`, `trading-sports`, `trading-options`,
`trading-predictions` use `{ domain, tier }` entitlements with `basic |
premium`. Example:

- `elysium-defi` has `{ domain: "trading-defi", tier: "basic" }` — DeFi
  trading tab unlocked at basic tier; other trading domains hidden.
- `client-full` has every trading domain at `premium`.

### 11.3 Compute Entitlements (future)

Beyond access, compute-intensive features will carry usage limits
(backtest compute hours, ML GPU hours, data API calls, export bandwidth).
Not enforced today; the UI should display usage meters and upgrade CTAs
as we introduce them.

---

## 12. Development Priorities

1. Post-login `/dashboard` hub (grid, activity, quick actions, health).
2. Public `(public)/services/[domain]` marketing pages complete.
3. `/services/data/*` catalogue, subscriptions, API management.
4. `/services/research/*` model training, backtesting, signal config.
5. `/services/trading/*` positions, orders, risk, live analytics.
6. `/services/reports/*` P&L, attribution, settlement.
7. `/admin/*` onboarding, user management, subscriptions.
8. `/devops/*` infra, CI/CD, health aggregation (internal-only).
9. `/compliance` audit trail, evidence (internal + scoped client).

---

## 13. Core Principles (TL;DR)

1. **One platform, not three.** Same pages for everyone; scope filters
   differ.
2. **Entitlement-driven, not tier-driven.** The 3-tier role abstraction
   is gone; personas and entitlements are the truth.
3. **`/dashboard` is the hub.** Every product surface is reachable from
   it. No orphan pages.
4. **Lifecycle-aligned language.** Use `acquire → build → promote → run
→ observe → report` (and the extended Design→Reconcile vocabulary in
   §8) everywhere.
5. **Zero hardcoding.** Services come from `lib/config/services.ts`;
   personas from `lib/auth/personas.ts`; colours from `globals.css`
   tokens.
6. **One component per view.** No `ClientX` + `InternalX` pairs. Ever.
7. **Transparency on restrictions.** Locked features are visible and
   explained.

---

## Appendix A — Source-of-Truth Files

| Concern              | File                                |
| -------------------- | ----------------------------------- |
| Personas             | `lib/auth/personas.ts`              |
| Auth types           | `lib/config/auth.ts`                |
| Service registry     | `lib/config/services.ts`            |
| Post-login redirect  | `app/(public)/login/page.tsx`       |
| Hub page             | `app/(platform)/dashboard/page.tsx` |
| Auth hook            | `hooks/use-auth.ts`                 |
| Service-status hooks | `hooks/api/use-service-status.ts`   |
| Mock handlers        | `lib/mocks/*`                       |
| Sharding dimensions  | `context/SHARDING_DIMENSIONS.md`    |
| API gaps             | `context/API_FRONTEND_GAPS.md`      |

---

## Appendix B — How to Use This Document

### Fresh agents

1. Read §1–§4 for vision, topology, personas, hub.
2. Skim §5 and §8 for lifecycle language.
3. Reference §6 and §11 when deciding where a feature belongs and who
   can see it.
4. Apply §10 patterns when building features.
5. Follow Appendix A to reach source-of-truth files.

### Implementation prompts

Every feature must answer:

1. Which service key does it belong to?
2. Which lifecycle stage?
3. Which entitlements gate it?
4. Which personas demonstrate it?
5. How does it surface on `/dashboard`?

### Architecture questions

- "Where should this live?" → §2 topology + §6 registry
- "Who can see this?" → §3 personas + §11 entitlements
- "What do we call this?" → §5 and §8
- "What's the design language?" → §1.3

---

**Maintainer:** Unified Trading System UI Team
