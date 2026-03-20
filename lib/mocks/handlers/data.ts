/**
 * Data Service API Mock Handlers
 * 
 * Handles data catalogue and instrument endpoints:
 * - GET /api/data/catalogue
 * - GET /api/data/instruments
 * - GET /api/data/subscriptions
 * - GET /api/data/freshness/:instrumentKey
 * 
 * Scoping rules (from SHARDING_DIMENSIONS):
 * - Market data is shared (all personas see same instruments)
 * - Catalogue access is filtered by entitlements (data-basic vs data-pro)
 * - Internal users see all data
 */

import { http, HttpResponse, delay } from "msw"
import { 
  MOCK_CATALOGUE, 
  MOCK_INSTRUMENTS,
  MOCK_ORGS,
} from "@/lib/data-service-mock-data"
import { getCurrentPersona, scopeByEntitlements } from "../utils"
import { getAccessibleCategories, getInstrumentLimit } from "../fixtures/personas"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

export const dataHandlers = [
  // Get catalogue entries
  http.get(`${API_BASE}/api/data/catalogue`, async ({ request }) => {
    await delay(250)
    
    const persona = getCurrentPersona()
    const url = new URL(request.url)
    const category = url.searchParams.get("category")
    const venue = url.searchParams.get("venue")
    const cloud = url.searchParams.get("cloud")
    const search = url.searchParams.get("search")?.toLowerCase()
    
    let entries = [...MOCK_CATALOGUE]
    
    // Apply persona-based filtering
    if (persona) {
      const accessibleCategories = getAccessibleCategories(persona)
      entries = entries.filter((e) => 
        accessibleCategories.includes(e.instrument.category)
      )
      
      // Limit results for non-pro users
      const limit = getInstrumentLimit(persona)
      entries = entries.slice(0, limit)
    }
    
    // Apply query filters
    if (category) {
      entries = entries.filter((e) => e.instrument.category === category)
    }
    if (venue) {
      entries = entries.filter((e) => e.instrument.venue === venue)
    }
    if (cloud && cloud !== "both") {
      entries = entries.filter((e) => e.cloud === cloud || e.cloud === "both")
    }
    if (search) {
      entries = entries.filter((e) => 
        e.instrument.symbol.toLowerCase().includes(search) ||
        e.instrument.venue.toLowerCase().includes(search) ||
        e.instrument.instrumentKey.toLowerCase().includes(search)
      )
    }
    
    return HttpResponse.json({
      entries,
      total: entries.length,
      persona: persona?.id,
    })
  }),
  
  // Get instruments (registry)
  http.get(`${API_BASE}/api/data/instruments`, async ({ request }) => {
    await delay(200)
    
    const persona = getCurrentPersona()
    const url = new URL(request.url)
    const category = url.searchParams.get("category")
    const venue = url.searchParams.get("venue")
    
    let instruments = [...MOCK_INSTRUMENTS]
    
    // Apply persona-based filtering
    if (persona) {
      const accessibleCategories = getAccessibleCategories(persona)
      instruments = instruments.filter((i) => 
        accessibleCategories.includes(i.category)
      )
    }
    
    // Apply query filters
    if (category) {
      instruments = instruments.filter((i) => i.category === category)
    }
    if (venue) {
      instruments = instruments.filter((i) => i.venue === venue)
    }
    
    return HttpResponse.json({
      instruments,
      total: instruments.length,
    })
  }),
  
  // Get organizations (admin only)
  http.get(`${API_BASE}/api/data/organizations`, async () => {
    await delay(150)
    
    const persona = getCurrentPersona()
    
    // Only internal users can see all orgs
    if (persona?.role !== "internal") {
      // Clients only see their own org
      const userOrg = MOCK_ORGS.find((o) => o.id === persona?.org.id)
      return HttpResponse.json({
        organizations: userOrg ? [userOrg] : [],
      })
    }
    
    return HttpResponse.json({
      organizations: MOCK_ORGS,
    })
  }),
  
  // Get single instrument details
  http.get(`${API_BASE}/api/data/instruments/:instrumentKey`, async ({ params }) => {
    await delay(150)
    
    const { instrumentKey } = params as { instrumentKey: string }
    const decoded = decodeURIComponent(instrumentKey)
    
    const instrument = MOCK_INSTRUMENTS.find((i) => i.instrumentKey === decoded)
    
    if (!instrument) {
      return HttpResponse.json(
        { error: "Instrument not found" },
        { status: 404 }
      )
    }
    
    const catalogueEntry = MOCK_CATALOGUE.find(
      (c) => c.instrument.instrumentKey === decoded
    )
    
    return HttpResponse.json({
      instrument,
      catalogue: catalogueEntry,
    })
  }),
  
  // Get data freshness heatmap
  http.get(`${API_BASE}/api/data/freshness/:instrumentKey`, async ({ params }) => {
    await delay(300)
    
    const { instrumentKey } = params as { instrumentKey: string }
    const decoded = decodeURIComponent(instrumentKey)
    
    const catalogueEntry = MOCK_CATALOGUE.find(
      (c) => c.instrument.instrumentKey === decoded
    )
    
    if (!catalogueEntry) {
      return HttpResponse.json(
        { error: "Instrument not found in catalogue" },
        { status: 404 }
      )
    }
    
    // Generate mock freshness data
    const today = new Date()
    const startDate = new Date(catalogueEntry.instrument.availableFrom)
    const dayCount = Math.min(
      Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      365 // Limit to 1 year for performance
    )
    
    // Generate deterministic freshness map
    const freshnessMap: Record<string, string> = {}
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      const rand = Math.sin(i * 9999) * 10000
      const val = rand - Math.floor(rand)
      freshnessMap[key] = val < 0.95 ? "complete" : val < 0.98 ? "partial" : "missing"
    }
    
    return HttpResponse.json({
      instrumentKey: decoded,
      freshnessMap,
      completeness: catalogueEntry.freshnessPct,
    })
  }),
]
