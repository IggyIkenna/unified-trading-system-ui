"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlaskConical, Zap, Brain } from "lucide-react";
import { toast } from "sonner";
import {
  GridConfigPanel,
  type GridParameter,
  type SubscriptionItem,
} from "./grid-config-panel";

// ─── Domain-specific preset configs ─────────────────────────────────────────

const STRATEGY_SUBSCRIPTIONS: { title: string; items: SubscriptionItem[] }[] = [
  {
    title: "Features",
    items: [
      { id: "momentum", label: "Momentum", category: "Signal", enabled: true },
      { id: "mean-rev", label: "Mean Reversion", category: "Signal", enabled: true },
      { id: "volatility", label: "Volatility", category: "Signal", enabled: true },
      { id: "on-chain", label: "On-Chain", category: "Signal", enabled: true },
      { id: "macro", label: "Macro", category: "Signal", enabled: false },
      { id: "sentiment", label: "Sentiment", category: "Signal", enabled: false },
      { id: "calendar", label: "Calendar", category: "Signal", enabled: true },
      { id: "orderflow", label: "Order Flow", category: "Microstructure", enabled: true },
      { id: "funding", label: "Funding Rate", category: "Microstructure", enabled: true },
      { id: "basis", label: "Basis Spread", category: "Microstructure", enabled: true },
      { id: "iv-skew", label: "IV Skew", category: "Options", enabled: false },
    ],
  },
  {
    title: "Models",
    items: [
      { id: "lstm", label: "LSTM", category: "Deep Learning", enabled: true },
      { id: "xgboost", label: "XGBoost", category: "Tree-based", enabled: true },
      { id: "lightgbm", label: "LightGBM", category: "Tree-based", enabled: true },
      { id: "transformer", label: "Transformer", category: "Deep Learning", enabled: false },
      { id: "gnn", label: "Graph Neural Net", category: "Deep Learning", enabled: false },
      { id: "logistic", label: "Logistic", category: "Linear", enabled: true },
    ],
  },
  {
    title: "Instruments",
    items: [
      { id: "btc-usdt", label: "BTC-USDT", category: "Spot", enabled: true },
      { id: "eth-usdt", label: "ETH-USDT", category: "Spot", enabled: true },
      { id: "sol-usdt", label: "SOL-USDT", category: "Spot", enabled: true },
      { id: "btc-perp", label: "BTC-PERP", category: "Derivatives", enabled: true },
      { id: "eth-perp", label: "ETH-PERP", category: "Derivatives", enabled: true },
      { id: "spy", label: "SPY", category: "TradFi", enabled: false },
      { id: "qqq", label: "QQQ", category: "TradFi", enabled: false },
    ],
  },
];

const STRATEGY_GRID_PARAMS: GridParameter[] = [
  { id: "lookback", label: "Lookback Period (bars)", type: "range", min: 10, max: 200, step: 10, rangeValue: [20, 100], category: "Core" },
  { id: "threshold", label: "Signal Threshold", type: "range", min: 0.5, max: 0.95, step: 0.05, rangeValue: [0.6, 0.85], category: "Core" },
  { id: "timeframe", label: "Timeframe", type: "set", options: [
    { value: "5m", label: "5m" }, { value: "15m", label: "15m" },
    { value: "1h", label: "1h" }, { value: "4h", label: "4h" }, { value: "1d", label: "1d" },
  ], selectedValues: ["1h", "4h"], category: "Core" },
  { id: "stop-loss", label: "Stop Loss %", type: "range", min: 1, max: 10, step: 1, rangeValue: [2, 5], category: "Risk" },
  { id: "take-profit", label: "Take Profit %", type: "range", min: 2, max: 20, step: 2, rangeValue: [4, 10], category: "Risk" },
  { id: "max-position", label: "Max Position Size ($)", type: "set", options: [
    { value: "10000", label: "$10K" }, { value: "25000", label: "$25K" },
    { value: "50000", label: "$50K" }, { value: "100000", label: "$100K" },
  ], selectedValues: ["25000", "50000"], category: "Risk" },
  { id: "portfolio-mode", label: "Portfolio Mode", type: "toggle", sweepBoth: false, category: "Risk", hint: "Enable to test with multi-asset portfolio constraints" },
];

