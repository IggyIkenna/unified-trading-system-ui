/**
 * Reusable chip primitives for every Strategy-Architecture-v2 surface:
 * Strategy Catalogue, Research, Trading, Investment Management, client
 * reporting. Codex reference:
 * `unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/strategy-availability-and-locking.md`
 */

export { LockStateBadge } from "./lock-state-badge";
export { MaturityBadge } from "./maturity-badge";
export { StatusBadge } from "./status-badge";
export { AssetGroupChip } from "./category-chip";
export { InstrumentTypeChip } from "./instrument-type-chip";
export { SignalVariantBadge } from "./signal-variant-badge";
export { RollModeBadge } from "./roll-mode-badge";
export { FamilyArchetypePicker } from "./family-archetype-picker";
export type { FamilyArchetypePickerProps, FamilyArchetypeSelection } from "./family-archetype-picker";
export { TradingFamilyFilterBanner } from "./trading-family-filter-banner";
export type { TradingFamilyFilterBannerProps } from "./trading-family-filter-banner";
