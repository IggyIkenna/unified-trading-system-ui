import { describe, expect, it, vi } from "vitest";

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
  it("passes through on staging domain (marketing is served by App Router)", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/", "odum-research.co.uk");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });

  it("passes through /investment-management on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest(
      "https://odum-research.co.uk/investment-management",
      "odum-research.co.uk",
    );
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });

  it("passes through /regulatory on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/regulatory", "odum-research.co.uk");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });

  it("passes through /firm on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/firm", "odum-research.co.uk");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });

  it("passes through /contact on staging", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odum-research.co.uk/contact", "odum-research.co.uk");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });

  it("passes through on non-staging domain", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odumresearch.com/", "odumresearch.com");
    const result = proxy(request as never);
    expect(result).toMatchObject({ type: "next" });
  });

  it("passes through on odumresearch.co.uk (no hyphen)", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://odumresearch.co.uk/", "odumresearch.co.uk");
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
