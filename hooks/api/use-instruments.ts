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

/**
 * Live tradeable instruments for one asset_group, fetched once per session
 * and cached in localStorage. UI builds an in-memory search index from the
 * payload — no per-keystroke round trips.
 *
 * - `assetGroup`: "cefi" | "tradfi" | "defi" — one call per group, lazy.
 *   A user who never opens TradFi never pays for CEFI's ~6K rows.
 * - localStorage key: `live-universe:v{N}:{assetGroup}:{fetch_date_utc}` —
 *   the schema version `v{N}` is bumped on the *server*'s response shape,
 *   not on its data. Any change to what the backend returns (added/removed
 *   fields, dedupe semantics, filter shifts) bumps `LIVE_UNIVERSE_SCHEMA_VERSION`
 *   so old browser caches are auto-evicted by the next-day rollover OR the
 *   next page load — whichever comes first. No "ask users to clear local
 *   storage" support tickets.
 * - Refresh interval: configurable via NEXT_PUBLIC_INSTRUMENTS_REFRESH_INTERVAL_MS
 *   (default 1h). Stale-while-revalidate via React Query so the UI never
 *   blocks on a refresh.
 *
 * Backend filters out instruments with `available_to_datetime` in the past
 * — the watchlist sees today's tradeable set only. Batch mode (with a
 * specific as_of date that may include expired options/futures) goes
 * through `useInstruments` instead, server-side filtered per request.
 *
 * Schema version history:
 *   v1 — initial release (2026-04-30), no dedupe.
 *   v2 — adds server-side dedupe by instrument_key for the URDI Tardis
 *        multi-fiat-rail collapse. See
 *        unified-trading-pm/findings/instruments_tardis_duplicate_keys_2026_04_30.md
 */
const LIVE_UNIVERSE_SCHEMA_VERSION = 2;

const LIVE_UNIVERSE_REFRESH_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_INSTRUMENTS_REFRESH_INTERVAL_MS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60 * 60 * 1000; // 1h
})();

export interface LiveUniverseRecord {
  instrument_key: string;
  venue: string;
  raw_symbol: string;
  symbol?: string;
  instrument_type: string;
  asset_class?: string;
  base_asset?: string;
  quote_asset?: string;
  underlying?: string | null;
  expiry?: string | null;
  strike?: number | null;
  option_type?: string | null;
  available_from_datetime?: string | null;
  available_to_datetime?: string | null;
  [k: string]: unknown;
}

interface LiveUniverseResponse {
  data: LiveUniverseRecord[];
  asset_group: string;
  as_of?: string;
  total?: number;
}

interface LiveUniverseCacheEntry {
  fetchedAt: number;
  asOfDate: string;
  payload: LiveUniverseResponse;
}

function liveUniverseStorageKey(assetGroup: string, fetchDateUtc: string): string {
  return `live-universe:v${LIVE_UNIVERSE_SCHEMA_VERSION}:${assetGroup}:${fetchDateUtc}`;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function readLiveUniverseFromStorage(assetGroup: string): LiveUniverseResponse | undefined {
  if (typeof window === "undefined") return undefined;
  const today = todayUtcDate();
  try {
    const raw = window.localStorage.getItem(liveUniverseStorageKey(assetGroup, today));
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as LiveUniverseCacheEntry;
    if (entry.asOfDate !== today) return undefined;
    if (Date.now() - entry.fetchedAt > LIVE_UNIVERSE_REFRESH_MS) return undefined;
    return entry.payload;
  } catch {
    return undefined;
  }
}

function writeLiveUniverseToStorage(assetGroup: string, payload: LiveUniverseResponse): void {
  if (typeof window === "undefined") return;
  const today = todayUtcDate();
  const todayKey = liveUniverseStorageKey(assetGroup, today);
  const entry: LiveUniverseCacheEntry = { fetchedAt: Date.now(), asOfDate: today, payload };
  try {
    // Two-pass eviction so localStorage stays bounded:
    //   1. Drop every `live-universe:*` entry whose schema version differs
    //      from the current LIVE_UNIVERSE_SCHEMA_VERSION (any assetGroup,
    //      any date). This is what auto-evicts pre-vN data after a server-
    //      shape change without asking users to clear localStorage.
    //   2. Drop same-version entries for this assetGroup from earlier dates.
    const versionedPrefix = `live-universe:v${LIVE_UNIVERSE_SCHEMA_VERSION}:`;
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("live-universe:")) continue;
      // Wrong-version (e.g. legacy v1 entries, or `live-universe:cefi:...`
      // from before versioning was added) → remove unconditionally.
      if (!key.startsWith(versionedPrefix)) {
        window.localStorage.removeItem(key);
        continue;
      }
      // Same-version, same assetGroup, different date → stale.
      if (key.startsWith(`${versionedPrefix}${assetGroup}:`) && key !== todayKey) {
        window.localStorage.removeItem(key);
      }
    }
    window.localStorage.setItem(todayKey, JSON.stringify(entry));
  } catch {
    // Quota exceeded or storage disabled — proceed without persisting.
  }
}

export function useLiveUniverse(assetGroup: "cefi" | "tradfi" | "defi", enabled = true) {
  const { user, token } = useAuth();
  return useQuery<LiveUniverseResponse>({
    queryKey: ["live-universe", assetGroup, user?.id],
    queryFn: async () => {
      const cached = readLiveUniverseFromStorage(assetGroup);
      if (cached) return cached;
      const fresh = (await apiFetch(
        `/api/instruments/live-universe?asset_group=${assetGroup}`,
        token,
      )) as LiveUniverseResponse;
      writeLiveUniverseToStorage(assetGroup, fresh);
      return fresh;
    },
    enabled: !!user && enabled,
    staleTime: LIVE_UNIVERSE_REFRESH_MS,
    gcTime: LIVE_UNIVERSE_REFRESH_MS * 2,
    refetchInterval: LIVE_UNIVERSE_REFRESH_MS,
    refetchOnWindowFocus: false,
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
