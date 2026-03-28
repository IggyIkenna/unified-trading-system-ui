"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlaskConical, Zap, Brain } from "lucide-react";
import { toast } from "sonner";
import {
  GridConfigPanel,
  type GridParameter,
  type SubscriptionItem,
} from "./grid-config-panel";

// ─── Per-archetype strategy params (from strategy-service TypedDicts) ──────

const STRATEGY_ARCHETYPE_PARAMS: Record<string, GridParameter[]> = {
  momentum: [
    { id: "prediction_threshold", label: "Prediction Threshold", type: "range", min: 0.5, max: 0.95, step: 0.05, rangeValue: [0.6, 0.85], category: "Signal", backendField: "prediction_threshold" },
    { id: "max_position_size_usd", label: "Max Position ($)", type: "set", options: [{ value: "25000", label: "$25K" }, { value: "50000", label: "$50K" }, { value: "100000", label: "$100K" }, { value: "250000", label: "$250K" }], selectedValues: ["50000", "100000"], category: "Risk", backendField: "max_position_size_usd" },
    { id: "stop_loss_pct", label: "Stop Loss %", type: "range", min: 0.01, max: 0.1, step: 0.01, rangeValue: [0.02, 0.05], category: "Risk", backendField: "stop_loss_pct" },
    { id: "take_profit_pct", label: "Take Profit %", type: "range", min: 0.02, max: 0.2, step: 0.02, rangeValue: [0.04, 0.1], category: "Risk", backendField: "take_profit_pct" },
    { id: "rebalance_interval_bars", label: "Rebalance Interval (bars)", type: "set", options: [{ value: "1", label: "1" }, { value: "4", label: "4" }, { value: "12", label: "12" }, { value: "24", label: "24" }], selectedValues: ["4", "12"], category: "Execution", backendField: "rebalance_interval_bars" },
    { id: "timeframe", label: "Timeframe", type: "set", options: [{ value: "5m", label: "5m" }, { value: "15m", label: "15m" }, { value: "1h", label: "1h" }, { value: "4h", label: "4h" }, { value: "1d", label: "1d" }], selectedValues: ["1h", "4h"], category: "Data", backendField: "timeframe" },
  ],
  mean_reversion: [
    { id: "entry_z_score", label: "Entry Z-Score", type: "range", min: 1.0, max: 3.0, step: 0.25, rangeValue: [1.5, 2.5], category: "Signal", backendField: "entry_z_score" },
    { id: "exit_z_score", label: "Exit Z-Score", type: "range", min: 0.25, max: 1.5, step: 0.25, rangeValue: [0.5, 1.0], category: "Signal", backendField: "exit_z_score" },
    { id: "lookback_period", label: "Lookback Period (bars)", type: "range", min: 20, max: 200, step: 10, rangeValue: [30, 100], category: "Signal", backendField: "lookback_period" },
    { id: "use_ml", label: "ML Signal Enhancement", type: "toggle", sweepBoth: true, category: "Signal", backendField: "use_ml", hint: "Sweep with and without ML signal overlay" },
    { id: "stop_loss_pct", label: "Stop Loss %", type: "range", min: 0.01, max: 0.1, step: 0.01, rangeValue: [0.02, 0.05], category: "Risk", backendField: "stop_loss_pct" },
    { id: "timeframe", label: "Timeframe", type: "set", options: [{ value: "5m", label: "5m" }, { value: "15m", label: "15m" }, { value: "1h", label: "1h" }, { value: "4h", label: "4h" }], selectedValues: ["15m", "1h"], category: "Data", backendField: "timeframe" },
  ],
  statistical_arb: [
    { id: "cointegration_lookback", label: "Cointegration Lookback", type: "range", min: 50, max: 500, step: 50, rangeValue: [100, 300], category: "Signal", backendField: "cointegration_lookback" },
    { id: "entry_zscore", label: "Entry Z-Score", type: "range", min: 1.0, max: 3.0, step: 0.25, rangeValue: [1.5, 2.5], category: "Signal", backendField: "entry_zscore" },
    { id: "exit_zscore", label: "Exit Z-Score", type: "range", min: 0.25, max: 1.5, step: 0.25, rangeValue: [0.5, 1.0], category: "Signal", backendField: "exit_zscore" },
    { id: "hedge_ratio_window", label: "Hedge Ratio Window", type: "range", min: 20, max: 200, step: 10, rangeValue: [30, 100], category: "Signal", backendField: "hedge_ratio_window" },
    { id: "max_half_life_bars", label: "Max Half-Life (bars)", type: "set", options: [{ value: "50", label: "50" }, { value: "100", label: "100" }, { value: "200", label: "200" }], selectedValues: ["50", "100"], category: "Signal", backendField: "max_half_life_bars" },
    { id: "min_cointegration_score", label: "Min Coint. Score", type: "range", min: 0.5, max: 0.99, step: 0.05, rangeValue: [0.7, 0.9], category: "Signal", backendField: "min_cointegration_score" },
  ],
  volatility: [
    { id: "target_delta", label: "Target Delta", type: "range", min: -0.5, max: 0.5, step: 0.05, rangeValue: [-0.2, 0.2], category: "Options", backendField: "target_delta" },
    { id: "target_expiry_days", label: "Target Expiry (days)", type: "set", options: [{ value: "7", label: "7d" }, { value: "14", label: "14d" }, { value: "30", label: "30d" }, { value: "60", label: "60d" }], selectedValues: ["14", "30"], category: "Options", backendField: "target_expiry_days" },
    { id: "combo_type", label: "Combo Type", type: "set", options: [{ value: "straddle", label: "Straddle" }, { value: "strangle", label: "Strangle" }, { value: "butterfly", label: "Butterfly" }, { value: "condor", label: "Iron Condor" }], selectedValues: ["straddle", "strangle"], category: "Options", backendField: "combo_type" },
    { id: "entry_iv_percentile_low", label: "IV Percentile Entry Low", type: "range", min: 0, max: 50, step: 5, rangeValue: [10, 30], category: "Options", backendField: "entry_iv_percentile_low" },
    { id: "entry_iv_percentile_high", label: "IV Percentile Entry High", type: "range", min: 50, max: 100, step: 5, rangeValue: [70, 90], category: "Options", backendField: "entry_iv_percentile_high" },
  ],
  yield: [
    { id: "min_spread_bps", label: "Min Spread (BPS)", type: "range", min: 5, max: 100, step: 5, rangeValue: [10, 50], category: "DeFi", backendField: "min_spread_bps" },
    { id: "max_leverage", label: "Max Leverage", type: "range", min: 1, max: 10, step: 0.5, rangeValue: [1, 3], category: "DeFi", backendField: "max_leverage" },
    { id: "min_health_factor", label: "Min Health Factor", type: "range", min: 1.05, max: 2.0, step: 0.05, rangeValue: [1.2, 1.5], category: "DeFi", backendField: "min_health_factor" },
    { id: "rebalancing_trigger", label: "Rebalance Trigger", type: "set", options: [{ value: "event_driven", label: "Event" }, { value: "threshold", label: "Threshold" }, { value: "periodic", label: "Periodic" }], selectedValues: ["event_driven", "threshold"], category: "DeFi", backendField: "trigger_type" },
    { id: "smart_order_routing", label: "Smart Order Routing", type: "toggle", sweepBoth: true, category: "DeFi", backendField: "smart_order_routing.enabled" },
  ],
  arbitrage: [
    { id: "entry_zscore", label: "Entry Z-Score", type: "range", min: 1.0, max: 4.0, step: 0.5, rangeValue: [1.5, 3.0], category: "Signal", backendField: "entry_zscore" },
    { id: "exit_zscore", label: "Exit Z-Score", type: "range", min: 0.25, max: 1.5, step: 0.25, rangeValue: [0.5, 1.0], category: "Signal", backendField: "exit_zscore" },
    { id: "max_hold_bars", label: "Max Hold (bars)", type: "set", options: [{ value: "12", label: "12" }, { value: "24", label: "24" }, { value: "48", label: "48" }, { value: "96", label: "96" }], selectedValues: ["24", "48"], category: "Signal", backendField: "max_hold_bars" },
    { id: "timeframe", label: "Timeframe", type: "set", options: [{ value: "1m", label: "1m" }, { value: "5m", label: "5m" }, { value: "15m", label: "15m" }], selectedValues: ["1m", "5m"], category: "Data", backendField: "timeframe" },
  ],
  value_betting: [
    { id: "min_edge_pct", label: "Min Edge %", type: "range", min: 1, max: 15, step: 0.5, rangeValue: [2, 8], category: "Signal", backendField: "min_edge_pct" },
    { id: "stake_sizing", label: "Stake Sizing", type: "set", options: [{ value: "fixed", label: "Fixed" }, { value: "kelly", label: "Kelly" }, { value: "half_kelly", label: "Half Kelly" }], selectedValues: ["kelly", "half_kelly"], category: "Risk", backendField: "stake_sizing" },
    { id: "max_stake_fraction", label: "Max Stake Fraction", type: "range", min: 0.01, max: 0.1, step: 0.01, rangeValue: [0.02, 0.05], category: "Risk", backendField: "max_stake_fraction" },
    { id: "max_concurrent_bets", label: "Max Concurrent Bets", type: "set", options: [{ value: "5", label: "5" }, { value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }], selectedValues: ["10", "20"], category: "Risk", backendField: "max_concurrent_bets" },
  ],
};

