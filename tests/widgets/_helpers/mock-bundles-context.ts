import { vi } from "vitest";
import type { BundleStep, BundleTemplate } from "@/lib/types/bundles";
import type { BundleOperationType } from "@/lib/config/services/bundle.config";

/**
 * Minimal BundleStep for harness tests.
 */
export function buildMockBundleStep(overrides: Partial<BundleStep> = {}): BundleStep {
  return {
    id: "step-test-001",
    operationType: "TRADE" as BundleOperationType,
    instrument: "BTC/USDT",
    venue: "Binance",
    side: "BUY",
    quantity: "1.0",
    price: "50000",
    dependsOn: null,
    ...overrides,
  };
}

export function buildMockSellStep(overrides: Partial<BundleStep> = {}): BundleStep {
  return buildMockBundleStep({
    id: "step-test-002",
    side: "SELL",
    operationType: "TRADE" as BundleOperationType,
    quantity: "1.0",
    price: "50100",
    ...overrides,
  });
}

export function buildMockBundleTemplate(overrides: Partial<BundleTemplate> = {}): BundleTemplate {
  return {
    name: "Test Template",
    description: "A test bundle template with BUY + SELL legs",
    category: "CeFi",
    steps: [
      {
        operationType: "TRADE" as BundleOperationType,
        instrument: "BTC/USDT",
        venue: "Binance",
        side: "BUY",
        quantity: "1.0",
        price: "50000",
        dependsOn: null,
      },
      {
        operationType: "TRADE" as BundleOperationType,
        instrument: "BTC/USDT",
        venue: "OKX",
        side: "SELL",
        quantity: "1.0",
        price: "50100",
        dependsOn: null,
      },
    ],
    estimatedCost: 50000,
    estimatedProfit: 100,
    ...overrides,
  };
}

export interface MockBundlesDataOverrides {
  steps?: BundleStep[];
  showTemplates?: boolean;
  templates?: BundleTemplate[];
  totalCost?: number;
  totalRevenue?: number;
  estimatedGas?: number;
  netPnl?: number;
  readOnly?: boolean;
  addStep?: ReturnType<typeof vi.fn>;
  removeStep?: ReturnType<typeof vi.fn>;
  moveStep?: ReturnType<typeof vi.fn>;
  duplicateStep?: ReturnType<typeof vi.fn>;
  updateStep?: ReturnType<typeof vi.fn>;
  loadTemplate?: ReturnType<typeof vi.fn>;
  clearSteps?: ReturnType<typeof vi.fn>;
  setShowTemplates?: ReturnType<typeof vi.fn>;
}

const MOCK_OPERATION_TYPES: readonly BundleOperationType[] = ["TRADE", "SWAP", "LEND", "BORROW", "STAKE"] as const;

const MOCK_VENUES: readonly string[] = ["Binance", "OKX", "Uniswap", "Aave"] as const;
const MOCK_INSTRUMENTS: readonly string[] = ["BTC/USDT", "ETH/USDT", "ETH"] as const;

/**
 * Returns fields bundle-builder-widget reads from useBundlesData().
 * Use with vi.mock('@/components/widgets/bundles/bundles-data-context', ...).
 *
 * Minimal surface so tests survive unrelated context field additions.
 */
export function buildMockBundlesData(overrides: MockBundlesDataOverrides = {}) {
  const steps = overrides.steps ?? [];
  const templates = overrides.templates ?? [buildMockBundleTemplate()];

  // Compute sensible defaults from steps when not explicitly provided
  const totalCost =
    overrides.totalCost ??
    steps.reduce((sum, s) => {
      const qty = parseFloat(s.quantity) || 0;
      const price = parseFloat(s.price) || 0;
      return s.side === "BUY" ? sum + qty * price : sum;
    }, 0);

  const totalRevenue =
    overrides.totalRevenue ??
    steps.reduce((sum, s) => {
      const qty = parseFloat(s.quantity) || 0;
      const price = parseFloat(s.price) || 0;
      return s.side === "SELL" ? sum + qty * price : sum;
    }, 0);

  const estimatedGas = overrides.estimatedGas ?? steps.length * 14.5;
  const netPnl = overrides.netPnl ?? totalRevenue - totalCost - estimatedGas;

  return {
    steps,
    addStep: overrides.addStep ?? vi.fn(),
    removeStep: overrides.removeStep ?? vi.fn(),
    moveStep: overrides.moveStep ?? vi.fn(),
    duplicateStep: overrides.duplicateStep ?? vi.fn(),
    updateStep: overrides.updateStep ?? vi.fn(),
    templates,
    showTemplates: overrides.showTemplates ?? true,
    setShowTemplates: overrides.setShowTemplates ?? vi.fn(),
    loadTemplate: overrides.loadTemplate ?? vi.fn(),
    clearSteps: overrides.clearSteps ?? vi.fn(),
    totalCost,
    totalRevenue,
    estimatedGas,
    netPnl,
    operationTypes: MOCK_OPERATION_TYPES,
    venues: MOCK_VENUES,
    instruments: MOCK_INSTRUMENTS,
    readOnly: overrides.readOnly ?? false,
    mode: "live",
  };
}
