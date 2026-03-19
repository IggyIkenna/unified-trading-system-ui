# Makefile for batch-audit-ui
# This mirrors the exact CI checks for local testing consistency
#
# CRITICAL: This must match .github/workflows/quality-gates.yml exactly
#
# Usage:
#   make ci-local    # Run all CI checks locally (matches GitHub Actions)
#   make lint        # Run ESLint only
#   make test        # Run tests only
#   make type-check  # Run TypeScript check only
#   make build       # Build application

.PHONY: ci-local lint test type-check build help install

# Default target
help:
	@echo "Local CI Testing for batch-audit-ui (mirrors GitHub Actions)"
	@echo ""
	@echo "Available targets:"
	@echo "  ci-local    - Run all CI checks locally (recommended before push)"
	@echo "  install     - Install dependencies"
	@echo "  lint        - Run ESLint"
	@echo "  type-check  - Run TypeScript type checking"
	@echo "  test        - Run tests with coverage"
	@echo "  build       - Build application"
	@echo "  dev         - Start development server"
	@echo "  help        - Show this help message"
	@echo ""
	@echo "Example: make ci-local"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm ci

# Main target that mirrors CI exactly
ci-local:
	@echo "Running CI checks locally..."
	@echo "============================="
	@echo ""
	@echo "Step 1: Install dependencies"
	@$(MAKE) install
	@echo ""
	@echo "Step 2: TypeScript type checking"
	@$(MAKE) type-check
	@echo ""
	@echo "Step 3: ESLint"
	@$(MAKE) lint
	@echo ""
	@echo "Step 4: Tests"
	@$(MAKE) test
	@echo ""
	@echo "Step 5: Build"
	@$(MAKE) build
	@echo ""
	@echo "✅ All CI checks passed!"

# TypeScript type checking (matches CI exactly)
type-check:
	@echo "Running TypeScript type check..."
	npx tsc --noEmit

# ESLint (matches CI exactly)
lint:
	@echo "Running ESLint..."
	npx eslint . --max-warnings 0

# Tests with coverage
test:
	@echo "Running tests with coverage..."
	npm test -- --coverage

# Build application
build:
	@echo "Building application..."
	npm run build

# Development server
dev:
	@echo "Starting development server..."
	npm run dev
# Fix import patterns
.PHONY: fix-imports
fix-imports:
	@echo "🔧 Fixing import patterns..."
	@python3 .cursor/scripts/check-import-patterns.py --fix

# Check import patterns
.PHONY: check-imports
check-imports:
	@echo "🔍 Checking import patterns..."
	@python3 .cursor/scripts/check-import-patterns.py --verbose
