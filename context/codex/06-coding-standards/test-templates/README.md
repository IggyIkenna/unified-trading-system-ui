# Test Templates

Canonical test file templates for the unified trading system. Copy these into `tests/unit/` in each service repo and
fill in the service-specific placeholders.

## Available Templates

| File                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `test_event_logging.py` | Validates standardized event logging compliance |

## How to Use

1. Copy the template file into `tests/unit/` in the target service repo.
2. Set `SERVICE_NAME` to the service directory name (e.g. `"execution-service"`).
3. Populate `SERVICE_SPECIFIC_EVENTS[SERVICE_NAME]` with the event names the service emits beyond the required common
   set.
4. Run `pytest tests/unit/test_event_logging.py` to verify compliance.

The template must **not** be run directly from the codex repo — it is a source of truth to copy from, not a test suite
to execute.

## Required Common Events

Every service must emit all events listed in `REQUIRED_COMMON_EVENTS` within its non-test Python source. The list is
defined once in the canonical template and must not be trimmed in service copies.

## When to Update These Templates

Update the canonical template when:

- A new required common event is added to the codex event schema.
- The `unified_trading_library.events` API changes (e.g. `setup_events` gains a new required parameter).
- A new test case is identified that applies to all services.

After updating the template, propagate the change to all service copies. Use
`rg "Canonical template applied" --type py -l` from the workspace root to find all files that were stamped from this
template.

## Codex Reference

- Event schema: `unified-trading-codex/06-coding-standards/testing.md`
- Import rule: `.cursor/rules/no-empty-fallbacks.mdc`
- Any-type rule: `.cursor/rules/no-type-any-use-specific.mdc`
