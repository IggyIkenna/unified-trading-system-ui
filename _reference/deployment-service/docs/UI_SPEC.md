# Deployment and Monitoring UI Specification

**Last consolidated:** 2026-02-09
**Last Updated:** February 5, 2026

Complete specification for building a web-based deployment and monitoring UI for the Unified Trading System.

---

## 1. Overview and Goals

### Purpose

Replace manual CLI usage with a user-friendly web UI that eliminates the need to access Google Cloud Console for routine deployment and monitoring operations.

### Key Goals

- **No Google Cloud Console Required:** Users should never need to log into GCP/AWS for routine operations
- **Cloud-Agnostic:** Support both GCP and AWS via `CLOUD_PROVIDER` mode
- **Human-Readable:** Job identifiers that humans can understand vs cryptic cloud-generated IDs
- **Validation:** Prevent invalid deployments through dropdown-based arg selection
- **Accessible:** Web-based, accessible from anywhere (not local-only)

---

## 2. CLI-First Architecture (Critical)

### The CLI is the Foundation. The UI Wraps the CLI.

This is the most important architectural principle:

1. **All UI actions MUST map to CLI commands**
2. **If a CLI arg is missing to support a UI feature, ADD IT to the CLI first**
3. **CLI remains the safety net if UI has issues**
4. **Both CLI and UI must work independently**

### CLI Commands

Location: `deployment-service-v2/deployment_service/cli.py`

```bash
# Deploy a service with sharding
python -m deployment_service.cli deploy \
  -s <service> \
  -c <compute: cloud_run|vm> \
  --start-date <YYYY-MM-DD> \
  --end-date <YYYY-MM-DD> \
  --category <CEFI|TRADFI|DEFI> \
  --venue <venue> \
  --force \
  --log-level <DEBUG|INFO|WARNING|ERROR> \
  --max-workers <N> \
  --dry-run \
  --no-wait \
  --max-threads <N>

# Check deployment status
python -m deployment_service.cli status <deployment-id>
python -m deployment_service.cli status <deployment-id> --hierarchical
python -m deployment_service.cli status <deployment-id> --summary

# Cancel deployments (with filters)
python -m deployment_service.cli cancel <deployment-id>
python -m deployment_service.cli cancel --service <service> --all
python -m deployment_service.cli cancel --service <service> --category CEFI --all
python -m deployment_service.cli cancel --service <service> --status running --all

# List recent deployments (with filters)
python -m deployment_service.cli list --service <service> --limit <N>
python -m deployment_service.cli list --status running
python -m deployment_service.cli list --category CEFI --since 2024-01-15

# Resume failed deployment
python -m deployment_service.cli resume <deployment-id>

# Retry only failed shards (more targeted than resume)
python -m deployment_service.cli retry-failed <deployment-id>
python -m deployment_service.cli retry-failed <deployment-id> --category CEFI
python -m deployment_service.cli retry-failed <deployment-id> --dry-run

# View logs (with streaming support)
python -m deployment_service.cli logs <deployment-id>
python -m deployment_service.cli logs <deployment-id> --severity ERROR
python -m deployment_service.cli logs <deployment-id> --shard-id <shard-id>
python -m deployment_service.cli logs <deployment-id> --follow
python -m deployment_service.cli logs <deployment-id> --follow --tail 100

# List available services
python -m deployment_service.cli list-services

# Show service info
python -m deployment_service.cli info -s <service>

# Show venues by category
python -m deployment_service.cli venues

# Infrastructure reporting (NEW)
python -m deployment_service.cli report <deployment-id>
python -m deployment_service.cli report <deployment-id> --format json
python -m deployment_service.cli report <deployment-id> --infra-issues
python -m deployment_service.cli report <deployment-id> --quota-issues
python -m deployment_service.cli report <deployment-id> --retries
python -m deployment_service.cli report --service <service> --since 2026-01-01 --summary

# Generate rerun commands for failed shards (NEW)
python -m deployment_service.cli rerun-command <deployment-id> --failed-only
python -m deployment_service.cli rerun-command <deployment-id> --shard <shard-id>
```

### CLI Args Added for UI Support

These args have been added to support UI functionality:

**Deploy command:**
| Arg | Description |
|-----|-------------|
| `--log-level` | DEBUG, INFO, WARNING, ERROR (default: INFO) |
| `--max-workers` | Parallelism control within service container |
| `--tag` | Human-readable description/annotation for this deployment (e.g., "Fixed Curve adapter") |

**List command:**
| Arg | Description |
|-----|-------------|
| `--status` | Filter by status: running, completed, failed, pending, cancelled |
| `--category` | Filter by category: CEFI, TRADFI, DEFI |
| `--since` | Show deployments since date/time |

**Cancel command:**
| Arg | Description |
|-----|-------------|
| `--category` | Only cancel deployments for this category |
| `--status` | Only cancel deployments with this status (running, pending) |

**Logs command:**
| Arg | Description |
|-----|-------------|
| `--follow` / `-f` | Stream logs in real-time (Ctrl+C to stop) |
| `--shard-id` | Fetch logs for a specific shard |
| `--tail` | Show only last N lines (use with --follow) |

**New command: `retry-failed`**

```bash
retry-failed <deployment-id> [--category CEFI] [--dry-run]
```

More targeted than `resume` - only retries failed shards.

**New command: `report` (Infrastructure Reporting)**

```bash
report <deployment-id> [--format json|csv|text] [--infra-issues] [--quota-issues] [--retries]
report --service <service> --since <date> --summary
```

Generates infrastructure reports for debugging, cloud provider tickets, and analytics integration.

**New command: `rerun-command`**

```bash
rerun-command <deployment-id> --failed-only
rerun-command <deployment-id> --shard <shard-id>
```

Outputs CLI commands to reconstruct and rerun failed shards.

**Rule:** If the UI needs functionality the CLI doesn't have, add the CLI arg first.

---

## 3. Tab-Based Architecture

The UI will be organized into **two main tabs**, each with **domain sub-tabs**:

```
+------------------------------------------------------------------+
|  [ Deploy ]    [ Monitor ]                                        |
+------------------------------------------------------------------+
|  [ Data I/O ]  [ Features ]  [ ML ]  [ Execution ]               |
+------------------------------------------------------------------+
|                                                                   |
|                    (Tab Content Area)                             |
|                                                                   |
+------------------------------------------------------------------+
```

### Tab 1: Deploy (Command Builder)

- Sub-tabs by domain: Data I/O | Features | ML | Execution
- Dropdown-based arg selection with validation
- Each domain tab can have slightly different visualizations as needed
- Builds and executes CLI commands under the hood

### Tab 2: Monitor (Job Tracking)

- Sub-tabs by domain: Data I/O | Features | ML | Execution
- Real-time job status, grouping, filtering, stop controls
- Domain separation allows future customization per domain type

---

## 4. Service Domain Groupings

Services are organized by their role in the data pipeline. This grouping comes from `configs/dependencies.yaml`.

### Data I/O Layer (Upstream - Data Ingestion)

| Service                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `instruments-service`            | Generate instrument definitions from exchange APIs |
| `market-tick-data-handler`       | Download raw tick data from exchanges              |
| `market-data-processing-service` | Process raw tick data into candles                 |

### Features Layer (Feature Engineering)

| Service                       | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `features-calendar-service`   | Generate calendar and temporal features            |
| `features-delta-one-service`  | Generate delta-one features (technical indicators) |
| `features-volatility-service` | Generate volatility features (IV, term structure)  |
| `features-onchain-service`    | Generate on-chain features (TVL, sentiment)        |

### ML Layer (Machine Learning)

| Service                | Description                     |
| ---------------------- | ------------------------------- |
| `ml-training-service`  | Train ML models for predictions |
| `ml-inference-service` | Generate ML predictions         |

### Execution Layer (Strategy & Backtesting)

| Service             | Description                             |
| ------------------- | --------------------------------------- |
| `strategy-service`  | Test trading signals and strategy logic |
| `execution-service` | Backtest execution on tick-level data   |

### Execution Order (Dependency Chain)

```
instruments-service
    └── market-tick-data-handler
            └── market-data-processing-service
                    ├── features-calendar-service
                    ├── features-delta-one-service
                    │       └── ml-training-service
                    │               └── ml-inference-service
                    │                       └── strategy-service
                    │                               └── execution-service
                    ├── features-volatility-service
                    └── features-onchain-service
```

---

## 5. Deploy Tab Specification

### Dropdown Fields

All dropdowns are validated against config files to prevent invalid selections.

| Field            | Source                                       | Type                 | Required           |
| ---------------- | -------------------------------------------- | -------------------- | ------------------ |
| Service          | `configs/sharding.*.yaml`                    | Dropdown             | Yes                |
| Category         | `dimensions[].values` in sharding config     | Dropdown             | Depends on service |
| Compute Mode     | Fixed: `cloud_run`, `vm`                     | Dropdown             | Yes                |
| Cloud Provider   | Fixed: `GCP`, `AWS`                          | Dropdown             | Yes                |
| Start Date       | Text input with validation                   | Date Picker          | Yes                |
| End Date         | Text input with validation                   | Date Picker          | Yes                |
| Venue            | `configs/venues.yaml` (filtered by category) | Dropdown             | No                 |
| Data Type        | `configs/venues.yaml`                        | Dropdown             | No                 |
| Deployment Notes | User input                                   | Text (max 200 chars) | No (encouraged)    |
| Force            | Checkbox                                     | Boolean              | No                 |
| Dry Run          | Checkbox                                     | Boolean              | No                 |
| Log Level        | Fixed: `DEBUG`, `INFO`, `WARNING`, `ERROR`   | Dropdown             | No                 |
| Max Workers      | Number input                                 | Integer              | No                 |
| Max Threads      | Number input (default: 100)                  | Integer              | No                 |

### Validation Rules

1. **Service Validation:** Only services with sharding configs can be selected
2. **Date Validation:**
   - Validated against `configs/expected_start_dates.yaml`
   - Cannot deploy before data availability date for that service/category
   - End date must be >= start date
3. **Category-Venue Hierarchical Validation:**
   - Venues are filtered based on selected category
   - CEFI venues: BINANCE-SPOT, BINANCE-FUTURES, DERIBIT, BYBIT, OKX, UPBIT, COINBASE, HYPERLIQUID, ASTER
   - TRADFI venues: CME, CBOE, NASDAQ, NYSE, ICE
   - DEFI venues: LIDO, ETHERFI, ETHENA, MORPHO-ETHEREUM, AAVEV3_ETHEREUM, etc.
4. **The dropdown IS the building block for the CLI command** - selections build the command automatically

### Pre-Deploy Checklist Validation

Before deployment starts, validate the service against its checklist (`configs/checklist.{service}.yaml`):

**Validation Steps:**

1. Check if service passes minimum readiness threshold
2. Show warning banner if blocking items exist
3. Allow user to proceed with warning OR block deployment entirely

