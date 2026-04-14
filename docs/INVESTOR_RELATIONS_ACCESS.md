# Investor Relations — Presentation Access

## Login URL

```
https://odum-research.com/login?redirect=/investor-relations
```

## Credentials

| Account | Email | Password | Sees |
|---|---|---|---|
| **Full access** (investors, board, advisors) | `investor@odum-research.co.uk` | `OdumIR2026!` | All 6 presentations + all demos |
| **Services overview** (platform + IM + regulatory) | `services@odum-research.co.uk` | `OdumServices2026!` | Platform, Investment Management, Regulatory decks + all demos |
| **Strategic advisors** (board + plan only) | `advisor@odum-research.co.uk` | `OdumAdvisor2026!` | Board + Plan decks + basic demos |
| **Investment prospects** | `prospect-im@odum-research.co.uk` | `OdumIM2026!` | Investment Management deck + reporting demos |
| **Platform prospects** | `prospect-platform@odum-research.co.uk` | `OdumPlatform2026!` | Platform deck + data/execution/research/reporting demos |
| **Regulatory prospects** | `prospect-regulatory@odum-research.co.uk` | `OdumReg2026!` | Regulatory deck + reporting/compliance demos |

## Client Demo Accounts

| Account | Email | Password | Sees |
|---|---|---|---|
| **Patrick (DeFi client)** | `patrick@bankelysium.com` | `OdumDefi2026!` (prod) / `demo` (local) | Trading (DeFi), Observe, Reports, Platform presentation. Research/Data/other families LOCKED. |

## Presentations

| URL | Deck | Slides |
|---|---|---|
| `/investor-relations/board-presentation` | One Unified Trading System | 12 |
| `/investor-relations/plan-presentation` | The Path to $100M | 11 |
| `/investor-relations/platform-presentation` | Trading Infrastructure Without the Build | 15 |
| `/investor-relations/investment-presentation` | Investment Management | 8 |
| `/investor-relations/regulatory-presentation` | Regulatory Umbrella | 8 |

## How It Works

- Firebase Auth users provisioned via `user-management-ui/scripts/provision-presentation-users.mjs`
- Entitlements stored in Firestore `app_entitlements` collection
- Trading system UI reads entitlements via `/authorize` endpoint on user-management API
- Each presentation page wrapped in `PageEntitlementGate`
- Hub page at `/investor-relations` filters cards based on user entitlements
- Investor relations pages render full-screen (own layout) to avoid platform nav interference

## To Add or Modify Users

```bash
cd user-management-ui
# Edit USERS array in scripts/provision-presentation-users.mjs
# Then run:
node scripts/provision-presentation-users.mjs
```

## Speaking Notes

Located in `unified-trading-pm/presentations/`:
- `board-presentation-speaking-notes.md`
- `plan-longevity-speaking-notes.md`
- `strategy-as-a-service-speaking-notes.md`
- `investment-management-speaking-notes.md`
- `regulatory-umbrella-speaking-notes.md`
