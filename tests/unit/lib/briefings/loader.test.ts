import { describe, expect, test } from "vitest";
import { getAllBriefings, getBriefing, getBriefingsHub, VALID_PILLAR_SLUGS } from "@/lib/briefings/loader";

/**
 * Unit tests for the briefings YAML loader. Asserts:
 *  - every slug in the closed vocabulary loads without throwing
 *  - getBriefing(unknown) returns undefined (so pages call notFound)
 *  - hub file parses and displayOrder references real pillars
 *  - getAllBriefings() returns pillars in the hub displayOrder
 *
 * Plan: unified-trading-pm/plans/active/refactor_g3_3_briefings_cms_migration_2026_04_20.plan.md
 */

describe("lib/briefings/loader", () => {
  test("getAllBriefings returns a pillar for every slug in vocabulary", () => {
    const pillars = getAllBriefings();
    const slugs = new Set(pillars.map((p) => p.slug));
    for (const required of VALID_PILLAR_SLUGS) {
      expect(slugs.has(required), `pillar '${required}' must exist`).toBe(true);
    }
    // Every pillar has non-empty required fields.
    for (const p of pillars) {
      expect(p.title.length, `${p.slug} must have a title`).toBeGreaterThan(0);
      expect(p.tldr.length, `${p.slug} must have a tldr`).toBeGreaterThan(0);
      expect(p.frame.length, `${p.slug} must have a frame`).toBeGreaterThan(0);
      expect(p.sections.length, `${p.slug} must have ≥1 section`).toBeGreaterThan(0);
      expect(p.keyMessages.length, `${p.slug} must have ≥1 keyMessage`).toBeGreaterThan(0);
      expect(p.nextCall.length, `${p.slug} must have nextCall copy`).toBeGreaterThan(0);
      expect(p.cta.label.length, `${p.slug} cta.label non-empty`).toBeGreaterThan(0);
      expect(p.cta.href.length, `${p.slug} cta.href non-empty`).toBeGreaterThan(0);
    }
  });

  test("getBriefing returns undefined for unknown slugs", () => {
    expect(getBriefing("nonexistent-slug")).toBeUndefined();
    expect(getBriefing("")).toBeUndefined();
  });

  test("getBriefing returns a typed pillar for every known slug", () => {
    for (const slug of VALID_PILLAR_SLUGS) {
      const pillar = getBriefing(slug);
      expect(pillar, `${slug} must resolve via getBriefing`).toBeDefined();
      expect(pillar?.slug).toBe(slug);
    }
  });

  test("getBriefingsHub parses and references real pillar slugs", () => {
    const hub = getBriefingsHub();
    expect(hub.title.length).toBeGreaterThan(0);
    expect(hub.tldr.length).toBeGreaterThan(0);
    expect(hub.cta.label.length).toBeGreaterThan(0);
    expect(hub.cta.href.length).toBeGreaterThan(0);
    expect(hub.displayOrder.length).toBeGreaterThan(0);
    const validSlugs = new Set<string>(VALID_PILLAR_SLUGS);
    for (const slug of hub.displayOrder) {
      expect(validSlugs.has(slug), `hub.displayOrder references unknown slug '${slug}'`).toBe(true);
    }
  });

  test("getAllBriefings returns pillars sorted by hub displayOrder", () => {
    const hub = getBriefingsHub();
    const pillars = getAllBriefings();
    // The first N pillars of `getAllBriefings` must match the first N slugs
    // of `hub.displayOrder` (N = min(len, displayOrder)).
    const n = Math.min(pillars.length, hub.displayOrder.length);
    for (let i = 0; i < n; i++) {
      expect(pillars[i]?.slug, `index ${i}: pillar order must follow hub.displayOrder`).toBe(hub.displayOrder[i]);
    }
  });
});