**Warning Banner Example:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  Deployment Readiness Warning                                │
├─────────────────────────────────────────────────────────────────┤
│ instruments-service has 3 blocking issues:                      │
│                                                                 │
│   • Terraform module for VM not configured                      │
│   • Secret TARDIS_API_KEY not in Secret Manager                 │
│   • Integration tests failing                                   │
│                                                                 │
│ Readiness: 67% (30/45 items complete)                          │
│                                                                 │
│ [ ] I understand the risks and want to proceed anyway           │
│                                                                 │
│ [Cancel]                                    [Deploy Anyway]     │
└─────────────────────────────────────────────────────────────────┘
```

**Validation Rules:**
| Condition | Action |
|-----------|--------|
| Any item with `blocking: true` is `pending/not_started` | Block deployment, require resolution |
| Overall readiness >= 95% and no blocking items | `is_ready: true`, proceed without warning |
| Overall readiness < 95% but no blocking items | Show warning, allow proceed with acknowledgment |
| Compute type requires unconfigured infrastructure | Block deployment |

**Note:** 95% threshold allows deployment when non-critical items like AWS multi-cloud support remain partial.
GCP-first deployment strategy means AWS items can be addressed later without blocking production deployments.

**API Endpoint:**

```
GET /api/services/{service}/checklist/validate
```

**Response:**

```json
{
  "service": "instruments-service",
  "ready": false,
  "readiness_percent": 67,
  "blocking_items": [
    {
      "id": "terraform-vm",
      "description": "Terraform module for VM not configured"
    },
    {
      "id": "secret-tardis",
      "description": "Secret TARDIS_API_KEY not in Secret Manager"
    }
  ],
  "warnings": ["Integration tests failing"],
  "can_proceed_with_acknowledgment": true
}
```

### Deploy Button Behavior

1. Show preview of CLI command to be executed
2. On confirmation, execute via backend API
3. Return deployment ID for tracking
4. Redirect to Monitor tab with new deployment selected

---

## 5.5 Human-Readable ID Format

### Problem

Google Cloud generates cryptic job IDs (e.g., `projects/test-project/locations/asia-northeast1/jobs/instruments-service-job/executions/instruments-service-job-abc123xyz`) that are not human-friendly and difficult to reference in conversation or debugging.

### Solution

Abstract all Google Cloud IDs behind our own human-readable format. Store Google IDs internally for API calls but never expose them to users.

### Deployment Group ID Format

```
{service}-{YYYYMMDD}-{HHMMSS}-{6char-hash}
```

**Examples:**

- `instruments-service-20260130-143022-a1b2c3`
- `market-tick-data-handler-20260129-091500-b2c3d4`

### Shard ID Format

```
{dimensional-breakdown}-{8char-hash}
```

**Examples based on sharding config:**
| Sharding Type | Example Shard ID |
|---------------|------------------|
| Date-sharded | `CEFI-2024-01-15-a1b2c3d4` |
| Weekly | `CEFI-2024-W03-a1b2c3d4` |
| Monthly | `CEFI-2024-M01-a1b2c3d4` |
| Venue-sharded | `CEFI-BINANCE-SPOT-2024-01-15-a1b2c3d4` |
| Config-sharded (ML) | `ml-config-abc123-a1b2c3d4` |

### UI Display: Expandable Tree View

IDs are flat in storage, but displayed in a **nested, expandable tree view** in the UI:

```
▼ instruments-service-20260130-143022-a1b2c3 (2192 shards)
  │ Tag: "Fixed Curve adapter"
  │ Status: Running (45%)
  │ CLI Args: --category CEFI,TRADFI,DEFI --start-date 2024-01-01 --end-date 2024-12-31
  │ Image: asia-northeast1-docker.pkg.dev/.../instruments-service:abc123
  │
  ├─▼ CEFI (850 shards)
  │   ├── CEFI-2024-01-01-a1b2c3d4  ✓ Completed (2m 15s)
  │   ├── CEFI-2024-01-02-b2c3d4e5  ● Running (1m 30s)
  │   ├── CEFI-2024-01-03-c3d4e5f6  ○ Pending
  │   └── ... (847 more)
  │
  ├─▼ TRADFI (642 shards)
  │   └── ...
  │
  └─▼ DEFI (700 shards)
      └── ...
```

### Key Rules

1. **Never expose Google Cloud IDs** - Users should never see Cloud Run execution IDs or GCE instance IDs
2. **Store internally** - Google IDs are stored in `state.json` for API calls
3. **Human-readable operations** - All stop, cancel, retry operations use human-readable IDs
4. **Tree navigation** - Tree can be expanded/collapsed by category, then by date/venue
5. **Searchable** - Allow search by partial ID, category, venue, or date

### State Storage Mapping

```json
{
  "deployment_id": "instruments-service-20260130-143022-a1b2c3",
  "shards": [
    {
      "shard_id": "CEFI-2024-01-15-a1b2c3d4",
      "dimensions": { "category": "CEFI", "date": "2024-01-15" },
      "internal_job_id": "projects/xxx/locations/xxx/jobs/xxx/executions/xxx",
      "status": "running"
    }
  ]
}
```

---

## 5.6 Deployment Tag/Description

### Purpose

Allow users to annotate deployments with a human-readable description explaining what makes this deployment different from previous ones.

### CLI Support

Add `--tag` argument to the deploy command:

```bash
# Short tag
python deploy.py deploy -s instruments-service ... --tag "Fixed Curve adapter"

# Longer description
python deploy.py deploy -s instruments-service ... --tag "Fixed Curve MetaRegistry integration, added EULER/FLUID adapters"
```

### UI Support

Add a **"Deployment Notes"** text input field in the Deploy form:

- Optional but encouraged
- Max 200 characters recommended
- Displayed prominently in deployment list and details

### Display in UI

**In Deployment Details:**

```
▼ instruments-service-20260130-143022-a1b2c3
  │ Tag: "Fixed Curve adapter, added multi-region failover"
  │ Status: Running (45%)
  │ ...
```

**In Deployment List:**
| Deployment ID | Tag | Status | Progress |
|---------------|-----|--------|----------|
| instruments-service-20260130-143022-a1b2c3 | Fixed Curve adapter | Running | 45% |
| instruments-service-20260129-091500-b2c3d4 | Initial DEFI backfill | Completed | 100% |
| instruments-service-20260128-140000-c3d4e5 | _(no tag)_ | Failed | 23% |

### Storage

Save in `state.json` as `tag` field:

```json
{
  "deployment_id": "instruments-service-20260130-143022-a1b2c3",
  "tag": "Fixed Curve adapter",
  "service": "instruments-service",
  ...
}
```

### Benefits

- Easy to identify what each deployment was for
- Helps with debugging ("which deployment had the fix?")
- Provides context when reviewing deployment history
- Enables searching/filtering by tag content

---

## 6. Monitor Tab Specification

### Job Grouping Hierarchy

```
Deployment Group (e.g., "instruments-service-2025-01-28-14:30-ikenna")
├── Shard 1: CEFI / 2024-01-01 / BINANCE-SPOT
├── Shard 2: CEFI / 2024-01-01 / DERIBIT
├── Shard 3: CEFI / 2024-01-02 / BINANCE-SPOT
└── ... (potentially 1000s of shards)
```

### Display Fields per Deployment Group

| Field               | Description               | Example                                      |
| ------------------- | ------------------------- | -------------------------------------------- |
| Deployment Group ID | Human-readable identifier | `instruments-service-20250128-143022-a1b2c3` |
| Tag                 | User-provided description | `"Fixed Curve adapter"`                      |
| Service Name        | Which service             | `instruments-service`                        |
| Triggered At        | When deployment started   | `2025-01-28 14:30:22 UTC`                    |
| Total Shards        | Number of jobs            | `150`                                        |
| Progress            | Completion percentage     | `45% (67/150)`                               |
| Status              | Overall status            | `Running`, `Completed`, `Failed`, `Partial`  |

### Docker Image and Git Version Fields

Each deployment should display the Docker image and code version information:

| Field              | Description                              | Example                                                                                      |
| ------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Docker Image       | Full image path with tag                 | `asia-northeast1-docker.pkg.dev/test-project/instruments-service/instruments-service:abc123` |
| Image Tag          | Short tag (git SHA or version)           | `abc123` or `v1.2.3` or `latest`                                                             |
| Git Commit         | Full commit SHA the image was built from | `a1b2c3d4e5f6g7h8i9j0`                                                                       |
| Git Commit (Short) | First 8 characters                       | `a1b2c3d4`                                                                                   |
| Git Branch         | Branch name                              | `main`                                                                                       |
| Build Time         | When Docker image was built              | `2026-01-30 12:00:22 UTC`                                                                    |

**Source of Image Metadata:**

- **Cloud Build labels** - Set during build via `--label` flags
- **Artifact Registry API** - Query image metadata
- **state.json** - Store when deployment is created

**UI Display (Expandable Section):**

```
▼ instruments-service-20260130-143022-a1b2c3
  │ Tag: "Fixed Curve adapter"
  │ Status: Running (45%)
  │
  ├─ Image Details (click to expand)
  │  │ Full Path: asia-northeast1-docker.pkg.dev/.../instruments-service:a1b2c3d4
  │  │ Tag: a1b2c3d4
  │  │ Git Commit: a1b2c3d4e5f6g7h8 (main)
  │  │ Built: 2026-01-30 12:00:22 UTC
  │  │
  │  │ [View in Artifact Registry]  [View Commit on GitHub]
  │  └──────────────────────────────────────────────────────
  │
  └─▼ Shards (2192)
     └── ...
```

**Links:**

- **Artifact Registry link:** `https://console.cloud.google.com/artifacts/docker/{project}/{region}/{repo}/{image}?project={project}`
- **GitHub commit link:** `https://github.com/{org}/{repo}/commit/{sha}`

### Display Fields per Individual Shard

| Field      | Description                       | Example                                                                              |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| Shard ID   | Human-readable ID with dimensions | `CEFI-BINANCE-SPOT-2024-01-15-a1b2c3d4`                                              |
| Dimensions | All dimension values displayed    | Category: CEFI, Venue: BINANCE-SPOT, Date: 2024-01-15                                |
| CLI Args   | Full command args for this shard  | `--category CEFI --venue BINANCE-SPOT --start-date 2024-01-15 --end-date 2024-01-15` |
| Status     | Job status with progress          | `Pending`, `Building`, `Running (45%)`, `Completed`, `Failed`                        |
| Duration   | How long job took/is taking       | `5m 32s`                                                                             |
| Started At | When job started                  | `14:32:15`                                                                           |
| Ended At   | When job finished                 | `14:37:47`                                                                           |

**Note:** Cloud Job ID (GCP/AWS internal ID) is stored internally but **NOT displayed to users**. See Section 5.5 for ID abstraction rules.

### Shard ID Formats by Sharding Type

| Sharding Type     | Shard ID Format                     | Example                                 |
| ----------------- | ----------------------------------- | --------------------------------------- |
| Daily by category | `{CATEGORY}-{DATE}-{hash}`          | `CEFI-2024-01-15-a1b2c3d4`              |
| Daily by venue    | `{CATEGORY}-{VENUE}-{DATE}-{hash}`  | `CEFI-BINANCE-SPOT-2024-01-15-a1b2c3d4` |
| Weekly            | `{CATEGORY}-{YEAR}-W{WEEK}-{hash}`  | `CEFI-2024-W03-a1b2c3d4`                |
| Monthly           | `{CATEGORY}-{YEAR}-M{MONTH}-{hash}` | `CEFI-2024-M01-a1b2c3d4`                |
| Config-based (ML) | `{CONFIG_NAME}-{hash}`              | `btc-momentum-config-a1b2c3d4`          |

### Date Range Shards

For weekly or monthly sharding, show the date range in the UI:

```
CEFI-2024-W03-a1b2c3d4
├── Date Range: Jan 15-21, 2024
├── CLI Args: --category CEFI --start-date 2024-01-15 --end-date 2024-01-21
└── Status: Running (2m 15s)
```

