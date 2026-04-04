# Tier 0 comprehensive audit — 2026-03-23

| Field      | Value                                       |
| ---------- | ------------------------------------------- |
| Date       | 2026-03-23                                  |
| Repo       | unified-trading-system-ui                   |
| Commit     | `faeff3d`                                   |
| Branch     | `live-defi-rollout`                         |
| Auditor(s) | Cursor agent (claude-4.6-opus-max-thinking) |
| Browsers   | Chromium (Playwright MCP + CLI)             |
| Tier 0 URL | http://localhost:3100                       |

## Executive summary

- **Overall posture:** The platform has excellent route coverage (111/113 Playwright tests pass) and a well-structured service layout with lifecycle-based navigation. However, the demo is **not institutional-grade** — critical interactive workflows are broken (admin approval flow), multiple pages show zero mock data, 10+ API routes are unhandled, 3+ pages crash with TypeErrors, and the footer links to a 404. The difference between "every URL loads" and "every workflow is exercisable" is the gap between current state and Citadel bar.
- **Automated gates:** `tier0-app-route-coverage` **PASS** (2/2). Full static suite **FAIL** (111 passed, 2 failed, 4 did not run). `quality-gates.sh` not run this pass.
- **Top 5 blockers:**
  1. Admin access request Approve button not found — P0 provisioning journey broken
  2. `/services/regulatory` has Coming Soon / stub content — fails static smoke
  3. Trading overview "Loading dashboard..." spinner never resolves — primary command center unusable
  4. All trading Quick View stats are zero (0 positions, $0 PnL, 0 alerts, 0 services) — no sample data
  5. 10+ unhandled mock API routes produce console warnings on every page load

## Automated gate log

### Phase 0A: Registry coverage (no server)

```
$ PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 npx playwright test e2e/tier0-app-route-coverage.spec.ts --config playwright.static.config.ts
  ✓ every static app page route is in tier0-route-registry (15ms)
  ✓ tier0-route-registry has no unexpected static-only paths (except known dynamic samples) (15ms)
  2 passed (2.1s)
EXIT CODE: 0
```

### Phase 0B: Full static suite (server on 3100)

```
$ npx playwright test --config playwright.static.config.ts
  111 passed (4.5m)
  2 failed
  4 did not run

FAILURES:
1. [chromium] static-smoke.spec.ts — Marketing Regulatory (/services/regulatory) renders without crash
   → Page has stub/placeholder content (Coming Soon / TODO text detected)
   → Line 127: expect(stubTexts + todoTexts).toBe(0)

2. [chromium] tier0-behavior-audit.spec.ts — admin access requests: pending row has Approve and approve mutates state
   → getByRole('button', { name: /Approve/i }).first() not found within 15s
   → P0 admin provisioning approval flow is broken
EXIT CODE: 1
```

## Scorecard (A–F)

