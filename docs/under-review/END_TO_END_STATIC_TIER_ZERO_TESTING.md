# End-to-end static Tier 0 testing — repeatable playbook

**Status:** Living document. Update the **Audit log** section after each full pass.

**Related:** [`TIER_ZERO_COMPREHENSIVE_AUDIT_RUNBOOK.md`](./TIER_ZERO_COMPREHENSIVE_AUDIT_RUNBOOK.md) (master audit prompt, A–F scorecard, multi-agent/MCP/Playwright) · [`MOCK_STATIC_EVALUATION_SPEC.md`](./MOCK_STATIC_EVALUATION_SPEC.md) · [`MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md`](./MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md) · PM [`system-tiers.md`](../../unified-trading-pm/plans/active/end-to-end-testing/system-tiers.md) · Codex [`TIER_ZERO_UI_DEMO_AND_PARITY.md`](../../unified-trading-codex/09-strategy/TIER_ZERO_UI_DEMO_AND_PARITY.md)

---

## 1. What Tier 0 is (and is not)

| Tier 0 (this doc)                                                                                                             | Out of scope for “static mock only”                                         |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Next.js UI + `NEXT_PUBLIC_MOCK_API=true` + client `installMockHandler()` intercepting `/api/*`                                | Real venue WebSockets, full order books, live auth IdP                      |
| In-browser fixtures: `lib/*-mock-data.ts`, `lib/strategy-registry.ts`, `lib/trading-data.ts`                                  | T1+ HTTP to `unified-trading-api` / `auth-api` (see `scripts/dev-tiers.sh`) |
| Goal: **every surface renders**, **primary actions mutate mock state** where implemented, **no dead links** on critical paths | Goal: parity with production traffic                                        |

**Port SSOT:** `playwright.static.config.ts` and `dev-tiers.sh` use **`http://localhost:3100`** for Tier 0 smoke. If you use `3000`, set `PLAYWRIGHT_BASE_URL` accordingly. **`33000` is not** a standard port in this repo—treat as a typo unless you intentionally mapped it.

### Is this playbook “comprehensive” for every flow?

**Not for every flow**, but Tier 0 now has **executable audits** that fail when gaps are real, not assumed:

- **Route ↔ registry** — `e2e/tier0-app-route-coverage.spec.ts` compares static `app/` `page.tsx` routes to `e2e/tier0-route-registry.ts`. A new static page without a registry entry **fails CI**. Orphan registry paths (no matching page) also fail.
- **URL smoke** — `e2e/static-smoke.spec.ts` visits every path in the registry (Tier 0 dev on **3100**).
- **Behaviour audit (subset)** — `e2e/tier0-behavior-audit.spec.ts` asserts a small set of P0-style controls (e.g. access request **Approve**, alert **Acknowledge** + toast, reconciliation/backtests/manage-request surfaces). Expand this file as more journeys must be guaranteed.

Still **manual / backlog** for full product depth:

- **Per–strategy-type trade booking** matrices in automation.
- **Proof** that every button persists state in mock and that **Reset Demo** clears that state (see matrix below and §5a).

Use the **scenario matrix** as the backlog for additional Playwright cases and mock-handler completeness.

### Scenario matrix (target behaviour vs doc / automation today)

Legend: **Doc** = called out in this file or handbook; **Smoke** = URL load only in `static-smoke.spec.ts`; **Journey** = multi-step test exists; **Mock** = client mock can mutate + read back; **Reset** = cleared by `resetDemo()` (`lib/reset-demo.ts`).

