You are refactoring the current website and platform structure for a unified institutional trading business.

Assume this is a fresh prompt with no prior context.

Do NOT redesign the whole product from scratch in one pass.
Do NOT try to fully implement every service in detail yet.
Your job in this first pass is to create the structural foundation that all later prompts will build on.

This foundation must do two things:

1. Refactor the current website/app structure into a clearer, more coherent, role-based architecture
2. Create a clear root-level “must read” vision/context document so all future work can stay aligned with the broader product and commercial vision

This task should be achievable in one bounded implementation pass.

--------------------------------------------------
1. WHAT THIS COMPANY / PLATFORM IS
--------------------------------------------------

This is not just a website.
It is a unified institutional platform and commercial website for a firm offering multiple connected services around:
- data
- research
- model and signal development
- execution analytics and execution
- trading operations and monitoring
- reporting / invoicing / settlement
- investment management and client servicing
- internal admin / onboarding / deployment / audit

The key idea is:
the same system supports:
- prospective users exploring services
- clients using paid or permissioned services
- internal operators using richer versions of the same tools

The experience must feel unified across all three.

This is not a collection of unrelated dashboards.
It is one firm, one platform, one operating model, with different access levels.

--------------------------------------------------
2. DESIGN / PRODUCT DOCTRINE
--------------------------------------------------

The platform should feel:
- institutional
- dark
- premium
- calm
- operator-grade
- client-trustworthy
- better than generic SaaS admin tools
- better than clunky fund admin portals
- more coherent than disconnected internal tools

The core problem we are solving is not just visual polish.
It is information architecture:
- who sees what
- where things live
- how users understand what stage they are in
- how marketing, service discovery, and actual workflows align

Use a dark institutional design language:
- premium dark palette
- dense but elegant information hierarchy
- strong status / provenance / identity cues
- unified shell logic
- clear role-based access boundaries
- calm but high-end feel

--------------------------------------------------
3. CORE UX / WORKFLOW MODEL TO ALIGN TO
--------------------------------------------------

Do NOT use arbitrary service language like “research build analyse explore” unless it clearly maps to the actual product model.

The system should align with the broader lifecycle / workflow model we use:

Design → Simulate → Promote → Run → Monitor → Explain → Reconcile

This lifecycle should influence how the website describes services and how authenticated product areas are grouped.

The user should understand, from public marketing down into product usage, what stage they are in and what they are doing.

Examples:
- Design / Simulate = building, testing, configuring, comparing
- Promote = selecting candidates and preparing them for deployment review
- Run / Monitor = live operations, trading, oversight
- Explain / Reconcile = reporting, attribution, audit, settlement, residuals

Use names that either match this model directly or are clearly aligned to it.
Avoid arbitrary category names that break the mental model.

--------------------------------------------------
4. ROLE MODEL / AUTH MODEL
--------------------------------------------------

There is one authentication system.

The platform is organisation-first.

Example:
- Ikenna creates organisation ODUM
- Ikenna registers admins
- admins register users
- admins/owner can invite, revoke, and assign permissions
- admins/owner can subscribe the organisation to services
- login returns a token containing:
  - user_id
  - organisation_id
  - validation metadata
  - service entitlements / subscribed packs

This means the post-login experience must be:
- role-aware
- organisation-aware
- service-aware

Different users must see different things, but the platform should still feel unified.

--------------------------------------------------
5. EXPERIENCE MODES TO SUPPORT
--------------------------------------------------

The platform has three major experience modes:

A. Public / marketing / exploratory
A prospective client lands on the site, understands the firm and service offering, explores the services, and signs in.

B. Client / organisation user
A client logs in and sees:
- the services their organisation has access to
- only their own organisation’s scope
- restrictions clearly explained before deeper access
- premium, role-appropriate versions of the same tools

C. Internal user
Internal users can access richer versions of the platform depending on role:
- admin / owner
- research / quant
- trading / execution
- reporting / invoicing
- compliance / audit
- deployment / ops

Clients must NOT see dangerous internal-only tooling.

--------------------------------------------------
6. SERVICE / PRODUCT AREAS
--------------------------------------------------

The website and platform should organize around these service/product areas.

Use labels that align with the lifecycle/workflow model where possible.

Core service areas:
1. Data
2. Research / Simulation / Model & Signal Development
3. Trading / Run / Monitor
4. Execution / Execution Analytics
5. Reporting / Explain / Reconcile / Investment Management

Internal-only or restricted:
6. Admin / Onboarding / Organisation Control
7. Deployment / DevOps / Operational Readiness
8. Audit / Compliance / Provenance

Important:
Clients should never directly see the full Admin or full Deployment surfaces.
Least privilege applies.

Also important:
The same user experience principles should apply whether:
- a prospect is viewing a service page
- a client is using a subscribed product
- an internal user is operating the full version

