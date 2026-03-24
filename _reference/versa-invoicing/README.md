# Odum Research — Reporting UI

Single-file reporting suite for Odum Research fund operations.

## Files

| File                          | Purpose                                          |
| ----------------------------- | ------------------------------------------------ |
| `reporting_ui.html`           | Main app — open in any browser, no server needed |
| `logo.png`                    | Odum logo asset                                  |
| `example_btc_report_jan.html` | Example generated BTC client report (January)    |
| `example_btc_report_nov.html` | Example generated BTC client report (November)   |

## How to use

Open `reporting_ui.html` in Chrome or Safari. No install, no server.

### 4 Tabs

**Invoice Calculator**

- 9 client accounts pre-loaded with HWMs and fee structures
- Edit current AUM → fees calculate instantly
- Totals: client invoices / trader payment / introducer fees

**BTC Client Report**

- Per-client monthly snapshot (e.g. Yoav — BTC Investment)
- Fill in month return, start/end BTC, monthly breakdown
- Live preview → Print / Save PDF

**MR Strategy Report**

- Mean Reversion strategy executive summary
- Upload CSV/Excel data or fill form manually
- Chart.js charts embedded in generated HTML
- Print / Save PDF

**Client Ledger**

- Full table of all 9 clients: fee structures, HWMs, trader credits
- Global fee rules reference

## Design notes

- Blue/white brand theme (`--blue: #1d4ed8`, `--blue-dark: #1e3a8a`)
- Generated reports print-ready (A4/Letter)
- CDN dependencies: SheetJS (Excel parsing), Chart.js (charts)
- All logic is vanilla JS — easy to restyle or convert to React/Vue

## Clients & fee structures

| Code | Name            | Type | Odum Fee         | Introducer      |
| ---- | --------------- | ---- | ---------------- | --------------- |
| PR   | Prism Capital   | USDT | 40%              | Max (15%)       |
| NN   | Namnar          | USDT | 30%              | —               |
| ET   | Eqvilent        | USDT | 30%              | Blue Coast (5%) |
| STD  | Steady Hash     | USDT | 35%              | —               |
| GP   | GPD Capital     | BTC  | — (underwater)   | —               |
| SL   | Shaun Lim       | USDT | — (underwater)   | —               |
| SL2  | Shaun Lim 2     | BTC  | — (underwater)   | —               |
| ANU  | Gulati Ventures | BTC  | — (underwater)   | —               |
| IK   | Investment Club | USDT | 35% (underwater) | —               |

All accounts: 10% trader fee. Underwater accounts: $50/month server cost, no performance fees until HWM recovery.
