# Tier 0 comprehensive audit — orchestration runbook & master prompt

**Companion SSOT:** [`END_TO_END_STATIC_TIER_ZERO_TESTING.md`](./END_TO_END_STATIC_TIER_ZERO_TESTING.md) (playbook, matrices, pillars, §7 gates).
**Strategy / mock SSOT:** [`MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md`](./MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md), [`MOCK_STATIC_EVALUATION_SPEC.md`](./MOCK_STATIC_EVALUATION_SPEC.md).

**Dated findings artifact (create per run):** `docs/audits/TIER_ZERO_AUDIT_YYYY-MM-DD.md` (gitignored optional: keep in repo for history, or paste into §9 Audit log in the companion doc).

---

## 1. Master prompt (give this to the lead auditor or coordinator agent)

Copy everything inside the fence below.

```text
You are the lead for a Tier 0 (static mock) UI audit of unified-trading-system-ui.

GOAL
- Prove capability: every institutional workflow we claim must be *exercisable* in mock (tiny data OK). If a surface exists but cannot perform its job (dead CTA, static placeholder, unhandled mock route, inconsistent state), it is a finding — no exceptions.
- Do not assume gaps: run automated gates first; document failures verbatim.
- Produce a dated audit: A–F per category (below), missing items, gaps vs “allocator/CIO pitch” bar (see END_TO_END_STATIC_TIER_ZERO_TESTING.md §1b lattice + §1 P0 table + BlackRock/Citadel honest bar), and a concrete implementation plan mapped to this repo (and sibling libs when relevant).

TOKEN / ORCHESTRATION (mandatory)
- Split independent work across sub-agents or parallel human tracks. One narrow scope per agent; max ~400 tokens back per sub-agent summary to the coordinator.
- Before spawning sub-agents, inject workspace rules: read unified-trading-pm/cursor-configs/SUB_AGENT_MANDATORY_RULES.md (or paste key lines): WORKSPACE_ROOT, uv/quickmerge/basedpyright, no pip install, Tier 0 port 3100.
- Parallelize by route track (A–E) and by browser when useful; merge only structured findings (tables/JSON), not raw logs.

TOOLS
1) Playwright (CLI + static config) — ground truth for registry/coverage/smoke/behavior specs.
2) MCP browser (e.g. Playwright MCP) — exploratory passes, console/network, screenshots for the audit appendix.
3) VS Code / Cursor Playwright extension — optional for debugging a single failing spec; not a substitute for CI-equivalent CLI runs.

ENVIRONMENT
cd unified-trading-system-ui
bash scripts/dev-tiers.sh --tier 0
# Confirm UI at http://localhost:3100 (SSOT: playwright.static.config.ts)

PHASE 0 — AUTOMATED (run in order; capture exit codes + last 50 lines of output)
A) Registry-only (no dev server):
   PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 npx playwright test e2e/tier0-app-route-coverage.spec.ts --config playwright.static.config.ts
B) Full static suite (requires 3100):
   npx playwright test --config playwright.static.config.ts
C) Repo QG (TypeScript/UI):
   bash scripts/quality-gates.sh

PHASE 1 — MANUAL / AGENT EXPLORATION (five tracks, can parallelize)
Use END_TO_END_STATIC_TIER_ZERO_TESTING.md §4 tracks A–E. Per route: load, primary CTA, note console errors, unhandled /api/*, “Coming Soon”, empty data without explanation, persona/permission mismatch.

PHASE 2 — CROSS-CUTTING
- Footer/header nav: no 404 on critical links.
- Personas: lib/auth/personas.ts — repeat key flows as client vs admin (SoD).
- Reset Demo: lib/reset-demo.ts — after mutations, reset restores defaults (document gaps).
- Strategy registry vs Codex: lib/strategy-registry.ts vs unified-trading-codex/09-strategy (alignment).

DELIVERABLE
Create docs/audits/TIER_ZERO_AUDIT_YYYY-MM-DD.md containing:
1) Metadata: date, commit SHA, branch, who ran, browsers used.
2) Automated gate results (pass/fail + fix pointers).
3) Scorecard: every category in the runbook §4 table — letter A–F, 1–3 line rationale, blocking vs non-blocking.
4) Exhaustive gaps list (no exceptions): missing capability, partial mock, UI-only static, test debt.
5) Implementation plan: ordered backlog with file/repo hints (e2e/*.spec.ts, lib/api/* mock handlers, app/** pages, unified-* libraries).

Be harsh: “good enough for a hackathon” is an F for institutional categories. Mock data volume is irrelevant; missing actions or state machines are failures.
```

---

## 2. How the automated pieces fit together

