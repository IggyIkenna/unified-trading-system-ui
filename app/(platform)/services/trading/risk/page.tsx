"use client";

import * as React from "react";
import { OctagonX } from "lucide-react";
import { ApiError } from "@/components/shared/api-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
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
import { WidgetGrid } from "@/components/widgets/widget-grid";
import {
  RiskDataProvider,
  type RiskData,
  type RiskLimit,
  type ExposureRow,
  type StrategyHeatmapRow,
  getUtilization,
  MOCK_STRATEGIES,
  STRATEGY_RISK_MAP,
  COMPONENT_TO_RISK_TYPE,
} from "@/components/widgets/risk/risk-data-context";

import "@/components/widgets/risk/register";

const VAR_METHOD_MULTIPLIERS: Record<string, number> = {
  historical: 1.0,
  parametric: 0.92,
  monte_carlo: 1.08,
  filtered_historical: 1.05,
};

export default function RiskPage() {
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
  const { scope } = useGlobalScope();
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
  // Scope reduction factor: when filtering to a subset, scale aggregated risk metrics
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

  // Extract API data — filter risk limits by scope strategy IDs
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
    ],
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (hasError && riskQueryError) {
    return (
      <div className="p-6">
        <ApiError error={riskQueryError} onRetry={refetchRiskCore} title="Failed to load risk data" />
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {anyKillSwitchActive && (
        <div className="mx-2 mt-2 rounded-lg border-2 border-rose-500 bg-rose-500/10 p-3 flex items-center gap-3 shrink-0">
          <OctagonX className="size-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold text-rose-400 text-sm">KILL SWITCH ACTIVE</p>
            <p className="text-xs text-rose-300">One or more strategies have been forcibly stopped.</p>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto p-2">
        <RiskDataProvider value={riskData}>
          <WidgetGrid tab="risk" />
        </RiskDataProvider>
      </div>
    </div>
  );
}