const EXECUTION_SUBSCRIPTIONS: { title: string; items: SubscriptionItem[] }[] = [
  {
    title: "Venues",
    items: [
      { id: "binance", label: "Binance", category: "CeFi", enabled: true },
      { id: "hyperliquid", label: "Hyperliquid", category: "CeFi", enabled: true },
      { id: "okx", label: "OKX", category: "CeFi", enabled: true },
      { id: "deribit", label: "Deribit", category: "CeFi", enabled: true },
      { id: "uniswap", label: "Uniswap V3", category: "DeFi", enabled: true },
      { id: "aave", label: "Aave V3", category: "DeFi", enabled: true },
      { id: "nasdaq", label: "NASDAQ", category: "TradFi", enabled: false },
      { id: "cme", label: "CME", category: "TradFi", enabled: false },
    ],
  },
  {
    title: "Algorithms",
    items: [
      { id: "twap", label: "TWAP", category: "Time-based", enabled: true },
      { id: "vwap", label: "VWAP", category: "Volume-based", enabled: true },
      { id: "adaptive-twap", label: "Adaptive TWAP", category: "Time-based", enabled: true },
      { id: "almgren-chriss", label: "Almgren-Chriss", category: "Optimal", enabled: true },
      { id: "pov-dynamic", label: "POV Dynamic", category: "Volume-based", enabled: true },
      { id: "hybrid-optimal", label: "Hybrid Optimal", category: "Optimal", enabled: false },
      { id: "passive-agg", label: "Passive/Agg Hybrid", category: "Optimal", enabled: false },
    ],
  },
];

const EXECUTION_GRID_PARAMS: GridParameter[] = [
  { id: "horizon", label: "horizon_secs", type: "range", min: 300, max: 7200, step: 300, rangeValue: [600, 3600], category: "Algo Params", hint: "Execution window in seconds" },
  { id: "num-slices", label: "num_slices", type: "set", options: [
    { value: "5", label: "5" }, { value: "10", label: "10" },
    { value: "20", label: "20" }, { value: "50", label: "50" },
  ], selectedValues: ["10", "20"], category: "Algo Params" },
  { id: "risk-aversion", label: "risk_aversion (Almgren-Chriss)", type: "range", min: 0.1, max: 5, step: 0.1, rangeValue: [0.5, 2.0], category: "Algo Params" },
  { id: "slippage-model", label: "Slippage Model", type: "set", options: [
    { value: "orderbook", label: "Orderbook" }, { value: "fixed_bps", label: "Fixed BPS" },
    { value: "empirical", label: "Empirical" },
  ], selectedValues: ["orderbook", "empirical"], category: "Market Impact" },
  { id: "smart-routing", label: "Smart Order Routing", type: "toggle", sweepBoth: true, category: "Market Impact", hint: "Sweep with and without SOR" },
];

const ML_SUBSCRIPTIONS: { title: string; items: SubscriptionItem[] }[] = [
  {
    title: "Feature Sets",
    items: [
      { id: "momentum", label: "Momentum", category: "Signal", enabled: true },
      { id: "volatility", label: "Volatility", category: "Signal", enabled: true },
      { id: "on-chain", label: "On-Chain", category: "DeFi", enabled: true },
      { id: "orderflow", label: "Order Flow", category: "Microstructure", enabled: true },
      { id: "macro", label: "Macro Events", category: "Macro", enabled: false },
      { id: "sentiment", label: "NLP Sentiment", category: "Alternative", enabled: false },
    ],
  },
  {
    title: "Model Architectures",
    items: [
      { id: "lstm", label: "LSTM", category: "RNN", enabled: true },
      { id: "xgboost", label: "XGBoost", category: "Gradient Boosting", enabled: true },
      { id: "lightgbm", label: "LightGBM", category: "Gradient Boosting", enabled: true },
      { id: "transformer", label: "Temporal Transformer", category: "Attention", enabled: false },
    ],
  },
  {
    title: "Training Data",
    items: [
      { id: "2y", label: "2 Years", category: "Window", enabled: true },
      { id: "5y", label: "5 Years", category: "Window", enabled: true },
      { id: "full", label: "Full History", category: "Window", enabled: false },
    ],
  },
];

