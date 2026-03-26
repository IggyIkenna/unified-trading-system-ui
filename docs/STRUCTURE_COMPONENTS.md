# components/ — Component Architecture

All reusable React components. Organised into 11 subfolders by domain. As of commit `8e536fc`, 5 deprecated components were deleted (GlobalNavBar, AppShell, RoleLayout, LifecycleRail, UnifiedBatchShell) as part of the navigation model consolidation.

---

## Subfolder Map

| Folder                | Files | What lives here                                                           |
| --------------------- | ----- | ------------------------------------------------------------------------- |
| `ui/`                 | 57    | Base primitives (shadcn/ui + custom atoms)                                |
| `shell/`              | 6     | App shells, header, auth guard, lifecycle nav                             |
| `trading/`            | 30    | Trading-domain components — P&L, orders, risk, strategy controls          |
| `platform/`           | 10    | Platform-wide shared components — filters, health bar, batch/live rail    |
| `dashboards/`         | 6     | Role-specific assembled dashboards                                        |
| `ops/deployment/`     | 19    | Deployment UI — forms, service status, build selector, readiness          |
| `ops/` (root)         | 2     | Event stream viewer, venue connectivity                                   |
| `data/`               | 5     | Data subscription manager, shard catalogue, freshness heatmap             |
| `ml/`                 | 2     | ML loss curves, ML navigation                                             |
| `execution-platform/` | 1     | Execution platform navigation                                             |
| `strategy-platform/`  | 1     | Strategy platform navigation                                              |
| `chat/`               | 5     | Chat widget — SSE-streaming AI assistant (public, client, internal tiers) |
| `research/`           | 1     | Strategy creation wizard                                                  |
| `reports/`            | 2     | Report generation and scheduling modals                                   |
| `risk/`               | 1     | Correlation heatmap visualisation                                         |
| `marketing/`          | 6     | Landing page visualisations, galaxy canvas, architecture diagrams         |

---

## ui/ — Base Primitives (57 files)

Standard shadcn/ui components plus custom atoms. No business logic here — purely visual, generic props only.

Key files:

- `button.tsx`, `button-group.tsx` — button variants
- `card.tsx` — standard card wrapper
- `table.tsx` — data table
- `chart.tsx` — recharts wrapper
- `dialog.tsx`, `sheet.tsx`, `drawer.tsx` — modal/overlay patterns
- `badge.tsx` — status/label badge
- `tabs.tsx` — tab navigation
- `select.tsx`, `input.tsx`, `form.tsx` — form primitives
- `sidebar.tsx` — sidebar primitive (used by shell/unified-shell.tsx)
- `skeleton.tsx` — loading skeleton
- `sonner.tsx`, `toaster.tsx` — toast notifications
- `empty.tsx` — empty state component
- `spinner.tsx` — loading spinner
- `item.tsx` — generic list item / row

---

## shell/ — App Shells and Layout Components (6 files)

Used exclusively inside `layout.tsx` files. **Note:** `role-layout.tsx` was deleted in the cleanup commit — role-based layout switching is now handled differently.

| File                 | Purpose                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `unified-shell.tsx`  | Main authenticated shell — composes sidebar, header, content. The `useLegacyNav` prop and its conditional rendering were removed in cleanup.                 |
| `site-header.tsx`    | Top navigation bar                                                                                                                                           |
| `lifecycle-nav.tsx`  | Navigation bar built around lifecycle stages (Design → Simulate → Promote → Run → Monitor → Explain → Reconcile). This is now the **only** navigation model. |
| `service-tabs.tsx`   | Tab strip for service sub-pages                                                                                                                              |
| `role-selection.tsx` | Role/persona switcher dropdown                                                                                                                               |
| `require-auth.tsx`   | Auth guard — wraps authenticated routes, redirects if unauthenticated                                                                                        |

**Deleted (do not recreate):**

- `role-layout.tsx` — deleted, had zero consumers after nav consolidation
- `app-shell.tsx` (was in `trading/`) — deleted

---

## trading/ — Trading Domain Components (30 files + index.ts)

Components for live trading operations, strategy monitoring, and risk oversight. Used primarily in `app/(platform)/service/trading/` and `app/(platform)/service/execution/` pages.

### Market & Order data

- `order-book.tsx` — Level 2 order book display
- `candlestick-chart.tsx` — OHLCV candlestick chart
- `time-series-panel.tsx` — Generic time series data panel

### P&L and performance

- `pnl-attribution-panel.tsx` — P&L breakdown by factor
- `pnl-waterfall.tsx` — Waterfall P&L chart (gross → net → fees)
- `pnl-value.tsx` — Single P&L value with colour coding
- `margin-utilization.tsx` — Margin usage as a bar/gauge
- `limit-bar.tsx` — Exposure limit visualisation

