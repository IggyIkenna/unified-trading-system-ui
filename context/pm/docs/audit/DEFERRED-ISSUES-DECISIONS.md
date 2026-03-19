# Deferred Audit Issues — Final Status (2026-03-03)

**Date:** 2026-03-02 (decisions finalized 2026-03-03, execution completed 2026-03-03) **Source:**
`unified-trading-pm/docs/audit/AUDIT-REPORT-2026-03-02.md`

---

## Status Summary

**44 / 58 original issues FIXED.** 1 new issue (ISS-059) created and fixed. ISS-028 (coverage) in progress. 14 P3
deferred.

| Status             | Issues                                                       |
| ------------------ | ------------------------------------------------------------ |
| **FIXED**          | ISS-001-010, 012-027, 029-041, 059                           |
| **IN PROGRESS**    | ISS-028 (coverage: 4/14 repos at 70%, 10 blocked/need tests) |
| **FALSE POSITIVE** | ISS-011 (no actual dep — spawned ISS-059)                    |
| **P3 DEFERRED**    | ISS-042-058                                                  |

### Execution Summary (2026-03-03)

| Issue   | Decision                                 | Result                                                                      |
| ------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| ISS-004 | Remove instruments-service dep from MTDS | Already clean — no dep found                                                |
| ISS-010 | Promote UCI to T1                        | Done — manifest, codex, DAG all updated                                     |
| ISS-016 | Mapping layer at NautilusTrader boundary | Done — venue_mapping.py created, constants added                            |
| ISS-019 | Archive v3                               | Done — status=archived in manifest, README updated                          |
| ISS-028 | Raise all to 70%                         | Partial — 4 repos done, 6 blocked (import/syntax errors), 4 need more tests |
| ISS-029 | Add assertions to 141 tests              | Done                                                                        |
| ISS-033 | Ruff G004 rule                           | Already enabled in all repos                                                |
| ISS-034 | --mode required                          | Already implemented in all 8 services                                       |
| ISS-039 | Schema registry JSON                     | Already exists (23 schemas, validation passes)                              |
| ISS-059 | Import guard CI script                   | Done — check-import-deps.py created                                         |
| BUG     | cloud_data_provider.py wrong signature   | Done — all 13 load_config() calls fixed                                     |

---

## Conflict Map — READ THIS BEFORE RUNNING SESSIONS IN PARALLEL

Groups that share files and **MUST run sequentially** (or in the same session):

| Shared File                  | Groups That Touch It                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `workspace-manifest.json`    | Group A (ISS-004, ISS-010, ISS-019)                                   |
| Test files in 14 repos       | Group D (ISS-028 + ISS-029)                                           |
| `pyproject.toml` lint config | Group C (ISS-033) vs Group C (ISS-034) — LOW risk, different sections |

**Safe to run in parallel** (no shared files):

- Group A + Group B + Group C + Group D + Group E + Group F — all safe in parallel as long as Group A is a single
  session

---

## Group A: Manifest & Tier Fixes (1 session, ~2h)

**Do ISS-004 + ISS-010 + ISS-019 together** — all touch `workspace-manifest.json`.

### ISS-004: Remove instruments-service dep from MTDS — DECISION: Remove, types already exist

**Investigation found:** MTDS has ZERO `from instruments_service` imports. The dependency in pyproject.toml is stale.
Instrument data flows via GCS/PubSub. Types (InstrumentKey, Venue, InstrumentType) already live in
unified-domain-client.

**Agent instructions:**

```
1. Check market-tick-data-service/pyproject.toml for "instruments-service" in [project.dependencies] and [tool.uv.sources]
2. If present: remove both entries
3. Verify: rg "from instruments_service" market-tick-data-service/ --type py --glob '!.venv*' → should be 0
4. Run: cd market-tick-data-service && uv pip install -e . && python -m pytest tests/ -x
5. Update workspace-manifest.json: ensure MTDS dependencies list does NOT include instruments-service
```

### ISS-010: Promote UCI to T1 — DECISION: Promote (keeps log_event, clean tier separation)

**Investigation found:** UCI imports only `log_event` from UEI (1 call in loaders.py for CONFIG_LOADED). No cycle — UEI
has zero internal deps. UCI is the only T0 interface calling log_event. Promoting to T1 is clean.

**Agent instructions:**

```
1. Edit unified-trading-pm/workspace-manifest.json:
   - Change unified-config-interface "arch_tier" from "0" to "1"
   - Add {"name": "unified-events-interface", "version": ">=0.2.0,<1.0.0", "required": true} to UCI dependencies
2. Update unified-trading-codex tier docs if they reference UCI as T0
3. Update unified-trading-codex/04-architecture/ tier descriptions
4. Run: cd unified-config-interface && run_timeout 120 basedpyright unified_config_interface/
```

### ISS-019: Archive v3 — DECISION: Archive entire repo

**Agent instructions:**