| Scenario                                                                                                                           | Doc                | Smoke                  | Journey                                                                                                | Mock / product                                                |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Every static-segment `page.tsx` under `app/`                                                                                       | §4 + registry SSOT | Yes (registry + smoke) | Partial (subset in behavior audit)                                                                     | N/A                                                           |
| Set up / provision **user** (onboard, catalogue, admin views)                                                                      | §4 E, §5           | Some URLs              | No                                                                                                     | Partial (`mock-provisioning-state`)                           |
| **New strategy** (create config, appear in grid)                                                                                   | §5, handbook       | URLs                   | No                                                                                                     | Mostly registry/fixtures, not full “create”                   |
| **New venue** (add to execution config, reflected in UI)                                                                           | §5                 | URLs                   | No                                                                                                     | Partial / backlog                                             |
| Run **backtest** → see **results**                                                                                                 | §4 C               | URLs                   | No                                                                                                     | Fixture-driven; verify handlers                               |
| **Book trades** (terminal, book, lane-specific: options / sports / defi / …)                                                       | §4 B               | URLs                   | No                                                                                                     | Partial; not exhaustive per strategy class                    |
| **Positions** (list, drill-down)                                                                                                   | §5                 | URLs                   | No                                                                                                     | Partial                                                       |
| **Reconcile** internal vs **exchange** positions                                                                                   | §5 / reports       | URLs                   | No                                                                                                     | Backlog / surface-dependent                                   |
| **Alerts**: list, **acknowledge**, disappear after ack                                                                             | §5                 | URLs                   | Partial (`tier0-behavior-audit`: ack + toast)                                                          | Verify mock + UI state; extend for “gone from active”         |
| **Reset Demo** wipes **all** of the above session mutations                                                                        | §5a                | No                     | **Tier 0 UI journey** still TODO (`e2e/reset-demo.spec.ts` targets **8030** API mock, not static Next) | Must align with `resetDemo()`                                 |
| **Reporting / data subscription** (client requests package → **admin sees** → **approve** → client profile shows active)           | §1b                | Partial URLs           | Partial (access **Approve** in behavior audit)                                                         | Partial; unify with access requests or separate queue in mock |
| **User / client detail**: subscribed **services**, **reporting**, balances (**cash** & notional where relevant)                    | §1b                | Partial                | No                                                                                                     | Single SSOT view model in mock; no orphaned tabs              |
| **Org / book / fund scope** (selectors + permissions follow scope)                                                                 | §1b lattice        | URLs                   | No                                                                                                     | Backlog                                                       |
| **Pre-trade**: restricted / limit preview / compliance explain                                                                     | §1b lattice        | URLs                   | No                                                                                                     | Backlog                                                       |
| **Order lifecycle**: amend, cancel, reject with reason                                                                             | §1b P3             | URLs                   | No                                                                                                     | Backlog                                                       |
| **Market data**: entitlement / delayed vs live / missing data                                                                      | §1b P6             | URLs                   | No                                                                                                     | Backlog                                                       |
| **Post-trade**: confirm / break / settlement status stub                                                                           | §1b lattice        | URLs                   | No                                                                                                     | Backlog                                                       |
| **Audit trail**: append-only actions + **correlation_id** across trade ↔ alert                                                     | §1b P5             | URLs                   | No                                                                                                     | Backlog                                                       |
| **Client IM onboarding** (regulatory / investment-management umbrella): wizard → **tier** + **product scope** → **KYC pack**       | §1b                | Partial URLs           | No                                                                                                     | Backlog                                                       |
| **Onboarding documents**: upload **POA**, ID, agreements, **invoicing** / billing artefacts → **admin review** → status on profile | §1b                | URLs                   | No                                                                                                     | Backlog                                                       |

### P0 — Non‑negotiable journeys (explicit spec vs automation)

**These are called out in the matrix above and in §5 / §5a.** `e2e/static-smoke.spec.ts` is **URL smoke**. `e2e/tier0-behavior-audit.spec.ts` covers a **minimal** subset (e.g. journey **1** approve path, **6** alert ack + toast). The table below remains the **acceptance spec** for full `e2e/tier0-journeys/*.spec.ts` coverage. **Rows 1–6** are execution/research desk; **row 7** is **client IM onboarding** (documents, tier, product scope).