// ─── Per-algorithm execution params (from grid_generator_models.py) ────────

const EXECUTION_ALGO_PARAMS: Record<string, GridParameter[]> = {
  TWAP: [
    { id: "horizon_secs", label: "Horizon (secs)", type: "range", min: 60, max: 7200, step: 60, rangeValue: [300, 3600], category: "TWAP", backendField: "horizon_secs" },
    { id: "num_slices", label: "Num Slices", type: "set", options: [{ value: "5", label: "5" }, { value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }], selectedValues: ["10", "20"], category: "TWAP", backendField: "num_slices" },
    { id: "interval_secs", label: "Interval (secs)", type: "set", options: [{ value: "30", label: "30s" }, { value: "60", label: "1m" }, { value: "120", label: "2m" }, { value: "300", label: "5m" }], selectedValues: ["60", "120"], category: "TWAP", backendField: "interval_secs" },
  ],
  VWAP: [
    { id: "num_intervals", label: "Num Intervals", type: "set", options: [{ value: "5", label: "5" }, { value: "10", label: "10" }, { value: "20", label: "20" }], selectedValues: ["10"], category: "VWAP", backendField: "num_intervals" },
    { id: "volume_profile", label: "Volume Profile", type: "set", options: [{ value: "standard", label: "Standard" }, { value: "aggressive", label: "Aggressive" }, { value: "u_shaped", label: "U-Shaped" }], selectedValues: ["standard", "aggressive"], category: "VWAP", backendField: "volume_profile" },
  ],
  ADAPTIVE_TWAP: [
    { id: "horizon_secs", label: "Horizon (secs)", type: "range", min: 60, max: 7200, step: 60, rangeValue: [300, 3600], category: "Adaptive TWAP", backendField: "horizon_secs" },
    { id: "urgency_factor", label: "Urgency Factor", type: "range", min: 0.5, max: 3.0, step: 0.1, rangeValue: [0.8, 1.5], category: "Adaptive TWAP", backendField: "urgency_factor" },
    { id: "num_slices", label: "Num Slices", type: "set", options: [{ value: "5", label: "5" }, { value: "10", label: "10" }, { value: "20", label: "20" }], selectedValues: ["10", "20"], category: "Adaptive TWAP", backendField: "num_slices" },
  ],
  ALMGREN_CHRISS: [
    { id: "risk_aversion", label: "Risk Aversion", type: "range", min: 0.1, max: 5.0, step: 0.1, rangeValue: [0.5, 2.0], category: "Almgren-Chriss", backendField: "risk_aversion" },
    { id: "horizon_secs", label: "Horizon (secs)", type: "range", min: 300, max: 7200, step: 300, rangeValue: [600, 3600], category: "Almgren-Chriss", backendField: "horizon_secs" },
  ],
  POV_DYNAMIC: [
    { id: "target_pov", label: "Target POV %", type: "range", min: 5, max: 50, step: 5, rangeValue: [10, 30], category: "POV", backendField: "target_pov" },
    { id: "min_pov", label: "Min POV %", type: "range", min: 1, max: 20, step: 1, rangeValue: [5, 10], category: "POV", backendField: "min_pov" },
    { id: "max_pov", label: "Max POV %", type: "range", min: 20, max: 80, step: 5, rangeValue: [30, 50], category: "POV", backendField: "max_pov" },
  ],
  SMART_ORDER_ROUTER: [
    { id: "max_slippage_bps", label: "Max Slippage (BPS)", type: "range", min: 5, max: 200, step: 5, rangeValue: [10, 50], category: "SOR", backendField: "max_slippage_bps" },
  ],
};

