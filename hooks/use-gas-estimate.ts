"use client";

import * as React from "react";
import {
  CHAIN_GAS_BASELINE,
  CHAIN_GAS_BASELINE_DEFAULT,
  DEFI_GAS_TICK_MS,
  DEFI_GAS_UNITS,
  type DefiGasOperation,
} from "@/lib/config/services/defi.config";

export type GasQuote = {
  chain: string;
  operation: DefiGasOperation;
  gasUnits: number;
  baseFeeGwei: number;
  priorityFeeGwei: number;
  nativeSymbol: string;
  nativeUsd: number;
  nativeFee: number;
  usdFee: number;
  asOf: string;
};

// Deterministic jitter so all hook instances agree within a tick (re-renders
// don't produce different numbers for the same displayed quote).
function jitter(seed: number, amplitude: number): number {
  return 1 + amplitude * Math.sin(seed);
}

/**
 * Gas-fee quote for a DeFi operation on a given chain.
 *
 * Mock implementation: ticks every DEFI_GAS_TICK_MS (5s), applies ±8% jitter to
 * baseFee and ±0.5% to native-token price to simulate oracle updates. When the
 * backend gas oracle is wired, swap the internals to a REST poll with
 * refetchInterval or a WebSocket subscription — caller contract is unchanged.
 */
export function useGasEstimate(params: { chain: string; operation: DefiGasOperation }): GasQuote {
  const { chain, operation } = params;
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), DEFI_GAS_TICK_MS);
    return () => clearInterval(id);
  }, []);

  return React.useMemo(() => {
    const baseline = CHAIN_GAS_BASELINE[chain] ?? CHAIN_GAS_BASELINE_DEFAULT;
    const gasUnits = DEFI_GAS_UNITS[operation];

    const baseFeeGwei = baseline.baseFeeGwei * jitter(tick * 1.3, 0.08);
    const priorityFeeGwei = baseline.priorityFeeGwei;
    const nativeUsd = baseline.nativeUsd * jitter(tick * 0.7, 0.005);

    const nativeFee = (gasUnits * (baseFeeGwei + priorityFeeGwei)) / 1e9;
    const usdFee = nativeFee * nativeUsd;

    return {
      chain,
      operation,
      gasUnits,
      baseFeeGwei,
      priorityFeeGwei,
      nativeSymbol: baseline.nativeSymbol,
      nativeUsd,
      nativeFee,
      usdFee,
      asOf: new Date().toISOString(),
    };
  }, [chain, operation, tick]);
}
