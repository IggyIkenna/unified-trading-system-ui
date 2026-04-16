"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { deployDefiStrategy, getDefiStrategyConfig, saveDefiStrategyConfig } from "@/lib/stores/defi-strategy-store";
import {
  SHARE_CLASSES,
  SHARE_CLASS_LABELS,
  STRATEGY_DISPLAY_NAMES,
  type DeFiStrategyId,
  type ShareClass,
} from "@/lib/types/defi";
import * as React from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Demo strategy subset
// ---------------------------------------------------------------------------

// Strategy families for grouped dropdown
const STRATEGY_FAMILIES: { label: string; strategies: DeFiStrategyId[] }[] = [
  { label: "Lending", strategies: ["AAVE_LENDING", "ETH_LENDING", "MULTICHAIN_LENDING"] },
  { label: "Basis Trade", strategies: ["BASIS_TRADE", "BTC_BASIS", "SOL_BASIS", "L2_BASIS"] },
  { label: "Staking", strategies: ["STAKED_BASIS", "ETHENA_BENCHMARK"] },
  { label: "Recursive", strategies: ["RECURSIVE_STAKED_BASIS", "UNHEDGED_RECURSIVE", "USDT_HEDGED_RECURSIVE"] },
  { label: "Cross-Chain", strategies: ["CROSS_CHAIN_YIELD_ARB", "CROSS_CHAIN_SOR"] },
  { label: "LP / Market Making", strategies: ["AMM_LP"] },
];

const DEMO_STRATEGIES: DeFiStrategyId[] = STRATEGY_FAMILIES.flatMap((f) => f.strategies);

// ---------------------------------------------------------------------------
// Per-strategy config shapes and realistic defaults
// ---------------------------------------------------------------------------

interface AaveLendingConfig {
  lending_basket: string[];
  min_apy_threshold: number;
  chain: string;
}

interface BasisTradeConfig {
  basis_coins: string[];
  perp_venues: string[];
  min_funding_rate: number;
  max_single_venue_pct: number;
  max_single_coin_pct: number;
}

interface StakedBasisConfig {
  lst_token: string;
  perp_venue: string;
  max_delta_deviation: number;
}

interface RecursiveStakedBasisConfig {
  target_leverage: number;
  max_leverage: number;
  min_net_apy: number;
  hedged: boolean;
  reward_mode: string;
  max_depeg_tolerance: number;
  flash_loan_provider: string;
}

interface UsdtHedgedRecursiveConfig {
  recursive_allocation_pct: number;
  hedge_allocation_pct: number;
  target_leverage: number;
  max_leverage: number;
  hedge_venues: string[];
  min_net_apy: number;
  flash_loan_provider: string;
}

interface LendingVariantConfig {
  lending_basket: string[];
  min_apy_threshold: number;
  chain: string;
}

interface BasisVariantConfig {
  coins: string[];
  perp_venues: string[];
  min_funding_rate: number;
  max_single_venue_pct: number;
}

interface BenchmarkConfig {
  token: string;
  chain: string;
  auto_compound: boolean;
}

interface CrossChainConfig {
  source_chains: string[];
  target_chains: string[];
  min_spread_bps: number;
  bridge_provider: string;
}

interface AmmLpConfig {
  pool_pair: string;
  range_width_pct: number;
  rebalance_threshold_pct: number;
  chain: string;
}

type StrategyConfig =
  | { type: "AAVE_LENDING"; config: AaveLendingConfig }
  | { type: "ETH_LENDING"; config: LendingVariantConfig }
  | { type: "MULTICHAIN_LENDING"; config: LendingVariantConfig & { chains: string[] } }
  | { type: "BASIS_TRADE"; config: BasisTradeConfig }
  | { type: "BTC_BASIS"; config: BasisVariantConfig }
  | { type: "SOL_BASIS"; config: BasisVariantConfig }
  | { type: "L2_BASIS"; config: BasisVariantConfig & { l2_chain: string } }
  | { type: "STAKED_BASIS"; config: StakedBasisConfig }
  | { type: "ETHENA_BENCHMARK"; config: BenchmarkConfig }
  | { type: "RECURSIVE_STAKED_BASIS"; config: RecursiveStakedBasisConfig }
  | { type: "UNHEDGED_RECURSIVE"; config: RecursiveStakedBasisConfig }
  | { type: "USDT_HEDGED_RECURSIVE"; config: UsdtHedgedRecursiveConfig }
  | { type: "CROSS_CHAIN_YIELD_ARB"; config: CrossChainConfig }
  | { type: "CROSS_CHAIN_SOR"; config: CrossChainConfig }
  | { type: "AMM_LP"; config: AmmLpConfig };