| #   | Category                                    | Grade | Notes                                                                                                                                                                                                                                  |
| --- | ------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Route registry & static smoke               | B     | 111/113 pass. Registry ↔ filesystem audit green. Two failures: regulatory stub content, approval button missing.                                                                                                                       |
| 2   | Automated behavior audit coverage           | D     | Only 2 behaviour tests exist (approve + alert ack). Approve test FAILS. Alert ack test status unknown (likely in the 4 "did not run"). P0 journeys 1–7 have zero automation.                                                           |
| 3   | Research & signal pillar                    | C     | All 22 research/ML routes load. ML validation and ML monitoring timeout (complex pages). Strategy results shows empty state. No backtest run→results journey exercisable.                                                              |
| 4   | Book & risk (limits, stress placeholders)   | D     | Risk page loads. Zero limit objects, zero alerts, zero stress scenarios shown. All stats zero. No actionable risk workflow in mock.                                                                                                    |
| 5   | Execution & TCA                             | D     | 7 execution routes load. TCA stuck on "Loading". No benchmark field, no venue breakdown exercisable. Execution overview minimal.                                                                                                       |
| 6   | Data, entitlements, coverage                | C     | 7 data routes load. Data markets PnL stuck on "Loading". Coverage and venues pages present but no entitlement flags visible.                                                                                                           |
| 7   | Org / book / fund scope model               | D     | Scope filters exist (All Orgs / All Clients / All Strategies) but selecting them has no visible effect. No book/fund hierarchy exercisable.                                                                                            |
| 8   | Personas, SoD, permissions                  | C     | 6 personas defined. Login tabs (Internal/External) work. SoD never tested — no journey asserts client-cannot-do-X that admin-can.                                                                                                      |
| 9   | Provisioning & access requests              | F     | **Approve button not found in tests.** Admin users/requests page loads but approval flow is broken. P0 journey #1 completely non-functional.                                                                                           |
| 10  | Reporting & data subscriptions              | F     | No subscription object, no admin reporting queue, no client reporting package request flow. Reports pages are static shells.                                                                                                           |
| 11  | User / client detail SSOT                   | F     | No single-view user detail page showing entitlements + services + reporting + balances. Admin user pages exist but are disconnected stubs.                                                                                             |
| 12  | Strategies list/detail/registry             | B     | Strategy list (34K content) and grid load well. Strategy detail (dynamic sample) loads. Registry alignment with Codex not verified this pass.                                                                                          |
| 13  | Per–strategy-class book trade               | F     | Book Trade page exists but no per-strategy-class trade booking matrix. Cannot book a delta-one, options, sports, DeFi, or prediction trade.                                                                                            |
| 14  | Venues & execution config                   | D     | Execution venues page loads. Dashboard shows "0 Venues" despite homepage claiming 128. No venue add/configure flow.                                                                                                                    |
| 15  | Positions & PnL narrative                   | D     | Positions and PnL pages load. All data is zero. No sample positions, no PnL bridge, no realised/unrealised breakdown visible with data.                                                                                                |
| 16  | Orders & instruction lifecycle              | F     | Orders page shows empty state ("No orders" equivalent). No order lifecycle (new→working→partial→filled). No amend/cancel. Instructions page is shell.                                                                                  |
| 17  | Pre-trade / compliance / limits             | F     | Compliance page loads with content. No restricted list, no limit preview, no compliance explain string. Zero pre-trade workflow.                                                                                                       |
| 18  | Post-trade / confirm / break / settlement   | F     | Settlement report page loads as shell. No confirm/affirm stub, no break workflow, no settlement status.                                                                                                                                |
| 19  | Reconciliation internal vs external         | F     | Reconciliation page loads (22K content). No verified diff/resolve flow. No internal vs external position comparison exercisable.                                                                                                       |
| 20  | Alerts (list, ack, leave active queue)      | D     | Alerts pages load (trading/alerts and observe/alerts). Alert ack test status uncertain. All alert counts zero — no sample alerts to acknowledge.                                                                                       |
| 21  | Audit trail & correlation_id                | F     | No audit append stream. No correlation_id visible. No export/attest placeholder.                                                                                                                                                       |
| 22  | Market data entitlement / delayed / missing | F     | Data missing page exists. No entitlement flags per venue. No delayed vs live badge. No missing snapshot behaviour.                                                                                                                     |
| 23  | Reference data / symbology                  | F     | No instrument master identity page. No symbology map. No corporate action placeholder.                                                                                                                                                 |
| 24  | ML ops (version, drift, deploy narrative)   | C     | 10 ML sub-pages load. Deploy page has 24K content. ML monitoring times out. No model version/drift/rollback exercise flow.                                                                                                             |
| 25  | Sports / predictions / DeFi lanes           | D     | Three dedicated pages load (sports, predictions, defi). No event risk cap, no grading/resolution queue, no wallet policy. Static shells.                                                                                               |
| 26  | Client IM onboarding & documents            | F     | No onboarding wizard. No document upload. No tier/product scope selection. No admin review queue. Entirely missing.                                                                                                                    |
| 27  | Reset Demo completeness                     | C     | Reset Demo button present. `resetDemo()` clears stores + provisioning + localStorage. Does NOT cover strategy/venue creates or new mock entities not yet wired.                                                                        |
| 28  | Cross-surface consistency                   | D     | Same user everywhere after login. Entitlements not enforced across surfaces — no visible difference between client-data-only and admin on most pages.                                                                                  |
| 29  | Nav integrity (shell links)                 | D     | **`/compliance` in footer returns 404** (confirmed console error). All other nav links work. Homepage ↔ dashboard lifecycle stage count inconsistency (7 vs 8).                                                                        |
| 30  | Mock API completeness (unhandled routes)    | D     | **10+ unhandled API routes** in console: `/api/auth/health`, `/api/reporting/...`, `/api/execution/...`, `/api/deployment/...`, `/api/config/...`, `/api/analytics/...`, `/api/audit/health`, `/api/ml/health`, `/api/market-data/...` |
| 31  | Performance / perceived quality             | C     | Most pages load in 1–2s. Trading terminal, ML validation, ML monitoring, reports/executive **timeout** (>12s). Trading overview main area stuck on "Loading dashboard...".                                                             |
| 32  | Critical path accessibility                 | D     | No `data-testid` on most primary CTAs. No ARIA roles for approval/ack buttons beyond basic HTML semantics. Would fail screen reader audit.                                                                                             |
| 33  | BlackRock/Citadel layer-2 narrative extras  | F     | No mandate/IPS, no liquidity/gates, no ISDA/CSA, no best-ex committee pack, no allocator workflow, no 13F/Form PF, no ODD checklist, no GIPS, no incident/BCP.                                                                         |

