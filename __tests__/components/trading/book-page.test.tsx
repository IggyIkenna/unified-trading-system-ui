import { describe, it, expect } from "vitest";

// We can't easily render a Next.js page component in isolation without
// the app router context, so we test that the module exports correctly.
describe("BookTradePage", () => {
  it("module exports default function", async () => {
    const mod = await import("@/app/(platform)/services/trading/book/page");
    expect(typeof mod.default).toBe("function");
  }, 15000); // Allow longer timeout for dynamic import with heavy deps
});
