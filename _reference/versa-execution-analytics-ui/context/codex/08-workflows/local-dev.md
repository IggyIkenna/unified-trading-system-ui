# Local Development Guide

**SSOT for:** Starting, stopping, and verifying the Unified Trading System locally. Port assignments, mode axes,
mock/real semantics, hot reload, zombie process prevention.

**Scripts:** `unified-trading-pm/scripts/dev/dev-start.sh`, `dev-stop.sh`, `dev-status.sh`

**Port mapping data:** `unified-trading-pm/scripts/dev/ui-api-mapping.json`

---

## Mode System (5 Independent Axes)

The dev environment has 5 independent mode axes, controlled by environment variables:

| Axis           | Env Var           | Mock value                                               | Real value                                       | Controls                            |
| -------------- | ----------------- | -------------------------------------------------------- | ------------------------------------------------ | ----------------------------------- |
| **UI data**    | `VITE_MOCK_API`   | `true` (mock-api.ts intercepts)                          | `false` (real API calls)                         | Client-side mock data vs backend    |
| **UI auth**    | `VITE_SKIP_AUTH`  | `true` (no OAuth)                                        | `false` (real OAuth flow)                        | Login requirement                   |
| **API data**   | `CLOUD_MOCK_MODE` | `true` (mock_data.py)                                    | `false` (cloud storage)                          | Sample data vs real cloud reads     |
| **API auth**   | `DISABLE_AUTH`    | `true` (no tokens)                                       | unset (tokens required)                          | Token validation                    |
| **Mock state** | `MOCK_STATE_MODE` | `interactive` (mutations persist in `.local-dev-cache/`) | `deterministic` (pure seed data, no persistence) | Stateful vs stateless mock behavior |

### Preset Modes

```bash
# Fully mocked, interactive state (default) — no credentials needed
# Mutations persist in .local-dev-cache/ across API restarts
bash scripts/dev/dev-start.sh --all --mode mock

# Fully mocked, deterministic state — CI/test, no persistence
# Every run starts from pure seed data, no .local-dev-cache/ writes
bash scripts/dev/dev-start.sh --all --mode ci

# UI mocked, API real — test API against real cloud data
bash scripts/dev/dev-start.sh --all --mode api-real

# Everything real — staging-like, needs credentials + OAuth client ID
bash scripts/dev/dev-start.sh --all --mode real
```

### Checking Current Mode

```bash
bash scripts/dev/dev-status.sh
# Shows all 5 axes with color coding (yellow = mocked, green = real, cyan = deterministic)
```

---

## Starting the Stack

All commands run from the workspace root.

```bash
# Full stack in mock mode (default — no credentials needed)
bash unified-trading-pm/scripts/dev/dev-start.sh --all --mode mock

# Specific stack (e.g. deployment UI + API)
bash unified-trading-pm/scripts/dev/dev-start.sh --stack deployment --mode mock

# Frontend only (backends already running or not needed)
bash unified-trading-pm/scripts/dev/dev-start.sh --all --frontend-only

# Backend only
bash unified-trading-pm/scripts/dev/dev-start.sh --all --backend-only --mode mock

# Real mode (requires cloud credentials)
bash unified-trading-pm/scripts/dev/dev-start.sh --all --mode real

# Single UI or API
bash unified-trading-pm/scripts/dev/dev-start.sh --ui deployment-ui
bash unified-trading-pm/scripts/dev/dev-start.sh --api deployment-api --mode real

# List all available stacks and ports
bash unified-trading-pm/scripts/dev/dev-start.sh --list
```

---

## Port Registry

### UI Ports (5173-5183)

| Port | UI Repo                | Stack               |
| ---- | ---------------------- | ------------------- |
| 5173 | onboarding-ui          | onboarding          |
| 5174 | execution-analytics-ui | execution-analytics |
| 5175 | strategy-ui            | strategy            |
| 5176 | settlement-ui          | settlement          |
| 5177 | live-health-monitor-ui | live-health-monitor |
| 5178 | logs-dashboard-ui      | logs-dashboard      |
| 5179 | ml-training-ui         | ml-training         |
| 5180 | trading-analytics-ui   | trading-analytics   |
| 5181 | batch-audit-ui         | batch-audit         |
| 5182 | client-reporting-ui    | client-reporting    |
| 5183 | deployment-ui          | deployment          |

