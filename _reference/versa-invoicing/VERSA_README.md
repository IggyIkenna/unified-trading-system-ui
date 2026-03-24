# versa-invoicing — Odum Research Invoicing & Performance Reporting

## What this is

Internal tool for generating client invoices, calculating performance fees, and producing monthly reports for Odum Research's fund clients.

## Current state (working now)

- `reporting_ui.html` — open in any browser, no install needed
  - **Invoice Calculator**: 9 clients, HWMs, fee structures, auto-calculates all fees
  - **BTC Client Report**: generates per-client monthly snapshots (like Yoav reports)
  - **MR Strategy Report**: mean reversion executive summary with charts
  - **Client Ledger**: full client table with fee rules

## Clients & fee structures

9 accounts: PR (40% Odum/15% intro), NN (30%), ET (30%/5% intro), STD (35%), GP/SL/SL2/ANU/IK (underwater — no perf fees, $50/mo server cost)

## Invoicing workflow

1. Open `reporting_ui.html` in Chrome/Edge
2. **Storage** button (top right) → Choose Vault Folder → pick a local folder on your Mac
   - `odum-state.json` auto-saves there on every change
   - Invoice HTML files auto-save to `invoices/` subfolder
3. Invoice Calculator tab → enter current month balances → fees auto-calculate
4. Issue Invoice → generates numbered invoice → Print to PDF → Mark Paid (enter TXID) → HWM advances
5. BTC Report tab → generate per-client monthly snapshot PDF

## Storage modes

- **Local Vault** (default): click Storage → Choose Folder. All state + invoice files auto-save locally. Works offline.
- **Cloud** (future): Storage → API Endpoint. When backend is ready, paste URL — zero code changes.
- `.env.cloud.local` pattern doesn't apply here (no build step) — cloud config lives in the Settings modal instead.

## Fee rules

See `client_specifics.md` — authoritative narrative of all fee logic, HWM rules, trader credits, introducer structures.

## For Versa

This is a functional single-file HTML app. The design goal is:

- Professional, print-ready report output (Odum branding: navy `#1e3a8a`, blue `#1d4ed8`)
- Clean form UI for data entry
- Reports that look polished when printed to PDF
- Consider splitting into proper React components — the HTML is a prototype

## Scripts (Python)

- `scripts/build_report.py` — generates MR strategy report HTML from CSV data
- `scripts/calculate_annual_returns.py` — annual return calculations
- `data/sample_mr_data.csv` — example input format for MR report
- `clients/*.md` — per-client account details and HWM tracking
