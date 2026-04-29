# Codex 14-playbooks — Audit Report

**Date:** 2026-04-29
**Source:** `/home/hk/unified-trading-system-repos/unified-trading-pm/codex/14-playbooks/`
**Scope:** Read-only reconnaissance. No recommendations.

---

## Codex 14-playbooks overview — File inventory

The directory is organised into named sub-directories (layers) plus a few root-level docs. Every doc is classified by scope: `[engineer, admin, sales]` or subset.

| Doc / dir                     | One-line purpose                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md`                   | Master index: layered structure, reader paths by role, how-to-add-playbook protocol                                                                                                                                                                                                                                                                                |
| `audiences-and-journeys.md`   | Canonical persona × playbook × environment matrix                                                                                                                                                                                                                                                                                                                  |
| `information-architecture.md` | Top-down IA tree: PUBLIC → DEEP DIVE → PLATFORM → OPS; audience-to-route mapping                                                                                                                                                                                                                                                                                   |
| `glossary.md`                 | One definition per platform term (DART, IM, Reg Umbrella, org, fund, client, etc.)                                                                                                                                                                                                                                                                                 |
| `smoke-testing-playbook.md`   | Backend smoke-test ops (SIT gate vs per-service dev helper) — not a UI playbook                                                                                                                                                                                                                                                                                    |
| **`playbooks/`**              | Impl-layer: 8 docs covering pb1, pb2, pb2a/b/c, pb3, pb3a/b/c + README                                                                                                                                                                                                                                                                                             |
| **`experience/`**             | Narrative / sales-owned layer: 9 docs (pb1–pb3c) + README + TEMPLATE                                                                                                                                                                                                                                                                                               |
| **`cross-cutting/`**          | 7 docs: visibility-slicing, client-reporting, catalogues, fund-org-hierarchy, sma-vs-pooled, investor-relations, bloomberg-style-aesthetic, admin-permissions                                                                                                                                                                                                      |
| **`authentication/`**         | 3-tier auth: light-auth (briefings), Firebase staging, Firebase production + README                                                                                                                                                                                                                                                                                |
| **`environments/`**           | 3 environments: localhost, staging (`odum-research.co.uk`), production (`odum-research.com`) + README                                                                                                                                                                                                                                                              |
| **`commercial-model/`**       | 8 docs: building-block packaging, pricing, fixed-vs-variable, DART entry points, IM vs Reg reporting logic, exclusivity, IM profit share, revenue projection                                                                                                                                                                                                       |
| **`demo-ops/`**               | 9 content docs + profile YAMLs + tooling: restriction profiles, demo modes, upsell overlays, curation rules, discovery framework, decision matrix, account-intelligence record, meeting tracking, post-demo orchestration                                                                                                                                          |
| **`shared-core/`**            | 9 docs: same-system principle, org/fund/client model, shared reporting core, strategy-origin vs stack-depth, venue/chain/instrument scope, instruction-schema fit, data-licensing boundaries, client-reporting demo walkthrough, fund admin & custody, strategy-allocation-lock matrix, signal-broadcast-architecture, strategy-version-governance, treasury model |
| **`implementation-mapping/`** | 4 docs: route-mapping, persona-and-user-prototype-mapping, demo-email-and-provisioning-flow, playbook-to-qa-coverage                                                                                                                                                                                                                                               |
| **`_ssot-rules/`**            | 12 rules governing all experience docs (grammar, tone, same-system principle, DART commercial axes, building-block dimensions, show/don't-show, data-licensing, pricing, internal one-liners, instruction-schema principles, codex-scope registry, service-family scope rules)                                                                                     |
| **`infra-spec/`**             | Stage 3: current-state audit (3A), UAC combo rules + YAML schema + instruction-schema contract + downstream analytics matrix (3B), derivation engine (3C), env split + refactor plan (3E)                                                                                                                                                                          |
| **`page-triage/`**            | 177-route triage matrix + broken links + duplicate clusters + partial-archive classifications                                                                                                                                                                                                                                                                      |
| **`testing/`**                | Test matrix (playbook × persona × environment → Playwright spec) + example spec                                                                                                                                                                                                                                                                                    |
| **`roadmap/`**                | Next waves (5–8 follow-up plans) + plan references                                                                                                                                                                                                                                                                                                                 |
| **`presentations/`**          | 16-slide target-experience deck (post-refactor) + 7 Playwright screenshots                                                                                                                                                                                                                                                                                         |
| **`_generated/`**             | `scope-manifest.json` — auto-generated from `_ssot-rules/` tooling                                                                                                                                                                                                                                                                                                 |

---

## Client / user personas

Source: [`audiences-and-journeys.md`](../../../unified-trading-pm/codex/14-playbooks/audiences-and-journeys.md), [`implementation-mapping/persona-and-user-prototype-mapping.md`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md), [`cross-cutting/visibility-slicing.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md).

### External / prospect personas

#### Anonymous visitor

- **Type:** External, unauthenticated
- **Description:** "An anonymous visitor who stumbled on the Odum homepage or was referred by word of mouth. They have no prior relationship with Odum, no first call yet."
  ([`playbooks/01-marketing-pre-first-call.md:11`](../../../unified-trading-pm/codex/14-playbooks/playbooks/01-marketing-pre-first-call.md))
- **Access:** pb1 — fully public; `/`, `/investment-management`, `/platform`, `/regulatory`, `/firm`, `/contact`, `/privacy`, `/terms`, `/login`, `/signup`
- **Playbooks:** pb1 only

#### Cold-inbound prospect