// ─── ML model-specific hyperparams ─────────────────────────────────────────

const ML_MODEL_PARAMS: Record<string, GridParameter[]> = {
  lstm: [
    { id: "learning_rate", label: "Learning Rate", type: "range", min: 0.0001, max: 0.01, step: 0.0001, rangeValue: [0.0005, 0.005], category: "Optimiser", backendField: "learning_rate" },
    { id: "epochs", label: "Epochs", type: "set", options: [{ value: "50", label: "50" }, { value: "100", label: "100" }, { value: "200", label: "200" }], selectedValues: ["100", "200"], category: "Training", backendField: "epochs" },
    { id: "hidden_size", label: "Hidden Size", type: "set", options: [{ value: "64", label: "64" }, { value: "128", label: "128" }, { value: "256", label: "256" }], selectedValues: ["128"], category: "Architecture", backendField: "hidden_size" },
    { id: "num_layers", label: "Num Layers", type: "set", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }], selectedValues: ["2"], category: "Architecture", backendField: "num_layers" },
    { id: "dropout", label: "Dropout", type: "range", min: 0, max: 0.5, step: 0.05, rangeValue: [0.1, 0.3], category: "Regularisation", backendField: "dropout" },
    { id: "batch_size", label: "Batch Size", type: "set", options: [{ value: "32", label: "32" }, { value: "64", label: "64" }, { value: "128", label: "128" }], selectedValues: ["64", "128"], category: "Training", backendField: "batch_size" },
  ],
  xgboost: [
    { id: "n_estimators", label: "N Estimators", type: "range", min: 50, max: 500, step: 50, rangeValue: [100, 300], category: "Core", backendField: "n_estimators" },
    { id: "max_depth", label: "Max Depth", type: "set", options: [{ value: "3", label: "3" }, { value: "5", label: "5" }, { value: "7", label: "7" }, { value: "9", label: "9" }], selectedValues: ["5", "7"], category: "Core", backendField: "max_depth" },
    { id: "learning_rate", label: "Learning Rate", type: "range", min: 0.01, max: 0.3, step: 0.01, rangeValue: [0.05, 0.15], category: "Core", backendField: "learning_rate" },
    { id: "min_child_weight", label: "Min Child Weight", type: "set", options: [{ value: "1", label: "1" }, { value: "3", label: "3" }, { value: "5", label: "5" }], selectedValues: ["1", "3"], category: "Regularisation", backendField: "min_child_weight" },
    { id: "subsample", label: "Subsample", type: "range", min: 0.5, max: 1.0, step: 0.1, rangeValue: [0.7, 0.9], category: "Regularisation", backendField: "subsample" },
  ],
  lightgbm: [
    { id: "n_estimators", label: "N Estimators", type: "range", min: 50, max: 500, step: 50, rangeValue: [100, 300], category: "Core", backendField: "n_estimators" },
    { id: "num_leaves", label: "Num Leaves", type: "set", options: [{ value: "15", label: "15" }, { value: "31", label: "31" }, { value: "63", label: "63" }, { value: "127", label: "127" }], selectedValues: ["31", "63"], category: "Core", backendField: "num_leaves" },
    { id: "learning_rate", label: "Learning Rate", type: "range", min: 0.01, max: 0.3, step: 0.01, rangeValue: [0.05, 0.15], category: "Core", backendField: "learning_rate" },
    { id: "min_data_in_leaf", label: "Min Data in Leaf", type: "set", options: [{ value: "5", label: "5" }, { value: "10", label: "10" }, { value: "20", label: "20" }], selectedValues: ["10", "20"], category: "Regularisation", backendField: "min_data_in_leaf" },
    { id: "feature_fraction", label: "Feature Fraction", type: "range", min: 0.5, max: 1.0, step: 0.1, rangeValue: [0.7, 0.9], category: "Regularisation", backendField: "feature_fraction" },
  ],
};

