W\hat follows is a **clean, human-readable control write-up** you can hand to your accounting team so they can:

* sanity-check the sheet field-by-field
* understand **intended cashflows** (client → Odum → trader / introduer)
* verify **who owes who**, even if the spreadsheet formulas are temporarily broken

This document is the **authoritative narrative** of what the numbers *should* be, based strictly on what we agreed in this chat.

---

# MEAN-REVERSION STRATEGY

## Fee Accounting & Cashflow Control Memo

*(Authoritative reference – overrides spreadsheet confusion)*

---

## GLOBAL RULES (APPLY TO ALL CLIENTS)

1. **Two separate High-Water Marks (HWMs) exist**

   * **Odum HWM** → derived from *client invoices* (or deposits if never invoiced)
   * **Trader HWM** → derived from *trader invoices paid* (reverse-engineered)

2. **Fees only accrue on positive performance above HWM**

   * Losses do **not** generate fees
   * HWM is **never reduced** except for net withdrawals

3. **Trader fee**

   * Always **10% of gross strategy PnL**
   * Accrued independently of client billing
   * If trader was paid but client fees were refunded → trader carries a **credit (owes Odum)**

4. **Client (Odum) fee**

   * Charged only when client is above Odum HWM
   * Charged when invoiced (not automatically monthly)

5. **Introducer fee (PR only)**

   * 15% of **fees actually collected from client**
   * Never accrued before client payment

6. **BTC accounts**

   * Performance measured in **BTC**
   * USD used only for settlement
   * BTC price at time of invoice must be recorded

---

# CLIENT-BY-CLIENT EXPECTED STATE

---

## 1️⃣ PR – Prismatic (USDT)

### Known facts

* Net deposits (historical): **$300,000**
* Trader fees already paid:

  * $1,056.80701
  * $1,532.00
    → Total trader fee paid = **$2,588.81**
* Implied gross PnL charged by trader:
  ( 2,588.81 ÷ 10% = 25,888.07 )

### Trader HWM

* Initial HWM = 300,000 + 25,888.07 = **325,888.07**
* Client withdrew $20,000
  → **Adjusted trader HWM = 305,888.07**

### Odum HWM

* Last Odum invoice HWM = **326,836.98**
* Adjust for same $20,000 withdrawal
  → **Adjusted Odum HWM = 306,836.98**

### Current state

* Current AUM = **$316,495**

### Fees due **if invoiced today**

* Trader incremental PnL =
  316,495 − 305,888.07 = **10,606.93**

* Trader fee due = **$1,060.69**

* Odum incremental PnL =
  316,495 − 306,836.98 = **9,658.02**

* Odum invoice = **$3,863.21** (40%)

### Introducer

* If client pays Odum invoice:
  Introducer fee = **15% × 3,863.21 = $579.48**

### Cashflow expectation

| Flow              | Amount    |
| ----------------- | --------- |
| Client → Odum     | $3,863.21 |
| Odum → Introducer | $579.48   |
| Odum → Trader     | $1,060.69 |
| Odum net          | remainder |

---

## 2️⃣ NN – Namnar (USDT)

### Known facts

* Net deposits = **$100,000**
* Current AUM = **$105,070**
* Gross PnL = **$5,070**
* Trader already paid = **$488.52**
* Implied PnL already charged = **$4,885.23**

### Fees

* Remaining gross PnL = **$184.77**
* Trader residual due = **$18.48**
* Odum fee (30%) = **$1,521.00**

### Cashflow expectation

| Flow                      | Amount    |
| ------------------------- | --------- |
| Client → Odum             | $1,521.00 |
| Odum → Trader             | $18.48    |
| Trader outstanding credit | none      |

---

## 3️⃣ GP – GPD Capital (BTC-denominated, USD settlement)

### Known facts

* Net deposits reset to **5 BTC**
* Current balance = **4.06 BTC**
* Trader previously paid:
  $1,036.70 + $465.00 = **$1,501.70**
* Those fees were **not refunded**, but client fees were

### Interpretation

* Both Odum and Trader HWMs reset to **5 BTC**
* Trader has been **overpaid**
* Trader owes Odum **$1,501.70 credit**

### Current fees

* Account below HWM → **no fees accrue**
* Trader credit carries forward until recovered by future gains

### Cashflow expectation

| Flow          | Amount         |
| ------------- | -------------- |
| Client → Odum | $0             |
| Odum → Trader | $0             |
| Trader credit | **–$1,501.70** |

---

## 4️⃣ SL – Shaun Lim (USDT)

### Known facts

* Current balance = **$228k**
* Trader paid on PnL:
  10,583 + 28,916.27 = **$39,499.27**
* Trader fee paid = **$3,949.93**
* Account subsequently lost heavily
* Client fees refunded

### Interpretation

* Odum HWM reset to deposits
* Trader HWM reset, but **cash not refunded**
* Trader owes Odum **$3,949.93 credit**

### Current fees

* Account below HWM → **no new fees**

---

## 5️⃣ SL2 – Shaun Lim 2 (BTC)

### Known facts

* Current balance = **1.7 BTC**
* Odum HWM = **3.28 BTC**
* Trader paid on USD-equivalent PnL:
  5,513 + 11,094 = **$16,607**
* BTC price ~100k at time → ≈ **0.166 BTC PnL charged**

### Interpretation

* Account below HWM
* Trader owes Odum **$1,660.70 credit**
* Credit persists until BTC balance exceeds 3.28 BTC

---

## 6️⃣ STD – Steady Hash (USDT)

### Known facts

* Net deposits = **$300,000**
* PnL so far = **$3,400**
* No invoices issued

### Fees (accrued only)

* Trader accrued = **$340**
* Odum accrued (35%) = **$1,190**

### Cashflow

* No invoices yet
* Nothing payable

---

## 7️⃣ ET – Eqvilent (USDT)

### Known facts

* Net deposits = **$500,000**
* PnL so far = **$3,400**
* No invoices issued

### Fees (accrued only)

* Trader accrued = **$340**
* Odum accrued (30%) = **$1,020**

---

## 8️⃣ IK – Prop Account (USDT)

### Known facts

* HWM = **$69,000**
* Current balance = **$35,000**
* Trader previously paid on PnL:
  8,183 + 4,228.79 = **$12,411.79**
* Trader fee paid = **$1,241.18**

### Interpretation

* No client fees ever
* Trader owes Odum **$1,241.18 credit**

---

# FINAL CONTROL CHECKLIST FOR ACCOUNTING

For each client, verify:

1. Net deposits correctly reflected
2. Odum HWM ≠ Trader HWM (do not merge)
3. Trader credits are **negative outstanding**, not errors
4. BTC accounts use BTC HWM, USD only for settlement
5. No invoice issued when End AUM < HWM
6. Introducer fees only after client payment
