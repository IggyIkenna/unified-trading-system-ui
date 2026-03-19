.PHONY: help quality-gates test lint format typecheck coverage install clean

help:
	@echo "Available targets:"
	@echo "  quality-gates  - Run all quality gates (lint, format, typecheck, test with coverage)"
	@echo "  test          - Run tests"
	@echo "  lint          - Run ruff linter"
	@echo "  format        - Run ruff formatter"
	@echo "  typecheck     - Run basedpyright type checker"
	@echo "  coverage      - Run tests with coverage reporting"
	@echo "  install       - Install development dependencies"
	@echo "  clean         - Clean build artifacts"

quality-gates:
	@echo "Running quality gates..."
	ruff check . --fix
	ruff format .
	basedpyright deployment_service_v3/
	pytest --cov=deployment_service_v3 --cov-report=term-missing

test:
	pytest

lint:
	ruff check .

format:
	ruff format .

typecheck:
	basedpyright deployment_service_v3/

coverage:
	pytest --cov=deployment_service_v3 --cov-report=term-missing --cov-report=html

install:
	uv pip install -e ".[dev]"

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .ruff_cache/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
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