| #   | Journey                                                                                                                                                                                                         | Spec’d in this doc     | Automated today                                                         | Target test file(s) (suggested)                               | Mock / product prerequisites                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **End-to-end user provisioning** → **admin sees request** → **approve** → client sees active entitlement                                                                                                        | Yes (matrix, §1b, §5)  | **Partial** (admin **Approve** + approved UI in `tier0-behavior-audit`) | `e2e/tier0-journeys/provision-approve.spec.ts`                | `mock-provisioning-state`: create request as client persona; admin list shows row; approve mutates user row; client session reflects entitlement      |
| 2   | **Create new strategy** or **venue** with **persisted** mock state (survives navigation; reset clears)                                                                                                          | Partial (§5, handbook) | **No**                                                                  | `e2e/tier0-journeys/create-strategy-venue.spec.ts`            | Writable slice: not only `strategy-registry` static import — handler or store + `resetDemo()` hook                                                    |
| 3   | **Backtest run** → **results** as one **scripted** flow (configure → run → assert key result fields)                                                                                                            | Partial (§4 C)         | **No**                                                                  | `e2e/tier0-journeys/backtest-results.spec.ts`                 | Mock handler returns deterministic run id + metrics; UI shows results panel with stable `data-testid`s                                                |
| 4   | **Every book-trade path** per **strategy class** (delta-one, options, sports, predictions, DeFi, …)                                                                                                             | Partial (§4 B, §1b P4) | **No**                                                                  | One spec per lane or table-driven `book-trade-matrix.spec.ts` | **Handbook matrix** is SSOT for rows; each row = navigate → submit → assert order/position mutation                                                   |
| 5   | **Position vs exchange** reconciliation as **verified** flow (diff shown → resolve action → cleared)                                                                                                            | Partial (§5, §1b P3)   | **No**                                                                  | `e2e/tier0-journeys/reconcile-positions.spec.ts`              | Mock: internal position ≠ exchange ledger; UI wizard or report applies resolution; post-condition match                                               |
| 6   | **Alerts**: **view** → **acknowledge** → **row disappears** from active queue                                                                                                                                   | Yes (matrix, §5)       | **Partial** (ack + success toast in `tier0-behavior-audit`)             | `e2e/tier0-journeys/alerts-ack.spec.ts`                       | Mock alert store with `ack` mutation; list filters out ack’d; optional history tab                                                                    |
| 7   | **Client onboarding (IM / regulatory umbrella)**: **tier** + **what to onboard for** → **document uploads** (incl. **POA**, agreements, **invoicing** docs) → **admin review** → **cleared to trade / service** | Yes (§1b below)        | **No**                                                                  | `e2e/tier0-journeys/client-onboarding-im.spec.ts`             | Mock: `onboarding_application`, `document_artifact[]`, checklist states; admin queue; user detail shows **onboarding status** + **subscription tier** |

**Shared hardening (journeys 1–7):**

- Use **personas** from `lib/auth/personas.ts`; no real credentials.
- After each journey, optionally chain **Reset Demo** and assert seed state (**§5a**).
- Prefer **`data-testid`** on primary buttons/tables over brittle text selectors.

**Chat + extras coverage:** The **derived capability lattice** (§1b), **subscriptions / user-detail SSOT** (§1b), **scenario matrix** rows, and **§6 vision backlog** capture the wider discussion. They are **not** the same as automation — they are **scope** until implemented.

---

## 1b. Institutional-grade demo target — what we need to do

**Intent:** A desk-quality **workflow prototype** with a **small, realistic dataset** (fewer instruments, slower “time”, synthetic venues). **Capability** matches what you would hand a PM/engineer to specify **APIs and services** — not a stripped “toy” where whole job roles disappear.

### Design rule: shrink data, not jobs

| Shrink                                            | Do not shrink                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Count of names, venues, strategies, history depth | **Actions** available in UI (buttons, wizards, approvals)               |
| Tick frequency, file sizes, latency simulation    | **State machines** (pending → approved → active → revoked)              |
| Region / asset-class breadth                      | **Cross-surface consistency** (same user, same entitlements everywhere) |

### Capability pillars (every pillar should be exercisable in Tier 0 mock)

1. **Research & signal** — Idea → feature view → backtest config → run → **results** & attribution slice; strategy compare / handoff.
2. **Book & risk** — Limits, concentration, scenario / stress placeholders; **alerts** with **ack** and **clear from queue** when resolved.
3. **Execution** — SOR / algo / venue context; **book** trades per **lane** (delta-one, options, sports, prediction markets, DeFi) with **same instruction model**, different validators.
4. **Positions & treasury** — Positions, **cash** & margin (where applicable), **reconciliation** internal vs **exchange / custodian** (even if “exchange” is mock ledger).
5. **PnL & reporting** — Daily / period PnL, settlement & recon reports; **scheduled client reports** as a **subscription** object.
6. **Compliance & audit** — Immutable-ish audit trail in mock (append-only log); export / attest placeholders.
7. **Client & admin** — Onboarding, **entitlements**, **service SKUs**, **reporting packages**; **admin inbox** for anything that needs a human gate — including **IM / regulatory client onboarding** and **document review** (see below).

### Client onboarding, documents, and IM / regulatory umbrella

**Intent:** A prospect or client can be **onboarded under the investment-management / client-management regulatory story** (demo labels only — real regimes are legal/compliance-owned). The UI should exercise the **same state machines** as production: collect intent, collect evidence, human review, then **entitlements + tier** go live.

**What the client must be able to do (Tier 0 mock):**

