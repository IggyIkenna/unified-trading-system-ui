# Smoke Tests

## Overview

Smoke tests validate critical user flows and ensure the UI loads properly.

## Running Tests

```bash
# Run all smoke tests
npm run smoketest

# Run with UI (debug mode)
npm run test:e2e:ui

# Run specific test
npx playwright test tests/smoke/navigation.spec.ts
```

## Test Coverage

- Navigation (3 tests): Home page load, app description, app container
- Home Page (3 tests): Main heading, reporting description, app render

**Note:** Tests run with `VITE_SKIP_AUTH=true` to bypass Okta for smoke testing.

## Related

- `../../unified-trading-codex/14-testing-guides/UI_SMOKE_TESTING_GUIDE.md` - Complete guide
- `.cursor/rules/git-workflow.mdc` - Integration with quickmerge
- `.cursor/rules/ui-runtime-validation.mdc` - Runtime verification
