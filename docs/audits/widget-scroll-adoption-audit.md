---
status: open
owner: ComsicTrader
started: 2026-04-22
---

# WidgetScroll Adoption Audit

Audit of where the app uses the themed `WidgetScroll` wrapper ([components/shared/widget-scroll.tsx](../../components/shared/widget-scroll.tsx)) vs raw Tailwind `overflow-*-auto` / `overflow-scroll` which bypass the wrapper and render the browser's native scrollbar with no theming.

## Components in play

- **Themed wrapper** — [components/shared/widget-scroll.tsx](../../components/shared/widget-scroll.tsx) exports `WidgetScroll` + `WidgetScrollBar`. Radix `ScrollArea` styled with `bg-border/60 hover:bg-border` thumb, thin/default sizes, `axes="vertical|horizontal|both"`.
- **Base primitive** — [components/ui/scroll-area.tsx](../../components/ui/scroll-area.tsx) shadcn `ScrollArea`/`ScrollBar`. Thinner (`w-2.5`) thumb with `bg-border`.
- **Already covered for free** — every widget rendered through [components/widgets/widget-wrapper.tsx:91](../../components/widgets/widget-wrapper.tsx#L91) is wrapped in `<WidgetScroll axes="both">` automatically. Candidates below are places outside that wrapper **or** widgets that add their own nested scroller on top.

## Counts

| Bucket                                                                          |                            Count |
| ------------------------------------------------------------------------------- | -------------------------------: |
| Total raw `overflow-(auto\|scroll\|y-auto\|x-auto\|y-scroll\|x-scroll)` matches |                              268 |
| **Excluded (false positives)**                                                  |                           **25** |
| **True candidates**                                                             | **243** across ~165 unique files |

---

## Excluded (false positives — do not migrate)

### FP1 — Archive (6 matches, 6 files)

Dead code, already gated out of the live tree.

- [archive/ml/registry/page.tsx:501](../../archive/ml/registry/page.tsx#L501)
- [archive/ml/experiments/experiment-id-page-client.tsx:431](../../archive/ml/experiments/experiment-id-page-client.tsx#L431)
- [archive/ml/experiments/page.tsx:501](../../archive/ml/experiments/page.tsx#L501)
- [archive/components/widgets/defi/defi-basis-trade-widget.tsx:289](../../archive/components/widgets/defi/defi-basis-trade-widget.tsx#L289)
- [archive/components/widgets/terminal/depth-chart-widget.tsx:113](../../archive/components/widgets/terminal/depth-chart-widget.tsx#L113)
- [archive/components/ml/ml-nav.tsx:81](../../archive/components/ml/ml-nav.tsx#L81)

### FP2 — Source of WidgetScroll itself (1 match, 1 file)

- [components/shared/widget-scroll.tsx:59](../../components/shared/widget-scroll.tsx#L59) — the wrapper's own viewport class.

### FP3 — shadcn/Radix primitives (4 matches, 4 files)

These are the primitives that already own their overflow behavior (table scroller, cmdk, Radix dropdown/select menus). Wrapping them in WidgetScroll would fight Radix's own focus-lock + keyboard handling.

- [components/ui/table.tsx:13](../../components/ui/table.tsx#L13) — base `Table` container (`TableContainer`)
- [components/ui/command.tsx:93](../../components/ui/command.tsx#L93) — `CommandList`
- [components/ui/dropdown-menu.tsx:45](../../components/ui/dropdown-menu.tsx#L45) — `DropdownMenuContent`
- [components/ui/select.tsx:64](../../components/ui/select.tsx#L64) — `SelectContent`

### FP4 — Intentionally hidden scrollbar (`scrollbar-none`) (4 matches, 4 files)

Horizontal tab strips where the bar is deliberately invisible — WidgetScroll would undo that.

- [components/shell/service-tabs.tsx:160](../../components/shell/service-tabs.tsx#L160)
- [components/shell/lifecycle-nav.tsx:193](../../components/shell/lifecycle-nav.tsx#L193)
- <app/(platform)/services/im/funds/layout.tsx#L51>
- [components/widgets/widget-wrapper.tsx:243](../../components/widgets/widget-wrapper.tsx#L243)

### FP5 — Native `<pre>` code blocks (10 matches, 5 files)

Code/log blocks where the native browser scrollbar is the expected UX (plus `<pre>` is a block element with no useful WidgetScroll semantics).

- <app/(public)/docs/page.tsx#L427>, <app/(public)/docs/page.tsx#L433>, <app/(public)/docs/page.tsx#L439>, <app/(public)/docs/page.tsx#L717>, <app/(public)/docs/page.tsx#L736>, <app/(public)/docs/page.tsx#L766>
- <app/(ops)/admin/health-checks/page.tsx#L99>
- <app/(platform)/services/research/quant/page.tsx#L332>
- <app/(platform)/services/strategy-catalogue/admin/lock-state/page.tsx#L315>
- <app/(platform)/services/signals/counterparties/page.tsx#L456>

---

## True candidates (grouped by pattern)

Line numbers captured from the tree at HEAD (commit `09dfc0e`, branch `live-defi-rollout`). Group order is rough migration priority: A is highest (user-visible, consistent pattern), I is lowest (shell root, intentional).

### Group A — Trading page shells (30 matches, 24 files) ★ highest priority

Repeated pattern: `<div className="h-full flex flex-col overflow-auto p-2">` at the top of a trading route page, or `flex-1 overflow-auto` inside `layout.tsx`. These scrollbars render on every trading tab.

- <app/(platform)/services/trading/positions/page.tsx#L27>
- <app/(platform)/services/trading/pnl/page.tsx#L22>
- <app/(platform)/services/trading/alerts/page.tsx#L10>
- <app/(platform)/services/trading/custom/[id]/page.tsx#L31>
- <app/(platform)/services/trading/book/page.tsx#L10>
- <app/(platform)/services/trading/bundles/page.tsx#L10>
- <app/(platform)/services/trading/defi/page.tsx#L10>
- <app/(platform)/services/trading/instructions/page.tsx#L10>
- <app/(platform)/services/trading/markets/page.tsx#L10>
- <app/(platform)/services/trading/orders/page.tsx#L25>
- <app/(platform)/services/trading/overview/page.tsx#L110>
- <app/(platform)/services/trading/predictions/page.tsx#L10>
- <app/(platform)/services/trading/risk/page.tsx#L48>
- <app/(platform)/services/trading/sports/page.tsx#L10>
- <app/(platform)/services/trading/terminal/page.tsx#L79>
- <app/(platform)/services/trading/accounts/page.tsx#L30>
- <app/(platform)/services/trading/accounts/saft/page.tsx#L7>
- <app/(platform)/services/trading/strategies/page.tsx#L20>
- <app/(platform)/services/trading/strategies/staked-basis/page.tsx#L14>, `#L48`, `#L60`
- <app/(platform)/services/trading/strategies/carry-basis/page.tsx#L18>, `#L29`
- <app/(platform)/services/trading/strategies/model-portfolios/page.tsx#L281>
- <app/(platform)/services/trading/defi/staking/page.tsx#L473>
- <app/(platform)/services/trading/sports/accumulators/page.tsx#L110>, `#L201`
- <app/(platform)/services/trading/sports/bet/page.tsx#L157>, `#L188`
- <app/(platform)/services/trading/predictions/aggregators/page.tsx#L148>, `#L236`
- <app/(platform)/services/trading/options/combos/page.tsx#L248>
- <app/(platform)/services/trading/options/pricing/page.tsx#L223>
- <app/(platform)/services/trading/positions/trades/page.tsx#L90>
- <app/(platform)/services/trading/layout.tsx#L89>, `#L289`

### Group B — Research / Data / Execution / Observe page shells (24 matches, 18 files)

Same idea as Group A for non-trading tabs.

- <app/(platform)/services/research/quant/page.tsx#L300>, `#L397`, `#L457`, `#L598`
- <app/(platform)/services/research/strategy/results/page.tsx#L414>
- <app/(platform)/services/research/strategy/handoff/page.tsx#L98>
- <app/(platform)/services/research/strategy/heatmap/page.tsx#L343>
- <app/(platform)/services/research/strategy/sports/page.tsx#L117>
- <app/(platform)/services/research/strategies/page.tsx#L302>
- <app/(platform)/services/research/features/page.tsx#L76>, `#L516`
- <app/(platform)/services/research/feature-etl/page.tsx#L312>
- <app/(platform)/services/research/ml/registry/page.tsx#L442>
- <app/(platform)/services/research/ml/components/run-analysis-compare-panel.tsx#L207>, `#L336`, `#L341`
- <app/(platform)/services/research/ml/components/run-analysis-tabs.tsx#L181>, `#L254`, `#L346`, `#L370`, `#L419`
- <app/(platform)/services/research/ml/training/components/grid-config-editor.tsx#L224>
- <app/(platform)/services/observe/scenarios/page.tsx#L637>
- <app/(platform)/services/data/processing/page.tsx#L197>
- <app/(platform)/services/data/gaps/page.tsx#L271>
- <app/(platform)/services/data/coverage/page.tsx#L278>
- <app/(platform)/services/data/missing/page.tsx#L231>
- <app/(platform)/services/execution/overview/page.tsx#L256>, `#L387`
- <app/(platform)/services/strategy-catalogue/coverage/page.tsx#L211>

### Group C — Dialog / Sheet / custom-popover bodies (20 matches, 16 files)

Radix `DialogContent` / `SheetContent` / custom popovers with `max-h-[…vh] overflow-y-auto`. Wrapping the body in `<WidgetScroll>` (not the Radix content root) would land the themed bar without touching Radix's focus/lock.

- [components/promote/promote-flow-modal.tsx:314](../../components/promote/promote-flow-modal.tsx#L314)
- <app/(ops)/admin/requests/page.tsx#L601>, `#L691`
- <app/(ops)/config/components/config-page-client.tsx#L479> — SheetContent
- <app/(ops)/approvals/page.tsx#L235>, `#L264`
- [components/research/execution/new-execution-dialog.tsx:187](../../components/research/execution/new-execution-dialog.tsx#L187)
- <app/(platform)/services/research/strategy/backtests/components/backtests-run-dialog.tsx#L47>
- [components/widgets/workspace-toolbar.tsx:333](../../components/widgets/workspace-toolbar.tsx#L333) — custom DropdownMenuContent
- [components/trading/dimensional-grid.tsx:181](../../components/trading/dimensional-grid.tsx#L181)
- [components/trading/context-bar/multi-select-dropdown.tsx:113](../../components/trading/context-bar/multi-select-dropdown.tsx#L113)
- [components/research/features/edit-config-dialog.tsx:161](../../components/research/features/edit-config-dialog.tsx#L161)
- [components/research/features/new-feature-dialog.tsx:235](../../components/research/features/new-feature-dialog.tsx#L235)
- [components/research/shared/grid-search-dialog.tsx:1145](../../components/research/shared/grid-search-dialog.tsx#L1145)
- [components/research/strategies/new-backtest-dialog.tsx:79](../../components/research/strategies/new-backtest-dialog.tsx#L79)
- [components/ops/deployment/data-status/execution-data-status-deploy-modal.tsx:57](../../components/ops/deployment/data-status/execution-data-status-deploy-modal.tsx#L57), `#L135`
- [components/ops/deployment/data-status/data-status-section-modals.tsx:395](../../components/ops/deployment/data-status/data-status-section-modals.tsx#L395), `#L461`
- [components/ops/deployment/data-status/data-status-filters-lower.tsx:232](../../components/ops/deployment/data-status/data-status-filters-lower.tsx#L232) — custom floating dropdown
- <app/(ops)/admin/groups/page.tsx#L548>
- [components/shell/debug-footer.tsx:158](../../components/shell/debug-footer.tsx#L158)
- [components/shell/runtime-mode-strip.tsx:80](../../components/shell/runtime-mode-strip.tsx#L80)

### Group D — Detail panels / side panels / chat / presentation (15 matches, 13 files)

Vertical scrollers that are clearly themed surfaces. Easy wins.

- [components/research/strategies/strategy-detail-panel.tsx:118](../../components/research/strategies/strategy-detail-panel.tsx#L118), `#L376`, `#L422`
- [components/research/features/feature-detail-panel.tsx:46](../../components/research/features/feature-detail-panel.tsx#L46)
- [components/reports/invoice-detail-drawer.tsx:85](../../components/reports/invoice-detail-drawer.tsx#L85)
- [components/chat/chat-messages.tsx:40](../../components/chat/chat-messages.tsx#L40)
- [components/chat/chat-widget-tree.tsx:186](../../components/chat/chat-widget-tree.tsx#L186)
- [components/shell/help-chat.tsx:197](../../components/shell/help-chat.tsx#L197)
- [components/research/shared/research-list-detail-layout.tsx:28](../../components/research/shared/research-list-detail-layout.tsx#L28)
- <app/(platform)/investor-relations/\_shared/presentation-shell.tsx#L90>
- <app/(platform)/investor-relations/board-presentation/components/board-presentation-client.tsx#L89>
- [components/shared/finder/finder-browser.tsx:163](../../components/shared/finder/finder-browser.tsx#L163)
- [components/shared/finder/finder-column.tsx:74](../../components/shared/finder/finder-column.tsx#L74)
- [components/shared/live-feed-widget.tsx:119](../../components/shared/live-feed-widget.tsx#L119)
- [components/promote/promote-split-layout.tsx:35](../../components/promote/promote-split-layout.tsx#L35)

### Group E — Widget internals with redundant / nested `overflow-auto` (46 matches, 26 files)

These widgets live inside `widget-wrapper.tsx` which already provides `<WidgetScroll axes="both">`. An inner `overflow-auto` element either (a) pre-empts the wrapper's scroller (creating the visible native scrollbar), or (b) creates a second nested scroller. Either way the themed bar is bypassed.

Split panels (2-pane widgets):

- [components/widgets/pnl/pnl-waterfall-factor-pie.tsx:73](../../components/widgets/pnl/pnl-waterfall-factor-pie.tsx#L73)
- [components/widgets/pnl/pnl-waterfall-widget.tsx:255](../../components/widgets/pnl/pnl-waterfall-widget.tsx#L255)
- [components/widgets/pnl/pnl-factor-drilldown-widget.tsx:35](../../components/widgets/pnl/pnl-factor-drilldown-widget.tsx#L35), `#L146`
- [components/widgets/bundles/defi-atomic-bundle-widget.tsx:116](../../components/widgets/bundles/defi-atomic-bundle-widget.tsx#L116), `#L177`
- [components/widgets/bundles/bundle-builder-widget.tsx](../../components/widgets/bundles/bundle-builder-widget.tsx) (absorbed former `bundle-steps-widget.tsx` + `bundle-templates-widget.tsx` on 2026-04-22 — WU-2)

Single-pane widgets wrapping whole body:

- [components/widgets/overview/bottom-widgets.tsx:24](../../components/widgets/overview/bottom-widgets.tsx#L24), `#L57`, `#L113`, `#L169`
- [components/widgets/overview/pnl-chart-widget.tsx:54](../../components/widgets/overview/pnl-chart-widget.tsx#L54)
- [components/widgets/overview/strategy-table-widget.tsx:162](../../components/widgets/overview/strategy-table-widget.tsx#L162), `#L251`
- [components/widgets/instructions/instructions-detail-panel-widget.tsx:11](../../components/widgets/instructions/instructions-detail-panel-widget.tsx#L11)
- [components/widgets/instructions/instructions-pipeline-table-widget.tsx:26](../../components/widgets/instructions/instructions-pipeline-table-widget.tsx#L26)
- [components/widgets/instructions/instruction-pipeline-rows.tsx:42](../../components/widgets/instructions/instruction-pipeline-rows.tsx#L42)
- [components/widgets/predictions/pred-markets-grid-widget.tsx:43](../../components/widgets/predictions/pred-markets-grid-widget.tsx#L43)
- [components/widgets/predictions/pred-trade-panel-widget.tsx:13](../../components/widgets/predictions/pred-trade-panel-widget.tsx#L13)
- [components/widgets/predictions/pred-top-markets-widget.tsx:21](../../components/widgets/predictions/pred-top-markets-widget.tsx#L21)
- [components/widgets/predictions/pred-market-detail-widget.tsx:43](../../components/widgets/predictions/pred-market-detail-widget.tsx#L43)
- [components/widgets/predictions/pred-arb-stream-widget.tsx:47](../../components/widgets/predictions/pred-arb-stream-widget.tsx#L47)
- [components/widgets/predictions/pred-arb-closed-widget.tsx:34](../../components/widgets/predictions/pred-arb-closed-widget.tsx#L34)
- [components/widgets/predictions/pred-odum-focus-widget.tsx:32](../../components/widgets/predictions/pred-odum-focus-widget.tsx#L32)
- [components/widgets/terminal/events-feed-widget.tsx:61](../../components/widgets/terminal/events-feed-widget.tsx#L61)
- [components/widgets/terminal/terminal-options-widget.tsx:35](../../components/widgets/terminal/terminal-options-widget.tsx#L35)
- [components/widgets/terminal/calendar-events-widget.tsx:8](../../components/widgets/terminal/calendar-events-widget.tsx#L8)
- [components/widgets/terminal/order-entry-widget.tsx:71](../../components/widgets/terminal/order-entry-widget.tsx#L71)
- [components/widgets/sports/sports-ml-status-widget.tsx:68](../../components/widgets/sports/sports-ml-status-widget.tsx#L68)
- [components/widgets/sports/sports-live-scores-widget.tsx:25](../../components/widgets/sports/sports-live-scores-widget.tsx#L25)
- [components/widgets/sports/sports-fixtures-widget.tsx:137](../../components/widgets/sports/sports-fixtures-widget.tsx#L137), `#L156`
- [components/widgets/sports/sports-clv-widget.tsx:47](../../components/widgets/sports/sports-clv-widget.tsx#L47)
- [components/widgets/sports/sports-predictions-widget.tsx:134](../../components/widgets/sports/sports-predictions-widget.tsx#L134)
- [components/widgets/markets/markets-latency-detail-widget.tsx:200](../../components/widgets/markets/markets-latency-detail-widget.tsx#L200)
- [components/widgets/markets/markets-live-book-widget.tsx:64](../../components/widgets/markets/markets-live-book-widget.tsx#L64)
- [components/widgets/risk/risk-correlation-heatmap-widget.tsx:23](../../components/widgets/risk/risk-correlation-heatmap-widget.tsx#L23)
- [components/widgets/defi/enhanced-basis-widget.tsx:142](../../components/widgets/defi/enhanced-basis-widget.tsx#L142)
- [components/widgets/defi/defi-funding-matrix-widget.tsx:81](../../components/widgets/defi/defi-funding-matrix-widget.tsx#L81)
- [components/widgets/strategies/strategy-family-browser-widget.tsx:76](../../components/widgets/strategies/strategy-family-browser-widget.tsx#L76)
- [components/widgets/widget-catalog-drawer.tsx:85](../../components/widgets/widget-catalog-drawer.tsx#L85)

### Group F — Horizontal table scroll wrappers (40 matches, 30 files)

Pattern: `<div className="overflow-x-auto [...]"><table>…</table></div>`. Use `WidgetScroll axes="horizontal"` or wrap `<Table>` in `ScrollArea`.

- [components/strategy-catalogue/PerformanceOverlayStats.tsx:170](../../components/strategy-catalogue/PerformanceOverlayStats.tsx#L170)
- [components/strategy-catalogue/StrategyCatalogueSurface.tsx:271](../../components/strategy-catalogue/StrategyCatalogueSurface.tsx#L271), `#L414`
- [components/trading/live-signal-feed.tsx:210](../../components/trading/live-signal-feed.tsx#L210)
- [components/trading/options-futures/tradfi-vol-surface-panel.tsx:120](../../components/trading/options-futures/tradfi-vol-surface-panel.tsx#L120)
- [components/trading/options-futures/tradfi-options-chain-tab.tsx:212](../../components/trading/options-futures/tradfi-options-chain-tab.tsx#L212)
- [components/trading/options-futures/scenario-tab.tsx:289](../../components/trading/options-futures/scenario-tab.tsx#L289)
- [components/trading/options-futures/vol-greeks-panels.tsx:107](../../components/trading/options-futures/vol-greeks-panels.tsx#L107), `#L256`
- [components/trading/predictions/portfolio-tab.tsx:218](../../components/trading/predictions/portfolio-tab.tsx#L218), `#L275`
- [components/trading/drift-analysis-panel.tsx:216](../../components/trading/drift-analysis-panel.tsx#L216)
- [components/trading/order-book.tsx:127](../../components/trading/order-book.tsx#L127), `#L160`
- [components/trading/options-chain/options-chain-view.tsx:98](../../components/trading/options-chain/options-chain-view.tsx#L98)
- [components/trading/manual/manual-trading-panel.tsx:149](../../components/trading/manual/manual-trading-panel.tsx#L149)
- [components/briefings/strategy-coverage-matrix.tsx:132](../../components/briefings/strategy-coverage-matrix.tsx#L132)
- [components/marketing/strategy-family-catalogue.tsx:320](../../components/marketing/strategy-family-catalogue.tsx#L320)
- [components/research/strategies/strategy-list-panel.tsx:119](../../components/research/strategies/strategy-list-panel.tsx#L119)
- [components/research/performance-section.tsx:81](../../components/research/performance-section.tsx#L81), `#L190`
- [components/research/capital-efficiency-section.tsx:29](../../components/research/capital-efficiency-section.tsx#L29), `#L61`
- [components/research/trades-analysis-section.tsx:90](../../components/research/trades-analysis-section.tsx#L90)
- [components/research/monthly-returns-heatmap.tsx:39](../../components/research/monthly-returns-heatmap.tsx#L39)
- [components/research/execution/execution-detail-view.tsx:208](../../components/research/execution/execution-detail-view.tsx#L208), `#L638`
- [components/research/strategy-wizard.tsx:245](../../components/research/strategy-wizard.tsx#L245), `#L513`
- [components/reports/invoice-dashboard.tsx:282](../../components/reports/invoice-dashboard.tsx#L282)
- [components/reports/portfolio-analytics.tsx:300](../../components/reports/portfolio-analytics.tsx#L300)
- [components/ops/deployment/ServiceDetails.tsx:484](../../components/ops/deployment/ServiceDetails.tsx#L484)
- [components/ops/deployment/ServicesOverviewTab.tsx:227](../../components/ops/deployment/ServicesOverviewTab.tsx#L227)
- [components/ops/deployment/EpicReadinessView.tsx:285](../../components/ops/deployment/EpicReadinessView.tsx#L285)
- [components/ops/deployment/DeploymentResult.tsx:291](../../components/ops/deployment/DeploymentResult.tsx#L291)
- [components/ops/deployment/data-status/data-status-section-turbo.tsx:320](../../components/ops/deployment/data-status/data-status-section-turbo.tsx#L320), `#L353`, `#L702`, `#L735`
- [components/ops/deployment/data-status/data-status-filters-lower.tsx:463](../../components/ops/deployment/data-status/data-status-filters-lower.tsx#L463), `#L485`
- [components/ops/deployment/data-status/execution-data-status-utils.tsx:44](../../components/ops/deployment/data-status/execution-data-status-utils.tsx#L44)
- [components/ops/deployment/details/deployment-details-shards-tab-panel.tsx:369](../../components/ops/deployment/details/deployment-details-shards-tab-panel.tsx#L369), `#L445`
- [components/ops/deployment/details/deployment-details-inline-summary.tsx:151](../../components/ops/deployment/details/deployment-details-inline-summary.tsx#L151), `#L175`
- [components/ops/deployment/details/deployment-details-report-tab-panel.tsx:166](../../components/ops/deployment/details/deployment-details-report-tab-panel.tsx#L166), `#L198`
- [components/ops/deployment/details/deployment-details-logs-tab-panel.tsx:234](../../components/ops/deployment/details/deployment-details-logs-tab-panel.tsx#L234), `#L332`
- [components/ops/deployment/details/deployment-details-shard-logs-dialog.tsx:125](../../components/ops/deployment/details/deployment-details-shard-logs-dialog.tsx#L125)
- [components/ops/deployment/form/multi-select-dimension.tsx:65](../../components/ops/deployment/form/multi-select-dimension.tsx#L65)
- [components/platform/global-scope-filters.tsx:158](../../components/platform/global-scope-filters.tsx#L158)
- [components/risk/correlation-heatmap.tsx:58](../../components/risk/correlation-heatmap.tsx#L58)
- [components/data/freshness-heatmap.tsx:109](../../components/data/freshness-heatmap.tsx#L109)
- [components/trading/sports/arb-grid.tsx:292](../../components/trading/sports/arb-grid.tsx#L292)
- [components/trading/sports/arb-stream.tsx:259](../../components/trading/sports/arb-stream.tsx#L259)
- [components/trading/sports/arb-tab.tsx:102](../../components/trading/sports/arb-tab.tsx#L102), `#L114`
- [components/trading/sports/my-bets-tab.tsx:402](../../components/trading/sports/my-bets-tab.tsx#L402)
- [components/trading/sports/fixtures-tab.tsx:143](../../components/trading/sports/fixtures-tab.tsx#L143)
- [components/trading/sports/fixtures-detail-panel.tsx:19](../../components/trading/sports/fixtures-detail-panel.tsx#L19), `#L141`, `#L240`, `#L356`, `#L446`, `#L667`
- [components/promote/promote-flow-modal.tsx:325](../../components/promote/promote-flow-modal.tsx#L325)
- [components/promote/execution-readiness-tab.tsx:200](../../components/promote/execution-readiness-tab.tsx#L200)
- [components/shared/data-table.tsx:251](../../components/shared/data-table.tsx#L251), `#L252`
- [components/shared/kpi-strip.tsx:163](../../components/shared/kpi-strip.tsx#L163)
- [components/platform/research-family-shell.tsx:100](../../components/platform/research-family-shell.tsx#L100)
- <app/(platform)/services/trading/sports/bet/page.tsx#L188> (nested `<div class="overflow-x-auto">` around an inner table)
- <app/(public)/demo/preview/page.tsx#L226>
- <app/(public)/services/backtesting/page.tsx#L378>

### Group G — Horizontal toolbars / tab rows (9 matches, 9 files) ★ low priority

Single-row button strips where the scrollbar only shows at very narrow widths. Migrating still improves visual consistency if a user resizes the panel.

- [components/strategy-platform/strategy-nav.tsx:72](../../components/strategy-platform/strategy-nav.tsx#L72)
- [components/promote/promote-strategy-context-bar.tsx:30](../../components/promote/promote-strategy-context-bar.tsx#L30)
- [components/trading/options-futures/options-toolbar.tsx:161](../../components/trading/options-futures/options-toolbar.tsx#L161)
- [components/shell/trading-vertical-nav.tsx:289](../../components/shell/trading-vertical-nav.tsx#L289)
- [components/research/features/edit-config-dialog.tsx:139](../../components/research/features/edit-config-dialog.tsx#L139) — tab strip above the body
- [components/research/features/new-feature-dialog.tsx:217](../../components/research/features/new-feature-dialog.tsx#L217) — same
- <app/(platform)/services/research/strategy/catalog/[strategyId]/page.tsx#L746> — `<TabsList>` inherits shadcn styling, borderline false positive
- [components/ops/deployment/data-status/data-status-filters-lower.tsx:232](../../components/ops/deployment/data-status/data-status-filters-lower.tsx#L232) — filter chip row

### Group H — Marketing / SVG diagrams (4 matches, 4 files)

SVG content wrapped in `overflow-x-auto` for narrow-viewport fallback. Replace with `<WidgetScroll axes="horizontal" scrollbarSize="thin">` to match the rest of the shell.

- [components/marketing/fund-sma-hierarchy-diagram.tsx:29](../../components/marketing/fund-sma-hierarchy-diagram.tsx#L29)
- [components/marketing/dart-paths-overview-diagram.tsx:33](../../components/marketing/dart-paths-overview-diagram.tsx#L33)
- [components/marketing/dart-maturity-ladder-diagram.tsx:120](../../components/marketing/dart-maturity-ladder-diagram.tsx#L120)
- [components/marketing/reg-umbrella-hierarchy-diagram.tsx:36](../../components/marketing/reg-umbrella-hierarchy-diagram.tsx#L36)

### Group I — Shell root (1 match, 1 file) ★ intentional, keep native

- [components/shell/unified-shell.tsx:71](../../components/shell/unified-shell.tsx#L71) — the root `<main>` scroller with an explicit comment (line 69) documenting that "overflow-auto lets normal pages still scroll." Technically a candidate, but changing the root scroller has ripple effects on every route; recommend leaving alone unless we're doing a shell-wide overhaul.

---

## Recommended migration order

1. **Group E (widget internals)** — highest ROI: removes the nested / bypass scrollers that are the most visible theme violations inside cards.
2. **Group A (trading pages)** — one-line swap per page, 24 files, identical pattern (`h-full flex flex-col overflow-auto p-2` → `<WidgetScroll>…</WidgetScroll>`).
3. **Group B (research/data pages)** — same as A for the non-trading routes.
4. **Group D (detail panels / chat / drawers)** — themed surfaces where the raw bar is most jarring next to adjacent WidgetScroll instances.
5. **Group C (dialogs)** — swap the body, not the Radix content root.
6. **Group F (horizontal table wrappers)** — introduce a `<TableScroll>` helper or use `WidgetScroll axes="horizontal"` directly.
7. **Group H (marketing diagrams)** — one-liner each.
8. **Group G (toolbars)** — last; visual impact is minimal.
9. **Group I (shell root)** — defer / skip.

## Notes on pitfalls

- **Radix `DialogContent` / `SheetContent`**: don't put `overflow-y-auto` on the Radix element directly and then also wrap in `WidgetScroll` — that double-scrolls. Replace the `overflow-y-auto` on the Radix content with `overflow-hidden` and wrap the inner `<div className="space-y-…">` in `WidgetScroll`.
- **Radix `DropdownMenuContent` / `SelectContent` / `CommandList`**: leave as-is. Radix needs to own the scroller for keyboard nav and focus trap.
- **`<pre>` blocks**: leave as-is. `WidgetScroll` renders a div wrapper; putting it inside/outside a `<pre>` changes semantics for screen readers and copy-paste.
- **Sports detail panel** ([components/trading/sports/fixtures-detail-panel.tsx](../../components/trading/sports/fixtures-detail-panel.tsx)) has 6 occurrences of `overflow-auto` on sibling sections — probably a single outer `WidgetScroll` at the panel root plus removing the inner ones is the right shape, not 6 nested scrollers.
