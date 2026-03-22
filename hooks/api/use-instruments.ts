import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

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

export function useInstruments() {
  const { user, token } = useAuth()

  return useQuery<InstrumentsResponse>({
    queryKey: ["instruments", user?.id],
    queryFn: () => apiFetch("/api/instruments/list", token) as Promise<InstrumentsResponse>,
    enabled: !!user,
  })
}

export function useCatalogue() {
  const { user, token } = useAuth()

  return useQuery<CatalogueResponse>({
    queryKey: ["catalogue", user?.id],
    queryFn: () => apiFetch("/api/instruments/catalogue", token) as Promise<CatalogueResponse>,
    enabled: !!user,
  })
}