1. **Start onboarding** — register intent: **which products / services** they want (execution only, research, full IM, reporting-only, etc.) and **subscription / service tier** (names from your commercial SKUs).
2. **Upload documents** — each file is a **`document_artifact`** with a **type** (illustrative enum for mock/OpenAPI):
   - **Proof of address** (utility bill, bank statement — demo: fake PDF bytes or placeholder URL only; **never** real PII in git).
   - **Identity / KYC pack** (passport, national ID — same rule: synthetic fixtures only).
   - **Investment management** or **advisory agreement** (signed PDF placeholder).
   - **Invoicing / billing** — W-9 / tax form stub, **invoice template** upload, or **payment mandate** document (whatever your ops workflow calls for).
3. **See checklist progress** — required doc types **missing** vs **uploaded** vs **rejected** (with reason).
4. **After approval** — **user / client detail** shows: **onboarding_status** (`draft` → `submitted` → `in_review` → `approved` / `rejected`), **selected tier**, **onboarded product scope**, and **links** to artefact metadata (not necessarily the binary in Tier 0).

**What admin / compliance must be able to do:**

- **Queue**: same **admin inbox** pattern as access requests — row per **onboarding_application_id** with **unack** → **review** → **approve** / **reject** (reject sends **reason** back to client checklist).
- **Per-document review**: optional **accept / re-upload requested** on each artifact (mirrors real ops).
- **Regulatory umbrella (demo narrative):** copy should state that **approved** onboarding places the client under the **IM / client-management** programme they applied for (exact legal text is out of band — Tier 0 proves **workflow**, not law).

**Stateful entities (add to mock + reset when implemented):**

| Entity                              | Purpose                                                             | Key fields (illustrative)                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`onboarding_application`**        | One application per org or per user (pick one rule and stick to it) | `id`, `applicant_user_id`, `desired_product_slugs[]`, **`subscription_tier`**, `status`, `submitted_at`, `reviewer_id`, `correlation_id`                                                                        |
| **`document_artifact`**             | Each upload                                                         | `id`, `application_id`, **`doc_type`** (`proof_of_address`, `identity`, `management_agreement`, `invoice_or_tax`, `other`), `file_name`, `uploaded_at`, **`review_status`** (`pending`, `accepted`, `rejected`) |
| **`onboarding_checklist_template`** | Drives required docs by **tier** + **product scope**                | which `doc_type`s are mandatory before submit                                                                                                                                                                   |

**Handoff:** same four bullets as §1b **Handoff to API** (JSON shape, idempotency, events e.g. `client.onboarding.submitted`, `client.document.accepted`, authz rows).

**Playwright:** journey **#7** in §1 (`client-onboarding-im.spec.ts`).

### Subscriptions & approvals (your reporting + services requirement)

Treat as explicit **stateful entities** in mock (names illustrative — align to UAC/OpenAPI when defined):

| Entity                               | Client action                                                   | Admin action                                                                                       | After approval                                                                         |
| ------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Access / entitlements** (existing) | Request product slugs                                           | Approve / deny in **Admin → Users → Requests**                                                     | `mock-provisioning-state` user row updated                                             |
| **Reporting subscription**           | Subscribe to package (e.g. daily exec summary, regulatory pack) | **Ack** + **Approve** in admin **Reporting / Subscriptions** (or unified **Requests** with `type`) | User **detail** shows active package + next run                                        |
| **Data / feed subscription**         | Subscribe to dataset / venue bundle                             | Same queue pattern                                                                                 | Entitlements + **data coverage** UI reflect it                                         |
| **IM onboarding application**        | Submit tier + product scope + documents                         | Review in **admin onboarding queue**                                                               | **Onboarding approved** unlocks or aligns **entitlements** + shows **tier** on profile |

**UX requirement:** Client sees **pending** until approved; admin sees **unacknowledged** first, then **approve**; post-approve, item **leaves** actionable queue (or moves to history). **Reset Demo** must reset these queues to seed defaults (extend `resetDemo()` / mock stores when new entities land).

**User detail page** should be the **single place** that shows: identity, org, **entitlements**, **subscribed services**, **reporting packages**, **onboarding + document status**, **subscription tier** for the IM programme, **cash / wallet / margin summary** (mock numbers), and links to deep dives — no contradictory copies of the same fact elsewhere.

### Handoff to API / backend (prototype → contract)

For each new mock entity, deliver with the UI change:

1. **JSON shape** (example payloads request/response) checked into `lib/registry/openapi.json` or sibling when wired.
2. **Idempotency** key or natural key (e.g. `subscription_id`, `request_id`).
3. **Events** (names only): e.g. `reporting.subscription.requested`, `reporting.subscription.approved`.
4. **Authz matrix** row: which persona can request vs approve.

