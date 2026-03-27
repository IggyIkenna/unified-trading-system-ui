"use client";

import * as React from "react";
import { MOCK_STRATEGY_INSTRUCTIONS } from "@/lib/mocks/fixtures/strategy-instructions";
import { INSTRUCTION_STRATEGY_TYPES } from "@/lib/config/services/instructions.config";
import { TRADING_OPERATION_TYPES } from "@/lib/config/services/trading.config";
import type { StrategyInstruction, InstructionsSummary } from "@/lib/types/instructions";
import type { FilterDefinition } from "@/components/platform/filter-bar";

const strategyTypesForFilter: readonly string[] = INSTRUCTION_STRATEGY_TYPES as unknown as string[];
const operationTypesForFilter: readonly string[] = TRADING_OPERATION_TYPES as unknown as string[];

interface InstructionsDataContextValue {
  strategyFilter: string;
  setStrategyFilter: (f: string) => void;
  opTypeFilter: string;
  setOpTypeFilter: (f: string) => void;

  allInstructions: StrategyInstruction[];
  filteredInstructions: StrategyInstruction[];

  summary: InstructionsSummary;

  selectedInstructionId: string | null;
  setSelectedInstructionId: (id: string | null) => void;
  selectedInstruction: StrategyInstruction | null;

  strategyTypes: readonly string[];
  operationTypes: readonly string[];

  filterDefs: FilterDefinition[];
  filterValues: Record<string, unknown>;
  handleFilterChange: (key: string, value: unknown) => void;
  resetFilters: () => void;

  refresh: () => void;
}

const InstructionsDataContext = React.createContext<InstructionsDataContextValue | null>(null);

export function InstructionsDataProvider({ children }: { children: React.ReactNode }) {
  const [strategyFilter, setStrategyFilter] = React.useState("ALL");
  const [opTypeFilter, setOpTypeFilter] = React.useState("ALL");
  const [selectedInstructionId, setSelectedInstructionId] = React.useState<string | null>(null);

  const allInstructions = MOCK_STRATEGY_INSTRUCTIONS;

  const filteredInstructions = React.useMemo(() => {
    return allInstructions.filter((inst) => {
      if (strategyFilter !== "ALL" && inst.strategyType !== strategyFilter) return false;
      if (opTypeFilter !== "ALL" && inst.instruction.operationType !== opTypeFilter) return false;
      return true;
    });
  }, [allInstructions, strategyFilter, opTypeFilter]);

  const summary = React.useMemo((): InstructionsSummary => {
    const total = filteredInstructions.length;
    const filled = filteredInstructions.filter((i) => i.fill?.status === "FILLED").length;
    const partial = filteredInstructions.filter((i) => i.fill?.status === "PARTIAL_FILL").length;
    const pending = filteredInstructions.filter((i) => i.fill === null).length;
    const withFill = filteredInstructions.filter((i) => i.fill !== null);
    const avgSlippage =
      withFill.length > 0 ? withFill.reduce((sum, i) => sum + (i.fill?.slippageBps ?? 0), 0) / withFill.length : 0;
    return { total, filled, partial, pending, avgSlippage };
  }, [filteredInstructions]);

  const selectedInstruction = React.useMemo(() => {
    if (!selectedInstructionId) return null;
    return filteredInstructions.find((i) => i.id === selectedInstructionId) ?? null;
  }, [filteredInstructions, selectedInstructionId]);

  const filterDefs: FilterDefinition[] = React.useMemo(
    () => [
      {
        key: "strategyType",
        label: "Strategy type",
        type: "select" as const,
        options: strategyTypesForFilter.map((t) => ({ value: t, label: t })),
      },
      {
        key: "operationType",
        label: "Operation type",
        type: "select" as const,
        options: operationTypesForFilter.map((t) => ({ value: t, label: t })),
      },
    ],
    [],
  );

  const filterValues = React.useMemo(
    () => ({
      strategyType: strategyFilter === "ALL" ? undefined : strategyFilter,
      operationType: opTypeFilter === "ALL" ? undefined : opTypeFilter,
    }),
    [strategyFilter, opTypeFilter],
  );

  const handleFilterChange = React.useCallback((key: string, value: unknown) => {
    const v = (value as string) || "";
    if (key === "strategyType") setStrategyFilter(v ? v : "ALL");
    if (key === "operationType") setOpTypeFilter(v ? v : "ALL");
  }, []);

  const resetFilters = React.useCallback(() => {
    setStrategyFilter("ALL");
    setOpTypeFilter("ALL");
  }, []);

  const refresh = React.useCallback(() => {}, []);

  const value = React.useMemo(
    (): InstructionsDataContextValue => ({
      strategyFilter,
      setStrategyFilter,
      opTypeFilter,
      setOpTypeFilter,
      allInstructions,
      filteredInstructions,
      summary,
      selectedInstructionId,
      setSelectedInstructionId,
      selectedInstruction,
      strategyTypes: ["ALL", ...strategyTypesForFilter],
      operationTypes: ["ALL", ...operationTypesForFilter],
      filterDefs,
      filterValues,
      handleFilterChange,
      resetFilters,
      refresh,
    }),
    [
      strategyFilter,
      opTypeFilter,
      allInstructions,
      filteredInstructions,
      summary,
      selectedInstructionId,
      selectedInstruction,
      filterDefs,
      filterValues,
      handleFilterChange,
      resetFilters,
      refresh,
    ],
  );

  return <InstructionsDataContext.Provider value={value}>{children}</InstructionsDataContext.Provider>;
}

export function useInstructionsData(): InstructionsDataContextValue {
  const ctx = React.useContext(InstructionsDataContext);
  if (!ctx) throw new Error("useInstructionsData must be used within InstructionsDataProvider");
  return ctx;
}