function defaultConfig(id: DeFiStrategyId): StrategyConfig {
  switch (id) {
    case "AAVE_LENDING":
      return {
        type: "AAVE_LENDING",
        config: { lending_basket: ["USDC", "USDT"], min_apy_threshold: 2.5, chain: "ETHEREUM" },
      };
    case "BASIS_TRADE":
      return {
        type: "BASIS_TRADE",
        config: {
          basis_coins: ["ETH", "BTC"],
          perp_venues: ["HYPERLIQUID", "BINANCE-FUTURES"],
          min_funding_rate: 0.005,
          max_single_venue_pct: 40,
          max_single_coin_pct: 50,
        },
      };
    case "STAKED_BASIS":
      return {
        type: "STAKED_BASIS",
        config: { lst_token: "weETH", perp_venue: "HYPERLIQUID", max_delta_deviation: 2.0 },
      };
    case "RECURSIVE_STAKED_BASIS":
      return {
        type: "RECURSIVE_STAKED_BASIS",
        config: {
          target_leverage: 3.0,
          max_leverage: 4.5,
          min_net_apy: 8.0,
          hedged: true,
          reward_mode: "all",
          max_depeg_tolerance: 1.5,
          flash_loan_provider: "MORPHO",
        },
      };
    case "USDT_HEDGED_RECURSIVE":
      return {
        type: "USDT_HEDGED_RECURSIVE",
        config: {
          recursive_allocation_pct: 50,
          hedge_allocation_pct: 50,
          target_leverage: 2.5,
          max_leverage: 3.0,
          hedge_venues: ["HYPERLIQUID", "BINANCE-FUTURES", "OKX"],
          min_net_apy: 12.0,
          flash_loan_provider: "MORPHO",
        },
      };
    case "ETH_LENDING":
      return {
        type: "ETH_LENDING",
        config: { lending_basket: ["ETH", "WETH"], min_apy_threshold: 1.5, chain: "ETHEREUM" },
      };
    case "MULTICHAIN_LENDING":
      return {
        type: "MULTICHAIN_LENDING",
        config: {
          lending_basket: ["USDC", "USDT"],
          min_apy_threshold: 3.0,
          chain: "ETHEREUM",
          chains: ["ETHEREUM", "ARBITRUM", "BASE", "OPTIMISM"],
        },
      };
    case "BTC_BASIS":
      return {
        type: "BTC_BASIS",
        config: {
          coins: ["BTC", "WBTC", "cbBTC"],
          perp_venues: ["BINANCE-FUTURES", "OKX", "BYBIT"],
          min_funding_rate: 0.004,
          max_single_venue_pct: 50,
        },
      };
    case "SOL_BASIS":
      return {
        type: "SOL_BASIS",
        config: {
          coins: ["SOL", "mSOL"],
          perp_venues: ["DRIFT", "HYPERLIQUID"],
          min_funding_rate: 0.006,
          max_single_venue_pct: 60,
        },
      };
    case "L2_BASIS":
      return {
        type: "L2_BASIS",
        config: {
          coins: ["ETH", "ARB", "OP"],
          perp_venues: ["HYPERLIQUID", "BINANCE-FUTURES"],
          min_funding_rate: 0.005,
          max_single_venue_pct: 50,
          l2_chain: "ARBITRUM",
        },
      };
    case "ETHENA_BENCHMARK":
      return {
        type: "ETHENA_BENCHMARK",
        config: { token: "sUSDe", chain: "ETHEREUM", auto_compound: true },
      };
    case "UNHEDGED_RECURSIVE":
      return {
        type: "UNHEDGED_RECURSIVE",
        config: {
          target_leverage: 3.5,
          max_leverage: 5.0,
          min_net_apy: 15.0,
          hedged: false,
          reward_mode: "all",
          max_depeg_tolerance: 2.0,
          flash_loan_provider: "MORPHO",
        },
      };
    case "CROSS_CHAIN_YIELD_ARB":
      return {
        type: "CROSS_CHAIN_YIELD_ARB",
        config: {
          source_chains: ["ETHEREUM", "ARBITRUM"],
          target_chains: ["BASE", "OPTIMISM"],
          min_spread_bps: 50,
          bridge_provider: "ACROSS",
        },
      };
    case "CROSS_CHAIN_SOR":
      return {
        type: "CROSS_CHAIN_SOR",
        config: {
          source_chains: ["ETHEREUM", "ARBITRUM", "BASE"],
          target_chains: ["OPTIMISM", "POLYGON"],
          min_spread_bps: 25,
          bridge_provider: "SOCKET",
        },
      };
    case "AMM_LP":
      return {
        type: "AMM_LP",
        config: {
          pool_pair: "ETH-USDC",
          range_width_pct: 10,
          rebalance_threshold_pct: 5,
          chain: "ETHEREUM",
        },
      };
    default:
      return {
        type: "AAVE_LENDING",
        config: { lending_basket: ["USDC"], min_apy_threshold: 2.0, chain: "ETHEREUM" },
      };
  }
}

