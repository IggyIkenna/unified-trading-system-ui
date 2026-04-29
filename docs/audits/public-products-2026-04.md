# Public-Facing Products — Inventory 2026-04

Scope: `app/(public)/` route group only. The authenticated app (`(platform)/`, `(ops)/`) is covered by `system-inventory-2026-04.md`.

---

## Public pages overview

| Path                      | File                                                                                  | Purpose                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/`                       | `app/(public)/page.tsx` + `_home-client.tsx`                                          | Homepage: hero, markets universe, 3 engagement-route cards, why-Odum, 7-step journey, governance, final CTA |
| `/investment-management`  | `app/(public)/investment-management/page.tsx`                                         | Full service page for Odum-Managed Strategies (Product 1)                                                   |
| `/platform`               | `app/(public)/platform/page.tsx`                                                      | Full service page for DART Trading Infrastructure (Product 2)                                               |
| `/regulatory`             | `app/(public)/regulatory/page.tsx`                                                    | Full service page for Regulated Operating Models (Product 3)                                                |
| `/briefings`              | `app/(public)/briefings/page.tsx`                                                     | Gated hub; routes visitors to one of 3 pillar briefings                                                     |
| `/briefings/[slug]`       | `app/(public)/briefings/[slug]/page.tsx`                                              | Individual briefing pages (dynamic route)                                                                   |
| `/questionnaire`          | `app/(public)/questionnaire/page.tsx`                                                 | 6-axis prospect form; ungated; issues access code on submit                                                 |
| `/start-your-review`      | `app/(public)/start-your-review/page.tsx` + `_client.tsx`                             | Primary entry-point CTA landing; leads into questionnaire                                                   |
| `/strategy-evaluation`    | `app/(public)/strategy-evaluation/page.tsx` + `_client.tsx` + `_allocator-wizard.tsx` | Structured DDQ for prospects with existing strategies                                                       |
| `/strategy-review`        | `app/(public)/strategy-review/page.tsx` + `_client.tsx`                               | Pre-demo review form                                                                                        |
| `/demo`                   | `app/(public)/demo/page.tsx`                                                          | Demo-booking page                                                                                           |
| `/demo-session`           | `app/(public)/demo-session/page.tsx` + `_client.tsx`                                  | Demo session surface                                                                                        |
| `/signup`                 | `app/(public)/signup/page.tsx` + components                                           | Service-selection and onboarding/contact-capture wizard                                                     |
| `/login`                  | `app/(public)/login/page.tsx`                                                         | Firebase auth sign-in                                                                                       |
| `/pending`                | `app/(public)/pending/page.tsx`                                                       | Post-signup holding page while account is under review                                                      |
| `/contact`                | `app/(public)/contact/page.tsx`                                                       | 4-track contact page (general / existing client / press / advisor) with Calendly fit-call options           |
| `/docs`                   | `app/(public)/docs/page.tsx`                                                          | Developer documentation: 4 catalogues, 3 integration paths, UAC facades, planned API reference              |
| `/story`                  | `app/(public)/story/page.tsx`                                                         | 2-column editorial: 5-para essay + dated timeline 2011–2026                                                 |
| `/our-story`              | `app/(public)/our-story/page.tsx`                                                     | Gated (BriefingAccessGate) long-form founder narrative rendered from `our-story.html`                       |
| `/who-we-are`             | `app/(public)/who-we-are/page.tsx`                                                    | Firm identity page rendered from `who-we-are.html`                                                          |
| `/faq`                    | `app/(public)/faq/page.tsx`                                                           | FAQ rendered from `faq.html`                                                                                |
| `/briefings` (layout)     | `app/(public)/briefings/layout.tsx`                                                   | BriefingAccessGate wrapper for all `/briefings/*` routes                                                    |
| `/privacy`                | `app/(public)/privacy/page.tsx`                                                       | Privacy policy (inline, last updated March 2026)                                                            |
| `/terms`                  | `app/(public)/terms/page.tsx`                                                         | Terms of service                                                                                            |
| `/regulatory` layout note | same as product page above                                                            | —                                                                                                           |

---

## The 4 products

The platform surfaces **4 commercial products**. The current homepage and main nav consolidate them into **3 public engagement routes** (Odum-Managed Strategies, DART Trading Infrastructure, Regulated Operating Models); "Odum Signals" is the 4th product but as of 2026-04 it is **not presented as a standalone top-level route on the public marketing site** — it is folded into DART as a capability mode (DART Mode 03: Odum-provided signals). It remains distinct in legal/admin/signup surfaces.

---

### Product 1 — Odum-Managed Strategies

**Marketing label:** `Odum-Managed Strategies`
**Legal label:** `Investment Management`
**Slug:** `investment`
**Route:** `/investment-management`
**Source file:** `app/(public)/investment-management/page.tsx`

**Description (platform's own words):**

> "Odum acts as investment manager for selected systematic strategies available to eligible clients through SMA or fund-route structures where appropriate. Strategies may be developed by Odum, shaped with partners, or operated through Odum's infrastructure where the structure, governance, and risk controls are suitable."

Homepage card summary: "Allocate capital to selected systematic strategies managed by Odum."

**Key features / what's included:**

- Exposure to selected systematic strategies (Odum is investment manager)
- Available through SMA or pooled-fund route structures where appropriate
- Reporting, oversight, and governance around the mandate
- 4-stage strategy selection process: Research → Testing → Live readiness → Mandate review
- Mandate terms reviewed case by case; fees, hurdles, crystallisation timing agreed at signing (not quoted publicly)
- Reporting scoped to the client, mandate, fund interest, or account

**Eligibility (for / not for):**

For:

- Eligible allocators seeking managed exposure to systematic strategies
- Clients wanting an Odum-managed route rather than direct platform operation
- SMA or fund-route structuring

Not for:

- Retail access
- Self-serve trading tools
- Generic fund launch services
- Clients looking only for raw data or software access

**What the Strategy Evaluation asks (allocator path):**

- Investor profile and risk appetite (target Sharpe, max drawdown)
- Allowed venues and geographies; instrument-type restrictions
- Leverage caps and SMA exchange-fee preferences
- Performance criteria and return horizon
- Capital scaling timeline and deployment preference
- Structure interest (SMA / pooled fund / unsure) and reporting cadence

**Target persona:** Allocator — institutional or professional client evaluating allocation to systematic strategies. Persona is preference-shaped: "We don't ask for your methodology or track record: we ask what fits your mandate." (line 237, investment-management/page.tsx)

**Signup data description (from `signup-data.ts` line 14–18):**

> "FCA-authorised managed strategies. SMA or pooled-fund allocation with full reporting and oversight."

**Mapping to internal capabilities:** Connects to the authenticated strategy catalogue (lock state `IM_RESERVED` and `CLIENT_EXCLUSIVE` entries visible to IM clients), fund/share-class hierarchy in the org model, and the signed-in allocator/onboarding surfaces. Referenced in `/docs` under "Path B: Full pipeline" for the research-to-execution stack that underlies allocated strategies.

---

### Product 2 — DART Trading Infrastructure

**Marketing label:** `DART Trading Infrastructure`
**Legal label:** `DART`
**Slug:** `platform`
**Route:** `/platform`
**Source file:** `app/(public)/platform/page.tsx`

**Description (platform's own words):**

> "DART is the infrastructure layer behind Odum's systematic trading activity, available to selected clients who need a controlled path from research to execution, monitoring, and reporting."

Meta description (line 29, platform/page.tsx): "DART is the infrastructure layer behind Odum's systematic trading activity, available to selected clients who need a controlled path from research to execution, monitoring, and reporting."

**Three capability modes (DART_MODES, lines 86–129):**

| Mode    | Direction pill       | Title                               | One-line                                                                                                                                         |
| ------- | -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mode 01 | Client → Odum        | Client-provided signals             | "Keep research and signal generation on your own infrastructure. Odum runs execution, reconciliation, monitoring, and reporting."                |
| Mode 02 | Research → Execution | Full research-to-execution workflow | "Use more of the DART stack: research and testing through to live trading and observation in one controlled workflow."                           |
| Mode 03 | Odum → Counterparty  | Odum-provided signals               | "Where appropriate, DART can deliver Odum-generated signals to counterparties or clients who execute through their own approved infrastructure." |

**Mode 01 bullets:**

- Your research stack stays with your team
- Odum receives structured trading instructions
- Execution, positions, reconciliation, and reporting run through DART

**Mode 02 bullets:**

- Research, testing, promotion, and live trading in one workflow
- Shared monitoring and reporting across the engagement
- Suited to integrated operating models

**Mode 03 bullets:**

- Signals delivered under an agreed scope
- Execution stays with the counterparty
- Reporting and acknowledgement workflows agreed case by case

**Mode 02 differentiator (Full vs Signals-In):**

What Full unlocks beyond Signals-In (lines 237–249):

- Rich data sources (granular tick + book + on-chain + alternative)
- Research environment for backtest, paper, and promotion-ladder workflows
- Test fee, treasury, risk, liquidation, and rebalancing assumptions on the most granular data
- Live execution + post-trade analytics + reconciliation + treasury observability
- Paper trading alongside live, with delivery health and ack flows
- Live performance vs backtest tracking on a T+1 basis

**Dashboard and API access:** Day-to-day work in the authenticated platform scoped to the agreed engagement. Selected workflows accessible programmatically where available; detailed docs in gated or signed-in area.

**Target persona:** Builder / trading team. Quote from `/briefings` hub (line 95–99): "Start with DART Trading Infrastructure if you want to run, execute, monitor, or report a strategy through Odum's stack." Also maps to: quants / systematic desks (full pipeline path); asset managers / trading desks (execution-only path). Per `/docs` page, DART covers three integration paths: Signals-In (Path A), Full pipeline (Path B), Execution-only (Path C).

**Signup data description (from `signup-data.ts` line 22–26):**

> "Data, research, execution, reconciliation, reporting: the full trading lifecycle on one platform."

**Mapping to internal capabilities:** DART is the same infrastructure Odum uses for its own capital. The authenticated app's strategy catalogue, ML model catalogue, data catalogue, and execution algo catalogue all sit within the DART operating surface. The `/docs` page cross-references UAC facades (`market`, `instruction`, `execution`, `position`, `strategy`, `features`, `prediction`, `sports`) as the stable public schema.

---

### Product 3 — Regulated Operating Models

**Marketing label:** `Regulated Operating Models`
**Legal label:** `Regulatory Umbrella`
**Slug:** `regulatory`
**Route:** `/regulatory`
**Source file:** `app/(public)/regulatory/page.tsx`

**Description (platform's own words):**

> "Some trading engagements need more than technology. Odum can help selected clients structure an appropriate operating model around governance, reporting, counterparties, permissions, and regulatory responsibilities."

Coverage is: "reviewed case by case. The right route depends on who manages the strategy, who faces the client, where the capital sits, and what approvals or affiliate arrangements are required." (lines 108–110, regulatory/page.tsx)

Homepage card summary: "Where the engagement requires it, Odum can help structure the operating model around governance, reporting, and permissions."

**What this route covers:**

- SMA arrangements, Odum-managed mandates, affiliate fund pathways, supervisory reporting, or other approved arrangements
- In some cases the structuring layer is the main engagement; in others it sits alongside an Odum-managed strategy or DART mandate

**When it matters (for clients who need to):**

- Operate a strategy under a clearer governance framework
- Separate trading activity across mandates, funds, or accounts
- Evidence reporting, oversight, and audit trails
- Use Odum's infrastructure while maintaining appropriate controls
- Assess whether SMA, fund route, affiliate pathway, or regulated arrangement is suitable

**Structure axes reviewed by Odum (lines 82–89):**

- Who owns or originates the strategy
- Who is expected to manage or supervise it
- Where the capital will sit
- What reporting and oversight are required
- Which counterparties, custodians, venues, or affiliates are involved
- Whether Odum, the client, or an affiliate should carry the relevant role

**Custody note (lines 219–230):** "Odum does not present regulated operating models as a custody service." Custody, brokerage, exchange, or fund-administration arrangements structured through the appropriate account, custodian, venue, broker, administrator, or affiliate route.

**Target persona:** Governance / regulated structure. Per `/briefings` hub (line 105–113): "Read Regulated Operating Models alongside the relevant route if the engagement needs FCA cover, reporting oversight, SMA/fund structuring, or an affiliate pathway."

**Signup data description (from `signup-data.ts` line 36–39):**

> "FCA Appointed Representative or advisory structure for algo trading firms."

**Signup wizard detail (`signup-data.ts` lines 45–119):** The self-serve onboarding wizard for this product (one of only two that supports it, alongside Investment Management) captures:

- Engagement type: Appointed Representative (AR) or Advisory
- Regulated activities: Dealing as Agent, Arranging, Making Arrangements, Managing Investments (SMA only)
- Add-ons: Compliance Monitoring, AML Monitoring, P&L & Client Reporting
- Fund options: Crypto Spot Fund (FCA + EU ESMA) or Derivatives & Traditional Markets Fund (EU ESMA)

**Questionnaire branch:** The 6-axis questionnaire gains 7 additional axes when `service_family = RegUmbrella | combo`: licence region, entity jurisdiction, operating currencies, own-MLRO preference, and 3-month / 1-year / 2-year targets.

**Mapping to internal capabilities:** The regulatory surface shares the same report-generation code path as Investment Management (`GET /v1/reports/*`); per `/docs` page (line 836–838): "the report surface is shared between Investment Management and the Regulatory Umbrella: the narrative differs, the code path does not."

---

### Product 4 — Odum Signals

**Marketing label (public):** `DART signals capability` (folded into DART on public site)
**Marketing label (legal):** `Odum Signals`
**Legal label:** `Odum Signals`
**Slug:** `signals`
**Route:** No standalone public marketing page as of 2026-04; DART Mode 03 (`/platform`) covers it publicly.
**Source files:** `lib/copy/service-labels.ts` (lines 43–49), `app/(public)/signup/components/signup/signup-data.ts` (lines 27–33), `app/(public)/our-story/page.tsx` (line 66–69), `app/(public)/docs/page.tsx` (line 386–390)

**Description (platform's own words):**

From `signup-data.ts` (lines 30–33):

> "Odum-generated signals delivered to your own execution stack via webhook or REST pull."

From `/our-story` related links (line 68): "our signals, your execution stack."

From `/docs` page under Path C (Execution-only), framed as `signals-out` path (lines 118–124):

> "Where appropriate, DART can deliver Odum-generated signals to counterparties or clients who execute through their own approved infrastructure."

From `/docs` roadmap (lines 893–896): The "Odum Signals marketplace" is listed as a planned feature: "Subscribing to Odum Signals under a licence, without needing full execution on our infrastructure."

**Key features / what's included:**

- Odum-generated signals delivered via webhook or REST pull
- Execution stays with the counterparty / client's own infrastructure
- Signals delivered under an agreed scope
- Reporting and acknowledgement workflows agreed case by case

**Target persona:** Counterparties or asset managers / trading desks who already have execution infrastructure and want to license Odum's signals rather than use DART for execution. Per `/docs` Path C: "Asset managers, trading desks. You already have strategies; you want execution + TCA." (This slightly conflates execution-only with signals-out — the `/docs` page bundles both under Path C.)

**Signup data note:** In `signup-data.ts` (line 8), Odum Signals appears as the 3rd of 4 cards in the `/signup` service-selection step. Comment on line 44 states: "DART and Signals onboarding is post-demo and handled via the GenericSignup email-capture flow → user-management-api provisions after account mapping." It does NOT support the self-serve onboarding wizard.

**Mapping to internal capabilities:** The `service-labels.ts` SSOT comment (lines 14–18) is explicit: "Public marketing collapses Odum Signals into DART Trading Infrastructure as a capability; the `signals` service path remains distinct in signup/contract surfaces." The legal slug `signals` still routes in `/signup?service=signals` and is recognised by the `mapSignupServiceToQuestionnaire` function (line 135, `signup-page-content.tsx`) which maps it to the `DART` questionnaire branch.

---

## Other public pages

| Route                  | Purpose                                                                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/briefings`           | Gated hub (access-code gate) routing to 3 canonical briefing pillars — investment-management, dart-trading-infrastructure, regulated-operating-models                                                                                               |
| `/briefings/[slug]`    | Individual gated briefings; old slugs (`platform`, `dart-full`, `dart-signals-in`, `signals-out`, `regulatory`) 301-redirect to canonical slugs                                                                                                     |
| `/questionnaire`       | 6-axis (+ 7 RegUmbrella) prospect questionnaire; ungated; issues access code via Resend email on submit; persists to Firestore                                                                                                                      |
| `/start-your-review`   | Primary CTA page; primary homepage button target; leads into questionnaire funnel                                                                                                                                                                   |
| `/strategy-evaluation` | Structured DDQ (allocator wizard + path-specific questions) for existing strategies; requires questionnaire to be on file                                                                                                                           |
| `/strategy-review`     | Tailored pre-demo review form; prospect-specific                                                                                                                                                                                                    |
| `/demo`                | Demo-booking page                                                                                                                                                                                                                                   |
| `/demo-session`        | Demo session surface                                                                                                                                                                                                                                |
| `/signup`              | Service-selection → onboarding wizard (Investment Management / Regulatory) or email-capture (DART / Signals, post-demo)                                                                                                                             |
| `/login`               | Firebase-backed sign-in page                                                                                                                                                                                                                        |
| `/pending`             | Post-signup holding page: pending_approval / rejected / active-but-no-access states                                                                                                                                                                 |
| `/contact`             | 4 contact tracks: General, Existing client (→ /login), Press/partnerships, Advisor/referral; Calendly fit-call options per route; contact form backed by Firestore + Resend                                                                         |
| `/docs`                | Developer documentation: 4 catalogues (Data, Strategy, ML, Execution Algo), 3 integration paths (Signals-In, Full pipeline, Execution-only), 12 UAC facades, planned REST API reference (all endpoints marked "Planned v1 REST"); access-code gated |
| `/story`               | Editorial 2-column: 5-paragraph founding essay + dated timeline rail (2011–2026) + key facts (FCA FRN 975797, London HQ, Professional/Eligible Counterparty scope)                                                                                  |
| `/our-story`           | Long-form gated founder narrative rendered from static `our-story.html`; BriefingAccessGate applies                                                                                                                                                 |
| `/who-we-are`          | Firm identity, team context; rendered from static `who-we-are.html`                                                                                                                                                                                 |
| `/faq`                 | FAQ rendered from static `faq.html`                                                                                                                                                                                                                 |
| `/privacy`             | Privacy policy (inline React; last updated March 2026; references MiFID II 5-year retention, GDPR rights)                                                                                                                                           |
| `/terms`               | Terms of service (file exists; not read in full)                                                                                                                                                                                                    |

---

## Observations (factual only)

### Product count vs homepage presentation

The platform has 4 commercial products in the signup/legal layer (`investment`, `platform`/DART, `signals`, `regulatory`) but the current homepage and public marketing nav present **3 engagement routes**. Odum Signals was consolidated into DART Trading Infrastructure as "Mode 03: Odum-provided signals" at some point around 2026-04-26 per comments in `service-labels.ts` and plan references in `platform/page.tsx`. The `/our-story` page (line 66) still links to `/signals` as a named route, which no longer has a dedicated public page.

### Odum Signals has no public product page

There is no `app/(public)/signals/` directory. Visitors reaching `/signals` from the `/our-story` related-links section would hit a 404 or the `not-found.tsx` handler unless a redirect exists in `next.config.mjs`. The signup surface at `?service=signals` still works and is explicitly handled.

### Signup service-selection card ordering

`signup-data.ts` (line 7, comment "four-path nav") lists 4 products as cards in the `/signup` service selector: Investment Management, DART, Odum Signals, Regulatory Umbrella. This is the only public surface where all 4 products are simultaneously visible as peers.

### Static HTML files vs React composition

Several public pages (`who-we-are`, `faq`, `our-story`) are rendered via `<MarketingStaticFromFile file="*.html" />` (shadow-DOM pattern) rather than typed React components. The homepage (`/`) was migrated from this pattern to full React in the `marketing_site_three_route_consolidation_2026_04_26` plan Phase 3 (noted in `page.tsx` line 8–9). The 3 service pages (`/investment-management`, `/platform`, `/regulatory`) are also fully React-composed. The static files remain for narrative-heavy pages.

### Briefings are the gated depth layer

All detailed product mechanics are explicitly withheld from public pages. Comments in each service page (`investment-management/page.tsx` lines 22–33, `platform/page.tsx` lines 21–25, `regulatory/page.tsx` lines 22–31) list specific copy that MUST NOT appear publicly (e.g., "eight-field schema", "same codebase / partitioned views", "client-exclusivity applies", "maturity ladder detail", "AR registration timing"). That material lives in `/briefings/[slug]`, which requires an access code obtained via the questionnaire.

### API reference is fully planned/not live

The `/docs` page prominently labels all 4 API reference entries as "Planned v1 REST." The page itself notes: "A versioned public REST and WebSocket API, an OpenAPI spec, and first-party Python / TypeScript SDKs are on the roadmap." The catalogue UIs behind sign-in are described as "the source of truth for what the platform exposes today."

### Engagement funnel is 7 steps, tightly controlled

All 3 product pages and the homepage share the same 7-step process strip: Start Your Review → Briefings → Fit call → Strategy Evaluation → Strategy Review → Platform walkthrough → Commercial Tailoring. Pricing is not quoted on any public page; fees are described as "agreed in the relevant mandate pack, reviewed case by case."

### FCA regulatory details are consistent

FCA authorisation FRN 975797 appears consistently across hero (homepage proof row), `/story` key facts, `/contact` registered-office card, and `/regulatory` badges. Authorisation date stated as 2023 throughout. Address: 9 Appold Street, London EC2A 2AP.

### Questionnaire drives access gating

The `/questionnaire` page is the only ungated path to the briefings hub. On submit, `setBriefingSessionActive()` unlocks `/briefings/*` in that browser; the emailed access code covers return visits on other browsers. The questionnaire persists to Firestore and resolves a persona (via `resolvePersonaFromQuestionnaire`). The `?service=` query param pre-selects a service family branch including the Reg-Umbrella extra axes.

### Demo/self-serve asymmetry

Only `investment` and `regulatory` support the full self-serve onboarding wizard (document upload, declarations, KYC). `platform` and `signals` are explicitly post-demo: "Account provisioning for DART and Odum Signals happens post-demo." (generic-signup.tsx lines 156–159).