**Grade distribution:** A=0, B=2, C=6, D=10, F=15. **No category achieves A-tier.**

## Gaps — no exceptions

| ID   | Area                       | Gap                                                                                                                                                   | Severity | Evidence                                                    |
| ---- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| G-01 | Admin provisioning         | Approve button missing on admin/users/requests — P0 journey #1 broken                                                                                 | P0       | `tier0-behavior-audit.spec.ts` line 44 failure              |
| G-02 | Regulatory service page    | `/services/regulatory` has "Coming Soon" stub content                                                                                                 | P0       | `static-smoke.spec.ts` line 127 failure                     |
| G-03 | Trading overview           | Main dashboard chart area stuck on "Loading dashboard..." — never resolves                                                                            | P0       | Browser snapshot: `e479` "Loading dashboard..."             |
| G-04 | Mock data: zero everywhere | Trading Quick View: 0 positions, $0 exposure, $0 PnL, 0 alerts, 0 services, $0 balance                                                                | P0       | Browser snapshot: all stat widgets show 0                   |
| G-05 | Footer 404                 | `/compliance` link in every footer returns 404 (page does not exist)                                                                                  | P1       | Console error: "404 (Not Found)"                            |
| G-06 | Venue count inconsistency  | Homepage hero: "128 Venues". Dashboard: "0 Venues". Data Provision card: "0 Venues"                                                                   | P1       | Browser snapshot comparison                                 |
| G-07 | Lifecycle stage count      | Homepage shows 7 lifecycle stages. Dashboard nav shows 8 (adds "Execute")                                                                             | P1       | Browser snapshot comparison                                 |
| G-08 | Unhandled API routes (10+) | Mock handler doesn't cover: auth/health, reporting, execution, deployment, config, analytics, audit, ml, market-data                                  | P1       | Console warnings on page loads                              |
| G-09 | Page timeouts (4 pages)    | `/services/trading/terminal`, `/services/research/ml/validation`, `/services/research/ml/monitoring`, `/services/reports/executive` timeout after 12s | P1       | Playwright run_code timeout errors                          |
| G-10 | TCA stuck loading          | `/services/execution/tca` shows "Loading" that never resolves                                                                                         | P1       | Scan data: `loading: true`                                  |
| G-11 | Data Markets PnL stuck     | `/services/data/markets/pnl` shows "Loading" that never resolves                                                                                      | P1       | Scan data: `loading: true`                                  |
| G-12 | ErrorBoundary crashes      | `TypeError: Cannot read properties of` triggers ErrorBoundary on 3+ pages during navigation                                                           | P1       | Console: 6 errors across scan                               |
| G-13 | Order lifecycle missing    | No order state machine (new→working→partial→filled), no amend, no cancel, no reject with reason                                                       | P2       | Manual audit: orders page shows empty state only            |
| G-14 | Book trade not exercisable | Book Trade page exists but no per-strategy-class trade form. Cannot submit a mock trade.                                                              | P2       | Browser: `/services/trading/book` is a shell                |
| G-15 | Reconciliation not wired   | No internal vs external position diff. No resolve action.                                                                                             | P2       | Browser: `/services/reports/reconciliation` is display-only |
| G-16 | Strategy results empty     | `/services/research/strategy/results` shows empty state — no sample backtest results                                                                  | P2       | Scan data: `empty: true`                                    |
| G-17 | Client onboarding missing  | No onboarding wizard, no document uploads, no tier selection, no admin review queue                                                                   | P2       | No route for onboarding exists                              |
| G-18 | Reporting subscriptions    | No subscription request/approve flow. No client reporting package management.                                                                         | P2       | No route or mock entity exists                              |
| G-19 | User detail SSOT missing   | No consolidated user view showing entitlements + services + balances + reporting                                                                      | P2       | Admin user pages are disconnected stubs                     |
| G-20 | Audit trail missing        | No append-only event stream. No correlation_id visible anywhere.                                                                                      | P2       | No audit route or component exists                          |
| G-21 | Pre-trade compliance       | No restricted list, no limit preview, no compliance explain                                                                                           | P2       | Compliance page is generic content                          |
| G-22 | Post-trade settlement      | No confirm/affirm, no break workflow, no settlement status                                                                                            | P2       | Settlement report page is a shell                           |
| G-23 | Market data entitlements   | No per-venue entitlement flags. No delayed vs live badge.                                                                                             | P3       | Data pages show no entitlement metadata                     |
| G-24 | Reference data / symbology | No instrument master page. No symbology map.                                                                                                          | P3       | No dedicated route exists                                   |
| G-25 | SoD never tested           | No test or demo flow where client-cannot but admin-can (or vice versa)                                                                                | P2       | Personas exist but permission enforcement not exercised     |
| G-26 | Scope model inert          | Org/Client/Strategy scope filters present but changing them has no visible effect                                                                     | P2       | Browser: filter buttons exist but don't filter content      |
| G-27 | Unlabelled filter buttons  | Trading overview has 9 filter buttons with no visible text labels                                                                                     | P2       | Browser snapshot: `e461`–`e469` are empty buttons           |
| G-28 | Instruments count zero     | Dashboard shows "0+ Instruments" — should show mock instrument count                                                                                  | P2       | Browser snapshot                                            |

