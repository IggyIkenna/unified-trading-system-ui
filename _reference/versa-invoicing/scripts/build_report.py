# build_report.py
# Reads data.csv → validates schema → generates charts in memory → embeds in HTML → writes report.html + report.pdf

import base64
import difflib
import io
import sys
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from jinja2 import Template
# from weasyprint import HTML

# -------------------------
# Config: brand + paths
# -------------------------
BLUE = "#2563EB"  # Professional blue
BLACK = "#0A0A0A"
CSV_PATH = "data.csv"
LOGO_PATH = "logo.png"  # rename your Odum logo to this
# Calculate previous month for report
previous_month_date = datetime.now().replace(day=1) - timedelta(days=1)
MONTH_HEADING = f"{previous_month_date:%B} Executive Summary"
CURRENT_MONTH = previous_month_date.strftime("%B")
CURRENT_YEAR = previous_month_date.strftime("%Y")

# Calculate month before previous month for market commentary
two_months_ago = previous_month_date.replace(day=1) - timedelta(days=1)
PREVIOUS_MONTH = two_months_ago.strftime("%B")

# -------------------------
# Expected CSV schema
# -------------------------
REQUIRED_TOPLEVEL = {
    "company_aum_start",
    "company_aum_end",
    "strategy_aum_end",
    "client_low_return",
    "client_top_return",
    "august_return",
    "max_dd_intraday",
    "inception_max_dd",
}

REQUIRED_MONTHS = ["march", "april", "may", "june", "july", "august"]

XEX_SERIES = [
    "btc_all",
    "usdt_all",
    "binance_btc",
    "binance_usdt",
    "okx_btc",
    "okx_usdt",
    "bybit_btc",
    "bybit_usdt",
]
REQUIRED_XEX = set(XEX_SERIES + [f"r_{k}" for k in XEX_SERIES])

REQUIRED_KEYS = set(REQUIRED_TOPLEVEL) | set(REQUIRED_MONTHS) | set(REQUIRED_XEX)

# -------------------------
# Helpers
# -------------------------
def err(msg):  # pretty error
    return f"❌ {msg}"

def warn(msg):
    return f"⚠️  {msg}"

def must_float(name: str, val: str):
    try:
        return float(str(val).strip())
    except Exception:
        raise ValueError(f"{name} must be numeric (got {val!r}).")

def data_uri_from_bytes(b: bytes, mime="image/png") -> str:
    return f"data:{mime};base64," + base64.b64encode(b).decode("ascii")

def data_uri_from_matplotlib(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, facecolor="white", bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    return data_uri_from_bytes(buf.getvalue())

def load_logo_data_uri(path: str) -> str:
    with open(path, "rb") as f:
        return data_uri_from_bytes(f.read(), mime="image/png")

# -------------------------
# 1) Load CSV
# -------------------------
try:
    df = pd.read_csv(CSV_PATH)
except FileNotFoundError:
    print(err(f"Missing {CSV_PATH}. Make sure it exists in the project folder."))
    sys.exit(1)
except Exception as e:
    print(err(f"Failed to read {CSV_PATH}: {e}"))
    sys.exit(1)

# Basic shape check
if set(df.columns) != {"metric", "value"}:
    print(err("CSV must have exactly two columns named 'metric' and 'value'."))
    print(f"Found columns: {list(df.columns)}")
    sys.exit(1)

# Build dict
raw_data = dict(zip(df["metric"].astype(str).str.strip(), df["value"].astype(str).str.strip()))

# -------------------------
# 2) Validate schema & types
# -------------------------
errors = []
suggestions = []

present_keys = set(raw_data.keys())
missing = sorted(REQUIRED_KEYS - present_keys)
unknown = sorted(present_keys - REQUIRED_KEYS)

if missing:
    errors.append(err("Missing required metrics: " + ", ".join(missing)))

if unknown:
    # Provide suggestions for likely typos
    for u in unknown:
        close = difflib.get_close_matches(u, REQUIRED_KEYS, n=1, cutoff=0.7)
        if close:
            suggestions.append(warn(f"Unknown metric '{u}'. Did you mean '{close[0]}'?"))
        else:
            suggestions.append(warn(f"Unknown metric '{u}'. Please remove or rename to a valid key."))

# Numeric validation for all required fields
numeric_check_keys = sorted(REQUIRED_KEYS)
for k in numeric_check_keys:
    if k in raw_data:
        try:
            _ = must_float(k, raw_data[k])
        except ValueError as e:
            errors.append(err(str(e)))

# If any validation errors, show and exit
if errors or suggestions:
    print("\n".join(suggestions + errors))
    print("\nSchema reference:")
    print(" • Top-level:", ", ".join(sorted(REQUIRED_TOPLEVEL)))
    print(" • Months   :", ", ".join(REQUIRED_MONTHS))
    print(" • X-Exch   :", ", ".join(XEX_SERIES))
    print(" • Ratios   :", ", ".join([f'r_{k}' for k in XEX_SERIES]))
    sys.exit(1)

# Safe numeric getter
def f(key, default=0.0):
    try:
        return float(raw_data.get(key, default))
    except Exception:
        return default

# -------------------------
# 3) Charts (generated in memory, brand styling)
# -------------------------
plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": ["Calibri", "Segoe UI", "DejaVu Sans", "Arial", "Helvetica"],
    "font.size": 6,
    "axes.titlesize": 7,
    "axes.labelsize": 6,
    "xtick.labelsize": 5,
    "ytick.labelsize": 5,
    "legend.fontsize": 5,
    "figure.titlesize": 8
})

