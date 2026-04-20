---
status: open
owner: ComsicTrader
started: 2026-04-20
---

# Live Widget/Page Review Findings

Running todo list of issues, fixes, and updates found during manual review across widgets and pages.

## How to read this

- **Widget/Page** — name of the widget or page surface reviewed
- **Location** — `file:line` reference when known
- **Finding** — what was observed (issue / enhancement / nit)
- **Severity** — `bug` · `enhancement` · `nit` · `removal` · `feature`
- **Status** — `[ ]` todo · `[~]` in progress · `[>]` deferred (needs design/alignment) · `[x]` done
- **Notes** — optional context, repro steps, proposed fix

Process rule: whenever the user asks for something (now or later), append it here with a checkbox status. Flip to `[x]` the moment the fix lands; if deferred, use `[>]` and write an "Open issues (expanded)" block below.

---

## TODO list

<!-- New entries appended at the bottom. -->

| #   | Date       | Status | Widget / Page                                 | Location                                                                                                                                                                                                                                      | Finding                                                                                                                                                                                                                                                                                      | Severity          | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ---------- | ------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 2026-04-20 | [x]    | Depth Chart (terminal)                        | [components/widgets/terminal/depth-chart-widget.tsx](components/widgets/terminal/depth-chart-widget.tsx)                                                                                                                                      | Remove widget entirely — archive to `archive/`.                                                                                                                                                                                                                                              | removal           | Archived to [archive/components/widgets/terminal/depth-chart-widget.tsx](archive/components/widgets/terminal/depth-chart-widget.tsx); cert JSON moved to [archive/docs/widget-certification/depth-chart.json](archive/docs/widget-certification/depth-chart.json); scrubbed from [components/widgets/terminal/register.ts](components/widgets/terminal/register.ts), [components/trading/order-book.tsx](components/trading/order-book.tsx), [docs/audits/bp2-audit-profile.json](docs/audits/bp2-audit-profile.json).                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2   | 2026-04-20 | [x]    | Calendar Events (terminal)                    | [components/widgets/terminal/calendar-events-widget.tsx](components/widgets/terminal/calendar-events-widget.tsx)                                                                                                                              | Inner "box" wrapper inside the widget duplicates chrome frame. Remove the inner box.                                                                                                                                                                                                         | bug               | [calendar-event-feed.tsx](components/trading/calendar-event-feed.tsx): when `hideTitle` is true (rendered inside a widget), drops the `Card` wrapper entirely. Non-widget callers unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 3   | 2026-04-20 | [x]    | Events Feed (terminal)                        | [components/widgets/terminal/events-feed-widget.tsx](components/widgets/terminal/events-feed-widget.tsx)                                                                                                                                      | Remove inner "Events Feed" title — title comes from widget chrome already.                                                                                                                                                                                                                   | enhancement       | Stripped `Card`/`CardHeader`/`CardTitle` entirely. Count badge kept at top-right of a slim header row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 4   | 2026-04-20 | [>]    | Instrument & Account (terminal)               | [components/widgets/terminal/instrument-bar-widget.tsx](components/widgets/terminal/instrument-bar-widget.tsx)                                                                                                                                | Remove widget; migrate responsibilities: instrument → watchlist; account + strategy → order entry; then archive.                                                                                                                                                                             | removal           | See issue #4 expanded below — blocked on shared-vs-per-tab watchlist decision and relocation of live-price/mode badge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 5   | 2026-04-20 | [>]    | **New** — Screeners tab                       | _new_ — proposed under `services/trading/screeners`                                                                                                                                                                                           | Build a Screeners widget family: arbs (sports/CeFi/DeFi), strategy setups, market screener, options flow, order flow. Click-to-fill pattern into order entry / builder / detail pane. Visual-only; execution stays backend.                                                                  | feature           | See issue #5 expanded below — needs plan doc in `unified-trading-pm/plans/` covering feed contract + intent bus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 6   | 2026-04-20 | [~]    | Instruction Detail Panel (instructions)       | [components/widgets/instructions/instructions-detail-panel-widget.tsx](components/widgets/instructions/instructions-detail-panel-widget.tsx)                                                                                                  | (a) Remove inner collapsible dropdown. (b) Detail grid duplicates the pipeline row — redesign around richer backend fields.                                                                                                                                                                  | bug + redesign    | (a) `[x]` CollapsibleSection wrapper removed. (b) `[>]` redesign spike needed — see issue #6 expanded below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7   | 2026-04-20 | [x]    | KPI summary cards (base widget)               | [components/shared/kpi-strip.tsx:97-121](components/shared/kpi-strip.tsx#L97-L121)                                                                                                                                                            | Centre the text inside each summary-strip card (label + value row).                                                                                                                                                                                                                          | nit               | Added `text-center` to label div and `justify-center` to value flex row on the base `KpiCard`. No card-layout/grid changes. Propagates through `KpiStrip` + `KpiSummaryWidget` to every consumer (positions, orders, risk, alerts, accounts, strategies, predictions, bundles, instructions-summary, defi-wallet, sports-my-bets, markets-latency, reconciliation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 8   | 2026-04-20 | [x]    | Table toolbar layout (shared)                 | [components/shared/table-widget.tsx:194-319](components/shared/table-widget.tsx#L194-L319)                                                                                                                                                    | Summary strip + filters + right-side action buttons should share a single row when they fit; right-side buttons (Refresh / Columns / Export) were being clipped by horizontal scroll; buttons should collapse to icon-only at narrow widths and wrap to a new row when they still don't fit. | bug + enhancement | Added `summary` slot to `TableWidget`. Toolbar is now `@container/tbt flex flex-wrap` (no more `overflow-x-auto`); left group = summary + filters with their own `flex-wrap`, right group = actions with `ml-auto shrink-0` that wraps as a unit. Action button labels use `hidden @[44rem]/tbt:inline` → text only when toolbar container ≥ 44rem, otherwise icon-only. Migrated four widgets off the "KpiStrip above TableWidget" pattern: [active-lp-dashboard-widget.tsx](components/widgets/strategies/active-lp-dashboard-widget.tsx), [liquidation-monitor-widget.tsx](components/widgets/strategies/liquidation-monitor-widget.tsx), [lending-arb-dashboard-widget.tsx](components/widgets/strategies/lending-arb-dashboard-widget.tsx), [defi-rates-overview-widget.tsx](components/widgets/defi/defi-rates-overview-widget.tsx). Also added `labelClassName` prop to [ExportDropdown](components/shared/export-dropdown.tsx) so its "Export" text can be hidden via container query. |
| 9   | 2026-04-20 | [x]    | Quick View panel (trading layout)             | [app/(platform)/services/trading/layout.tsx](<app/(platform)/services/trading/layout.tsx>)                                                                                                                                                    | When collapsed, the panel still held a full-height slim column (2% width × 100% height) reserving space that the widgets could otherwise use. Should collapse to just a small button at the top-right and release horizontal space entirely.                                                 | enhancement       | Replaced the always-on `ResizablePanelGroup` with a conditional render: when `quickViewCollapsed` is true, the main content takes the full width (no `ResizablePanel` / `ResizableHandle`) and a floating `PanelRightOpen` button is absolutely positioned top-right inside `#widget-fullscreen-boundary` to re-expand. Dropped the imperative `quickViewRef`/`ImperativePanelHandle` pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 10  | 2026-04-20 | [x]    | Quick View panel width (trading layout)       | [app/(platform)/services/trading/layout.tsx](<app/(platform)/services/trading/layout.tsx>)                                                                                                                                                    | Expanded Quick View was forcing too much width on the user (`minSize=15`, `defaultSize=18`). Let it shrink as narrow as ~5% and default to ~10%; user can always drag to taste.                                                                                                              | nit               | Changed main `defaultSize` 82→90, Quick View `defaultSize` 18→10, `minSize` 15→5. `maxSize=35` unchanged. `autoSaveId="trading-layout-v2"` still persists user-chosen width across reloads.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 11  | 2026-04-20 | [>]    | AMM_LP_PROVISION archetype missing from codex | [components/widgets/defi/defi-liquidity-widget.tsx:160](components/widgets/defi/defi-liquidity-widget.tsx#L160), [components/widgets/strategies/active-lp-dashboard-widget.tsx](components/widgets/strategies/active-lp-dashboard-widget.tsx) | UI ships concentrated-liquidity execution + LP monitoring widgets emitting `strategy_id: "AMM_LP"` / `algo_type: "AMM_CONCENTRATED"`, but `AMM_LP_PROVISION` is not in codex `DEFI_STRATEGY_FAMILIES`. User asked to flag this for teammate review and codex addition.                       | feature + codex   | Documented in [docs/trading/widget-certification-deferred-questions.md §architecture-v2/archetypes/amm-lp-provision.md](docs/trading/widget-certification-deferred-questions.md) (teammate review section). Decision pending: codify as archetype vs remove widgets. Widget also picked up by §3.1 hardcoded-`strategy_id` fix regardless of codification outcome.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

---

## Open issues (expanded)

### Issue #4 — Instrument & Account widget removal (terminal)

**Intent:** remove [components/widgets/terminal/instrument-bar-widget.tsx](components/widgets/terminal/instrument-bar-widget.tsx). Migrate responsibilities: instrument selection → watchlist; account + strategy → order entry. Then archive the widget.

**Blocker / why deferred:**

- The watchlist currently visible on the terminal tab is the **options-watchlist** widget ([components/widgets/options/options-watchlist-widget.tsx](components/widgets/options/options-watchlist-widget.tsx)), registered with `availableOn: ["options"]`. It renders on terminal only because all tab providers are globally mounted today (see [project_cross_tab_providers](/home/hk/.claude/projects/-home-hk-unified-trading-system-repos-unified-trading-system-ui/memory/project_cross_tab_providers.md)).
- It reads/writes [options-data-context](components/widgets/options/options-data-context.tsx), **not** [terminal-data-context](components/widgets/terminal/terminal-data-context.tsx). Selecting a symbol in it does **not** drive the terminal's `selectedInstrument` today.

**Design question (needs user decision):**

- **Option A** — one shared tab-agnostic watchlist widget that accepts data + selection callbacks as props, wired per tab.
- **Option B** — per-tab watchlist widgets. Terminal gets its own `terminal-watchlist` widget bound to `terminal-data-context`; options keeps its own.
- User preference: Option A if feasible. Needs design spike — likely coupled to the cross-tab provider work deferred to BP-6.

**Also to resolve when fixing:**

1. Where to relocate **live price + % change + LIVE/BATCH badge**: order-entry header, price-chart header, or drop entirely (chart already shows price)?
2. **Refresh / Settings / Maximize icon buttons** on the current bar are dead stubs — drop them on archive.
3. All terminal presets in [register.ts](components/widgets/terminal/register.ts) (`terminal-default`, `terminal-full`) and [bp2-audit-profile.json](docs/audits/bp2-audit-profile.json) reference `instrument-bar` and must be rewired to include the watchlist slot instead.

### Issue #5 — Screeners tab (new widget family, cross-asset)

**Intent:** a new top-level tab under `services/trading/screeners` that surfaces live **opportunities** coming off the market feed. UI is visual-only — execution stays backend-driven per running strategies. The UI's job is: make opportunities legible, let the user click to fill forms / see fulfilment steps.

**Entitlement:** `trading-common` (screener tier — new). Available on asset classes where it makes sense (crypto, equities, FX, sports, options, futures). Wiring tab-by-tab via `availableOn`.

**Proposed widget families under the Screeners tab:**

1. **Arbs Scanner** — rows appear/disappear as arbs come/go. Visual cue on arrival (flash/pulse) and staleness (fade). One widget family, per-venue-pair sub-views. Asset variants: sports (book vs book), CeFi (venue vs venue), DeFi (pool vs pool, CEX vs DEX), cross-asset (funding-rate vs spot, cash-and-carry, etc.).
2. **Strategy Opportunity Scanner** — pre-computed setups the user can click to instantiate: option structures (bull call spread, iron condor, calendar), pair trades, spread trades, etc. Click → pre-fills the relevant builder widget (options builder / order entry / combo builder) with the legs.
3. **Market Screener** — daily H/L, 52-week H/L, unusual volume, gap-up/down, breakouts, RSI extremes. Filters + sortable table. Asset-type aware.
4. **Options Flow Screener** — big OI changes, volume spikes, unusual options activity, large prints, sweeps, block trades across venues. Venue-aware.
5. **Order-Flow Screener** — big trades, bulk trades, big resting limit orders, tape anomalies. Per-instrument and cross-instrument views.

**Click-to-fill pattern (cross-widget):** selecting an opportunity row emits an intent that is consumed by the appropriate target widget on the current tab (or navigates + fills on another tab). Possible forms:

- `opportunity:fillOrderEntry { side, symbol, price, size, strategyId? }`
- `opportunity:fillOptionsStructure { legs: [...], underlying, expiry }`
- `opportunity:showFulfilmentSteps { steps: [...] }` — renders into a details pane when the action is multi-step / requires manual intermediate confirmation.

This is a generalisation of the current Strategy select in order entry — we extend the concept so any widget that presents a tradeable setup can "prime" any widget that executes.

**Open design questions:**

1. **Feed shape / backend source** — where does the opportunity stream come from? Likely a dedicated `unified-opportunities-service` (new) or a projection off existing strategy/signal events. Out of UI scope but needs to be stood up before UI can do more than mock.
2. **Entitlement model** — one `screener` tier covers everything, or per-family tiers (arbs-basic / arbs-pro / options-flow)?
3. **Cross-widget intent bus** — extend the existing scope/filter context, or introduce a new lightweight intent emitter/subscriber hook?
4. **Staleness / expiry UX** — how long does an arb stay visible after it's no longer fillable? Greyed-out with a timer? Auto-dismissed? Keep in a "recently expired" section?
5. **Where "bull call spread from chain" becomes discoverable** — today you manually build it in options builder. Screener row would be the alternative entry point, same builder as the target. No duplicate builder logic.

**Recommendation for next step:**

- UI side is feasible and high-leverage, but should **not** start until a design spike + short plan doc exists under [unified-trading-pm/plans/ai/](../../../unified-trading-pm/plans/ai/) (or `plans/active/`) covering: (a) feed contract with backend, (b) widget family breakdown, (c) intent bus shape, (d) mock source for UI dev before backend exists.
- Mark this issue as the placeholder for that plan.

### Issue #6 — Instructions detail pane is anemic; data duplicates the table

**Small fix already applied:** removed the `CollapsibleSection` wrapper inside [instructions-detail-panel-widget.tsx](components/widgets/instructions/instructions-detail-panel-widget.tsx) (was duplicating widget chrome title + adding a redundant collapse toggle).

**Remaining (bigger) task — visual redesign of the detail pane.**

**Data duplication between table row and detail grid** (same `StrategyInstruction`):

| Field                            | Pipeline row ([instruction-pipeline-rows.tsx](components/widgets/instructions/instruction-pipeline-rows.tsx)) | Detail grid ([instruction-detail-grid.tsx](components/widgets/instructions/instruction-detail-grid.tsx)) |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `signal.direction`               | ✓                                                                                                             | ✓                                                                                                        |
| `signal.confidence`              | ✓                                                                                                             | ✓                                                                                                        |
| `signal.timestamp`               | —                                                                                                             | ✓ (only new field on Signal side)                                                                        |
| `strategyId` / `strategyType`    | ✓                                                                                                             | —                                                                                                        |
| `instruction.operationType`      | ✓                                                                                                             | ✓                                                                                                        |
| `instruction.side`               | ✓                                                                                                             | —                                                                                                        |
| `instruction.quantity` / `price` | ✓                                                                                                             | ✓ (as `notional` = qty × price)                                                                          |
| `instruction.venue`              | ✓                                                                                                             | ✓                                                                                                        |
| `fill.status`                    | ✓                                                                                                             | —                                                                                                        |
| `fill.fillQty` / `fillPrice`     | ✓                                                                                                             | ✓ (as deltas: priceDiff, qtyDiff)                                                                        |
| `fill.slippageBps`               | ✓                                                                                                             | ✓                                                                                                        |

Net-new facts the detail grid adds today: **timestamp**, **notional $**, **priceDiff / qtyDiff framing**. Everything else is a restatement. That's why it feels "pure and simple" — it is.

**Also:** the pipeline table row already expands inline to show the _same_ `InstructionDetailGrid` ([instruction-pipeline-rows.tsx:185](components/widgets/instructions/instruction-pipeline-rows.tsx#L185)) when a row is clicked. So the detail panel widget is the third surface showing the same data. Either inline expansion or the side panel should own this view, not both.

**Richer fields available from the backend we could surface** (currently not in [lib/types/instructions.ts](lib/types/instructions.ts)):

From [execution.py :: ManualInstruction](../../../unified-internal-contracts/unified_internal_contracts/execution.py):

- `instruction_id`, `submitted_by` (operator identity), `submitted_at`, `reason` (audit text)
- `account_id`, `instrument_key`, `order_type`, `execution_mode` (EXECUTE / RECORD_ONLY)
- Org hierarchy: `client_id`, `strategy_id`, `portfolio_id`
- `category`, `counterparty`, `source_reference` (external trade id / broker confirmation)

From [execution_service/types.py :: ExecutionInstruction](../../../unified-internal-contracts/unified_internal_contracts/domain/execution_service/types.py):

- Routing: `from_venue` → `to_venue` (UI only shows single venue today)
- Swap detail: `token_in`, `amount`, `token_out`
- Guardrails: `max_slippage_bps` (threshold vs actual), `limit_price`
- Benchmark: `benchmark_price`, `benchmark_type` (ORACLE / TWAP / ARRIVAL) — required for execution-alpha
- On-chain params: `gas_limit`, `priority_fee_gwei`, `deadline_timestamp`
- `metadata` dict

From [execution_service/multi_leg.py](../../../unified-internal-contracts/unified_internal_contracts/domain/execution_service/multi_leg.py):

- `MultiLegInstruction` with `LegInstruction[]` — structure for spreads, combos, pair trades

From [execution_service/execution_result.py](../../../unified-internal-contracts/unified_internal_contracts/domain/execution_service/execution_result.py):

- Per-instruction result timeline (ACK → partial fills → final fill → settlement)

**Proposed detail-pane redesign (to discuss):**

1. **Header strip** — instruction_id (copy), submitted_at (absolute + relative), reason/note, execution_mode badge, status chip.
2. **Routing block** — `from_venue` → `to_venue` with an arrow; account, counterparty. Shows multi-venue routing visually, not just a single "venue".
3. **Org context** — client / strategy / portfolio breadcrumb (three-level ownership is already modelled in the contract).
4. **Signal block** — timestamp, direction, confidence, plus the originating strategy row (link to strategy detail).
5. **Guardrails vs actuals** — side-by-side: `limit_price` vs `fill.fillPrice`, `max_slippage_bps` vs `fill.slippageBps`, benchmark_price vs fill (execution alpha).
6. **On-chain block** (conditional — only when `requires_on_chain`) — gas limit, priority fee, deadline, tx hash from `source_reference`.
7. **Multi-leg block** (conditional) — legs table when `MultiLegInstruction`.
8. **Fill timeline** — stepper or sparkline of events (ACK → partials → final) from `ExecutionResult`.
9. **Metadata** — key/value inspector for the `metadata` dict (strategy-specific context).
10. **Remove the inline expansion in the pipeline table** (or make it a minimal 1-row preview) so the detail panel widget is the canonical detail surface.

**Open design questions:**

1. Should UI's `StrategyInstruction` type be widened to match `ExecutionInstruction` + `ManualInstruction`, or a new richer `InstructionDetail` type that composes them? (contracts live in Python — UI has its own TS mirror, which is currently minimal.)
2. Where does the data actually come from for the instructions list — which API endpoint? Need to confirm before widening the TS type; mock fixture is small because the UI type is small. If the backend already returns richer payloads via the strategy-service / execution-service endpoints, the UI is just throwing fields away in the mock.
3. Multi-leg rendering — one detail panel or a tabbed view (overview / legs / timeline)?
4. Should the pipeline table keep the inline expand at all, given the side panel now exists?

**Next step:** small design spike + widen the TS type to mirror the contract subset we actually want to display. Then redesign as a single plan in [unified-trading-pm/plans/](../../../unified-trading-pm/plans/).

---

## Resolved

<!-- Move rows here once fixed, keep the original row intact for history. -->
