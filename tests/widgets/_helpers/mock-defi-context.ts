import { vi } from "vitest";

/**
 * Builds a minimal LendingProtocol suitable for widget harness tests.
 * Real shape is richer; widget only reads name/venue_id/assets/supplyApy/borrowApy.
 */
export function buildMockLendingProtocol(overrides: Partial<MockLendingProtocol> = {}): MockLendingProtocol {
  return {
    name: "Aave V3",
    venue_id: "AAVEV3-ETHEREUM",
    assets: ["ETH", "USDC", "WBTC"],
    // Fixture convention: already-multiplied percentages (2.5 not 0.025).
    // See lib/mocks/fixtures/defi-lending.ts.
    supplyApy: { ETH: 3.5, USDC: 4.8, WBTC: 1.2 },
    borrowApy: { ETH: 6.2, USDC: 8.1, WBTC: 8.9 },
    ...overrides,
  };
}

export interface MockLendingProtocol {
  name: string;
  venue_id: string;
  assets: string[];
  supplyApy: Record<string, number>;
  borrowApy: Record<string, number>;
}

export interface MockDeFiDataOverrides {
  lendingProtocols?: MockLendingProtocol[];
  selectedLendingProtocol?: string;
  healthFactor?: number;
  executeDeFiOrder?: ReturnType<typeof vi.fn>;
}

/**
 * Returns a factory for the fields defi-lending-widget reads from
 * useDeFiData(). Use with vi.mock('./defi-data-context', ...).
 *
 * Keeping the surface minimal means tests don't break when unrelated
 * DeFiDataContextValue fields are added.
 */
export function buildMockDeFiData(overrides: MockDeFiDataOverrides = {}) {
  const lendingProtocols = overrides.lendingProtocols ?? [buildMockLendingProtocol()];
  return {
    lendingProtocols,
    selectedLendingProtocol: overrides.selectedLendingProtocol ?? lendingProtocols[0]?.name ?? "Aave V3",
    setSelectedLendingProtocol: vi.fn(),
    healthFactor: overrides.healthFactor ?? 1.8,
    executeDeFiOrder: overrides.executeDeFiOrder ?? vi.fn(),
    getAssetParams: vi.fn((_venue: string, _asset: string) => ({
      price_usd: 2500,
      liquidation_threshold: 0.825,
      ltv: 0.75,
    })),
    calculateHealthFactorDelta: vi.fn((_venue: string, _asset: string, op: string, _amountUsd: number, _hf: number) => {
      if (op === "BORROW") return -0.2;
      if (op === "LEND") return 0.15;
      return 0;
    }),
  };
}
