/**
 * User Onboarding Integration Tests (ported from user-management-ui)
 *
 * Tests the user management API hooks against the mock handler.
 * Adapted from user-management-ui/tests/integration/onboarding.integration.test.tsx
 * and offboarding.integration.test.tsx for UTSU structure.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return Wrapper;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

describe("User Onboarding — quota check", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (url: RequestInfo | URL) => {
        const u = typeof url === "string" ? url : url.toString();
        if (u.includes("/quota-check")) {
          return new Response(
            JSON.stringify({
              quota: { ok: true, checks: [], message: "OK" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok=true when quota allows", async () => {
    const { useQuotaCheck } = await import(
      "@/hooks/api/use-user-management"
    );
    const { result } = renderHook(() => useQuotaCheck(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: "jane@test.com", role: "client" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.quota.ok).toBe(true);
  });

  it("returns ok=false when quota is exhausted", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () =>
      new Response(
        JSON.stringify({
          quota: {
            ok: false,
            checks: [],
            message: "Provisioning blocked: required service quota is exhausted.",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { useQuotaCheck } = await import(
      "@/hooks/api/use-user-management"
    );
    const { result } = renderHook(() => useQuotaCheck(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: "quota@test.com", role: "admin" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.quota.ok).toBe(false);
    expect(result.current.data?.quota.message).toContain("exhausted");
  });
});

describe("User Onboarding — onboard mutation", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(
        JSON.stringify({
          user: {
            id: "usr-001",
            firebase_uid: "fb-001",
            name: "Jane Doe",
            email: "jane@test.com",
            role: "client",
            product_slugs: ["trading-basic"],
            status: "active",
            provisioned_at: new Date().toISOString(),
            last_modified: new Date().toISOString(),
            services: {
              github: "provisioned",
              slack: "provisioned",
              microsoft365: "not_applicable",
              gcp: "provisioned",
              aws: "provisioned",
              portal: "provisioned",
            },
          },
          provisioning_steps: [
            { service: "firebase", label: "Firebase", status: "success" },
            { service: "github", label: "GitHub", status: "success" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates user and returns provisioning steps", async () => {
    const { useOnboardUser } = await import(
      "@/hooks/api/use-user-management"
    );
    const { result } = renderHook(() => useOnboardUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "Jane Doe",
      email: "jane@test.com",
      role: "client",
      product_slugs: ["trading-basic"],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user.id).toBe("usr-001");
    expect(result.current.data?.provisioning_steps).toHaveLength(2);
    expect(result.current.data?.provisioning_steps[0].status).toBe("success");
  });

  it("surfaces error when onboard fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () =>
      new Response(JSON.stringify({ detail: "Email already exists" }), {
        status: 409,
        statusText: "Conflict",
      }),
    );

    const { useOnboardUser } = await import(
      "@/hooks/api/use-user-management"
    );
    const { result } = renderHook(() => useOnboardUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "Dup User",
      email: "existing@test.com",
      role: "client",
      product_slugs: [],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("409");
  });
});

// ─── Offboarding ──────────────────────────────────────────────────────────────

describe("User Offboarding — offboard mutation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully offboards a user", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () =>
      new Response(
        JSON.stringify({
          user: {
            id: "usr-001",
            firebase_uid: "fb-001",
            name: "Jane Doe",
            email: "jane@test.com",
            role: "client",
            product_slugs: [],
            status: "offboarded",
            provisioned_at: new Date().toISOString(),
            last_modified: new Date().toISOString(),
            services: {
              github: "not_applicable",
              slack: "not_applicable",
              microsoft365: "not_applicable",
              gcp: "not_applicable",
              aws: "not_applicable",
              portal: "not_applicable",
            },
          },
          revocation_steps: [
            { service: "github", label: "GitHub", status: "success" },
            { service: "slack", label: "Slack", status: "success" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { useOffboardUser } = await import(
      "@/hooks/api/use-user-management"
    );
    const { result } = renderHook(() => useOffboardUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "usr-001",
      actions: { github: "deactivate", slack: "deactivate" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user.status).toBe("offboarded");
    expect(result.current.data?.revocation_steps).toHaveLength(2);
  });

  it("surfaces error when offboard fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () =>
      new Response(JSON.stringify({ detail: "User not found" }), {
        status: 404,
        statusText: "Not Found",
      }),
    );

    const { useOffboardUser } = await import(
      "@/hooks/api/use-user-management"
    );
    const { result } = renderHook(() => useOffboardUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: "nonexistent", actions: {} });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("404");
  });
});
