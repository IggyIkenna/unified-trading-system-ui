# Architecture

## Overview

`client-reporting-ui` is a React/TypeScript single-page application that provides client-facing
performance reports, portfolio analytics, and account statements. It consumes data from
`pnl-attribution-service` and `position-balance-monitor-service`.

## Tech Stack

- Framework: React 18
- Language: TypeScript 5.3
- Build tool: Vite 5
- Routing: (none declared — single-view SPA)
- Auth: Okta OIDC (configured via `VITE_OKTA_ISSUER` / `VITE_OKTA_CLIENT_ID`)
- Testing: Vitest (unit), Playwright (e2e)
- Linting: ESLint + TypeScript-ESLint
- Formatting: Prettier

## Component Structure

```
src/
  App.tsx              # Root component; renders current report view
  main.tsx             # Application entry point
  auth/
    GoogleAuth.tsx     # Google OAuth integration component
    RequireAuth.tsx    # Auth guard — redirects unauthenticated users
  pages/
    GenerateReportPage.tsx  # Report generation form and trigger UI
    PerformancePage.tsx     # Performance metrics and attribution display
    ReportsPage.tsx         # List and download of generated reports / statements
  vite-env.d.ts        # Vite environment type declarations
```

The auth layer (`auth/`) guards all routes. Pages call the reporting backend to retrieve
performance data and pre-generated statement documents for download.

## Data Flow

1. User authenticates via Okta (OIDC) or Google OAuth depending on deployment context.
2. `RequireAuth` verifies the session token before rendering any page.
3. Page components fetch report data from `VITE_API_BASE_URL` using authenticated requests.
4. `GenerateReportPage` POSTs report generation jobs; `ReportsPage` polls or lists job results.
5. Completed reports are streamed or linked for client download.

## Key Dependencies

- `react` / `react-dom` ^18.2.0 — UI rendering
- `vite` ^5.0.0 — dev server and production bundler
- `@vitejs/plugin-react` ^4.2.0 — JSX transform and Fast Refresh
- `vitest` ^1.1.0 — unit test runner
- `@playwright/test` ^1.58.2 — end-to-end / smoke tests
- `typescript` ^5.3.0 — static typing
