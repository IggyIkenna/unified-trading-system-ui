# UX Flow Specification — Canonical User Journeys

**Last verified: 2026-04-17**

## Core Principle

Internal and external users use the SAME platform, SAME tools, SAME pages.
The only difference is:

- **What services are visible** (based on role/subscription)
- **What data is scoped** (based on org)
- **The entry experience** (marketing vs subscription management)

Once past the entry experience, everyone lands in the same place (`/dashboard`).

---

## Entry Point: Login

This Next.js application is the authenticated product surface. The public
marketing site is served separately (via `proxy.ts` serving static HTML) and
is out of scope for this flow spec. New-prospect signup links live under
`/signup`, but the primary entry for existing users is `/login`.

```
/login → Email + Password form
  → On success → /dashboard (Service Hub)
```

### What `/login` actually renders

Verified against `app/(public)/login/page.tsx` (2026-04-17):

- A single **Welcome back** card with:
  - Email input (`autoComplete="email"`)
  - Password input (`autoComplete="current-password"`)
  - "Forgot password?" link (mock mode shows a toast; production uses
    Firebase `sendPasswordResetEmail`)
  - "Sign In" submit button
  - "Don't have an account? Sign up" link → `/signup`
- **No Internal/External toggle.** Persona routing is driven entirely by
  the email address: `lib/auth/personas.ts` enumerates 11 demo personas
  (admin, internal-trader, client-full, client-data-only, client-premium,
  investor, advisor, prospect-im, prospect-platform, prospect-regulatory,
  elysium-defi) and `getPersonaByEmail()` resolves role + org +
  entitlements from whichever demo email is entered. All demo passwords
  are literally `"demo"`.
- After `loginByEmail` succeeds, the page may redirect to
  `/signup?...&resume=true` if a draft onboarding application exists for
  that email, otherwise it `router.push`es to the `?redirect=` target or
  defaults to `/dashboard`.

So in practice: **one form, email-driven persona selection, destination is
`/dashboard`** — not a role toggle, and not `/overview`.

### After Login (Both Internal and External)

```
/dashboard (Service Hub) — SAME for everyone, filtered by entitlements:

INTERNAL (admin, internal-trader) sees:
  - All services available (wildcard "*" entitlement)
  - Ops/Admin services visible
  - No subscription management

EXTERNAL CLIENT (client-*, elysium-defi, investor, prospect-*) sees:
  - Subscription overview: what they have vs what they could have
  - Subscribed services: available with quick stats
  - Unsubscribed services: locked with "Upgrade" CTA
  - Clicking through subscription view → same service pages as internal
  - Org-scoped data, tier-limited instruments
```

---

## The Subscription Layer (External Clients Only)

External clients see an extra layer before reaching service pages:

```
/dashboard → Click service card
  → /services/{category} (Subscription Page):
      "You're subscribed to: Data Pro (2,400 instruments)"
      "Available upgrade: Data Enterprise (unlimited)"
      [Manage Subscription] [Contact Account Manager]

      Available Features:
      [Instrument Catalogue] [Market Data] [Data Status]  ← click → same pages as internal
```

`{category}` is one of the directories under `app/(platform)/services/`:
`data`, `execution`, `manage`, `observe`, `promote`, `reports`, `research`,
`trading`.

Internal users skip the subscription gating — clicking a service card goes
straight to the service page (or through a minimal pass-through showing
"Full Access").

---

## Sign Up Page Architecture

```
/signup — For new external prospects

  1. Service Interest Selection
     "Which services are you interested in?"
     □ Data Access (from £250/mo)
     □ Research & Backtesting
     □ Execution
     □ Investment Management
     □ Full Platform

  2. Action Selection (per selected service)
     → "Book a Live Demo" → /contact?action=demo&service=X → Calendar
     → "Contact Sales" → /contact?service=X → Email form
     → "Subscribe to Data" → (future: self-service data subscription)

  3. Contact Details
     Name, email, company, role
     → Submit → confirmation page
```

NO "External User" / "Internal User" / "Client User" selection.
NO login form on the signup page.

---

## Login Page Architecture (as built)

```
/login — For existing users (internal + external)

  ┌─────────────────────────────────────┐
  │  Welcome back                       │
  │  Sign in to access your dashboard   │
  │                                     │
  │  Email:    [____________]           │
  │  Password: [____________]           │
  │                          Forgot?    │
  │                                     │
  │  [Sign In]                          │
  │                                     │
  │  Don't have an account? Sign up →   │
  └─────────────────────────────────────┘
```

No persona toggle is rendered. Demo personas are selected by typing the
demo email (e.g. `admin@odum.internal`, `pm@alphacapital.com`,
`patrick@bankelysium.com`) with password `demo`. After login →
`/dashboard` (Service Hub) with entitlements applied.

---

## Post-Login: What Each Role Sees

### Internal (Admin/Trader)

```
/dashboard:
  Quick Actions: [Trading] [Risk] [Backtest] [ML] [Admin] [DevOps]
  Services: ALL available (no locked cards, no subscription layer)
  Activity Feed: all org events
  Health Bar: all services
```

### External Client (Full Subscription)

```
/dashboard:
  Subscription Banner: "Alpha Capital — Full Suite"
  [Manage Subscription] [Contact Account Manager]

  Quick Actions: [Trading] [Positions] [Reports] [Data]
  Services:
    Data Pro — "2,400 instruments"
    Execution — "12 active strategies"
    Reports — "2 pending settlements"
    ML Models — "Upgrade to access"
  Activity Feed: own org events only
```

### External Client (Data Only)

```
/dashboard:
  Subscription Banner: "Beta Fund — Data Basic"
  [Upgrade Subscription] [Contact Account Manager]

  Quick Actions: [Data Catalogue] [Markets]
  Services:
    Data Basic — "180 instruments (CEFI only)"
    Research — "Upgrade to access"
    Execution — "Upgrade to access"
    Reports — "Upgrade to access"
    ML — "Upgrade to access"
  Activity Feed: own org events only
```

---

## Key Rules

1. Public marketing pages are served by a separate static site (`proxy.ts`);
   they are not part of this Next app's UX flow.
2. Sign up is about service interest, not authentication.
3. Login is a single form; persona/role is resolved from the email address.
4. After login, everyone sees the same tools at `/dashboard` — filtered by
   entitlements.
5. External clients see subscription management; internal doesn't.
6. Locked services show what you COULD have — intentional FOMO.
7. Every locked service has "Upgrade" → contact sales with service pre-filled.
8. All service routes live under `/services/{category}` (plural).
