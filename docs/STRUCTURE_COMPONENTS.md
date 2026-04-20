# components/ — Component Architecture

All reusable React components. Organised into **19 subfolders** by domain (counted via `find components -maxdepth 2 -type d | sort`). Next.js 16.2.1 App Router, TypeScript strict, pnpm.

> **Last verified:** 2026-04-17
> **Re-sync command:** `find components -maxdepth 2 -type d | sort` (update this doc whenever the set changes).
> **Per-folder file counts:** `for d in components/*/; do echo "$d $(find "$d" -maxdepth 1 -type f | wc -l)"; done`

---

## Subfolder Map (19 folders)

File counts below are **top-level files only** (non-recursive). Sub-directories (e.g. `ops/deployment/`, `widgets/*`, `dashboards/*`) are listed separately where relevant.

| Folder                | Files | What lives here                                                                                         |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `ui/`                 | 32    | Base primitives (shadcn/ui + custom atoms)                                                              |
| `shell/`              | 19    | App shell, header, auth/capability guards, nav, command palette, debug footer                           |
| `trading/`            | 36    | Trading-domain components (P&L, orders, risk, strategy controls, feeds)                                 |
| `platform/`           | 14    | Platform-wide shared components (filters, health bar, batch/live rail, scope)                           |
| `dashboards/`         | 6     | Role-specific assembled dashboards (+ subfolders: `audit/`, `devops/`, `executive/`, `quant/`, `risk/`) |
| `ops/`                | 2     | Event stream viewer, venue connectivity (+ `ops/deployment/` 21 files)                                  |
| `data/`               | 9     | Data subscription, shard catalogue, freshness heatmap, pricing selector                                 |
| `ml/`                 | 1     | ML navigation / loss-curve viewer                                                                       |
| `execution-platform/` | 1     | Execution platform navigation                                                                           |
| `strategy-platform/`  | 1     | Strategy platform navigation                                                                            |
| `chat/`               | 6     | AI assistant chat widget (public / client / internal tiers, SSE streaming)                              |
| `research/`           | 17    | Strategy wizard, execution/features/strategies sub-widgets (+ `shared/`)                                |
| `reports/`            | 8     | Report generation + scheduling modals (+ `reports/reconciliation/`)                                     |
| `risk/`               | 1     | Correlation heatmap visualisation                                                                       |
| `marketing/`          | 6     | Public landing page visualisations (galaxy canvas, architecture diagrams)                               |
| `batch-workspace/`    | 7     | Batch run workspace — shell, filters, drift panel, batch-vs-live compare                                |
| `promote/`            | 37    | Promote lifecycle UI — pipeline, stage tabs, governance, validation, deployment                         |
| `shared/`             | 28    | Cross-cutting primitives — data tables, KPI strips, filter/form widgets, finder                         |
| `widgets/`            | 16    | Widget registry + providers (+ 17 domain subfolders listed below)                                       |

**Root-level component files** (not in any subfolder): `runtime-mode-badge.tsx`, `staging-gate.tsx`, `theme-provider.tsx`.

---

## ui/ — Base Primitives (32 files)

