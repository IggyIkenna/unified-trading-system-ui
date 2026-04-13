"use client";

import * as React from "react";
import { useTickers } from "@/hooks/api/use-market-data";
import { useStrategyPerformance } from "@/hooks/api/use-strategies";
import { useOrganizationsList } from "@/hooks/api/use-organizations";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getClientIdsForOrgs, getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { DEFAULT_RESIDUAL_PNL, DEFAULT_STRUCTURAL_PNL } from "@/lib/mocks/fixtures/pnl-attribution";
import {
  generateClientPnL,
  generateFactorTimeSeries,
  generatePnLComponents,
  generateStrategyBreakdown,
  generateTimeSeriesData,
} from "@/lib/mocks/generators/pnl-generators";
import type {
  ClientPnLRow,
  ClientRecord,
  FactorDrilldown,
  OrgRecord,
  PnLComponent,
  StrategyRecord,
} from "@/lib/types/pnl";
import { type ShareClass, SHARE_CLASSES } from "@/lib/types/defi";

export type { PnLComponent, ClientPnLRow, FactorDrilldown } from "@/lib/types/pnl";

export interface PnLData {
  pnlComponents: PnLComponent[];
  structuralPnL: PnLComponent[];
  residualPnL: PnLComponent;
  netPnL: number;
  clientPnL: ClientPnLRow[];
  timeSeriesData: Array<Record<string, number | string>>;
  timeSeriesNetPnL: number;

  dataMode: "live" | "batch";
  setDataMode: (m: "live" | "batch") => void;
  dateRange: string;
  setDateRange: (d: string) => void;
  groupBy: string;
  setGroupBy: (g: string) => void;
  shareClass: ShareClass | "all";
  setShareClass: (sc: ShareClass | "all") => void;

  selectedFactor: string | null;
  setSelectedFactor: (f: string | null) => void;
  selectedFactorData: FactorDrilldown | null;

  selectedOrgIds: string[];
  setSelectedOrgIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedClientIds: string[];
  setSelectedClientIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStrategyIds: string[];
  setSelectedStrategyIds: React.Dispatch<React.SetStateAction<string[]>>;

  /** True when |residualPnL| / |netPnL| exceeds 10% — surface a warning banner */
  isResidualAlert: boolean;
  residualThresholdPct: number;

  isLoading: boolean;
}

const PnLDataContext = React.createContext<PnLData | null>(null);

const RESIDUAL_ALERT_THRESHOLD = 0.1; // 10%

