/**
 * Glossary SSOT tests — every entry resolves, new Phase-10 terms exist,
 * and aliases resolve to the canonical entry.
 */
import { describe, expect, it } from "vitest";

import { GLOSSARY, getTerm } from "@/lib/glossary";

describe("GLOSSARY", () => {
  it("exposes at least the canonical terms used by marketing copy", () => {
    const keys = Object.keys(GLOSSARY);
    expect(keys).toContain("cefi");
    expect(keys).toContain("defi");
    expect(keys).toContain("tradfi");
    expect(keys).toContain("dart");
    expect(keys).toContain("sma");
    expect(keys).toContain("pooled");
    expect(keys).toContain("fca");
    expect(keys).toContain("im");
  });

  it("keeps every entry's id aligned with its key (or, for aliases, to a known canonical id)", () => {
    const allIds = new Set(Object.values(GLOSSARY).map((entry) => entry.id));
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      // Either the id matches the key (canonical) or it points at another
      // canonical id that exists in the map (alias).
      if (entry.id !== key) {
        expect(allIds).toContain(entry.id);
      }
    }
  });

  it("keeps definitions terse — short enough for hover-tooltip UX", () => {
    for (const entry of Object.values(GLOSSARY)) {
      // Threshold widened from 320 → 480 chars 2026-04-29 to accommodate the
      // longer post-rename glossary definitions (DART terminal vs research
      // split, regulated-operating-models rename) without dropping the
      // overall terse-tooltip discipline.
      expect(entry.definition.length).toBeLessThan(480);
      expect(entry.definition.length).toBeGreaterThan(20);
    }
  });
});

describe("Phase-10 canonical-term entries", () => {
  it.each([
    ["odum-signals", "Odum Signals"],
    ["dart-full", "DART Full"],
    ["dart-signals-in", "DART Signals-In"],
    ["regulatory-umbrella", "Regulatory Umbrella"],
  ])("includes %s with the expected canonical label", (id, label) => {
    const entry = getTerm(id);
    expect(entry).toBeDefined();
    expect(entry?.label).toBe(label);
    expect(entry?.definition.length).toBeGreaterThan(20);
  });

  it("aliases 'investment-management' back to the canonical IM definition", () => {
    const alias = getTerm("investment-management");
    const canonical = getTerm("im");
    expect(alias).toBeDefined();
    expect(canonical).toBeDefined();
    expect(alias?.id).toBe(canonical?.id);
  });
});

describe("getTerm", () => {
  it("resolves case-insensitively", () => {
    const lower = getTerm("cefi");
    const upper = getTerm("CEFI");
    const mixed = getTerm("CeFi");
    expect(lower).toBeDefined();
    expect(upper).toEqual(lower);
    expect(mixed).toEqual(lower);
  });

  it("returns undefined for unknown ids", () => {
    expect(getTerm("not-a-term")).toBeUndefined();
    expect(getTerm("")).toBeUndefined();
  });
});
