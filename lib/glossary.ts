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
 *
 * TODO(static-html): Static HTML marketing pages under `public/*.html` cannot
 * use the React <Term> primitive. A follow-up sweep will introduce either a
 * CSS + `title` attribute tooltip or a JS-injected equivalent so terms in
 * static copy get the same treatment. Out of scope for this change.
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
  aif: {
    id: "aif",
    label: "AIF",
    definition:
      "Alternative Investment Fund — a collective-investment vehicle raising capital from professional investors against a defined policy. Covers hedge funds, private-equity funds, and most non-retail crypto and DeFi funds under EU law.",
  },
  aifm: {
    id: "aifm",
    label: "AIFM",
    definition:
      "Alternative Investment Fund Manager — the EU-regulated role responsible for managing an AIF. Odum uses an EU-regulated affiliate with AIFM permissions to cover activity outside UK FCA scope.",
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
  im: {
    id: "im",
    label: "IM",
    definition:
      "Investment Management — Odum allocates client capital to its own systematic strategies under Odum's FCA permissions, reporting on the shared operating surface.",
  },
  nav: {
    id: "nav",
    label: "NAV",
    definition:
      "Net Asset Value — the per-share or per-partition value of a fund or managed account, struck at the published valuation point by the fund administrator.",
  },
  mtm: {
    id: "mtm",
    label: "mark-to-market",
    definition:
      "Valuing a position at the prevailing market price rather than entry price. Underlies live P&L, margin, and exposure calculations.",
  },
  perpetual: {
    id: "perpetual",
    label: "perpetual",
    definition:
      "A derivative with no fixed expiry, anchored to spot price via a periodic funding payment between longs and shorts. The dominant crypto derivative form.",
  },
  "best-execution": {
    id: "best-execution",
    label: "best execution",
    definition:
      "The regulatory obligation to take all sufficient steps to obtain the best possible result for a client across price, cost, speed, likelihood of execution, and settlement.",
  },
  mtd: {
    id: "mtd",
    label: "MTD",
    definition:
      "Month-to-date — cumulative return or P&L from the first day of the current calendar month to the current point.",
  },
  tca: {
    id: "tca",
    label: "TCA",
    definition:
      "Transaction Cost Analysis — post-trade measurement of execution quality against benchmarks such as arrival price, VWAP, and implementation shortfall.",
  },
  "mean-reversion": {
    id: "mean-reversion",
    label: "mean reversion",
    definition:
      "A strategy posture that bets prices return to an average level after dislocations. Common in pairs stat-arb and short-term signals.",
  },
  twap: {
    id: "twap",
    label: "TWAP",
    definition:
      "Time-Weighted Average Price — an execution algorithm that slices an order evenly across a time window, benchmarked against the average price over the same window.",
  },
  vwap: {
    id: "vwap",
    label: "VWAP",
    definition:
      "Volume-Weighted Average Price — an execution algorithm that paces participation with observed venue volume, and the corresponding price benchmark.",
  },
  "odum-signals": {
    id: "odum-signals",
    label: "Odum Signals",
    definition:
      "Odum's outbound signal-leasing service. Odum-generated trading signals delivered to counterparty webhook or REST-pull endpoints under HMAC-signed envelopes.",
  },
  "dart-full": {
    id: "dart-full",
    label: "DART Full",
    definition:
      "DART Full: unrestricted platform access — research, ML, strategy promotion, execution, analytics, reporting.",
  },
  "dart-signals-in": {
    id: "dart-signals-in",
    label: "DART Signals-In",
    definition:
      "DART Signals-In: restricted DART tier. Client provides trading instructions via signal webhooks; Odum executes. No research, ML, or strategy-promote access.",
  },
  "regulatory-umbrella": {
    id: "regulatory-umbrella",
    label: "Regulatory Umbrella",
    definition:
      "Odum's FCA-regulated wrapper allowing clients to operate regulated activity under Odum's permissions (AIFM, AR, MiFID II coverage). Cross-cutting — can overlay any engagement shape regardless of who holds the exchange API keys.",
  },
  "investment-management": {
    id: "im",
    label: "Investment Management",
    definition:
      "Investment Management — Odum allocates client capital to its own systematic strategies under Odum's FCA permissions, reporting on the shared operating surface.",
  },
  "prediction-markets": {
    id: "prediction-markets",
    label: "prediction markets",
    definition:
      "Markets where participants buy and sell contracts that pay out based on real-world event outcomes — elections, economic data, sports results. Includes crypto-native platforms (e.g. Polymarket) and regulated exchanges (e.g. Kalshi). Odum covers both event-settled and continuous prediction market instruments.",
  },
  prop: {
    id: "prop",
    label: "prop desk",
    definition:
      "Proprietary trading — the manager trades the firm's own capital, or a principal's capital, rather than managing a pooled fund or separately managed account.",
  },
  archetype: {
    id: "archetype",
    label: "archetype",
    definition:
      "Odum's taxonomy of strategy execution patterns — e.g. ML directional (continuous), carry basis (perp or dated), market making, stat-arb pairs. Archetypes map to DART execution workflows and reporting views.",
  },
  "market-making": {
    id: "market-making",
    label: "market making",
    definition:
      "A strategy that continuously quotes two-sided markets, earning the bid-ask spread. Requires low latency, inventory management, and adverse-selection controls.",
  },
  "treasury-management": {
    id: "treasury-management",
    label: "treasury management",
    definition:
      "Active management of idle capital across venues, chains, or currencies — sweep accounts, stablecoin yield, collateral optimisation, and inter-venue transfer flows.",
  },
  "execution-alpha": {
    id: "execution-alpha",
    label: "execution alpha",
    definition:
      "The P&L improvement from superior execution — slippage reduction, queue priority, latency optimisation, smart order routing, and post-trade analysis. Separate from strategy (signal) alpha.",
  },

  // ── Instrument types ─────────────────────────────────────────────────────
  spot: {
    id: "spot",
    label: "spot",
    definition:
      "Immediate delivery instruments traded at the current market price. No expiry, no leverage embedded — P&L is simply the price change on the position held.",
  },
  "dated-future": {
    id: "dated-future",
    label: "dated future",
    definition:
      "A standardised contract to buy or sell an asset at a fixed price on a specified future date. Unlike perpetuals, dated futures converge to spot at expiry and carry no funding rate.",
  },
  options: {
    id: "options",
    label: "options",
    definition:
      "Contracts giving the holder the right — but not the obligation — to buy (call) or sell (put) an asset at a strike price before or at expiry. Pricing depends on implied volatility, time to expiry, and delta.",
  },
  lending: {
    id: "lending",
    label: "lending",
    definition:
      "Earning yield by lending assets to borrowers via CeFi platforms (e.g. margin lending) or DeFi protocols (e.g. Aave, Compound). Return is the interest rate minus counterparty and smart-contract risk.",
  },
  staking: {
    id: "staking",
    label: "staking",
    definition:
      "Locking proof-of-stake tokens to participate in network validation and earn staking rewards. Includes native staking, liquid staking (e.g. stETH), and recursive/leveraged staking strategies.",
  },
  lp: {
    id: "lp",
    label: "LP / liquidity provision",
    definition:
      "Depositing two-sided assets into an AMM pool (e.g. Uniswap, Curve) to earn trading fees. Carries impermanent loss risk when asset prices diverge relative to the pool's price when liquidity was added.",
  },
  "event-settled": {
    id: "event-settled",
    label: "event-settled markets",
    definition:
      "Instruments whose settlement is determined by a discrete real-world event rather than continuous price — sports match outcomes, election results, economic data releases. Payoff is binary or bracket-based.",
  },

  // ── Strategy families ────────────────────────────────────────────────────
  "strategy-family": {
    id: "strategy-family",
    label: "Strategy family",
    definition:
      "A grouping of strategies by the style of edge they generate — carry, arbitrage, market-making, directional signal, volatility, portfolio, etc. Families are the top-level taxonomy used to route clients to the kind of strategy they are interested in or already run. A family contains one or more archetypes; each archetype is a concrete recipe instantiated across venues, instruments, and timeframes.",
  },
  "strategy-archetype": {
    id: "strategy-archetype",
    label: "Strategy archetype",
    definition:
      "A concrete recipe inside a strategy family — e.g. CARRY_BASIS_PERP (funding-rate carry via perpetuals) is an archetype of the Carry & Yield family. Archetypes define the mechanics; instances are archetypes pinned to specific venues, instruments, timeframes, and share classes.",
  },
  "ml-directional": {
    id: "ml-directional",
    label: "ML Directional",
    definition:
      "Strategies that use machine-learning models (gradient boosting, neural nets, transformers, etc.) to predict the direction of price movement. Signal is a probability or score output by the model.",
  },
  "rules-directional": {
    id: "rules-directional",
    label: "Rules Directional",
    definition:
      "Strategies based on deterministic logic — technical indicators, statistical thresholds, or heuristics — to generate buy/sell signals. No ML training loop; logic is explicit and auditable.",
  },
  "carry-yield": {
    id: "carry-yield",
    label: "Carry & Yield",
    definition:
      "Strategies that earn a premium from holding an asset or position over time — funding rates on perpetuals, basis between spot and futures, staking rewards, or lending yield. Return comes from the carry, not price direction.",
  },
  arbitrage: {
    id: "arbitrage",
    label: "Arbitrage / Structural Edge",
    definition:
      "Strategies that exploit price discrepancies across venues, time, or related instruments — cross-exchange arb, liquidation capture, funding arb, or index rebalancing front-running. Edge is structural rather than predictive.",
  },
  "event-driven": {
    id: "event-driven",
    label: "Event-Driven",
    definition:
      "Strategies that trade around scheduled or unscheduled events — earnings, data releases, token unlocks, governance votes, sports fixtures. Alpha comes from predicting or reacting to the event outcome.",
  },
  "vol-trading": {
    id: "vol-trading",
    label: "Vol Trading",
    definition:
      "Strategies that trade implied vs realised volatility, volatility surface shape (skew, term structure), or volatility regime. Typically use options or variance products; alpha comes from volatility mispricing.",
  },

  // ── Archetypes ───────────────────────────────────────────────────────────
  "carry-basis-perp": {
    id: "carry-basis-perp",
    label: "carry basis (perp or dated)",
    definition:
      "Long spot / short perpetual (or dated future) to earn the funding rate or basis. Market-neutral on direction; P&L is the spread between spot and derivative. Risk is basis blowout and execution cost.",
  },
  "staked-basis": {
    id: "staked-basis",
    label: "staked basis / recursive staking",
    definition:
      "Using liquid staking tokens (e.g. stETH) as collateral to borrow, buy more staking tokens, and repeat — capturing the spread between staking yield and borrow rate. Risk is liquidation if collateral value drops sharply.",
  },
  "yield-rotation": {
    id: "yield-rotation",
    label: "yield rotation / staking simple",
    definition:
      "Rotating capital between staking protocols, lending pools, or yield sources as rates change. Simple version: single-asset staking; advanced version: active rebalancing across multiple yield venues.",
  },
  "arb-price-dispersion": {
    id: "arb-price-dispersion",
    label: "arbitrage price dispersion / liquidation capture",
    definition:
      "Captures price gaps across venues (cross-exchange arb) or profits from forced liquidations at distressed prices. Requires fast execution and precise cost modelling to net positive after fees and slippage.",
  },
  "vol-trading-archetype": {
    id: "vol-trading-archetype",
    label: "vol trading (options / surface / skew)",
    definition:
      "Trading implied volatility directly via options — selling expensive vol, buying cheap vol, trading skew steepening/flattening, or exploiting surface dislocations between strikes and expiries.",
  },
  "stat-arb-pairs": {
    id: "stat-arb-pairs",
    label: "stat-arb pairs / cross-sectional",
    definition:
      "Pairs stat-arb trades correlated instruments when they diverge beyond a z-score threshold, expecting mean reversion. Cross-sectional stat-arb ranks a basket by a factor (momentum, value) and goes long/short the spread.",
  },
};

export function getTerm(id: string): GlossaryEntry | undefined {
  return GLOSSARY[id.toLowerCase()];
}
