import { vi } from "vitest";
import type { StrategyInstruction, InstructionsSummary } from "@/lib/types/instructions";
import type { FilterDefinition } from "@/components/shared/filter-bar";

/**
 * Minimal StrategyInstruction for harness tests.
 * Covers the filled / partial / pending branches tested across widgets.
 */
export function buildMockInstruction(overrides: Partial<StrategyInstruction> = {}): StrategyInstruction {
  return {
    id: "inst-test-001",
    strategyId: "DEFI_ETH_BASIS_HUF_1H",
    strategyType: "MOMENTUM",
    signal: {
      direction: "LONG",
      confidence: 0.87,
      timestamp: "2026-04-24T10:00:00Z",
    },
    instruction: {
      operationType: "TRADE",
      side: "BUY",
      quantity: 1.0,
      price: 3000.0,
      venue: "BINANCE-SPOT",
    },
    fill: {
      fillPrice: 3001.5,
      fillQty: 1.0,
      slippageBps: 5.0,
      status: "FILLED",
    },
    ...overrides,
  };
}

export function buildMockPendingInstruction(overrides: Partial<StrategyInstruction> = {}): StrategyInstruction {
  return buildMockInstruction({
    id: "inst-test-002",
    fill: null,
    signal: { direction: "SHORT", confidence: 0.72, timestamp: "2026-04-24T10:05:00Z" },
    ...overrides,
  });
}

export function buildMockPartialInstruction(overrides: Partial<StrategyInstruction> = {}): StrategyInstruction {
  return buildMockInstruction({
    id: "inst-test-003",
    fill: {
      fillPrice: 3002.0,
      fillQty: 0.5,
      slippageBps: 3.2,
      status: "PARTIAL_FILL",
    },
    ...overrides,
  });
}

export interface MockInstructionsDataOverrides {
  filteredInstructions?: StrategyInstruction[];
  allInstructions?: StrategyInstruction[];
  summary?: Partial<InstructionsSummary>;
  selectedInstruction?: StrategyInstruction | null;
  selectedInstructionId?: string | null;
  strategyFilter?: string;
  opTypeFilter?: string;
  filterValues?: Record<string, unknown>;
  refresh?: ReturnType<typeof vi.fn>;
  handleFilterChange?: ReturnType<typeof vi.fn>;
  resetFilters?: ReturnType<typeof vi.fn>;
  setSelectedInstructionId?: ReturnType<typeof vi.fn>;
}

const DEFAULT_FILTER_DEFS: FilterDefinition[] = [
  {
    key: "strategyType",
    label: "Strategy type",
    type: "select",
    options: [
      { value: "MOMENTUM", label: "MOMENTUM" },
      { value: "DEX_ARB", label: "DEX_ARB" },
    ],
  },
  {
    key: "operationType",
    label: "Operation type",
    type: "select",
    options: [
      { value: "TRADE", label: "TRADE" },
      { value: "SWAP", label: "SWAP" },
    ],
  },
];

/**
 * Returns fields all instructions widgets read from useInstructionsData().
 * Use with vi.mock('@/components/widgets/instructions/instructions-data-context', ...).
 *
 * Keeping surface minimal so tests survive unrelated context field additions.
 */
export function buildMockInstructionsData(overrides: MockInstructionsDataOverrides = {}) {
  const filled = buildMockInstruction();
  const pending = buildMockPendingInstruction();
  const partial = buildMockPartialInstruction();
  const defaultInstructions = [filled, pending, partial];

  const filteredInstructions = overrides.filteredInstructions ?? defaultInstructions;
  const summary: InstructionsSummary = {
    total: filteredInstructions.length,
    filled: filteredInstructions.filter((i) => i.fill?.status === "FILLED").length,
    partial: filteredInstructions.filter((i) => i.fill?.status === "PARTIAL_FILL").length,
    pending: filteredInstructions.filter((i) => i.fill === null).length,
    avgSlippage: 4.1,
    ...(overrides.summary ?? {}),
  };

  return {
    strategyFilter: overrides.strategyFilter ?? "ALL",
    setStrategyFilter: vi.fn(),
    opTypeFilter: overrides.opTypeFilter ?? "ALL",
    setOpTypeFilter: vi.fn(),
    allInstructions: overrides.allInstructions ?? defaultInstructions,
    filteredInstructions,
    summary,
    selectedInstructionId: overrides.selectedInstructionId ?? null,
    setSelectedInstructionId: overrides.setSelectedInstructionId ?? vi.fn(),
    selectedInstruction: overrides.selectedInstruction ?? null,
    strategyTypes: ["ALL", "MOMENTUM", "DEX_ARB"],
    operationTypes: ["ALL", "TRADE", "SWAP"],
    filterDefs: DEFAULT_FILTER_DEFS,
    filterValues: overrides.filterValues ?? {},
    handleFilterChange: overrides.handleFilterChange ?? vi.fn(),
    resetFilters: overrides.resetFilters ?? vi.fn(),
    refresh: overrides.refresh ?? vi.fn(),
    mode: "live",
  };
}