| Artifact | Role |
| --- | --- |
| `e2e/tier0-route-registry.ts` | **SSOT list** of URLs Tier 0 smoke must hit. Arrays (`PUBLIC_PAGES`, `DATA_PAGES`, …) roll up to `ALL_TIER0_ROUTES` and `TIER0_REGISTRY_PATHS`. `TIER0_DYNAMIC_SAMPLE_PATHS` = concrete URLs for dynamic segments (e.g. strategy id sample). |
| `e2e/tier0-app-route-coverage.spec.ts` | **Fails** if a **static-segment** `page.tsx` under `app/` is **not** in the registry, or if the registry lists a static path that **does not** exist (except dynamic samples). No browser needed for logic-only checks if you skip global setup (see below). |
| `e2e/static-smoke.spec.ts` | Loads each registry URL (and auth gating); catches compile/runtime/unhandled-route noise at scale. |
| `e2e/tier0-behavior-audit.spec.ts` | **Small** set of **interaction** assertions (approve access request, acknowledge alert + toast, reconciliation/backtests/manage-request heuristics). **Expand** this file as more capabilities become non-negotiable. |
| `e2e/warmup.setup.ts` | Optional Turbopack warm-up before parallel smoke. Set `PLAYWRIGHT_SKIP_GLOBAL_SETUP=1` to skip when no server. |
| `playwright.static.config.ts` | `baseURL` **3100**, `testMatch` includes the three spec files above. |

### Commands cheat sheet

```bash
cd unified-trading-system-ui

# Tier 0 dev server (required for full Playwright static suite)
bash scripts/dev-tiers.sh --tier 0

# 1) Fast: filesystem/registry alignment only (no server)
PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 npx playwright test e2e/tier0-app-route-coverage.spec.ts --config playwright.static.config.ts

# 2) Full automated Tier 0 gate (smoke + coverage + behavior)
npx playwright test --config playwright.static.config.ts

# 3) Single spec debugging
npx playwright test e2e/tier0-behavior-audit.spec.ts --config playwright.static.config.ts --project chromium

# 4) UI repo quality gates
bash scripts/quality-gates.sh
```

### Adding a new static page

1. Add `page.tsx` under `app/` (static segments only, or add a **sample** URL to `TIER0_DYNAMIC_SAMPLE_PATHS` for dynamic routes).
2. Add `{ path, name }` to the appropriate array in `e2e/tier0-route-registry.ts` (must appear in `ALL_TIER0_ROUTES`).
3. Run coverage spec → run full static suite.

**Do not** put `*/` inside block comments in e2e TS files in patterns like `**/` (breaks JS comment parsing).

---

## 3. Multi-agent + browser split (token-efficient)

| Agent / track | Suggested browser | Scope | MCP / Playwright use |
| --- | --- | --- | --- |
| **Coordinator** | n/a | Phases, merges scorecard, writes `docs/audits/TIER_ZERO_AUDIT_*.md` | Runs CLI Playwright once for full gate; collects logs |
| **Track A** | Chromium | Public & marketing (§4 A) | MCP snapshot + console; spot-check Safari if policy requires |
| **Track B** | Chromium | Trading & strategies | Same; **Firefox** optional for layout/CSS quirks |
| **Track C** | Chromium | Research & ML | Same |
| **Track D** | Chromium | Execution, observe, reports | Same |
| **Track E** | Chromium | Manage, ops, admin | Same |
| **Tooling agent** | n/a | Registry/coverage spec failures, fix `tier0-route-registry.ts` | Read-only codebase search + propose diffs |

**Rules of thumb**

- **Playwright CLI** = what CI runs; sub-agents doing “I clicked around” must still reconcile with CLI results.
- **MCP browser** = evidence (screenshots, console messages) for the dated audit appendix.
- **Parallel**: tracks A–E are independent; do not serialize unless sharing one machine with one CPU budget.
- **Serial** within `tier0-behavior-audit.spec.ts` is already configured — do not parallelize that file across workers if you fork it.

---

## 4. A–F scorecard categories (exhaustive baseline)

Score **A** = fully exercisable in Tier 0 mock with state mutation + consistent cross-surface; tests or airtight manual script. **F** = missing or misleading.

Use every row; add sub-bullets in the dated audit if needed.