// ---------------------------------------------------------------------------
// Multi-select options
// ---------------------------------------------------------------------------

const LENDING_BASKET_OPTIONS = ["USDC", "USDT", "DAI"];
const CHAIN_OPTIONS = ["ETHEREUM", "ARBITRUM", "BASE", "OPTIMISM", "POLYGON"];
const BASIS_COIN_OPTIONS = ["ETH", "BTC", "SOL", "MATIC", "ARB", "OP", "AVAX", "LINK"];
const PERP_VENUE_OPTIONS = ["HYPERLIQUID", "BINANCE-FUTURES", "OKX", "BYBIT", "ASTER"];
const LST_TOKEN_OPTIONS = ["weETH", "mSOL"];
const PERP_VENUE_SINGLE_OPTIONS = ["HYPERLIQUID", "BINANCE-FUTURES", "OKX", "BYBIT"];
const REWARD_MODE_OPTIONS = ["all", "eigen_only", "ethfi_only"];
const FLASH_LOAN_PROVIDER_OPTIONS = ["MORPHO", "AAVE"];
const BRIDGE_PROVIDER_OPTIONS = ["ACROSS", "SOCKET", "LAYERZERO", "STARGATE"];
const BTC_COIN_OPTIONS = ["BTC", "WBTC", "cbBTC"];
const SOL_COIN_OPTIONS = ["SOL", "mSOL", "jitoSOL"];
const LP_POOL_OPTIONS = ["ETH-USDC", "ETH-USDT", "BTC-USDC", "SOL-USDC", "ARB-ETH"];
const L2_CHAIN_OPTIONS = ["ARBITRUM", "OPTIMISM", "BASE"];

// ---------------------------------------------------------------------------
// Shared field helpers
// ---------------------------------------------------------------------------

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
                  if (v) {
                    onChange([...selected, opt]);
                  } else {
                    onChange(selected.filter((s) => s !== opt));
                  }
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
// Per-strategy form renderers
// ---------------------------------------------------------------------------

