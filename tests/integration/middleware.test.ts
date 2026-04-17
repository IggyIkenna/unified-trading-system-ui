import { describe, it, expect, vi } from "vitest";

vi.mock("next/server", () => {
  class MockNextResponse {
    static next() {
      return { type: "next" };
    }
    static rewrite(url: URL) {
      return { type: "rewrite", url: url.toString() };
    }
  }

  return { NextResponse: MockNextResponse };
});

describe("Staging proxy", () => {
  it("rewrites root to homepage.html on staging domain", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/", "odum-research.co.uk");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "rewrite" });
    expect((result as { url: string }).url).toContain("/homepage.html");
  });

  it("rewrites /investment-management to strategies.html on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/investment-management", "odum-research.co.uk");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "rewrite" });
    expect((result as { url: string }).url).toContain("/strategies.html");
  });

  it("rewrites /regulatory to regulatory.html on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/regulatory", "odum-research.co.uk");
    const result = proxy(request as never);
    expect((result as { url: string }).url).toContain("/regulatory.html");
  });

  it("rewrites /firm to firm.html on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/firm", "odum-research.co.uk");
    const result = proxy(request as never);
    expect((result as { url: string }).url).toContain("/firm.html");
  });

  it("rewrites /contact to contact.html on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/contact", "odum-research.co.uk");
    const result = proxy(request as never);
    expect((result as { url: string }).url).toContain("/contact.html");
  });

  it("passes through on non-staging domain", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.com/", "odum-research.com");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });

  it("passes through on localhost", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("http://localhost:3000/", "localhost:3000");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });
});

function makeRequest(url: string, host: string) {
  return {
    headers: { get: (name: string) => (name === "host" ? host : null) },
    nextUrl: { pathname: new URL(url).pathname },
    url,
  };
}
