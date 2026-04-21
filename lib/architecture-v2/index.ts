/**
 * Strategy Architecture v2 — UI facade.
 *
 * This is the single import surface for all v2 types in the UI. It mirrors
 * the `unified_api_contracts.internal` facade on the Python side (SSOT:
 * `unified-api-contracts/unified_api_contracts/internal/architecture_v2/__init__.py`).
 *
 * Usage:
 *   import { StrategyFamily, FAMILY_METADATA, UNITY_CHILD_BOOKS } from "@/lib/architecture-v2";
 *
 * Do NOT reach into sub-modules directly from app code unless you own the
 * module; keep the facade as the stable contract.
 *
 * Phase 9 retirement plan: this file, together with the auto-generated
 * `lib/registry/generated.ts`, supersedes the hand-written
 * `lib/strategy-registry.ts`. Once v2 identity is wired end-to-end (after
 * phases 3-8 land), the old hand-written list is deleted.
 */

export * from "./enums";
export * from "./families";
export * from "./archetypes";
export * from "./unity";
export * from "./allocator";
export * from "./venue-capability";
export * from "./coverage";
export * from "./availability";
export * from "./availability-store";
export * from "./block-list";
export * from "./family-filter";