### Shard Row Display (Expanded)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● CEFI-BINANCE-SPOT-2024-01-15-a1b2c3d4                    Running (2m 15s) │
├─────────────────────────────────────────────────────────────────────────────┤
│ Dimensions:                                                                 │
│   Category: CEFI                                                            │
│   Venue: BINANCE-SPOT                                                       │
│   Date: 2024-01-15                                                          │
│                                                                             │
│ CLI Args:                                                                   │
│   --category CEFI --venue BINANCE-SPOT --start-date 2024-01-15              │
│   --end-date 2024-01-15 --force                                             │
│                                                                             │
│ Started: 14:32:15 UTC                                                       │
│                                                                             │
│ [View Logs]  [Stop]                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Definitions

| Status         | Description                       | Color  |
| -------------- | --------------------------------- | ------ |
| `Pending`      | Queued, not started               | Gray   |
| `Building`     | VM/container being provisioned    | Blue   |
| `Running (X%)` | Actively processing with progress | Yellow |
| `Completed`    | Successfully finished             | Green  |
| `Failed`       | Error occurred                    | Red    |
| `Cancelled`    | Manually stopped                  | Orange |

### Failure Information

For failed jobs, display:

- **Failure Stage:** `Build` vs `Run` (did it fail during container build or during execution?)
- **Error Message:** The actual error
- **Stack Trace:** Full traceback (expandable)
- **Logs Link:** Quick link to view full logs

### Filtering Options

| Filter           | Type         | Options                                                  |
| ---------------- | ------------ | -------------------------------------------------------- |
| Service          | Dropdown     | All services                                             |
| Category         | Dropdown     | CEFI, TRADFI, DEFI                                       |
| Date Range       | Date pickers | Start date, End date                                     |
| Status           | Multi-select | Pending, Building, Running, Completed, Failed, Cancelled |
| Deployment Group | Dropdown     | Recent deployment IDs                                    |

### Grouping Options

| Group By   | Description                      |
| ---------- | -------------------------------- |
| Category   | Group shards by CEFI/TRADFI/DEFI |
| Date       | Group shards by processing date  |
| Status     | Group by completion status       |
| Deployment | Group by deployment group ID     |

### Action Buttons

| Action                 | Scope                            | CLI Equivalent                             |
| ---------------------- | -------------------------------- | ------------------------------------------ |
| Stop                   | Single job                       | `cancel <job-id>`                          |
| Stop All Filtered      | All jobs matching current filter | `cancel --service <svc> --all` + filtering |
| Stop Entire Deployment | All jobs in deployment group     | `cancel <deployment-id>`                   |
| Retry Failed           | Re-run failed jobs               | `resume <deployment-id>`                   |
| View Logs              | Open log viewer                  | (API call to fetch logs)                   |

---

## 7. Log Viewer Integration

### Features

- Real-time log streaming (while job is running)
- Error highlighting with stack traces
- Build stage vs Run stage log separation
- Search/grep within logs
- Link to full logs in cloud console (as fallback)

### Log Sources

- **GCP:** Cloud Logging
- **AWS:** CloudWatch Logs

### Implementation

The UI should call CLI commands to fetch logs:

```bash
# Fetch logs for a specific job (CLI command to add if not exists)
python -m deployment_service.cli logs <job-id> --lines 500
python -m deployment_service.cli logs <job-id> --follow  # Real-time streaming
```

---

## 8. Stop/Cancel Functionality

### Granularity Levels

| Level             | Description                            | UI Action                                |
| ----------------- | -------------------------------------- | ---------------------------------------- |
| Single Shard      | Stop one shard                         | Click stop on individual shard row       |
| By Filter         | Stop all jobs matching filter criteria | Apply filters, click "Stop All Filtered" |
| By Category       | Stop all jobs for a category           | Filter by category, stop all             |
| By Date Range     | Stop all jobs for date range           | Filter by dates, stop all                |
| Entire Deployment | Stop all jobs in a deployment group    | Click stop on deployment group header    |

### Human-Readable ID Abstraction (Critical)

**All stop/cancel operations use human-readable IDs. Google Cloud IDs are NEVER exposed to users.**

**How it works:**

1. User clicks "Stop" on shard `CEFI-BINANCE-SPOT-2024-01-15-a1b2c3d4`
2. UI sends: `POST /api/deployments/{deployment-id}/shards/{shard-id}/cancel`
3. Backend looks up internal Google Cloud job ID from `state.json`
4. Backend calls Google API with internal ID
5. User only ever sees human-readable ID

**API Endpoints (Human-Readable IDs):**

```bash
# Cancel single shard (human-readable shard ID)
POST /api/deployments/instruments-service-20260130-143022-a1b2c3/shards/CEFI-2024-01-15-a1b2c3d4/cancel

# Cancel entire deployment (human-readable deployment ID)
POST /api/deployments/instruments-service-20260130-143022-a1b2c3/cancel

# Bulk cancel by filter
POST /api/cancel
{
  "service": "instruments-service",
  "category": "CEFI",
  "status": "running"
}
```

**NOT this (Google Cloud IDs - internal only):**

```bash
# WRONG - never expose these to users
POST /api/cancel?cloud_run_execution_id=projects/xxx/locations/xxx/jobs/xxx/executions/xxx
POST /api/cancel?gce_instance_id=1234567890123456789
```

### CLI Mapping

```bash
# Stop single shard (human-readable ID)
python -m deployment_service.cli cancel --shard CEFI-2024-01-15-a1b2c3d4

# Stop entire deployment (human-readable ID)
python -m deployment_service.cli cancel instruments-service-20260130-143022-a1b2c3

# Stop all jobs for a service
python -m deployment_service.cli cancel --service instruments-service --all

# Stop by category within a deployment
python -m deployment_service.cli cancel instruments-service-20260130-143022-a1b2c3 --category CEFI
```

### Confirmation Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  Confirm Cancellation                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ You are about to cancel:                                        │
│                                                                 │
│   Deployment: instruments-service-20260130-143022-a1b2c3        │
│   Shards affected: 847 running, 123 pending                     │
│   Category filter: CEFI only                                    │
│                                                                 │
│ ⚠️  This action cannot be undone. Running jobs will be          │
│    terminated immediately.                                      │
│                                                                 │
│ [Cancel]                                    [Confirm Cancel]    │
└─────────────────────────────────────────────────────────────────┘
```

### Confirmation Requirements

- Always show confirmation dialog before stopping jobs
- Show count of jobs that will be stopped (running + pending)
- Show which filters are applied
- Make clear this cannot be undone
- Require explicit confirmation click

---

## 9. Configuration File References

The UI should read these configs to populate dropdowns and validate inputs:

| Config File                         | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `configs/sharding.*.yaml`           | Service definitions, dimensions, CLI args          |
| `configs/dependencies.yaml`         | Service dependencies and execution order           |
| `configs/expected_start_dates.yaml` | Data availability dates per service/category/venue |
| `configs/venues.yaml`               | Available venues per category                      |

### Example: Reading Available Services

```python
# List all sharding configs to get service names
import glob
services = [
    f.replace("sharding.", "").replace(".yaml", "")
    for f in glob.glob("configs/sharding.*.yaml")
]
# Result: ['instruments-service', 'market-tick-data-handler', ...]
```

### Example: Date Validation

```yaml
# From configs/expected_start_dates.yaml
instruments-service:
  CEFI:
    category_start: "2017-01-01"
    venues:
      BINANCE-SPOT: "2017-07-14"
      HYPERLIQUID: "2023-04-15"
  TRADFI:
    category_start: "2020-01-01"
```

UI should prevent selecting dates before `category_start` or venue-specific start dates.

---

## 10. Design Philosophy

### Goal

A user should be able to use this DevOps infrastructure **without ever logging into Google Cloud Console**. Every reason you'd normally go to GCP should be covered by this UI in a user-friendly way.

### UX Requirements

- **User-friendly:** Intuitive interface, minimal learning curve
- **Pretty:** Modern, clean design
- **Human-readable:** No dirty job numbers that don't help humans
- **Differentiable:** Easy to differentiate between jobs
- **Accessible:** Web-based, works from anywhere

### What to Avoid

- Cryptic cloud-generated IDs as primary identifiers
- Requiring users to know CLI syntax
- Forcing users to go to GCP console for any routine operation
- Complex interfaces that require training

### Design Proposal Required

Before implementation:

1. Create wireframes/mockups of proposed UI
2. Show tab layout, dropdown arrangement, job list design
3. Get approval before building
4. Use common sense for UX decisions not explicitly specified

---

## 11. Technical Implementation Notes

### Backend API Requirements

The UI needs a backend API that wraps CLI commands:

**Core Deployment APIs:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services` | GET | List available services |
| `/api/services/{service}/config` | GET | Get sharding config for service |
| `/api/venues` | GET | List venues by category |
| `/api/expected-start-dates` | GET | Get data availability dates |
| `/api/deploy` | POST | Execute deployment (include `tag` field) |
| `/api/deployments` | GET | List deployments (all services or filtered) |
| `/api/deployments/{id}` | GET | Get deployment status with tree structure |
| `/api/deployments/{id}/logs` | GET | Get logs for deployment |

**Checklist APIs (New):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services/{service}/checklist` | GET | Get checklist status for dashboard |
| `/api/services/{service}/checklist/validate` | GET | Pre-deploy validation check |

**Data Status APIs (New):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data-status` | GET | Get data completeness (filter by service/category/venue) |

**Service Status APIs (New - Temporal Audit Trail):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services/{service}/status` | GET | Get temporal audit trail (data/deploy/build/code timestamps) |
| `/api/services/status/overview` | GET | All services status summary for dashboard |

**Cancel APIs (Human-Readable IDs):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/deployments/{id}/cancel` | POST | Cancel entire deployment |
| `/api/deployments/{id}/shards/{shard-id}/cancel` | POST | Cancel single shard |
| `/api/cancel` | POST | Bulk cancel by filter (service, category, status) |

**Note:** All IDs in URLs and responses are human-readable (e.g., `instruments-service-20260130-143022-a1b2c3`). Internal Google Cloud IDs are never exposed.

### Cloud Provider Mode

Set via environment variable or UI toggle:

```bash
CLOUD_PROVIDER=gcp  # or aws
```

UI should:

1. Show current cloud provider
2. Allow switching (with confirmation)
3. Adjust API calls accordingly

### State Storage

Deployment state is stored in GCS with **environment separation**:

```
gs://deployment-orchestration-{project-id}/
├── deployments.development/     ← Local development (DEPLOYMENT_ENV=development, default)
│   └── {deployment-id}/
│       ├── state.json
│       └── {shard-id}/
│           ├── status           ← "SUCCESS:timestamp" or "FAILED:..."
│           └── logs.txt
│
└── deployments.production/      ← Docker/Cloud Run (DEPLOYMENT_ENV=production)
    └── {deployment-id}/
        ├── state.json
        └── {shard-id}/
            ├── status
            └── logs.txt
```

**Environment separation** prevents conflicts between local development and production.

---

## 12. Checklist Integration (Readiness Dashboard)

### Purpose

Show deployment readiness based on `configs/checklist.{service}.yaml`. This complements the pre-deploy validation (Section 5) by providing a dashboard overview of checklist status.

### UI Location

New tab **"Readiness"** within each service view, alongside Deploy, Configuration, and History tabs.

