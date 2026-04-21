/**
 * Unit tests for the orphan-audit scanner's pure helpers.
 *
 * These helpers live in scripts/orphan-audit-lib.ts (extracted from the
 * top-level scanner so they are testable without running the scanner's
 * side-effectful walk / readFile / writeFile logic).
 *
 * The scanner imports the same module — any behaviour change here would
 * change `npm run orphan-audit` output, so we lock down the regex-heavy
 * edge cases (route groups, dynamic segments, catch-alls, template
 * resolution with unknown identifiers).
 */
import { describe, expect, it } from "vitest";
import { join } from "node:path";

import {
  filePathToRoute,
  resolveTemplate,
  routeToMatcher,
} from "@/scripts/orphan-audit-lib";

const APP_DIR = "/repo/app";

const appPath = (rel: string): string => join(APP_DIR, rel);

describe("filePathToRoute", () => {
  it("maps app/page.tsx to /", () => {
    expect(filePathToRoute(appPath("page.tsx"), APP_DIR)).toBe("/");
  });

  it("strips a single route group wrapper", () => {
    expect(
      filePathToRoute(appPath("(platform)/dashboard/page.tsx"), APP_DIR),
    ).toBe("/dashboard");
  });

  it("preserves dynamic [id] segments and strips the route group", () => {
    expect(
      filePathToRoute(appPath("(ops)/admin/users/[id]/page.tsx"), APP_DIR),
    ).toBe("/admin/users/[id]");
  });

  it("handles a public route group with a dynamic [slug] leaf", () => {
    expect(
      filePathToRoute(appPath("(public)/briefings/[slug]/page.tsx"), APP_DIR),
    ).toBe("/briefings/[slug]");
  });

  it("maps api route handlers (route.ts)", () => {
    expect(filePathToRoute(appPath("api/onboarding/route.ts"), APP_DIR)).toBe(
      "/api/onboarding",
    );
  });

  it("preserves required catch-all [...slug]", () => {
    expect(filePathToRoute(appPath("docs/[...slug]/page.tsx"), APP_DIR)).toBe(
      "/docs/[...slug]",
    );
  });

  it("preserves optional catch-all [[...slug]]", () => {
    expect(
      filePathToRoute(appPath("docs/[[...slug]]/page.tsx"), APP_DIR),
    ).toBe("/docs/[[...slug]]");
  });

  it("also accepts page.ts / route.tsx / route.js variants (ROUTE_FILE_PATTERN parity)", () => {
    expect(filePathToRoute(appPath("status/page.ts"), APP_DIR)).toBe("/status");
    expect(filePathToRoute(appPath("api/foo/route.tsx"), APP_DIR)).toBe(
      "/api/foo",
    );
  });
});

describe("routeToMatcher", () => {
  describe("dynamic single-segment [id]", () => {
    const matcher = routeToMatcher("/admin/users/[id]");

    it("matches a concrete id", () => {
      expect(matcher.test("/admin/users/abc")).toBe(true);
      expect(matcher.test("/admin/users/123")).toBe(true);
    });

    it("tolerates a trailing slash", () => {
      expect(matcher.test("/admin/users/abc/")).toBe(true);
    });

    it("does NOT match without the id segment", () => {
      expect(matcher.test("/admin/users")).toBe(false);
    });

    it("does NOT match a deeper path", () => {
      expect(matcher.test("/admin/users/abc/visibility")).toBe(false);
    });
  });

  describe("required catch-all [...slug]", () => {
    const matcher = routeToMatcher("/docs/[...slug]");

    it("matches a single-segment tail", () => {
      expect(matcher.test("/docs/a")).toBe(true);
    });

    it("matches a multi-segment tail", () => {
      expect(matcher.test("/docs/a/b/c")).toBe(true);
    });

    it("does NOT match the bare base path", () => {
      expect(matcher.test("/docs")).toBe(false);
    });
  });

  describe("optional catch-all [[...slug]]", () => {
    const matcher = routeToMatcher("/docs/[[...slug]]");

    it("matches the bare base path", () => {
      expect(matcher.test("/docs")).toBe(true);
    });

    it("matches a single-segment tail", () => {
      expect(matcher.test("/docs/a")).toBe(true);
    });

    it("matches a multi-segment tail", () => {
      expect(matcher.test("/docs/a/b/c")).toBe(true);
    });
  });

  describe("literal route (no dynamic segments)", () => {
    const matcher = routeToMatcher("/services/trading/overview");

    it("matches itself exactly", () => {
      expect(matcher.test("/services/trading/overview")).toBe(true);
    });

    it("tolerates a trailing slash", () => {
      expect(matcher.test("/services/trading/overview/")).toBe(true);
    });

    it("does NOT match a different sibling path", () => {
      expect(matcher.test("/services/trading/overvieww")).toBe(false);
      expect(matcher.test("/services/trading")).toBe(false);
      expect(matcher.test("/services/trading/overview/sub")).toBe(false);
    });

    it("escapes regex metacharacters in literal segments (safety)", () => {
      const m = routeToMatcher("/a.b/c+d");
      expect(m.test("/a.b/c+d")).toBe(true);
      // ensure "." is treated literally (would-otherwise be any-char)
      expect(m.test("/axb/c+d")).toBe(false);
    });
  });
});

describe("resolveTemplate", () => {
  it("substitutes a known constant", () => {
    const constMap = new Map<string, string>([["BASE", "/services/promote"]]);
    expect(resolveTemplate("${BASE}/champion", constMap)).toBe(
      "/services/promote/champion",
    );
  });

  it("returns __PARAM__ when the identifier is missing", () => {
    expect(resolveTemplate("${BASE}/champion", new Map())).toBe(
      "__PARAM__/champion",
    );
  });

  it("substitutes __PARAM__ for each unknown ${expr} token in a path", () => {
    expect(
      resolveTemplate("/admin/users/${u.id}/visibility", new Map()),
    ).toBe("/admin/users/__PARAM__/visibility");
  });

  it("leaves multiple unknown identifiers as __PARAM__ each", () => {
    expect(
      resolveTemplate("${A}/${B}/${A}", new Map<string, string>()),
    ).toBe("__PARAM__/__PARAM__/__PARAM__");
  });

  it("mixes known + unknown identifiers in a single template", () => {
    const constMap = new Map<string, string>([["BASE", "/admin"]]);
    expect(resolveTemplate("${BASE}/users/${u.id}", constMap)).toBe(
      "/admin/users/__PARAM__",
    );
  });

  it("trims whitespace inside ${ ... } the same way the scanner does", () => {
    const constMap = new Map<string, string>([["BASE", "/x"]]);
    expect(resolveTemplate("${ BASE }/y", constMap)).toBe("/x/y");
  });

  it("returns literal templates unchanged when no ${} tokens are present", () => {
    expect(resolveTemplate("/docs/overview", new Map())).toBe("/docs/overview");
  });
});
