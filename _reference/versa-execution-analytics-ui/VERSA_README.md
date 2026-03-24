# VERSA — Vite Execution & Result Strategy Analytics

Standalone monorepo for strategy/execution backtesting, result analysis, and parameter tuning. All internal workspace dependencies are vendored as local packages — zero external workspace references required.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5174 — runs fully in mock mode by default (no backend required).

## Architecture

This is an npm workspaces monorepo. The `packages/` directory contains three vendored libraries that were originally separate workspace repos:

| Package                    | Source                 | Purpose                                                                           |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| `@unified-trading/ui-kit`  | `packages/ui-kit/`     | Radix-based component library (AppShell, Badge, Button, Card, Select, Tabs, etc.) |
| `@unified-trading/ui-auth` | `packages/ui-auth/`    | OAuth 2.0 PKCE auth (Google + AWS Cognito)                                        |
| `@unified-admin/core`      | `packages/admin-core/` | API client, auth helpers, stress data generators                                  |

The app source lives in `src/` and is identical to the original `execution-analytics-ui` repo.

## Pages / Routes

| Route                  | Page                    | Description                          |
| ---------------------- | ----------------------- | ------------------------------------ |
| `/run`                 | RunBacktest             | Configure and trigger backtest runs  |
| `/results`             | Analysis                | Browse and analyze execution results |
| `/load`                | LoadResults             | Load results from GCS/S3 buckets     |
| `/grid`                | GridResults             | Grid search parameter exploration    |
| `/grid-results`        | GridResults             | Grid search results viewer           |
| `/analysis`            | Analysis                | Deep execution analysis              |
| `/deep-dive`           | DeepDive                | Per-order deep dive                  |
| `/deep-dive/:configId` | DeepDive                | Config-specific deep dive            |
| `/compare`             | AlgorithmComparison     | Side-by-side algorithm comparison    |
| `/configs`             | ConfigBrowser           | Browse and edit strategy configs     |
| `/generate`            | ConfigGenerator         | Generate new configs                 |
| `/instruments`         | InstrumentDefinitions   | Instrument metadata browser          |
| `/availability`        | InstructionAvailability | Data availability heatmap            |
| `/instructions`        | InstructionAvailability | Instruction set browser              |
| `/tick-data`           | MarketTickData          | Tick data explorer                   |
| `/deployments`         | DeploymentsPage         | Deployment status panel              |

## Environment Variables

Copy `.env.example` to `.env.development` (already done). The defaults enable full mock mode:

| Variable         | Default                 | Description                                        |
| ---------------- | ----------------------- | -------------------------------------------------- |
| `VITE_MOCK_API`  | `true`                  | Intercept all `/api/` calls with local mock data   |
| `VITE_SKIP_AUTH` | `true`                  | Bypass OAuth login                                 |
| `VITE_API_URL`   | `http://localhost:8006` | Backend URL (only used when `VITE_MOCK_API=false`) |

## Mock API

When `VITE_MOCK_API=true`, `src/lib/mock-api.ts` overrides `window.fetch` to intercept all `/api/` routes and return realistic mock data. No backend process is required. Covered endpoints include:

- `/api/runs`, `/api/backtests`, `/api/backtest/run`, `/api/backtest/cancel`
- `/api/results/buckets`, `/api/results/prefixes`, `/api/results/files`
- `/api/backtest/status/:id`
- `/api/instruments`, `/api/configs`, `/api/tick-data`
- `/api/deployments`, `/api/services`, `/api/service-status`
- `/api/data/instruments`, `/api/data/tick-data/*`, `/api/data/strategies`
- `/api/data/configs`, `/api/data/configs/validate`, `/api/data/configs/content`
- `/api/config/generate`, `/api/config/generate-all`
- `/api/results/execution_alpha`
- `/api/health`, `/api/recon/breaks`

## CSS / Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. No `postcss.config.js` or `tailwind.config.js` required.

The design token system is defined in `packages/ui-kit/src/globals.css` and imported by `src/styles/globals.css`:

```css
@import "@unified-trading/ui-kit/globals.css";
```

The `@theme` block defines dark trading UI color tokens (`--color-background`, `--color-surface`, `--color-accent-*`, etc.) plus utility classes (`.badge-*`, `.nav-item`, `.metric-card`, etc.).

## Testing

```bash
npm test                    # run all unit tests
npm run test:coverage       # run with v8 coverage report
```

Uses vitest with `pool: "forks"` (prevents zombie node processes), jsdom environment, and `@testing-library/react`.

## Building for Production

```bash
npm run build
```

Runs `tsc && vite build`. Output lands in `dist/`.

## TypeScript Path Resolution

Both `vite.config.ts` and `tsconfig.json` declare matching aliases so IDE intellisense and the build tool agree:

| Import                                | Resolves to                        |
| ------------------------------------- | ---------------------------------- |
| `@unified-trading/ui-kit`             | `packages/ui-kit/src/index.ts`     |
| `@unified-trading/ui-kit/globals.css` | `packages/ui-kit/src/globals.css`  |
| `@unified-trading/ui-auth`            | `packages/ui-auth/src/index.ts`    |
| `@unified-admin/core`                 | `packages/admin-core/src/index.ts` |
| `@/*`                                 | `src/*`                            |

## Directory Structure

```
versa-execution-analytics-ui/
├── packages/
│   ├── ui-kit/src/          # @unified-trading/ui-kit — Radix component library
│   │   ├── components/ui/   # Badge, Button, Card, AppShell, etc.
│   │   ├── lib/utils.ts     # cn() helper
│   │   ├── mock/            # installMockHandlers, registerMockHandler
│   │   └── globals.css      # Tailwind v4 @theme design tokens
│   ├── ui-auth/src/         # @unified-trading/ui-auth — OAuth PKCE
│   │   ├── AuthContext.tsx  # AuthProvider, useAuth
│   │   ├── RequireAuth.tsx  # Route guard
│   │   ├── authFetch.ts     # Authenticated fetch helpers
│   │   └── adapters/        # GoogleAdapter, CognitoAdapter
│   └── admin-core/src/      # @unified-admin/core — API client + auth helpers
│       ├── api-client/      # createApiClient, ApiError
│       ├── auth/            # getSessionToken, PKCE helpers
│       ├── components/      # Shared React components
│       ├── hooks/           # Shared React hooks
│       └── stress/          # Stress test data generators
├── src/
│   ├── api/                 # API client wrappers and TypeScript types
│   ├── lib/                 # mock-api.ts, chart-theme.ts
│   ├── pages/               # 16 page components
│   ├── stores/              # Zustand stores (filterStore, resultsStore)
│   ├── styles/globals.css   # Imports ui-kit globals.css
│   ├── App.tsx              # Router + AppShell
│   └── main.tsx             # Entrypoint, installs mock handlers
├── vite.config.ts           # Vite + Tailwind v4 + path aliases
├── tsconfig.json            # TypeScript config with path aliases
├── vitest.config.ts         # Test runner config (pool: forks)
├── .env.development         # VITE_MOCK_API=true VITE_SKIP_AUTH=true
└── package.json             # npm workspaces root
```
