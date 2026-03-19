---
name: ui-trader-acceptance-testing-2026-03-15
overview: >
  Trader acceptance testing for all 12 UIs: visual quality fixes (scrunched layouts, overlapping elements),
  bidirectional UI-API mapping audit (no orphan APIs or UIs, batch + live), API mock validation (cache-based stateful
  mode), domain data completeness (positions, P&L, reconciliation, backtest, config, deployment), stress scenario
  simulation (drawdowns, missing data, bad schemas, delays), health status verbosity, process hygiene (zombies,
  shutdown), and UX reorganization (config control, manual trade entry, tab/UI consolidation). Central fixes in ui-kit
  benefit all UIs.
type: mixed
epic: epic-code-completion
status: active

completion_gates:
  code: C5
  deployment: D2
  business: B6

repo_gates:
  # Shared libraries (central fixes)
  - repo: unified-trading-ui-kit
    code: C0
    deployment: none
    business: none
    readiness_note: "Layout, spacing, responsive grid fixes. Central place for visual consistency."
  - repo: unified-admin-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Core package: stress data generators, health status components."
  # All 12 UIs
  - repo: deployment-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5183. Batch + live deployment control, image/version selection, historical deployments."
  - repo: onboarding-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5173. Config control, venue setup, strategy onboarding."
  - repo: execution-analytics-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5174. Backtest results, parameter tuning, execution analysis."
  - repo: strategy-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5175. Strategy management, backtest trigger, strategy-level P&L."
  - repo: settlement-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5176. Positions, invoices, reconciliation, settlement reports."
  - repo: live-health-monitor-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5177. Live positions, risk, health, manual trade entry, kill switches."
  - repo: logs-dashboard-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5178. Service logs, events, alerts, CI/CD audit trail."
  - repo: ml-training-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5179. Model training, experiments, model registry."
  - repo: trading-analytics-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5180. Order book, latency, microstructure, trade-level P&L."
  - repo: batch-audit-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5181. Batch job status, quality metrics, audit trail."
  - repo: client-reporting-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Port 5182. Portfolio analytics, client statements, account breakdowns."
  - repo: unified-trading-pm
    code: C0
    deployment: none
    business: none
    readiness_note: "Scripts: launch-all-uis.sh, open-all-uis.sh, stress-data-generators, TAT checklist."

depends_on:
  - ui-api-alerting-observability-2026-03-14
  # Needs createApiClient, settlement-api, config-api, smoke test baseline from Plan 7.

supersedes: []