function AaveLendingForm({
  config,
  onChange,
}: {
  config: AaveLendingConfig;
  onChange: (c: AaveLendingConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <CheckboxGroup
        label="Lending Basket"
        options={LENDING_BASKET_OPTIONS}
        selected={config.lending_basket}
        onChange={(v) => onChange({ ...config, lending_basket: v })}
      />
      <NumberField
        label="Min APY Threshold"
        value={config.min_apy_threshold}
        onChange={(v) => onChange({ ...config, min_apy_threshold: v })}
        suffix="%"
        step={0.5}
      />
      <DropdownField
        label="Chain"
        value={config.chain}
        options={CHAIN_OPTIONS}
        onChange={(v) => onChange({ ...config, chain: v })}
      />
    </div>
  );
}

function BasisTradeForm({ config, onChange }: { config: BasisTradeConfig; onChange: (c: BasisTradeConfig) => void }) {
  return (
    <div className="space-y-3">
      <CheckboxGroup
        label="Basis Coins"
        options={BASIS_COIN_OPTIONS}
        selected={config.basis_coins}
        onChange={(v) => onChange({ ...config, basis_coins: v })}
      />
      <CheckboxGroup
        label="Perp Venues"
        options={PERP_VENUE_OPTIONS}
        selected={config.perp_venues}
        onChange={(v) => onChange({ ...config, perp_venues: v })}
      />
      <NumberField
        label="Min Funding Rate"
        value={config.min_funding_rate}
        onChange={(v) => onChange({ ...config, min_funding_rate: v })}
        suffix="% / 8h"
        step={0.001}
      />
      <NumberField
        label="Max Single Venue %"
        value={config.max_single_venue_pct}
        onChange={(v) => onChange({ ...config, max_single_venue_pct: v })}
        suffix="%"
        step={5}
      />
      <NumberField
        label="Max Single Coin %"
        value={config.max_single_coin_pct}
        onChange={(v) => onChange({ ...config, max_single_coin_pct: v })}
        suffix="%"
        step={5}
      />
    </div>
  );
}

function StakedBasisForm({
  config,
  onChange,
}: {
  config: StakedBasisConfig;
  onChange: (c: StakedBasisConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <DropdownField
        label="LST Token"
        value={config.lst_token}
        options={LST_TOKEN_OPTIONS}
        onChange={(v) => onChange({ ...config, lst_token: v })}
      />
      <DropdownField
        label="Perp Venue"
        value={config.perp_venue}
        options={PERP_VENUE_SINGLE_OPTIONS}
        onChange={(v) => onChange({ ...config, perp_venue: v })}
      />
      <NumberField
        label="Max Delta Deviation"
        value={config.max_delta_deviation}
        onChange={(v) => onChange({ ...config, max_delta_deviation: v })}
        suffix="%"
        step={0.5}
      />
    </div>
  );
}

function RecursiveStakedBasisForm({
  config,
  onChange,
}: {
  config: RecursiveStakedBasisConfig;
  onChange: (c: RecursiveStakedBasisConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <NumberField
        label="Target Leverage"
        value={config.target_leverage}
        onChange={(v) => onChange({ ...config, target_leverage: v })}
        suffix="x"
        step={0.5}
      />
      <NumberField
        label="Max Leverage"
        value={config.max_leverage}
        onChange={(v) => onChange({ ...config, max_leverage: v })}
        suffix="x"
        step={0.5}
      />
      <NumberField
        label="Min Net APY"
        value={config.min_net_apy}
        onChange={(v) => onChange({ ...config, min_net_apy: v })}
        suffix="%"
        step={1}
      />
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Hedged</label>
        <Switch checked={config.hedged} onCheckedChange={(v) => onChange({ ...config, hedged: v })} />
      </div>
      <DropdownField
        label="Reward Mode"
        value={config.reward_mode}
        options={REWARD_MODE_OPTIONS}
        onChange={(v) => onChange({ ...config, reward_mode: v })}
      />
      <NumberField
        label="Max Depeg Tolerance"
        value={config.max_depeg_tolerance}
        onChange={(v) => onChange({ ...config, max_depeg_tolerance: v })}
        suffix="%"
        step={0.5}
      />
      <DropdownField
        label="Flash Loan Provider"
        value={config.flash_loan_provider}
        options={FLASH_LOAN_PROVIDER_OPTIONS}
        onChange={(v) => onChange({ ...config, flash_loan_provider: v })}
      />
    </div>
  );
}

function UsdtHedgedRecursiveForm({
  config,
  onChange,
}: {
  config: UsdtHedgedRecursiveConfig;
  onChange: (c: UsdtHedgedRecursiveConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <NumberField
        label="Recursive Allocation"
        value={config.recursive_allocation_pct}
        onChange={(v) => onChange({ ...config, recursive_allocation_pct: v, hedge_allocation_pct: 100 - v })}
        suffix="%"
        step={5}
      />
      <NumberField
        label="Hedge Allocation"
        value={config.hedge_allocation_pct}
        onChange={(v) => onChange({ ...config, hedge_allocation_pct: v, recursive_allocation_pct: 100 - v })}
        suffix="%"
        step={5}
      />
      <NumberField
        label="Target Leverage"
        value={config.target_leverage}
        onChange={(v) => onChange({ ...config, target_leverage: v })}
        suffix="x"
        step={0.5}
      />
      <NumberField
        label="Max Leverage"
        value={config.max_leverage}
        onChange={(v) => onChange({ ...config, max_leverage: v })}
        suffix="x"
        step={0.5}
      />
      <CheckboxGroup
        label="Hedge Venues"
        options={PERP_VENUE_OPTIONS}
        selected={config.hedge_venues}
        onChange={(v) => onChange({ ...config, hedge_venues: v })}
      />
      <NumberField
        label="Min Net APY"
        value={config.min_net_apy}
        onChange={(v) => onChange({ ...config, min_net_apy: v })}
        suffix="%"
        step={1}
      />
      <DropdownField
        label="Flash Loan Provider"
        value={config.flash_loan_provider}
        options={FLASH_LOAN_PROVIDER_OPTIONS}
        onChange={(v) => onChange({ ...config, flash_loan_provider: v })}
      />
    </div>
  );
}

function LendingVariantForm({
  config,
  onChange,
}: {
  config: LendingVariantConfig;
  onChange: (c: LendingVariantConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <CheckboxGroup
        label="Lending Basket"
        options={LENDING_BASKET_OPTIONS}
        selected={config.lending_basket}
        onChange={(v) => onChange({ ...config, lending_basket: v })}
      />
      <NumberField
        label="Min APY Threshold"
        value={config.min_apy_threshold}
        onChange={(v) => onChange({ ...config, min_apy_threshold: v })}
        suffix="%"
        step={0.5}
      />
      <DropdownField
        label="Chain"
        value={config.chain}
        options={CHAIN_OPTIONS}
        onChange={(v) => onChange({ ...config, chain: v })}
      />
    </div>
  );
}

function MultiChainLendingForm({
  config,
  onChange,
}: {
  config: LendingVariantConfig & { chains: string[] };
  onChange: (c: LendingVariantConfig & { chains: string[] }) => void;
}) {
  return (
    <div className="space-y-3">
      <CheckboxGroup
        label="Lending Basket"
        options={LENDING_BASKET_OPTIONS}
        selected={config.lending_basket}
        onChange={(v) => onChange({ ...config, lending_basket: v })}
      />
      <CheckboxGroup
        label="Chains (SOR across)"
        options={CHAIN_OPTIONS}
        selected={config.chains}
        onChange={(v) => onChange({ ...config, chains: v })}
      />
      <NumberField
        label="Min APY Threshold"
        value={config.min_apy_threshold}
        onChange={(v) => onChange({ ...config, min_apy_threshold: v })}
        suffix="%"
        step={0.5}
      />
    </div>
  );
}

function BasisVariantForm({
  config,
  onChange,
  coinOptions,
}: {
  config: BasisVariantConfig;
  onChange: (c: BasisVariantConfig) => void;
  coinOptions: string[];
}) {
  return (
    <div className="space-y-3">
      <CheckboxGroup
        label="Coins"
        options={coinOptions}
        selected={config.coins}
        onChange={(v) => onChange({ ...config, coins: v })}
      />
      <CheckboxGroup
        label="Perp Venues"
        options={PERP_VENUE_OPTIONS}
        selected={config.perp_venues}
        onChange={(v) => onChange({ ...config, perp_venues: v })}
      />
      <NumberField
        label="Min Funding Rate"
        value={config.min_funding_rate}
        onChange={(v) => onChange({ ...config, min_funding_rate: v })}
        suffix="% / 8h"
        step={0.001}
      />
      <NumberField
        label="Max Single Venue %"
        value={config.max_single_venue_pct}
        onChange={(v) => onChange({ ...config, max_single_venue_pct: v })}
        suffix="%"
        step={5}
      />
    </div>
  );
}

function L2BasisForm({
  config,
  onChange,
}: {
  config: BasisVariantConfig & { l2_chain: string };
  onChange: (c: BasisVariantConfig & { l2_chain: string }) => void;
}) {
  return (
    <div className="space-y-3">
      <DropdownField
        label="L2 Chain"
        value={config.l2_chain}
        options={L2_CHAIN_OPTIONS}
        onChange={(v) => onChange({ ...config, l2_chain: v })}
      />
      <CheckboxGroup
        label="Coins"
        options={BASIS_COIN_OPTIONS}
        selected={config.coins}
        onChange={(v) => onChange({ ...config, coins: v })}
      />
      <CheckboxGroup
        label="Perp Venues"
        options={PERP_VENUE_OPTIONS}
        selected={config.perp_venues}
        onChange={(v) => onChange({ ...config, perp_venues: v })}
      />
      <NumberField
        label="Min Funding Rate"
        value={config.min_funding_rate}
        onChange={(v) => onChange({ ...config, min_funding_rate: v })}
        suffix="% / 8h"
        step={0.001}
      />
    </div>
  );
}

function BenchmarkForm({
  config,
  onChange,
}: {
  config: BenchmarkConfig;
  onChange: (c: BenchmarkConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <DropdownField
        label="Token"
        value={config.token}
        options={["sUSDe", "stETH", "rETH"]}
        onChange={(v) => onChange({ ...config, token: v })}
      />
      <DropdownField
        label="Chain"
        value={config.chain}
        options={CHAIN_OPTIONS}
        onChange={(v) => onChange({ ...config, chain: v })}
      />
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Auto-Compound</label>
        <Switch checked={config.auto_compound} onCheckedChange={(v) => onChange({ ...config, auto_compound: v })} />
      </div>
    </div>
  );
}

function CrossChainForm({
  config,
  onChange,
}: {
  config: CrossChainConfig;
  onChange: (c: CrossChainConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <CheckboxGroup
        label="Source Chains"
        options={CHAIN_OPTIONS}
        selected={config.source_chains}
        onChange={(v) => onChange({ ...config, source_chains: v })}
      />
      <CheckboxGroup
        label="Target Chains"
        options={CHAIN_OPTIONS}
        selected={config.target_chains}
        onChange={(v) => onChange({ ...config, target_chains: v })}
      />
      <NumberField
        label="Min Spread"
        value={config.min_spread_bps}
        onChange={(v) => onChange({ ...config, min_spread_bps: v })}
        suffix="bps"
        step={5}
      />
      <DropdownField
        label="Bridge Provider"
        value={config.bridge_provider}
        options={BRIDGE_PROVIDER_OPTIONS}
        onChange={(v) => onChange({ ...config, bridge_provider: v })}
      />
    </div>
  );
}

function AmmLpForm({
  config,
  onChange,
}: {
  config: AmmLpConfig;
  onChange: (c: AmmLpConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <DropdownField
        label="Pool Pair"
        value={config.pool_pair}
        options={LP_POOL_OPTIONS}
        onChange={(v) => onChange({ ...config, pool_pair: v })}
      />
      <NumberField
        label="Range Width"
        value={config.range_width_pct}
        onChange={(v) => onChange({ ...config, range_width_pct: v })}
        suffix="%"
        step={1}
      />
      <NumberField
        label="Rebalance Threshold"
        value={config.rebalance_threshold_pct}
        onChange={(v) => onChange({ ...config, rebalance_threshold_pct: v })}
        suffix="%"
        step={1}
      />
      <DropdownField
        label="Chain"
        value={config.chain}
        options={CHAIN_OPTIONS}
        onChange={(v) => onChange({ ...config, chain: v })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

// Share class colour indicator
const SHARE_CLASS_COLORS: Record<ShareClass, string> = {
  USDT: "text-emerald-400",
  ETH: "text-blue-400",
  BTC: "text-amber-400",
};

export function DeFiStrategyConfigWidget(_props: WidgetComponentProps) {
  const [selectedStrategy, setSelectedStrategy] = React.useState<DeFiStrategyId>("AAVE_LENDING");
  const [shareClass, setShareClass] = React.useState<ShareClass>("USDT");
  const [mode] = React.useState<"Active" | "Paper">("Paper");
  const [configs, setConfigs] = React.useState<Record<string, StrategyConfig>>(() => {
    const init: Record<string, StrategyConfig> = {};
    for (const id of DEMO_STRATEGIES) {
      const stored = getDefiStrategyConfig(id);
      if (stored) {
        const def = defaultConfig(id);
        init[id] = { ...def, config: { ...def.config, ...stored.config } } as StrategyConfig;
      } else {
        init[id] = defaultConfig(id);
      }
    }
    return init;
  });

  const current = configs[selectedStrategy];

  function updateConfig(next: StrategyConfig) {
    setConfigs((prev) => ({ ...prev, [selectedStrategy]: next }));
  }

  return (
    <div className="space-y-3 p-1">
      {/* Header row: strategy selector + share class + mode badge */}
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Strategy</label>
          <Select value={selectedStrategy} onValueChange={(v) => setSelectedStrategy(v as DeFiStrategyId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRATEGY_FAMILIES.map((family) => (
                <React.Fragment key={family.label}>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {family.label}
                  </div>
                  {family.strategies.map((id) => (
                    <SelectItem key={id} value={id} className="text-xs pl-4">
                      {STRATEGY_DISPLAY_NAMES[id]}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-28">
          <label className="text-xs text-muted-foreground">Share Class</label>
          <Select value={shareClass} onValueChange={(v) => setShareClass(v as ShareClass)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHARE_CLASSES.map((sc) => (
                <SelectItem key={sc} value={sc} className={`text-xs font-mono ${SHARE_CLASS_COLORS[sc]}`}>
                  {sc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5">
          <Badge variant={mode === "Active" ? "success" : "warning"}>{mode}</Badge>
        </div>
      </div>
      {/* Share class info banner */}
      <div
        className={`rounded-md border px-3 py-1.5 text-xs flex items-center gap-1.5 ${shareClass === "ETH" ? "border-blue-500/30 bg-blue-500/5 text-blue-400" : shareClass === "BTC" ? "border-amber-500/30 bg-amber-500/5 text-amber-400" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"}`}
      >
        <span className="font-mono font-medium">{shareClass}</span>
        <span className="text-muted-foreground">— {SHARE_CLASS_LABELS[shareClass]}</span>
        <span className="ml-auto text-muted-foreground text-[10px]">P&L denominated in {shareClass}</span>
      </div>

      {/* Locked banner for recursive staked basis */}
      {selectedStrategy === "RECURSIVE_STAKED_BASIS" && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          Demo only -- this strategy will be locked in production.
        </div>
      )}

      {/* Strategy-specific config form */}
      <div className="rounded-lg border bg-muted/30 p-3">
        {current?.type === "AAVE_LENDING" && (
          <AaveLendingForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "AAVE_LENDING", config: c })}
          />
        )}
        {current?.type === "ETH_LENDING" && (
          <LendingVariantForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "ETH_LENDING", config: c })}
          />
        )}
        {current?.type === "MULTICHAIN_LENDING" && (
          <MultiChainLendingForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "MULTICHAIN_LENDING", config: c })}
          />
        )}
        {current?.type === "BASIS_TRADE" && (
          <BasisTradeForm config={current.config} onChange={(c) => updateConfig({ type: "BASIS_TRADE", config: c })} />
        )}
        {current?.type === "BTC_BASIS" && (
          <BasisVariantForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "BTC_BASIS", config: c })}
            coinOptions={BTC_COIN_OPTIONS}
          />
        )}
        {current?.type === "SOL_BASIS" && (
          <BasisVariantForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "SOL_BASIS", config: c })}
            coinOptions={SOL_COIN_OPTIONS}
          />
        )}
        {current?.type === "L2_BASIS" && (
          <L2BasisForm config={current.config} onChange={(c) => updateConfig({ type: "L2_BASIS", config: c })} />
        )}
        {current?.type === "STAKED_BASIS" && (
          <StakedBasisForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "STAKED_BASIS", config: c })}
          />
        )}
        {current?.type === "ETHENA_BENCHMARK" && (
          <BenchmarkForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "ETHENA_BENCHMARK", config: c })}
          />
        )}
        {current?.type === "RECURSIVE_STAKED_BASIS" && (
          <RecursiveStakedBasisForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "RECURSIVE_STAKED_BASIS", config: c })}
          />
        )}
        {current?.type === "UNHEDGED_RECURSIVE" && (
          <RecursiveStakedBasisForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "UNHEDGED_RECURSIVE", config: c })}
          />
        )}
        {current?.type === "USDT_HEDGED_RECURSIVE" && (
          <UsdtHedgedRecursiveForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "USDT_HEDGED_RECURSIVE", config: c })}
          />
        )}
        {current?.type === "CROSS_CHAIN_YIELD_ARB" && (
          <CrossChainForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "CROSS_CHAIN_YIELD_ARB", config: c })}
          />
        )}
        {current?.type === "CROSS_CHAIN_SOR" && (
          <CrossChainForm
            config={current.config}
            onChange={(c) => updateConfig({ type: "CROSS_CHAIN_SOR", config: c })}
          />
        )}
        {current?.type === "AMM_LP" && (
          <AmmLpForm config={current.config} onChange={(c) => updateConfig({ type: "AMM_LP", config: c })} />
        )}
      </div>

      {/* Client restrictions panel (Patrick demo: ETH-only, no HyperLiquid) */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Client Config</span>
          <Badge variant="outline" className="text-[9px] h-4 px-1">
            DeFi Client
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-muted-foreground">OKX, Bybit, Binance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
            <span className="text-muted-foreground line-through">HyperLiquid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-muted-foreground font-mono">ETH only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-muted-foreground">Multi-coin: Locked</span>
          </div>
        </div>
      </div>

      {/* Enhanced risk indicators */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Risk Indicators</span>
        <div className="space-y-1.5">
          {[
            { label: "Oracle Depeg (weETH/ETH)", value: "0.12%", status: "green" },
            { label: "Borrow-Staking Spread", value: "+1.4% net (4.2x levered)", status: "green" },
            { label: "USDT Peg", value: "$1.0002", status: "green" },
            { label: "Withdrawal Delay (ether.fi)", value: "7d queue", status: "amber" },
            { label: "Est. Rebalance Cost", value: "$420 (0.014% NAV)", status: "green" },
            { label: "Est. Full Close Cost", value: "$2,800 (0.093% NAV, ~35min)", status: "green" },
          ].map(({ label, value, status }) => (
            <div key={label} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === "green" ? "bg-emerald-400" : status === "amber" ? "bg-amber-400" : "bg-rose-400"}`}
                />
                <span className="font-mono tabular-nums">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={() => {
            if (current) {
              saveDefiStrategyConfig(selectedStrategy, current.config as Record<string, unknown>);
              toast.success("Config saved", {
                description: `${STRATEGY_DISPLAY_NAMES[selectedStrategy]} configuration persisted. Survives reload.`,
              });
            }
          }}
        >
          Save Config
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          size="sm"
          onClick={() => {
            deployDefiStrategy(selectedStrategy);
            toast.success("Strategy deployed", {
              description: `${STRATEGY_DISPLAY_NAMES[selectedStrategy]} deployed. Yield generation active.`,
            });
          }}
        >
          Deploy Strategy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const runId = Math.floor(Math.random() * 9000) + 1000;
            toast.success("Promoted from backtest", {
              description: `Promoted from backtest run #${runId} for ${STRATEGY_DISPLAY_NAMES[selectedStrategy]}.`,
            });
          }}
        >
          Promote
        </Button>
      </div>
    </div>
  );
}
