# Unified Trading System UI

Next.js 16 App Router frontend for the unified trading platform — a customisable widget-based terminal for multi-asset, multi-venue operations across DeFi, CeFi, TradFi, sports prediction markets, and derivatives.

## Prerequisites

- **Node.js 22+**
- **pnpm** (canonical package manager for this repo)

## Install

```bash
pnpm install
```

## Develop

```bash
pnpm dev
```

Dev server starts on `http://localhost:3000`.

## Test

Unit, integration, and audit suites run under Vitest (happy-dom):

```bash
pnpm test                # all Vitest projects
pnpm test:unit           # unit only
pnpm test:integration    # integration only
pnpm test:audit          # audit only
pnpm test:ci             # CI run with coverage
```

Static E2E (Playwright against a prebuilt mock-data bundle):

```bash
pnpm exec playwright test --config playwright.static.config.ts
```

## Build

Mock-data build smoke (no backend required):

```bash
NEXT_PUBLIC_MOCK_API=true pnpm build
```

## Data Mode

The UI runs in one of two modes, toggled by a single environment variable:

- `NEXT_PUBLIC_MOCK_API=true` — all API calls served from in-repo fixtures; deterministic, offline, used for builds, static E2E, and demos.
- `NEXT_PUBLIC_MOCK_API=false` (default) — live backend via `NEXT_PUBLIC_API_BASE_URL`.

Fixtures, helper contracts, and fallback rules are documented in [`docs/DATA_MODE_IDEOLOGY.md`](docs/DATA_MODE_IDEOLOGY.md).

## Project Structure

```
app/
  (public)/        Unauthenticated routes — marketing, login, signup
  (platform)/     Authenticated platform content (services/* canonical)
    services/
  (ops)/           Internal operators — admin, devops, compliance
components/        Reusable UI (widgets, shadcn primitives, domain components)
lib/               Types, stores, mocks, config, utilities
hooks/             React hooks (api/, deployment/, shared)
tests/
  unit/
  integration/
  audit/
  e2e/
docs/              Architecture, deployment, testing, data-mode docs
build-artifacts/   Build output
```

Routes under `/services/*` are plural and canonical; legacy singular paths redirect.

## Documentation

| Document                                                                                                           | Purpose                                                   |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [docs/under-review/CODEBASE_STRUCTURE.md](docs/under-review/CODEBASE_STRUCTURE.md)                                 | Folder map, state management, tech stack — **read first** |
| [docs/under-review/ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](docs/under-review/ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md) | Platform vision, role model, lifecycle, service areas     |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                                                                           | Deployment pipeline and environments                      |
| [docs/under-review/TESTING.md](docs/under-review/TESTING.md)                                                       | Testing strategy, utilities, fixture conventions          |
| [docs/DATA_MODE_IDEOLOGY.md](docs/DATA_MODE_IDEOLOGY.md)                                                           | Mock vs live data contract                                |

## License

UNLICENSED — proprietary. Copyright Odum Capital.
