/**
 * Decision-tree help system — structured Q&A that looks like a chatbot.
 * Not agentic: all answers are pre-defined. Click a question, see the answer
 * plus related follow-ups, drill deeper.
 *
 * Each node can have a `link` (href + label) that renders as a clickable
 * navigation shortcut in the chat bubble.
 */

export interface HelpNode {
  id: string;
  question: string;
  answer: string;
  link?: { href: string; label: string };
  children?: HelpNode[];
}

export const HELP_TREE: HelpNode[] = [
  // ── 1. Navigation ──────────────────────────────────────────────────────────
  {
    id: "navigation",
    question: "How do I navigate the platform?",
    answer:
      "The platform is organised around a lifecycle: **Acquire** data, **Build** strategies, **Promote** to production, **Run** live, **Observe** risk, and **Report** results. Use the top navigation bar to switch between lifecycle stages, and the left sidebar for service-specific tabs.",
    link: { href: "/dashboard", label: "Go to Dashboard" },
    children: [
      {
        id: "nav-lifecycle",
        question: "What are the lifecycle stages?",
        answer:
          "There are 6 stages, each with a dedicated service:\n\n• **Acquire** — Market data, instruments, venue coverage\n• **Build** — Research, backtesting, ML training, feature engineering\n• **Promote** — Candidate review, paper trading, risk stress, governance approval\n• **Run** — Live trading, execution, positions, orders\n• **Observe** — Risk dashboards, alerts, news, strategy health\n• **Report** — P&L attribution, settlement, reconciliation, compliance",
        link: { href: "/dashboard", label: "View all stages on Dashboard" },
      },
      {
        id: "nav-services",
        question: "What services do I have access to?",
        answer:
          "Your access depends on your subscription tier. The **Dashboard** shows all services available to you — unlocked services are clickable, locked ones show an **Upgrade** badge. Admin & Ops is internal only.",
        link: { href: "/dashboard", label: "Check your services" },
        children: [
          {
            id: "nav-data",
            question: "What's in the Data service?",
            answer:
              "**Data** covers instrument catalogues, market data coverage, venue status, data gaps, processing pipelines, and raw data inspection. It's the foundation for everything else.",
            link: { href: "/services/data/overview", label: "Open Data service" },
          },
          {
            id: "nav-research",
            question: "What's in the Research service?",
            answer:
              "**Research** has strategy backtests, ML model training, feature engineering, signal configuration, and quant tools. Run backtests, compare strategies, and train models here.",
            link: { href: "/services/research/overview", label: "Open Research" },
          },
          {
            id: "nav-trading",
            question: "What's in the Trading service?",
            answer:
              "**Trading** is the live terminal — positions, orders, P&L, market overview, DeFi, sports, predictions, options/futures, trade book, and strategy monitoring. This is where execution happens.",
            link: { href: "/services/trading/overview", label: "Open Trading" },
          },
          {
            id: "nav-observe",
            question: "What's in the Observe service?",
            answer:
              "**Observe** provides real-time risk dashboards, alert management, news feed, strategy health monitoring, and system health status.",
            link: { href: "/services/observe/health", label: "Open Observe" },
          },
        ],
      },
      {
        id: "nav-search",
        question: "How do I find a specific page quickly?",
        answer:
          "Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) to open the command palette. Type any service, page, or instrument name to jump directly. You can also use the **Dashboard** as a visual launchpad.",
        link: { href: "/dashboard", label: "Go to Dashboard" },
      },
      {
        id: "nav-onboarding",
        question: "I'm new — where do I start?",
        answer:
          "Start with the **Dashboard** to see your available services. Then explore:\n\n1. **Data > Instruments** to see what's tradeable\n2. **Trading > Overview** to see your portfolio\n3. **Trading > Positions** to see open positions\n4. **Observe > Alerts** to set up notifications\n\nIf you're a researcher, start with **Research > Strategy > Backtests**.",
        link: { href: "/dashboard", label: "Start at Dashboard" },
      },
    ],
  },

  // ── 2. Widgets & Workspaces ────────────────────────────────────────────────
  {
    id: "widgets",
    question: "How do I set up and customise widgets?",
    answer:
      "Trading pages support customisable widget layouts. Click the **Edit Layout** button in the toolbar to enter edit mode, then drag widgets to rearrange, resize, or remove them.",
    link: { href: "/services/trading/overview", label: "Open Trading (widgets)" },
    children: [
      {
        id: "widgets-add",
        question: "How do I add new widgets?",
        answer:
          "In edit mode, click the **+ Add Widget** button to open the widget catalogue. Browse by category (positions, orders, charts, risk, P&L) and click to add. Widgets snap into the grid automatically. You can add the same widget type multiple times with different configurations.",
        link: { href: "/services/trading/overview", label: "Try it on Trading Overview" },
      },
      {
        id: "widgets-resize",
        question: "How do I resize or move widgets?",
        answer:
          "Enter **Edit Layout** mode first. Then:\n\n• **Move** — drag the widget header bar\n• **Resize** — drag the bottom-right corner handle\n• **Remove** — click the X button on the widget header\n\nWidgets have minimum sizes to keep content readable. Changes auto-save when you exit edit mode.",
      },
      {
        id: "widgets-workspace",
        question: "What are workspaces?",
        answer:
          "Workspaces are saved widget layouts. You can create multiple workspaces for different workflows — e.g., one for crypto monitoring, another for DeFi execution, another for sports arb. Use the workspace dropdown in the toolbar to switch between them.",
        link: { href: "/services/trading/overview", label: "Manage workspaces" },
        children: [
          {
            id: "workspace-create",
            question: "How do I create a new workspace?",
            answer:
              "Click the workspace dropdown → **Save As** → enter a name. The current widget layout is saved as a new workspace. You can also **Duplicate** an existing workspace to use as a starting point.",
          },
          {
            id: "workspace-export",
            question: "Can I share my workspace with a colleague?",
            answer:
              "Yes. Open the workspace menu (three dots) → **Export**. This downloads your layout as a JSON file. Your colleague can **Import** it from the same menu. Only the layout is shared, not the data.",
          },
          {
            id: "workspace-reset",
            question: "How do I reset to the default layout?",
            answer:
              "Open the workspace menu → **Reset to Default**. This restores the original widget arrangement for that tab. Your other workspaces are not affected.",
          },
        ],
      },
      {
        id: "widgets-tabs",
        question: "Which tabs support widgets?",
        answer:
          "Currently, widget layouts are available on all **Trading** tabs: Overview, Positions, Orders, P&L, Markets, DeFi, Sports, Predictions, Options, Book, Strategies, Alerts, and Accounts. Each tab has its own workspace settings.",
      },
    ],
  },

  // ── 3. Positions & P&L ────────────────────────────────────────────────────
  {
    id: "positions-pnl",
    question: "How can I see my positions and P&L?",
    answer:
      "Go to **Trading > Positions** for a real-time view of all open positions across venues and asset classes. P&L is shown per-position and aggregated at portfolio level.",
    link: { href: "/services/trading/positions", label: "Open Positions" },
    children: [
      {
        id: "pnl-tab",
        question: "Where is the P&L dashboard?",
        answer:
          "The dedicated **P&L** tab under Trading shows full P&L attribution — by strategy, venue, asset class, and time period. It includes waterfall charts, daily P&L bars, and cumulative return curves.",
        link: { href: "/services/trading/pnl", label: "Open P&L" },
      },
      {
        id: "pnl-breakdown",
        question: "How is P&L calculated?",
        answer:
          "P&L has two components:\n\n• **Realised** — profit/loss from closed trades (fill price vs entry)\n• **Unrealised** — mark-to-market on open positions (current price vs entry)\n\nFor DeFi, gas costs and slippage are attributed per-operation. Total P&L = Realised + Unrealised - Fees - Gas.",
        link: { href: "/services/trading/pnl", label: "See P&L breakdown" },
      },
      {
        id: "pnl-historical",
        question: "Can I see historical P&L?",
        answer:
          "Yes. Two places:\n\n• **Reports > Executive** — portfolio-level P&L over custom date ranges (1D, 1W, 1M, YTD)\n• **Reports > Settlement** — trade-level realised P&L with fill detail\n\nBoth support filtering by strategy, venue, and asset class.",
        link: { href: "/services/reports/executive", label: "Open Executive Report" },
      },
      {
        id: "pnl-defi",
        question: "Does P&L include DeFi gas costs?",
        answer:
          "Yes. Gas fees are tracked per-transaction and attributed to the strategy that initiated the trade. The **DeFi** tab shows gas costs broken down by chain (Ethereum, Arbitrum, etc.) and operation type (swap, flash loan, bridge, approve).",
        link: { href: "/services/trading/defi", label: "Open DeFi tab" },
      },
      {
        id: "pnl-orders",
        question: "Where can I see my orders?",
        answer:
          "**Trading > Orders** shows all open, filled, and cancelled orders. Each order shows venue, instrument, side, quantity, price, fill status, and timestamps. Click an order to see fill detail.",
        link: { href: "/services/trading/orders", label: "Open Orders" },
      },
      {
        id: "pnl-book",
        question: "What is the trade book?",
        answer:
          "The **Book** tab is a complete audit trail of every trade. It shows the full lifecycle: order placement → fill → settlement. Use it for compliance queries, debugging, or reconciliation.",
        link: { href: "/services/trading/book", label: "Open Trade Book" },
      },
    ],
  },

  // ── 4. DeFi Trading ───────────────────────────────────────────────────────
  {
    id: "defi",
    question: "How do I do a DeFi trade?",
    answer:
      "DeFi trading is under **Trading > DeFi**. You can execute swaps (Uniswap), flash loans (Aave), and cross-chain bridges. All trades are pre-simulated on Tenderly before broadcast.",
    link: { href: "/services/trading/defi", label: "Open DeFi" },
    children: [
      {
        id: "defi-swap",
        question: "How do I execute a swap?",
        answer:
          "Navigate to **Trading > DeFi**:\n\n1. Select the **chain** (Ethereum, Arbitrum, etc.)\n2. Choose token pair (e.g., WETH → USDC)\n3. Enter the amount\n4. Review the simulated output — slippage, gas estimate, effective price\n5. Click **Execute** to submit\n\nThe transaction is pre-simulated. If simulation fails, you'll see the revert reason before any gas is spent.",
        link: { href: "/services/trading/defi", label: "Execute a swap" },
      },
      {
        id: "defi-flash-loan",
        question: "What are flash loans?",
        answer:
          "Flash loans let you borrow assets without collateral for the duration of a single transaction. We support **Aave V3** flash loans. The strategy service generates the parameters (borrow amount, target operations) and the execution service handles the atomic transaction. If any step fails, the entire transaction reverts — no risk of partial execution.",
        link: { href: "/services/trading/defi", label: "View flash loans" },
      },
      {
        id: "defi-chains",
        question: "Which chains are supported?",
        answer:
          "Currently supported:\n\n• **Ethereum mainnet** — Uniswap, Aave, full DEX coverage\n• **Arbitrum** — fast, low-cost swaps\n• **Optimism** — OP Stack L2\n• **Polygon** — wide token coverage\n• **Base** — Coinbase L2\n• **Sepolia testnet** — paper trading, no real funds\n\nChain selection is in the DeFi tab header.",
        link: { href: "/services/trading/defi", label: "Select a chain" },
      },
      {
        id: "defi-gas",
        question: "How are gas costs tracked?",
        answer:
          "Every DeFi transaction records gas used, gas price, and total cost in ETH and USD. Costs are attributed to the strategy that initiated the trade. The P&L page includes gas as a line item. L2 chains (Arbitrum, Optimism, Base) have separate L1 data fee tracking.",
        link: { href: "/services/trading/pnl", label: "See gas in P&L" },
      },
    ],
  },

  // ── 5. Sports & Predictions ───────────────────────────────────────────────
  {
    id: "sports",
    question: "How do I view sports and prediction markets?",
    answer:
      "Sports trading is under **Trading > Sports**. Prediction markets (Polymarket, etc.) are under **Trading > Predictions**.",
    link: { href: "/services/trading/sports", label: "Open Sports" },
    children: [
      {
        id: "sports-fixtures",
        question: "How are fixtures organised?",
        answer:
          "The **Fixtures** tab groups matches by league and date. Each fixture card shows teams, kickoff time, and best available odds across venues. Click a fixture to expand the detail panel with full market depth, head-to-head stats, form guide, and venue comparison.",
        link: { href: "/services/trading/sports", label: "Browse fixtures" },
      },
      {
        id: "sports-arb",
        question: "What are arbitrage opportunities?",
        answer:
          "The **Arb** tab scans odds across all connected bookmakers in real-time and identifies mispriced markets where you can guarantee profit by betting both sides. Opportunities show:\n\n• Margin percentage\n• Time to expiry\n• Stake distribution per venue\n• Auto-expire countdown",
        link: { href: "/services/trading/sports", label: "View arb opportunities" },
      },
      {
        id: "sports-bets",
        question: "Where do I see my bets?",
        answer:
          "The **My Bets** tab shows all open, settled, and voided bets. Each bet shows the fixture, market, odds, stake, and P&L. You can filter by sport, league, and status.",
        link: { href: "/services/trading/sports", label: "View my bets" },
      },
      {
        id: "sports-predictions",
        question: "How do prediction markets work?",
        answer:
          "**Trading > Predictions** covers event-based markets from Polymarket and other venues. Five tabs:\n\n• **Markets** — browse all active markets with volumes\n• **Trade** — place orders on specific outcomes\n• **Portfolio** — track your positions and P&L\n• **Odum Focus** — our curated picks and analysis\n• **Arb Stream** — cross-venue arbitrage detection",
        link: { href: "/services/trading/predictions", label: "Open Predictions" },
      },
      {
        id: "sports-options",
        question: "What about options and futures?",
        answer:
          "**Trading > Options** covers traditional options and futures — TradFi and crypto. Features include expiry strip navigation, Greeks display, scenario analysis panel, and watchlist with pinned symbols.",
        link: { href: "/services/trading/options", label: "Open Options & Futures" },
      },
    ],
  },

  // ── 6. Filtering & Scoping ────────────────────────────────────────────────
  {
    id: "filtering",
    question: "What can I filter by?",
    answer:
      "Most pages support filtering by **organisation**, **client**, **strategy**, **venue**, **asset class**, and **date range**. Filters are in the top bar and persist across tabs within a service.",
    children: [
      {
        id: "filter-org",
        question: "How do organisation and client filters work?",
        answer:
          "If you manage multiple organisations or client accounts, use the **Organisation** dropdown (top bar) to scope all data to a specific entity. The **Client** filter further narrows to individual mandates within that org. These filters cascade across all services — set once, applies everywhere.",
      },
      {
        id: "filter-strategy",
        question: "Can I filter by strategy?",
        answer:
          "Yes. The **Strategy** filter lets you view positions, P&L, and risk for a specific strategy or group. Available on Trading, Research, and Reports pages. On the **Strategies** tab, you can see all strategies in a grid view.",
        link: { href: "/services/trading/strategies/grid", label: "View strategy grid" },
      },
      {
        id: "filter-venue",
        question: "Can I filter by venue or asset class?",
        answer:
          "Yes. Use the **Venue** filter to scope to a specific exchange (Binance, Hyperliquid, Uniswap, etc.) and the **Asset Class** filter for crypto spot, crypto perps, DeFi, sports, predictions, options, etc. Available on Data, Trading, and Reports pages.",
        link: { href: "/services/data/venues", label: "View all venues" },
      },
      {
        id: "filter-date",
        question: "How do date range filters work?",
        answer:
          "Date pickers appear on historical views — P&L, reports, backtests. Presets: **1D**, **1W**, **1M**, **3M**, **YTD**, **1Y**, or pick a **Custom** range. The filter applies to all data on the current page.",
      },
      {
        id: "filter-instruments",
        question: "How do I find a specific instrument?",
        answer:
          "Go to **Data > Instruments** for the full catalogue. You can search by name, symbol, or venue. Each instrument card shows the asset class, venue, listing date, and data coverage.",
        link: { href: "/services/data/instruments", label: "Search instruments" },
      },
      {
        id: "filter-live-sim",
        question: "What does Live vs Simulated mean?",
        answer:
          "The **Live / Simulated** toggle at the top switches between real trading and paper trading mode. In **Simulated** mode, orders are executed against simulated fills — no real funds are at risk. All pages respect this toggle.",
      },
    ],
  },

  // ── 7. Research ─────────────────────────────────────────────────
  {
    id: "research",
    question: "How do I run a backtest?",
    answer:
      "Go to **Research > Strategy > Backtests** to configure and run strategy backtests. Select instruments, date range, and strategy parameters, then submit.",
    link: { href: "/services/research/strategy/backtests", label: "Open Backtests" },
    children: [
      {
        id: "research-configure",
        question: "How do I configure a backtest?",
        answer:
          "On the **Backtests** page:\n\n1. Select a strategy template or create custom\n2. Choose instruments and venues\n3. Set date range (historical data required)\n4. Configure parameters (position sizing, stop-loss, take-profit)\n5. Click **Run Backtest**\n\nResults show P&L curves, drawdown analysis, Sharpe ratio, and fill-level detail.",
        link: { href: "/services/research/strategy/backtests", label: "Configure a backtest" },
      },
      {
        id: "research-compare",
        question: "Can I compare strategies?",
        answer:
          "Yes. The **Compare** tab lets you put multiple backtest results side by side — P&L curves, risk metrics, and fill statistics. Great for evaluating parameter sensitivity.",
        link: { href: "/services/research/strategy/compare", label: "Compare strategies" },
      },
      {
        id: "research-heatmap",
        question: "What's the strategy heatmap?",
        answer:
          "The **Heatmap** shows strategy performance across two parameter axes (e.g., lookback window vs threshold). Cells are coloured by Sharpe ratio or P&L, making it easy to spot optimal parameter zones.",
        link: { href: "/services/research/strategy/heatmap", label: "View heatmap" },
      },
      {
        id: "research-ml",
        question: "How does the ML pipeline work?",
        answer:
          "The ML section has three tabs:\n\n• **Training** — launch and monitor model training runs\n• **Registry** — view all trained models, their metrics, and promotion status\n• **Analysis** — feature importance, SHAP values, model explainability\n\nModels are trained on historical features, validated with walk-forward analysis, and promoted to production via the **Promote** lifecycle stage.",
        link: { href: "/services/research/ml", label: "Open ML Pipeline" },
        children: [
          {
            id: "ml-training",
            question: "How do I train a model?",
            answer:
              "Go to **Research > ML > Training**. Select a model template, choose feature sets, configure hyperparameters, and submit. Training runs are tracked with loss curves, validation metrics, and resource usage.",
            link: { href: "/services/research/ml/training", label: "Start training" },
          },
          {
            id: "ml-registry",
            question: "Where are trained models stored?",
            answer:
              "The **Model Registry** lists all models with version, training date, performance metrics, and promotion status (candidate → paper → live). Click a model to see detailed metrics and promote it.",
            link: { href: "/services/research/ml/registry", label: "View model registry" },
          },
        ],
      },
      {
        id: "research-features",
        question: "What features are available?",
        answer:
          "The platform computes **600+ features** across 7 services:\n\n• **Delta-one** — price, volume, returns, momentum\n• **Volatility** — Greeks, implied vol, vol surface\n• **On-chain** — DeFi metrics, gas, TVL, yields\n• **Sports** — fixture stats, form, H2H\n• **Calendar** — events, earnings, holidays\n• **Macro** — rates, FX, commodities\n• **Custom** — user-defined via Feature ETL",
        link: { href: "/services/research/features", label: "Browse feature catalogue" },
      },
      {
        id: "research-signals",
        question: "What are signals?",
        answer:
          "Signals combine multiple features into a single trading signal (long/short/flat). Configure signal logic under **Research > Signals** — set thresholds, combine indicators, and backtest signal performance independently of execution.",
        link: { href: "/services/research/signals", label: "Configure signals" },
      },
    ],
  },

  // ── 8. Risk & Monitoring ──────────────────────────────────────────────────
  {
    id: "risk",
    question: "How do I monitor risk?",
    answer:
      "The **Observe** service provides real-time risk monitoring. Four key pages: **Health** (system status), **Risk** (exposure), **Alerts** (notifications), and **Strategy Health** (strategy-level monitoring).",
    link: { href: "/services/observe/health", label: "Open Observe" },
    children: [
      {
        id: "risk-dashboard",
        question: "What does the risk dashboard show?",
        answer:
          "**Observe > Risk** shows:\n\n• Portfolio-level exposure by venue, asset class, and currency\n• VaR (Value at Risk) with confidence intervals\n• Margin utilisation per venue\n• Concentration risk heatmap\n• Drawdown tracking vs limits",
        link: { href: "/services/observe/risk", label: "Open Risk Dashboard" },
      },
      {
        id: "risk-alerts",
        question: "How do alerts work?",
        answer:
          "**Observe > Alerts** shows all triggered alerts — position limits, drawdown thresholds, venue latency spikes, missed fills, and more. Each alert shows severity (critical/warning/info), trigger condition, timestamp, and recommended action.",
        link: { href: "/services/observe/alerts", label: "View alerts" },
      },
      {
        id: "risk-strategy-health",
        question: "How do I monitor strategy health?",
        answer:
          "**Observe > Strategy Health** tracks each strategy's live performance vs expectations — P&L drift, fill rate, latency, and signal accuracy. Anomalies are flagged automatically.",
        link: { href: "/services/observe/strategy-health", label: "View strategy health" },
      },
      {
        id: "risk-kill-switch",
        question: "Is there an emergency kill switch?",
        answer:
          "Yes. The **Kill Switch** panel in Trading lets you instantly:\n\n• Flatten all positions (close everything)\n• Halt execution for a specific venue\n• Halt a specific strategy\n• Halt the entire portfolio\n\nRequires confirmation to prevent accidental activation. Actions are logged for audit.",
        link: { href: "/services/trading/overview", label: "Access Kill Switch" },
      },
      {
        id: "risk-news",
        question: "Is there a news feed?",
        answer:
          "**Observe > News** aggregates market-moving news relevant to your positions and watchlist. News items are tagged by asset, venue, and impact level.",
        link: { href: "/services/observe/news", label: "Open News" },
      },
    ],
  },

  // ── 9. Promote (Strategy Promotion) ───────────────────────────────────────
  {
    id: "promote",
    question: "How do I promote a strategy to production?",
    answer:
      "The **Promote** service is an 8-stage pipeline that takes a strategy from candidate to live production. Each gate must pass before the next stage unlocks.",
    link: { href: "/services/promote", label: "Open Promote" },
    children: [
      {
        id: "promote-pipeline",
        question: "What are the promotion stages?",
        answer:
          "The 8 stages are:\n\n1. **Pipeline Overview** — all candidates, status, progress\n2. **Data Validation** — input data quality checks\n3. **Model Assessment** — ML model performance review\n4. **Paper Trading** — simulated live execution\n5. **Risk & Stress** — stress testing, tail risk\n6. **Champion vs Challenger** — A/B comparison\n7. **Capital Allocation** — position sizing, limits\n8. **Governance** — final approval, compliance sign-off",
        link: { href: "/services/promote", label: "View pipeline" },
      },
      {
        id: "promote-paper",
        question: "How does paper trading work?",
        answer:
          "The **Paper Trading** gate runs your strategy against live market data with simulated execution. It tracks P&L, fill rate, and slippage without risking real capital. The strategy must meet configurable thresholds before advancing.",
        link: { href: "/services/promote", label: "View paper trading gate" },
      },
    ],
  },

  // ── 10. Data Service ──────────────────────────────────────────────────────
  {
    id: "data",
    question: "How do I explore market data?",
    answer:
      "The **Data** service is your window into instrument catalogues, venue coverage, data freshness, and processing pipelines.",
    link: { href: "/services/data/overview", label: "Open Data" },
    children: [
      {
        id: "data-instruments",
        question: "How do I find instruments?",
        answer:
          "**Data > Instruments** has the full catalogue — search by name, symbol, venue, or asset class. Each instrument shows listing date, data coverage, and trading status. Use filters to narrow by venue or category.",
        link: { href: "/services/data/instruments", label: "Search instruments" },
      },
      {
        id: "data-coverage",
        question: "How do I check data coverage?",
        answer:
          "**Data > Coverage** shows which venues and instruments have active data feeds, last update timestamps, and coverage percentages. Gaps are highlighted in red.",
        link: { href: "/services/data/coverage", label: "Check coverage" },
      },
      {
        id: "data-venues",
        question: "Which venues are connected?",
        answer:
          "**Data > Venues** lists all connected exchanges and data providers with their status (online/degraded/offline), supported asset classes, and latency metrics.",
        link: { href: "/services/data/venues", label: "View venues" },
      },
      {
        id: "data-gaps",
        question: "How do I find data gaps?",
        answer:
          "**Data > Gaps** scans for missing data across all instruments and venues. Each gap shows the time range, affected instrument, and venue. Gaps can be queued for backfill.",
        link: { href: "/services/data/gaps", label: "View data gaps" },
      },
      {
        id: "data-processing",
        question: "Where are data processing pipelines?",
        answer:
          "**Data > Processing** shows the status of all data pipelines — ingestion, normalisation, and feature computation. Each pipeline shows throughput, error rate, and last run time.",
        link: { href: "/services/data/processing", label: "View pipelines" },
      },
    ],
  },

  // ── 11. Accounts & Settings ───────────────────────────────────────────────
  {
    id: "accounts",
    question: "How do I manage my account?",
    answer:
      "Go to **Settings** (gear icon, top-right) to manage your profile, API keys, and preferences. Organisation admins can manage users under **Admin > Users**.",
    link: { href: "/settings", label: "Open Settings" },
    children: [
      {
        id: "accounts-api-keys",
        question: "How do I set up API keys?",
        answer:
          "**Settings > API Keys** lets you generate and manage API credentials. Keys are scoped to specific permissions (read-only, trading, admin). You can rotate or revoke keys at any time. Never share API keys — they grant access to your account.",
        link: { href: "/settings/api-keys", label: "Manage API Keys" },
      },
      {
        id: "accounts-subscription",
        question: "What subscription tiers are available?",
        answer:
          "Five tiers:\n\n• **Starter** — Data service only\n• **Professional** — Data + Research\n• **Trader** — Full trading + Observe\n• **Enterprise** — White-label, custom strategies, dedicated support\n• **Internal** — Full platform access (staff only)\n\nEach tier unlocks additional services and features. Contact your account manager to upgrade.",
      },
      {
        id: "accounts-users",
        question: "How do I manage users in my organisation?",
        answer:
          "Organisation admins can manage users under **Admin > Users**. You can onboard new users, assign entitlements, modify roles, and offboard departing users. Each action has an approval workflow.",
        link: { href: "/admin/users", label: "Manage users" },
        children: [
          {
            id: "accounts-templates",
            question: "What are access templates?",
            answer:
              "Access templates are pre-defined sets of entitlements you can apply to new users — e.g., 'DeFi Analyst' gives defi-trading + data-pro. **Admin > Users > Templates** lets you create, edit, and delete templates. Applying a template to a user sets all entitlements in one click.",
            link: { href: "/admin/users/templates", label: "Manage access templates" },
          },
          {
            id: "accounts-firebase",
            question: "How do I see all Firebase Auth accounts?",
            answer:
              "**Admin > Users > Firebase Users** lists all accounts in Firebase Auth — including UID, email, provider (Google/Microsoft/GitHub/Email), email verification status, and last sign-in. Use this page to find orphaned accounts or diagnose login issues.",
            link: { href: "/admin/users/firebase", label: "View Firebase Users" },
          },
          {
            id: "accounts-health-checks",
            question: "How do I run authentication provider health checks?",
            answer:
              "**Admin > Users > Health Checks** shows the status of each auth provider (Firebase, Google OAuth, Microsoft SSO, GitHub). Click **Run Health Checks** to test all providers live. Each check shows latency, last run time, and error details if failing.",
            link: { href: "/admin/users/health-checks", label: "View Health Checks" },
          },
        ],
      },
      {
        id: "accounts-trading-accounts",
        question: "Where are my trading accounts?",
        answer:
          "**Trading > Accounts** shows all connected trading accounts — venue credentials, balances, margin status, and connectivity. You can link new venue accounts here.",
        link: { href: "/services/trading/accounts", label: "View trading accounts" },
      },
    ],
  },

  // ── 12. Reports ───────────────────────────────────────────────────────────
  {
    id: "reports",
    question: "What reports are available?",
    answer:
      "The **Reports** service covers six areas: Executive summary, NAV (fund accounting), IBOR (investment book of record), SAFT (token warrants), Settlement detail, Reconciliation, and Regulatory compliance.",
    link: { href: "/services/reports/overview", label: "Open Reports" },
    children: [
      {
        id: "reports-executive",
        question: "What's in the executive report?",
        answer:
          "**Reports > Executive** is the portfolio summary — total P&L, P&L attribution by strategy/venue/asset class, risk metrics, and performance charts. Supports daily, weekly, monthly, and custom date ranges.",
        link: { href: "/services/reports/executive", label: "View Executive Report" },
      },
      {
        id: "reports-nav",
        question: "What is the NAV report?",
        answer:
          "**Reports > NAV** is the fund net asset value page. It shows:\n\n• Total NAV in USD with daily change\n• NAV per share (multi-class funds)\n• Hourly NAV time series chart\n• Capital flows waterfall (subscriptions, redemptions)\n• Fee waterfall (management, performance, operating)\n\nNAV is calculated end-of-day using marked positions and accrued fees.",
        link: { href: "/services/reports/nav", label: "View NAV Report" },
      },
      {
        id: "reports-ibor",
        question: "What is the IBOR report?",
        answer:
          "**IBOR** (Investment Book of Record) is the authoritative source for all positions and transactions. **Reports > IBOR** shows:\n\n• All positions with golden-source provenance\n• Reconciliation status vs venue fills\n• Settlement pending/confirmed status\n• Position lifecycle audit trail\n\nUse IBOR when you need the definitive position for compliance or regulatory queries.",
        link: { href: "/services/reports/ibor", label: "View IBOR" },
      },
      {
        id: "reports-saft",
        question: "What is the SAFT report?",
        answer:
          "**SAFT** (Simple Agreement for Future Tokens) covers token warrant positions. **Trading > Accounts > SAFT** shows:\n\n• Active SAFT agreements with issuer and token detail\n• Vesting schedules (cliff + linear unlock)\n• Unlock timeline chart\n• Estimated value at current token price\n• Pending vs vested warrant counts\n\nSAFTs are typically long-dated — use the timeline chart to plan liquidity needs.",
        link: { href: "/services/trading/accounts/saft", label: "View SAFT positions" },
      },
      {
        id: "reports-settlement",
        question: "What's in the settlement report?",
        answer:
          "**Reports > Settlement** shows trade-level realised P&L with fill detail — entry/exit prices, quantities, fees, and timestamps. Useful for accounting and tax preparation.",
        link: { href: "/services/reports/settlement", label: "View Settlement" },
      },
      {
        id: "reports-recon",
        question: "How does reconciliation work?",
        answer:
          "**Reports > Reconciliation** compares our internal trade ledger against venue fills. Discrepancies (breaks) are flagged for investigation. For each break, you can **Accept**, **Reject**, or **Investigate** with a full audit trail.",
        link: { href: "/services/reports/reconciliation", label: "View Reconciliation" },
      },
      {
        id: "reports-regulatory",
        question: "What regulatory reports are available?",
        answer:
          "**Reports > Regulatory** generates compliance-ready reports — transaction reporting, position disclosure, best execution, and AML summaries. Formats align with FCA, MiFID II, and EMIR requirements.",
        link: { href: "/services/reports/regulatory", label: "View Regulatory Reports" },
      },
      {
        id: "reports-export",
        question: "Can I export reports?",
        answer:
          "Yes. All report pages have a **Download** button — CSV for data analysis, PDF for stakeholder distribution. Scheduled reports can be configured to email automatically (daily, weekly, monthly).",
        link: { href: "/services/reports/overview", label: "Export options" },
      },
    ],
  },

  // ── 12b. Strategy Families ────────────────────────────────────────────────
  {
    id: "strategy-families",
    question: "What strategy families does the platform support?",
    answer:
      "The platform organises strategies into four families, each with a dedicated UI and pipeline:\n\n• **DeFi** — on-chain strategies (basis trades, lending yields, recursive staking, flash loans)\n• **Sports** — event-driven betting (arbitrage, accumulator, model-based)\n• **Options** — derivatives strategies (spreads, straddles, condors)\n• **Predictions** — event market strategies (Polymarket, binary outcomes)\n\nEach family has its own strategy grid, config widgets, and execution path.",
    children: [
      {
        id: "family-defi",
        question: "What DeFi strategies are available?",
        answer:
          "Six DeFi strategy archetypes:\n\n• **Basis Trade** — long spot / short perp to capture funding rate\n• **Yield** — lending on Aave, Compound across chains\n• **Recursive Staking** — loop collateral to amplify staking yield\n• **Mean Reversion** — price reversion on DeFi pairs\n• **Momentum** — cross-chain momentum with on-chain confirmation\n• **Market Making** — concentrated liquidity provisioning (Uniswap V3)\n\nHealth Factor monitoring is available for all leveraged DeFi strategies.",
        link: { href: "/services/trading/defi", label: "Open DeFi trading" },
        children: [
          {
            id: "family-defi-hf",
            question: "What is Health Factor and why does it matter?",
            answer:
              "**Health Factor (HF)** measures collateral safety in lending protocols:\n\n• **HF > 1.5** — safe zone\n• **1.2 ≤ HF < 1.5** — deleverage warning\n• **1.0 ≤ HF < 1.2** — emergency exit zone\n• **HF < 1.0** — liquidation by protocol\n\nThe Risk > Margin page shows the HF time series. Set alerts at HF 1.5 to get early warning.",
            link: { href: "/services/observe/risk", label: "View Health Factor chart" },
          },
          {
            id: "family-defi-chains",
            question: "Which chains are used for DeFi strategies?",
            answer:
              "Strategies can run across: Ethereum, Arbitrum, Optimism, Polygon, Base, and BSC. Chain selection is in the DeFi strategy config panel. The platform uses the RPC URL registry in UAC — no custom RPC needed.",
            link: { href: "/services/trading/defi", label: "Configure chain" },
          },
        ],
      },
      {
        id: "family-sports",
        question: "What sports strategies are available?",
        answer:
          "Three sports strategy archetypes:\n\n• **Arbitrage** — cross-bookmaker guaranteed profit on mispriced odds\n• **Accumulator** — multi-leg combo bets with ML probability weighting\n• **Model-Based** — ML model signals vs market odds (edge extraction)\n\nThe Sports Arb Scanner runs continuously across 15 bookmakers with ms-level latency.",
        link: { href: "/services/trading/sports", label: "Open Sports trading" },
        children: [
          {
            id: "family-sports-arb",
            question: "How does sports arbitrage work?",
            answer:
              "The arb scanner identifies markets where the combined back+lay (or back+back) odds imply a guaranteed profit regardless of outcome. Each opportunity shows:\n\n• Gross margin %\n• Stake distribution per venue\n• Time to expiry\n• Recommended bet sizes\n\nOpportunities decay quickly — the scanner is optimised for sub-second detection.",
            link: { href: "/services/trading/sports", label: "View arb opportunities" },
          },
          {
            id: "family-sports-accumulators",
            question: "What are accumulators?",
            answer:
              "Accumulators (accas) combine multiple match outcomes into a single bet. The payout multiplies — 4 legs at 2.0 odds = 16x return. The platform's ML models assign probability to each leg and recommend stakes via Kelly criterion.\n\nUse **Trading > Sports > My Bets** to track acca performance.",
            link: { href: "/services/trading/sports", label: "View accumulators" },
          },
        ],
      },
      {
        id: "family-options",
        question: "What options strategies are available?",
        answer:
          "Options strategies cover:\n\n• **Spreads** — bull/bear call or put spreads\n• **Straddles** — long vol (buy call + put at same strike)\n• **Strangles** — cheaper vol play at OTM strikes\n• **Iron Condors** — range-bound premium collection\n• **Covered calls** — yield enhancement on long positions\n\nThe Options tab has a Greeks display, expiry strip navigation, and a scenario P&L panel.",
        link: { href: "/services/trading/options", label: "Open Options" },
      },
      {
        id: "family-predictions",
        question: "What prediction market strategies are available?",
        answer:
          "Prediction market strategies use Polymarket and binary event venues:\n\n• **Market Making** — provide liquidity on both sides of a binary market\n• **Arbitrage** — cross-venue mispricing detection\n• **Model-Based** — ML probability vs market-implied probability\n\nThe Predictions tab has five sub-tabs: Markets, Trade, Portfolio, Odum Focus, and Arb Stream.",
        link: { href: "/services/trading/predictions", label: "Open Predictions" },
      },
    ],
  },

  // ── 13. Execution & Orders ────────────────────────────────────────────────
  {
    id: "execution",
    question: "How does order execution work?",
    answer:
      "Orders are routed through the execution service with smart order routing, algo selection, and venue-level TCA. View order status under **Trading > Orders**.",
    link: { href: "/services/trading/orders", label: "Open Orders" },
    children: [
      {
        id: "exec-orders",
        question: "How do I place an order?",
        answer:
          "From any Trading page, use the **Order Entry** widget or the **Terminal** tab for a full-featured order ticket. Select instrument, side (buy/sell), quantity, order type (market/limit/stop), and submit.",
        link: { href: "/services/trading/terminal", label: "Open Terminal" },
      },
      {
        id: "exec-algos",
        question: "What execution algorithms are available?",
        answer:
          "The platform supports TWAP, VWAP, iceberg, sniper, and custom algos. Algorithm selection is in the order ticket — choose based on urgency, size, and market impact requirements.",
        link: { href: "/services/trading/terminal", label: "View algo options" },
      },
      {
        id: "exec-bundles",
        question: "What are trade bundles?",
        answer:
          "**Trading > Bundles** lets you group multiple orders into a single atomic package — e.g., buy BTC on Binance and sell on Hyperliquid simultaneously. Bundles execute all-or-nothing.",
        link: { href: "/services/trading/defi/bundles", label: "Open Bundles" },
      },
      {
        id: "exec-instructions",
        question: "What are trading instructions?",
        answer:
          "**Trading > Instructions** shows pending and executed trading instructions from the strategy service. Each instruction specifies instrument, direction, size, and urgency. Instructions are routed to the execution service for fulfilment.",
        link: { href: "/services/trading/instructions", label: "View Instructions" },
      },
    ],
  },

  // ── 14. Getting Help ──────────────────────────────────────────────────────
  {
    id: "help",
    question: "I need more help or want to report an issue",
    answer:
      "Several options:\n\n• **Contact page** — reach our support team directly\n• **Demo booking** — schedule a walkthrough with a specialist\n• **This chatbot** — click **Start over** to explore more topics\n\nFor internal users, the **Admin & Ops** dashboard has system-level diagnostics and service health.",
    link: { href: "/contact", label: "Contact Support" },
    children: [
      {
        id: "help-demo",
        question: "Can I book a demo?",
        answer:
          "Yes. Visit the **Demo** page to schedule a live walkthrough. Choose your time slot and which services you'd like to focus on. We'll tailor the session to your use case.",
        link: { href: "/demo", label: "Book a Demo" },
      },
      {
        id: "help-keyboard",
        question: "Are there keyboard shortcuts?",
        answer:
          "Key shortcuts:\n\n• **Cmd+K / Ctrl+K** — Command palette (search anything)\n• **Cmd+Shift+/** — Toggle this help chat\n• **Escape** — Close modals and panels\n\nMore shortcuts are listed in the command palette under **Keyboard Shortcuts**.",
      },
      {
        id: "help-investor",
        question: "Where are investor materials?",
        answer:
          "The **Investor Relations** page has board presentations, disaster recovery documentation, security posture reports, and operational resilience materials. Access requires the investor-relations entitlement.",
        link: { href: "/investor-relations", label: "Open Investor Relations" },
      },
    ],
  },
];