// ─── Shared subscription presets ────────────────────────────────────────────

function makeItems(items: { id: string; label: string; cat: string; enabled: boolean }[]): SubscriptionItem[] {
  return items.map((i) => ({ ...i, category: i.cat, selected: i.enabled, description: "" }));
}

const FEATURE_ITEMS = makeItems([
  { id: "momentum", label: "Momentum", cat: "Signal", enabled: true },
  { id: "mean-rev", label: "Mean Reversion", cat: "Signal", enabled: true },
  { id: "volatility", label: "Volatility", cat: "Signal", enabled: true },
  { id: "on-chain", label: "On-Chain", cat: "DeFi", enabled: true },
  { id: "funding", label: "Funding Rate", cat: "Microstructure", enabled: true },
  { id: "orderflow", label: "Order Flow", cat: "Microstructure", enabled: true },
  { id: "basis", label: "Basis Spread", cat: "Microstructure", enabled: true },
  { id: "macro", label: "Macro Events", cat: "Macro", enabled: false },
  { id: "sentiment", label: "NLP Sentiment", cat: "Alternative", enabled: false },
  { id: "calendar", label: "Calendar", cat: "Alternative", enabled: true },
  { id: "iv-skew", label: "IV Skew", cat: "Options", enabled: false },
]);

