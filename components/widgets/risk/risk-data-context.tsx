"use client";

import * as React from "react";
import type {
  VarSummaryData,
  StressTestResult,
  RegimeData,
  GreekValues,
  PortfolioGreeksResponse,
  VenueCircuitBreakerStatus,
} from "@/hooks/api/use-risk";
import { formatNumber } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Types used by the risk widgets (kept local until moved to lib/types/risk.ts)
// ---------------------------------------------------------------------------

export interface RiskLimit {
  id: string;
  name: string;
  value: number;
  limit: number;
  unit: string;
  category: "exposure" | "margin" | "ltv" | "concentration";
  entity: string;
  entityType: "company" | "client" | "account" | "strategy" | "underlying" | "instrument";
  level: number;
  parentId?: string;
  var95?: number;
}

export interface ExposureRow {
  component: string;
  category: "first_order" | "second_order" | "structural" | "operational" | "domain_specific";
  pnl: number;
  exposure: number | string;
  limit: number | string;
  utilization: number;
}

export interface StrategyHeatmapRow {
  strategy: string;
  status: string;
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Context shape (matches spec §3)
// ---------------------------------------------------------------------------

export interface RiskData {
  riskLimits: RiskLimit[];
  componentVarData: Array<Record<string, unknown>>;
  adjustedVarData: Array<Record<string, unknown>>;
  stressScenarios: Array<Record<string, unknown>>;
  portfolioGreeks: GreekValues;
  positionGreeks: Array<Record<string, unknown>>;
  greeksTimeSeries: Array<Record<string, unknown>>;
  secondOrderRisks: { volga: number; vanna: number; slide: number };
  varSummary: VarSummaryData | null;
  varSummaryLoading: boolean;
  regimeData: RegimeData | null;
  portfolioGreeksData: PortfolioGreeksResponse | null;
  portfolioGreeksLoading: boolean;
  venueCircuitBreakers: VenueCircuitBreakerStatus[];
  strategyRiskHeatmap: StrategyHeatmapRow[];
  exposureRows: ExposureRow[];
  exposureTimeSeries: Array<Record<string, unknown>>;
  termStructureData: Array<Record<string, unknown>>;
  hfTimeSeries: Array<Record<string, unknown>>;
  distanceToLiquidation: Array<Record<string, unknown>>;
  sortedLimits: RiskLimit[];

  isLoading: boolean;
  hasError: boolean;

  varMethod: "historical" | "parametric" | "monte_carlo" | "filtered_historical";
  setVarMethod: (m: "historical" | "parametric" | "monte_carlo" | "filtered_historical") => void;
  regimeMultiplier: number;
  setRegimeMultiplier: (m: number) => void;
  exposurePeriod: "1W" | "1M" | "3M";
  setExposurePeriod: (p: "1W" | "1M" | "3M") => void;

  riskFilterStrategy: string;
  setRiskFilterStrategy: (s: string) => void;
  filteredExposureRows: ExposureRow[];
  groupedExposure: Record<string, ExposureRow[]>;

  selectedNode: string | null;
  setSelectedNode: (node: string | null) => void;

  selectedStressScenario: string | null;
  setSelectedStressScenario: (s: string | null) => void;
  stressTestResult: StressTestResult | null;
  stressTestLoading: boolean;

  btcPriceChangePct: number;
  setBtcPriceChangePct: (pct: number) => void;
  estimatedPnl: number;

  totalVar95: number;
  totalVar99: number;
  totalES95: number;
  totalES99: number;
  criticalCount: number;
  warningCount: number;

  handleTripCircuitBreaker: (strategyId: string, name: string) => void;
  handleResetCircuitBreaker: (strategyId: string, name: string) => void;
  handleKillSwitch: (strategyId: string, name: string) => void;
  handleScale: (strategyId: string, name: string, factor: number) => void;
  trippedStrategies: Set<string>;
  killedStrategies: Set<string>;
  scaledStrategies: Record<string, number>;

  anyKillSwitchActive: boolean;
  isBatchMode: boolean;
  circuitBreakerPending: boolean;

  // DeFi risk data (consumed by risk-kpi-strip, sourced from defi mocks)
  defiRiskProfiles: import("@/lib/types/defi").StrategyRiskProfile[];
  defiDeltaComposite: import("@/lib/types/defi").PortfolioDeltaComposite;
  hasDefiStrategies: boolean;
  defiRiskTimeSeries: Array<Record<string, number | string>>;
}

// ---------------------------------------------------------------------------
// Context + provider + hook
// ---------------------------------------------------------------------------

const RiskDataContext = React.createContext<RiskData | null>(null);

export function RiskDataProvider({ value, children }: { value: RiskData; children: React.ReactNode }) {
  return <RiskDataContext.Provider value={value}>{children}</RiskDataContext.Provider>;
}

export function useRiskData(): RiskData {
  const ctx = React.useContext(RiskDataContext);
  if (!ctx) throw new Error("useRiskData must be used within RiskDataProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Helpers (exported for shared use across widgets)
// ---------------------------------------------------------------------------

export function getUtilization(value: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min((value / limit) * 100, 100);
}

export function getStatusFromUtil(util: number): "live" | "warning" | "critical" {
  if (util < 70) return "live";
  if (util < 90) return "warning";
  return "critical";
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${formatNumber(value / 1_000_000, 1)}M`;
  if (Math.abs(value) >= 1_000) return `$${formatNumber(value / 1_000, 0)}K`;
  return `$${formatNumber(value, 0)}`;
}

export function getAssetClassColor(assetClass: string): string {
  switch (assetClass) {
    case "defi":
      return "var(--surface-config)";
    case "cefi":
      return "var(--surface-trading)";
    case "tradfi":
      return "var(--surface-markets)";
    case "sports":
      return "var(--surface-strategy)";
    default:
      return "var(--muted-foreground)";
  }
}

export { MOCK_STRATEGIES, STRATEGY_RISK_MAP, COMPONENT_TO_RISK_TYPE } from "@/lib/mocks/fixtures/risk-data";
