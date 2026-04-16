"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import * as React from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// CeFi Strategy Families (aligned with strategy-service factory keys)
// ---------------------------------------------------------------------------

const CEFI_STRATEGY_FAMILIES = [
  {
    label: "Momentum",
    strategies: [
      { id: "BTC_MOMENTUM", name: "BTC Momentum" },
      { id: "ETH_MOMENTUM", name: "ETH Momentum" },
      { id: "SOL_MOMENTUM", name: "SOL Momentum" },
    ],
  },
  {
    label: "Mean Reversion",
    strategies: [
      { id: "BTC_MEAN_REVERSION", name: "BTC Mean Reversion" },
      { id: "ETH_MEAN_REVERSION", name: "ETH Mean Reversion" },
      { id: "SOL_MEAN_REVERSION", name: "SOL Mean Reversion" },
    ],
  },
  {
    label: "ML Directional",
    strategies: [
      { id: "BTC_ML_DIRECTIONAL", name: "BTC ML Directional" },
      { id: "ETH_ML_DIRECTIONAL", name: "ETH ML Directional" },
      { id: "SOL_ML_DIRECTIONAL", name: "SOL ML Directional" },
    ],
  },
  {
    label: "Cross-Exchange",
    strategies: [{ id: "CROSS_EXCHANGE_BTC", name: "Cross-Exchange BTC" }],
  },
  {
    label: "Statistical Arb",
    strategies: [{ id: "STAT_ARB_BTC_ETH", name: "Stat Arb BTC-ETH" }],
  },
  {
    label: "Market Making",
    strategies: [
      { id: "BTC_MARKET_MAKING", name: "BTC Market Making" },
      { id: "ETH_MARKET_MAKING", name: "ETH Market Making" },
    ],
  },
  {
    label: "Options",
    strategies: [
      { id: "BTC_OPTIONS_MM", name: "BTC Options MM" },
      { id: "ETH_OPTIONS_MM", name: "ETH Options MM" },
      { id: "BTC_OPTIONS_ML", name: "BTC Options ML" },
    ],
  },
  {
    label: "TradFi",
    strategies: [
      { id: "SPY_MOMENTUM", name: "SPY Momentum" },
      { id: "SPY_ML_DIRECTIONAL", name: "SPY ML Directional" },
      { id: "OIL_COMMODITY_REGIME", name: "Oil Commodity Regime" },
      { id: "NG_COMMODITY_REGIME", name: "NatGas Commodity Regime" },
      { id: "EVENT_MACRO_CRYPTO", name: "Event Macro (Crypto)" },
      { id: "EVENT_MACRO_TRADFI", name: "Event Macro (TradFi)" },
    ],
  },
  {
    label: "Prediction",
    strategies: [{ id: "PREDICTION_ARB_BTC", name: "Prediction Arb BTC" }],
  },
];

const ALL_STRATEGIES = CEFI_STRATEGY_FAMILIES.flatMap((f) => f.strategies);

// ---------------------------------------------------------------------------
// Config types (union of all CeFi config shapes)
// ---------------------------------------------------------------------------

interface MomentumConfig {
  lookback_period: number;
  threshold_pct: number;
  venues: string[];
  algo: string;
  max_position_usd: number;
}

interface MeanReversionConfig {
  z_score_threshold: number;
  mean_window: number;
  venues: string[];
  algo: string;
  max_position_usd: number;
}

interface MLDirectionalConfig {
  model_family: string;
  confidence_threshold: number;
  venues: string[];
  algo: string;
  max_position_usd: number;
}

interface CrossExchangeConfig {
  venue_a: string;
  venue_b: string;
  min_spread_bps: number;
  max_position_usd: number;
}

interface StatArbConfig {
  pair_a: string;
  pair_b: string;
  lookback: number;
  z_entry: number;
  z_exit: number;
  venues: string[];
}

interface MarketMakingConfig {
  spread_bps: number;
  order_size_usd: number;
  max_inventory: number;
  venues: string[];
}

