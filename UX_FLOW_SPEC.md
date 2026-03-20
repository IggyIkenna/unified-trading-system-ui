# UX Flow Specification — Canonical User Journeys

## Core Principle

Internal and external users use the SAME platform, SAME tools, SAME pages.
The only difference is:
- **What services are visible** (based on role/subscription)
- **What data is scoped** (based on org)
- **The entry experience** (marketing vs subscription management)

Once past the entry experience, everyone lands in the same place.

---

## Two Entry Points, One Destination

### Entry 1: Marketing → Sign Up (New External User)

```
Landing Page → Click service → Service detail page
  → "Get Started" / "Book a Demo" / "Contact Sales"
  → Sign Up page:
      Select service(s) you're interested in
      → "Book a Demo" → Calendar (service pre-selected)
      → "Contact Sales" → Contact form (service pre-selected)
      → "Subscribe" → (future: self-service subscription for data)
```

**Sign Up is NOT a login page.** It's a service selection + contact flow.
No "External User" / "Internal User" / "Client User" toggle.
The person is external by definition — they found us through the website.

### Entry 2: Login (Existing User — Internal or External)

```
/login → Email + Password form
  → Top: Toggle "Internal" / "External" (determines which org domain to validate)
  → Bottom: Demo accounts for walkthrough
  → On success → /overview (Service Hub)
```

**Login IS role-aware.** Internal users log in with @odum.internal emails.
External clients log in with their org email. The toggle helps route
authentication (in production: different auth providers).

### After Login (Both Internal and External)

```
/overview (Service Hub) — SAME for everyone, filtered by entitlements:

INTERNAL sees:
  - All services available (wildcard entitlements)
  - Ops/Admin services visible
  - No subscription management (they don't have subscriptions)

EXTERNAL CLIENT sees:
  - Subscription overview FIRST: what they have vs what they could have
  - Subscribed services: available with quick stats
  - Unsubscribed services: locked with "Upgrade" CTA (FOMO)
  - After clicking through subscription overview → same service pages as internal
  - Restrictions applied (org-scoped data, tier-limited instruments)
```

---

## The Subscription Layer (External Clients Only)

External clients see an extra layer before reaching service pages:

```
/overview → Click service card
  → /service/[key] (Subscription Page):
      "You're subscribed to: Data Pro (2,400 instruments)"
      "Available upgrade: Data Enterprise (unlimited)"
      [Manage Subscription] [Contact Account Manager]

      Available Features:
      [Instrument Catalogue] [Market Data] [Data Status]  ← click → same pages as internal
```

Internal users skip this — clicking a service card goes straight to the
service page (or through a minimal pass-through showing "Full Access").

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

## Login Page Architecture

```
/login — For existing users (internal + external)

  ┌─────────────────────────────────────┐
  │  [Internal]  [External]             │  ← Toggle (cosmetic in demo,
  │                                     │     real auth routing in prod)
  │  Email:    [____________]           │
  │  Password: [____________]           │
  │                                     │
  │  [Sign In]                          │
  │                                     │
  │  ─────── Demo Accounts ──────────   │
  │                                     │
  │  🔴 Admin (admin@odum.internal)     │
  │  🟢 Internal Trader                 │
  │  🔵 Client Full (Alpha Capital)     │
  │  🔵 Client Basic (Beta Fund)        │
  └─────────────────────────────────────┘
```

After login → /overview (Service Hub) with entitlements applied.

---

## Post-Login: What Each Role Sees

### Internal (Admin/Trader)
```
/overview:
  Quick Actions: [Trading] [Risk] [Backtest] [ML] [Admin] [DevOps]
  Services: ALL available (no locked cards, no subscription layer)
  Activity Feed: all org events
  Health Bar: all services
```

### External Client (Full Subscription)
```
/overview:
  Subscription Banner: "Alpha Capital — Full Suite"
  [Manage Subscription] [Contact Account Manager]

  Quick Actions: [Trading] [Positions] [Reports] [Data]
  Services:
    ✅ Data Pro — "2,400 instruments"
    ✅ Execution — "12 active strategies"
    ✅ Reports — "2 pending settlements"
    🔒 ML Models — "Upgrade to access" ← FOMO
  Activity Feed: own org events only
```

### External Client (Data Only)
```
/overview:
  Subscription Banner: "Beta Fund — Data Basic"
  [Upgrade Subscription] [Contact Account Manager]

  Quick Actions: [Data Catalogue] [Markets]
  Services:
    ✅ Data Basic — "180 instruments (CEFI only)"
    🔒 Research — "Upgrade to access"
    🔒 Execution — "Upgrade to access"
    🔒 Reports — "Upgrade to access"
    🔒 ML — "Upgrade to access"
  Activity Feed: own org events only
```

---

## Key Rules

1. **Marketing pages (public) NEVER show login/internal concepts**
2. **Sign up is about service interest, not authentication**
3. **Login is for existing users, with internal/external toggle**
4. **After login, everyone sees the same tools — filtered by entitlements**
5. **External clients see subscription management; internal doesn't**
6. **Locked services show what you COULD have — intentional FOMO**
7. **Every locked service has "Upgrade" → contact sales with service pre-filled**
