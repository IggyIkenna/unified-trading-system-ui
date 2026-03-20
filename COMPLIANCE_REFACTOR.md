# Compliance & Regulatory Sections — Refactor Doc

## Context

The regulatory/compliance sections across the UI need alignment with what Odum Research
(FCA ref 975797) actually has permission to do, the minimum obligations to maintain
the licence, and accurate representation of the two engagement models
(advisor engagement vs appointed representative).

**This is a refactor of existing content — not a rebuild.**

---

## 1. FCA Permissions — What We Actually Have

Based on FCA reference 975797, Odum Research Ltd is authorised for:

| Permission | FCA Category | What It Means |
|---|---|---|
| **Arranging deals in investments** | Article 25(1) | Introduce parties, arrange transactions |
| **Making arrangements with a view to transactions** | Article 25(2) | Facilitate transactions without executing |
| **Managing investments** | Article 37 | Discretionary portfolio management |
| **Advising on investments (except P2P)** | Article 53 | Provide personalised investment advice |
| **Dealing in investments as agent** | Article 21 | Execute transactions on behalf of clients |

### What to FIX in the UI:

**Compliance page (`app/(ops)/compliance/page.tsx`):**
- Currently lists 5 activities. Verify these match the register exactly.
- "Dealing in investments as agent" ✅ (this IS on the register)
- Does NOT include "Dealing as Principal" — if not on the register, remove from regulatory service page

**Regulatory service page (`app/(public)/services/regulatory/page.tsx`):**
- Line 85: "Dealing in Investments as Principal" — **VERIFY** this is on the register. If NOT, remove it and replace with "Advising on investments".
- Line 93: "Dealing in Investments as Agent" ✅
- Line 99: "Arranging Deals in Investments" ✅
- Line 105: "Managing Investments" ✅
- **MISSING**: "Making arrangements with a view to transactions" and "Advising on investments"

**Action:** Update both pages to show the EXACT 5 permissions from the register, with accurate descriptions.

---

## 2. MiFID II Transaction Reporting — Do We Need It?

### Short answer: Yes, but with nuance.

**When transaction reporting IS required:**
- When the firm executes transactions in financial instruments admitted to trading on EU/UK trading venues (MiFIR Article 26)
- When the firm transmits orders to another firm for execution
- Applies to: equities, bonds, derivatives, ETFs traded on regulated markets/MTFs/OTFs

**When it's NOT required:**
- Pure arranging (just introducing parties, not handling orders)
- Pure advisory (advice only, no order transmission)
- For instruments NOT admitted to trading on a venue (e.g., pure OTC crypto on unregulated exchanges)

### What Odum actually does:
- Manages investments (discretionary) → **YES, transaction reporting required** when executing in MiFID instruments
- Deals as agent → **YES, transaction reporting required**
- Arranges deals → **MAYBE** — only if transmitting orders
- Advises → **NO** transaction reporting for pure advice

### What to FIX:

The UI currently says "MiFID II transaction reporting" as a blanket service. This should be more nuanced:

**Change to:** "Transaction reporting for MiFID instruments (where applicable). Not all activities
require transaction reporting — we assess your specific activities during onboarding."

Don't remove it — it IS a real obligation for some of our activities. Just don't present it
as if everything we do requires it.

---

## 3. Two Engagement Models — Correct Representation

### Model 1: Advisor Engagement (PREFERRED)

**What it is:** The person/firm joins Odum as a contracted advisor. They are effectively
part of Odum's team. They conduct regulated activities under Odum's supervision and
authorisation. No separate FCA registration needed.

**Key points:**
- Fast onboarding (days to weeks)
- Lower cost
- Activities conducted under Odum's permissions
- Odum ensures regulatory requirements are met
- Compliance monitoring, MLRO services, training all included
- The advisor doesn't appear on the FCA register as a separate entity

**Why preferred:** Faster, simpler, cheaper. The advisor gets to operate immediately
under our umbrella.

### Model 2: Appointed Representative (AR)

**What it is:** The firm registers with the FCA as an Appointed Representative of Odum.
Odum is the "principal" firm responsible for the AR's regulated activities.