interface OptionsConfig {
  delta_target: number;
  gamma_limit: number;
  expiry_days: number;
  venues: string[];
}

interface TradFiConfig {
  instrument: string;
  lookback: number;
  venues: string[];
  algo: string;
  max_position_usd: number;
}

interface CommodityConfig {
  regime_model: string;
  factors: string[];
  venues: string[];
  max_position_usd: number;
}

interface EventMacroConfig {
  event_types: string[];
  pre_event_hours: number;
  post_event_hours: number;
  venues: string[];
}

interface PredictionConfig {
  venues: string[];
  min_edge_pct: number;
  max_stake_usd: number;
}

type CeFiConfig = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const VENUE_OPTIONS = ["BINANCE", "OKX", "BYBIT", "KRAKEN", "COINBASE", "HYPERLIQUID", "ASTER"];
const ALGO_OPTIONS = ["TWAP", "VWAP", "ICEBERG", "SOR", "MARKET"];
const MODEL_FAMILIES = ["LightGBM", "XGBoost", "CatBoost", "Ridge", "Huber", "Poisson"];
const EVENT_TYPES = ["CPI", "FOMC", "NFP", "EARNINGS", "GDP"];
const COMMODITY_FACTORS = ["rig_count", "cot_positioning", "storage", "price_momentum", "weather"];
const PREDICTION_VENUES = ["POLYMARKET", "KALSHI", "BETFAIR"];

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          step={step ?? 0.1}
          className="font-mono h-8 text-xs"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <Label key={opt} className="flex items-center gap-1.5 text-xs font-normal cursor-pointer">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => {
                  if (v) onChange([...selected, opt]);
                  else onChange(selected.filter((s) => s !== opt));
                }}
              />
              <span className="font-mono">{opt}</span>
            </Label>
          );
        })}
      </div>
    </div>
  );
}

function DropdownField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs font-mono">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default configs by strategy family
// ---------------------------------------------------------------------------

function familyOf(id: string): string {
  return CEFI_STRATEGY_FAMILIES.find((f) => f.strategies.some((s) => s.id === id))?.label ?? "Unknown";
}

function defaultConfigFor(id: string): CeFiConfig {
  const family = familyOf(id);
  switch (family) {
    case "Momentum":
      return { lookback_period: 20, threshold_pct: 2.0, venues: ["BINANCE", "OKX"], algo: "TWAP", max_position_usd: 100000 };
    case "Mean Reversion":
      return { z_score_threshold: 2.0, mean_window: 30, venues: ["BINANCE", "OKX"], algo: "TWAP", max_position_usd: 80000 };
    case "ML Directional":
      return { model_family: "LightGBM", confidence_threshold: 0.65, venues: ["BINANCE", "OKX"], algo: "VWAP", max_position_usd: 150000 };
    case "Cross-Exchange":
      return { venue_a: "BINANCE", venue_b: "OKX", min_spread_bps: 15, max_position_usd: 200000 };
    case "Statistical Arb":
      return { pair_a: "BTC", pair_b: "ETH", lookback: 60, z_entry: 2.0, z_exit: 0.5, venues: ["BINANCE", "OKX"] };
    case "Market Making":
      return { spread_bps: 5, order_size_usd: 10000, max_inventory: 500000, venues: ["BINANCE"] };
    case "Options":
      return { delta_target: 0.0, gamma_limit: 0.1, expiry_days: 30, venues: ["DERIBIT", "OKX"] };
    case "TradFi":
      return { instrument: "SPY", lookback: 20, venues: ["IBKR"], algo: "TWAP", max_position_usd: 200000 };
    case "Prediction":
      return { venues: ["POLYMARKET", "KALSHI"], min_edge_pct: 3.0, max_stake_usd: 5000 };
    default:
      return { venues: ["BINANCE"], algo: "TWAP", max_position_usd: 100000 };
  }
}

// ---------------------------------------------------------------------------
// Per-family form renderers
// ---------------------------------------------------------------------------

