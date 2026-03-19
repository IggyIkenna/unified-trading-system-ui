import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupApiMocks, makeJsonRequest } from "./helpers";

vi.mock("@/lib/firebaseAdmin", async () => {
  const { mockAuth } = await import("@/lib/mock/store");
  return {
    getAdminDb: vi.fn(),
    getAdminAuth: () => mockAuth,
  };
});

import { POST as sessionPost } from "@/app/api/auth/session/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";

beforeEach(() => {
  setupApiMocks();
});

describe("POST /api/auth/session", () => {
  it("creates session cookie from idToken", async () => {
    const req = makeJsonRequest({ idToken: "mock-id-token" });
    const res = await sessionPost(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("returns 400 when idToken missing", async () => {
    const req = makeJsonRequest({});
    const res = await sessionPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing idToken");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears session cookie", async () => {
    const res = await logoutPost();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