That keeps Tier 0 as the **executable spec** PM and backend can implement once, not re-discover from screenshots.

### Derived capability lattice — what the product must do (not only stated asks)

The list below is **inferred from what an institutional platform is for**: if the demo cannot **exercise** a slice (even as a thin mock), we cannot honestly hand APIs to backend for that slice. Use it when prioritising mock state, routes, and OpenAPI drafts.

| Domain                          | What “done” means in demo (function, not data volume)                                                                              | Typical blind spot if omitted                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Org & hierarchy**             | **Legal entity → fund / account → book → strategy** visible in scope selectors; permissions follow scope                           | Flat “one user = one book” hides allocator / PB / multi-fund reality |
| **Identity & roles**            | **SoD**: requester ≠ approver for risk limits, subscriptions, large trades; **break-glass** / override with reason code            | Everyone-is-admin demos that never test authz                        |
| **Pre-trade**                   | Restricted list / watchlist hit; **limit preview** (would breach or not); **compliance rule** explain string                       | Only post-trade “sorry” banners                                      |
| **Order lifecycle**             | **New → working → partial → filled**; **amend**; **cancel**; **reject** with reason; **bust / cancel-correction** stub             | Fire-and-forget fills only                                           |
| **Allocations & booking**       | **Block** → **allocations** to books/accounts; **give-up / step-out** placeholder                                                  | Single-line book ignores PM workflows                                |
| **Market data**                 | **Entitlement** flags per venue / dataset; **delayed vs live** badge; **missing snapshot** behaviour                               | Free-for-all data that never models licensing                        |
| **Reference data**              | **Instrument master** identity (symbology map); **corporate action** placeholder (splits, delist)                                  | Strategies keyed on strings that never change                        |
| **Post-trade**                  | **Trade confirm** / affirm stub; **break** workflow; **settlement date** & status                                                  | Positions that appear without a confirm path                         |
| **Reconciliation**              | **Position / cash / margin** tri-party: internal vs **counterparty** vs **custodian**; **aged breaks**                             | One-column “position” with no external side                          |
| **Treasury & PB**               | **Cash ledger**, **margin requirement**, **collateral** move, **FX hedge** link (mock rates)                                       | Cash as a single static number                                       |
| **Risk depth**                  | **Limits** (delta, vega, notional, concentration); **what-if** / **stress** bucket; **breach** → alert → ack                       | Only a heatmap with no limit object                                  |
| **PnL & attribution**           | **Realised / unrealised / fees / financing**; **strategy / book / PM** attribution dimensions                                      | One PnL number with no bridge                                        |
| **TCA & execution quality**     | Slippage vs **arrival / benchmark**; **venue** breakdown; **algo** parameter set id                                                | Pretty charts with no benchmark field                                |
| **Research → production**       | **Paper → small capital → scale** gates; **promotion** record (who, when, evidence)                                                | Backtest page disconnected from “live” flag                          |
| **ML ops**                      | **Model version**, **feature set hash**, **drift** flag, **rollback**                                                              | Experiments table as dead data                                       |
| **Client reporting**            | **Calendar** (when sent), **recipients**, **format** (PDF/BI), **failure / retry**                                                 | PDF button with no schedule object                                   |
| **Subscriptions (commercial)**  | **SKU**, **billing period**, **seat count**, **renew / cancel**                                                                    | Only boolean “has reporting”                                         |
| **Surveillance & conduct**      | **Market abuse** / **insider** queue stub; **export for investigation**                                                            | Compliance tab as static text                                        |
| **Audit**                       | **Append-only** event stream; **correlation_id** across trade ↔ alert ↔ report                                                     | Logs that can be edited in mock                                      |
| **Ops & SRE**                   | **Service map** health; **job** success/fail; **deploy / change** window notice                                                    | Green dashboard always                                               |
| **Incident & DR**               | **Degraded mode** banner; **failover** checklist; **RPO/RTO** placeholders (tie to IR pages)                                       | Perfect uptime fiction                                               |
| **Sports / predictions / DeFi** | **Event risk** cap; **grading / resolution** dispute queue; **wallet policy** (allowlist, limits)                                  | Same equities UX pasted on exotic underlyings                        |
| **Client IM onboarding**        | **Tier + product scope**; **KYC / POA / agreements** uploads; **invoicing** artefacts; **admin review**; status on **user detail** | Entitlements without **evidence trail**; no **per-doc** reject path  |

**Cross-cutting mock rules**