function MomentumForm({ config, onChange }: { config: MomentumConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <NumberField label="Lookback Period" value={config.lookback_period} onChange={(v) => onChange({ ...config, lookback_period: v })} suffix="bars" step={1} />
      <NumberField label="Signal Threshold" value={config.threshold_pct} onChange={(v) => onChange({ ...config, threshold_pct: v })} suffix="%" step={0.5} />
      <CheckboxGroup label="Venues" options={VENUE_OPTIONS} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
      <DropdownField label="Execution Algo" value={config.algo} options={ALGO_OPTIONS} onChange={(v) => onChange({ ...config, algo: v })} />
      <NumberField label="Max Position" value={config.max_position_usd} onChange={(v) => onChange({ ...config, max_position_usd: v })} suffix="USD" step={10000} />
    </div>
  );
}

function MeanRevForm({ config, onChange }: { config: MeanReversionConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <NumberField label="Z-Score Entry" value={config.z_score_threshold} onChange={(v) => onChange({ ...config, z_score_threshold: v })} suffix="σ" step={0.1} />
      <NumberField label="Mean Window" value={config.mean_window} onChange={(v) => onChange({ ...config, mean_window: v })} suffix="bars" step={5} />
      <CheckboxGroup label="Venues" options={VENUE_OPTIONS} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
      <DropdownField label="Execution Algo" value={config.algo} options={ALGO_OPTIONS} onChange={(v) => onChange({ ...config, algo: v })} />
      <NumberField label="Max Position" value={config.max_position_usd} onChange={(v) => onChange({ ...config, max_position_usd: v })} suffix="USD" step={10000} />
    </div>
  );
}

function MLForm({ config, onChange }: { config: MLDirectionalConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <DropdownField label="Model Family" value={config.model_family} options={MODEL_FAMILIES} onChange={(v) => onChange({ ...config, model_family: v })} />
      <NumberField label="Confidence Threshold" value={config.confidence_threshold} onChange={(v) => onChange({ ...config, confidence_threshold: v })} suffix="" step={0.05} />
      <CheckboxGroup label="Venues" options={VENUE_OPTIONS} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
      <DropdownField label="Execution Algo" value={config.algo} options={ALGO_OPTIONS} onChange={(v) => onChange({ ...config, algo: v })} />
      <NumberField label="Max Position" value={config.max_position_usd} onChange={(v) => onChange({ ...config, max_position_usd: v })} suffix="USD" step={10000} />
    </div>
  );
}

function CrossExForm({ config, onChange }: { config: CrossExchangeConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <DropdownField label="Venue A" value={config.venue_a} options={VENUE_OPTIONS} onChange={(v) => onChange({ ...config, venue_a: v })} />
      <DropdownField label="Venue B" value={config.venue_b} options={VENUE_OPTIONS} onChange={(v) => onChange({ ...config, venue_b: v })} />
      <NumberField label="Min Spread" value={config.min_spread_bps} onChange={(v) => onChange({ ...config, min_spread_bps: v })} suffix="bps" step={1} />
      <NumberField label="Max Position" value={config.max_position_usd} onChange={(v) => onChange({ ...config, max_position_usd: v })} suffix="USD" step={10000} />
    </div>
  );
}

function StatArbForm({ config, onChange }: { config: StatArbConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <DropdownField label="Asset A" value={config.pair_a} options={["BTC", "ETH", "SOL"]} onChange={(v) => onChange({ ...config, pair_a: v })} />
        <DropdownField label="Asset B" value={config.pair_b} options={["BTC", "ETH", "SOL"]} onChange={(v) => onChange({ ...config, pair_b: v })} />
      </div>
      <NumberField label="Lookback" value={config.lookback} onChange={(v) => onChange({ ...config, lookback: v })} suffix="bars" step={5} />
      <NumberField label="Z-Score Entry" value={config.z_entry} onChange={(v) => onChange({ ...config, z_entry: v })} suffix="σ" step={0.1} />
      <NumberField label="Z-Score Exit" value={config.z_exit} onChange={(v) => onChange({ ...config, z_exit: v })} suffix="σ" step={0.1} />
      <CheckboxGroup label="Venues" options={VENUE_OPTIONS} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
    </div>
  );
}

