import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetMockStore, mockDb } from "@/lib/mock/store";
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

import { POST as assignUser } from "@/app/api/admin/users/[id]/assign/route";
import { POST as assignGroup } from "@/app/api/admin/groups/[id]/assign/route";
import { POST as assignClient } from "@/app/api/admin/clients/[id]/assign/route";

beforeEach(() => {
  resetMockStore();
});

describe("POST /api/admin/users/[id]/assign", () => {
  it("assigns groups and presentations to user", async () => {
    const req = makeJsonRequest({
      groupIds: ["board-group"],
      presentationIds: ["00-master"],
      role: "board",
    });
    const res = await assignUser(req, {
      params: Promise.resolve({ id: "mock-viewer-uid" }),
    });
    expect(res.status).toBe(200);

    // Verify update
    const snap = await mockDb.collection("users").doc("mock-viewer-uid").get();
    expect(snap.data()?.role).toBe("board");
    expect(snap.data()?.groupIds).toEqual(["board-group"]);
  });

  it("assigns client to user", async () => {
    const req = makeJsonRequest({
      groupIds: [],
      presentationIds: [],
      clientId: "elysium",
    });
    const res = await assignUser(req, {
      params: Promise.resolve({ id: "mock-viewer-uid" }),
    });
    expect(res.status).toBe(200);
  });

  it("removes client assignment with empty string", async () => {
    const req = makeJsonRequest({
      groupIds: [],
      presentationIds: [],
      clientId: "",
    });
    const res = await assignUser(req, {
      params: Promise.resolve({ id: "mock-client-uid" }),
    });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/groups/[id]/assign", () => {
  it("assigns presentations to group", async () => {
    const req = makeJsonRequest({
      presentationIds: ["00-master", "01-data-provision"],
    });
    const res = await assignGroup(req, {
      params: Promise.resolve({ id: "board-group" }),
    });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/clients/[id]/assign", () => {
  it("assigns presentations to client", async () => {
    const req = makeJsonRequest({
      presentationIds: ["00-master", "02-backtesting-as-a-service"],
    });
    const res = await assignClient(req, {
      params: Promise.resolve({ id: "elysium" }),
    });
    expect(res.status).toBe(200);
  });
});