## Partial / "looks OK" that still fail institutional bar

| Item                              | Why not A-tier                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Strategy list/grid                | Lists load and show data from registry, but no "Create New Strategy" CTA that persists in mock state + survives navigation     |
| ML pages (10 routes)              | All load, good sub-nav, but monitoring and validation timeout. No model version/drift/rollback exercise flow.                  |
| Observe alerts page               | Page loads with content but alert counts are all zero. No sample alerts to acknowledge, so the ack flow can't be demonstrated. |
| Research overview / quant         | Pages load with content but no exercisable Research→Signal→Backtest→Results pipeline. Each page is an isolated shell.          |
| Execution algos                   | Page loads, algos listed, but no "configure algo" or "run algo" CTA that mutates state.                                        |
| Reports overview                  | Page loads with report categories but no "generate report" or "schedule report" action. Static display only.                   |
| Manage clients/mandates/fees      | Pages load (21–24K content) but no client create/edit, mandate configure, or fee schedule action.                              |
| Admin pages                       | All load with appropriate content but admin user management lacks working approval flow (G-01).                                |
| IR pages (board presentation, DR) | New pages exist and load. Content is present but very thin — single-page shells without drill-down.                            |
| Engagement models page            | 29K content — richest page. Good as marketing. But no "sign up for this model" CTA that does anything.                         |

## Implementation plan (ordered)