const ML_GRID_PARAMS: GridParameter[] = [
  { id: "learning-rate", label: "Learning Rate", type: "range", min: 0.0001, max: 0.01, step: 0.0001, rangeValue: [0.001, 0.005], category: "Hyperparameters" },
  { id: "epochs", label: "Epochs", type: "set", options: [
    { value: "50", label: "50" }, { value: "100", label: "100" },
    { value: "200", label: "200" }, { value: "500", label: "500" },
  ], selectedValues: ["100", "200"], category: "Hyperparameters" },
  { id: "batch-size", label: "Batch Size", type: "set", options: [
    { value: "32", label: "32" }, { value: "64", label: "64" },
    { value: "128", label: "128" }, { value: "256", label: "256" },
  ], selectedValues: ["64", "128"], category: "Hyperparameters" },
  { id: "lookback-window", label: "Lookback Window (bars)", type: "range", min: 10, max: 200, step: 10, rangeValue: [30, 100], category: "Data" },
  { id: "prediction-horizon", label: "Prediction Horizon", type: "set", options: [
    { value: "1h", label: "1h" }, { value: "4h", label: "4h" },
    { value: "1d", label: "1d" }, { value: "1w", label: "1w" },
  ], selectedValues: ["1h", "4h", "1d"], category: "Data" },
  { id: "dropout", label: "Dropout Rate", type: "range", min: 0, max: 0.5, step: 0.05, rangeValue: [0.1, 0.3], category: "Regularisation" },
  { id: "early-stopping", label: "Early Stopping", type: "toggle", sweepBoth: true, category: "Regularisation", hint: "Sweep with and without early stopping" },
];

// ─── Dialog Component ───────────────────────────────────────────────────────

export function GridSearchDialog({
  open,
  onClose,
  defaultTab = "strategy",
}: {
  open: boolean;
  onClose: () => void;
  defaultTab?: "strategy" | "execution" | "ml";
}) {
  const [tab, setTab] = React.useState(defaultTab);
  const [strategyParams, setStrategyParams] = React.useState(STRATEGY_GRID_PARAMS);
  const [executionParams, setExecutionParams] = React.useState(EXECUTION_GRID_PARAMS);
  const [mlParams, setMlParams] = React.useState(ML_GRID_PARAMS);
  const [isRunning, setIsRunning] = React.useState(false);

  function updateParam(
    params: GridParameter[],
    setParams: React.Dispatch<React.SetStateAction<GridParameter[]>>,
    id: string,
    update: Partial<GridParameter>,
  ) {
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...update } : p)),
    );
  }

  async function handleRun() {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Grid search queued successfully (paper mode)");
    setIsRunning(false);
    onClose();
  }

  const ICONS = {
    strategy: <FlaskConical className="size-4 text-emerald-400" />,
    execution: <Zap className="size-4 text-amber-400" />,
    ml: <Brain className="size-4 text-violet-400" />,
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ICONS[tab]}
            Grid Search —{" "}
            {tab === "strategy"
              ? "Strategy Backtest"
              : tab === "execution"
                ? "Execution Simulation"
                : "ML Training"}
          </DialogTitle>
          <DialogDescription>
            Define parameter ranges to sweep across. Fixed items are gated by
            your subscription; dynamic parameters generate the search grid.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          className="flex-1 min-h-0"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="strategy" className="gap-1.5 text-xs">
              <FlaskConical className="size-3.5" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="execution" className="gap-1.5 text-xs">
              <Zap className="size-3.5" /> Execution
            </TabsTrigger>
            <TabsTrigger value="ml" className="gap-1.5 text-xs">
              <Brain className="size-3.5" /> ML Training
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-3 pr-3" style={{ maxHeight: "60vh" }}>
            <TabsContent value="strategy" className="mt-0">
              <GridConfigPanel
                subscriptions={STRATEGY_SUBSCRIPTIONS}
                parameters={strategyParams}
                onParameterChange={(id, u) =>
                  updateParam(strategyParams, setStrategyParams, id, u)
                }
                onRunGrid={handleRun}
                isRunning={isRunning}
                domain="Strategy Backtest"
              />
            </TabsContent>

            <TabsContent value="execution" className="mt-0">
              <GridConfigPanel
                subscriptions={EXECUTION_SUBSCRIPTIONS}
                parameters={executionParams}
                onParameterChange={(id, u) =>
                  updateParam(executionParams, setExecutionParams, id, u)
                }
                onRunGrid={handleRun}
                isRunning={isRunning}
                domain="Execution Simulation"
              />
            </TabsContent>

            <TabsContent value="ml" className="mt-0">
              <GridConfigPanel
                subscriptions={ML_SUBSCRIPTIONS}
                parameters={mlParams}
                onParameterChange={(id, u) =>
                  updateParam(mlParams, setMlParams, id, u)
                }
                onRunGrid={handleRun}
                isRunning={isRunning}
                domain="ML Training"
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
