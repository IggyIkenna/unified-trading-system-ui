/**
 * Canonical term glossary for marketing surfaces.
 *
 * SSOT for hover-definitions on acronyms and debatable terms. Copy can say
 * "CeFi" without spelling it out — the <Term> component wraps the mention
 * and exposes the definition on hover.
 *
 * Codex cross-reference: unified-trading-pm/codex/14-playbooks/glossary.md
 *
 * Rules:
 * - One definition per term; no drift
 * - UK English
 * - Present tense, concrete
 * - No pricing numbers
 */

export interface GlossaryEntry {
  readonly id: string;
  /** Short canonical label as it appears in running copy. */
  readonly label: string;
  /** One-line definition shown on hover. Keep under ~180 chars. */
  readonly definition: string;
}

export const GLOSSARY: Readonly<Record<string, GlossaryEntry>> = {
  cefi: {
    id: "cefi",
    label: "CeFi",
    definition:
      "Centralised Finance — custodial crypto exchanges like Binance, OKX, Deribit, Coinbase, Bybit. Distinct from DeFi (non-custodial protocols).",
  },
  defi: {
    id: "defi",
    label: "DeFi",
    definition:
      "Decentralised Finance — non-custodial on-chain protocols like Uniswap, Aave, Lido, GMX, Hyperliquid. Distinct from CeFi (custodial exchanges).",
  },
  tradfi: {
    id: "tradfi",
    label: "TradFi",
    definition:
      "Traditional Finance — regulated equities, options, futures, FX via venues like CME, ICE, CBOE, NYSE, IBKR.",
  },
  dart: {
    id: "dart",
    label: "DART",
    definition:
      "Data Analytics, Research & Trading. The set of services Odum uses internally to build, research, promote, execute, and monitor its own systematic strategies — packaged for client use.",
  },
  sma: {
    id: "sma",
    label: "SMA",
    definition:
      "Separately Managed Account — client holds their own venue accounts; Odum runs the strategy via a scoped execute-plus-read API key. One client, one book.",
  },
  pooled: {
    id: "pooled",
    label: "Pooled",
    definition:
      "Fund structure where multiple allocators hold share classes over one set of positions. Fund administration handled by a regulated affiliate; Odum is never the custodian.",
  },
  fca: {
    id: "fca",
    label: "FCA",
    definition:
      "Financial Conduct Authority — the UK financial regulator. Odum Research Ltd holds FCA authorisation under FRN 975797.",
  },
  mlro: {
    id: "mlro",
    label: "MLRO",
    definition:
      "Money Laundering Reporting Officer — the statutory role responsible for anti-money-laundering oversight under the UK's FCA regulatory regime. Operated internally at Odum.",
  },
  mifid: {
    id: "mifid",
    label: "MiFID II",
    definition:
      "Markets in Financial Instruments Directive II — the EU/UK regulatory framework for investment-services firms covering best-execution, transaction reporting, client classification, and market-conduct rules.",
  },
  ar: {
    id: "ar",
    label: "Appointed Representative",
    definition:
      "An FCA-recognised legal status where a firm operates regulated activity under another firm's authorisation. Reg Umbrella clients become an AR (or equivalent) of Odum.",
  },
  hwm: {
    id: "hwm",
    label: "high-water mark",
    definition:
      "A performance-fee reference point — fees accrue only on profits above the prior peak NAV, so you don't pay twice for recovering the same ground.",
  },
  pnl: {
    id: "pnl",
    label: "P&L",
    definition:
      "Profit and loss — the running tally of gains and losses on a position, strategy, or book.",
  },
  var: {
    id: "var",
    label: "VaR",
    definition:
      "Value at Risk — a statistical estimate of potential loss over a given time horizon at a given confidence level. Parametric and historical variants both surfaced in Odum reporting.",
  },
  maturity: {
    id: "maturity",
    label: "maturity",
    definition:
      "A strategy's promotion stage — code-audited → backtested → paper → live-tiny → live-allocated. One-way progression; pre-backtested slots are not visible externally.",
  },
  allocator: {
    id: "allocator",
    label: "allocator",
    definition:
      "An investor deploying capital into managed strategies — typically a family office, fund-of-funds, endowment, or institutional principal choosing external managers.",
  },
  venue: {
    id: "venue",
    label: "venue",
    definition:
      "A trading counterparty where orders land — an exchange, broker, on-chain protocol, or bookmaker. Coverage scope is defined per client by a set of venue packs.",
  },
  basis: {
    id: "basis",
    label: "basis",
    definition:
      "The price difference between a spot asset and a related instrument (perp, dated future, or synthetic). Basis strategies capture structural spreads and convergence at settlement.",
  },
  funding: {
    id: "funding",
    label: "funding rate",
    definition:
      "Periodic payment between long and short holders of a perpetual future, set by each venue to anchor perp price to spot. Funding-carry strategies harvest this payment stream with a hedge.",
  },
  "stat-arb": {
    id: "stat-arb",
    label: "stat-arb",
    definition:
      "Statistical arbitrage — strategies that trade short-term mean-reversion in correlated instrument pairs or baskets. Pairs stat-arb uses a z-score signal; cross-sectional stat-arb ranks a basket.",
  },
  sharpe: {
    id: "sharpe",
    label: "Sharpe ratio",
    definition:
      "Risk-adjusted return — mean excess return divided by return volatility. Annualised. Used to compare strategies on a risk-normalised basis.",
  },
  drawdown: {
    id: "drawdown",
    label: "drawdown",
    definition:
      "The peak-to-trough decline of a strategy's equity curve. Max drawdown is the worst such decline over a historical window.",
  },
  slippage: {
    id: "slippage",
    label: "slippage",
    definition:
      "The difference between an order's intended price (arrival or mid) and its executed price. A core execution-quality metric tracked per fill.",
  },
};

export function getTerm(id: string): GlossaryEntry | undefined {
  return GLOSSARY[id.toLowerCase()];
}
