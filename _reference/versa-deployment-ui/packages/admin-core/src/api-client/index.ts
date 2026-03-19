/**
 * @unified-admin/core — shared API client utilities
 *
 * Exports: base URL config, default headers, error handling types, interceptor types.
 * All 11 UI repos use these types/helpers instead of maintaining local API client logic.
 */

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  requestInterceptors?: RequestInterceptor[];
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export type RequestInterceptor = (
  config: ApiClientConfig,
  headers: Record<string, string>,
) => Record<string, string>;

export type ResponseInterceptor<T> = (
  response: ApiResponse<T>,
) => ApiResponse<T>;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = error.status;
    this.code = error.code;
  }
}

/** Merges default headers with per-request headers; per-request wins on conflict. */
export function mergeHeaders(
  defaults: Record<string, string>,
  overrides: Record<string, string>,
): Record<string, string> {
  return { ...defaults, ...overrides };
}

/** Returns a JSON content-type header map. */
export function jsonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Creates default client config with sane timeout. */
export function createClientConfig(
  baseUrl: string,
  overrides?: Partial<ApiClientConfig>,
): ApiClientConfig {
  return {
    baseUrl,
    timeoutMs: 30_000,
    defaultHeaders: jsonHeaders(),
    ...overrides,
  };
}

/** Return type of createApiClient — typed HTTP methods. */
export interface ApiClient {
  get<T>(path: string, options?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>;
  delete<T>(path: string, options?: RequestInit): Promise<T>;
}

/**
 * Creates a concrete API client that uses native fetch.
 *
 * - Applies `defaultHeaders` and `requestInterceptors` from config
 * - Aborts requests after `timeoutMs` (default 30 s)
 * - Maps non-2xx responses to `ApiClientError`
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const timeoutMs = config.timeoutMs ?? 30_000;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    let headers: Record<string, string> = mergeHeaders(
      config.defaultHeaders ?? {},
      (options?.headers as Record<string, string> | undefined) ?? {},
    );

    // Run request interceptors (e.g. auth header injection).
    if (config.requestInterceptors) {
      for (const interceptor of config.requestInterceptors) {
        headers = interceptor(config, headers);
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const url = `${config.baseUrl}${path}`;

    try {
      const fetchInit: RequestInit = {
        method,
        headers,
        signal: controller.signal,
        ...options,
      };
      if (body !== undefined) {
        fetchInit.body = JSON.stringify(body);
      }
      const response = await fetch(url, fetchInit);

      if (!response.ok) {
        let errorBody: ApiError;
        try {
          const parsed: unknown = await response.json();
          const obj = parsed as Record<string, unknown>;
          errorBody = {
            status: response.status,
            code:
              typeof obj["code"] === "string"
                ? obj["code"]
                : `HTTP_${response.status}`,
            message:
              typeof obj["message"] === "string"
                ? obj["message"]
                : response.statusText,
            details: obj["details"],
          };
        } catch {
          errorBody = {
            status: response.status,
            code: `HTTP_${response.status}`,
            message: response.statusText,
          };
        }
        throw new ApiClientError(errorBody);
      }

      // 204 No Content — return undefined as T.
      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get<T>(path: string, options?: RequestInit): Promise<T> {
      return request<T>("GET", path, undefined, options);
    },
    post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
      return request<T>("POST", path, body, options);
    },
    put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
      return request<T>("PUT", path, body, options);
    },
    delete<T>(path: string, options?: RequestInit): Promise<T> {
      return request<T>("DELETE", path, undefined, options);
    },
  };
}
