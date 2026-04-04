/** Standard paginated response shape matching unified-trading-api backend */
export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_next: boolean;
  };
  mode: string;
  as_of: string | null;
}

/** Extract data array from a paginated response, with backward compat for legacy shapes */
export function extractData<T>(response: unknown): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];
  const obj = response as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as T[];
  // Legacy fallbacks for specific endpoints
  if (Array.isArray(obj.positions)) return obj.positions as T[];
  if (Array.isArray(obj.organizations)) return obj.organizations as T[];
  if (Array.isArray(obj.clients)) return obj.clients as T[];
  if (Array.isArray(obj.strategies)) return obj.strategies as T[];
  if (Array.isArray(obj.instruments)) return obj.instruments as T[];
  if (Array.isArray(obj.transfers)) return obj.transfers as T[];
  if (Array.isArray(obj.tickers)) return obj.tickers as T[];
  if (Array.isArray(obj.trades)) return obj.trades as T[];
  if (Array.isArray(obj.alerts)) return obj.alerts as T[];
  return [];
}
