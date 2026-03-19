# Testing

## Test Framework

- **Unit tests**: Vitest 1.x — Vite-native, fast in-process test runner
- **End-to-end / smoke tests**: Playwright 1.58 — cross-browser browser automation

## Running Tests

```bash
# Unit tests (single run)
npm test

# Unit tests in watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e

# E2E with Playwright interactive UI
npm run test:e2e:ui

# Smoke tests (headless, used by CI)
npm run smoketest

# Smoke tests skipping recompile (when dist/ already built)
npm run smoketest-no-compile
```

## Type Checking

```bash
npm run type-check    # tsc --noEmit
```

Pre-commit hooks run `lint` and `typecheck` automatically on every `git commit`.

## Test Coverage

Unit tests cover:

- Auth guards (`RequireAuth`) — redirect logic for unauthenticated users
- Page components — conditional rendering based on report state
- Data-fetching utilities — request construction, error handling

Playwright smoke tests cover:

- Application loads and auth gate renders correctly
- `ReportsPage` renders the reports list
- `GenerateReportPage` form is reachable and submittable
- `PerformancePage` renders performance metric elements

## CI Integration

Tests run in `.github/workflows/quality-gates.yml` on every PR and on push to `main`.
The pipeline executes `npm run smoketest-no-compile` against the compiled `dist/` artifact
to validate the production build before deployment to GCS.
