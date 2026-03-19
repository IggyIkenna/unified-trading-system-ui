# Unified Trading System UI — Setup Complete ✅

**Created:** 2026-03-19
**Repo:** https://github.com/IggyIkenna/unified-trading-system-ui

---

## What Was Built

### 1. **Foundation Documents**

#### `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` (Root Must-Read)
The canonical orientation document for all future work. Every agent should read this first.

**Covers:**
- Platform ideology (one system, three user tiers: public, client, internal)
- Design doctrine (institutional, dark, premium, calm)
- Core workflow model: Design → Simulate → Promote → Run → Monitor → Explain → Reconcile
- Role-based access control and service entitlements
- Service areas (Data, Research, Execution, Reporting, Admin, Deployment, Audit)
- Commercial modularity and pricing tiers
- Development priorities for future work

---

### 2. **Configuration & Sharding Guides (NEW)**

Three critical documents that agents must understand before building features:

#### `CONFIG_REFERENCE.md` — Backend Configuration Catalogue
**Purpose:** Show UI builders what can actually be configured (no guessing)

**Key assets:**
- Where to find backend configs: `api-contracts/openapi/config-registry.json`
- How configs map to UI controls
- Configuration patterns by service type (execution, strategy, alerting, data)
- How configuration changes propagate
- When to regenerate the config registry

**Example:** Building an execution config UI?
1. Look up `ExecutionServicesConfig` in config-registry.json
2. See all fields: `enable_smart_order_routing`, `max_position_size_pct`, `preferred_venues`, etc.
3. Know types (bool, float, list[str]), defaults, required status
4. Build the UI controls directly from config spec (no guessing)

---

#### `SHARDING_DIMENSIONS.md` — Data Partitioning Model
**Purpose:** Help agents understand how data is split (critical for data availability queries)

**Key concepts:**
- **Shards:** Trading domains (CEFI, DeFi, Sports, TradFi, OnChain)
- **Venues:** Exchanges within each shard (BINANCE, KRAKEN, UNISWAP, AAVE, etc.)
- **Instruments:** Assets within each venue (BTC/USD, ETH/USDC, etc.)
- **Organizations:** Account scoping (multi-tenant)

**Why it matters:**
- When asking "what positions do we have?" → must specify shard + venue
- Config is per-shard (CEFI max position 5%, DeFi max position 2%)
- Failure isolation by shard (if DeFi shard fails, CEFI keeps running)
- Different data freshness guarantees per shard

**Common mistakes avoided:**
- ❌ Aggregating P&L across shards without understanding semantics
- ❌ Treating venues as globally unique (which BTC/USD? BINANCE or KRAKEN?)
- ❌ Using global config for all shards

**For UI builders:** Every data screen should be shard-aware. Add shard selector, show shard badges, don't cross-shard data.

---

#### `API_FRONTEND_GAPS.md` — Living Gap Document
**Purpose:** Track what the backend APIs provide vs. what the frontend needs

**Structure:**
- **🔴 HIGH-IMPACT (Blockers):** Don't start features depending on these
  - Risk API can't return per-venue limits yet
  - Positions API missing entry price (in progress)
  - Execution history API lacks date filtering
  - Strategy config API doesn't support PATCH updates

- **🟡 MEDIUM-IMPACT (Deferred):** Build UI, but feature depends on API
  - Alert API missing Slack/PagerDuty (in progress)
  - Backtesting API lacks tick-level data
  - Config API missing audit trail

- **🟢 LOW-IMPACT (Nice-to-Have):** Optional enhancements
  - Options API missing Greeks
  - Execution API missing slippage vs benchmark

- **Differentials:** Subtle API/UI misalignments
  - Order status terminology varies by venue
  - Price representation (decimal vs scientific)
  - Timestamp format inconsistencies (ms vs ISO)
  - Aggregation semantics unclear

**How to use:** Before building a feature, check the relevant service's gaps. If 🔴, defer. If 🟡, plan but wait. If 🟢, proceed.

---

### 3. **Context Guide Updates**

#### Updated `CONTEXT_GUIDE.md`
Added a **"Before You Start Building"** checklist:

```
Step 1: Understand Data Partitioning (5 min)
  → Read SHARDING_DIMENSIONS.md
  → Identify which shard(s) your feature belongs to

Step 2: Find the Configuration (10 min)
  → Read CONFIG_REFERENCE.md
  → Open config-registry.json
  → List all configurable fields, types, defaults

Step 3: Check for API Gaps (5 min)
  → Read API_FRONTEND_GAPS.md
  → Is your feature blocked? In progress? Ready?

Step 4: Find API Specs & Schemas (10 min)
  → Open api-contracts/openapi/<your-api>.yaml
  → Check api-contracts/canonical-schemas/

Step 5: Check Data Flow & Sharding (5 min)
  → Open pm/data-flow-manifest.json
  → Check pm/workspace-manifest.json

Result: Ready to code with no guessing.
```

---

## Key Files & Where to Find Them

### Configuration

| What | Where |
|------|-------|
| Every service's config fields | `unified-api-contracts/openapi/config-registry.json` |
| How to use configs in UI | `context/CONFIG_REFERENCE.md` |
| Regenerate configs | `unified-trading-pm/scripts/openapi/generate_config_registry.py` |

### Sharding & Data Availability

| What | Where |
|------|-------|
| Shard model (CEFI, DeFi, Sports, etc.) | `context/SHARDING_DIMENSIONS.md` |
| Per-shard configuration | `pm/workspace-manifest.json` → `sharding_dimensions` |
| Service sharding topology | `pm/workspace-manifest.json` → `repositories[].service_declaration` |

