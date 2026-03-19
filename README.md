# Unified Trading System UI

A unified institutional trading platform UI supporting data, research, execution, reporting, and internal operations.

## Quick Start

**Read this first:** [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)

This document explains:
- What the platform is and who uses it
- The three experience modes (public, client, internal)
- Role-based access control
- Service areas and workflows
- Design patterns and principles

## Structure

- **`/context`** — Reference documents, standards, codex, and API contracts from the Unified Trading System
  - `AGENT_UI_STRUCTURE.md` — Implementation prompt for the first structural refactor
  - `CONTEXT_GUIDE.md` — How to use context documents
  - `codex/` — Architecture, coding standards, patterns
  - `pm/` — Product management, feature inventory, commercial milestones
  - `api-contracts/` — API schemas and definitions
  - `internal-contracts/` — Internal event and schema definitions

## Key Concepts

### Three Experience Modes

1. **Public** — Prospective users, no auth
2. **Client** — Authenticated, org-scoped, entitled services only
3. **Internal** — Full platform, role-based access, admin/ops/compliance

### Service Areas

- Data (catalogue, subscriptions, API)
- Research & Simulation (models, backtesting, signals)
- Trading & Execution (live trading, execution analytics)
- Reporting & Investment Management (P&L, fees, settlement)
- Admin (org management, user roles, billing)
- Deployment & DevOps (infrastructure, CI/CD)
- Audit & Compliance (provenance, event history)

### Core Workflow

**Design → Simulate → Promote → Run → Monitor → Explain → Reconcile**

This lifecycle guides service naming, navigation, and feature organization.

## Collaborators

- **CosmicTrader** — Co-builder
- **datadodo** — Co-builder

## References

- **Parent System:** `unified-trading-system-repos` (multi-repo workspace)
- **PM & Codex:** `unified-trading-pm` (plans, standards, architecture)
- **Architecture Standards:** `unified-trading-codex/00-SSOT-INDEX.md`

---

**Read [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md) before starting any work.**