function MMForm({ config, onChange }: { config: MarketMakingConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <NumberField label="Spread" value={config.spread_bps} onChange={(v) => onChange({ ...config, spread_bps: v })} suffix="bps" step={1} />
      <NumberField label="Order Size" value={config.order_size_usd} onChange={(v) => onChange({ ...config, order_size_usd: v })} suffix="USD" step={1000} />
      <NumberField label="Max Inventory" value={config.max_inventory} onChange={(v) => onChange({ ...config, max_inventory: v })} suffix="USD" step={50000} />
      <CheckboxGroup label="Venues" options={VENUE_OPTIONS} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
    </div>
  );
}

function OptionsForm({ config, onChange }: { config: OptionsConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <NumberField label="Delta Target" value={config.delta_target} onChange={(v) => onChange({ ...config, delta_target: v })} step={0.01} />
      <NumberField label="Gamma Limit" value={config.gamma_limit} onChange={(v) => onChange({ ...config, gamma_limit: v })} step={0.01} />
      <NumberField label="Expiry (days)" value={config.expiry_days} onChange={(v) => onChange({ ...config, expiry_days: v })} suffix="d" step={1} />
      <CheckboxGroup label="Venues" options={["DERIBIT", "OKX", "BINANCE"]} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
    </div>
  );
}

function TradFiForm({ config, onChange }: { config: TradFiConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <DropdownField label="Instrument" value={config.instrument} options={["SPY", "QQQ", "IWM", "EURUSD", "CL", "NG"]} onChange={(v) => onChange({ ...config, instrument: v })} />
      <NumberField label="Lookback" value={config.lookback} onChange={(v) => onChange({ ...config, lookback: v })} suffix="bars" step={5} />
      <DropdownField label="Execution Algo" value={config.algo} options={ALGO_OPTIONS} onChange={(v) => onChange({ ...config, algo: v })} />
      <NumberField label="Max Position" value={config.max_position_usd} onChange={(v) => onChange({ ...config, max_position_usd: v })} suffix="USD" step={10000} />
    </div>
  );
}

function CommodityForm({ config, onChange }: { config: CommodityConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <DropdownField label="Regime Model" value={config.regime_model} options={["HMM_3STATE", "HMM_5STATE"]} onChange={(v) => onChange({ ...config, regime_model: v })} />
      <CheckboxGroup label="Factors" options={COMMODITY_FACTORS} selected={config.factors} onChange={(v) => onChange({ ...config, factors: v })} />
      <NumberField label="Max Position" value={config.max_position_usd} onChange={(v) => onChange({ ...config, max_position_usd: v })} suffix="USD" step={10000} />
    </div>
  );
}

function EventMacroForm({ config, onChange }: { config: EventMacroConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <CheckboxGroup label="Event Types" options={EVENT_TYPES} selected={config.event_types} onChange={(v) => onChange({ ...config, event_types: v })} />
      <NumberField label="Pre-Event Window" value={config.pre_event_hours} onChange={(v) => onChange({ ...config, pre_event_hours: v })} suffix="hours" step={1} />
      <NumberField label="Post-Event Window" value={config.post_event_hours} onChange={(v) => onChange({ ...config, post_event_hours: v })} suffix="hours" step={1} />
      <CheckboxGroup label="Venues" options={VENUE_OPTIONS} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
    </div>
  );
}