| # | Category | Primary references (doc § / repo) |
| --- | --- | --- |
| 1 | Route registry & static smoke | §7, `tier0-route-registry.ts`, `tier0-app-route-coverage.spec.ts`, `static-smoke.spec.ts` |
| 2 | Automated behavior audit coverage | `tier0-behavior-audit.spec.ts`, §1 P0 gap list |
| 3 | Research & signal pillar | §1b pillars, research routes |
| 4 | Book & risk (limits, stress placeholders) | §1b lattice, observe/risk |
| 5 | Execution & TCA | execution routes, handbook |
| 6 | Data, entitlements, coverage | data routes, marketing/service pages |
| 7 | Org / book / fund scope model | global scope store, filters |
| 8 | Personas, SoD, permissions | `lib/auth/personas.ts`, auth-api alignment |
| 9 | Provisioning & access requests | `mock-provisioning-state`, admin requests |
| 10 | Reporting & data subscriptions | manage + admin queues (§1b) |
| 11 | User / client detail SSOT | single view: services, reporting, balances |
| 12 | Strategies list/detail/registry | `lib/strategy-registry.ts`, Codex 09-strategy |
| 13 | Per–strategy-class book trade | §1 P0 #4, handbook matrix |
| 14 | Venues & execution config | execution + registry |
| 15 | Positions & PnL narrative | trading PnL/positions |
| 16 | Orders & instruction lifecycle | §1b P3, terminal |
| 17 | Pre-trade / compliance / limits | §1b lattice |
| 18 | Post-trade / confirm / break / settlement | §1b lattice, reports |
| 19 | Reconciliation internal vs external | §1 P0 #5, reports/reconciliation |
| 20 | Alerts (list, ack, leave active queue) | §1 P0 #6, alerts pages |
| 21 | Audit trail & correlation_id | §1b P5 |
| 22 | Market data entitlement / delayed / missing | §1b P6 |
| 23 | Reference data / symbology | §1b lattice |
| 24 | ML ops (version, drift, deploy narrative) | ML routes |
| 25 | Sports / predictions / DeFi lanes | trading sub-routes |
| 26 | Client IM onboarding & documents | §1 P0 #7, §1b |
| 27 | Reset Demo completeness | `lib/reset-demo.ts`, §5a |
| 28 | Cross-surface consistency | same user/entitlement everywhere |
| 29 | Nav integrity (shell links) | layout/footer/header |
| 30 | Mock API completeness (unhandled routes) | client mock handler, console |
| 31 | Performance / perceived quality (blank shells, long spinners) | subjective but mandatory note |
| 32 | Critical path accessibility | roles/labels for audit CTAs |
| 33 | BlackRock/Citadel **layer-2** narrative extras | §1 “honest bar” extra table (mandate, liquidity, ISDAs, etc.) |

---

## 5. Dated audit file template

Save as `docs/audits/TIER_ZERO_AUDIT_YYYY-MM-DD.md`.

```markdown
# Tier 0 comprehensive audit — YYYY-MM-DD

| Field | Value |
| --- | --- |
| Date | YYYY-MM-DD |
| Repo | unified-trading-system-ui |
| Commit | `<sha>` |
| Branch | `<name>` |
| Auditor(s) | `<names or agent run id>` |
| Browsers | Chromium (+ optional Firefox/WebKit) |
| Tier 0 URL | http://localhost:3100 |

## Executive summary

- Overall posture: `<one paragraph>`
- Automated gates: `<pass|fail> — tier0-app-route-coverage, full static config, quality-gates.sh`
- Top 5 blockers: `<list>`

## Automated gate log

(paste command + exit code + relevant stderr tail)

## Scorecard (A–F)

| # | Category | Grade | Notes |
| --- | --- | --- | --- |
| 1 | … | | |

## Gaps — no exceptions

| ID | Area | Gap | Severity (P0–P3) | Evidence (route, screenshot ref, spec name) |

## Partial / “looks OK” that still fail institutional bar

| Item | Why not A-tier |

## Implementation plan (ordered)

1. `<title>` — Owner suggestion: `<repo/path>` — Depends on: `<>` — Estimate: `<S/M/L>`
2. …

## Appendix — MCP / manual notes

- Track A: …
- Track B: …
```

---

## 6. Concrete implementation plan guidelines

When writing the plan section:

1. **Prefer** extending `e2e/tier0-behavior-audit.spec.ts` for new non-negotiable interactions before adding many one-off specs.
2. **Add** `e2e/tier0-journeys/*.spec.ts` for full P0 flows (§1 table).
3. **Mock** changes live beside handlers under `lib/api/` / client mock install — align with `reset-demo.ts`.
4. **Libraries**: shared contracts live in `unified-api-contracts`, `unified-market-interface`, `unified-trade-execution-interface`, etc.; do not duplicate domain enums in UI-only files (see workspace UCI/UAC rules).
5. **PM / Codex**: cross-cutting standards → `unified-trading-pm/plans/`, `unified-trading-codex`; UI-only polish stays in this repo.

---

## 7. “Write as you go” (anti–context-loss)

Maintain a scratch file or the top of the dated audit with:

- [ ] Phase 0A coverage result
- [ ] Phase 0B full static result
- [ ] Phase 0C QG result
- [ ] Tracks A–E started/finished
- [ ] Persona matrix tested (which persona × which routes)
- [ ] Reset Demo tried Y/N
- [ ] Unhandled API routes seen (copy exact path)
- [ ] Screenshots directory path (if any)

---

## 8. Link back to the living playbook

After each audit, add one row to [`END_TO_END_STATIC_TIER_ZERO_TESTING.md`](./END_TO_END_STATIC_TIER_ZERO_TESTING.md) **§9 Audit log** pointing to `docs/audits/TIER_ZERO_AUDIT_YYYY-MM-DD.md` (or paste a one-line summary).
