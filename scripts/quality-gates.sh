#!/usr/bin/env bash
set -euo pipefail

# Next.js 16+ removed the `next lint` subcommand; `npx next lint` is parsed as
# `next` with project directory "lint" and fails with "Invalid project directory".
# Use package.json "lint" (eslint .) instead.

CI_MODE=false
RUN_SMOKE=true
SKIP_TYPECHECK=false

for arg in "$@"; do
  case "$arg" in
    --ci)
      CI_MODE=true
      ;;
    --no-smoke)
      RUN_SMOKE=false
      ;;
    --skip-typecheck)
      SKIP_TYPECHECK=true
      ;;
  esac
done

echo "=== Quality Gates (unified-trading-system-ui) ==="

echo "--- Lint ---"
npm run lint

if [[ "$SKIP_TYPECHECK" == "true" ]]; then
  echo "--- Typecheck --- skipped (--skip-typecheck)"
else
  echo "--- Typecheck ---"
  npx tsc --noEmit
fi

echo "--- Unit tests with coverage ---"
npx jest --coverage --maxWorkers=2

echo "--- Smoke build ---"
NEXT_PUBLIC_MOCK_API=true npx next build

if [[ "$RUN_SMOKE" == "true" ]]; then
  if [[ "${SKIP_SMOKE_TESTS:-false}" == "true" ]]; then
    echo "--- Playwright smoke tests skipped (SKIP_SMOKE_TESTS=true) ---"
    echo "=== Quality gates passed ==="
    exit 0
  fi
  echo "--- Playwright smoke tests ---"
  if [[ "$CI_MODE" == "true" ]]; then
    npx playwright install --with-deps chromium
    npx playwright test
  else
    npx playwright test --no-deps 2>/dev/null || npx playwright test
  fi
fi

echo "=== Quality gates passed ==="
