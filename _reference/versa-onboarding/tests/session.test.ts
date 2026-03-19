import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetMockStore } from "@/lib/mock/store";

// Mock firebaseAdmin
vi.mock("@/lib/firebaseAdmin", async () => {
  const { mockAuth } = await import("@/lib/mock/store");
  return {
    getAdminDb: vi.fn(),
    getAdminAuth: () => mockAuth,
  };
});

let mockCookieValue: string | undefined = "mock-session";

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "odum_session" && mockCookieValue
          ? { value: mockCookieValue }
          : undefined,
    }),
}));

import { getVerifiedUser, SESSION_COOKIE_NAME } from "@/lib/session";

beforeEach(() => {
  resetMockStore();
  mockCookieValue = "mock-session";
});

describe("SESSION_COOKIE_NAME", () => {
  it("is odum_session", () => {
    expect(SESSION_COOKIE_NAME).toBe("odum_session");
  });
});

describe("getVerifiedUser (mock mode)", () => {
  beforeEach(() => {
    process.env.MOCK_MODE = "true";
  });

  it("returns user when session cookie exists", async () => {
    const user = await getVerifiedUser();
    expect(user).toBeTruthy();
    expect(user?.uid).toBe("mock-admin-uid");
  });

  it("returns null when no session cookie", async () => {
    mockCookieValue = undefined;
    const user = await getVerifiedUser();
    expect(user).toBeNull();
  });
});
