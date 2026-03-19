import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupApiMocks } from "./helpers";

vi.mock("@/lib/firebaseAdmin", async () => {
  const { mockDb, mockAuth } = await import("@/lib/mock/store");
  return {
    getAdminDb: () => mockDb,
    getAdminAuth: () => mockAuth,
  };
});

let hasCookie = true;
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "odum_session" && hasCookie
          ? { value: "mock-session" }
          : undefined,
    }),
}));

import { GET } from "@/app/api/presentations/route";

beforeEach(() => {
  setupApiMocks();
  hasCookie = true;
});

describe("GET /api/presentations", () => {
  it("returns presentations for authenticated admin", async () => {
    const res = await GET();
    const body = (await res.json()) as {
      presentations: Array<{ id: string; title: string }>;
    };
    expect(res.status).toBe(200);
    // Admin has access to board-group + all-presentations (services folder)
    expect(body.presentations.length).toBeGreaterThanOrEqual(7);
    const ids = body.presentations.map((p) => p.id);
    expect(ids).toContain("00-master");
    expect(ids).toContain("01-data-provision");
  });

  it("returns 401 when not authenticated", async () => {
    hasCookie = false;
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
