import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupApiMocks, makeJsonRequest } from "./helpers";

vi.mock("@/lib/firebaseAdmin", async () => {
  const { mockDb } = await import("@/lib/mock/store");
  return {
    getAdminDb: () => mockDb,
    getAdminAuth: vi.fn(),
  };
});

import { POST } from "@/app/api/contact/route";

beforeEach(() => {
  setupApiMocks();
});

describe("POST /api/contact", () => {
  it("submits valid contact form", async () => {
    const req = makeJsonRequest({
      name: "John",
      email: "john@example.com",
      message: "Hello",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("returns 400 when name missing", async () => {
    const req = makeJsonRequest({
      email: "john@example.com",
      message: "Hello",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when email missing", async () => {
    const req = makeJsonRequest({ name: "John", message: "Hello" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when message missing", async () => {
    const req = makeJsonRequest({
      name: "John",
      email: "john@example.com",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