```
1. Verify nothing imports from v3:
   rg "unified.trading.deployment.v3\|unified_trading_deployment_v3" --type py --glob '!.venv*' --glob '!unified-trading-deployment-v3/*'
   rg "deployment-v3\|deployment_v3" */pyproject.toml --glob '!unified-trading-deployment-v3/*'
2. Edit workspace-manifest.json: set unified-trading-deployment-v3 status to "archived"
3. Write unified-trading-deployment-v3/README.md:
   "# ARCHIVED — All content moved to deployment-service and deployment-api (2026-03-02)"
4. Do NOT delete files yet — just archive status + README
```

---

## Group B: Venue Naming (1-2 sessions, 8-12h)

### ISS-016: Mapping layer at NautilusTrader boundary — DECISION: Option A

**Agent instructions:**

```
1. Add to unified-api-contracts/unified_api_contracts/venue_constants.py:
   BINANCE_SPOT = "BINANCE-SPOT"
   BINANCE_FUTURES = "BINANCE-FUTURES"
   (plus any other venues that need SPOT/FUTURES variants)

2. Create unified-trade-execution-interface/unified_trade_execution_interface/venue_mapping.py:
   VENUE_TO_NAUTILUS = {"BINANCE-SPOT": "BINANCE", "BINANCE-FUTURES": "BINANCE", ...}
   NAUTILUS_TO_VENUE = {"BINANCE": "BINANCE-SPOT", ...}  # default mapping
   def venue_to_nautilus(venue: str) -> str: ...
   def nautilus_to_venue(nautilus_venue: str, product: str = "SPOT") -> str: ...

3. Find all bare "BINANCE" references:
   rg '"BINANCE"' --type py --glob '!.venv*' --glob '!tests/*'

4. In NautilusTrader adapter code (binance_ccxt.py etc): use venue_to_nautilus() at boundary
5. In all other code: replace "BINANCE" with BINANCE_SPOT or BINANCE_FUTURES as appropriate
6. Update tests separately
7. Run basedpyright + pytest in affected repos
```

**Key files:**

- `unified-api-contracts/unified_api_contracts/venue_constants.py`
- `unified-trade-execution-interface/unified_trade_execution_interface/adapters/binance_ccxt.py`
- `execution-service/execution_service/instruments/registry.py`

---

## Group C: Tooling & Standards (1 session, ~10h)

### ISS-033: Ruff G004 enforcement — DECISION: Ruff rule (best practices)

**Agent instructions:**

```
1. Find the workspace ruff config (ruff.toml or pyproject.toml [tool.ruff])
2. Add "G004" to [lint.select] (or per-repo if no workspace config)
3. Also add "G" (flake8-logging-format) to extend list if not present
4. Run: ruff check --fix across all repos (auto-fixes simple cases)
5. Manually fix remaining violations (complex f-strings, multiline)
6. Run tests in affected repos
7. Count remaining: rg 'logger\.\w+\(f"' --type py --glob '!.venv*' -c
```

### ISS-034: --mode required for 8 services — DECISION: Required, no default

**Agent instructions:**

```
1. For each service CLI entrypoint (cli/main.py or __main__.py):
   parser.add_argument("--mode", choices=["batch", "live"], required=True,
                       help="Execution mode: batch for historical, live for real-time")
2. Pass mode to BaseModeHandler or main function
3. Update ALL test invocations to pass --mode batch or --mode live
4. Update any scripts/Dockerfiles/CI that invoke these services without --mode
5. Run pytest in each service

Services: alerting-service, execution-service, features-delta-one-service,
          features-multi-timeframe-service, features-onchain-service,
          features-sports-service, features-volatility-service, instruments-service
```

### ISS-039: Schema registry JSON manifest — DECISION: Option A (JSON manifest)

**Agent instructions:**

```
1. Enumerate all BaseModel classes with schema_version:
   rg "schema_version" unified-internal-contracts/ unified-api-contracts/ --type py -l
2. Create unified-internal-contracts/schema_registry.json:
   {
     "registry_version": "1.0.0",
     "schemas": {
       "EnhancedError": {"module": "schemas.errors", "current_version": "1.0.0", "min_compatible": "1.0.0"},
       "ErrorContext": {"module": "schemas.errors", "current_version": "1.0.0", "min_compatible": "1.0.0"},
       "DeadLetterRecord": {"module": "schemas.errors", "current_version": "1.0.0", "min_compatible": "1.0.0"},
       ...
     }
   }
3. Create validation script: unified-internal-contracts/scripts/validate_schema_registry.py
   - Parse all BaseModel classes with schema_version
   - Check each is listed in registry
   - Check version matches
4. Add to quality-gates.sh
```

---

## Group D: Test Quality (3-5 sessions, 28-56h)

**ISS-028 + ISS-029 best done together** — both modify test files in the same repos.

### ISS-028: Raise coverage to 70% — DECISION: Raise all now

**Agent instructions:**