### API Status

| What | Where |
|------|-------|
| Known API gaps & blockers | `context/API_FRONTEND_GAPS.md` |
| API specs & OpenAPI definitions | `context/api-contracts/openapi/*.yaml` |
| Data shape (canonical schemas) | `context/api-contracts/canonical-schemas/` |
| Internal event types | `context/internal-contracts/schemas/` |

---

## How Agents Should Use This

### New Agent Starting on UI Feature

**First 30 minutes:**
1. Read [`ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md`](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md) (15 min)
   - Understand platform, roles, services, lifecycle model

2. Follow the checklist in [`CONTEXT_GUIDE.md`](./context/CONTEXT_GUIDE.md) (15 min)
   - Understand data partitioning, find configs, check API gaps

3. Start building with confidence ✓

### Mid-Build: "What can be configured?"

1. Open `context/CONFIG_REFERENCE.md` → Section 2 "How to Find Configuration"
2. Search `api-contracts/openapi/config-registry.json` for your service
3. See all fields, types, defaults — no guessing
4. Example: `ExecutionServicesConfig.smart_order_routing_enabled: bool = True`

### Mid-Build: "Where does this data come from?"

1. Check `context/SHARDING_DIMENSIONS.md` → understand data is shard/venue scoped
2. Check `context/pm/data-flow-manifest.json` → find service→API→UI flow
3. Example: "Client reporting comes from pnl-attribution-service via client-reporting-api"

### End of Sprint: "What's blocking our backlog?"

1. Review `context/API_FRONTEND_GAPS.md`
2. Find features you wanted to build but couldn't
3. Check if they're 🔴 (blocked), 🟡 (deferred), or 🟢 (nice-to-have)
4. **Add your discoveries** to the document as you go
5. Share with backend team for prioritization

---

## Development Workflow

### Phase 1: Core Architecture (Done ✓)
- ✅ Platform ideology & role model (ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)
- ✅ Configuration reference (CONFIG_REFERENCE.md)
- ✅ Sharding model (SHARDING_DIMENSIONS.md)
- ✅ API gap tracking (API_FRONTEND_GAPS.md)
- ✅ Agent navigation guide (CONTEXT_GUIDE.md)

### Phase 2: Public Landing & Service Discovery (Next)
- Landing page explaining platform
- Service carousel (Data, Research, Execution, Reporting, etc.)
- Sign-in flow
- Service discovery for prospects

### Phase 3: Authenticated Service Hub (Next)
- Post-login dashboard showing available/locked services
- Service entry points
- Entitlement display

### Phase 4-9: Deep Service UIs (Backlog)
- Data service (catalogue, subscriptions, API management)
- Research/simulation (models, backtesting, signals)
- Trading dashboard (positions, orders, risk, execution analytics)
- Reporting (P&L, performance, attribution, settlement)
- Admin (org management, user roles, service subscriptions)
- Deployment (infrastructure, CI/CD, monitoring)

---

## Important: API Gaps Are a Feature

The `API_FRONTEND_GAPS.md` document is **not a problem list** — it's a **feedback mechanism**.

As you build the UI:
1. You'll discover what the backend needs to improve
2. Document it immediately (don't wait)
3. Provide evidence: "UI needs X field to support Y feature"
4. Backend team prioritizes based on UI feedback
5. Both teams build in parallel with clear expectations

**Example:** "UI needs entry_price on positions to show 'bought at $64000, now $65000'" → Backend adds it in v0.2.0 → UI builds entry price display in phase 2.

---

## Next Steps for Iggy & Team

### For Iggy (Product Vision)

1. **Review ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md** — does it match the product vision?
2. **Review API_FRONTEND_GAPS.md** — prioritize backend work based on UI needs
3. **Assign Phase 2-3** work (landing page, service hub) to CosmicTrader and datadodo

### For CosmicTrader & datadodo (Implementation)

1. **Read ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md** → understand platform ideology
2. **Read CONTEXT_GUIDE.md checklist** → know the pre-build ritual
3. **Start Phase 2: Landing & Service Discovery**
   - Use CONFIG_REFERENCE.md to understand service configuration
   - Use SHARDING_DIMENSIONS.md to understand venue/shard concepts
   - Use API_FRONTEND_GAPS.md to see what APIs are ready

### For Backend Teams

1. Review `API_FRONTEND_GAPS.md` → prioritize work based on UI blockers
2. Engage with UI team when new APIs are ready
3. Use CONFIG_REFERENCE.md to understand how UIs consume config

---

## Repository Links

- **Repo:** https://github.com/IggyIkenna/unified-trading-system-ui
- **Parent system:** `unified-trading-system-repos` (multi-repo workspace, 60+ repos)
- **PM & codex:** `unified-trading-pm` (plans, standards, architecture)
- **Codex SSOT:** `unified-trading-codex/00-SSOT-INDEX.md`

---

## Collaborators

- **CosmicTrader** — co-builder (maintain access)
- **datadodo** — co-builder (maintain access)

---

**Status:** 🟢 **READY FOR DEVELOPMENT**

All three teams (product, UI, backend) now have:
- ✅ Clear platform vision
- ✅ Configuration reference (no guessing)
- ✅ Data partitioning model (proper scoping)
- ✅ API gap tracking (avoid surprises)
- ✅ Navigation guide (quick answers)

**Go build.**

---

**Version:** 1.0
**Last Updated:** 2026-03-19
**Maintainer:** Unified Trading System UI Team
