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

Local dev runs as **Tier 0 = Firebase Emulator Suite + in-browser API fixtures**. The two layers are orthogonal: Firebase SDK calls (Auth, Firestore, Storage) hit a local emulator pool seeded with the demo personas, and gateway-bound fetches (market data, positions, orders, P&L, reports) resolve from in-repo fixtures via `lib/api/mock-handler.ts`. Same Firebase code path as staging and prod (only project ID + emulator hosts change); widgets render without a Python service fleet running. See [codex/14-playbooks/authentication/firebase-local.md](../unified-trading-pm/codex/14-playbooks/authentication/firebase-local.md).

```bash
bash scripts/dev-tiers.sh --tier 0      # boots emulators + Next.js + auto-seeds personas
```

Dev server on `http://localhost:3000`. Emulator UI on `http://localhost:4000` (browse the Auth pool / Firestore docs).

The first boot writes the demo personas via the auto-seeder; subsequent boots restore from `.local-dev-cache/emulator-state/`. To re-seed manually, run `npm run emulators:seed`.

Two opt-out flags (rare):

- `--no-mock-api` — Firebase emulator only; widget fetches go nowhere (auth-flow testing).
- `--no-firebase-local` — point the dev server at a real Firebase project (requires `NEXT_PUBLIC_FIREBASE_*` in `.env.local`). For reproducing staging-only bugs.

`pnpm dev` directly is the bare Next.js dev server — useful for build-smoke / Storybook-style component work, not for end-to-end funnel flows. It does not boot the emulator suite or set the env vars the Firebase SDK needs.

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

The UI's API gateway-bound calls run in one of two modes, toggled by `NEXT_PUBLIC_MOCK_API`:

- `NEXT_PUBLIC_MOCK_API=true` — all API gateway calls (market data, positions, orders, P&L, reports, etc.) served from in-repo fixtures via `lib/api/mock-handler.ts`. Deterministic, offline, no Python services needed. **This is the Tier 0 default for local dev**, and is also used by CI smoke gates, `pnpm build` smoke, and static-E2E. The flag is orthogonal to Firebase: SDK paths (auth signin, Firestore reads/writes, Storage uploads) bypass mock-handler regardless and route through whatever Firebase config is active (emulator locally, real GCP for staging / prod).
- `NEXT_PUBLIC_MOCK_API=false` — live backend via `NEXT_PUBLIC_API_BASE_URL` (Tier 1+ topologies where the API gateways are running, or staging / prod images pointing at deployed Cloud Run).

Fixtures, helper contracts, and fallback rules are documented in [`docs/core/DATA_MODE_IDEOLOGY.md`](docs/core/DATA_MODE_IDEOLOGY.md). Auth-provider wiring is in [`docs/FIREBASE_ENVIRONMENTS.md`](docs/FIREBASE_ENVIRONMENTS.md).

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
