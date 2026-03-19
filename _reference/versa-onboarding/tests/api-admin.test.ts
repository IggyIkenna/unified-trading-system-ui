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

import { GET as getUsers } from "@/app/api/admin/users/route";
import {
  GET as getPresentations,
  POST as postPresentation,
} from "@/app/api/admin/presentations/route";
import {
  GET as getGroups,
  POST as postGroup,
} from "@/app/api/admin/groups/route";
import {
  GET as getClients,
  POST as postClient,
} from "@/app/api/admin/clients/route";
import { POST as contactPost } from "@/app/api/contact/route";

beforeEach(() => {
  resetMockStore();
});

describe("GET /api/admin/users", () => {
  it("returns all users for admin", async () => {
    const res = await getUsers();
    const body = (await res.json()) as { users: Array<{ id: string }> };
    expect(res.status).toBe(200);
    expect(body.users.length).toBe(5);
    const ids = body.users.map((u) => u.id);
    expect(ids).toContain("mock-admin-uid");
    expect(ids).toContain("mock-board-uid");
  });
});

describe("GET /api/admin/presentations", () => {
  it("returns all presentations for admin", async () => {
    const res = await getPresentations();
    const body = (await res.json()) as {
      presentations: Array<{ id: string }>;
    };
    expect(res.status).toBe(200);
    expect(body.presentations.length).toBe(10);
  });
});

describe("POST /api/admin/presentations", () => {
  it("creates a new presentation", async () => {
    const req = makeJsonRequest({
      id: "new-pres",
      title: "New Presentation",
      gcsPath: "presentations/new.html",
    });
    const res = await postPresentation(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("returns 400 when fields missing", async () => {
    const req = makeJsonRequest({ id: "new-pres" });
    const res = await postPresentation(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/groups", () => {
  it("returns all groups for admin", async () => {
    const res = await getGroups();
    const body = (await res.json()) as { groups: Array<{ id: string }> };
    expect(res.status).toBe(200);
    expect(body.groups.length).toBe(3);
  });
});

describe("POST /api/admin/groups", () => {
  it("creates a new group", async () => {
    const req = makeJsonRequest({
      id: "new-group",
      name: "New Group",
      presentationIds: ["00-master"],
    });
    const res = await postGroup(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 when id missing", async () => {
    const req = makeJsonRequest({ name: "No ID Group" });
    const res = await postGroup(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when name missing", async () => {
    const req = makeJsonRequest({ id: "no-name-group" });
    const res = await postGroup(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/clients", () => {
  it("returns all clients for admin", async () => {
    const res = await getClients();
    const body = (await res.json()) as { clients: Array<{ id: string }> };
    expect(res.status).toBe(200);
    expect(body.clients.length).toBe(1);
    expect(body.clients[0].id).toBe("elysium");
  });
});

describe("POST /api/admin/clients", () => {
  it("creates a new client", async () => {
    const req = makeJsonRequest({
      id: "new-client",
      name: "New Client",
      presentationIds: ["00-master"],
    });
    const res = await postClient(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 when fields missing", async () => {
    const req = makeJsonRequest({ id: "new-client" });
    const res = await postClient(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/contact (via admin test file)", () => {
  it("accepts valid contact submission", async () => {
    const req = makeJsonRequest({
      name: "Test",
      email: "test@example.com",
      message: "Testing",
    });
    const res = await contactPost(req);
    expect(res.status).toBe(200);
  });
});
