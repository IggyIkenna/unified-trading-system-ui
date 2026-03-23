# Codebase Structure — unified-trading-system-ui

**Read this first.** One page. Every agent must read this before touching code.
Deep documentation for each folder lives in `docs/STRUCTURE_*.md`.

---

## What This Repo Is

A Next.js 15 App Router TypeScript application. Institutional trading platform UI serving three audiences:
- **Public** — marketing, service discovery, demo
- **Client / org user** — authenticated, sees only their org's entitlements
- **Internal user** — full operator surface (quant, trader, risk, devops, compliance, admin)

Design language: dark, institutional, premium. Not a generic SaaS dashboard.

Lifecycle model the UI aligns to: **Design → Simulate → Promote → Run → Monitor → Explain → Reconcile**

---

## Folder Map (code only)

```
app/               Next.js pages — 3 route groups: (public), (platform), (ops)
components/        React components — 11 domain subfolders
lib/               Types, stores (Zustand), MSW mocks, config, utilities
hooks/             React Query data hooks (hooks/api/) + deployment hooks (hooks/deployment/)
context/           Read-only agent reference: API contracts, schemas, topology, config registry
styles/            globals.css — Tailwind + custom CSS variables
public/            Static assets, icons, MSW worker script
_reference/        Python FastAPI backends (deployment-api, versa-* services) — READ ONLY, do not modify
eslint-rules/      Custom ESLint rules (2 rules: button handler, filter prop)
```

---

## Architecture: Single Canonical Route Tree

**Critical (updated 2026-03-21):** All platform content now lives under `app/(platform)/services/`. Legacy flat routes (`/trading/*`, `/execution/*`, `/ml/*`, `/research/*`, `/strategy-platform/*`, etc.) are permanent redirects in `next.config.mjs` — there are no page files at those paths. See `docs/STRUCTURE_APP.md` for the full redirect map.

---

## Quick Decision Guide for Agents

| Task | Where to go |
|---|---|
| Add a new platform page | `app/(platform)/services/<domain>/` — **only canonical location** |
| Add a new redirect for renamed URL | `next.config.mjs` → `redirects()` array |
| Add a reusable component | `components/<domain>/` — pick the closest domain |
| Add a base UI primitive | `components/ui/` — shadcn/ui pattern |
| Add a data-fetching hook | `hooks/api/use-<domain>.ts` |
| Add a Zustand store | `lib/stores/` |
| Add domain types | `lib/<domain>-types.ts` (convention) or `lib/types/` |
| Add MSW mock handler | `lib/mocks/handlers/<domain>.ts` + register in `lib/mocks/handlers/index.ts` |
| Add app config or branding | `lib/config/` |
| Understand API shape / schema | `context/api-contracts/` |
| Understand what's not yet built | `context/API_FRONTEND_GAPS.md` |
| Understand backend data flow | `context/pm/data-flow-manifest.json` |
| Understand service config fields | `context/api-contracts/openapi/config-registry.json` |
| Understand backend Python patterns | `_reference/deployment-api/` — reference only |

---

## State Management Contract

| State type | Tool | Location |
|---|---|---|
| Server / async data | React Query | `hooks/api/use-*.ts` |
| Global filters (org, date, shard) | Zustand | `lib/stores/global-scope-store.ts` |
| Auth + role | Zustand | `lib/stores/auth-store.ts` |
| UI preferences (theme, layout) | Zustand | `lib/stores/ui-prefs-store.ts` |
| Feature filters | Zustand | `lib/stores/filter-store.ts` |
| Batch vs live mode | React Context | `lib/execution-mode-context.tsx` |

---

## Deleted Components (do not recreate)

The following were deleted in commit `8e536fc` — they had zero consumers after nav consolidation:
- `components/trading/global-nav-bar.tsx` — replaced by `shell/lifecycle-nav.tsx`
- `components/trading/app-shell.tsx` — GlobalNavBar wrapper, no longer needed
- `components/trading/lifecycle-rail.tsx` — merged into `shell/lifecycle-nav.tsx`
- `components/shell/role-layout.tsx` — role layout now handled inline
- `components/platform/unified-batch-shell.tsx` — no consumers

---

## Tech Stack

- **Framework**: Next.js 15, App Router, TypeScript strict mode
- **Styling**: Tailwind CSS + shadcn/ui components (`components.json`)
- **State**: Zustand (client) + React Query (server)
- **Testing**: Jest (unit) + Playwright (E2E in `e2e/`)
- **API mocking**: MSW (Mock Service Worker) — `public/mockServiceWorker.js`
- **Linting**: ESLint + 2 custom rules in `eslint-rules/`

---

## Deep Documentation

| File | Covers |
|---|---|
| [docs/STRUCTURE_APP.md](docs/STRUCTURE_APP.md) | Route groups, page inventory, dynamic routes, layout hierarchy |
| [docs/STRUCTURE_COMPONENTS.md](docs/STRUCTURE_COMPONENTS.md) | All 11 component domains, key files, naming rules |
| [docs/STRUCTURE_LIB.md](docs/STRUCTURE_LIB.md) | lib/ layout — types, stores, mocks, config, utilities |
| [docs/STRUCTURE_HOOKS.md](docs/STRUCTURE_HOOKS.md) | hooks/api/ and hooks/deployment/ — conventions and patterns |
| [docs/STRUCTURE_CONTEXT.md](docs/STRUCTURE_CONTEXT.md) | context/ folder — how to use backend reference material |
| [docs/STRUCTURE_REFERENCE.md](docs/STRUCTURE_REFERENCE.md) | _reference/ Python services — what they contain and when to read them |