- Every **mutable** object needs: `id`, `status`, `created_at`, `updated_at`, `actor` (user/service), `correlation_id` where it touches execution or reporting.
- Every **approval** path needs: **pending**, **acknowledged**, **approved/rejected**, **expired** (optional), and **history** view.
- **Time travel** in demo: ability to pin **as-of** date for PnL / positions (even if single preset) — institutions reason about closes.

### Suggested build order (phases)

| Phase  | Outcome                                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0** | Journey tests for: trade → position → PnL row; alert → ack → gone; reset restores all mutable mock keys                                                                                   |
| **P1** | Unified **admin request inbox** (access + reporting + data) with typed rows                                                                                                               |
| **P2** | **User detail** SSOT: services + reporting + **cash** balances from one mock slice                                                                                                        |
| **P3** | Reconciliation & settlement **wizards** (mock diff resolution); **order amend/cancel** + **reject reasons**                                                                               |
| **P4** | Per–strategy-class **book trade** matrix in handbook + one automated case per class                                                                                                       |
| **P5** | **Org/book scope** model wired to filters; **pre-trade limit preview** stub; **audit** append stream for key actions                                                                      |
| **P6** | **Market data entitlement** flags + **reference / symbology** drill-down; **TCA benchmark** field on sample fills                                                                         |
| **P7** | **IM / regulatory client onboarding**: mock `onboarding_application` + `document_artifact` + checklist by **tier**; admin queue; **`resetDemo()`** clears applications + uploads metadata |

Extend phases as the lattice above moves from **Missing** → **Partial** → **Done** in the audit log.

### BlackRock / Citadel–grade demo: honest bar

**Short answer: not yet.** A **production** platform at BlackRock/Citadel scale is out of scope for static Tier 0. A **pitch- or PM-quality demo** can still aim at the same **workflow completeness** on a **tiny dataset**.

| Criterion                       | “Allocator / CIO pitch” demo                                                 | This repo today (typical)                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Scripted critical paths**     | All of **§1 P0 six journeys** green in CI                                    | **URL smoke + registry audit + partial behavior audit**; full P0 journeys still **specified, not fully automated** |
| **Persisted mock state**        | Create/approve/recon/backtest survive navigation; **reset** is deterministic | Partial stores; **reset** improved for provisioning; strategy/venue **create** often still fixture-bound           |
| **Roles & SoD**                 | Client vs admin vs risk approver exercised in tests                          | Personas exist; **journeys** rarely assert separation                                                              |
| **Recon & breaks**              | At least one **closed loop** internal vs external                            | Surfaces exist; **verified** flow **backlog**                                                                      |
| **Risk / compliance narrative** | Limits, alerts, audit, best-ex **placeholders** with real state transitions  | Lattice + pillars **documented**; many slices **UI-only or static**                                                |
| **Cross-asset book trades**     | **Matrix**: every strategy class has a **book** path                         | **Handbook** + registry; **automation** not exhaustive                                                             |

**If we want the demo to _feel_ “Citadel-grade” to a skeptical PM**, add (documentation + eventually mock):

| Extra (often omitted from ad-hoc lists)  | Demo stub                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Mandate / IPS**                        | Checklist: allowed instruments, max leverage, ESG exclusions — **breach** → alert                        |
| **Liquidity & gates**                    | **Redemption / liquidity ladder** (mock % terms); **side pocket** flag on illiquid names                 |
| **Counterparty & legal**                 | **ISDA / CSA** placeholder; **margin statement** vs internal **PB recon** row                            |
| **Best execution**                       | **Committee pack** export stub: sample trades + benchmark + venue rationale                              |
| **Allocator workflow**                   | **Capital deployment** queue: approved idea → **size** → **execute** with **limit preview**              |
| **Investor / regulatory reporting**      | **13F / Form PF–style** “would feed” banner; **attestation** checkbox on report send                     |
| **Operational due diligence**            | **Control** checklist page: backups, access reviews, **SOC read-through** placeholders                   |
| **Performance integrity**                | **GIPS-style** disclaimer + “verified / unverified” toggle on performance widget                         |
| **Incident & continuity**                | **Degraded mode** + **BCP** checklist (links IR/ops pages); not always green                             |
| **Client onboarding (allocator-facing)** | Full **KYC pack + tier + product scope** in one narrative (ties to §1b **Client onboarding** subsection) | “Instant access” with no **document** or **review** state |

None of the above replaces the **P0 journeys (§1 table)** — they are **layer-2 narrative** once P0 is green.

---

## 2. Environment — exact commands

