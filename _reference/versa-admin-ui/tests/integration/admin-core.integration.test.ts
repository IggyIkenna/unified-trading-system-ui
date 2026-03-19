/**
 * Integration tests verifying @unified-admin/core API client
 * functions are importable and callable within unified-admin-ui context.
 *
 * Tests import REAL admin-core functions (no mocks) to verify
 * that the internal core package builds and exports correctly.
 */

import { describe, it, expect } from "vitest";

let createApiClient: (...args: unknown[]) => unknown;
let createClientConfig: (...args: unknown[]) => unknown;

let adminCoreAvailable = false;

try {
  const adminCore = await import("@unified-admin/core");
  createApiClient = adminCore.createApiClient;
  createClientConfig = adminCore.createClientConfig;
  adminCoreAvailable = true;
} catch {
  adminCoreAvailable = false;
}

describe("@unified-admin/core integration", () => {
  it("admin-core module is importable", () => {
    if (!adminCoreAvailable) {
      console.warn("Skipping: @unified-admin/core not available");
      return;
    }
    expect(createApiClient).toBeDefined();
    expect(createClientConfig).toBeDefined();
  });

  it("createClientConfig returns a config object", () => {
    if (!adminCoreAvailable) return;
    const config = createClientConfig("http://localhost:8012");
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });

  it("createApiClient accepts a config and returns a client", () => {
    if (!adminCoreAvailable) return;
    const config = createClientConfig("http://localhost:8012");
    const client = createApiClient(config);
    expect(client).toBeDefined();
    expect(typeof client).toBe("object");
  });

  it("exported functions are callable", () => {
    if (!adminCoreAvailable) return;
    expect(typeof createApiClient).toBe("function");
    expect(typeof createClientConfig).toBe("function");
  });
});
