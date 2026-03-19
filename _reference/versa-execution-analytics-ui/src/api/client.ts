import {
  createApiClient,
  createClientConfig,
  getSessionToken,
} from "@unified-admin/core";
import type { ApiClient, ApiClientConfig } from "@unified-admin/core";

const API_BASE_URL = import.meta.env.VITE_EXECUTION_RESULTS_URL || "/api/v1";

const authInterceptor = (
  _config: ApiClientConfig,
  headers: Record<string, string>,
): Record<string, string> => {
  const token = getSessionToken();
  if (token) {
    return { ...headers, Authorization: `Bearer ${token}` };
  }
  return headers;
};

const coreClient: ApiClient = createApiClient(
  createClientConfig(API_BASE_URL, {
    requestInterceptors: [authInterceptor],
  }),
);

/** Options that extend RequestInit with an optional `params` map (query string). */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/** Build a query string from a params map, skipping undefined values. */
function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const entries = Object.entries(params).filter(
    (kv): kv is [string, string | number | boolean] => kv[1] !== undefined,
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

/**
 * Axios-compatible wrapper around the core ApiClient.
 *
 * - Wraps return values in `{ data: T }` to match existing call sites that
 *   read `response.data`.
 * - Supports a `params` option for automatic query-string building.
 */
export const apiClient = {
  async get<T>(path: string, options?: RequestOptions): Promise<{ data: T }> {
    const { params, ...init } = options ?? {};
    const qs = params ? buildQueryString(params) : "";
    const data = await coreClient.get<T>(`${path}${qs}`, init);
    return { data };
  },

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<{ data: T }> {
    const { params, ...init } = options ?? {};
    const qs = params ? buildQueryString(params) : "";
    const data = await coreClient.post<T>(`${path}${qs}`, body, init);
    return { data };
  },

  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<{ data: T }> {
    const { params, ...init } = options ?? {};
    const qs = params ? buildQueryString(params) : "";
    const data = await coreClient.put<T>(`${path}${qs}`, body, init);
    return { data };
  },

  async delete<T>(
    path: string,
    options?: RequestOptions,
  ): Promise<{ data: T }> {
    const { params, ...init } = options ?? {};
    const qs = params ? buildQueryString(params) : "";
    const data = await coreClient.delete<T>(`${path}${qs}`, init);
    return { data };
  },
};

export default apiClient;