- **Type:** External, light-auth gated
- **Description:** "Found the marketing site, hits a Deep Dive item from the nav, fills the brief questionnaire on the lock screen to unlock."
  ([`playbooks/02-research-and-documentation.md:17`](../../../unified-trading-pm/codex/14-playbooks/playbooks/02-research-and-documentation.md))
- **Auth:** Questionnaire submit → `setBriefingSessionActive()` + localStorage session (Channel A — most common since 2026-04-25)
- **Access:** pb1 + pb2. All six briefing pillars, `/docs`, `/our-story`, `/faq` once session active. No Firebase; no entitlements.
- **Playbooks:** pb1, pb2

#### Warm hand-off prospect

- **Type:** External, light-auth gated (code-entry path)
- **Description:** "Odum sales sent a per-path code in advance; uses the 'I already have a code' disclosure on the gate."
  ([`playbooks/02-research-and-documentation.md:20`](../../../unified-trading-pm/codex/14-playbooks/playbooks/02-research-and-documentation.md))
- **Auth:** Per-path access code from sales (Channel B). Same session result as cold-inbound.
- **Access:** Same as cold-inbound prospect after unlock.
- **Playbooks:** pb1, pb2

#### Warm prospect — IM flavour (`prospect-im`)

- **Type:** External, Firebase staging
- **Description:** Allocator or family-office principal evaluating Odum as a manager for systematic exposure. "An allocator or family-office principal evaluating Odum as a manager for systematic exposure — capital allocation, not infrastructure operation."
  ([`experience/im-decision-journey.md:15`](../../../unified-trading-pm/codex/14-playbooks/experience/im-decision-journey.md))
- **Status:** Persona exists in `lib/auth/personas.ts`
- **Entitlements:** Blocks 1 + 3; `reporting` + optional `investor-relations`; all other services padlocked-visible
- **Access:** `/dashboard` → services portal with all tiles LOCKED except `/services/reports/*`. Full reports surface (12 sub-routes). SMA vs Pooled picker. Fund/client creation flows.
- **Playbooks:** pb1, pb2 (pb2a), pb3 (pb3b)

#### Warm prospect — Reg Umbrella flavour (`prospect-reg`)

- **Type:** External, Firebase staging
- **Description:** A firm wanting to conduct regulated activity under Odum's FCA umbrella without direct authorisation.
- **Status:** TBD — persona not yet in `lib/auth/personas.ts` ([`implementation-mapping/persona-and-user-prototype-mapping.md:28`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md))
- **Entitlements:** Blocks 1 + 2 + 7 + 8 + 10 + optional 11; `reporting` + optional `investor-relations`; all other services padlocked-visible
- **Access:** Identical UI to `prospect-im`; narrative framing differs. Full reports surface + Pooled/SMA + fund/client creation.
- **Playbooks:** pb1, pb2 (pb2c), pb3 (pb3a)

#### Warm prospect — DART flavour (`prospect-dart`)

- **Type:** External, Firebase staging
- **Description:** A prospect who wants to build and run their own strategies on Odum infrastructure (or commission Odum to build strategies for them).
- **Status:** TBD — persona not yet in `lib/auth/personas.ts`. May split into `prospect-dart-signals-only` and `prospect-dart-full`.
  ([`implementation-mapping/persona-and-user-prototype-mapping.md:32`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md))
- **Entitlements (signals-only):** Blocks 1 + 4 + 5 + 7 + 8 + 9 + 10 + optional 11; Block 6 LOCKED-VISIBLE; research/promote surfaces LOCKED-VISIBLE
- **Entitlements (full):** Above + Block 6 + expanded 11; broader scope
- **Access:** `/dashboard` → Data, Research, Promote, Trading, Observe UNLOCKED; Admin LOCKED; Reports optional
- **Playbooks:** pb1, pb2 (pb2b), pb3 (pb3c)

### Real client personas

#### Real client — IM (`client-full`, `client-premium`, subset of entitlements)

- **Type:** External, Firebase production
- **Description:** Paying allocator; capital allocated to Odum-run strategies. Reporting surface is the primary product surface.
- **Status:** `client-full` and `client-premium` exist. Dedicated Reg Umbrella real-client persona is TBD.
- **Entitlements:** `data-pro`, `execution-full`, `ml-full`, `strategy-full`, `reporting`, trading-domain tiers
- **Access:** Production Firebase. Services portal sliced to paid package. `/services/reports/*` plus strategy catalogue filtered to PUBLIC + BACKTESTED+.
- **Playbooks:** pb1, pb2 (relevant pillars), real client (no pb3)

#### Real client — DART platform-only (`client-full`, `client-data-only`)

- **Type:** External, Firebase production
- **Description:** Paying DART client running their own strategies on Odum infrastructure.
- **Entitlements:** `client-full` = full DART; `client-data-only` = signals/data only (Blocks 1 + 4 + 5 + 7 + 8 + 9 + 10)
- **Access:** Full DART surface for `client-full`; signals/execution surface for `client-data-only`. No IM reporting for DART-only.
- **Playbooks:** pb1, pb2 (pb2b), real client

#### Real client — Reg Umbrella

- **Type:** External, Firebase production
- **Description:** Firm operating under Odum's FCA umbrella as a paying client.
- **Status:** TBD — needs dedicated persona
  ([`audiences-and-journeys.md:29`](../../../unified-trading-pm/codex/14-playbooks/audiences-and-journeys.md))
- **Playbooks:** pb1, pb2 (pb2c), real client

### Internal personas

#### Odum admin (`admin`)

- **Type:** Internal, Firebase production/staging
- **Description:** "Odum internal ops / admin." Sees everything across all services, all catalogues, all dimensions. No filtering.
  ([`cross-cutting/visibility-slicing.md:40`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md))
