/**
 * @unified-admin/core — public API
 *
 * Re-exports everything from the four sub-domains:
 *   - components: layouts, nav, error boundaries, tables
 *   - hooks: polling, WebSocket, auth state, pagination
 *   - auth: token management, session state, OAuth PKCE
 *   - api-client: base config, error types, interceptors, headers
 */

export * from "./components/index.js";
export * from "./hooks/index.js";
export * from "./auth/index.js";
export * from "./api-client/index.js";
export * from "./stress/index.js";