```bash
cd unified-trading-system-ui

# Recommended (see scripts/dev-tiers.sh)
bash scripts/dev-tiers.sh --tier 0
# Then open the URL printed (typically :3100 after tier-0 mapping) OR follow repo README.

# Manual equivalent (from PM system-tiers.md)
NEXT_PUBLIC_MOCK_API=true NEXT_PUBLIC_UI_INTEGRATION=tier0_offline pnpm dev
```

Confirm in browser: **`/health`** reflects **UI-only / mock** expectations.

---

## 3. Authentication (demo only)

**Canonical demo personas:** `lib/auth/personas.ts` — e.g. **admin@odum.internal** / **`demo`**, plus client personas for entitlement checks.

**Do not commit real user passwords** to this repo or to Codex. For ad-hoc human testing outside the persona system, use a **local-only** secret store (1Password, `.env.local` gitignored) — never paste into markdown in git.

**Playwright:** `e2e/static-smoke.spec.ts` logs in via **persona card** (`data-testid="persona-card"` or admin label).

---

## 4. Five-track parallel audit (browsers or agents)

Split work so one pass finishes in under a day. Each track: **open every route in the track**, click **primary CTA**, verify **no blank page**, **no “Coming Soon” / `TODO:`**, note **unhandled mock routes** in console.

| Track                               | Scope (routes)                                                                                                                                            | Focus                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **A — Public & marketing**          | `/`, `/login`, `/signup`, `/contact`, `/docs`, `/demo`, `/demo/preview`, `/privacy`, `/terms`, `/health`, `/services/*` public service pages              | Links, legal, demo entry                                                                                    |
| **B — Trading & strategies**        | `/services/trading/*` including `options`, `predictions`, `sports`, `defi`, `bundles`, `instructions`, `strategies`, `strategies/grid`, `strategies/[id]` | Strategy detail, asset lanes, mock “trade” flows                                                            |
| **C — Research & ML**               | `/services/research/*` including `features`, `signals`, all `ml/*`, `strategy/*`                                                                          | Cross-strategy compare, ML surfaces                                                                         |
| **D — Execution, observe, reports** | `/services/execution/*`, `/services/observe/*`, `/services/reports/*`                                                                                     | Venues, TCA, risk, reporting                                                                                |
| **E — Manage, ops, admin**          | `/services/manage/*`, `/admin`, `/admin/users/*`, `/config`, `/devops`, `/internal/*`, `/ops/*`, `/engagement`                                            | User requests → admin visibility; **client IM onboarding** + **document** queues (**§1b**) when implemented |

**Optional sixth pass:** **Entitlements** — repeat key pages as **client-data-only** vs **admin** (persona switch).

---

## 5. Functional criteria checklist (Tier 0)

Mark **Done / Partial / Missing** per row. “Done” means mock layer updates UI state and persists for the session (or until reset).

| Area                     | Criterion                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategies**           | List, filter, open detail, view instructions / parameters; link from research ↔ trading                                                                                                                     |
| **Venues**               | Configure or view venue context in execution + trading lanes; mock reflects registry                                                                                                                        |
| **Users & access**       | Persona login; admin user list / requests / onboard flows show **consistent** mock data                                                                                                                     |
| **Client IM onboarding** | Client selects **tier** + **products to onboard for**; uploads **POA**, ID, agreements, **invoicing** / tax stubs; **checklist** shows missing vs uploaded; **admin** can approve/reject per app or per doc |
| **Subscriptions**        | Client can request **reporting** / **data** packages; **admin** acks + approves; **user detail** shows active subs + **cash**/balance summary                                                               |
| **Trading**              | Place order (mock), see orders + positions + PnL update in-session                                                                                                                                          |
| **Instructions**         | Create or edit instruction (where UI exists); reflected in mock store                                                                                                                                       |
| **Reset**                | “Reset demo” restores **default demo data** per §5a                                                                                                                                                         |
| **Cross-cutting**        | Search/filter by label where spec’d; no 404 on footer/header nav                                                                                                                                            |

### 5a. Reset Demo — what actually resets (SSOT: `lib/reset-demo.ts`)

The **Mock Mode** footer **Reset Demo** runs `resetDemo()`, which:

1. Resets Zustand stores: `filter-store`, `auth-store`, `ui-prefs-store`.
2. Resets **mock provisioning** (`resetState()` in `lib/api/mock-provisioning-state.ts`) — users + access requests return to **defaults**; localStorage key `mock-provisioning-state` is rewritten.
3. Clears the **React Query** cache.
4. Removes: `portal_user`, `portal_token`, `odum_user`, `nav-preference`, `unified-ui-prefs`, `unified-global-scope`.
5. Navigates to **`/`** (full reload).