### Config Source

```
configs/checklist.{service}.yaml
```

Each service has its own checklist with items grouped by category (Infrastructure, Testing, Documentation, etc.).

### Dashboard Display

```
┌─────────────────────────────────────────────────────────────────┐
│ Service: instruments-service                                    │
│ Overall Readiness: 85% (38/45 items complete)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Infrastructure] ████████░░ 80%                                 │
│ ├── [✓] Dockerfile exists                                       │
│ ├── [✓] Cloud Build trigger configured                          │
│ ├── [ ] Terraform module for VM                    ⚠️ BLOCKING  │
│ └── [✓] Secret Manager integration                              │
│                                                                 │
│ [Testing] ██████████ 100%                                       │
│ ├── [✓] Unit tests pass                                         │
│ ├── [✓] Integration tests pass                                  │
│ └── [✓] Smoke tests pass                                        │
│                                                                 │
│ [Documentation] ██████░░░░ 60%                                  │
│ ├── [✓] README.md exists                                        │
│ ├── [ ] API documentation                                       │
│ └── [~] Deployment guide                           (partial)    │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ BLOCKING ISSUES (must resolve before production deployment):    │
│ └── [ ] Terraform module for VM (required for VM deployments)   │
└─────────────────────────────────────────────────────────────────┘
```

### Status Badges

| Status        | Display          | Description                       |
| ------------- | ---------------- | --------------------------------- |
| `done`        | [✓] Green        | Item is complete                  |
| `partial`     | [~] Yellow       | Item is partially complete        |
| `not_started` | [ ] Gray         | Item not started                  |
| `blocking`    | ⚠️ Red highlight | Item blocks production deployment |

### API Endpoint

```
GET /api/services/{service}/checklist
```

**Response:**

```json
{
  "service": "instruments-service",
  "readiness_percent": 85,
  "total_items": 45,
  "completed_items": 38,
  "categories": [
    {
      "name": "Infrastructure",
      "percent": 80,
      "items": [
        {
          "id": "dockerfile",
          "description": "Dockerfile exists",
          "status": "done"
        },
        {
          "id": "terraform-vm",
          "description": "Terraform module for VM",
          "status": "not_started",
          "blocking": true
        }
      ]
    }
  ],
  "blocking_items": [
    {
      "id": "terraform-vm",
      "description": "Terraform module for VM",
      "category": "Infrastructure"
    }
  ]
}
```

### Integration with Deploy Tab

When user clicks Deploy:

1. UI calls `/api/services/{service}/checklist/validate`
2. If blocking items exist, show warning (see Section 5 Pre-Deploy Validation)
3. User can acknowledge and proceed, or cancel to fix issues first

---

## 13. Data Completeness View

### Purpose

Show expected vs actual data coverage per service/category/venue. Answers the question: "Do we have all the data we expect?"

### CLI Mapping

```bash
python deploy.py data-status --service market-tick-data-handler --category CEFI
```

### UI Location

New tab **"Data Status"** in the Monitor section, or as a dedicated top-level tab.

### Display Fields

| Field          | Description                           | Example                       |
| -------------- | ------------------------------------- | ----------------------------- |
| Service        | Which service                         | `market-tick-data-handler`    |
| Category       | CEFI/TRADFI/DEFI                      | `CEFI`                        |
| Venue          | Exchange/Protocol                     | `BINANCE-SPOT`                |
| Expected Start | From `expected_start_dates.yaml`      | `2017-07-14`                  |
| Actual Start   | First date with data in GCS           | `2019-11-17`                  |
| Latest Date    | Most recent data                      | `2026-01-29`                  |
| Coverage       | Percentage of expected days with data | `98.5%`                       |
| Missing Days   | Count of gaps                         | `12 days`                     |
| Status         | Overall status                        | `Complete`, `Gaps`, `Missing` |

### Visual Display

**Option A: Table View**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Data Status: market-tick-data-handler                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Category │ Venue         │ Expected   │ Actual     │ Coverage │ Missing     │
├──────────────────────────────────────────────────────────────────────────────┤
│ CEFI     │ BINANCE-SPOT  │ 2017-07-14 │ 2019-11-17 │ 98.5%    │ 12 days     │
│ CEFI     │ DERIBIT       │ 2019-01-01 │ 2019-01-01 │ 100%     │ 0 days  ✓   │
│ CEFI     │ COINBASE      │ 2017-01-01 │ 2020-03-15 │ 85.2%    │ 156 days ⚠️ │
│ TRADFI   │ CME           │ 2020-01-01 │ 2020-01-01 │ 100%     │ 0 days  ✓   │
│ DEFI     │ CURVE-ETHEREUM     │ 2020-08-01 │ 2023-05-15 │ 45.0%    │ 1034 days ❌│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Option B: Heatmap Calendar View**

Show a calendar heatmap where:

- Green = data exists
- Red = data missing
- Gray = before expected start date

```
BINANCE-SPOT - 2024
Jan: ██████████████████████████████ (31/31)
Feb: ██████████████████████████████ (29/29)
Mar: ██████████████████████░░░░░░░░ (22/31) ⚠️ 9 missing
Apr: ██████████████████████████████ (30/30)
...
```

### Filtering Options

| Filter             | Type         | Description                        |
| ------------------ | ------------ | ---------------------------------- |
| Service            | Dropdown     | Filter by service                  |
| Category           | Multi-select | CEFI, TRADFI, DEFI                 |
| Status             | Multi-select | Complete, Gaps, Missing            |
| Coverage Threshold | Slider       | Show only venues below X% coverage |

### API Endpoint

```
GET /api/data-status?service={service}&category={category}&venue={venue}
```

**Response:**

```json
{
  "service": "market-tick-data-handler",
  "venues": [
    {
      "category": "CEFI",
      "venue": "BINANCE-SPOT",
      "expected_start": "2017-07-14",
      "actual_start": "2019-11-17",
      "latest_date": "2026-01-29",
      "coverage_percent": 98.5,
      "missing_days": 12,
      "missing_ranges": [
        { "start": "2021-05-19", "end": "2021-05-21" },
        { "start": "2023-01-01", "end": "2023-01-09" }
      ],
      "status": "gaps"
    }
  ],
  "summary": {
    "total_venues": 26,
    "complete": 18,
    "with_gaps": 5,
    "missing": 3
  }
}
```

### Action Buttons

| Action             | Description                                        |
| ------------------ | -------------------------------------------------- |
| **Deploy Missing** | Create deployment to fill gaps for selected venues |
| **Export Report**  | Download CSV of data status                        |
| **Refresh**        | Re-scan GCS for current data status                |

---

## 13.5 Service Status Dashboard (Temporal Audit Trail)

### Purpose

Provide a unified view of each service's **temporal state** - showing the relationship between:

1. When **data was actually updated** in storage (GCS/S3)
2. When **code was pushed** to main branch
3. When **Docker image was built** (Cloud Build/CodeBuild)
4. When **deployment was executed**

This helps answer critical questions like:

- "Did this deployment actually update the data, or did it fail silently?"
- "Is the data stale because we forgot to run with `--force`?"
- "Which deployment produced the current data?"

### UI Location

New tab **"Service Status"** at the top level, showing all services at a glance.

### Per-Service Timeline View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ instruments-service                                              [Refresh]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ TIMELINE (most recent first)                                                │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ 📊 Data Updated        2026-01-29 16:00 UTC   ← GCS file metadata           │
│    └── CEFI/BINANCE-SPOT: 2026-01-29 (last file modified)                   │
│    └── DEFI/CURVE-ETHEREUM: 2026-01-28 (1 day behind)                           │
│                                                                             │
│ 🚀 Deployment Run      2026-01-29 19:00 UTC   ← 3 hours AFTER data update   │
│    └── ID: instruments-service-20260129-190000-a1b2c3                       │
│    └── Status: Completed (100%)                                             │
│    └── Used --force: YES                                                    │
│    └── Tag: "Full DEFI backfill"                                           │
│                                                                             │
│ 🐳 Image Built         2026-01-29 14:30 UTC                                 │
│    └── Tag: abc123def                                                       │
│    └── Commit: abc123d (main)                                               │
│    └── Build: instruments-service-build-456                                 │
│                                                                             │
│ 📝 Code Pushed         2026-01-29 14:25 UTC                                 │
│    └── Commit: abc123d "fix(defi): Fixed Curve adapter"                     │
│    └── Author: ikenna                                                       │
│    └── Branch: main                                                         │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ ⚠️  ALERT: Deployment ran AFTER data was last updated.                      │
│     This may indicate:                                                      │
│     • Deployment ran without --force (skipped existing data)                │
│     • Deployment failed silently for some shards                            │
│     • Data was updated by a different deployment                            │
│                                                                             │
│ CHECKLIST STATUS: 85% ready (38/45 items)                                   │
│ DATA COVERAGE: 92% complete (12 gaps)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Timestamps to Track

| Timestamp                 | Source                                     | Description                             |
| ------------------------- | ------------------------------------------ | --------------------------------------- |
| **Data Last Updated**     | GCS/S3 file metadata (`updated` timestamp) | When output files were actually written |
| **Deployment Completed**  | Deployment state in GCS                    | When the deployment job finished        |
| **Deployment Started**    | Deployment state in GCS                    | When the deployment job started         |
| **Image Built**           | Cloud Build / Artifact Registry            | When Docker image was created           |
| **Code Pushed**           | GitHub API                                 | When commit was pushed to main          |
| **Last Successful Build** | Cloud Build                                | When quality gates last passed          |

### Anomaly Detection

The UI should automatically detect and highlight anomalies:

**Temporal Anomalies:**
| Anomaly | Condition | Meaning |
|---------|-----------|---------|
| 🔴 **Deployment After Data** | `deployment_completed > data_last_updated` | Deployment didn't update data |
| 🟡 **Stale Image** | `image_built < code_pushed` | Image doesn't include latest code |
| 🟡 **Old Data** | `data_last_updated > 24h ago` | Data may be stale |
| 🟡 **Force Not Used** | Deployment didn't use `--force` | May have skipped existing data |

**Build Pipeline Anomalies:**
| Anomaly | Condition | Meaning |
|---------|-----------|---------|
| 🔴 **Image Built Despite Build Errors** | Cloud Build logs contain errors but build "succeeded" | Quality gates may have been skipped |
| 🔴 **Quality Gates Failed** | GitHub Actions CI failed but image exists | Someone bypassed required checks |
| 🔴 **Tests Skipped** | Build completed without running tests | `|| true` or `continue-on-error` may be masking failures |
| 🟡 **Warnings in Build Logs** | Cloud Build logs contain warnings | Build succeeded but with issues |

**Deployment Log Anomalies (CRITICAL):**
| Anomaly | Condition | Meaning |
|---------|-----------|---------|
| 🔴 **Errors in Completed Deployment** | Job status = "completed" but logs contain `ERROR` | Silent failure - job ran but had errors |
| 🟡 **Warnings in Completed Deployment** | Job status = "completed" but logs contain `WARNING` | Job succeeded but with issues |
| 🔴 **Partial Data Written** | Some shards completed, others failed silently | Data may be incomplete |
| 🔴 **Exception Stack Traces** | Logs contain Python/JS stack traces | Unhandled exceptions occurred |

### Log-Based Warning/Error Detection (CRITICAL)

**Principle: A "completed" deployment is NOT necessarily a "successful" deployment.**

Even when a deployment shows status "Completed", the UI MUST:

