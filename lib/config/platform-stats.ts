/**
 * Platform stats — derived from lib/registry/ui-reference-data.json.
 * Single source of truth for all venue counts, asset class counts, etc.
 * used across the landing page, service hub, marketing components, and docs.
 *
 * NEVER hardcode these numbers anywhere else. Import from here.
 */

import registryData from "@/lib/registry/ui-reference-data.json"

const registries = registryData.registries as Record<string, unknown>
const venueCategoryMap = registries.venue_category_map as Record<string, string>
const clobVenues = registries.clob_venues as string[]
const dexVenues = registries.dex_venues as string[]
const sportsVenues = registries.sports_venues as string[]
const zeroAlphaVenues = registries.zero_alpha_venues as string[]
const instrumentTypeFolderMap = registries.instrument_type_folder_map as Record<string, string>
const endpointRegistry = registries.endpoint_registry as Record<string, unknown>

// Venue counts by category
const venuesByCategory: Record<string, number> = {}
for (const cat of Object.values(venueCategoryMap)) {
  venuesByCategory[cat] = (venuesByCategory[cat] || 0) + 1
}

/**
 * Platform-wide statistics derived from the registry.
 * Use these everywhere instead of hardcoded numbers.
 */
export const PLATFORM_STATS = {
  /** Total unique venues across all categories */
  totalVenues: Object.keys(venueCategoryMap).length,

  /** Venue count by market category */
  venuesByCategory,

  /** Number of market categories (cefi, tradfi, defi, sports) */
  categoryCount: Object.keys(venuesByCategory).length,

  /**
   * Asset class count — we present 5 to clients because we split
   * prediction markets as a distinct asset class from sports.
   * The registry has 4 categories; we market 5.
   */
  assetClassCount: 5,

  /** CLOB (central limit order book) venues */
  clobVenueCount: clobVenues.length,

  /** DEX (decentralised exchange) venues */
  dexVenueCount: dexVenues.length,

  /** Sports betting venues */
  sportsVenueCount: sportsVenues.length,

  /** Zero-alpha / prediction market venues */
  zeroAlphaVenueCount: zeroAlphaVenues.length,

  /** Distinct instrument types across all venues */
  instrumentTypeCount: Object.keys(instrumentTypeFolderMap).length,

  /** Number of backend services in the endpoint registry */
  serviceCount: Object.keys(endpointRegistry).length,

  /** UAC enum count (canonical external schemas) */
  uacEnumCount: Object.keys(registryData.uac_enums || {}).length,

  /** UIC enum count (internal contract schemas) */
  uicEnumCount: Object.keys(registryData.uic_enums || {}).length,
} as const

/**
 * Formatted strings for use in UI text. Pre-computed so components
 * don't need to format numbers themselves.
 */
export const PLATFORM_STATS_DISPLAY = {
  totalVenues: String(PLATFORM_STATS.totalVenues),
  assetClasses: String(PLATFORM_STATS.assetClassCount),
  instrumentTypes: `${PLATFORM_STATS.instrumentTypeCount}+`,
  services: String(PLATFORM_STATS.serviceCount),
  clobVenues: String(PLATFORM_STATS.clobVenueCount),
  dexVenues: String(PLATFORM_STATS.dexVenueCount),
  sportsVenues: String(PLATFORM_STATS.sportsVenueCount),
} as const
