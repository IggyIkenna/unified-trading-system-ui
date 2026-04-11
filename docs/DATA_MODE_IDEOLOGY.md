# Data Mode Ideology

## Purpose

Define one consistent rule-set for when the UI uses fixtures versus real backend data.

## Rules

- Mock data mode is enabled only when `NEXT_PUBLIC_MOCK_API=true`.
- Runtime code must use `isMockDataMode()` from `lib/runtime/data-mode.ts`.
- `NEXT_PUBLIC_AUTH_PROVIDER` selects auth provider only; it must not toggle API mock interception.

## Expected behavior by mode

- **Mock mode (`NEXT_PUBLIC_MOCK_API=true`)**
  - UI is self-sufficient.
  - `/api/*` calls are intercepted and resolved from fixtures/mock handlers.
  - Fixture fallback is allowed for API-backed screens.

- **Real mode (`NEXT_PUBLIC_MOCK_API=false`)**
  - UI calls real backend APIs.
  - API-backed screens must not silently swap to fixtures.
  - Missing data should render explicit empty states or surfaced errors.

## Implementation guidance

- Prefer this pattern in pages/hooks:
  - Read `const isMock = isMockDataMode()`.
  - Use fixture fallback only inside `if (isMock)`.
  - In real mode, return `[]` / `null` / error UI, not fixture data.