### API Ports (8004-8016)

| Port | API Repo              | Stack               |
| ---- | --------------------- | ------------------- |
| 8004 | deployment-api        | deployment          |
| 8005 | config-api            | onboarding          |
| 8006 | execution-results-api | execution-analytics |
| 8007 | (reserved)            | strategy            |
| 8008 | (reserved)            | settlement          |
| 8009 | (reserved)            | live-health-monitor |
| 8010 | (reserved)            | logs-dashboard      |
| 8011 | ml-training-api       | ml-training         |
| 8012 | trading-analytics-api | trading-analytics   |
| 8013 | batch-audit-api       | batch-audit         |
| 8014 | client-reporting-api  | client-reporting    |
| 8015 | ml-inference-api      | ml-inference        |
| 8016 | market-data-api       | market-data         |

**Machine-readable SSOT:** `unified-trading-pm/scripts/dev/ui-api-mapping.json`

**strictPort:** All UIs use `strictPort: true` in Vite config. If a port is already in use, the dev server fails
immediately instead of silently picking the next port. This prevents accidental port drift that breaks API proxy
configuration.

---

## Mock Mode

Mock mode is the default for local development and requires no cloud credentials.

### Environment Variables (set automatically by dev-start.sh)

| Variable          | Mock value    | Real value                   | Purpose                                  |
| ----------------- | ------------- | ---------------------------- | ---------------------------------------- |
| `CLOUD_MOCK_MODE` | `true`        | `false`                      | APIs return realistic mock data          |
| `CLOUD_PROVIDER`  | `local`       | `gcp` (or `$CLOUD_PROVIDER`) | Cloud SDK selection                      |
| `RUNTIME_MODE`    | `local`       | `production`                 | Runtime behavior selection               |
| `DISABLE_AUTH`    | `true`        | (not set)                    | Bypass authentication for local dev      |
| `MOCK_STATE_MODE` | `interactive` | `deterministic` (ci)         | State persistence in `.local-dev-cache/` |

### What mock mode provides

- Every API endpoint returns realistic, deterministic mock data.
- No cloud SDK calls (GCS, PubSub, BigQuery, Secret Manager) — all intercepted by mock layer.
- Authentication is disabled — no OAuth tokens needed.
- UIs display a `LOCAL + MOCK` badge (via `CloudModeBadge` from `@unified-trading/ui-kit`) so mock mode is always
  visually obvious.

### Running tests in mock mode

Tests always run credential-free. Quality gates automatically set `CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true`:

```bash
cd <repo> && bash scripts/quality-gates.sh
```

See `06-coding-standards/README.md` (Test Infrastructure: Emulators & Mocks) for the full mock/emulator matrix.

### Stateful Mock Data (MockStateStore)

By default, mock mode is **stateless** — POST/PUT endpoints return success but subsequent GETs return the same static
seed data. The `MockStateStore` (from `unified-trading-library`) adds **stateful** mock mode so mutations persist within
a dev session.

**How it works:**

1. Each API seeds its store with data from `mock_data.py` on startup.
2. POST/PUT/DELETE mutations are recorded in `.local-dev-cache/{service_name}/{collection}.jsonl`.
3. GET requests merge seed data with mutations, excluding deleted items.
4. State survives API restarts within a session (JSONL files on disk).
5. `dev-stop.sh --clean` or `dev-start.sh --reset` wipes the cache for a fresh start.

**Usage in an API route:**

```python
from unified_trading_library import MockStateStore

store = MockStateStore("deployment-api")
store.seed("deployments", MOCK_DEPLOYMENTS)  # from mock_data.py

# GET /deployments
items = store.list("deployments")

# POST /deployments
created = store.create("deployments", new_item)

# PUT /deployments/{id}
updated = store.update("deployments", item_id, fields)

# DELETE /deployments/{id}
deleted = store.delete("deployments", item_id)
```

