/**
 * Platform stats — derived from lib/registry/ui-reference-data.json.
 * Single source of truth for all venue counts, asset class counts, etc.
 * used across the landing page, service hub, marketing components, and docs.
 *
 * NEVER hardcode these numbers anywhere else. Import from here.
 */

import registryData from "@/lib/registry/ui-reference-data.json"

// Safely extract registries — the JSON has a nested `registries` object
const data = registryData as Record<string, unknown>
const registries = (data.registries ?? {}) as Record<string, unknown>

// Venue list — primary source is registries.venue_category_map (128 venues)
// Falls back to venue_capabilities.entries for older JSON formats
const venueCategoryMap = (registries.venue_category_map ?? {}) as Record<string, string>
const venueCapabilities = (data.venue_capabilities ?? {}) as {
  entries?: Record<string, { venue: string; error_code_count?: number }>
}
const venueEntries = venueCapabilities.entries ?? {}
const allVenues = Object.keys(venueCategoryMap).length > 0
  ? Object.keys(venueCategoryMap)
  : Object.keys(venueEntries)

// Instrument types — from registries.instrument_types_by_venue (115 venue→types map)
const instrumentTypesByVenue = (registries.instrument_types_by_venue ?? {}) as Record<string, unknown>
const instrumentSample = (data.representative_instrument_sample ?? {}) as {
  entries?: Record<string, unknown>
}
const instrumentEntries = Object.keys(instrumentTypesByVenue).length > 0
  ? instrumentTypesByVenue
  : (instrumentSample.entries ?? {})

// Derive venue categories from venue name patterns
function categorizeVenue(venue: string): string {
  const defiVenues = ["aave", "compound", "uniswap", "curve", "lido", "morpho", "euler", "ethena", "etherfi", "alchemy", "chainlink"]
  const sportsVenues = ["betfair", "pinnacle", "polymarket", "api_football", "the_odds"]
  const tradfiVenues = ["interactive_brokers", "cboe", "cme", "ice", "nasdaq", "nyse"]

  const lower = venue.toLowerCase()
  if (defiVenues.some(d => lower.includes(d))) return "defi"
  if (sportsVenues.some(s => lower.includes(s))) return "sports"
  if (tradfiVenues.some(t => lower.includes(t))) return "tradfi"
  return "cefi"
}

const venuesByCategory: Record<string, number> = {}
for (const venue of allVenues) {
  const cat = Object.keys(venueCategoryMap).length > 0
    ? (venueCategoryMap[venue] || categorizeVenue(venue))
    : categorizeVenue(venue)
  venuesByCategory[cat] = (venuesByCategory[cat] || 0) + 1
}

/**
 * Platform-wide statistics derived from the registry.
 * Use these everywhere instead of hardcoded numbers.
 */
export const PLATFORM_STATS = {
  totalVenues: allVenues.length,
  venuesByCategory,
  categoryCount: Object.keys(venuesByCategory).length,
  assetClassCount: 5,
  clobVenueCount: venuesByCategory["cefi"] ?? 0,
  dexVenueCount: venuesByCategory["defi"] ?? 0,
  sportsVenueCount: venuesByCategory["sports"] ?? 0,
  zeroAlphaVenueCount: (venuesByCategory["sports"] ?? 0),
  instrumentTypeCount: Object.keys(instrumentEntries).length,
  serviceCount: 15,
  dataVolumeTB: "100+",
  historyYears: "6+",
  uacEnumCount: Object.keys((data.uac_enums ?? {}) as Record<string, unknown>).length,
  uicEnumCount: Object.keys((data.uic_enums ?? {}) as Record<string, unknown>).length,
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
