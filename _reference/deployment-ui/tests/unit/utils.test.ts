import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatDuration,
} from "../../src/lib/utils";

describe("formatDate", () => {
  it("formats ISO string to readable date", () => {
    const result = formatDate("2026-03-02T12:00:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("2");
    expect(result).toContain("2026");
  });

  it("formats Date object", () => {
    const result = formatDate(new Date("2025-12-25T00:00:00Z"));
    expect(result).toContain("Dec");
    expect(result).toContain("25");
    expect(result).toContain("2025");
  });
});

describe("formatDateTime", () => {
  it("includes time components", () => {
    const result = formatDateTime("2026-03-02T14:30:45Z");
    expect(result).toContain("Mar");
    expect(result).toContain("2026");
    // Should have time portion
    expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it("formats Date object with time", () => {
    const d = new Date("2025-06-15T09:05:30Z");
    const result = formatDateTime(d);
    expect(result).toContain("Jun");
    expect(result).toContain("2025");
  });
});

describe("formatDuration", () => {
  it("formats seconds under a minute", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(1)).toBe("1s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(60)).toBe("1m 0s");
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(3599)).toBe("59m 59s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3661)).toBe("1h 1m");
    expect(formatDuration(7200)).toBe("2h 0m");
    expect(formatDuration(86400)).toBe("24h 0m");
  });
});
