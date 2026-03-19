import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetMockStore } from "@/lib/mock/store";

process.env.MOCK_MODE = "true";
process.env.PRESENTATIONS_BUCKET = "mock.appspot.com";

vi.mock("@/lib/firebaseAdmin", async () => {
  const { mockDb, mockAuth } = await import("@/lib/mock/store");
  return {
    getAdminDb: () => mockDb,
    getAdminAuth: () => mockAuth,
  };
});

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "odum_session" ? { value: "mock-session" } : undefined,
    }),
}));

import { POST as discoverPresentations } from "@/app/api/admin/discover-presentations/route";
import { POST as accessPreview } from "@/app/api/admin/access-preview/route";

beforeEach(() => {
  resetMockStore();
});

describe("POST /api/admin/discover-presentations", () => {
  it("discovers local presentation files in mock mode", async () => {
    const res = await discoverPresentations();
    const body = (await res.json()) as {
      presentations: Array<{ id: string; title: string }>;
      folders: Array<{ id: string; name: string }>;
      stats: { totalPresentations: number };
    };
    expect(res.status).toBe(200);
    // Should find the 10 HTML files in public/presentations/
    expect(body.stats.totalPresentations).toBeGreaterThanOrEqual(10);
    expect(body.presentations.length).toBeGreaterThanOrEqual(10);
  });
});

describe("POST /api/admin/access-preview", () => {
  it("previews access for user with direct presentations", async () => {
    const req = new Request("http://localhost:3000/api/admin/access-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "mock-viewer-uid",
        presentationIds: ["00-master", "01-data-provision"],
      }),
    });
    const res = await accessPreview(req);
    const body = (await res.json()) as {
      presentations: Array<{ id: string; title: string }>;
    };
    expect(res.status).toBe(200);
    expect(body.presentations.length).toBe(2);
  });

  it("previews access for user with client assignment", async () => {
    const req = new Request("http://localhost:3000/api/admin/access-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "mock-client-uid",
        clientId: "elysium",
      }),
    });
    const res = await accessPreview(req);
    const body = (await res.json()) as {
      presentations: Array<{ id: string; title: string }>;
    };
    expect(res.status).toBe(200);
    // Elysium has 3 presentations
    expect(body.presentations.length).toBe(3);
  });

  it("previews access for user with group assignment", async () => {
    const req = new Request("http://localhost:3000/api/admin/access-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "mock-board-uid",
        groupIds: ["board-group"],
      }),
    });
    const res = await accessPreview(req);
    const body = (await res.json()) as {
      presentations: Array<{ id: string; title: string }>;
    };
    expect(res.status).toBe(200);
    // Board group has 3 presentations
    expect(body.presentations.length).toBe(3);
  });

  it("returns empty for no access", async () => {
    const req = new Request("http://localhost:3000/api/admin/access-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "new-uid" }),
    });
    const res = await accessPreview(req);
    const body = (await res.json()) as {
      presentations: Array<{ id: string; title: string }>;
    };
    expect(res.status).toBe(200);
    expect(body.presentations).toEqual([]);
  });
});
