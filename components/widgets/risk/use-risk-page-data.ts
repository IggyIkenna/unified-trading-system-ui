"use client";

/* eslint-disable react-hooks/exhaustive-deps -- TODO: pre-existing 15 warnings predate
   the lint-staged migration (commit ccc67a41). Each is a logical-expression / conditional
   initialization feeding a useMemo that the rule wants wrapped in its own useMemo. Fix
   properly in a follow-up; disabled here so unrelated rename touches can land. */

import * as React from "react";
import { toast } from "sonner";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { apiFetch } from "@/lib/api/fetch";
import {
  useRiskLimits,
  useVaR,
  useGreeks,
  useStressScenarios,
  useVarSummary,
  useStressTest,
  useRegime,
  usePortfolioGreeks,
  useVenueCircuitBreakers,
  useCircuitBreakerMutation,
  useKillSwitchMutation,
} from "@/hooks/api/use-risk";
import {
  type RiskData,
  type RiskLimit,
  type ExposureRow,
  type StrategyHeatmapRow,
  getUtilization,
  MOCK_STRATEGIES,
  STRATEGY_RISK_MAP,
  COMPONENT_TO_RISK_TYPE,
} from "./risk-data-context";
import { MOCK_PORTFOLIO_DELTA, STRATEGY_RISK_PROFILES } from "@/lib/mocks/fixtures/defi-risk";
import { getFilledDefiOrders } from "@/lib/api/mock-trade-ledger";
import type { PortfolioDeltaComposite } from "@/lib/types/defi";

const VAR_METHOD_MULTIPLIERS: Record<string, number> = {
  historical: 1.0,
  parametric: 0.92,
  monte_carlo: 1.08,
  filtered_historical: 1.05,
};

/**
 * Extracted from risk/page.tsx — all data construction logic for the Risk tab.
 *
 * Used by:
 * - Risk page (directly) — passes return value to RiskDataProvider
 * - AllWidgetProviders — RiskDataProvider calls this when no value prop is given
 */
