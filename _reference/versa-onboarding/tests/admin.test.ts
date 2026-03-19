import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetMockStore } from "@/lib/mock/store";

// Mock firebaseAdmin
vi.mock("@/lib/firebaseAdmin", async () => {
  const { mockDb, mockAuth } = await import("@/lib/mock/store");
  return {
    getAdminDb: () => mockDb,
    getAdminAuth: () => mockAuth,
  };
});

// Mock next/headers cookies
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "odum_session" ? { value: "mock-session" } : undefined,
    }),
}));

import { requireAdmin } from "@/lib/admin";

beforeEach(() => {
  resetMockStore();
});

describe("requireAdmin", () => {
  it("returns isAdmin=true for admin user", async () => {
    const result = await requireAdmin();
    expect(result.isAdmin).toBe(true);
    expect(result.user).toBeTruthy();
    expect(result.user?.uid).toBe("mock-admin-uid");
  });

  it("returns isAdmin=false for non-admin user", async () => {
    // Modify mock-admin-uid to be a viewer
    const { mockDb } = await import("@/lib/mock/store");
    await mockDb
      .collection("users")
      .doc("mock-admin-uid")
      .update({ role: "viewer" });

    const result = await requireAdmin();
    expect(result.isAdmin).toBe(false);
    expect(result.user).toBeTruthy();
  });
});
