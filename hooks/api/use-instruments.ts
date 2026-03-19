import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

interface InstrumentEntry {
  instrumentKey: string
  venue: string
  category: string
  folder: string
  symbol: string
  baseCurrency?: string
  quoteCurrency?: string
  dataTypes: string[]
  availableFrom: string
  availableTo?: string
}

interface InstrumentsResponse {
  instruments: InstrumentEntry[]
  total: number
  persona: string
}

interface CatalogueEntry {
  instrument: InstrumentEntry
  cloud: string
  totalDates: number
  datesWithData: number
  freshnessPct: number
  lastUpdated: string
  sizeGb: number
  gcpCompleteness: number
  awsCompleteness: number
}

interface CatalogueResponse {
  catalogue: CatalogueEntry[]
  total: number
}

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, {
    headers: { "x-demo-persona": personaId },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useInstruments() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery<InstrumentsResponse>({
    queryKey: ["instruments", personaId],
    queryFn: () => fetchWithPersona("/api/data/instruments", personaId),
    enabled: !!user,
  })
}

export function useCatalogue() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery<CatalogueResponse>({
    queryKey: ["catalogue", personaId],
    queryFn: () => fetchWithPersona("/api/data/catalogue", personaId),
    enabled: !!user,
  })
}
