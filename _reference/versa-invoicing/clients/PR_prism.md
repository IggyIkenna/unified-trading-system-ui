# PR - Prism Capital

## Client Details
- Legal Name: [To be verified from IMA]
- Account Type: USDT
- Exchange: OKX
- IMA Location: /Users/ikennaigboaka/Documents/Onboarding/04_KYC_Onboarding/BTC_Client_Onboarding/[folder]
- API Key Location: [To be added]

## Fee Structure
- Odum Fee: 40%
- Trader Fee: 10%
- Introducer Fee (Max): 15% (of ALL historical Odum collections - NOT paid yet)

## Transfer History
- Initial Deposit: $300,000
- Withdrawal: -$20,000
- Net Deposits: $280,000

## High Water Mark Tracking

### Trader HWM
- Previous HWM: $316,494 (based on trader payouts: $1,056.81 + $1,532.00 + $1,060.60 = $3,649.41 implied $36,494 PnL)
- Adjustment: None since last payout
- Current HWM: $316,494

### Odum HWM
- Previous Invoice HWM: $326,836.98
- Adjustment: -$20,000 withdrawal
- Adjusted HWM: $306,836.98

## Current Position (Feb 17, 2026)
- Current AUM: $326,380
- Gross PnL: $46,380
- Status: At HWM

## Invoicing Calculations (Feb 17, 2026)

### Trader Invoice
- PnL since trader HWM: $326,380 - $316,494 = $9,886
- Trader fee due: $9,886 × 10% = **$988.60**

### Odum Client Invoice  
- PnL since Odum HWM: $326,380 - $306,836.98 = $19,543.02
- Odum fee: $19,543.02 × 40% = **$7,817.21**

### Introducer Total Outstanding (NEVER PAID)
**CRITICAL:** Introducer (Max) gets 15% of cumulative Odum INVOICES (not collections).

- PR total PnL to date: $326,380 - $280,000 = **$46,380**
- Cumulative Odum invoices (40% of PnL): $46,380 × 40% = **$18,552**
- **Max owed: $18,552 × 15% = $2,782.80**
- Amount paid to date: **$0.00**
- **Outstanding balance: $2,782.80**

**Formula:** Max gets 15% of (Total PnL × 40% Odum fee) = 15% of cumulative Odum invoices

## Payment History

| Date | Type | Amount | Recipient | Blockchain Hash | Status |
|------|------|--------|-----------|-----------------|--------|
| Sep 1, 2025 | Trader | $1,056.81 | Trader | [hash TBD] | Paid |
| Nov 6, 2025 | Trader | $1,532.00 | Trader | 0x5c1fb941... | Paid |
| [TBD] | Trader | $1,060.60 | Trader | [hash] | Paid (not in 3 invoices) |
| Nov 24, 2025 | Odum Invoice #20 | $10,734.79 | Prismatic Multi-Strategy Master Fund | UNPAID | Open |
| Feb 17, 2026 | Odum Invoice (Current) | $7,817.21 | TBD | UNPAID | Pending |
| - | Introducer (Max) | $2,782.80 | Max | UNPAID | Outstanding (15% of $18,552) |

**Historical Notes:**
- Invoice #19 (Nov 22, 2025) to Prismatic Management Ltd canceled - replaced by #20
- Invoice #20 covers inception to Nov 1, 2025: $26,836.98 returns × 40% = $10,734.79
- Current Feb 2026 invoice covers Nov 1 - Feb 17, 2026: $19,543.02 × 40% = $7,817.21
- Combined Odum invoices: $10,734.79 + $7,817.21 = $18,552 ✓
- Max's 15%: $18,552 × 15% = $2,782.80

## Notes
- Introducer: Max receives 15% of all Odum collections
- See INTRODUCER_LEDGER_PR_MAX.md for full introducer tracking