**Key points:**
- FCA registration required (3-6 month approval process)
- The AR appears on the FCA register under Odum
- Higher setup cost (FCA application, due diligence, compliance framework)
- Ongoing supervision obligations on Odum
- AR can conduct regulated activities in their own name (with Odum's oversight)

**Why it takes longer:** FCA needs to approve the AR arrangement. Due diligence,
compliance framework, staff competency assessments all required before approval.

### What to FIX in the UI:

**Current issues:**
1. The page shows AR and Advisor as equal options. In practice, advisor is strongly preferred.
2. Pricing shown (GBP 10k/5k setup) — should be "Contact us" per the pricing decision.
3. "AR Setup" implies it's quick — it's actually 3-6 months. The "Days, Not Years" hero card is misleading for AR (true for advisor, not AR).
4. Don't explicitly say "we prefer you don't do AR" but structure the page so advisor engagement is clearly the primary/recommended option and AR is presented as the alternative for those who specifically need it.

**Recommended structure:**

```
Hero: "Regulatory Coverage for Institutional Trading"
  (not "Appointed Representative services" — that's only one model)

Engagement 1 (PRIMARY, highlighted):
  "Advisor Engagement"
  "Operate under our FCA authorisation. Fast onboarding, full compliance coverage."
  - Conduct regulated activities under Odum's supervision
  - No separate FCA registration needed
  - Onboarding in days to weeks
  - Compliance monitoring, MLRO, training included
  - Contact us for pricing

Engagement 2 (SECONDARY):
  "Appointed Representative"
  "Formal FCA registration under our umbrella. For firms needing their own FCA identity."
  - Registered on FCA register as AR of Odum
  - Full due diligence and compliance framework setup
  - 3-6 month FCA approval process
  - Ongoing supervision and annual reviews
  - Contact us for pricing
  - Note: "Longer onboarding timeline due to FCA approval requirements"
```

---

## 4. Minimum Compliance Obligations

What Odum MUST do to maintain its licence (and therefore what the compliance portal should show):

### Ongoing obligations:
1. **Annual compliance review** — review all systems and controls
2. **MLRO obligations** — money laundering reporting, suspicious activity monitoring
3. **Complaints handling** — FCA-compliant complaints procedure
4. **Financial crime prevention** — AML/KYC for all clients
5. **Best execution** — where executing or transmitting orders
6. **Client categorisation** — Professional Client / Eligible Counterparty classification
7. **Conflicts of interest** — identify, manage, disclose
8. **Record keeping** — 5+ years for most records
9. **Regulatory capital** — maintain adequate capital resources
10. **FCA reporting** — REP-CRIM, annual return, Gabriel submissions

### Transaction reporting (where applicable):
- MiFIR Article 26 reporting for MiFID instrument transactions
- Via ARM (Approved Reporting Mechanism) — e.g., UnaVista, Tradeweb

### What the compliance PORTAL should show:
- Status of each obligation (compliant / needs attention / overdue)
- Last audit date + next audit date
- MLRO status and recent reports
- Client categorisation register
- Complaints log
- Best execution policy and monitoring results
- Regulatory submissions calendar

---

## 5. What Services People Can Engage In

Under Odum's licence, people (as advisors or ARs) can:

| Activity | What They Can Do | Restriction |
|---|---|---|
| Arrange deals | Introduce clients to investment opportunities | Professional Clients only |
| Make arrangements | Facilitate transactions (matching, settlement) | Professional Clients only |
| Manage investments | Discretionary portfolio management | Professional Clients only |
| Advise on investments | Personalised investment recommendations | Professional Clients only |
| Deal as agent | Execute trades on behalf of clients | Professional Clients only |

**CANNOT** deal with retail clients under any circumstance.

### Wording caution:

Don't say "we sell licences" or "licence our regulatory status". The FCA views this negatively.

**Say instead:**
- "Regulatory coverage" not "regulatory licence"
- "Operate under our authorisation" not "use our licence"
- "Advisor engagement" not "rent a licence"
- "We ensure regulatory compliance for your activities" not "we give you permission"

---

## 6. Files to Update

| File | What to change |
|---|---|
| `app/(ops)/compliance/page.tsx` | Verify 5 activities match FCA register exactly. Add "Making arrangements" if missing. |
| `app/(public)/services/regulatory/page.tsx` | Remove "Dealing as Principal" if not on register. Add "Advising on investments" and "Making arrangements". Structure advisor as primary, AR as secondary. Remove specific pricing → "Contact us". Fix "Days, Not Years" to only apply to advisor engagement. |
| `app/(public)/terms/page.tsx` | Already softened Professional Client language ✅ |
| `app/(public)/privacy/page.tsx` | Already updated ✅ |
| `components/trading/context-bar.tsx` | No compliance changes needed |
| `lib/mocks/handlers/audit.ts` | Compliance mock data — ensure MLRO, complaints, best execution statuses shown |

---

## 7. Compliance Portal (Post-Login Internal View)

The compliance page at `/compliance` is currently a static FCA info page. For the demo,
it should show an interactive compliance dashboard (internal view):

**Already exists:** `components/dashboards/audit-dashboard.tsx` (615 lines)

**What to show:**
- Obligation status grid (10 obligations, each green/yellow/red)
- Last audit: [date], Next audit: [date]
- MLRO status: [name], last report: [date]
- Client categorisation summary: X Professional Clients, Y ECPs
- Complaints: 0 open, 2 resolved this year
- Best execution: 98.5% compliant (last review [date])
- Regulatory submissions: next Gabriel due [date]

This is mock data — but it should look like a real compliance monitoring system.
