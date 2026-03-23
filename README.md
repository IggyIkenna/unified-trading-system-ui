# Unified Trading System UI

A unified institutional trading platform UI supporting data, research, execution, reporting, and internal operations.

## Quick Start

| Document | Purpose |
|---|---|
| [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) | Folder map, state management, tech stack — **read this first** |
| [AGENT_PROMPT.md](./AGENT_PROMPT.md) | Compact agent orientation — rules, patterns, current state |
| [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md) | Platform vision, role model, lifecycle, service areas |
| [START_HERE.md](./START_HERE.md) | Step-by-step onboarding for new developers and agents |

## Tech Stack

- **Framework**: Next.js 15, App Router, TypeScript strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand (client) + React Query (server)
- **Testing**: Jest (unit) + Playwright (E2E)
- **API mocking**: MSW (Mock Service Worker)
- **Linting**: ESLint + 2 custom rules

## Architecture

Three route groups, one canonical content tree:

```
app/(public)/              Unauthenticated — marketing, login, signup
app/(platform)/service/    Authenticated — ALL platform content lives here
app/(ops)/                 Internal operators — admin, devops, compliance
```

All legacy flat routes (`/trading/*`, `/execution/*`, `/ml/*`, `/research/*`, `/strategy-platform/*`) are permanent redirects to `/service/*` in `next.config.mjs`.

## Key Concepts

### Three Experience Modes

1. **Public** — Prospective users, no auth
2. **Client** — Authenticated, org-scoped, entitled services only
3. **Internal** — Full platform, role-based access, admin/ops/compliance

### Service Areas

- Data (catalogue, subscriptions, venues, markets)
- Research & Simulation (strategy backtesting, ML models, quant workspace)
- Trading & Execution (live trading, execution analytics, TCA)
- Reporting (P&L, executive reports, settlement, reconciliation)
- Admin (org management, user roles, billing)
- Deployment & DevOps (infrastructure, CI/CD)
- Audit & Compliance (provenance, event history)

### Core Workflow

**Design -> Simulate -> Promote -> Run -> Monitor -> Explain -> Reconcile**

This lifecycle guides service naming, navigation, and feature organization.

## Documentation

| File | Covers |
|---|---|
| [docs/STRUCTURE_APP.md](docs/STRUCTURE_APP.md) | Route groups, page inventory, redirect map, layout hierarchy |
| [docs/STRUCTURE_COMPONENTS.md](docs/STRUCTURE_COMPONENTS.md) | All 11 component domains, key files, naming rules |
| [docs/STRUCTURE_LIB.md](docs/STRUCTURE_LIB.md) | lib/ layout — types, stores, mocks, config, utilities |
| [docs/STRUCTURE_HOOKS.md](docs/STRUCTURE_HOOKS.md) | hooks/api/ and hooks/deployment/ — patterns |
| [docs/STRUCTURE_CONTEXT.md](docs/STRUCTURE_CONTEXT.md) | context/ folder — backend reference material |
| [docs/STRUCTURE_REFERENCE.md](docs/STRUCTURE_REFERENCE.md) | _reference/ Python services |
| [ROUTES.md](./ROUTES.md) | Full route reference with redirect map |
| [SERVICE_COMPLETION_STATUS.md](./SERVICE_COMPLETION_STATUS.md) | Per-service completion matrix |
| [UX_FLOW_SPEC.md](./UX_FLOW_SPEC.md) | Canonical user journeys |
| [TESTING.md](./TESTING.md) | Testing strategy and utilities |
| [QA_GATES.md](./QA_GATES.md) | Pre-deploy verification steps |
| [docs/MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md](docs/MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md) | **Browser-only / static mock:** full strategy catalog, dependencies, UI verification (hand to external agents + PDF) |
| [docs/MOCK_STATIC_EVALUATION_SPEC.md](docs/MOCK_STATIC_EVALUATION_SPEC.md) | Maintainer pointer: env, paths, link to handbook |
| [COMPLIANCE_REFACTOR.md](./COMPLIANCE_REFACTOR.md) | FCA regulatory specification |

## References

- **Parent System:** `unified-trading-system-repos` (multi-repo workspace)
- **PM & Codex:** `unified-trading-pm` (plans, standards, architecture)
- **Architecture Standards:** `unified-trading-codex/00-SSOT-INDEX.md`
