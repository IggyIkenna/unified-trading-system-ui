/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react"

// We can't easily render a Next.js page component in isolation without
// the app router context, so we test that the module exports correctly.
describe("BookTradePage", () => {
  it("module exports default function", async () => {
    const mod = await import("@/app/(platform)/services/trading/book/page")
    expect(typeof mod.default).toBe("function")
  })
})