**Cache location:** `{workspace_root}/.local-dev-cache/` (gitignored, ephemeral).

**Clearing state:**

```bash
# Clear cache and stop servers
bash unified-trading-pm/scripts/dev/dev-stop.sh --clean

# Clear cache before starting
bash unified-trading-pm/scripts/dev/dev-start.sh --all --mode mock --reset
```

---

## Stopping and Cleanup

```bash
# Stop all dev servers
bash unified-trading-pm/scripts/dev/dev-stop.sh

# Stop a specific service
bash unified-trading-pm/scripts/dev/dev-stop.sh deployment-ui

# Stop all and clean mock state cache
bash unified-trading-pm/scripts/dev/dev-stop.sh --clean

# Check what is running
bash unified-trading-pm/scripts/dev/dev-status.sh
```

PID files and logs are stored in `/tmp/unified-dev-pids/`. The stop script sends SIGTERM first, waits up to 2 seconds,
then SIGKILL if needed. Logs per service: `/tmp/unified-dev-pids/<service>.log`.

---

## Smoke Testing

Verify UIs build without starting a dev server:

```bash
cd <ui-repo>
VITE_MOCK_API=true npx vite build
```

This catches TypeScript/import errors without needing a running API backend. All UI quality gates (`base-ui.sh`) include
a build check.

---

## Zombie Process Prevention

### Vitest (UI tests)

All UI repos use these vitest settings to prevent zombie node processes:

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    pool: "forks", // process isolation — prevents shared-state leaks
    teardownTimeout: 5000, // kill workers that hang during teardown
  },
});
```

The `pool: "forks"` setting is mandatory. The default `threads` pool can leave orphan workers if a test crashes.

### Non-interactive test runs

Quality gates and CI use:

```bash
CI=true npm test -- --run
```

The `--run` flag prevents vitest from entering watch mode. `CI=true` ensures non-interactive behavior.

### Detecting zombie processes

```bash
# Find orphaned vitest workers
ps aux | grep "node.*vitest" | grep -v grep

# Find orphaned Python API servers
ps aux | grep "python.*-m.*_api" | grep -v grep

# Kill all dev server processes (dev-stop.sh does this automatically)
bash unified-trading-pm/scripts/dev/dev-stop.sh
```

---

## Hot Reload

### UIs (Vite HMR)

All UIs use Vite's Hot Module Replacement. File changes are reflected in the browser instantly without a full page
reload. No configuration needed — Vite HMR is enabled by default.

### APIs (uvicorn --reload)

API servers started with `RUNTIME_MODE=local` use uvicorn's `--reload` flag. Python file changes trigger an automatic
server restart. This is handled by each API's entry module — no manual flag needed when using `dev-start.sh`.

---

## DeFi Fork Testing (Tenderly Virtual TestNet)

For DeFi protocol testing (Aave, Uniswap, Morpho, etc.), the system supports mainnet fork execution via Tenderly.

### Deterministic Fork Fixture

A pinned fork is available for reproducible tests and historical replay:

| Property       | Value                                |
| -------------- | ------------------------------------ |
| Network        | Ethereum Mainnet                     |
| Block          | 24,681,163                           |
| Date pinned    | 2026-03-18                           |
| Chain ID       | 73571 (Tenderly virtual)             |
| Sync           | Disabled (fully deterministic)       |
| SM secret      | `tenderly-fork-rpc-url`              |
| Tenderly slug  | `uts-deterministic-eth-mainnet-blk-24681163` |

Use this fork for:
- Strategy backtests that need real on-chain state (Aave reserve data, Uniswap pool liquidity, token balances)
- Gas cost estimation (exact `gasUsed` from real EVM execution)
- Flash loan atomicity testing (reverts behave identically to mainnet)
- Integration tests that validate smart contract interactions

### FORK_MODE

Set `FORK_MODE` to route DeFi protocol connectors (UDEI) to the appropriate RPC:

```bash
# Deterministic fork (pinned block — reads tenderly-fork-rpc-url from SM)
FORK_MODE=tenderly