1. **Grep logs for errors** - Search all shard logs for:
   - `ERROR`, `CRITICAL`, `FATAL`
   - Stack traces (Python: `Traceback`, JS: `at Object.`)
   - `Exception`, `Failed`, `Error:`

2. **Grep logs for warnings** - Search all shard logs for:
   - `WARNING`, `WARN`
   - `deprecated`, `Deprecation`
   - `timeout`, `retry`

3. **Display prominently** - Don't hide issues behind "Completed" status:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ instruments-service-20260129-190000-a1b2c3                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: ✅ Completed (2192/2192 shards)                                     │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️  3 WARNINGS detected in logs                              [View All] │ │
│ │                                                                         │ │
│ │ • CEFI-BINANCE-2024-01-15: "Rate limit hit, retried 3 times"           │ │
│ │ • DEFI-CURVE-2024-01-20: "Deprecated API endpoint used"                │ │
│ │ • TRADFI-CME-2024-01-22: "Connection timeout, recovered"               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 2 ERRORS detected in logs                                 [View All] │ │
│ │                                                                         │ │
│ │ • DEFI-EULER-2024-01-18: "Failed to fetch pool data: RPC timeout"      │ │
│ │ • DEFI-FLUID-2024-01-19: "ValidationError: missing required field"     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ⚠️  This deployment completed but had issues. Review logs before           │
│    considering data reliable.                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Display Hierarchy

Replace simple "Completed" status with nuanced display:

| Actual Status                   | Display                        | Color  | Meaning                |
| ------------------------------- | ------------------------------ | ------ | ---------------------- |
| Completed, 0 errors, 0 warnings | ✅ **Clean**                   | Green  | Perfect run            |
| Completed, 0 errors, N warnings | ⚠️ **Completed with Warnings** | Yellow | Review recommended     |
| Completed, N errors, M warnings | 🔴 **Completed with Errors**   | Red    | Data may be unreliable |
| Failed                          | ❌ **Failed**                  | Red    | Job crashed            |
| Running                         | 🔄 **Running**                 | Blue   | In progress            |
| Pending                         | ⏳ **Pending**                 | Gray   | Not started            |

### API Response Enhancement

The `/api/deployments/{id}` response should include log analysis:

````json
{
  "deployment_id": "instruments-service-20260129-190000-a1b2c3",
  "status": "completed",
  "status_detail": "completed_with_warnings",
  "total_shards": 2192,
  "completed_shards": 2192,
  "failed_shards": 0,
  "log_analysis": {
    "errors": [
      {
        "shard_id": "DEFI-EULER-2024-01-18",
        "message": "Failed to fetch pool data: RPC timeout",
        "timestamp": "2026-01-29T18:45:00Z",
        "severity": "ERROR"
      }
    ],
    "warnings": [
      {
        "shard_id": "CEFI-BINANCE-2024-01-15",
        "message": "Rate limit hit, retried 3 times",
        "timestamp": "2026-01-29T18:30:00Z",
        "severity": "WARNING"
      }
    ],
    "error_count": 2,
    "warning_count": 3,
    "has_stack_traces": true
  },
  "build_health": {
    "quality_gates_passed": true,
    "tests_ran": true,
    "linting_passed": true,
    "build_warnings": 0
  }
}

### Data Source Integration

