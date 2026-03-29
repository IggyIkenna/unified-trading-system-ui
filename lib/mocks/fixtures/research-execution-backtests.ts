// Algo types aligned with execution-service GridConfig + AlgorithmSpec (mirrors new-execution-dialog)
type AlgoType =
  | "TWAP"
  | "VWAP"
  | "ADAPTIVE_TWAP"
  | "ALMGREN_CHRISS"
  | "POV_DYNAMIC"
  | "HYBRID_OPTIMAL"
  | "PASSIVE_AGGRESSIVE_HYBRID"
  | "BENCHMARK_FILL"
  | "SMART_ORDER_ROUTER"
  | "SOR_TWAP"
  | "SWAP_TWAP"
  | "MAX_SLIPPAGE";

export interface MockStrategyInstruction {
  id: string;
  type: string;
  instrument: string;
  venue: string;
  defaultAlgo: AlgoType;
}

export interface MockStrategyBacktestRow {
  id: string;
  name: string;
  instructions: MockStrategyInstruction[];
}

export const MOCK_STRATEGY_BACKTESTS: MockStrategyBacktestRow[] = [
  {
    id: "sbt-001",
    name: "BTC Momentum v3 — Binance",
    instructions: [
      { id: "instr-001", type: "TRADE", instrument: "BTC-USDT", venue: "Binance", defaultAlgo: "VWAP" },
      { id: "instr-002", type: "TRADE", instrument: "ETH-USDT", venue: "Binance", defaultAlgo: "TWAP" },
    ],
  },
  {
    id: "sbt-002",
    name: "ETH Mean-Rev — Hyperliquid",
    instructions: [
      {
        id: "instr-003",
        type: "TRADE",
        instrument: "ETH-PERP",
        venue: "Hyperliquid",
        defaultAlgo: "ADAPTIVE_TWAP",
      },
      { id: "instr-004", type: "TRADE", instrument: "ETH-USDT", venue: "Hyperliquid", defaultAlgo: "VWAP" },
    ],
  },
  {
    id: "sbt-003",
    name: "Multi-Asset Trend — OKX",
    instructions: [
      { id: "instr-005", type: "TRADE", instrument: "BTC-USDT", venue: "OKX", defaultAlgo: "VWAP" },
      { id: "instr-006", type: "TRADE", instrument: "SOL-USDT", venue: "OKX", defaultAlgo: "TWAP" },
      { id: "instr-007", type: "TRADE", instrument: "ETH-USDT", venue: "OKX", defaultAlgo: "POV_DYNAMIC" },
    ],
  },
  {
    id: "sbt-004",
    name: "DeFi Basis — Aave/Uniswap",
    instructions: [
      { id: "instr-008", type: "LEND", instrument: "USDC", venue: "Aave", defaultAlgo: "BENCHMARK_FILL" },
      {
        id: "instr-009",
        type: "SWAP",
        instrument: "WETH-USDC",
        venue: "Uniswap",
        defaultAlgo: "SMART_ORDER_ROUTER",
      },
      {
        id: "instr-010",
        type: "FLASH_LOAN",
        instrument: "USDC",
        venue: "Aave",
        defaultAlgo: "BENCHMARK_FILL",
      },
    ],
  },
  {
    id: "sbt-005",
    name: "SOL Breakout — Binance",
    instructions: [
      {
        id: "instr-011",
        type: "TRADE",
        instrument: "SOL-USDT",
        venue: "Binance",
        defaultAlgo: "ALMGREN_CHRISS",
      },
    ],
  },
  {
    id: "sbt-006",
    name: "Options Vol Surface — Deribit",
    instructions: [
      {
        id: "instr-012",
        type: "TRADE",
        instrument: "ETH-28MAR-3500-C",
        venue: "Deribit",
        defaultAlgo: "PASSIVE_AGGRESSIVE_HYBRID",
      },
      {
        id: "instr-013",
        type: "TRADE",
        instrument: "ETH-28MAR-3500-P",
        venue: "Deribit",
        defaultAlgo: "PASSIVE_AGGRESSIVE_HYBRID",
      },
    ],
  },
  {
    id: "sbt-007",
    name: "Staking Yield — Lido/Aave",
    instructions: [
      { id: "instr-014", type: "STAKE", instrument: "ETH", venue: "Lido", defaultAlgo: "BENCHMARK_FILL" },
      { id: "instr-015", type: "LEND", instrument: "stETH", venue: "Aave", defaultAlgo: "BENCHMARK_FILL" },
    ],
  },
];
