/**
 * Shared API client for client-reporting-ui.
 *
 * Uses createApiClient from @unified-admin/core. When VITE_MOCK_API=true,
 * the mock-api.ts fetch interceptor still works transparently because
 * createApiClient delegates to window.fetch.
 */

import { createApiClient, createClientConfig } from "@unified-admin/core";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export const apiClient = createApiClient(createClientConfig(API_BASE_URL));