# Returns since inception (bar)
months_keys = REQUIRED_MONTHS  # fixed order
month_labels = [m.title() for m in months_keys]
month_vals = [f(k) for k in months_keys]

fig1, ax1 = plt.subplots(figsize=(4.2, 2.0))
ax1.bar(month_labels, month_vals, color=BLUE, alpha=0.85)
ax1.set_title("Monthly Returns Since Inception", color=BLACK, fontweight='bold', pad=3)
ax1.set_ylabel("Returns (% bars)", color=BLACK)
ax1.grid(True, linestyle="--", alpha=0.3, color='gray')
for spine in ["bottom", "left"]:
    ax1.spines[spine].set_color(BLACK)
    ax1.spines[spine].set_linewidth(0.8)
for spine in ["top", "right"]:
    ax1.spines[spine].set_visible(False)
ax1.tick_params(axis="x", colors=BLACK)
ax1.tick_params(axis="y", colors=BLACK)
plt.tight_layout()
chart_returns_uri = data_uri_from_matplotlib(fig1)

# Cross-exchange bars + ratio line
labels_keys = XEX_SERIES
labels = [k.replace("_", " ").title() for k in labels_keys]
rets = [f(k) for k in labels_keys]
ratios = [f("r_" + k) for k in labels_keys]

x = np.arange(len(labels))
fig2, ax2a = plt.subplots(figsize=(4.2, 2.0))
bars = ax2a.bar(x, rets, color=BLUE, alpha=0.85, width=0.6)
ax2a.set_ylabel("Returns (%)", color=BLACK)
ax2a.set_xticks(x)
ax2a.set_xticklabels(labels, rotation=45, ha="right", color=BLACK)
ax2a.tick_params(axis="y", labelcolor=BLACK)
ax2a.spines["bottom"].set_color(BLACK)
ax2a.spines["bottom"].set_linewidth(0.8)
ax2a.spines["left"].set_color(BLACK)
ax2a.spines["left"].set_linewidth(0.8)
ax2a.spines["top"].set_visible(False)
ax2a.grid(True, linestyle="--", alpha=0.3, color='gray', axis='y')

ax2b = ax2a.twinx()
line = ax2b.plot(x, ratios, color=BLACK, marker="o", linewidth=2.5, markersize=6, markerfacecolor='white', markeredgecolor=BLACK, markeredgewidth=1.5)
ax2b.set_ylabel("Ratio vs Backtest", color=BLACK)
ax2b.tick_params(axis="y", labelcolor=BLACK)
ax2b.spines["right"].set_color(BLACK)
ax2b.spines["right"].set_linewidth(0.8)
ax2b.spines["top"].set_visible(False)

fig2.suptitle("Cross-Exchange & Collateral Comparison", color=BLACK, fontweight='bold', y=0.92)
plt.tight_layout()
chart_cross_uri = data_uri_from_matplotlib(fig2)

# -------------------------
# 4) Logo
# -------------------------
try:
    logo_uri = load_logo_data_uri(LOGO_PATH)
except FileNotFoundError:
    print(warn(f"Logo not found at '{LOGO_PATH}'. The report will render without a logo."))
    logo_uri = ""

