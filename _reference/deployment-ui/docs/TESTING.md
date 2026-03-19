# deployment-ui — Testing Guide

## Running Tests

```bash
cd deployment-ui
npm install

# Unit tests
npm run test

# CI run (no watch)
npm run test:ci

# E2E (requires running dev server + deployment-api mock)
npm run dev &
npm run test:e2e
```

## Unit Tests

Component tests use Vitest + React Testing Library with MSW for API mocking:

```typescript
// Mock deployment-api responses
rest.get("/services/status", (req, res, ctx) =>
  res(ctx.json({ services: mockServiceStatuses })),
);
rest.post("/deployments", (req, res, ctx) =>
  res(ctx.json({ deployment_id: "dep-001", status: "PENDING" })),
);
```

## Key Test Scenarios

- Status page: services render with correct health badge color (green/yellow/red)
- Deploy page: form submission triggers POST, shows deployment ID in response
- Readiness page: checklist items check/fail correctly from API responses
- Config store: KV pairs load and inline edit works
- Auth: unauthenticated routes redirect to Google sign-in

## Quality Gates

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test:ci
```
