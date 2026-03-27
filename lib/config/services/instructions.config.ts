/** Strategy types for instruction pipeline filters (no sentinel — use FilterBar "All"). */
export const INSTRUCTION_STRATEGY_TYPES = [
  "MOMENTUM",
  "MARKET_MAKING",
  "DEX_ARB",
  "FLASH_ARB",
  "SPORTS_ML",
  "YIELD",
  "PREDICTION",
  "BASIS",
  "LP",
] as const;

export type InstructionStrategyType = (typeof INSTRUCTION_STRATEGY_TYPES)[number];