--------------------------------------------------
7. COMMERCIAL / PRODUCT REALITY
--------------------------------------------------

The platform is commercially modular.

Examples:
- clients may subscribe only to data
- or data + research
- or research + execution analytics
- or reporting / investment management features
- internal users may see all
- client users may see only their entitled slices
- some features may be standardised
- some may be bespoke / white-labeled / permissioned
- some may require higher compute or higher pricing tiers

This means the website/app architecture must support:
- locked vs available services
- role-based visibility
- service entitlements
- different depth by role
- internal views that are richer than client views without feeling like separate products

--------------------------------------------------
8. IMPORTANT PRODUCT DISTINCTIONS
--------------------------------------------------

Data:
Clients may see a service-oriented, polished catalogue / subscription / API access layer.
Internal users may go deeper faster.
The same system should support both.

Research / Simulation / Build:
This should support role-based access to:
- model training
- strategy backtesting
- execution backtesting
- signal configurations
- features / compute / model restrictions
Internal users see full granularity.
Clients see only the subset they are entitled to.

Execution:
This is not isolated from research.
Users should be able to understand execution choices in the same broader workflow.
Execution should feel like a sibling to research/simulation.

Reporting / Investment Management:
Client and internal views share a lot:
- P&L
- gross/net performance
- fees
- concentration
- commentary
- reporting
- settlement visibility
The partition is around operational controls such as:
- invoice generation
- payment confirmation
- fee resets
- settlement ops

Admin / Onboarding:
Hidden from clients.
Only owners/admins and a very small internal group should see it.

Deployment / DevOps:
Hidden from clients and most internal users.
Clients may trigger limited test or paid deployment-related workflows in constrained ways, but not see the rich internal deployment console.

Audit / Compliance:
Internal/restricted.
Strong provenance, event history, compliance, and evidence surfaces.

--------------------------------------------------
9. CURRENT CODEBASE REALITY
--------------------------------------------------

Work with the CURRENT website/app structure.
Do not throw it away.

The current codebase already contains many route groups and useful primitives, including things like:
- public pages
- sign-in / portal-style routes
- service pages
- trader / risk / positions / markets
- strategy platform
- ml
- execution
- ops / deployment / compliance / admin
- shared components such as:
  - unified-batch-shell
  - context-bar
  - candidate-basket
  - batch-live-rail
  - unified-shell
  - role-layout
  - require-auth

Reuse what is strong.
Refactor what is confusing.
Do not produce a generic theoretical redesign disconnected from the current app.

--------------------------------------------------
10. YOUR TASK IN THIS FIRST PASS
--------------------------------------------------

In this prompt, do the following:

A. Audit the current route and shell structure
Understand what exists now and where the confusion is.

B. Create a root-level MUST-READ product vision document
At the project root, create a clear file such as:
- `MUST_READ_PLATFORM_VISION.md`
or
- `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md`

This file should be concise but clear enough that every future agent understands:
- what the platform is
- the role model
- the service model
- the lifecycle model
- public vs client vs internal modes
- hidden internal-only surfaces
- key terminology and navigation logic
- what this current refactor is trying to achieve

This document should become the canonical orientation file for future work.

C. Refactor the top-level information architecture
Restructure the site so it more clearly separates:
- public marketing
- authenticated service hub
- client portal / service entry
- internal operational surfaces
- hidden internal-only admin/deployment areas

D. Improve the post-login experience
After login, users should land on a service-aware, role-aware cover page that shows:
- services available to them
- locked services
- hidden services not visible to their role
- entry points into the relevant areas

E. Reduce shell confusion
Move toward one coherent shell logic across the site where possible.
Public shell, authenticated shell, and internal shell can differ, but should clearly feel like one system.

F. Make the platform easier to deepen later
This first pass should leave the codebase in a clean state for the next prompts, which will deepen:
- public landing + service discovery
- authenticated service cover page
- data service UX
- research/simulate/build UX
- reporting / investment management UX
- admin/onboarding UX
- deployment/devops UX
- demo roles / walkthrough personas

--------------------------------------------------
11. DELIVERABLES
--------------------------------------------------

In this prompt, implement:

1. A root-level MUST READ vision file
2. Clearer top-level route grouping
3. Cleaner role-aware service architecture
4. A better post-login service cover page
5. Better separation of public vs client vs internal-only surfaces
6. Layout/shell cleanup so later prompts can build on a stable foundation

Do NOT:
- fully redesign every page
- deeply implement every service
- overbuild page internals yet

Focus on:
- architecture
- IA
- shells
- routing
- role-aware service flow
- future-agent readability

--------------------------------------------------
12. QUALITY BAR
--------------------------------------------------

This should feel like the beginning of a world-class institutional website + product architecture:
- clear
- premium
- role-aware
- service-aware
- coherent
- reusable
- future-proof for deeper prompts

One firm.
One product family.
Different roles.
Different permissions.
One consistent system.