- **Status:** Exists
- **Entitlements:** `["*"]` — wildcard. Admin-permissions model splits destructive ops into 10 scoped permissions.
  ([`cross-cutting/admin-permissions.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/admin-permissions.md))
- **Access:** pb1, pb2, pb3, real client, `/admin/*`, `/ops/*`, all services, all catalogues, all tabs, all lock states. Provisions orgs/funds/clients in user-management-ui.
- **Route entry:** `/admin`

#### Odum internal trader (`internal-trader`)

- **Type:** Internal, Firebase production
- **Description:** "Odum internal trading team." Full platform access, no admin/ops surfaces.
- **Status:** Exists
- **Entitlements:** Blocks 1 + 4 + 6 + 7 + 8 + 9 + 10 + 11 — same block set as `client-full` but scoped to Odum internal strategies
- **Access:** `/dashboard` (services portal, no ops); all DART surfaces; internal strategies. No admin routes.
- **Route entry:** `/dashboard`

#### Odum investor (`investor`, `advisor`)

- **Type:** Internal/investor, Firebase staging/production
- **Description:** Odum investor (board / IR) and advisor. Not a trading prospect. "Investor Relations is NOT for prospects."
  ([`information-architecture.md:176`](../../../unified-trading-pm/codex/14-playbooks/information-architecture.md))
- **Status:** Both exist
- **Access:** `/investor-relations/*` (board/plan/IM/platform/regulatory/disaster-recovery presentations). NOT the services portal.
- **Playbooks:** None of the prospect playbooks. Separate investor-relations surface.

---

## Playbooks

### Playbook family overview

Three numbered families (impl layer) with an experience-layer parallel for each:

| ID   | Label                       | Impl doc                                     | Experience doc(s)                            |
| ---- | --------------------------- | -------------------------------------------- | -------------------------------------------- |
| pb1  | Marketing pre-first-call    | `playbooks/01-marketing-pre-first-call.md`   | `experience/marketing-journey.md`            |
| pb2  | Deep Dive (briefings hub)   | `playbooks/02-research-and-documentation.md` | `experience/briefings-hub.md`                |
| pb2a | Deep Dive — IM              | `playbooks/02a-research-im.md`               | `experience/im-decision-journey.md`          |
| pb2b | Deep Dive — DART            | `playbooks/02b-research-dart.md`             | `experience/dart-briefing.md`                |
| pb2c | Deep Dive — Reg Umbrella    | `playbooks/02c-research-regulatory.md`       | `experience/regulatory-umbrella-briefing.md` |
| pb3  | Warm-prospect demo (hub)    | `playbooks/03-warm-prospect-demo.md`         | `experience/staging-demo-journey.md`         |
| pb3a | Demo — Reg Umbrella flavour | `playbooks/03a-demo-reg-umbrella.md`         | `experience/regulatory-demo.md`              |
| pb3b | Demo — IM flavour           | `playbooks/03b-demo-im.md`                   | `experience/investment-management-demo.md`   |
| pb3c | Demo — DART flavour         | `playbooks/03c-demo-dart.md`                 | `experience/dart-demo.md`                    |

---

### pb1 — Marketing, pre-first-call

**Description:** Public, unauthenticated surface. Goal is to convert anonymous visitors to (a) booking a first call, (b) requesting a demo, or (c) bouncing with no pressure.
**Source:** [`playbooks/01-marketing-pre-first-call.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/01-marketing-pre-first-call.md)
**Personas:** Anonymous visitor (no auth)
**Environment:** Production (`odum-research.com`) + staging (`odum-research.co.uk`) — same homepage

**Step-by-step flow:**

1. Land on `/` (homepage)
   - Hero: "Unified Trading Infrastructure" + FCA reg number
   - Three-service pitch cards: Invest (`/investment-management`) / Build & Run (`/platform`) / Regulate (`/regulatory`)
   - Coverage tabs: Crypto / DeFi / TradMkts / Sports / Prediction / Regulatory
   - Final CTAs: Discuss a Mandate / Book Demo / Check Regulatory Fit
2. Navigate to one of three service landings:
   - `/investment-management` — IM pitch; CTA: "Discuss a Mandate"
   - `/platform` — DART pitch; CTA: "Book a Demo"
   - `/regulatory` — Reg Umbrella pitch; CTA: "Check Regulatory Fit"
3. Optional: `/firm` (who we are), `/contact` (enquiry form — captures name, firm, service of interest)
4. Exit: book call → Odum follows up → pb2 link sent; OR request demo → admin provisions staging account → pb3; OR bounce.

**UI surfaces named:**

- `app/(public)/page.tsx` — homepage
- `public/homepage.html` — static content via `components/marketing/marketing-static-from-file.tsx`
- `components/shell/site-header.tsx` — top nav
- `components/shell/spaces-nav-sections.tsx` — Spaces dropdown (public "Overview" section)

**Playwright spec:** `tests/playbooks/marketing-pre-first-call.spec.ts`

---

### pb2 — Deep Dive (formerly "Research & Documentation")

**Description:** Light-auth-gated hub. A prospect (cold inbound or warm hand-off) reads briefings across six pillars, developer docs, founder long-form story, and FAQ before committing to a demo.
**Source:** [`playbooks/02-research-and-documentation.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/02-research-and-documentation.md)
**Personas:** Cold-inbound prospect (Channel A), Warm hand-off prospect (Channel B)
**Environment:** Staging + Production (same gate)

**Step-by-step flow:**

1. Hit any Deep Dive nav item (e.g., `site-header.tsx` Sheet drawer — "Deep Dive" toggle with amber lock icon on unauthenticated items)
2. `<BriefingAccessGate>` renders — content hidden; two paths:
   - **Channel A (primary):** Fill embedded questionnaire (6-axis + Reg-Umbrella branch) → submit → `setBriefingSessionActive()` + email-back (code + Next Steps + Calendly + Strategy Eval link) → redirect to `/briefings`
   - **Channel B (secondary):** "I already have an access code" disclosure → paste code → unlock
3. Land on `/briefings` hub:
   - "How to use this page" intro (3-step ordered list)
   - Six briefing-pillar cards
   - "Next steps to a Sandbox demo" CTA (Strategy Evaluation submit + Calendly link)
4. Navigate to sub-briefings (same session covers all): `/briefings/investment-management`, `/briefings/platform`, `/briefings/dart-signals-in`, `/briefings/dart-full`, `/briefings/signals-out`, `/briefings/regulatory`
5. Sibling Deep Dive routes also covered by same session: `/docs`, `/our-story`, `/faq`
6. Exit: book Calendly call → submit Strategy Evaluation DDQ at `/strategy-evaluation` → Odum schedules Sandbox demo → pb3; OR drop out.

**UI surfaces named:**

- `app/(public)/briefings/layout.tsx` — briefings layout (wraps gate)
- `components/briefings/briefing-access-gate.tsx` — gate + embedded questionnaire
- `components/questionnaire/questionnaire-form.tsx` — reusable questionnaire form
- `lib/briefings/content.ts` — current content fixture
- `components/shell/site-header.tsx` — Sheet drawer Deep Dive toggle with lock indicators
- `components/shell/spaces-nav-sections.tsx` — Spaces dropdown "Deep Dive" section
- `app/(public)/docs/layout.tsx`, `app/(public)/our-story/layout.tsx`, `app/(public)/faq/layout.tsx` — sibling gated layouts

**Playwright spec:** `tests/e2e/playbooks/research-and-documentation.spec.ts`

---

### pb2a — Deep Dive: Investment Management

**Description:** IM-pillar briefing for a prospect interested in allocating capital to Odum-managed strategies. Covers four catalogues, SMA vs Pooled, client reporting, FCA regulatory framework, and track record.
**Source:** [`playbooks/02a-research-im.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/02a-research-im.md)
**Personas:** Cold-inbound or warm hand-off prospect (briefings session); after this, `prospect-im` in pb3b
**Route:** `/briefings/investment-management`

**Step-by-step flow:**

1. (Already through pb2 gate)
2. Select IM pillar from hub OR follow sales-sent direct link
3. Read `/briefings/investment-management`:
   - What Odum IM is
   - Four catalogues (Data, Strategy, ML Model, Execution Algo) — filtered to PUBLIC + IM_RESERVED, BACKTESTED+
   - SMA vs Pooled structural choice
   - Client reporting surface (same as will be shown in pb3b)
   - FCA regulatory framework (reg #975797, MiFID II, MLRO)
   - Track record and investor-facing materials
   - Next steps: book demo → `/contact` or `/demo` with IM context
4. Exit: books IM demo → admin provisions `prospect-im` staging account → pb3b

**Playwright spec:** sub-assertions in `tests/playbooks/research-and-documentation.spec.ts`

---

### pb2b — Deep Dive: DART

**Description:** DART-pillar briefing covering data, research, trading, observability, and the signals-only vs full-pipeline fit-check. Prospect learns whether DART fits their operating model and which path (signals-only or full) applies.
**Source:** [`playbooks/02b-research-dart.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/02b-research-dart.md)
**Personas:** Cold-inbound or warm hand-off prospect; after this, `prospect-dart` in pb3c
**Route:** `/briefings/platform`

**Step-by-step flow:**

1. (Already through pb2 gate)
2. Select DART (Platform) pillar from hub OR follow direct link
3. Read `/briefings/platform`:
   - What DART is (infrastructure vs strategy-as-a-service framing)
   - Four catalogues (Data Catalogue — 100+ venues; Strategy Catalogue — 18 archetypes; ML Model Catalogue; Execution Algo Catalogue)
   - Research → Trading lifecycle (8-stage promote pipeline)
   - Your IP vs Odum IP (catalogue lock states enforce this)
   - Observability (real-time health + risk + reconciliation)
   - Fit-check ("Does DART fit you?" — signals-only vs full-pipeline resolution per rule 10)
   - Next steps: book DART demo
4. Exit: books DART demo → admin provisions `prospect-dart` staging account → pb3c

**Playwright spec:** `tests/playbooks/02b-research-dart.spec.ts`

---

### pb2c — Deep Dive: Regulatory Umbrella

**Description:** Reg-Umbrella-pillar briefing for a firm wanting to conduct regulated activity under Odum's FCA umbrella without direct FCA authorisation. Covers umbrella scope, compliance/MLRO services, client reporting, SMA vs Pooled, and regulatory events.
**Source:** [`playbooks/02c-research-regulatory.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/02c-research-regulatory.md)
**Personas:** Cold-inbound or warm hand-off prospect; after this, `prospect-reg` in pb3a
**Route:** `/briefings/regulatory`

**Step-by-step flow:**

1. (Already through pb2 gate)
2. Select Regulatory pillar from hub OR follow direct link
3. Read `/briefings/regulatory`:
   - What the umbrella is (FCA #975797; Odum's permissions cover the firm's declared activities)
   - Activity scope and per-activity licence mapping
   - Compliance, MLRO, supervision bundled
   - Client reporting (explicitly noted: same surface as IM — `/services/reports/*`)
   - SMA vs Pooled (same structural decision as IM)
   - Regulatory events + audit trail (MiFID II trade reporting, best-execution)
   - Next steps: book Reg Umbrella demo → pb3a
4. Investor-relations cross-links: `/investor-relations/regulatory-presentation`, `/investor-relations/disaster-recovery` surfaced here

**Playwright spec:** `tests/playbooks/02c-research-regulatory.spec.ts`

---

### pb3 — Warm-prospect demo on staging (hub)

**Description:** A prospect provisioned with a dedicated staging Firebase demo account explores the services portal scoped to their flavour. The demo is curated — not a tour of everything.
**Source:** [`playbooks/03-warm-prospect-demo.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/03-warm-prospect-demo.md)
**Personas:** `prospect-im` (pb3b), `prospect-reg` (pb3a, TBD), `prospect-dart` (pb3c, TBD)
**Environment:** Staging only (`odum-research.co.uk`)

**Pre-conditions (admin must do first):**

1. Sign in to user-management-ui on staging
2. Create organisation, fund structure (Pooled or SMA), clients with mock API keys
3. Configure entitlements matching the flavour
4. Create user with prospect's email; trigger Firebase password reset
5. Send welcome email with staging URL + credentials

**Three flavours:**

| Flavour           | Persona         | Core difference                                          |
| ----------------- | --------------- | -------------------------------------------------------- |
| pb3a Reg Umbrella | `prospect-reg`  | Reports only unlocked; Reg framing                       |
| pb3b IM           | `prospect-im`   | Reports only unlocked; IM framing (UI identical to pb3a) |
| pb3c DART         | `prospect-dart` | Full 4-catalogue + research + trading + observe unlocked |

**Shared click path:**

1. Email link → `odum-research.co.uk`
2. `/login` (Firebase staging credentials)
3. `/dashboard` (services portal; entitlement-sliced tiles)
4. Navigate per flavour (see pb3a/b/c below)

**Exit state:** Commits → real Firebase production user provisioned → becomes real client. Or refines demo. Or drops → admin deactivates demo user; staging data archived.

**Playwright spec:** `tests/playbooks/warm-prospect-demo.spec.ts` (hub); per-flavour sub-specs at `03a/b/c-*.spec.ts`

---

### pb3a — Demo: Regulatory Umbrella flavour

**Description:** Warm-prospect staging demo framed for a firm wanting to operate under the FCA umbrella. Walk is identical to pb3b; only the sales narrative differs.
**Source:** [`playbooks/03a-demo-reg-umbrella.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/03a-demo-reg-umbrella.md)
**Persona:** `prospect-reg` (TBD); entitlements: `reporting` + optional `investor-relations`
**Environment:** Staging (`odum-research.co.uk`)

**Step-by-step click path:**

1. `/login` (staging Firebase, demo credentials)
2. `/dashboard` — services portal with tiles:
   - Data: LOCKED (`"upgrade to unlock"`)
   - Research: LOCKED
   - Promote: LOCKED
   - Trading: LOCKED
   - Observe: LOCKED
   - **Reports: UNLOCKED (primary surface)**
   - Admin: LOCKED (internal only)
3. `/services/reports/overview`
4. Pooled-vs-SMA picker (admin can lock one, show both, or force choice)
5. Fund creation flow (name fund, select venues, set capital)
6. Client creation flow (name client, generate API keys, optional risk limits)
7. Reports surface — all 12 sub-tabs become available:
   - Overview, Performance, NAV, Invoices, IBOR, Settlement, Reconciliation, Regulatory (MiFID II), Analytics, Trades, Executive, Fund Operations

**Key demo narrative:** "You get all of this reporting for regulatory + client + investor purposes — we've built the plumbing."

**Framing vs pb3b:** Reg Umbrella frame = "you operate, we supervise"; IM frame = "Odum runs strategies, you see allocator view." Same screens.

**Playwright spec:** `tests/playbooks/03a-reg-umbrella.spec.ts`

---

### pb3b — Demo: Investment Management flavour

**Description:** Warm-prospect staging demo for an allocator considering capital allocation to Odum-managed strategies. UI-identical to pb3a; only the narrative framing changes.
**Source:** [`playbooks/03b-demo-im.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/03b-demo-im.md)
**Persona:** `prospect-im` (exists); entitlements: `reporting` + optional `investor-relations`
**Environment:** Staging (`odum-research.co.uk`)

**Step-by-step click path:**

Identical to pb3a. See pb3a above. The only differences are narrative:

| Topic              | pb3a frame                                    | pb3b frame                                                    |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------- |
| Why am I here      | "I need a regulated structure"                | "I'm allocating capital to a manager"                         |
| API keys           | "Your venue keys — you operate, we supervise" | "Identify your allocation for reporting + attribution"        |
| SMA vs Pooled      | "Structure for activity type"                 | "Structure for my allocation"                                 |
| Regulatory reports | "Your MiFID II + transaction reporting"       | "Regulated reports as allocator; fund manager also sees them" |

**Quote from codex:** "investment management (all the same as reg umbrella / coverage same features same reporting)"
([`playbooks/03b-demo-im.md:25`](../../../unified-trading-pm/codex/14-playbooks/playbooks/03b-demo-im.md))

**Playwright spec:** `tests/playbooks/03b-im.spec.ts` (shares helper with 03a)

---

### pb3c — Demo: DART flavour

**Description:** Warm-prospect staging demo for a prospect wanting to build/run strategies on Odum infrastructure. Structurally different from pb3a/b — shows full 4-catalogue surface + research + trading + observation rather than client-reporting only.
**Source:** [`playbooks/03c-demo-dart.md`](../../../unified-trading-pm/codex/14-playbooks/playbooks/03c-demo-dart.md)
**Persona:** `prospect-dart` (TBD); entitlements: `data-pro` + `strategy-full` + `ml-full` + `execution-full` + trading tiers
**Environment:** Staging (`odum-research.co.uk`)

**Step-by-step click path:**

1. `/login` (staging Firebase)
2. `/dashboard` — most services UNLOCKED:
   - Data: UNLOCKED
   - Research: UNLOCKED
   - Promote: UNLOCKED
   - Trading: UNLOCKED
   - Observe: UNLOCKED
   - Reports: optional
   - Admin: LOCKED
3. **1. Data Catalogue** → `/services/data/overview` → instruments / venues / coverage / gaps / processing status
4. **2. Strategy Catalogue** → `/services/strategy-catalogue` → coverage matrix (archetype × category × instrument) / by-combination / blocked (BL-\* codes) / per-archetype detail
5. **3. ML Model Catalogue** → `/services/research/ml` → registry / training runs / governance / monitoring
6. **4. Execution Algo Catalogue** → `/services/execution/overview` → algo library / per-venue applicability / benchmarks / TCA (currently broken per triage)
7. **5. Research iteration** → `/services/research/overview` → quant / signals / features / strategy (backtests, candidates)
8. **6. Promote lifecycle** → `/services/promote/pipeline` → 8 stages: data-validation / model-assessment / risk-stress / execution-readiness / paper-trading / champion / capital-allocation / governance
9. **7. Trading** → `/services/trading/terminal` → terminal / positions + trades / orders / markets / PnL / risk
10. **8. Observation** → `/services/observe/health` → health / alerts / strategy-health / reconciliation / event-audit

**Key demo messages:**

- "All four catalogues are SSOT — same data, same structure, different lenses."
- "Your IP stays yours — Odum IP stays ours — enforced via catalogue lock states."
- "Research → Promote → Trade is one pipeline, not separate tools."

**Catalogue entry visibility:** PUBLIC + CODE_AUDITED+ by default; admin can reveal IM_RESERVED or CODE_NOT_WRITTEN entries.

**Playwright spec:** `tests/playbooks/03c-dart.spec.ts`

---

## Cross-cutting concepts

### Visibility slicing — the core model

Source: [`cross-cutting/visibility-slicing.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md)

The single canonical filter function applied uniformly across all UI surfaces:

```
visible(user, item) :=
    user.role == "admin"
  OR
    (item.audience ⊇ user.role)
    AND (item.entitlement ⊆ user.entitlements)
    AND (item.lock_state is visible to user.role)
    AND (item.maturity ≥ user.role's minimum)
    AND (item.org_scope is null OR item.org_scope == user.org_id)
```

Applied to: service cards on `/dashboard`, tabs in `service-tabs.tsx`, catalogue entries, admin surfaces, sub-pages, data rows.

Three output states per item: `visible | locked-visible | hidden`.

For demo prospects (pb3a/b): unentitled service tiles MUST render as **padlocked with "Contact Odum to enable this service" CTA** (LOCKED-VISIBLE), not hidden. This is an explicit user directive quoted in the codex; the current implementation hides them.

#### Role hierarchy

| Role       | Sees                                 |
| ---------- | ------------------------------------ |
| `admin`    | EVERYTHING — no filtering            |
| `internal` | Full platform, no admin/ops surfaces |
| `client`   | Entitled slice only                  |

#### Entitlements defined in `lib/config/auth.ts`

Base: `data-basic`, `data-pro`, `execution-basic`, `execution-full`, `ml-full`, `strategy-full`, `reporting`, `investor-relations`

Domain (with tiers): `{ domain: "trading-common" | "trading-defi" | "trading-sports" | "trading-options" | "trading-predictions", tier: "basic" | "premium" }`

Wildcard: `"*"` (admin only)

#### Catalogue lock states

`PUBLIC` → `IM_RESERVED` → `CLIENT_EXCLUSIVE` → `RETIRED`

External visibility: PUBLIC only (unless per-client override). Admin sees all.

#### Catalogue maturity ladder

`CODE_NOT_WRITTEN` → `CODE_WRITTEN` → `CODE_AUDITED` → `BACKTESTED` → `PAPER_TRADING` → `PAPER_TRADING_VALIDATED` → `LIVE_TINY` → `LIVE_ALLOCATED`

External threshold: `BACKTESTED` and later.

### Access scoping summary

| Persona                   | Services portal                         | Catalogues                                                 | Admin | IR       |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------- | ----- | -------- |
| `admin`                   | All unlocked                            | All (all lock states, all maturity)                        | Yes   | Yes      |
| `internal-trader`         | All except admin                        | All PUBLIC + internal                                      | No    | No       |
| `prospect-im`             | Reports only (others padlocked-visible) | PUBLIC + IM_RESERVED, BACKTESTED+                          | No    | Optional |
| `prospect-reg`            | Reports only (others padlocked-visible) | PUBLIC only, BACKTESTED+                                   | No    | Optional |
| `prospect-dart` (signals) | DART services; Research locked-visible  | PUBLIC only, BACKTESTED+, Block 6 locked                   | No    | No       |
| `prospect-dart` (full)    | DART services all unlocked              | PUBLIC + CODE_AUDITED+, no other clients' CLIENT_EXCLUSIVE | No    | No       |
| `client-full`             | Full DART + reports                     | PUBLIC, BACKTESTED+, client's own CLIENT_EXCLUSIVE         | No    | Optional |
| `client-data-only`        | Signals/data service only               | PUBLIC, BACKTESTED+, in scope                              | No    | No       |
| `investor` / `advisor`    | `/investor-relations/*` only            | None                                                       | No    | Yes      |

### Four catalogues — parallel surfaces

Source: [`cross-cutting/catalogues.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/catalogues.md)

All four follow the same UI pattern (overview / coverage / by-combination / per-entry / admin). Strategy Catalogue is the only fully shipped instance.

| Catalogue      | UI route                        | Backend SSOT                                                                     | Status                         |
| -------------- | ------------------------------- | -------------------------------------------------------------------------------- | ------------------------------ |
| Strategy       | `/services/strategy-catalogue/` | `archetype_build_registry.py` + UAC `strategy_availability/`                     | Shipped (Phase 10)             |
| Data           | `/services/data/`               | `instruments-service` + `market-tick-data-service` + UAC capability declarations | Fragmented — needs unification |
| ML Model       | `/services/research/ml/`        | `unified-trading-library/ml/`                                                    | Fragmented — needs SSOT audit  |
| Execution Algo | `/services/execution/`          | `execution-service/algo_library/`                                                | Fragmented — needs SSOT audit  |

Dependency DAG: Data → ML Model → Strategy; Data → Execution Algo → Strategy.

### Client reporting — shared surface

Source: [`cross-cutting/client-reporting.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/client-reporting.md)

`/services/reports/*` is the ONE client-reporting surface shared by pb3a (Reg Umbrella demo) and pb3b (IM demo). Same code, same features, same data. Only narrative framing differs.

12 sub-routes: overview, performance, nav, invoices, ibor, settlement, reconciliation, regulatory, analytics, trades, executive, fund-operations.

Note: per the static audit, 9 of 12 `reports/*` pages have no direct inbound link — tab-only. Phase 3 wires them into a sub-nav pattern.

### Fund / Org / Client hierarchy

Source: [`cross-cutting/fund-org-hierarchy.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/fund-org-hierarchy.md)

```
Organisation (org)
    → Fund (Pooled or SMA)
        → Client
            → API keys (per client, per venue — never shared)
```

Provisioning is admin-only through user-management-ui (separate from unified-trading-system-ui — may never be publicly deployed).

### SMA vs Pooled

Source: [`cross-cutting/sma-vs-pooled.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/sma-vs-pooled.md)

Both pb3a and pb3b begin with the SMA vs Pooled picker. The choice is presented as irreversible in the demo (migration requires redemption + new-fund-creation). Pooled = one fund, multiple share-class clients; SMA = one fund per client with full position/API isolation.

### Demo restriction profiles

Source: [`demo-ops/demo-restriction-profiles.md`](../../../unified-trading-pm/codex/14-playbooks/demo-ops/demo-restriction-profiles.md)

Six dimensions per profile: commercial path, block set, venue/chain/instrument-type scope, strategy-family scope, maturity filter, demo mode. Five standard profiles: IM allocator, Reg Umbrella, signals-only DART, full DART, combined (Reg Umbrella + signals DART). A reporting-only profile also exists.

### Demo modes (DART)

Source: [`demo-ops/dart-demo-modes.md`](../../../unified-trading-pm/codex/14-playbooks/demo-ops/dart-demo-modes.md)

Three modes orthogonal to the restriction profile: **broader-platform** (60 min; wider scope, shallower depth), **turbo** (45 min; narrower scope, deeper), **deep-dive** (45–60 min; one surface, end-to-end). Default: broader-platform for pb3c first-look, turbo for pb3b IM, deep-dive for pb3a Reg Umbrella.

### Admin permissions model

Source: [`cross-cutting/admin-permissions.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/admin-permissions.md)

10 named permissions in Firebase custom claim `admin_permissions[]`: `grant_role`, `create_org`, `lock_strategy`, `impersonate`, `rotate_secret`, `modify_user`, `offboard_user`, `view_audit`, `manage_apps`, `manage_entitlements`. Bootstrap admins (`ikenna@odum-research.com`, `femi@odum-research.com`) carry the full set implicitly. New scoped admins must have the claim explicitly set.

Runtime gate: `lib/auth/admin-permissions.ts` exports `hasAdminPermission(user, permission)`.

### Three-environment model

| Environment | URL                                                   | Auth                                          | Purpose                       |
| ----------- | ----------------------------------------------------- | --------------------------------------------- | ----------------------------- |
| Local dev   | `localhost:3100` (UI-only) / `localhost:3000` (T1/T2) | Demo auth default; Firebase optional          | Development                   |
| Staging     | `odum-research.co.uk`                                 | Firebase staging project (isolated from prod) | Prospect demos + internal dev |
| Production  | `odum-research.com`                                   | Firebase `central-element-323112`             | Real clients, real capital    |

### Three-tier auth model

1. **Light auth** (pb2) — questionnaire-as-access-path (since 2026-04-25) + secondary code-entry disclosure. `localStorage.odum-briefing-session`. No Firebase. Code rotates every 90 days or when prospect leaves funnel.
2. **Firebase staging** (pb3) — per-prospect demo account in staging Firebase project. Full JWT + entitlements.
3. **Firebase production** (real clients) — production Firebase. Real JWT + entitlements + org_id custom claims.

### Navigation surfaces

Two nav surfaces for public marketing (do not share code):

- **Site-header Sheet drawer** (`components/shell/site-header.tsx`) — every public page; "Deep Dive" collapses behind a toggle; amber lock on unauthenticated Deep Dive items
- **Spaces dropdown** (`components/shell/spaces-nav-sections.tsx`) — in-app playbook switcher on signed-in surfaces; authoritative top-nav SSOT for signed-in state

Per-service tab bars: `components/shell/service-tabs.tsx` (one const per service: `DATA_TABS`, `BUILD_TABS`, `STRATEGY_SUB_TABS`, `STRATEGY_CATALOGUE_SUB_TABS`, `TRADING_TABS`, `OBSERVE_TABS`, `MANAGE_TABS`, `REPORTS_TABS`, `ADMIN_TABS`, `EXECUTE_TABS`, `ML_SUB_TABS`).

### Same-system principle (rule 03)

The UI component tree is the same for all audiences. What changes is what `visible(user, item)` returns, not which components exist. Audience-prefixed route patterns (`/im-reporting/*`, `/dart-reporting/*`) are rule-03 violations.

---

## Observations (factual only)

### Well-defined

- The persona × playbook × environment matrix is complete and internally consistent
  ([`audiences-and-journeys.md`](../../../unified-trading-pm/codex/14-playbooks/audiences-and-journeys.md))
- pb3a and pb3b are explicitly documented as UI-identical; the codex is unambiguous about this
- The visibility slicing rule `visible(user, item)` is formally stated and the four slicing dimensions are enumerated
- The admin-permissions model (10 named permissions) is fully specified with a runtime gate
- The three-environment model and three-tier auth model are clearly separated
- Strategy Catalogue is fully shipped (Phase 10); the other three catalogues are acknowledged as fragmented
- The demo restriction profiles for all five commercial paths are defined with explicit block sets and maturity filters
- The route mapping (`implementation-mapping/route-mapping.md`) pins every experience walkthrough beat to a named route
- The 177-route page triage matrix exists (`page-triage/triage-matrix.md`) — not read in full here

### Stubbed or deferred

- `prospect-reg` and `prospect-dart` persona fixtures do not yet exist in `lib/auth/personas.ts`
  ([`implementation-mapping/persona-and-user-prototype-mapping.md:28`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md))
- `prospect-dart` may split into `prospect-dart-signals-only` / `prospect-dart-full` — decision deferred to Stage 3E
- Real client — Reg Umbrella has no dedicated persona (TBD noted in `audiences-and-journeys.md:29`)
- Data Catalogue, ML Model Catalogue, Execution Algo Catalogue UI surfaces are "fragmented — needs unification" (roadmap items)
- 9 of 12 `/services/reports/*` sub-pages have no direct inbound link — tab-only; Phase 3 wires them
- Fund/client `fund_id` and `client_id` claims not yet in Firebase JWT — requires extra API roundtrip for filtering
- The SMA vs Pooled picker location within the UI is TBD (dashboard modal vs inside `/services/reports/overview`)
- Experience docs pb1, pb2, pb2b, pb2c, pb3, pb3a, pb3b, pb3c in `experience/` — only `im-decision-journey.md` is explicitly marked "canonical reference"; others are described as "Stage 2" deliverables

### UI surfaces referenced by name in playbooks that may not exist yet

- **LOCKED-VISIBLE service tiles** (padlock icon + "Contact Odum to enable this service" CTA) — required by pb3a/pb3b per explicit user directive; current implementation hides unentitled services instead of showing them as locked
  ([`playbooks/03a-demo-reg-umbrella.md:87`](../../../unified-trading-pm/codex/14-playbooks/playbooks/03a-demo-reg-umbrella.md), [`cross-cutting/visibility-slicing.md`](../../../unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md))
- **Dashboard 5-tile grid + sub-route chips** — `lib/auth/persona-dashboard-shape.ts` → `personaDashboardShape()` + `personaDashboardSubRoutes()`; referenced in `visibility-slicing.md` addendum but may be a pending deliverable
- **TCA (Transaction Cost Analysis)** under Execution Algo Catalogue — explicitly noted "currently broken — see triage"
  ([`playbooks/03c-demo-dart.md:63`](../../../unified-trading-pm/codex/14-playbooks/playbooks/03c-demo-dart.md))
- **`/strategy-evaluation`** DDQ route — referenced as the mandatory gate before the Sandbox demo; not reviewed in triage here
- **`/demo`** and `/demo/admin` — pb3 hub and admin pane routes referenced in route-mapping but not in the impl-layer `playbooks/` doc (which routes to `/dashboard` as demo landing)
  ([`implementation-mapping/route-mapping.md:95`](../../../unified-trading-pm/codex/14-playbooks/implementation-mapping/route-mapping.md))
- **`/services/regulatory/transaction-reporting`**, `/services/regulatory/best-ex-evidence`, `/services/regulatory/supervisory-artifacts` — pb3a walkthrough routes in route-mapping; not confirmed to exist as distinct pages
- **`/services/investment-management/nav`**, `/services/investment-management/fees` — pb3b walkthrough routes in route-mapping; existence unconfirmed
- **`/services/strategy-catalogue/promote`** — pb3c promote-pipeline ledger route

### Anything surprising

- pb3a and pb3b are literally identical at the UI/route level — the entire distinction is the verbal framing on a sales call. The codex documents this explicitly and repeatedly as a feature, not a gap.
- The questionnaire (pb2 Channel A) now IS the access path as of 2026-04-25, not a pre-requisite to receiving a code from sales — a structural change to the funnel that inverts the prior model.
- The briefings content is currently loaded from `lib/briefings/content.ts` (JSON fixtures), not from the codex. The target is codex transclusion or CMS; this gap is acknowledged but not yet scheduled.
- Investor Relations (`/investor-relations/*`) is explicitly NOT for demo prospects — it is for Odum's own investors and advisors. Any UI that surfaces IR links to prospects is out of scope for playbook compliance.
- The `prospect-dart` entitlement for signals-only carries Block 6 as LOCKED-VISIBLE (not HIDDEN-ENTIRELY), meaning the research/promote surface must be visible but padlocked — consistent with the broader LOCKED-VISIBLE vs HIDDEN-ENTIRELY discipline that runs through the whole playbook.
