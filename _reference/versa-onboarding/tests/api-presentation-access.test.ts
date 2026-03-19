import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetMockStore } from "@/lib/mock/store";
import { makeJsonRequest } from "./helpers";

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

import { POST } from "@/app/api/admin/presentation-access/route";

beforeEach(() => {
  resetMockStore();
});

describe("POST /api/admin/presentation-access", () => {
  it("returns 400 when presentationId missing", async () => {
    const req = makeJsonRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns users with direct access to a presentation", async () => {
    // mock-viewer-uid has presentationIds: ["00-master"]
    const req = makeJsonRequest({ presentationId: "00-master" });
    const res = await POST(req);
    const body = (await res.json()) as {
      presentationId: string;
      users: Array<{ id: string; accessVia: string[] }>;
      groups: Array<{ id: string }>;
      clients: Array<{ id: string }>;
    };
    expect(res.status).toBe(200);
    expect(body.presentationId).toBe("00-master");
    // viewer has direct access
    const viewer = body.users.find((u) => u.id === "mock-viewer-uid");
    expect(viewer).toBeTruthy();
    expect(viewer?.accessVia).toContain("Direct assignment");
  });

  it("returns groups with access to a presentation", async () => {
    // board-group has presentationIds: ["00-master", "05-investment-management", "06-regulatory-umbrella"]
    const req = makeJsonRequest({ presentationId: "05-investment-management" });
    const res = await POST(req);
    const body = (await res.json()) as {
      groups: Array<{ id: string }>;
    };
    expect(res.status).toBe(200);
    const boardGroup = body.groups.find((g) => g.id === "board-group");
    expect(boardGroup).toBeTruthy();
  });

  it("returns clients with access to a presentation", async () => {
    // elysium has presentationIds: ["00-master", "01-data-provision", "04-execution-as-a-service"]
    const req = makeJsonRequest({ presentationId: "01-data-provision" });
    const res = await POST(req);
    const body = (await res.json()) as {
      clients: Array<{ id: string }>;
    };
    expect(res.status).toBe(200);
    const elysium = body.clients.find((c) => c.id === "elysium");
    expect(elysium).toBeTruthy();
  });

  it("includes users via client membership", async () => {
    // mock-client-uid has clientId: "elysium"
    // elysium has presentationIds: ["00-master", "01-data-provision", "04-execution-as-a-service"]
    const req = makeJsonRequest({ presentationId: "01-data-provision" });
    const res = await POST(req);
    const body = (await res.json()) as {
      users: Array<{ id: string; accessVia: string[] }>;
    };
    expect(res.status).toBe(200);
    const clientUser = body.users.find((u) => u.id === "mock-client-uid");
    expect(clientUser).toBeTruthy();
    expect(clientUser?.accessVia).toContain("Client membership");
  });
});