export function PnLDataProvider({ children }: { children: React.ReactNode }) {
  const { data: tickersData, isLoading: tickersLoading, error: tickersError, refetch: refetchTickers } = useTickers();
  const { data: perfRaw } = useStrategyPerformance();
  const { data: orgsRaw } = useOrganizationsList();
  const { scope: globalScope } = useGlobalScope();

  const apiStrategies: StrategyRecord[] = React.useMemo(() => {
    if (!perfRaw) return [];
    const raw = perfRaw as Record<string, unknown>;
    const arr = Array.isArray(raw)
      ? raw
      : ((raw as Record<string, unknown>).data ?? (raw as Record<string, unknown>).strategies);
    let result = Array.isArray(arr) ? (arr as StrategyRecord[]) : [];
    if (globalScope.strategyIds.length > 0) {
      result = result.filter((s) => globalScope.strategyIds.includes(s.id));
    }
    return result;
  }, [perfRaw, globalScope.strategyIds]);

  const apiOrgs: OrgRecord[] = React.useMemo(() => {
    if (!orgsRaw) return [];
    const raw = orgsRaw as Record<string, unknown>;
    const arr = Array.isArray(raw)
      ? raw
      : ((raw as Record<string, unknown>).data ?? (raw as Record<string, unknown>).organizations);
    return Array.isArray(arr) ? (arr as OrgRecord[]) : [];
  }, [orgsRaw]);

  const apiClients: ClientRecord[] = React.useMemo(() => {
    if (!orgsRaw) return [];
    const raw = orgsRaw as Record<string, unknown>;
    const arr = (raw as Record<string, unknown>).data ?? (raw as Record<string, unknown>).clients;
    return Array.isArray(arr) ? (arr as ClientRecord[]) : [];
  }, [orgsRaw]);

  const td = tickersData as Record<string, unknown> | undefined;
  const structuralPnL: PnLComponent[] = Array.isArray(td?.structuralPnL)
    ? (td.structuralPnL as PnLComponent[])
    : DEFAULT_STRUCTURAL_PNL;

  const residualPnL: PnLComponent =
    td?.residualPnL != null && typeof td.residualPnL === "object" && !Array.isArray(td.residualPnL)
      ? (td.residualPnL as PnLComponent)
      : DEFAULT_RESIDUAL_PNL;

  const [groupBy, setGroupBy] = React.useState("all");
  const [dateRange, setDateRange] = React.useState("today");
  const [dataMode, setDataMode] = React.useState<"live" | "batch">("live");
  const [selectedFactor, setSelectedFactor] = React.useState<string | null>(null);
  const [shareClass, setShareClass] = React.useState<ShareClass | "all">("all");

  const [selectedOrgIds, setSelectedOrgIds] = React.useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = React.useState<string[]>([]);
  const [selectedStrategyIds, setSelectedStrategyIds] = React.useState<string[]>([]);

  // Sync local P&L scope selectors with the global scope bar
  React.useEffect(() => {
    setSelectedOrgIds(globalScope.organizationIds);
    const derivedClients =
      globalScope.clientIds.length > 0 ? globalScope.clientIds : getClientIdsForOrgs(globalScope.organizationIds);
    setSelectedClientIds(derivedClients);
    setSelectedStrategyIds(getStrategyIdsForScope(globalScope));
  }, [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);

  const filterMultiplier = React.useMemo(() => {
    let m = 1;
    if (selectedOrgIds.length > 0) m *= 0.6 + selectedOrgIds.length * 0.2;
    if (selectedClientIds.length > 0) m *= 0.5 + selectedClientIds.length * 0.25;
    if (selectedStrategyIds.length > 0) m *= 0.3 + selectedStrategyIds.length * 0.15;
    return m;
  }, [selectedOrgIds, selectedClientIds, selectedStrategyIds]);

  const pnlComponents = React.useMemo(
    () => generatePnLComponents(selectedOrgIds, selectedClientIds, selectedStrategyIds, dataMode === "batch"),
    [selectedOrgIds, selectedClientIds, selectedStrategyIds, dataMode],
  );

  const netPnL = pnlComponents.reduce((sum, c) => sum + c.value, 0);

  const clientPnL = React.useMemo(
    () =>
      generateClientPnL(selectedOrgIds, selectedClientIds, dataMode === "batch", apiOrgs, apiClients, apiStrategies),
    [selectedOrgIds, selectedClientIds, dataMode, apiOrgs, apiClients, apiStrategies],
  );

  const { data: timeSeriesData, netPnL: timeSeriesNetPnL } = React.useMemo(
    () => generateTimeSeriesData(filterMultiplier, dataMode === "batch", dateRange),
    [filterMultiplier, dataMode, dateRange],
  );

  const isResidualAlert = React.useMemo(
    () => netPnL !== 0 && Math.abs(residualPnL.value) / Math.abs(netPnL) > RESIDUAL_ALERT_THRESHOLD,
    [residualPnL.value, netPnL],
  );

  const selectedFactorData = React.useMemo((): FactorDrilldown | null => {
    if (!selectedFactor) return null;
    const factorComponent = pnlComponents.find((c) => c.name === selectedFactor);
    if (!factorComponent) return null;

    const breakdown = generateStrategyBreakdown(
      selectedFactor,
      factorComponent.value,
      dataMode === "batch",
      apiStrategies,
      apiClients,
    );
    const ts = generateFactorTimeSeries(
      selectedFactor,
      factorComponent.value,
      dateRange,
      dataMode === "batch",
      apiStrategies,
    );

    return {
      factor: factorComponent,
      breakdown,
      timeSeries: ts.data,
      strategyNames: ts.strategies,
    };
  }, [selectedFactor, pnlComponents, dataMode, dateRange, apiStrategies, apiClients]);

  const value = React.useMemo(
    () => ({
      pnlComponents,
      structuralPnL,
      residualPnL,
      netPnL,
      clientPnL,
      timeSeriesData,
      timeSeriesNetPnL,
      dataMode,
      setDataMode,
      dateRange,
      setDateRange,
      groupBy,
      setGroupBy,
      shareClass,
      setShareClass,
      selectedFactor,
      setSelectedFactor,
      selectedFactorData,
      selectedOrgIds,
      setSelectedOrgIds,
      selectedClientIds,
      setSelectedClientIds,
      selectedStrategyIds,
      setSelectedStrategyIds,
      isResidualAlert,
      residualThresholdPct: RESIDUAL_ALERT_THRESHOLD * 100,
      isLoading: tickersLoading,
    }),
    [
      pnlComponents,
      structuralPnL,
      residualPnL,
      netPnL,
      clientPnL,
      timeSeriesData,
      timeSeriesNetPnL,
      dataMode,
      dateRange,
      groupBy,
      shareClass,
      selectedFactor,
      selectedFactorData,
      selectedOrgIds,
      selectedClientIds,
      selectedStrategyIds,
      isResidualAlert,
      tickersLoading,
    ],
  );

  if (tickersLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (tickersError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load market data</p>
        <Button variant="outline" size="sm" onClick={() => refetchTickers()}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return <PnLDataContext.Provider value={value}>{children}</PnLDataContext.Provider>;
}

export function usePnLData(): PnLData {
  const ctx = React.useContext(PnLDataContext);
  if (!ctx) throw new Error("usePnLData must be used within PnLDataProvider");
  return ctx;
}