function PredictionForm({ config, onChange }: { config: PredictionConfig; onChange: (c: CeFiConfig) => void }) {
  return (
    <div className="space-y-3">
      <CheckboxGroup label="Venues" options={PREDICTION_VENUES} selected={config.venues} onChange={(v) => onChange({ ...config, venues: v })} />
      <NumberField label="Min Edge" value={config.min_edge_pct} onChange={(v) => onChange({ ...config, min_edge_pct: v })} suffix="%" step={0.5} />
      <NumberField label="Max Stake" value={config.max_stake_usd} onChange={(v) => onChange({ ...config, max_stake_usd: v })} suffix="USD" step={500} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form dispatcher
// ---------------------------------------------------------------------------

function ConfigForm({ strategyId, config, onChange }: { strategyId: string; config: CeFiConfig; onChange: (c: CeFiConfig) => void }) {
  const family = familyOf(strategyId);
  switch (family) {
    case "Momentum":
      return <MomentumForm config={config as unknown as MomentumConfig} onChange={onChange} />;
    case "Mean Reversion":
      return <MeanRevForm config={config as unknown as MeanReversionConfig} onChange={onChange} />;
    case "ML Directional":
      return <MLForm config={config as unknown as MLDirectionalConfig} onChange={onChange} />;
    case "Cross-Exchange":
      return <CrossExForm config={config as unknown as CrossExchangeConfig} onChange={onChange} />;
    case "Statistical Arb":
      return <StatArbForm config={config as unknown as StatArbConfig} onChange={onChange} />;
    case "Market Making":
      return <MMForm config={config as unknown as MarketMakingConfig} onChange={onChange} />;
    case "Options":
      return <OptionsForm config={config as unknown as OptionsConfig} onChange={onChange} />;
    case "TradFi": {
      if (strategyId.includes("COMMODITY")) return <CommodityForm config={config as unknown as CommodityConfig} onChange={onChange} />;
      if (strategyId.includes("EVENT_MACRO")) return <EventMacroForm config={config as unknown as EventMacroConfig} onChange={onChange} />;
      return <TradFiForm config={config as unknown as TradFiConfig} onChange={onChange} />;
    }
    case "Prediction":
      return <PredictionForm config={config as unknown as PredictionConfig} onChange={onChange} />;
    default:
      return <div className="text-xs text-muted-foreground">No config form for this family.</div>;
  }
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function CeFiStrategyConfigWidget(_props: WidgetComponentProps) {
  const [selectedId, setSelectedId] = React.useState(ALL_STRATEGIES[0].id);
  const [configs, setConfigs] = React.useState<Record<string, CeFiConfig>>(() => {
    const init: Record<string, CeFiConfig> = {};
    for (const s of ALL_STRATEGIES) init[s.id] = defaultConfigFor(s.id);
    return init;
  });
  const [mode] = React.useState<"Paper" | "Active">("Paper");

  const current = configs[selectedId] ?? defaultConfigFor(selectedId);
  const selectedName = ALL_STRATEGIES.find((s) => s.id === selectedId)?.name ?? selectedId;

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Strategy</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CEFI_STRATEGY_FAMILIES.map((family) => (
                <React.Fragment key={family.label}>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {family.label}
                  </div>
                  {family.strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs pl-4">
                      {s.name}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5">
          <Badge variant={mode === "Active" ? "success" : "warning"}>{mode}</Badge>
        </div>
      </div>

      <div className="rounded-md border px-3 py-1.5 text-xs flex items-center gap-1.5 border-blue-500/30 bg-blue-500/5 text-blue-400">
        <span className="font-mono font-medium">{familyOf(selectedId)}</span>
        <span className="text-muted-foreground">— {selectedName}</span>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <ConfigForm
          strategyId={selectedId}
          config={current}
          onChange={(c) => setConfigs((prev) => ({ ...prev, [selectedId]: c }))}
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={() => {
            toast.success("Config saved", { description: `${selectedName} configuration persisted.` });
          }}
        >
          Save Config
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          size="sm"
          onClick={() => {
            toast.success("Strategy deployed", { description: `${selectedName} deployed in ${mode} mode.` });
          }}
        >
          Deploy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.success("Promoted from backtest", { description: `Promoted ${selectedName} from latest backtest.` });
          }}
        >
          Promote
        </Button>
      </div>
    </div>
  );
}