1. **Fix admin Approve button** — Owner: `app/(ops)/admin/users/requests/page.tsx` + `lib/api/mock-provisioning-state.ts` — Depends on: mock-handler intercepting `/api/admin/users/requests` — Estimate: **S**
2. **Fix `/services/regulatory` stub content** — Owner: `app/(public)/services/regulatory/page.tsx` — Depends on: none — Estimate: **S**
3. **Add sample mock data to trading** — Owner: `lib/trading-data.ts`, mock handlers for positions/orders/alerts — Depends on: `lib/api/mock-handler.ts` routes — Estimate: **M**
4. **Fix Loading spinners (trading overview, TCA, data PnL)** — Owner: `app/(platform)/services/trading/overview/`, execution/tca, data/markets/pnl pages — Depends on: mock handler returning data for dashboard endpoints — Estimate: **M**
5. **Fix `/compliance` 404** — Owner: add `app/(public)/compliance/page.tsx` or redirect to `/services/manage/compliance` — Depends on: none — Estimate: **S**
6. **Resolve venue count inconsistency** — Owner: `app/(platform)/dashboard/page.tsx` + landing page — Depends on: venue registry data source alignment — Estimate: **S**
7. **Add mock API handlers for 10+ unhandled routes** — Owner: `lib/api/mock-handler.ts` — Depends on: knowing return shapes for auth/health, reporting, execution, deployment, config, analytics, audit, ml, market-data — Estimate: **M**
8. **Fix ErrorBoundary crashes** — Owner: pages that trigger TypeError during navigation — Depends on: identifying which pages crash (data/markets/pnl suspected) — Estimate: **M**
9. **Fix page timeouts (terminal, ML validation, ML monitoring, reports/executive)** — Owner: respective page.tsx files — Depends on: profiling render time, likely missing mock data causing infinite retries — Estimate: **M**
10. **Wire Book Trade per strategy class** — Owner: `app/(platform)/services/trading/book/page.tsx` + `lib/strategy-registry.ts` — Depends on: mock order handler + per-class validators — Estimate: **L**
11. **Order lifecycle state machine** — Owner: `app/(platform)/services/trading/orders/page.tsx` + mock order store — Depends on: order entity definition in mock — Estimate: **L**
12. **Reconciliation close-loop** — Owner: `app/(platform)/services/reports/reconciliation/page.tsx` + mock position diff — Depends on: internal vs external position mock stores — Estimate: **L**
13. **Client onboarding (P7)** — Owner: new pages under manage + admin — Depends on: `onboarding_application` + `document_artifact` mock entities — Estimate: **L**
14. **Reporting / data subscriptions** — Owner: new mock entity + admin queue page — Depends on: subscription entity schema — Estimate: **L**
15. **User detail SSOT page** — Owner: admin user detail route — Depends on: consolidated mock user view model — Estimate: **M**
16. **Align lifecycle stages (7 vs 8)** — Owner: landing page + dashboard nav — Depends on: product decision on whether Execute is separate from Run — Estimate: **S**
17. **Label filter buttons on trading overview** — Owner: trading overview component — Depends on: asset class enum — Estimate: **S**
18. **SoD journey test** — Owner: `e2e/tier0-behavior-audit.spec.ts` — Depends on: working permission enforcement in mock — Estimate: **M**

## Appendix — MCP / manual notes

### Track A: Public & marketing

- Homepage: excellent content (lifecycle matrix, venue badges, service cards, CTA). **Venue counts inconsistent** (128 in hero, 0 in cards).
- Login: Internal/External tabs, persona cards functional. Auto-login on tab click is aggressive but works.
- Contact, Docs, Demo, Privacy, Terms, Signup: all load with content. No form submission in mock (expected for T0).
- Engagement models: 29K content, richest public page.
- **`/compliance` footer link: 404.**

### Track B: Trading & strategies

- 15 trading sub-routes. Terminal times out. All others load (22–34K).
- Strategies list: 34K content, most populated trading page.
- Strategy grid, detail (dynamic sample): load well.
- Options, Sports, Predictions, DeFi, Bundles: static shells with content but no trade action.
- **All stats zero. No sample positions, orders, alerts, or fills.**

### Track C: Research & ML

- 22 research routes. 20 load, 2 timeout (ML validation, ML monitoring).
- Strategy results: empty state.
- ML experiment detail (dynamic): loads.
- No exercisable backtest→results flow.

### Track D: Execution, observe, reports

- Execution: 7 routes, all load. TCA stuck on Loading.
- Observe: 5 routes, all load well. News page richest (25K).
- Reports: 5 routes, executive times out, others load. Reconciliation is display-only.

### Track E: Manage, ops, admin

- Manage: 6 routes, all load. Compliance page 24K content.
- Admin: 7 routes, all load. **Requests page lacks Approve button** (confirmed by Playwright test failure).
- Ops: 10 routes (config, devops, internal, ops/jobs, ops/services), all load.
- Settings, investor-relations, IR sub-pages: all load as shells.

### Console errors observed

- `TypeError: Cannot read properties of` — triggers ErrorBoundary on 3+ page loads
- `[mock] Unhandled API route: /api/auth/health` (+ 9 more unhandled routes)
- `404 (Not Found)` on `/compliance`
- No critical JS errors on public pages (homepage, login clean)

### Personas tested

- Admin: used for all authenticated page scans
- Client personas visible on login but **not tested** for entitlement enforcement
- Investor persona visible but IR pages not tested with this persona specifically

### Reset Demo

- Button present in footer. `resetDemo()` implementation covers stores + provisioning + localStorage + React Query.
- **Not tested** this audit pass (deferred because approval flow is broken — nothing to reset).