const INSTRUMENT_ITEMS = makeItems([
  { id: "btc-usdt", label: "BTC-USDT", cat: "Spot", enabled: true },
  { id: "eth-usdt", label: "ETH-USDT", cat: "Spot", enabled: true },
  { id: "sol-usdt", label: "SOL-USDT", cat: "Spot", enabled: true },
  { id: "btc-perp", label: "BTC-PERP", cat: "Derivatives", enabled: true },
  { id: "eth-perp", label: "ETH-PERP", cat: "Derivatives", enabled: true },
  { id: "eth-options", label: "ETH Options", cat: "Derivatives", enabled: true },
  { id: "spy", label: "SPY", cat: "TradFi", enabled: false },
]);

const VENUE_ITEMS = makeItems([
  { id: "binance", label: "Binance", cat: "CeFi", enabled: true },
  { id: "hyperliquid", label: "Hyperliquid", cat: "CeFi", enabled: true },
  { id: "okx", label: "OKX", cat: "CeFi", enabled: true },
  { id: "deribit", label: "Deribit", cat: "CeFi", enabled: true },
  { id: "uniswap", label: "Uniswap V3", cat: "DeFi", enabled: true },
  { id: "aave", label: "Aave V3", cat: "DeFi", enabled: true },
  { id: "nasdaq", label: "NASDAQ", cat: "TradFi", enabled: false },
]);

// ─── Dialog ─────────────────────────────────────────────────────────────────

type Domain = "strategy" | "execution" | "ml";

const ARCHETYPES = [
  { value: "momentum", label: "Momentum" },
  { value: "mean_reversion", label: "Mean Reversion" },
  { value: "statistical_arb", label: "Statistical Arb" },
  { value: "volatility", label: "Volatility / Options" },
  { value: "yield", label: "DeFi Yield" },
  { value: "arbitrage", label: "Cross-Exchange Arb" },
  { value: "value_betting", label: "Sports Value Betting" },
];

const ALGOS = [
  { value: "TWAP", label: "TWAP" },
  { value: "VWAP", label: "VWAP" },
  { value: "ADAPTIVE_TWAP", label: "Adaptive TWAP" },
  { value: "ALMGREN_CHRISS", label: "Almgren-Chriss" },
  { value: "POV_DYNAMIC", label: "POV Dynamic" },
  { value: "SMART_ORDER_ROUTER", label: "Smart Order Router" },
];