```
1. For each of 14 repos, run: cd <repo> && python -m pytest --cov=<package> --cov-report=term-missing
2. Note current coverage % for each repo
3. Prioritize by gap: repos furthest from 70% need most work
4. Write tests for uncovered modules (sort by: line_count × uncovered_pct)
5. Update pyproject.toml: change --cov-fail-under from 40 to 70
6. Verify pytest passes at new threshold

Repos (14): deployment-service, execution-service, execution-results-api,
  features-delta-one-service, features-sports-service, features-volatility-service,
  market-data-processing-service, ml-training-service, position-balance-monitor-service,
  risk-and-exposure-service, unified-domain-client, unified-events-interface,
  unified-internal-contracts, unified-market-interface
```

### ISS-029: Add assertions to 141 zero-assertion tests — DECISION: Option A (meaningful assertions)

**Agent instructions:**

```
1. Find all zero-assertion test functions:
   For each test file, compare count of "def test_" vs count of "assert "
2. For each assertion-free test, determine intent:
   - Import/smoke test → assert callable(fn) or assert hasattr(module, "attr")
   - Event test → assert mock_log_event.call_count >= 1
   - Integration test → assert response.status_code == 200, assert "key" in response.json()
   - Config test → assert config.field == expected
3. Add appropriate assertions
4. Run pytest to verify no regressions

Worst repos: execution-service (53), market-tick-data-service (14), strategy-service (8)
```

---

## Group E: Schema Registry (1 session, 4h) — see Group C / ISS-039

Already included in Group C above.

---

## Group F: Import Guard — NEW ISS-059 (1 session, 4h)

### ISS-059: CI script to check imports against declared dependencies

**Background:** ISS-011 investigation found execution-results-api doesn't actually depend on UDC, but UDC was available
in the workspace venv due to aggregate install. Quality gates should catch undeclared imports.

**Agent instructions:**

```
1. Create unified-trading-pm/scripts/workspace/check-import-deps.py:
   - For each repo:
     a. Parse pyproject.toml [project.dependencies] for declared deps
     b. Parse workspace-manifest.json for internal dep declarations
     c. Parse workspace-constraints.toml for external package list
     d. Scan Python source files for import statements (ast.parse)
     e. Map imports to package names (import unified_domain_client → unified-domain-client)
     f. Flag any import from a package not in declared deps
   - Output: report of violations per repo
   - Exit code: non-zero if violations found
2. Add to quality-gates.sh as a workspace-level check
3. Run across workspace, report any existing violations
4. Fix any violations found (either add to deps or remove import)
```

---

## Bug Found During Investigation (fix separately)

`unified-domain-client/unified_domain_client/cloud_data_provider.py` lines 72-74, 93-94, 160:

```python
load_config("GCS_BUCKET", f"{domain}-store")  # WRONG signature
```

UCI's `load_config()` expects `(config_class, config_file=None, ...)` not `(key, default)`. This is likely dead code or
a pre-refactor remnant. Should be investigated and fixed.

---

## P3 — Execution Only (No Decisions Needed)

These issues have clear fixes and zero conflict risk. Give any to an independent session:

| Issue   | Description                                            | Time     | Session Brief                                                                                |
| ------- | ------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| ISS-042 | 16 repos have duplicate fixture definitions            | 3-4h     | Move shared fixtures to conftest.py at appropriate directory level                           |
| ISS-043 | No VCR cassette files on disk                          | 3-4h     | Record cassettes for Binance/exchange API tests, mark live tests as @pytest.mark.integration |
| ISS-044 | Missing .env.example in 6 service repos                | 2h       | Generate from each service's config class fields                                             |
| ISS-045 | 58 files exceed 900 lines                              | 100-120h | Split starting from worst: league_classification.py (1,865), team_features.py (1,825)        |
| ISS-046 | 169 functions exceed 200 lines                         | ongoing  | Split starting from worst: test_order_execution (1,606 lines)                                |
| ISS-047 | 126 classes exceed 500 lines                           | ongoing  | Extract mixins starting from UCSDataLoader (1,461)                                           |
| ISS-048 | Sports league/team data as inline Python (3,681 lines) | 4h       | Move to YAML files in data/ directory                                                        |
| ISS-049 | SP500/NASDAQ ticker lists duplicated 3x                | 2h       | Consolidate into data/tickers.json                                                           |
| ISS-050 | Codex checklist template uses old names                | 30m      | Global replace in \_checklist-template.yaml                                                  |
| ISS-051 | 3 package.json files have version 1.0.0                | 10m      | Set to 0.1.0                                                                                 |
| ISS-052 | Hardcoded fallback bucket names                        | 30m      | Remove defaults, let config raise                                                            |
| ISS-053 | PII fields not tagged                                  | 4h       | Add json_schema_extra={"pii": True} to sensitive fields                                      |
| ISS-054 | No auth/secret/config event logging                    | 3h       | Add log_event calls to auth modules                                                          |
| ISS-055 | Correlation ID not propagated                          | 4h       | Add contextvars middleware                                                                   |
| ISS-056 | Circuit breaker no runtime impl                        | 4h       | Implement CircuitBreaker in UTL                                                              |
| ISS-057 | No DLQ infrastructure                                  | 8h       | Create PubSub dead-letter topic + consumer                                                   |
| ISS-058 | DatabentoClient exists in 3 copies                     | 1h       | Keep one canonical copy                                                                      |
