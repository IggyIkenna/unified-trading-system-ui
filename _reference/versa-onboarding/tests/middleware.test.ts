import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function makeRequest(path: string, hasCookie = false): NextRequest {
  const url = new URL(path, "http://localhost:3000");
  const req = new NextRequest(url);
  if (hasCookie) {
    req.cookies.set("odum_session", "mock-session");
  }
  return req;
}

describe("middleware", () => {
  it("allows public paths without auth", () => {
    const res = middleware(makeRequest("/"));
    expect(res.status).toBe(200);
  });

  it("allows /login without auth", () => {
    const res = middleware(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("allows /register without auth", () => {
    const res = middleware(makeRequest("/register"));
    expect(res.status).toBe(200);
  });

  it("redirects /portal to login when no session", () => {
    const res = middleware(makeRequest("/portal"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("next=%2Fportal");
  });

  it("redirects /admin to login when no session", () => {
    const res = middleware(makeRequest("/admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects /presentations/test to login when no session", () => {
    const res = middleware(makeRequest("/presentations/test"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows /portal when session cookie exists", () => {
    const res = middleware(makeRequest("/portal", true));
    expect(res.status).toBe(200);
  });

  it("allows /admin when session cookie exists", () => {
    const res = middleware(makeRequest("/admin", true));
    expect(res.status).toBe(200);
  });

  it("allows /presentations/test when session cookie exists", () => {
    const res = middleware(makeRequest("/presentations/test", true));
    expect(res.status).toBe(200);
  });
});
