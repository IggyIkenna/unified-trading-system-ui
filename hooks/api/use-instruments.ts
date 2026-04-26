import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";

interface InstrumentEntry {
  instrumentKey: string;
  venue: string;
  category: string;
  folder: string;
  symbol: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  dataTypes: string[];
  availableFrom: string;
  availableTo?: string;
}

interface InstrumentsResponse {
  data: InstrumentEntry[];
  /** @deprecated use `data` — kept for backward compat */
  instruments?: InstrumentEntry[];
  total?: number;
  persona?: string;
  venues?: string[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    has_next: boolean;
  };
}

interface CatalogueEntry {
  instrument: InstrumentEntry;
  cloud: string;
  totalDates: number;
  datesWithData: number;
  freshnessPct: number;
  lastUpdated: string;
  sizeGb: number;
  gcpCompleteness: number;
  awsCompleteness: number;
}

interface CatalogueResponse {
  catalogue: CatalogueEntry[];
  total: number;
}

export function useInstruments(opts?: { venue?: string; assetGroup?: string; asOf?: string }) {
  const { user, token } = useAuth();
  const venue = opts?.venue;
  const assetGroup = opts?.assetGroup;
  const asOf = opts?.asOf;

  const params = new URLSearchParams();
  if (venue) params.set("venue", venue);
  if (assetGroup) params.set("asset_group", assetGroup);
  if (asOf) params.set("as_of", asOf);
  params.set("page_size", "200");
  const url = `/api/instruments/list${params.toString() ? `?${params.toString()}` : ""}`;

  return useQuery<InstrumentsResponse>({
    queryKey: ["instruments", venue, assetGroup, asOf, user?.id],
    queryFn: () => apiFetch(url, token) as Promise<InstrumentsResponse>,
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useCatalogue() {
  const { user, token } = useAuth();

  return useQuery<CatalogueResponse>({
    queryKey: ["catalogue", user?.id],
    queryFn: () => apiFetch("/api/instruments/catalogue", token) as Promise<CatalogueResponse>,
    enabled: !!user,
  });
}