todos:
  # ── Phase 0: STATIC MOCK CI BASELINE ─────────────────────────────────────────
  # Goal: Every UI loads in VITE_MOCK_API=true mode with zero errors. Smoke tests pass.
  # Tooling: Scripts to launch all UIs and open in browser simultaneously.
  # Best run in Cursor (can open browsers), but scripts work standalone.

  - id: ph0-run-all-smoke-tests
    content: >
      - [ ] [AGENT] P0. Run `CI=true npm test -- --run` and `npm run smoketest` (Playwright) for all 12 UIs in
      VITE_MOCK_API=true mode. Record pass/fail per UI. Fix any build, import, or runtime errors found. Every dropdown,
      tab, and interactive element must be covered by at least one smoke test assertion. Add missing assertions for any
      untested UI controls.
    status: todo

  - id: ph0-launch-all-script
    content: >
      - [ ] [AGENT] P0. Create `unified-trading-pm/scripts/dev/launch-all-uis.sh` — starts all 12 UIs in static mock
      mode (VITE_MOCK_API=true VITE_SKIP_AUTH=true, no backend needed). Uses ui-api-mapping.json for ports. Waits for
      each vite dev server to be ready (curl health check). Exits with summary table (UI name, port, status).
    status: todo

  - id: ph0-open-all-script
    content: >
      - [ ] [AGENT] P0. Create `unified-trading-pm/scripts/dev/open-all-uis.sh` — runs `open http://localhost:<port>`
      for all 12 UI ports (5173-5183). macOS `open` command. Optional `--delay 2` flag to stagger browser tab opens. Can
      be piped after launch-all-uis.sh.
    status: todo

  - id: ph0-fix-smoke-failures
    content: >
      - [ ] [AGENT] P0. For every smoke test failure found in ph0-run-all-smoke-tests: fix the root cause (not ad-hoc
      patches). If the fix is in a shared component (ui-kit, admin-core), fix it centrally so all UIs benefit. Update
      mock-api.ts fixtures if mock data is missing or stale. Document fixes applied per UI.
    status: todo

  # ── Phase 1: VISUAL QUALITY & LAYOUT ──────────────────────────────────────────
  # Goal: No scrunched layouts, no overlapping elements, content fills the viewport.
  # Central fixes in ui-kit; per-UI overrides only where domain-specific.

  - id: ph1-visual-audit
    content: >
      - [ ] [HUMAN+AGENT] P0. Visual audit of all 12 UIs in browser (1920x1080 + 1440x900 + 1280x720). Capture
      screenshots. Flag: (a) content not spreading full width, (b) elements overlapping, (c) text truncation, (d) tables
      with horizontal scroll when avoidable, (e) charts/graphs too small or compressed, (f) whitespace imbalance (all
      content crammed to top). Use Playwright screenshot comparison as regression baseline.
    status: todo

  - id: ph1-uikit-layout-fixes
    content: >
      - [ ] [AGENT] P0. Fix layout issues centrally in unified-trading-ui-kit: (a) page container uses full viewport
      height (min-h-screen) + proper padding, (b) content grids use responsive columns (grid-cols-1 md:grid-cols-2
      lg:grid-cols-3), (c) tables are responsive with proper overflow handling, (d) card components have consistent
      spacing, (e) sidebar + main content split uses flex-grow properly. All 12 UIs inherit these fixes via
      @unified-trading/ui-kit.
    status: todo

  - id: ph1-per-ui-layout-fixes
    content: >
      - [ ] [AGENT] P1. Per-UI layout fixes for domain-specific issues that can't be solved centrally. Examples:
      deployment-ui deploy form layout, trading-analytics-ui chart sizing, live-health-monitor-ui dashboard grid. Each
      fix must reference the visual audit screenshot showing the before state.
    status: todo

  - id: ph1-playwright-visual-baseline
    content: >
      - [ ] [AGENT] P1. Establish Playwright visual regression baselines for all 12 UIs. One screenshot per major
      page/tab at 1920x1080. Store in tests/smoke/__screenshots__/. Future smoke tests compare against baseline.
      Threshold: 0.5% pixel diff tolerance.
    status: todo

  # ── Phase 2: UI-API BIDIRECTIONAL MAPPING AUDIT ───────────────────────────────
  # Goal: Every API endpoint serves at least one UI. Every UI data need is backed by an API.
  # No orphan APIs, no orphan UIs. Covers both batch and live data paths.

  - id: ph2-api-to-ui-map
    content: >
      - [ ] [AGENT] P0. Generate API-to-UI mapping: for each of the 9+ APIs, list every endpoint (route + method). For
      each endpoint, identify which UI(s) consume it (search mock-api.ts + src/services/ + src/api/ in all UIs). Flag
      orphan endpoints (API serves data no UI displays). Output: api-to-ui-coverage.json in PM scripts/checkers/.
    status: todo

  - id: ph2-ui-to-api-map
    content: >
      - [ ] [AGENT] P0. Generate UI-to-API mapping: for each of the 12 UIs, list every fetch/API call made (from
      mock-api.ts routes + real client calls). For each call, identify which API endpoint serves it. Flag orphan UI
      requests (UI expects data no API provides). Output: ui-to-api-coverage.json in PM scripts/checkers/.
    status: todo

  - id: ph2-batch-live-coverage
    content: >
      - [ ] [AGENT] P1. Extend mapping to distinguish batch vs live data paths. For each API endpoint: is the data
      source batch (GCS/S3 reads, scheduled pipelines) or live (WebSocket, SSE, polling)? For each UI component: does it
      display batch data, live data, or both? Flag any batch-only data that should also have live visibility, and vice
      versa.
    status: todo

  - id: ph2-fill-orphan-gaps
    content: >
      - [ ] [AGENT] P1. For each orphan found: (a) orphan API endpoint — add UI visualization or document why it's
      internal-only, (b) orphan UI request — add API endpoint or rewire to existing endpoint. Update mock-api.ts in
      affected UIs with realistic mock data for new endpoints. Update ui-api-mapping.json if new stacks are needed.
    status: todo

  # ── Phase 3: DOMAIN DATA COMPLETENESS ─────────────────────────────────────────
  # Goal: Every domain data point is visualisable in a logical, human-readable format.
  # Trader can see everything they need to make decisions.

  - id: ph3-positions-pnl
    content: >
      - [ ] [AGENT] P0. Verify positions and P&L visibility: (a) live-health-monitor-ui shows real-time positions with
      unrealised P&L per instrument, (b) settlement-ui shows settled positions with realised P&L, (c)
      trading-analytics-ui shows trade-level P&L, (d) all broken down by client, strategy, and account where relevant.
      Mock data must include multi-client, multi-strategy, multi-account scenarios. Add missing views/columns.
    status: todo

  - id: ph3-backtest-reconciliation
    content: >
      - [ ] [AGENT] P0. Verify backtest and reconciliation: (a) execution-analytics-ui can trigger and display backtest
      results with parameter comparison, (b) strategy-ui shows strategy-level backtest history, (c) settlement-ui shows
      reconciliation view (expected vs actual fills, breaks). Mock data includes realistic backtest output and
      reconciliation breaks.
    status: todo

  - id: ph3-config-control
    content: >
      - [ ] [AGENT] P0. Verify config control: (a) onboarding-ui has full config CRUD (create/read/update) for venues,
      strategies, accounts, (b) historical config versions are viewable (diff between versions), (c) config changes are
      auditable (who changed what, when). If config UI is missing or buried, surface it properly. This is critical for
      trader workflow.
    status: todo

  - id: ph3-deployment-control
    content: >
      - [ ] [AGENT] P0. Verify deployment control for batch and live: (a) deployment-ui supports both batch and live
      deployment modes with clear mode selector, (b) historical deployments visible with image/version info, (c) can
      attach any Samba version and feature branch to a deployment, (d) rollback capability visible, (e) Cloud Build logs
      accessible. Mock data includes deployment history with multiple versions and states.
    status: todo

  - id: ph3-manual-trade-entry
    content: >
      - [ ] [AGENT] P1. Verify manual trade entry: live-health-monitor-ui has manual trade instruction form (or it
      should). If missing, add it. Must include: instrument selector, side (buy/sell), quantity, price (limit/market),
      account selector, strategy tag. Confirm the form submits to execution-service. Mock the submission response.
    status: todo

  - id: ph3-missing-domain-data
    content: >
      - [ ] [AGENT] P1. Audit for any domain data not yet visualised: (a) feature values (from features pipeline), (b)
      ML model predictions and confidence scores, (c) risk metrics (VaR, exposure, margin), (d) market data freshness
      per venue, (e) alert history and delivery status. For each gap: add a UI component or document why it's
      intentionally backend-only.
    status: todo

  # ── Phase 4: API MOCK VALIDATION (STATEFUL) ──────────────────────────────────
  # Goal: API mock mode (CLOUD_MOCK_MODE=true) supports cache-based stateful interactions.
  # Sequential actions work: deploy -> check status -> see logs. Not just static fixtures.
  # Depends on Plan 9 Phase 1.5 (MockStateStore) — extend and validate here.

  - id: ph4-validate-mock-state-store
    content: >
      - [ ] [AGENT] P0. Validate MockStateStore (from Plan 9) is wired into all 9 APIs. For each API: POST/PUT/DELETE
      must mutate state, subsequent GET must reflect mutations. Test each API's stateful flows in isolation:
      deployment-api (deploy->status->logs), execution-results-api (submit->fill->P&L), trading-analytics-api
      (trade->settle->report), batch-audit-api (job->events->summary), ml-training-api (train->progress->complete).
    status: todo

  - id: ph4-ui-stateful-scenarios
    content: >
      - [ ] [AGENT] P0. Write Playwright tests for key stateful UI flows (interactive mock mode). Each test: perform
      action in UI -> verify state change in UI without page reload. (a) deployment-ui: submit deploy, see status update
      to "building", then "deployed". (b) live-health-monitor-ui: toggle kill switch, see status change. (c)
      onboarding-ui: save config, reload page, see saved config persisted. At least 3 stateful flows per UI.
    status: todo

  - id: ph4-mock-data-realism
    content: >
      - [ ] [AGENT] P1. Audit mock data realism across all UIs. Mock data must represent realistic trading scenarios:
      (a) multiple instruments (not just "BTC-USD"), (b) realistic price/quantity magnitudes, (c) multiple clients and
      strategies, (d) mixed statuses (open/closed/pending/failed), (e) realistic timestamps (not all "2024-01-01"). Fix
      all UIs' mock-api.ts where data is unrealistic or minimal.
    status: todo

  # ── Phase 5: STRESS & RESILIENCE SIMULATION ──────────────────────────────────
  # Goal: UIs handle edge cases gracefully. Mock mode can simulate stress scenarios.
  # Stress data generators in @unified-admin/core (shared across all UIs).

  - id: ph5-stress-data-generators
    content: >
      - [ ] [AGENT] P0. Create stress scenario data generators in @unified-admin/core (shared). Scenarios: (a) big
      drawdown (positions with -90% P&L), (b) big ticks (1000+ price updates per second), (c) missing data (null fields,
      empty arrays, missing required fields), (d) bad schemas (wrong types, extra fields, malformed dates), (e) stale
      data (timestamps > 5 min old), (f) high cardinality (500+ instruments, 50+ strategies). Export as
      `generateStressData(scenario: StressScenario)`.
    status: todo

  - id: ph5-wire-stress-to-uis
    content: >
      - [ ] [AGENT] P0. Wire stress data generators into all UIs' mock-api.ts. Add `VITE_STRESS_SCENARIO` env var. When
      set, mock-api.ts returns stress data instead of normal mock data. Supported values: "drawdown", "high-tick",
      "missing-data", "bad-schema", "stale-data", "high-cardinality". Each UI handles all scenarios gracefully (no
      crashes, no blank screens, meaningful error states).
    status: todo

  - id: ph5-delay-simulation
    content: >
      - [ ] [AGENT] P1. Add network delay simulation to mock-api.ts. `VITE_MOCK_DELAY_MS` env var (default 60ms). Set to
      2000-5000ms to simulate slow API responses. UIs must show loading states, not blank content. Verify all 12 UIs
      have proper loading spinners/skeletons.
    status: todo

  - id: ph5-stress-smoke-tests
    content: >
      - [ ] [AGENT] P1. Playwright smoke tests for each stress scenario across all 12 UIs. Each test sets
      VITE_STRESS_SCENARIO, loads UI, verifies: (a) no JavaScript exceptions, (b) no blank/white screens, (c) error
      states are meaningful and human-readable, (d) UI remains interactive (not frozen). Add to existing smoke test
      suites.
    status: todo

  # ── Phase 6: HEALTH STATUS & PROCESS HYGIENE ─────────────────────────────────
  # Goal: Every UI and API reports verbose health status. No zombie processes.

  - id: ph6-health-status-verbosity
    content: >
      - [ ] [AGENT] P0. Audit and standardise health status display across all 12 UIs. Each UI header/footer must show:
      (a) data source status (connected/disconnected/stale per API), (b) last data received timestamp per data type, (c)
      expected vs actual data freshness (e.g. "positions: 2s ago, expected <5s" vs "positions: 5min ago, expected <5s —
      STALE"), (d) mock mode indicator (already exists via Plan 7, verify working). Implement in ui-kit as a shared
      HealthStatusBar component.
    status: todo

  - id: ph6-api-health-parity
    content: >
      - [ ] [AGENT] P1. Verify all 9+ APIs expose verbose health endpoints: (a) /health returns per-dependency status
      (database, cache, upstream APIs), (b) /readiness distinguishes ready vs healthy, (c) data_freshness field in
      health response (per Plan 7 p5-10). UIs consume and display this. Mock health endpoints return realistic status
      with some degraded dependencies.
    status: todo

  - id: ph6-zombie-process-detection
    content: >
      - [ ] [AGENT] P0. Audit dev-stop.sh for completeness: (a) all PIDs in /tmp/unified-dev-pids/ are killed on stop,
      (b) orphan node/vite processes are detected and killed (lsof on ports 5173-5183), (c) no zombie processes after
      repeated start/stop cycles. Add `dev-status.sh --check-zombies` flag. vitest.config.ts pool: "forks" (not threads)
      already prevents vitest zombies — verify in all 12 UIs.
    status: todo

  - id: ph6-resource-monitoring
    content: >
      - [ ] [AGENT] P2. Add resource monitoring to dev-status.sh: (a) memory usage per UI process, (b) CPU usage per UI
      process, (c) open file descriptors, (d) warning if any single UI exceeds 500MB RSS. Useful for identifying memory
      leaks during stress testing.
    status: todo

  # ── Phase 7: UX REORGANISATION ────────────────────────────────────────────────
  # Goal: Functionality is in the right place. No buried features. Logical grouping.
  # Config and manual trade entry are surfaced properly.

  - id: ph7-ux-audit
    content: >
      - [ ] [HUMAN+AGENT] P0. UX audit: walk through each UI as a trader. Flag: (a) functionality that should be in a
      different UI or tab, (b) features buried >2 clicks deep that should be surface-level, (c) tabs that should be
      split into separate UIs, (d) UIs that should be combined, (e) config control accessibility — is it easy to find
      and use? (f) manual trade entry accessibility. Document recommendations with justification.
    status: todo

  - id: ph7-config-ui-placement
    content: >
      - [ ] [AGENT] P1. Based on UX audit: ensure config management (venue config, strategy config, account config) is
      accessible from onboarding-ui AND linked from relevant UIs (e.g. strategy-ui links to strategy config,
      live-health-monitor-ui links to venue config). Add cross-UI navigation links where needed.
    status: todo

  - id: ph7-tab-reorganisation
    content: >
      - [ ] [AGENT] P1. Based on UX audit: reorganise tabs within UIs for better workflow. Examples to evaluate: (a)
      deployment-ui: should "Data Status" be its own tab or a section within "Deploy"? (b) live-health-monitor-ui:
      should manual trade entry be a top-level tab? (c) trading-analytics-ui: should P&L have its own tab separate from
      order book? Changes made in individual UIs but layout patterns shared via ui-kit.
    status: todo

  - id: ph7-cross-ui-navigation
    content: >
      - [ ] [AGENT] P2. Add cross-UI navigation: shared sidebar or top-nav component in ui-kit that shows all 12 UIs
      with status indicators. Trader can jump between UIs without remembering ports. Each UI includes this nav
      component. Links use localhost:<port> in dev mode.
    status: todo

  # ── Phase 8: TRADER SIGN-OFF ──────────────────────────────────────────────────
  # Goal: Human walks through every UI and confirms it works for a trading desk.

  - id: ph8-tat-checklist
    content: >
      - [ ] [AGENT] P0. Create trader acceptance test checklist in PM (scripts/dev/tat-checklist.md). Per UI: visual
      quality (pass/fail), data completeness (pass/fail), interactivity (pass/fail), stress resilience (pass/fail),
      health status (pass/fail). Summary scoring: all UIs must pass all categories.
    status: todo

  - id: ph8-human-walkthrough
    content: >
      - [ ] [HUMAN] P0. Trader acceptance walkthrough. Launch all UIs (launch-all-uis.sh + open-all-uis.sh). Walk
      through TAT checklist for each UI. Report failures. Agent fixes failures and improves test coverage so the same
      class of issue is caught automatically across all UIs in future.
    status: todo

  - id: ph8-feedback-loop
    content: >
      - [ ] [AGENT] P1. For every failure reported in human walkthrough: (a) fix the issue, (b) add a Playwright smoke
      test that would have caught it, (c) verify the same issue doesn't exist in the other 11 UIs, (d) if it does, fix
      all instances. This ensures the test suite grows from real trader feedback.
    status: todo

isProject: false
---

# UI Trader Acceptance Testing

## Context

The unified trading system has 12 UIs, 9+ APIs, and comprehensive mock infrastructure (VITE_MOCK_API client-side mocks,
CLOUD_MOCK_MODE API-side mocks, MockStateStore for stateful interactions). Existing plans (Plan 7:
UI/API/Alerting/Observability, Plan 9: Citadel-Grade Flow Validation) cover infrastructure wiring and testing
frameworks.

This plan covers the **human-facing quality layer**: does the system actually look right, work for a trader, display all
necessary data, handle stress gracefully, and have no visual/UX defects? It is a trader acceptance test (TAT), not a
technical test framework.

## Relationship to Existing Plans

- **Plan 7 (UI/API/Alerting/Observability)**: Provides createApiClient, settlement-api, config-api, mock data
  infrastructure, and smoke test baseline. This plan depends on Plan 7 P6.4 (smoke tests passing) as the starting
  baseline.
- **Plan 9 (Citadel-Grade Flow Validation)**: Provides 3-layer testing framework and scoring model. This plan extends it
  with stress scenarios, visual regression, and UX quality — which Plan 9 explicitly excludes from its scope.
- **Archived: ui_design_system_upgrade**: That plan covered component library uplift. This plan focuses on layout and
  visual fixes in the context of trader workflow, not design system architecture.

## Non-Overlap Contract

| Concern                 | This Plan (TAT)           | Plan 7 (Observability)    | Plan 9 (Flow Validation) |
| ----------------------- | ------------------------- | ------------------------- | ------------------------ |
| Visual quality & layout | YES                       | No                        | No                       |
| UI-API orphan detection | YES (bidirectional audit) | Partial (p5-13 data flow) | No                       |
| API mock statefulness   | Validation + realism      | No                        | MockStateStore creation  |
| Stress scenario data    | YES                       | No                        | No                       |
| Health status UI        | YES                       | data_freshness API-side   | No                       |
| Process hygiene         | YES                       | No                        | No                       |
| UX reorganisation       | YES                       | p5-11 branding only       | No                       |
| Trader sign-off (B6)    | YES                       | p6-5 UAT handoff          | No                       |

## UI Port Registry (from ui-api-mapping.json)

| UI                      | Port | API                   | API Port |
| ----------------------- | ---- | --------------------- | -------- |
| onboarding-ui           | 5173 | config-api            | 8005     |
| execution-analytics-ui  | 5174 | execution-results-api | 8006     |
| strategy-ui             | 5175 | execution-results-api | 8006     |
| settlement-ui           | 5176 | trading-analytics-api | 8012     |
| live-health-monitor-ui  | 5177 | execution-results-api | 8006     |
| logs-dashboard-ui       | 5178 | batch-audit-api       | 8013     |
| ml-training-ui          | 5179 | ml-training-api       | 8011     |
| trading-analytics-ui    | 5180 | trading-analytics-api | 8012     |
| batch-audit-ui          | 5181 | batch-audit-api       | 8013     |
| client-reporting-ui     | 5182 | client-reporting-api  | 8014     |
| deployment-ui           | 5183 | deployment-api        | 8004     |
| ml-inference (API only) | —    | ml-inference-api      | 8015     |
| market-data (API only)  | —    | market-data-api       | 8016     |

## Best Practice: Cursor for Visual Work

Visual audit phases (ph1, ph7, ph8) are best done in Cursor, which can open browsers directly. Claude Code sessions
handle script creation, mock data validation, and automated test writing. The launch-all and open-all scripts work in
both environments.