# Local Anvil fork (run `anvil --fork-url <alchemy_url>` first)
FORK_MODE=anvil DEFI_RPC_URL=http://localhost:8545

# Production mainnet (real execution — uses Alchemy RPC)
FORK_MODE=
```

Resolution logic: `unified-defi-execution-interface/protocols/base.py:get_defi_rpc_url()`.

### Creating a Fresh Fork (Live Paper Trading)

For paper trading against current mainnet state, create a new fork at latest block:

```bash
TENDERLY_KEY=$(gcloud secrets versions access latest --secret=tenderly-api-key)
curl -s -X POST "https://api.tenderly.co/api/v1/account/me/project/project/vnets" \
  -H "X-Access-Key: $TENDERLY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "uts-live-session-'$(date +%Y%m%d-%H%M)'",
    "display_name": "UTS Live Session '$(date +%Y-%m-%d %H:%M)'",
    "fork_config": {"network_id": 1, "block_number": "latest"},
    "virtual_network_config": {"chain_config": {"chain_id": 73571}},
    "sync_state_config": {"enabled": false}
  }'
```

Extract the Admin RPC URL from the response `rpcs` array and pass as `DEFI_RPC_URL`.

---

## Demo Mode (Full Seeded Stack)

For a pre-seeded local stack with sample data (instruments, features, mock market data):

```bash
bash unified-trading-pm/scripts/demo-mode.sh --seed
```

This starts GCP emulators (Pub/Sub, fake-GCS-server, BigQuery emulator), seeds reference data, and launches the API
layer. No cloud credentials required.

---

## Command Reference

| What you want to do         | Command                                                  | Mode     | Cache behavior                                |
| --------------------------- | -------------------------------------------------------- | -------- | --------------------------------------------- |
| Start full stack (no creds) | `dev-start.sh --all --mode mock`                         | mock     | Interactive — persists to `.local-dev-cache/` |
| Start for CI/headless       | `dev-start.sh --all --mode ci`                           | ci       | Deterministic — no persistence                |
| Start with real APIs        | `dev-start.sh --all --mode api-real`                     | api-real | N/A — real cloud data                         |
| Start staging-like          | `dev-start.sh --all --mode real`                         | real     | N/A — real cloud data                         |
| Start single stack          | `dev-start.sh --stack deployment --mode mock`            | mock     | Interactive                                   |
| Stop all servers            | `dev-stop.sh`                                            | —        | Cache preserved                               |
| Stop + wipe cache           | `dev-stop.sh --clean`                                    | —        | Cache deleted                                 |
| Start fresh (wipe + start)  | `dev-start.sh --all --mode mock --reset`                 | mock     | Cache wiped before start                      |
| Check running services      | `dev-status.sh`                                          | —        | Shows all 5 mode axes                         |
| List all stacks/ports       | `dev-start.sh --list`                                    | —        | —                                             |
| Run Python quality gates    | `cd <repo> && bash scripts/quality-gates.sh`             | —        | Per-repo .venv                                |
| Run UI tests (headless)     | `cd <ui-repo> && CI=true npm test -- --run`              | —        | —                                             |
| UI smoke build              | `cd <ui-repo> && VITE_MOCK_API=true npx vite build`      | —        | —                                             |
| Kill zombie processes       | `dev-stop.sh` (or manual: `ps aux \| grep node.*vitest`) | —        | —                                             |

All `dev-*.sh` scripts live in `unified-trading-pm/scripts/dev/`.

---

## Cross-References

- Testing infrastructure (emulators, mocks, cassettes): `06-coding-standards/README.md` (Test Infrastructure)
- UI branding and shared components: `06-coding-standards/ui-branding.md`
- UI dependency matrix and API wiring: `05-infrastructure/UI-DEPENDENCY-MATRIX.md`
- Quality gates: `06-coding-standards/quality-gates.md`
- Workspace bootstrap (fresh machine): `unified-trading-pm/scripts/workspace/workspace-bootstrap.sh`
- Per-repo dev setup: `scripts/setup.sh` in each repo (template: `06-coding-standards/setup-standards.md`)