**Also invoked (best-effort):** `POST /api/admin/reset` from `debug-footer.tsx`. In pure Tier 0 client mock, that route may be **unhandled**; client reset above is authoritative for the UI.

**Not necessarily cleared** (audit when adding new persisted mock state): keys outside the list above (e.g. staging gate `staging-authenticated` is intentionally separate). Any new `localStorage` used by mocks must be wired into `resetDemo()` or documented as excluded — including **`onboarding_application`** / **`document_artifact`** stores when §1b **P7** lands.

**Gap to close:** add **`playwright.static.config.ts`** test: mutate provisioning (or another client mock) → click **Reset Demo** → assert defaults restored. (`e2e/reset-demo.spec.ts` is for the **8030** unified-trading-api-style mock server, not Tier 0 static UI.)

---

## 6. Product vision backlog (not all Tier 0 today)

These are **explicit targets** for UX + mock + later API alignment. Track in PM plans / issues; do not block Tier 0 smoke on full implementation.

- **Prediction markets:** side-by-side **Kalshi vs Polymarket** (and peers) on same underlying — normalized schema in mock.
- **Sports:** single surface for **odds comparison** across **Betfair, Pinnacle, Kalshi, Polymarket**, etc., with venue column + filter.
- **Astrology / niche strategies:** if retained as a strategy class, **full parameter + dependency + data** panel per `MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md` — plus **cross-strategy** facet filters (asset class, venue, frequency).
- **Cash / delta-one / options / futures / ETFs:** instrument type switcher; **ETF index + constituents** drill-down.
- **Visual design:** comparison matrices, sparklines, venue badges — align with design system; reference **real** public sites only for **layout inspiration** (not scraping credentials).

**Codex SSOT for strategy meaning:** `unified-trading-codex/09-strategy/README.md` + per-strategy files. **UI registry:** `lib/strategy-registry.ts` must stay aligned with Codex (see sync rules in `MOCK_STATIC_EVALUATION_SPEC.md`).

---

## 7. Automated gates

| Gate                                    | Command                                                                                                                        | Notes                                                                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Static Tier 0 suite**                 | `npx playwright test --config playwright.static.config.ts`                                                                     | Runs **`static-smoke.spec.ts`**, **`tier0-app-route-coverage.spec.ts`**, **`tier0-behavior-audit.spec.ts`**. Expects Tier 0 dev on **3100** (see `scripts/dev-tiers.sh --tier 0`). |
| **Registry audit only (no dev server)** | `PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 npx playwright test e2e/tier0-app-route-coverage.spec.ts --config playwright.static.config.ts` | Fast CI-friendly check: static `app/` routes ⊆ `e2e/tier0-route-registry.ts`.                                                                                                      |
| **P0 journey suite (target)**           | `npx playwright test e2e/tier0-journeys`                                                                                       | **Not present until implemented** — full multi-step spec is **§1 P0 table** (journeys **1–7**, including **client IM onboarding**).                                                |
| **Full UI QG**                          | `bash scripts/quality-gates.sh`                                                                                                | Includes Jest/ESLint/etc. per repo                                                                                                                                                 |

**Hardening (recommended next steps):**

1. Grow **`tier0-behavior-audit.spec.ts`** and add **`e2e/tier0-journeys/`** for remaining **§1 P0** flows (full provision loop, create strategy/venue, backtest results, book-trade matrix, recon close-loop, alert row leaves active queue, **client IM onboarding + doc uploads**).
2. Fail tests on **`Unhandled API route`** once mock coverage is complete (today some routes are warn-only in `static-smoke.spec.ts`).
3. Add **link crawler** or Playwright loop over **all** `Link` `href`s from layout shell (catch `/compliance`-style typos).

---

## 8. Tier promotion (T0 → T1 → T2)

Per PM **`system-tiers.md`:** same feature set; **topology** swaps from in-browser mock client to HTTP gateways and then to fleet services. UI should call a **single API abstraction** so switching env vars changes transport, not screens.

---

## 9. Audit log

| Date         | Run by | Tier 0 commit / branch | Result summary                              |
| ------------ | ------ | ---------------------- | ------------------------------------------- |
| _YYYY-MM-DD_ | _name_ | _sha_                  | _e.g. Playwright green; Track B 3 partials_ |

---

## 10. Security reminder

**Never** store production or personal credentials in this file or in Codex. Rotate any secret that has appeared in chat or committed history.