# -------------------------
# 5) HTML template with embedded images
# -------------------------
TEMPLATE = r"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Odum Research | Mean Reversion Strategy Executive Summary</title>
  <style>
    :root{
      --blue: #2563EB;
      --black: #0A0A0A;
      --ink: #1A1A1A;
      --muted: #6B7280;
      --bg: #FFFFFF;
      --banner-text: #FFFFFF;
      --card: #F8FAFF;
      --rule: #E1E7FF;
    }
    body{
      font-family: Calibri, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background: var(--bg);
      font-size: 7pt;
      line-height: 1.2;
      margin: 0;
      padding: 0;
    }
    .container{ max-width: 900px; margin: 0 auto; padding: 10px 18px; }
    .title{ margin-top: 3px; }
    .brand-logo{ width: 95px; }
    .report-title{ font-size: 14pt; font-weight: 700; margin: 5px 0 2px; color: var(--black); }
    .subtitle{ color: var(--muted); font-size: 6pt; }
    .divider{ height: 1px; background: linear-gradient(90deg, var(--blue), transparent); margin: 5px 0 2px; }
    .section{ margin: 7px 0 4px; }
    .banner{ background: var(--blue); color: var(--banner-text); padding: 5px 9px; border-radius: 5px; font-weight: 700; font-size: 7pt; }
    .card{ background: var(--card); border: 1px solid var(--rule); border-radius: 6px; padding: 5px 8px; margin-top:3px; }
    .chart.card{ padding: 2px 4px; }
    .bullets{ margin: 0; padding-left: 10px; font-size: 6pt; }
    .bullets li::marker{ color: var(--blue); }
    .bullets li{ margin: 1px 0; }
    table{ width: 100%; border-collapse: collapse; font-size: 6pt; margin-top:4px; }
    thead th{ background: var(--blue); color: var(--banner-text); padding: 3px; border: 1px solid var(--rule); font-size: 6pt; }
    tbody td{ padding: 3px; border: 1px solid var(--rule); text-align: center; font-size: 6pt; }
    tbody tr:nth-child(odd){ background: #FBFCFF; }
    .chart img{ max-width: 350px; width:100%; border-radius:5px; display: block; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    a{ color: #C01818; text-decoration: underline; font-size: 6pt; }
    .footnote{ margin-top: 4px; font-size: 6pt; }
    p{ margin: 4px 0; font-size: 6pt; }
  </style>
</head>
<body>
  <main class="container">
    <header class="title">
      {% if logo_uri %}<img class="brand-logo" src="{{ logo_uri }}" alt="Odum Research" />{% endif %}
      <h1 class="report-title">{{ month_heading }} | Mean Reversion with Trend Alt Strategy</h1>
      <div class="subtitle">{{ current_month }} {{ current_year }} • Odum Research</div>
      <div class="divider"></div>
    </header>

    <section class="section">
      <span class="banner">Strategy Highlights</span>
      <div class="card">
        The Mean Reversion with Trend Alt strategy extended its record of no down months since inception,
        delivering {{ current_month }} returns of <b>{{ august_return }}%</b> (USDT, 2× leverage average) and client-specific returns up to <b>{{ client_top_return }}%</b>.
        AUM grew rapidly — company-wide from <b>${{ company_aum_start }}m</b> to <b>${{ company_aum_end }}m</b>, and strategy unleveraged equivalent to <b>${{ strategy_aum_end }}m</b>.
        With results in line with backtests, shallow max drawdowns (<b>{{ max_dd_intraday }}% intraday</b>), and negligible exchange dispersion,
        {{ current_month }} highlights the strategy's ability to scale while maintaining control of risk.
      </div>
    </section>

    <section class="section">
      <span class="banner">Monthly Returns Since Inception</span>
      <div class="card">
        <table>
          <thead><tr><th>Month</th><th>Return (At 2× leverage, USDT margin account)</th></tr></thead>
          <tbody>
            <tr><td>March</td><td>{{ march }}%</td></tr>
            <tr><td>April</td><td>{{ april }}%</td></tr>
            <tr><td>May</td><td>{{ may }}%</td></tr>
            <tr><td>June</td><td>{{ june }}%</td></tr>
            <tr><td>July</td><td>{{ july }}%</td></tr>
            <tr><td>August</td><td>{{ august }}%</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <span class="banner">Cross-Exchange & Collateral Performance</span>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th></th><th>BTC all exch.</th><th>USDT all exch.</th><th>Binance BTC</th><th>Binance USDT</th>
              <th>OKX BTC</th><th>OKX USDT</th><th>Bybit BTC</th><th>Bybit USDT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>% returns (2× live)</td>
              <td>{{ btc_all }}%</td><td>{{ usdt_all }}%</td><td>{{ binance_btc }}%</td><td>{{ binance_usdt }}%</td>
              <td>{{ okx_btc }}%</td><td>{{ okx_usdt }}%</td><td>{{ bybit_btc }}%</td><td>{{ bybit_usdt }}%</td>
            </tr>
            <tr>
              <td>Ratio vs backtest</td>
              <td>{{ r_btc_all }}%</td><td>{{ r_usdt_all }}%</td><td>{{ r_binance_btc }}%</td><td>{{ r_binance_usdt }}%</td>
              <td>{{ r_okx_btc }}%</td><td>{{ r_okx_usdt }}%</td><td>{{ r_bybit_btc }}%</td><td>{{ r_bybit_usdt }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <span class="banner">Visualizations</span>
      <div class="card chart">
        <img src="{{ chart_returns_uri }}" alt="Returns since inception chart" />
      </div>
      <div class="card chart">
        <img src="{{ chart_cross_uri }}" alt="Cross-exchange comparison chart" />
      </div>
    </section>

    <section class="section">
      <span class="banner">Market Highlights (New Cambrian Capital — {{ previous_month }} {{ current_year }})</span>
      <div class="card">
        Insights by <b>Jamie Farquhar</b> (New Cambrian, $7m AUM):
        <ul class="bullets">
          <li>BTC +8.0% in July; alts mixed with partial mean-reversion.</li>
          <li>DATs expanding (MicroStrategy ~632k BTC; BitMine ~1.7m ETH).</li>
          <li>DATs trade at convenience premiums; leverage/reflexivity strong.</li>
          <li>2011 whale wallet (~$9bn BTC) absorbed with minimal disruption.</li>
        </ul>
      </div>
    </section>

    <section class="section">
      <span class="banner">Important Information</span>
      <div class="card">
        <p>Information for general purposes only. Not investment advice. Past performance does not indicate future results.</p>
        <p>Odum Research. FCA Registration No. 975797. Registered office: 9 Appold Street, London EC2A 2AP.</p>
      </div>
    </section>
  </main>
</body>
</html>
"""

# Helper function to format numbers to 2 decimal places
def format_number(value, decimals=2):
    try:
        return f"{float(value):.{decimals}f}"
    except (ValueError, TypeError):
        return str(value)

context = {
    "logo_uri": logo_uri,
    "month_heading": MONTH_HEADING,
    "current_month": CURRENT_MONTH,
    "current_year": CURRENT_YEAR,
    "previous_month": PREVIOUS_MONTH,
    "august_return": format_number(raw_data["august_return"]),
    "client_top_return": format_number(raw_data["client_top_return"]),
    "company_aum_start": format_number(raw_data["company_aum_start"]),
    "company_aum_end": format_number(raw_data["company_aum_end"]),
    "strategy_aum_end": format_number(raw_data["strategy_aum_end"]),
    "max_dd_intraday": format_number(raw_data["max_dd_intraday"]),
    "chart_returns_uri": chart_returns_uri,
    "chart_cross_uri": chart_cross_uri,
    # Monthly returns for table
    "march": format_number(raw_data["march"]),
    "april": format_number(raw_data["april"]),
    "may": format_number(raw_data["may"]),
    "june": format_number(raw_data["june"]),
    "july": format_number(raw_data["july"]),
    "august": format_number(raw_data["august"]),
    # Cross-exchange table vals
    "btc_all": format_number(raw_data["btc_all"]),
    "usdt_all": format_number(raw_data["usdt_all"]),
    "binance_btc": format_number(raw_data["binance_btc"]),
    "binance_usdt": format_number(raw_data["binance_usdt"]),
    "okx_btc": format_number(raw_data["okx_btc"]),
    "okx_usdt": format_number(raw_data["okx_usdt"]),
    "bybit_btc": format_number(raw_data["bybit_btc"]),
    "bybit_usdt": format_number(raw_data["bybit_usdt"]),
    "r_btc_all": format_number(raw_data["r_btc_all"]),
    "r_usdt_all": format_number(raw_data["r_usdt_all"]),
    "r_binance_btc": format_number(raw_data["r_binance_btc"]),
    "r_binance_usdt": format_number(raw_data["r_binance_usdt"]),
    "r_okx_btc": format_number(raw_data["r_okx_btc"]),
    "r_okx_usdt": format_number(raw_data["r_okx_usdt"]),
    "r_bybit_btc": format_number(raw_data["r_bybit_btc"]),
    "r_bybit_usdt": format_number(raw_data["r_bybit_usdt"]),
}

html = Template(TEMPLATE).render(**context)

with open("report.html", "w", encoding="utf-8") as f:
    f.write(html)

# HTML(string=html).write_pdf("report.pdf")

print("✅ Generated: report.html")
print("ℹ️  PDF generation temporarily disabled - HTML report ready for viewing")