Standard shadcn/ui components plus custom atoms. No business logic — visual, generic props only. Includes `button.tsx`, `card.tsx`, `table.tsx`, `chart.tsx` (recharts wrapper), `dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `badge.tsx`, `tabs.tsx`, form primitives (`select.tsx`, `input.tsx`, `form.tsx`), `sidebar.tsx`, `skeleton.tsx`, `sonner.tsx`, `toaster.tsx`, `empty.tsx`, `spinner.tsx`, `item.tsx`.

---

## shell/ — App Shell & Layout (19 files)

Used inside `layout.tsx` files and the root App Router shell. Covers auth gating, capability checks, top-level chrome, error pages, and contextual help.

| File                       | Purpose                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `unified-shell.tsx`        | Main authenticated shell — composes sidebar, header, content                  |
| `site-header.tsx`          | Top navigation bar                                                            |
| `lifecycle-nav.tsx`        | Lifecycle stage nav (Design → Simulate → Promote → Run → Monitor → Reconcile) |
| `trading-vertical-nav.tsx` | Vertical nav for trading verticals                                            |
| `service-tabs.tsx`         | Tab strip for service sub-pages                                               |
| `role-selection.tsx`       | Role/persona switcher dropdown                                                |
| `require-auth.tsx`         | Auth guard — wraps authenticated routes                                       |
| `require-capability.tsx`   | Capability guard — checks feature flags / RBAC                                |
| `capability-gate.tsx`      | Declarative inline capability gate                                            |
| `access-denied.tsx`        | 403 page                                                                      |
| `route-error-page.tsx`     | Route-level error boundary page                                               |
| `command-palette.tsx`      | `Cmd-K` command palette                                                       |
| `breadcrumbs.tsx`          | Breadcrumb trail                                                              |
| `notification-bell.tsx`    | Notification bell + dropdown                                                  |
| `help-chat.tsx`            | Help/chat launcher in header                                                  |
| `tab-section-help.tsx`     | Inline tab/section help tooltip                                               |
| `api-status-indicator.tsx` | API connectivity indicator                                                    |
| `runtime-mode-strip.tsx`   | Runtime mode strip (mock / live)                                              |
| `debug-footer.tsx`         | Dev debug footer                                                              |

---

## trading/ — Trading Domain (36 files + subfolders)

Live trading, strategy monitoring, risk oversight. Used primarily under `app/(platform)/services/trading/*` and `app/(platform)/services/execution/*`.

Top-level files cover: order book, candlestick chart, time-series panel, P&L (attribution, waterfall, value), margin utilization, limit bar, strategy performance/filter/audit, dimensional grid, health status grid, kill-switch panel, intervention controls, alerts feed, live-batch comparison, KPI card, drift analysis, scope summary, entity link, value-format toggle, org/client selector, options chain, options-futures, manual trading panel, vol-surface chart, live-signal feed, watchlist, cost preview, calendar events, strategy-instruction viewer. Plus `index.ts` barrel export.

Subfolders: `context-bar/`, `manual/`, `options-chain/`, `options-futures/`, `predictions/`, `sports/`.

---

## platform/ — Platform-Wide (14 files)

Cross-domain shared components used across multiple services. Includes service hub, global scope filters, platform context bar, health bar, platform activity feed, live/as-of toggle, quick actions, candidate basket, batch/live rail.

---

## dashboards/ — Role-Specific Dashboards (6 top-level files + 5 subfolders)

Pre-assembled dashboards composing from `trading/`, `platform/`, `widgets/`. Top-level files: `trader-dashboard.tsx`, `quant-dashboard.tsx`, `executive-dashboard.tsx`, `risk-dashboard.tsx`, `devops-dashboard.tsx`, `audit-dashboard.tsx`. Subfolders: `audit/`, `devops/`, `executive/`, `quant/`, `risk/` (role-specific sub-panels).

---

## ops/ — Operations (2 top-level files + `deployment/` 21 files)

Top level: `event-stream-viewer.tsx`, `venue-connectivity.tsx`.

`ops/deployment/` (21 files) — used in `app/(ops)/devops/`, talks to deployment-api. Includes `ServiceList.tsx`, `ServiceDetails.tsx`, `ServiceStatusTab.tsx`, `ServicesOverviewTab.tsx`, `EpicReadinessView.tsx`, `ReadinessTab.tsx`, `DataStatusTab.tsx`, `ExecutionDataStatus.tsx`, `HeatmapCalendar.tsx`, `DeploymentDetails.tsx`, `DeploymentHistory.tsx`, `DeploymentResult.tsx`, `DeployForm.tsx`, `BuildSelector.tsx`, `CLIPreview.tsx`, `CloudBuildsTab.tsx`, `CloudConfigBrowser.tsx`, `Header.tsx`, `MockModeBanner.tsx`, plus added tabs.

**Naming note:** PascalCase filenames (legacy). All other folders use kebab-case — do not extend PascalCase to new files.

---

## data/ — Data Management (9 files)

Data subscription manager, shard catalogue, org-data selector, freshness heatmap, cloud-pricing selector, plus added data-management widgets. Used under `app/(platform)/services/data/*`.

---

## ml/ — ML (1 file)

ML navigation / loss-curve components.

---

## execution-platform/ — Execution Platform Nav (1 file)

Navigation component for the execution platform shell.

---

## strategy-platform/ — Strategy Platform Nav (1 file)

Navigation component for the strategy platform shell.

---

## chat/ — Chat Widget (6 files)

AI-powered chat assistant with SSE streaming, three tiers (public / client / internal). Includes `chat-widget.tsx`, `chat-widget-connected.tsx`, `chat-widget-public.tsx`, `chat-messages.tsx`, `chat-input.tsx` plus tier helpers.

---

## research/ — Research (17 top-level files + subfolders)

Strategy creation + analysis. Top-level covers strategy wizard, archetype picker, parameters, backtest launch, feature inspection. Subfolders: `execution/`, `features/`, `shared/`, `strategies/`.

---

## reports/ — Reports (8 top-level files + `reconciliation/`)

Report generation + scheduling (`generate-report-modal.tsx`, `schedule-report-modal.tsx`) plus reconciliation-specific report widgets under `reports/reconciliation/`.

---

## risk/ — Risk (1 file)

`correlation-heatmap.tsx` — colour-coded correlation matrix for portfolio positions. Additional risk surfaces live in `widgets/risk/` and `dashboards/risk/`.

---

## marketing/ — Public Landing (6 files)

Used only under `(public)/` routes. Galaxy canvas, market galaxy, arbitrage galaxy, data services showcase, platform architecture grid, operating-model stages.

---

## batch-workspace/ — Batch Run Workspace (7 files)

Batch run review UI. `batch-workspace-shell.tsx`, `batch-filter-bar.tsx`, `batch-detail-drawer.tsx`, `batch-live-compare.tsx`, `comparison-panel.tsx`, `drift-panel.tsx`, `index.ts`. Used in batch-vs-live reconciliation flows.

---

## promote/ — Promote Lifecycle (37 files)

Full lifecycle pipeline UI (canonical entry `/services/promote/pipeline`; `/services/promote` redirects). Covers pipeline overview, lifecycle frames, stage pages, sub-tabs, governance, capital allocation, champion/challenger, compliance checklist, config diff, data validation, deployment plan, execution readiness, feature stability, model assessment, model drift, Monte Carlo, paper trading, portfolio impact, regime analysis, risk/stress, walk-forward, promote flow modal, split layout, strategy context bar, strategy list panel, workflow actions/bridge/context/mutate, stage access, stage meta, list filters (context + storage), helpers, types.

Quick-promote modal (`promote-flow-modal.tsx`) is also invoked from the trading strategy grid.

---

## shared/ — Cross-Cutting Primitives (28 files + `finder/`)

Reusable widgets and utilities consumed by domain folders. Includes data-table (+ widget variant), KPI strip + summary widget, filter-bar (+ widget variant), form-widget + schema-driven-form + form-fields, live-feed widget, table widget, alert row, API error, client-tier badge, collapsible section, data-freshness (+ strip), empty state, error boundary, export dropdown, gate check row + gate status, metric card, page header, spinner, status badge, widget scroll, `index.ts` barrel. Subfolder: `finder/`.

---

## widgets/ — Widget Registry (16 top-level files + 17 domain subfolders)

Canonical widget implementations registered in the widget certification system (see `docs/widget-certification/`). Top-level: `all-widget-providers.tsx` (mounts all 17 cross-tab providers — see memory note on BP-6 lazy activation), `default-profile.ts`, `pairing-guide.md`, plus widget index + loader scaffolding.

Domain subfolders: `accounts/`, `alerts/`, `book/`, `bundles/`, `defi/`, `instructions/`, `markets/`, `options/`, `orders/`, `overview/`, `pnl/`, `positions/`, `predictions/`, `risk/`, `sports/`, `strategies/`, `terminal/`.

---

## Root-Level Component Files

| File                     | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `runtime-mode-badge.tsx` | Runtime mode badge (mock / live)              |
| `staging-gate.tsx`       | Feature flag gate — hides unreleased features |
| `theme-provider.tsx`     | Theme context provider (dark/light)           |

---

## Component Naming Rules

- **kebab-case** for all filenames (except `ops/deployment/` which is legacy PascalCase).
- **Barrel exports** exist in `components/trading/index.ts`, `components/shared/index.ts`, `components/batch-workspace/index.ts`.
- **Name collision warning:** `context-bar` exists in both `trading/` (active venue/strategy context) and `platform/` (global scope state). Import from the correct subfolder.
- **Routing:** all in-app routes use plural `/services/*` (e.g. `/services/promote/pipeline`, `/services/trading`, `/services/execution`). Singular `/service/*` is obsolete — do not introduce or reference.

---

## Re-sync Procedure

When adding or removing a component subfolder:

1. Run `find components -maxdepth 2 -type d | sort` and diff against the table above.
2. Run `for d in components/*/; do echo "$d $(find "$d" -maxdepth 1 -type f | wc -l)"; done` to refresh file counts.
3. Update the "Last verified" date at the top of this file.
4. `npx prettier --write docs/STRUCTURE_COMPONENTS.md` before committing.
