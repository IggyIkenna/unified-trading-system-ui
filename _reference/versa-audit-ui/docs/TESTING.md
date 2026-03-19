# Testing

## Test Strategy

- **Unit:** Not applicable for current minimal UI (no business logic modules).
- **E2E / Smoke:** Playwright tests in `tests/smoke/` cover core flows.

## Running Tests

### First-Time Setup

Install Playwright browsers (required once per machine):

```bash
npx playwright install chromium
```

### Smoke / E2E (Playwright)

```bash
npm run test:e2e
# or
npm run smoketest
```

Playwright starts the dev server (`npm run dev`), runs tests against `http://localhost:5173`, and shuts down. Auth is skipped via `VITE_SKIP_AUTH=true` in the test webServer config.

### Interactive UI Mode

```bash
npm run test:e2e:ui
```

Opens Playwright UI for debugging and re-running tests.

## Test Layout

| File                             | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `tests/smoke/home.spec.ts`       | Home page: heading, description, root container |
| `tests/smoke/navigation.spec.ts` | Home load, app description, root container      |

## Configuration

- **Config:** `playwright.config.ts`
- **Base URL:** `http://localhost:5173`
- **Test dir:** `./tests/smoke`
- **Web server:** `npm run dev` with `VITE_SKIP_AUTH=true`

## CI

Run `npm run test:e2e` in CI. Playwright uses `reuseExistingServer: !process.env.CI` so CI uses a fresh server. Retries: 2 in CI, 0 locally.