**GCS (Google Cloud Storage):**
```python
# Get file metadata for last modified time
from google.cloud import storage
blob = bucket.blob("path/to/output.parquet")
blob.reload()  # Fetch metadata
data_updated = blob.updated  # datetime
````

**Cloud Build:**

```python
# Get build history
from google.cloud import cloudbuild_v1
client = cloudbuild_v1.CloudBuildClient()
builds = client.list_builds(project_id=PROJECT_ID, filter=f'substitutions.REPO_NAME="{service}"')
```

**GitHub API:**

```python
# Get latest commits
import requests
commits = requests.get(f"https://api.github.com/repos/{org}/{repo}/commits?sha=main").json()
```

**AWS Equivalent (Cloud-Agnostic):**

- S3: `head_object()` → `LastModified`
- CodeBuild: `list_builds_for_project()`
- CodeCommit/GitHub: Same GitHub API

### API Endpoint

```
GET /api/services/{service}/status
```

**Response:**

```json
{
  "service": "instruments-service",
  "timestamps": {
    "data_last_updated": "2026-01-29T16:00:00Z",
    "data_last_updated_by_venue": {
      "CEFI/BINANCE-SPOT": "2026-01-29T16:00:00Z",
      "DEFI/CURVE-ETHEREUM": "2026-01-28T12:00:00Z"
    },
    "last_deployment_completed": "2026-01-29T19:00:00Z",
    "last_deployment_started": "2026-01-29T18:30:00Z",
    "last_image_built": "2026-01-29T14:30:00Z",
    "last_code_pushed": "2026-01-29T14:25:00Z",
    "last_successful_build": "2026-01-29T14:30:00Z"
  },
  "last_deployment": {
    "deployment_id": "instruments-service-20260129-190000-a1b2c3",
    "status": "completed",
    "used_force": true,
    "tag": "Full DEFI backfill",
    "total_shards": 2192,
    "completed_shards": 2192,
    "failed_shards": 0
  },
  "last_image": {
    "tag": "abc123def",
    "git_commit": "abc123d",
    "git_branch": "main",
    "build_id": "instruments-service-build-456"
  },
  "last_commit": {
    "sha": "abc123d",
    "message": "fix(defi): Fixed Curve adapter",
    "author": "ikenna",
    "timestamp": "2026-01-29T14:25:00Z"
  },
  "anomalies": [
    {
      "type": "deployment_after_data",
      "severity": "warning",
      "message": "Deployment completed 3 hours after data was last updated",
      "suggestion": "Check if deployment ran with --force, or if some shards failed"
    }
  ],
  "checklist_status": {
    "percent": 85,
    "completed": 38,
    "total": 45
  },
  "data_coverage": {
    "percent": 92,
    "gaps": 12
  }
}
```

### All Services Overview

Show a summary table for quick scanning:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Service Status Overview                                              [Refresh All]     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Service                    │ Data Updated │ Deployed    │ Built       │ Alerts        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ instruments-service        │ 4h ago       │ 1h ago      │ 5h ago      │ ⚠️ 1 warning  │
│ market-tick-data-handler   │ 2h ago       │ 2h ago      │ 5h ago      │ ✅ OK         │
│ market-data-processing     │ 6h ago       │ 1d ago      │ 2d ago      │ 🔴 Stale      │
│ features-delta-one-service │ 1d ago       │ 1d ago      │ 3d ago      │ 🟡 Old image  │
│ ml-training-service        │ Never        │ Never       │ 5d ago      │ 🔴 No data    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Integration Points

This dashboard pulls from multiple sources:

| Data Point       | GCP Source        | AWS Source            |
| ---------------- | ----------------- | --------------------- |
| Data timestamps  | GCS blob metadata | S3 object metadata    |
| Deployment state | GCS state bucket  | S3 state bucket       |
| Build status     | Cloud Build API   | CodeBuild API         |
| Code commits     | GitHub API        | GitHub/CodeCommit API |
| Image metadata   | Artifact Registry | ECR                   |

### Benefits

1. **Debug Silent Failures:** If deployment shows "completed" but data timestamp is older, something went wrong
2. **Verify --force Usage:** Know whether deployment actually overwrote data or skipped
3. **Track Code→Deploy Pipeline:** See the full chain from code push to data update
4. **Cross-Service Visibility:** One dashboard shows health of entire data pipeline
5. **Audit Trail:** Historical record of when data was updated and by which deployment

---

## 14. Implementation Status

This section tracks what is already built vs what needs to be implemented.

### Legend

- ✅ **DONE** - Fully implemented and working
- 🟡 **PARTIAL** - Partially implemented, needs enhancement
- ❌ **TODO** - Not yet implemented

---

### Deploy Tab

| Feature                                   | Status  | Notes                                                                        |
| ----------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| Service dropdown                          | ✅ DONE | Populated from sharding configs                                              |
| Category multi-select                     | ✅ DONE | Dynamic based on service dimensions                                          |
| Venue multi-select (filtered by category) | ✅ DONE | Hierarchical validation works                                                |
| Date range pickers                        | ✅ DONE | With validation against `expected_start_dates.yaml`                          |
| Compute mode toggle (Cloud Run/VM)        | ✅ DONE | -                                                                            |
| Region selector                           | ✅ DONE | 8 regions available                                                          |
| VM Zone selector                          | ✅ DONE | Auto-updates with region, shows failover note                                |
| Force checkbox                            | ✅ DONE | -                                                                            |
| Dry Run checkbox                          | ✅ DONE | Defaults to true for safety                                                  |
| Log Level selector                        | ✅ DONE | DEBUG/INFO/WARNING/ERROR                                                     |
| Max Workers input                         | ✅ DONE | -                                                                            |
| Extra CLI args input                      | ✅ DONE | Free-form text for pass-through args                                         |
| CLI Preview                               | ✅ DONE | Shows command that will be executed                                          |
| Estimated shards counter                  | ✅ DONE | Real-time calculation                                                        |
| **Deployment Notes/Tag field**            | ✅ DONE | Added `--tag` to CLI and `tag` field to API                                  |
| **Pre-deploy checklist validation**       | ✅ DONE | `/api/checklists/{service}/validate` + warning banner in DeployForm (Jan 31) |

---

### Monitor Tab (History)

| Feature                                      | Status  | Notes                                                                       |
| -------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| List deployments                             | ✅ DONE | Shows service, status, progress, shard counts                               |
| Filter by service                            | ✅ DONE | -                                                                           |
| Polling for updates                          | ✅ DONE | Auto-refreshes every 10s                                                    |
| View deployment details                      | ✅ DONE | Click to expand                                                             |
| Delete deployment                            | ✅ DONE | Single and bulk delete                                                      |
| Progress percentage                          | ✅ DONE | Shows X% (N/M shards)                                                       |
| **Shows CLI deployments**                    | ✅ DONE | State stored in GCS, both UI and CLI deployments visible                    |
| **Expandable tree view** (category → shards) | ✅ DONE | Grouped view with collapsible categories (Jan 27)                           |
| **Human-readable deployment ID**             | ✅ DONE | Uses `service-YYYYMMDD-HHMMSS-hash` format                                  |
| **Human-readable shard IDs**                 | ✅ DONE | Shows category-date format (e.g., CEFI-2025-06-01)                          |
| **Deployment tag display**                   | ✅ DONE | Added `tag` field to API responses and PATCH endpoint                       |
| **Docker image path display**                | ✅ DONE | Shows image tag in deployment header                                        |
| **Docker image digest display**              | ✅ DONE | Resolves :latest to actual sha256 digest via Artifact Registry API (Jan 27) |
| **Git commit/branch display**                | ✅ DONE | Shows commit SHA from Cloud Build, tags from Artifact Registry (Jan 31)     |

---

### Deployment Details Panel

| Feature                      | Status  | Notes                                                 |
| ---------------------------- | ------- | ----------------------------------------------------- |
| Shard list with status       | ✅ DONE | Shows all shards with Running/Completed/Failed        |
| Shard dimensions display     | ✅ DONE | Category, date, venue shown                           |
| Error message display        | ✅ DONE | Shows error for failed shards                         |
| Retry count display          | ✅ DONE | Shows retries per shard                               |
| Region/Zone display          | ✅ DONE | Shows in header                                       |
| Failover event highlighting  | ✅ DONE | ZONE_EXHAUSTED, REGION_SWITCH badges                  |
| **Refresh button**           | ✅ DONE | Manual refresh of shard statuses                      |
| **Cancel entire deployment** | ✅ DONE | `POST /api/deployments/{id}/cancel`                   |
| **Cancel single shard**      | ✅ DONE | `POST /api/deployments/{id}/shards/{shard-id}/cancel` |
| **Resume deployment**        | ✅ DONE | `POST /api/deployments/{id}/resume`                   |
| **Retry failed shards**      | ✅ DONE | `POST /api/deployments/{id}/retry-failed`             |

---

### Log Viewer

| Feature                               | Status  | Notes                                                         |
| ------------------------------------- | ------- | ------------------------------------------------------------- |
| Fetch logs for deployment             | ✅ DONE | Cloud Run and VM logs                                         |
| VM serial console output              | ✅ DONE | Fetches from all zones                                        |
| Severity filtering                    | ✅ DONE | Filter by ERROR/WARNING/INFO                                  |
| Shard-specific logs                   | ✅ DONE | Filter by shard ID                                            |
| Error highlighting                    | ✅ DONE | Red for errors, yellow for warnings                           |
| Failover event badges                 | ✅ DONE | ZONE_EXHAUSTED, REGION_SWITCH, QUOTA HIT                      |
| **Search/grep in logs**               | ✅ DONE | Search box filters logs by text/severity                      |
| **Real-time streaming (auto-follow)** | ✅ DONE | Polling every 2s with `after_line` incremental fetch (Jan 27) |
| **Shard-level log popup**             | ✅ DONE | Click any shard to view its logs in modal (Jan 27)            |
| **Optimized log fetching**            | ✅ DONE | Prefers GCS logs over slow serial console (Jan 27)            |

---

### Readiness Tab (IMPLEMENTED Jan 31)

| Feature                   | Status  | Notes                                                                                  |
| ------------------------- | ------- | -------------------------------------------------------------------------------------- |
| Checklist dashboard       | ✅ DONE | `ReadinessTab.tsx` component with service selector                                     |
| Read checklist YAML files | ✅ DONE | `GET /api/checklists/{service}` reads `configs/checklist.*.yaml`                       |
| Progress bars by category | ✅ DONE | Per-category progress bars with done/partial/pending counts                            |
| Blocking items highlight  | ✅ DONE | Blocking items shown separately with red highlighting                                  |
| Pre-deploy validation API | ✅ DONE | `GET /api/checklists/{service}/validate` returns `ready`, `blocking_items`, `warnings` |
| Pre-deploy warning banner | ✅ DONE | `DeployForm.tsx` shows warning if checklist not ready, requires acknowledgment         |
| All checklists summary    | ✅ DONE | `GET /api/checklists` returns summary of all service checklists                        |

---

### Data Status Tab (NEW)

| Feature                          | Status  | Notes                                                                            |
| -------------------------------- | ------- | -------------------------------------------------------------------------------- |
| Data completeness view           | ✅ DONE | New "Data Status" tab with category breakdown (Jan 31)                           |
| data-status CLI integration      | ✅ DONE | `GET /api/data-status` wraps CLI with caching (Jan 31)                           |
| Table view of coverage           | ✅ DONE | Category and venue-level coverage percentages (Jan 31)                           |
| Heatmap calendar view            | ✅ DONE | `HeatmapCalendar.tsx` with accurate per-date data from missing_dates API (Feb 1) |
| Filter by service/category/venue | ✅ DONE | Date range, category multi-select (Jan 31)                                       |
| "Deploy Missing" button          | ✅ DONE | Switches to Deploy tab with missing data params (Jan 31)                         |
| **Venue coverage deep scan**     | ✅ DONE | Check which venues exist inside parquet files (Jan 31)                           |
| **Performance optimization**     | ✅ DONE | Fast mode (60x faster), caching (220x faster) (Jan 31)                           |

---

### Service Status Dashboard (NEW - Temporal Audit Trail)

| Feature                          | Status  | Notes                                                                                               |
| -------------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| Per-service timeline view        | ✅ DONE | New "Status" tab with 4 timestamps (Jan 31)                                                         |
| GCS file metadata integration    | ✅ DONE | Read `blob.updated` for data timestamps, category breakdown (Jan 31)                                |
| Cloud Build integration          | ✅ DONE | Cloud Build API for build status, commit SHA, duration (Jan 31)                                     |
| GitHub API integration           | ✅ DONE | GitHub API working, `github-token-sa` service account created with permissions (Jan 31)             |
| Anomaly detection (temporal)     | ✅ DONE | 4 anomaly types: stale data, deployment without data, code not built, no recent deployment (Jan 31) |
| All services overview table      | ✅ DONE | `GET /api/service-status/overview` returns all services health (Jan 31)                             |
| AWS/S3 support                   | ❌ TODO | Cloud-agnostic via CLOUD_PROVIDER                                                                   |
| `/api/services/{service}/status` | ✅ DONE | `GET /api/service-status/{service}/status` (Jan 31)                                                 |
| Health indicator                 | ✅ DONE | Green/yellow/red with issue count badge (Jan 31)                                                    |
| Verbose details                  | ✅ DONE | Deployment ID, status, build details, commit info (Jan 31)                                          |

---

### Log Analysis & Warning/Error Surfacing (CRITICAL)

| Feature                              | Status  | Notes                                                |
| ------------------------------------ | ------- | ---------------------------------------------------- |
| **Grep logs for ERROR/CRITICAL**     | ✅ DONE | Scans VM serial console and Cloud Run logs           |
| **Grep logs for WARNING/WARN**       | ✅ DONE | Surfaced in log_analysis response                    |
| **Detect stack traces**              | ✅ DONE | Python Traceback, JS at Object detection             |
| **Status: Completed with Warnings**  | ✅ DONE | Yellow status badge in UI                            |
| **Status: Completed with Errors**    | ✅ DONE | Red status badge, prominent display                  |
| **Error/warning summary panel**      | ✅ DONE | Shows counts and sample messages in UI               |
| **Build pipeline anomaly detection** | ❌ TODO | Image built despite failures                         |
| **Quality gates bypass detection**   | ❌ TODO | GitHub Actions failed but image exists               |
| `log_analysis` in API response       | ✅ DONE | Returns errors/warnings from `/api/deployments/{id}` |
| `build_health` in API response       | ❌ TODO | Return quality gate status                           |

---

### Infrastructure Reporting (CLI-First)

| Feature                                | Status  | Notes                                                                   |
| -------------------------------------- | ------- | ----------------------------------------------------------------------- |
| **CLI args stored per deployment**     | ✅ DONE | In state.json at deployment level                                       |
| **CLI args stored per shard**          | ✅ DONE | In state.json at shard level                                            |
| **Retry count per shard**              | ✅ DONE | `retries` field in state                                                |
| **Execution history per shard**        | ✅ DONE | `execution_history` array with zone/region/failure per attempt          |
| **Failure category classification**    | ✅ DONE | `FailureCategory` enum with auto-detection from error messages          |
| **Zone/region switches tracking**      | ✅ DONE | `zone_switches`, `region_switches`, `final_zone`, `final_region` fields |
| `report` CLI command                   | ✅ DONE | `python deploy.py report <deployment-id>` with all flags                |
| `--infra-issues` flag                  | ✅ DONE | Cloud provider ticket format                                            |
| `--quota-issues` flag                  | ✅ DONE | Quota increase justification                                            |
| `rerun-command` CLI command            | ✅ DONE | Generate CLI to rerun failed shards                                     |
| `--failed-only` flag                   | ✅ DONE | Only show failed shards                                                 |
| `/api/deployments/{id}/report`         | ✅ DONE | API for infrastructure reports                                          |
| `/api/deployments/{id}/rerun-commands` | ✅ DONE | API for rerun commands                                                  |
| JSON/CSV export for analytics          | ✅ DONE | JSON format supported in CLI and API                                    |

---

### Backend APIs

| Endpoint                                              | Status  | Notes                                                             |
| ----------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `GET /api/services`                                   | ✅ DONE | -                                                                 |
| `GET /api/services/{service}/config`                  | ✅ DONE | Returns dimensions                                                |
| `GET /api/venues`                                     | ✅ DONE | -                                                                 |
| `GET /api/expected-start-dates`                       | ✅ DONE | -                                                                 |
| `POST /api/deploy`                                    | ✅ DONE | Includes `tag` field                                              |
| `GET /api/deployments`                                | ✅ DONE | Includes `tag` field                                              |
| `GET /api/deployments/{id}`                           | ✅ DONE | Includes `tag` field                                              |
| `GET /api/deployments/{id}/logs`                      | ✅ DONE | -                                                                 |
| `DELETE /api/deployments/{id}`                        | ✅ DONE | -                                                                 |
| `PATCH /api/deployments/{id}`                         | ✅ DONE | Update deployment tag                                             |
| `POST /api/deployments/bulk-delete`                   | ✅ DONE | -                                                                 |
| `POST /api/deployments/{id}/refresh`                  | ✅ DONE | -                                                                 |
| `POST /api/deployments/{id}/cancel`                   | ✅ DONE | Cancel all running shards                                         |
| `POST /api/deployments/{id}/resume`                   | ✅ DONE | Resume failed deployment                                          |
| `POST /api/deployments/{id}/retry-failed`             | ✅ DONE | Retry only failed shards                                          |
| `POST /api/deployments/{id}/shards/{shard-id}/cancel` | ✅ DONE | Cancel single shard                                               |
| `GET /api/checklists/{service}`                       | ✅ DONE | Returns checklist YAML parsed with progress (Jan 31)              |
| `GET /api/checklists/{service}/validate`              | ✅ DONE | Pre-deploy validation with blocking items (Jan 31)                |
| `GET /api/data-status`                                | ✅ DONE | Data completeness with caching, fast mode (Jan 31)                |
| `GET /api/service-status/{service}/status`            | ✅ DONE | Temporal audit trail - data/deploy/build/code timestamps (Jan 31) |
| `GET /api/service-status/overview`                    | ✅ DONE | All services status summary with health indicators (Jan 31)       |
| `GET /api/deployments/{id}/report`                    | ✅ DONE | Infrastructure report (retries, failures, quota issues)           |
| `GET /api/deployments/{id}/rerun-commands`            | ✅ DONE | CLI commands to rerun failed shards                               |

---

### Priority Implementation Order

**Phase 1 - Core Operations (High Priority)** ✅ COMPLETE

1. ✅ Cancel deployment API
2. ✅ Cancel single shard API
3. ✅ Retry failed shards API
4. ✅ Resume deployment API
5. ✅ Deployment tag/description (CLI + API)

**Phase 2 - Log Analysis & Error Surfacing (CRITICAL)** ✅ COMPLETE

1. ✅ Grep logs for ERROR/WARNING on completed deployments
2. ✅ "Completed with Warnings" / "Completed with Errors" status
3. ✅ Error/warning summary panel in deployment details
4. ✅ `log_analysis` and `status_detail` fields in API response

**Phase 3 - Enhanced Visibility**

1. ✅ Deployment tag/description (CLI + API + UI) - DONE
2. ✅ Docker image and tag display - DONE
3. ✅ Expandable tree view for shards by category - DONE
4. ✅ Build pipeline health status - Cloud Build API integrated in ServiceStatusTab (Jan 31)

**Phase 4 - Infrastructure Reporting (CLI-First)** ✅ COMPLETE

1. ✅ Execution history tracking per shard (zone/region/failure per attempt)
2. ✅ Failure category classification (zone_exhaustion, ip_quota, cpu_quota, etc.)
3. ✅ `report` CLI command with --infra-issues, --quota-issues, --retries
4. ✅ `rerun-command` CLI to reconstruct failed shard commands
5. ✅ JSON export for analytics (Datadog, Grafana)

**Phase 5 - Service Status Dashboard** ✅ COMPLETE

1. ✅ Per-service temporal timeline - `ServiceStatusTab.tsx`
2. ✅ Anomaly detection (data/deploy/build timestamps)
3. ✅ All services overview table - `ServicesOverviewTab.tsx`
4. ❌ Quality gates bypass detection (requires Cloud Build webhook integration)

**Phase 6 - New Features** ✅ COMPLETE

1. ✅ Readiness/Checklist tab + API (Jan 31)
2. ✅ Data Status tab + API (Jan 31)
3. ✅ Pre-deploy validation with warnings (Jan 31)

**Phase 7 - Polish** ✅ COMPLETE

1. ✅ Human-readable shard IDs in UI - Shows CEFI-2025-06-01 format
2. ✅ Log search/grep functionality - DONE
3. ✅ Real-time log streaming (incremental fetch with auto-follow) (Jan 27)

**Phase 8 - Performance & Scalability** ✅ COMPLETE (Jan 31)

1. ✅ Multi-worker backend (4 workers, no blocking during large deployments)
2. ✅ Deployment worker process (separate process isolation)
3. ✅ Smart caching (Redis + in-memory, 220x speedup)
4. ✅ Fast mode for data-status (60x faster for venue-sharded services)
5. ✅ Increased timeouts and concurrency limits

**Remaining Work (Future Enhancements)**

1. ❌ **Real-time VM log streaming** - Currently logs are held in container and only available at exit (can take hours). Need to stream logs from running VMs to UI in real-time.
2. ❌ **Quality gates bypass detection** - Detect when image was built despite GitHub Actions failures (requires Cloud Build webhook integration)
3. ❌ **Build health in API response** - Return quality gate status in deployment API
4. ✅ **Heatmap calendar accuracy** - Fixed to use actual missing_dates from API (Feb 1)

---

## 14b. UAT Findings (January 31, 2026)

### Deployment Testing Summary

| Service             | Category | Dates    | Shards | Result                                        |
| ------------------- | -------- | -------- | ------ | --------------------------------------------- |
| instruments-service | DEFI     | Jan 2025 | 31     | ✅ SUCCESS                                    |
| instruments-service | CEFI     | Jan 2025 | 31     | ✅ SUCCESS                                    |
| instruments-service | TRADFI   | Jan 2025 | 31     | ✅ SUCCESS (with Databento rate limit delays) |

### Issues Discovered and Fixed

**1. Databento API Rate Limit Bottleneck**

- **Issue**: TRADFI deployments appeared stuck due to Databento `batch.submit_job` rate limit (20/min per key)
- **Root Cause**: Single API key shared across all shards
- **Fix**: Implemented multi-key rotation in `unified-trading-library/clients/databento_base_client.py`
  - 20 API keys (`databento-api-key-1` through `databento-api-key-20`)
  - Round-robin based on `SHARD_INDEX`: `key_index = (shard_index % 20) + 1`
  - Total capacity: 400 batch.submit_job/min

**2. `--max-threads` Local Machine Overheating**

- **Issue**: Setting `--max-threads=1500` overwhelmed local machines (CPU/thermal throttling)
- **Root Cause**: `max-threads` controls local `ThreadPoolExecutor` threads, not cloud VM count
- **Fix**: Changed default to 150, added warning if user sets > 200

**3. market-tick-data-handler Databento Key Bypass**

- **Issue**: market-tick-data-handler was passing explicit `api_key` to `DatabentoClient`, bypassing multi-key rotation
- **Fix**: Modified `DatabentoClient(api_key=None)` to use SHARD_INDEX-based key selection

### Multi-Key Rotation Implementation

Both services now use multi-key rotation (via unified-trading-library):

| Client                       | Keys | Secret Pattern             | Total Capacity           |
| ---------------------------- | ---- | -------------------------- | ------------------------ |
| DatabentoBaseClient (TRADFI) | 20   | `databento-api-key-{1-20}` | 400 batch.submit_job/min |
| TheGraphBaseClient (DEFI)    | 9    | `thegraph-api-key-{1-9}`   | 900 queries/min          |

### Cloud Build Verification

- **IMPORTANT**: Builds are in `asia-northeast1` region, NOT global
- Use: `gcloud builds list --region=asia-northeast1`
- Documentation: `docs/CLOUD_BUILD_TRIGGERS.md`

| Service                  | Build Status | Commit  |
| ------------------------ | ------------ | ------- |
| instruments-service      | ✅ SUCCESS   | e17512d |
| market-tick-data-handler | ✅ SUCCESS   | d00a81e |
| unified-trading-library  | ✅ PUSHED    | ddead0c |

### Symbol Batching Verification

Both services batch symbols efficiently per day:

**instruments-service:**

- 1 batch job per symbol group (futures, options, ETFs) per dataset
- ~4-6 batch jobs per category per day

**market-tick-data-handler:**

- Equities/ETFs: 1 batch per dataset
- Futures chains: 1 batch per underlying (ES.FUT, NQ.FUT, etc.)
- Options chains: 1 batch per underlying

---

## 15. Summary Checklist

Before UI is complete, verify all items above are ✅ DONE.

---

## 15. Appendix: State Storage Schema

### Deployment State (state.json)

```json
{
  "deployment_id": "instruments-service-20260130-143022-a1b2c3",
  "tag": "Fixed Curve adapter",
  "service": "instruments-service",
  "compute_type": "vm",
  "region": "asia-northeast1",
  "zone": "asia-northeast1-b",
  "created_at": "2026-01-30T14:30:22Z",
  "cli_args": "--category CEFI,TRADFI,DEFI --start-date 2024-01-01 --end-date 2024-12-31 --force",
  "image": {
    "full_path": "asia-northeast1-docker.pkg.dev/test-project/instruments-service/instruments-service:a1b2c3d4",
    "tag": "a1b2c3d4",
    "git_commit": "a1b2c3d4e5f6g7h8i9j0",
    "git_branch": "main",
    "build_time": "2026-01-30T12:00:22Z"
  },
  "status": "running",
  "progress": {
    "total_shards": 2192,
    "completed": 987,
    "running": 45,
    "pending": 1150,
    "failed": 10
  },
  "shards": [
    {
      "shard_id": "CEFI-2024-01-15-a1b2c3d4",
      "dimensions": {
        "category": "CEFI",
        "date": "2024-01-15"
      },
      "cli_args": "--category CEFI --start-date 2024-01-15 --end-date 2024-01-15",
      "internal_job_id": "projects/xxx/locations/xxx/jobs/xxx/executions/xxx",
      "status": "completed",
      "started_at": "2026-01-30T14:32:15Z",
      "ended_at": "2026-01-30T14:37:47Z",
      "duration_seconds": 332,
      "retries": 2,
      "execution_history": [
        {
          "attempt": 1,
          "zone": "asia-northeast1-a",
          "region": "asia-northeast1",
          "started_at": "2026-01-30T14:30:00Z",
          "ended_at": "2026-01-30T14:30:05Z",
          "status": "failed",
          "failure_reason": "ZONE_RESOURCE_POOL_EXHAUSTED",
          "failure_category": "zone_exhaustion"
        },
        {
          "attempt": 2,
          "zone": "asia-northeast1-b",
          "region": "asia-northeast1",
          "started_at": "2026-01-30T14:30:10Z",
          "ended_at": "2026-01-30T14:30:15Z",
          "status": "failed",
          "failure_reason": "IN_USE_ADDRESSES quota exceeded",
          "failure_category": "ip_quota"
        },
        {
          "attempt": 3,
          "zone": "europe-west1-b",
          "region": "europe-west1",
          "started_at": "2026-01-30T14:32:15Z",
          "ended_at": "2026-01-30T14:37:47Z",
          "status": "succeeded",
          "failure_reason": null,
          "failure_category": null
        }
      ],
      "final_zone": "europe-west1-b",
      "final_region": "europe-west1",
      "zone_switches": 2,
      "region_switches": 1
    }
  ]
}
```

**Key Points:**

- `internal_job_id` is stored but NEVER returned to UI
- All IDs exposed to UI are human-readable
- `tag` is optional but encouraged
- `image` metadata enables version tracking
- **`cli_args` stored at both deployment and shard level** - enables reconstruction/rerun
- **`execution_history` tracks every attempt** - zone, region, failure reason
- **Failure categories enable reporting** - `zone_exhaustion`, `ip_quota`, `cpu_quota`, `ssd_quota`, `timeout`, `application_error`

---

## 16. Infrastructure Reporting (CLI-First)

### Principle: Every UI Feature Must Have a CLI Equivalent

All reporting features must be available via CLI so they can:

- Be run without UI access
- Be plugged into other analytics systems (Datadog, PagerDuty, etc.)
- Be scripted for automated monitoring
- Be used for reporting to cloud providers (Google/AWS support tickets)

### CLI Commands for Infrastructure Reporting

```bash
# Get deployment summary with retry/failover stats
python -m deployment_service.cli report <deployment-id>
python -m deployment_service.cli report <deployment-id> --format json