### Strategy management

- `strategy-performance-table.tsx` — Tabular strategy performance
- `strategy-filter-bar.tsx` — Filter controls for strategy list
- `strategy-audit-trail.tsx` — Audit log for strategy changes
- `promote/promote-flow-modal.tsx` — Quick promote dialog (strategy grid / detail); full lifecycle lives under `/services/promote/*` (canonical entry `/services/promote/pipeline`; `/services/promote` redirects)
- `dimensional-grid.tsx` — Multi-dimensional data grid (added in recent commits)

### Risk and operations

- `health-status-grid.tsx` — Grid of service health statuses
- `circuit-breaker-grid.tsx` — Circuit breaker state per venue/strategy
- `kill-switch-panel.tsx` — Emergency kill switch controls
- `intervention-controls.tsx` — Manual override controls

### Navigation and context

- `context-bar.tsx` — **Trading-specific** context bar (active strategy/venue context — different from `platform/context-bar.tsx`)
- `breadcrumb-nav.tsx` — Breadcrumb trail
- `as-of-datetime-picker.tsx` — Historical "as-of" date/time picker
- `execution-mode-toggle.tsx` — Switch between batch and live mode

### Feeds and status

- `activity-feed.tsx` — Not present here (lives in `platform/`)
- `alerts-feed.tsx` — Trading alerts feed
- `status-badge.tsx` — Status indicator (LIVE / BATCH / PAUSED / ERROR)
- `live-batch-comparison.tsx` — Side-by-side live vs batch metrics

### Misc

- `kpi-card.tsx` — KPI metric tile
- `drift-analysis-panel.tsx` — Drift detection visualisation
- `scope-summary.tsx` — Current scope (org, shard, date range) summary
- `entity-link.tsx` — Clickable link to a named entity
- `value-format-toggle.tsx` — Toggle between USD and percentage
- `org-client-selector.tsx` — Org / client picker dropdown
- `index.ts` — Barrel export

**Deleted (do not recreate):**

- `global-nav-bar.tsx` — deleted, replaced by lifecycle-nav
- `app-shell.tsx` — deleted, GlobalNavBar + ContextBar + LifecycleRail wrapper no longer needed
- `lifecycle-rail.tsx` — deleted, lifecycle navigation now lives in `shell/lifecycle-nav.tsx`

---

## platform/ — Platform-Wide Shared Components (10 files)

Used across multiple platform domains. Not specific to any single service.

| File                       | Purpose                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `service-hub.tsx`          | Post-login service discovery grid                                                                    |
| `global-scope-filters.tsx` | Org / date / shard filter bar — affects all data on the page                                         |
| `filter-bar.tsx`           | Domain-specific filter bar (narrower scope)                                                          |
| `context-bar.tsx`          | **Platform-level** context bar — shows global scope state (different from `trading/context-bar.tsx`) |
| `health-bar.tsx`           | Slim system health indicator in the header                                                           |
| `activity-feed.tsx`        | Platform-level activity feed (all services)                                                          |
| `live-asof-toggle.tsx`     | Toggle between live data and as-of historical data                                                   |
| `quick-actions.tsx`        | Quick-action button strip                                                                            |
| `candidate-basket.tsx`     | Floating basket of selected strategy candidates                                                      |
| `batch-live-rail.tsx`      | Persistent rail showing batch vs live mode                                                           |

**Deleted (do not recreate):**

- `unified-batch-shell.tsx` — deleted, had zero consumers after legacy nav removal

---

## dashboards/ — Role-Specific Dashboards (6 files)

Pre-assembled dashboards per internal role. Compose from `trading/` and `platform/` components.

| File                      | Role                       |
| ------------------------- | -------------------------- |
| `trader-dashboard.tsx`    | Live trading operator      |
| `quant-dashboard.tsx`     | Quantitative researcher    |
| `executive-dashboard.tsx` | Senior management          |
| `risk-dashboard.tsx`      | Risk manager               |
| `devops-dashboard.tsx`    | DevOps / SRE               |
| `audit-dashboard.tsx`     | Compliance / audit officer |

---

## ops/deployment/ — Deployment UI Components (19 files)

Used exclusively in `app/(ops)/devops/`. Talk to the deployment-api backend (see `_reference/deployment-api/`).