const MODELS = [
  { value: "lstm", label: "LSTM" },
  { value: "xgboost", label: "XGBoost" },
  { value: "lightgbm", label: "LightGBM" },
];

const DOMAIN_CONFIG: Record<Domain, { title: string; icon: React.ReactNode; selectorLabel: string; selectorOptions: { value: string; label: string }[]; paramMap: Record<string, GridParameter[]> }> = {
  strategy: { title: "Strategy Backtest Grid Search", icon: <FlaskConical className="size-5 text-emerald-400" />, selectorLabel: "Strategy Archetype", selectorOptions: ARCHETYPES, paramMap: STRATEGY_ARCHETYPE_PARAMS },
  execution: { title: "Execution Simulation Grid Search", icon: <Zap className="size-5 text-amber-400" />, selectorLabel: "Execution Algorithm", selectorOptions: ALGOS, paramMap: EXECUTION_ALGO_PARAMS },
  ml: { title: "ML Training Grid Search", icon: <Brain className="size-5 text-violet-400" />, selectorLabel: "Model Architecture", selectorOptions: MODELS, paramMap: ML_MODEL_PARAMS },
};

export function GridSearchDialog({
  open,
  onClose,
  domain,
}: {
  open: boolean;
  onClose: () => void;
  domain: Domain;
}) {
  const config = DOMAIN_CONFIG[domain];
  const [selectedType, setSelectedType] = React.useState(config.selectorOptions[0]?.value ?? "");
  const [params, setParams] = React.useState<GridParameter[]>(config.paramMap[selectedType] ?? []);
  const [subs, setSubs] = React.useState(() => [
    { title: "Features", items: FEATURE_ITEMS.map((i) => ({ ...i })), onToggle: (_id: string) => {} },
    { title: "Instruments", items: INSTRUMENT_ITEMS.map((i) => ({ ...i })), onToggle: (_id: string) => {} },
    { title: "Venues", items: VENUE_ITEMS.map((i) => ({ ...i })), onToggle: (_id: string) => {} },
  ]);
  const [isRunning, setIsRunning] = React.useState(false);

  // When archetype/algo/model changes, load that type's params
  React.useEffect(() => {
    setParams((config.paramMap[selectedType] ?? []).map((p) => ({ ...p })));
  }, [selectedType, config.paramMap]);

  // Wire up subscription toggles
  const subscriptionsWithToggle = subs.map((s) => ({
    ...s,
    onToggle: (id: string) => {
      setSubs((prev) =>
        prev.map((sub) =>
          sub.title === s.title
            ? { ...sub, items: sub.items.map((item) => item.id === id && item.enabled ? { ...item, selected: !item.selected } : item) }
            : sub,
        ),
      );
    },
  }));

  function updateParam(id: string, update: Partial<GridParameter>) {
    setParams((prev) => prev.map((p) => (p.id === id ? { ...p, ...update } : p)));
  }

  async function handleRun() {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(`Grid search queued (${domain} — ${selectedType}, paper mode)`);
    setIsRunning(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription>
            Select your {config.selectorLabel.toLowerCase()}, configure fixed selections, then define the parameter grid to sweep.
          </DialogDescription>
        </DialogHeader>

        {/* Type selector — this drives which params appear */}
        <div className="space-y-2 pb-2 border-b border-border/30">
          <Label className="text-xs font-medium">{config.selectorLabel}</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.selectorOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Grid parameters below will change based on your {config.selectorLabel.toLowerCase()} selection
          </p>
        </div>

        <ScrollArea className="flex-1" style={{ maxHeight: "60vh" }}>
          <div className="pr-3">
            <GridConfigPanel
              subscriptions={subscriptionsWithToggle}
              parameters={params}
              onParameterChange={updateParam}
              onRunGrid={handleRun}
              isRunning={isRunning}
              domain={config.selectorOptions.find((o) => o.value === selectedType)?.label ?? domain}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