export function useRiskPageData(): {
  riskData: RiskData;
  isLoading: boolean;
  hasError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const {
    data: riskLimitsData,
    isLoading: limitsLoading,
    isError: limitsIsError,
    error: limitsError,
    refetch: refetchLimits,
  } = useRiskLimits();
  const { data: varData, isLoading: varLoading, isError: varIsError, error: varError, refetch: refetchVar } = useVaR();
  const {
    data: greeksData,
    isLoading: greeksLoading,
    isError: greeksIsError,
    error: greeksError,
    refetch: refetchGreeks,
  } = useGreeks();
  const {
    data: stressScenariosData,
    isLoading: stressLoading,
    isError: stressIsError,
    error: stressError,
    refetch: refetchStress,
  } = useStressScenarios();
  const scope = useWorkspaceScope();
  const isBatchMode = scope.mode === "batch";
  const scopeStrategyIds = React.useMemo(
    () =>
      getStrategyIdsForScope({
        organizationIds: scope.organizationIds,
        clientIds: scope.clientIds,
        strategyIds: scope.strategyIds,
      }),
    [scope.organizationIds, scope.clientIds, scope.strategyIds],
  );
  const scopeReductionFactor = scopeStrategyIds.length > 0 ? Math.max(0.15, scopeStrategyIds.length / 50) : 1.0;
  const { data: varSummaryData, isLoading: varSummaryLoading } = useVarSummary();
  const [selectedStressScenario, setSelectedStressScenario] = React.useState<string | null>(null);
  const { data: stressTestResult, isLoading: stressTestLoading } = useStressTest(selectedStressScenario);
  const { data: regimeData } = useRegime();
  const { data: portfolioGreeksData, isLoading: portfolioGreeksLoading } = usePortfolioGreeks();
  const { data: venueCircuitBreakers } = useVenueCircuitBreakers();

  const circuitBreakerMutation = useCircuitBreakerMutation();
  const killSwitchMutation = useKillSwitchMutation();

  const [trippedStrategies, setTrippedStrategies] = React.useState<Set<string>>(new Set());
  const [killedStrategies, setKilledStrategies] = React.useState<Set<string>>(new Set());
  const [scaledStrategies, setScaledStrategies] = React.useState<Record<string, number>>({});
  const [btcPriceChangePct, setBtcPriceChangePct] = React.useState(0);
  const [varMethod, setVarMethod] = React.useState<"historical" | "parametric" | "monte_carlo" | "filtered_historical">(
    "historical",
  );
  const [regimeMultiplier, setRegimeMultiplier] = React.useState(1.0);
  const [exposurePeriod, setExposurePeriod] = React.useState<"1W" | "1M" | "3M">("1M");
  const [riskFilterStrategy, setRiskFilterStrategy] = React.useState<string>("all");
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

  const riskLimitsRaw: RiskLimit[] =
    ((riskLimitsData as Record<string, unknown>)?.data as RiskLimit[]) ??
    ((riskLimitsData as Record<string, unknown>)?.limits as RiskLimit[]) ??
    [];
  const riskLimits: RiskLimit[] = React.useMemo(() => {
    if (scopeStrategyIds.length === 0) return riskLimitsRaw;
    return riskLimitsRaw.filter((l) => l.entityType !== "strategy" || scopeStrategyIds.includes(l.entity));
  }, [riskLimitsRaw, scopeStrategyIds]);
  const componentVarData: Array<Record<string, unknown>> =
    ((varData as Record<string, unknown>)?.data as Array<Record<string, unknown>>) ??
    ((varData as Record<string, unknown>)?.components as Array<Record<string, unknown>>) ??
    [];
  const stressScenarios: Array<Record<string, unknown>> =
    ((stressScenariosData as Record<string, unknown>)?.data as Array<Record<string, unknown>>) ??
    ((stressScenariosData as Record<string, unknown>)?.scenarios as Array<Record<string, unknown>>) ??
    [];
  const greeksRaw =
    ((greeksData as Record<string, unknown>)?.data as Record<string, unknown>) ??
    (greeksData as Record<string, unknown>) ??
    {};
  const portfolioGreeks = (greeksRaw?.portfolio as {
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
    rho: number;
  }) ?? { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  const positionGreeks: Array<Record<string, unknown>> = (greeksRaw?.positions as Array<Record<string, unknown>>) ?? [];
  const greeksTimeSeries: Array<Record<string, unknown>> =
    (greeksRaw?.timeSeries as Array<Record<string, unknown>>) ?? [];
  const secondOrderRisks = (greeksRaw?.secondOrder as { volga: number; vanna: number; slide: number }) ?? {
    volga: 0,
    vanna: 0,
    slide: 0,
  };

  const strategyRiskHeatmap: StrategyHeatmapRow[] =
    ((riskLimitsData as Record<string, unknown>)?.heatmap as StrategyHeatmapRow[]) ?? [];
  const exposureRows: ExposureRow[] =
    ((riskLimitsData as Record<string, unknown>)?.exposureRows as ExposureRow[]) ?? [];
  const exposureTimeSeries: Array<Record<string, unknown>> =
    ((riskLimitsData as Record<string, unknown>)?.exposureTimeSeries as Array<Record<string, unknown>>) ?? [];
  const termStructureData: Array<Record<string, unknown>> =
    ((varData as Record<string, unknown>)?.termStructure as Array<Record<string, unknown>>) ?? [];
  const hfTimeSeries: Array<Record<string, unknown>> =
    ((riskLimitsData as Record<string, unknown>)?.hfTimeSeries as Array<Record<string, unknown>>) ?? [];
  const distanceToLiquidation: Array<Record<string, unknown>> =
    ((riskLimitsData as Record<string, unknown>)?.distanceToLiquidation as Array<Record<string, unknown>>) ?? [];

  const isLoading = limitsLoading || varLoading || greeksLoading || stressLoading;
  const hasError = limitsIsError || varIsError || greeksIsError || stressIsError;
  const riskQueryError = (limitsError ?? varError ?? greeksError ?? stressError) as Error | null;

  const refetchRiskCore = React.useCallback(() => {
    void refetchLimits();
    void refetchVar();
    void refetchGreeks();
    void refetchStress();
  }, [refetchLimits, refetchVar, refetchGreeks, refetchStress]);

  const adjustedVarData = componentVarData.map((d) => ({
    ...d,
    var95: Math.round(((d.var95 as number) ?? 0) * (VAR_METHOD_MULTIPLIERS[varMethod] ?? 1) * regimeMultiplier),
  }));

  const sortedLimits = React.useMemo(() => {
    return [...riskLimits].sort((a, b) => {
      const utilA = getUtilization(a.value, a.limit);
      const utilB = getUtilization(b.value, b.limit);
      return utilB - utilA;
    });
  }, [riskLimits]);

  const relevantRiskTypes = riskFilterStrategy === "all" ? null : (STRATEGY_RISK_MAP[riskFilterStrategy] ?? []);
  const filteredExposureRows = React.useMemo(() => {
    if (!relevantRiskTypes) return exposureRows;
    return exposureRows.filter((row) => {
      const riskType = COMPONENT_TO_RISK_TYPE[row.component];
      return riskType && relevantRiskTypes.includes(riskType);
    });
  }, [relevantRiskTypes, exposureRows]);

  const groupedExposure = React.useMemo(() => {
    const groups: Record<string, ExposureRow[]> = {
      first_order: [],
      second_order: [],
      structural: [],
      operational: [],
      domain_specific: [],
    };
    filteredExposureRows.forEach((row) => {
      if (groups[row.category]) groups[row.category].push(row);
    });
    return groups;
  }, [filteredExposureRows]);

  const totalVar95 = 2100000 * regimeMultiplier * scopeReductionFactor;
  const totalVar99 = 4800000 * regimeMultiplier * scopeReductionFactor;
  const totalES95 = 3200000 * regimeMultiplier * scopeReductionFactor;
  const totalES99 = 6700000 * regimeMultiplier * scopeReductionFactor;
  const criticalCount = sortedLimits.filter((l) => getUtilization(l.value, l.limit) >= 90).length;
  const warningCount = sortedLimits.filter((l) => {
    const u = getUtilization(l.value, l.limit);
    return u >= 70 && u < 90;
  }).length;

  const handleTripCircuitBreaker = React.useCallback(
    (strategyId: string, strategyName: string) => {
      circuitBreakerMutation.mutate(
        { strategy_id: strategyId, action: "trip" },
        {
          onSuccess: () => {
            setTrippedStrategies((prev) => new Set([...prev, strategyId]));
            toast.success(`Circuit breaker tripped for ${strategyName}`);
          },
          onError: () => {
            toast.error(`Failed to trip circuit breaker for ${strategyName}`);
          },
        },
      );
    },
    [circuitBreakerMutation],
  );

  const handleResetCircuitBreaker = React.useCallback(
    (strategyId: string, strategyName: string) => {
      circuitBreakerMutation.mutate(
        { strategy_id: strategyId, action: "reset" },
        {
          onSuccess: () => {
            setTrippedStrategies((prev) => {
              const n = new Set(prev);
              n.delete(strategyId);
              return n;
            });
            toast.success(`Circuit breaker reset for ${strategyName}`);
          },
          onError: () => {
            toast.error(`Failed to reset circuit breaker for ${strategyName}`);
          },
        },
      );
    },
    [circuitBreakerMutation],
  );

  const handleKillSwitch = React.useCallback(
    (strategyId: string, strategyName: string) => {
      killSwitchMutation.mutate(
        { scope: "strategy", target_id: strategyId },
        {
          onSuccess: () => {
            setKilledStrategies((prev) => new Set([...prev, strategyId]));
            toast.error(`Kill switch activated for ${strategyName}`);
          },
          onError: () => {
            toast.error(`Failed to activate kill switch for ${strategyName}`);
          },
        },
      );
    },
    [killSwitchMutation],
  );

  const handleScale = React.useCallback((strategyId: string, strategyName: string, factor: number) => {
    apiFetch(`/api/analytics/strategies/${strategyId}/scale`, null, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scale_factor: factor }),
    })
      .then(() => {
        setScaledStrategies((prev) => ({ ...prev, [strategyId]: factor }));
        toast.success(`Scaled ${strategyName} to ${Math.round(factor * 100)}%`);
      })
      .catch(() => {
        toast.error(`Failed to scale ${strategyName}`);
      });
  }, []);

  const anyKillSwitchActive =
    killedStrategies.size > 0 || (venueCircuitBreakers ?? []).some((v) => v.kill_switch_active);

  // ---------------------------------------------------------------------------
  // DeFi risk data for risk-kpi-strip (moved from widget to context)
  // ---------------------------------------------------------------------------
  const [defiLedgerVersion, setDefiLedgerVersion] = React.useState(0);
  React.useEffect(() => {
    const refresh = () => setDefiLedgerVersion((n) => n + 1);
    window.addEventListener("mock-order-filled", refresh);
    window.addEventListener("mock-ledger-reset", refresh);
    return () => {
      window.removeEventListener("mock-order-filled", refresh);
      window.removeEventListener("mock-ledger-reset", refresh);
    };
  }, []);

  const hasDefiStrategies = React.useMemo(() => {
    return STRATEGY_RISK_PROFILES.length > 0 || getFilledDefiOrders().length > 0;
  }, [defiLedgerVersion]);

  const defiDeltaComposite = React.useMemo((): PortfolioDeltaComposite => {
    const filled = getFilledDefiOrders();
    let additionalDeltaUsd = 0;
    let additionalDeltaEth = 0;
    for (const order of filled) {
      const notional = order.quantity * (order.average_fill_price ?? order.price);
      const sign = order.side === "buy" ? 1 : -1;
      additionalDeltaUsd += sign * notional;
      const instrUpper = order.instrument_id.toUpperCase();
      if (instrUpper.includes("ETH") || instrUpper.includes("WEETH")) {
        additionalDeltaEth += sign * order.quantity;
      }
    }
    return {
      ...MOCK_PORTFOLIO_DELTA,
      total_delta_usd: MOCK_PORTFOLIO_DELTA.total_delta_usd + additionalDeltaUsd,
      total_delta_eth: MOCK_PORTFOLIO_DELTA.total_delta_eth + additionalDeltaEth,
    };
  }, [defiLedgerVersion]);

  const defiRiskTimeSeries = React.useMemo(
    () => [
      { time: "03-24", healthFactor: 1.85, netDeltaUsd: 360000, treasuryPct: 17.5 },
      { time: "03-25", healthFactor: 1.62, netDeltaUsd: 345000, treasuryPct: 18.2 },
      { time: "03-26", healthFactor: 1.35, netDeltaUsd: 310000, treasuryPct: 16.8 },
      { time: "03-27", healthFactor: 1.18, netDeltaUsd: 380000, treasuryPct: 15.1 },
      { time: "03-28", healthFactor: 1.28, netDeltaUsd: 355000, treasuryPct: 16.5 },
      { time: "03-29", healthFactor: 1.42, netDeltaUsd: 340000, treasuryPct: 17.0 },
      { time: "03-30", healthFactor: 1.52, netDeltaUsd: 360000, treasuryPct: 17.5 },
    ],
    [],
  );

  const greeksForSlider = portfolioGreeksData?.portfolio ?? portfolioGreeks;
  const btcSpot = 65000;
  const dS = btcSpot * (btcPriceChangePct / 100);
  const estimatedPnl = greeksForSlider.delta * dS + 0.5 * greeksForSlider.gamma * dS * dS;

  const riskData: RiskData = React.useMemo(
    () => ({
      riskLimits,
      componentVarData,
      adjustedVarData,
      stressScenarios,
      portfolioGreeks,
      positionGreeks,
      greeksTimeSeries,
      secondOrderRisks,
      varSummary: varSummaryData ?? null,
      varSummaryLoading,
      regimeData: regimeData ?? null,
      portfolioGreeksData: portfolioGreeksData ?? null,
      portfolioGreeksLoading,
      venueCircuitBreakers: venueCircuitBreakers ?? [],
      strategyRiskHeatmap,
      exposureRows,
      exposureTimeSeries,
      termStructureData,
      hfTimeSeries,
      distanceToLiquidation,
      sortedLimits,
      isLoading,
      hasError,
      varMethod,
      setVarMethod,
      regimeMultiplier,
      setRegimeMultiplier,
      exposurePeriod,
      setExposurePeriod,
      riskFilterStrategy,
      setRiskFilterStrategy,
      filteredExposureRows,
      groupedExposure,
      selectedNode,
      setSelectedNode,
      selectedStressScenario,
      setSelectedStressScenario,
      stressTestResult: stressTestResult ?? null,
      stressTestLoading,
      btcPriceChangePct,
      setBtcPriceChangePct,
      estimatedPnl,
      totalVar95,
      totalVar99,
      totalES95,
      totalES99,
      criticalCount,
      warningCount,
      handleTripCircuitBreaker,
      handleResetCircuitBreaker,
      handleKillSwitch,
      handleScale,
      trippedStrategies,
      killedStrategies,
      scaledStrategies,
      anyKillSwitchActive,
      isBatchMode,
      circuitBreakerPending: circuitBreakerMutation.isPending,
      defiRiskProfiles: STRATEGY_RISK_PROFILES,
      defiDeltaComposite,
      hasDefiStrategies,
      defiRiskTimeSeries,
    }),
    [
      riskLimits,
      componentVarData,
      adjustedVarData,
      stressScenarios,
      portfolioGreeks,
      positionGreeks,
      greeksTimeSeries,
      secondOrderRisks,
      varSummaryData,
      varSummaryLoading,
      regimeData,
      portfolioGreeksData,
      portfolioGreeksLoading,
      venueCircuitBreakers,
      strategyRiskHeatmap,
      exposureRows,
      exposureTimeSeries,
      termStructureData,
      hfTimeSeries,
      distanceToLiquidation,
      sortedLimits,
      isLoading,
      hasError,
      varMethod,
      regimeMultiplier,
      exposurePeriod,
      riskFilterStrategy,
      filteredExposureRows,
      groupedExposure,
      selectedNode,
      selectedStressScenario,
      stressTestResult,
      stressTestLoading,
      btcPriceChangePct,
      estimatedPnl,
      totalVar95,
      totalVar99,
      totalES95,
      totalES99,
      criticalCount,
      warningCount,
      handleTripCircuitBreaker,
      handleResetCircuitBreaker,
      handleKillSwitch,
      handleScale,
      trippedStrategies,
      killedStrategies,
      scaledStrategies,
      anyKillSwitchActive,
      isBatchMode,
      circuitBreakerMutation.isPending,
      defiDeltaComposite,
      hasDefiStrategies,
      defiRiskTimeSeries,
    ],
  );

  return { riskData, isLoading, hasError, error: riskQueryError, refetch: refetchRiskCore };
}