# Get infrastructure issues summary (for cloud provider tickets)
python -m deployment_service.cli report <deployment-id> --infra-issues
python -m deployment_service.cli report <deployment-id> --infra-issues --format csv

# Get retry/failover breakdown
python -m deployment_service.cli report <deployment-id> --retries
python -m deployment_service.cli report <deployment-id> --zone-switches
python -m deployment_service.cli report <deployment-id> --region-switches

# Get quota usage report (for requesting increases)
python -m deployment_service.cli report <deployment-id> --quota-issues

# Export full execution history (for debugging)
python -m deployment_service.cli report <deployment-id> --execution-history --format json

# Aggregate report across multiple deployments
python -m deployment_service.cli report --service instruments-service --since 2026-01-01 --summary

# Get CLI command to rerun a specific failed shard
python -m deployment_service.cli rerun-command <deployment-id> --shard <shard-id>
python -m deployment_service.cli rerun-command <deployment-id> --failed-only
```

### Report Output: Infrastructure Issues

```bash
$ python deploy.py report instruments-service-20260130-143022-a1b2c3 --infra-issues

INFRASTRUCTURE ISSUES REPORT
============================
Deployment: instruments-service-20260130-143022-a1b2c3
Service: instruments-service
Period: 2026-01-30 14:30:22 - 2026-01-30 19:45:00 (5h 15m)

SUMMARY
-------
Total Shards: 2192
Succeeded: 2150 (98.1%)
Failed: 42 (1.9%)
Required Retries: 847 shards (38.6%)

FAILURE BREAKDOWN BY CATEGORY
-----------------------------
| Category              | Count | % of Retries | Affected Shards |
|-----------------------|-------|--------------|-----------------|
| zone_exhaustion       | 523   | 61.7%        | CEFI-*, DEFI-*  |
| ip_quota              | 187   | 22.1%        | TRADFI-*        |
| cpu_quota             | 89    | 10.5%        | DEFI-CURVE-*    |
| ssd_quota             | 31    | 3.7%         | CEFI-COINBASE-* |
| application_error     | 17    | 2.0%         | various         |