| File                      | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `ServiceList.tsx`         | List of all registered services with status    |
| `ServiceDetails.tsx`      | Detail view for a single service               |
| `ServiceStatusTab.tsx`    | Status tab in service detail                   |
| `ServicesOverviewTab.tsx` | Summary of all services                        |
| `EpicReadinessView.tsx`   | Epic-level deployment readiness checklist      |
| `ReadinessTab.tsx`        | Overall deployment readiness assessment        |
| `DataStatusTab.tsx`       | Data availability status                       |
| `ExecutionDataStatus.tsx` | Execution-specific data availability           |
| `HeatmapCalendar.tsx`     | Calendar heatmap showing data coverage by date |
| `DeploymentDetails.tsx`   | Deployment detail panel                        |
| `DeploymentHistory.tsx`   | Past deployments list                          |
| `DeploymentResult.tsx`    | Result of a deployment run                     |
| `DeployForm.tsx`          | Form to trigger a deployment                   |
| `BuildSelector.tsx`       | Docker image / build selection                 |
| `CLIPreview.tsx`          | Preview of the CLI command                     |
| `CloudBuildsTab.tsx`      | Google Cloud Build run history                 |
| `CloudConfigBrowser.tsx`  | Browse GCS config files                        |
| `Header.tsx`              | Deployment section header                      |
| `MockModeBanner.tsx`      | Banner shown in mock mode                      |

**Naming note:** PascalCase filenames (legacy inconsistency). All other folders use kebab-case. Do not extend PascalCase to new files.

---

## data/ — Data Management Components (5 files)

| File                            | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `data-subscription-manager.tsx` | Manage data subscriptions by org                     |
| `shard-catalogue.tsx`           | Browse available shards (CEFI, DeFi, Sports, TradFi) |
| `org-data-selector.tsx`         | Organisation-scoped data selector                    |
| `freshness-heatmap.tsx`         | Data freshness heatmap by venue + date               |
| `cloud-pricing-selector.tsx`    | Cloud storage pricing tier selector                  |

---

## ml/ — ML Components (2 files)

| File              | Purpose                                |
| ----------------- | -------------------------------------- |
| `loss-curves.tsx` | Training loss / validation loss charts |
| `ml-nav.tsx`      | Navigation menu for ML sub-pages       |

---

## chat/ — Chat Widget Components (5 files)

AI-powered chat assistant with SSE streaming. Three tiers: public (no auth), client (external org), internal (operator).

| File                        | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `chat-widget.tsx`           | Core chat widget — floating panel with minimise/expand, tier-aware |
| `chat-widget-connected.tsx` | Auth-aware wrapper — resolves tier from auth context               |
| `chat-widget-public.tsx`    | Public-tier wrapper — no auth needed                               |
| `chat-messages.tsx`         | Message list renderer with streaming indicator                     |
| `chat-input.tsx`            | Chat text input with send button                                   |

---

## research/ — Research Components (1 file)

| File                  | Purpose                                                                                |
| --------------------- | -------------------------------------------------------------------------------------- |
| `strategy-wizard.tsx` | Multi-step strategy creation wizard — archetype selection, parameters, backtest launch |

---

## reports/ — Report Components (2 files)

| File                        | Purpose                                                                    |
| --------------------------- | -------------------------------------------------------------------------- |
| `generate-report-modal.tsx` | Modal to generate ad-hoc reports (P&L attribution, regulatory, settlement) |
| `schedule-report-modal.tsx` | Modal to schedule recurring report delivery                                |

---

## risk/ — Risk Components (1 file)

| File                      | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `correlation-heatmap.tsx` | Colour-coded correlation matrix heatmap for portfolio positions |

---

## marketing/ — Public Landing Page Components (6 files)

Used only in `(public)/` pages.

| File                             | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `galaxy-canvas.tsx`              | Interactive WebGL/canvas background |
| `market-galaxy.tsx`              | Market data visualisation           |
| `arbitrage-galaxy.tsx`           | Arbitrage opportunity visualisation |
| `data-services-showcase.tsx`     | Data service feature showcase       |
| `platform-architecture-grid.tsx` | Architecture diagram                |
| `operating-model-stages.tsx`     | Lifecycle stage diagram             |

---

## Other Root-Level Component Files

| File                 | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `staging-gate.tsx`   | Feature flag gate — hides unreleased features |
| `theme-provider.tsx` | Theme context provider (dark/light)           |

---

## Component Naming Rules

- **kebab-case** for all filenames (except `ops/deployment/` which is legacy PascalCase)
- **`index.ts` barrel export** exists only in `components/trading/index.ts`
- **Name collision warning**: `context-bar.tsx` exists in both `trading/` and `platform/`. The trading version shows active venue/strategy context; the platform version shows global scope state. Always import from the correct subfolder.
