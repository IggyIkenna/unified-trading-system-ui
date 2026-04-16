/**
 * CeFi strategy config schemas — declarative field definitions per strategy.
 *
 * Adding a new CeFi strategy:
 *   1. Add the strategy to the appropriate family in CEFI_STRATEGY_FAMILIES
 *   2. Add a schema entry to CEFI_STRATEGY_SCHEMAS (keyed by strategy id)
 *   3. Done — the widget renders it automatically
 *
 * If the strategy belongs to a new family, create the family in
 * CEFI_STRATEGY_FAMILIES first.
 */

import type { StrategyConfigSchema, StrategyFamilyGroup } from "./types";
import {
  ALGO_OPTIONS,
  CEFI_VENUE_OPTIONS,
  COMMODITY_FACTOR_OPTIONS,
  EVENT_TYPE_OPTIONS,
  MODEL_FAMILY_OPTIONS,
  OPTIONS_VENUE_OPTIONS,
  PREDICTION_VENUE_OPTIONS,
  REGIME_MODEL_OPTIONS,
  TRADFI_INSTRUMENT_OPTIONS,
} from "./options";

// ---------------------------------------------------------------------------
// Strategy families
// ---------------------------------------------------------------------------

export const CEFI_STRATEGY_FAMILIES: StrategyFamilyGroup[] = [
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

// ---------------------------------------------------------------------------
// Shared schema fragments (reused across multiple strategies)
// ---------------------------------------------------------------------------

const MOMENTUM_FIELDS: StrategyConfigSchema["fields"] = [
  { key: "lookback_period", label: "Lookback Period", type: "number", suffix: "bars", step: 1, default: 20 },
  { key: "threshold_pct", label: "Signal Threshold", type: "number", suffix: "%", step: 0.5, default: 2.0 },
  { key: "venues", label: "Venues", type: "multi-select", options: CEFI_VENUE_OPTIONS, default: ["BINANCE", "OKX"] },
  { key: "algo", label: "Execution Algo", type: "dropdown", options: ALGO_OPTIONS, default: "TWAP" },
  { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 100000 },
];

const MEAN_REVERSION_FIELDS: StrategyConfigSchema["fields"] = [
  { key: "z_score_threshold", label: "Z-Score Entry", type: "number", suffix: "\u03C3", step: 0.1, default: 2.0 },
  { key: "mean_window", label: "Mean Window", type: "number", suffix: "bars", step: 5, default: 30 },
  { key: "venues", label: "Venues", type: "multi-select", options: CEFI_VENUE_OPTIONS, default: ["BINANCE", "OKX"] },
  { key: "algo", label: "Execution Algo", type: "dropdown", options: ALGO_OPTIONS, default: "TWAP" },
  { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 80000 },
];

const ML_DIRECTIONAL_FIELDS: StrategyConfigSchema["fields"] = [
  { key: "model_family", label: "Model Family", type: "dropdown", options: MODEL_FAMILY_OPTIONS, default: "LightGBM" },
  { key: "confidence_threshold", label: "Confidence Threshold", type: "number", step: 0.05, default: 0.65 },
  { key: "venues", label: "Venues", type: "multi-select", options: CEFI_VENUE_OPTIONS, default: ["BINANCE", "OKX"] },
  { key: "algo", label: "Execution Algo", type: "dropdown", options: ALGO_OPTIONS, default: "VWAP" },
  { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 150000 },
];

// ---------------------------------------------------------------------------
// Per-strategy schemas
// ---------------------------------------------------------------------------

export const CEFI_STRATEGY_SCHEMAS: Record<string, StrategyConfigSchema> = {
  // Momentum family
  BTC_MOMENTUM: { fields: MOMENTUM_FIELDS },
  ETH_MOMENTUM: { fields: MOMENTUM_FIELDS },
  SOL_MOMENTUM: { fields: MOMENTUM_FIELDS },

  // Mean Reversion family
  BTC_MEAN_REVERSION: { fields: MEAN_REVERSION_FIELDS },
  ETH_MEAN_REVERSION: { fields: MEAN_REVERSION_FIELDS },
  SOL_MEAN_REVERSION: { fields: MEAN_REVERSION_FIELDS },

  // ML Directional family
  BTC_ML_DIRECTIONAL: { fields: ML_DIRECTIONAL_FIELDS },
  ETH_ML_DIRECTIONAL: { fields: ML_DIRECTIONAL_FIELDS },
  SOL_ML_DIRECTIONAL: { fields: ML_DIRECTIONAL_FIELDS },

  // Cross-Exchange
  CROSS_EXCHANGE_BTC: {
    fields: [
      { key: "venue_a", label: "Venue A", type: "dropdown", options: CEFI_VENUE_OPTIONS, default: "BINANCE" },
      { key: "venue_b", label: "Venue B", type: "dropdown", options: CEFI_VENUE_OPTIONS, default: "OKX" },
      { key: "min_spread_bps", label: "Min Spread", type: "number", suffix: "bps", step: 1, default: 15 },
      { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 200000 },
    ],
  },

  // Statistical Arb
  STAT_ARB_BTC_ETH: {
    fields: [
      { key: "pair_a", label: "Asset A", type: "dropdown", options: ["BTC", "ETH", "SOL"], default: "BTC" },
      { key: "pair_b", label: "Asset B", type: "dropdown", options: ["BTC", "ETH", "SOL"], default: "ETH" },
      { key: "lookback", label: "Lookback", type: "number", suffix: "bars", step: 5, default: 60 },
      { key: "z_entry", label: "Z-Score Entry", type: "number", suffix: "\u03C3", step: 0.1, default: 2.0 },
      { key: "z_exit", label: "Z-Score Exit", type: "number", suffix: "\u03C3", step: 0.1, default: 0.5 },
      {
        key: "venues",
        label: "Venues",
        type: "multi-select",
        options: CEFI_VENUE_OPTIONS,
        default: ["BINANCE", "OKX"],
      },
    ],
  },

  // Market Making
  BTC_MARKET_MAKING: {
    fields: [
      { key: "spread_bps", label: "Spread", type: "number", suffix: "bps", step: 1, default: 5 },
      { key: "order_size_usd", label: "Order Size", type: "number", suffix: "USD", step: 1000, default: 10000 },
      { key: "max_inventory", label: "Max Inventory", type: "number", suffix: "USD", step: 50000, default: 500000 },
      { key: "venues", label: "Venues", type: "multi-select", options: CEFI_VENUE_OPTIONS, default: ["BINANCE"] },
    ],
  },
  ETH_MARKET_MAKING: {
    fields: [
      { key: "spread_bps", label: "Spread", type: "number", suffix: "bps", step: 1, default: 5 },
      { key: "order_size_usd", label: "Order Size", type: "number", suffix: "USD", step: 1000, default: 10000 },
      { key: "max_inventory", label: "Max Inventory", type: "number", suffix: "USD", step: 50000, default: 500000 },
      { key: "venues", label: "Venues", type: "multi-select", options: CEFI_VENUE_OPTIONS, default: ["BINANCE"] },
    ],
  },

  // Options
  BTC_OPTIONS_MM: {
    fields: [
      { key: "delta_target", label: "Delta Target", type: "number", step: 0.01, default: 0.0 },
      { key: "gamma_limit", label: "Gamma Limit", type: "number", step: 0.01, default: 0.1 },
      { key: "expiry_days", label: "Expiry (days)", type: "number", suffix: "d", step: 1, default: 30 },
      {
        key: "venues",
        label: "Venues",
        type: "multi-select",
        options: OPTIONS_VENUE_OPTIONS,
        default: ["DERIBIT", "OKX"],
      },
    ],
  },
  ETH_OPTIONS_MM: {
    fields: [
      { key: "delta_target", label: "Delta Target", type: "number", step: 0.01, default: 0.0 },
      { key: "gamma_limit", label: "Gamma Limit", type: "number", step: 0.01, default: 0.1 },
      { key: "expiry_days", label: "Expiry (days)", type: "number", suffix: "d", step: 1, default: 30 },
      {
        key: "venues",
        label: "Venues",
        type: "multi-select",
        options: OPTIONS_VENUE_OPTIONS,
        default: ["DERIBIT", "OKX"],
      },
    ],
  },
  BTC_OPTIONS_ML: {
    fields: [
      { key: "delta_target", label: "Delta Target", type: "number", step: 0.01, default: 0.0 },
      { key: "gamma_limit", label: "Gamma Limit", type: "number", step: 0.01, default: 0.1 },
      { key: "expiry_days", label: "Expiry (days)", type: "number", suffix: "d", step: 1, default: 30 },
      {
        key: "venues",
        label: "Venues",
        type: "multi-select",
        options: OPTIONS_VENUE_OPTIONS,
        default: ["DERIBIT", "OKX"],
      },
    ],
  },

  // TradFi — standard
  SPY_MOMENTUM: {
    fields: [
      { key: "instrument", label: "Instrument", type: "dropdown", options: TRADFI_INSTRUMENT_OPTIONS, default: "SPY" },
      { key: "lookback", label: "Lookback", type: "number", suffix: "bars", step: 5, default: 20 },
      { key: "algo", label: "Execution Algo", type: "dropdown", options: ALGO_OPTIONS, default: "TWAP" },
      { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 200000 },
    ],
  },
  SPY_ML_DIRECTIONAL: {
    fields: [
      { key: "instrument", label: "Instrument", type: "dropdown", options: TRADFI_INSTRUMENT_OPTIONS, default: "SPY" },
      { key: "lookback", label: "Lookback", type: "number", suffix: "bars", step: 5, default: 20 },
      { key: "algo", label: "Execution Algo", type: "dropdown", options: ALGO_OPTIONS, default: "TWAP" },
      { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 200000 },
    ],
  },

  // TradFi — Commodity
  OIL_COMMODITY_REGIME: {
    fields: [
      {
        key: "regime_model",
        label: "Regime Model",
        type: "dropdown",
        options: REGIME_MODEL_OPTIONS,
        default: "HMM_3STATE",
      },
      {
        key: "factors",
        label: "Factors",
        type: "multi-select",
        options: COMMODITY_FACTOR_OPTIONS,
        default: ["rig_count", "cot_positioning", "storage", "price_momentum", "weather"],
      },
      { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 100000 },
    ],
  },
  NG_COMMODITY_REGIME: {
    fields: [
      {
        key: "regime_model",
        label: "Regime Model",
        type: "dropdown",
        options: REGIME_MODEL_OPTIONS,
        default: "HMM_3STATE",
      },
      {
        key: "factors",
        label: "Factors",
        type: "multi-select",
        options: COMMODITY_FACTOR_OPTIONS,
        default: ["rig_count", "cot_positioning", "storage", "price_momentum", "weather"],
      },
      { key: "max_position_usd", label: "Max Position", type: "number", suffix: "USD", step: 10000, default: 100000 },
    ],
  },

  // TradFi — Event Macro
  EVENT_MACRO_CRYPTO: {
    fields: [
      {
        key: "event_types",
        label: "Event Types",
        type: "multi-select",
        options: EVENT_TYPE_OPTIONS,
        default: ["CPI", "FOMC", "NFP", "EARNINGS", "GDP"],
      },
      { key: "pre_event_hours", label: "Pre-Event Window", type: "number", suffix: "hours", step: 1, default: 24 },
      { key: "post_event_hours", label: "Post-Event Window", type: "number", suffix: "hours", step: 1, default: 4 },
      {
        key: "venues",
        label: "Venues",
        type: "multi-select",
        options: CEFI_VENUE_OPTIONS,
        default: ["BINANCE", "OKX"],
      },
    ],
  },
  EVENT_MACRO_TRADFI: {
    fields: [
      {
        key: "event_types",
        label: "Event Types",
        type: "multi-select",
        options: EVENT_TYPE_OPTIONS,
        default: ["CPI", "FOMC", "NFP", "EARNINGS", "GDP"],
      },
      { key: "pre_event_hours", label: "Pre-Event Window", type: "number", suffix: "hours", step: 1, default: 24 },
      { key: "post_event_hours", label: "Post-Event Window", type: "number", suffix: "hours", step: 1, default: 4 },
      {
        key: "venues",
        label: "Venues",
        type: "multi-select",
        options: CEFI_VENUE_OPTIONS,
        default: ["BINANCE", "OKX"],
      },
    ],
  },

  // Prediction
  PREDICTION_ARB_BTC: {
    fields: [
      {
        key: "venues",
        label: "Venues",
        type: "multi-select",
        options: PREDICTION_VENUE_OPTIONS,
        default: ["POLYMARKET", "KALSHI"],
      },
      { key: "min_edge_pct", label: "Min Edge", type: "number", suffix: "%", step: 0.5, default: 3.0 },
      { key: "max_stake_usd", label: "Max Stake", type: "number", suffix: "USD", step: 500, default: 5000 },
    ],
  },
};