ZONE/REGION USAGE
-----------------
| Region          | Zone              | Shards Run | Failures |
|-----------------|-------------------|------------|----------|
| asia-northeast1 | asia-northeast1-a | 450        | 312      |
| asia-northeast1 | asia-northeast1-b | 623        | 156      |
| asia-northeast1 | asia-northeast1-c | 234        | 55       |
| europe-west1    | europe-west1-b    | 567        | 23       |
| us-central1     | us-central1-a     | 318        | 8        |

RECOMMENDATIONS FOR CLOUD PROVIDER
----------------------------------
1. Request quota increase for IN_USE_ADDRESSES in asia-northeast1 (current: 575, needed: ~800)
2. Request quota increase for C2_CPUS in asia-northeast1 (current: 1200, needed: ~1500)
3. Consider reserving capacity in asia-northeast1 during peak hours (14:00-18:00 UTC)

Copy-paste for GCP support ticket:
----------------------------------
We experienced ZONE_RESOURCE_POOL_EXHAUSTED errors in asia-northeast1 affecting 523
job launches on 2026-01-30 between 14:30-16:00 UTC. We request capacity reservation
or guidance on best practices for batch workloads in this region.
```

### Report Output: Rerun Commands

```bash
$ python deploy.py rerun-command instruments-service-20260130-143022-a1b2c3 --failed-only

# Rerun commands for 42 failed shards:

# DEFI-EULER-2024-01-18-a1b2c3d4 (failed: RPC timeout)
python -m deployment_service.cli deploy \
  --service instruments-service \
  --compute vm \
  --category DEFI \
  --start-date 2024-01-18 \
  --end-date 2024-01-18 \
  --force

# DEFI-FLUID-2024-01-19-b2c3d4e5 (failed: ValidationError)
python -m deployment_service.cli deploy \
  --service instruments-service \
  --compute vm \
  --category DEFI \
  --start-date 2024-01-19 \
  --end-date 2024-01-19 \
  --force

# ... (40 more commands)

# Or run all failed shards at once:
python -m deployment_service.cli retry-failed instruments-service-20260130-143022-a1b2c3
```

### API Endpoints for Reporting

```
GET /api/deployments/{id}/report
GET /api/deployments/{id}/report?type=infra-issues
GET /api/deployments/{id}/report?type=retries
GET /api/deployments/{id}/report?type=quota-issues
GET /api/deployments/{id}/report?format=json|csv|text
GET /api/deployments/{id}/rerun-commands?failed-only=true
```

### Failure Categories (Standardized)

| Category            | Description                     | Typical Resolution                |
| ------------------- | ------------------------------- | --------------------------------- |
| `zone_exhaustion`   | ZONE_RESOURCE_POOL_EXHAUSTED    | Auto-failover to next zone/region |
| `ip_quota`          | IN_USE_ADDRESSES quota exceeded | Request quota increase            |
| `cpu_quota`         | CPUS or C2_CPUS quota exceeded  | Request quota increase            |
| `ssd_quota`         | SSD_TOTAL_GB quota exceeded     | Request quota increase            |
| `preemption`        | VM preempted (preemptible only) | Auto-retry                        |
| `timeout`           | Job timed out                   | Increase timeout or investigate   |
| `application_error` | Error in service code           | Fix code and redeploy             |
| `network_error`     | Connection/DNS issues           | Usually transient, auto-retry     |
| `auth_error`        | Permission denied               | Check service account permissions |
| `unknown`           | Unclassified error              | Manual investigation              |

### Integration with Analytics Systems

```bash
# Export to JSON for Datadog/Grafana
python deploy.py report --service instruments-service --since 2026-01-01 --format json > report.json

# Pipe to jq for specific metrics
python deploy.py report $DEPLOYMENT_ID --format json | jq '.failure_breakdown.zone_exhaustion'

# Cron job for daily reporting
0 9 * * * python deploy.py report --all-services --since yesterday --format json | curl -X POST -d @- https://webhook.site/xxx
```

---

## Implementation Changelog

### January 31, 2026

**Readiness Tab (Production Checklist Dashboard)**

- Added `ReadinessTab.tsx` component for displaying per-service production readiness checklists
- Reads from `configs/checklist.{service}.yaml` files with 45-point template
- Shows readiness percentage with color-coded progress bar (green ≥90%, cyan ≥70%, amber ≥50%, red <50%)
- Displays blocking items prominently with red warning banner
- Collapsible category sections with per-category progress
- Blocking badge on pending items that would prevent deployment
- API: `/api/checklists/{service}/checklist` - returns parsed checklist with categories and items
- API: `/api/checklists/{service}/checklist/validate` - returns deployment readiness status
- API: `/api/checklists` - lists all service checklists with summary status
- instruments-service currently at 96% readiness (42/46 items complete)

**instruments-service Bug Fixes (TRADFI Equities)**

- Fixed: NYSE/NASDAQ equities not appearing in parquet files due to Databento empty `asset` column
- Fixed: Spread filter incorrectly removing class B shares (BRK.B, BF.B) with periods in symbol
- Fix location: `databento_adapter.py` lines 473, 1088-1095
- Result: TRADFI venue coverage increased from 6% to expected 100%

**UAT Testing Verification**

- Verified all 4 UI tabs: Deploy, Readiness, Configuration, History
- Tested all API endpoints via curl:
  - `GET /api/services` - service list working
  - `GET /api/services/{name}` - service config working
  - `GET /api/checklists/{name}/checklist` - checklist working (96% readiness)
  - `GET /api/checklists/{name}/checklist/validate` - validation working
  - `GET /api/deployments` - deployment history working
  - `POST /api/deployments` - deployment creation (dry-run) working
  - `GET /api/deployments/{id}/report` - infrastructure report working
  - `GET /api/deployments/{id}/rerun-commands` - rerun commands working
- data-status CLI working for venue coverage validation
- TRADFI venue coverage: improved from 6% to 83% after equity fix
- Note: Separate bug identified (TIMESTAMP_DATE_MISMATCH) - instruments use today's date in `available_from_datetime` instead of target date

**Service Status Dashboard (Phase 5) - COMPLETED**

- ✅ New "Status" tab showing temporal audit trail for each service
- ✅ API: `GET /api/service-status/{service}/status` - comprehensive service health
- ✅ API: `GET /api/service-status/overview` - all services summary
- ✅ **Last Data Update**: GCS file timestamps with category-level breakdown (CEFI, DEFI, TRADFI)
- ✅ **Last Deployment**: Most recent deployment with ID, status, compute type
- ✅ **Last Build**: Cloud Build status via Cloud Build API (status, commit SHA, duration)
- ✅ **Last Code Push**: GitHub commit info via GitHub API (requires github-token permission)
- ✅ **Anomaly Detection**: 4 types of issues detected automatically:
  - Stale data (no update in 24+ hours)
  - Deployment without data update (deployment ran but data not updated)
  - Code not built (code pushed but no build within 30min)
  - No recent deployment (7+ days)
- ✅ Health indicator: healthy/warning/error/build_failed with color coding
- ✅ Prominent anomalies display at top with severity badges
- ✅ Both relative ("4h ago") and absolute timestamps
- Dependencies: `google-cloud-build`, `google-cloud-secret-manager`, `PyGithub`

**Data Status Tab - Venue Coverage Check**

- ✅ Added "Check Venue Coverage" toggle for instruments-service
- ✅ Deep scan mode: Opens parquet files to verify which venues are present
- ✅ Shows dates with missing venues (expandable by category/date)
- ✅ "Re-deploy Affected Dates" button for gaps
- ✅ API: Added `check_venues` parameter to `/api/data-status`
- ✅ Performance: ~25s for 1 week deep scan vs instant for file-exists check

**Performance & Architecture Improvements**

- ✅ **Deployment Worker Process**: Deployments run in separate process (multiprocessing)
  - Large deployments (6000+ shards) no longer block API
  - 4-worker uvicorn mode for concurrent requests
  - `run-api.sh` script with prod/dev modes
- ✅ **Smart Caching Layer**: Redis + in-memory fallback caching
  - 220x speedup for repeated queries (11s → 0.05s)
  - Cache TTLs: 30s (deployment state), 20s (deployment list), 300s (data-status)
  - Auto-invalidation on state changes
  - Optional Redis support (works fine without)
- ✅ **Fast Mode for Data Status**: Targeted GCS queries (60x faster)
  - Auto-enables for venue-sharded services (market-tick-data-handler)
  - 2 seconds vs 2+ minutes for large buckets
  - `--fast` flag in data-status CLI
- ✅ **Increased Timeouts**: 600s for data-status, 650s keep-alive, 1000 concurrent connections
- ✅ **Stale Data Prevention**: UI clears old data immediately on filter change

**UI Improvements**

- ✅ VM as default compute type everywhere (not Cloud Run)
- ✅ Auto-fetch when date/service/category filters change (no manual refresh needed)
- ✅ Better loading states with service name and date range
- ✅ Service switch clears stale data
- ✅ Debug logging for date changes (console.log)

**Bug Fixes**

- ✅ Fixed async/await event loop errors in cache invalidation
- ✅ Fixed deployment state bucket name (deployment-orchestration-test-project)
- ✅ Fixed Cloud Build API query (use trigger ID instead of name filter)
- ✅ Fixed Secret Manager integration for GitHub token
- ✅ Fixed anomalies display (now shows at top, not hidden)

### January 27, 2026

**Real-Time Log Streaming**

- Added `after_line` query parameter to `/api/deployments/{id}/logs` for incremental fetching
- UI: Added "Follow" toggle button that polls every 2 seconds
- UI: Auto-scrolls to bottom when new logs arrive
- **Performance fix**: Logs tab now prefers GCS persisted logs over slow serial console (15s → 1s)

**Docker Image Digest Resolution**

- Created `api/utils/artifact_registry.py` - queries Docker Registry API to resolve `:latest` to actual sha256 digest
- At deployment creation, resolves image and stores `image_digest`, `image_short_digest`, `image_all_tags` in state
- UI: Displays short digest (e.g., `a1b2c3d4e5f6`) with tooltip showing full info
- Shows other tags pointing to same image (useful if commit hash is tagged)

**Shard-Level Features**

- UI: Click any shard row to open log viewer modal for that specific shard
- UI: Added grouped view toggle - shards grouped by category with collapsible sections
- UI: Added log search/filter functionality

**Bug Fixes & Performance**

- Fixed: UI no longer freezes when switching tabs (stopped background polling)
- Fixed: Cancel deployment now cancels ALL shards with job_id (handles race conditions)
- Performance: `skip_logs` parameter for faster status polling
- Performance: Optimized zone order (b,c,a) for better availability

**Commits**: `81d9f42`, `f56e4ad`, `1a545d0`, `d9e6f66`, `4e7915d`, `8dfd034`, `12d9aa3`, `0e6c152`, `845bed8`, `24822fe`

---

## Related Documentation

- [CLI.md](CLI.md) - Sharding, deploy, data catalog, dependencies
- [CLI Reference](../deployment_service/cli.py) - Full CLI implementation
- [Checklist Template](../configs/checklist.template.yaml) - Production readiness checklist
- [Expected Start Dates](../configs/expected_start_dates.yaml) - Data availability dates
- [Venues Config](../configs/venues.yaml) - Available venues per category
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - GCP/AWS access, quotas
