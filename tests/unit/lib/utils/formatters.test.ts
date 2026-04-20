import { describe, expect, it } from "vitest";

import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatPnl,
} from "@/lib/utils/formatters";

describe("formatNumber", () => {
  it("formats with default 2 decimals", () => {
    expect(formatNumber(1234.5)).toBe("1,234.50");
  });

  it("formats with custom decimals", () => {
    expect(formatNumber(1234.5678, 3)).toBe("1,234.568");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0.00");
  });

  it("formats negative numbers", () => {
    expect(formatNumber(-42.5)).toBe("-42.50");
  });

  it("formats with 0 decimals", () => {
    expect(formatNumber(1234.9, 0)).toBe("1,235");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats with custom currency", () => {
    const out = formatCurrency(1234.5, "EUR");
    expect(out).toContain("1,234.50");
  });

  it("formats with custom decimals", () => {
    expect(formatCurrency(1234, "USD", 0)).toBe("$1,234");
  });

  it("caches formatters across calls (same result on re-invoke)", () => {
    const first = formatCurrency(100, "USD", 2);
    const second = formatCurrency(100, "USD", 2);
    expect(first).toBe(second);
  });

  it("handles negative currency", () => {
    expect(formatCurrency(-42.5)).toBe("-$42.50");
  });
});

describe("formatPercent", () => {
  it("appends % suffix", () => {
    expect(formatPercent(12.34)).toBe("12.34%");
  });

  it("honours custom decimals", () => {
    expect(formatPercent(12.3456, 3)).toBe("12.346%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });
});

describe("formatPnl", () => {
  it("adds + prefix for positive", () => {
    expect(formatPnl(1234.5)).toBe("+$1,234.50");
  });

  it("adds - prefix for negative", () => {
    expect(formatPnl(-340.2)).toBe("-$340.20");
  });

  it("handles zero with + sign", () => {
    expect(formatPnl(0)).toBe("+$0.00");
  });

  it("honours custom currency + decimals", () => {
    const out = formatPnl(10, "EUR", 1);
    expect(out).toContain("10.0");
  });
});

describe("formatCompact", () => {
  it("formats large numbers in compact form", () => {
    expect(formatCompact(1500)).toBe("1.5K");
  });

  it("formats millions", () => {
    expect(formatCompact(2_500_000)).toBe("2.5M");
  });

  it("formats small numbers without suffix", () => {
    expect(formatCompact(42)).toBe("42");
  });
});

describe("formatDate", () => {
  it("returns em-dash for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats short style by default", () => {
    const out = formatDate(new Date("2026-01-15T00:00:00Z"));
    expect(out).toMatch(/2026/);
  });

  it("accepts ISO string input", () => {
    const out = formatDate("2026-01-15T00:00:00Z", "short");
    expect(out).toMatch(/2026/);
  });

  it("formats long style", () => {
    const out = formatDate(new Date("2026-01-15T12:30:00Z"), "long");
    expect(out).toMatch(/2026/);
  });

  it("formats time style", () => {
    const out = formatDate(new Date("2026-01-15T12:30:45Z"), "time");
    // happy-dom may format with AM/PM; just check it returns non-empty and contains digits
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/\d/);
  });

  it("formats calendar style with en-GB conventions", () => {
    const out = formatDate(new Date("2026-01-15T00:00:00Z"), "calendar");
    expect(out).toMatch(/2026/);
  });

  it("formats relative 'ago' for past dates (seconds)", () => {
    const past = new Date(Date.now() - 5_000);
    expect(formatDate(past, "relative")).toMatch(/s ago/);
  });

  it("formats relative 'from now' for future dates (seconds)", () => {
    const future = new Date(Date.now() + 5_000);
    expect(formatDate(future, "relative")).toMatch(/s from now/);
  });

  it("formats relative minutes", () => {
    const t = new Date(Date.now() - 5 * 60_000);
    expect(formatDate(t, "relative")).toMatch(/m ago/);
  });

  it("formats relative hours", () => {
    const t = new Date(Date.now() - 5 * 3_600_000);
    expect(formatDate(t, "relative")).toMatch(/h ago/);
  });

  it("formats relative days", () => {
    const t = new Date(Date.now() - 5 * 86_400_000);
    expect(formatDate(t, "relative")).toMatch(/d ago/);
  });
});
